import sqlite3
import csv

# Connect to the existing database
connection = sqlite3.connect("nextstepai.db")
cursor = connection.cursor()

# Open the CSV file
with open("opportunities.csv", "r", encoding="utf-8") as file:
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

print("Opportunities imported successfully!")