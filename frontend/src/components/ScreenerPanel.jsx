import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectPair, executeTrade, sendMessage, checkPrices } from '../store/websocket'

import Tooltip from './Tooltip'

function ScreenerPanel() {
  const { screenerPairs, screenerBlock, screenerTimestamp, threshold, selectedPair, analysisResult, analysisByPair, isExecuting, isTestMode, settings } = useSelector(state => state.bot)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingTrade, setPendingTrade] = useState(null)
  const [hideFailedPairs, setHideFailedPairs] = useState(false)
  const [localLoading, setLocalLoading] = useState(null) // 'test' | 'reset' | 'refresh' | 'restart' | null

  // Expanded state for per-pair dropdown details
  const [expandedPairs, setExpandedPairs] = useState({})

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

  // Button handlers with loading states
  const handleManipulate = () => {
    setLocalLoading('test')
    sendMessage('RUN_MANIPULATION')
    setTimeout(() => setLocalLoading(null), 3000)
  }
  const handleClearTest = () => {
    setLocalLoading('reset')
    sendMessage('CLEAR_MANIPULATION')
    setTimeout(() => setLocalLoading(null), 2000)
  }
  const handleRefresh = () => {
    setLocalLoading('refresh')
    checkPrices()
    setTimeout(() => setLocalLoading(null), 1500)
  }
  const handleRestartBot = () => {
    setLocalLoading('restart')
    sendMessage('RESTART_BOT')
    setTimeout(() => setLocalLoading(null), 3000)
  }

  // Filter pairs based on toggle
  const displayedPairs = hideFailedPairs
    ? screenerPairs.filter(p => p.dexCount >= 2)
    : screenerPairs
  const opportunities = displayedPairs.filter(p => p.hasOpportunity)
  const hiddenCount = screenerPairs.length - displayedPairs.length

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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Route:</span>
                <span style={{ color: '#10b981' }}>{pendingTrade.buyDex}</span>
                <span style={{ color: '#64748b' }}>→</span>
                <span style={{ color: '#f59e0b' }}>{pendingTrade.sellDex}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Spread:</span>
                <span style={{ color: parseFloat(pendingTrade.difference) > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  {pendingTrade.difference}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>DEXs Available:</span>
                <span style={{ color: '#a5b4fc' }}>{pendingTrade.dexCount}</span>
              </div>
            </div>
            {!pendingTrade.hasOpportunity && (
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

      {/* Header */}
      <div className="screener-header">
        <div className="screener-title">
          <span className="screener-icon">⚡</span>
          <h2>Multi-DEX Screener</h2>
          {isTestMode ? (
            <span className="test-badge" title="Test mode active - prices are manipulated">
              <span className="test-dot"></span>
              TEST MODE
            </span>
          ) : (
            <span className="live-badge" title="Connected to live forked network">
              <span className="live-dot"></span>
              LIVE
            </span>
          )}
        </div>
        <div className="screener-actions">
          <Tooltip text={hideFailedPairs ? '👁 Show all pairs including those with pool/fee tier errors' : '🚫 Hide pairs that have pool errors or missing liquidity'}>
            <button
              onClick={() => setHideFailedPairs(!hideFailedPairs)}
              className={hideFailedPairs ? 'btn-filter-active' : 'btn-filter'}
              style={{
                background: hideFailedPairs ? 'rgba(168,85,247,0.2)' : 'rgba(100,116,139,0.1)',
                border: `1px solid ${hideFailedPairs ? '#a855f7' : '#374151'}`,
                color: hideFailedPairs ? '#c4b5fd' : '#94a3b8',
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer'
              }}
            >
              {hideFailedPairs ? `👁 Show All (${hiddenCount} hidden)` : '🚫 Hide Failed'}
            </button>
          </Tooltip>
          <span className="block-info">Block #{screenerBlock || '---'}</span>
          <Tooltip text="🧪 Creates artificial price differences between DEXs for testing arbitrage opportunities">
            <button onClick={handleManipulate} disabled={localLoading} className="btn-test" style={{ opacity: localLoading ? 0.5 : 1 }}>
              {localLoading === 'test' ? '⏳' : '🧪'} Test
            </button>
          </Tooltip>
          <Tooltip text="🔄 Resets the Hardhat fork to original state, clearing all test manipulations">
            <button onClick={handleClearTest} disabled={localLoading} className="btn-clear" style={{ opacity: localLoading ? 0.5 : 1 }}>
              {localLoading === 'reset' ? '⏳' : '🔄'} Reset
            </button>
          </Tooltip>
          <Tooltip text="↻ Fetches latest prices from all DEX pools immediately">
            <button onClick={handleRefresh} disabled={localLoading} className="btn-refresh" style={{ opacity: localLoading ? 0.5 : 1 }}>
              {localLoading === 'refresh' ? '⏳' : '↻'} Refresh
            </button>
          </Tooltip>
          <Tooltip text="⟳ Fully restarts the bot and re-initializes all trading pairs">
            <button onClick={handleRestartBot} disabled={localLoading} className="btn-restart" style={{ opacity: localLoading ? 0.5 : 1 }}>
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

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{displayedPairs.length}{hiddenCount > 0 ? ` / ${screenerPairs.length}` : ''}</span>
          <span className="stat-label">Pairs{hiddenCount > 0 ? ' (filtered)' : ''}</span>
        </div>
        <div className="stat stat-highlight">
          <span className="stat-value">{opportunities.length}</span>
          <span className="stat-label">Opportunities</span>
        </div>
        <div className="stat">
          <span className="stat-value">{threshold}%</span>
          <span className="stat-label">Threshold</span>
        </div>
      </div>

      {/* Table */}
      {displayedPairs.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{screenerPairs.length > 0 ? 'All pairs filtered out - click "Show All" above' : 'Loading pairs...'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="screener-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th className="text-right">Best Route</th>
                <th className="text-right">Spread</th>
                <th className="text-center">DEXs</th>
                <th className="text-center">Action</th>
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
                      className={`${selectedPair?.pairName === pair.name ? 'row-selected' : ''} ${pair.hasOpportunity ? 'row-opportunity' : ''}`}
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
                          {pair.hasOpportunity && <span className="opp-indicator"></span>}
                        </div>
                      </td>
                      <td className="price-cell">
                        {pair.buyDex && pair.sellDex ? (
                          <span style={{ fontSize: '12px' }}>
                            <span style={{ color: '#10b981' }}>{pair.buyDex}</span>
                            <span style={{ color: '#64748b' }}> → </span>
                            <span style={{ color: '#f59e0b' }}>{pair.sellDex}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className={`spread-cell ${pair.hasOpportunity ? 'spread-positive' : Math.abs(parseFloat(pair.difference)) >= threshold * 0.5 ? 'spread-warn' : ''}`}>
                        {parseFloat(pair.difference) > 0 ? '+' : ''}{pair.difference}%
                      </td>
                      <td className="text-center">
                        <span style={{ fontSize: '11px', color: '#64748b', background: 'rgba(100,116,139,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {pair.dexCount || 2} DEXs
                        </span>
                      </td>
                      <td className="action-cell">
                        {pair.hasOpportunity ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTrade(pair.name); }}
                            disabled={isExecuting}
                            className="trade-btn"
                          >
                            {isExecuting ? '...' : '💰 Trade'}
                          </button>
                        ) : (
                          <span className="no-action">—</span>
                        )}
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
                                No simulation results yet. Click <span style={{ color: '#a5b4fc', fontWeight: 600 }}>💰 Trade</span> to run analysis (and execute if configured).
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

