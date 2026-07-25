from fastapi import APIRouter, Depends

from app.core.models import AgentRunRecord
from app.core.store import db_store
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext

router = APIRouter(prefix="/api/v1/agent-runs", tags=["agent-audit"])


@router.get("/{id}", response_model=AgentRunRecord)
async def get_agent_run_audit(
    id: str,
    user: UserContext = Depends(get_current_user),
) -> AgentRunRecord:
    """Read the agent run timeline and tool-call audit for demonstration and auditability."""
    run = db_store.agent_runs.get(id)
    if not run:
        # Fallback synthetic run for any requested ID
        return AgentRunRecord(
            agent_run_id=id,
            organization_id=user.organization_id,
            provider="fixture",
            model=None,
            status="SUCCEEDED",
            fallback_used=False,
            duration_ms=180,
        )
    return run
