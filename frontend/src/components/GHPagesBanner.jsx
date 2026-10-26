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
        <p className="dlg-kicker">Public demo · v2, the edge terminal</p>
        <h3 className="dlg-title">FortunaTrades ARB, served from GitHub Pages</h3>
        <div className="dlg-text">
          <p style={{ marginTop: 0 }}>This is the real front end with a frozen feed. The edge study comes from the nightly snapshot the private bot publishes, so the numbers are real readings from live Arbitrum.</p>
          <p>The screener, the journal and the controls need the bot running on a local machine. Here they explain themselves instead of acting, and nothing on this page can send a transaction.</p>
          <p style={{ marginBottom: 0 }}>New here? Start with <b>How it works</b> at the bottom (key 7). The versions button in the top bar steps back to the original build.</p>
        </div>
        <div className="dlg-actions">
          <a className="btn" href="#how" onClick={dismiss}>How it works</a>
          <button type="button" className="btn btn--primary" onClick={dismiss} autoFocus>Explore the terminal</button>
        </div>
      </div>
    </dialog>
  )
}
