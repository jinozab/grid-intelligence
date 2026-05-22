# grid_intelligence/params.py
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

ENTSOE_API_KEY = os.getenv("ENTSOE_API_KEY")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = str(BASE_DIR / "raw_data")

COUNTRY            = "DE_LU"
START_DATE         = "2018-10-01"
DELTA_OVERLAP_DAYS = 7
FORECAST_DAYS      = 3

# Environment
ENV = os.getenv("ENV", "development")

# BigQuery (legacy — nur noch für Migration)
GCP_PROJECT  = os.getenv("GCP_PROJECT", "grid-intelligence-2026")
BQ_DATASET   = "grid_intelligence"
BQ_TABLE     = "consolidated"
BQ_TABLE_ID  = f"{GCP_PROJECT}.{BQ_DATASET}.{BQ_TABLE}"

# PostgreSQL
PG_HOST     = os.getenv("PG_HOST", "localhost")
PG_PORT     = os.getenv("PG_PORT", "5432")
PG_DB       = os.getenv("PG_DB", "grid_intelligence")
PG_USER     = os.getenv("PG_USER", "grid")
PG_PASSWORD = os.getenv("PG_PASSWORD", "")
PG_TABLE    = "consolidated"
from urllib.parse import quote_plus
DATABASE_URL = f"postgresql://{PG_USER}:{quote_plus(PG_PASSWORD)}@{PG_HOST}:{PG_PORT}/{PG_DB}"

RENEWABLE = [
    'Biomass', 'Geothermal', 'Hydro Pumped Storage',
    'Hydro Run-of-river and poundage', 'Hydro Water Reservoir',
    'Other renewable', 'Solar', 'Wind Offshore', 'Wind Onshore'
]

NON_RENEWABLE = [
    'Fossil Brown coal/Lignite', 'Fossil Coal-derived gas',
    'Fossil Gas', 'Fossil Hard coal', 'Fossil Oil', 'Waste', 'Other'
]
