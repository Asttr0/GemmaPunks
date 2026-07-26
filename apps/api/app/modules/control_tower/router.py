from fastapi import APIRouter, Depends, HTTPException, status

from app.core.business_repository import (
    BusinessRepository,
    business_repository_dependency,
    require_organization_type,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.control_tower.schemas import (
    AuditFinding,
    AuditRunResponse,
    ControlTowerDashboard,
    FinancialRecordListResponse,
    FindingDecisionRequest,
    FindingDecisionResponse,
    SupplierPortfolioResponse,
)
from app.modules.control_tower.service import (
    ControlTowerService,
    get_control_tower_service,
)

router = APIRouter(prefix="/api/v1/control-tower", tags=["control-tower"])


def _require_distribution_company(
    user: UserContext,
    repository: BusinessRepository,
) -> None:
    try:
        require_organization_type(repository, user.organization_id, "MERCHANT")
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.get("/dashboard", response_model=ControlTowerDashboard)
async def get_dashboard(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
    service: ControlTowerService = Depends(get_control_tower_service),
) -> ControlTowerDashboard:
    _require_distribution_company(user, repository)
    return service.dashboard()


@router.get("/audit-findings", response_model=list[AuditFinding])
async def list_audit_findings(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
    service: ControlTowerService = Depends(get_control_tower_service),
) -> list[AuditFinding]:
    _require_distribution_company(user, repository)
    return service.findings()


@router.get("/audit-findings/{finding_id}", response_model=AuditFinding)
async def get_audit_finding(
    finding_id: str,
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
    service: ControlTowerService = Depends(get_control_tower_service),
) -> AuditFinding:
    _require_distribution_company(user, repository)
    try:
        return service.finding(finding_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/audit-findings/{finding_id}/decide",
    response_model=FindingDecisionResponse,
)
async def decide_audit_finding(
    finding_id: str,
    request: FindingDecisionRequest,
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
    service: ControlTowerService = Depends(get_control_tower_service),
) -> FindingDecisionResponse:
    _require_distribution_company(user, repository)
    try:
        return service.decide(finding_id, request, user)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/suppliers", response_model=SupplierPortfolioResponse)
async def get_supplier_portfolio(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
    service: ControlTowerService = Depends(get_control_tower_service),
) -> SupplierPortfolioResponse:
    _require_distribution_company(user, repository)
    return service.supplier_portfolio()


@router.get("/records", response_model=FinancialRecordListResponse)
async def get_financial_records(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
    service: ControlTowerService = Depends(get_control_tower_service),
) -> FinancialRecordListResponse:
    _require_distribution_company(user, repository)
    return service.records()


@router.post("/audit-runs", response_model=AuditRunResponse)
async def run_control_audit(
    user: UserContext = Depends(get_current_user),
    repository: BusinessRepository = Depends(business_repository_dependency),
    service: ControlTowerService = Depends(get_control_tower_service),
) -> AuditRunResponse:
    _require_distribution_company(user, repository)
    return service.run_audit()
