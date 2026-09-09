from .models import MatchResult, StudentProfile

def deterministic_profile_observations(p: StudentProfile, matches: list[MatchResult] | None = None) -> tuple[list[str], list[str], list[str]]:
    matches = matches or []
    strengths = [
        f'Reported academic result: {p.gpa_or_percentage:g}.',
        f'Declared field of study: {p.field}.',
    ]
    if p.target_countries:
        strengths.append(f'Declared target countries: {", ".join(p.target_countries)}.')
    if p.budget_pkr is not None:
        strengths.append(f'Available budget supplied: PKR {p.budget_pkr:g}.')

    breakdowns = [m.score_breakdown for m in matches if m.score_breakdown]
    for key, label in (
        ('academic_fit', 'academic fit'),
        ('field_fit', 'field fit'),
        ('funding_fit', 'funding fit'),
        ('country_fit', 'country fit'),
        ('domicile_fit', 'domicile fit'),
    ):
        values = [float(b[key]) for b in breakdowns if key in b]
        if values and max(values) >= 80:
            strengths.append(f'{label.capitalize()} reaches {max(values):g}/100 in the returned match scores.')

    gaps, limitations = [], []
    if p.budget_pkr is None: gaps.append('No study budget was provided.')
    if not p.english_test_status: gaps.append('No English-test status was provided.')
    if not p.target_countries: limitations.append('No target countries were provided; Member A did not use a country preference filter.')
    if not p.career_goals: limitations.append('No career goals were provided, so career guidance is general.')
    return strengths, gaps, limitations
