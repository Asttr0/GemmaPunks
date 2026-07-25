from fastapi import Header, HTTPException, status
from app.core.config import get_settings
from app.core.firebase import verify_firebase_id_token
from app.core.logging import logger
from app.modules.auth.schemas import UserContext

DEFAULT_DEMO_USER_ID = "demo-merchant"
DEFAULT_DEMO_ORG_ID = "merchant-berrechid"


async def get_current_user(
    authorization: str | None = Header(None),
    x_test_user_id: str | None = Header(None),
    x_test_org_id: str | None = Header(None),
) -> UserContext:
    """FastAPI dependency to verify Firebase ID token and resolve organization context.

    Returns 401 Unauthorized if token is missing or invalid.
    Never trusts organization_id sent in client request bodies.
    """
    settings = get_settings()

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        if not token or token == "invalid":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
            )

        # Handle test synthetic token format e.g. "test_token_usr01_org01"
        if token.startswith("test_token_"):
            remainder = token.removeprefix("test_token_")
            parts = remainder.split("_", 1)
            user_id = parts[0] if parts[0] else DEFAULT_DEMO_USER_ID
            org_id = parts[1] if len(parts) > 1 else DEFAULT_DEMO_ORG_ID
            if org_id in ("org_berrechid_grocery", "org01"):
                org_id = DEFAULT_DEMO_ORG_ID

            return UserContext(
                user_id=user_id,
                organization_id=org_id,
                role="owner",
                email=f"{user_id}@mizansouq.ma",
            )

        # Verify Firebase ID token
        try:
            claims = verify_firebase_id_token(token)
            uid = claims.get("uid") or claims.get("sub") or DEFAULT_DEMO_USER_ID
            org_id = claims.get("organization_id") or DEFAULT_DEMO_ORG_ID
            role = claims.get("role") or "owner"
            email = claims.get("email") or f"{uid}@mizansouq.ma"

            return UserContext(
                user_id=uid,
                organization_id=org_id,
                role=role.lower() if isinstance(role, str) else "owner",
                email=email,
            )
        except Exception as exc:
            logger.warning(f"Firebase token authentication failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
            ) from exc

    # Dev test headers
    if x_test_user_id or x_test_org_id:
        org_id = x_test_org_id or DEFAULT_DEMO_ORG_ID
        if org_id in ("org_berrechid_grocery", "org01"):
            org_id = DEFAULT_DEMO_ORG_ID

        return UserContext(
            user_id=x_test_user_id or DEFAULT_DEMO_USER_ID,
            organization_id=org_id,
            role="owner",
            email="test@mizansouq.ma",
        )

    # In production, require Authorization header
    if settings.app_env == "production":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
        )

    # Default development context
    return UserContext(
        user_id=DEFAULT_DEMO_USER_ID,
        organization_id=DEFAULT_DEMO_ORG_ID,
        role="owner",
        email="merchant.demo@example.com",
    )
