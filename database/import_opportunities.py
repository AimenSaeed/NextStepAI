import sqlite3
import csv
from pathlib import Path

# Use paths relative to this script so it works from any directory
DB_DIR = Path(__file__).resolve().parent
DB_PATH = DB_DIR / "nextstepai.db"
SCHEMA_PATH = DB_DIR / "schema.sql"
CSV_PATH = DB_DIR / "opportunities.csv"

# 1. Connect and create tables from schema.sql
connection = sqlite3.connect(DB_PATH)
cursor = connection.cursor()

with open(SCHEMA_PATH, "r", encoding="utf-8") as schema_file:
    cursor.executescript(schema_file.read())

# 2. Insert records from opportunities.csv
with open(CSV_PATH, "r", encoding="utf-8") as file:
    csv_reader = csv.DictReader(file)

    for row in csv_reader:
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
            row["opportunity_id"],
            row["name"],
            row["type"],
            row["country"],
            row["min_cgpa"] or None,
            row["domicile_requirement"],
            row["income_ceiling_pkr"] or None,
            row["funding_type"],
            row["deadline"],
            row["degree_level"],
            row["field_requirement"],
            row["source_url"],
            row["last_verified_date"] or None
        ))

connection.commit()
connection.close()

print(f"Database created and opportunities imported successfully at: {DB_PATH}")