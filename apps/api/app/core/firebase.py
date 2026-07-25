import firebase_admin
from firebase_admin import auth, credentials, firestore
from google.auth.credentials import AnonymousCredentials

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

    if not firebase_admin._apps:
        credential = (
            credentials.ApplicationDefault()
            if settings.app_env == "production"
            else AnonymousCredentials()
        )
        _firebase_app = firebase_admin.initialize_app(
            credential,
            options={"projectId": project_id},
        )
        logger.info(f"Initialized Firebase Admin app for project '{project_id}'.")
    else:
        _firebase_app = firebase_admin.get_app()

    return _firebase_app


def get_firestore_client():
    """Return the Admin Firestore client for the configured project."""
    return firestore.client(app=initialize_firebase())


def verify_firebase_id_token(id_token: str) -> dict:
    """Verify Firebase ID token and return decoded user claims."""
    app = initialize_firebase()
    try:
        decoded_token = auth.verify_id_token(id_token, app=app)
        return decoded_token
    except Exception as exc:
        logger.warning(f"Firebase token verification failed: {exc}")
        raise ValueError(f"Invalid Firebase ID token: {exc}") from exc
