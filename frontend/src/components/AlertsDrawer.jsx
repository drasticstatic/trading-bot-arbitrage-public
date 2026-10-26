import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { isStaticHost } from '../store/websocket'

const PUBLIC_TOPIC = 'fortunatrades-arb-live'
const SEEN_KEY = 'ft-alerts-seen'

/**
 * What counts as an alert. Nothing new is logged for this: alerts are a reading of the activity
 * stream the journal already keeps (warnings, errors, successes, and the edge candidates that
 * cleared costs or would have fired). The same rules drive the phone pushes in helpers/notify.js.
 */
export function deriveAlerts(logs, candidates) {
  const out = []
  for (const l of logs || []) {
    const msg = String(l.message || '')
    if (l.level === 'ERROR') out.push({ ts: l.timestamp, tone: 'urgent', icon: 'ph-warning-octagon', title: 'Error', text: msg })
    else if (l.level === 'WARN') out.push({ ts: l.timestamp, tone: 'high', icon: 'ph-warning', title: 'Warning', text: msg })
    else if (l.level === 'SUCCESS' && /trade|fired|restarted|deployed/i.test(msg)) out.push({ ts: l.timestamp, tone: 'good', icon: 'ph-check-circle', title: /fired/i.test(msg) ? 'Would have fired' : 'Done', text: msg })
    else if (/Edge:.*clears costs/i.test(msg)) out.push({ ts: l.timestamp, tone: 'high', icon: 'ph-eyes', title: 'Cleared gas and fees', text: msg.replace(/^🧪\s*Edge:\s*/, '') })
    else if (/Bot (started|stopped|restarted)|Test (mode|prices)/i.test(msg)) out.push({ ts: l.timestamp, tone: 'info', icon: 'ph-power', title: 'Bot status', text: msg })
  }
  for (const c of candidates || []) {
    if (!(c.clears || c.wouldFire)) continue
    out.push({ ts: c.ts, tone: c.wouldFire ? 'good' : 'high', icon: c.wouldFire ? 'ph-rocket-launch' : 'ph-eyes', title: `${c.symbol} ${c.wouldFire ? 'would have fired' : 'cleared gas and fees'}`, text: `${c.buyDex} → ${c.sellDex}, ${Number(c.netSpreadPct ?? c.spreadPct).toFixed(2)}% after fees, best ${c.best?.netEth != null ? `${c.best.netEth >= 0 ? '+' : ''}${Number(c.best.netEth).toFixed(5)} ETH` : '—'} at ${c.best?.sizeEth} ETH`, key: `c:${c.ts}` })
  }
  const seen = new Set()
  return out
    .filter(a => { const k = a.key || `${a.ts}|${a.title}|${a.text}`; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
}

export function useAlerts() {
  const { logs, candidates } = useSelector(s => s.bot)
  const alerts = useMemo(() => deriveAlerts(logs, candidates), [logs, candidates])
  const [seenAt, setSeenAt] = useState(() => { try { return localStorage.getItem(SEEN_KEY) || '' } catch { return '' } })
  const unseen = alerts.filter(a => !seenAt || new Date(a.ts) > new Date(seenAt)).length
  const markSeen = () => { const now = new Date().toISOString(); setSeenAt(now); try { localStorage.setItem(SEEN_KEY, now) } catch { /* ignore */ } }
  return { alerts, unseen, markSeen }
}

/** Desktop notifications while the page is open; the phone is the bot's job (see the Follow card). */
function useDesktopNotify(alerts) {
  const [perm, setPerm] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'))
  const lastRef = useRef(alerts[0]?.ts || null)
  useEffect(() => {
    if (perm !== 'granted' || !alerts.length) return
    const newest = alerts[0]
    if (lastRef.current && new Date(newest.ts) > new Date(lastRef.current) && newest.tone !== 'info') {
      try { new Notification(`ARB · ${newest.title}`, { body: newest.text.slice(0, 180), tag: `${newest.ts}` }) } catch { /* ignore */ }
    }
    lastRef.current = newest.ts
  }, [alerts, perm])
  const ask = async () => { try { setPerm(await Notification.requestPermission()) } catch { /* ignore */ } }
  return { perm, ask }
}

const when = (ts) => { const d = new Date(ts); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }

export default function AlertsDrawer({ open, onClose, alerts, markSeen }) {
  const demo = isStaticHost()
  const history = useSelector(s => s.bot.readings?.alerts) || []
  const [showHistory, setShowHistory] = useState(demo)
  const { perm, ask } = useDesktopNotify(alerts)
  const [status, setStatus] = useState(null)
  const base = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/').replace(/\/?$/, '/')

  useEffect(() => { if (open) markSeen() }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open || demo) return
    fetch('/api/alerts/status').then(r => r.ok ? r.json() : null).then(setStatus).catch(() => setStatus(null))
  }, [open, demo])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Alerts">
        <div className="drawer-h">
          <h2 className="h2"><i className="ph-duotone ph-bell" aria-hidden="true" />Alerts</h2>
          <button type="button" className="ibtn" onClick={onClose} title="Close"><i className="ph-duotone ph-x" aria-hidden="true" /></button>
        </div>
        <div className="drawer-b">
          <div className="follow">
            <div className="row row--between">
              <strong><i className="ph-duotone ph-device-mobile" aria-hidden="true" /> On your phone</strong>
              <a className="btn btn--sm" href={`${base}phone-alerts.html`} target="_blank" rel="noopener noreferrer">How it works</a>
            </div>
            <p>The bot pushes what matters to <a href="https://ntfy.sh/app" target="_blank" rel="noopener noreferrer">ntfy</a> (free app, no account): a route that would have fired, one that cleared gas and fees, an error, a stop, a trade, the nightly report. Subscribe to the public mirror:</p>
            <div className="topic">{PUBLIC_TOPIC}</div>
            <p>{status ? <>On this machine: private topic {status.private ? 'configured' : 'not configured'} · public mirror {status.public ? 'on' : 'off'}.</> : demo ? 'The private topic stays on the machine that runs the bot; the public mirror carries the same alerts.' : ''}</p>
          </div>
          <div className="row row--between">
            <span className="meta">{alerts.length ? `${alerts.length} in this session` : 'Nothing has needed attention in this session.'}</span>
            {perm === 'granted' ? <span className="pill pill--good">desktop alerts on</span>
              : perm === 'denied' ? <span className="pill pill--warn" title="Allow notifications for this site in the browser to turn them on">desktop alerts blocked</span>
                : perm === 'unsupported' ? null
                  : <button type="button" className="btn btn--sm" onClick={ask}>Enable desktop alerts</button>}
          </div>
          {alerts.slice(0, 80).map((a, i) => (
            <div key={`${a.ts}-${i}`} className={`alert alert--${a.tone}`}>
              <i className={`ph-duotone ${a.icon}`} aria-hidden="true" />
              <div><div className="alert-t">{a.title}</div><div className="alert-m">{a.text}</div></div>
              <span className="alert-when">{when(a.ts)}</span>
            </div>
          ))}
          {demo && !history.length ? <p className="empty">The public demo has no live stream, so this list fills only on a machine running the bot. The journal keeps every day; the phone gets the ones that matter.</p> : null}
          <div className="row row--between hist-toggle">
            <span className="meta">History · the last 7 days from the journal{history.length ? ` · ${history.length}` : ''}</span>
            {history.length ? <button type="button" className="btn btn--sm btn--quiet" onClick={() => setShowHistory(v => !v)}>{showHistory ? 'Hide' : 'Show'}</button> : null}
          </div>
          {showHistory ? history.slice(0, 300).map((a, i) => (
            <div key={`h-${a.ts}-${i}`} className={`alert alert--${a.tone}`}>
              <i className={`ph-duotone ${a.tone === 'urgent' ? 'ph-warning-octagon' : a.tone === 'high' ? 'ph-warning' : a.tone === 'good' ? 'ph-check-circle' : 'ph-power'}`} aria-hidden="true" />
              <div><div className="alert-t">{a.title}</div><div className="alert-m">{a.text}</div></div>
              <span className="alert-when">{new Date(a.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          )) : null}
          {showHistory && !history.length ? <p className="empty">Nothing in the journal has needed attention yet.</p> : null}
        </div>
      </aside>
    </>
  )
}
