import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import Tooltip from './Tooltip'

// Funding rate APY color gradient (green=positive income, red=negative cost)
function getFundingColor(apy) {
  if (apy === null || apy === undefined) return '#64748b'
  if (apy > 100) return '#ef4444' // Super high funding (risky to be long perp)
  if (apy > 50) return '#f59e0b' // High funding
  if (apy > 20) return '#84cc16' // Good funding opportunity
  if (apy > 0) return '#10b981' // Positive funding
  if (apy > -20) return '#06b6d4' // Small negative
  return '#8b5cf6' // Deep negative
}

// Spread intensity color
function getSpreadColor(spreadPct) {
  if (!spreadPct) return '#64748b'
  const abs = Math.abs(spreadPct)
  if (abs > 1.5) return '#ef4444'
  if (abs > 1.0) return '#f59e0b'
  if (abs > 0.5) return '#84cc16'
  if (abs > 0.2) return '#10b981'
  return '#64748b'
}

export default function PerpOpportunitiesPanel() {
  const { screenerPairs, perpStatus } = useSelector(state => state.bot)
  const [calculatorCapital, setCalculatorCapital] = useState(10000)

  // Extract pairs with perp data
  const perpPairs = useMemo(() => {
    if (!screenerPairs) return []
    return screenerPairs
      .filter(p => p.perp && p.perp.price)
      .map(p => ({
        name: p.name || p.pairName,
        spotPrice: Object.values(p.prices || {}).reduce((a, b) => (a + Number(b)) / 2, 0) || 0,
        perpPrice: p.perp?.price,
        spreadPct: p.perp?.spreadPct,
        direction: p.perp?.direction,
        signal: p.perp?.signal,
        fundingRate: p.funding?.rate,
        fundingAPY: p.funding?.rateAnnualized,
        nextFundingTime: p.funding?.nextTime
      }))
      .sort((a, b) => Math.abs(b.fundingAPY || 0) - Math.abs(a.fundingAPY || 0))
  }, [screenerPairs])

  // Calculate best delta-neutral opportunity
  const bestOpportunity = useMemo(() => {
    if (!perpPairs.length) return null
    const best = perpPairs.reduce((a, b) =>
      Math.abs(b.fundingAPY || 0) > Math.abs(a.fundingAPY || 0) ? b : a
    )
    return best.fundingAPY ? best : null
  }, [perpPairs])

  // Calculate potential income from delta-neutral strategy
  const calculateDeltaNeutralIncome = (capital, apy) => {
    if (!apy) return { daily: 0, monthly: 0, yearly: 0 }
    const yearlyIncome = (capital * apy) / 100
    return {
      daily: yearlyIncome / 365,
      monthly: yearlyIncome / 12,
      yearly: yearlyIncome
    }
  }

  const income = bestOpportunity
    ? calculateDeltaNeutralIncome(calculatorCapital, bestOpportunity.fundingAPY)
    : null

  return (
    <div className="glass rounded-xl p-5 mt-6" style={{
      background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(16, 185, 129, 0.08) 100%)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '24px' }}>🔮</span>
          <h2 style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            Perp Opportunities
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span style={{
            fontSize: '10px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: perpStatus?.initialized ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: perpStatus?.initialized ? '#10b981' : '#ef4444',
            fontWeight: 600
          }}>
            {perpStatus?.initialized ? `● ${perpStatus.cachedPairs || 0} Pairs` : '○ Offline'}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Funding Rate Heatmap */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(100, 116, 139, 0.2)'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            📊 Funding Rate Heatmap
          </h3>

          {perpPairs.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '24px' }}>
              No perp data available
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {perpPairs.slice(0, 12).map(pair => (
                <Tooltip key={pair.name} text={`${pair.name}: ${pair.fundingAPY?.toFixed(1) || 0}% APY | Spread: ${pair.spreadPct?.toFixed(3) || 0}%`}>
                  <div style={{
                    background: `linear-gradient(135deg, ${getFundingColor(pair.fundingAPY)}22, ${getFundingColor(pair.fundingAPY)}11)`,
                    border: `1px solid ${getFundingColor(pair.fundingAPY)}44`,
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }} className="hover:scale-105">
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>
                      {pair.name?.split('/')[0] || pair.name}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: getFundingColor(pair.fundingAPY) }}>
                      {pair.fundingAPY?.toFixed(0) || 0}%
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>APY</div>
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </div>

        {/* Right: Delta-Neutral Calculator */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(100, 116, 139, 0.2)'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            🧮 Delta-Neutral Calculator
          </h3>

          {bestOpportunity ? (
            <div>
              {/* Best Opportunity Badge */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <div style={{ fontSize: '10px', color: '#a5b4fc', marginBottom: '4px', fontWeight: 600 }}>
                  🏆 BEST OPPORTUNITY
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
                    {bestOpportunity.name}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: getFundingColor(bestOpportunity.fundingAPY),
                    padding: '2px 8px',
                    background: `${getFundingColor(bestOpportunity.fundingAPY)}22`,
                    borderRadius: '6px'
                  }}>
                    {bestOpportunity.fundingAPY?.toFixed(1)}% APY
                  </span>
                </div>
              </div>

              {/* Capital Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                  Investment Capital (USD)
                </label>
                <input
                  type="number"
                  value={calculatorCapital}
                  onChange={(e) => setCalculatorCapital(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    color: '#e2e8f0',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                  placeholder="10000"
                />
              </div>

              {/* Income Projections */}
              <div className="grid grid-cols-3 gap-2">
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>DAILY</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                    ${income?.daily?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                  border: '1px solid rgba(6, 182, 212, 0.2)'
                }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>MONTHLY</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>
                    ${income?.monthly?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>YEARLY</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>
                    ${income?.yearly?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Strategy Explanation */}
              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: 'rgba(100, 116, 139, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(100, 116, 139, 0.2)'
              }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.5 }}>
                  💡 <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Delta-Neutral Strategy:</span> Long spot + Short perp.
                  Collect funding while neutralizing price exposure. {bestOpportunity.fundingAPY > 0 ? 'Positive' : 'Negative'} funding = {bestOpportunity.fundingAPY > 0 ? 'shorts pay longs' : 'longs pay shorts'}.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '24px' }}>
              Waiting for perp data...
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Live Spread Table */}
      <div style={{
        marginTop: '16px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
          ⚡ Live Spot-Perp Spreads
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.2)' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontWeight: 600 }}>Pair</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontWeight: 600 }}>Spot Price</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontWeight: 600 }}>Perp Price</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontWeight: 600 }}>Spread</th>
                <th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontWeight: 600 }}>Funding APY</th>
                <th style={{ textAlign: 'center', padding: '8px', color: '#64748b', fontWeight: 600 }}>Signal</th>
              </tr>
            </thead>
            <tbody>
              {perpPairs.slice(0, 8).map(pair => (
                <tr key={pair.name} style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.1)' }}>
                  <td style={{ padding: '8px', color: '#e2e8f0', fontWeight: 600 }}>{pair.name}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: '#94a3b8' }}>${pair.spotPrice?.toFixed(4) || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: '#94a3b8' }}>${pair.perpPrice?.toFixed(4) || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: getSpreadColor(pair.spreadPct) }}>
                    {pair.spreadPct > 0 ? '+' : ''}{pair.spreadPct?.toFixed(3) || 0}%
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: getFundingColor(pair.fundingAPY) }}>
                    {pair.fundingAPY?.toFixed(1) || 0}%
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: pair.signal?.includes('SHORT_PERP') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: pair.signal?.includes('SHORT_PERP') ? '#10b981' : '#f87171',
                      fontWeight: 600
                    }}>
                      {pair.signal || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

