from fastapi.testclient import TestClient

from backend.main import app
from backend.routers import shops as shops_router


client = TestClient(app)


def test_root_page_loads():
    response = client.get("/")

    assert response.status_code == 200
    assert "Hello World!" in response.text
    assert "Cloud Run" in response.text


def test_health_endpoint_reports_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_assess_endpoint_returns_recommendations():
    response = client.post(
        "/api/assess",
        json={
            "equipmentType": "skis",
            "brand": "Rossignol",
            "terrain": "ice-hardpack",
            "style": "both",
            "daysSinceWax": 14,
            "daysSinceEdgeWork": 12,
            "coreShots": 2,
            "issueDescription": "A few scratches underfoot after early-season rocks.",
        },
    )

    assert response.status_code == 200

    payload = response.json()

    assert payload["equipmentType"] == "skis"
    assert payload["brand"] == "Rossignol"
    assert payload["daysSinceWax"] == 14
    assert payload["daysSinceEdgeWork"] == 12
    assert len(payload["recommendations"]) >= 3
    assert all("title" in recommendation for recommendation in payload["recommendations"])
    assert len(payload["tips"]) == 5


def test_assess_endpoint_accepts_blank_optional_numeric_fields():
    response = client.post(
        "/api/assess",
        json={
            "equipmentType": "snowboard",
            "brand": "Burton",
            "length": "",
            "height": "",
            "weight": "",
            "terrain": "powder",
            "style": "off-piste",
            "daysSinceWax": 2,
            "daysSinceEdgeWork": 3,
            "coreShots": 0,
            "issueDescription": "",
        },
    )

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["severity"] == "LOW"


def test_shops_endpoint_returns_sorted_results(monkeypatch):
    async def fake_search_nearby_shops(lat: float, lng: float, radius_miles: int):
        return [
            {
                "name": "Far Shop",
                "address": "200 Alpine Way",
                "phone": "111-111-1111",
                "rating": 4.2,
                "open_now": False,
                "google_maps_url": "https://maps.google.com/?q=far",
                "distance_miles": 10.0,
                "lat": lat + 0.2,
                "lng": lng + 0.2,
            },
            {
                "name": "Near Shop",
                "address": "100 Powder Lane",
                "phone": "222-222-2222",
                "rating": 4.8,
                "open_now": True,
                "google_maps_url": "https://maps.google.com/?q=near",
                "distance_miles": 2.0,
                "lat": lat + 0.01,
                "lng": lng + 0.01,
            },
        ]

    monkeypatch.setattr(shops_router, "search_nearby_shops", fake_search_nearby_shops)

    response = client.get("/api/shops?lat=40.0&lng=-105.0&radius_miles=25")
    assert response.status_code == 200
    payload = response.json()
    assert payload["radius_miles"] == 25
    assert len(payload["shops"]) == 2
    assert payload["shops"][0]["name"] == "Far Shop"


def test_geocode_endpoint_returns_coordinates(monkeypatch):
    async def fake_geocode_location(query: str):
        return {
            "lat": 40.01499,
            "lng": -105.27055,
            "formatted_address": f"Mocked for {query}",
        }

    monkeypatch.setattr(shops_router, "geocode_location", fake_geocode_location)

    response = client.get("/api/geocode?query=Boulder%20CO")
    assert response.status_code == 200
    payload = response.json()
    assert payload["lat"] == 40.01499
    assert payload["lng"] == -105.27055
