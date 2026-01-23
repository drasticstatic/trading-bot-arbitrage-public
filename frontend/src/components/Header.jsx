import React from 'react'
import { useSelector } from 'react-redux'

function Header() {
  const { connected, isRunning, isExecuting, poolInfo } = useSelector(state => state.bot)

  return (
    <header className="glass border-b border-purple-500/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-display font-bold">
              <span className="gradient-text">DAPPU</span>
              <span className="text-white/80 ml-2">⚡</span>
              <span className="text-fuchsia-400 text-glow-pink ml-2">ARB BOT</span>
            </h1>
            {poolInfo && (
              <div className="glass-pink px-4 py-2 rounded-full">
                <span className="text-fuchsia-300 text-sm font-medium">
                  📊 {poolInfo.pair}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-400 connection-dot' : 'bg-red-500 animate-pulse'}`} />
              <span className={`text-sm font-medium ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {connected ? '● LIVE' : '○ OFFLINE'}
              </span>
            </div>

            {/* Bot Status */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              isExecuting ? 'glass-cyan glow-cyan' : isRunning ? 'glass-green glow-green' : 'glass'
            }`}>
              {isExecuting ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-cyan-400 text-sm font-bold text-glow-cyan">⚡ EXECUTING</span>
                </>
              ) : isRunning ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow" />
                  <span className="text-emerald-400 text-sm font-bold text-glow-green">👁 MONITORING</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-gray-400 text-sm font-medium">💤 IDLE</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

