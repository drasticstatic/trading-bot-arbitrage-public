import React from 'react'
import { useSelector } from 'react-redux'

/* The rail — the live edge of the desk, pinned beside the page on wide screens so the newest
 * facts are always in view: the study clock, the last lines the bot wrote, the latest candidates,
 * where funding sits, the wire, and the frontier's four verdicts. Everything here is also on the
 * page below; the rail is the glance. */

const t = (ts) => (ts ? new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '')
const pct = (n, d = 3) => (Number.isFinite(Number(n)) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(d)}%` : '—')
const firstClause = (s) => String(s || '').split(/[;.]\s/)[0]

export default function Rail() {
  const { logs, candidates, screenerPairs, edge, readings, connected } = useSelector(s => s.bot)
  const costume = useSelector(s => !!s.bot.costume?.on)
  const tail = (logs || []).slice(-6).reverse()
  const cands = (candidates || []).slice(-5).reverse()
  const funding = (screenerPairs || []).filter(p => Number.isFinite(Number(p.funding?.rateAnnualized))).map(p => ({ symbol: p.symbol, apy: Number(p.funding.rateAnnualized) })).sort((a, b) => Math.abs(b.apy) - Math.abs(a.apy)).slice(0, 4)
  const ours = readings?.infra?.endpoints?.find(e => e.label === 'configured')
  const f = readings?.frontier
  const day = edge?.progress ? Math.min(edge.progress.targetDays, Math.floor(edge.progress.elapsedHours / 24) + 1) : null
  return (
    <aside className="rail-side" aria-label="Live rail">
      {edge?.progress ? (
        <div className="rail-mod">
          <div className="rail-h">Study clock</div>
          <div className="rail-clock"><b>day {day} of {edge.progress.targetDays}</b><div className="tb-progress"><i style={{ width: `${edge.progress.pct}%` }} /></div></div>
          <div className="rail-kv"><span>polls</span><span className="num">{edge.polls ?? '—'}</span><span>quoted</span><span className="num">{edge.simulated ?? '—'}</span><span>cleared</span><span className="num">{edge.cleared ?? 0}</span><span>would fire</span><span className="num">{edge.wouldFire ?? 0}</span></div>
        </div>
      ) : null}
      <div className="rail-mod">
        <div className="rail-h">Now <span className={`rail-dot ${connected ? 'on' : ''}`} /></div>
        {tail.length ? <ul className="rail-tail">{tail.map((l, i) => <li key={i} className={`lv-${String(l.level || 'info').toLowerCase()}`}><span className="num">{t(l.timestamp)}</span>{String(l.message || '').replace(/^[^\w]+/, '').slice(0, 96)}</li>)}</ul> : <div className="rail-empty">{costume ? 'The live tail needs the bot running; the public copy shows the nightly snapshot.' : 'Waiting for the first lines.'}</div>}
      </div>
      <div className="rail-mod">
        <div className="rail-h">Latest candidates</div>
        {cands.length ? <ul className="rail-list">{cands.map((c, i) => <li key={i}><span className="pair">{c.symbol}</span> <span className={`num ${c.wouldFire ? 'good' : c.clears ? 'warn' : 'muted'}`}>{pct(c.netSpreadPct ?? c.spreadPct)}</span><span className="td-sub">{c.buyDex} → {c.sellDex}{c.best ? ` · ${Number(c.best.netEth) >= 0 ? '+' : ''}${Number(c.best.netEth).toFixed(5)} ETH at ${c.best.sizeEth}` : ''}</span></li>)}</ul> : <div className="rail-empty">{edge?.best ? `Best so far: ${edge.best.symbol} ${pct(edge.best.netSpreadPct ?? edge.best.spreadPct)} after fees.` : 'No candidate quoted yet this session.'}</div>}
      </div>
      {funding.length ? (
        <div className="rail-mod">
          <div className="rail-h">Funding, annualised</div>
          <ul className="rail-list">{funding.map(x => <li key={x.symbol}><span className="pair">{x.symbol}</span> <span className={`num ${x.apy > 0 ? 'good' : 'bad'}`}>{pct(x.apy, 2)}</span><span className="td-sub">{x.apy > 0 ? 'longs pay shorts' : 'shorts pay longs'}</span></li>)}</ul>
        </div>
      ) : null}
      {f ? (
        <div className="rail-mod">
          <div className="rail-h">Frontier</div>
          <ul className="rail-list rail-list--tight">
            <li><b>Intents</b><span className="td-sub">{firstClause(f.intents?.verdict)}</span></li>
            <li><b>Rates</b><span className="td-sub">{firstClause(f.rates?.verdict)}</span></li>
            <li><b>TON</b><span className="td-sub">{firstClause(f.ton?.verdict)}</span></li>
            <li><b>Treasuries</b><span className="td-sub">{firstClause(f.rwa?.verdict)}</span></li>
          </ul>
        </div>
      ) : null}
      {ours?.ok ? (
        <div className="rail-mod">
          <div className="rail-h">The wire</div>
          <div className="rail-kv"><span>round trip</span><span className="num">{Math.round(ours.rttMs)} ms</span><span>one read</span><span className="num">{Math.round(ours.callMs)} ms</span><span>head</span><span className="num">{ours.headLagBlocks === 0 ? 'fresh' : `${ours.headLagBlocks} behind`}</span><span>a poll</span><span className="num">≈ {readings.infra.blocksPerPoll ?? '—'} blk</span></div>
        </div>
      ) : null}
    </aside>
  )
}
