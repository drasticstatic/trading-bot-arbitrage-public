import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { analyzePair, selectPair, executeTrade, sendMessage, checkPrices } from '../store/websocket'
import { clearTrades } from '../store/botSlice'

import Tooltip from './Tooltip'

function ScreenerPanel() {
  const dispatch = useDispatch()
	const { screenerPairs, screenerBlock, screenerTimestamp, threshold, selectedPair, analysisResult, analysisByPair, isExecuting, isTestMode, settings, fork } = useSelector(state => state.bot)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingTrade, setPendingTrade] = useState(null)
  const [hideFailedPairs, setHideFailedPairs] = useState(false)
  const [localLoading, setLocalLoading] = useState(null) // 'test' | 'reset' | 'refresh' | 'restart' | null

  // Expanded state for per-pair dropdown details
  const [expandedPairs, setExpandedPairs] = useState({})

  // Show all pairs or collapse to show only 10
  const [showAllPairs, setShowAllPairs] = useState(false)
  const COLLAPSED_PAIR_LIMIT = 10

  // Auto-expand the pair that just produced an analysis result
  useEffect(() => {
    const pairName = analysisResult?.pairName
    if (!pairName) return
    setExpandedPairs(prev => ({ ...prev, [pairName]: true }))
  }, [analysisResult])

  // Trade button - show confirmation modal first
  const handleTrade = (pairName) => {
    const pair = screenerPairs.find(p => p.name === pairName)

    // Fast Trade: bypass confirm modal
    if (settings?.skipConfirmation) {
      selectPair(pairName)
      setTimeout(() => executeTrade(), 100)
      return
    }

    setPendingTrade(pair)
    setShowConfirmModal(true)
  }

  const handleAnalyze = (pairName) => {
    selectPair(pairName)
    setExpandedPairs(prev => ({ ...prev, [pairName]: true }))
    analyzePair(pairName)
  }

  // Confirm and execute trade
  const confirmTrade = () => {
    if (pendingTrade) {
      selectPair(pendingTrade.name)
      setTimeout(() => executeTrade(), 100)
    }
    setShowConfirmModal(false)
    setPendingTrade(null)
  }

  // Cancel trade
  const cancelTrade = () => {
    setShowConfirmModal(false)
    setPendingTrade(null)
  }

  // Button handlers with loading states + page refresh after completion
  const handleManipulate = () => {
    setLocalLoading('test')
    sendMessage('RUN_MANIPULATION')
    setTimeout(() => {
      setLocalLoading(null)
      // Refresh page to ensure UI is in sync
      window.location.reload()
    }, 3000)
  }
  const handleClearTest = () => {
    setLocalLoading('reset')
    sendMessage('CLEAR_MANIPULATION')
    setTimeout(() => {
      setLocalLoading(null)
      // Refresh page after reset to ensure clean state
      window.location.reload()
    }, 2500)
  }
  const handleRefresh = () => {
    setLocalLoading('refresh')
    checkPrices()
    setTimeout(() => setLocalLoading(null), 1500)
  }
  const handleRestartBot = () => {
    setLocalLoading('restart')
    // Clear trade history on restart (also clears localStorage)
    dispatch(clearTrades())
    sendMessage('RESTART_BOT')
    setTimeout(() => {
      setLocalLoading(null)
      // Refresh page after restart to ensure UI is in sync with new state
      window.location.reload()
    }, 3500)
  }

	const visiblePairs = screenerPairs.filter(p => p.dexCount >= 2)
	const hiddenErrorCount = Math.max(0, screenerPairs.length - visiblePairs.length)

	// Filter pairs based on toggle
	const filteredPairs = hideFailedPairs ? visiblePairs : screenerPairs
  // Apply show all/collapse limit
  const displayedPairs = showAllPairs ? filteredPairs : filteredPairs.slice(0, COLLAPSED_PAIR_LIMIT)
  const hasMorePairs = filteredPairs.length > COLLAPSED_PAIR_LIMIT
	const opportunities = visiblePairs.filter(p => (p.hasExecutableOpportunity ?? p.hasOpportunity))
	const shownCount = displayedPairs.length
	const visibleCount = visiblePairs.length
	const totalCount = screenerPairs.length

  return (
    <div className="screener-card" style={{ position: 'relative' }}>
      {/* Confirmation Modal */}
      {showConfirmModal && pendingTrade && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid #6366f1', borderRadius: '16px',
            padding: '24px', maxWidth: '420px', width: '90%'
          }}>
            <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '16px', textAlign: 'center' }}>
              ⚡ Confirm Trade Execution
            </h3>
            <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Pair:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>{pendingTrade.symbol}</span>
              </div>
				  {(() => {
					const routeBuyDex = pendingTrade.execBuyDex || pendingTrade.buyDex
					const routeSellDex = pendingTrade.execSellDex || pendingTrade.sellDex
					return (
					  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
						<span style={{ color: '#94a3b8' }}>Route:</span>
						<span style={{ color: '#10b981' }}>{routeBuyDex || '—'}</span>
						<span style={{ color: '#64748b' }}>→</span>
						<span style={{ color: '#f59e0b' }}>{routeSellDex || '—'}</span>
					  </div>
					)
				  })()}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Spread:</span>
					{(() => {
						const displayedSpread = pendingTrade.execDifference ?? pendingTrade.difference
						const spreadNum = parseFloat(displayedSpread)
						return (
						  <span style={{ color: spreadNum > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
							{displayedSpread}%
						  </span>
						)
					})()}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>DEXs Available:</span>
                <span style={{ color: '#a5b4fc' }}>{pendingTrade.dexCount}</span>
              </div>
            </div>
				{!(pendingTrade.hasExecutableOpportunity ?? pendingTrade.hasOpportunity) && (
              <div style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
                borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center'
              }}>
                <span style={{ color: '#f87171', fontSize: '14px' }}>
                  ⚠️ Warning: Spread is below threshold - trade may not be profitable
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={cancelTrade} style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #374151',
                background: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>
                ✕ Cancel
              </button>
              <button onClick={confirmTrade} style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>
                ✓ Execute Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Consolidated single row */}
	      <div className="screener-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 16px', marginBottom: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
        {/* Left: Title + Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#f1f5f9' }}>Multi-DEX Screener</h2>
          {isTestMode ? (
            <span className="test-badge" title="Test mode active - prices are manipulated" style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(234,179,8,0.2)', color: '#fde047', border: '1px solid rgba(234,179,8,0.4)' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#eab308', marginRight: '4px', animation: 'pulse 1.5s infinite' }}></span>
              TEST
            </span>
          ) : (
            <span className="live-badge" title="Connected to live forked network" style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginRight: '4px' }}></span>
              LIVE
            </span>
          )}
        </div>

        {/* Center: Inline Stats */}
	        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
	          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
	            <span style={{ fontSize: '16px', fontWeight: '700', color: '#a5b4fc' }}>{visibleCount}</span>
	            <span style={{ fontSize: '10px', color: '#64748b' }}>visible</span>
	            <span style={{ fontSize: '10px', color: '#475569' }}>•</span>
	            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{totalCount}</span>
	            <span style={{ fontSize: '10px', color: '#64748b' }}>total</span>
	            {hiddenErrorCount > 0 && (
	              <>
	                <span style={{ fontSize: '10px', color: '#475569' }}>•</span>
	                <span title="Hidden due to pool/fee tier errors (missing liquidity / quoting errors)" style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>{hiddenErrorCount}</span>
	                <span style={{ fontSize: '10px', color: '#64748b' }}>hidden</span>
	              </>
	            )}
	            {(showAllPairs ? false : visibleCount > COLLAPSED_PAIR_LIMIT) && (
	              <>
	                <span style={{ fontSize: '10px', color: '#475569' }}>•</span>
	                <span style={{ fontSize: '12px', fontWeight: '700', color: '#c4b5fd' }}>{shownCount}</span>
	                <span style={{ fontSize: '10px', color: '#64748b' }}>shown</span>
	              </>
	            )}
	          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>{opportunities.length}</span>
	          <span style={{ fontSize: '10px', color: '#64748b' }}>opportunities</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#fbbf24' }}>{threshold}%</span>
	          <span style={{ fontSize: '10px', color: '#64748b' }}>threshold</span>
          </div>
	          <span style={{ fontSize: '10px', color: '#64748b', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(100,116,139,0.2)' }}>
	            <span style={{
	              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 55%, #f472b6 100%)',
	              WebkitBackgroundClip: 'text',
	              WebkitTextFillColor: 'transparent',
	              fontWeight: 800
	            }}>
	              Block #{screenerBlock || '---'}
	            </span>
		            <span style={{ color: '#475569', margin: '0 6px' }}>•</span>
		            <Tooltip
		              text={
		                (fork?.autoMineEnabled === true)
		                  ? 'Hardhat evm_mine: enabled (advances local block/timestamp). Note: this does NOT pull new mainnet swaps into an existing fork snapshot.'
		                  : (fork?.autoMineEnabled === false)
		                    ? 'Hardhat evm_mine: disabled.'
		                    : 'Hardhat evm_mine: unknown (fork diagnostics not yet available).'
		              }
		            >
		              <span
		                style={{
		                  color: (fork?.autoMineEnabled === true) ? '#10b981' : (fork?.autoMineEnabled === false) ? '#94a3b8' : '#64748b',
		                  fontWeight: 700
		                }}
		              >
		                ⛏ {(fork?.autoMineEnabled === true) ? 'ON' : (fork?.autoMineEnabled === false) ? 'OFF' : '—'}
		              </span>
		            </Tooltip>
		            {fork?.minedThisTick && (
		              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '999px', background: '#10b981', marginLeft: '6px', animation: 'pulse 1.2s infinite' }} />
		            )}
		            <span style={{ color: '#475569', margin: '0 6px' }}>•</span>
		            <Tooltip
		              text={
		                (typeof fork?.behindBlocks === 'number')
		                  ? `Fork freshness: ~${fork.behindBlocks.toLocaleString()} blocks behind Arbitrum mainnet. If this grows, restart/refork to refresh snapshot.`
		                  : 'Fork freshness: mainnet block comparison unavailable (RPC may be rate-limited/unavailable).'
		              }
		            >
		              <span
		                style={{
		                  color: (typeof fork?.behindBlocks === 'number')
		                    ? (fork?.needsRefork ? '#ef4444' : '#f59e0b')
		                    : '#64748b',
		                  fontWeight: 800
		                }}
		              >
		                {(typeof fork?.behindBlocks === 'number') ? `${fork.behindBlocks.toLocaleString()} behind` : '— behind'}
		              </span>
		            </Tooltip>
		            {fork?.needsRefork && (
		              <>
		                <span style={{ color: '#475569', margin: '0 6px' }}>•</span>
		                <Tooltip text={`Fork is behind mainnet by ≥ ${fork.reforkLagBlocks} blocks. Restart bot to refork (refresh snapshot).`}>
		                  <span
		                    style={{
		                      color: '#fecaca',
		                      background: 'rgba(239,68,68,0.18)',
		                      border: '1px solid rgba(239,68,68,0.35)',
		                      padding: '1px 8px',
		                      borderRadius: '999px',
		                      fontWeight: 800
		                    }}
		                  >
		                    REFORK
		                  </span>
		                </Tooltip>
		              </>
		            )}
	          </span>
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tooltip text={hideFailedPairs ? '👁 Show all pairs including those with pool/fee tier errors' : '🚫 Hide pairs that have pool errors or missing liquidity'}>
            <button
              onClick={() => setHideFailedPairs(!hideFailedPairs)}
              className="transition-all hover:scale-105"
              style={{
                background: hideFailedPairs ? 'rgba(168,85,247,0.2)' : 'rgba(100,116,139,0.15)',
                border: `1px solid ${hideFailedPairs ? '#a855f7' : '#475569'}`,
                color: hideFailedPairs ? '#c4b5fd' : '#94a3b8',
                padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600'
              }}
            >
              {hideFailedPairs ? `👁 Show All` : '🚫 Hide Failed'}
            </button>
          </Tooltip>
          <Tooltip text="🧪 Creates artificial price differences between DEXs for testing arbitrage opportunities">
            <button onClick={handleManipulate} disabled={localLoading} className="transition-all hover:scale-105" style={{ opacity: localLoading ? 0.5 : 1, background: 'rgba(234,179,8,0.15)', border: '1px solid #eab308', color: '#fde047', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
              {localLoading === 'test' ? '⏳' : '🧪'} Test
            </button>
          </Tooltip>
          <Tooltip text="🔄 Resets the Hardhat fork to original state, clearing all test manipulations">
            <button onClick={handleClearTest} disabled={localLoading} className="transition-all hover:scale-105" style={{ opacity: localLoading ? 0.5 : 1, background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
              {localLoading === 'reset' ? '⏳' : '🔄'} Reset
            </button>
          </Tooltip>
          <Tooltip text="↻ Fetches latest prices from all DEX pools immediately">
            <button onClick={handleRefresh} disabled={localLoading} className="transition-all hover:scale-105" style={{ opacity: localLoading ? 0.5 : 1, background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6', color: '#93c5fd', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
              {localLoading === 'refresh' ? '⏳' : '↻'} Refresh
            </button>
          </Tooltip>
		        <Tooltip text="⟳ Hard refresh + resets/reforks the local environment snapshot (Hardhat fork) + re-initializes pairs (and re-deploys if needed).">
            <button onClick={handleRestartBot} disabled={localLoading} className="transition-all hover:scale-105" style={{ opacity: localLoading ? 0.5 : 1, background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', color: '#c4b5fd', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
              {localLoading === 'restart' ? '⏳' : '⟳'} Restart
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Loading Overlay */}
      {localLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px', width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
              {localLoading === 'test' && 'Running manipulation...'}
              {localLoading === 'reset' && 'Resetting fork...'}
              {localLoading === 'refresh' && 'Fetching prices...'}
              {localLoading === 'restart' && 'Restarting bot...'}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {displayedPairs.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{screenerPairs.length > 0 ? 'All pairs filtered out - click "Show All" above' : 'Loading pairs...'}</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="screener-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
              <tr>
                <th style={{ background: '#0f172a' }}>Pair</th>
                <th className="text-right" style={{ background: '#0f172a' }}>Best Route</th>
                <th className="text-right" style={{ background: '#0f172a' }}>Spread</th>
                <th className="text-center" style={{ background: '#0f172a' }}>DEXs</th>
                <th className="text-center" style={{ background: '#0f172a' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedPairs.map((pair) => {
                const isExpanded = !!expandedPairs[pair.name]
                const analysis = analysisByPair?.[pair.name]

                const statusIcon = analysis?.status === 'profitable' ? '✅'
                  : analysis?.status === 'not_profitable' ? '❌'
                    : analysis?.status === 'simulation_failed' ? '🧪'
                      : analysis?.status === 'no_opportunity' ? '⚠️'
                        : analysis?.status === 'error' ? '🔴'
                          : '🧾'

                return (
                  <React.Fragment key={pair.name}>
                    <tr
								  className={`${selectedPair?.pairName === pair.name ? 'row-selected' : ''} ${(pair.hasExecutableOpportunity ?? pair.hasOpportunity) ? 'row-opportunity' : ''}`}
                      onClick={() => {
                        selectPair(pair.name)
                        setExpandedPairs(prev => ({ ...prev, [pair.name]: !prev[pair.name] }))
                      }}
                    >
                      <td>
                        <div className="pair-cell">
                          <span style={{ color: '#64748b', fontSize: '12px', marginRight: '8px' }}>
                            {isExpanded ? '▾' : '▸'}
                          </span>
                          <span className="pair-name">{pair.symbol}</span>
										  {(pair.hasExecutableOpportunity ?? pair.hasOpportunity) && <span className="opp-indicator"></span>}
                        </div>
                      </td>
                      <td className="price-cell">
									{(() => {
										const displayBuyDex = pair.execBuyDex || pair.buyDex
										const displaySellDex = pair.execSellDex || pair.sellDex
										const scanBuyDex = pair.buyDex
										const scanSellDex = pair.sellDex
										const hasRouteMismatch = !!(pair.execBuyDex && pair.execSellDex && scanBuyDex && scanSellDex && (pair.execBuyDex !== scanBuyDex || pair.execSellDex !== scanSellDex))
										const isExecutableRoute = !!(pair.execBuyDex && pair.execSellDex)
										return displayBuyDex && displaySellDex ? (
										  <span style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
											<span>
											  <span style={{ color: '#10b981' }}>{displayBuyDex}</span>
											  <span style={{ color: '#64748b' }}> → </span>
											  <span style={{ color: '#f59e0b' }}>{displaySellDex}</span>
											</span>
											{isExecutableRoute && (
											  <Tooltip text="✓ Executable route: this is the route the bot can trade right now.">
												<span
													style={{
														fontSize: '10px',
														padding: '2px 8px',
														borderRadius: '999px',
														background: 'rgba(16,185,129,0.12)',
														border: '1px solid rgba(16,185,129,0.25)',
														color: '#34d399',
														fontWeight: 800,
														whiteSpace: 'nowrap'
													}}
												>
													✓ executable
												</span>
											  </Tooltip>
											)}
											{hasRouteMismatch && (
											  <Tooltip text={`Scan-only best: ${scanBuyDex} → ${scanSellDex}. Executable: ${pair.execBuyDex} → ${pair.execSellDex}. Scan-only DEXs may include Camelot/Balancer/Curve.`}>
												<span
													style={{
														fontSize: '10px',
														padding: '2px 8px',
														borderRadius: '999px',
														background: 'rgba(168,85,247,0.15)',
														border: '1px solid rgba(168,85,247,0.25)',
														color: '#c4b5fd',
														fontWeight: 800,
														whiteSpace: 'nowrap'
													}}
												>
													scan-only best
												</span>
											  </Tooltip>
											)}
										  </span>
										) : '—'
									})()}
                      </td>
								  {(() => {
									const displayedSpread = pair.execDifference ?? pair.difference
									const spreadNum = parseFloat(displayedSpread)
									const hasOpp = (pair.hasExecutableOpportunity ?? pair.hasOpportunity)
									const warn = Math.abs(spreadNum) >= threshold * 0.5
									return (
									  <td className={`spread-cell ${hasOpp ? 'spread-positive' : warn ? 'spread-warn' : ''}`}>
										{spreadNum > 0 ? '+' : ''}{displayedSpread}%
									  </td>
									)
								})()}
                      <td className="text-center">
                        <span style={{ fontSize: '11px', color: '#64748b', background: 'rgba(100,116,139,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {pair.dexCount || 2} DEXs
                        </span>
                      </td>
                      <td className="action-cell">
							<div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
							  <button
							    onClick={(e) => { e.stopPropagation(); handleAnalyze(pair.name) }}
							    disabled={isExecuting}
							    className="btn-primary"
							    style={{ padding: '8px 12px', fontSize: '12px' }}
							  >
							    {isExecuting ? '...' : '🔍 Analyze'}
							  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleTrade(pair.name); }}
                    disabled={isExecuting}
													className={(pair.hasExecutableOpportunity ?? pair.hasOpportunity) ? 'trade-btn' : 'trade-btn-secondary'}
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    {isExecuting ? '...' : '💰 Trade'}
                  </button>
							</div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{
                            padding: '14px 16px',
                            background: 'rgba(2, 6, 23, 0.35)',
                            borderTop: '1px solid rgba(99, 102, 241, 0.12)'
                          }}>
                            {analysis ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span>{statusIcon}</span>
                                    <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 700 }}>
                                      {analysis.symbol} — {analysis.status?.replaceAll('_', ' ')}
                                    </span>
                                    {analysis.simulationPassed !== undefined && (
                                      <span style={{
                                        fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                                        background: analysis.simulationPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: analysis.simulationPassed ? '#10b981' : '#ef4444',
                                        border: `1px solid ${analysis.simulationPassed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
                                      }}>
                                        {analysis.simulationPassed ? '✓ Sim Passed' : '✗ Sim Failed'}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ color: '#64748b', fontSize: '11px' }}>
                                    {analysis.timestamp ? `Updated ${new Date(analysis.timestamp).toLocaleTimeString()}` : ''}
                                  </div>
                                </div>

                                <div style={{ marginTop: '10px', color: '#94a3b8', fontSize: '12px' }}>
                                  {analysis.message}
                                </div>


                                {(analysis.direction || (analysis.buyExchange && analysis.sellExchange) || analysis.profitData) && (
                                  <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {(analysis.direction || (analysis.buyExchange && analysis.sellExchange)) && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>Route</span>
                                        <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>
                                          {analysis.direction || `${analysis.buyExchange} → ${analysis.sellExchange}`}
                                        </span>
                                      </div>
                                    )}
                                    {analysis.spread !== undefined && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>Spread</span>
                                        <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{Number(analysis.spread).toFixed(2)}%</span>
                                      </div>
                                    )}
                                    {analysis.amount && analysis.amount !== '0' && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>Amount</span>
                                        <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{Number(analysis.amount).toFixed(6)}</span>
                                      </div>
                                    )}
                                    {analysis.profitData?.estimatedGasCost && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>Est. Gas</span>
                                        <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{analysis.profitData.estimatedGasCost} ETH</span>
                                      </div>
                                    )}
                                    {analysis.profitData?.totalGainLoss && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>Net Result</span>
                                        <span style={{
                                          fontSize: '12px', fontWeight: 700,
                                          color: analysis.isProfitable ? '#10b981' : '#ef4444'
                                        }}>
                                          {analysis.profitData.totalGainLoss} {analysis.profitData.tokenSymbol}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
									  <div style={{ color: '#64748b', fontSize: '12px' }}>
										No simulation results yet. Click <span style={{ color: '#a5b4fc', fontWeight: 600 }}>🔍 Analyze</span> to run analysis, or click <span style={{ color: '#a5b4fc', fontWeight: 600 }}>💰 Trade</span> to skip analysis and execute directly.
									  </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          {/* Show All / Collapse Button */}
          {hasMorePairs && (
            <div style={{ textAlign: 'center', padding: '12px', borderTop: '1px solid rgba(100,116,139,0.15)' }}>
              <button
                onClick={() => setShowAllPairs(!showAllPairs)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {showAllPairs
                  ? `▲ Collapse (showing ${filteredPairs.length} pairs)`
                  : `▼ Show All (${filteredPairs.length - COLLAPSED_PAIR_LIMIT} more pairs)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="screener-footer">
        <span>
          {screenerTimestamp ? `Updated ${new Date(screenerTimestamp).toLocaleTimeString()}` : ''}
        </span>
        <span style={{ color: '#64748b' }}>
          {screenerPairs?.length ? ` · Broadcasting ${screenerPairs.length} pairs` : ''}
        </span>
      </div>
    </div>
  )
}

export default ScreenerPanel

