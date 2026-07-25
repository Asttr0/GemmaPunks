from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.models import Organization, Profile
from app.core.store import db_store
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginRequest(BaseModel):
    id_token: str | None = None
    email: str | None = None
    password: str | None = None


class SignUpRequest(BaseModel):
    email: str
    display_name: str
    organization_name: str
    organization_type: str = "MERCHANT"


class AuthResponse(BaseModel):
    user: UserContext
    profile: Profile | None = None
    organization: Organization | None = None


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, user: UserContext = Depends(get_current_user)) -> AuthResponse:
    """Authenticate user and return profile & organization context."""
    profile = db_store.get_profile(user.user_id)
    org = db_store.get_organization(user.organization_id)
    return AuthResponse(user=user, profile=profile, organization=org)


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignUpRequest, user: UserContext = Depends(get_current_user)) -> AuthResponse:
    """Register a new merchant or supplier organization user profile."""
    slug = req.organization_name.lower().replace(" ", "-")
    org_type = req.organization_type.upper()
    org_id = f"{org_type.lower()}-{slug}"

    org = Organization(
        organization_id=org_id,
        name=req.organization_name,
        type="SUPPLIER" if org_type == "SUPPLIER" else "MERCHANT",
        status="ACTIVE",
    )
    db_store.organizations[org_id] = org

    profile = Profile(
        user_id=user.user_id,
        display_name=req.display_name,
        email=req.email,
        primary_organization_id=org_id,
    )
    db_store.profiles[user.user_id] = profile

    user_ctx = UserContext(
        user_id=user.user_id,
        organization_id=org_id,
        role="owner",
        email=req.email,
        display_name=req.display_name,
    )

    return AuthResponse(user=user_ctx, profile=profile, organization=org)


@router.get("/me", response_model=AuthResponse)
async def get_me(user: UserContext = Depends(get_current_user)) -> AuthResponse:
    """Get currently authenticated user context, profile, and organization."""
    profile = db_store.get_profile(user.user_id)
    org = db_store.get_organization(user.organization_id)
    return AuthResponse(user=user, profile=profile, organization=org)
