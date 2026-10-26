import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isStaticHost } from '../store/websocket'
import { DEXES, dexKey, houseList } from '../lib/dex'

const fmtSigned = (v, d = 3) => { const n = Number(v); return Number.isFinite(n) ? `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}%` : '—' }
const fmtUsd = (v) => { const n = Number(v); return Number.isFinite(n) ? `$${n.toLocaleString(undefined, { maximumFractionDigits: n >= 100 ? 0 : 2 })}` : '—' }
const fmtBal = (v, d = 4) => { const n = Number(v); return Number.isFinite(n) ? n.toFixed(d).replace(/\.?0+$/, '') || '0' : '—' }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

function Ring({ pct, label }) {
  const r = 24, c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, pct || 0))
  return (
    <svg className="ring" viewBox="0 0 58 58" role="img" aria-label={`${p.toFixed(0)}% of the study`}>
      <circle className="track" cx="29" cy="29" r={r} />
      <circle className="arc" cx="29" cy="29" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform="rotate(-90 29 29)" />
      <text x="29" y="29">{label}</text>
    </svg>
  )
}

/**
 * Hero — what the first DApp University build put at the top (the brand strip, the two networks,
 * the performance card), revamped: the takeaway sentence, the vitals, the venues in their colors.
 */
export default function Hero() {
  const { screenerPairs, edge, threshold, settings, trades, wallet, network, isTestMode, connected, edgeSnapshotAt, venues, candidates, costume } = useSelector(s => s.bot)
  const venueKinds = costume?.on ? houseList() : DEXES
  const demo = isStaticHost()
  const th = Number((demo ? (threshold ?? settings?.priceDifference) : (settings?.priceDifference ?? threshold)) ?? 0.3) // the snapshot's threshold on the public copy; the bot's settings on the real one

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

  const perf = useMemo(() => {
    const t = trades || []
    const ok = t.filter(x => x.status === 'success').length
    const pnl = t.reduce((s, x) => s + parseFloat(x.profit || 0), 0)
    return { total: t.length, ok, failed: t.length - ok, pnl }
  }, [trades])

  const venueList = (venues?.length ? venues : edge?.venues) || []
  const poolsByDex = useMemo(() => {
    const m = {}
    for (const v of venueList) { const k = dexKey(v.dex || v.key); m[k] = (m[k] || 0) + 1 }
    return m
  }, [venueList])

  const hours = edge?.progress?.elapsedHours || 0
  const target = edge?.progress?.targetDays || 7
  const day = Math.min(target, Math.floor(hours / 24) + 1)
  const pct = Math.max(0, Math.min(100, edge?.progress?.pct || 0))
  const quoted = edge?.simulated || 0, cleared = edge?.cleared || 0, fired = edge?.wouldFire || 0
  const recent = (candidates || []).filter(c => c.clears || c.wouldFire).length

  const hh = wallet?.hardhat, mn = wallet?.mainnet
  const chainLive = network === 'hardhat' ? 'test' : 'main'

  return (
    <div className="hero" id="overview">
      <div className="take">
        <div className="ic"><i className="ph-duotone ph-target" aria-hidden="true" /></div>
        <div>
          <div className="lead">
            {best ? (
              <>
                {demo ? 'In the latest snapshot, the ' : 'Right now the '}best route after pool fees is <b>{best.symbol}</b>, <b>{best.buy}</b> to <b>{best.sell}</b>, at <span className={`n ${best.v >= th ? 'good' : best.v > 0 ? 'signal' : 'bad'}`}>{fmtSigned(best.v)}</span>.
                {edge?.enabled ? <> The study has quoted <span className="n">{quoted}</span> round trips; <span className={`n ${cleared ? 'good' : ''}`}>{cleared}</span> cleared gas and the flash-loan fee and <span className={`n ${fired ? 'good' : ''}`}>{fired}</span> would have fired at the <span className="n">{th.toFixed(2)}%</span> threshold.</> : null}
                {edge?.enabled && !cleared ? ' Gas is still the binding cost, so nothing gets funded yet.' : ''}
              </>
            ) : connected || demo ? 'Waiting for the first poll. The bot prices every live pool for every pair in one block, then ranks routes after fees.' : 'Not connected to the bot. This page reads prices, quotes and the study from the bot on your machine; it never sends a transaction on its own.'}
          </div>
          <div className="meta">
            <span>mode <b>{isTestMode ? 'test prices' : (edge?.enabled ? 'monitor only' : 'live')}</b></span>
            <span>chain <b>{network === 'hardhat' ? 'Hardhat fork' : 'Arbitrum'}</b></span>
            {edge?.lastBlock ? <span>block <b className="num">{edge.lastBlock}</b></span> : null}
            {edge?.polls ? <span><b className="num">{edge.polls}</b> polls</span> : null}
            {edge?.gasPriceGwei ? <span>gas <b className="num">{Number(edge.gasPriceGwei).toFixed(3)} gwei</b></span> : null}
            {edge?.wethUsd ? <span>ETH <b className="num">{fmtUsd(edge.wethUsd)}</b></span> : null}
            {demo && edgeSnapshotAt ? <span>snapshot <b>{new Date(edgeSnapshotAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</b></span> : null}
          </div>
        </div>
      </div>

      <div className="vitals">
        <div className={`vital ${best && best.v >= th ? 'vital--good' : ''}`}>
          <div className="vital-l"><i className="ph-duotone ph-trend-up" aria-hidden="true" />Best after fees</div>
          <div className={`vital-v ${best ? (best.v >= th ? 'good' : best.v > 0 ? '' : 'bad') : ''}`}>{best ? fmtSigned(best.v) : '—'}</div>
          <div className="vital-s">{best ? <><b>{best.symbol}</b> · {best.buy} → {best.sell}</> : 'waiting for the first poll'}<br />threshold {th.toFixed(2)}%{best?.snapshot && !demo ? " · the study's best candidate" : ''}</div>
        </div>
        <div className={`vital ${fired ? 'vital--good' : cleared ? 'vital--warn' : ''}`}>
          <div className="vital-l"><i className="ph-duotone ph-funnel" aria-hidden="true" />Round trips</div>
          <div className="vital-row">
            <span className="vital-v">{quoted}<span className="k">quoted</span></span>
            <span className={`vital-v sm ${cleared ? 'warn' : ''}`}>{cleared}<span className="k">cleared</span></span>
            <span className={`vital-v sm ${fired ? 'good' : ''}`}>{fired}<span className="k">would fire</span></span>
          </div>
          <div className="vital-s">{recent ? <><b>{recent}</b> since this page opened</> : 'quoted at five sizes through the real quoters, netted for gas and the flash-loan fee'}</div>
        </div>
        <div className="vital vital--ring">
          <div>
            <div className="vital-l"><i className="ph-duotone ph-calendar-check" aria-hidden="true" />Study</div>
            <div className="vital-v sm">day {edge?.enabled ? day : '—'} of {target}</div>
            <div className="vital-s">decision when the week is in<br />{edge?.progress?.decisionAt ? new Date(edge.progress.decisionAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'Sunday 1 Nov, evening'}</div>
          </div>
          <Ring pct={pct} label={`${pct.toFixed(0)}%`} />
        </div>
        <div className={`vital ${perf.pnl > 0 ? 'vital--good' : perf.pnl < 0 ? 'vital--bad' : ''}`}>
          <div className="vital-l"><i className="ph-duotone ph-coins" aria-hidden="true" />Performance</div>
          <div className={`vital-v ${perf.pnl > 0 ? 'good' : perf.pnl < 0 ? 'bad' : ''}`}>{perf.pnl >= 0 ? '+' : ''}{perf.pnl.toFixed(6)}<span className="k">WETH</span></div>
          <div className="vital-s"><b>{perf.total}</b> {perf.total === 1 ? 'trade' : 'trades'} · <span className="good">{perf.ok} ok</span> · <span className={perf.failed ? 'bad' : ''}>{perf.failed} failed</span>{perf.total ? '' : ' · nothing has traded; the wallet waits on the gate'}</div>
        </div>
      </div>

      <div className="netcards">
        <div className="netcard netcard--test">
          <div className="netcard-h"><i className="ph-duotone ph-flask" aria-hidden="true" />Testnet · Hardhat fork {chainLive === 'test' ? <span className="pill pill--good">active</span> : <span className="pill">standby</span>}</div>
          <div className="netcard-sub"><span>chain <b>31337</b></span><span>rpc <b>localhost:8545</b></span><span>a local copy of Arbitrum; nothing real moves</span></div>
          <div className="bal">{hh ? <><span>{fmtBal(hh.ethBalance ?? hh.eth)}<small>ETH</small></span><span>{fmtBal(hh.wethBalance)}<small>WETH</small></span><span>{fmtBal(hh.arbBalance, 2)}<small>ARB</small></span></> : <span className="q">{demo ? 'balances stay on the private machine' : wallet?.error ? 'no key configured' : '—'}</span>}</div>
        </div>
        <div className="netcard netcard--main">
          <div className="netcard-h"><i className="ph-duotone ph-globe-hemisphere-west" aria-hidden="true" />Mainnet · Arbitrum {chainLive === 'main' ? <span className="pill pill--warn">reading</span> : <span className="pill">standby</span>}</div>
          <div className="netcard-sub"><span>chain <b>42161</b></span><span>rpc <b>Alchemy</b></span><span>{edge?.enabled ? 'monitor only until the gate opens' : 'real funds when funded'}</span></div>
          <div className="bal">{mn ? <><span>{fmtBal(mn.ethBalance ?? mn.eth)}<small>ETH</small></span><span>{fmtBal(mn.wethBalance)}<small>WETH</small></span><span>{fmtBal(mn.arbBalance, 2)}<small>ARB</small></span></> : <span className="q">{demo ? 'balances stay on the private machine' : 'unfunded by design'}</span>}</div>
        </div>
        <div className="netcard netcard--perf">
          <div className="netcard-h"><i className="ph-duotone ph-stack" aria-hidden="true" />Venues {venueList.length ? <span className="pill pill--signal">{plural(venueList.length, 'pool', 'pools')}</span> : null}</div>
          <div className="netcard-sub"><span>every fee tier is its own venue, priced in the same block</span>{costume?.on ? <span>venues wear stage names here</span> : null}</div>
          <div className="dexrow">
            {venueKinds.map(d => (
              <span key={d.key} className={`dexchip ${poolsByDex[d.key] ? '' : 'is-quiet'}`} style={{ '--c': `var(--dex-${d.key})`, '--c-text': `var(--dex-${d.key}-text)` }} title={poolsByDex[d.key] ? `${poolsByDex[d.key]} live pools on ${d.label}` : `${d.label}: no live pool for the current pairs`}>
                <i />{d.label}{poolsByDex[d.key] ? <span className="n">{poolsByDex[d.key]}</span> : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
