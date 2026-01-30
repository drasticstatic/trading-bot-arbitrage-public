import React, { useMemo, useRef, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ''
  }
}

function formatProfit(profit) {
  const val = parseFloat(profit || 0)
  if (val > 0) return `+${val.toFixed(6)}`
  if (val < 0) return val.toFixed(6)
  return '0.000000'
}

function downloadJSON(filename, data) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.warn('Export failed:', e)
  }
}

export default function TradeExecutionCard() {
  const { tradeStatus, tradeSteps, trades } = useSelector(state => state.bot)
  const scrollRef = useRef(null)
  const [expandedTrades, setExpandedTrades] = useState({})

  // Auto-scroll to bottom when new steps/trades are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [tradeSteps, trades])

  // Toggle trade expansion
  const toggleExpand = (id) => {
    setExpandedTrades(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Calculate stats
  const stats = useMemo(() => {
    const total = trades?.length || 0
    const successful = trades?.filter(t => t.status === 'success').length || 0
    const failed = total - successful
    const netProfit = trades?.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0) || 0
    return { total, successful, failed, netProfit }
  }, [trades])

  const currentStatus = tradeStatus?.status || 'idle'
  const currentTxHash = tradeStatus?.txHash

  const handleExport = () => {
    downloadJSON(`dappu-trade-terminal-${Date.now()}.json`, {
      exportedAt: new Date().toISOString(),
      trades: trades || [],
      current: {
        tradeStatus: tradeStatus || null,
        tradeSteps: tradeSteps || []
      }
    })
  }

  // Combine historical trades with current steps for continuous scroll
  const allExecutions = useMemo(() => {
    const executions = []
    if (trades?.length) {
      trades.forEach((trade, idx) => {
        executions.push({
          type: 'trade',
          id: `trade-${idx}`,
          trade,
          timestamp: trade.timestamp
        })
      })
    }
    return executions
  }, [trades])

  return (
    <div className="glass" style={{
      padding: '20px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, rgba(18, 20, 26, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Header with title + inline stats row */}
	      <div style={{ marginBottom: '16px' }}>
	        <div className="flex items-center gap-4" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '22px' }}>📟</span>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '16px' }}>Trade Execution Terminal</div>
          {currentTxHash && <span style={{ color: '#64748b', fontSize: '10px' }}>TX: {currentTxHash.slice(0, 10)}…{currentTxHash.slice(-6)}</span>}
          <button
            onClick={handleExport}
            style={{
              marginLeft: 'auto',
              fontSize: '10px',
              color: '#93c5fd',
              background: 'rgba(59,130,246,0.12)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(59,130,246,0.25)',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Export
          </button>
        </div>
        {/* Stats - Single horizontal row, no wrap */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
          <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
            {stats.total} total
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
            ✓ {stats.successful} success
          </div>
          {stats.failed > 0 && (
            <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              ✗ {stats.failed} failed
            </div>
          )}
          <div style={{
            padding: '4px 10px', borderRadius: '6px',
            background: stats.netProfit >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: stats.netProfit >= 0 ? '#10b981' : '#ef4444',
            fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap'
          }}>
            P&L: {formatProfit(stats.netProfit)} WETH
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: '6px',
            background: currentStatus === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            color: currentStatus === 'pending' ? '#fbbf24' : '#10b981',
            fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap'
          }}>
            {currentStatus === 'pending' ? '⏳ Processing' : '✓ Ready'}
          </div>
        </div>
      </div>

      {/* Scrollable terminal area */}
      <div ref={scrollRef} style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '12px',
        lineHeight: 1.6,
        color: '#cbd5e1',
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(148,163,184,0.1)',
        borderRadius: '12px',
        padding: '12px',
        maxHeight: '350px',
        minHeight: '180px',
        overflow: 'auto'
      }}>
        {/* Historical trades - expandable */}
        {allExecutions.map((exec, idx) => {
          const isExpanded = expandedTrades[exec.id]
          const trade = exec.trade
          const isSuccess = trade.status === 'success'
          const profit = parseFloat(trade.profit || 0)
	          const steps = Array.isArray(trade.steps) ? trade.steps : []

          return (
            <div key={exec.id}>
              {idx > 0 && (
                <div style={{ borderTop: '1px dashed rgba(100, 116, 139, 0.25)', margin: '10px 0' }} />
              )}
              {/* Trade row - clickable to expand */}
              <div
                onClick={() => toggleExpand(exec.id)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: isExpanded ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  border: isExpanded ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: isExpanded ? '#a5b4fc' : '#64748b', fontSize: '10px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                  <span style={{ color: isSuccess ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                    {isSuccess ? '✓' : '✗'}
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '13px' }}>{trade.pair || 'Trade'}</span>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>{trade.buyExchange} → {trade.sellExchange}</span>
						  {(trade.mevProtected || trade.mevConfigured) && (
						    <span
						      title={trade.mevProtected ? 'MEV protection: protected (private tx)' : 'MEV protection: configured (not protected in this mode)'}
						      style={{
						        fontSize: '10px',
						        padding: '2px 6px',
						        borderRadius: '999px',
						        background: trade.mevProtected ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
						        border: trade.mevProtected ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(99,102,241,0.25)',
						        color: trade.mevProtected ? '#34d399' : '#a5b4fc',
						        fontWeight: 700,
						        whiteSpace: 'nowrap'
						      }}
						    >
						      🛡 MEV
						    </span>
						  )}
                  <span style={{
                    marginLeft: 'auto',
                    color: profit > 0 ? '#10b981' : profit < 0 ? '#ef4444' : '#64748b',
                    fontWeight: '700', fontSize: '12px'
                  }}>
                    {formatProfit(profit)} {trade.tokenSymbol || 'WETH'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '10px' }}>{formatTime(trade.timestamp)}</span>
                </div>
              </div>
              {/* Expanded details */}
              {isExpanded && (
                <div style={{
                  marginTop: '8px', marginLeft: '24px', padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '11px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: isSuccess ? '#10b981' : '#ef4444' }}>{trade.status}</span></div>
                    <div><span style={{ color: '#64748b' }}>Amount:</span> <span style={{ color: '#e2e8f0' }}>{trade.amount} {trade.tokenSymbol}</span></div>
                    <div><span style={{ color: '#64748b' }}>Buy:</span> <span style={{ color: '#60a5fa' }}>{trade.buyExchange}</span></div>
                    <div><span style={{ color: '#64748b' }}>Sell:</span> <span style={{ color: '#c084fc' }}>{trade.sellExchange}</span></div>
							{(typeof trade.mevProtected === 'boolean' || typeof trade.mevConfigured === 'boolean') && (
							  <div>
							    <span style={{ color: '#64748b' }}>MEV:</span>{' '}
							    <span style={{ color: trade.mevProtected ? '#10b981' : trade.mevConfigured ? '#a5b4fc' : '#94a3b8' }}>
							      {trade.mevProtected ? 'protected' : trade.mevConfigured ? 'configured' : 'off'}
							    </span>
							  </div>
							)}
	                    {trade.gasPaidEth !== undefined && (
	                      <div><span style={{ color: '#64748b' }}>Gas Paid:</span> <span style={{ color: '#e2e8f0' }}>{Number(trade.gasPaidEth).toFixed(6)} ETH</span></div>
	                    )}
                    {trade.gasUsed && <div><span style={{ color: '#64748b' }}>Gas:</span> <span style={{ color: '#e2e8f0' }}>{trade.gasUsed}</span></div>}
                    {trade.spread && <div><span style={{ color: '#64748b' }}>Spread:</span> <span style={{ color: '#e2e8f0' }}>{trade.spread}%</span></div>}
                  </div>

	                  {steps.length > 0 && (
	                    <div style={{
	                      marginTop: '10px',
	                      paddingTop: '10px',
	                      borderTop: '1px solid rgba(100,116,139,0.2)'
	                    }}>
	                      <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, letterSpacing: '0.8px', marginBottom: '6px' }}>TERMINAL LOG</div>
	                      {steps.slice(0, 120).map((s, i) => (
	                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '3px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '10px' }}>
	                          <span style={{ width: '70px', color: '#64748b', flexShrink: 0 }}>{formatTime(s.timestamp)}</span>
	                          <span style={{ color: s.status === 'success' ? '#10b981' : s.status === 'error' ? '#ef4444' : '#cbd5e1' }}>
	                            {s.status === 'success' ? '✓' : s.status === 'error' ? '✗' : '→'} {s.label}
	                            {s.details && <span style={{ color: '#64748b' }}> · {s.details}</span>}
	                          </span>
	                        </div>
	                      ))}
	                    </div>
	                  )}
                  {trade.txHash && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(100,116,139,0.2)' }}>
                      <span style={{ color: '#64748b' }}>TX: </span>
                      <a href={`https://arbiscan.io/tx/${trade.txHash}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#a5b4fc', textDecoration: 'underline' }}>
                        {trade.txHash.slice(0, 20)}...{trade.txHash.slice(-10)}
                      </a>
                    </div>
                  )}
                  {trade.error && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', color: '#f87171' }}>
                      ❌ {trade.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Current execution steps */}
        {tradeSteps?.length > 0 && (
          <>
            {allExecutions.length > 0 && (
              <div style={{
                borderTop: '1px solid rgba(99, 102, 241, 0.3)',
                margin: '12px 0',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '0 8px',
                  fontSize: '9px',
                  color: '#a5b4fc'
                }}>CURRENT</span>
              </div>
            )}
            {tradeSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                <span style={{ width: '70px', color: '#64748b', flexShrink: 0 }}>{formatTime(s.timestamp)}</span>
                <span style={{
                  color: s.status === 'success' ? '#10b981' : s.status === 'error' ? '#ef4444' : '#cbd5e1'
                }}>
                  {s.status === 'success' ? '✓' : s.status === 'error' ? '✗' : '→'} {s.label}
                  {s.details && <span style={{ color: '#64748b' }}> · {s.details}</span>}
                </span>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {!allExecutions.length && !tradeSteps?.length && (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
            <div>No trades executed yet.</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Click "Trade" on a pair above to start.</div>
          </div>
        )}

        {/* Error display */}
        {tradeStatus?.status === 'failed' && tradeStatus?.error && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '11px'
          }}>
            ❌ Error: {tradeStatus.error}
          </div>
        )}
      </div>
    </div>
  )
}
