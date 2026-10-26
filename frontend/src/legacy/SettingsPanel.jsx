import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { updateBotSettings } from '../store/websocket'

function SettingsPanel() {
  const { settings } = useSelector(state => state.bot)
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleSave = () => {
    updateBotSettings(localSettings)
    setHasChanges(false)
  }

  const handleReset = () => {
    setLocalSettings(settings)
    setHasChanges(false)
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-white mb-4">Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-label text-sm mb-1">Price Threshold (%)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={localSettings.priceDifference}
            onChange={(e) => handleChange('priceDifference', parseFloat(e.target.value))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-label text-sm mb-1">Gas Limit</label>
          <input
            type="number"
            step="10000"
            min="100000"
            value={localSettings.gasLimit}
            onChange={(e) => handleChange('gasLimit', parseInt(e.target.value))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-label text-sm mb-1">Gas Price (ETH)</label>
          <input
            type="number"
            step="0.000000001"
            min="0"
            value={localSettings.gasPrice}
            onChange={(e) => handleChange('gasPrice', parseFloat(e.target.value))}
            className="input-field"
          />
        </div>

        <div className="data-row p-3 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">Skip Confirmation</div>
            <div className="text-muted text-xs">Fast manual trading</div>
          </div>
          <button
            onClick={() => handleChange('skipConfirmation', !localSettings.skipConfirmation)}
            className={`relative w-11 h-6 rounded-full transition-all ${
              localSettings.skipConfirmation ? 'bg-yellow-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              localSettings.skipConfirmation ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="data-row p-3 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">Auto Execute</div>
            <div className="text-muted text-xs">Fully automated</div>
          </div>
          <button
            onClick={() => handleChange('autoExecute', !localSettings.autoExecute)}
            className={`relative w-11 h-6 rounded-full transition-all ${
              localSettings.autoExecute ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              localSettings.autoExecute ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {localSettings.autoExecute && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-500 text-xs text-center">
            ⚠️ Auto-execute ON
          </div>
        )}

        {hasChanges && (
          <div className="flex space-x-2">
            <button onClick={handleSave} className="flex-1 btn-primary">Save</button>
            <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Reset</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel

