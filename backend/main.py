import os
from fastapi import FastAPI, HTTPException, Body, Request,  BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import secrets
import redis
from dotenv import load_dotenv
import traceback
from fastapi.responses import RedirectResponse
from user_agents.parsers import parse
from datetime import datetime, timezone 
from datetime import datetime
from pathlib import Path
import ipinfo

load_dotenv()
IPINFO_ACCESS_TOKEN = os.getenv("IPINFO_TOKEN", "")
ipinfo_handler = ipinfo.getHandler(IPINFO_ACCESS_TOKEN)



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
    request: Request,
    background_tasks: BackgroundTasks
):
    """Redirect to original URL"""
    # Get the long URL from cache or database
    long_url = None
    if cached := redis_client.get(short_code):
        long_url = cached.decode()
    else:
        res = supabase.table("urls") \
                  .select("long_url") \
                  .eq("short_code", short_code) \
                  .execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="URL not found")
        long_url = res.data[0]["long_url"]
    
    # Track analytics in background
    background_tasks.add_task(track_analytics, short_code, request)
    
    # Perform the redirect
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=long_url)    
    
@app.get("/api/analytics/{short_code}")
async def get_analytics(short_code: str):
    """Fetch analytics summary via Supabase stored procedure"""
    short_code = short_code.strip()
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
    try:
        client_ip = request.headers.get('X-Forwarded-For')
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host

        user_agent_str = request.headers.get("user-agent", "")
        referer = request.headers.get("referer", "")

        ua = parse(user_agent_str)

        try:
            details = ipinfo_handler.getDetails(client_ip)
        except Exception as e:
            print("IPinfo lookup failed:", e)
            details = None

        # Extract geo/network data safely
        city = getattr(details, 'city', None)
        country = getattr(details, 'country_name', None)
        postal = getattr(details, 'postal', None)
        timezone = getattr(details, 'timezone', None)
        coordinates = getattr(details, 'loc', None)  # "lat,long"
        isp = getattr(details, 'org', None)
        asn = getattr(details, 'asn', {}).get('asn', None)
        organization = getattr(details, 'asn', {}).get('name', None)

        latitude, longitude = None, None
        if coordinates and "," in coordinates:
            lat_str, long_str = coordinates.split(",", 1)
            latitude = float(lat_str.strip())
            longitude = float(long_str.strip())

        # Parse device/browser/OS info
        browser_name = ua.browser.family
        browser_version = ua.browser.version_string
        os_name = ua.os.family
        os_version = ua.os.version_string
        device_type = (
            "Mobile" if ua.is_mobile else
            "Tablet" if ua.is_tablet else
            "Desktop" if ua.is_pc else
            "Other"
        )

        # Final insert
        supabase.table("clicks").insert({
            "short_code": short_code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ip_address": client_ip,
            "referrer": referer,
            "browser_name": browser_name,
            "browser_version": browser_version,
            "os_name": os_name,
            "os_version": os_version,
            "device_type": device_type,
            "country": country,
            "city": city,
            "latitude": latitude,
            "longitude": longitude,
            "postal_code": postal,
            "timezone": timezone,
            "isp": isp,
            "asn": asn,
            "organization": organization
        }).execute()

    except Exception as e:
        print("Analytics tracking failed:", repr(e))
        traceback.print_exc()


@app.get("/")
async def health_check():
    return {"status": "OK"}
