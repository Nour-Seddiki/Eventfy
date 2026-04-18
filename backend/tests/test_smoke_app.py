import importlib
import os
import sys

import httpx
import pytest


@pytest.mark.anyio
async def test_app_smoke(tmp_path):
    db_path = tmp_path / "smoke.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    for module in ("app.main", "app.db.session", "app.config"):
        if module in sys.modules:
            del sys.modules[module]

    app_module = importlib.import_module("app.main")
    transport = httpx.ASGITransport(app=app_module.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/openapi.json")
        assert response.status_code == 200
        payload = response.json()
        assert "paths" in payload
