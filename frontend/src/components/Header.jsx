import React from 'react'
import { useSelector } from 'react-redux'

function Header() {
  const { connected, isRunning, isExecuting } = useSelector(state => state.bot)

  return (
    <header style={{ background: 'linear-gradient(180deg, #12141a 0%, #0a0b0f 100%)', borderBottom: '1px solid #1e2028' }}>
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '28px' }}>⚡</span>
              <h1 style={{ fontSize: '22px', fontWeight: '700' }}>
                <span style={{ color: '#6366f1' }}>DAPPU</span>
                <span style={{ color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>Screener</span>
              </h1>
            </div>
            <span style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              Arbitrum
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#10b981' : '#ef4444', boxShadow: connected ? '0 0 10px #10b981' : 'none' }} />
              <span style={{ fontSize: '13px', color: connected ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                {connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <span style={{
              background: isExecuting ? 'rgba(245, 158, 11, 0.15)' : isRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: isExecuting ? '#f59e0b' : isRunning ? '#10b981' : '#6366f1',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {isExecuting ? '⏳ Executing' : isRunning ? '🔍 Scanning' : '💤 Idle'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

