import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Explain from './Explain'
import { dexVar, dexTextVar } from '../lib/dex'

const usd = (n) => (Number.isFinite(Number(n)) ? `$${Math.round(Number(n)).toLocaleString()}` : '—')
const pct = (n) => (Number.isFinite(Number(n)) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(3)}%` : '—')

/**
 * CensusPanel — the wider net. Every liquid pool on Arbitrum, grouped by pair, ranked by how far
 * apart two venues price the same pair after fees. The bot's own seven pairs are marked; the rest
 * are candidates for config.json, a human step.
 */
export default function CensusPanel() {
  const census = useSelector(s => s.bot.readings?.census)
  const [showAll, setShowAll] = useState(false)
  const rows = (census?.top || []).slice(0, showAll ? 40 : 12)
  const positive = (census?.top || []).filter(r => r.netPct > 0)

  return (
    <section className="panel" aria-label="Pair census">
      <div className="panel-h">
        <div className="row">
          <h2 className="h2"><i className="ph-duotone ph-fish-simple" aria-hidden="true" />The wider net</h2>
          <span className="meta">{census ? `${census.poolsSeen} pools censused ${new Date(census.generatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${census.pairsWithTwoVenues} pairs priced on two or more venues above ${usd(census.minPoolUsd)} per pool` : 'no census has run yet'}</span>
        </div>
        {census ? <span className="row"><span className={`pill ${positive.length ? 'pill--good' : ''}`}>{positive.length} {positive.length === 1 ? 'pair' : 'pairs'} apart after fees right now</span>{census.runs ? <span className="pill" title={census.since ? `since ${new Date(census.since).toLocaleString()}` : ''}>{census.runs} {census.runs === 1 ? 'run' : 'runs'} remembered</span> : null}</span> : null}
      </div>
      {!census ? (
        <div className="empty">Run <code>node scripts/pair-census.js</code> on the bot's machine, or wait for the nightly report. The census reads a public listing of Arbitrum's top pools and asks where the same pair is priced differently on two venues after fees. Nothing is traded or changed.</div>
      ) : (
        <>
          <div className="table-wrap" style={{ maxHeight: 520 }}>
            <table className="table">
              <thead>
                <tr><th>Pair</th><th>Cheap pool → rich pool</th><th className="t-right">Apart after fees</th><th className="t-right">Gross · fees</th><th className="t-right">Thin leg</th><th className="t-right">24h volume</th><th className="t-right" title="How many of the recent census runs found this pair apart after fees">Apart in</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.pair} className={r.netPct > 0 ? 'tr-opp' : ''}>
                    <td><span className="pair">{r.pair}</span><span className="td-sub">{r.pools} pools · {r.venues.join(', ')}</span></td>
                    <td>
                      <span className="route">
                        <span className="venue" style={{ '--c': dexVar(r.cheap.dex), '--c-text': dexTextVar(r.cheap.dex) }}><i />{r.cheap.name}</span>
                        <span className="arrow">→</span>
                        <span className="venue" style={{ '--c': dexVar(r.rich.dex), '--c-text': dexTextVar(r.rich.dex) }}><i />{r.rich.name}</span>
                      </span>
                      <span className="td-sub">{r.cheap.dex} {usd(r.cheap.reserveUsd)} · {r.rich.dex} {usd(r.rich.reserveUsd)}</span>
                    </td>
                    <td className={`t-right num ${r.netPct > 0 ? 'good' : 'muted'}`}>{pct(r.netPct)}</td>
                    <td className="t-right num muted">{pct(r.grossPct)} · {Number(r.feesPct).toFixed(2)}%</td>
                    <td className="t-right num">{usd(r.minLegUsd)}</td>
                    <td className="t-right num muted">{usd(r.volume24Usd)}</td>
                    <td className={`t-right num ${r.apartRuns > 1 ? 'good' : 'muted'}`}>{r.seenRuns ? `${r.apartRuns} of ${r.seenRuns}` : '—'}</td>
                    <td>{r.live ? <span className="pill pill--signal">live</span> : r.netPct > 0 ? <span className="pill pill--good">candidate</span> : <span className="pill">watch</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(census.top || []).length > 12 ? <div className="row" style={{ marginTop: 8 }}><button type="button" className="btn btn--sm btn--quiet" onClick={() => setShowAll(v => !v)}>{showAll ? 'Show the top 12' : `Show all ${census.top.length}`}</button></div> : null}
          <Explain>
            <p>The bot measures seven pairs precisely, every poll, in one block. This table asks a different question first: <b>across every liquid pool on Arbitrum, where is the same pair priced differently on two venues right now?</b> It reads GeckoTerminal's public listing (the network's top pools plus each tradable DEX's own top pools), groups pools by pair, and takes the richest and cheapest price minus both pools' fees.</p>
            <p>A listing's prices are seconds to a minute old, so a positive number here is a <b>candidate</b>, not a trade: the next step is adding the pair to <code>config.json</code> so the same-block multicall and the quoted round trip judge it properly. The <b>thin leg</b> is the smaller of the two pools, which caps the size; the ranking weights divergence by that depth so a thin pool's wild price does not top the list. <b>live</b> marks pairs the bot already watches. <b>Apart in</b> counts how many of the recent runs (hourly while the bot runs, and nightly) found the pair apart after fees: a one-off is noise, a pair apart run after run is the one to add.</p>
          </Explain>
        </>
      )}
    </section>
  )
}
