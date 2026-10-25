import {
  setConnected,
  setInitialState,
  setBotStatus,
  setWalletInfo,
  setEdge,
  setEdgeSnapshot,
  updateScreener,
  setSelectedPair,
  setAnalysisResult,
  setOpportunity,
  setTradeStatus,
  addTradeStep,
  clearTradeSteps,
  addTrade,
  updateSettings,
  addLog
} from './botSlice'

let ws = null
let reconnectTimeout = null
let snapshotLoaded = false

// The public mirror has no bot behind it. The daily report publishes a snapshot of the edge study
// (frontend/public/edge/latest.json → <base>/edge/latest.json); load it so the page shows the real
// study instead of an empty shell. Aggregates and public pool prices only.
export async function loadEdgeSnapshot(dispatch) {
  if (snapshotLoaded) return
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
  try {
    const res = await fetch(`${base.replace(/\/?$/, '/')}edge/latest.json`, { cache: 'no-store' })
    if (!res.ok) return
    const snap = await res.json()
    if (snap && snap.edge) {
      snapshotLoaded = true
      dispatch(setEdgeSnapshot(snap))
    }
  } catch {
    // no snapshot published yet
  }
}

export function connectWebSocket(dispatch) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const isStaticHost = /github\.io$|githubusercontent\.com$/.test(window.location.hostname)
  if (isStaticHost) loadEdgeSnapshot(dispatch)

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

