# GridIntelligence

**Day-ahead electricity price forecasting for the DE-LU bidding zone (Germany / Luxembourg)**

> Built as a capstone project at Le Wagon Berlin (April 2026) — end-to-end ML system from raw API data to a live production dashboard.

---

## Live Demo

**Dashboard** → `http://187.127.79.142:3001`
**API** → `http://187.127.79.142:8001/docs`
**Health** → `http://187.127.79.142:8001/health`

---

## What it does

GridIntelligence predicts electricity prices for the next 72 hours at 15-minute resolution. It helps energy traders, industrial consumers, and grid operators decide **when to buy, sell, or shift energy consumption**.

The system runs fully autonomously — a daily scheduled job fetches new market data, updates the database, and serves fresh predictions via REST API.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VPS (Ubuntu 24.04)                  │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   React UI   │◄───│   FastAPI    │◄───│ PostgreSQL│  │
│  │  (Port 3001) │    │  (Port 8001) │    │           │  │
│  └──────────────┘    └──────┬───────┘    └───────────┘  │
│                             │                           │
│                    ┌────────▼────────┐                  │
│                    │  APScheduler    │                   │
│                    │  06:00 UTC/day  │                   │
│                    └────────┬────────┘                  │
│                             │                           │
│              ┌──────────────┼──────────────┐            │
│              ▼              ▼              ▼            │
│          ENTSO-E       Open-Meteo      Yahoo Finance    │
│         (prices,       (weather,        (TTF gas)       │
│        generation)     forecast)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Models

### XGBoost Multi-Regime (primary)

The electricity market behaves differently across regimes. Instead of one model for all conditions, we train **three specialized XGBoost regressors** — one per market regime — plus a classifier that routes each prediction to the right model.

| Regime | Condition | Share of data |
|--------|-----------|---------------|
| Normal | -50 < price < 140 €/MWh | ~85% |
| Positive spike | price > 140 €/MWh | ~6% |
| Negative price | price < 0 €/MWh | ~9% |

**Performance:**

| Model | MAE (€/MWh) | Horizon |
|-------|-------------|---------|
| Prophet (baseline) | 72.70 | 1 year |
| ARIMA | 38.93 | 1h |
| XGBoost 72h | 39.06 | 72h |
| XGBoost 24h | **31.31** | 24h |
| Transformer V3 | **~26** | 24h |

### Transformer (PyTorch)

`nn.TransformerEncoder` trained on 24h input windows × 25 features. Auto-detects MPS (Apple Silicon), CUDA (GPU), or CPU.

- 100 epochs · batch 256 · Adam lr=0.001 · MSE loss
- MAE ~26 €/MWh on held-out test set

### Spike Detector (XGBoost classifier)

Binary classifier that flags prices above 200 €/MWh. Handles severe class imbalance (9% spikes) via `scale_pos_weight=8.3`.

- AUC-ROC: **0.94**
- Top features: `ma_168h` (42%), `y_scaled` (23%), `year` (6%)

### SHAP Explainability

Every prediction is explained via SHAP values — showing which features pushed the price up or down. Rendered live in the dashboard's "Feature Influence" panel.

---

##  Dataset

| Source | Data | Resolution |
|--------|------|------------|
| ENTSO-E | Day-ahead prices, generation by type, load, wind onshore (DE-LU zone) | 15 min (native) |
| Open-Meteo | Temperature, humidity, cloud cover, solar radiation, wind speed — ERA5 hindcast + forecast | hourly → 15min |
| Yahoo Finance | TTF natural gas, WTI oil, Brent, Henry Hub | daily → ffill 15min |

- **Range:** 2018-10-01 → present (267,000+ rows)
- **Price cap:** 500 €/MWh (clips 2021–2022 energy crisis outliers)
- **Storage:** PostgreSQL (production) / BigQuery (legacy)

---

##  Feature Engineering (25 features)

```python
# Price history
y_scaled, lag_1h, lag_24h, lag_168h, ma_24h, ma_168h

# Temporal
hour, day_of_week, day_of_year, month, year

# Calendar
is_holiday, is_weekend  # holidays.Germany

# Grid
generation, consumption, wind_onshore,
generation_renewable, generation_non_renewable

# Known future (t+24) — no leakage ✓
target_hour, target_day_of_week, target_month,
target_is_holiday, target_is_weekend
```

> **Key design decision:** "Known future" features (calendar info for the target timestamp t+24) are valid inputs — they are knowable at prediction time without any data leakage.

---

##  Data Pipeline

```python
# Daily automated delta fetch (APScheduler, 06:00 UTC)
fetcher.fetch_delta()
# → reads last date from DB
# → fetches (last_date - 7 days) to (today + 3 days forecast)
# → merges, deduplicates (keep='last' for ENTSO-E revisions)
# → upserts to PostgreSQL
```

```bash
# Manual full fetch (first time)
python fetcher.py --mode full --start 2018-10-01

# Manual delta fetch
python fetcher.py --mode delta
```

### Source classes

```
DataFetcher (orchestrator)
├── EntsoeSource     — entsoe-py client, 15min resampling
├── WeatherSource    — Open-Meteo ERA5 + forecast (auto-split by date)
└── GasSource        — yfinance daily → ffill to 15min
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /predict` | 72h price forecast at 15-min resolution |
| `GET /explain` | SHAP top-6 features for current prediction |
| `GET /backtest?days=N` | Actual vs predicted for last N days |
| `GET /energy-mix?days=N` | Renewable vs conventional generation |
| `GET /health` | System status + last delta fetch timestamp |
| `GET /fetch-delta` | Trigger manual data update |

---

## Dashboard

Built with **React + Recharts + Vite**. Three views:

- **Forecast** — 72h price chart, market intelligence table, SHAP feature influence
- **Backtest** — actual vs predicted comparison with MAE metric
- **Energy Mix** — renewable vs conventional generation stacked area chart

Features: dark/light mode toggle, responsive layout, auto-refresh timestamp.

---

## Deployment

```bash
# Clone and configure
git clone https://github.com/jinozab/grid-intelligence.git
cd grid-intelligence
cp .env.example .env  # add ENTSOE_API_KEY, PG_* credentials

# Copy model files (not tracked in git)
scp -r models/ user@vps:/docker/grid-intelligence/grid_intelligence/

# Deploy
docker compose up --build -d
```

**docker-compose.yml** spins up:
- `api` — FastAPI + APScheduler (Port 8001)
- `frontend` — React/Nginx (Port 3001)
- `postgres` — PostgreSQL 16

---

## 📁 Project Structure

```
grid-intelligence/
├── api/
│   └── fast.py              # FastAPI app + APScheduler
├── grid_intelligence/
│   ├── data/
│   │   └── fetcher.py       # Multi-source data pipeline
│   ├── logic/
│   │   ├── preprocessor.py  # Feature engineering
│   │   └── data.py          # Time features, lags, rolling stats
│   ├── interface/
│   │   └── main.py          # Prediction orchestration
│   └── models/              # Saved .pkl files (git-ignored)
├── frontend/
│   └── src/App.jsx          # React dashboard
├── notebooks/               # EDA + training notebooks
├── docker-compose.yml
└── requirements.txt
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| ML | PyTorch (Transformer), XGBoost, SHAP |
| Data | entsoe-py, openmeteo-requests, yfinance, pandas |
| API | FastAPI, APScheduler |
| Frontend | React, Recharts, Vite |
| Database | PostgreSQL 16 |
| Infrastructure | Docker, Ubuntu 24.04 VPS |
| Dev tools | Python 3.10, conda |

---

##  Known Limitations

| Issue | Detail |
|-------|--------|
| Spike recall 0.29 | Model misses 71% of extreme spikes — structural limitation of gradient boosting on rare events |
| Weather gap | Trained on observed ERA5 weather; production uses forecasted weather |
| Cross-border flows | Import/export excluded due to ENTSO-E API latency |
| Training granularity | Trained on 1h resampled data; 15min retraining is next step |



*GridIntelligence — DE-LU Electricity Market Forecasting*
