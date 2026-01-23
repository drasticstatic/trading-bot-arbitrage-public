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
  addTrade,
  updateSettings,
  addLog
} from './botSlice'

let ws = null
let reconnectTimeout = null

export function connectWebSocket(dispatch) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('WebSocket connected')
    dispatch(setConnected(true))
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
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

