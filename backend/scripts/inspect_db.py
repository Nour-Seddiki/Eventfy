import os
from sqlalchemy import create_engine, text

# Get from .env or hardcode for inspection
DB_HOST="aws-1-eu-north-1.pooler.supabase.com"
DB_PORT=6543
DB_USER="postgres.lokbyexvugoctnliwmcy"
DB_PASSWORD="Rqyqne2026/"
DB_NAME="postgres"

engine = create_engine(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

with engine.connect() as conn:
    # Get all tables
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
    tables = [row[0] for row in result]
    print("Tables:", tables)

    for t in tables:
        # Get columns for each table
        col_result = conn.execute(text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{t}'"))
        cols = [f"{row[0]} ({row[1]})" for row in col_result]
        print(f"\nTable {t}:")
        for c in cols:
            print("  -", c)
