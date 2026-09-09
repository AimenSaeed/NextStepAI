import re
from .models import GapItem, MatchResult, StudentProfile

MAX_GAPS = 8

def _action_for_reason(reason: str) -> tuple[str, str | None] | None:
    """Accept only Member A blockers a student can realistically address."""
    lower = reason.lower()
    if reason.startswith('CGPA below minimum'):
        return ACTION_TIMES['cgpa']
    if any(term in lower for term in ('ielts', 'toefl', 'english test', 'language test')):
        return ACTION_TIMES['english_test']
    if re.search(r'\b(?:gre|gmat)\b', lower):
        return ('Prepare for and complete the required admissions test.', None)
    if any(term in lower for term in ('missing document', 'document required', 'transcript', 'recommendation letter')):
        return ('Prepare and submit the required application document.', None)
    if ('need-based' in lower or 'financial' in lower) and any(term in lower for term in ('missing', 'provide', 'proof', 'document')):
        return ('Collect and provide the requested financial-need documentation.', None)
    return None


def action_for_reason(reason: str) -> tuple[str, str | None] | None:
    """Public presentation-layer access to the curated gap action lookup."""
    return _action_for_reason(reason)

ACTION_TIMES = {'english_test': ('Prepare for and sit an English-language test.', '6–10 weeks'), 'budget': ('Set a realistic budget and collect funding evidence.', '1–2 weeks'), 'cgpa': ('Improve CGPA through remaining coursework.', '1–2 semesters')}
def _partial_match_gap(match: MatchResult, reason: str) -> GapItem | None:
    """Use Member A's reason verbatim; never re-evaluate eligibility here."""
    action_data = _action_for_reason(reason)
    if action_data is None:
        return None
    action, estimate = action_data
    return GapItem(
        criterion=f'Partial Match: {match.name}',
        gap=reason,
        recommended_action=action,
        estimated_time=estimate,
        priority='High' if match.total_score >= 70 else 'Medium',
    )


def profile_gaps(p: StudentProfile, partial_matches: list[MatchResult] | None = None) -> list[GapItem]:
    out=[]
    if not p.english_test_status:
        out.append(GapItem(criterion='English test status', gap='No English-test status was provided; Member B cannot assess this profile field for opportunities that require language evidence.', recommended_action=ACTION_TIMES['english_test'][0], estimated_time=ACTION_TIMES['english_test'][1], priority='High'))
    if p.budget_pkr is None:
        out.append(GapItem(criterion='Budget', gap='No budget was provided; funding fit cannot be personalized for opportunities with partial or unknown funding.', recommended_action=ACTION_TIMES['budget'][0], estimated_time=ACTION_TIMES['budget'][1], priority='Medium'))
    for match in sorted(partial_matches or [], key=lambda item: item.total_score, reverse=True):
        for reason in match.reasons_failed:
            gap = _partial_match_gap(match, reason)
            if gap is not None and len(out) < MAX_GAPS:
                out.append(gap)
    return out[:MAX_GAPS]
