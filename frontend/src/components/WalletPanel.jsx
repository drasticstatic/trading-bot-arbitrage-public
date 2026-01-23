import React from 'react'
import { useSelector } from 'react-redux'
import { getWalletInfo } from '../store/websocket'

function WalletPanel() {
  const { wallet } = useSelector(state => state.bot)

  return (
    <div className="glass rounded-2xl p-6 glow-purple">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold gradient-text">💰 WALLET</h2>
        <button
          onClick={getWalletInfo}
          className="text-sm text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors"
        >
          ⟳ Sync
        </button>
      </div>

      {wallet ? (
        wallet.error ? (
          <div className="text-red-400 text-sm glass p-3 rounded-lg">{wallet.error}</div>
        ) : (
          <div className="space-y-3">
            {/* Network Badge */}
            <div className="flex items-center justify-between">
              <span className="text-purple-300/70 text-sm">Network</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                wallet.network === 'localhost'
                  ? 'glass-cyan text-cyan-400'
                  : 'glass-pink text-fuchsia-400'
              }`}>
                {wallet.network === 'localhost' ? '🔵 TESTNET' : '🟣 ARBITRUM'}
              </span>
            </div>

            {/* Address */}
            <div className="flex items-center justify-between">
              <span className="text-purple-300/70 text-sm">Address</span>
              <span className="text-cyan-400 font-mono text-sm font-medium">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </span>
            </div>

            {/* ETH Balance */}
            <div className="flex items-center justify-between glass-green rounded-lg px-3 py-2">
              <span className="text-emerald-300/70 text-sm">ETH Balance</span>
              <span className="text-emerald-400 font-bold font-display text-lg">
                {parseFloat(wallet.ethBalance).toFixed(6)} Ξ
              </span>
            </div>

            {/* Token Balances */}
            {wallet.tokenBalances && Object.entries(wallet.tokenBalances).map(([symbol, balance]) => (
              <div key={symbol} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                <span className="text-purple-300/70 text-sm">{symbol}</span>
                <span className="text-white font-medium font-display">
                  {parseFloat(balance).toFixed(4)}
                </span>
              </div>
            ))}

            {/* Warning for low balance */}
            {parseFloat(wallet.ethBalance) < 0.002 && wallet.network !== 'localhost' && (
              <div className="mt-2 p-3 glass border border-yellow-500/50 rounded-lg text-yellow-400 text-xs text-center animate-pulse">
                ⚠️ Low ETH - Gas fees may fail
              </div>
            )}
          </div>
        )
      ) : (
        <div className="text-center py-6">
          <div className="text-4xl mb-3 float">💳</div>
          <div className="text-purple-300/70 text-sm">Syncing wallet...</div>
        </div>
      )}
    </div>
  )
}

export default WalletPanel

