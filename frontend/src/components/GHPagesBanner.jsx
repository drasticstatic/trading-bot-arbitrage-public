import React, { useEffect, useRef, useState } from 'react'
import { isStaticHost } from '../store/websocket'

/**
 * GHPagesBanner — the first thing a visitor to the public demo sees: what this page is, what is
 * real on it, and what is not. Once per browser tab.
 */
export default function GHPagesBanner() {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isStaticHost()) return
    let seen = false
    try { seen = sessionStorage.getItem('ft-demo-note') === '1' } catch { /* private mode */ }
    if (!seen) setOpen(true)
  }, [])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  if (!isStaticHost()) return null

  const dismiss = () => {
    try { sessionStorage.setItem('ft-demo-note', '1') } catch { /* ignore */ }
    setOpen(false)
  }

  return (
    <dialog ref={ref} className="dlg" onCancel={(e) => { e.preventDefault(); dismiss() }}>
      <div className="dlg-body">
        <p className="dlg-kicker">Public demo</p>
        <h3 className="dlg-title">The FortunaTrades ARB terminal, served from GitHub Pages</h3>
        <div className="dlg-text">
          <p style={{ marginTop: 0 }}>This is the real front end with a frozen feed. The edge study comes from the nightly snapshot the private bot publishes, so the numbers are real readings from live Arbitrum.</p>
          <p>The screener, the journal and the controls need the bot running on a local machine. Here they explain themselves instead of acting, and nothing on this page can send a transaction.</p>
          <p style={{ marginBottom: 0 }}>Earlier versions of this demo are linked in the footer, so you can step back and see how it grew.</p>
        </div>
        <div className="dlg-actions">
          <a className="btn" href="https://github.com/drasticstatic/trading-bot-arbitrage-public" target="_blank" rel="noopener noreferrer">Source on GitHub</a>
          <button type="button" className="btn btn--primary" onClick={dismiss} autoFocus>Explore the demo</button>
        </div>
      </div>
    </dialog>
  )
}
