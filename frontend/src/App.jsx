// src/App.jsx — Ember theme · grid·intelligence
// Drop-in replacement. Same backend endpoints. Dark mode default, light toggle.

import { useState, useEffect, useContext, createContext } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ============================================================================
// THEME
// ============================================================================

const THEME = {
  fonts: {
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  dark: {
    bg: '#16171a',
    surface: 'transparent',
    surfaceAlt: '#1b1c1f',
    border: '#26272a',
    borderStrong: '#33343a',
    text: '#ededea',
    textMuted: '#82827d',
    textFaint: '#5a5a55',
    accent: '#f0b070',
    accentSoft: 'rgba(240, 176, 112, 0.12)',
    pos: '#7dc497',
    neg: '#e08672',
    info: '#9aa5b8',
  },
  light: {
    bg: '#f7f6f2',
    surface: 'transparent',
    surfaceAlt: '#ffffff',
    border: '#e6e3da',
    borderStrong: '#d4cfc1',
    text: '#1a1a1a',
    textMuted: '#7a786f',
    textFaint: '#b3afa3',
    accent: '#c8721d',
    accentSoft: 'rgba(200, 114, 29, 0.10)',
    pos: '#3e9a64',
    neg: '#c4543e',
    info: '#6a7a92',
  },
}

const ThemeCtx = createContext(null)
const useTheme = () => useContext(ThemeCtx)

// ============================================================================
// ICONS (inline SVG, stroke-based)
// ============================================================================

const I = ({ children, size = 16, sw = 1.5, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
)
const Icon = {
  forecast: (p) => <I {...p}><path d="M3 17l5-6 4 3 5-7 4 5" /><circle cx="3" cy="17" r="1" fill="currentColor" stroke="none" /><circle cx="20" cy="12" r="1" fill="currentColor" stroke="none" /></I>,
  backtest: (p) => <I {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" /></I>,
  mix: (p) => <I {...p}><path d="M3 19c2-6 4-2 6-6s4 2 6-4 4 0 6-4" /><path d="M3 19h18" /></I>,
  about: (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v.01" /><path d="M11 12h1v5h1" /></I>,
  spike: (p) => <I {...p}><path d="M3 18l4-10 4 6 3-8 4 12 3-4" /></I>,
  negative: (p) => <I {...p}><path d="M5 12h14" /><path d="M12 5l-7 7 7 7" /></I>,
  volatility: (p) => <I {...p}><path d="M2 12c2-4 4 4 6 0s4-6 6 0 4 4 6-4" /></I>,
  signal: (p) => <I {...p}><path d="M4 20c0-9 7-16 16-16" /><path d="M4 20c0-5 4-9 9-9" /><circle cx="4" cy="20" r="1.5" fill="currentColor" stroke="none" /></I>,
  sun: (p) => <I {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></I>,
  moon: (p) => <I {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></I>,
  bolt: (p) => <I {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></I>,
  cloud: (p) => <I {...p}><path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A4 4 0 0 0 6 18h11z" /><circle cx="16" cy="6" r="2" /></I>,
  gas: (p) => <I {...p}><path d="M8 21h8" /><path d="M12 17v4" /><path d="M6 12c0-4 6-4 6-9 3 4 6 6 6 10a6 6 0 0 1-12 0z" /></I>,
}

// ============================================================================
// LOGO + LIVE INDICATORS
// ============================================================================

function LogoMark({ size = 26, pulse = false }) {
  const { palette } = useTheme()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke={palette.text} strokeOpacity="0.45" strokeWidth="1.25" />
      <path d="M9 4v16M15 4v16M4 9h16M4 15h16" stroke={palette.text} strokeOpacity="0.12" strokeWidth="0.75" />
      <path d="M5.5 16 L9.5 11 L13 13.5 L18.5 6.5" stroke={palette.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.5" cy="16" r="1.6" fill={palette.accent} />
      <circle cx="18.5" cy="6.5" r="1.6" fill={palette.accent}>
        {pulse && <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />}
      </circle>
    </svg>
  )
}

function Logo({ pulse = false }) {
  const { palette } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={26} pulse={pulse} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontFamily: THEME.fonts.sans, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: palette.text }}>
          grid<span style={{ color: palette.textMuted, fontWeight: 400 }}>·intelligence</span>
        </span>
        <span style={{ fontFamily: THEME.fonts.mono, fontSize: 9, color: palette.textFaint, marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          DE-LU · 15-min · v3
        </span>
      </div>
    </div>
  )
}

function LiveDot({ color, size = 6 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.35, animation: 'pulse-ring 1.8s ease-out infinite' }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }} />
    </span>
  )
}

function LiveSpectrum({ color, height = 11, bars = 4 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} style={{
          width: 2, height: '100%', background: color, borderRadius: 1,
          transformOrigin: 'bottom',
          animation: `spectrum-bar 1.1s ease-in-out ${i * 0.12}s infinite`,
        }} />
      ))}
    </span>
  )
}

function LoadingScreen({ label = 'Querying model' }) {
  const { palette } = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: 18 }}>
      <LogoMark size={48} pulse={true} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LiveSpectrum color={palette.accent} height={11} />
        <span style={{ fontFamily: THEME.fonts.mono, fontSize: 11, color: palette.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
    </div>
  )
}

function ErrorView({ message }) {
  const { palette } = useTheme()
  return (
    <div style={{ padding: '3rem 2rem', textAlign: 'center', fontFamily: THEME.fonts.mono, fontSize: 12, color: palette.neg }}>
      <div style={{ marginBottom: 8 }}>⚠ API connection failed</div>
      <div style={{ color: palette.textMuted, fontSize: 11 }}>{message}</div>
    </div>
  )
}

// ============================================================================
// PRIMITIVES
// ============================================================================

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

function formatHM(ts) {
  const d = new Date(ts)
  return d.toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' })
}
function formatDay(ts) {
  const d = new Date(ts)
  return d.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })
}
function downsample(data, maxPoints = 220) {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0)
}

function Card({ children, padding = 0, style = {} }) {
  const { palette } = useTheme()
  return (
    <div style={{
      background: 'transparent',
      border: `1px solid ${palette.border}`,
      borderRadius: 8,
      padding,
      ...style,
    }}>{children}</div>
  )
}

function PanelHeader({ title, tag, right }) {
  const { palette } = useTheme()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem', borderBottom: `1px solid ${palette.border}`, gap: 12 }}>
      <span style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {tag && (
          <span style={{ fontFamily: THEME.fonts.mono, fontSize: 9, color: palette.accent, background: palette.accentSoft, border: `1px solid ${palette.accent}33`, borderRadius: 4, padding: '3px 8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{tag}</span>
        )}
        {right}
      </div>
    </div>
  )
}

function Panel({ title, tag, right, children, bodyStyle }) {
  return (
    <Card>
      {title && <PanelHeader title={title} tag={tag} right={right} />}
      <div style={{ padding: '1.15rem', ...bodyStyle }}>{children}</div>
    </Card>
  )
}

function Metric({ label, value, unit, sub, accent, big }) {
  const { palette } = useTheme()
  const valueColor = accent || palette.text
  return (
    <div style={{ padding: '14px 0 14px 14px', borderLeft: `2px solid ${accent || palette.borderStrong}`, background: 'transparent' }}>
      <div style={{ fontFamily: THEME.fonts.mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: palette.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: THEME.fonts.sans, fontWeight: 600, fontSize: big ? '2.4rem' : '1.85rem', lineHeight: 1, color: valueColor, letterSpacing: '-0.02em' }}>
        {value}
        {unit && <span style={{ fontFamily: THEME.fonts.mono, fontSize: 12, fontWeight: 400, color: palette.textMuted, marginLeft: 6, letterSpacing: 0 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textFaint, marginTop: 8, letterSpacing: '0.04em' }}>{sub}</div>}
    </div>
  )
}

function MetricGrid({ children, cols = 4 }) {
  return <div className="metric-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>
}

function CustomTooltip({ active, payload, label, formatter }) {
  const { palette } = useTheme()
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: palette.surfaceAlt, border: `1px solid ${palette.borderStrong}`, borderRadius: 6, padding: '8px 12px', fontFamily: THEME.fonts.mono, fontSize: 11, color: palette.text, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
      <div style={{ color: palette.textMuted, fontSize: 10, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 1, background: p.color, display: 'inline-block' }} />
          <span style={{ color: palette.textMuted }}>{p.name || p.dataKey}:</span>
          <span style={{ color: palette.text, fontWeight: 500 }}>
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ children, icon }) {
  const { palette } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, letterSpacing: '0.16em', textTransform: 'uppercase', paddingBottom: 4 }}>
      {icon && <span style={{ color: palette.accent, display: 'flex' }}>{icon}</span>}
      {children}
    </div>
  )
}

function IntelRow({ icon, label, value, color, rec }) {
  const { palette } = useTheme()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', alignItems: 'center', gap: 12 }}>
      <span style={{ color: palette.textMuted, display: 'flex' }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: THEME.fonts.sans, fontSize: 12, color: palette.textMuted }}>{rec}</span>
      </div>
      <span style={{ fontFamily: THEME.fonts.mono, fontSize: 13, fontWeight: 500, color }}>{value}</span>
    </div>
  )
}

function ShapBar({ feature, value, max }) {
  const { palette } = useTheme()
  const label = FEATURE_LABELS[feature] || feature
  const isUp = value > 0
  const color = isUp ? palette.neg : palette.pos
  const pct = Math.min(100, Math.abs(value) / max * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontFamily: THEME.fonts.sans, fontSize: 12, color: palette.text }}>{label}</span>
        <span style={{ fontFamily: THEME.fonts.mono, fontSize: 11, color, fontWeight: 500 }}>
          {isUp ? '+' : ''}{value.toFixed(2)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 3, background: palette.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: isUp ? '50%' : `${50 - pct/2}%`, top: 0, height: '100%', width: `${pct/2}%`, background: color, borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: palette.borderStrong, opacity: 0.6 }} />
      </div>
    </div>
  )
}

// ============================================================================
// FORECAST
// ============================================================================

