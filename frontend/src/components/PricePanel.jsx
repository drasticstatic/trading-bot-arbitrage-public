import React from 'react'
import { useSelector } from 'react-redux'
import { checkPrices } from '../store/websocket'

function PricePanel() {
  const { prices, poolInfo, settings } = useSelector(state => state.bot)

  const getDifferenceColor = (diff) => {
    const absDiff = Math.abs(parseFloat(diff || 0))
    if (absDiff >= settings.priceDifference) return 'text-emerald-400'
    if (absDiff >= settings.priceDifference * 0.5) return 'text-yellow-400'
    return 'text-purple-300'
  }

  const isOpportunity = Math.abs(parseFloat(prices.difference || 0)) >= settings.priceDifference

  return (
    <div className={`glass rounded-2xl p-6 ${isOpportunity ? 'glow-green' : 'glow-purple'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold gradient-text">💹 PRICE MONITOR</h2>
        <button
          onClick={checkPrices}
          className="btn-neon px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
        >
          ⟳ REFRESH
        </button>
      </div>

      {prices.uniswap ? (
        <div className="space-y-4">
          {/* Price Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Uniswap */}
            <div className="glass-pink rounded-xl p-5 float" style={{animationDelay: '0s'}}>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">🦄</span>
                <span className="text-fuchsia-300 font-bold font-display">UNISWAP V3</span>
              </div>
              <div className="text-3xl font-bold text-white font-display" style={{textShadow: '0 0 20px rgba(255,0,255,0.5)'}}>
                {parseFloat(prices.uniswap).toLocaleString()}
              </div>
              <div className="text-fuchsia-400/60 text-sm mt-1">{poolInfo?.pair || 'Loading...'}</div>
            </div>

            {/* Pancakeswap */}
            <div className="glass-cyan rounded-xl p-5 float" style={{animationDelay: '0.5s'}}>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">🥞</span>
                <span className="text-cyan-300 font-bold font-display">PANCAKESWAP V3</span>
              </div>
              <div className="text-3xl font-bold text-white font-display" style={{textShadow: '0 0 20px rgba(0,255,255,0.5)'}}>
                {parseFloat(prices.pancakeswap).toLocaleString()}
              </div>
              <div className="text-cyan-400/60 text-sm mt-1">{poolInfo?.pair || 'Loading...'}</div>
            </div>
          </div>

          {/* Difference */}
          <div className={`rounded-xl p-6 text-center ${isOpportunity ? 'glass-green glow-green pulse-glow' : 'glass'}`}>
            <div className="text-purple-300/70 text-sm mb-2 font-medium">PRICE DIFFERENCE</div>
            <div className={`text-5xl font-bold font-display ${getDifferenceColor(prices.difference)}`} style={{textShadow: isOpportunity ? '0 0 30px rgba(0,255,136,0.8)' : 'none'}}>
              {prices.difference}%
            </div>
            {isOpportunity && (
              <div className="text-emerald-400 text-lg mt-3 font-bold animate-pulse">
                ⚡ ARBITRAGE OPPORTUNITY DETECTED! ⚡
              </div>
            )}
          </div>

          {/* Last Update */}
          <div className="text-center text-purple-400/50 text-xs font-medium">
            🕐 Last sync: {prices.timestamp ? new Date(prices.timestamp).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 float">📊</div>
          <div className="text-purple-300 font-display text-xl">Awaiting price data...</div>
          <div className="text-purple-400/50 text-sm mt-2">Prices sync on swap events</div>
        </div>
      )}
    </div>
  )
}

export default PricePanel

