import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectWebSocket, isStaticHost } from './store/websocket'
import TopBar from './components/TopBar'
import Hero from './components/Hero'
import PanelBoundary from './components/PanelBoundary'
import TradeExecutionOverlay from './components/TradeExecutionOverlay'
import GHPagesBanner from './components/GHPagesBanner'
import EdgeStudyPanel from './components/EdgeStudyPanel'
import AlertsDrawer, { useAlerts } from './components/AlertsDrawer'
import Guide from './components/Guide'
import Readings from './components/Readings'
import CensusPanel from './components/CensusPanel'
import ScreenerView from './views/ScreenerView'
import JournalView from './views/JournalView'
import PerpsView from './views/PerpsView'
import ControlsView from './views/ControlsView'

/**
 * App — one page that scrolls, like the original build, with a rail that follows you. The hero is
 * the takeaway; the sections below are the edge study, the screener, the journal, the perps read,
 * the controls and the guide. Keys 1–7 jump; the URL hash remembers where you were.
 */
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'ph-gauge', key: '1' },
  { id: 'edge', label: 'Edge', icon: 'ph-target', key: '2' },
  { id: 'screener', label: 'Screener', icon: 'ph-binoculars', key: '3' },
  { id: 'journal', label: 'Journal', icon: 'ph-notebook', key: '4' },
  { id: 'perps', label: 'Perps', icon: 'ph-chart-line-up', key: '5' },
  { id: 'controls', label: 'Controls', icon: 'ph-sliders-horizontal', key: '6' },
  { id: 'how', label: 'How it works', icon: 'ph-graduation-cap', key: '7' }
]

function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('ft-theme') || 'auto' } catch { return 'auto' } })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = theme
    try { localStorage.setItem('ft-theme', theme) } catch { /* ignore */ }
  }, [theme])
  const cycle = useCallback(() => setTheme(t => (t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto')), [])
  return [theme, cycle]
}

// A real profitable trade earns a moment; nothing else on the page celebrates on its own.
function Confetti({ show }) {
  if (!show) return null
  const colors = ['#4ADE80', '#67E8F9', '#A78BFA', '#FBBF24', '#F472B6']
  return (
    <div className="confetti" aria-hidden="true">
      {[...Array(90)].map((_, i) => (
        <i key={i} style={{ left: `${Math.random() * 100}%`, background: colors[i % colors.length], animationDelay: `${Math.random() * 0.6}s`, animationDuration: `${2 + Math.random() * 1.5}s` }} />
      ))}
    </div>
  )
}

/** Which section is under the rail right now. */
function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const els = ids.map(id => document.getElementById(id)).filter(Boolean)
    if (!els.length || typeof IntersectionObserver === 'undefined') return
    const visible = new Map()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)
      let best = null
      for (const id of ids) { const r = visible.get(id) || 0; if (r > 0 && (!best || r > best.r)) best = { id, r } }
      if (best) setActive(best.id)
    }, { rootMargin: '-110px 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [ids])
  return active
}

export default function App() {
  const dispatch = useDispatch()
  const { connected, trades, screenerPairs, logs, edge, journal } = useSelector(state => state.bot)
  const [theme, cycleTheme] = useTheme()
  const [showConfetti, setShowConfetti] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const lastTrades = useRef(0)
  const demo = isStaticHost()
  const { alerts, unseen, markSeen } = useAlerts()
  const ids = React.useMemo(() => SECTIONS.map(s => s.id), [])
  const active = useScrollSpy(ids)

  useEffect(() => { connectWebSocket(dispatch) }, [dispatch])

  const go = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`)
  }, [])

  // Land on the hash once the sections exist; keys 1–7 jump between them.
  useEffect(() => {
    const h = (window.location.hash || '').replace('#', '')
    if (h && ids.includes(h)) setTimeout(() => go(h), 50)
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return
      const s = SECTIONS.find(x => x.key === e.key)
      if (s) go(s.id)
      if (e.key === 'a' || e.key === 'A') setAlertsOpen(o => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, ids])

  useEffect(() => {
    if (trades.length > lastTrades.current) {
      const latest = trades[trades.length - 1]
      if (latest?.status === 'success' && parseFloat(latest?.profit || 0) > 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    }
    lastTrades.current = trades.length
  }, [trades])

  const oppCount = (screenerPairs || []).filter(p => (p.dexCount || 0) >= 2 && (p.hasExecutableOpportunity ?? p.hasOpportunity)).length
  const counts = {
    edge: edge?.enabled ? (edge.cleared || 0) : null,
    screener: oppCount || null,
    journal: journal?.unfiltered || (logs?.length || null),
    perps: (screenerPairs || []).filter(p => p.perp?.price).length || null
  }

  return (
    <div className="shell">
      <div className="bg" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />
      <GHPagesBanner />
      <Confetti show={showConfetti} />
      <TradeExecutionOverlay />
      <TopBar onAlerts={() => setAlertsOpen(o => !o)} alertCount={unseen} theme={theme} onTheme={cycleTheme} />
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} alerts={alerts} markSeen={markSeen} />

      {!connected && !demo ? (
        <div className="disconnect"><div className="wrap">Not connected to the bot. Reconnecting… the bot keeps running without this page.</div></div>
      ) : null}

      <nav className="rail" aria-label="Sections">
        <div className="wrap rail-in">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'is-on' : ''} onClick={(e) => { e.preventDefault(); go(s.id) }} title={`Press ${s.key}`}>
              <i className={`ph-duotone ${s.icon}`} aria-hidden="true" />
              {s.label}
              {counts[s.id] ? <span className="count">{counts[s.id]}</span> : null}
              <kbd>{s.key}</kbd>
            </a>
          ))}
        </div>
      </nav>

      <main className="wrap view">
        <Hero />
        <div className="sec" id="edge">
          <PanelBoundary name="Edge study"><EdgeStudyPanel /></PanelBoundary>
          <PanelBoundary name="Readings"><Readings /></PanelBoundary>
          <PanelBoundary name="The wider net"><CensusPanel /></PanelBoundary>
        </div>
        <div className="sec" id="screener"><PanelBoundary name="Screener"><ScreenerView /></PanelBoundary></div>
        <div className="sec" id="journal"><PanelBoundary name="Journal"><JournalView /></PanelBoundary></div>
        <div className="sec" id="perps"><PanelBoundary name="Perps"><PerpsView /></PanelBoundary></div>
        <div className="sec" id="controls"><PanelBoundary name="Controls"><ControlsView /></PanelBoundary></div>
        <div className="sec"><PanelBoundary name="How it works"><Guide /></PanelBoundary></div>
      </main>

      <footer className="footer">
        <div className="wrap footer-in">
          <span>FortunaTrades ARB · the DEX lane of the fleet · built on the DApp University arbitrage framework by <a href="https://drasticstatic.github.io/resume/index.html" target="_blank" rel="noopener noreferrer">drasticstatic</a>, extended with Claude</span>
          <span className="row">
            <a href="https://drasticstatic.github.io/trading-assistant-public-preview/data/progression/terminal/" target="_blank" rel="noopener noreferrer">Fortuna's perps terminal</a>
            <a href="#how">How it works</a>
            <a href="https://github.com/drasticstatic/trading-bot-arbitrage-public" target="_blank" rel="noopener noreferrer">Source</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
