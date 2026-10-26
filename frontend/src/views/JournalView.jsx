import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchJournalDays, fetchJournalDay, isStaticHost } from '../store/websocket'
import { clearLogs } from '../store/botSlice'
import Explain from '../components/Explain'
import Tooltip from '../components/Tooltip'

/**
 * JournalView — the trading journal. What the dashboard showed, kept on disk (logs/journal) and
 * read back here by day: the activity monitor, the analysis results, the trade terminal. The
 * metrics strip turns a day into a shape before the lines are read; the timeline is the lines.
 * Today's view keeps filling from the live socket. The same files answer `node scripts/journal.js`.
 */
const LEVELS = ['INFO', 'SUCCESS', 'WARN', 'ERROR']
const pad = (n) => String(n).padStart(2, '0')
const localIsoDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const localIsoMonth = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const clock = (ts) => { try { return new Date(ts).toLocaleTimeString([], { hour12: false }) } catch { return '' } }
const levelOf = (e) => (LEVELS.includes(String(e.level || '').toUpperCase()) ? String(e.level).toUpperCase() : 'other')
const kb = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const fmtProfit = (p) => { const v = parseFloat(p || 0); return `${v > 0 ? '+' : ''}${v.toFixed(6)}` }

function downloadJSON(filename, data) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.warn('Export failed:', e)
  }
}

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(entries => { for (const e of entries) setWidth(e.contentRect.width) })
    ro.observe(ref.current)
    setWidth(ref.current.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

/** Events per hour, stacked by level. The legend is always present; each hour carries a tooltip. */
function HourBars({ byHour }) {
  const [ref, width] = useWidth()
  const h = 110
  const padL = 30
  const padB = 16
  const plotW = Math.max(0, width - padL - 4)
  const plotH = h - padB - 6
  const max = Math.max(1, ...byHour.map(x => x.total))
  const colW = plotW / 24
  const barW = Math.max(2, colW - 3)
  const y = (v) => plotH - (v / max) * plotH + 6
  const ticks = [0, Math.round(max / 2), max]
  return (
    <div ref={ref}>
      {width > 0 ? (
        <svg className="chart-svg" width={width} height={h} role="img" aria-label="Events per hour by level">
          {ticks.map(t => (
            <g key={t}>
              <line x1={padL} x2={width - 4} y1={y(t)} y2={y(t)} className="grid-line" />
              <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" className="axis-text">{t}</text>
            </g>
          ))}
          {byHour.map((hr, i) => {
            let acc = 0
            const x = padL + i * colW + (colW - barW) / 2
            const order = ['INFO', 'SUCCESS', 'WARN', 'ERROR', 'other']
            return (
              <g key={hr.hour}>
                <title>{`${pad(hr.hour)}:00 · ${hr.total} events · INFO ${hr.INFO}, SUCCESS ${hr.SUCCESS}, WARN ${hr.WARN}, ERROR ${hr.ERROR}${hr.other ? `, other ${hr.other}` : ''}`}</title>
                {order.map(lvl => {
                  const v = hr[lvl] || 0
                  if (!v) return null
                  const y0 = y(acc + v)
                  const y1 = y(acc)
                  acc += v
                  return <rect key={lvl} x={x} y={y0} width={barW} height={Math.max(1, y1 - y0 - 1)} className={`bar-${lvl}`} />
                })}
                {i % 3 === 0 ? <text x={x + barW / 2} y={h - 3} textAnchor="middle" className="axis-text">{pad(hr.hour)}</text> : null}
              </g>
            )
          })}
        </svg>
      ) : null}
      <div className="legend">
        {['INFO', 'SUCCESS', 'WARN', 'ERROR'].map(l => <span key={l}><i className={l} />{l.toLowerCase()}</span>)}
        <span><i className="other" />status, settings, selections</span>
      </div>
    </div>
  )
}

function summarizeClient(entries) {
  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, INFO: 0, SUCCESS: 0, WARN: 0, ERROR: 0, other: 0, total: 0 }))
  const byLevel = { INFO: 0, SUCCESS: 0, WARN: 0, ERROR: 0, other: 0 }
  const msgs = new Map()
  let first = null, last = null
  for (const e of entries) {
    const t = new Date(e.ts || e.timestamp)
    if (Number.isNaN(t.getTime())) continue
    const lvl = levelOf(e)
    byHour[t.getHours()][lvl]++
    byHour[t.getHours()].total++
    byLevel[lvl]++
    if (!first || t < first) first = t
    if (!last || t > last) last = t
    if (e.message) {
      const k = String(e.message).replace(/0x[0-9a-fA-F]{6,}/g, '0x…').replace(/[-+]?\d[\d,]*(\.\d+)?/g, '#').replace(/\s+/g, ' ').trim().slice(0, 96)
      const cur = msgs.get(k) || { message: k, count: 0, level: e.level }
      cur.count++
      msgs.set(k, cur)
    }
  }
  return { count: entries.length, first: first?.toISOString() || null, last: last?.toISOString() || null, byHour, byLevel, topMessages: [...msgs.values()].sort((a, b) => b.count - a.count).slice(0, 8) }
}

