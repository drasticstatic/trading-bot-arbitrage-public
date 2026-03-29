import React, { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getWalletInfo, sendMessage, updateBotSettings, estimateDeployCost } from '../store/websocket'
import { updateSettings } from '../store/botSlice'

import Tooltip from './Tooltip'

function HeroSection() {
  const dispatch = useDispatch()
  const { wallet, settings, connected, isExecuting, isRunning, isTestMode, trades } = useSelector(state => state.bot)

  // Calculate P&L metrics from trades
  const metrics = useMemo(() => {
    if (!trades?.length) return { total: 0, successful: 0, failed: 0, netProfit: 0, winRate: 0 }
    const total = trades.length
    const successful = trades.filter(t => t.status === 'success').length
    const failed = total - successful
    const netProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0)
    const winRate = total > 0 ? Math.round((successful / total) * 100) : 0
    return { total, successful, failed, netProfit, winRate }
  }, [trades])
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)
  const [showSliderModal, setShowSliderModal] = useState(false)
  const [pendingSlider, setPendingSlider] = useState(null)
  const sliderOriginalRef = React.useRef({})
  const [settingsFeedback, setSettingsFeedback] = useState(null)
  const [draftSettings, setDraftSettings] = useState(settings)
  const [deployEstimate, setDeployEstimate] = useState(null)
  const [estimating, setEstimating] = useState(false)

  useEffect(() => {
    getWalletInfo()
    const interval = setInterval(getWalletInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  // Listen for deploy estimate responses
  useEffect(() => {
    const handler = (e) => {
      setEstimating(false)
      setDeployEstimate(e.detail)
    }
    window.addEventListener('deploy-estimate', handler)
    return () => window.removeEventListener('deploy-estimate', handler)
  }, [])

  // Keep local slider draft values in sync with store settings.
  // If a confirmation modal is open, don't clobber the draft mid-confirm.
  useEffect(() => {
    if (showSliderModal) return
    setDraftSettings(settings)
  }, [settings, showSliderModal])

  const getSettingFeedbackLabel = (key) => ({
    autoExecute: 'Auto Execute',
    gasLimit: 'Gas Limit',
    gasPrice: 'Gas Price',
    mevProtection: 'MEV Shield',
    priceDifference: 'Price Threshold',
    skipConfirmation: 'Fast Trade'
  }[key] || key)

  const handleEstimateDeploy = () => {
    // Toggle visibility if already showing estimate
    if (deployEstimate && !estimating) {
      setDeployEstimate(null)
      return
    }
    setEstimating(true)
    setDeployEstimate(null)
    estimateDeployCost()
  }

  // Use settings.isMainnet to determine mode
  const isTestnet = !settings.isMainnet
  const hardhatBal = wallet?.hardhat?.ethBalance
  const mainnetBal = wallet?.mainnet?.ethBalance
  const hardhatAddr = wallet?.hardhat?.address
  const mainnetAddr = wallet?.mainnet?.address

	  const balancePopStyle = {
		fontSize: '15px',
		fontFamily: 'monospace',
		letterSpacing: '0.2px',
		textShadow: '0 0 10px rgba(99,102,241,0.15)'
	  }

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
          ? '🤖 DANGER: The bot will automatically execute trades when profitable opportunities are found. No need to manually click "Trade" to execute!'
          : 'Auto execution disabled. You will need to manually click "Trade" to execute.',
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
      setSettingsFeedback(`✓ Updated ${getSettingFeedbackLabel(pendingToggle.key)}`)
      setTimeout(() => setSettingsFeedback(null), 2500)
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

  // Slider modal config
  const getSliderModalConfig = (key, value) => {
    if (key === 'priceDifference') {
      return {
        icon: '📊',
        title: 'Change Price Threshold?',
        description: `Set threshold to ${value.toFixed(1)}%? This is the minimum price difference between DEXs required to flag an arbitrage opportunity.`,
        valueDisplay: `${value.toFixed(1)}%`,
        confirmColor: '#6366f1'
      }
    } else if (key === 'gasLimit') {
      return {
        icon: '⛽',
        title: 'Change Gas Limit?',
				description: `Set gas limit to ${Number(value).toLocaleString()}? Flash loan swaps typically need 300-500K gas units. Higher = safer but more expensive.`,
				valueDisplay: `${Number(value).toLocaleString()}`,
        confirmColor: '#6366f1'
      }
    } else if (key === 'gasPrice') {
      return {
        icon: '💰',
        title: 'Change Gas Price?',
				// value is already in Gwei (fix: avoid * 1e9 display bug like 0.83 -> 830000000.0)
				description: `Set gas price to ${Number(value).toFixed(2)} Gwei? Higher = faster confirmation but more expensive. Arbitrum typically 0.1-1.0 Gwei.`,
				valueDisplay: `${Number(value).toFixed(2)} Gwei`,
        confirmColor: '#6366f1'
      }
    }
    return null
  }

	const sliderStyle = (value, min, max) => {
		const v = Number(value)
		const clamped = Math.min(max, Math.max(min, Number.isFinite(v) ? v : min))
		const pct = ((clamped - min) / (max - min)) * 100
		return {
			width: '80px',
			height: '6px',
			accentColor: '#a5b4fc',
			'--value-percent': `${pct}%`
		}
	}

	const pnlSpark = useMemo(() => {
		const recent = (trades || []).slice(-24)
		if (recent.length < 2) return null
		const series = []
		let running = 0
		for (const t of recent) {
			running += parseFloat(t.profit || 0)
			series.push(running)
		}
		const min = Math.min(...series)
		const max = Math.max(...series)
		const span = max - min || 1
		const points = series.map((y, i) => {
			const x = (i / (series.length - 1)) * 100
			const yy = 28 - ((y - min) / span) * 28
			return `${x.toFixed(2)},${yy.toFixed(2)}`
		}).join(' ')
		return { points, end: series[series.length - 1] }
	}, [trades])

	const outcomeBars = useMemo(() => {
		const recent = (trades || []).slice(-24)
		if (!recent.length) return []
		const vals = recent.map(t => parseFloat(t.profit || 0))
		const maxAbs = Math.max(...vals.map(v => Math.abs(v)), 0) || 1
		return recent.map((t, i) => {
			const v = parseFloat(t.profit || 0)
			return {
				i,
				status: t.status,
				height: (Math.abs(v) / maxAbs) * 18,
				isPos: v >= 0
			}
		})
	}, [trades])

  // Handle slider start - store original value for cancel revert (useRef avoids async state race)
  const handleSliderStart = (key) => {
    const currentValue = draftSettings?.[key] ?? settings[key]
    sliderOriginalRef.current[key] = currentValue
    console.log(`[SLIDER] 📍 Started: ${key} = ${currentValue}`)
  }

  // Handle slider with confirmation modal
  const handleSliderClick = (key, value) => {
		const originalValue = sliderOriginalRef.current[key] ?? settings[key]
    console.log(`[SLIDER] 🎚️ Changed: ${key} from ${originalValue} to ${value}`)
    setPendingSlider({ key, value, originalValue, config: getSliderModalConfig(key, value) })
    setShowSliderModal(true)
  }

  const confirmSlider = () => {
    if (pendingSlider) {
      console.log(`[SLIDER] ✅ CONFIRMED: ${pendingSlider.key} = ${pendingSlider.value}`)
      console.log(`[SLIDER] 📤 Sending to backend...`)
      dispatch(updateSettings({ [pendingSlider.key]: pendingSlider.value }))
      updateBotSettings({ [pendingSlider.key]: pendingSlider.value })

      setDraftSettings(prev => ({ ...prev, [pendingSlider.key]: pendingSlider.value }))

      setSettingsFeedback(`✓ Applied ${getSettingFeedbackLabel(pendingSlider.key)}`)
      setTimeout(() => setSettingsFeedback(null), 2500)
    }
    setShowSliderModal(false)
    setPendingSlider(null)
    sliderOriginalRef.current = {}
  }

  const cancelSlider = () => {
    if (pendingSlider && pendingSlider.originalValue !== undefined) {
      console.log(`[SLIDER] ❌ CANCELLED: Reverting ${pendingSlider.key} from ${pendingSlider.value} back to ${pendingSlider.originalValue}`)
      setDraftSettings(prev => ({ ...prev, [pendingSlider.key]: pendingSlider.originalValue }))
      setSettingsFeedback('✗ Cancelled (no changes applied)')
      setTimeout(() => setSettingsFeedback(null), 2000)
    }
    setShowSliderModal(false)
    setPendingSlider(null)
    sliderOriginalRef.current = {}
  }

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

      {/* Slider Confirmation Modal */}
      {showSliderModal && pendingSlider?.config && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: `2px solid ${pendingSlider.config.confirmColor}`,
            borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '90%', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {pendingSlider.config.icon}
            </div>
            <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
              {pendingSlider.config.title}
            </h3>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#a5b4fc', marginBottom: '12px' }}>
              {pendingSlider.config.valueDisplay}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              {pendingSlider.config.description}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={cancelSlider} style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #374151',
                background: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button onClick={confirmSlider} style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>
                ✓ Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - No outer card border, bento cards inside */}
      <div style={{ marginBottom: '24px' }}>
        {/* Bento Grid - Performance card spans 2 rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'auto 1fr', gap: '10px', alignItems: 'stretch' }}>

          {/* Row 1: Title + DEX List Block - spans 8 cols, compact */}
          <div style={{ gridColumn: 'span 8', gridRow: 'span 1', padding: '10px 14px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.06) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <h1 style={{ fontSize: '17px', fontWeight: '700', margin: 0, lineHeight: 1.3, background: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 50%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ WebkitTextFillColor: 'initial' }}>⚡</span> Drasticstatic's Arbitrage Trading Bot
            </h1>
            <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 10px 0' }}>built on DAPP University's framework</p>
            {/* DEX List with tooltips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              <Tooltip text="Universal Router - Supports v2/v3/v4 pools with optimized gas">
                <span style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: '600', cursor: 'help', transition: 'all 0.2s' }} className="hover:scale-105">Uniswap</span>
              </Tooltip>
              <Tooltip text="SmartRouter/Infinity - Optimized for BNB & Multichain swaps">
                <span style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(244, 114, 182, 0.15)', color: '#f472b6', fontSize: '11px', fontWeight: '600', cursor: 'help', transition: 'all 0.2s' }} className="hover:scale-105">PancakeSwap</span>
              </Tooltip>
              <Tooltip text="RouteProcessor - V2-style router with modern updates">
                <span style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', fontSize: '11px', fontWeight: '600', cursor: 'help', transition: 'all 0.2s' }} className="hover:scale-105">SushiSwap</span>
              </Tooltip>
              <Tooltip text="Algebra Router - Concentrated Liquidity with dynamic fees">
                <span style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', fontSize: '11px', fontWeight: '600', cursor: 'help', transition: 'all 0.2s' }} className="hover:scale-105">Camelot</span>
              </Tooltip>
              <Tooltip text="Vault - Vault-based architecture with flash loans">
                <span style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', fontSize: '11px', fontWeight: '600', cursor: 'help', transition: 'all 0.2s' }} className="hover:scale-105">Balancer</span>
              </Tooltip>
              <Tooltip text="StableSwap - Optimized for stablecoin and pegged asset swaps">
                <span style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontSize: '11px', fontWeight: '600', cursor: 'help', transition: 'all 0.2s' }} className="hover:scale-105">Curve</span>
              </Tooltip>
            </div>
          </div>

          {/* Performance Stats - spans 4 cols + 2 rows (double height) */}
          <div style={{ gridColumn: 'span 4', gridRow: 'span 2', padding: '12px 14px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '6px', fontWeight: '600', letterSpacing: '1px' }}>PERFORMANCE</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#a5b4fc' }}><strong style={{ fontSize: '18px' }}>{metrics.total}</strong> trades</span>
              <span style={{ fontSize: '13px', color: '#10b981' }}><strong style={{ fontSize: '18px' }}>{metrics.successful}</strong> success</span>
              <span style={{ fontSize: '13px', color: '#ef4444' }}><strong style={{ fontSize: '18px' }}>{metrics.failed}</strong> failed</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: metrics.netProfit >= 0 ? '#10b981' : '#ef4444', marginBottom: '8px' }}>
              {metrics.netProfit >= 0 ? '+' : ''}{metrics.netProfit.toFixed(6)} <span style={{ fontSize: '12px', color: '#64748b' }}>WETH P&L</span>
            </div>

            {/* Charts - expand to fill remaining space */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ flex: 1, minHeight: '70px', padding: '8px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(100,116,139,0.15)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>P&L TREND</div>
                {pnlSpark ? (
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', maxHeight: '50px' }}>
                    <polyline points={pnlSpark.points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '11px', paddingTop: '10px' }}>Awaiting trade data…</div>
                )}
              </div>
              <div style={{ flex: 1, minHeight: '60px', padding: '8px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(100,116,139,0.15)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>TRADE OUTCOMES</div>
                {outcomeBars.length ? (
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ width: '100%', height: '100%', maxHeight: '30px' }}>
                    {outcomeBars.map((b) => {
                      const w = 100 / outcomeBars.length
                      const x = b.i * w
                      const h = Math.max(2, Math.min(18, b.status === 'success' ? b.height : 6))
                      const y = 20 - h
                      const fill = b.status === 'success' ? (b.isPos ? '#10b981' : '#ef4444') : '#ef4444'
                      return <rect key={b.i} x={x + 0.5} y={y} width={Math.max(1, w - 1)} height={h} rx="1" fill={fill} opacity="0.9" />
                    })}
                  </svg>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '11px', paddingTop: '6px' }}>No trades yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Testnet Wallet - spans 4 cols, includes network status info */}
          <div style={{ gridColumn: 'span 4', gridRow: 'span 1', padding: '12px 14px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.04) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              <div className="flex items-center" style={{ gap: '6px', flexWrap: 'wrap' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#3b82f6', boxShadow: '0 0 8px #3b82f6', animation: isTestnet ? 'pulse 1.5s infinite' : 'none' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa' }}>🧪 TESTNET</span>
                {isTestnet && <span style={{ fontSize: '9px', color: connected ? '#10b981' : '#ef4444', background: connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', padding: '2px 5px', borderRadius: '4px', marginLeft: '2px' }}>{connected ? '● Connected' : '○ Offline'}</span>}
                {isTestnet && <span style={{ fontSize: '9px', color: isExecuting ? '#f59e0b' : isRunning ? '#10b981' : '#6366f1', background: isExecuting ? 'rgba(245,158,11,0.2)' : isRunning ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', padding: '2px 5px', borderRadius: '4px', marginLeft: '2px' }}>{isExecuting ? '⏳ Trading' : isRunning ? '🔍 Scanning' : '💤 Idle'}</span>}
              </div>
            </div>
            {hardhatAddr && <div style={{ fontSize: '9px', color: '#475569', fontFamily: 'monospace', marginBottom: '6px' }}>{hardhatAddr}</div>}
            {/* Network info with colored fonts */}
            <div style={{ fontSize: '10px', marginBottom: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span><span style={{ color: '#64748b' }}>Chain:</span> <span style={{ color: '#60a5fa', fontWeight: '600' }}>31337</span></span>
              <span><span style={{ color: '#64748b' }}>Network:</span> <span style={{ color: '#a5b4fc', fontWeight: '600' }}>Hardhat</span></span>
              <span><span style={{ color: '#64748b' }}>RPC:</span> <span style={{ color: '#10b981', fontWeight: '600' }}>localhost:8545</span></span>
            </div>
		            {/* MEV + Auto status inline */}
		            <div style={{ fontSize: '10px', marginBottom: '8px', display: 'flex', gap: '12px' }}>
		              <span>
		                <span style={{ color: '#64748b' }}>MEV:</span>{' '}
		                <Tooltip text={settings.mevProtection ? '🛡️ MEV Shield: configured. Private mempool requires MAINNET + ALCHEMY_API_KEY (local forks cannot use private tx).' : '⚠️ MEV Shield: off. Click to toggle.'}>
		                  <button
		                    onClick={() => handleToggleClick('mevProtection', !settings.mevProtection)}
		                    className="transition-all hover:scale-105"
		                    style={{
		                      fontSize: '10px',
		                      fontWeight: 600,
		                      color: settings.mevProtection ? '#10b981' : '#ef4444',
		                      background: settings.mevProtection ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)',
		                      border: `1px solid ${settings.mevProtection ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
		                      borderRadius: '999px',
		                      padding: '1px 7px',
		                      cursor: 'pointer'
		                    }}
		                  >
		                    {settings.mevProtection ? '🛡️ ON' : '⚠️ OFF'}
		                  </button>
		                </Tooltip>
		              </span>
		              <span><span style={{ color: '#64748b' }}>Auto:</span> <span style={{ color: settings.autoExecute ? '#10b981' : '#64748b', fontWeight: '600' }}>{settings.autoExecute ? '🤖 ON' : 'OFF'}</span></span>
		            </div>
            {/* Balances with more spacing */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
	              <span style={{ ...balancePopStyle, color: '#93c5fd' }}><strong>{hardhatBal ? parseFloat(hardhatBal).toFixed(4) : '—'}</strong> ETH</span>
	              <span style={{ ...balancePopStyle, color: '#93c5fd' }}><strong>{wallet?.hardhat?.wethBalance ? parseFloat(wallet.hardhat.wethBalance).toFixed(4) : '0'}</strong> WETH</span>
	              <span style={{ ...balancePopStyle, color: '#93c5fd' }}><strong>{wallet?.hardhat?.arbBalance ? parseFloat(wallet.hardhat.arbBalance).toFixed(2) : '0'}</strong> ARB</span>
            </div>
		            {hardhatAddr && (
		              <div className="flex" style={{ gap: '14px', marginTop: 'auto' }}>
		                <a href={`https://arbiscan.io/address/${hardhatAddr}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '9px', color: '#60a5fa', background: 'rgba(96,165,250,0.15)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(96,165,250,0.3)' }} className="hover:scale-105">Arbiscan ↗</a>
		                <a href={`https://etherscan.io/address/${hardhatAddr}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '9px', color: '#94a3b8', background: 'rgba(148,163,184,0.15)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(148,163,184,0.3)' }} className="hover:scale-105">Etherscan ↗</a>
		                <button
		                  onClick={getWalletInfo}
		                  title="Refresh wallet balances now"
		                  className="transition-all hover:scale-105"
		                  style={{
		                    fontSize: '9px',
		                    color: '#93c5fd',
		                    background: 'rgba(59,130,246,0.12)',
		                    padding: '4px 10px',
		                    borderRadius: '6px',
		                    border: '1px solid rgba(59,130,246,0.25)',
		                    cursor: 'pointer',
		                    fontWeight: 700
		                  }}
		                >
		                  ↻ Refresh
		                </button>
		              </div>
		            )}
          </div>

          {/* Row 2: Mainnet Wallet - spans 4 cols, includes network status info */}
          <div style={{ gridColumn: 'span 4', gridRow: 'span 1', padding: '12px 14px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.04) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              <div className="flex items-center" style={{ gap: '6px', flexWrap: 'wrap' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b', animation: !isTestnet ? 'pulse 1.5s infinite' : 'none' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24' }}>🔴 MAINNET</span>
                {!isTestnet && <span style={{ fontSize: '9px', color: connected ? '#10b981' : '#ef4444', background: connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', padding: '2px 5px', borderRadius: '4px', marginLeft: '2px' }}>{connected ? '● Connected' : '○ Offline'}</span>}
                {!isTestnet && <span style={{ fontSize: '9px', color: isExecuting ? '#f59e0b' : isRunning ? '#10b981' : '#6366f1', background: isExecuting ? 'rgba(245,158,11,0.2)' : isRunning ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', padding: '2px 5px', borderRadius: '4px', marginLeft: '2px' }}>{isExecuting ? '⏳ Trading' : isRunning ? '🔍 Scanning' : '💤 Idle'}</span>}
		              </div>
            </div>
            {mainnetAddr && <div style={{ fontSize: '9px', color: '#475569', fontFamily: 'monospace', marginBottom: '6px' }}>{mainnetAddr}</div>}
            {/* Network info with colored fonts */}
            <div style={{ fontSize: '10px', marginBottom: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span><span style={{ color: '#64748b' }}>Chain:</span> <span style={{ color: '#fbbf24', fontWeight: '600' }}>42161</span></span>
              <span><span style={{ color: '#64748b' }}>Network:</span> <span style={{ color: '#a5b4fc', fontWeight: '600' }}>Arbitrum</span></span>
              <span><span style={{ color: '#64748b' }}>RPC:</span> <span style={{ color: '#10b981', fontWeight: '600' }}>{wallet?.mainnet?.rpc || 'Alchemy'}</span></span>
            </div>
		            {/* MEV + Auto status inline */}
		            <div style={{ fontSize: '10px', marginBottom: '8px', display: 'flex', gap: '12px' }}>
		              <span>
		                <span style={{ color: '#64748b' }}>MEV:</span>{' '}
		                <Tooltip text={settings.mevProtection ? '🛡️ MEV Shield: configured. Private mempool requires MAINNET + ALCHEMY_API_KEY.' : '⚠️ MEV Shield: off. Click to toggle.'}>
		                  <button
		                    onClick={() => handleToggleClick('mevProtection', !settings.mevProtection)}
		                    className="transition-all hover:scale-105"
		                    style={{
		                      fontSize: '10px',
		                      fontWeight: 600,
		                      color: settings.mevProtection ? '#10b981' : '#ef4444',
		                      background: settings.mevProtection ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)',
		                      border: `1px solid ${settings.mevProtection ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
		                      borderRadius: '999px',
		                      padding: '1px 7px',
		                      cursor: 'pointer'
		                    }}
		                  >
		                    {settings.mevProtection ? '🛡️ ON' : '⚠️ OFF'}
		                  </button>
		                </Tooltip>
		              </span>
		              <span><span style={{ color: '#64748b' }}>Auto:</span> <span style={{ color: settings.autoExecute ? '#10b981' : '#64748b', fontWeight: '600' }}>{settings.autoExecute ? '🤖 ON' : 'OFF'}</span></span>
		            </div>
            {/* Balances with more spacing */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
	              <span style={{ ...balancePopStyle, color: '#fcd34d', textShadow: '0 0 10px rgba(245,158,11,0.18)' }}><strong>{mainnetBal ? parseFloat(mainnetBal).toFixed(4) : '—'}</strong> ETH</span>
	              <span style={{ ...balancePopStyle, color: '#fcd34d', textShadow: '0 0 10px rgba(245,158,11,0.18)' }}><strong>{wallet?.mainnet?.wethBalance ? parseFloat(wallet.mainnet.wethBalance).toFixed(4) : '0'}</strong> WETH</span>
	              <span style={{ ...balancePopStyle, color: '#fcd34d', textShadow: '0 0 10px rgba(245,158,11,0.18)' }}><strong>{wallet?.mainnet?.arbBalance ? parseFloat(wallet.mainnet.arbBalance).toFixed(2) : '0'}</strong> ARB</span>
            </div>
		            {mainnetAddr && (
		              <div className="flex" style={{ gap: '14px', marginTop: 'auto' }}>
		                <a href={`https://arbiscan.io/address/${mainnetAddr}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '9px', color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(251,191,36,0.3)' }} className="hover:scale-105">Arbiscan ↗</a>
		                <a href={`https://etherscan.io/address/${mainnetAddr}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '9px', color: '#94a3b8', background: 'rgba(148,163,184,0.15)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(148,163,184,0.3)' }} className="hover:scale-105">Etherscan ↗</a>
		                <button
		                  onClick={getWalletInfo}
		                  title="Refresh wallet balances now"
		                  className="transition-all hover:scale-105"
		                  style={{
		                    fontSize: '9px',
		                    color: '#93c5fd',
		                    background: 'rgba(59,130,246,0.12)',
		                    padding: '4px 10px',
		                    borderRadius: '6px',
		                    border: '1px solid rgba(59,130,246,0.25)',
		                    cursor: 'pointer',
		                    fontWeight: 700
		                  }}
		                >
		                  ↻ Refresh
		                </button>
		              </div>
		            )}
          </div>

          {/* Controls Row: Toggles + Sliders - spans full width (12 cols) */}
          <div style={{ gridColumn: 'span 12', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '16px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(100,116,139,0.1)' }}>
            {/* Toggle Buttons - More button-like with CTA effects */}
            <Tooltip text={isTestnet ? '🧪 Currently on TESTNET (Hardhat). Click to switch to Mainnet with real funds.' : '⚠️ Currently on MAINNET. Click to switch to safe Testnet mode.'}>
              <button onClick={() => handleToggleClick('isMainnet', !settings.isMainnet)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95" style={{ background: isTestnet ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)', border: `2px solid ${isTestnet ? '#3b82f6' : '#f59e0b'}`, boxShadow: `0 0 12px ${isTestnet ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: isTestnet ? '#3b82f6' : '#f59e0b', boxShadow: `0 0 6px ${isTestnet ? '#3b82f6' : '#f59e0b'}` }} />
                <span style={{ color: isTestnet ? '#93c5fd' : '#fcd34d', fontSize: '12px', fontWeight: '700' }}>{isTestnet ? '🧪 Testnet' : '🔴 Mainnet'}</span>
              </button>
            </Tooltip>
            <Tooltip text={settings.skipConfirmation ? '⚡ FAST TRADE ON - Trades execute immediately without confirmation modals!' : '🛡️ Fast Trade OFF - Shows confirmation before each trade for safety.'}>
              <button onClick={() => handleToggleClick('skipConfirmation', !settings.skipConfirmation)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95" style={{ background: settings.skipConfirmation ? 'rgba(234, 179, 8, 0.25)' : 'rgba(100,116,139,0.15)', border: `2px solid ${settings.skipConfirmation ? '#eab308' : '#475569'}`, boxShadow: settings.skipConfirmation ? '0 0 12px rgba(234,179,8,0.3)' : 'none' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: settings.skipConfirmation ? '#eab308' : '#6b7280' }} />
                <span style={{ color: settings.skipConfirmation ? '#fde047' : '#9ca3af', fontSize: '12px', fontWeight: '700' }}>⚡ Fast Trade</span>
              </button>
            </Tooltip>
            <Tooltip text={settings.autoExecute ? '🤖 AUTO EXECUTE ON - Bot automatically executes trades when profitable opportunities are found!' : '✋ Auto Execute OFF - You must manually click Trade to execute.'}>
              <button onClick={() => handleToggleClick('autoExecute', !settings.autoExecute)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95" style={{ background: settings.autoExecute ? 'rgba(168, 85, 247, 0.25)' : 'rgba(100,116,139,0.15)', border: `2px solid ${settings.autoExecute ? '#a855f7' : '#475569'}`, boxShadow: settings.autoExecute ? '0 0 12px rgba(168,85,247,0.3)' : 'none' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: settings.autoExecute ? '#a855f7' : '#6b7280' }} />
                <span style={{ color: settings.autoExecute ? '#c4b5fd' : '#9ca3af', fontSize: '12px', fontWeight: '700' }}>🤖 Auto Execute</span>
              </button>
            </Tooltip>
		            {settings.autoExecute && <span className="px-3 py-1.5 rounded-lg text-xs animate-pulse" style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#f87171', border: '2px solid rgba(239, 68, 68, 0.5)', fontSize: '11px', fontWeight: '600' }}>⚠️ AUTO ON</span>}

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(100,116,139,0.3)', margin: '0 4px' }} />

            {/* Settings Sliders inline */}
            {settingsFeedback && <span style={{ fontSize: '10px', color: '#86efac' }}>{settingsFeedback}</span>}
            <Tooltip text="📊 Minimum price difference between DEXs to flag an arbitrage opportunity. Lower = more sensitive, Higher = fewer false positives.">
              <div className="flex items-center gap-2" style={{ cursor: 'help', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(100,116,139,0.2)' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Threshold:</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#a5b4fc', minWidth: '36px' }}>{Number(draftSettings?.priceDifference ?? settings.priceDifference ?? 0.5).toFixed(1)}%</span>
                <input type="range" min="0.1" max="5" step="0.1" value={Number(draftSettings?.priceDifference ?? settings.priceDifference ?? 0.5)}
                  onMouseDown={() => handleSliderStart('priceDifference')} onTouchStart={() => handleSliderStart('priceDifference')}
                  onMouseUp={(e) => handleSliderClick('priceDifference', parseFloat(e.target.value))} onTouchEnd={(e) => handleSliderClick('priceDifference', parseFloat(e.target.value))}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, priceDifference: parseFloat(e.target.value) }))}
								style={sliderStyle(Number(draftSettings?.priceDifference ?? settings.priceDifference ?? 0.5), 0.1, 5)} className="appearance-none rounded cursor-pointer" />
              </div>
            </Tooltip>
            <Tooltip text="⛽ Maximum gas units per transaction. Flash loan swaps typically need 300-500K. Higher = safer but more expensive.">
              <div className="flex items-center gap-2" style={{ cursor: 'help', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(100,116,139,0.2)' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Gas:</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#a5b4fc', minWidth: '32px' }}>{((Number(draftSettings?.gasLimit ?? settings.gasLimit ?? 400000)) / 1000).toFixed(0)}K</span>
                <input type="range" min="100000" max="1000000" step="50000" value={Number(draftSettings?.gasLimit ?? settings.gasLimit ?? 400000)}
                  onMouseDown={() => handleSliderStart('gasLimit')} onTouchStart={() => handleSliderStart('gasLimit')}
                  onMouseUp={(e) => handleSliderClick('gasLimit', parseInt(e.target.value))} onTouchEnd={(e) => handleSliderClick('gasLimit', parseInt(e.target.value))}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, gasLimit: parseInt(e.target.value) }))}
								style={sliderStyle(Number(draftSettings?.gasLimit ?? settings.gasLimit ?? 400000), 100000, 1000000)} className="appearance-none rounded cursor-pointer" />
              </div>
            </Tooltip>
            <Tooltip text="💰 Gas price in Gwei. Higher = faster confirmation but more expensive. Arbitrum typically uses 0.1-1.0 Gwei.">
              <div className="flex items-center gap-2" style={{ cursor: 'help', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(100,116,139,0.2)' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Gwei:</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#a5b4fc', minWidth: '28px' }}>{Number(draftSettings?.gasPrice ?? settings.gasPrice ?? 0.1).toFixed(2)}</span>
                <input type="range" min="0.01" max="2" step="0.01" value={Number(draftSettings?.gasPrice ?? settings.gasPrice ?? 0.1)}
                  onMouseDown={() => handleSliderStart('gasPrice')} onTouchStart={() => handleSliderStart('gasPrice')}
                  onMouseUp={(e) => handleSliderClick('gasPrice', parseFloat(e.target.value))} onTouchEnd={(e) => handleSliderClick('gasPrice', parseFloat(e.target.value))}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, gasPrice: parseFloat(e.target.value) }))}
								style={sliderStyle(Number(draftSettings?.gasPrice ?? settings.gasPrice ?? 0.1), 0.01, 2)} className="appearance-none rounded cursor-pointer" />
              </div>
            </Tooltip>

            {/* Divider */}
            <div style={{ width: '1px', height: '28px', background: 'rgba(100,116,139,0.3)', margin: '0 4px' }} />

            <Tooltip text={deployEstimate ? '🔼 Click to hide deployment details' : '💰 Estimate the cost to deploy the Arbitrage contract on Arbitrum mainnet.'}>
              <button onClick={handleEstimateDeploy} disabled={estimating} className="cta-button flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105" style={{ background: deployEstimate ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)', border: `1px solid ${deployEstimate ? '#34d399' : '#10b981'}` }}>
                <span style={{ fontSize: '14px' }}>{estimating ? '⏳' : '💰'}</span>
								<span style={{ color: '#6ee7b7', fontSize: '12px', fontWeight: '600' }}>{estimating ? 'Estimating...' : deployEstimate ? 'Hide Deployment Details' : 'Estimate Deploy'}</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Deploy Estimate Result */}
        {deployEstimate && (
          <div className="mt-4 p-4 rounded-xl" style={{
            background: deployEstimate.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${deployEstimate.error ? '#ef4444' : '#10b981'}`
          }}>
            {deployEstimate.error ? (
              <div style={{ color: '#f87171', fontSize: '13px' }}>❌ {deployEstimate.error}</div>
            ) : (
	            <div className="grid grid-cols-2 gap-4 text-center" style={{ maxWidth: '520px', margin: '0 auto' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>NETWORK</div>
                  <div style={{ fontSize: '14px', color: '#6ee7b7', fontWeight: '700' }}>{deployEstimate.network}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>GAS UNITS</div>
                  <div style={{ fontSize: '14px', color: '#a5b4fc', fontWeight: '700', fontFamily: 'monospace' }}>{parseInt(deployEstimate.gasUnits).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>COST (ETH)</div>
                  <div style={{ fontSize: '14px', color: '#fcd34d', fontWeight: '700', fontFamily: 'monospace' }}>{deployEstimate.costEth}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>COST (USD)</div>
                  <div style={{ fontSize: '14px', color: '#86efac', fontWeight: '700', fontFamily: 'monospace' }}>${deployEstimate.costUsd}</div>
                </div>
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
              {deployEstimate.note || 'Estimate based on current network conditions'}
            </div>
            {!deployEstimate.error && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>📋 DEPLOYMENT INSTRUCTIONS</div>
                <ol style={{ fontSize: '11px', color: '#64748b', margin: '0 auto', paddingLeft: '16px', lineHeight: '1.8', textAlign: 'left', maxWidth: '600px', display: 'inline-block' }}>
                  <li>Ensure your wallet has at least <span style={{ color: '#fcd34d', fontWeight: '600' }}>{deployEstimate.costEth} ETH</span> on Arbitrum</li>
                  <li>Run: <code style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '2px 6px', borderRadius: '4px', color: '#a5b4fc' }}>npx hardhat ignition deploy ignition/modules/Arbitrage.js --network arbitrum</code></li>
                  <li>Update <code style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '2px 6px', borderRadius: '4px', color: '#a5b4fc' }}>config.json</code> with the new contract address</li>
                  <li>Switch to Mainnet mode and start trading!</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HeroSection
