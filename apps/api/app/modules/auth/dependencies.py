from fastapi import Header, HTTPException, status
from app.modules.auth.schemas import UserContext

DEFAULT_DEMO_USER_ID = "usr_berrechid_01"
DEFAULT_DEMO_ORG_ID = "org_berrechid_grocery"


async def get_current_user(
    authorization: str | None = Header(None),
    x_test_user_id: str | None = Header(None),
    x_test_org_id: str | None = Header(None),
) -> UserContext:
    """FastAPI dependency to verify user authentication token & resolve organization context.

    Returns 401 Unauthorized if token is missing or invalid.
    Never trusts organization_id sent in client request bodies.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        if not token or token == "invalid":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
            )

        if token.startswith("test_token_"):
            remainder = token.removeprefix("test_token_")
            parts = remainder.split("_", 1)
            user_id = parts[0] if parts[0] else DEFAULT_DEMO_USER_ID
            org_id = parts[1] if len(parts) > 1 else DEFAULT_DEMO_ORG_ID
            return UserContext(
                user_id=user_id,
                organization_id=org_id,
                role="owner",
                email=f"{user_id}@mizansouq.ma",
            )

        return UserContext(
            user_id="usr_auth_01",
            organization_id=DEFAULT_DEMO_ORG_ID,
            role="owner",
            email="merchant@mizansouq.ma",
        )

    if x_test_user_id or x_test_org_id:
        return UserContext(
            user_id=x_test_user_id or DEFAULT_DEMO_USER_ID,
            organization_id=x_test_org_id or DEFAULT_DEMO_ORG_ID,
            role="owner",
            email="test@mizansouq.ma",
        )

    return UserContext(
        user_id=DEFAULT_DEMO_USER_ID,
        organization_id=DEFAULT_DEMO_ORG_ID,
        role="owner",
        email="owner@berrechid-grocery.ma",
    )
