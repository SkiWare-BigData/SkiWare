from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.assesment import AssessmentRequest, AssessmentResponse
from backend.services.assessment import build_assessment_response

router = APIRouter(prefix="/api", tags=["assessments"])


@router.post("/assess", response_model=AssessmentResponse)
async def assess(
    payload: AssessmentRequest,
    db: AsyncSession = Depends(get_db),
) -> AssessmentResponse:
    return await build_assessment_response(payload, db)
