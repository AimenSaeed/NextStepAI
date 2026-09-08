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
import sqlite3
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


def _normalize_row(opportunity_id: int, name: str, provider: str,
                    eligibility_text: str, amount_text: str, province_text: str,
                    level_text: str, field_text: str, deadline_text: str,
                    url: str, notes: str) -> Opportunity:
    """
    Turns one raw row (however it was sourced -- Excel or SQLite) into
    a clean Opportunity object. All parsing logic lives here, in one
    place, regardless of where the raw data came from.
    """
    def clean(text):
        return None if text is None or str(text).strip().lower() in ("", "nan", "none") else str(text)

    return Opportunity(
        opportunity_id=opportunity_id,
        name=name.strip(),
        provider=clean(provider),
        country=_extract_country(name, provider or ""),
        min_cgpa=_extract_cgpa(eligibility_text or ""),
        is_need_based=_extract_is_need_based(eligibility_text or ""),
        domicile_requirement=_extract_domicile(province_text or ""),
        degree_levels=_extract_degree_levels(level_text or ""),
        field_requirement=_extract_field_requirement(field_text or ""),
        funding_type=_extract_funding_type(amount_text or ""),
        deadline_raw=clean(deadline_text),
        source_url=clean(url),
        notes=clean(notes),
    )


def load_opportunities_from_excel(excel_path: str) -> List[Opportunity]:
    """Reads the raw scholarship Excel sheet (used before the database was ready)."""
    df = pd.read_excel(excel_path, sheet_name="Scholarships")
    opportunities = []
    for idx, row in df.iterrows():
        opportunities.append(_normalize_row(
            opportunity_id=idx + 1,
            name=str(row.get("Scholarship Name", "")),
            provider=str(row.get("Provider/Category", "")),
            eligibility_text=str(row.get("Min CGPA / Eligibility", "")),
            amount_text=str(row.get("Amount / Coverage", "")),
            province_text=str(row.get("Province/Domicile", "")),
            level_text=str(row.get("Level", "")),
            field_text=str(row.get("Field of Study", "")),
            deadline_text=str(row.get("Deadline (typical)", "")),
            url=str(row.get("Official Apply Link", "")),
            notes=str(row.get("Notes", "")),
        ))
    return opportunities


def load_opportunities_from_db(db_path: str) -> List[Opportunity]:
    """
    Reads the opportunities table from the shared SQLite database and
    normalizes each row. Column names here match the teammate's actual
    schema (min_cgpa, income_ceiling_pkr, etc. are TEXT columns holding
    the full raw eligibility sentence, not pre-cleaned numbers).
    """
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    cursor.execute("""
        SELECT opportunity_id, name, type, country, min_cgpa,
               domicile_requirement, income_ceiling_pkr, funding_type,
               deadline, degree_level, field_requirement, source_url,
               last_verified_date
        FROM opportunities
    """)
    rows = cursor.fetchall()
    connection.close()

    opportunities = []
    for row in rows:
        # min_cgpa and income_ceiling_pkr are raw sentences here (e.g.
        # "3.7+ GPA equivalent", "household income <= Rs.60,000/month"),
        # so we combine them into one eligibility_text blob for parsing --
        # same as the raw-text schema, just split across two DB columns.
        eligibility_text = " ".join(filter(None, [row["min_cgpa"], row["income_ceiling_pkr"]]))

        opportunities.append(_normalize_row(
            opportunity_id=row["opportunity_id"],
            name=row["name"] or "",
            provider=row["type"],
            eligibility_text=eligibility_text,
            amount_text=row["funding_type"],
            province_text=row["domicile_requirement"],
            level_text=row["degree_level"],
            field_text=row["field_requirement"],
            deadline_text=row["deadline"],
            url=row["source_url"],
            notes=row["last_verified_date"],
        ))
        # country comes straight from the DB now instead of being guessed
        # from name/provider text, since her table has a real column for it.
        if row["country"]:
            opportunities[-1].country = row["country"]
    return opportunities


# Simple in-memory cache so we don't re-read/re-parse the source data
# on every single API request.
_CACHE: Optional[List[Opportunity]] = None

_DATA_DIR = Path(__file__).parent.parent / "data"
_DB_PATH = _DATA_DIR / "nextstepai.db"
_EXCEL_PATH = _DATA_DIR / "Pakistan_Scholarships_Research.xlsx"


def get_opportunities() -> List[Opportunity]:
    """
    Loads from the shared SQLite database if it exists (the real,
    up-to-date source once your teammate delivers it). Falls back to
    the Excel file if the database isn't there yet -- so the app keeps
    working today and switches over automatically with no code change
    once the database file shows up in data/.
    """
    global _CACHE
    if _CACHE is None:
        if _DB_PATH.exists():
            _CACHE = load_opportunities_from_db(str(_DB_PATH))
        else:
            _CACHE = load_opportunities_from_excel(str(_EXCEL_PATH))
    return _CACHE


def refresh_cache() -> List[Opportunity]:
    """Call this after the spreadsheet/database is updated with new scholarships."""
    global _CACHE
    _CACHE = None
    return get_opportunities()
