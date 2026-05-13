"""
Migration script: BigQuery → PostgreSQL
"""
from google.cloud import bigquery
from sqlalchemy import create_engine
from grid_intelligence.params import GCP_PROJECT, BQ_TABLE_ID, DATABASE_URL, PG_TABLE
import pandas as pd

print("Connecting to BigQuery...")
bq_client = bigquery.Client(project=GCP_PROJECT)

print("Connecting to PostgreSQL...")
engine = create_engine(DATABASE_URL)

print("Loading data from BigQuery...")
query = f"SELECT * FROM `{BQ_TABLE_ID}` ORDER BY datetime_utc"
df = bq_client.query(query).to_dataframe()
print(f"Loaded {len(df)} rows from BigQuery")

# Strip timezone for PostgreSQL
df['datetime_utc'] = pd.to_datetime(df['datetime_utc']).dt.tz_localize(None)

print("Writing to PostgreSQL...")
df.to_sql(PG_TABLE, engine, if_exists='replace', index=False, method='multi', chunksize=1000)
print(f"✅ Migration complete: {len(df)} rows written to PostgreSQL")

# Verify
with engine.connect() as conn:
    result = conn.execute(__import__('sqlalchemy').text(f"SELECT COUNT(*) FROM {PG_TABLE}"))
    print(f"✅ Verification: {result.scalar()} rows in PostgreSQL")
