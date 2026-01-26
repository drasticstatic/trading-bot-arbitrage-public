import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ''
  }
}

export default function TradeExecutionCard() {
  const { tradeStatus, tradeSteps } = useSelector(state => state.bot)

  const statusLabel = useMemo(() => {
    const s = tradeStatus?.status
    if (!s) return 'idle'
    return s
  }, [tradeStatus?.status])

  const headerRight = useMemo(() => {
    const tx = tradeStatus?.txHash
    if (!tx) return null
    return `${tx.slice(0, 10)}…${tx.slice(-6)}`
  }, [tradeStatus?.txHash])

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
        <div>
          <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '14px' }}>Trade execution</div>
          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
            Status: <span style={{ color: '#a5b4fc' }}>{statusLabel}</span>
            {headerRight ? <span style={{ color: '#64748b' }}> · TX: {headerRight}</span> : null}
          </div>
        </div>
      </div>

      <div style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '12px',
        lineHeight: 1.6,
        color: '#cbd5e1',
        background: 'rgba(0,0,0,0.18)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: '12px',
        padding: '12px',
        maxHeight: '260px',
        overflow: 'auto'
      }}>
        {tradeSteps?.length ? (
          tradeSteps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px' }}>
              <span style={{ width: '70px', color: '#64748b' }}>{formatTime(s.timestamp)}</span>
              <span style={{ flex: 1 }}>
                {s.label}
                {s.details ? <span style={{ color: '#64748b' }}> · {s.details}</span> : null}
              </span>
            </div>
          ))
        ) : (
          <div style={{ color: '#94a3b8' }}>No execution steps yet.</div>
        )}

        {tradeStatus?.status === 'failed' && tradeStatus?.error ? (
          <div style={{ marginTop: '10px', color: '#f87171' }}>Error: {tradeStatus.error}</div>
        ) : null}
      </div>
    </div>
  )
}

