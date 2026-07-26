import os

import pytest

from app.core.store import db_store
from app.modules.control_tower.service import get_control_tower_service
from app.modules.ingestion.repository import _in_memory_repository


@pytest.fixture(autouse=True)
def reset_in_memory_backend_between_tests():
    """Give each unit test the same deterministic demo baseline."""
    if not os.getenv("FIRESTORE_EMULATOR_HOST"):
        db_store.__init__()
        _in_memory_repository._idempotency.clear()
        get_control_tower_service.cache_clear()
    yield
