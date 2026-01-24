import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectPair, executeTrade, sendMessage, checkPrices } from '../store/websocket'

import Tooltip from './Tooltip'

function ScreenerPanel() {
  const { screenerPairs, screenerBlock, screenerTimestamp, threshold, selectedPair, analysisResult, isExecuting, isTestMode, settings } = useSelector(state => state.bot)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingTrade, setPendingTrade] = useState(null)
  const [hideFailedPairs, setHideFailedPairs] = useState(false)
  const [localLoading, setLocalLoading] = useState(null) // 'test' | 'reset' | 'refresh' | 'restart' | null

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
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
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
              {displayedPairs.map((pair) => (
                <tr
                  key={pair.name}
                  className={`${selectedPair?.pairName === pair.name ? 'row-selected' : ''} ${pair.hasOpportunity ? 'row-opportunity' : ''}`}
                  onClick={() => selectPair(pair.name)}
                >
                  <td>
                    <div className="pair-cell">
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Analysis Result Feedback */}
      {analysisResult && (
        <div className={`analysis-result ${analysisResult.status}`}>
          <div className="analysis-header">
            <span className="analysis-icon">
              {analysisResult.status === 'profitable' ? '✅' :
               analysisResult.status === 'not_profitable' ? '❌' :
               analysisResult.status === 'simulation_failed' ? '🔬' :
               analysisResult.status === 'no_opportunity' ? '⚠️' : '🔴'}
            </span>
            <span className="analysis-title">
              {analysisResult.symbol} - {analysisResult.status === 'profitable' ? 'Profitable!' :
               analysisResult.status === 'not_profitable' ? 'Not Profitable' :
               analysisResult.status === 'simulation_failed' ? 'Pre-flight Failed' :
               analysisResult.status === 'no_opportunity' ? 'No Opportunity' : 'Error'}
            </span>
            {analysisResult.simulationPassed !== undefined && (
              <span style={{
                marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                background: analysisResult.simulationPassed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                color: analysisResult.simulationPassed ? '#10b981' : '#ef4444'
              }}>
                {analysisResult.simulationPassed ? '✓ Sim Passed' : '✗ Sim Failed'}
              </span>
            )}
          </div>
          <div className="analysis-message">{analysisResult.message}</div>
          {analysisResult.direction && (
            <div className="analysis-details">
              <div className="detail-row">
                <span>Route:</span>
                <span>{analysisResult.direction}</span>
              </div>
              <div className="detail-row">
                <span>Spread:</span>
                <span>{analysisResult.spread?.toFixed(2)}%</span>
              </div>
              {analysisResult.amount && analysisResult.amount !== '0' && (
                <div className="detail-row">
                  <span>Amount:</span>
                  <span>{parseFloat(analysisResult.amount).toFixed(6)}</span>
                </div>
              )}
              {analysisResult.profitData && (
                <>
                  <div className="detail-row">
                    <span>Est. Gas:</span>
                    <span>{analysisResult.profitData.estimatedGasCost} ETH</span>
                  </div>
                  <div className="detail-row">
                    <span>Net Result:</span>
                    <span className={analysisResult.isProfitable ? 'text-green' : 'text-red'}>
                      {analysisResult.profitData.totalGainLoss} {analysisResult.profitData.tokenSymbol}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="screener-footer">
        {screenerTimestamp && `Updated ${new Date(screenerTimestamp).toLocaleTimeString()}`}
      </div>
    </div>
  )
}

export default ScreenerPanel

