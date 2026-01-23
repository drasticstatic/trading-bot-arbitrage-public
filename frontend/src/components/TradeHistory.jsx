import React, { useState } from 'react'
import { useSelector } from 'react-redux'

function TradeHistory() {
  const { trades } = useSelector(state => state.bot)
  const [showModal, setShowModal] = useState(false)

  const formatProfit = (profit) => {
    const num = parseFloat(profit)
    if (num > 0) return `+${num.toFixed(6)}`
    return num.toFixed(6)
  }

  const netProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0)
  const recentTrades = trades.slice(-3)

  return (
    <>
      <div className="card p-5 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setShowModal(true)}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">📈 History</h2>
          <span className={`text-sm font-semibold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatProfit(netProfit)}
          </span>
        </div>

        {trades.length === 0 ? (
          <div className="text-center py-4 text-muted text-sm">No trades yet</div>
        ) : (
          <div className="space-y-2">
            {recentTrades.map((trade, index) => (
              <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                <span className="text-gray-400">{trade.buyExchange} → {trade.sellExchange}</span>
                <span className={parseFloat(trade.profit) >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatProfit(trade.profit)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-3">
          <span className="text-xs text-indigo-400 hover:text-indigo-300">
            {trades.length > 0 ? `${trades.length} trades → Click to view all` : 'Click to view all →'}
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#12141a] border border-[#1e2028] rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#1e2028]">
              <h3 className="text-lg font-semibold text-white">📈 Trade History</h3>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Net P&L: {formatProfit(netProfit)}
                </span>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">×</button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {trades.length === 0 ? (
                <div className="text-center py-8 text-muted">No trades executed yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-label text-left border-b border-[#2a2e37]">
                      <th className="pb-2 font-medium text-xs">Time</th>
                      <th className="pb-2 font-medium text-xs">Path</th>
                      <th className="pb-2 font-medium text-xs">Amount</th>
                      <th className="pb-2 font-medium text-xs">Profit</th>
                      <th className="pb-2 font-medium text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e37]">
                    {[...trades].reverse().map((trade, index) => (
                      <tr key={index} className="hover:bg-[#1f242d]">
                        <td className="py-3 text-gray-500 font-mono text-xs">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                        <td className="py-3 text-sm">
                          <span className="text-gray-300">{trade.buyExchange}</span>
                          <span className="text-gray-600 mx-1">→</span>
                          <span className="text-gray-300">{trade.sellExchange}</span>
                        </td>
                        <td className="py-3 text-gray-300 text-sm">{trade.amount} <span className="text-gray-500">{trade.tokenSymbol}</span></td>
                        <td className={`py-3 font-semibold ${parseFloat(trade.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatProfit(trade.profit)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${trade.status === 'success' ? 'bg-green-500/20 text-green-400' : trade.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TradeHistory

