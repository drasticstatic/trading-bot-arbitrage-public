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
    <div className="min-h-screen bg-animated">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {!connected && (
          <div className="glass border border-red-500/50 glow-pink rounded-xl p-4 mb-6 text-center animate-pulse">
            <span className="text-red-400 font-medium">⚠️ SIGNAL LOST - Reconnecting to the matrix...</span>
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

      <footer className="text-center py-6 glass border-t border-purple-500/20 mt-8">
        <div className="gradient-text font-display text-lg font-bold mb-2">
          DAPPU Arbitrage Bot v3.0
        </div>
        <div className="text-purple-300/70 text-sm">
          Augmented with <span className="text-fuchsia-400">@drasticstatic</span> | Built with 💜 and faith
        </div>
        <div className="mt-2">
          <a
            href="https://drasticstatic.github.io/resume/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
          >
            🚀 Meet the Developer
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App

