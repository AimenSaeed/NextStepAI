"""
data_loader.py
---------------
Turns the messy scholarship spreadsheet into clean Opportunity objects.

WHY THIS FILE EXISTS:
Real scholarship data is written in free text ("Need-based (NSER
registered)", "Opens ~August, closes ~November"). If eligibility.py or
scoring.py had to understand that text directly, adding one weird new
scholarship could break everything. Instead, ALL the messy parsing
lives here, in one place. Everything downstream only ever sees clean
Opportunity objects.

HOW TO EXTEND THIS FOR NEW SCHOLARSHIPS:
- New country? Add it to COUNTRY_KEYWORDS below.
- New province spelling? Add it to PROVINCE_KEYWORDS.
- New way of writing "need-based"? Add the phrase to NEED_BASED_PHRASES.
You should almost never need to touch eligibility.py or scoring.py
just because new scholarships were added to the spreadsheet.
"""

import re
from pathlib import Path
from typing import List, Optional

import pandas as pd

from .models import Opportunity

# ---------------------------------------------------------------------
# Keyword tables -- extend these as new scholarships/countries appear
# ---------------------------------------------------------------------

PROVINCE_KEYWORDS = {
    "punjab": "Punjab",
    "sindh": "Sindh",
    "khyber pakhtunkhwa": "Khyber Pakhtunkhwa",
    "kpk": "Khyber Pakhtunkhwa",
    "balochistan": "Balochistan",
    "ajk": "AJK",
    "gilgit": "Gilgit-Baltistan",
    "gb": "Gilgit-Baltistan",
    "ict": "Islamabad",
    "islamabad": "Islamabad",
    "fata": "FATA",
}

COUNTRY_KEYWORDS = {
    "usa": "USA", "u.s.": "USA", "united states": "USA",
    "uk": "UK", "united kingdom": "UK",
    "germany": "Germany", "daad": "Germany",
    "china": "China", "chinese": "China",
    "turkey": "Turkey", "turkiye": "Turkey",
    "australia": "Australia",
    "japan": "Japan", "mext": "Japan",
    "korea": "South Korea",
    "european union": "EU", "erasmus": "EU",
}

NEED_BASED_PHRASES = [
    "need-based", "need based", "financial need", "low income",
    "low-income", "underprivileged", "household income", "deserving",
    "hardship", "orphans",
]

FULL_FUNDING_PHRASES = ["100%", "full tuition", "fully funded", "full funded"]
PARTIAL_FUNDING_PHRASES = ["partial", "waiver", "loan"]

DEGREE_LEVEL_KEYWORDS = {
    "intermediate": "Intermediate",
    "undergraduate": "Undergraduate",
    "master": "Masters",
    "phd": "PhD",
    "dphil": "PhD",
    "school": "School",
}


def _extract_cgpa(text: str) -> Optional[float]:
    """Pull a numeric GPA out of free text like '3.7+ GPA equivalent'."""
    if not text:
        return None
    match = re.search(r"(\d\.\d)\s*\+?\s*(gpa|cgpa)?", text, re.IGNORECASE)
    if match:
        return float(match.group(1))
    return None


def _extract_country(name: str, provider: str) -> str:
    combined = f"{name} {provider}".lower()
    for keyword, country in COUNTRY_KEYWORDS.items():
        if keyword in combined:
            return country
    return "Pakistan"  # default: most rows in this sheet are Pakistan-based


def _extract_domicile(text: str) -> str:
    if not text:
        return "any"
    lower = text.lower()
    if "all provinces" in lower and not any(k in lower for k in PROVINCE_KEYWORDS if k not in ("ict", "gb")):
        return "any"
    for keyword, province in PROVINCE_KEYWORDS.items():
        if keyword in lower:
            return province
    return "any"


def _extract_degree_levels(text: str) -> List[str]:
    if not text:
        return []
    lower = text.lower()
    found = set()
    for keyword, level in DEGREE_LEVEL_KEYWORDS.items():
        if keyword in lower:
            found.add(level)
    return sorted(found) if found else ["Unspecified"]


def _extract_is_need_based(eligibility_text: str) -> bool:
    if not eligibility_text:
        return False
    lower = eligibility_text.lower()
    return any(phrase in lower for phrase in NEED_BASED_PHRASES)


def _extract_funding_type(amount_text: str) -> str:
    if not amount_text:
        return "Unknown"
    lower = amount_text.lower()
    if any(p in lower for p in FULL_FUNDING_PHRASES):
        return "Full"
    if any(p in lower for p in PARTIAL_FUNDING_PHRASES):
        return "Partial"
    return "Unknown"


def _extract_field_requirement(text: str) -> Optional[str]:
    if not text:
        return None
    lower = text.lower()
    if "all disciplines" in lower or "all fields" in lower or "any field" in lower:
        return None
    return text.strip()


def load_opportunities(excel_path: str) -> List[Opportunity]:
    """
    Reads the raw scholarship Excel sheet and returns a list of
    normalized Opportunity objects. This is the ONLY function the
    rest of the app should call to get opportunity data.
    """
    df = pd.read_excel(excel_path, sheet_name="Scholarships")
    opportunities = []

    for idx, row in df.iterrows():
        name = str(row.get("Scholarship Name", "")).strip()
        provider = str(row.get("Provider/Category", "")).strip()
        eligibility_text = str(row.get("Min CGPA / Eligibility", "") or "")
        amount_text = str(row.get("Amount / Coverage", "") or "")
        province_text = str(row.get("Province/Domicile", "") or "")
        level_text = str(row.get("Level", "") or "")
        field_text = str(row.get("Field of Study", "") or "")
        deadline_text = str(row.get("Deadline (typical)", "") or "")
        url = str(row.get("Official Apply Link", "") or "")
        notes = str(row.get("Notes", "") or "")

        opportunities.append(Opportunity(
            opportunity_id=idx + 1,
            name=name,
            provider=provider,
            country=_extract_country(name, provider),
            min_cgpa=_extract_cgpa(eligibility_text),
            is_need_based=_extract_is_need_based(eligibility_text),
            domicile_requirement=_extract_domicile(province_text),
            degree_levels=_extract_degree_levels(level_text),
            field_requirement=_extract_field_requirement(field_text),
            funding_type=_extract_funding_type(amount_text),
            deadline_raw=deadline_text if deadline_text.lower() != "nan" else None,
            source_url=url if url.lower() != "nan" else None,
            notes=notes if notes.lower() != "nan" else None,
        ))

    return opportunities


# Simple in-memory cache so we don't re-read/re-parse the Excel file
# on every single API request.
_CACHE: Optional[List[Opportunity]] = None


def get_opportunities(excel_path: Optional[str] = None) -> List[Opportunity]:
    global _CACHE
    if _CACHE is None:
        if excel_path is None:
            excel_path = str(Path(__file__).parent.parent / "data" / "Pakistan_Scholarships_Research.xlsx")
        _CACHE = load_opportunities(excel_path)
    return _CACHE


def refresh_cache(excel_path: Optional[str] = None) -> List[Opportunity]:
    """Call this after the spreadsheet is updated with new scholarships."""
    global _CACHE
    _CACHE = None
    return get_opportunities(excel_path)
