from typing import Any, Literal

from pydantic import BaseModel, Field

from app.core.models import Organization, Profile


class UserContext(BaseModel):
    user_id: str
    organization_id: str
    role: Literal["owner", "member", "admin"] = "owner"
    email: str | None = None
    display_name: str | None = None


class AuthIdentity(BaseModel):
    user_id: str
    email: str | None = None
    display_name: str | None = None
    claims: dict[str, Any] = Field(default_factory=dict)


class LoginRequest(BaseModel):
    id_token: str | None = None


class SignUpRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    display_name: str = Field(min_length=2, max_length=100)
    organization_name: str = Field(min_length=2, max_length=120)
    organization_type: Literal["MERCHANT", "SUPPLIER"] = "MERCHANT"


class AuthResponse(BaseModel):
    user: UserContext
    profile: Profile | None = None
    organization: Organization | None = None
