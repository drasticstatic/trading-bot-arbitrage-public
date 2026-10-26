import React from 'react'
import { useSelector } from 'react-redux'
import { isStaticHost } from '../store/websocket'
import VersionSwitch from './VersionSwitch'

const fmtHours = (h) => (!Number.isFinite(h) ? '—' : h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${h.toFixed(h < 10 ? 1 : 0)} h` : `${(h / 24).toFixed(1)} days`)

/**
 * TopBar — the brand, the state chips that must stay visible whatever you are reading (mode, chain
 * and block, connection, a stale warning), and the tools: alerts, versions, theme, source.
 */
export default function TopBar({ onAlerts, alertCount, theme, onTheme }) {
  const { connected, tradingMode, network, isTestMode, isRunning, isExecuting, screenerBlock, edge, edgeSnapshotAt, costume } = useSelector(s => s.bot)
  const demo = isStaticHost()

  const mode = isTestMode
    ? { label: 'test prices', cls: 'warn', icon: 'ph-flask', title: 'The fork has manipulated prices for testing' }
    : tradingMode === 'auto'
      ? { label: 'auto execute', cls: 'bad', icon: 'ph-lightning', title: 'tradingMode=auto in config.json: the bot sends trades itself' }
      : tradingMode === 'manual'
        ? { label: 'manual', cls: 'warn', icon: 'ph-hand-tap', title: 'tradingMode=manual: trades only when you click Trade' }
        : { label: 'monitor only', cls: 'info', icon: 'ph-eye', title: 'tradingMode=monitor: prices, quotes and the study only; nothing can send a transaction' }
  const chain = network === 'hardhat' ? 'Hardhat fork' : network === 'arbitrum' || demo ? 'Arbitrum' : '—'
  const block = screenerBlock || edge?.lastBlock
  const activity = isExecuting ? 'trading' : isRunning ? 'scanning' : connected ? 'idle' : null
  const stale = !demo && edge?.lastTickAt && Date.now() - edge.lastTickAt > 120000
  const themeIcon = theme === 'light' ? 'ph-sun' : theme === 'dark' ? 'ph-moon' : 'ph-circle-half'
  const themeLabel = theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'system'

  return (
    <header className="top">
      <div className="wrap top-in">
        <a className="brand" href="#overview" title="FortunaTrades ARB: the DEX arbitrage lane of the fleet">
          <i className="ph-duotone ph-lightning" aria-hidden="true" />
          <span>FortunaTrades <b>ARB</b></span>
          <small>DEX lane</small>
        </a>
        <div className="top-chips">
          <span className={`chip ${mode.cls}`} title={mode.title}><i className={`ph-duotone ${mode.icon}`} aria-hidden="true" />{mode.label}</span>
          <span className="chip" title="Which chain the bot is reading"><i className="ph-duotone ph-link" aria-hidden="true" />{chain}{block ? <span className="num">· {block}</span> : null}</span>
          {activity ? <span className="chip" title="What the bot is doing right now">{activity}</span> : null}
          {demo
            ? <span className="chip cyan" title={edgeSnapshotAt ? `Snapshot from ${new Date(edgeSnapshotAt).toLocaleString()}` : 'No snapshot published yet'}><i className="dot" />{edgeSnapshotAt ? `snapshot ${new Date(edgeSnapshotAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'public demo'}</span>
            : connected
              ? <span className="chip ok live"><i className="dot" />live</span>
              : <span className="chip bad"><i className="dot" />offline</span>}
          {stale ? <span className="chip warn" title="The bot has not reported a poll for a while">no poll for {fmtHours((Date.now() - edge.lastTickAt) / 3600000)}</span> : null}
          {demo && costume?.on ? <a className="chip info" href="#how" title={costume.note || 'Pairs and venues wear stage names on the public copy; the numbers are the real study.'}><i className="ph-duotone ph-mask-happy" aria-hidden="true" />in costume</a> : null}
        </div>
        <span className="sp" />
        <div className="top-tools">
          <button type="button" className="ibtn" onClick={onAlerts} title="Alerts: what deserved attention, and how to get them on your phone">
            <i className="ph-duotone ph-bell" aria-hidden="true" /><span>Alerts</span>
            {alertCount ? <span className="badge">{alertCount > 99 ? '99+' : alertCount}</span> : null}
          </button>
          <VersionSwitch />
          <button type="button" className="ibtn" onClick={onTheme} title="Theme: follow the system, light, or dark">
            <i className={`ph-duotone ${themeIcon}`} aria-hidden="true" /><span>{themeLabel}</span>
          </button>
          <a className="ibtn" href="https://github.com/drasticstatic/trading-bot-arbitrage-public" target="_blank" rel="noopener noreferrer" title="Source on GitHub (public mirror)">
            <i className="ph-duotone ph-github-logo" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  )
}
