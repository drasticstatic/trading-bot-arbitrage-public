import React from 'react'
import { useSelector } from 'react-redux'
import { checkPrices } from '../store/websocket'

function PricePanel() {
  const { prices, poolInfo, settings } = useSelector(state => state.bot)

  const getDifferenceColor = (diff) => {
    const absDiff = Math.abs(parseFloat(diff || 0))
    if (absDiff >= settings.priceDifference) return 'status-green'
    if (absDiff >= settings.priceDifference * 0.5) return 'status-yellow'
    return 'text-gray-400'
  }

  const isOpportunity = Math.abs(parseFloat(prices.difference || 0)) >= settings.priceDifference

  return (
    <div className={`card p-5 ${isOpportunity ? 'card-highlight' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-white">Price Monitor</h2>
        <button onClick={checkPrices} className="btn-primary">Refresh</button>
      </div>

      {prices.uniswap ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="data-row p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span>🦄</span>
                <span className="text-label text-sm">Uniswap V3</span>
              </div>
              <div className="text-2xl font-semibold text-white">
                {parseFloat(prices.uniswap).toLocaleString()}
              </div>
              <div className="text-muted text-xs mt-1">{poolInfo?.pair || 'Loading...'}</div>
            </div>

            <div className="data-row p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span>🥞</span>
                <span className="text-label text-sm">PancakeSwap V3</span>
              </div>
              <div className="text-2xl font-semibold text-white">
                {parseFloat(prices.pancakeswap).toLocaleString()}
              </div>
              <div className="text-muted text-xs mt-1">{poolInfo?.pair || 'Loading...'}</div>
            </div>
          </div>

          <div className={`data-row p-4 text-center ${isOpportunity ? 'border-green-500 bg-green-500/5' : ''}`}>
            <div className="text-label text-sm mb-1">Price Difference</div>
            <div className={`text-3xl font-bold ${getDifferenceColor(prices.difference)}`}>
              {prices.difference}%
            </div>
            {isOpportunity && (
              <div className="status-green text-sm mt-2 font-medium">
                ⚡ Opportunity Detected
              </div>
            )}
          </div>

          <div className="text-center text-muted text-xs">
            Updated: {prices.timestamp ? new Date(prices.timestamp).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted">
          <div className="text-3xl mb-3">📊</div>
          <div>Waiting for price data...</div>
        </div>
      )}
    </div>
  )
}

export default PricePanel

