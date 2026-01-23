import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getWalletInfo, sendMessage, updateBotSettings } from '../store/websocket'
import { updateSettings } from '../store/botSlice'

function HeroSection() {
  const dispatch = useDispatch()
  const { wallet, settings, connected, isExecuting, isRunning, isTestMode } = useSelector(state => state.bot)

  useEffect(() => {
    getWalletInfo()
    const interval = setInterval(getWalletInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  const isTestnet = wallet?.isTestnet !== false
  const hardhatBal = wallet?.hardhat?.ethBalance
  const mainnetBal = wallet?.mainnet?.ethBalance
  const hardhatAddr = wallet?.hardhat?.address
  const mainnetAddr = wallet?.mainnet?.address

  const handleSettingChange = (key, value) => {
    dispatch(updateSettings({ [key]: value }))
    sendMessage('UPDATE_SETTINGS', { [key]: value })
  }

  const handleSliderChange = (key, value) => {
    dispatch(updateSettings({ [key]: value }))
    updateBotSettings({ [key]: value })
  }

  return (
    <div className="mb-8">
      {/* Hero Card */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>

        {/* DEMO/LIVE Mode Banner */}
        <div className="mb-4 p-3 rounded-xl text-center" style={{
          background: isTestMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
          border: `2px solid ${isTestMode ? '#f59e0b' : '#10b981'}`,
          animation: isTestMode ? 'pulse 2s infinite' : 'none'
        }}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{
              background: isTestMode ? '#f59e0b' : '#10b981',
              boxShadow: `0 0 12px ${isTestMode ? '#f59e0b' : '#10b981'}`,
              animation: 'pulse 1.5s infinite'
            }} />
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              color: isTestMode ? '#fbbf24' : '#10b981',
              letterSpacing: '2px'
            }}>
              {isTestMode ? '🧪 DEMO MODE - MANIPULATED PRICES' : '🔴 LIVE MODE - REAL TRADES'}
            </span>
            <div className="w-3 h-3 rounded-full" style={{
              background: isTestMode ? '#f59e0b' : '#10b981',
              boxShadow: `0 0 12px ${isTestMode ? '#f59e0b' : '#10b981'}`,
              animation: 'pulse 1.5s infinite'
            }} />
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {isTestMode ? 'Test environment with artificial price differences' : 'Connected to live forked Arbitrum network'}
          </p>
        </div>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white' }}>DAPPU Arbitrage</h1>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Multi-DEX Scanner • Uniswap • PancakeSwap • SushiSwap • Camelot</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: connected ? '#10b981' : '#ef4444', boxShadow: connected ? '0 0 8px #10b981' : 'none' }} />
              <span style={{ fontSize: '12px', color: connected ? '#10b981' : '#ef4444', fontWeight: '500' }}>{connected ? 'Connected' : 'Offline'}</span>
            </div>
            <span className="px-3 py-1.5 rounded-full" style={{ fontSize: '12px', fontWeight: '600', background: isExecuting ? 'rgba(245, 158, 11, 0.15)' : isRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)', color: isExecuting ? '#f59e0b' : isRunning ? '#10b981' : '#6366f1' }}>
              {isExecuting ? '⏳ Trading' : isRunning ? '🔍 Scanning' : '💤 Idle'}
            </span>
          </div>
        </div>

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Testnet */}
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', letterSpacing: '1px' }}>TESTNET</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#93c5fd', fontFamily: 'monospace' }}>
              {hardhatBal ? parseFloat(hardhatBal).toFixed(4) : '—'}
            </div>
            <div style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '4px' }}>ETH</div>
            {hardhatAddr && <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{hardhatAddr.slice(0, 8)}...{hardhatAddr.slice(-6)}</div>}
          </div>

          {/* Mainnet */}
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', letterSpacing: '1px' }}>MAINNET</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#fcd34d', fontFamily: 'monospace' }}>
              {mainnetBal ? parseFloat(mainnetBal).toFixed(4) : '—'}
            </div>
            <div style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '4px' }}>ETH</div>
            {mainnetAddr && <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{mainnetAddr.slice(0, 8)}...{mainnetAddr.slice(-6)}</div>}
          </div>
        </div>

        {/* Toggle Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {/* Testnet/Mainnet Pill */}
          <button onClick={() => handleSettingChange('isMainnet', isTestnet)} className="flex items-center gap-2 px-4 py-2 rounded-full transition-all" style={{ background: isTestnet ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)', border: `1px solid ${isTestnet ? '#3b82f6' : '#f59e0b'}` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: isTestnet ? '#3b82f6' : '#f59e0b' }} />
            <span style={{ color: isTestnet ? '#93c5fd' : '#fcd34d', fontSize: '13px', fontWeight: '600' }}>{isTestnet ? 'Testnet' : 'Mainnet'}</span>
          </button>

          {/* Fast Trade Pill */}
          <button onClick={() => handleSettingChange('skipConfirmation', !settings.skipConfirmation)} className="flex items-center gap-2 px-4 py-2 rounded-full transition-all" style={{ background: settings.skipConfirmation ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${settings.skipConfirmation ? '#eab308' : '#374151'}` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: settings.skipConfirmation ? '#eab308' : '#6b7280' }} />
            <span style={{ color: settings.skipConfirmation ? '#fde047' : '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Fast Trade</span>
          </button>

          {/* Auto Execute Pill */}
          <button onClick={() => handleSettingChange('autoExecute', !settings.autoExecute)} className="flex items-center gap-2 px-4 py-2 rounded-full transition-all" style={{ background: settings.autoExecute ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${settings.autoExecute ? '#a855f7' : '#374151'}` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: settings.autoExecute ? '#a855f7' : '#6b7280' }} />
            <span style={{ color: settings.autoExecute ? '#c4b5fd' : '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Auto Execute</span>
          </button>

          {settings.autoExecute && (
            <span className="px-3 py-1.5 rounded-full text-xs animate-pulse" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>⚠️ AUTO-TRADING ACTIVE</span>
          )}
        </div>

        {/* Threshold Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
          {/* Price Threshold */}
          <div className="text-center">
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>PRICE THRESHOLD</label>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#a5b4fc', margin: '4px 0' }}>{settings.priceDifference?.toFixed(1) || '0.5'}%</div>
            <input type="range" min="0.1" max="5" step="0.1" value={settings.priceDifference || 0.5} onChange={(e) => handleSliderChange('priceDifference', parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.priceDifference || 0.5) / 5) * 100}%, #1e293b ${((settings.priceDifference || 0.5) / 5) * 100}%, #1e293b 100%)` }} />
          </div>

          {/* Gas Limit */}
          <div className="text-center">
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>GAS LIMIT</label>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#a5b4fc', margin: '4px 0' }}>{((settings.gasLimit || 400000) / 1000).toFixed(0)}K</div>
            <input type="range" min="100000" max="1000000" step="50000" value={settings.gasLimit || 400000} onChange={(e) => handleSliderChange('gasLimit', parseInt(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.gasLimit || 400000) / 1000000) * 100}%, #1e293b ${((settings.gasLimit || 400000) / 1000000) * 100}%, #1e293b 100%)` }} />
          </div>

          {/* Gas Price */}
          <div className="text-center">
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>GAS PRICE (GWEI)</label>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#a5b4fc', margin: '4px 0' }}>{((settings.gasPrice || 0.0000001) * 1e9).toFixed(1)}</div>
            <input type="range" min="0.00000001" max="0.000001" step="0.00000001" value={settings.gasPrice || 0.0000001} onChange={(e) => handleSliderChange('gasPrice', parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.gasPrice || 0.0000001) / 0.000001) * 100}%, #1e293b ${((settings.gasPrice || 0.0000001) / 0.000001) * 100}%, #1e293b 100%)` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection

