"""
Data models for NextStep AI.

These define the exact shape of data flowing through the system.
If your teammate's database uses different column names, translate
into these shapes at the boundary (in data_loader.py or your DB
query layer) -- the rest of the system should never need to change.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    """What we collect from a student via the intake form."""
    student_id: Optional[int] = None
    gpa_or_percentage: float
    field: str
    degree_level: str  # "Undergraduate" | "Masters" | "PhD" | "Intermediate"
    budget_pkr: Optional[float] = None
    target_countries: List[str] = Field(default_factory=list)
    career_goals: Optional[str] = None
    english_test_status: Optional[str] = None
    domicile_province: str
    income_bracket: str  # "Low" | "Middle" | "High"


class Opportunity(BaseModel):
    """
    A single scholarship or program, AFTER normalization.
    This is the clean, structured shape -- data_loader.py is
    responsible for turning messy spreadsheet text into this.
    """
    opportunity_id: int
    name: str
    provider: Optional[str] = None
    country: str                       # "Pakistan" or the overseas country
    min_cgpa: Optional[float] = None   # None if not stated numerically
    is_need_based: bool = False        # True if eligibility is need/income driven
    domicile_requirement: str          # "any" or a specific province
    degree_levels: List[str] = Field(default_factory=list)  # e.g. ["Undergraduate"]
    field_requirement: Optional[str] = None  # None means "all fields"
    funding_type: str = "Unknown"      # "Full" | "Partial" | "Unknown"
    deadline_raw: Optional[str] = None  # kept as text -- real deadlines are messy
    source_url: Optional[str] = None
    notes: Optional[str] = None


class MatchResult(BaseModel):
    opportunity_id: int
    name: str
    source_url: Optional[str] = None
    deadline_raw: Optional[str] = None
    country: Optional[str] = None
    provider: Optional[str] = None
    eligibility_status: str            # "Eligible" | "Partial Match" | "Not Eligible"
    reasons_failed: List[str] = Field(default_factory=list)
    score_breakdown: dict = Field(default_factory=dict)
    total_score: float = 0.0
