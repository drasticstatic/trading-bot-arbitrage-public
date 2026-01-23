import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearLogs } from '../store/botSlice'

function LogPanel() {
  const { logs } = useSelector(state => state.bot)
  const dispatch = useDispatch()
  const [showModal, setShowModal] = useState(false)

  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-500'
      case 'WARN': return 'text-yellow-500'
      case 'SUCCESS': return 'text-green-500'
      case 'INFO': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  // Show only last 5 logs in compact view
  const recentLogs = logs.slice(-5)

  return (
    <>
      <div className="card p-5 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setShowModal(true)}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">📋 Activity</h2>
          <span className="text-xs text-gray-500">{logs.length} logs</span>
        </div>

        <div className="space-y-1">
          {recentLogs.length === 0 ? (
            <div className="text-muted text-center py-4 text-sm">Awaiting activity...</div>
          ) : (
            recentLogs.map((log, index) => (
              <div key={index} className="flex items-center gap-2 text-xs py-1 border-b border-gray-800/50 last:border-0">
                <span className={`${getLogColor(log.level)} truncate flex-1`}>{log.message}</span>
              </div>
            ))
          )}
        </div>

        <div className="text-center mt-3">
          <span className="text-xs text-indigo-400 hover:text-indigo-300">Click to view all →</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#12141a] border border-[#1e2028] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#1e2028]">
              <h3 className="text-lg font-semibold text-white">📋 Activity Log</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => dispatch(clearLogs())} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">×</button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <div className="text-muted text-center py-8">No activity yet</div>
              ) : (
                [...logs].reverse().map((log, index) => (
                  <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-800/30">
                    <span className="text-gray-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={getLogColor(log.level)}>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LogPanel

