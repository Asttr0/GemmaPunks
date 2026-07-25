from fastapi import APIRouter, Depends
from app.core.store import db_store
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.transactions.schemas import TransactionListResponse

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    user: UserContext = Depends(get_current_user),
) -> TransactionListResponse:
    """List confirmed transactions owned by the authenticated merchant organization."""
    txns = db_store.list_transactions(user.organization_id)
    return TransactionListResponse(items=txns, next_cursor=None)
