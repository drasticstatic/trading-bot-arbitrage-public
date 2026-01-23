import React, { useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearLogs } from '../store/botSlice'

function LogPanel() {
  const { logs } = useSelector(state => state.bot)
  const dispatch = useDispatch()
  const logContainerRef = useRef(null)

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-400'
      case 'WARN': return 'text-yellow-400'
      case 'SUCCESS': return 'text-emerald-400'
      case 'INFO': return 'text-cyan-400'
      default: return 'text-purple-300'
    }
  }

  const getLogIcon = (level) => {
    switch (level) {
      case 'ERROR': return '❌'
      case 'WARN': return '⚠️'
      case 'SUCCESS': return '✅'
      case 'INFO': return '💠'
      default: return '📝'
    }
  }

  return (
    <div className="glass rounded-2xl p-6 glow-purple">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold gradient-text">📋 ACTIVITY LOG</h2>
        <button
          onClick={() => dispatch(clearLogs())}
          className="text-sm text-purple-400 hover:text-fuchsia-400 font-medium transition-colors"
        >
          🗑️ Clear
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto glass rounded-xl p-4 font-mono text-xs space-y-2"
        style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(20,0,40,0.5) 100%)'}}
      >
        {logs.length === 0 ? (
          <div className="text-purple-400/50 text-center py-8">
            <div className="text-2xl mb-2">📭</div>
            Awaiting activity...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-2 hover:bg-white/5 rounded px-2 py-1 transition-colors">
              <span className="text-purple-500/50 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span>{getLogIcon(log.level)}</span>
              <span className={getLogColor(log.level)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LogPanel

