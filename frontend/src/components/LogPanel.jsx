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
      case 'ERROR': return 'text-red-500'
      case 'WARN': return 'text-yellow-500'
      case 'SUCCESS': return 'text-green-500'
      case 'INFO': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Activity Log</h2>
        <button
          onClick={() => dispatch(clearLogs())}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Clear
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="h-48 overflow-y-auto bg-[#0d1117] rounded p-3 font-mono text-xs space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-muted text-center py-6">
            Awaiting activity...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-2 py-0.5">
              <span className="text-gray-600 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={getLogColor(log.level)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LogPanel

