import { createSlice } from '@reduxjs/toolkit'

// Load persisted trades from localStorage
const loadPersistedTrades = () => {
  try {
    const saved = localStorage.getItem('dappu_trades')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const initialState = {
  connected: false,
  isRunning: false,
  isExecuting: false,
  isTestMode: false,
  wallet: null,

  // Screener data - all pairs
  screenerPairs: [],
  screenerBlock: null,
  screenerTimestamp: null,
  threshold: 0.5,

  // Selected pair for trading
  selectedPair: null,

  // Analysis result (shows why trade failed/succeeded)
  analysisResult: null,

  // Per-pair analysis results (dropdown under each pair)
  analysisByPair: {},

  // Current opportunity
  opportunity: null,

  // Trade status
  tradeStatus: null,

  tradeSteps: [],

  // Settings
  settings: {
    priceDifference: 0.5,
    gasLimit: 600000,
    gasPrice: 0.1, // In Gwei (Arbitrum typically 0.1-1.0 Gwei)
    skipConfirmation: false,
    autoExecute: false,
    mevProtection: false
  },

  // Logs
  logs: [],

  // Trade history - load from localStorage
  trades: loadPersistedTrades()
}

const botSlice = createSlice({
  name: 'bot',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload
    },
    setInitialState: (state, action) => {
      const { isRunning, isExecuting, isTestMode, settings, recentLogs, wallet } = action.payload
      state.isRunning = isRunning
      state.isExecuting = isExecuting
      if (isTestMode !== undefined) state.isTestMode = isTestMode
      if (settings) state.settings = settings
      if (recentLogs) state.logs = recentLogs
      if (wallet !== undefined) state.wallet = wallet
    },
    setBotStatus: (state, action) => {
      if (action.payload.isRunning !== undefined) state.isRunning = action.payload.isRunning
      if (action.payload.isExecuting !== undefined) state.isExecuting = action.payload.isExecuting
      if (action.payload.isTestMode !== undefined) state.isTestMode = action.payload.isTestMode
    },
    setWalletInfo: (state, action) => {
      state.wallet = action.payload
    },
    updateScreener: (state, action) => {
      state.screenerPairs = action.payload.pairs
      state.screenerBlock = action.payload.block
      state.screenerTimestamp = action.payload.timestamp
      state.threshold = action.payload.threshold
    },
    setSelectedPair: (state, action) => {
      state.selectedPair = action.payload
      state.analysisResult = null // Clear previous analysis
    },
    setAnalysisResult: (state, action) => {
      state.analysisResult = action.payload

      const pairName = action.payload?.pairName
      if (pairName) {
        state.analysisByPair[pairName] = action.payload
      }
    },
    setOpportunity: (state, action) => {
      state.opportunity = action.payload
    },
    setTradeStatus: (state, action) => {
      state.tradeStatus = action.payload

      if (action.payload?.status === 'executing') {
        state.tradeSteps = []
      }
    },

    addTradeStep: (state, action) => {
      state.tradeSteps.push(action.payload)
      if (state.tradeSteps.length > 100) state.tradeSteps.shift()
    },
    clearTradeSteps: (state) => {
      state.tradeSteps = []
    },
    addTrade: (state, action) => {
      state.trades.unshift(action.payload)
      if (state.trades.length > 100) state.trades.pop()
      // Persist to localStorage
      try {
        localStorage.setItem('dappu_trades', JSON.stringify(state.trades))
      } catch (e) {
        console.warn('Failed to persist trades:', e)
      }
    },
    clearTrades: (state) => {
      state.trades = []
      try {
        localStorage.removeItem('dappu_trades')
      } catch (e) {
        console.warn('Failed to clear trades:', e)
      }
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    addLog: (state, action) => {
      state.logs.push(action.payload)
      if (state.logs.length > 200) state.logs.shift()
    },
    clearLogs: (state) => {
      state.logs = []
    }
  }
})

export const {
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
  clearTrades,
  updateSettings,
  addLog,
  clearLogs
} = botSlice.actions

export default botSlice.reducer
