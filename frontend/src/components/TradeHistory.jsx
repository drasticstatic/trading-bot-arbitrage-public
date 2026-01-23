import React from 'react'
import { useSelector } from 'react-redux'

function TradeHistory() {
  const { trades } = useSelector(state => state.bot)

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-900/30'
      case 'failed': return 'text-red-400 bg-red-900/30'
      case 'pending': return 'text-yellow-400 bg-yellow-900/30'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  const formatProfit = (profit) => {
    const num = parseFloat(profit)
    if (num > 0) return `+${num.toFixed(6)}`
    return num.toFixed(6)
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-white mb-4">📊 Trade History</h2>

      {trades.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📈</div>
          <div>No trades executed yet</div>
          <div className="text-sm mt-2">Executed trades will appear here</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-700">
                <th className="pb-2">Time</th>
                <th className="pb-2">Path</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Profit</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {trades.map((trade, index) => (
                <tr key={index} className="hover:bg-gray-700/50">
                  <td className="py-3 text-gray-400">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 text-white">
                    <div className="flex items-center space-x-1">
                      <span>{trade.buyExchange}</span>
                      <span className="text-gray-500">→</span>
                      <span>{trade.sellExchange}</span>
                    </div>
                  </td>
                  <td className="py-3 text-white">
                    {trade.amount} {trade.tokenSymbol}
                  </td>
                  <td className={`py-3 font-bold ${
                    parseFloat(trade.profit) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatProfit(trade.profit)} {trade.tokenSymbol}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-sm">
            <div className="text-gray-400">
              Total Trades: <span className="text-white font-medium">{trades.length}</span>
            </div>
            <div className="text-gray-400">
              Net Profit:{' '}
              <span className={`font-bold ${
                trades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0) >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {formatProfit(trades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeHistory

