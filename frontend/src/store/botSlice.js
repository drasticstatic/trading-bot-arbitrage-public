import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Connection status
  connected: false,

  // Bot status
  isRunning: false,
  isExecuting: false,

  // Pool info
  poolInfo: null,

  // Wallet info
  wallet: null,

  // Price data
  prices: {
    uniswap: null,
    pancakeswap: null,
    difference: null,
    timestamp: null
  },

  // Price history for chart
  priceHistory: [],

  // Current opportunity
  opportunity: null,

  // Trade status
  tradeStatus: null,

  // Settings
  settings: {
    priceDifference: 0.5,
    gasLimit: 600000,
    gasPrice: 0.00000001,
    autoExecute: false
  },

  // Logs
  logs: [],

  // Trade history
  trades: []
}

const botSlice = createSlice({
  name: 'bot',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload
    },
    setInitialState: (state, action) => {
      const { isRunning, isExecuting, prices, currentOpportunity, settings, recentLogs } = action.payload
      state.isRunning = isRunning
      state.isExecuting = isExecuting
      if (prices) state.prices = prices
      if (currentOpportunity) state.opportunity = currentOpportunity
      if (settings) state.settings = settings
      if (recentLogs) state.logs = recentLogs
    },
    setBotStatus: (state, action) => {
      if (action.payload.isRunning !== undefined) state.isRunning = action.payload.isRunning
      if (action.payload.isExecuting !== undefined) state.isExecuting = action.payload.isExecuting
    },
    setPoolInfo: (state, action) => {
      state.poolInfo = action.payload
    },
    setWalletInfo: (state, action) => {
      state.wallet = action.payload
    },
    updatePrices: (state, action) => {
      state.prices = action.payload
      // Keep last 50 price points for chart
      state.priceHistory.push({
        time: action.payload.timestamp,
        uniswap: parseFloat(action.payload.uniswap),
        pancakeswap: parseFloat(action.payload.pancakeswap),
        difference: parseFloat(action.payload.difference)
      })
      if (state.priceHistory.length > 50) {
        state.priceHistory.shift()
      }
    },
    setOpportunity: (state, action) => {
      state.opportunity = action.payload
    },
    setTradeStatus: (state, action) => {
      state.tradeStatus = action.payload
    },
    addTrade: (state, action) => {
      state.trades.unshift(action.payload)
      if (state.trades.length > 100) {
        state.trades.pop()
      }
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    addLog: (state, action) => {
      state.logs.push(action.payload)
      if (state.logs.length > 200) {
        state.logs.shift()
      }
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
  setPoolInfo,
  setWalletInfo,
  updatePrices,
  setOpportunity,
  setTradeStatus,
  addTrade,
  updateSettings,
  addLog,
  clearLogs
} = botSlice.actions

export default botSlice.reducer

