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
    <div className="glass rounded-2xl p-6 glow-purple">
      <h2 className="text-xl font-display font-bold gradient-text mb-4">⚙️ SETTINGS</h2>

      <div className="space-y-4">
        {/* Price Difference Threshold */}
        <div>
          <label className="block text-purple-300/70 text-sm mb-2 font-medium">
            Price Difference Threshold (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={localSettings.priceDifference}
            onChange={(e) => handleChange('priceDifference', parseFloat(e.target.value))}
            className="w-full glass border border-purple-500/30 rounded-xl px-4 py-3 text-white font-display focus:outline-none focus:border-fuchsia-500 focus:glow-pink transition-all"
          />
          <div className="text-purple-400/50 text-xs mt-1">
            Minimum % to trigger opportunity
          </div>
        </div>

        {/* Gas Limit */}
        <div>
          <label className="block text-purple-300/70 text-sm mb-2 font-medium">
            Gas Limit
          </label>
          <input
            type="number"
            step="10000"
            min="100000"
            max="1000000"
            value={localSettings.gasLimit}
            onChange={(e) => handleChange('gasLimit', parseInt(e.target.value))}
            className="w-full glass border border-purple-500/30 rounded-xl px-4 py-3 text-white font-display focus:outline-none focus:border-fuchsia-500 transition-all"
          />
        </div>

        {/* Gas Price */}
        <div>
          <label className="block text-purple-300/70 text-sm mb-2 font-medium">
            Gas Price (ETH)
          </label>
          <input
            type="number"
            step="0.000000001"
            min="0"
            value={localSettings.gasPrice}
            onChange={(e) => handleChange('gasPrice', parseFloat(e.target.value))}
            className="w-full glass border border-purple-500/30 rounded-xl px-4 py-3 text-white font-display focus:outline-none focus:border-fuchsia-500 transition-all"
          />
        </div>

        {/* Auto Execute Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-xl ${localSettings.autoExecute ? 'glass-green glow-green' : 'glass'}`}>
          <div>
            <div className="text-white font-medium font-display">Auto Execute</div>
            <div className="text-purple-400/50 text-xs">
              Auto-trade on opportunities
            </div>
          </div>
          <button
            onClick={() => handleChange('autoExecute', !localSettings.autoExecute)}
            className={`relative w-14 h-7 rounded-full transition-all ${
              localSettings.autoExecute ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gray-600'
            }`}
            style={{boxShadow: localSettings.autoExecute ? '0 0 20px rgba(0,255,136,0.5)' : 'none'}}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              localSettings.autoExecute ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {localSettings.autoExecute && (
          <div className="p-3 glass border border-yellow-500/50 rounded-xl text-yellow-400 text-xs text-center animate-pulse">
            ⚠️ AUTO-EXECUTE ACTIVE - Trades fire automatically!
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-3 btn-neon rounded-xl font-bold font-display text-white transition-all"
            >
              💾 SAVE
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-medium transition-all"
            >
              ↺ Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel

