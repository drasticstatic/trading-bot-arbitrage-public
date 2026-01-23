import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { executeTrade } from '../store/websocket'

function OpportunityPanel() {
  const { opportunity, tradeStatus, isExecuting, wallet } = useSelector(state => state.bot)
  const [confirmExecute, setConfirmExecute] = useState(false)

  const handleExecute = () => {
    if (!confirmExecute) {
      setConfirmExecute(true)
      setTimeout(() => setConfirmExecute(false), 5000)
      return
    }
    executeTrade()
    setConfirmExecute(false)
  }

  if (tradeStatus) {
    return (
      <div className="card p-5 border-yellow-500">
        <h2 className="text-base font-semibold text-yellow-400 mb-4">Trade in Progress</h2>
        <div className="text-center py-6">
          <div className="text-3xl mb-3">⚡</div>
          <div className="text-white">{tradeStatus.status}</div>
          {tradeStatus.txHash && (
            <div className="mt-2 text-xs text-muted">
              TX: <span className="font-mono">{tradeStatus.txHash.slice(0, 20)}...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="card p-5">
        <h2 className="text-base font-semibold text-white mb-4">Arbitrage Scanner</h2>
        <div className="text-center py-8 text-muted">
          <div className="text-3xl mb-3">👁</div>
          <div>Scanning for opportunities...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-highlight p-5">
      <h2 className="status-green text-base font-semibold mb-4">🎯 Opportunity Found</h2>

      <div className="space-y-4">
        <div className="data-row p-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="text-label text-xs mb-1">Buy on</div>
              <div className="text-white font-semibold">{opportunity.buyExchange}</div>
            </div>
            <div className="status-green text-xl">→</div>
            <div className="text-center">
              <div className="text-label text-xs mb-1">Sell on</div>
              <div className="text-white font-semibold">{opportunity.sellExchange}</div>
            </div>
          </div>
        </div>

        {opportunity.profitData && (
          <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-label">Trade Amount:</div>
              <div className="text-white">{opportunity.amount} {opportunity.profitData.tokenSymbol}</div>
              <div className="text-label">Est. Gas:</div>
              <div className="text-white">{opportunity.profitData.estimatedGasCost} ETH</div>
              <div className="text-label">Est. Profit:</div>
              <div className="status-green font-semibold">{opportunity.profitData.totalGainLoss} {opportunity.profitData.tokenSymbol}</div>
            </div>
          </div>
        )}

        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`w-full py-3 rounded font-semibold ${
            confirmExecute ? 'btn-danger' : 'btn-success'
          } disabled:opacity-50`}
        >
          {isExecuting ? 'Executing...' : confirmExecute ? '⚠️ Click to Confirm' : 'Execute Trade'}
        </button>

        <div className="text-center text-xs">
          {wallet?.network === 'localhost' ? (
            <span className="badge badge-blue">Testnet</span>
          ) : (
            <span className="badge badge-yellow">⚠️ Mainnet</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default OpportunityPanel

