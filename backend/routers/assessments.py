from fastapi import APIRouter

from backend.models import AssessmentRequest, AssessmentResponse
from backend.services.assessment import build_assessment_response


router = APIRouter(prefix="/api", tags=["assessments"])


@router.post("/assess", response_model=AssessmentResponse)
async def assess(payload: AssessmentRequest) -> AssessmentResponse:
    return build_assessment_response(payload)
