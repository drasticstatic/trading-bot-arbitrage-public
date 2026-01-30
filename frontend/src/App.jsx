import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectWebSocket } from './store/websocket'
import HeroSection from './components/HeroSection'
import ScreenerPanel from './components/ScreenerPanel'
import LogPanel from './components/LogPanel'
import TradeExecutionOverlay from './components/TradeExecutionOverlay'
import TradeExecutionCard from './components/TradeExecutionCard'

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
    <div className="min-h-screen flex flex-col">
      <Confetti show={showConfetti} />
      <TradeExecutionOverlay />

      {/* Main Content with consistent left/right margins */}
      <main className="flex-1 w-full mx-auto py-6" style={{ paddingLeft: '3rem', paddingRight: '3rem', maxWidth: '1600px' }}>
        {!connected && (
          <div className="glass rounded-xl p-4 mb-6 text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <span className="text-red-400">⚠️ Disconnected - Attempting to reconnect...</span>
          </div>
        )}

        {/* Hero Section - Wallet integrated, centered */}
        <HeroSection />

        {/* Screener Table */}
        <ScreenerPanel />

        {/* Trade Execution Terminal + Activity - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <TradeExecutionCard />
          </div>
          <div>
            <LogPanel />
          </div>
        </div>
      </main>

      {/* Footer Banner - Centered horizontally, 3 rows */}
      <footer className="w-full mt-auto" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
        borderTop: '1px solid rgba(99, 102, 241, 0.15)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex flex-col items-center justify-center py-5" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Row 1: Main Title */}
	          <div style={{ marginBottom: '8px', textAlign: 'center', width: '100%' }}>
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '15px', fontWeight: '700' }}>
              ⚡ DAPP University Arbitrage Trading Bot v3.0.1
            </span>
          </div>
          {/* Row 2: Founded by */}
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>
            Founded by <span style={{ color: '#8b5cf6', fontWeight: '600' }}>@drasticstatic</span>  •  Augmented via <span style={{ color: '#a5b4fc' }}>Claude Opus 4.5</span> and <span style={{ color: '#10b981' }}>GPT 5.2</span>
          </div>
          {/* Row 3: Built with + Button Links */}
	          <div className="flex items-center justify-center gap-3" style={{ fontSize: '12px', textAlign: 'center', width: '100%' }}>
            <span style={{ color: '#64748b' }}>Built with 💜</span>
            <a href="https://drasticstatic.github.io/resume/index.html" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105" style={{ color: '#a5b4fc', textDecoration: 'none', background: 'rgba(165,180,252,0.15)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(165,180,252,0.3)', fontWeight: '600' }}>About the builder</a>
            <a href="https://github.com/drasticstatic" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105" style={{ color: '#9ca3af', textDecoration: 'none', background: 'rgba(156,163,175,0.15)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(156,163,175,0.3)', fontWeight: '600' }}>GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

