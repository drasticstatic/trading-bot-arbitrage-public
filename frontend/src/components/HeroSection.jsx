import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getWalletInfo, sendMessage, updateBotSettings } from '../store/websocket'
import { updateSettings } from '../store/botSlice'

function HeroSection() {
  const dispatch = useDispatch()
  const { wallet, settings, connected, isExecuting, isRunning, isTestMode } = useSelector(state => state.bot)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)

  useEffect(() => {
    getWalletInfo()
    const interval = setInterval(getWalletInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  // Use settings.isMainnet to determine mode
  const isTestnet = !settings.isMainnet
  const hardhatBal = wallet?.hardhat?.ethBalance
  const mainnetBal = wallet?.mainnet?.ethBalance
  const hardhatAddr = wallet?.hardhat?.address
  const mainnetAddr = wallet?.mainnet?.address

  // Get modal config based on toggle type
  const getModalConfig = (key, value) => {
    if (key === 'isMainnet') {
      return {
        icon: value ? '⚠️' : '🧪',
        title: value ? 'Switch to MAINNET?' : 'Switch to TESTNET?',
        description: value
          ? '⚠️ WARNING: You will be trading with REAL funds on Arbitrum mainnet. Ensure you have sufficient ETH for gas.'
          : 'You will switch to the Hardhat test environment for safe testing.',
        confirmColor: value ? '#f59e0b' : '#3b82f6',
        confirmGradient: value ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      }
    } else if (key === 'skipConfirmation') {
      return {
        icon: value ? '⚡' : '🛡️',
        title: value ? 'Enable Fast Trade?' : 'Disable Fast Trade?',
        description: value
          ? '⚡ CAUTION: This bypasses trade confirmation modals. Trades will execute immediately when you click Trade buttons!'
          : 'Trade confirmation modals will be shown before each trade execution.',
        confirmColor: value ? '#eab308' : '#6b7280',
        confirmGradient: value ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
      }
    } else if (key === 'autoExecute') {
      return {
        icon: value ? '🤖' : '✋',
        title: value ? 'Enable Auto Execute?' : 'Disable Auto Execute?',
        description: value
          ? '🤖 DANGER: The bot will automatically execute trades when profitable opportunities are found. No manual confirmation required!'
          : 'Auto execution disabled. You will need to manually click Trade to execute.',
        confirmColor: value ? '#ef4444' : '#10b981',
        confirmGradient: value ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }
    }
    return null
  }

  // Handle toggle with confirmation modal
  const handleToggleClick = (key, value) => {
    setPendingToggle({ key, value, config: getModalConfig(key, value) })
    setShowToggleModal(true)
    console.log(`[TOGGLE] Requesting: ${key} = ${value}`)
  }

  const confirmToggle = () => {
    if (pendingToggle) {
      console.log(`[TOGGLE] ✓ Confirmed: ${pendingToggle.key} = ${pendingToggle.value}`)
      handleSettingChange(pendingToggle.key, pendingToggle.value)
    }
    setShowToggleModal(false)
    setPendingToggle(null)
  }

  const cancelToggle = () => {
    console.log('[TOGGLE] ✗ Cancelled')
    setShowToggleModal(false)
    setPendingToggle(null)
  }

  const handleSettingChange = (key, value) => {
    console.log(`[SETTINGS] Updating ${key} to:`, value)
    dispatch(updateSettings({ [key]: value }))
    sendMessage('UPDATE_SETTINGS', { [key]: value })
  }

  const handleSliderChange = (key, value) => {
    dispatch(updateSettings({ [key]: value }))
    updateBotSettings({ [key]: value })
  }

  // Determine display mode - testnet shows demo, mainnet shows live
  const showDemoMode = isTestnet || isTestMode

  return (
    <div className="mb-8">
      {/* Toggle Confirmation Modal - uses config for all toggle types */}
      {showToggleModal && pendingToggle?.config && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: `2px solid ${pendingToggle.config.confirmColor}`,
            borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '90%', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {pendingToggle.config.icon}
            </div>
            <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '12px' }}>
              {pendingToggle.config.title}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              {pendingToggle.config.description}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={cancelToggle} style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #374151',
                background: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button onClick={confirmToggle} style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                background: pendingToggle.config.confirmGradient,
                color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>
                ✓ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>

        {/* Network Mode Banner - synced with toggle */}
        <div className="mb-4 p-3 rounded-xl text-center" style={{
          background: isTestnet ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          border: `2px solid ${isTestnet ? '#3b82f6' : '#f59e0b'}`,
        }}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{
              background: isTestnet ? '#3b82f6' : '#f59e0b',
              boxShadow: `0 0 12px ${isTestnet ? '#3b82f6' : '#f59e0b'}`,
              animation: 'pulse 1.5s infinite'
            }} />
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              color: isTestnet ? '#60a5fa' : '#fbbf24',
              letterSpacing: '2px'
            }}>
              {isTestnet ? '🧪 TESTNET MODE - HARDHAT' : '🔴 MAINNET MODE - REAL TRADES'}
            </span>
            <div className="w-3 h-3 rounded-full" style={{
              background: isTestnet ? '#3b82f6' : '#f59e0b',
              boxShadow: `0 0 12px ${isTestnet ? '#3b82f6' : '#f59e0b'}`,
              animation: 'pulse 1.5s infinite'
            }} />
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {isTestnet ? 'Safe testing on forked Arbitrum • No real funds at risk' : 'Connected to Arbitrum mainnet • Real ETH transactions'}
          </p>
          {isTestMode && isTestnet && (
            <p style={{ fontSize: '10px', color: '#fbbf24', marginTop: '4px' }}>
              ⚡ Price manipulation active - artificial opportunities visible
            </p>
          )}
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

        {/* Toggle Pills - all use handleToggleClick for confirmation modals */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {/* Testnet/Mainnet Pill */}
          <button
            onClick={() => handleToggleClick('isMainnet', !settings.isMainnet)}
            title={isTestnet ? 'Click to switch to Mainnet (real funds)' : 'Click to switch to Testnet (Hardhat)'}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
            style={{ background: isTestnet ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)', border: `1px solid ${isTestnet ? '#3b82f6' : '#f59e0b'}` }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: isTestnet ? '#3b82f6' : '#f59e0b' }} />
            <span style={{ color: isTestnet ? '#93c5fd' : '#fcd34d', fontSize: '13px', fontWeight: '600' }}>{isTestnet ? 'Testnet' : 'Mainnet'}</span>
          </button>

          {/* Fast Trade Pill - now uses confirmation modal */}
          <button
            onClick={() => handleToggleClick('skipConfirmation', !settings.skipConfirmation)}
            title={settings.skipConfirmation ? 'Fast Trade ON: Trades execute immediately without confirmation' : 'Fast Trade OFF: Shows confirmation before each trade'}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
            style={{ background: settings.skipConfirmation ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${settings.skipConfirmation ? '#eab308' : '#374151'}` }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: settings.skipConfirmation ? '#eab308' : '#6b7280' }} />
            <span style={{ color: settings.skipConfirmation ? '#fde047' : '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Fast Trade</span>
          </button>

          {/* Auto Execute Pill - now uses confirmation modal */}
          <button
            onClick={() => handleToggleClick('autoExecute', !settings.autoExecute)}
            title={settings.autoExecute ? 'Auto Execute ON: Bot automatically executes profitable trades' : 'Auto Execute OFF: Manual trade execution required'}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
            style={{ background: settings.autoExecute ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${settings.autoExecute ? '#a855f7' : '#374151'}` }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: settings.autoExecute ? '#a855f7' : '#6b7280' }} />
            <span style={{ color: settings.autoExecute ? '#c4b5fd' : '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Auto Execute</span>
          </button>

          {settings.autoExecute && (
            <span className="px-3 py-1.5 rounded-full text-xs animate-pulse" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>⚠️ AUTO-TRADING ACTIVE</span>
          )}
        </div>

        {/* Threshold Sliders with tooltips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.2)' }}>
          {/* Price Threshold */}
          <div className="text-center" title="Minimum price difference (%) between DEXs required to flag an opportunity">
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px', cursor: 'help' }}>PRICE THRESHOLD</label>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#a5b4fc', margin: '4px 0' }}>{settings.priceDifference?.toFixed(1) || '0.5'}%</div>
            <input type="range" min="0.1" max="5" step="0.1" value={settings.priceDifference || 0.5} onChange={(e) => handleSliderChange('priceDifference', parseFloat(e.target.value))} title={`${settings.priceDifference?.toFixed(1) || '0.5'}% - Lower = more sensitive, Higher = fewer false positives`} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.priceDifference || 0.5) / 5) * 100}%, #1e293b ${((settings.priceDifference || 0.5) / 5) * 100}%, #1e293b 100%)` }} />
          </div>

          {/* Gas Limit */}
          <div className="text-center" title="Maximum gas units allowed per transaction. Higher = safer but more expensive">
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px', cursor: 'help' }}>GAS LIMIT</label>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#a5b4fc', margin: '4px 0' }}>{((settings.gasLimit || 400000) / 1000).toFixed(0)}K</div>
            <input type="range" min="100000" max="1000000" step="50000" value={settings.gasLimit || 400000} onChange={(e) => handleSliderChange('gasLimit', parseInt(e.target.value))} title={`${((settings.gasLimit || 400000) / 1000).toFixed(0)}K gas units - Flash loan swaps typically need 300-500K`} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.gasLimit || 400000) / 1000000) * 100}%, #1e293b ${((settings.gasLimit || 400000) / 1000000) * 100}%, #1e293b 100%)` }} />
          </div>

          {/* Gas Price */}
          <div className="text-center" title="Gas price in Gwei. Higher = faster confirmation but more expensive">
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px', cursor: 'help' }}>GAS PRICE (GWEI)</label>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#a5b4fc', margin: '4px 0' }}>{((settings.gasPrice || 0.0000001) * 1e9).toFixed(1)}</div>
            <input type="range" min="0.00000001" max="0.000001" step="0.00000001" value={settings.gasPrice || 0.0000001} onChange={(e) => handleSliderChange('gasPrice', parseFloat(e.target.value))} title={`${((settings.gasPrice || 0.0000001) * 1e9).toFixed(1)} Gwei - Arbitrum typically 0.1-1.0 Gwei`} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.gasPrice || 0.0000001) / 0.000001) * 100}%, #1e293b ${((settings.gasPrice || 0.0000001) / 0.000001) * 100}%, #1e293b 100%)` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection

