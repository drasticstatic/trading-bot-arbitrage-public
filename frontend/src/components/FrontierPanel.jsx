import React from 'react'
import { useSelector } from 'react-redux'
import Explain from './Explain'
import { dexVar, dexTextVar } from '../lib/dex'

/* The frontier — four scouts for the ecosystems next to this bot's edge, read from public sources
 * once an hour (scripts/frontier.js): cross-chain intent filling, fixed-vs-variable rates, the TON
 * liquidity layer, tokenised treasuries. Each card is a reading, not a strategy: it says what the
 * market offers today so the decision to build there is made on a number. */

const pct = (n, d = 3) => (Number.isFinite(Number(n)) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(d)}%` : '—')
const apy = (n, d = 2) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(d)}%` : '—')
const usd = (n) => (Number.isFinite(Number(n)) ? `$${Math.round(Number(n)).toLocaleString()}` : '—')
const big = (n) => (!Number.isFinite(Number(n)) ? '—' : Number(n) >= 1e9 ? `$${(Number(n) / 1e9).toFixed(2)}B` : Number(n) >= 1e6 ? `$${(Number(n) / 1e6).toFixed(1)}M` : usd(n))
const firstSentence = (s) => String(s || '').split(/(?<=\.)\s/)[0]

function Intents({ d }) {
  const rows = d?.across?.corridors || []
  if (!rows.length) return <div className="edge-empty">No corridor answered yet.</div>
  const max = Math.max(0.001, ...rows.flatMap(r => r.quotes.map(q => q.relayFeePct || 0)))
  return (
    <div>
      <div className="fr-rows">
        {rows.map(r => {
          const small = r.quotes[0]; const large = r.quotes[1] || r.quotes[0]
          return (
            <div key={r.name} className="fr-row">
              <span className="fr-lbl">{r.name}</span>
              <span className="fr-bars">
                <span className="fr-bar a" style={{ width: `${((small?.relayFeePct || 0) / max) * 100}%` }} title={`fee at ${small?.sizeUsd ? usd(small.sizeUsd) : small?.size}`} />
                <span className="fr-bar b" style={{ width: `${((large?.relayFeePct || 0) / max) * 100}%` }} title={`fee at ${large?.sizeUsd ? usd(large.sizeUsd) : large?.size}`} />
              </span>
              <span className="num fr-num">{pct(small?.relayFeePct, 3)} · {pct(large?.relayFeePct, 3)}</span>
              <span className="num fr-sub">{r.fillSec != null ? `${r.fillSec} s` : '—'} · instant to {big(r.maxInstantUsd)}</span>
            </div>
          )
        })}
      </div>
      <div className="heat-legend">
        <span><i style={{ background: 'var(--indigo)' }} />fee at the small size</span>
        <span><i style={{ background: 'var(--cyan)' }} />at the large size</span>
        <span className="num">{d?.uniswapx ? `UniswapX open orders on Arbitrum: ${d.uniswapx.openOrders}` : ''}</span>
      </div>
    </div>
  )
}

