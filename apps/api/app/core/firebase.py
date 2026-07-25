import os
import firebase_admin
from firebase_admin import auth, credentials
from app.core.config import get_settings
from app.core.logging import logger

_firebase_app = None


def initialize_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK once."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    settings = get_settings()
    project_id = settings.firebase_project_id

    # If Auth Emulator host is configured, set environment variable for firebase-admin
    emulator_host = os.getenv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099")
    if settings.app_env == "development" and "FIREBASE_AUTH_EMULATOR_HOST" not in os.environ:
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = emulator_host
        logger.info(f"Set FIREBASE_AUTH_EMULATOR_HOST={emulator_host} for local Firebase emulator.")

    try:
        if not firebase_admin._apps:
            cred = credentials.ApplicationDefault() if settings.app_env == "production" else credentials.AnonymousCredentials()
            _firebase_app = firebase_admin.initialize_app(
                cred,
                options={"projectId": project_id},
            )
            logger.info(f"Initialized Firebase Admin app for project '{project_id}'.")
        else:
            _firebase_app = firebase_admin.get_app()
    except Exception as exc:
        logger.warning(f"Firebase Admin initialization warning: {exc}. Using fallback emulator context.")
        _firebase_app = None

    return _firebase_app


def verify_firebase_id_token(id_token: str) -> dict:
    """Verify Firebase ID token and return decoded user claims."""
    initialize_firebase()
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as exc:
        logger.warning(f"Firebase token verification failed: {exc}")
        raise ValueError(f"Invalid Firebase ID token: {exc}") from exc
