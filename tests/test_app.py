from app.main import app


def test_root_page_loads():
    client = app.test_client()

    response = client.get("/")

    assert response.status_code == 200
    assert b"Hello World!" in response.data
    assert b"Cloud Run" in response.data


def test_health_endpoint_reports_ok():
    client = app.test_client()

    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}
