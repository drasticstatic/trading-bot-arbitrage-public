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
      <div className="glass rounded-2xl p-6 glow-cyan border border-cyan-500/30">
        <h2 className="text-xl font-display font-bold text-cyan-400 mb-4" style={{textShadow: '0 0 20px rgba(0,255,255,0.8)'}}>⏳ TRADE IN PROGRESS</h2>
        <div className="text-center py-6">
          <div className="text-6xl mb-4 animate-bounce">⚡</div>
          <div className="text-xl text-white font-display">{tradeStatus.status}</div>
          {tradeStatus.txHash && (
            <div className="mt-3 glass rounded-lg px-4 py-2 inline-block">
              <span className="text-purple-300/70 text-sm">TX: </span>
              <span className="font-mono text-cyan-400">{tradeStatus.txHash.slice(0, 20)}...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="glass rounded-2xl p-6 glow-purple">
        <h2 className="text-xl font-display font-bold gradient-text mb-4">🎯 ARBITRAGE SCANNER</h2>
        <div className="text-center py-10">
          <div className="text-6xl mb-4 float">👁</div>
          <div className="text-purple-300 font-display text-lg">Scanning for opportunities...</div>
          <div className="text-purple-400/50 text-sm mt-2">Monitoring price differentials</div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-green rounded-2xl p-6 glow-green pulse-glow">
      <h2 className="text-xl font-display font-bold text-emerald-400 mb-4" style={{textShadow: '0 0 20px rgba(0,255,136,0.8)'}}>🎯 OPPORTUNITY FOUND!</h2>

      <div className="space-y-4">
        {/* Trade Path */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-purple-300/70 mb-1">BUY ON</div>
              <div className="text-xl font-bold text-fuchsia-400 font-display">{opportunity.buyExchange}</div>
            </div>
            <div className="text-3xl text-emerald-400 animate-pulse">→</div>
            <div className="text-center">
              <div className="text-sm text-purple-300/70 mb-1">SELL ON</div>
              <div className="text-xl font-bold text-cyan-400 font-display">{opportunity.sellExchange}</div>
            </div>
          </div>
        </div>

        {/* Profit Estimate */}
        {opportunity.profitData && (
          <div className="glass-green rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-emerald-300/70">Trade Amount:</div>
              <div className="text-white font-medium font-display">{opportunity.amount} {opportunity.profitData.tokenSymbol}</div>
              <div className="text-emerald-300/70">Est. Gas Cost:</div>
              <div className="text-white font-medium">{opportunity.profitData.estimatedGasCost} ETH</div>
              <div className="text-emerald-300/70">Est. Profit:</div>
              <div className="text-emerald-400 font-bold text-lg font-display" style={{textShadow: '0 0 10px rgba(0,255,136,0.8)'}}>{opportunity.profitData.totalGainLoss} {opportunity.profitData.tokenSymbol}</div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`w-full py-4 rounded-xl font-bold text-lg font-display transition-all ${
            confirmExecute
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white animate-pulse'
              : 'btn-neon-green text-black'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{boxShadow: confirmExecute ? '0 0 30px rgba(255,100,0,0.5)' : '0 0 30px rgba(0,255,136,0.3)'}}
        >
          {isExecuting ? (
            '⏳ EXECUTING...'
          ) : confirmExecute ? (
            '⚠️ CONFIRM - CLICK AGAIN'
          ) : (
            '🚀 EXECUTE TRADE'
          )}
        </button>

        {/* Warning */}
        <div className="text-center text-xs">
          {wallet?.network === 'localhost' ? (
            <span className="glass-cyan px-4 py-2 rounded-full inline-block text-cyan-400 font-medium">🔵 TESTNET - Safe to experiment</span>
          ) : (
            <span className="glass border border-yellow-500/50 px-4 py-2 rounded-full inline-block text-yellow-400 font-medium animate-pulse">⚠️ MAINNET - Real funds!</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default OpportunityPanel

