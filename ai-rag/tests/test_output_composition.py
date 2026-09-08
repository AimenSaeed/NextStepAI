import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))

from app.models import EvidenceItem, ExplanationOutput, MatchResult, Recommendation
from app.service import _document_checklist, _fallback_actions, _roadmap


def recommendation(name: str, score: float) -> Recommendation:
    match = MatchResult(
        opportunity_id=int(score),
        name=name,
        source_url=f'https://official.example/{score}',
        deadline_raw='October 2026',
        eligibility_status='Eligible',
        score_breakdown={'academic_fit': 90.0, 'field_fit': 85.0, 'total_score': score},
        total_score=score,
    )
    return Recommendation(
        opportunity_id=match.opportunity_id,
        name=match.name,
        eligibility_status=match.eligibility_status,
        score=match.total_score,
        score_breakdown=match.score_breakdown,
        why_this_match='Grounded explanation.',
        deadline=match.deadline_raw,
        document_checklist=_document_checklist([]),
        actions=_fallback_actions(match, []),
    )


def test_strong_profile_roadmap_is_short_and_nonempty():
    roadmap = _roadmap([recommendation('Top scholarship', 92)], [], [])
    assert roadmap.summary
    assert len(roadmap.steps) == 1


def test_weak_profile_roadmap_explains_gap_and_has_timeline():
    from app.models import GapItem

    gap = GapItem(
        criterion='English test status',
        gap='No English-test status was provided.',
        recommended_action='Prepare for and sit an English-language test.',
        estimated_time='6–10 weeks',
        priority='High',
    )
    roadmap = _roadmap([], [gap], [])
    assert 'No Eligible' in roadmap.summary
    assert roadmap.steps[0].reason == gap.gap
    assert roadmap.steps[0].estimated_time == '6–10 weeks'


def test_deadline_passthrough_and_missing_deadline_are_null():
    assert recommendation('With deadline', 90).deadline == 'October 2026'
    match = MatchResult(opportunity_id=1, name='No deadline', eligibility_status='Eligible')
    assert match.deadline_raw is None


def test_document_checklist_is_honest_when_evidence_is_absent():
    checklist = _document_checklist([])
    assert checklist.status == 'unavailable'
    assert checklist.items == []
    assert checklist.note == 'Not available from the official source'


def test_document_checklist_only_uses_explicit_evidence_requirements():
    evidence = [EvidenceItem(
        source_url='https://official.example',
        source_version=1,
        retrieved_at=datetime.now(timezone.utc),
        excerpt='Applicants must submit academic transcripts and two recommendation letters.',
    )]
    checklist = _document_checklist(evidence)
    assert checklist.status == 'available'
    assert checklist.items == ['Academic transcripts', 'Recommendation or reference letters']


def test_fallback_actions_are_per_opportunity_not_placeholder_text():
    first = recommendation('First scholarship', 90).actions
    second = recommendation('Second scholarship', 80).actions
    assert first
    assert second
    assert first != second


def test_explanation_requires_nonempty_validated_actions():
    assert ExplanationOutput.model_validate({'why_this_match': 'Grounded.', 'actions': ['Review the official source.']})
    with pytest.raises(ValueError):
        ExplanationOutput.model_validate({'why_this_match': 'Grounded.', 'actions': []})
