import importlib
import os
import sys

from fastapi.testclient import TestClient


def test_app_smoke(tmp_path):
    db_path = tmp_path / "smoke.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    for module in ("app.main", "app.db.session", "app.config"):
        if module in sys.modules:
            del sys.modules[module]

    app_module = importlib.import_module("app.main")
    client = TestClient(app_module.app)

    response = client.get("/openapi.json")
    assert response.status_code == 200
    payload = response.json()
    assert "paths" in payload
