import React from 'react'
import { useSelector } from 'react-redux'
import { getWalletInfo } from '../store/websocket'

function WalletPanel() {
  const { wallet } = useSelector(state => state.bot)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Wallet</h2>
        <button onClick={getWalletInfo} className="text-xs text-blue-400 hover:text-blue-300">
          Refresh
        </button>
      </div>

      {wallet ? (
        wallet.error ? (
          <div className="text-red-400 text-sm">{wallet.error}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label text-sm">Network</span>
              <span className={`badge ${wallet.network === 'localhost' ? 'badge-blue' : 'badge-purple'}`}>
                {wallet.network === 'localhost' ? 'Testnet' : 'Arbitrum'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-label text-sm">Address</span>
              <span className="text-gray-300 font-mono text-xs">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </span>
            </div>

            <div className="data-row p-3 flex items-center justify-between">
              <span className="text-label text-sm">ETH Balance</span>
              <span className="status-green font-semibold">
                {parseFloat(wallet.ethBalance).toFixed(6)} ETH
              </span>
            </div>

            {wallet.tokenBalances && Object.entries(wallet.tokenBalances).map(([symbol, balance]) => (
              <div key={symbol} className="flex items-center justify-between">
                <span className="text-label text-sm">{symbol}</span>
                <span className="text-white text-sm">{parseFloat(balance).toFixed(4)}</span>
              </div>
            ))}

            {parseFloat(wallet.ethBalance) < 0.002 && wallet.network !== 'localhost' && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-500 text-xs text-center">
                ⚠️ Low ETH balance
              </div>
            )}
          </div>
        )
      ) : (
        <div className="text-center py-6 text-muted">
          <div className="text-2xl mb-2">💳</div>
          <div className="text-sm">Loading wallet...</div>
        </div>
      )}
    </div>
  )
}

export default WalletPanel

