# Grid Intelligence

Day-ahead electricity price forecasting for the **DE-LU** bidding zone (Germany/Luxembourg). A Transformer model predicts hourly prices 24h ahead, complemented by an XGBoost spike detector for high-price risk alerts.

## Overview

Day-ahead prices in the DE-LU zone are volatile and driven by renewables, load, weather, and fuel costs. This project builds an end-to-end pipeline — from data ingestion to a served API and dashboard — to forecast those prices and flag spike risk.

- **Main model:** PyTorch Transformer (24h window → price 24h ahead)
- **Spike detector:** XGBoost binary classifier (price > 200 EUR/MWh)
- **Serving:** FastAPI backend + React/Vite dashboard
- **Data:** 15-min resolution, UTC, single source of truth in PostgreSQL

## Architecture

```
ENTSO-E ─┐
Open-Meteo ─┼─► Fetcher ─► PostgreSQL ─► Features ─► Transformer ─► FastAPI ─► React Dashboard
Yahoo Fin. ─┘   (delta)     (15-min UTC)              + XGBoost
```

Three services orchestrated with Docker Compose:

| Service    | Description                  | Port |
|------------|------------------------------|------|
| `postgres` | Consolidated dataset store   | —    |
| `api`      | FastAPI (model serving)      | 8001 |
| `frontend` | React/Vite dashboard         | 3001 |

A central Traefik instance handles reverse proxying.

## Data Sources

| Source         | Data                                              |
|----------------|---------------------------------------------------|
| ENTSO-E        | Day-ahead prices, generation, load, wind onshore  |
| Open-Meteo     | Temperature, humidity, cloud cover, radiation, wind (ERA5 + forecast) |
| Yahoo Finance  | TTF gas, WTI, Brent, Henry Hub                    |

Data is consolidated into a single growing table at 15-min resolution in UTC. A daily delta fetch (06:00 UTC via APScheduler) pulls the most recent days with a 7-day overlap to absorb ENTSO-E revisions, deduplicating on the latest values.

## Model

**Transformer (main)** — `nn.TransformerEncoder`, 24h × 25 features input, predicts price 24h ahead. Known-future calendar features (e.g. `target_hour`, `target_is_holiday`) are valid inputs since they're knowable at prediction time.

**Spike detector (complementary)** — XGBoost classifier, threshold at 200 EUR/MWh, `scale_pos_weight` for class imbalance. Gives a risk signal alongside the price level.

| Model            | MAE (EUR/MWh) | Horizon |
|------------------|---------------|---------|
| Prophet          | 72.70         | 1 year  |
| ARIMA            | 38.93         | 1h      |
| XGBoost          | 31.31         | 24h     |
| **Transformer**  | **~26**       | 24h     |

## API Endpoints

| Endpoint            | Description                  |
|---------------------|------------------------------|
| `GET /`             | Health check                 |
| `POST /predict`     | 24h price forecast           |
| `POST /explain`     | Feature attribution          |
| `GET /backtest`     | Historical backtest results  |
| `GET /energy-mix`   | Generation breakdown by source |
| `GET /features`     | Computed feature vector      |
| `POST /fetch-delta` | Trigger delta data fetch     |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/jinozab/grid-intelligence.git
cd grid-intelligence

# 2. Configure environment
cp .env.example .env          # add ENTSO-E key, DB credentials
# create frontend/.env.production with VITE_API_URL

# 3. Run
docker compose up --build -d
```

Dashboard at `http://localhost:3001`, API at `http://localhost:8001`.

## Tech Stack

**ML:** PyTorch · XGBoost · APScheduler
**Backend:** FastAPI · PostgreSQL · entsoe-py · openmeteo-requests · yfinance
**Frontend:** React · Vite · Recharts · axios
**Infra:** Docker Compose · Traefik · Ubuntu 24.04

## Roadmap

- Custom domain + TLS
- Authentication (API + frontend)
- 15-min resolution retraining
- Cross-border import/export flows

## Limitations

Spike recall is ~0.29 — the model misses most spikes by design, trading recall for precision on the price level. Production uses forecasted weather while training used observed weather, leaving a known gap.
