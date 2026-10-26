import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Tooltip — hover/focus text, portalled to <body> so tables and overflow containers cannot clip it. */
function Tooltip({ text, children, offset = 8, maxWidth = 300 }) {
  const [isVisible, setIsVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const wrapperRef = useRef(null)

  const updatePos = useCallback(() => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setPos({ x: rect.left + rect.width / 2, y: rect.bottom + offset })
  }, [offset])

  const show = () => { if (!text) return; updatePos(); setIsVisible(true) }
  const hide = () => setIsVisible(false)

  useEffect(() => {
    if (!isVisible) return
    const move = () => updatePos()
    window.addEventListener('scroll', move, true)
    window.addEventListener('resize', move)
    return () => {
      window.removeEventListener('scroll', move, true)
      window.removeEventListener('resize', move)
    }
  }, [isVisible, updatePos])

  const node = (
    <div className="tip" role="tooltip" style={{ top: `${pos.y}px`, left: `${pos.x}px`, maxWidth: `${maxWidth}px` }}>
      {text}
    </div>
  )

  return (
    <span ref={wrapperRef} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} style={{ display: 'inline-block' }}>
      {children}
      {isVisible && typeof document !== 'undefined' ? createPortal(node, document.body) : null}
    </span>
  )
}

export default Tooltip
