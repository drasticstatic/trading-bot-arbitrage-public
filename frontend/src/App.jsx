import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectWebSocket } from './store/websocket'
import HeroSection from './components/HeroSection'
import ScreenerPanel from './components/ScreenerPanel'
import OpportunityPanel from './components/OpportunityPanel'
import LogPanel from './components/LogPanel'
import TradeHistory from './components/TradeHistory'

function App() {
  const dispatch = useDispatch()
  const connected = useSelector(state => state.bot.connected)

  useEffect(() => {
    connectWebSocket(dispatch)
  }, [dispatch])

  return (
    <div className="min-h-screen pb-8">
      {/* Centered Container with Margins */}
      <main className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-8">
        {!connected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <span className="text-red-400">⚠️ Disconnected - Attempting to reconnect...</span>
          </div>
        )}

        {/* Hero Section with Wallet + Settings Pills */}
        <HeroSection />

        {/* Screener Table (Card Style) */}
        <ScreenerPanel />

        {/* Bottom Row: Opportunity, Activity, History (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <OpportunityPanel />
          <LogPanel />
          <TradeHistory />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pt-6 pb-8 mt-12" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.15)' }}>
        <div className="text-base font-bold mb-1" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DAPPU Arbitrage Bot v3.0
        </div>
        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
          Augmented with <span style={{ color: '#c084fc' }}>@drasticstatic</span> • Built with 💜 and faith
        </div>
        <div className="flex items-center justify-center gap-3">
          <a href="https://drasticstatic.github.io/resume/index.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-80" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Meet the Developer
          </a>
          <a href="https://github.com/drasticstatic" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-80" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#9ca3af', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            View GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App

