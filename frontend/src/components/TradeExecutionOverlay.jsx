import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ''
  }
}

function statusGlyph(status) {
  if (status === 'success') return '✓'
  if (status === 'error') return '✗'
  return '…'
}

function statusColor(status) {
  if (status === 'success') return '#10b981'
  if (status === 'error') return '#ef4444'
  return '#a5b4fc'
}

export default function TradeExecutionOverlay() {
  const { tradeStatus, tradeSteps, wallet } = useSelector(state => state.bot)
  const [dismissedTradeId, setDismissedTradeId] = useState(null)

  const tradeId = useMemo(() => {
    const statusId = tradeStatus?.tradeId || tradeStatus?.txHash || tradeStatus?.timestamp || null
    if (statusId) return statusId

    // Fallback: if steps are streaming but TRADE_STATUS didn't arrive for some reason,
    // use the first step timestamp as an ID so the overlay still shows and can be dismissed.
    const firstStepTs = tradeSteps?.[0]?.timestamp
    return firstStepTs ? `steps:${firstStepTs}` : null
  }, [tradeStatus?.tradeId, tradeStatus?.txHash, tradeStatus?.timestamp, tradeSteps])

  const isActive = useMemo(() => {
    if (tradeSteps?.length) return true
    const s = tradeStatus?.status
    return s === 'executing' || s === 'pending' || s === 'failed' || s === 'success'
  }, [tradeStatus?.status, tradeSteps?.length])

  useEffect(() => {
    // New trade: allow overlay to show again.
    if (tradeId) setDismissedTradeId(null)
  }, [tradeId])

  const rpcLabel = useMemo(() => {
    if (!wallet) return '—'
    if (wallet.isTestnet) return 'localhost (Hardhat fork)'
    const chain = wallet?.mainnet?.chainId ? `:${wallet.mainnet.chainId}` : ''
    return `arbitrum${chain} (${wallet?.mainnet?.rpc || 'unknown'})`
  }, [wallet])

  const show = isActive && (!dismissedTradeId || dismissedTradeId !== tradeId)

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(2, 6, 23, 0.72)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: 'min(820px, 96vw)',
        borderRadius: '16px',
        border: '1px solid rgba(99,102,241,0.35)',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.92) 100%)',
        boxShadow: '0 16px 60px rgba(0,0,0,0.55)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(99,102,241,0.18)'
        }}>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '14px' }}>
              Trade execution (terminal)
            </div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
              RPC: <span style={{ color: '#a5b4fc' }}>{rpcLabel}</span>
              {tradeStatus?.txHash ? (
                <span style={{ color: '#64748b' }}> · TX: {tradeStatus.txHash.slice(0, 10)}…{tradeStatus.txHash.slice(-6)}</span>
              ) : null}
            </div>
          </div>

          <button
            onClick={() => setDismissedTradeId(tradeId)}
            style={{
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(148,163,184,0.08)',
              color: '#e2e8f0',
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Hide
          </button>
        </div>

        <div style={{ padding: '14px 16px' }}>
          <div style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '12px',
            lineHeight: 1.6,
            color: '#cbd5e1',
            background: 'rgba(0,0,0,0.28)',
            border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: '12px',
            padding: '12px',
            maxHeight: '55vh',
            overflow: 'auto'
          }}>
            {tradeSteps?.length ? (
              tradeSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ width: '70px', color: '#64748b' }}>{formatTime(s.timestamp)}</span>
                  <span style={{ width: '14px', color: statusColor(s.status) }}>{statusGlyph(s.status)}</span>
                  <span style={{ flex: 1 }}>
                    {s.label}
                    {s.details ? <span style={{ color: '#64748b' }}> · {s.details}</span> : null}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8' }}>
                Waiting for trade steps…
              </div>
            )}

            {tradeStatus?.status === 'failed' && tradeStatus?.error ? (
              <div style={{ marginTop: '10px', color: '#f87171' }}>
                Error: {tradeStatus.error}
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11px' }}>
            Note: this displays the execution path and RPC label only. It never shows secrets from your <code>.env</code>.
          </div>
        </div>
      </div>
    </div>
  )
}

