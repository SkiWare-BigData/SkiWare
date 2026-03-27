import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.users import reset_user_store


client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_user_store() -> None:
    reset_user_store()


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


def test_user_router_supports_crud_flow():
    create_response = client.post(
        "/api/users",
        json={
            "name": "Ava Sender",
            "email": "AVA@EXAMPLE.COM",
            "skillLevel": "advanced",
            "preferredEquipment": "skis",
            "preferredTerrain": "powder",
        },
    )

    assert create_response.status_code == 201

    created_user = create_response.json()
    user_id = created_user["id"]

    assert created_user["email"] == "ava@example.com"
    assert created_user["skillLevel"] == "advanced"

    list_response = client.get("/api/users")
    assert list_response.status_code == 200
    assert list_response.json()["users"][0]["id"] == user_id

    detail_response = client.get(f"/api/users/{user_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["name"] == "Ava Sender"

    update_response = client.patch(
        f"/api/users/{user_id}",
        json={
            "preferredEquipment": "both",
            "preferredTerrain": "backcountry",
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["preferredEquipment"] == "both"
    assert update_response.json()["preferredTerrain"] == "backcountry"

    delete_response = client.delete(f"/api/users/{user_id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/users/{user_id}")
    assert missing_response.status_code == 404
    assert missing_response.json() == {"detail": "User not found"}


def test_user_router_rejects_invalid_email():
    response = client.post(
        "/api/users",
        json={
            "name": "Taylor Ridge",
            "email": "not-an-email",
        },
    )

    assert response.status_code == 422
