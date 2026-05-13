import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
  AreaChart, Area
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FEATURE_LABELS = {
  price_lag_1: 'Price 15min ago', price_lag_4: 'Price 1h ago',
  price_lag_96: 'Price 24h ago', price_lag_672: 'Price 1 week ago',
  price_roll_mean_96: 'Avg last 24h', price_roll_mean_672: 'Avg last week',
  generation_renewable: 'Renewable gen.', generation_non_renewable: 'Conv. generation',
  consumption: 'Consumption', wind_onshore: 'Wind onshore',
  temperature_c_observed: 'Temperature', shortwave_radiation_wm2_observed: 'Solar radiation',
  ttf_gas: 'TTF gas price', hour: 'Hour of day', day_of_week: 'Day of week',
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@300;400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #080808;
    color: #e8e6e0;
    font-family: 'IBM Plex Sans Condensed', sans-serif;
    min-height: 100vh;
  }

  .app { min-height: 100vh; }

  /* HEADER */
  .header {
    border-bottom: 1px solid #1e1e1e;
    padding: 0 2.5rem;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    height: 64px;
    position: sticky;
    top: 0;
    background: #080808;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .logo {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: #e8e6e0;
    text-transform: uppercase;
  }

  .logo span { color: #c8f04e; }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    color: #555;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #c8f04e;
    animation: blink 2s ease-in-out infinite;
  }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

  /* NAV */
  .nav {
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  .nav-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #444;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 0 1.2rem;
    cursor: pointer;
    transition: all 0.15s;
    height: 100%;
  }

  .nav-btn:hover { color: #888; }
  .nav-btn.active { color: #c8f04e; border-bottom-color: #c8f04e; }

  /* TICKER */
  .ticker {
    background: #0e0e0e;
    border-bottom: 1px solid #1a1a1a;
    padding: 0 2.5rem;
    height: 36px;
    display: flex;
    align-items: center;
    gap: 2.5rem;
    overflow: hidden;
  }

  .ticker-item {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ticker-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.55rem;
    color: #444;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .ticker-val {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem;
    font-weight: 600;
    color: #e8e6e0;
  }

  .ticker-val.up { color: #c8f04e; }
  .ticker-val.down { color: #f05c4e; }

  /* MAIN */
  .main { padding: 2rem 2.5rem; }

  /* METRICS ROW */
  .metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: #1a1a1a;
    border: 1px solid #1a1a1a;
    margin-bottom: 1.5rem;
  }

  .metric {
    background: #080808;
    padding: 1.4rem 1.5rem;
    position: relative;
  }

  .metric::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: #1a1a1a;
  }

  .metric.accent-lime::before { background: #c8f04e; }
  .metric.accent-red::before { background: #f05c4e; }
  .metric.accent-amber::before { background: #f0a44e; }
  .metric.accent-blue::before { background: #4e8ef0; }

  .metric-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.55rem;
    color: #444;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 0.6rem;
  }

  .metric-value {
    font-family: 'IBM Plex Sans Condensed', sans-serif;
    font-size: 2.6rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .metric-value .unit {
    font-size: 0.9rem;
    font-weight: 300;
    color: #555;
    margin-left: 4px;
    letter-spacing: 0;
  }

  .metric-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    color: #444;
    margin-top: 0.5rem;
    letter-spacing: 0.06em;
  }

  /* PANELS */
  .panel {
    background: #0c0c0c;
    border: 1px solid #1a1a1a;
    margin-bottom: 1.5rem;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1.2rem;
    border-bottom: 1px solid #1a1a1a;
  }

  .panel-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    color: #555;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .panel-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.55rem;
    color: #333;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid #222;
    padding: 2px 8px;
  }

  .panel-body { padding: 1.2rem; }

  /* TWO-COL LAYOUT */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  /* SHAP BARS */
  .shap-row {
    margin-bottom: 1rem;
  }

  .shap-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .shap-name {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem;
    color: #888;
    letter-spacing: 0.04em;
  }

  .shap-val {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem;
    font-weight: 600;
  }

  .shap-bar-bg {
    height: 3px;
    background: #1a1a1a;
  }

  .shap-bar-fill {
    height: 100%;
    transition: width 0.6s ease;
  }

  /* TABLE */
  .intel-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .intel-table th {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.55rem;
    color: #333;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #1a1a1a;
  }

  .intel-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #111;
    color: #888;
    font-size: 0.8rem;
  }

  .intel-table td:first-child { color: #555; font-size: 0.75rem; font-family: 'IBM Plex Mono', monospace; }
  .intel-table td.val { color: #e8e6e0; font-weight: 600; }
  .intel-table td.lime { color: #c8f04e !important; }
  .intel-table td.red { color: #f05c4e !important; }
  .intel-table td.amber { color: #f0a44e !important; }

  /* DAY SELECTOR */
  .day-selector {
    display: flex;
    gap: 1px;
    background: #111;
    border: 1px solid #1a1a1a;
    padding: 1px;
    width: fit-content;
    margin-bottom: 1.2rem;
  }

  .day-btn {
    background: transparent;
    border: none;
    color: #444;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    padding: 5px 14px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.1s;
  }

  .day-btn.active {
    background: #c8f04e;
    color: #080808;
    font-weight: 600;
  }

  /* FOOTER */
  .footer {
    border-top: 1px solid #111;
    padding: 1.5rem 2.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-text {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.55rem;
    color: #2a2a2a;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  /* LOADING */
  .loading {
    padding: 3rem;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem;
    color: #c8f04e;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .loading::before {
    content: '';
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #c8f04e;
    animation: blink 1s ease-in-out infinite;
  }

  /* REGIME BADGE */
  .regime-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 10px;
    border: 1px solid;
  }

  .regime-0 { color: #c8f04e; border-color: #c8f04e33; background: #c8f04e11; }
  .regime-1 { color: #f05c4e; border-color: #f05c4e33; background: #f05c4e11; }
  .regime-2 { color: #4e8ef0; border-color: #4e8ef033; background: #4e8ef011; }
`

function formatTS(ts) {
  const d = new Date(ts)
  return d.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 0,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11,
    color: '#e8e6e0',
  },
  cursor: { stroke: '#333', strokeWidth: 1 }
}

function PredictView() {
  const [data, setData] = useState(null)
  const [explain, setExplain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/predict`),
      axios.get(`${API}/explain`)
    ]).then(([pred, exp]) => {
      setData(pred.data)
      setExplain(exp.data)
    }).catch(e => setError(e.message))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Fetching forecast from API</div>
  if (error || !data) return <div className="loading" style={{color:'#f05c4e'}}>API connection failed — {error}</div>

  const prices = data.predictions_15min
  const timestamps = data.timestamps
  const chartData = timestamps.map((ts, i) => ({ ts: formatTS(ts), price: Number(prices[i]?.toFixed(2)), raw: ts }))

  const minVal = Math.min(...prices)
  const maxVal = Math.max(...prices)
  const avgVal = prices.reduce((a, b) => a + b, 0) / prices.length
  const stdVal = Math.sqrt(prices.reduce((a, b) => a + (b - avgVal) ** 2, 0) / prices.length)
  const minTs = formatTS(timestamps[prices.indexOf(minVal)])
  const maxTs = formatTS(timestamps[prices.indexOf(maxVal)])
  const spikeHours = prices.filter(p => p > 140).length / 4
  const negHours = prices.filter(p => p < 0).length / 4

  const regimeMap = { 0: 'Normal regime', 1: 'Positive spike', 2: 'Negative spike' }
  const regime = explain?.regime ?? 0

  const maxShap = explain ? Math.abs(explain.top_features[0].shap_value) : 1

  return (
    <>
      {/* Metrics */}
      <div className="metrics">
        <div className={`metric accent-lime`}>
          <div className="metric-label">Min · 72h</div>
          <div className="metric-value">{minVal.toFixed(1)}<span className="unit">€/MWh</span></div>
          <div className="metric-sub">{minTs}</div>
        </div>
        <div className={`metric ${maxVal > 140 ? 'accent-red' : 'accent-lime'}`}>
          <div className="metric-label">Max · 72h</div>
          <div className="metric-value" style={{color: maxVal > 140 ? '#f05c4e' : '#e8e6e0'}}>{maxVal.toFixed(1)}<span className="unit">€/MWh</span></div>
          <div className="metric-sub">{maxTs}</div>
        </div>
        <div className="metric accent-blue">
          <div className="metric-label">Avg · 72h</div>
          <div className="metric-value">{avgVal.toFixed(1)}<span className="unit">€/MWh</span></div>
          <div className="metric-sub">σ ± {stdVal.toFixed(1)} €/MWh</div>
        </div>
        <div className={`metric ${avgVal < 100 ? 'accent-lime' : avgVal <= 200 ? 'accent-amber' : 'accent-red'}`}>
          <div className="metric-label">Market signal</div>
          <div className="metric-value" style={{
            fontSize: '1.6rem',
            color: avgVal < 100 ? '#c8f04e' : avgVal <= 200 ? '#f0a44e' : '#f05c4e'
          }}>
            {avgVal < 100 ? 'CHARGE' : avgVal <= 200 ? 'MONITOR' : 'REDUCE'}
          </div>
          <div className="metric-sub">Avg {avgVal.toFixed(0)} €/MWh</div>
        </div>
      </div>

      {/* Chart + SHAP */}
      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Price forecast · 15-min resolution · Europe/Berlin</span>
            <span className="panel-tag">72h horizon</span>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8f04e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#c8f04e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#141414" />
                <XAxis dataKey="ts" tick={{ fill: '#333', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  interval={Math.floor(chartData.length / 7)} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} />
                <YAxis tick={{ fill: '#333', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                  tickFormatter={v => `${v}€`} axisLine={false} tickLine={false} width={40} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v.toFixed(1)} €/MWh`, 'Price']} />
                <ReferenceLine y={140} stroke="#f05c4e44" strokeDasharray="3 3"
                  label={{ value: '140€ spike', fill: '#f05c4e66', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                <ReferenceLine y={0} stroke="#4e8ef044" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="price" stroke="#c8f04e" strokeWidth={1.5}
                  fill="url(#priceGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SHAP Panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Feature influence</span>
            <span className={`regime-badge regime-${regime}`}>{regimeMap[regime]}</span>
          </div>
          <div className="panel-body">
            {explain?.top_features.map((f, i) => (
              <div className="shap-row" key={i}>
                <div className="shap-top">
                  <span className="shap-name">{FEATURE_LABELS[f.feature] || f.feature}</span>
                  <span className="shap-val" style={{ color: f.shap_value > 0 ? '#f05c4e' : '#c8f04e' }}>
                    {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(3)}
                  </span>
                </div>
                <div className="shap-bar-bg">
                  <div className="shap-bar-fill" style={{
                    width: `${Math.min(Math.abs(f.shap_value) / maxShap * 100, 100)}%`,
                    background: f.shap_value > 0 ? '#f05c4e' : '#c8f04e'
                  }} />
                </div>
              </div>
            ))}
            {!explain && <div style={{ color: '#333', fontSize: '0.7rem', fontFamily: 'monospace' }}>Unavailable</div>}
          </div>
        </div>
      </div>

      {/* Market Intelligence */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Market intelligence · actionable insights</span>
        </div>
        <table className="intel-table">
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Value</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spike risk</td>
              <td className={`val ${spikeHours > 0 ? 'red' : 'lime'}`}>{spikeHours.toFixed(0)}h above 140 €/MWh</td>
              <td>{spikeHours > 0 ? 'Activate hedging contracts or curtailment' : 'No spike risk in 72h window'}</td>
            </tr>
            <tr>
              <td>Negative price hours</td>
              <td className={`val ${negHours > 0 ? 'lime' : ''}`}>{negHours.toFixed(0)}h below 0 €/MWh</td>
              <td>{negHours > 0 ? 'Grid pays you to consume — maximize flexible load' : 'No negative prices expected'}</td>
            </tr>
            <tr>
              <td>Price volatility</td>
              <td className={`val ${stdVal > 40 ? 'red' : stdVal > 20 ? 'amber' : 'lime'}`}>σ = {stdVal.toFixed(1)} €/MWh</td>
              <td>{stdVal > 40 ? 'High volatility — active trading recommended' : stdVal > 20 ? 'Moderate volatility' : 'Stable conditions'}</td>
            </tr>
            <tr>
              <td>Market signal</td>
              <td className={`val ${avgVal < 100 ? 'lime' : avgVal > 200 ? 'red' : 'amber'}`}>{avgVal < 100 ? 'Cheap window' : avgVal > 200 ? 'High risk' : 'Normal range'}</td>
              <td>{avgVal < 100 ? 'Charge batteries, run industrial loads' : avgVal > 200 ? 'Reduce load, activate demand response' : 'Standard hedging sufficient'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function BacktestView() {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    axios.get(`${API}/backtest?days=14`).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading backtest data</div>
  if (!data?.actual) return <div className="loading" style={{color:'#f05c4e'}}>No backtest data available</div>

  const cutoff = new Date(data.timestamps[data.timestamps.length - 1])
  cutoff.setDate(cutoff.getDate() - days)
  const filtered = data.timestamps
    .map((ts, i) => ({ ts: formatTS(ts), actual: data.actual[i], predicted: data.predicted[i] }))
    .filter((_, i) => new Date(data.timestamps[i]) >= cutoff)

  const maes = filtered.map(d => Math.abs((d.actual || 0) - (d.predicted || 0)))
  const mae = maes.reduce((a, b) => a + b, 0) / maes.length

  return (
    <>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
        <div className="metric accent-lime">
          <div className="metric-label">MAE · {days}d window</div>
          <div className="metric-value">{mae.toFixed(1)}<span className="unit">€/MWh</span></div>
        </div>
        <div className="metric accent-blue">
          <div className="metric-label">Data points</div>
          <div className="metric-value">{filtered.length.toLocaleString()}<span className="unit">pts</span></div>
        </div>
        <div className="metric accent-amber">
          <div className="metric-label">Resolution</div>
          <div className="metric-value">15<span className="unit">min</span></div>
        </div>
      </div>

      <div className="day-selector">
        {[1, 3, 7, 14].map(d => (
          <button key={d} className={`day-btn ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>{d}d</button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Actual vs predicted · Europe/Berlin</span>
          <span className="panel-tag">{days}-day window</span>
        </div>
        <div className="panel-body">
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={filtered} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#141414" />
              <XAxis dataKey="ts" tick={{ fill: '#333', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                interval={Math.floor(filtered.length / 7)} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} />
              <YAxis tick={{ fill: '#333', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                tickFormatter={v => `${v}€`} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [`${v?.toFixed(1)} €/MWh`, name]} />
              <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.6rem', color: '#555' }} />
              <Line type="monotone" dataKey="actual" stroke="#4e8ef0" strokeWidth={1.5} dot={false} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke="#c8f04e" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

function EnergyMixView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/energy-mix?days=7`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading energy mix</div>
  if (error || !data?.timestamps) return <div className="loading" style={{color:'#f05c4e'}}>Energy mix unavailable — {error}</div>

  const chartData = data.timestamps.map((ts, i) => ({
    ts: formatTS(ts),
    renewable: data.generation_renewable[i],
    nonRenewable: data.generation_non_renewable[i],
    consumption: data.consumption[i],
  }))

  const avgRenewable = data.generation_renewable.filter(Boolean).reduce((a, b) => a + b, 0) / data.generation_renewable.filter(Boolean).length
  const avgNonRenewable = data.generation_non_renewable.filter(Boolean).reduce((a, b) => a + b, 0) / data.generation_non_renewable.filter(Boolean).length
  const renewableShare = (avgRenewable / (avgRenewable + avgNonRenewable) * 100)

  return (
    <>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
        <div className="metric accent-lime">
          <div className="metric-label">Renewable share · 7d avg</div>
          <div className="metric-value" style={{color:'#c8f04e'}}>{renewableShare.toFixed(1)}<span className="unit">%</span></div>
        </div>
        <div className="metric accent-blue">
          <div className="metric-label">Avg renewable gen.</div>
          <div className="metric-value">{(avgRenewable/1000).toFixed(1)}<span className="unit">GW</span></div>
        </div>
        <div className="metric accent-red">
          <div className="metric-label">Avg conventional gen.</div>
          <div className="metric-value">{(avgNonRenewable/1000).toFixed(1)}<span className="unit">GW</span></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Energy mix · renewable vs conventional · last 7 days</span>
          <span className="panel-tag">MW · 15-min</span>
        </div>
        <div className="panel-body">
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="renewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8f04e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#c8f04e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="nonRenewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f05c4e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f05c4e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#141414" />
              <XAxis dataKey="ts" tick={{ fill: '#333', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                interval={Math.floor(chartData.length / 7)} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} />
              <YAxis tick={{ fill: '#333', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
                tickFormatter={v => `${(v/1000).toFixed(0)}GW`} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [`${v?.toFixed(0)} MW`, name]} />
              <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.6rem', color: '#555' }} />
              <Area type="monotone" dataKey="renewable" stroke="#c8f04e" strokeWidth={1.5} fill="url(#renewGrad)" dot={false} name="Renewable" />
              <Area type="monotone" dataKey="nonRenewable" stroke="#f05c4e" strokeWidth={1.5} fill="url(#nonRenewGrad)" dot={false} name="Conventional" />
              <Line type="monotone" dataKey="consumption" stroke="#f0a44e" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Consumption" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [view, setView] = useState('predict')
  const [now, setNow] = useState(new Date().toUTCString().replace('GMT', 'UTC'))

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toUTCString().replace('GMT', 'UTC')), 60000)
    return () => clearInterval(t)
  }, [])

  const views = [
    { id: 'predict', label: 'Forecast' },
    { id: 'backtest', label: 'Backtest' },
    { id: 'energymix', label: 'Energy mix' },
  ]

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="header-left">
            <div className="logo">Grid<span>Intelligence</span></div>
            <div className="live-badge">
              <span className="live-dot" />
              {now}
            </div>
          </div>
          <nav className="nav">
            {views.map(v => (
              <button key={v.id} className={`nav-btn ${view === v.id ? 'active' : ''}`} onClick={() => setView(v.id)}>
                {v.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="ticker">
          <div className="ticker-item">
            <span className="ticker-label">Market</span>
            <span className="ticker-val">DE-LU Day-Ahead</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">Model</span>
            <span className="ticker-val">XGBoost Multi-Regime</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">Horizon</span>
            <span className="ticker-val">72h · 15min</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">Sources</span>
            <span className="ticker-val">ENTSO-E · Open-Meteo · TTF</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">MAE</span>
            <span className="ticker-val up">~26 €/MWh</span>
          </div>
        </div>

        <main className="main">
          {view === 'predict' && <PredictView />}
          {view === 'backtest' && <BacktestView />}
          {view === 'energymix' && <EnergyMixView />}
        </main>

        <footer className="footer">
          <span className="footer-text">Grid Intelligence · Le Wagon Berlin · April 2026 · DE-LU Electricity Market</span>
          <span className="footer-text">Transformer V3 + XGBoost Spike Detector</span>
        </footer>
      </div>
    </>
  )
}
