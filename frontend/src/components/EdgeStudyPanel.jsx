import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

/**
 * EdgeStudyPanel — the monitor-only edge study, read as a finding.
 *
 * One sentence states what the live data says so far. Everything under it is the evidence:
 * the spread tape (last hour, every pair), the size ladder of the best simulated candidate,
 * today's spread distribution, and the decision rule the study exists to settle.
 * Renders nothing when the study is not running (local fork, or EDGE_STUDY=0).
 */

// ---------- formatting ----------

const fmtEth = (n, d = 5) => {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—'
  const v = Number(n)
  const s = Math.abs(v) < 1e-6 && v !== 0 ? v.toExponential(2) : v.toFixed(d)
  return `${v > 0 ? '+' : ''}${s} ETH`
}
const fmtUsd = (n) => {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return null
  const v = Number(n)
  const abs = Math.abs(v)
  const s = abs >= 100 ? abs.toFixed(0) : abs >= 1 ? abs.toFixed(2) : abs.toFixed(3)
  return `${v < 0 ? '−' : ''}$${s}`
}
const fmtPct = (n, d = 2) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(d)}%` : '—')
const fmtHours = (h) => {
  if (!Number.isFinite(h)) return '—'
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`
  return `${(h / 24).toFixed(1)} days`
}
const fmtClock = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// ---------- measurement ----------

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(ref.current)
    setWidth(ref.current.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

// ---------- the finding ----------

function Finding({ edge }) {
  const hours = edge.progress?.elapsedHours ?? 0
  const floor = edge.settings?.candidateFloorPct
  const best = edge.best
  const n = (v) => <span className="edge-num">{v}</span>

  if (!edge.lastTickAt) {
    return (
      <p className="edge-finding">
        Waiting for the first poll from live Arbitrum. Once prices land, every spread is logged and
        anything above {n(fmtPct(floor))} gets a quoted round trip.
      </p>
    )
  }

  const bestClause = best
    ? (
      <>
        {' '}The best simulated round trip netted {n(fmtEth(best.bestNetEth))}
        {best.bestNetUsd !== null && best.bestNetUsd !== undefined ? <> ({n(fmtUsd(best.bestNetUsd))})</> : null}
        {' '}on {n(best.symbol)} via {best.buyDex} → {best.sellDex} at {n(`${best.bestSizeEth} ETH`)}.
      </>
    )
    : edge.candidates > 0
      ? <> No simulated round trip has produced a usable quote yet.</>
      : null

  const failed = edge.quoteFailed || 0
  const failedClause = failed > 0
    ? <> ({n(failed)} of them could not be quoted and were left out, usually an empty pool on one side.)</>
    : null

  return (
    <p className="edge-finding">
      Over {n(fmtHours(hours))} on live Arbitrum, {n(edge.candidates)} {edge.candidates === 1 ? 'candidate' : 'candidates'} crossed {n(fmtPct(floor))}.
      {failedClause}
      {' '}{n(edge.cleared)} cleared swap fees, flash-loan fee and gas; {n(edge.wouldFire)} would have fired at the bot’s threshold.
      {bestClause}
    </p>
  )
}

// ---------- spread tape: small multiples ----------

function SpreadTape({ edge, threshold }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null) // { x, t }
  const labelW = 96
  const rowH = 44
  const padR = 8
  const pairs = useMemo(() => Object.keys(edge.series || {}).sort(), [edge.series])
  const floor = Number(edge.settings?.candidateFloorPct) || 0.1
  const th = Number(threshold) || 0.3

  const domain = useMemo(() => {
    let tMin = Infinity, tMax = -Infinity, sMax = 0
    for (const p of pairs) for (const pt of edge.series[p]) {
      if (pt.t < tMin) tMin = pt.t
      if (pt.t > tMax) tMax = pt.t
      if (pt.s > sMax) sMax = pt.s
    }
    if (!Number.isFinite(tMin)) { tMin = Date.now() - 3600000; tMax = Date.now() }
    if (tMax - tMin < 10 * 60000) tMin = tMax - 10 * 60000
    // One dead pool can report a 50% "spread"; cap the shared scale so the real pairs stay readable
    // and let outliers pin to the top of their row (the row label still shows the true value).
    const yMax = Math.min(Math.max(th * 1.4, sMax * 1.1, floor * 2.5), Math.max(th * 4, 2))
    return { tMin, tMax, yMax }
  }, [pairs, edge.series, th, floor])

  const plotW = Math.max(0, width - labelW - padR)
  // x is relative to the plot svg (0..plotW); the label column sits to its left
  const x = (t) => ((t - domain.tMin) / (domain.tMax - domain.tMin || 1)) * plotW
  const y = (s, h = rowH) => h - 6 - (Math.min(s, domain.yMax) / domain.yMax) * (h - 12)

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const px = e.clientX - rect.left - labelW
    if (px < 0 || px > plotW) { setHover(null); return }
    const t = domain.tMin + (px / (plotW || 1)) * (domain.tMax - domain.tMin)
    setHover({ x: px, t })
  }

  const hoverRows = hover ? pairs.map(p => {
    const arr = edge.series[p]
    let nearest = null
    for (const pt of arr) if (!nearest || Math.abs(pt.t - hover.t) < Math.abs(nearest.t - hover.t)) nearest = pt
    return { p, pt: nearest }
  }) : []

  if (!pairs.length) {
    return <div className="edge-empty">The tape fills in as polls arrive, one row per live pair.</div>
  }

  return (
    <div className="edge-tape" ref={ref} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {pairs.map((p) => {
        const arr = edge.series[p]
        const d = arr.length
          ? arr.map((pt, i) => `${i ? 'L' : 'M'}${x(pt.t).toFixed(1)},${y(pt.s).toFixed(1)}`).join(' ')
          : ''
        const last = arr[arr.length - 1]
        const marks = (edge.markers?.[p] || []).filter(m => m.t >= domain.tMin)
        return (
          <div className="edge-tape-row" key={p}>
            <div className="edge-row-label">
              <span>{p}</span>
              <span className="edge-row-value">{last ? fmtPct(last.s) : '—'}</span>
            </div>
            <svg width={plotW + padR} height={rowH} className="edge-tape-svg" aria-hidden="true">
              {/* threshold + floor rules */}
              <line x1={0} x2={plotW} y1={y(th)} y2={y(th)} className="edge-rule-threshold" />
              <line x1={0} x2={plotW} y1={y(floor)} y2={y(floor)} className="edge-rule-floor" />
              <line x1={0} x2={plotW} y1={rowH - 6} y2={rowH - 6} className="edge-rule-base" />
              {d && <path d={d} className="edge-line" />}
              {marks.map((m, i) => {
                const pt = arr.reduce((a, b) => (Math.abs(b.t - m.t) < Math.abs((a?.t ?? Infinity) - m.t) ? b : a), null)
                const cy = pt ? y(pt.s) : rowH / 2
                const cls = m.fired ? 'edge-mark-fired' : m.clears ? 'edge-mark-cleared' : 'edge-mark'
                return <circle key={i} cx={x(m.t)} cy={cy} r={m.fired || m.clears ? 4.5 : 3.5} className={cls} />
              })}
              {hover && <line x1={hover.x} x2={hover.x} y1={2} y2={rowH - 2} className="edge-crosshair" />}
            </svg>
          </div>
        )
      })}
      <div className="edge-tape-axis" style={{ marginLeft: labelW }}>
        <span>{fmtClock(domain.tMin)}</span>
        <span>threshold {fmtPct(th)} · floor {fmtPct(floor)}</span>
        <span>{fmtClock(domain.tMax)}</span>
      </div>
      {hover && (
        <div className="edge-tooltip" style={{ left: Math.min(labelW + hover.x + 12, width - 190), top: 4 }}>
          <div className="edge-tooltip-time">{fmtClock(hover.t)}</div>
          {hoverRows.map(({ p, pt }) => (
            <div className="edge-tooltip-row" key={p}>
              <span>{p}</span>
              <span>{pt ? fmtPct(pt.s) : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- size ladder ----------

function SizeLadder({ candidate }) {
  const [ref, width] = useWidth()
  if (!candidate || !candidate.ladder?.length) {
    return <div className="edge-empty">The first candidate above the floor gets quoted at five sizes; the ladder shows how net profit changes with size.</div>
  }
  const rows = candidate.ladder
  const vals = rows.map(r => (Number.isFinite(r.netEth) ? r.netEth : 0))
  const maxAbs = Math.max(1e-9, ...vals.map(Math.abs))
  const labelW = 64
  const valueW = 150
  const plotW = Math.max(40, width - labelW - valueW)
  const zeroX = labelW + plotW / 2
  const scale = (v) => (v / maxAbs) * (plotW / 2 - 6)

  return (
    <div ref={ref}>
      <div className="edge-ladder-title">
        {candidate.symbol} · {candidate.buyDex} → {candidate.sellDex} · screener spread {fmtPct(candidate.spreadPct)} · gas {fmtEth(candidate.gasCostEth, 6).replace('+', '')} · {fmtClock(candidate.ts)}
      </div>
      <svg width={Math.max(0, width)} height={rows.length * 26 + 8} role="img" aria-label="Net result by trade size">
        <line x1={zeroX} x2={zeroX} y1={2} y2={rows.length * 26 + 2} className="edge-rule-zero" />
        {rows.map((r, i) => {
          const cy = i * 26 + 14
          const v = Number.isFinite(r.netEth) ? r.netEth : 0
          const w = Math.abs(scale(v))
          const xStart = v >= 0 ? zeroX : zeroX - w
          const usd = fmtUsd(r.netUsd)
          return (
            <g key={r.sizeEth}>
              <text x={labelW - 8} y={cy + 4} textAnchor="end" className="edge-svg-label">{r.sizeEth} ETH</text>
              {r.error
                ? <text x={zeroX + 8} y={cy + 4} className="edge-svg-muted">quote failed · {r.error.slice(0, 28)}</text>
                : (
                  <>
                    <rect x={xStart} y={cy - 7} width={Math.max(2, w)} height={14} rx={3}
                      className={v >= 0 ? 'edge-bar-pos' : 'edge-bar-neg'} />
                    <text x={labelW + plotW + 8} y={cy + 4} className="edge-svg-value">
                      {fmtEth(v)}{usd ? ` · ${usd}` : ''}
                    </text>
                  </>
                )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ---------- today's spread distribution ----------

function SpreadHistogram({ edge }) {
  const hist = edge.today?.spreadHist || {}
  const order = edge.bucketOrder || Object.keys(hist)
  const floor = Number(edge.settings?.candidateFloorPct) || 0.1
  const max = Math.max(1, ...order.map(b => hist[b] || 0))
  const total = order.reduce((a, b) => a + (hist[b] || 0), 0)
  const floorIdx = order.findIndex(b => {
    const lo = parseFloat(b.replace(/[<>=]/g, '').split('-')[0])
    return b.startsWith('>=') ? parseFloat(b.slice(2)) >= floor : (Number.isFinite(lo) ? lo >= floor : false)
  })
  return (
    <div className="edge-hist">
      {order.map((b, i) => {
        const c = hist[b] || 0
        const h = (c / max) * 56
        const above = floorIdx >= 0 && i >= floorIdx
        return (
          <div className="edge-hist-col" key={b} title={`${b}% · ${c} samples`}>
            <div className="edge-hist-count">{c || ''}</div>
            <div className="edge-hist-bar-wrap">
              <div className={above ? 'edge-hist-bar edge-hist-bar-above' : 'edge-hist-bar'} style={{ height: `${Math.max(c ? 3 : 0, h)}px` }} />
            </div>
            <div className="edge-hist-label">{b}</div>
          </div>
        )
      })}
      <div className="edge-hist-foot">{plural(total, 'pair sample', 'pair samples')} today, spread in percent</div>
    </div>
  )
}

// ---------- decision rule ----------

function DecisionRule({ edge }) {
  const hours = edge.progress?.elapsedHours || 0
  const days = Math.max(hours / 24, 1 / 24)
  const perDay = edge.wouldFire / days
  const infra = Number(edge.settings?.infraCostUsdPerDay) || 0
  const target = edge.settings?.studyDays || 7
  const enough = hours >= target * 24

  let reading
  if (!edge.lastTickAt) reading = 'No reading yet.'
  else if (edge.wouldFire === 0) reading = `Reading so far: nothing would have fired. If that holds for ${target} days, the answer is "not with this pair set and fee tier" and funding stays off the table at zero cost.`
  else reading = `Reading so far: about ${perDay.toFixed(1)} would-fire ${perDay === 1 ? 'candidate' : 'candidates'} per day${infra ? `, against $${infra}/day of infrastructure` : ''}. ${enough ? 'The week is in; decide from the daily lines in HANDOFF.md.' : 'Too early to size anything; let the week finish.'}`

  return (
    <div className="edge-rule">
      <p>
        Wallet funding becomes a sizing decision, not a bet, when would-fire candidates over a full {target}-day week net more than gas and infrastructure.
        Until then the bot stays in monitor mode and nothing here can send a transaction.
      </p>
      <p className="edge-rule-reading">{reading}</p>
    </div>
  )
}

// ---------- panel ----------

export default function EdgeStudyPanel() {
  const { edge, threshold, settings } = useSelector(state => state.bot)
  if (!edge || !edge.enabled) return null

  const pct = Math.max(0, Math.min(100, edge.progress?.pct || 0))
  const dayNum = Math.min(edge.progress?.targetDays || 7, Math.floor((edge.progress?.elapsedHours || 0) / 24) + 1)
  const candidate = edge.best || edge.last
  const th = settings?.priceDifference ?? threshold
  const stale = edge.lastTickAt && Date.now() - edge.lastTickAt > 120000

  return (
    <section className="screener-card edge-card" aria-label="Monitor-only edge study">
      <header className="edge-head">
        <div>
          <h2 className="edge-title">Edge study</h2>
          <div className="edge-sub">
            Live Arbitrum, monitor only · {edge.polls} polls{edge.lastBlock ? ` · block ${edge.lastBlock}` : ''}
            {edge.gasPriceGwei ? ` · gas ${Number(edge.gasPriceGwei).toFixed(3)} gwei` : ''}
            {edge.wethUsd ? ` · ETH ${fmtUsd(edge.wethUsd)}` : ''}
            {stale ? <span className="edge-stale"> · no poll for {fmtHours((Date.now() - edge.lastTickAt) / 3600000)}</span> : null}
          </div>
        </div>
        <div className="edge-progress" title={`${pct.toFixed(1)}% of the ${edge.progress?.targetDays}-day study`}>
          <span>day {dayNum} of {edge.progress?.targetDays}</span>
          <div className="edge-progress-track"><div className="edge-progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </header>

      <Finding edge={edge} />

      <div className="edge-grid">
        <div className="edge-cell edge-cell-tape">
          <h3 className="edge-h3">Spread tape, last hour</h3>
          <SpreadTape edge={edge} threshold={th} />
          <div className="edge-legend">
            <span><i className="edge-dot edge-dot-fired" /> would have fired</span>
            <span><i className="edge-dot edge-dot-cleared" /> cleared costs, under threshold</span>
            <span><i className="edge-dot edge-dot-plain" /> simulated, did not clear</span>
          </div>
        </div>
        <div className="edge-cell">
          <h3 className="edge-h3">{edge.best ? 'Best candidate, net by size' : 'Latest candidate, net by size'}</h3>
          <SizeLadder candidate={candidate} />
        </div>
        <div className="edge-cell">
          <h3 className="edge-h3">Today’s spread distribution</h3>
          <SpreadHistogram edge={edge} />
        </div>
      </div>

      <DecisionRule edge={edge} />
    </section>
  )
}
