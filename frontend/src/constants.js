// constants.js
// ---------------------------------------------------------------
// These option lists MUST match the exact strings Aimen's backend
// checks against (see backend/eligibility.py, models.py, data_loader.py).
// If a value here doesn't match her keyword tables exactly, her
// code will silently treat it as "any"/unmatched instead of erroring —
// so keep this file in sync with her PROVINCE_KEYWORDS / COUNTRY_KEYWORDS
// / DEGREE_LEVEL_KEYWORDS if she adds new ones.
// ---------------------------------------------------------------

export const DEGREE_LEVELS = ["Intermediate", "Undergraduate", "Masters", "PhD"];

export const INCOME_BRACKETS = ["Low", "Middle", "High"];

// Canonical province names from her PROVINCE_KEYWORDS values
export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "AJK",
  "Gilgit-Baltistan",
  "Islamabad",
  "FATA",
];

// Canonical country names from her COUNTRY_KEYWORDS values.
// Multi-select — student can pick none (any country) or several.
export const COUNTRIES = ["Pakistan", "USA", "UK", "Germany", "China", "Turkey", "Australia", "Japan", "South Korea", "EU"];

// Maps her eligibility_status strings to the UI's internal status key
export const STATUS_MAP = {
  Eligible: "eligible",
  "Partial Match": "partial",
  "Not Eligible": "ineligible",
};

export const STATUS_STYLE = {
  eligible: { label: "Eligible", text: "text-emerald-800", border: "border-emerald-700", bg: "bg-emerald-50" },
  partial: { label: "Partial match", text: "text-amber-800", border: "border-amber-700", bg: "bg-amber-50" },
  ineligible: { label: "Not eligible", text: "text-rose-800", border: "border-rose-700", bg: "bg-rose-50" },
};

// Her actual 5 scoring categories (scoring.py WEIGHTS) — NOT the 4
// generic ones from the earlier mockup. Keep in sync if she changes WEIGHTS.
export const SCORE_FIELDS = [
  { key: "academic_fit", label: "Academic fit" },
  { key: "field_fit", label: "Field fit" },
  { key: "funding_fit", label: "Funding fit" },
  { key: "country_fit", label: "Country fit" },
  { key: "domicile_fit", label: "Domicile fit" },
];

export const AGENT_FEE_TABLE = { shortlisting: 45000, sop: 35000, applicationSupport: 65000 };
export const SAVINGS_TOTAL = AGENT_FEE_TABLE.shortlisting + AGENT_FEE_TABLE.sop + AGENT_FEE_TABLE.applicationSupport;
