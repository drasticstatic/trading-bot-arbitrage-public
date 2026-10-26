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

/**
 * The public copy wears the costume (helpers/costume.js): every DEX is a "house" (Velvet, Copper…)
 * and the snapshot lists the houses in play. Each house takes a color slot of its own, so the
 * charts stay readable without saying which house is which venue.
 */
let houses = new Map()
export function registerHouses(list) {
  houses = new Map((list || []).map((h, i) => [String(h).toLowerCase(), `h${i % 6}`]))
}
/** [{ key: 'h0', label: 'Copper' }, …] — the venue kinds to list when the data is in costume. */
export function houseList() {
  return [...houses.entries()].map(([label, key]) => ({ key, label: label[0].toUpperCase() + label.slice(1), short: label[0].toUpperCase() + label.slice(1) }))
}

export function dexKey(name) {
  const n = String(name || '').toLowerCase()
  if (houses.size) { const first = n.split(/[\s·→]/)[0]; if (houses.has(first)) return houses.get(first) }
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
