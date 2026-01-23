import React from 'react'
import { useSelector } from 'react-redux'
import { selectPair, executeTrade, checkPrices, sendMessage } from '../store/websocket'

function ScreenerPanel() {
  const { screenerPairs, screenerBlock, screenerTimestamp, threshold, selectedPair, analysisResult, isExecuting } = useSelector(state => state.bot)

  const handleTrade = (pairName) => {
    selectPair(pairName)
    setTimeout(() => executeTrade(), 100)
  }

  const handleExecute = () => {
    if (selectedPair && !isExecuting) {
      executeTrade()
    }
  }

  const handleManipulate = () => {
    sendMessage('RUN_MANIPULATION')
  }

  const opportunities = screenerPairs.filter(p => p.hasOpportunity)

  return (
    <div className="screener-card">
      {/* Header */}
      <div className="screener-header">
        <div className="screener-title">
          <span className="screener-icon">⚡</span>
          <h2>Arbitrage Screener</h2>
          <span className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </span>
        </div>
        <div className="screener-actions">
          <span className="block-info">Block #{screenerBlock || '---'}</span>
          <button onClick={handleManipulate} className="btn-test">🧪 Test</button>
          <button onClick={checkPrices} className="btn-refresh">↻ Refresh</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{screenerPairs.length}</span>
          <span className="stat-label">Pairs</span>
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
      {screenerPairs.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading pairs...</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="screener-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th className="text-right">Uniswap</th>
                <th className="text-right">PancakeSwap</th>
                <th className="text-right">Spread</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {screenerPairs.map((pair) => (
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
                  <td className="price-cell">{pair.uniswap}</td>
                  <td className="price-cell">{pair.pancakeswap}</td>
                  <td className={`spread-cell ${pair.hasOpportunity ? 'spread-positive' : Math.abs(parseFloat(pair.difference)) >= threshold * 0.5 ? 'spread-warn' : ''}`}>
                    {parseFloat(pair.difference) > 0 ? '+' : ''}{pair.difference}%
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
               analysisResult.status === 'no_opportunity' ? '⚠️' : '🔴'}
            </span>
            <span className="analysis-title">
              {analysisResult.symbol} - {analysisResult.status === 'profitable' ? 'Profitable!' :
               analysisResult.status === 'not_profitable' ? 'Not Profitable' :
               analysisResult.status === 'no_opportunity' ? 'No Opportunity' : 'Error'}
            </span>
          </div>
          <div className="analysis-message">{analysisResult.message}</div>
          {analysisResult.direction && (
            <div className="analysis-details">
              <div className="detail-row">
                <span>Direction:</span>
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

      {/* Selected Pair Panel */}
      {selectedPair && (
        <div className="selected-panel">
          <div className="selected-info">
            <div className="selected-pair">{selectedPair.symbol || selectedPair.pairName}</div>
            <div className="selected-meta">Fee: {selectedPair.fee / 10000}% • Ready to execute</div>
          </div>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="execute-btn"
          >
            {isExecuting ? (
              <><span className="spinner-sm"></span> Analyzing...</>
            ) : (
              <>🚀 Execute Trade</>
            )}
          </button>
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

