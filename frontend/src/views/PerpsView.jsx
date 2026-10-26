import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import Tooltip from '../components/Tooltip'
import Explain from '../components/Explain'
import { isStaticHost } from '../store/websocket'

/**
 * PerpsView — the Hyperliquid perpetual next to spot for every pair that has one: the spot–perp
 * spread and the funding rate, ranked by how much funding there is to collect, with a calculator
 * for a delta-neutral position (long spot, short perp). Monitoring only; nothing here trades.
 */
const EXPECTED_UNAVAILABLE_PERP_MARKETS = ['MAGIC', 'GNS', 'GRAIL']
const expectedUnavailableToken = (symbol = '') => String(symbol).split('/').find(t => EXPECTED_UNAVAILABLE_PERP_MARKETS.includes(t)) || null
const fmt = (n, d = 2) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '—')
const fmtSigned = (n, d = 2) => (Number.isFinite(Number(n)) ? `${Number(n) > 0 ? '+' : Number(n) < 0 ? '−' : ''}${Math.abs(Number(n)).toFixed(d)}` : '—')
const usd = (n) => (Number.isFinite(Number(n)) ? `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : '—')

function SignedBar({ value, max, width = 120 }) {
  const v = Number(value) || 0
  const m = Math.max(1e-9, max)
  const half = width / 2
  const w = Math.min(half - 2, (Math.abs(v) / m) * (half - 2))
  return (
    <svg className="sparkbar" width={width} height={12} aria-hidden="true">
      <rect x={0} y={5} width={width} height={2} className="sbar-track" />
      <rect x={v >= 0 ? half : half - w} y={2} width={Math.max(1, w)} height={8} rx={2} className={v >= 0 ? 'sbar-pos' : 'sbar-neg'} />
    </svg>
  )
}

export default function PerpsView() {
  const { screenerPairs, perpStatus, screenerTimestamp } = useSelector(s => s.bot)
  const [capital, setCapital] = useState(10000)
  const demo = isStaticHost()

  const rows = useMemo(() => (screenerPairs || [])
    .filter(p => p.perp && p.perp.price)
    .map(p => {
      const prices = Object.values(p.prices || {}).map(Number).filter(v => Number.isFinite(v) && v > 0)
      const perpPx = Number(p.perp.price)
      const sp = Number(p.perp.spreadPct)
      // spot from the screener when it carries prices, else implied from the perp and its spread
      const spot = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : (Number.isFinite(sp) ? perpPx / (1 + sp / 100) : null)
      return {
        name: p.symbol || p.name,
        spot,
        perp: Number(p.perp.price),
        spreadPct: Number(p.perp.spreadPct),
        direction: p.perp.direction,
        signal: p.perp.signal,
        fundingRate: p.funding?.rate,
        apy: Number.isFinite(Number(p.funding?.rateAnnualized)) ? Number(p.funding.rateAnnualized) : null,
        next: p.funding?.nextTime
      }
    })
    .sort((a, b) => Math.abs(b.apy || 0) - Math.abs(a.apy || 0)), [screenerPairs])

  const best = rows.find(r => r.apy !== null && r.apy !== 0) || null
  const maxApy = Math.max(1, ...rows.map(r => Math.abs(r.apy || 0)))
  const income = best ? { daily: (capital * best.apy) / 100 / 365, monthly: (capital * best.apy) / 100 / 12, yearly: (capital * best.apy) / 100 } : null
  const hasSnapshot = Boolean(screenerTimestamp || (screenerPairs || []).length)
  const warming = hasSnapshot && perpStatus?.initialized && (!perpStatus?.lastFetchAt || (perpStatus?.fetchInFlight && rows.length === 0))
  const expectedUnavailable = Array.from(new Set((screenerPairs || []).map(p => (!p.perp ? expectedUnavailableToken(p.symbol) : null)).filter(Boolean)))
  const status = demo ? { label: 'not in the public demo', cls: '' }
    : !hasSnapshot ? { label: 'awaiting screener', cls: 'pill--signal' }
      : !perpStatus ? { label: 'status pending', cls: '' }
        : !perpStatus.initialized ? { label: 'perp venue unavailable', cls: 'pill--bad' }
          : warming ? { label: 'warming up', cls: 'pill--warn' }
            : perpStatus.fetchInFlight ? { label: 'refreshing', cls: 'pill--signal' }
              : { label: `${perpStatus.cachedPairs || 0} perp markets cached`, cls: 'pill--good' }

  return (
    <>
      <section className="panel">
        <div className="panel-h">
          <div className="row">
            <h2 className="h2">Perps</h2>
            <span className={`pill ${status.cls}`}>{status.label}</span>
            {perpStatus?.exchange ? <span className="meta">{perpStatus.exchange}</span> : null}
          </div>
        </div>

        {demo ? <div className="notice notice--quiet">Perp readings come from the live bot's Hyperliquid feed and are not part of the public snapshot. A public-safe perp dashboard is on the list.</div> : null}
        {!demo && !hasSnapshot ? <div className="notice">Waiting for the first screener snapshot before perp coverage can fill in.</div> : null}
        {warming ? <div className="notice notice--warn">Spot rows are live; Hyperliquid enrichment is still warming in the background.</div> : null}
        {expectedUnavailable.length ? <div className="notice notice--quiet">{expectedUnavailable.join(', ')} have no Hyperliquid market; those pairs are simply absent here.</div> : null}

        {rows.length ? (
          <p className="edge-finding" style={{ fontSize: 'clamp(16px, 1.6vw, 21px)' }}>
            <span className="edge-num">{rows.length}</span> of {(screenerPairs || []).length} screener pairs have a Hyperliquid perp.
            {best ? <> The richest funding right now is <span className="edge-num">{best.name}</span> at <span className="edge-num">{fmtSigned(best.apy, 1)}% APY</span>, which means {best.apy > 0 ? 'shorts pay longs' : 'longs pay shorts'}.</> : <> None of them is paying funding at the moment.</>}
          </p>
        ) : null}

        <div className="grid grid--2">
          <div>
            <h3 className="h3">Funding and spot–perp spread</h3>
            {rows.length === 0 ? <div className="empty">No perp rows yet.</div> : (
              <div className="table-wrap" style={{ maxHeight: 420 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pair</th>
                      <th className="t-right">Spot</th>
                      <th className="t-right">Perp</th>
                      <th className="t-right"><Tooltip text="Perp price relative to spot. Positive: the perp trades above spot."><span>Spread</span></Tooltip></th>
                      <th className="t-right"><Tooltip text="Funding rate as an annual percentage. Positive: shorts pay longs. Bar length is the size, color the sign."><span>Funding APY</span></Tooltip></th>
                      <th>Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.name}>
                        <td className="pair">{r.name}</td>
                        <td className="t-right num muted">{r.spot !== null ? usd(r.spot) : '—'}</td>
                        <td className="t-right num muted">{usd(r.perp)}</td>
                        <td className={`t-right num ${Math.abs(r.spreadPct) > 0.5 ? 'warn' : ''}`}>{fmtSigned(r.spreadPct, 3)}%</td>
                        <td className="t-right"><span className="row" style={{ justifyContent: 'flex-end', gap: 8, flexWrap: 'nowrap' }}><SignedBar value={r.apy} max={maxApy} /><span className={`num ${r.apy > 0 ? 'good' : r.apy < 0 ? 'bad' : 'muted'}`} style={{ minWidth: 64, textAlign: 'right' }}>{r.apy === null ? '—' : `${fmtSigned(r.apy, 1)}%`}</span></span></td>
                        <td><span className={`pill ${String(r.signal || '').includes('SHORT_PERP') ? 'pill--good' : 'pill--bad'}`}>{r.signal || '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="h3">Delta-neutral calculator</h3>
            {best ? (
              <>
                <div className="notice notice--quiet" style={{ marginBottom: 12 }}>
                  <div className="notice-t">{best.name} · <span className={`num ${best.apy > 0 ? 'good' : 'bad'}`}>{fmtSigned(best.apy, 1)}% APY</span></div>
                  Long spot, short the perp, collect funding while price exposure nets to zero. Funding is paid every eight hours and changes with the crowd.
                </div>
                <label className="field" style={{ maxWidth: 260 }}>
                  Capital (USD)
                  <input className="input" type="number" min={0} step={100} value={capital} onChange={e => setCapital(Number(e.target.value) || 0)} />
                </label>
                <div className="stats" style={{ marginTop: 14 }}>
                  <div className="stat"><span className={`stat-v ${income.daily >= 0 ? 'good' : 'bad'}`}>{usd(income.daily)}</span><span className="stat-l">per day</span></div>
                  <div className="stat"><span className={`stat-v ${income.monthly >= 0 ? 'good' : 'bad'}`}>{usd(income.monthly)}</span><span className="stat-l">per month</span></div>
                  <div className="stat"><span className={`stat-v ${income.yearly >= 0 ? 'good' : 'bad'}`}>{usd(income.yearly)}</span><span className="stat-l">per year at today's rate</span></div>
                </div>
                <p className="meta" style={{ marginTop: 10, maxWidth: '52ch' }}>Gross of trading fees, borrowing and the risk that funding flips. A rate this moment is not a rate for the year.</p>
              </>
            ) : <div className="empty">{demo ? 'Needs the live feed.' : 'Waiting for a pair with a funding rate.'}</div>}
          </div>
        </div>

        <Explain>
          <p>A <b>perpetual</b> is a futures contract with no expiry. To keep its price near spot, longs and shorts pay each other a <b>funding rate</b> every eight hours: when the perp trades above spot, longs pay shorts, and the sign flips when it trades below.</p>
          <p><b>Delta-neutral</b> means holding spot and shorting the same amount of perp. Price moves cancel out and what is left is the funding payment. The calculator multiplies today's annualized rate by the capital; it is a snapshot, not a forecast.</p>
          <p><b>Signal</b> is the bot's reading of which side is being paid. This view only watches: the DEX lane's job is spot arbitrage, and the perp desk lives with Fortuna.</p>
        </Explain>
      </section>
    </>
  )
}
