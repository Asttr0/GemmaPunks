import asyncio

from app.main import app, health


def test_api_scaffold() -> None:
    assert app.title == "MIZAN Souq API"
    assert asyncio.run(health()) == {"status": "ok"}