function ForecastView() {
  const { palette } = useTheme()
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

  if (loading) return <LoadingScreen label="Predicting 72h ahead" />
  if (error || !data) return <ErrorView message={error} />

  const prices = data.predictions_15min
  const ts = data.timestamps
  const chartData = ts.map((t, i) => ({ ts: formatDay(t) + ' ' + formatHM(t), price: Number(prices[i]?.toFixed(2)) }))

  const minVal = Math.min(...prices)
  const maxVal = Math.max(...prices)
  const avgVal = prices.reduce((a, b) => a + b, 0) / prices.length
  const stdVal = Math.sqrt(prices.reduce((a, b) => a + (b - avgVal) ** 2, 0) / prices.length)
  const minTs = formatDay(ts[prices.indexOf(minVal)]) + ' · ' + formatHM(ts[prices.indexOf(minVal)])
  const maxTs = formatDay(ts[prices.indexOf(maxVal)]) + ' · ' + formatHM(ts[prices.indexOf(maxVal)])
  const spikeHours = prices.filter(p => p > 140).length / 4
  const negHours = prices.filter(p => p < 0).length / 4
  const regimeMap = { 0: 'Normal regime', 1: 'Positive spike', 2: 'Negative spike' }
  const regime = explain?.regime ?? 0
  const signal = avgVal < 100
    ? { label: 'BUY', color: palette.pos, rec: 'Charge / load up' }
    : avgVal <= 200
      ? { label: 'HOLD', color: palette.accent, rec: 'Monitor closely' }
      : { label: 'SELL', color: palette.neg, rec: 'Reduce load' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <SectionLabel icon={<Icon.forecast size={13} />}>Forecast · 72h ahead · 15-min resolution</SectionLabel>

      <MetricGrid cols={4}>
        <Metric label="Min · 72h" value={minVal.toFixed(1)} unit="€/MWh" sub={minTs} accent={palette.pos} />
        <Metric label="Max · 72h" value={maxVal.toFixed(1)} unit="€/MWh" sub={maxTs} accent={maxVal > 140 ? palette.neg : palette.accent} />
        <Metric label="Avg · 72h" value={avgVal.toFixed(1)} unit="€/MWh" sub={`σ ± ${stdVal.toFixed(1)}`} accent={palette.info} />
        <Metric label="Signal" value={signal.label} sub={signal.rec} accent={signal.color} />
      </MetricGrid>

      <Panel title="Price forecast · 15-min · Europe/Berlin" tag="72h horizon" right={<LiveSpectrum color={palette.accent} height={11} />}>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.accent} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
              <XAxis dataKey="ts" tick={{ fill: palette.textFaint, fontSize: 10, fontFamily: THEME.fonts.mono }} interval={Math.floor(chartData.length / 8)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: palette.textFaint, fontSize: 10, fontFamily: THEME.fonts.mono }} tickFormatter={v => `${v}`} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip formatter={v => `${v.toFixed(1)} €/MWh`} />} />
              <ReferenceLine y={140} stroke={palette.neg} strokeDasharray="3 4" strokeOpacity={0.4} label={{ value: 'spike 140€', fill: palette.neg, fontSize: 9, fontFamily: THEME.fonts.mono, opacity: 0.7, position: 'insideTopRight' }} />
              <ReferenceLine y={0} stroke={palette.info} strokeDasharray="3 4" strokeOpacity={0.35} />
              <Area type="monotone" dataKey="price" stroke={palette.accent} strokeWidth={1.6} fill="url(#priceGrad)" dot={false} activeDot={{ r: 4, fill: palette.accent, stroke: palette.bg, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Panel title="Market intelligence">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <IntelRow icon={<Icon.spike size={14} />} label="Spike risk" value={`${spikeHours.toFixed(0)}h above 140€`} color={spikeHours > 0 ? palette.neg : palette.pos} rec={spikeHours > 0 ? 'Activate hedging' : 'No spike risk'} />
            <IntelRow icon={<Icon.negative size={14} />} label="Negative prices" value={`${negHours.toFixed(0)}h below 0€`} color={negHours > 0 ? palette.pos : palette.text} rec={negHours > 0 ? 'Maximize load' : 'None expected'} />
            <IntelRow icon={<Icon.volatility size={14} />} label="Volatility" value={`σ = ${stdVal.toFixed(1)} €`} color={stdVal > 40 ? palette.neg : stdVal > 20 ? palette.accent : palette.pos} rec={stdVal > 40 ? 'High — trade actively' : stdVal > 20 ? 'Moderate' : 'Stable'} />
            <IntelRow icon={<Icon.signal size={14} />} label="Signal" value={signal.label} color={signal.color} rec={signal.rec} />
          </div>
        </Panel>

        <Panel title="Feature influence" tag={regimeMap[regime]}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {explain?.top_features.map((f, i) => (
              <ShapBar key={i} feature={f.feature} value={f.shap_value} max={Math.max(...explain.top_features.map(x => Math.abs(x.shap_value)))} />
            ))}
            {!explain && <div style={{ color: palette.textMuted, fontSize: 12, fontFamily: THEME.fonts.mono }}>Unavailable</div>}
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ============================================================================
// BACKTEST
// ============================================================================

function BacktestView() {
  const { palette } = useTheme()
  const [data, setData] = useState(null)
  const [days, setDays] = useState(14)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/backtest?days=14`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading backtest" />
  if (error || !data?.actual) return <ErrorView message={error || 'No backtest data'} />

  const cutoff = new Date(data.timestamps[data.timestamps.length - 1])
  cutoff.setDate(cutoff.getDate() - days)
  const filtered = data.timestamps
    .map((t, i) => ({ ts: formatDay(t), actual: data.actual[i], predicted: data.predicted[i] }))
    .filter((_, i) => new Date(data.timestamps[i]) >= cutoff)

  const maes = filtered.map(d => Math.abs((d.actual || 0) - (d.predicted || 0)))
  const mae = maes.reduce((a, b) => a + b, 0) / maes.length
  const rmse = Math.sqrt(maes.reduce((a, b) => a + b * b, 0) / maes.length)
  const residual = downsample(filtered.map(d => ({ ts: d.ts, err: (d.predicted || 0) - (d.actual || 0) })))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <SectionLabel icon={<Icon.backtest size={13} />}>Backtest · Model accuracy review</SectionLabel>
        <div style={{ display: 'flex', gap: 4, padding: 3, border: `1px solid ${palette.border}`, borderRadius: 999 }}>
          {[1, 3, 7, 14].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              background: days === d ? palette.accent : 'transparent',
              color: days === d ? palette.bg : palette.textMuted,
              border: 'none', borderRadius: 999, padding: '5px 14px',
              fontFamily: THEME.fonts.mono, fontSize: 11, cursor: 'pointer',
              fontWeight: days === d ? 600 : 400, letterSpacing: '0.04em',
            }}>{d}D</button>
          ))}
        </div>
      </div>

      <MetricGrid cols={4}>
        <Metric label={`MAE · ${days}d`} value={mae.toFixed(1)} unit="€/MWh" sub={`${filtered.length.toLocaleString()} pts`} accent={palette.accent} big />
        <Metric label="RMSE" value={rmse.toFixed(1)} unit="€/MWh" sub="Root mean sq. error" accent={palette.info} />
        <Metric label="Coverage" value={days} unit="days" sub="Sliding window" accent={palette.pos} />
        <Metric label="Resolution" value="15" unit="min" sub="Quarter-hour bars" accent={palette.info} />
      </MetricGrid>

      <Panel title={`Actual vs predicted · ${days}-day window`} tag={`MAE ${mae.toFixed(1)}€`} right={<LiveSpectrum color={palette.accent} height={11} />}>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <LineChart data={downsample(filtered)} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
              <XAxis dataKey="ts" tick={{ fill: palette.textFaint, fontSize: 10, fontFamily: THEME.fonts.mono }} interval={Math.floor(filtered.length / 7)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: palette.textFaint, fontSize: 10, fontFamily: THEME.fonts.mono }} tickFormatter={v => `${v}`} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip formatter={v => `${v?.toFixed(1)} €/MWh`} />} />
              <Legend wrapperStyle={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, paddingTop: 8 }} iconType="plainline" iconSize={18} />
              <Line type="monotone" dataKey="actual" stroke={palette.info} strokeWidth={1.4} dot={false} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke={palette.accent} strokeWidth={1.6} dot={false} name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Residual error · predicted − actual">
        <div style={{ width: '100%', height: 140 }}>
          <ResponsiveContainer>
            <AreaChart data={residual} margin={{ top: 6, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.accent} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
              <XAxis dataKey="ts" hide />
              <YAxis tick={{ fill: palette.textFaint, fontSize: 10, fontFamily: THEME.fonts.mono }} axisLine={false} tickLine={false} width={36} />
              <ReferenceLine y={0} stroke={palette.borderStrong} />
              <Tooltip content={<CustomTooltip formatter={v => `${v?.toFixed(1)} €`} />} />
              <Area type="monotone" dataKey="err" stroke={palette.accent} strokeWidth={1} fill="url(#resGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}

// ============================================================================
// ENERGY MIX
// ============================================================================

function EnergyMixView() {
  const { palette } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/energy-mix?days=7`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading energy mix" />
  if (error || !data?.timestamps) return <ErrorView message={error || 'Energy mix unavailable'} />

  const chart = data.timestamps.map((t, i) => ({
    ts: formatDay(t) + ' ' + formatHM(t),
    renewable: data.generation_renewable[i],
    conventional: data.generation_non_renewable[i],
    consumption: data.consumption[i],
  }))

  const validR = data.generation_renewable.filter(Boolean)
  const validNR = data.generation_non_renewable.filter(Boolean)
  const validC = data.consumption.filter(Boolean)
  const avgR = validR.reduce((a, b) => a + b, 0) / validR.length
  const avgNR = validNR.reduce((a, b) => a + b, 0) / validNR.length
  const avgC = validC.reduce((a, b) => a + b, 0) / validC.length
  const share = avgR / (avgR + avgNR) * 100
  const peakR = Math.max(...data.generation_renewable.filter(v => v != null))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionLabel icon={<Icon.mix size={13} />}>Energy mix · Last 7 days · DE-LU</SectionLabel>

      <MetricGrid cols={4}>
        <Metric label="Renewable share" value={share.toFixed(1)} unit="%" sub="7-day average" accent={palette.pos} big />
        <Metric label="Avg renewable" value={(avgR / 1000).toFixed(1)} unit="GW" sub={`peak ${(peakR/1000).toFixed(1)} GW`} accent={palette.pos} />
        <Metric label="Avg conventional" value={(avgNR / 1000).toFixed(1)} unit="GW" sub="Gas + coal + nuclear" accent={palette.neg} />
        <Metric label="Avg consumption" value={(avgC / 1000).toFixed(1)} unit="GW" sub="DE-LU total load" accent={palette.info} />
      </MetricGrid>

      <Panel title="Generation vs consumption · 7-day window" tag="15-min resolution" right={<LiveSpectrum color={palette.accent} height={11} />}>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <AreaChart data={downsample(chart.filter(d => d.renewable != null || d.consumption != null), 250)} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="renewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.pos} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={palette.pos} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.neg} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={palette.neg} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
              <XAxis dataKey="ts" tick={{ fill: palette.textFaint, fontSize: 10, fontFamily: THEME.fonts.mono }} interval="preserveStartEnd" minTickGap={70} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: palette.textFaint, fontSize: 10, fontFamily: THEME.fonts.mono }} tickFormatter={v => `${(v/1000).toFixed(0)}`} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip formatter={v => `${(v/1000)?.toFixed(1)} GW`} />} />
              <Legend wrapperStyle={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, paddingTop: 8 }} iconType="plainline" iconSize={18} />
              <Area type="monotone" dataKey="renewable" stroke={palette.pos} strokeWidth={1.4} fill="url(#renewGrad)" dot={false} name="Renewable" connectNulls />
              <Area type="monotone" dataKey="conventional" stroke={palette.neg} strokeWidth={1.4} fill="url(#convGrad)" dot={false} name="Conventional" connectNulls />
              <Line type="monotone" dataKey="consumption" stroke={palette.accent} strokeWidth={1.6} dot={false} name="Consumption" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}

