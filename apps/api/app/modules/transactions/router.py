from fastapi import APIRouter, Depends

from app.core.business_repository import (
    BusinessRepository,
    business_repository_dependency,
    require_organization_type,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.transactions.schemas import TransactionListResponse

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
) -> TransactionListResponse:
    """List confirmed transactions owned by the authenticated merchant organization."""
    try:
        require_organization_type(repository, user.organization_id, "MERCHANT")
    except PermissionError as exc:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    txns = repository.list_transactions(user.organization_id)
    return TransactionListResponse(items=txns, next_cursor=None)
