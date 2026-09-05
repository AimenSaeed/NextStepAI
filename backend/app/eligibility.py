"""
eligibility.py
---------------
Hard-rule eligibility filtering. Works ONLY with clean, normalized
Opportunity objects (see data_loader.py) -- never touches raw text.

Adding a new rule (e.g. "English test required")? Add one function
below in the same shape as the existing checks, then add it to
RULES at the bottom. Nothing else in the system needs to change.
"""

from typing import List, Tuple
from .models import StudentProfile, Opportunity

INCOME_ESTIMATE_PKR = {"Low": 300_000, "Middle": 800_000, "High": 2_000_000}


def _check_cgpa(student: StudentProfile, opp: Opportunity) -> str | None:
    if opp.min_cgpa is None:
        return None  # can't check what wasn't stated numerically -- don't penalize
    if student.gpa_or_percentage < opp.min_cgpa:
        return f"CGPA below minimum ({student.gpa_or_percentage} < {opp.min_cgpa})"
    return None


def _check_domicile(student: StudentProfile, opp: Opportunity) -> str | None:
    if opp.domicile_requirement == "any":
        return None
    if opp.domicile_requirement != student.domicile_province:
        return f"Domicile mismatch (requires {opp.domicile_requirement})"
    return None


def _check_income(student: StudentProfile, opp: Opportunity) -> str | None:
    if not opp.is_need_based:
        return None
    # Need-based scholarships favor lower income -- flag high income as a
    # soft mismatch rather than a hard fail, since exact thresholds are
    # rarely given as clean numbers in this dataset.
    if student.income_bracket == "High":
        return "Likely not a fit: scholarship is need-based, student income bracket is High"
    return None


def _check_degree_level(student: StudentProfile, opp: Opportunity) -> str | None:
    if not opp.degree_levels or "Unspecified" in opp.degree_levels:
        return None
    if student.degree_level not in opp.degree_levels:
        return f"Degree level mismatch (offers {', '.join(opp.degree_levels)})"
    return None


def _check_field(student: StudentProfile, opp: Opportunity) -> str | None:
    if opp.field_requirement is None:
        return None  # None means "open to all fields"
    if student.field.lower() not in opp.field_requirement.lower():
        return f"Field mismatch (requires {opp.field_requirement})"
    return None


def _check_country(student: StudentProfile, opp: Opportunity) -> str | None:
    if not student.target_countries:
        return None  # student didn't specify a preference -- don't filter on it
    if opp.country == "Pakistan":
        return None  # in-country programs are always shown regardless of target_countries
    if opp.country not in student.target_countries:
        return f"Not in target countries (offered in {opp.country})"
    return None


# The full list of rules applied to every opportunity. Add new checks here.
RULES = [_check_cgpa, _check_domicile, _check_income, _check_degree_level, _check_field, _check_country]


def check_eligibility(student: StudentProfile, opp: Opportunity) -> Tuple[str, List[str]]:
    """
    Runs every rule in RULES against one student + one opportunity.
    Returns (status, reasons_failed).

    0 failed reasons  -> "Eligible"
    1 failed reason   -> "Partial Match"
    2+ failed reasons -> "Not Eligible"
    """
    reasons_failed = []
    for rule in RULES:
        reason = rule(student, opp)
        if reason:
            reasons_failed.append(reason)

    if len(reasons_failed) == 0:
        status = "Eligible"
    elif len(reasons_failed) == 1:
        status = "Partial Match"
    else:
        status = "Not Eligible"

    return status, reasons_failed
