import React from 'react'
import { useSelector } from 'react-redux'

function TradeHistory() {
  const { trades } = useSelector(state => state.bot)

  const formatProfit = (profit) => {
    const num = parseFloat(profit)
    if (num > 0) return `+${num.toFixed(6)}`
    return num.toFixed(6)
  }

  const netProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0)

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-white mb-4">Trade History</h2>

      {trades.length === 0 ? (
        <div className="text-center py-8 text-muted">
          <div className="text-2xl mb-2">📈</div>
          <div className="text-sm">No trades executed yet</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
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
              {trades.map((trade, index) => (
                <tr key={index} className="hover:bg-[#1f242d]">
                  <td className="py-3 text-gray-500 font-mono text-xs">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 text-sm">
                    <span className="text-gray-300">{trade.buyExchange}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className="text-gray-300">{trade.sellExchange}</span>
                  </td>
                  <td className="py-3 text-gray-300 text-sm">
                    {trade.amount} <span className="text-gray-500">{trade.tokenSymbol}</span>
                  </td>
                  <td className={`py-3 font-semibold ${parseFloat(trade.profit) >= 0 ? 'status-green' : 'status-red'}`}>
                    {formatProfit(trade.profit)}
                  </td>
                  <td className="py-3">
                    <span className={`badge ${
                      trade.status === 'success' ? 'badge-green' :
                      trade.status === 'failed' ? 'badge-red' : 'badge-yellow'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 pt-3 border-t border-[#2a2e37] flex justify-between items-center">
            <span className="text-muted text-xs">
              {trades.length} trades
            </span>
            <div className={`text-sm font-semibold ${netProfit >= 0 ? 'status-green' : 'status-red'}`}>
              Net: {formatProfit(netProfit)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeHistory

