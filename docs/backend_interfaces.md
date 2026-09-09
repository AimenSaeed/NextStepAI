# NextStep AI — Backend Interface Contract

This document describes exactly how to talk to the matching engine
(owned by Aimen — Member A). If you're building the frontend or the
AI layer, this is the only file you need to read to integrate.

Base URL (when running locally): `http://127.0.0.1:8000`

---

## POST /match

Send a student's profile, get back every scholarship ranked by fit.

### Request body (JSON)

```json
{
  "gpa_or_percentage": 3.4,
  "field": "Computer Science",
  "degree_level": "Undergraduate",
  "budget_pkr": 500000,
  "target_countries": ["Germany", "UK"],
  "career_goals": "Software Engineer",
  "english_test_status": "IELTS 6.5",
  "domicile_province": "Punjab",
  "income_bracket": "Middle"
}
```

**Required fields:** `gpa_or_percentage`, `field`, `degree_level`, `domicile_province`, `income_bracket`
**Optional fields:** `budget_pkr`, `target_countries` (defaults to empty list — meaning no country preference), `career_goals`, `english_test_status`, `student_id`

**Allowed values:**
- `degree_level`: `"Intermediate"` | `"Undergraduate"` | `"Masters"` | `"PhD"`
- `income_bracket`: `"Low"` | `"Middle"` | `"High"`
- `domicile_province`: `"Punjab"` | `"Sindh"` | `"Khyber Pakhtunkhwa"` | `"Balochistan"` | `"AJK"` | `"Gilgit-Baltistan"` | `"Islamabad"` | `"FATA"`

### Response body (JSON array)

```json
[
  {
    "opportunity_id": 1,
    "name": "HEC Ehsaas Undergraduate Scholarship",
    "eligibility_status": "Eligible",
    "reasons_failed": [],
    "score_breakdown": {
      "academic_fit": 70.0,
      "field_fit": 90.0,
      "funding_fit": 100.0,
      "country_fit": 100.0,
      "domicile_fit": 100.0,
      "total_score": 89.0
    },
    "total_score": 89.0
  }
]
```

**Field meanings:**
- `eligibility_status`: one of `"Eligible"`, `"Partial Match"`, `"Not Eligible"`
- `reasons_failed`: human-readable strings explaining why (empty list if fully eligible) — safe to show directly to the student
- `score_breakdown`: empty object `{}` when `eligibility_status` is `"Not Eligible"` (we don't bother scoring things the student can't get)
- `total_score`: 0–100, higher is a better match. `0.0` for Not Eligible results
- **The array is already sorted** — best matches first, Not Eligible results pushed to the bottom. You don't need to re-sort on the frontend.

---

## GET /opportunities/count

Quick health check — returns how many scholarships are currently loaded.

```json
{ "count": 38 }
```

---

## POST /admin/refresh-data

Call this after the scholarship spreadsheet has been updated with new
rows, so the API picks up new data without restarting the server.

```json
{ "status": "refreshed", "count": 39 }
```

---

## Known limitations (for now)

- Data currently comes from an Excel spreadsheet, not the real
  database — this will change once the database module is ready, but
  **the request/response shape above will not change** when that
  happens. Integrate against this contract now with confidence.
- Deadlines are not yet returned in a structured format (real
  deadlines in the source data are inconsistent free text, e.g.
  "Opens ~August, closes ~November") — this is a planned improvement,
  not yet in the API.

## Questions?

Ask Aimen (Member A) before assuming behavior not documented here.
