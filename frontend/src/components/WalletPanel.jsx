import React from 'react'
import { useSelector } from 'react-redux'
import { getWalletInfo } from '../store/websocket'

function WalletPanel() {
  const { wallet } = useSelector(state => state.bot)

  const hardhat = wallet?.hardhat
  const mainnet = wallet?.mainnet

  const safeToFixed = (val, digits) => {
    const n = Number(val)
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(digits)
  }

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
            {/* Hardhat (fork/local) */}
            <div className="data-row p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-label text-sm">Hardhat</span>
                <span className="badge badge-blue">Testnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">
                  {hardhat?.address ? `${hardhat.address.slice(0, 6)}...${hardhat.address.slice(-4)}` : '—'}
                </span>
                <span className="text-white text-sm font-semibold">
                  {safeToFixed(hardhat?.ethBalance, 6)} ETH
                </span>
              </div>
            </div>

            {/* Arbitrum mainnet */}
            <div className="data-row p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-label text-sm">Arbitrum</span>
                <span className="badge badge-purple">Mainnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-mono text-xs">
                  {mainnet?.address ? `${mainnet.address.slice(0, 6)}...${mainnet.address.slice(-4)}` : '—'}
                </span>
                <span className="text-white text-sm font-semibold">
                  {safeToFixed(mainnet?.ethBalance, 6)} ETH
                </span>
              </div>
            </div>

            {Number(mainnet?.ethBalance) < 0.002 && mainnet?.ethBalance !== '—' && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-500 text-xs text-center">
                ⚠️ Low ETH balance (mainnet)
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

