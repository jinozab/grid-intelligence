import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
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
  shortwave_radiation_wm2_observed_lag_96: 'Solar rad. 24h ago',
  shortwave_radiation_wm2_observed_lag_672: 'Solar rad. 1w ago',
}

function formatTS(ts) {
  const d = new Date(ts)
  return d.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function downsample(data, maxPoints = 200) {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0)
}

function Logo({ dark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img src="/logo.png" style={{ width: 120, height: 120, objectFit: 'contain',  marginRight: -30 }} />
      <div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', lineHeight: 1 }}>
          GridIntelligence
        </div>

      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8640A22', border: '1.5px solid #E8640A55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8640A', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
      JI
    </div>
  )
}

function MetricCard({ label, value, unit, sub, accentColor, dark }) {
  return (
    <div style={{ background: dark ? '#1a1a1a' : '#f1f1ef', border: `0px solid ${dark ? '#2a2a2a' : '#ebebeb'}`, borderRadius: 12, padding: '1.2rem 1.3rem', borderTop: `3px solid ${accentColor || '#E8640A'}`, minHeight: 110 }}>
      <div style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: dark ? 'rgba(255,255,255,0.4)' : '#999', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1, color: dark ? '#f0f0f0' : '#111', letterSpacing: '-0.02em' }}>
        {value}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: dark ? 'rgba(255,255,255,0.4)' : '#999', marginLeft: 4 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: dark ? 'rgba(255,255,255,0.3)' : '#bbb', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function Panel({ title, tag, children, dark }) {
  const border = dark ? '#2a2a2a' : '#ebebeb'
  return (
    <div style={{ background: dark ? '#1a1a1a' : '#f1f1ef', border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.2rem', borderBottom: `1px solid ${border}` }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: dark ? 'rgba(255,255,255,0.4)' : '#aaa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</span>
          {tag && <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#E8640A', background: '#fff4ed', border: '1px solid #f9c89b', borderRadius: 4, padding: '2px 8px', textTransform: 'uppercase' }}>{tag}</span>}
        </div>
      )}
      <div style={{ padding: '1rem 1.2rem' }}>{children}</div>
    </div>
  )
}

function ShapRow({ feature, value, dark }) {
  const label = FEATURE_LABELS[feature] || feature
  const isUp = value > 0
  const valColor = isUp ? '#E8640A' : '#1D9E75'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.9rem' }}>
      <span style={{ fontSize: '0.72rem', color: dark ? 'rgba(255,255,255,0.65)' : '#555', fontFamily: 'monospace' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <i className={`ti ${isUp ? 'ti-trending-up' : 'ti-trending-down'}`} style={{ fontSize: 14, color: valColor }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: valColor, fontFamily: 'monospace' }}>
          {isUp ? '+' : ''}{value.toFixed(3)}
        </span>
      </div>
    </div>
  )
}

function IntelRow({ icon, label, value, rec, valueColor, dark }) {
  const border = dark ? '#222' : '#f0f0f0'
  return (
    <tr style={{ borderBottom: `1px solid ${border}` }}>
      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.65rem', color: dark ? 'rgba(255,255,255,0.4)' : '#999', letterSpacing: '0.06em' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, marginRight: 6, verticalAlign: 'middle' }} />
        {label}
      </td>
      <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: '0.8rem', color: valueColor || (dark ? '#fff' : '#111') }}>{value}</td>
      <td style={{ padding: '10px 12px', fontSize: '0.78rem', color: dark ? 'rgba(255,255,255,0.6)' : '#555' }}>{rec}</td>
    </tr>
  )
}

const TOOLTIP_STYLE = (dark) => ({
  contentStyle: { background: dark ? '#1a1a1a' : '#f0f0f0', border: `1px solid ${dark ? '#333' : '#e5e5e5'}`, borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: dark ? '#e8e6e0' : '#333' },
  cursor: { stroke: dark ? '#444' : '#ddd', strokeWidth: 1 }
})

function PredictView({ dark }) {
  const [data, setData] = useState(null)
  const [explain, setExplain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([axios.get(`${API}/predict`), axios.get(`${API}/explain`)])
      .then(([pred, exp]) => { setData(pred.data); setExplain(exp.data) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const textMuted = dark ? 'rgba(255,255,255,0.4)' : '#aaa'
  const borderColor = dark ? '#2a2a2a' : '#ebebeb'
  const gridStroke = dark ? '#222' : '#f0f0f0'

  if (loading) return <div style={{ padding: '3rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#E8640A' }}>Loading forecast...</div>
  if (error || !data) return <div style={{ padding: '3rem', fontFamily: 'monospace', color: '#e74c3c' }}>API connection failed — {error}</div>

  const prices = data.predictions_15min
  const timestamps = data.timestamps
  const chartData = timestamps.map((ts, i) => ({ ts: formatTS(ts), price: Number(prices[i]?.toFixed(2)) }))

  const minVal = Math.min(...prices)
  const maxVal = Math.max(...prices)
  const avgVal = prices.reduce((a, b) => a + b, 0) / prices.length
  const stdVal = Math.sqrt(prices.reduce((a, b) => a + (b - avgVal) ** 2, 0) / prices.length)
  const minTs = formatTS(timestamps[prices.indexOf(minVal)])
  const maxTs = formatTS(timestamps[prices.indexOf(maxVal)])
  const spikeHours = prices.filter(p => p > 140).length / 4
  const negHours = prices.filter(p => p < 0).length / 4
  const regimeMap = { 0: 'Normal', 1: 'Positive spike', 2: 'Negative spike' }
  const regime = explain?.regime ?? 0
  const maxShap = explain ? Math.abs(explain.top_features[0].shap_value) : 1
  const signal = avgVal < 100 ? { label: 'BUY', color: '#1D9E75' } : avgVal <= 200 ? { label: 'HOLD', color: '#E8640A' } : { label: 'SELL', color: '#e74c3c' }

  return (
    <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '30% 1fr', gap: '1.5rem', alignItems: 'start' }}>

{/* LEFT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          <img src="/icons8-prediction-64.png" style={{ width: 44, height: 44, filter: 'invert(55%) sepia(80%) saturate(800%) hue-rotate(350deg)', opacity: 0.9 }} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: dark ? 'rgba(255,255,255,0.3)' : '#aaa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Forecast · 72h ahead</span>
        </div>

        {/* Market Intelligence */}
        <Panel title="Market intelligence" dark={dark}>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '-1rem -1.2rem', width: 'calc(100% + 2.4rem)' }}>
            <tbody>
              <IntelRow icon="ti-bolt" label="Spike risk" value={`${spikeHours.toFixed(0)}h above 140€`} valueColor={spikeHours > 0 ? '#e74c3c' : '#1D9E75'} rec={spikeHours > 0 ? 'Activate hedging' : 'No spike risk ✓'} dark={dark} />
              <IntelRow icon="ti-arrow-down" label="Neg. prices" value={`${negHours.toFixed(0)}h below 0€`} valueColor={negHours > 0 ? '#1D9E75' : (dark ? '#fff' : '#111')} rec={negHours > 0 ? 'Maximize load' : 'None expected'} dark={dark} />
              <IntelRow icon="ti-wave-sine" label="Volatility" value={`σ = ${stdVal.toFixed(1)} €`} valueColor={stdVal > 40 ? '#e74c3c' : stdVal > 20 ? '#E8640A' : '#1D9E75'} rec={stdVal > 40 ? 'High — trade actively' : stdVal > 20 ? 'Moderate' : 'Stable'} dark={dark} />
              <IntelRow icon="ti-antenna" label="Signal" value={signal.label} valueColor={signal.color} rec={avgVal < 100 ? 'Charge batteries' : avgVal > 200 ? 'Reduce load' : 'Monitor'} dark={dark} />
            </tbody>
          </table>
        </Panel>

        {/* Feature Influence */}
        <Panel title={`Feature influence · ${regimeMap[regime]}`} dark={dark}>
          {explain?.top_features.map((f, i) => (
            <ShapRow key={i} feature={f.feature} value={f.shap_value} maxVal={maxShap} dark={dark} />
          ))}
          {!explain && <div style={{ color: textMuted, fontSize: '0.7rem', fontFamily: 'monospace' }}>Unavailable</div>}
        </Panel>
      </div>

      {/* RIGHT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Metrics */}
        <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
          <MetricCard label="Min · 72h" value={minVal.toFixed(1)} unit="€/MWh" sub={minTs} accentColor="#1D9E75" dark={dark} />
          <MetricCard label="Max · 72h" value={maxVal.toFixed(1)} unit="€/MWh" sub={maxTs} accentColor={maxVal > 140 ? '#e74c3c' : '#E8640A'} dark={dark} />
          <MetricCard label="Avg · 72h" value={avgVal.toFixed(1)} unit="€/MWh" sub={`σ ± ${stdVal.toFixed(1)}`} accentColor="#378ADD" dark={dark} />
          <MetricCard label="Signal" value={signal.label} unit="" sub={`Avg ${avgVal.toFixed(0)} €`} accentColor={signal.color} dark={dark} />
        </div>

        {/* Chart */}
        <Panel title="Price forecast · 15-min · Europe/Berlin" tag="72h horizon" dark={dark}>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8640A" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#E8640A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke={gridStroke} />
              <XAxis dataKey="ts" tick={{ fill: dark ? '#444' : '#ccc', fontSize: 9, fontFamily: 'monospace' }} interval={Math.floor(chartData.length / 7)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: dark ? '#444' : '#ccc', fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}€`} axisLine={false} tickLine={false} width={42} />
              <Tooltip {...TOOLTIP_STYLE(dark)} formatter={v => [`${v.toFixed(1)} €/MWh`, 'Price']} />
              <ReferenceLine y={140} stroke="#e74c3c" strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'spike 140€', fill: '#e74c3c', fontSize: 9, fontFamily: 'monospace', opacity: 0.6 }} />
              <ReferenceLine y={0} stroke="#378ADD" strokeDasharray="4 3" strokeOpacity={0.4} />
              <Area type="monotone" dataKey="price" stroke="#E8640A"  fill="url(#priceGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  )
}

function BacktestView({ dark }) {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(14)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/backtest?days=14`).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const textMuted = dark ? 'rgba(255,255,255,0.4)' : '#aaa'
  const borderColor = dark ? '#2a2a2a' : '#ebebeb'
  const gridStroke = dark ? '#222' : '#f0f0f0'

  if (loading) return <div style={{ padding: '3rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#E8640A' }}>Loading backtest...</div>
  if (!data?.actual) return <div style={{ padding: '3rem', fontFamily: 'monospace', color: '#e74c3c' }}>No backtest data</div>

  const cutoff = new Date(data.timestamps[data.timestamps.length - 1])
  cutoff.setDate(cutoff.getDate() - days)
  const filtered = data.timestamps
    .map((ts, i) => ({ ts: formatTS(ts), actual: data.actual[i], predicted: data.predicted[i] }))
    .filter((_, i) => new Date(data.timestamps[i]) >= cutoff)

  const maes = filtered.map(d => Math.abs((d.actual || 0) - (d.predicted || 0)))
  const mae = maes.reduce((a, b) => a + b, 0) / maes.length

  return (
<div className="two-col" style={{ display: 'grid', gridTemplateColumns: '30% 1fr', gap: '1.5rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          <img src="/icons8-history-50.png" style={{ width: 44, height: 44, filter: 'invert(45%) sepia(80%) saturate(600%) hue-rotate(190deg)', opacity: 0.9 }} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: dark ? 'rgba(255,255,255,0.3)' : '#aaa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Backtest · model accuracy</span>
        </div>
        <MetricCard label={`MAE · ${days}d`} value={mae.toFixed(1)} unit="€/MWh" accentColor="#E8640A" dark={dark} />
        <MetricCard label="Data points" value={filtered.length.toLocaleString()} unit="pts" accentColor="#378ADD" dark={dark} />
        <MetricCard label="Resolution" value="15" unit="min" accentColor="#1D9E75" dark={dark} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 3, 7, 14].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              background: days === d ? '#E8640A' : 'transparent',
              color: days === d ? '#fff' : (dark ? 'rgba(255,255,255,0.4)' : '#999'),
              border: `1px solid ${days === d ? '#E8640A' : (dark ? '#333' : '#e5e5e5')}`,
              borderRadius: 20, padding: '4px 16px', fontFamily: 'monospace',
              fontSize: '0.65rem', cursor: 'pointer'
            }}>{d}d</button>
          ))}
        </div>

        <Panel title={`Actual vs predicted · ${days}-day window`} dark={dark}>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={downsample(filtered)} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 6" stroke={gridStroke} />
              <XAxis dataKey="ts" tick={{ fill: dark ? '#444' : '#ccc', fontSize: 9, fontFamily: 'monospace' }} interval={Math.floor(filtered.length / 7)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: dark ? '#444' : '#ccc', fontSize: 9, fontFamily: 'monospace' }} tickFormatter={v => `${v}€`} axisLine={false} tickLine={false} width={42} />
              <Tooltip {...TOOLTIP_STYLE(dark)} formatter={(v, name) => [`${v?.toFixed(1)} €/MWh`, name]} />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '0.62rem', color: dark ? '#888' : '#aaa' }} />
              <Line type="monotone" dataKey="actual" stroke="#378ADD" dot={false} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke="#E8640A"   dot={false} name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  )
}

function EnergyMixView({ dark }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/energy-mix?days=7`).then(r => setData(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const gridStroke = dark ? '#222' : '#f0f0f0'

  if (loading) return <div style={{ padding: '3rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#E8640A' }}>Loading energy mix...</div>
  if (error || !data?.timestamps) return <div style={{ padding: '3rem', fontFamily: 'monospace', color: '#e74c3c' }}>Energy mix unavailable</div>

  const chartData = data.timestamps.map((ts, i) => ({
    ts: formatTS(ts),
    renewable: data.generation_renewable[i],
    conventional: data.generation_non_renewable[i],
    consumption: data.consumption[i],
  }))

  const avgR = data.generation_renewable.filter(Boolean).reduce((a, b) => a + b, 0) / data.generation_renewable.filter(Boolean).length
  const avgNR = data.generation_non_renewable.filter(Boolean).reduce((a, b) => a + b, 0) / data.generation_non_renewable.filter(Boolean).length
  const share = (avgR / (avgR + avgNR) * 100)

  return (
<div className="two-col" style={{ display: 'grid', gridTemplateColumns: '30% 1fr', gap: '1.5rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          <img src="/icons8-solar-energy-50.png" style={{ width: 44, height: 44, filter: 'invert(50%) sepia(80%) saturate(500%) hue-rotate(100deg)', opacity: 0.9 }} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: dark ? 'rgba(255,255,255,0.3)' : '#aaa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Energy mix · last 7 days</span>
        </div>
        <MetricCard label="Renewable share · 7d" value={share.toFixed(1)} unit="%" accentColor="#1D9E75" dark={dark} />
        <MetricCard label="Avg renewable" value={(avgR/1000).toFixed(1)} unit="GW" accentColor="#E8640A" dark={dark} />
        <MetricCard label="Avg conventional" value={(avgNR/1000).toFixed(1)} unit="GW" accentColor="#e74c3c" dark={dark} />
      </div>

    <Panel title="Energy mix · renewable vs conventional · last 7 days" dark={dark}>
      <ResponsiveContainer width="100%" height={400}>
        {/* Agregamos un filtro para asegurar que no grafique puntos vacíos al final */}
        <AreaChart
          data={chartData.filter(d => d.renewable !== null || d.consumption !== null)}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="renewGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e74c3c" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#e74c3c" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid  stroke={gridStroke} vertical={false} />

          <XAxis
            dataKey="ts"
            tick={{ fill: dark ? '#666' : '#ccc', fontSize: 9, fontFamily: 'monospace' }}
            interval="preserveStartEnd"
            minTickGap={60} // Esto evita que las fechas se pisen
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: dark ? '#666' : '#ccc', fontSize: 9, fontFamily: 'monospace' }}
            tickFormatter={v => `${(v/1000).toFixed(0)}GW`}
            axisLine={false}
            tickLine={false}
            width={45}
          />

          <Tooltip {...TOOLTIP_STYLE(dark)} formatter={(v, name) => [`${v?.toFixed(0)} MW`, name]} />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontFamily: 'monospace', fontSize: '0.62rem', paddingBottom: '20px' }}
          />

          {/* connectNulls={true} es la clave para que la línea no se corte */}
          <Area
            type="monotone"
            dataKey="renewable"
            stroke="#1D9E75"

            fill="url(#renewGrad)"
            dot={false}
            name="Renewable"
            connectNulls={true}
          />

          <Area
            type="monotone"
            dataKey="conventional"
            stroke="#e74c3c"

            fill="url(#convGrad)"
            dot={false}
            name="Conventional"
            connectNulls={true}
          />

          <Line
            type="monotone"
            dataKey="consumption"
            stroke="#2e1186"

            dot={false}
            name="Consumption"
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
    </div>
  )
}

function AboutView({ dark }) {
  const border = dark ? '#2a2a2a' : '#ebebeb'
  const textPrimary = dark ? '#fff' : '#111'
  const textMuted = dark ? 'rgba(255,255,255,0.45)' : '#888'
  const textBody = dark ? 'rgba(255,255,255,0.75)' : '#444'
  const accentBg = dark ? '#1e1e1e' : '#fff'

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
        <div style={{ width: 3, height: 18, background: '#E8640A', borderRadius: 2 }} />
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: 700, color: textPrimary }}>{title}</h2>
      </div>
      {children}
    </div>
  )

  const Card = ({ children, accent }) => (
    <div style={{ background: accentBg, border: `1px solid ${border}`, borderLeft: accent ? `3px solid ${accent}` : undefined, borderRadius: 12, padding: '1.2rem 1.4rem', marginBottom: '0.8rem' }}>
      {children}
    </div>
  )

  const Tag = ({ label, color }) => (
    <span style={{ display: 'inline-block', background: color + '22', border: `1px solid ${color}55`, color, fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4, marginRight: 6, marginBottom: 4 }}>{label}</span>
  )

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Grid<span style={{ color: '#E8640A' }}>Intelligence</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: textBody, lineHeight: 1.8, maxWidth: 620 }}>
          A forecasting tool for day-ahead electricity prices in the German-Luxembourg market (DE-LU). It helps energy traders, industrial consumers, and grid operators make smarter decisions about when to buy, sell, or shift energy consumption.
        </p>
      </div>

      {/* What each view does */}
      <Section title="What does each view tell you?">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
          {[
            {
              view: 'Forecast',
              color: '#E8640A',
              what: 'Predicted electricity prices for the next 72 hours at 15-min resolution.',
              use: 'Decide when to charge batteries, run heavy industrial loads, or activate hedging contracts.',
            },
            {
              view: 'Backtest',
              color: '#378ADD',
              what: 'Comparison of past model predictions vs actual market prices.',
              use: 'Evaluate how accurate the model was over the last 1, 3, 7, or 14 days. MAE tells you the average error in €/MWh.',
            },
            {
              view: 'Energy Mix',
              color: '#1D9E75',
              what: 'Renewable vs conventional generation over the last 7 days.',
              use: 'Understand what drove prices — high solar/wind usually means cheaper prices; gas-heavy periods tend to be expensive.',
            },
          ].map(v => (
            <div key={v.view} style={{ background: accentBg, border: `1px solid ${border}`, borderTop: `3px solid ${v.color}`, borderRadius: 12, padding: '1.2rem' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: v.color, marginBottom: 8 }}>{v.view}</div>
              <p style={{ fontSize: '0.82rem', color: textBody, lineHeight: 1.6, marginBottom: 10 }}><strong style={{ color: textPrimary }}>Shows:</strong> {v.what}</p>
              <p style={{ fontSize: '0.82rem', color: textBody, lineHeight: 1.6 }}><strong style={{ color: textPrimary }}>Use it to:</strong> {v.use}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Model */}
      <Section title="How the model works">
        <Card accent="#E8640A">
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: textPrimary, marginBottom: 6 }}>
            XGBoost — Multi-Regime
          </div>
          <p style={{ fontSize: '0.85rem', color: textBody, lineHeight: 1.7, marginBottom: 12 }}>
            The market doesn't behave the same way in all conditions. During normal periods, prices follow predictable patterns. During spikes or negative price events, different forces drive the market. To handle this, we use <strong style={{ color: textPrimary }}>three separate XGBoost models</strong> — one for each regime — plus a classifier that decides which model to use for each prediction.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Normal regime', sub: 'Most hours', color: '#1D9E75' },
              { label: 'Positive spike', sub: 'Price > 140 €/MWh', color: '#E8640A' },
              { label: 'Negative prices', sub: 'Price < 0 €/MWh', color: '#378ADD' },
            ].map(r => (
              <div key={r.label} style={{ background: r.color + '11', border: `1px solid ${r.color}33`, borderRadius: 8, padding: '0.7rem 1rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700, color: r.color }}>{r.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: textMuted, marginTop: 2 }}>{r.sub}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card accent="#9b59b6">
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: textPrimary, marginBottom: 6 }}>
            SHAP — Why this prediction?
          </div>
          <p style={{ fontSize: '0.85rem', color: textBody, lineHeight: 1.7 }}>
            The "Feature influence" panel explains every prediction. SHAP values show which inputs pushed the price up or down — for example, high solar radiation pushing prices down, or low wind onshore pushing them up. This makes the model transparent and actionable.
          </p>
        </Card>
      </Section>

      {/* Training data */}
      <Section title="Training data">
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Historical range</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: textPrimary, marginBottom: 4 }}>2018 — 2026</div>
              <div style={{ fontSize: '0.82rem', color: textBody, lineHeight: 1.6 }}>Over 267,000 data points at 15-min resolution. Covers multiple market regimes including the 2021–2022 energy crisis.</div>
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Input features (25 total)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <Tag label="price lags" color="#E8640A" />
                <Tag label="moving averages" color="#E8640A" />
                <Tag label="hour / day / month" color="#378ADD" />
                <Tag label="holidays" color="#378ADD" />
                <Tag label="generation" color="#1D9E75" />
                <Tag label="consumption" color="#1D9E75" />
                <Tag label="wind onshore" color="#1D9E75" />
                <Tag label="temperature" color="#378ADD" />
                <Tag label="solar radiation" color="#378ADD" />
                <Tag label="TTF gas price" color="#9b59b6" />
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* Live data */}
      <Section title="How data stays up to date">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
          {[
            { icon: '⚡', label: 'ENTSO-E', sub: 'Updated daily', detail: 'Prices, generation, load and wind data for the DE-LU zone. Fetched every morning automatically.', color: '#E8640A' },
            { icon: '🌤', label: 'Open-Meteo', sub: 'Updated daily', detail: 'Weather observations and 3-day forecast for Germany. Temperature, solar radiation, wind speed, cloud cover.', color: '#378ADD' },
            { icon: '⛽', label: 'TTF Gas', sub: 'Updated daily', detail: 'European natural gas benchmark price via Yahoo Finance. Highly correlated with electricity prices in Germany.', color: '#1D9E75' },
          ].map(s => (
            <div key={s.label} style={{ background: accentBg, border: `1px solid ${border}`, borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '1.2rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: textPrimary, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: s.color, marginBottom: 8 }}>{s.sub}</div>
              <p style={{ fontSize: '0.8rem', color: textBody, lineHeight: 1.6 }}>{s.detail}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, padding: '0.8rem 1rem', background: '#E8640A11', border: '1px solid #E8640A33', borderRadius: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#E8640A' }}>
            ⏰ All sources are fetched automatically every day at 06:00 UTC — no manual updates needed.
          </span>
        </div>
      </Section>

      {/* Footer */}
      <div style={{ padding: '1rem 1.2rem', background: accentBg, border: `1px solid ${border}`, borderRadius: 10, fontFamily: 'monospace', fontSize: '0.65rem', color: textMuted, letterSpacing: '0.06em' }}>
        Built by Javier Inocente · Le Wagon Berlin · April 2026 · DE-LU Electricity Market Forecasting
      </div>
    </div>
  )
}


export default function App() {
  const [view, setView] = useState('forecast')
  const [dark, setDark] = useState(true)
  const [now, setNow] = useState(new Date().toUTCString().replace('GMT', 'UTC'))

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toUTCString().replace('GMT', 'UTC')), 60000)
    return () => clearInterval(t)
  }, [])

  const bg = dark ? '#111' : '#bec3bf'
  const headerBorder = dark ? '#222' : '#bec3bf'
  const navColor = dark ? 'rgba(255,255,255,0.35)' : '#aaa'
  const navActive = dark ? '#fff' : '#111'
  const footerColor = dark ? 'rgba(255,255,255,0.15)' : '#ccc'

const views = [
{ id: 'forecast', label: 'Forecast', icon: '/icons8-prediction-64.png' },
  { id: 'backtest', label: 'Backtest', icon: '/icons8-history-50.png' },
  { id: 'energymix', label: 'Energy Mix', icon: '/icons8-solar-energy-50.png' },
  { id: 'about', label: 'About', icon: null },
]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; }
        body { background: ${bg}; transition: background 0.2s; overflow-x: hidden; }
        @media (max-width: 768px) {
          .two-col { grid-template-columns: 1fr !important; }
          .four-col { grid-template-columns: repeat(2, 1fr) !important; }
          .main-pad { padding: 1rem !important; }
        }
        button { transition: all 0.15s; }
        button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? '#333' : '#ddd'}; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: bg, transition: 'background 0.2s' }}>

        <header style={{ background: bg, height: 60, position: 'sticky', top: 0, zIndex: 100 }}>

          <div style={{ maxWidth: 1280, margin: '0 auto', height: '100%', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo dark={dark} />

            <nav style={{ display: 'flex', alignItems: 'center', gap: 20, background: dark ? '#2a2a2a' : '#dedede', borderRadius: 34, padding: '6px' }}>
              {views.map(v => (
                <button key={v.id} onClick={() => setView(v.id)} style={{
                  background: view === v.id ? (dark ? '#3a3a3a' : '#d3a5a5') : 'transparent',
                  color: view === v.id ? navActive : navColor,
                  border: 'none', borderRadius: 20,
                  padding: '6px 18px', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.82rem', fontWeight: view === v.id ? 600 : 400,
                  cursor: 'pointer', letterSpacing: '-0.01em',
                  boxShadow: view === v.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                }}>
                {v.icon && <img src={v.icon} style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'middle', opacity: view === v.id ? 1 : 0.4 }} />}
                {v.label}
              </button>
              ))}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: dark ? 'rgba(255,255,255,0.25)' : '#ccc' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', marginRight: 5, verticalAlign: 'middle' }} />
                {now}
              </span>
              <button onClick={() => setDark(!dark)} style={{ background: dark ? '#2a2a2a' : '#d8d7d1', border: 'none', borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', color: dark ? '#fff' : '#555' }}>
                {dark ? '☀️' : '🌙'}
              </button>
              <Avatar />
            </div>
          </div>
        </header>

        <main className="main-pad" style={{ padding: '5rem 2rem 4rem 2rem', maxWidth: 1280, margin: '0 auto' }}>
          {view === 'forecast' && <PredictView dark={dark} />}
          {view === 'backtest' && <BacktestView dark={dark} />}
          {view === 'energymix' && <EnergyMixView dark={dark} />}
          {view === 'about' && <AboutView dark={dark} />}
        </main>

        <footer style={{ padding: '1.2rem 2rem', marginTop: '4rem', borderTop: `1px solid ${headerBorder}` }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: footerColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Grid Intelligence · Le Wagon Berlin · April 2026 · DE-LU Electricity Market
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: footerColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Transformer V3 + XGBoost Spike Detector
            </span>
          </div>
        </footer>
      </div>
    </>
  )
}
