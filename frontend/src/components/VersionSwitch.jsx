import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { isStaticHost } from '../store/websocket'

/**
 * VersionSwitch — the simpler switcher Christopher asked for: one button, one list. Every version
 * of this demo stays up (the time-machine idea from my-template/walkthroughs/VERSION-LINEAGE.md).
 * The list comes from frontend/public/lineage/lineage.json; the live stop is this page.
 */
export default function VersionSwitch() {
  const lineage = useSelector(s => s.bot.lineage)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const base = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/').replace(/\/?$/, '/')
  const demo = isStaticHost()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const stops = (lineage || []).filter(s => s.open)
  const liveStop = stops.find(s => s.kind === 'live')
  const publicRoot = 'https://drasticstatic.github.io/trading-bot-arbitrage-public/'
  const href = (s) => {
    if (s.kind === 'live') return demo ? base : publicRoot
    return demo ? `${base}${s.url}` : `${publicRoot}${s.url}`
  }

  return (
    <div className="pop-wrap" ref={ref}>
      <button type="button" className={`ibtn ${open ? 'is-on' : ''}`} onClick={() => setOpen(o => !o)} aria-expanded={open} title="Every version of this terminal, oldest to newest">
        <i className="ph-duotone ph-clock-counter-clockwise" aria-hidden="true" /><span>{liveStop ? liveStop.short || 'v2' : 'versions'}</span>
      </button>
      {open ? (
        <div className="pop" role="dialog" aria-label="Versions">
          <p className="pop-h">Versions</p>
          <p>Every version stays online. Step back to see how the terminal grew, or forward to the current one. The earlier copies greet you with a note and point here.</p>
          {stops.length ? (
            <ul className="stops">
              {stops.map(s => (
                <li key={s.id}>
                  <a href={href(s)} className={`${s.kind === 'live' ? 'is-live' : ''} ${s.kind === 'live' && demo ? 'is-here' : ''}`} title={s.note}>
                    <strong><i className={`ph-duotone ${s.kind === 'live' ? 'ph-broadcast' : 'ph-rewind'}`} aria-hidden="true" />{s.label}</strong>
                    <span className="when">{s.when || ''}</span>
                    <small>{s.note}</small>
                  </a>
                </li>
              ))}
            </ul>
          ) : <p className="muted">The version list has not loaded.</p>}
          <p className="pop-foot">How this works, and when the next line gets drawn: <a href="#how" onClick={() => setOpen(false)}>How it works · Versions</a>.</p>
        </div>
      ) : null}
    </div>
  )
}