function Line({ e }) {
  const t = clock(e.ts || e.timestamp)
  if (e.type === 'LOG' || e.level) {
    const lvl = levelOf(e)
    return <div className="log-line"><span className="log-t">{t}</span><span className={`log-lvl lvl-${lvl}`}>{lvl === 'other' ? String(e.level || '') : lvl}</span><span className="log-msg">{e.message}</span></div>
  }
  if (e.type === 'TRADE_STEP') return <div className="log-line"><span className="log-t">{t}</span><span className={`log-lvl ${e.status === 'success' ? 'lvl-SUCCESS' : e.status === 'error' ? 'lvl-ERROR' : 'lvl-INFO'}`}>step</span><span className="log-msg">{e.status === 'success' ? '✓' : e.status === 'error' ? '✗' : '→'} {e.label}{e.details ? <span className="dim"> · {e.details}</span> : null}</span></div>
  if (e.type === 'TRADE_COMPLETE') return <div className="log-line"><span className="log-t">{t}</span><span className={`log-lvl ${e.status === 'success' ? 'lvl-SUCCESS' : 'lvl-ERROR'}`}>trade</span><span className="log-msg">{e.pair || ''} {e.buyExchange} → {e.sellExchange} · profit {fmtProfit(e.profit)} {e.tokenSymbol || ''}{e.txHash ? <span className="dim"> · tx {e.txHash}</span> : null}</span></div>
  if (e.type === 'TRADE_STATUS') return <div className="log-line"><span className="log-t">{t}</span><span className={`log-lvl ${e.status === 'failed' ? 'lvl-ERROR' : 'lvl-WARN'}`}>status</span><span className="log-msg">{e.status}{e.error ? <span className="dim"> · {e.error}</span> : null}{e.txHash ? <span className="dim"> · tx {e.txHash}</span> : null}</span></div>
  if (e.type === 'ANALYSIS_RESULT') return <div className="log-line"><span className="log-t">{t}</span><span className={`log-lvl ${e.status === 'profitable' ? 'lvl-SUCCESS' : e.status === 'error' ? 'lvl-ERROR' : 'lvl-WARN'}`}>analyze</span><span className="log-msg">{e.symbol || e.pairName || ''} {String(e.status || '').replaceAll('_', ' ')}{e.message ? <span className="dim"> · {e.message}</span> : null}</span></div>
  if (e.type === 'OPPORTUNITY') return <div className="log-line"><span className="log-t">{t}</span><span className="log-lvl lvl-SUCCESS">opp</span><span className="log-msg">{e.buyExchange} → {e.sellExchange}{e.profitData ? <span className="dim"> · est {e.profitData.totalGainLoss} {e.profitData.tokenSymbol || ''}</span> : null}</span></div>
  if (e.type === 'BOT_STATUS') {
    const bits = []
    if (e.isRunning !== undefined) bits.push(e.isRunning ? 'scanning' : 'stopped')
    if (e.isExecuting !== undefined) bits.push(e.isExecuting ? 'trade in flight' : 'trade finished')
    if (e.isTestMode !== undefined) bits.push(e.isTestMode ? 'test prices on' : 'test prices off')
    return <div className="log-line"><span className="log-t">{t}</span><span className="log-lvl lvl-other">bot</span><span className="log-msg dim">{bits.join(' · ') || 'status'}</span></div>
  }
  if (e.type === 'SETTINGS_UPDATE') {
    const rest = { ...e }
    delete rest.ts; delete rest.type; delete rest.mode
    return <div className="log-line"><span className="log-t">{t}</span><span className="log-lvl lvl-other">settings</span><span className="log-msg dim">{Object.entries(rest).map(([k, v]) => `${k}=${v}`).join(' · ')}</span></div>
  }
  if (e.type === 'PAIR_SELECTED') return <div className="log-line"><span className="log-t">{t}</span><span className="log-lvl lvl-other">select</span><span className="log-msg dim">{e.symbol || e.pairName}</span></div>
  const rest = { ...e }
  delete rest.ts; delete rest.type; delete rest.mode
  return <div className="log-line"><span className="log-t">{t}</span><span className="log-lvl lvl-other">{String(e.type || '').toLowerCase().replace('_', ' ')}</span><span className="log-msg dim">{JSON.stringify(rest)}</span></div>
}

export default function JournalView() {
  const dispatch = useDispatch()
  const { journal, logs, trades, tradeSteps, tradeStatus } = useSelector(s => s.bot)
  const demo = isStaticHost()
  const today = localIsoDay()
  const [date, setDate] = useState(today)
  const [stream, setStream] = useState('activity')
  const [level, setLevel] = useState('')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [limit, setLimit] = useState(1000)
  const [follow, setFollow] = useState(true)
  const [openTrades, setOpenTrades] = useState({})
  const logRef = useRef(null)
  const fetchedAtRef = useRef(0)

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q.trim()), 300); return () => clearTimeout(t) }, [q])
  useEffect(() => { fetchJournalDays(dispatch) }, [dispatch])
  useEffect(() => {
    fetchedAtRef.current = Date.now()
    fetchJournalDay(dispatch, { date: stream === 'trades' ? date.slice(0, 7) : date, stream, limit, q: debouncedQ, level })
  }, [dispatch, date, stream, limit, debouncedQ, level])

  // today's activity keeps filling from the live socket; everything else is what the file holds
  const liveTail = useMemo(() => {
    if (demo || stream !== 'activity' || date !== today) return []
    const seen = new Set((journal.entries || []).map(e => `${e.ts}|${e.message}`))
    return (logs || [])
      .filter(l => new Date(l.timestamp).getTime() > fetchedAtRef.current - 1500)
      .map(l => ({ ...l, ts: l.timestamp, type: 'LOG' }))
      .filter(l => !seen.has(`${l.ts}|${l.message}`))
      .filter(l => !level || levelOf(l) === level)
      .filter(l => !debouncedQ || String(l.message || '').toLowerCase().includes(debouncedQ.toLowerCase()))
  }, [logs, journal.entries, stream, date, today, demo, level, debouncedQ])

  const entries = useMemo(() => [...(journal.entries || []), ...liveTail], [journal.entries, liveTail])
  const summary = useMemo(() => (liveTail.length || !journal.summary ? summarizeClient(entries) : journal.summary), [entries, liveTail.length, journal.summary])

  useEffect(() => {
    if (follow && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [entries.length, follow])

  const dayOptions = useMemo(() => {
    const set = new Map()
    set.set(today, { date: today })
    for (const d of journal.days || []) set.set(d.date, d)
    return [...set.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [journal.days, today])
  const dayInfo = (journal.days || []).find(d => d.date === date)
  const monthInfo = (journal.months || []).find(m => m.month === date.slice(0, 7))

  const tradeStats = useMemo(() => {
    const total = trades?.length || 0
    const ok = (trades || []).filter(t => t.status === 'success').length
    const net = (trades || []).reduce((s, t) => s + parseFloat(t.profit || 0), 0)
    return { total, ok, failed: total - ok, net }
  }, [trades])

  const unavailable = journal.available === false || demo

  return (
    <>
      <section className="panel">
        <div className="panel-h">
          <div className="row">
            <h2 className="h2">Journal</h2>
            <span className="meta">what the terminal showed, kept on disk and read back by day</span>
          </div>
          <div className="row">
            <select className="input" value={date} onChange={e => setDate(e.target.value)} aria-label="Day" disabled={unavailable}>
              {dayOptions.map(d => <option key={d.date} value={d.date}>{d.date === today ? `today · ${d.date}` : d.date}{d.activity ? ` · ${d.activity.lines}` : ''}</option>)}
            </select>
            <div className="btn-group" role="tablist" aria-label="Stream">
              {['activity', 'analysis', 'trades'].map(s => <button key={s} role="tab" aria-selected={stream === s} className={`btn btn--sm ${stream === s ? 'btn--on' : ''}`} onClick={() => setStream(s)} disabled={unavailable}>{s}</button>)}
            </div>
            <div className="btn-group" aria-label="Level">
              {['', ...LEVELS].map(l => <button key={l || 'all'} className={`btn btn--sm ${level === l ? 'btn--on' : ''}`} onClick={() => setLevel(l)} disabled={unavailable || stream !== 'activity'}>{l ? l.toLowerCase() : 'all'}</button>)}
            </div>
            <input className="input" placeholder="find text" value={q} onChange={e => setQ(e.target.value)} style={{ width: 150 }} aria-label="Find text" disabled={unavailable} />
            <select className="input" value={limit} onChange={e => setLimit(Number(e.target.value))} aria-label="How many lines" disabled={unavailable}>
              {[200, 1000, 5000].map(n => <option key={n} value={n}>last {n}</option>)}
            </select>
            <button className={`btn btn--sm ${follow ? 'btn--on' : ''}`} onClick={() => setFollow(v => !v)} title="Keep the newest line in view">Follow</button>
            <button className="btn btn--sm" onClick={() => downloadJSON(`journal-${stream}-${date}.json`, { exportedAt: new Date().toISOString(), stream, date, entries })} disabled={!entries.length}>Export JSON</button>
          </div>
        </div>

        {unavailable ? (
          <div className="notice notice--quiet">
            <div className="notice-t">The journal lives in the private repo</div>
            It is written by the bot into <code>logs/journal/</code> and committed nightly, so it is not part of the public demo. On the operator's machine this view reads it back by day.
          </div>
        ) : journal.error ? <div className="notice notice--bad">{journal.error}</div> : null}

        {!unavailable ? (
          <div className="grid grid--3" style={{ marginBottom: 14 }}>
            <div>
              <div className="stats">
                <div className="stat"><span className="stat-v">{summary?.count ?? 0}</span><span className="stat-l">entries{journal.total > entries.length ? ` of ${journal.total}` : ''}</span></div>
                <div className="stat"><span className="stat-v sm signal">{summary?.byLevel?.INFO ?? 0}</span><span className="stat-l">info</span></div>
                <div className="stat"><span className="stat-v sm good">{summary?.byLevel?.SUCCESS ?? 0}</span><span className="stat-l">success</span></div>
                <div className="stat"><span className="stat-v sm warn">{summary?.byLevel?.WARN ?? 0}</span><span className="stat-l">warn</span></div>
                <div className="stat"><span className="stat-v sm bad">{summary?.byLevel?.ERROR ?? 0}</span><span className="stat-l">error</span></div>
              </div>
              <div className="meta" style={{ marginTop: 8 }}>
                {summary?.first ? `${clock(summary.first)} → ${clock(summary.last)}` : 'nothing recorded'}
                {stream === 'trades' ? (monthInfo ? ` · ${monthInfo.trades.lines} events this month, ${kb(monthInfo.trades.bytes)}` : '') : dayInfo?.[stream] ? ` · ${kb(dayInfo[stream].bytes)} on disk` : ''}
                {journal.loading ? <> · <span className="busy" /></> : null}
              </div>
              <div className="meta" style={{ marginTop: 8 }}>
                In the terminal: <code>node scripts/journal.js --date {date}{stream !== 'activity' ? ` --stream ${stream}` : ''}{level ? ` --level ${level}` : ''}{debouncedQ ? ` --grep "${debouncedQ}"` : ''}</code>
              </div>
            </div>
            <div>
              <h3 className="h3">Events per hour</h3>
              {summary?.byHour ? <HourBars byHour={summary.byHour} /> : null}
            </div>
            <div>
              <h3 className="h3">Most repeated</h3>
              {summary?.topMessages?.length ? (
                <ul className="top-msgs">
                  {summary.topMessages.slice(0, 6).map(m => <li key={m.message}><span className="n">{m.count}</span><span className={`lvl-${levelOf(m)}`} style={{ color: 'var(--text-2)' }}>{m.message}</span></li>)}
                </ul>
              ) : <div className="empty">Repeated lines show up here once there is a day of them.</div>}
            </div>
          </div>
        ) : null}

        <div className={`log ${!unavailable ? 'log--tall' : ''}`} ref={logRef} aria-live="polite">
          {entries.length ? entries.map((e, i) => <Line key={`${e.ts}-${i}`} e={e} />) : (
            <div className="muted">{unavailable ? (logs?.length ? '' : 'No live lines on the public demo.') : journal.loading ? 'Loading…' : 'Nothing in this stream for this day.'}</div>
          )}
          {unavailable && logs?.length ? logs.map((l, i) => <Line key={`live-${i}`} e={{ ...l, ts: l.timestamp, type: 'LOG' }} />) : null}
        </div>
        {!unavailable && logs?.length && stream === 'activity' && date === today ? (
          <div className="row row--between" style={{ marginTop: 8 }}>
            <span className="meta">The live buffer holds the last {logs.length} lines; the file holds the day.</span>
            <button className="btn btn--quiet btn--sm" onClick={() => dispatch(clearLogs())}>Clear the live buffer</button>
          </div>
        ) : null}

        <Explain>
          <p>Every line the bot broadcasts to this page is appended to <code>logs/journal/&lt;stream&gt;_&lt;date&gt;.jsonl</code> as it happens: the activity monitor, analysis results and opportunities, and every trade terminal step. A launchd job commits those files to the repo at 23:58 each night, so the history is in git and any agent can read it.</p>
          <p><b>Events per hour</b> gives a day its shape before you read it: a quiet night, a burst of warnings at 14:00, a trade at 09:12. <b>Most repeated</b> collapses numbers so the same message counts as one; it is where a noisy loop shows itself.</p>
          <p>The same files answer the terminal command shown above, which prints a summary and the last lines with the same filters. Wallet balances and addresses are never journaled; provider keys are scrubbed before anything is written.</p>
        </Explain>
      </section>

      <section className="panel">
        <div className="panel-h">
          <div className="row">
            <h2 className="h2">Trade terminal</h2>
            <span className={`pill ${tradeStatus?.status === 'pending' || tradeStatus?.status === 'executing' ? 'pill--warn' : 'pill--good'}`}>{tradeStatus?.status === 'pending' || tradeStatus?.status === 'executing' ? 'trade in flight' : 'ready'}</span>
            {tradeStatus?.txHash ? <span className="meta mono">tx {tradeStatus.txHash.slice(0, 10)}…{tradeStatus.txHash.slice(-6)}</span> : null}
          </div>
          <div className="row">
            <div className="stats">
              <div className="stat"><span className="stat-v sm">{tradeStats.total}</span><span className="stat-l">trades this browser</span></div>
              <div className="stat"><span className="stat-v sm good">{tradeStats.ok}</span><span className="stat-l">success</span></div>
              {tradeStats.failed ? <div className="stat"><span className="stat-v sm bad">{tradeStats.failed}</span><span className="stat-l">failed</span></div> : null}
              <div className="stat"><span className={`stat-v sm ${tradeStats.net >= 0 ? 'good' : 'bad'}`}>{fmtProfit(tradeStats.net)}</span><span className="stat-l">WETH net</span></div>
            </div>
            <button className="btn btn--sm" onClick={() => downloadJSON(`trade-terminal-${Date.now()}.json`, { exportedAt: new Date().toISOString(), trades, current: { tradeStatus, tradeSteps } })} disabled={!trades?.length && !tradeSteps?.length}>Export JSON</button>
          </div>
        </div>
        <div className="log">
          {(trades || []).map((trade, idx) => {
            const id = `t-${idx}`
            const open = !!openTrades[id]
            const ok = trade.status === 'success'
            const profit = parseFloat(trade.profit || 0)
            const steps = Array.isArray(trade.steps) ? trade.steps : []
            return (
              <div key={id}>
                <div className={`trade-row ${open ? 'is-open' : ''}`} onClick={() => setOpenTrades(p => ({ ...p, [id]: !p[id] }))}>
                  <span className="expand">{open ? '▾' : '▸'}</span>
                  <span className={ok ? 'good' : 'bad'}>{ok ? '✓' : '✗'}</span>
                  <span style={{ fontWeight: 600 }}>{trade.pair || 'Trade'}</span>
                  <span className="muted">{trade.buyExchange} → {trade.sellExchange}</span>
                  {(trade.mevProtected || trade.mevConfigured) ? <Tooltip text={trade.mevProtected ? 'Sent as a private transaction' : 'MEV protection configured, not active on this network'}><span className="pill">{trade.mevProtected ? 'private tx' : 'mev configured'}</span></Tooltip> : null}
                  <span className={`num ${profit > 0 ? 'good' : profit < 0 ? 'bad' : 'muted'}`} style={{ marginLeft: 'auto' }}>{fmtProfit(profit)} {trade.tokenSymbol || 'WETH'}</span>
                  <span className="log-t">{clock(trade.timestamp)}</span>
                </div>
                {open ? (
                  <div className="trade-detail">
                    <div className="kv">
                      <div><span>Status</span><span className={ok ? 'good' : 'bad'}>{trade.status}</span></div>
                      <div><span>Amount</span><span className="num">{trade.amount} {trade.tokenSymbol}</span></div>
                      {trade.spread ? <div><span>Spread</span><span className="num">{trade.spread}%</span></div> : null}
                      {(trade.gasPaidEth !== undefined || trade.gasUsed !== undefined) ? <div><span>Gas paid</span><span className="num">{String(trade.gasPaidEth ?? trade.gasUsed)} ETH</span></div> : null}
                      {trade.txHash ? <div><span>Transaction</span><a className="mono" href={`https://arbiscan.io/tx/${trade.txHash}`} target="_blank" rel="noopener noreferrer">{trade.txHash.slice(0, 14)}…{trade.txHash.slice(-8)}</a></div> : null}
                    </div>
                    {steps.length ? <div style={{ marginTop: 8, borderTop: '1px solid var(--line)', paddingTop: 8 }}>{steps.slice(0, 160).map((s, i) => <div key={i} className="step"><span className="log-t">{clock(s.timestamp)}</span><span className={s.status === 'success' ? 'step-ok' : s.status === 'error' ? 'step-err' : 'step-run'}>{s.status === 'success' ? '✓' : s.status === 'error' ? '✗' : '→'}</span><span>{s.label}{s.details ? <span className="dim"> · {s.details}</span> : null}</span></div>)}</div> : null}
                    {trade.error ? <div className="bad" style={{ marginTop: 8 }}>{trade.error}</div> : null}
                  </div>
                ) : null}
              </div>
            )
          })}
          {tradeSteps?.length ? (
            <div style={{ borderTop: trades?.length ? '1px solid var(--line)' : 0, marginTop: trades?.length ? 8 : 0, paddingTop: trades?.length ? 8 : 0 }}>
              <div className="meta" style={{ marginBottom: 4 }}>current</div>
              {tradeSteps.map((s, i) => <div key={i} className="step"><span className="log-t">{clock(s.timestamp)}</span><span className={s.status === 'success' ? 'step-ok' : s.status === 'error' ? 'step-err' : 'step-run'}>{s.status === 'success' ? '✓' : s.status === 'error' ? '✗' : '→'}</span><span>{s.label}{s.details ? <span className="dim"> · {s.details}</span> : null}</span></div>)}
            </div>
          ) : null}
          {!trades?.length && !tradeSteps?.length ? <div className="muted">No trades in this browser yet. In monitor mode none can happen; the edge study's quoted round trips live in the Edge view.</div> : null}
          {tradeStatus?.status === 'failed' && tradeStatus?.error ? <div className="bad" style={{ marginTop: 8 }}>{tradeStatus.error}</div> : null}
        </div>
        <p className="meta" style={{ marginTop: 8 }}>This list is the browser's own memory of completed trades. The journal's <b>trades</b> stream above is the durable copy, one file per month.</p>
      </section>
    </>
  )
}
