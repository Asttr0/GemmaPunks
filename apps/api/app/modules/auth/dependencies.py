from fastapi import Header, HTTPException, status

from app.core.config import get_settings
from app.core.firebase import verify_firebase_id_token
from app.core.logging import logger
from app.modules.auth.repository import get_auth_repository
from app.modules.auth.schemas import AuthIdentity, UserContext

DEFAULT_DEMO_USER_ID = "demo-merchant"
DEFAULT_DEMO_ORG_ID = "merchant-berrechid"


def _identity_from_token(token: str, *, allow_synthetic: bool) -> AuthIdentity:
    if token.startswith("test_token_"):
        if not allow_synthetic:
            raise ValueError("Synthetic authentication tokens are disabled")
        remainder = token.removeprefix("test_token_")
        parts = remainder.split("_", 1)
        user_id = parts[0] if parts[0] else DEFAULT_DEMO_USER_ID
        organization_id = parts[1] if len(parts) > 1 else None
        if organization_id in ("org_berrechid_grocery", "org01"):
            organization_id = DEFAULT_DEMO_ORG_ID

        claims = {"role": "OWNER"}
        if organization_id:
            claims["organization_id"] = organization_id
        return AuthIdentity(user_id=user_id, claims=claims)

    claims = verify_firebase_id_token(token)
    user_id = claims.get("uid") or claims.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise ValueError("Firebase token does not contain a user ID")
    return AuthIdentity(
        user_id=user_id,
        email=claims.get("email"),
        display_name=claims.get("name"),
        claims=claims,
    )


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not token or token == "invalid":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )
    return token


async def get_signup_identity(
    authorization: str | None = Header(None),
) -> AuthIdentity:
    """Verify identity for first-time setup without requiring an organization claim."""
    token = _bearer_token(authorization)
    try:
        return _identity_from_token(
            token,
            allow_synthetic=get_settings().app_env == "development",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"Firebase identity verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        ) from exc


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

    if authorization:
        try:
            identity = _identity_from_token(
                _bearer_token(authorization),
                allow_synthetic=settings.app_env == "development",
            )
            organization_id = identity.claims.get("organization_id")
            membership_role = identity.claims.get("role")

            if not isinstance(organization_id, str) or not organization_id:
                repository = get_auth_repository()
                profile = repository.get_profile(identity.user_id)
                if profile is None:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account setup required",
                    )
                organization_id = profile.primary_organization_id
                membership = repository.get_membership(organization_id, identity.user_id)
                if membership is None or membership.status != "ACTIVE":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Active organization membership required",
                    )
                membership_role = membership.role

            normalized_role = (
                membership_role.lower() if isinstance(membership_role, str) else "owner"
            )
            if normalized_role not in {"owner", "member", "admin"}:
                normalized_role = "owner"

            return UserContext(
                user_id=identity.user_id,
                organization_id=organization_id,
                role=normalized_role,
                email=identity.email,
                display_name=identity.display_name,
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning(f"Firebase token authentication failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
            ) from exc

    # Dev test headers
    if settings.app_env == "development" and (x_test_user_id or x_test_org_id):
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
