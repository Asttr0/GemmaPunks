from fastapi import APIRouter, Depends

from app.modules.auth.dependencies import get_current_user, get_signup_identity
from app.modules.auth.repository import AuthRepository, get_auth_repository
from app.modules.auth.schemas import (
    AuthIdentity,
    AuthResponse,
    LoginRequest,
    SignUpRequest,
    UserContext,
)
from app.modules.auth.service import build_auth_response, register_business

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    user: UserContext = Depends(get_current_user),
    repository: AuthRepository = Depends(get_auth_repository),
) -> AuthResponse:
    """Authenticate user and return profile & organization context."""
    return build_auth_response(user, repository)


@router.post("/signup", response_model=AuthResponse)
async def signup(
    request: SignUpRequest,
    identity: AuthIdentity = Depends(get_signup_identity),
    repository: AuthRepository = Depends(get_auth_repository),
) -> AuthResponse:
    """Create the server-owned organization records for a verified Firebase user."""
    return register_business(request, identity, repository)


@router.get("/me", response_model=AuthResponse)
async def get_me(
    user: UserContext = Depends(get_current_user),
    repository: AuthRepository = Depends(get_auth_repository),
) -> AuthResponse:
    """Get currently authenticated user context, profile, and organization."""
    return build_auth_response(user, repository)
