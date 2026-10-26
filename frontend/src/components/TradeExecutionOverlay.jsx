import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

const fmtTime = (ts) => { try { return new Date(ts).toLocaleTimeString([], { hour12: false }) } catch { return '' } }
const glyph = (s) => (s === 'success' ? '✓' : s === 'error' ? '✗' : '→')
const stepCls = (s) => (s === 'success' ? 'step-ok' : s === 'error' ? 'step-err' : 'step-run')

/** The trade terminal while a trade is in flight: every routing step as it happens, then the result. */
export default function TradeExecutionOverlay() {
  const { tradeStatus, tradeSteps, wallet } = useSelector(state => state.bot)
  const [dismissedTradeId, setDismissedTradeId] = useState(null)

  const tradeId = useMemo(() => {
    const statusId = tradeStatus?.tradeId || tradeStatus?.txHash || tradeStatus?.timestamp || null
    if (statusId) return statusId
    const firstStepTs = tradeSteps?.[0]?.timestamp
    return firstStepTs ? `steps:${firstStepTs}` : null
  }, [tradeStatus?.tradeId, tradeStatus?.txHash, tradeStatus?.timestamp, tradeSteps])

  const isActive = useMemo(() => {
    if (tradeSteps?.length) return true
    const s = tradeStatus?.status
    return s === 'executing' || s === 'pending' || s === 'failed' || s === 'success'
  }, [tradeStatus?.status, tradeSteps?.length])

  useEffect(() => { if (tradeId) setDismissedTradeId(null) }, [tradeId])

  const rpcLabel = useMemo(() => {
    if (!wallet) return '—'
    if (wallet.isTestnet) return 'localhost (Hardhat fork)'
    const chain = wallet?.mainnet?.chainId ? `:${wallet.mainnet.chainId}` : ''
    return `arbitrum${chain} (${wallet?.mainnet?.rpc || 'unknown'})`
  }, [wallet])

  const show = isActive && (!dismissedTradeId || dismissedTradeId !== tradeId)
  if (!show) return null

  const status = tradeStatus?.status
  return (
    <div className="overlay" role="dialog" aria-label="Trade in progress">
      <div className="overlay-card">
        <div className="overlay-h">
          <div>
            <div style={{ fontWeight: 600 }}>
              Trade execution{status ? <span className={`pill ${status === 'success' ? 'pill--good' : status === 'failed' ? 'pill--bad' : 'pill--warn'}`} style={{ marginLeft: 8 }}>{status}</span> : null}
            </div>
            <div className="meta">RPC <span className="mono">{rpcLabel}</span>{tradeStatus?.txHash ? <> · tx <span className="mono">{tradeStatus.txHash.slice(0, 10)}…{tradeStatus.txHash.slice(-6)}</span></> : null}</div>
          </div>
          <button className="btn btn--sm" onClick={() => setDismissedTradeId(tradeId)}>Hide</button>
        </div>
        <div className="overlay-b">
          <div className="log" style={{ maxHeight: '55vh' }}>
            {tradeSteps?.length ? tradeSteps.map((s, i) => (
              <div key={i} className="step">
                <span className="log-t">{fmtTime(s.timestamp)}</span>
                <span className={stepCls(s.status)}>{glyph(s.status)}</span>
                <span>{s.label}{s.details ? <span className="dim"> · {s.details}</span> : null}</span>
              </div>
            )) : <div className="muted">Waiting for trade steps…</div>}
            {status === 'failed' && tradeStatus?.error ? <div className="bad" style={{ marginTop: 8 }}>Error: {tradeStatus.error}</div> : null}
          </div>
          <div className="meta" style={{ marginTop: 8 }}>Shows the execution path and the RPC label only. Nothing here reads or shows secrets.</div>
        </div>
      </div>
    </div>
  )
}
