import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectWebSocket } from './store/websocket'
import HeroSection from './components/HeroSection'
import ScreenerPanel from './components/ScreenerPanel'
import LogPanel from './components/LogPanel'
import TradeHistory from './components/TradeHistory'

// Simple confetti component
function Confetti({ show }) {
  if (!show) return null
  const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6']
  return (
    <div className="confetti-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {[...Array(100)].map((_, i) => (
        <div key={i} className="confetti-piece" style={{
          position: 'absolute',
          width: `${Math.random() * 10 + 5}px`,
          height: `${Math.random() * 10 + 5}px`,
          background: colors[Math.floor(Math.random() * colors.length)],
          left: `${Math.random() * 100}%`,
          top: '-20px',
          borderRadius: Math.random() > 0.5 ? '50%' : '0',
          animation: `confetti-fall ${Math.random() * 2 + 2}s linear forwards`,
          animationDelay: `${Math.random() * 0.5}s`,
          transform: `rotate(${Math.random() * 360}deg)`
        }} />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { top: -20px; opacity: 1; transform: rotate(0deg) translateX(0); }
          100% { top: 110vh; opacity: 0; transform: rotate(720deg) translateX(${Math.random() > 0.5 ? '' : '-'}100px); }
        }
      `}</style>
    </div>
  )
}

function App() {
  const dispatch = useDispatch()
  const { connected, trades } = useSelector(state => state.bot)
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastTradeCount, setLastTradeCount] = useState(0)

  useEffect(() => {
    connectWebSocket(dispatch)
  }, [dispatch])

  // Show confetti when a new successful trade is added
  useEffect(() => {
    if (trades.length > lastTradeCount) {
      const latestTrade = trades[trades.length - 1]
      if (latestTrade?.status === 'success' && parseFloat(latestTrade?.profit || 0) > 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    }
    setLastTradeCount(trades.length)
  }, [trades, lastTradeCount])

  return (
    <div className="min-h-screen pb-8">
      <Confetti show={showConfetti} />

      {/* Centered Container */}
      <main className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-8">
        {!connected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <span className="text-red-400">⚠️ Disconnected - Attempting to reconnect...</span>
          </div>
        )}

        {/* Hero Section */}
        <HeroSection />

        {/* Screener Table */}
        <ScreenerPanel />

        {/* Bottom Row: History first, then Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <TradeHistory />
          <LogPanel />
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="text-center pt-4 pb-6 mt-8" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.1)' }}>
        <div className="text-sm font-semibold mb-1" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DAPPU Arbitrage v3.0
        </div>
        <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '10px' }}>
          <span style={{ color: '#8b5cf6' }}>@drasticstatic</span> • Built with 💜
        </div>
        <div className="flex items-center justify-center gap-2">
          <a href="https://drasticstatic.github.io/resume/index.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-80" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', fontSize: '10px' }}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            About
          </a>
          <a href="https://github.com/drasticstatic" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-80" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#9ca3af', fontSize: '10px' }}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App

