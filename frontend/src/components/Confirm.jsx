import React, { useEffect, useRef } from 'react'

/**
 * Confirm — a native <dialog> confirmation. Focus trapping, backdrop and Escape come from the
 * browser; the parent owns the open state. tone: 'default' | 'warn' | 'danger'.
 */
export default function Confirm({ open, kicker, title, big, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'default', onConfirm, onCancel }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onEsc = (e) => { e.preventDefault(); onCancel?.() }
    d.addEventListener('cancel', onEsc)
    return () => d.removeEventListener('cancel', onEsc)
  }, [onCancel])

  const toneCls = tone === 'danger' ? 'dlg--danger' : tone === 'warn' ? 'dlg--warn' : ''
  const btnCls = tone === 'danger' ? 'btn--danger' : tone === 'warn' ? 'btn--warn' : 'btn--primary'
  return (
    <dialog ref={ref} className={`dlg ${toneCls}`} onClick={(e) => { if (e.target === ref.current) onCancel?.() }}>
      <div className="dlg-body">
        {kicker ? <p className="dlg-kicker">{kicker}</p> : null}
        <h3 className="dlg-title">{title}</h3>
        {big ? <div className="dlg-big">{big}</div> : null}
        <div className="dlg-text">{children}</div>
        <div className="dlg-actions">
          <button type="button" className="btn" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn ${btnCls}`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </dialog>
  )
}
