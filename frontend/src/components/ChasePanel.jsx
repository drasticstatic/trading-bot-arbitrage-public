import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Explain from './Explain'
import { dexVar, dexTextVar } from '../lib/dex'

/* The chase — the three questions the next build answers, read from the same monitor-only study:
 *   Triangles  does a three-pair cycle come back with more than it left with, after fees?
 *   Lifetimes  how many blocks does a dislocation stay open, and who closes it?
 *   The wire   how fast does this machine hear Arbitrum, and from whom?
 * Together they say whether the edge is a routing problem, a latency problem, or an infrastructure
 * problem — before a wallet is funded. Hand-rolled SVG, the fleet palette. */

const pct = (n, d = 3) => (Number.isFinite(Number(n)) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(d)}%` : '—')
const eth = (n, d = 5) => (Number.isFinite(Number(n)) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(d)} ETH` : '—')
const secs = (ms) => (Number.isFinite(Number(ms)) ? `${(Number(ms) / 1000).toFixed(1)} s` : '—')
const when = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—')

/** A small line of the last hour of after-fee readings for one triangle, with the zero line drawn. */
function Spark({ points, w = 96, h = 22 }) {
  const ys = (points || []).map(p => Number(p.n)).filter(Number.isFinite)
  if (ys.length < 2) return <svg className="spark" width={w} height={h} aria-hidden="true" />
  const lo = Math.min(0, ...ys)
  const hi = Math.max(0, ...ys)
  const span = hi - lo || 1
  const x = (i) => (i / (ys.length - 1)) * (w - 2) + 1
  const y = (v) => h - 2 - ((v - lo) / span) * (h - 4)
  const d = ys.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = ys[ys.length - 1]
  return (
    <svg className="spark" width={w} height={h} role="img" aria-label={`last hour, now ${pct(last)}`}>
      <line x1="1" x2={w - 1} y1={y(0)} y2={y(0)} stroke="var(--line-2)" strokeDasharray="2 3" />
      <path d={d} fill="none" stroke={last >= 0 ? 'var(--good)' : 'var(--text-2)'} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={x(ys.length - 1)} cy={y(last)} r="2.2" fill={last >= 0 ? 'var(--good)' : 'var(--text-2)'} />
    </svg>
  )
}

function Triangles({ tri }) {
  const rows = (tri?.list || []).slice(0, 8)
  if (!rows.length) return <div className="edge-empty">Triangles appear once three live pairs share their corners (ARB, WETH and USDC, say). Each poll the same-block prices are walked around every cycle, best venue per leg, after each pool's fee.</div>
  const sims = tri?.sims || []
  const lastSim = sims[0]
  return (
    <div>
      <div className="table-wrap" style={{ maxHeight: 330 }}>
        <table className="table table--tight">
          <thead><tr><th>Cycle · best venue per leg</th><th className="t-right">After fees</th><th>Last hour</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.tri} className={r.netPct > 0 ? 'tr-opp' : ''}>
                <td>
                  <span className="tri-cycle">{r.cycle.split('→').map((t, i, a) => <React.Fragment key={i}><span className="pair">{t}</span>{i < a.length - 1 ? <span className="arrow">→</span> : null}</React.Fragment>)}</span>
                  <span className="td-sub tri-legs">{r.legs.map((l, i) => <span key={i} className="venue" style={{ '--c': dexVar(l.venue), '--c-text': dexTextVar(l.venue) }}><i />{l.venue}</span>)}</span>
                </td>
                <td className="t-right num"><span className={r.netPct > 0 ? 'good' : 'muted'}>{pct(r.netPct)}</span><span className="td-sub">{pct(r.grossPct)} gross · {Number(r.feesPct).toFixed(2)}% fees</span></td>
                <td><Spark points={tri?.series?.[r.tri]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="heat-legend">
        <span className="num">{tri?.best ? `best seen ${pct(tri.best.netPct)} ${tri.best.cycle} at ${when(tri.best.t)}` : 'no reading yet'}</span>
        {lastSim ? <span className="num">{`quoted ${when(lastSim.t)}: ${lastSim.cycle} → ${lastSim.best ? `${eth(lastSim.best.netEth)} at ${lastSim.best.sizeEth} ETH${lastSim.clears ? ', clears gas' : ''}` : lastSim.error || 'no quote'}`}</span> : null}
      </div>
    </div>
  )
}

function Lifetimes({ chases, blocksPerPoll }) {
  const s = chases?.summary
  const recent = chases?.recent || []
  const active = chases?.active
  const [tip, setTip] = useState(null)
  if (!s || !s.count) {
    return (
      <div className="edge-empty">
        {active ? <>Chasing <b>{active.symbol}</b> {active.route} now — {active.samples} blocks sampled so far.<br /></> : null}
        No route has crossed the chase floor ({Number(chases?.settings?.floorPct ?? 0.05).toFixed(2)}% after fees) yet. When one does, the bot follows it block by block until it closes and asks the chain who closed it: a swap on one of the venues, or drift.
      </div>
    )
  }
  const max = Math.max(1, ...s.hist.map(b => b.n))
  const pollBucket = s.hist.findIndex(b => { const top = Number(String(b.label).split(/[–+]/).pop()) || Infinity; return (blocksPerPoll || 60) <= top })
  return (
    <div>
      <div className="row" style={{ gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
        <div className="stat"><span className="stat-v sm">{s.count}</span><span className="stat-l">chases</span></div>
        <div className="stat"><span className="stat-v sm">{s.medianLifetimeBlocks ?? '—'}</span><span className="stat-l">median blocks</span></div>
        <div className="stat"><span className="stat-v sm">{secs(s.medianLifetimeMs)}</span><span className="stat-l">median life</span></div>
        <div className="stat"><span className={`stat-v sm ${s.reachableByPoller ? 'good' : ''}`}>{s.reachableByPoller} of {s.count}</span><span className="stat-l">outlived a poll + a tx</span></div>
        <div className="stat"><span className="stat-v sm">{s.closedBySwap}</span><span className="stat-l">closed by a swap</span></div>
      </div>
      <div className="life-hist" role="img" aria-label="Dislocation lifetimes in blocks">
        {s.hist.map((b, i) => (
          <div key={b.label} className={`life-col ${i === pollBucket ? 'is-poll' : ''}`} onMouseEnter={() => setTip(b)} onMouseLeave={() => setTip(null)}>
            <div className="life-bar-wrap"><div className="life-bar" style={{ height: `${(b.n / max) * 100}%` }}>{b.open ? <i style={{ height: `${(b.open / Math.max(1, b.n)) * 100}%` }} /> : null}</div></div>
            <span className="life-lbl">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="heat-legend">
        <span><i style={{ background: 'var(--indigo)' }} />closed</span>
        <span><i style={{ background: 'var(--good)' }} />still open at the budget</span>
        <span><i style={{ background: 'transparent', boxShadow: 'inset 0 0 0 2px var(--warn)' }} />where one {Math.round((s.pollMs || 15000) / 1000)} s poll lands (≈ {blocksPerPoll || '60'} blocks)</span>
        <span className="num">{tip ? `${tip.label} blocks · ${tip.n} chase${tip.n === 1 ? '' : 's'}${tip.open ? ` · ${tip.open} still open` : ''}` : `floor ${Number(s.floorPct).toFixed(2)}% after fees`}</span>
      </div>
      {recent.length ? (
        <div className="table-wrap" style={{ maxHeight: 220, marginTop: 10 }}>
          <table className="table table--tight">
            <thead><tr><th>When</th><th>Pair · route</th><th className="t-right">Lived</th><th className="t-right">Peak</th><th>Closed by</th></tr></thead>
            <tbody>
              {recent.slice(0, 8).map((r, i) => (
                <tr key={i}>
                  <td className="num muted">{when(r.ts)}</td>
                  <td><span className="pair">{r.symbol || r.pair}</span><span className="td-sub">{r.route}</span></td>
                  <td className="t-right num">{r.lifetimeBlocks ?? '—'} blk · {secs(r.lifetimeMs)}</td>
                  <td className={`t-right num ${r.maxNet > 0 ? 'good' : 'muted'}`}>{pct(r.maxNet)}</td>
                  <td className="muted">{r.closed ? (r.closedBy?.kind === 'swap' ? <span className="pill pill--signal">swap</span> : r.closedBy?.kind === 'liquidity' ? <span className="pill pill--warn">liquidity</span> : <span className="pill">drift</span>) : <span className="pill pill--good">still open</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function Wire({ infra }) {
  if (!infra?.endpoints?.length) return <div className="edge-empty">The wire is measured nightly by <code>scripts/rpc-probe.js</code>: round trips to the configured RPC and to public endpoints, how far each head sits behind the freshest, and the block cadence this machine actually sees.</div>
  const eps = infra.endpoints
  const max = Math.max(1, ...eps.map(e => Number(e.callMs) || Number(e.rttMs) || 0))
  const cad = infra.cadence
  return (
    <div>
      <div className="wire">
        {eps.map((e, i) => (
          <div key={i} className={`wire-row ${e.label === 'configured' ? 'is-ours' : ''}`}>
            <span className="wire-lbl"><b>{e.label === 'configured' ? 'ours' : 'public'}</b> {e.host}</span>
            <span className="wire-bars">
              <span className="wire-bar rtt" style={{ width: `${((Number(e.rttMs) || 0) / max) * 100}%` }} title="eth_blockNumber round trip" />
              <span className="wire-bar call" style={{ width: `${((Number(e.callMs) || 0) / max) * 100}%` }} title="one Multicall3 eth_call round trip" />
            </span>
            <span className="num wire-num">{e.ok ? `${Math.round(e.rttMs)} · ${Math.round(e.callMs)} ms` : 'no answer'}</span>
            <span className={`num wire-lag ${e.headLagBlocks > 2 ? 'muted' : 'good'}`}>{e.headLagBlocks === null || e.headLagBlocks === undefined ? '' : e.headLagBlocks === 0 ? 'at the head' : `${e.headLagBlocks} blk behind`}</span>
          </div>
        ))}
      </div>
      <div className="heat-legend">
        <span><i style={{ background: 'var(--indigo)' }} />block number</span>
        <span><i style={{ background: 'var(--cyan)' }} />one price read (eth_call)</span>
        <span className="num">{cad ? `cadence ${cad.blocksPerSecond}/s · median ${cad.medianBlockMs ?? '—'} ms per block · one ${Math.round((infra.pollMs || 15000) / 1000)} s poll ≈ ${infra.blocksPerPoll ?? '—'} blocks` : ''} · measured {new Date(infra.generatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    </div>
  )
}

export default function ChasePanel() {
  const edge = useSelector(s => s.bot.edge)
  const infra = useSelector(s => s.bot.readings?.infra)
  const tri = edge?.triangles
  const chases = edge?.chases
  const positive = (tri?.list || []).filter(r => r.netPct > 0).length
  const ours = infra?.endpoints?.find(e => e.label === 'configured')
  return (
    <section className="panel" aria-label="The chase">
      <div className="panel-h">
        <div className="row">
          <h2 className="h2"><i className="ph-duotone ph-path" aria-hidden="true" />The chase</h2>
          <span className="meta">three questions the next build answers, read from the same study: routing, time, and the wire</span>
        </div>
        <span className="row">
          {tri?.list?.length ? <span className={`pill ${positive ? 'pill--good' : ''}`}>{tri.list.length} triangle{tri.list.length === 1 ? '' : 's'} · {positive} positive after fees</span> : null}
          {chases?.summary?.count ? <span className="pill">{chases.summary.count} chase{chases.summary.count === 1 ? '' : 's'} · median {chases.summary.medianLifetimeBlocks} blocks</span> : chases?.active ? <span className="pill pill--signal">chasing {chases.active.symbol}</span> : null}
          {ours?.ok ? <span className="pill">wire {Math.round(ours.callMs)} ms</span> : null}
        </span>
      </div>
      <div className="readings readings--three">
        <div className="readings-cell"><h3 className="edge-h3">Triangles · three-pair cycles, best venue per leg, after fees</h3><Triangles tri={tri} /></div>
        <div className="readings-cell"><h3 className="edge-h3">Lifetimes · how long a dislocation stays open, in blocks</h3><Lifetimes chases={chases} blocksPerPoll={infra?.blocksPerPoll} /></div>
        <div className="readings-cell"><h3 className="edge-h3">The wire · how fast this machine hears Arbitrum</h3><Wire infra={infra} /></div>
      </div>
      <Explain>
        <p>The edge study asks whether the same pair is priced apart on two venues. These three readings ask what it would take to <b>act</b> on that, measured instead of argued, before a wallet is funded.</p>
        <p><b>Triangles.</b> Three pairs that share corners form a cycle: WETH → USDC → ARB → WETH. Each leg is taken on its best venue after that pool's fee, and the product of the three rates says what one unit comes back as. Positive after fees means the three markets disagree with each other at that block; the bot then quotes the whole cycle at the size ladder, like the two-leg trade, and says whether it would have cleared gas. A triangle never needs two venues for the same pair, so it is the first <b>multi-hop</b> route, with the same monitor-only rule.</p>
        <p><b>Lifetimes.</b> A poll reads every venue once every 15 seconds; Arbitrum makes a block about every quarter second. When a route crosses the chase floor after fees, the bot re-reads that pair's venues as fast as the RPC answers, labels each sample with its block, stops when the route falls back under the floor, then asks <code>eth_getLogs</code> who closed it: a swap on one of the venues in the closing block, or drift. If most dislocations outlive a poll plus a transaction, a careful poller can take them; if they close in a block or two, only block-level infrastructure ever will — a sequencer feed, a co-located node, a <b>backrun</b> in the same block as the swap that opened it. The histogram marks where one poll lands.</p>
        <p><b>The wire.</b> Nightly, the probe times the configured RPC against public ones, checks whose head is freshest, and watches the block cadence for a few seconds. A private or co-located endpoint earns its cost only if the lifetimes say the race is lost on the wire; this is the number to compare against.</p>
      </Explain>
    </section>
  )
}
