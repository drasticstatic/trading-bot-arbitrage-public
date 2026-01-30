import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearLogs } from '../store/botSlice'

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

function LogPanel() {
  const { logs } = useSelector(state => state.bot)
  const dispatch = useDispatch()
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef(null)

  const getLogStyle = (level) => {
    switch (level) {
      case 'ERROR': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
      case 'WARN': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
      case 'SUCCESS': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
      case 'INFO': return { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' }
      default: return { color: '#94a3b8', bg: 'transparent' }
    }
  }

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, expanded])

  const recentLogs = expanded ? logs : logs.slice(-8)

  return (
    <div className="glass h-full" style={{
      padding: '16px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, rgba(18, 20, 26, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '18px' }}>📋</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '15px' }}>Activity Monitor</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '10px', color: '#64748b', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
            {logs.length} logs
          </span>
          {logs.length > 0 && (
            <button
              onClick={() => downloadJSON(`dappu-activity-log-${Date.now()}.json`, { exportedAt: new Date().toISOString(), logs })}
              style={{ fontSize: '10px', color: '#93c5fd', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.25)', cursor: 'pointer', fontWeight: 700 }}
            >
              Export
            </button>
          )}
          {logs.length > 0 && (
            <button
              onClick={() => dispatch(clearLogs())}
              style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Log list */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '10px',
        padding: '10px',
        maxHeight: expanded ? '400px' : '200px',
        minHeight: '150px',
        transition: 'max-height 0.3s ease'
      }}>
        {recentLogs.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '30px 0', fontSize: '12px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📭</div>
            Awaiting activity...
          </div>
        ) : (
          recentLogs.map((log, index) => {
            const style = getLogStyle(log.level)
            return (
              <div key={index} style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '6px 8px', marginBottom: '4px',
                background: style.bg, borderRadius: '6px',
                fontSize: '11px', fontFamily: 'ui-monospace, monospace'
              }}>
                <span style={{ color: '#64748b', flexShrink: 0, fontSize: '10px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ color: style.color, flex: 1, wordBreak: 'break-word' }}>{log.message}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Expand/Collapse button */}
      {logs.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: '10px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: expanded ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${expanded ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
            color: expanded ? '#fbbf24' : '#a5b4fc',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <span>{expanded ? '🔼' : '🔽'}</span>
          {expanded ? 'Collapse' : `Show All (${logs.length})`}
        </button>
      )}
    </div>
  )
}

export default LogPanel

