from fastapi import APIRouter, Query

from backend.models import GeocodeResponse, ShopsResponse
from backend.services.shops import geocode_location, search_nearby_shops


router = APIRouter(prefix="/api", tags=["shops"])


@router.get("/shops", response_model=ShopsResponse)
async def get_shops(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_miles: int = Query(default=25, ge=1, le=100),
) -> ShopsResponse:
    shops = await search_nearby_shops(lat=lat, lng=lng, radius_miles=radius_miles)
    return ShopsResponse(
        origin_lat=lat,
        origin_lng=lng,
        radius_miles=radius_miles,
        shops=shops,
    )


@router.get("/geocode", response_model=GeocodeResponse)
async def get_geocode(query: str = Query(..., min_length=2, max_length=200)) -> GeocodeResponse:
    return await geocode_location(query=query.strip())
