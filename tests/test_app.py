from fastapi.testclient import TestClient

from app.main import app


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
