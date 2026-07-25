from fastapi import HTTPException, status

from app.modules.auth.repository import (
    AuthRepository,
    build_organization_id,
    create_registration_models,
)
from app.modules.auth.schemas import AuthIdentity, AuthResponse, SignUpRequest, UserContext


def build_auth_response(user: UserContext, repository: AuthRepository) -> AuthResponse:
    profile = repository.get_profile(user.user_id)
    organization = repository.get_organization(user.organization_id)
    return AuthResponse(user=user, profile=profile, organization=organization)


def register_business(
    request: SignUpRequest,
    identity: AuthIdentity,
    repository: AuthRepository,
) -> AuthResponse:
    verified_email = identity.email.strip().lower() if identity.email else None
    requested_email = request.email.strip().lower()
    if verified_email and requested_email != verified_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email must match the authenticated Firebase account",
        )

    email = verified_email or requested_email
    existing_profile = repository.get_profile(identity.user_id)
    if existing_profile is not None:
        organization = repository.get_organization(existing_profile.primary_organization_id)
        membership = repository.get_membership(
            existing_profile.primary_organization_id,
            identity.user_id,
        )
        if organization is None or membership is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Existing account setup is incomplete",
            )
        repository.ensure_user_access(
            identity.user_id,
            existing_profile.display_name,
            organization.organization_id,
            membership.role,
        )
        return AuthResponse(
            user=UserContext(
                user_id=identity.user_id,
                organization_id=organization.organization_id,
                role=membership.role.lower(),
                email=existing_profile.email,
                display_name=existing_profile.display_name,
            ),
            profile=existing_profile,
            organization=organization,
        )

    organization_id = build_organization_id(
        request.organization_type,
        request.organization_name,
        identity.user_id,
        repository,
    )
    profile, organization, membership = create_registration_models(
        user_id=identity.user_id,
        email=email,
        display_name=request.display_name.strip(),
        organization_name=request.organization_name.strip(),
        organization_type=request.organization_type,
        organization_id=organization_id,
    )
    repository.create_registration(profile, organization, membership)
    repository.ensure_user_access(
        identity.user_id,
        profile.display_name,
        organization.organization_id,
        membership.role,
    )

    return AuthResponse(
        user=UserContext(
            user_id=identity.user_id,
            organization_id=organization.organization_id,
            role="owner",
            email=profile.email,
            display_name=profile.display_name,
        ),
        profile=profile,
        organization=organization,
    )
