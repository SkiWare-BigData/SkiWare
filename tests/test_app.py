from datetime import date

from fastapi.testclient import TestClient

from backend.main import app
from backend.services.calculate_DIN import calculate_din


client = TestClient(app)


def _age_for_birthday(birthday: date) -> int:
    today = date.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))


def _valid_user_payload(*, name: str, email: str, weight_lbs: float = 151.0, height_in: float = 67.7) -> dict[str, object]:
    return {
        "name": name,
        "email": email,
        "preferredSport": "Skier",
        "skillLevel": "advanced",
        "equipment": [{"name": "Rossignol Experience 88", "length": "180", "width": "88"}],
        "preferredTerrain": "powder",
        "skierType": 3,
        "birthday": "1998-02-14",
        "weightLbs": weight_lbs,
        "heightIn": height_in,
        "bootSoleLengthMm": 295,
    }


def test_assess_endpoint_returns_recommendations():
    response = client.post(
        "/api/assess",
        json={
            "equipmentType": "skis",
            "brand": "Rossignol",
            "model": "Experience 88",
            "lengthCm": 180,
            "age": "1-2 years",
            "snowCondition": "ice",
            "terrainType": "groomed",
            "skillLevel": "advanced",
            "heightIn": 69,
            "weightLbs": 155,
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
    assert payload["snowCondition"] == "ice"
    assert payload["terrainType"] == "groomed"
    assert payload["skillLevel"] == "advanced"
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
            "lengthCm": "",
            "heightIn": "",
            "weightLbs": "",
            "snowCondition": "powder",
            "terrainType": "ungroomed",
            "skillLevel": "intermediate",
            "daysSinceWax": 2,
            "daysSinceEdgeWork": 3,
            "coreShots": 0,
            "issueDescription": "",
        },
    )

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["severity"] == "LOW"


def test_assess_endpoint_rejects_invalid_enum_value():
    response = client.post(
        "/api/assess",
        json={
            "equipmentType": "skis",
            "snowCondition": "slush",
        },
    )

    assert response.status_code == 422


def test_assess_endpoint_requires_equipment_type():
    response = client.post("/api/assess", json={})

    assert response.status_code == 422


