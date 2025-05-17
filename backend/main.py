import os
from fastapi import FastAPI, HTTPException, Body, Request,  BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import secrets
import redis
from dotenv import load_dotenv
import geoip2.database
import traceback
from user_agents.parsers import parse
from datetime import datetime, timezone 
from datetime import datetime
from pathlib import Path
from fastapi.responses import RedirectResponse
geoip_path = Path("data") / "GeoLite2-City_20250502" / "GeoLite2-City.mmdb"
geoip_reader = geoip2.database.Reader(str(geoip_path))
from pathlib import Path
load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
PROD_DOMAIN = os.getenv("PROD_DOMAIN", "http://localhost:8000")
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
    "short_url": f"{os.getenv('PROD_DOMAIN')}/{short_code}",
    "code": short_code
    }
@app.get("/{short_code}")
async def redirect_url(
    short_code: str,
    request: Request,  # Add this parameter
    background_tasks: BackgroundTasks
):
    """Redirect to original URL"""
    if cached := redis_client.get(short_code):
        return {"long_url": cached.decode()}

    res = supabase.table("urls") \
              .select("long_url") \
              .eq("short_code", short_code) \
              .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="URL not found")
    background_tasks.add_task(track_analytics, short_code, request)

    return RedirectResponse(url=long_url)   
    
    
@app.get("/api/analytics/{short_code}")
async def get_analytics(short_code: str):
    """Fetch analytics summary via Supabase stored procedure"""
    try:
        # First verify the short code exists
        url_res = supabase.table("urls") \
            .select("id") \
            .eq("short_code", short_code) \
            .execute()
        
        if not url_res.data:
            raise HTTPException(status_code=404, detail="URL not found")

        # Call the PostgreSQL function
        result = supabase.rpc(
            "get_url_analytics",
            {"short_code_param": short_code}
        ).execute()

        # Debug logging
        print(f"Raw RPC response: {result}")

        # The data is returned directly in the response, not nested
        if not result.data:
            return {
                "total_clicks": 0,
                "unique_visitors": 0,
                "top_country": None,
                "referrers": [],
                "locations": []
            }

        # Return the data directly (it's not nested under 'get_url_analytics' in Python client)
        return result.data

    except Exception as e:
        print(f"Detailed error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch analytics: {str(e)}"
        )
async def track_analytics(short_code: str, request: Request):
    """Background analytics tracking"""
    try:
        client_host = request.client.host
        user_agent_str = request.headers.get("user-agent", "")
        referer = request.headers.get("referer", "")
        
        # Parse user agent
        user_agent = parse(user_agent_str)
        device_type = (
            "mobile" if user_agent.is_mobile else
            "desktop" if user_agent.is_pc else
            "tablet" if user_agent.is_tablet else 
            "other"
        )

        # Get location data
        country = city = None
        try:
            if client_host and client_host not in ["127.0.0.1", "::1", "localhost"]:
                geo_data = geoip_reader.city(client_host)
                country = geo_data.country.name if geo_data.country.name else None
                city = geo_data.city.name if geo_data.city.name else None
        except Exception as geo_error:
            print(f"GeoIP lookup failed: {geo_error}")

        # Insert analytics
        supabase.table("clicks").insert({
            "short_code": short_code,
            "ip_address": client_host,
            "country": country,
            "city": city,
            "device_type": device_type,
            "referrer": referer,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }).execute()

    except Exception as e:
        print("Analytics tracking failed (non-critical):", repr(e))
        traceback.print_exc()
@app.get("/")
async def health_check():
    return {"status": "OK"}
