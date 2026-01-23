import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { executeTrade } from '../store/websocket'

function OpportunityPanel() {
  const { opportunity, tradeStatus, isExecuting, wallet } = useSelector(state => state.bot)
  const [confirmExecute, setConfirmExecute] = useState(false)

  const handleExecute = () => {
    if (!confirmExecute) {
      setConfirmExecute(true)
      setTimeout(() => setConfirmExecute(false), 5000) // Reset after 5s
      return
    }
    executeTrade()
    setConfirmExecute(false)
  }

  if (tradeStatus) {
    return (
      <div className="bg-gray-800 rounded-lg border border-yellow-500 p-6">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">⏳ Trade in Progress</h2>
        <div className="text-center py-4">
          <div className="text-5xl mb-4 animate-bounce">⚡</div>
          <div className="text-lg text-white">{tradeStatus.status}</div>
          {tradeStatus.txHash && (
            <div className="mt-2 text-sm text-gray-400">
              TX: <span className="font-mono">{tradeStatus.txHash.slice(0, 20)}...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">🎯 Arbitrage Opportunity</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-5xl mb-4">👀</div>
          <div>No opportunities detected</div>
          <div className="text-sm mt-2">Monitoring for price differences...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-green-500 p-6 animate-pulse-slow">
      <h2 className="text-xl font-semibold text-green-400 mb-4">🎯 Opportunity Found!</h2>

      <div className="space-y-4">
        {/* Trade Path */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">Buy on</div>
              <div className="text-lg font-bold text-white">{opportunity.buyExchange}</div>
            </div>
            <div className="text-2xl text-green-400">→</div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Sell on</div>
              <div className="text-lg font-bold text-white">{opportunity.sellExchange}</div>
            </div>
          </div>
        </div>

        {/* Profit Estimate */}
        {opportunity.profitData && (
          <div className="bg-green-900/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Trade Amount:</div>
              <div className="text-white font-medium">{opportunity.amount} {opportunity.profitData.tokenSymbol}</div>
              <div className="text-gray-400">Est. Gas Cost:</div>
              <div className="text-white font-medium">{opportunity.profitData.estimatedGasCost} ETH</div>
              <div className="text-gray-400">Est. Profit:</div>
              <div className="text-green-400 font-bold">{opportunity.profitData.totalGainLoss} {opportunity.profitData.tokenSymbol}</div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            confirmExecute
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isExecuting ? (
            '⏳ Executing...'
          ) : confirmExecute ? (
            '⚠️ CONFIRM EXECUTION - Click Again'
          ) : (
            '🚀 Execute Trade'
          )}
        </button>

        {/* Warning */}
        <div className="text-center text-xs text-gray-500">
          {wallet?.network === 'localhost' ? (
            <span className="text-blue-400">🔵 Running on Local Hardhat Node (Safe to test)</span>
          ) : (
            <span className="text-yellow-400">⚠️ MAINNET - Real funds will be used!</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default OpportunityPanel

