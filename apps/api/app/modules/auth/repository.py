import os
import re
from datetime import UTC, datetime
from typing import Protocol

from firebase_admin import auth

from app.core.config import get_settings
from app.core.firebase import get_firestore_client, initialize_firebase
from app.core.models import Membership, Organization, Profile
from app.core.store import DataStore, db_store


class AuthRepository(Protocol):
    def get_profile(self, user_id: str) -> Profile | None: ...

    def get_organization(self, organization_id: str) -> Organization | None: ...

    def get_membership(self, organization_id: str, user_id: str) -> Membership | None: ...

    def create_registration(
        self,
        profile: Profile,
        organization: Organization,
        membership: Membership,
    ) -> None: ...

    def ensure_user_access(
        self,
        user_id: str,
        display_name: str,
        organization_id: str,
        role: str,
    ) -> None: ...


class InMemoryAuthRepository:
    def __init__(self, store: DataStore):
        self.store = store

    def get_profile(self, user_id: str) -> Profile | None:
        return self.store.get_profile(user_id)

    def get_organization(self, organization_id: str) -> Organization | None:
        return self.store.get_organization(organization_id)

    def get_membership(self, organization_id: str, user_id: str) -> Membership | None:
        return next(
            (
                membership
                for membership in self.store.memberships.get(organization_id, [])
                if membership.user_id == user_id
            ),
            None,
        )

    def create_registration(
        self,
        profile: Profile,
        organization: Organization,
        membership: Membership,
    ) -> None:
        self.store.profiles[profile.user_id] = profile
        self.store.organizations[organization.organization_id] = organization
        memberships = self.store.memberships.setdefault(organization.organization_id, [])
        existing = next(
            (item for item in memberships if item.user_id == membership.user_id),
            None,
        )
        if existing is None:
            memberships.append(membership)

    def ensure_user_access(
        self,
        user_id: str,
        display_name: str,
        organization_id: str,
        role: str,
    ) -> None:
        return None


class FirestoreAuthRepository:
    def __init__(self):
        self.client = get_firestore_client()

    def get_profile(self, user_id: str) -> Profile | None:
        snapshot = self.client.collection("profiles").document(user_id).get()
        if not snapshot.exists:
            return None
        return Profile(user_id=user_id, **snapshot.to_dict())

    def get_organization(self, organization_id: str) -> Organization | None:
        snapshot = self.client.collection("organizations").document(organization_id).get()
        if not snapshot.exists:
            return None
        return Organization(organization_id=organization_id, **snapshot.to_dict())

    def get_membership(self, organization_id: str, user_id: str) -> Membership | None:
        snapshot = (
            self.client.collection("organizations")
            .document(organization_id)
            .collection("memberships")
            .document(user_id)
            .get()
        )
        if not snapshot.exists:
            return None
        return Membership(**snapshot.to_dict())

    def create_registration(
        self,
        profile: Profile,
        organization: Organization,
        membership: Membership,
    ) -> None:
        organization_ref = self.client.collection("organizations").document(
            organization.organization_id
        )
        profile_ref = self.client.collection("profiles").document(profile.user_id)
        membership_ref = organization_ref.collection("memberships").document(profile.user_id)

        batch = self.client.batch()
        batch.set(
            organization_ref,
            organization.model_dump(exclude={"organization_id"}),
        )
        batch.set(
            profile_ref,
            profile.model_dump(exclude={"user_id"}),
        )
        batch.set(membership_ref, membership.model_dump())
        batch.commit()

    def ensure_user_access(
        self,
        user_id: str,
        display_name: str,
        organization_id: str,
        role: str,
    ) -> None:
        app = initialize_firebase()
        auth.update_user(user_id, display_name=display_name, app=app)
        auth.set_custom_user_claims(
            user_id,
            {
                "organization_id": organization_id,
                "role": role,
            },
            app=app,
        )


def get_auth_repository() -> AuthRepository:
    settings = get_settings()
    if settings.app_env == "production" or os.getenv("FIRESTORE_EMULATOR_HOST"):
        return FirestoreAuthRepository()
    return InMemoryAuthRepository(db_store)


def build_organization_id(
    organization_type: str,
    organization_name: str,
    user_id: str,
    repository: AuthRepository,
) -> str:
    normalized_name = re.sub(r"[^a-z0-9]+", "-", organization_name.lower()).strip("-")
    base_id = f"{organization_type.lower()}-{normalized_name or 'business'}"
    existing = repository.get_organization(base_id)
    if existing is None:
        return base_id

    existing_membership = repository.get_membership(base_id, user_id)
    if existing_membership is not None:
        return base_id

    normalized_user_id = re.sub(r"[^a-z0-9]+", "", user_id.lower())[:8] or "member"
    return f"{base_id}-{normalized_user_id}"


def create_registration_models(
    *,
    user_id: str,
    email: str,
    display_name: str,
    organization_name: str,
    organization_type: str,
    organization_id: str,
) -> tuple[Profile, Organization, Membership]:
    now = datetime.now(UTC)
    profile = Profile(
        user_id=user_id,
        display_name=display_name,
        email=email,
        primary_organization_id=organization_id,
        created_at=now,
        updated_at=now,
    )
    organization = Organization(
        organization_id=organization_id,
        name=organization_name,
        type="SUPPLIER" if organization_type == "SUPPLIER" else "MERCHANT",
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    membership = Membership(
        organization_id=organization_id,
        user_id=user_id,
        role="OWNER",
        status="ACTIVE",
        created_at=now,
        updated_at=now,
    )
    return profile, organization, membership
