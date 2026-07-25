from typing import Literal

from pydantic import BaseModel


class UserContext(BaseModel):
    user_id: str
    organization_id: str
    role: Literal["owner", "manager", "employee", "supplier"] = "owner"
    email: str | None = None
    display_name: str | None = None
