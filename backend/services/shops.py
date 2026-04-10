import math
import os

import httpx
from fastapi import HTTPException

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
SEARCH_RADIUS_M = 25000.0  # ~15 miles


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def find_nearest_shops(lat: float, lon: float) -> list[dict]:
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        print("[shops] ERROR: GOOGLE_PLACES_API_KEY environment variable not set")
        raise HTTPException(status_code=503, detail="GOOGLE_PLACES_API_KEY is not configured on the server.")

    print(f"[shops] Request received: lat={lat}, lon={lon}")

    payload = {
        "textQuery": "ski snowboard shop rental repair",
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lon},
                "radius": SEARCH_RADIUS_M,
            }
        },
        "maxResultCount": 20,
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.displayName,"
            "places.formattedAddress,"
            "places.nationalPhoneNumber,"
            "places.websiteUri,"
            "places.location"
        ),
    }

    print(f"[shops] Sending Places API request: {payload}")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(PLACES_URL, json=payload, headers=headers)
            print(f"[shops] Places API response status: {resp.status_code}")
            if not resp.is_success:
                print(f"[shops] Places API error body: {resp.text}")
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        print(f"[shops] Places API HTTP error: {exc}")
        raise HTTPException(status_code=502, detail=f"Places API error: {exc}")

    places = resp.json().get("places", [])
    print(f"[shops] Places API returned {len(places)} results")

    shops = []
    for place in places:
        name = place.get("displayName", {}).get("text")
        location = place.get("location", {})
        plat = location.get("latitude")
        plon = location.get("longitude")

        if not name or plat is None:
            print(f"[shops] Skipping (missing name or location): {place}")
            continue

        dist = round(_haversine_miles(lat, lon, plat, plon), 1)
        print(f"[shops] Adding: {name!r} at {dist} mi")
        shops.append({
            "name": name,
            "distance_miles": dist,
            "lat": plat,
            "lon": plon,
            "address": place.get("formattedAddress"),
            "phone": place.get("nationalPhoneNumber"),
            "website": place.get("websiteUri"),
        })

    shops.sort(key=lambda s: s["distance_miles"])
    print(f"[shops] Returning {len(shops)} shops")
    return shops
