import asyncio

from app.main import app, health


def test_api_scaffold() -> None:
    assert "MIZAN Souq" in app.title
    assert asyncio.run(health()) == {"status": "ok"}
