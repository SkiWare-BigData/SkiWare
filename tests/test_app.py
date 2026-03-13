from fastapi.testclient import TestClient

from backend.main import app


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