// ============================================================================
// ABOUT
// ============================================================================

function AboutView() {
  const { palette } = useTheme()

  const Heading = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 18, borderBottom: `1px solid ${palette.border}` }}>
      <div style={{ width: 2, height: 14, background: palette.accent, borderRadius: 1 }} />
      <h2 style={{ fontFamily: THEME.fonts.sans, fontSize: 15, fontWeight: 600, color: palette.text, letterSpacing: '-0.01em', margin: 0 }}>{children}</h2>
    </div>
  )

  const viewCards = [
    { view: 'Forecast', what: 'Predicted electricity prices for the next 72 hours at 15-min resolution.', use: 'Decide when to charge batteries, run heavy industrial loads, or activate hedging contracts.' },
    { view: 'Backtest', what: 'Comparison of past model predictions vs actual market prices.', use: 'Evaluate accuracy over 1, 3, 7 or 14 days. MAE shows the average error in €/MWh.' },
    { view: 'Energy mix', what: 'Renewable vs conventional generation over the last 7 days.', use: 'Understand what drove prices — high solar/wind usually means cheaper prices.' },
  ]

  const tags = ['price lags', 'moving averages', 'hour / day / month', 'holidays', 'generation', 'consumption', 'wind onshore', 'temperature', 'solar radiation', 'TTF gas price']

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
      <div>
        <h1 style={{ fontFamily: THEME.fonts.sans, fontSize: 38, fontWeight: 600, letterSpacing: '-0.03em', color: palette.text, lineHeight: 1, margin: '20px 0 16px' }}>
          grid<span style={{ color: palette.accent }}>·intelligence</span>
        </h1>
        <p style={{ fontFamily: THEME.fonts.sans, fontSize: 15, color: palette.textMuted, lineHeight: 1.7, maxWidth: 620, margin: 0 }}>
          A forecasting tool for day-ahead electricity prices in the German-Luxembourg market (DE-LU). It helps energy traders, industrial consumers, and grid operators make smarter decisions about when to buy, sell, or shift consumption.
        </p>
      </div>

      <div>
        <Heading>What each view tells you</Heading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="three-col">
          {viewCards.map(v => (
            <Card key={v.view} padding="16px">
              <div style={{ fontFamily: THEME.fonts.sans, fontSize: 14, fontWeight: 600, color: palette.accent, marginBottom: 10, letterSpacing: '-0.01em' }}>{v.view}</div>
              <p style={{ fontFamily: THEME.fonts.sans, fontSize: 12.5, color: palette.text, lineHeight: 1.6, marginBottom: 8 }}>{v.what}</p>
              <p style={{ fontFamily: THEME.fonts.sans, fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>{v.use}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <Heading>How the model works</Heading>
        <Card padding="22px 26px">
          <div style={{ fontFamily: THEME.fonts.sans, fontSize: 15, fontWeight: 600, color: palette.text, marginBottom: 10, letterSpacing: '-0.02em' }}>XGBoost · Multi-regime</div>
          <p style={{ fontFamily: THEME.fonts.sans, fontSize: 13.5, color: palette.textMuted, lineHeight: 1.7, marginBottom: 18 }}>
            The market doesn't behave the same way in all conditions. We use three separate XGBoost models — one per regime — plus a classifier that decides which model to use for each prediction.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} className="three-col">
            {[
              { label: 'Normal regime', sub: 'Most hours', color: palette.pos },
              { label: 'Positive spike', sub: '> 140 €/MWh', color: palette.neg },
              { label: 'Negative prices', sub: '< 0 €/MWh', color: palette.info },
            ].map(r => (
              <div key={r.label} style={{ background: `${r.color}14`, border: `1px solid ${r.color}33`, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontFamily: THEME.fonts.mono, fontSize: 11, fontWeight: 600, color: r.color, letterSpacing: '0.04em' }}>{r.label}</div>
                <div style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textFaint, marginTop: 3, letterSpacing: '0.04em' }}>{r.sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <Heading>Training data</Heading>
        <Card padding="22px 26px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="two-col">
            <div>
              <div style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Historical range</div>
              <div style={{ fontFamily: THEME.fonts.sans, fontSize: 28, fontWeight: 600, color: palette.text, marginBottom: 6, letterSpacing: '-0.025em' }}>2018 — 2026</div>
              <div style={{ fontFamily: THEME.fonts.sans, fontSize: 12.5, color: palette.textMuted, lineHeight: 1.6 }}>Over 267,000 data points at 15-min resolution. Covers multiple market regimes including the 2021–2022 energy crisis.</div>
            </div>
            <div>
              <div style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Input features · 25 total</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {tags.map(t => (
                  <span key={t} style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, border: `1px solid ${palette.border}`, borderRadius: 3, padding: '3px 8px' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Heading>Data sources</Heading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="three-col">
          {[
            { Ic: Icon.bolt, label: 'ENTSO-E', sub: 'Updated daily', detail: 'Prices, generation, load and wind data for the DE-LU zone.' },
            { Ic: Icon.cloud, label: 'Open-Meteo', sub: 'Updated daily', detail: 'Weather observations and 3-day forecast: temperature, solar radiation, wind, cloud cover.' },
            { Ic: Icon.gas, label: 'TTF gas', sub: 'Updated daily', detail: 'European natural gas benchmark via Yahoo Finance. Highly correlated with DE prices.' },
          ].map(s => (
            <Card key={s.label} padding="16px 18px">
              <div style={{ color: palette.accent, marginBottom: 10, display: 'flex' }}><s.Ic size={20} /></div>
              <div style={{ fontFamily: THEME.fonts.sans, fontSize: 14, fontWeight: 600, color: palette.text, marginBottom: 2, letterSpacing: '-0.01em' }}>{s.label}</div>
              <div style={{ fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textMuted, marginBottom: 8, letterSpacing: '0.06em' }}>{s.sub}</div>
              <p style={{ fontFamily: THEME.fonts.sans, fontSize: 12, color: palette.textMuted, lineHeight: 1.6, margin: 0 }}>{s.detail}</p>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: palette.accentSoft, border: `1px solid ${palette.accent}33`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <LiveDot color={palette.accent} size={6} />
          <span style={{ fontFamily: THEME.fonts.mono, fontSize: 11, color: palette.accent, letterSpacing: '0.04em' }}>
            All sources refresh automatically every day at 06:00 UTC — no manual updates needed.
          </span>
        </div>
      </div>

      <div style={{ padding: '14px 18px', border: `1px solid ${palette.border}`, borderRadius: 6, fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textFaint, letterSpacing: '0.1em' }}>
        Built by Javier Inocente · Le Wagon Berlin · April 2026 · DE-LU electricity market forecasting
      </div>
    </div>
  )
}

// ============================================================================
// SHELL
// ============================================================================

function Nav({ view, setView }) {
  const { palette } = useTheme()
  const views = [
    { id: 'forecast', label: 'Forecast', Ic: Icon.forecast },
    { id: 'backtest', label: 'Backtest', Ic: Icon.backtest },
    { id: 'energymix', label: 'Energy mix', Ic: Icon.mix },
    { id: 'about', label: 'About', Ic: Icon.about },
  ]
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {views.map(v => {
        const active = view === v.id
        return (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            background: 'transparent',
            color: active ? palette.text : palette.textMuted,
            border: 'none', borderRadius: 0,
            padding: '8px 14px', margin: 0,
            fontFamily: THEME.fonts.sans, fontSize: 13, fontWeight: active ? 500 : 400,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            letterSpacing: '-0.005em',
            borderBottom: `1.5px solid ${active ? palette.accent : 'transparent'}`,
            transition: 'color 0.15s',
          }}>
            <v.Ic size={14} />
            {v.label}
          </button>
        )
      })}
    </nav>
  )
}

function ModeToggle({ mode, setMode }) {
  const { palette } = useTheme()
  return (
    <button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} style={{
      background: 'transparent', border: `1px solid ${palette.border}`, borderRadius: 999,
      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: palette.textMuted,
    }} title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}>
      {mode === 'dark' ? <Icon.sun size={14} /> : <Icon.moon size={14} />}
    </button>
  )
}

function Avatar() {
  const { palette } = useTheme()
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: palette.accentSoft, border: `1px solid ${palette.accent}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: palette.accent, fontSize: 10, fontWeight: 600,
      fontFamily: THEME.fonts.mono, cursor: 'pointer', letterSpacing: '0.04em',
    }}>JI</div>
  )
}

function StatusBar() {
  const { palette } = useTheme()
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: THEME.fonts.mono, fontSize: 10, color: palette.textFaint, letterSpacing: '0.08em' }}>
      <LiveDot color={palette.pos} size={6} />
      <span style={{ textTransform: 'uppercase' }}>
        Live · {now.toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' })} UTC
      </span>
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('grid-mode') || 'dark')
  const [view, setView] = useState(() => localStorage.getItem('grid-view') || 'forecast')

  useEffect(() => { localStorage.setItem('grid-mode', mode) }, [mode])
  useEffect(() => { localStorage.setItem('grid-view', view) }, [view])

  const palette = THEME[mode]

  useEffect(() => {
    document.body.style.background = palette.bg
    document.body.style.color = palette.text
  }, [palette.bg, palette.text])

  return (
    <ThemeCtx.Provider value={{ palette, mode }}>
      <div style={{ minHeight: '100vh', background: palette.bg, color: palette.text, fontFamily: THEME.fonts.sans }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: palette.bg }}>
          <div className="container" style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <Logo pulse={true} />
            <Nav view={view} setView={setView} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <StatusBar />
              <ModeToggle mode={mode} setMode={setMode} />
              <Avatar />
            </div>
          </div>
        </header>

        <main className="container" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>
          {view === 'forecast' && <ForecastView />}
          {view === 'backtest' && <BacktestView />}
          {view === 'energymix' && <EnergyMixView />}
          {view === 'about' && <AboutView />}
        </main>

        <footer style={{ borderTop: `1px solid ${palette.border}`, padding: '18px 32px', marginTop: 32 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: THEME.fonts.mono, fontSize: 9, color: palette.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              grid·intelligence · Le Wagon Berlin · 2026
            </span>
            <span style={{ fontFamily: THEME.fonts.mono, fontSize: 9, color: palette.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              XGBoost multi-regime · SHAP explainable
            </span>
          </div>
        </footer>
      </div>
    </ThemeCtx.Provider>
  )
}
