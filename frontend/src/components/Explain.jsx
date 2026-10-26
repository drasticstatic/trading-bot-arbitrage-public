import React from 'react'

/**
 * Explain — a quiet "How to read this" disclosure under a panel. The terminal teaches as it goes:
 * every view says what its numbers mean in plain words, closed by default so operators are not
 * slowed down and learners can open it when they want the lesson.
 */
export default function Explain({ title = 'How to read this', children }) {
  return (
    <details className="explain">
      <summary>{title}</summary>
      <div className="explain-body">{children}</div>
    </details>
  )
}
