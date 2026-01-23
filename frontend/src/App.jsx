import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectWebSocket } from './store/websocket'
import Header from './components/Header'
import PricePanel from './components/PricePanel'
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
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {!connected && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-center">
            <span className="text-red-300">⚠️ Disconnected from server - Reconnecting...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <PricePanel />
            <OpportunityPanel />
            <TradeHistory />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <WalletPanel />
            <SettingsPanel />
            <LogPanel />
          </div>
        </div>
      </main>

      <footer className="text-center text-gray-500 py-4 text-sm">
        DAPPU Arbitrage Bot v1.0 | Built with 💜 and faith
      </footer>
    </div>
  )
}

export default App

