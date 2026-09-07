CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    gpa_or_percentage REAL,
    field TEXT,
    degree_level TEXT,
    budget_pkr REAL,
    target_countries TEXT,
    career_goals TEXT,
    english_test_status TEXT,
    domicile_province TEXT,
    income_bracket TEXT
);

CREATE TABLE opportunities (
    opportunity_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    country TEXT NOT NULL,
    min_cgpa REAL,
    domicile_requirement TEXT,
    income_ceiling_pkr REAL,
    funding_type TEXT,
    deadline TEXT,
    degree_level TEXT,
    field_requirement TEXT,
    source_url TEXT,
    last_verified_date TEXT
);
