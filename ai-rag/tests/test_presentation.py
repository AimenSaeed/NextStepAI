import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from app.models import AnalysisResponse, LLMStatus, MatchResult, Recommendation, StudentProfile
from app.presentation import format_analysis_response


PROFILE = StudentProfile(
    gpa_or_percentage=3.71,
    field='Computer Science',
    degree_level='Masters',
    budget_pkr=100000,
    target_countries=['Germany', 'Canada', 'UK'],
    domicile_province='Punjab',
    income_bracket='Middle',
)


def match(i, name, status='Eligible', score=80.0, deadline='October 2026', url='https://official.example/apply'):
    return MatchResult(
        opportunity_id=i,
        name=name,
        source_url=url,
        deadline_raw=deadline,
        country='Germany',
        provider='Example University',
        eligibility_status=status,
        reasons_failed=['CGPA below minimum (3.71 < 3.8)'] if status == 'Partial Match' else [],
        score_breakdown={'academic_fit': score, 'total_score': score},
        total_score=score,
    )


def recommendation(m):
    return Recommendation(
        opportunity_id=m.opportunity_id,
        name=m.name,
        eligibility_status=m.eligibility_status,
        score=m.total_score,
        score_breakdown=m.score_breakdown,
        why_this_match='Member A classified this opportunity using the deterministic score.',
        deadline=m.deadline_raw,
        document_checklist={'status': 'unavailable', 'items': [], 'note': 'Not available from the official source'},
        actions=[f'Review the official application guidance for {m.name}.'],
    )


def analysis(matches, recommendations):
    return AnalysisResponse(
        profile_summary='Internal summary',
        strengths=[],
        gaps=[],
        roadmap={'summary': 'Internal roadmap', 'steps': []},
        recommendations=recommendations,
        limitations=['Provider diagnostics must remain internal.'],
        sources=[],
        llm_status=LLMStatus(configured=False, reason='provider_error'),
        profile=PROFILE,
        match_results=matches,
    )


def test_three_eligible_recommendations_are_limited_to_three():
    matches = [match(i, f'Scholarship {i}', score=90 - i) for i in range(1, 5)]
    result = format_analysis_response(analysis(matches, [recommendation(m) for m in matches]))
    assert len(result.top_scholarships) == 3
    assert [item.rank for item in result.top_scholarships] == [1, 2, 3]
    assert [item.match_score for item in result.top_scholarships] == [89.0, 88.0, 87.0]


def test_fewer_than_three_eligible_recommendations_are_not_padded():
    matches = [match(1, 'Only scholarship')]
    result = format_analysis_response(analysis(matches, [recommendation(matches[0])]))
    assert len(result.top_scholarships) == 1


def test_partial_matches_are_separate_and_have_supported_actions():
    partial = match(9, 'Partial scholarship', status='Partial Match', score=68.0)
    result = format_analysis_response(analysis([partial], []))
    assert result.top_scholarships == []
    assert len(result.partial_matches) == 1
    assert result.partial_matches[0].eligibility == 'Partially matching'
    assert result.partial_matches[0].why_not_fully_eligible == partial.reasons_failed
    assert result.partial_matches[0].how_to_become_eligible == ['Improve CGPA through remaining coursework.']


def test_partial_matches_are_capped_at_five_and_keep_existing_relevance_order():
    partials = [match(i, f'Partial {i}', status='Partial Match', score=60 + i) for i in range(1, 8)]
    result = format_analysis_response(analysis(partials, []))
    assert len(result.partial_matches) == 5
    assert [item.match_score for item in result.partial_matches] == [67.0, 66.0, 65.0, 64.0, 63.0]


def test_partial_immutable_mismatch_has_no_improvement_action():
    immutable = match(10, 'Undergraduate-only scholarship', status='Partial Match', score=70.0)
    immutable.reasons_failed = ['Degree level mismatch (offers Undergraduate)']
    result = format_analysis_response(analysis([immutable], []))
    assert result.partial_matches[0].how_to_become_eligible == []


def test_user_facing_summary_and_card_copy_are_concise_and_non_internal():
    eligible = match(1, 'Concise scholarship')
    result = format_analysis_response(analysis([eligible], [recommendation(eligible)]))
    card = result.top_scholarships[0]
    assert 'Based on your Masters academic background' in result.profile_summary.research_summary
    assert 'recorded match score' not in (card.why_suitable or '')
    assert 'Member A' not in (card.why_suitable or '')
    assert card.how_to_apply == 'Review the official eligibility requirements and application instructions.'
    assert len(result.application_roadmap[0].action) < len(card.how_to_apply) + 80


def test_no_partial_matches_returns_empty_list():
    eligible = match(1, 'Eligible scholarship')
    result = format_analysis_response(analysis([eligible], [recommendation(eligible)]))
    assert result.partial_matches == []


def test_missing_deadline_and_official_url_are_null():
    missing = match(1, 'Incomplete scholarship', deadline=None, url=None)
    result = format_analysis_response(analysis([missing], [recommendation(missing)]))
    card = result.top_scholarships[0]
    assert card.deadline is None
    assert card.official_link is None


def test_provider_failure_does_not_expose_internal_status_or_reason():
    eligible = match(1, 'Eligible scholarship')
    result = format_analysis_response(analysis([eligible], [recommendation(eligible)]))
    payload = result.model_dump()
    assert 'llm_status' not in payload
    assert 'limitations' not in payload
    assert 'Member A' not in (payload['top_scholarships'][0]['why_suitable'] or '')


def test_score_is_forwarded_without_recalculation():
    eligible = match(1, 'Scored scholarship', score=73.25)
    result = format_analysis_response(analysis([eligible], [recommendation(eligible)]))
    assert result.top_scholarships[0].match_score == eligible.total_score


def test_partial_score_is_forwarded_only_when_opportunity_score_exists():
    partial = match(1, 'Scored partial', status='Partial Match', score=68.0)
    result = format_analysis_response(analysis([partial], []))
    assert result.partial_matches[0].match_score == 68.0
    no_score = match(2, 'Unscored partial', status='Partial Match', score=0.0)
    no_score.score_breakdown = {}
    result = format_analysis_response(analysis([no_score], []))
    assert result.partial_matches[0].match_score is None
