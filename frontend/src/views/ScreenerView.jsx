import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { analyzePair, selectPair, executeTrade, sendMessage, checkPrices, isStaticHost } from '../store/websocket'
import { clearTrades } from '../store/botSlice'
import Tooltip from '../components/Tooltip'
import Confirm from '../components/Confirm'
import Explain from '../components/Explain'
import { dexVar, dexTextVar } from '../lib/dex'

/**
 * ScreenerView — every live pair, its best route across every live pool, and the spread after
 * both pool fees. Analyze quotes a real round trip without sending; Trade sends (never in
 * monitor mode). The perp column reads Hyperliquid against spot.
 */
const EXPECTED_UNAVAILABLE_PERP_MARKETS = ['MAGIC', 'GNS', 'GRAIL']
const expectedUnavailableToken = (symbol = '') => String(symbol).split('/').find(t => EXPECTED_UNAVAILABLE_PERP_MARKETS.includes(t)) || null
const feeLabel = (f) => (f === null || f === undefined ? 'dyn' : `${Number((f / 10000).toFixed(4))}%`)
const fmtSigned = (v, d = 3) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}%`
}
const COLLAPSED_LIMIT = 10

export default function ScreenerView() {
  const dispatch = useDispatch()
  const { screenerPairs, screenerBlock, screenerTimestamp, threshold, selectedPair, analysisResult, analysisByPair, isExecuting, isTestMode, settings, fork, perpStatus, tradingMode, network, connected } = useSelector(s => s.bot)
  const [pending, setPending] = useState(null)
  const [hideFailed, setHideFailed] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [busy, setBusy] = useState(null) // 'test' | 'reset' | 'refresh' | 'restart'
  const demo = isStaticHost()
  const onFork = network === 'hardhat'
  const monitorOnly = tradingMode === 'monitor'
  const th = Number((isStaticHost() ? (threshold ?? settings?.priceDifference) : (settings?.priceDifference ?? threshold)) ?? 0.3) // the snapshot's threshold on the public copy

  useEffect(() => {
    const name = analysisResult?.pairName
    if (name) setExpanded(prev => ({ ...prev, [name]: true }))
  }, [analysisResult])

  const handleTrade = (pair) => {
    if (settings?.skipConfirmation) {
      selectPair(pair.name)
      setTimeout(() => executeTrade(), 100)
      return
    }
    setPending(pair)
  }
  const confirmTrade = () => {
    if (pending) { selectPair(pending.name); setTimeout(() => executeTrade(), 100) }
    setPending(null)
  }
  const handleAnalyze = (name) => {
    selectPair(name)
    setExpanded(prev => ({ ...prev, [name]: true }))
    analyzePair(name)
  }
  const run = (what, msg, delay, reload) => {
    setBusy(what)
    if (what === 'restart') dispatch(clearTrades())
    if (msg === 'CHECK_PRICES') checkPrices(); else sendMessage(msg)
    setTimeout(() => { setBusy(null); if (reload) window.location.reload() }, delay)
  }

  const visible = useMemo(() => (screenerPairs || []).filter(p => (p.dexCount || 0) >= 2), [screenerPairs])
  const hiddenCount = Math.max(0, (screenerPairs || []).length - visible.length)
  const filtered = hideFailed ? visible : (screenerPairs || [])
  const displayed = showAll ? filtered : filtered.slice(0, COLLAPSED_LIMIT)
  const opportunities = visible.filter(p => (p.hasExecutableOpportunity ?? p.hasOpportunity))
  const hasSnapshot = Boolean(screenerTimestamp || screenerBlock || (screenerPairs || []).length)
  const hasPerpCoverage = (screenerPairs || []).some(p => p.perp?.price)
  const perpWarming = hasSnapshot && perpStatus?.initialized && (!perpStatus?.lastFetchAt || (perpStatus?.fetchInFlight && !hasPerpCoverage))
  const expectedUnavailable = Array.from(new Set((screenerPairs || []).map(p => (!p.perp ? expectedUnavailableToken(p.symbol) : null)).filter(Boolean)))

  const perpHead = !hasSnapshot ? { cls: 'signal', text: 'Perp enrichment starts after the first screener rows arrive.' }
    : !perpStatus ? { cls: 'muted', text: 'Perp status has not arrived yet.' }
      : !perpStatus.initialized ? { cls: 'bad', text: perpStatus.error ? `Perp exchange unavailable: ${perpStatus.error}` : 'Perp exchange is not initialized.' }
        : perpWarming ? { cls: 'warn', text: 'Perp enrichment is still warming in the background.' }
          : perpStatus.fetchInFlight ? { cls: 'signal', text: `${perpStatus.exchange}: refresh in flight; cached rows stay visible.` }
            : { cls: 'good', text: `${perpStatus.exchange}: ${perpStatus.cachedPairs || 0} cached perp markets.` }

  const tradeDisabledReason = demo ? 'The public demo cannot trade.' : monitorOnly ? 'Monitor mode: the bot cannot send a transaction. Change tradingMode in config.json to enable.' : !connected ? 'Not connected to the bot.' : isExecuting ? 'A trade is already running.' : null

  return (
    <>
      <Confirm
        open={!!pending}
        kicker="Trade"
        title={pending ? `Execute ${pending.symbol}?` : ''}
        tone={pending && !(pending.hasExecutableOpportunity ?? pending.hasOpportunity) ? 'warn' : 'default'}
        confirmLabel="Execute trade"
        onConfirm={confirmTrade}
        onCancel={() => setPending(null)}
      >
        {pending ? (
          <div className="kv">
            <div><span>Route</span><span>{pending.execBuyDex || pending.buyDex || '—'} → {pending.execSellDex || pending.sellDex || '—'}</span></div>
            <div><span>Spread after fees</span><span className="num">{fmtSigned(pending.execNetDifference ?? pending.netDifference ?? pending.execDifference ?? pending.difference)}</span></div>
            <div><span>Threshold</span><span className="num">{th.toFixed(2)}%</span></div>
            <div><span>Venues</span><span className="num">{pending.dexCount}</span></div>
            {!(pending.hasExecutableOpportunity ?? pending.hasOpportunity) ? <div style={{ gridColumn: '1 / -1' }}><span className="warn">The spread is below the threshold; this trade may not be profitable.</span></div> : null}
          </div>
        ) : null}
      </Confirm>

      {busy ? (
        <div className="overlay" role="status" aria-live="polite">
          <div className="overlay-card" style={{ width: 'auto', padding: '18px 24px' }}>
            <span className="busy" style={{ marginRight: 10 }} />
            {busy === 'test' && 'Manipulating fork prices…'}
            {busy === 'reset' && 'Resetting the fork…'}
            {busy === 'refresh' && 'Fetching prices…'}
            {busy === 'restart' && 'Restarting the bot…'}
          </div>
        </div>
      ) : null}

      <section className="panel">
        <div className="panel-h">
          <div className="row">
            <h2 className="h2">Screener</h2>
            {isTestMode ? <span className="pill pill--warn" title="The fork has manipulated prices"><i className="dot" />test prices</span> : <span className="pill pill--good"><i className={`dot ${connected ? 'dot--live' : ''}`} />live</span>}
            <span className="meta"><span className="num">{visible.length}</span> live of <span className="num">{(screenerPairs || []).length}</span> pairs{hiddenCount ? <> · <span className="num warn">{hiddenCount}</span> without two usable pools</> : null}</span>
            <span className="meta"><span className={`num ${opportunities.length ? 'good' : ''}`}>{opportunities.length}</span> at or above threshold</span>
            <span className="meta">threshold <span className="num">{th.toFixed(2)}%</span></span>
            {screenerBlock ? <span className="meta">block <span className="num">{screenerBlock}</span></span> : null}
            {onFork && fork ? (
              <Tooltip text={typeof fork.behindBlocks === 'number' ? `The local fork is about ${fork.behindBlocks.toLocaleString()} blocks behind Arbitrum. Restart to refork when this grows.` : 'Fork freshness unknown (mainnet comparison unavailable).'}>
                <span className={`pill ${fork.needsRefork ? 'pill--bad' : 'pill--warn'}`}>{typeof fork.behindBlocks === 'number' ? `fork ${fork.behindBlocks.toLocaleString()} behind` : 'fork freshness —'}{fork.autoMineEnabled === true ? ' · mining' : ''}</span>
              </Tooltip>
            ) : null}
          </div>
          <div className="row">
            <button className={`btn btn--sm ${hideFailed ? 'btn--on' : ''}`} onClick={() => setHideFailed(v => !v)} title="Hide pairs that do not have two usable pools">{hideFailed ? 'Showing live only' : 'Hide unusable'}</button>
            <button className="btn btn--sm" onClick={() => run('refresh', 'CHECK_PRICES', 1500, false)} disabled={!!busy || demo || !connected} title="Fetch every pool now">Refresh</button>
            {onFork ? (
              <>
                <button className="btn btn--sm btn--warn" onClick={() => run('test', 'RUN_MANIPULATION', 3000, true)} disabled={!!busy || demo || !connected} title="Create an artificial price gap on the fork to test the trade path">Test prices</button>
                <button className="btn btn--sm" onClick={() => run('reset', 'CLEAR_MANIPULATION', 2500, true)} disabled={!!busy || demo || !connected} title="Reset the fork to its original state">Reset</button>
                <button className="btn btn--sm" onClick={() => run('restart', 'RESTART_BOT', 3500, true)} disabled={!!busy || demo || !connected} title="Refork the local chain and re-initialize every pair">Restart</button>
              </>
            ) : null}
          </div>
        </div>

        {demo ? <div className="notice notice--quiet">The public demo has no screener feed: the bot and its RPC run on a private machine. Open the Edge view for the real study readings.</div> : null}
        {onFork && fork?.needsRefork ? <div className="notice notice--bad"><div className="notice-t">Refork needed</div>The local fork is about {fork.behindBlocks?.toLocaleString?.() || fork.behindBlocks} blocks behind mainnet. Restart the bot to refresh the snapshot.</div> : null}
        {!demo && !hasSnapshot ? <div className="notice"><div className="notice-t">Waiting for the first screener snapshot</div>A cold start takes a few seconds before the first usable rows arrive.</div> : null}
        {perpWarming ? <div className="notice notice--warn"><div className="notice-t">Perp coverage still filling in</div>Spot rows are live. Hyperliquid enrichment runs in the background, so some rows read “warming” for a moment.</div> : null}
        {hasSnapshot && expectedUnavailable.length ? <div className="notice notice--quiet">{expectedUnavailable.join(', ')} have no Hyperliquid perp market; “expected n/a” on those rows is normal.</div> : null}

        {displayed.length === 0 ? (
          <div className="empty">{(screenerPairs || []).length ? 'Every pair is filtered out. Use “Showing live only” to show them again.' : demo ? '' : 'No rows yet.'}</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Best route</th>
                  <th className="t-right"><Tooltip text="Spread after both pool fees on the best executable route. The threshold is compared to this number; the gross gap and the two fees sit underneath."><span>Spread after fees</span></Tooltip></th>
                  <th className="t-right"><Tooltip text={perpHead.text}><span>Perp <i className={`dot ${perpHead.cls}`} style={{ display: 'inline-block', verticalAlign: 'middle' }} /></span></Tooltip></th>
                  <th className="t-right">Pools</th>
                  <th className="t-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(pair => {
                  const isExpanded = !!expanded[pair.name]
                  const analysis = analysisByPair?.[pair.name]
                  const hasOpp = (pair.hasExecutableOpportunity ?? pair.hasOpportunity)
                  const buy = pair.execBuyDex || pair.buyDex
                  const sell = pair.execSellDex || pair.sellDex
                  const executableRoute = !!(pair.execBuyDex && pair.execSellDex)
                  const mismatch = !!(pair.execBuyDex && pair.execSellDex && pair.buyDex && pair.sellDex && (pair.execBuyDex !== pair.buyDex || pair.execSellDex !== pair.sellDex))
                  const gross = pair.execDifference ?? pair.difference
                  const net = pair.execNetDifference ?? pair.netDifference ?? null
                  const shown = net ?? gross
                  const shownNum = Number(shown)
                  const spreadCls = hasOpp ? 'good' : shownNum >= th * 0.5 ? 'warn' : shownNum > 0 ? '' : 'muted'
                  const unavailableTok = expectedUnavailableToken(pair.symbol)
                  const perpCell = pair.perp
                    ? (
                      <Tooltip text={`${pair.perp.exchange}: $${Number(pair.perp.price).toFixed(4)} · spot–perp ${pair.perp.spreadPct}% · ${pair.perp.signal}${pair.funding ? ` · funding ${(pair.funding.rate * 100).toFixed(4)}% (${pair.funding.rateAnnualized?.toFixed(1)}% APY)` : ''}`}>
                        <span className="num">{Number.isFinite(Number(pair.perp.spreadPct)) ? `${Number(pair.perp.spreadPct) > 0 ? '+' : ''}${pair.perp.spreadPct}%` : '—'}<span className="td-sub">{pair.funding && Number.isFinite(Number(pair.funding.rateAnnualized)) ? `${Number(pair.funding.rateAnnualized).toFixed(1)}% APY` : pair.perp.exchange}</span></span>
                      </Tooltip>
                    )
                    : unavailableTok
                      ? <Tooltip text={`${unavailableTok} has no Hyperliquid perp market. This is not a transport failure.`}><span className="muted">expected n/a</span></Tooltip>
                      : perpWarming ? <span className="warn">warming</span>
                        : perpStatus?.initialized ? <span className="muted">n/a</span> : <span className="muted">—</span>
                  return (
                    <React.Fragment key={pair.name}>
                      <tr className={`tr-click ${selectedPair?.pairName === pair.name ? 'tr-selected' : ''} ${hasOpp ? 'tr-opp' : ''}`} onClick={() => { if (!demo) selectPair(pair.name); setExpanded(prev => ({ ...prev, [pair.name]: !prev[pair.name] })) }}>
                        <td><span className="expand">{isExpanded ? '▾' : '▸'}</span> <span className="pair">{pair.symbol}</span></td>
                        <td>
                          {buy && sell ? (
                            <span className="route">
                              <span className="venue" style={{ '--c': dexVar(buy), '--c-text': dexTextVar(buy) }}><i />{buy}</span><span className="arrow">→</span><span className="venue" style={{ '--c': dexVar(sell), '--c-text': dexTextVar(sell) }}><i />{sell}</span>
                              {executableRoute ? <Tooltip text="The route the bot can trade right now."><span className="pill pill--good">executable</span></Tooltip> : null}
                              {mismatch ? <Tooltip text={`Scan-only best: ${pair.buyDex} → ${pair.sellDex}. Executable: ${pair.execBuyDex} → ${pair.execSellDex}.`}><span className="pill">scan-only best differs</span></Tooltip> : null}
                            </span>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td className="t-right">
                          <span className={`num ${spreadCls}`} style={{ fontWeight: 500 }}>{fmtSigned(shown)}</span>
                          {net !== null ? <span className="td-sub num">gross {fmtSigned(gross)} · fees {feeLabel(pair.buyFee)} + {feeLabel(pair.sellFee)}</span> : null}
                        </td>
                        <td className="t-right">{perpCell}</td>
                        <td className="t-right num">{pair.dexCount || 0}</td>
                        <td className="t-right" onClick={e => e.stopPropagation()}>
                          <span className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                            <button className="btn btn--sm" onClick={() => handleAnalyze(pair.name)} disabled={isExecuting || demo || !connected} title="Quote a real round trip without sending anything">Analyze</button>
                            <Tooltip text={tradeDisabledReason || (hasOpp ? 'Send this trade' : 'Below threshold; the confirmation will say so')}>
                              <button className={`btn btn--sm ${hasOpp && !tradeDisabledReason ? 'btn--good' : ''}`} onClick={() => handleTrade(pair)} disabled={!!tradeDisabledReason}>Trade</button>
                            </Tooltip>
                          </span>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 0 }}>
                            <div className="detail">
                              {analysis ? (
                                <>
                                  <div className="row row--between">
                                    <div className="row">
                                      <span className={`pill ${analysis.status === 'profitable' ? 'pill--good' : analysis.status === 'error' || analysis.status === 'not_profitable' ? 'pill--bad' : 'pill--warn'}`}>{String(analysis.status || '').replaceAll('_', ' ')}</span>
                                      {analysis.simulationPassed !== undefined ? <span className={`pill ${analysis.simulationPassed ? 'pill--good' : 'pill--bad'}`}>{analysis.simulationPassed ? 'simulation passed' : 'simulation failed'}</span> : null}
                                    </div>
                                    <span className="meta">{analysis.timestamp ? `updated ${new Date(analysis.timestamp).toLocaleTimeString([], { hour12: false })}` : ''}</span>
                                  </div>
                                  <p className="text-2" style={{ margin: '8px 0' }}>{analysis.message}</p>
                                  <div className="kv">
                                    {(analysis.direction || (analysis.buyExchange && analysis.sellExchange)) ? <div><span>Route</span><span>{analysis.direction || `${analysis.buyExchange} → ${analysis.sellExchange}`}</span></div> : null}
                                    {analysis.spread !== undefined ? <div><span>Spread</span><span className="num">{Number(analysis.spread).toFixed(3)}%</span></div> : null}
                                    {analysis.amount && analysis.amount !== '0' ? <div><span>Amount</span><span className="num">{Number(analysis.amount).toFixed(6)}</span></div> : null}
                                    {analysis.profitData?.estimatedGasCost ? <div><span>Gas</span><span className="num">{analysis.profitData.estimatedGasCost} ETH</span></div> : null}
                                    {analysis.profitData?.totalGainLoss ? <div><span>Net result</span><span className={`num ${analysis.isProfitable ? 'good' : 'bad'}`}>{analysis.profitData.totalGainLoss} {analysis.profitData.tokenSymbol}</span></div> : null}
                                  </div>
                                </>
                              ) : (
                                <span className="muted">No quote yet. Analyze quotes a real round trip at the bot's trade size without sending anything; Trade sends it.</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
            {filtered.length > COLLAPSED_LIMIT ? (
              <div style={{ textAlign: 'center', padding: 10, borderTop: '1px solid var(--line)' }}>
                <button className="btn btn--quiet btn--sm" onClick={() => setShowAll(v => !v)}>{showAll ? `Show the first ${COLLAPSED_LIMIT}` : `Show all ${filtered.length} pairs`}</button>
              </div>
            ) : null}
          </div>
        )}

        <div className="row row--between" style={{ marginTop: 10 }}>
          <span className="meta">{screenerTimestamp ? `Updated ${new Date(screenerTimestamp).toLocaleTimeString([], { hour12: false })}` : ''}{(screenerPairs || []).length ? ` · ${(screenerPairs || []).length} pairs broadcast` : ''}</span>
        </div>

        <Explain>
          <p><b>Best route</b> is the cheapest pool to buy on and the richest pool to sell on among every live pool for the pair: each fee tier on Uniswap and PancakeSwap plus the Camelot pool, all priced in one block.</p>
          <p><b>Spread after fees</b> is that price gap minus both pools' fees. A 0.8% gap between two 1% pools is not an opportunity; a 0.12% gap between two 0.05% pools is. The threshold is judged on this number, and a green row has cleared it.</p>
          <p><b>Analyze</b> quotes a real round trip at the bot's trade size through the quoter contracts without sending anything, and reports the net result after gas. <b>Trade</b> sends it; in monitor mode the button stays off because the bot refuses to send.</p>
          <p><b>Perp</b> compares the Hyperliquid perpetual with spot: the spread between them and the funding rate as an annual percentage. That is the Perps view's raw material.</p>
        </Explain>
      </section>
    </>
  )
}
