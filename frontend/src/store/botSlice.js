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
  // "monitor" | "manual" | "auto" from config.json, and which chain the bot is pointed at
  tradingMode: 'monitor',
  network: null,
  wallet: null,

  // The journal: what the dashboard showed, read back from logs/journal via /api/journal
  journal: {
    days: [],
    months: [],
    date: null,
    stream: 'activity',
    entries: [],
    summary: null,
    total: 0,
    unfiltered: 0,
    file: null,
    loading: false,
    error: null,
    available: null // null until the first request answers; false on the public demo
  },

  // Version lineage of the public demo (frontend/public/lineage/lineage.json)
  lineage: null,
  // Structured edge candidates as they happen (EDGE_CANDIDATE): what the alerts and the hero read
  candidates: [],

  // Screener data - all pairs
  screenerPairs: [],
  screenerBlock: null,
  screenerTimestamp: null,
  threshold: 0.5,
  fork: null,

  // Perp DEX status
  perpStatus: null,

  // Monitor-only edge study (live Arbitrum) — null when the study is not running
  edge: null,
  // Every pool the bot prices right now (pair, venue key, dex, fee, price, reserves)
  venues: [],
  // Set when the edge state came from a published snapshot (GitHub Pages) rather than the live socket
  edgeSnapshotAt: null,

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
	  mevProtection: true
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
      const { isRunning, isExecuting, isTestMode, settings, recentLogs, wallet, edge, tradingMode, network } = action.payload
      state.isRunning = isRunning
      state.isExecuting = isExecuting
      if (isTestMode !== undefined) state.isTestMode = isTestMode
      if (tradingMode) state.tradingMode = tradingMode
      if (network) state.network = network
      if (settings) state.settings = settings
      if (recentLogs) state.logs = recentLogs
      if (wallet !== undefined) state.wallet = wallet
      if (edge !== undefined) state.edge = edge
    },
    setEdge: (state, action) => {
      state.edge = action.payload
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
      state.fork = action.payload.fork ?? null
      state.perpStatus = action.payload.perpStatus ?? null
      if (Array.isArray(action.payload.venues)) state.venues = action.payload.venues
    },
    setJournalDays: (state, action) => {
      state.journal.days = action.payload?.days || []
      state.journal.months = action.payload?.months || []
      state.journal.available = true
    },
    setJournalLoading: (state, action) => {
      state.journal.loading = !!action.payload
    },
    setJournalDay: (state, action) => {
      const { date, stream, entries, summary, file, total, unfiltered } = action.payload || {}
      state.journal.date = date || state.journal.date
      state.journal.stream = stream || state.journal.stream
      state.journal.entries = Array.isArray(entries) ? entries : []
      state.journal.summary = summary || null
      state.journal.file = file || null
      state.journal.total = total || 0
      state.journal.unfiltered = unfiltered || 0
      state.journal.loading = false
      state.journal.error = null
      state.journal.available = true
    },
    setJournalError: (state, action) => {
      state.journal.loading = false
      state.journal.error = action.payload || 'journal unavailable'
      if (action.payload === 'unavailable') state.journal.available = false
    },
    addCandidate: (state, action) => {
      const c = { ...(action.payload || {}), ts: action.payload?.ts || new Date().toISOString() }
      state.candidates.push(c)
      if (state.candidates.length > 200) state.candidates = state.candidates.slice(-200)
    },
    setLineage: (state, action) => {
      state.lineage = action.payload || null
    },
    setEdgeSnapshot: (state, action) => {
      const { edge, venues, generatedAt, threshold } = action.payload || {}
      if (edge) state.edge = edge
      if (Array.isArray(venues)) state.venues = venues
      if (Number.isFinite(Number(threshold))) state.threshold = Number(threshold)
      state.edgeSnapshotAt = generatedAt || Date.now()
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
			// Keep oldest at top, newest at bottom (requested)
			state.trades.push(action.payload)
			if (state.trades.length > 100) state.trades.shift()
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
  setEdge,
  updateScreener,
  setEdgeSnapshot,
  setJournalDays,
  setJournalLoading,
  setJournalDay,
  setJournalError,
  setLineage,
  addCandidate,
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
