import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectWebSocket } from './store/websocket'
import Header from './components/Header'
import ScreenerPanel from './components/ScreenerPanel'
import OpportunityPanel from './components/OpportunityPanel'
import WalletPanel from './components/WalletPanel'
import SettingsPanel from './components/SettingsPanel'
import LogPanel from './components/LogPanel'
import TradeHistory from './components/TradeHistory'

function App() {
  const dispatch = useDispatch()
  const connected = useSelector(state => state.bot.connected)

  useEffect(() => {
    connectWebSocket(dispatch)
  }, [dispatch])

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {!connected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-center">
            <span className="text-red-400">⚠️ Disconnected - Attempting to reconnect...</span>
          </div>
        )}

        {/* Main Screener Table */}
        <ScreenerPanel />

        {/* Bottom Row: Opportunity, Wallet, Settings, Logs, History */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
          <OpportunityPanel />
          <WalletPanel />
          <SettingsPanel />
          <LogPanel />
        </div>

        <div className="mt-6">
          <TradeHistory />
        </div>
      </main>

      <footer className="text-center py-4 border-t border-[#2a2e37] mt-6">
        <div className="text-gray-600 text-xs">
          DAPPU Arbitrage Screener · <a href="https://drasticstatic.github.io/resume/index.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">@drasticstatic</a>
        </div>
      </footer>
    </div>
  )
}

export default App

