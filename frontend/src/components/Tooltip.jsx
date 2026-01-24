import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function Tooltip({ text, children, offset = 10, maxWidth = 280 }) {
  const [isVisible, setIsVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const wrapperRef = useRef(null)

  const updatePos = useCallback(() => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setPos({ x: rect.left + rect.width / 2, y: rect.bottom + offset })
  }, [offset])

  const handleEnter = () => {
    if (!text) return
    updatePos()
    setIsVisible(true)
  }

  const handleLeave = () => {
    setIsVisible(false)
  }

  useEffect(() => {
    if (!isVisible) return

    const handleMove = () => updatePos()

    // capture=true to catch scrolls on nested containers
    window.addEventListener('scroll', handleMove, true)
    window.addEventListener('resize', handleMove)

    return () => {
      window.removeEventListener('scroll', handleMove, true)
      window.removeEventListener('resize', handleMove)
    }
  }, [isVisible, updatePos])

  const tooltipNode = (
    <div
      style={{
        position: 'fixed',
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#e2e8f0',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9999,
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        pointerEvents: 'none',
        maxWidth: `${maxWidth}px`,
        whiteSpace: 'normal',
        textAlign: 'center'
      }}
    >
      {text}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '-12px',
          transform: 'translateX(-50%)',
          border: '6px solid transparent',
          borderBottomColor: 'rgba(15, 23, 42, 0.95)'
        }}
      />
    </div>
  )

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      style={{ display: 'inline-block' }}
    >
      {children}
      {isVisible && typeof document !== 'undefined' ? createPortal(tooltipNode, document.body) : null}
    </div>
  )
}

export default Tooltip
