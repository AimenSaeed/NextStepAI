"""
matching.py
-----------
Orchestrates the whole pipeline for one student:
  1. Load normalized opportunities (cached after first load)
  2. Run eligibility filter on every opportunity
  3. Score the ones that are Eligible or Partial Match
  4. Return them ranked, best match first

This is the one function your FastAPI endpoint (main.py) should call.
"""

from typing import List
from .models import StudentProfile, MatchResult
from .data_loader import get_opportunities
from .eligibility import check_eligibility
from .scoring import score_opportunity


def get_matches(student: StudentProfile) -> List[MatchResult]:
    opportunities = get_opportunities()
    results: List[MatchResult] = []

    for opp in opportunities:
        status, reasons = check_eligibility(student, opp)

        if status == "Not Eligible":
            # Still include it, but with no score -- the frontend can
            # choose to hide these or show them greyed out with reasons.
            results.append(MatchResult(
                opportunity_id=opp.opportunity_id,
                name=opp.name,
                source_url=opp.source_url,
                deadline_raw=opp.deadline_raw,
                country=opp.country,
                provider=opp.provider,
                eligibility_status=status,
                reasons_failed=reasons,
                score_breakdown={},
                total_score=0.0,
            ))
            continue

        breakdown = score_opportunity(student, opp)
        results.append(MatchResult(
            opportunity_id=opp.opportunity_id,
            name=opp.name,
            source_url=opp.source_url,
            deadline_raw=opp.deadline_raw,
            country=opp.country,
            provider=opp.provider,
            eligibility_status=status,
            reasons_failed=reasons,
            score_breakdown=breakdown,
            total_score=breakdown["total_score"],
        ))

    # Rank: Eligible/Partial by score descending, Not Eligible pushed to the bottom
    results.sort(key=lambda r: (r.eligibility_status == "Not Eligible", -r.total_score))
    return results
