import {
  setConnected,
  setInitialState,
  setBotStatus,
  setWalletInfo,
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

export function connectWebSocket(dispatch) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

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

export function updateBotSettings(settings) {
  sendMessage('UPDATE_SETTINGS', settings)
}

export function getWalletInfo() {
  sendMessage('GET_WALLET_INFO')
}

