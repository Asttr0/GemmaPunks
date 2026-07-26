from fastapi import APIRouter, Depends, HTTPException, status

from app.core.business_repository import (
    BusinessRepository,
    business_repository_dependency,
)
from app.core.models import AgentRunRecord
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext

router = APIRouter(prefix="/api/v1/agent-runs", tags=["agent-audit"])


@router.get("/{id}", response_model=AgentRunRecord)
async def get_agent_run_audit(
    id: str,
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> AgentRunRecord:
    """Read the agent run timeline and tool-call audit for demonstration and auditability."""
    run = repository.get_agent_run(user.organization_id, id)
    if run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent run not found",
        )
    return run
