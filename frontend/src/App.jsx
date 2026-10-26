import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectWebSocket, isStaticHost } from './store/websocket'
import TopBar from './components/TopBar'
import PanelBoundary from './components/PanelBoundary'
import TradeExecutionOverlay from './components/TradeExecutionOverlay'
import GHPagesBanner from './components/GHPagesBanner'
import EdgeStudyPanel from './components/EdgeStudyPanel'
import ScreenerView from './views/ScreenerView'
import JournalView from './views/JournalView'
import PerpsView from './views/PerpsView'
import ControlsView from './views/ControlsView'

/**
 * App — the terminal shell. One sticky vitals bar, five views behind tabs (the URL hash remembers
 * which), a footer that knows the demo's own history. Keys 1–5 switch views.
 */
const TABS = [
  { id: 'edge', label: 'Edge', key: '1' },
  { id: 'screener', label: 'Screener', key: '2' },
  { id: 'journal', label: 'Journal', key: '3' },
  { id: 'perps', label: 'Perps', key: '4' },
  { id: 'controls', label: 'Controls', key: '5' }
]
const readTab = () => {
  const h = (window.location.hash || '').replace('#', '')
  return TABS.some(t => t.id === h) ? h : 'edge'
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ft-theme') || 'auto' } catch { return 'auto' }
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = theme
    try { localStorage.setItem('ft-theme', theme) } catch { /* ignore */ }
  }, [theme])
  const cycle = useCallback(() => setTheme(t => (t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto')), [])
  return [theme, cycle]
}

// A real profitable trade earns a moment; nothing else on the page moves on its own.
function Confetti({ show }) {
  if (!show) return null
  const colors = ['#35C47A', '#7FB2FF', '#E6A93C', '#E6EBF2']
  return (
    <div className="confetti" aria-hidden="true">
      {[...Array(80)].map((_, i) => (
        <i key={i} style={{ left: `${Math.random() * 100}%`, background: colors[i % colors.length], animationDelay: `${Math.random() * 0.6}s`, animationDuration: `${2 + Math.random() * 1.5}s` }} />
      ))}
    </div>
  )
}

export default function App() {
  const dispatch = useDispatch()
  const { connected, trades, screenerPairs, logs, lineage, edge, journal } = useSelector(state => state.bot)
  const [tab, setTab] = useState(readTab)
  const [theme, cycleTheme] = useTheme()
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastTradeCount, setLastTradeCount] = useState(0)
  const demo = isStaticHost()

  useEffect(() => { connectWebSocket(dispatch) }, [dispatch])

  useEffect(() => {
    const onHash = () => setTab(readTab())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((id) => {
    if (window.location.hash !== `#${id}`) window.location.hash = id
    setTab(id)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return
      const t = TABS.find(x => x.key === e.key)
      if (t) go(t.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  useEffect(() => {
    if (trades.length > lastTradeCount) {
      const latest = trades[trades.length - 1]
      if (latest?.status === 'success' && parseFloat(latest?.profit || 0) > 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    }
    setLastTradeCount(trades.length)
  }, [trades, lastTradeCount])

  const oppCount = (screenerPairs || []).filter(p => (p.dexCount || 0) >= 2 && (p.hasExecutableOpportunity ?? p.hasOpportunity)).length
  const counts = {
    edge: edge?.enabled ? (edge.cleared || 0) : null,
    screener: oppCount || null,
    journal: journal?.unfiltered || (logs?.length || null),
    perps: (screenerPairs || []).filter(p => p.perp?.price).length || null,
    controls: null
  }

  const base = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/').replace(/\/?$/, '/')

  return (
    <div className="shell">
      <GHPagesBanner />
      <Confetti show={showConfetti} />
      <TradeExecutionOverlay />
      <TopBar />

      {!connected && !demo ? (
        <div className="disconnect"><div className="wrap">Not connected to the bot. Reconnecting… the bot keeps running without this page.</div></div>
      ) : null}

      <nav className="tabs" aria-label="Views">
        <div className="wrap tabs-in" role="tablist">
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className="tab" onClick={() => go(t.id)} title={`Press ${t.key}`}>
              {t.label}
              {counts[t.id] ? <span className="count">{counts[t.id]}</span> : null}
              <kbd>{t.key}</kbd>
            </button>
          ))}
          <span className="tabs-spacer" />
          <div className="tabs-tools">
            <button className="btn btn--quiet btn--sm" onClick={cycleTheme} title="Cycle the theme: follow the system, light, dark">
              {theme === 'auto' ? 'Theme · system' : theme === 'light' ? 'Theme · light' : 'Theme · dark'}
            </button>
          </div>
        </div>
      </nav>

      <main className="wrap view">
        {tab === 'edge' ? <PanelBoundary name="Edge study"><EdgeStudyPanel /></PanelBoundary> : null}
        {tab === 'screener' ? <PanelBoundary name="Screener"><ScreenerView /></PanelBoundary> : null}
        {tab === 'journal' ? <PanelBoundary name="Journal"><JournalView /></PanelBoundary> : null}
        {tab === 'perps' ? <PanelBoundary name="Perps"><PerpsView /></PanelBoundary> : null}
        {tab === 'controls' ? <PanelBoundary name="Controls"><ControlsView /></PanelBoundary> : null}
      </main>

      <footer className="footer">
        <div className="wrap footer-in">
          <span>
            FortunaTrades ARB · the DEX lane of the fleet · built on the DApp University arbitrage framework by <a href="https://drasticstatic.github.io/resume/index.html" target="_blank" rel="noopener noreferrer">drasticstatic</a>, extended with Claude
          </span>
          <span className="row">
            <a href="https://github.com/drasticstatic/trading-bot-arbitrage-public" target="_blank" rel="noopener noreferrer">Source</a>
            {lineage?.length ? (
              <span className="footer-versions" title="Every version of this demo stays up; the earlier ones greet you with a note and link forward">
                {lineage.filter(s => s.open).map(s => (
                  <a key={s.id} href={s.kind === 'live' ? base : `${base}${s.url}`} className={s.kind === 'live' ? 'is-live' : ''} title={s.note}>{s.label}{s.when ? ` · ${s.when}` : ''}</a>
                ))}
              </span>
            ) : null}
          </span>
        </div>
      </footer>
    </div>
  )
}