def test_user_router_supports_crud_flow():
    birthday = date(1998, 2, 14)
    create_response = client.put(
        "/api/users/ava-sender",
        json={
            "name": "Ava Sender",
            "email": "AVA@EXAMPLE.COM",
            "preferredSport": "Skier",
            "skillLevel": "advanced",
            "equipment": [{"name": "Rossignol Experience 88", "length": "180", "width": "88"}],
            "preferredTerrain": "powder",
            "skierType": 3,
            "birthday": birthday.isoformat(),
            "weightLbs": 151.0,
            "heightIn": 67.7,
            "bootSoleLengthMm": 295,
        },
    )

    assert create_response.status_code == 201

    created_user = create_response.json()
    user_id = "ava-sender"

    assert created_user["email"] == "ava@example.com"
    assert created_user["preferredSport"] == "Skier"
    assert created_user["skillLevel"] == "advanced"
    assert created_user["skierType"] == 3
    assert created_user["birthday"] == birthday.isoformat()
    assert created_user["weightLbs"] == 151.0
    assert created_user["heightIn"] == 67.7
    assert created_user["bootSoleLengthMm"] == 295
    assert created_user["DIN"] == calculate_din(
        weight=151.0 * 0.453592,
        boot_sole_length_mm=295,
        age=_age_for_birthday(birthday),
        skier_type=3,
    )

    list_response = client.get("/api/users")
    assert list_response.status_code == 200
    assert list_response.json()["users"][0]["id"] == user_id

    detail_response = client.get(f"/api/users/{user_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["name"] == "Ava Sender"

    update_response = client.put(
        f"/api/users/{user_id}",
        json={
            "name": "Ava Sender",
            "email": "ava@example.com",
            "preferredSport": "Skier",
            "skillLevel": "advanced",
            "equipment": [
                {"name": "Rossignol Experience 88", "length": "180", "width": "88"},
                {"name": "K2 Mindbender 108Ti", "length": "184", "width": "108"},
            ],
            "preferredTerrain": "backcountry",
            "skierType": 3,
            "birthday": birthday.isoformat(),
            "weightLbs": 158.7,
            "heightIn": 68.5,
            "bootSoleLengthMm": 295,
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["preferredSport"] == "Skier"
    assert update_response.json()["equipment"] == [
        {"name": "Rossignol Experience 88", "length": "180", "width": "88"},
        {"name": "K2 Mindbender 108Ti", "length": "184", "width": "108"},
    ]
    assert update_response.json()["preferredTerrain"] == "backcountry"
    assert update_response.json()["weightLbs"] == 158.7
    assert update_response.json()["heightIn"] == 68.5
    assert update_response.json()["DIN"] == calculate_din(
        weight=158.7 * 0.453592,
        boot_sole_length_mm=295,
        age=_age_for_birthday(birthday),
        skier_type=3,
    )

    updated_detail_response = client.get(f"/api/users/{user_id}")
    assert updated_detail_response.status_code == 200
    assert updated_detail_response.json()["DIN"] == calculate_din(
        weight=158.7 * 0.453592,
        boot_sole_length_mm=295,
        age=_age_for_birthday(birthday),
        skier_type=3,
    )

    delete_response = client.delete(f"/api/users/{user_id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/users/{user_id}")
    assert missing_response.status_code == 404
    assert missing_response.json() == {"detail": "User not found"}


def test_user_router_rejects_invalid_email():
    response = client.put(
        "/api/users/taylor-ridge",
        json={
            "name": "Taylor Ridge",
            "email": "not-an-email",
            "skierType": 2,
            "birthday": "1996-08-09",
            "weightKg": 70,
            "heightCm": 175,
            "bootSoleLengthMm": 300,
        },
    )

    assert response.status_code == 422


def test_user_router_rejects_future_birthday():
    response = client.put(
        "/api/users/mika-summit",
        json={
            "name": "Mika Summit",
            "email": "mika@example.com",
            "preferredSport": "Skier",
            "skillLevel": "intermediate",
            "equipment": [{"name": "Rossignol Experience 88", "length": "180", "width": "88"}],
            "preferredTerrain": "hybrid",
            "skierType": 2,
            "birthday": "2999-01-01",
            "weightKg": 70,
            "heightCm": 175,
            "bootSoleLengthMm": 300,
        },
    )

    assert response.status_code == 422


def test_user_router_requires_din_inputs_on_upsert():
    response = client.put(
        "/api/users/casey-hill",
        json={
            "name": "Casey Hill",
            "email": "casey@example.com",
            "preferredSport": "Skier",
            "skillLevel": "intermediate",
            "equipment": [{"name": "Rossignol Experience 88", "length": "180", "width": "88"}],
            "preferredTerrain": "hybrid",
        },
    )

    assert response.status_code == 422


def test_get_missing_user_returns_404():
    response = client.get("/api/users/missing-user")

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


def test_delete_missing_user_returns_404():
    response = client.delete("/api/users/missing-user")

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


def test_user_router_rejects_din_inputs_outside_supported_chart():
    response = client.put(
        "/api/users/out-of-range-user",
        json={
            **_valid_user_payload(name="Out Range", email="range@example.com"),
            "weightLbs": 11.0,
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "weight is outside the supported DIN chart range"


def test_user_router_keeps_current_snowboarder_din_behavior():
    birthday = date(1998, 2, 14)
    response = client.put(
        "/api/users/snowboarder-user",
        json={
            **_valid_user_payload(name="Board Rider", email="board@example.com"),
            "preferredSport": "Snowboarder",
        },
    )

    assert response.status_code == 201
    assert response.json()["preferredSport"] == "Snowboarder"
    assert response.json()["DIN"] == calculate_din(
        weight=151.0 * 0.453592,
        boot_sole_length_mm=295,
        age=_age_for_birthday(birthday),
        skier_type=3,
    )


def test_user_router_normalizes_blank_profile_inputs_before_din_validation():
    response = client.put(
        "/api/users/blank-profile-user",
        json={
            **_valid_user_payload(name="Blank Profile", email="blank@example.com"),
            "skierType": "",
            "birthday": "",
            "weightLbs": "",
            "heightIn": "",
            "bootSoleLengthMm": "",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "DIN requires skierType, birthday, weightLbs, heightIn, and bootSoleLengthMm."
    )


def test_list_users_returns_multiple_users():
    first_response = client.put(
        "/api/users/user-one",
        json=_valid_user_payload(name="User One", email="one@example.com"),
    )
    second_response = client.put(
        "/api/users/user-two",
        json=_valid_user_payload(name="User Two", email="two@example.com", weight_lbs=158.7, height_in=70.9),
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get("/api/users")

    assert response.status_code == 200
    payload = response.json()
    returned_ids = {user["id"] for user in payload["users"]}

    assert returned_ids == {"user-one", "user-two"}
