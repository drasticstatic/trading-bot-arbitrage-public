import React from 'react'
import { useSelector } from 'react-redux'
import { checkPrices } from '../store/websocket'

function PricePanel() {
  const { prices, poolInfo, settings } = useSelector(state => state.bot)

  const getDifferenceColor = (diff) => {
    const absDiff = Math.abs(parseFloat(diff || 0))
    if (absDiff >= settings.priceDifference) return 'text-green-400'
    if (absDiff >= settings.priceDifference * 0.5) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const isOpportunity = Math.abs(parseFloat(prices.difference || 0)) >= settings.priceDifference

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">💹 Price Monitor</h2>
        <button
          onClick={checkPrices}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh Prices
        </button>
      </div>

      {prices.uniswap ? (
        <div className="space-y-4">
          {/* Price Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Uniswap */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-pink-400 text-lg">🦄</span>
                <span className="text-gray-300 font-medium">Uniswap V3</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(prices.uniswap).toFixed(6)}
              </div>
              <div className="text-gray-500 text-sm">{poolInfo?.pair || 'Loading...'}</div>
            </div>

            {/* Pancakeswap */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-yellow-400 text-lg">🥞</span>
                <span className="text-gray-300 font-medium">Pancakeswap V3</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(prices.pancakeswap).toFixed(6)}
              </div>
              <div className="text-gray-500 text-sm">{poolInfo?.pair || 'Loading...'}</div>
            </div>
          </div>

          {/* Difference */}
          <div className={`rounded-lg p-4 text-center ${isOpportunity ? 'bg-green-900/30 border border-green-500' : 'bg-gray-700/50'}`}>
            <div className="text-gray-400 text-sm mb-1">Price Difference</div>
            <div className={`text-3xl font-bold ${getDifferenceColor(prices.difference)}`}>
              {prices.difference}%
            </div>
            {isOpportunity && (
              <div className="text-green-400 text-sm mt-2 animate-pulse">
                ⚡ Arbitrage Opportunity Detected!
              </div>
            )}
          </div>

          {/* Last Update */}
          <div className="text-center text-gray-500 text-xs">
            Last updated: {prices.timestamp ? new Date(prices.timestamp).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div>Waiting for price data...</div>
          <div className="text-sm mt-2">Prices update when swap events occur</div>
        </div>
      )}
    </div>
  )
}

export default PricePanel

