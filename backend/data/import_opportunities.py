"""
import_opportunities.py
------------------------
Loads the scholarship spreadsheet (exported as CSV) into the
opportunities table.

IMPORTANT for whoever fills in the spreadsheet -> CSV -> this import:
min_cgpa and income_ceiling_pkr are TEXT columns. Paste the FULL
original sentence from the spreadsheet in there (e.g. "3.7+ GPA
equivalent", "household income <= Rs.60,000/month") -- do NOT try to
convert it into a clean number yourself. The backend (Aimen's code)
already handles turning that sentence into a usable number -- typing
in your own cleaned-up number here would create a second, possibly
different, version of the same fact.

Run this any time the spreadsheet is updated with new scholarships --
it's safe to re-run (INSERT OR REPLACE means old rows get overwritten,
not duplicated).

Usage:
    python import_opportunities.py
"""

import sqlite3
import csv

DB_PATH = "nextstepai.db"
CSV_PATH = "opportunities.csv"

connection = sqlite3.connect(DB_PATH)
cursor = connection.cursor()

with open(CSV_PATH, "r", encoding="utf-8") as file:
    csv_reader = csv.DictReader(file)
    for i, row in enumerate(csv_reader, start=1):
        cursor.execute("""
            INSERT OR REPLACE INTO opportunities (
                opportunity_id,
                name,
                type,
                country,
                min_cgpa,
                domicile_requirement,
                income_ceiling_pkr,
                funding_type,
                deadline,
                degree_level,
                field_requirement,
                source_url,
                last_verified_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            i,
            row["Scholarship Name"],
            row.get("Provider/Category"),
            row.get("Country", "Pakistan"),
            row.get("Min CGPA / Eligibility"),   # full sentence, not a number
            row.get("Province/Domicile"),
            None,                                  # income info usually inside the same eligibility sentence
            row.get("Amount / Coverage"),
            row.get("Deadline (typical)"),
            row.get("Level"),
            row.get("Field of Study"),
            row.get("Official Apply Link"),
            row.get("Last Verified"),
        ))

connection.commit()
connection.close()
print("Opportunities imported successfully!")
