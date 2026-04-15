from fastapi import APIRouter
from backend.models.schemas import AnalyzeRequest, AnalyzeResponse
from backend.services.llm_service import analyze_text

router = APIRouter()


@router.post("/chat", response_model=AnalyzeResponse)
def chat(request: AnalyzeRequest):
    result = analyze_text(request.text)
    return AnalyzeResponse(result=result)