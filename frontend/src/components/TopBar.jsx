import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isStaticHost } from '../store/websocket'

const fmtSigned = (v, d = 3) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}%`
}
const fmtHours = (h) => (!Number.isFinite(h) ? '—' : h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${h.toFixed(h < 10 ? 1 : 0)} h` : `${(h / 24).toFixed(1)} days`)

/**
 * TopBar — the vitals that must be visible whatever view is open: what mode the bot is in, which
 * chain and block it is reading, whether this page is connected, the best route after pool fees
 * right now, and where the study week stands.
 */
export default function TopBar() {
  const { connected, tradingMode, network, isTestMode, isRunning, isExecuting, screenerPairs, screenerBlock, edge, threshold, settings, edgeSnapshotAt } = useSelector(s => s.bot)
  const th = Number(settings?.priceDifference ?? threshold ?? 0.3)
  const demo = isStaticHost()

  const best = useMemo(() => {
    let b = null
    for (const p of screenerPairs || []) {
      if ((p.dexCount || 0) < 2) continue
      const v = Number(p.execNetDifference ?? p.netDifference ?? p.execDifference ?? p.difference)
      if (!Number.isFinite(v)) continue
      if (!b || v > b.v) b = { v, symbol: p.symbol, buy: p.execBuyDex || p.buyDex, sell: p.execSellDex || p.sellDex, net: p.execNetDifference !== undefined || p.netDifference !== undefined }
    }
    if (!b && edge?.best) {
      const e = edge.best
      b = { v: Number(e.netSpreadPct ?? e.spreadPct), symbol: e.symbol, buy: e.buyDex, sell: e.sellDex, net: e.netSpreadPct !== undefined, snapshot: true }
    }
    return b
  }, [screenerPairs, edge])

  const mode = isTestMode
    ? { label: 'test prices', cls: 'pill--warn', title: 'The fork has manipulated prices for testing' }
    : tradingMode === 'auto'
      ? { label: 'auto execute', cls: 'pill--bad', title: 'tradingMode=auto in config.json: the bot sends trades itself' }
      : tradingMode === 'manual'
        ? { label: 'manual', cls: 'pill--warn', title: 'tradingMode=manual: trades only when you click Trade' }
        : { label: 'monitor only', cls: 'pill--signal', title: 'tradingMode=monitor: prices, quotes and the study only; nothing can send a transaction' }
  const chain = network === 'hardhat' ? 'Hardhat fork' : network === 'arbitrum' ? 'Arbitrum' : demo ? 'Arbitrum' : '—'
  const activity = isExecuting ? 'trading' : isRunning ? 'scanning' : connected ? 'idle' : null

  const hours = edge?.progress?.elapsedHours || 0
  const target = edge?.progress?.targetDays || 7
  const day = Math.min(target, Math.floor(hours / 24) + 1)
  const pct = Math.max(0, Math.min(100, edge?.progress?.pct || 0))
  const stale = !demo && edge?.lastTickAt && Date.now() - edge.lastTickAt > 120000

  return (
    <header className="tb">
      <div className="wrap tb-in">
        <div className="tb-left">
          <span className="tb-name">FortunaTrades ARB</span>
          <span className="tb-lane">DEX arbitrage · {chain}</span>
          <span className={`pill ${mode.cls}`} title={mode.title}>{mode.label}</span>
          {activity ? <span className="tb-meta">{activity}</span> : null}
          {screenerBlock ? <span className="tb-meta">block <span className="num">{screenerBlock}</span></span> : edge?.lastBlock ? <span className="tb-meta">block <span className="num">{edge.lastBlock}</span></span> : null}
        </div>

        <div className="tb-vital" title="The best executable route across all live pools, after both pool fees. The threshold is judged on this number.">
          <span className={`tb-vital-num ${best && best.v >= th ? 'good' : ''}`}>{best ? fmtSigned(best.v) : '—'}</span>
          <span className="tb-vital-sub">
            <span>{best ? <><b>{best.symbol}</b> {best.buy} → {best.sell}</> : 'waiting for the first poll'}</span>
            <span>{best ? (best.net ? 'after pool fees' : 'gross spread') : ''}{best?.snapshot ? (demo ? ' · from the snapshot' : " · the study's best candidate") : ''} · threshold {th.toFixed(2)}%</span>
          </span>
        </div>

        <div className="tb-right">
          {demo
            ? <span className="pill" title={edgeSnapshotAt ? `Snapshot from ${new Date(edgeSnapshotAt).toLocaleString()}` : 'No snapshot published yet'}><i className="dot" />{edgeSnapshotAt ? `snapshot ${new Date(edgeSnapshotAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'public demo'}</span>
            : connected
              ? <span className="pill pill--good"><i className="dot dot--live" />live</span>
              : <span className="pill pill--bad"><i className="dot" />offline</span>}
          {stale ? <span className="pill pill--warn" title="The bot has not reported a poll for a while">no poll for {fmtHours((Date.now() - edge.lastTickAt) / 3600000)}</span> : null}
          {edge?.enabled ? (
            <div className="tb-study" title={`${pct.toFixed(1)}% of the ${target}-day study · ${edge.polls || 0} polls`}>
              <span>study day {day} of {target} · {edge.polls || 0} polls</span>
              <div className={`tb-progress ${stale ? 'tb-progress--warn' : ''}`}><i style={{ width: `${pct}%` }} /></div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
