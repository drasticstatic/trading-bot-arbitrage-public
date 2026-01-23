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
      case 'SUCCESS': return 'text-green-400'
      case 'INFO': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getLogIcon = (level) => {
    switch (level) {
      case 'ERROR': return '❌'
      case 'WARN': return '⚠️'
      case 'SUCCESS': return '✅'
      case 'INFO': return 'ℹ️'
      default: return '📝'
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">📋 Activity Log</h2>
        <button
          onClick={() => dispatch(clearLogs())}
          className="text-sm text-gray-400 hover:text-white"
        >
          Clear
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto bg-gray-900 rounded-lg p-3 font-mono text-xs space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-gray-600 shrink-0">
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

