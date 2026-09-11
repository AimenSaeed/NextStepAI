"""
scoring.py
----------
Weighted scoring across matched opportunities. Runs AFTER eligibility
filtering -- only opportunities that are "Eligible" or "Partial Match"
need a score (there's no point ranking things the student can't get).

Each sub-score is 0-100. Adjust WEIGHTS to change how much each
factor matters -- they should sum to 1.0.
"""

from .models import StudentProfile, Opportunity

WEIGHTS = {
    "academic_fit": 0.30,
    "field_fit": 0.20,
    "funding_fit": 0.25,
    "country_fit": 0.15,
    "domicile_fit": 0.10,
}


def _score_academic_fit(student: StudentProfile, opp: Opportunity) -> float:
    if opp.min_cgpa is None:
        return 70.0  # unknown requirement -- assume moderate fit, don't reward or punish
    margin = student.gpa_or_percentage - opp.min_cgpa
    if margin >= 0.5:
        return 100.0
    if margin >= 0:
        return 80.0
    if margin >= -0.3:
        return 40.0
    return 10.0


def _score_field_fit(student: StudentProfile, opp: Opportunity) -> float:
    if opp.field_requirement is None:
        return 90.0  # open to all fields -- good fit, slightly below an exact match
    return 100.0 if student.field.lower() in opp.field_requirement.lower() else 20.0


def _score_funding_fit(student: StudentProfile, opp: Opportunity) -> float:
    if opp.funding_type == "Full":
        return 100.0
    if opp.funding_type == "Partial":
        return 60.0
    return 40.0  # Unknown funding type


def _score_country_fit(student: StudentProfile, opp: Opportunity) -> float:
    if not student.target_countries:
        return 70.0  # no preference stated
    if opp.country in student.target_countries:
        return 100.0
    if opp.country == "Pakistan":
        return 40.0  # domestic program, but student explicitly requested overseas destinations
    return 20.0


def _score_domicile_fit(student: StudentProfile, opp: Opportunity) -> float:
    if opp.domicile_requirement == "any":
        return 100.0
    return 100.0 if opp.domicile_requirement == student.domicile_province else 0.0


def score_opportunity(student: StudentProfile, opp: Opportunity) -> dict:
    """Returns a dict of sub-scores plus a weighted total_score (0-100)."""
    breakdown = {
        "academic_fit": _score_academic_fit(student, opp),
        "field_fit": _score_field_fit(student, opp),
        "funding_fit": _score_funding_fit(student, opp),
        "country_fit": _score_country_fit(student, opp),
        "domicile_fit": _score_domicile_fit(student, opp),
    }
    total = sum(breakdown[k] * WEIGHTS[k] for k in WEIGHTS)
    breakdown["total_score"] = round(total, 1)
    return breakdown
