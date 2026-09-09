from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field

class StudentProfile(BaseModel):
    student_id: int | None = None
    gpa_or_percentage: float
    field: str
    degree_level: str
    budget_pkr: float | None = None
    target_countries: list[str] = Field(default_factory=list)
    career_goals: str | None = None
    english_test_status: str | None = None
    domicile_province: str
    income_bracket: str

class MatchResult(BaseModel):
    opportunity_id: int
    name: str
    source_url: str | None = None
    deadline_raw: str | None = None
    country: str | None = None
    provider: str | None = None
    eligibility_status: Literal['Eligible', 'Partial Match', 'Not Eligible']
    reasons_failed: list[str] = Field(default_factory=list)
    score_breakdown: dict[str, Any] = Field(default_factory=dict)
    total_score: float = 0.0

class EvidenceItem(BaseModel):
    source_url: str
    source_version: int
    retrieved_at: datetime
    excerpt: str
    chunk_id: str | None = None

class DocumentChecklist(BaseModel):
    status: Literal['available', 'unavailable']
    items: list[str] = Field(default_factory=list)
    note: str | None = None

class Recommendation(BaseModel):
    opportunity_id: int
    name: str
    eligibility_status: Literal['Eligible', 'Partial Match', 'Not Eligible']
    score: float
    score_breakdown: dict[str, Any]
    why_this_match: str
    deadline: str | None = None
    document_checklist: DocumentChecklist
    evidence: list[EvidenceItem] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)

class GapItem(BaseModel):
    criterion: str
    gap: str
    recommended_action: str
    estimated_time: str | None = None
    priority: Literal['High', 'Medium', 'Low']

class RoadmapItem(BaseModel):
    priority: Literal['High', 'Medium', 'Low']
    action: str
    reason: str
    estimated_time: str | None = None

class Roadmap(BaseModel):
    summary: str
    steps: list[RoadmapItem] = Field(default_factory=list)

class LLMStatus(BaseModel):
    """Safe, request-scoped diagnostics; never includes credentials or provider payloads."""
    configured: bool
    calls_attempted: int = 0
    calls_succeeded: int = 0
    reason: str | None = None

class AnalysisResponse(BaseModel):
    profile_summary: str
    strengths: list[str] = Field(default_factory=list)
    gaps: list[GapItem] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
    roadmap: Roadmap
    limitations: list[str] = Field(default_factory=list)
    sources: list[EvidenceItem] = Field(default_factory=list)
    llm_status: LLMStatus
    profile: StudentProfile | None = Field(default=None, exclude=True)
    match_results: list[MatchResult] = Field(default_factory=list, exclude=True)

class AnalysisError(BaseModel):
    code: str
    message: str
    limitations: list[str] = Field(default_factory=list)

class ExplanationOutput(BaseModel):
    """The deliberately narrow schema accepted from the generation provider."""
    why_this_match: str
    actions: list[str] = Field(min_length=1)

class SourceRecord(BaseModel):
    opportunity_id: int
    opportunity_name: str
    source_url: str
    source_type: Literal['html', 'pdf']
    retrieval_time: datetime
    verification_time: datetime
    content_hash: str | None = None
    source_version: int = 0
    status: Literal['ok', 'unavailable', 'error']
    extraction_status: Literal['success', 'partial', 'failed']
    error_message: str | None = None
