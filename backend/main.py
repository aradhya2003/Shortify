import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import secrets
import redis
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
redis_client = redis.from_url(os.getenv("REDIS_URL"))

@app.post("/shorten")
async def shorten_url(url_item: dict = Body(...)):
    """Create short URL with optional custom alias"""
    print(f"Received request body: {url_item}")  # Debug log

    long_url = url_item.get("long_url")
    custom_alias = url_item.get("custom_alias")

    if not long_url:
        raise HTTPException(status_code=400, detail="Missing 'long_url' in request")

    if not long_url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    if custom_alias:
        # Check if alias already exists
        existing = supabase.table("urls").select("id").eq("short_code", custom_alias).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Custom alias already in use")
        short_code = custom_alias
    else:
        # Generate random short code
        short_code = secrets.token_urlsafe(6)[:8]

    # Store in Supabase
    supabase.table("urls").insert({
        "short_code": short_code,
        "long_url": long_url
    }).execute()

    # Cache in Redis (1 day expiry)
    redis_client.setex(short_code, 86400, long_url)

    return {
        "short_url": f"http://localhost:3000/{short_code}",
        "code": short_code
    }

@app.get("/{short_code}")
async def redirect_url(short_code: str):
    """Redirect to original URL"""
    if cached := redis_client.get(short_code):
        return {"long_url": cached.decode()}

    res = supabase.table("urls") \
              .select("long_url") \
              .eq("short_code", short_code) \
              .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="URL not found")

    return {"long_url": res.data[0]["long_url"]}

@app.get("/")
async def health_check():
    return {"status": "OK"}
