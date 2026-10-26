import {
  setConnected,
  setInitialState,
  setBotStatus,
  setWalletInfo,
  setEdge,
  setEdgeSnapshot,
  setJournalDays,
  setJournalLoading,
  setJournalDay,
  setJournalError,
  setLineage,
  updateScreener,
  setSelectedPair,
  setAnalysisResult,
  setOpportunity,
  setTradeStatus,
  addTradeStep,
  clearTradeSteps,
  addTrade,
  updateSettings,
  addLog, addCandidate, setReadings } from './botSlice'
import { registerHouses } from '../lib/dex'

let ws = null
let reconnectTimeout = null
let snapshotLoaded = false

// The public mirror has no bot behind it. The daily report publishes a snapshot of the edge study
// (frontend/public/edge/latest.json → <base>/edge/latest.json); load it so the page shows the real
// study instead of an empty shell. Aggregates and public pool prices only.
/** Local only: the readings the bot computes across its logs. Refreshed on connect and every five minutes. */
let readingsTimer = null
export async function fetchReadings(dispatch) {
  if (isStaticHost()) return
  const get = (p) => fetch(p).then(r => (r.ok ? r.json() : null)).catch(() => null)
  const [hours, scatter, alerts, census] = await Promise.all([get('/api/edge/hours?days=7'), get('/api/edge/scatter?limit=1500'), get('/api/alerts/history?days=7'), get('/api/edge/census')])
  dispatch(setReadings({ hours, scatter, alerts, census }))
}

export async function loadEdgeSnapshot(dispatch) {
  if (snapshotLoaded) return
  try {
    const res = await fetch(`${baseUrl()}edge/latest.json`, { cache: 'no-store' })
    if (!res.ok) return
    const snap = await res.json()
    if (snap && snap.edge) {
      snapshotLoaded = true
      if (snap.costume && Array.isArray(snap.costume.houses)) { registerHouses(snap.costume.houses); try { document.documentElement.dataset.costume = '1' } catch { /* no DOM */ } } // the masquerade's venue colors and label widths
      dispatch(setEdgeSnapshot(snap))
      dispatch(setReadings({ hours: snap.hours || null, scatter: snap.scatter || null, alerts: snap.alerts || null, census: snap.census || null }))
    }
  } catch {
    // no snapshot published yet
  }
}

/** The public copy: GitHub Pages, or any host with ?public in the URL (preview the costumed copy on the bot's machine). */
export function isStaticHost() {
  if (/github\.io$|githubusercontent\.com$/.test(window.location.hostname)) return true
  try { return new URLSearchParams(window.location.search).has('public') } catch { return false }
}

function baseUrl() {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
  return base.replace(/\/?$/, '/')
}

// The public demo lists its own earlier versions (frontend/public/lineage/lineage.json).
export async function loadLineage(dispatch) {
  try {
    const res = await fetch(`${baseUrl()}lineage/lineage.json`, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    if (data && Array.isArray(data.stops)) dispatch(setLineage(data.stops))
  } catch {
    // no lineage published
  }
}

// REST (same origin; the Vite dev server proxies /api to :5050). None of this exists on the public demo.
async function apiGet(path) {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) {
    let msg = `${res.status}`
    try { msg = (await res.json()).error || msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res.json()
}

export async function fetchJournalDays(dispatch) {
  if (isStaticHost()) { dispatch(setJournalError('unavailable')); return }
  try {
    dispatch(setJournalDays(await apiGet('/api/journal/days')))
  } catch (e) {
    dispatch(setJournalError(e.message === 'Failed to fetch' ? 'unavailable' : e.message))
  }
}

export async function fetchJournalDay(dispatch, { date, stream = 'activity', limit = 1000, q = '', level = '' } = {}) {
  if (isStaticHost()) { dispatch(setJournalError('unavailable')); return }
  dispatch(setJournalLoading(true))
  const qs = new URLSearchParams({ limit: String(limit), summary: '1' })
  if (date) qs.set('date', date)
  if (q) qs.set('q', q)
  if (level) qs.set('level', level)
  try {
    const out = await apiGet(`/api/journal/${stream}?${qs.toString()}`)
    dispatch(setJournalDay(out))
  } catch (e) {
    dispatch(setJournalError(e.message === 'Failed to fetch' ? 'unavailable' : e.message))
  }
}

export function connectWebSocket(dispatch) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  loadLineage(dispatch) // the version switcher reads frontend/public/lineage/lineage.json on every host
  if (isStaticHost()) { loadEdgeSnapshot(dispatch); return } // no bot behind the public copy: the snapshot is the data

  // Support both Vite (`import.meta.env.VITE_WS_URL`) and legacy CRA-style (`process.env.REACT_APP_WS_URL`).
  const explicitUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) ||
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_WS_URL)

  // Dev default: React dev server on :3000, backend WS on :5050.
  // Prod default: frontend served by backend, so same origin works.
  let wsUrl
  if (explicitUrl) {
    wsUrl = explicitUrl
  } else if (['3000', '3001', '5173', '4173'].includes(window.location.port)) {
    wsUrl = `${protocol}//${window.location.hostname}:5050`
  } else {
    wsUrl = `${protocol}//${window.location.host}`
  }

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('WebSocket connected')
    dispatch(setConnected(true))
    fetchReadings(dispatch)
    if (readingsTimer) clearInterval(readingsTimer)
    readingsTimer = setInterval(() => fetchReadings(dispatch), 5 * 60e3)
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    // Ask backend for wallet info on connect so the Wallet panel is populated even after page refresh.
    try {
      ws.send(JSON.stringify({ type: 'GET_WALLET_INFO', payload: {} }))
    } catch (e) {
      // Ignore
    }
  }

  ws.onclose = () => {
    console.log('WebSocket disconnected')
    dispatch(setConnected(false))
    reconnectTimeout = setTimeout(() => connectWebSocket(dispatch), 3000)
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.onmessage = (event) => {
    try {
      const { type, payload } = JSON.parse(event.data)

      switch (type) {
        case 'INITIAL_STATE':
          dispatch(setInitialState(payload))
          break
        case 'BOT_STATUS':
          dispatch(setBotStatus(payload))
          break
        case 'WALLET_INFO':
          dispatch(setWalletInfo(payload))
          break
        case 'SCREENER_UPDATE':
          dispatch(updateScreener(payload))
          break
        case 'EDGE_UPDATE':
          dispatch(setEdge(payload))
          break
        case 'EDGE_CANDIDATE':
          dispatch(addCandidate(payload))
          break
        case 'PAIR_SELECTED':
          dispatch(setSelectedPair(payload))
          break
        case 'ANALYSIS_RESULT':
          dispatch(setAnalysisResult(payload))
          break
        case 'OPPORTUNITY':
          dispatch(setOpportunity(payload))
          break
        case 'TRADE_STATUS':
          dispatch(setTradeStatus(payload))
          break
	        case 'TRADE_STEPS_RESET':
	          dispatch(clearTradeSteps())
	          break
	        case 'TRADE_STEP':
	          dispatch(addTradeStep(payload))
	          break
        case 'TRADE_COMPLETE':
          dispatch(addTrade(payload))
          dispatch(setTradeStatus(null))
          dispatch(setOpportunity(null))
          break
        case 'SETTINGS_UPDATE':
          dispatch(updateSettings(payload))
          break
        case 'LOG':
          dispatch(addLog(payload))
          break
        case 'DEPLOY_ESTIMATE':
          // Dispatch a custom event so components can listen
          window.dispatchEvent(new CustomEvent('deploy-estimate', { detail: payload }))
          break
        default:
          console.log('Unknown message type:', type)
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }
}

export function sendMessage(type, payload = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }))
  }
}

export function checkPrices() {
  sendMessage('CHECK_PRICES')
}

export function selectPair(pairName) {
  sendMessage('SELECT_PAIR', { pairName })
}

export function executeTrade() {
  sendMessage('EXECUTE_TRADE')
}

export function analyzePair(pairName) {
  sendMessage('ANALYZE_PAIR', { pairName })
}

export function updateBotSettings(settings) {
  sendMessage('UPDATE_SETTINGS', settings)
}

export function getWalletInfo() {
  sendMessage('GET_WALLET_INFO')
}

export function estimateDeployCost() {
  sendMessage('ESTIMATE_DEPLOY_COST')
}

