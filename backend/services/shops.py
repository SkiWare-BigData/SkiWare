import os
from math import asin, cos, radians, sin, sqrt

import httpx
from fastapi import HTTPException

from backend.models import GeocodeResponse, ShopResult


GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def _require_maps_api_key() -> str:
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_MAPS_API_KEY is not configured.")
    return api_key


def _distance_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    earth_radius = 3958.8
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lng / 2) ** 2
    )
    return 2 * earth_radius * asin(sqrt(a))


async def geocode_location(query: str) -> GeocodeResponse:
    api_key = _require_maps_api_key()
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            GOOGLE_GEOCODE_URL,
            params={"address": query, "key": api_key},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding request failed.")

    payload = response.json()
    status = payload.get("status")
    if status != "OK":
        raise HTTPException(status_code=400, detail=f"Geocoding failed: {status}")

    first_result = payload["results"][0]
    location = first_result["geometry"]["location"]
    return GeocodeResponse(
        lat=location["lat"],
        lng=location["lng"],
        formatted_address=first_result.get("formatted_address", query),
    )


async def search_nearby_shops(lat: float, lng: float, radius_miles: int) -> list[ShopResult]:
    api_key = _require_maps_api_key()
    radius_meters = int(radius_miles * 1609.34)
    request_payload = {
        "textQuery": "ski repair shop",
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius_meters,
            }
        },
        "maxResultCount": 20,
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ",".join(
            [
                "places.id",
                "places.displayName",
                "places.formattedAddress",
                "places.nationalPhoneNumber",
                "places.rating",
                "places.currentOpeningHours.openNow",
                "places.googleMapsUri",
                "places.location",
            ]
        ),
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            GOOGLE_PLACES_TEXT_SEARCH_URL,
            headers=headers,
            json=request_payload,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Google Places request failed.")

    payload = response.json()
    shops: list[ShopResult] = []
    for place in payload.get("places", []):
        location = place.get("location") or {}
        place_lat = location.get("latitude")
        place_lng = location.get("longitude")
        if place_lat is None or place_lng is None:
            continue

        distance = _distance_miles(lat, lng, place_lat, place_lng)
        if distance > radius_miles:
            continue

        current_hours = place.get("currentOpeningHours") or {}
        name_data = place.get("displayName") or {}
        shops.append(
            ShopResult(
                name=name_data.get("text", "Unknown shop"),
                address=place.get("formattedAddress", "Address unavailable"),
                phone=place.get("nationalPhoneNumber"),
                rating=place.get("rating"),
                open_now=current_hours.get("openNow"),
                google_maps_url=place.get("googleMapsUri", ""),
                distance_miles=round(distance, 2),
                lat=place_lat,
                lng=place_lng,
            )
        )

    shops.sort(key=lambda item: item.distance_miles)
    return shops
