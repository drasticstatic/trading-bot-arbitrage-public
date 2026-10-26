import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import Explain from './Explain'
import { dexVar, dexTextVar } from '../lib/dex'
import { isStaticHost } from '../store/websocket'

/* Readings — Fortuna's chart ideas for the ARB terminal (Oct 26): the opportunity heatmap, the
 * gas-vs-net scatter, the depth curve and the liquidity profile. Hand-rolled SVG, the fleet
 * palette, the fire threshold drawn on every spread axis. */

function useWidth() {
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    if (!node || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(Math.max(200, e.contentRect.width))
    })
    ro.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [node])
  return [setNode, width]
}
const fmtPct = (n, d = 3) => (Number.isFinite(Number(n)) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(d)}%` : '—')
const fmtEth = (n, d = 5) => (Number.isFinite(Number(n)) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(d)} ETH` : '—')
const fmtUsd = (n, d = 2) => (Number.isFinite(Number(n)) ? `${Number(n) < 0 ? '−' : ''}$${Math.abs(Number(n)).toFixed(d)}` : '—')
const hourLabel = (h) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`)

/** Rows = pairs, columns = hour of day (ET). Fill = candidates sampled; a ring marks cleared/fired. */
function HourHeatmap({ hours, threshold }) {
  const [tip, setTip] = useState(null)
  if (!hours?.pairs?.length) return <div className="edge-empty">The heatmap fills as the candidate log grows: one cell per pair and hour of day, so the eye can see whether the edge keeps hours.</div>
  const max = Math.max(1, ...hours.pairs.flatMap(p => p.hours.map(c => c.n)))
  const lvl = (n) => (n === 0 ? '' : n < max * 0.25 ? 'l1' : n < max * 0.5 ? 'l2' : n < max * 0.8 ? 'l3' : 'l4')
  const busiest = hours.byHour.indexOf(Math.max(...hours.byHour))
  return (
    <div>
      <div className="heat" role="img" aria-label="Candidates by pair and hour of day">
        {hours.pairs.map(p => (
          <div key={p.symbol} className="heat-row">
            <span className="lbl" title={`${p.total} candidates over ${hours.days} days`}>{p.symbol}</span>
            {p.hours.map((c, h) => (
              <span key={h} className={`heat-cell ${lvl(c.n)} ${c.fired ? 'fired' : c.cleared ? 'cleared' : ''}`}
                onMouseEnter={() => setTip({ p: p.symbol, h, c })} onMouseLeave={() => setTip(null)} />
            ))}
          </div>
        ))}
        <div className="heat-axis"><span /> {Array.from({ length: 24 }, (_, h) => <span key={h}>{hourLabel(h)}</span>)}</div>
      </div>
      <div className="heat-legend">
        <span><i style={{ background: 'var(--panel-2)' }} />none</span>
        <span><i className="heat-cell l1" />few</span>
        <span><i className="heat-cell l4" />most ({max})</span>
        <span><i style={{ boxShadow: 'inset 0 0 0 2px var(--warn)', background: 'transparent' }} />cleared gas and fees</span>
        <span><i style={{ boxShadow: 'inset 0 0 0 2px var(--good)', background: 'transparent' }} />would have fired at {Number(threshold).toFixed(2)}%</span>
        <span className="num">{tip ? `${tip.p} · ${hourLabel(tip.h)} ET · ${tip.c.n} sampled · ${tip.c.cleared} cleared · best ${fmtPct(tip.c.best)}` : `busiest hour ${hourLabel(busiest)} ET · ${hours.timezone}`}</span>
      </div>
    </div>
  )
}

/** X = gas at the time, Y = best net result in USD. Where the cloud sits tells timing from routing. */
function GasScatter({ points, threshold }) {
  const [ref, width] = useWidth()
  const [tip, setTip] = useState(null)
  const pts = (points || []).filter(p => Number.isFinite(p.gasUsd) && Number.isFinite(Number(p.netUsd)))
  if (!pts.length) return <div className="edge-empty">One dot per quoted round trip: gas cost at the time against the best net result. If dots sit under zero only when gas is high, the fix is timing; if everywhere, routing or size.</div>
  const H = 220, L = 54, R = 12, T = 10, B = 28
  const xs = pts.map(p => p.gasUsd), ys = pts.map(p => Number(p.netUsd))
  const xMin = 0, xMax = Math.max(0.01, ...xs) * 1.05
  const sortedAbs = ys.map(Math.abs).sort((a, b) => a - b)
  const p95 = sortedAbs[Math.min(sortedAbs.length - 1, Math.floor(sortedAbs.length * 0.95))] || 0.05
  const yAbs = Math.max(0.02, p95)
  const yMax = yAbs * 1.1, yMin = -yAbs * 1.1
  const clamp = (v) => Math.max(yMin, Math.min(yMax, v))
  const clipped = ys.filter(v => v > yMax || v < yMin).length
  const x = (v) => L + ((v - xMin) / (xMax - xMin)) * (width - L - R)
  const y = (v) => T + ((yMax - v) / (yMax - yMin)) * (H - T - B)
  const ticksY = [yMin * 0.8, yMin * 0.4, 0, yMax * 0.4, yMax * 0.8]
  const ticksX = [0, xMax * 0.25, xMax * 0.5, xMax * 0.75]
  const under = pts.filter(p => Number(p.netUsd) < 0).length
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <svg className="chart-svg" width={width} height={H} role="img" aria-label="Gas cost against best net result">
        {ticksY.map((v, i) => <g key={i}><line x1={L} x2={width - R} y1={y(v)} y2={y(v)} className="grid-line" /><text x={L - 6} y={y(v) + 3} textAnchor="end" className="axis-text">{fmtUsd(v)}</text></g>)}
        {ticksX.map((v, i) => <text key={i} x={x(v)} y={H - 8} textAnchor="middle" className="axis-text">{fmtUsd(v, 3)}</text>)}
        <line x1={L} x2={width - R} y1={y(0)} y2={y(0)} className="edge-rule-zero" />
        <text x={width - R} y={T + 10} textAnchor="end" className="svg-muted">gas per round trip →</text>
        {pts.map((p, i) => (
          <circle key={i} cx={x(p.gasUsd)} cy={y(clamp(Number(p.netUsd)))} r={p.fired ? 5 : p.clears ? 4.5 : 3.2} className={`scatter-pt ${p.fired ? 'fired' : p.clears ? 'cleared' : ''}`} style={Number(p.netUsd) > yMax || Number(p.netUsd) < yMin ? { fillOpacity: 0.25 } : undefined}
            onMouseEnter={() => setTip({ ...p, px: x(p.gasUsd), py: y(Number(p.netUsd)) })} onMouseLeave={() => setTip(null)} />
        ))}
      </svg>
      {tip ? (
        <div className="edge-tooltip" style={{ left: Math.min(width - 190, tip.px + 10), top: Math.max(0, tip.py - 60) }}>
          <div className="edge-tooltip-time">{new Date(tip.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {tip.symbol}</div>
          <div className="edge-tooltip-row"><span>{tip.route}</span></div>
          <div className="edge-tooltip-row"><span>net</span><span>{fmtUsd(tip.netUsd)} · {fmtEth(tip.netEth)}</span></div>
          <div className="edge-tooltip-row"><span>spread after fees</span><span>{fmtPct(tip.netSpreadPct)}</span></div>
          <div className="edge-tooltip-row"><span>gas</span><span>{fmtUsd(tip.gasUsd, 3)} · {tip.gasGwei} gwei</span></div>
        </div>
      ) : null}
      <div className="chart-foot">{pts.length} round trips · {under} under zero{clipped ? ` · ${clipped} beyond the 95th percentile pinned to the edge` : ''} · gold = cleared gas and fees · green = would have fired at {Number(threshold).toFixed(2)}% · zero solid</div>
    </div>
  )
}

/** Price impact vs size for the best candidate: where the curve crosses zero is the largest profitable size. */
function DepthCurve({ candidate }) {
  const [ref, width] = useWidth()
  const rows = (candidate?.ladder || []).filter(r => Number.isFinite(Number(r.netEth)))
  if (rows.length < 2) return <div className="edge-empty">The depth curve draws the best candidate's net result across the five quoted sizes; the zero crossing is the largest size that still pays.</div>
  const H = 200, L = 60, R = 16, T = 12, B = 30
  const sizes = rows.map(r => Number(r.sizeEth))
  const nets = rows.map(r => Number(r.netEth))
  const xMin = Math.log10(Math.min(...sizes)), xMax = Math.log10(Math.max(...sizes))
  const yAbs = Math.max(1e-6, ...nets.map(Math.abs))
  const x = (s) => L + ((Math.log10(s) - xMin) / Math.max(1e-9, xMax - xMin)) * (width - L - R)
  const y = (v) => T + ((yAbs - v) / (2 * yAbs)) * (H - T - B)
  const path = rows.map((r, i) => `${i ? 'L' : 'M'}${x(sizes[i])},${y(nets[i])}`).join(' ')
  const area = `${path} L${x(sizes[sizes.length - 1])},${y(0)} L${x(sizes[0])},${y(0)} Z`
  // zero crossing by linear interpolation between the last positive and the first negative size
  let cross = null
  for (let i = 1; i < rows.length; i++) {
    if (nets[i - 1] >= 0 && nets[i] < 0) { const t = nets[i - 1] / (nets[i - 1] - nets[i]); cross = Math.pow(10, Math.log10(sizes[i - 1]) + t * (Math.log10(sizes[i]) - Math.log10(sizes[i - 1]))); break }
  }
  const peak = rows[nets.indexOf(Math.max(...nets))]
  return (
    <div ref={ref}>
      <div className="edge-ladder-title">{candidate.symbol} · {candidate.buyDex} → {candidate.sellDex} · {fmtPct(candidate.netSpreadPct ?? candidate.spreadPct, 3)} after fees</div>
      <svg className="chart-svg" width={width} height={H} role="img" aria-label="Net result by trade size">
        {[-yAbs, -yAbs / 2, 0, yAbs / 2, yAbs].map((v, i) => <g key={i}><line x1={L} x2={width - R} y1={y(v)} y2={y(v)} className="grid-line" /><text x={L - 6} y={y(v) + 3} textAnchor="end" className="axis-text">{fmtEth(v, 5).replace(' ETH', '')}</text></g>)}
        <path d={area} className={peak && nets[nets.indexOf(Math.max(...nets))] > 0 ? 'depth-area' : 'depth-area-neg'} />
        <line x1={L} x2={width - R} y1={y(0)} y2={y(0)} className="edge-rule-zero" />
        <path d={path} className="depth-line" />
        {rows.map((r, i) => <g key={r.sizeEth}><title>{`${r.sizeEth} ETH → ${fmtEth(nets[i])} (${fmtUsd(r.netUsd)})`}</title><circle cx={x(sizes[i])} cy={y(nets[i])} r={4.5} className={`depth-dot ${nets[i] > 0 ? 'pos' : ''}`} /><text x={x(sizes[i])} y={H - 10} textAnchor="middle" className="axis-text">{r.sizeEth} ETH</text></g>)}
        {cross ? <g><line x1={x(cross)} x2={x(cross)} y1={T} y2={H - B} className="edge-rule-threshold" /><text x={x(cross) + 4} y={T + 10} className="svg-text">pays up to ≈{cross.toFixed(3)} ETH</text></g> : null}
      </svg>
      <div className="chart-foot">net ETH after pool fees, gas and the flash-loan fee, log-scaled sizes · {peak ? `peak ${fmtEth(Number(peak.netEth))} at ${peak.sizeEth} ETH` : ''}{cross ? '' : nets.every(v => v < 0) ? ' · under zero at every size: gas is the binding cost' : ''}</div>
    </div>
  )
}

/** One bar per pair, one segment per pool, length = WETH in the pool, color = DEX. Where is the book thick? */
function LiquidityProfile({ venues }) {
  const rows = useMemo(() => {
    const by = {}
    for (const v of venues || []) {
      const sym = v.symbol || v.pair
      const [t1, t0] = String(sym).split('/') // symbol is token1/token0; reserves.token0 is in token0 units
      const r = v.reserves || {}
      const weth = v.wethSide ? Number(r[v.wethSide]) : t0 === 'WETH' ? Number(r.token0) : t1 === 'WETH' ? Number(r.token1) : Number(r.token1)
      if (!Number.isFinite(weth)) continue
      const row = by[sym] || (by[sym] = { symbol: sym, pools: [], total: 0, unit: v.wethSide ? 'WETH' : String(sym).includes('/') ? (String(sym).includes('WETH') ? 'WETH' : String(sym).split('/')[0]) : 'units' })
      row.pools.push({ key: v.key, dex: v.dex, weth })
      row.total += weth
    }
    return Object.values(by).map(r => ({ ...r, pools: r.pools.sort((a, b) => b.weth - a.weth) })).sort((a, b) => b.total - a.total)
  }, [venues])
  if (!rows.length) return <div className="edge-empty">The liquidity profile shows, per pair, how much WETH sits in each pool the bot prices, stacked by venue. Thick books take size; thin ones move.</div>
  const max = Math.max(1, ...rows.map(r => r.total))
  const kinds = [...new Set(rows.flatMap(r => r.pools.map(p => p.dex || String(p.key).split(' ')[0])))]
  return (
    <div>
      {rows.map(r => (
        <div key={r.symbol} className="liq-row">
          <span className="lbl" title={`${r.pools.length} pools`}>{r.symbol}</span>
          <div className="liq-bar" style={{ width: `${Math.max(8, (r.total / max) * 100)}%` }}>
            {r.pools.map(p => <i key={p.key} style={{ '--c': dexVar(p.dex || p.key), flex: `${p.weth} 0 0` }} title={`${p.key} · ${p.weth >= 100 ? p.weth.toFixed(0) : p.weth.toFixed(2)} ${r.unit}`} />)}
          </div>
          <span className="v">{r.total >= 1000 ? `${(r.total / 1000).toFixed(1)}k` : r.total >= 100 ? r.total.toFixed(0) : r.total.toFixed(1)} {r.unit}</span>
        </div>
      ))}
      <div className="chart-foot">one segment per pool, colored by venue: {kinds.map(k => <span key={k} className="venue" style={{ '--c': dexVar(k), '--c-text': dexTextVar(k) }}><i />{k}</span>)} · hover a segment for the pool</div>
    </div>
  )
}

export default function Readings() {
  const { edge, venues, readings, threshold, settings } = useSelector(s => s.bot)
  const th = Number((isStaticHost() ? (threshold ?? settings?.priceDifference) : (settings?.priceDifference ?? threshold)) ?? 0.3) // the snapshot's threshold on the public copy
  if (!edge?.enabled && !readings?.hours) return null
  const candidate = edge?.best || edge?.last
  return (
    <section className="panel" aria-label="Readings">
      <div className="panel-h">
        <div className="row">
          <h2 className="h2"><i className="ph-duotone ph-chart-scatter" aria-hidden="true" />Readings</h2>
          <span className="meta">across the candidate log · {readings?.hours?.days || 7} days · fire threshold {th.toFixed(2)}% on every spread axis</span>
        </div>
      </div>
      <div className="readings">
        <div className="readings-cell"><h3 className="edge-h3">When the edge shows up · candidates by hour of day (ET)</h3><HourHeatmap hours={readings?.hours} threshold={th} /></div>
        <div className="readings-cell"><h3 className="edge-h3">Gas against net · is it timing or routing?</h3><GasScatter points={readings?.scatter} threshold={th} /></div>
        <div className="readings-cell"><h3 className="edge-h3">Depth curve · the best candidate's net by size</h3><DepthCurve candidate={candidate} /></div>
        <div className="readings-cell"><h3 className="edge-h3">Liquidity profile · WETH in each pool, by venue</h3><LiquidityProfile venues={venues?.length ? venues : edge?.venues} /></div>
      </div>
      <Explain>
        <p>Four readings Fortuna suggested from the perps side, in chart forms a trader already knows. The <b>heatmap</b> is rows of pairs by hour of day: darker cells sampled more candidates, a gold ring means one cleared costs in that hour, a green ring means one would have fired. If the edge keeps hours, the study should weight them. The <b>scatter</b> puts every quoted round trip at its gas cost and its best net result; a cloud under zero only at high gas says timing, a cloud under zero everywhere says routing or size.</p>
        <p>The <b>depth curve</b> is price impact against size for the best candidate: where it crosses zero is the largest size that still pays, and where it peaks is the size to quote. The <b>liquidity profile</b> is the DEX analogue of a volume profile: how much WETH each pool holds, stacked by venue, so you can see at a glance where the book is thick enough to take size.</p>
      </Explain>
    </section>
  )
}
