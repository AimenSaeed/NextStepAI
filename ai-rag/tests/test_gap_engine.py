import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1]))

from app.gap_engine import profile_gaps
from app.models import MatchResult, StudentProfile

PROFILE = StudentProfile(gpa_or_percentage=3.71, field='Computer Science', degree_level='Masters', budget_pkr=1_000_000, target_countries=['Germany', 'Canada'], english_test_status='IELTS completed', domicile_province='Punjab', income_bracket='Middle')

def test_partial_cgpa_reason_creates_roadmap_ready_gap():
    partial = MatchResult(opportunity_id=22, name='DAAD Scholarships', eligibility_status='Partial Match', reasons_failed=['CGPA below minimum (3.71 < 3.8)'], total_score=88)
    gaps = profile_gaps(PROFILE, [partial])
    assert len(gaps) == 1
    assert gaps[0].gap == partial.reasons_failed[0]
    assert gaps[0].estimated_time is not None
    assert gaps[0].priority == 'High'

def test_structural_partial_reasons_are_excluded():
    partial = MatchResult(opportunity_id=6, name='PEEF', eligibility_status='Partial Match', reasons_failed=['Domicile mismatch (requires Sindh)'], total_score=80)
    assert profile_gaps(PROFILE, [partial]) == []

def test_country_and_degree_structural_reasons_are_excluded():
    partial = MatchResult(opportunity_id=7, name='Example', eligibility_status='Partial Match', reasons_failed=['Not in target countries (offered in UK)', 'Degree level mismatch (offers Undergraduate)'], total_score=99)
    assert profile_gaps(PROFILE, [partial]) == []

def test_actionable_gaps_are_capped_at_eight():
    partials = [MatchResult(opportunity_id=i, name=f'Opportunity {i}', eligibility_status='Partial Match', reasons_failed=[f'CGPA below minimum (3.71 < {3.8 + i / 100})'], total_score=100-i) for i in range(10)]
    assert len(profile_gaps(PROFILE, partials)) == 8
