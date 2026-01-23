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
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-white mb-4">⚙️ Settings</h2>

      <div className="space-y-4">
        {/* Price Difference Threshold */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">
            Price Difference Threshold (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={localSettings.priceDifference}
            onChange={(e) => handleChange('priceDifference', parseFloat(e.target.value))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          />
          <div className="text-gray-500 text-xs mt-1">
            Minimum price difference to trigger opportunity
          </div>
        </div>

        {/* Gas Limit */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">
            Gas Limit
          </label>
          <input
            type="number"
            step="10000"
            min="100000"
            max="1000000"
            value={localSettings.gasLimit}
            onChange={(e) => handleChange('gasLimit', parseInt(e.target.value))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Gas Price */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">
            Gas Price (ETH)
          </label>
          <input
            type="number"
            step="0.000000001"
            min="0"
            value={localSettings.gasPrice}
            onChange={(e) => handleChange('gasPrice', parseFloat(e.target.value))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Auto Execute Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <div>
            <div className="text-white font-medium">Auto Execute</div>
            <div className="text-gray-500 text-xs">
              Automatically execute profitable trades
            </div>
          </div>
          <button
            onClick={() => handleChange('autoExecute', !localSettings.autoExecute)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              localSettings.autoExecute ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              localSettings.autoExecute ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {localSettings.autoExecute && (
          <div className="p-2 bg-yellow-900/30 border border-yellow-500/50 rounded text-yellow-400 text-xs">
            ⚠️ Auto-execute is ON - Trades will execute automatically!
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel

