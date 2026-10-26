/**
 * dex.js — one color per venue, so a route reads at a glance: the same hues the first DApp
 * University build used for its chips (familiar), re-stepped for chart marks and for the light theme.
 * Both mark sets were run through the dataviz palette validator (CVD ΔE ≥ 8 for adjacent pairs,
 * lightness in band, contrast ≥ 3:1 on each surface). Text variants are brighter for legibility.
 */
export const DEXES = [
  { key: 'uniswap', label: 'Uniswap', short: 'Uni' },
  { key: 'pancakeswap', label: 'PancakeSwap', short: 'Cake' },
  { key: 'sushiswap', label: 'SushiSwap', short: 'Sushi' },
  { key: 'camelot', label: 'Camelot', short: 'Camelot' },
  { key: 'curve', label: 'Curve', short: 'Curve' },
  { key: 'balancer', label: 'Balancer', short: 'Bal' }
]

export function dexKey(name) {
  const n = String(name || '').toLowerCase()
  for (const d of DEXES) if (n.includes(d.key) || n.includes(d.short.toLowerCase())) return d.key
  if (n.includes('uni')) return 'uniswap'
  if (n.includes('cake')) return 'pancakeswap'
  return 'other'
}

/** "PancakeSwap 0.01%" → { dex: 'PancakeSwap', fee: '0.01%' } */
export function splitVenue(name) {
  const m = String(name || '').match(/^(.*?)\s*([\d.]+%)?$/)
  return { dex: (m && m[1].trim()) || String(name || ''), fee: (m && m[2]) || '' }
}

/** CSS custom property names for a venue, e.g. var(--dex-uniswap) */
export const dexVar = (name) => `var(--dex-${dexKey(name)})`
export const dexTextVar = (name) => `var(--dex-${dexKey(name)}-text)`
