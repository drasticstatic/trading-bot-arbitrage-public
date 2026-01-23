import React from 'react'
import { useSelector } from 'react-redux'

function TradeHistory() {
  const { trades } = useSelector(state => state.bot)

  const getStatusStyle = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-400 glass-green'
      case 'failed': return 'text-red-400 glass-pink'
      case 'pending': return 'text-yellow-400 glass'
      default: return 'text-purple-300 glass'
    }
  }

  const formatProfit = (profit) => {
    const num = parseFloat(profit)
    if (num > 0) return `+${num.toFixed(6)}`
    return num.toFixed(6)
  }

  const netProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0)

  return (
    <div className="glass rounded-2xl p-6 glow-purple">
      <h2 className="text-xl font-display font-bold gradient-text mb-4">📊 TRADE HISTORY</h2>

      {trades.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-6xl mb-4 float">📈</div>
          <div className="text-purple-300 font-display text-lg">No trades yet</div>
          <div className="text-purple-400/50 text-sm mt-2">Executed trades appear here</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-purple-300/70 text-left border-b border-purple-500/20">
                <th className="pb-3 font-display font-medium">TIME</th>
                <th className="pb-3 font-display font-medium">PATH</th>
                <th className="pb-3 font-display font-medium">AMOUNT</th>
                <th className="pb-3 font-display font-medium">PROFIT</th>
                <th className="pb-3 font-display font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {trades.map((trade, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 text-purple-400/70 font-mono text-xs">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-fuchsia-400 font-medium">{trade.buyExchange}</span>
                      <span className="text-cyan-400">→</span>
                      <span className="text-cyan-400 font-medium">{trade.sellExchange}</span>
                    </div>
                  </td>
                  <td className="py-4 text-white font-display">
                    {trade.amount} <span className="text-purple-300/50">{trade.tokenSymbol}</span>
                  </td>
                  <td className="py-4">
                    <span className={`font-bold font-display ${
                      parseFloat(trade.profit) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`} style={{textShadow: parseFloat(trade.profit) >= 0 ? '0 0 10px rgba(0,255,136,0.5)' : '0 0 10px rgba(255,0,100,0.5)'}}>
                      {formatProfit(trade.profit)}
                    </span>
                    <span className="text-purple-300/50 ml-1">{trade.tokenSymbol}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusStyle(trade.status)}`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-purple-500/20 flex justify-between items-center">
            <div className="glass px-4 py-2 rounded-full">
              <span className="text-purple-300/70 text-sm">Total: </span>
              <span className="text-white font-display font-bold">{trades.length}</span>
            </div>
            <div className={`px-5 py-2 rounded-full font-display ${netProfit >= 0 ? 'glass-green' : 'glass-pink'}`}>
              <span className="text-sm opacity-70">Net: </span>
              <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                style={{textShadow: netProfit >= 0 ? '0 0 15px rgba(0,255,136,0.6)' : '0 0 15px rgba(255,0,100,0.6)'}}>
                {formatProfit(netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeHistory

