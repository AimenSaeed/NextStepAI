import re

from pydantic import BaseModel, Field

from .gap_engine import action_for_reason
from .models import AnalysisResponse, Recommendation, StudentProfile


class ProfilePresentation(BaseModel):
    academic_profile: str
    target_countries: list[str] = Field(default_factory=list)
    budget: str | None = None
    research_summary: str


class TopScholarshipPresentation(BaseModel):
    rank: int
    name: str
    country: str | None = None
    institution: str | None = None
    eligibility: str
    match_score: float
    deadline: str | None = None
    why_suitable: str | None = None
    how_to_apply: str | None = None
    official_link: str | None = None


class PartialMatchPresentation(BaseModel):
    name: str
    country: str | None = None
    institution: str | None = None
    eligibility: str
    match_score: float | None
    deadline: str | None = None
    why_not_fully_eligible: list[str] = Field(default_factory=list)
    how_to_become_eligible: list[str] = Field(default_factory=list)
    official_link: str | None = None


class ApplicationRoadmapPresentation(BaseModel):
    priority: int
    scholarship: str
    action: str


class FrontendAnalysisResponse(BaseModel):
    profile_summary: ProfilePresentation
    top_scholarships: list[TopScholarshipPresentation] = Field(default_factory=list)
    partial_matches: list[PartialMatchPresentation] = Field(default_factory=list)
    application_roadmap: list[ApplicationRoadmapPresentation] = Field(default_factory=list)


def _deadline(value: str | None) -> str | None:
    return value or None


def _safe_why(rec: Recommendation, profile: StudentProfile) -> str | None:
    text = (rec.why_this_match or '').strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    useful = [sentence.strip() for sentence in sentences if sentence.strip() and not any(marker in sentence.lower() for marker in ('member a', 'deterministic', 'backend', 'provider error', 'gemini', 'score', 'fit at'))]
    if useful:
        return ' '.join(useful[:2])
    if profile.field:
        return f'Aligns with your {profile.field} background and stated study preferences.'
    return 'Aligns with your stated academic profile and study preferences.'


def _how_to_apply(rec: Recommendation) -> str:
    if rec.document_checklist.status == 'available':
        return 'Review the official eligibility requirements and prepare the listed application documents.'
    return 'Review the official eligibility requirements and application instructions.'


def _research_summary(analysis: AnalysisResponse) -> str:
    profile = analysis.profile
    if profile is None:
        return 'These are the strongest scholarship opportunities identified for this profile.'
    countries = ', '.join(profile.target_countries) if profile.target_countries else 'your selected study destinations'
    budget = ' and stated funding needs' if profile.budget_pkr is not None else ''
    if analysis.recommendations:
        return f'Based on your {profile.degree_level} academic background in {profile.field}, target countries ({countries}){budget}, these are your strongest scholarship opportunities.'
    return f'Based on your {profile.degree_level} academic background in {profile.field} and target countries ({countries}), no fully eligible scholarship is currently identified; the partial matches show possible improvement paths.'


def _profile_summary(analysis: AnalysisResponse) -> ProfilePresentation:
    profile = analysis.profile
    if profile is None:
        return ProfilePresentation(academic_profile=analysis.profile_summary, research_summary=_research_summary(analysis))
    academic = f'{profile.degree_level} applicant in {profile.field} with a reported academic result of {profile.gpa_or_percentage:g}.'
    budget = f'PKR {profile.budget_pkr:,.0f}' if profile.budget_pkr is not None else None
    return ProfilePresentation(
        academic_profile=academic,
        target_countries=profile.target_countries,
        budget=budget,
        research_summary=_research_summary(analysis),
    )


def _top_scholarships(analysis: AnalysisResponse) -> list[TopScholarshipPresentation]:
    eligible = [rec for rec in analysis.recommendations if rec.eligibility_status == 'Eligible']
    return [
        TopScholarshipPresentation(
            rank=rank,
            name=rec.name,
            country=next((m.country for m in analysis.match_results if m.opportunity_id == rec.opportunity_id), None),
            institution=next((m.provider for m in analysis.match_results if m.opportunity_id == rec.opportunity_id), None),
            eligibility=rec.eligibility_status,
            match_score=rec.score,
            deadline=_deadline(rec.deadline),
            why_suitable=_safe_why(rec, analysis.profile) if analysis.profile else rec.why_this_match,
            how_to_apply=_how_to_apply(rec),
            official_link=next((m.source_url for m in analysis.match_results if m.opportunity_id == rec.opportunity_id), None),
        )
        for rank, rec in enumerate(eligible[:3], start=1)
    ]


def _partial_matches(analysis: AnalysisResponse) -> list[PartialMatchPresentation]:
    output = []
    partials = sorted(
        (match for match in analysis.match_results if match.eligibility_status == 'Partial Match'),
        key=lambda match: match.total_score if match.score_breakdown else float('-inf'),
        reverse=True,
    )[:5]
    for match in partials:
        if match.eligibility_status != 'Partial Match':
            continue
        actions = []
        for reason in match.reasons_failed:
            action = action_for_reason(reason)
            if action:
                actions.append(action[0])
        output.append(PartialMatchPresentation(
            name=match.name,
            country=match.country,
            institution=match.provider,
            eligibility='Partially matching',
            match_score=match.total_score if match.score_breakdown else None,
            deadline=_deadline(match.deadline_raw),
            why_not_fully_eligible=match.reasons_failed,
            how_to_become_eligible=list(dict.fromkeys(actions)),
            official_link=match.source_url,
        ))
    return output


def _application_roadmap(analysis: AnalysisResponse) -> list[ApplicationRoadmapPresentation]:
    roadmap = []
    for priority, rec in enumerate(analysis.recommendations[:3], start=1):
        if rec.document_checklist.status == 'available':
            action = 'Confirm the current requirements and begin preparing the listed application documents.'
        else:
            action = 'Confirm the current eligibility requirements and begin preparing your application.'
        roadmap.append(ApplicationRoadmapPresentation(priority=priority, scholarship=rec.name, action=action))
    if not roadmap and analysis.gaps:
        for priority, gap in enumerate(analysis.gaps[:3], start=1):
            roadmap.append(ApplicationRoadmapPresentation(priority=priority, scholarship='Profile improvement', action=gap.recommended_action))
    return roadmap


def format_analysis_response(analysis: AnalysisResponse) -> FrontendAnalysisResponse:
    """Convert the internal pipeline result into the stable frontend contract."""
    return FrontendAnalysisResponse(
        profile_summary=_profile_summary(analysis),
        top_scholarships=_top_scholarships(analysis),
        partial_matches=_partial_matches(analysis),
        application_roadmap=_application_roadmap(analysis),
    )
