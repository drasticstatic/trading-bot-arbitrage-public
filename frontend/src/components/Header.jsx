import React from 'react'
import { useSelector } from 'react-redux'

function Header() {
  const { connected, isRunning, isExecuting, poolInfo } = useSelector(state => state.bot)

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">
              🤖 DAPPU <span className="text-purple-400">Arbitrage Bot</span>
            </h1>
            {poolInfo && (
              <span className="text-gray-400 text-sm">
                Trading: <span className="text-white font-medium">{poolInfo.pair}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-gray-300">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Bot Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-700">
              {isExecuting ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-yellow-400 text-sm">Executing...</span>
                </>
              ) : isRunning ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-400 text-sm">Monitoring</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-gray-400 text-sm">Idle</span>
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

