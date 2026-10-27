import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import Explain from './Explain'
import { dexVar } from '../lib/dex'
import { isStaticHost } from '../store/websocket'
import { DepthCurve, LiquidityProfile } from './Readings'

/**
 * EdgeStudyPanel — the monitor-only edge study, read as a finding.
 *
 * One sentence states what the live data says so far. Everything under it is the evidence:
 * the spread tape (last hour, every pair, after pool fees), the size ladder of the best simulated
 * candidate, today's spread distribution, the live venue map (every pool the study prices, placed
 * by how far its price sits from the pair's mid), and the decision rule the study exists to settle.
 *
 * "After pool fees" is the quantity that matters across fee tiers: a 0.8% gap to a 1% pool is not
 * an opportunity, a 0.12% gap between two 0.05% pools is. The threshold is compared to it.
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
const fmtSignedPct = (n, d = 2) => (Number.isFinite(Number(n)) ? `${Number(n) > 0 ? '+' : Number(n) < 0 ? '−' : ''}${Math.abs(Number(n)).toFixed(d)}%` : '—')
const fmtBps = (n) => (Number.isFinite(n) ? `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)} bp` : '—')
const fmtReserve = (w) => (!Number.isFinite(w) ? '' : w >= 1000 ? `${(w / 1000).toFixed(1)}k WETH` : `${w.toFixed(w >= 100 ? 0 : 1)} WETH`)
// the spread the rule is judged on: after pool fees when the bot reports it, else the raw screener spread
const ruleSpread = (pt) => (pt ? (Number.isFinite(pt.n) ? pt.n : Number.isFinite(pt.e) ? pt.e : pt.s) : null)
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
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!node || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [node])
  return [setNode, width]
}

// ---------- the finding ----------

function Finding({ edge }) {
  const hours = edge.progress?.elapsedHours ?? 0
  const floor = edge.settings?.candidateFloorPct
  const best = edge.best
  const n = (v) => <span className="edge-num">{v}</span>

  const floorClause = Number(floor) > 0
    ? <>cleared {n(fmtPct(floor))} after pool fees</>
    : <>showed a positive spread after pool fees</>

  if (!edge.lastTickAt) {
    return (
      <p className="edge-finding">
        Waiting for the first poll from live Arbitrum. Once prices land, every pool is priced at one
        block, and any route that {Number(floor) > 0 ? <>clears {n(fmtPct(floor))}</> : 'is positive'} after pool fees gets a quoted round trip.
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

  const venueCount = edge.venueCount
  const venueClause = venueCount ? <> across {n(venueCount)} live pools</> : null

  return (
    <p className="edge-finding">
      Over {n(fmtHours(hours))} on live Arbitrum{venueClause}, {n(edge.candidates)} {edge.candidates === 1 ? 'route' : 'routes'} {floorClause}.
      {failedClause}
      {' '}{n(edge.cleared)} also cleared gas and the flash-loan fee in a quoted round trip; {n(edge.wouldFire)} would have fired at the bot’s threshold.
      {bestClause}
    </p>
  )
}

// ---------- spread tape: small multiples ----------

function SpreadTape({ edge, threshold }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null) // { x, t }
  const longLabels = useSelector(s => !!s.bot.costume?.on) // stage names on the public copy are long
  const labelW = longLabels ? 150 : 96
  const rowH = 44
  const padR = 8
  // pairs that stopped reporting (a pool set that discovery now skips) drop off the tape after 20 min
  const pairs = useMemo(() => {
    const series = edge.series || {}
    const latest = Math.max(0, ...Object.values(series).map(a => a[a.length - 1]?.t || 0))
    return Object.keys(series).filter(p => (series[p][series[p].length - 1]?.t || 0) >= latest - 20 * 60000).sort()
  }, [edge.series])
  const floor = Number(edge.settings?.candidateFloorPct) || 0
  const th = Number(threshold) || 0.3

  const domain = useMemo(() => {
    let tMin = Infinity, tMax = -Infinity, sMax = 0, sMin = 0
    for (const p of pairs) for (const pt of edge.series[p]) {
      if (pt.t < tMin) tMin = pt.t
      if (pt.t > tMax) tMax = pt.t
      const v = ruleSpread(pt)
      if (Number.isFinite(v)) { if (v > sMax) sMax = v; if (v < sMin) sMin = v }
    }
    if (!Number.isFinite(tMin)) { tMin = Date.now() - 3600000; tMax = Date.now() }
    if (tMax - tMin < 10 * 60000) tMin = tMax - 10 * 60000
    // After pool fees most routes sit below zero. Keep zero and the threshold on every row, cap the
    // scale so one broken pool cannot flatten the rest, and let outliers pin to the row edge
    // (the row label still shows the true value).
    const yMax = Math.min(Math.max(th * 1.3, sMax * 1.15, 0.05), Math.max(th * 4, 2))
    const yMin = Math.max(Math.min(-th * 0.5, sMin * 1.15), -Math.max(th * 3, 1))
    return { tMin, tMax, yMax, yMin }
  }, [pairs, edge.series, th, floor])

  const plotW = Math.max(0, width - labelW - padR)
  // x is relative to the plot svg (0..plotW); the label column sits to its left
  const x = (t) => ((t - domain.tMin) / (domain.tMax - domain.tMin || 1)) * plotW
  const y = (s, h = rowH) => {
    const v = Math.max(domain.yMin, Math.min(domain.yMax, Number.isFinite(s) ? s : domain.yMin))
    return h - 6 - ((v - domain.yMin) / (domain.yMax - domain.yMin || 1)) * (h - 12)
  }

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
          ? arr.map((pt, i) => `${i ? 'L' : 'M'}${x(pt.t).toFixed(1)},${y(ruleSpread(pt)).toFixed(1)}`).join(' ')
          : ''
        const last = arr[arr.length - 1]
        const lastRule = ruleSpread(last)
        // a quoted round trip that did not clear costs is the normal case now; only cleared / fired earn a mark
        const marks = (edge.markers?.[p] || []).filter(m => m.t >= domain.tMin && (m.clears || m.fired))
        return (
          <div className="edge-tape-row" key={p}>
            <div className="edge-row-label">
              <span>{p}</span>
              <span className="edge-row-value" title={last && Number.isFinite(last.n) ? `gross ${fmtPct(last.e ?? last.s)} on the executable route` : undefined}>
                {last ? fmtSignedPct(lastRule) : '—'}
              </span>
            </div>
            <svg width={plotW + padR} height={rowH} className="edge-tape-svg" aria-hidden="true">
              {/* threshold (dashed), zero / floor (solid faint) */}
              <line x1={0} x2={plotW} y1={y(th)} y2={y(th)} className="edge-rule-threshold" />
              <line x1={0} x2={plotW} y1={y(0)} y2={y(0)} className="edge-rule-zero" />
              {floor > 0 && <line x1={0} x2={plotW} y1={y(floor)} y2={y(floor)} className="edge-rule-floor" />}
              {d && <path d={d} className="edge-line" />}
              {marks.map((m, i) => {
                const pt = arr.reduce((a, b) => (Math.abs(b.t - m.t) < Math.abs((a?.t ?? Infinity) - m.t) ? b : a), null)
                const cy = pt ? y(ruleSpread(pt)) : rowH / 2
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
        <span>after pool fees · threshold {fmtPct(th)} dashed · zero solid</span>
        <span>{fmtClock(domain.tMax)}</span>
      </div>
      {hover && (
        <div className="edge-tooltip" style={{ left: Math.min(labelW + hover.x + 12, width - 190), top: 4 }}>
          <div className="edge-tooltip-time">{fmtClock(hover.t)}</div>
          {hoverRows.map(({ p, pt }) => (
            <div className="edge-tooltip-row" key={p}>
              <span>{p}</span>
              <span>{pt ? fmtSignedPct(ruleSpread(pt)) : '—'}</span>
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
        {candidate.symbol} · {candidate.buyDex} → {candidate.sellDex} · spread {fmtPct(candidate.spreadPct)}
        {Number.isFinite(candidate.feePct) ? <> gross, {fmtSignedPct(candidate.netSpreadPct)} after {fmtPct(candidate.feePct, 3)} pool fees</> : null}
        {' '}· gas {fmtEth(candidate.gasCostEth, 6).replace('+', '')} · {fmtClock(candidate.ts)}
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
  const floor = Number(edge.settings?.candidateFloorPct) || 0
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
      <div className="edge-hist-foot">{plural(total, 'pair sample', 'pair samples')} today · best route after pool fees, in percent · negatives land in the first bucket</div>
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
  else if (edge.wouldFire === 0) reading = `Reading so far: nothing would have fired. If that holds for ${target} days, the answer is "not with this pair set on these venues" and funding stays off the table at zero cost.`
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

// ---------- live venue map ----------

/**
 * Every pool the study prices, one strip per pair, placed by its price's distance from the pair's
 * reserve-weighted mid in basis points. Dot area follows the WETH reserve, so a deep pool reads as
 * deep and a thin one as thin. The spread the tape plots is the distance between two of these dots,
 * minus their two fees — this is where it comes from.
 */
function VenueMap({ venues }) {
  const [ref, width] = useWidth()
  const longLabels = useSelector(s => !!s.bot.costume?.on) // stage names on the public copy are long
  const labelW = longLabels ? 150 : 96
  const padR = 12
  const rowH = 54
  const plotW = Math.max(0, width - labelW - padR)

  const rows = useMemo(() => {
    const byPair = new Map()
    for (const v of venues || []) {
      if (!Number.isFinite(Number(v.price)) || Number(v.price) <= 0) continue
      if (!byPair.has(v.pair)) byPair.set(v.pair, { pair: v.pair, symbol: v.symbol, venues: [] })
      byPair.get(v.pair).venues.push(v)
    }
    const out = []
    for (const row of byPair.values()) {
      const weth = (v) => {
        const r = v.reserves
        if (!r) return 1
        const sym = String(row.symbol || '')
        // symbol is token1/token0; reserves.token0 is in token0 units
        const [t1, t0] = sym.split('/')
        if (v.wethSide) return Math.max(0.01, r[v.wethSide])
        if (t0 === 'WETH') return Math.max(0.01, r.token0)
        if (t1 === 'WETH') return Math.max(0.01, r.token1)
        return Math.max(0.01, r.token1) // stable pairs: token1 is the quote side
      }
      const ws = row.venues.map(weth)
      const wsum = ws.reduce((a, b) => a + b, 0) || 1
      const mid = row.venues.reduce((a, v, i) => a + Number(v.price) * ws[i], 0) / wsum
      const pts = row.venues.map((v, i) => ({
        ...v,
        bps: ((Number(v.price) - mid) / mid) * 10000,
        weth: ws[i],
        label: String(v.key || `${v.dex}${v.fee !== null && v.fee !== undefined ? ` ${Number((v.fee / 10000).toFixed(4))}%` : ''}`).replace(/^PancakeSwap/, 'Cake').replace(/^Uniswap/, 'Uni')
      })).sort((a, b) => a.bps - b.bps)
      out.push({ ...row, mid, pts })
    }
    return out.sort((a, b) => a.symbol.localeCompare(b.symbol))
  }, [venues])

  const maxAbs = useMemo(() => {
    let m = 0
    for (const r of rows) for (const p of r.pts) m = Math.max(m, Math.abs(p.bps))
    return Math.min(100, Math.max(8, m * 1.15))
  }, [rows])
  const maxW = useMemo(() => Math.max(1, ...rows.flatMap(r => r.pts.map(p => p.weth))), [rows])

  if (!rows.length) return <div className="edge-empty">Venues appear after the first poll: every pool with real reserves, on every fee tier, for every live pair.</div>

  // square-root scale: the cheap pools that make routes sit within a few bp of mid and need room,
  // the 1% pools sit tens of bp out and only need to be visible
  const sq = (v) => Math.sign(v) * Math.sqrt(Math.abs(v))
  const x = (bps) => plotW / 2 + (sq(Math.max(-maxAbs, Math.min(maxAbs, bps))) / sq(maxAbs)) * (plotW / 2 - 10)
  const r = (w) => 3 + 6 * Math.sqrt(Math.log10(1 + w) / Math.log10(1 + maxW))
  const ticks = [1, 5, 20, 60].filter(t => t < maxAbs)

  return (
    <div className="edge-venues" ref={ref}>
      {rows.map(row => {
        // pools within a few px of each other are one cluster with one label; adjacent clusters
        // alternate between two label lanes so names do not collide
        const clusters = []
        for (const p of row.pts) {
          const px = x(p.bps)
          const last = clusters[clusters.length - 1]
          if (last && px - last.x1 < 18) { last.pts.push(p); last.x1 = px } else clusters.push({ x0: px, x1: px, pts: [p] })
        }
        let lastLabelX = -Infinity, lane = 0
        for (const c of clusters) {
          c.cx = (c.x0 + c.x1) / 2
          lane = c.cx - lastLabelX < 64 ? 1 - lane : 0
          c.lane = lane
          lastLabelX = c.cx
          c.label = c.pts.length === 1 ? c.pts[0].label : `${c.pts.length} pools`
        }
        return (
          <div className="edge-tape-row edge-venue-row" key={row.pair} style={{ height: rowH }}>
            <div className="edge-row-label">
              <span>{row.symbol}</span>
              <span className="edge-row-value">{plural(row.pts.length, 'pool', 'pools')}</span>
            </div>
            <svg width={plotW + padR} height={rowH} className="edge-tape-svg" role="img" aria-label={`${row.symbol}: pool prices relative to mid`}>
              <line x1={0} x2={plotW} y1={18} y2={18} className="edge-rule-base" />
              {ticks.flatMap(t => [-t, t]).map(t => (
                <line key={t} x1={x(t)} x2={x(t)} y1={14} y2={22} className="edge-rule-base" />
              ))}
              <line x1={x(0)} x2={x(0)} y1={6} y2={30} className="edge-rule-zero" />
              {row.pts.map((p) => (
                <g key={p.key} className="edge-venue-pt">
                  <title>{`${p.key} · ${fmtBps(p.bps)} from mid · ${fmtReserve(p.weth)}${(p.fee === null || p.fee === undefined) && !longLabels ? ' · dynamic fee' : ''}`}</title>
                  <circle cx={x(p.bps)} cy={18} r={r(p.weth)} className="edge-venue-dot" style={{ '--c': dexVar(p.dex || p.key) }} />
                </g>
              ))}
              {clusters.map((c, i) => (
                <text key={i} x={c.cx} y={c.lane ? 50 : 39} textAnchor="middle" className="edge-svg-muted edge-venue-label">
                  <title>{c.pts.map(p => `${p.label} ${fmtBps(p.bps)} · ${fmtReserve(p.weth)}`).join('\n')}</title>
                  {c.label}
                </text>
              ))}
            </svg>
          </div>
        )
      })}
      <div className="edge-tape-axis" style={{ marginLeft: labelW }}>
        <span>−{maxAbs.toFixed(0)} bp</span>
        <span>price vs the pair’s reserve-weighted mid · square-root scale, ticks at {ticks.join(', ')} bp · dot area = WETH in the pool · hover a dot or a label</span>
        <span>+{maxAbs.toFixed(0)} bp</span>
      </div>
    </div>
  )
}

// ---------- panel ----------

export default function EdgeStudyPanel() {
  const { edge, threshold, settings, venues, edgeSnapshotAt, network, connected } = useSelector(state => state.bot)
  if (!edge || !edge.enabled) {
    return (
      <section className="panel">
        <div className="panel-h"><h2 className="h2">Edge study</h2></div>
        <div className="notice notice--quiet">
          <div className="notice-t">{isStaticHost() ? 'No snapshot published yet' : !connected ? 'Waiting for the bot' : 'The study is not running on this bot'}</div>
          {isStaticHost()
            ? 'The nightly report publishes the study here once the first day is in.'
            : network === 'hardhat'
              ? 'The study measures live Arbitrum only. Start the monitor with EDGE_MONITOR=1 (sh scripts/edge-monitor-service.sh install) to run it.'
              : 'Once the bot connects, the first poll from live Arbitrum starts the tape.'}
        </div>
      </section>
    )
  }

  const pct = Math.max(0, Math.min(100, edge.progress?.pct || 0))
  const dayNum = Math.min(edge.progress?.targetDays || 7, Math.floor((edge.progress?.elapsedHours || 0) / 24) + 1)
  const candidate = edge.best || edge.last
  const th = isStaticHost() ? (threshold ?? settings?.priceDifference) : (settings?.priceDifference ?? threshold) // the snapshot's threshold on the public copy
  const stale = edge.lastTickAt && Date.now() - edge.lastTickAt > 120000

  return (
    <section className="panel edge-card" aria-label="Monitor-only edge study">
      <header className="panel-h">
        <div>
          <h2 className="h2">Edge study</h2>
          <div className="edge-sub">
            {edgeSnapshotAt ? `Snapshot from ${new Date(edgeSnapshotAt).toLocaleString()} · ` : ''}Live Arbitrum, monitor only · {edge.polls} polls{edge.lastBlock ? ` · block ${edge.lastBlock}` : ''}
            {edge.gasPriceGwei ? ` · gas ${Number(edge.gasPriceGwei).toFixed(3)} gwei` : ''}
            {edge.wethUsd ? ` · ETH ${fmtUsd(edge.wethUsd)}` : ''}
            {stale ? <span className="edge-stale"> · no poll for {fmtHours((Date.now() - edge.lastTickAt) / 3600000)}</span> : null}
          </div>
        </div>
        <div className="tb-study" title={`${pct.toFixed(1)}% of the ${edge.progress?.targetDays}-day study`}>
          <span>day {dayNum} of {edge.progress?.targetDays} · decision when the week is in</span>
          <div className="tb-progress"><i style={{ width: `${pct}%` }} /></div>
        </div>
      </header>

      <Finding edge={edge} />

      <div className="edge-grid">
        <div className="edge-cell edge-cell-tape">
          <h3 className="edge-h3">Best route after pool fees, last hour</h3>
          <SpreadTape edge={edge} threshold={th} />
          <div className="edge-legend">
            <span><i className="edge-dot edge-dot-fired" /> would have fired</span>
            <span><i className="edge-dot edge-dot-cleared" /> cleared gas and fees, under threshold</span>
            <span>{plural(edge.simulated || 0, 'round trip quoted', 'round trips quoted')} so far, {edge.cleared || 0} cleared</span>
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
        <div className="edge-cell edge-cell-depth">
          <h3 className="edge-h3">Depth curve · the best candidate's net by size</h3>
          <DepthCurve candidate={candidate} />
        </div>
        <div className="edge-cell">
          <h3 className="edge-h3">Liquidity profile · WETH in each pool, by venue</h3>
          <LiquidityProfile venues={venues?.length ? venues : edge.venues} />
        </div>
        <div className="edge-cell edge-cell-venues">
          <h3 className="edge-h3">Live venues: where each pool prices the pair</h3>
          <VenueMap venues={venues?.length ? venues : edge.venues} />
        </div>
      </div>

      <DecisionRule edge={edge} />

      <Explain>
        <p>The study answers one question before any wallet is funded: <b>is there an edge worth gas on these pairs, on these venues?</b> Every poll prices every live pool for every pair in one block. The best route per pair is the cheapest pool to buy on and the richest to sell on, scored <b>after both pool fees</b>.</p>
        <p>Any route with a positive after-fee spread is a <b>candidate</b> and gets a quoted round trip at five sizes through the real quoter contracts, netted against the flash-loan fee and gas. A candidate that still nets positive has <b>cleared</b>; one that also clears the threshold <b>would have fired</b>.</p>
        <p>The <b>tape</b> is the last hour of after-fee spreads, one row per pair, with zero solid and the threshold dashed. The <b>ladder</b> shows how the best candidate's net result changes with size, which is where gas stops being the binding cost. The <b>distribution</b> is today's samples by bucket. The <b>venue map</b> is every pool the study prices, placed by how far it sits from the pair's mid; the tape's spread is the distance between two of these dots minus their two fees.</p>
        <p>The verdict rule is written in <code>GO_NOGO.md</code>: funding becomes a sizing decision, not a bet, when would-fire candidates over a full week net more than gas and infrastructure.</p>
      </Explain>
    </section>
  )
}
