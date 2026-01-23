import React from 'react'
import { useSelector } from 'react-redux'
import { getWalletInfo } from '../store/websocket'

function WalletPanel() {
  const { wallet } = useSelector(state => state.bot)

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">💰 Wallet</h2>
        <button
          onClick={getWalletInfo}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>

      {wallet ? (
        wallet.error ? (
          <div className="text-red-400 text-sm">{wallet.error}</div>
        ) : (
          <div className="space-y-3">
            {/* Network Badge */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Network</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                wallet.network === 'localhost'
                  ? 'bg-blue-900/50 text-blue-400'
                  : 'bg-purple-900/50 text-purple-400'
              }`}>
                {wallet.network === 'localhost' ? '🔵 Local' : '🟣 Arbitrum'}
              </span>
            </div>

            {/* Address */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Address</span>
              <span className="text-white font-mono text-sm">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </span>
            </div>

            {/* ETH Balance */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">ETH Balance</span>
              <span className="text-white font-bold">
                {parseFloat(wallet.ethBalance).toFixed(6)} ETH
              </span>
            </div>

            {/* Token Balances */}
            {wallet.tokenBalances && Object.entries(wallet.tokenBalances).map(([symbol, balance]) => (
              <div key={symbol} className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{symbol}</span>
                <span className="text-white font-medium">
                  {parseFloat(balance).toFixed(4)}
                </span>
              </div>
            ))}

            {/* Warning for low balance */}
            {parseFloat(wallet.ethBalance) < 0.002 && wallet.network !== 'localhost' && (
              <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-500/50 rounded text-yellow-400 text-xs text-center">
                ⚠️ Low ETH balance - may not cover gas fees
              </div>
            )}
          </div>
        )
      ) : (
        <div className="text-center py-4 text-gray-500">
          <div className="text-2xl mb-2">💳</div>
          <div className="text-sm">Loading wallet info...</div>
        </div>
      )}
    </div>
  )
}

export default WalletPanel