function Rates({ d }) {
  if (!d) return <div className="edge-empty">No rate reading yet.</div>
  const items = []
  for (const a of (d.aave || []).filter(x => /^(USDC|USDT|WETH|WBTC|ARB)$/.test(x.symbol)).slice(0, 4)) {
    items.push({ kind: 'variable', label: `Aave ${a.symbol} supply`, v: a.supplyApyPct })
    if (Number.isFinite(a.borrowApyPct) && /^(USDC|USDT)$/.test(a.symbol)) items.push({ kind: 'borrow', label: `Aave ${a.symbol} borrow`, v: a.borrowApyPct })
  }
  for (const p of (d.pendle || []).slice(0, 4)) {
    items.push({ kind: 'fixed', label: `Pendle ${p.name} ${p.expiry.slice(0, 7)} fixed`, v: p.impliedApyPct, tick: p.underlyingApyPct > 0 ? p.underlyingApyPct : null })
  }
  for (const f of (d.funding || []).slice(0, 5)) items.push({ kind: 'funding', label: `${f.coin} perp funding`, v: f.annualPct })
  const max = Math.max(1, ...items.map(i => Math.abs(i.v || 0)), ...items.map(i => i.tick || 0))
  return (
    <div>
      <div className="fr-rows">
        {items.map((it, i) => (
          <div key={i} className="fr-row fr-row--rate">
            <span className="fr-lbl">{it.label}</span>
            <span className="fr-bars one">
              <span className={`fr-bar ${it.kind}`} style={{ width: `${(Math.max(0, it.v || 0) / max) * 100}%` }} />
              {it.tick != null ? <i className="fr-tick" style={{ left: `${(it.tick / max) * 100}%` }} title={`variable leg ${apy(it.tick)}`} /> : null}
            </span>
            <span className="num fr-num">{apy(it.v)}{it.tick != null ? <span className="muted"> vs {apy(it.tick)}</span> : null}</span>
          </div>
        ))}
      </div>
      <div className="heat-legend">
        <span><i style={{ background: 'var(--indigo)' }} />variable (Aave supply)</span>
        <span><i style={{ background: 'var(--warn)' }} />borrow</span>
        <span><i style={{ background: 'var(--cyan)' }} />fixed (Pendle implied)</span>
        <span><i style={{ background: 'var(--pink)' }} />perp funding, annualised</span>
        <span><i style={{ background: 'transparent', boxShadow: 'inset 0 0 0 2px var(--text-2)', width: 3 }} />the fixed market's own variable leg</span>
      </div>
    </div>
  )
}

function Ton({ d }) {
  const rows = (d?.top || []).slice(0, 8)
  if (!rows.length) return <div className="edge-empty">No TON pair priced on two venues above the floor yet.</div>
  return (
    <div className="table-wrap" style={{ maxHeight: 300 }}>
      <table className="table table--tight">
        <thead><tr><th>Pair</th><th>Cheap → rich</th><th className="t-right">After fees</th><th className="t-right">Thin leg</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.pair} className={r.netPct > 0 ? 'tr-opp' : ''}>
              <td><span className="pair">{r.pair}</span><span className="td-sub">{r.pools} pools</span></td>
              <td><span className="route"><span className="venue" style={{ '--c': dexVar(r.cheap.dex), '--c-text': dexTextVar(r.cheap.dex) }}><i />{r.cheap.name}</span><span className="arrow">→</span><span className="venue" style={{ '--c': dexVar(r.rich.dex), '--c-text': dexTextVar(r.rich.dex) }}><i />{r.rich.name}</span></span></td>
              <td className={`t-right num ${r.netPct > 0 ? 'good' : 'muted'}`}>{pct(r.netPct)}<span className="td-sub">{pct(r.grossPct)} · {Number(r.feesPct).toFixed(2)}% fees</span></td>
              <td className="t-right num">{usd(r.minLegUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Rwa({ d }) {
  const assets = (d?.assets || []).filter(a => a.pools > 0)
  if (!assets.length) return <div className="edge-empty">No tokenised-treasury pool above the floor yet.</div>
  return (
    <div className="fr-rows">
      {assets.map(a => {
        const lo = a.minPriceUsd; const hi = a.maxPriceUsd; const span = Math.max(1e-6, hi - lo)
        const pos = (p) => `${((p - lo) / span) * 100}%`
        return (
          <div key={a.symbol} className="fr-row fr-row--rwa">
            <span className="fr-lbl"><b>{a.symbol}</b> <span className="muted">{a.pools} pool{a.pools === 1 ? '' : 's'}</span></span>
            <span className="fr-range" title={`$${lo} to $${hi}; deepest pool on ${a.refNetwork} at $${a.refPriceUsd}`}>
              <span className="fr-range-line" />
              {a.rows.map((r, i) => <i key={i} className="fr-dot" style={{ left: pos(r.priceUsd), width: `${6 + Math.min(10, Math.log10(Math.max(10, r.reserveUsd)) - 3)}px`, height: `${6 + Math.min(10, Math.log10(Math.max(10, r.reserveUsd)) - 3)}px` }} title={`${r.pool} on ${r.network}: $${r.priceUsd} (${pct(r.vsRefPct, 2)} vs the deepest), ${big(r.reserveUsd)}`} />)}
              <i className="fr-ref" style={{ left: pos(a.refPriceUsd) }} />
            </span>
            <span className="num fr-num">${lo} – ${hi}</span>
            <span className={`num fr-sub ${a.dispersionPct > 1 ? 'good' : ''}`}>{pct(a.dispersionPct, 2)} apart · deepest {a.refNetwork} {big(a.refReserveUsd)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function FrontierPanel() {
  const f = useSelector(s => s.bot.readings?.frontier)
  const when = f?.generatedAt ? new Date(f.generatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null
  return (
    <section className="panel" aria-label="The frontier">
      <div className="panel-h">
        <div className="row">
          <h2 className="h2"><i className="ph-duotone ph-compass" aria-hidden="true" />The frontier</h2>
          <span className="meta">four ecosystems this engine could be pointed at, read from public sources{when ? ` · ${when}` : ''}</span>
        </div>
        {f ? <span className="row">{f.ton?.pairsWithTwoVenues != null ? <span className="pill">TON {f.ton.pairsWithTwoVenues} pairs on two venues</span> : null}{f.rwa?.assets ? <span className="pill">{f.rwa.assets.filter(a => a.pools).length} treasuries priced</span> : null}</span> : null}
      </div>
      {!f ? <div className="empty">The scouts run once an hour while the bot is up and nightly before the report: <code>node scripts/frontier.js</code>. Public sources only, no keys, nothing traded.</div> : (
        <div className="frontier-grid">
          <div className="fr-card"><h3 className="edge-h3">Intents · what a cross-chain filler is paid (Across, UniswapX)</h3><p className="fr-verdict">{firstSentence(f.intents?.verdict)}</p><Intents d={f.intents} /></div>
          <div className="fr-card"><h3 className="edge-h3">Rates · fixed, variable and funding on one axis (Pendle, Aave, Hyperliquid)</h3><p className="fr-verdict">{firstSentence(f.rates?.verdict)}</p><Rates d={f.rates} /></div>
          <div className="fr-card"><h3 className="edge-h3">TON · the pair census pointed at STON.fi and DeDust</h3><p className="fr-verdict">{firstSentence(f.ton?.verdict)}</p><Ton d={f.ton} /></div>
          <div className="fr-card"><h3 className="edge-h3">Tokenised treasuries · one token, every pool, against the deepest</h3><p className="fr-verdict">{firstSentence(f.rwa?.verdict)}</p><Rwa d={f.rwa} /></div>
        </div>
      )}
      <Explain>
        <p>Christopher's brief: the engine under this bot (multi-venue state, same-block pricing, quoted round trips, an order router) fits four specialised corners of web3 better than any pivot. Each corner gets a <b>scout</b> before it gets code: a read-only census of what the market offers today, so the decision to build there rests on a reading.</p>
        <p><b>Intents.</b> On Across, a user deposits on one chain and a filler fronts the tokens on the other; the filler is paid the relay fee shown here, per fill, and settles in seconds. The edge is capital turned over many times a day at a thin fee, not a spread. UniswapX's open-order count says how much Arbitrum intent flow there is to compete for.</p>
        <p><b>Rates.</b> Pendle splits a yield token into a fixed leg and a floating leg, so its implied APY is a fixed rate the market will pay today; the tick on each bar is that market's own variable leg. Aave supply and borrow are the variable benchmarks; perp funding, annualised, is what a basis trade collects. When fixed sits well above variable, or funding above the cost of carry, there is a structural position to measure.</p>
        <p><b>TON.</b> The same census the bot runs on Arbitrum, pointed at STON.fi and DeDust: pools grouped by the addresses of their two tokens, cheapest against richest after fees, weighted by the thin leg. Listings can be stale, so a pair more than 10% apart is left out as a listing disagreement rather than shown as an edge.</p>
        <p><b>Tokenised treasuries.</b> A treasury token has one net asset value and many pools; the deepest pool is the reference until an issuer NAV feed is wired in. Each dot is a pool, sized by depth; the gap between the cheapest and richest pool is what a redeem-or-arbitrage desk would look at first.</p>
      </Explain>
    </section>
  )
}
