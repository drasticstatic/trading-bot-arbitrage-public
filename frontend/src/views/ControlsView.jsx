import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getWalletInfo, sendMessage, updateBotSettings, estimateDeployCost, isStaticHost } from '../store/websocket'
import { updateSettings } from '../store/botSlice'
import Confirm from '../components/Confirm'
import Explain from '../components/Explain'
import Tooltip from '../components/Tooltip'

/**
 * ControlsView — everything that changes how the bot behaves, each behind a confirmation that
 * says what will happen: network, fast trade, auto execute, MEV shield, the threshold and gas
 * settings, the wallets, the deploy estimate, and the study's own settings read-only.
 */
const LABELS = { autoExecute: 'Auto execute', gasLimit: 'Gas limit', gasPrice: 'Gas price', mevProtection: 'MEV shield', priceDifference: 'Threshold', skipConfirmation: 'Fast trade', isMainnet: 'Network' }
const fixed = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n.toFixed(d) : '—' }
const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—')

function Toggle({ on, label, desc, tone, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} className={`toggle ${tone === 'danger' ? 'toggle--danger' : tone === 'warn' ? 'toggle--warn' : ''}`} onClick={() => onChange(!on)} disabled={disabled}>
      <span className="toggle-track"><span className="toggle-knob" /></span>
      <span><span className="toggle-l">{label}</span>{desc ? <span className="toggle-d"> · {desc}</span> : null}</span>
    </button>
  )
}

export default function ControlsView() {
  const dispatch = useDispatch()
  const { wallet, settings, connected, tradingMode, network, edge, isExecuting } = useSelector(s => s.bot)
  const demo = isStaticHost()
  const locked = demo || !connected
  const [pending, setPending] = useState(null) // { key, value, kind: 'toggle'|'slider' }
  const [draft, setDraft] = useState(settings)
  const [feedback, setFeedback] = useState(null)
  const [deployEstimate, setDeployEstimate] = useState(null)
  const [estimating, setEstimating] = useState(false)

  useEffect(() => { if (!demo) { getWalletInfo(); const t = setInterval(getWalletInfo, 30000); return () => clearInterval(t) } }, [demo])
  useEffect(() => { if (!pending) setDraft(settings) }, [settings, pending])
  useEffect(() => {
    const h = (e) => { setEstimating(false); setDeployEstimate(e.detail) }
    window.addEventListener('deploy-estimate', h)
    return () => window.removeEventListener('deploy-estimate', h)
  }, [])

  const say = (msg) => { setFeedback(msg); setTimeout(() => setFeedback(null), 2500) }
  const apply = (key, value) => {
    dispatch(updateSettings({ [key]: value }))
    if (key === 'isMainnet') sendMessage('UPDATE_SETTINGS', { [key]: value }); else updateBotSettings({ [key]: value })
    say(`Applied: ${LABELS[key] || key}`)
  }
  const ask = (key, value, kind = 'toggle') => setPending({ key, value, kind })
  const confirm = () => { if (pending) apply(pending.key, pending.value); setPending(null) }
  const cancel = () => { if (pending?.kind === 'slider') setDraft(settings); setPending(null) }

  const isTestnet = !settings?.isMainnet
  const dialog = useMemo(() => {
    if (!pending) return null
    const { key, value } = pending
    if (key === 'isMainnet') return value
      ? { tone: 'danger', kicker: 'Network', title: 'Point the dashboard at Arbitrum mainnet?', text: 'Trades from this page would use real funds. Make sure the wallet holds enough ETH for gas and that you mean it.', confirm: 'Use mainnet' }
      : { tone: 'default', kicker: 'Network', title: 'Point the dashboard at the Hardhat fork?', text: 'Safe testing against a local copy of Arbitrum. Nothing real moves.', confirm: 'Use the fork' }
    if (key === 'skipConfirmation') return value
      ? { tone: 'warn', kicker: 'Fast trade', title: 'Skip the trade confirmation?', text: 'Trade buttons will send immediately, with no dialog in between.', confirm: 'Skip confirmations' }
      : { tone: 'default', kicker: 'Fast trade', title: 'Ask before every trade?', text: 'A confirmation dialog returns before each trade is sent.', confirm: 'Ask first' }
    if (key === 'autoExecute') return value
      ? { tone: 'danger', kicker: 'Auto execute', title: 'Let the bot send trades on its own?', text: `When a route clears the threshold the bot sends it without asking${tradingMode !== 'auto' ? '. On mainnet this also needs tradingMode=auto in config.json, which is not set, so nothing will fire there' : ''}.`, confirm: 'Enable auto execute' }
      : { tone: 'default', kicker: 'Auto execute', title: 'Back to manual?', text: 'The bot flags opportunities and waits for you.', confirm: 'Disable' }
    if (key === 'mevProtection') return value
      ? { tone: 'default', kicker: 'MEV shield', title: 'Send through a private mempool?', text: 'On mainnet, with an Alchemy key, transactions go through a private route so they cannot be sandwiched. On the fork this is recorded but has no effect.', confirm: 'Enable' }
      : { tone: 'warn', kicker: 'MEV shield', title: 'Send through the public mempool?', text: 'Transactions become visible before they land and can be front-run.', confirm: 'Disable' }
    if (key === 'priceDifference') return { tone: 'default', kicker: 'Threshold', title: 'Change the threshold?', big: `${Number(value).toFixed(2)}%`, text: 'The after-fee spread a route must show before it counts as an opportunity. Lower is more sensitive; higher means fewer false positives.', confirm: 'Apply' }
    if (key === 'gasLimit') return { tone: 'default', kicker: 'Gas limit', title: 'Change the gas limit?', big: Number(value).toLocaleString(), text: 'Gas units per transaction. A flash-loan round trip typically needs 300–600k. Higher is safer and costs more.', confirm: 'Apply' }
    if (key === 'gasPrice') return { tone: 'default', kicker: 'Gas price', title: 'Change the gas price?', big: `${Number(value).toFixed(2)} gwei`, text: 'Arbitrum usually clears at 0.01–0.1 gwei. Higher lands faster and costs more.', confirm: 'Apply' }
    return null
  }, [pending, tradingMode])

  const hh = wallet?.hardhat
  const mn = wallet?.mainnet
  const es = edge?.settings

  return (
    <>
      <Confirm open={!!pending && !!dialog} kicker={dialog?.kicker} title={dialog?.title || ''} big={dialog?.big} tone={dialog?.tone} confirmLabel={dialog?.confirm} onConfirm={confirm} onCancel={cancel}>{dialog?.text}</Confirm>

      {demo ? <div className="notice notice--quiet"><div className="notice-t">Controls are shown, not live</div>The public demo has no bot behind it. Everything below works on the operator's machine, each change behind a confirmation that says what it does.</div> : null}
      {!demo && !connected ? <div className="notice notice--bad">Not connected to the bot; controls are locked until the socket is back.</div> : null}

      <div className="grid grid--controls">
        <section className="panel">
          <div className="panel-h">
            <div className="row"><h2 className="h2">Mode</h2><span className={`pill ${tradingMode === 'monitor' ? 'pill--signal' : tradingMode === 'auto' ? 'pill--bad' : 'pill--warn'}`}>{tradingMode || 'monitor'}</span>{feedback ? <span className="feedback">{feedback}</span> : null}</div>
          </div>
          <p className="lede">
            {tradingMode === 'monitor' ? 'Monitor mode is set in config.json. The bot prices, quotes and studies; it cannot send a transaction whatever the switches below say.' : tradingMode === 'manual' ? 'Manual mode: the bot sends only when you click Trade and confirm.' : 'Auto mode: the bot sends on its own when a route clears the threshold.'}
          </p>
          <div className="stack">
            <Toggle on={!isTestnet} tone="danger" label={isTestnet ? 'Hardhat fork' : 'Arbitrum mainnet'} desc={isTestnet ? 'safe local copy' : 'real funds'} onChange={v => ask('isMainnet', v)} disabled={locked} />
            <Toggle on={!!settings?.skipConfirmation} tone="warn" label="Fast trade" desc={settings?.skipConfirmation ? 'no confirmation before a trade' : 'confirm before every trade'} onChange={v => ask('skipConfirmation', v)} disabled={locked} />
            <Toggle on={!!settings?.autoExecute} tone="danger" label="Auto execute" desc={settings?.autoExecute ? 'the bot sends when a route clears' : 'the bot waits for you'} onChange={v => ask('autoExecute', v)} disabled={locked} />
            <Toggle on={!!settings?.mevProtection} label="MEV shield" desc={settings?.mevProtection ? 'private mempool on mainnet with an Alchemy key' : 'public mempool'} onChange={v => ask('mevProtection', v)} disabled={locked} />
          </div>
          <hr className="rule" />
          <div className="row" style={{ gap: 12 }}>
            <Tooltip text="The after-fee spread a route must show to count as an opportunity.">
              <div className="ctl">
                <span className="ctl-l">Threshold</span>
                <span className="ctl-v">{fixed(draft?.priceDifference ?? settings?.priceDifference, 2)}%</span>
                <input className="range" type="range" min="0.05" max="3" step="0.05" value={Number(draft?.priceDifference ?? settings?.priceDifference ?? 0.3)} disabled={locked}
                  onChange={e => setDraft(d => ({ ...d, priceDifference: parseFloat(e.target.value) }))}
                  onMouseUp={e => ask('priceDifference', parseFloat(e.target.value), 'slider')} onTouchEnd={e => ask('priceDifference', parseFloat(e.target.value), 'slider')} onKeyUp={e => { if (e.key.startsWith('Arrow')) ask('priceDifference', parseFloat(e.target.value), 'slider') }} />
              </div>
            </Tooltip>
            <Tooltip text="Gas units per transaction. A flash-loan round trip needs 300–600k.">
              <div className="ctl">
                <span className="ctl-l">Gas limit</span>
                <span className="ctl-v">{Math.round(Number(draft?.gasLimit ?? settings?.gasLimit ?? 600000) / 1000)}k</span>
                <input className="range" type="range" min="100000" max="1500000" step="50000" value={Number(draft?.gasLimit ?? settings?.gasLimit ?? 600000)} disabled={locked}
                  onChange={e => setDraft(d => ({ ...d, gasLimit: parseInt(e.target.value, 10) }))}
                  onMouseUp={e => ask('gasLimit', parseInt(e.target.value, 10), 'slider')} onTouchEnd={e => ask('gasLimit', parseInt(e.target.value, 10), 'slider')} onKeyUp={e => { if (e.key.startsWith('Arrow')) ask('gasLimit', parseInt(e.target.value, 10), 'slider') }} />
              </div>
            </Tooltip>
            <Tooltip text="Gas price in gwei. Arbitrum usually clears at 0.01–0.1.">
              <div className="ctl">
                <span className="ctl-l">Gas price</span>
                <span className="ctl-v">{fixed(draft?.gasPrice ?? settings?.gasPrice, 2)} gwei</span>
                <input className="range" type="range" min="0.01" max="2" step="0.01" value={Number(draft?.gasPrice ?? settings?.gasPrice ?? 0.1)} disabled={locked}
                  onChange={e => setDraft(d => ({ ...d, gasPrice: parseFloat(e.target.value) }))}
                  onMouseUp={e => ask('gasPrice', parseFloat(e.target.value), 'slider')} onTouchEnd={e => ask('gasPrice', parseFloat(e.target.value), 'slider')} onKeyUp={e => { if (e.key.startsWith('Arrow')) ask('gasPrice', parseFloat(e.target.value), 'slider') }} />
              </div>
            </Tooltip>
          </div>
          <Explain>
            <p>The <b>mode</b> comes from <code>tradingMode</code> in <code>config.json</code> and is the outer gate. The switches here are inner gates: they matter only once the mode allows sending.</p>
            <p><b>Threshold</b> is compared with the spread after both pool fees on the best executable route. <b>Gas limit</b> and <b>gas price</b> bound what a transaction may cost; the study uses the same gas limit when it nets its quoted round trips.</p>
            <p>Every change is sent to the bot over the socket and logged in the activity journal with exactly what changed.</p>
          </Explain>
        </section>

        <section className="panel">
          <div className="panel-h">
            <div className="row"><h2 className="h2">Wallets</h2></div>
            <button className="btn btn--sm" onClick={getWalletInfo} disabled={locked}>Refresh balances</button>
          </div>
          {wallet?.error ? <div className="notice notice--warn">{wallet.error}</div> : null}
          {!wallet && !demo ? <div className="empty">Loading wallet balances…</div> : null}
          {demo ? <div className="empty">Balances are read live from the bot's RPC and are not published.</div> : null}
          {hh || mn ? (
            <div className="grid grid--2">
              {[['Hardhat fork', hh, 'chain 31337', isTestnet], ['Arbitrum', mn, mn?.chainId ? `chain ${mn.chainId}` : 'chain 42161', !isTestnet]].map(([name, w, chain, active]) => (
                <div key={name} className="notice notice--quiet" style={{ marginBottom: 0, borderLeftColor: active ? 'var(--signal)' : undefined }}>
                  <div className="row row--between"><span className="notice-t">{name}</span><span className="meta">{chain}{w?.rpc ? ` · rpc ${w.rpc}` : ''}{active ? ' · selected' : ''}</span></div>
                  {w ? (
                    <>
                      <div className="mono muted" style={{ fontSize: 11.5, margin: '2px 0 6px' }} title={w.address}>{short(w.address)}{w.address ? <> · <a href={`https://arbiscan.io/address/${w.address}`} target="_blank" rel="noopener noreferrer">Arbiscan</a></> : null}</div>
                      <div className="stats" style={{ gap: '10px 20px' }}>
                        <div className="stat"><span className="stat-v sm">{fixed(w.ethBalance, 4)}</span><span className="stat-l">ETH for gas</span></div>
                        <div className="stat"><span className="stat-v sm">{fixed(w.wethBalance, 4)}</span><span className="stat-l">WETH trading</span></div>
                        <div className="stat"><span className="stat-v sm">{fixed(w.arbBalance, 2)}</span><span className="stat-l">ARB</span></div>
                      </div>
                      {w.warning ? <div className="warn" style={{ marginTop: 6 }}>{w.warning}</div> : null}
                      {name === 'Arbitrum' && Number(w.ethBalance) < 0.002 && w.ethBalance !== '—' ? <div className="warn" style={{ marginTop: 6 }}>Low ETH: enough to deploy, not enough for sustained trading. Funding waits on the study's verdict.</div> : null}
                    </>
                  ) : <div className="muted">not configured</div>}
                </div>
              ))}
            </div>
          ) : null}
          <p className="meta" style={{ marginTop: 10 }}>Profits accrue in WETH; ETH goes down with gas. The address shown is the bot's own trading account; keys never leave the machine.</p>
        </section>

        <section className="panel">
          <div className="panel-h">
            <div className="row"><h2 className="h2">Deploy</h2></div>
            <button className="btn btn--sm" onClick={() => { if (deployEstimate && !estimating) { setDeployEstimate(null); return } setEstimating(true); setDeployEstimate(null); estimateDeployCost() }} disabled={locked || isExecuting}>{estimating ? <><span className="busy" /> Estimating…</> : deployEstimate ? 'Hide estimate' : 'Estimate deploy cost'}</button>
          </div>
          <p className="lede">The arbitrage contract must be deployed on Arbitrum before the bot can execute there. The estimate reads today's gas and the contract's size; nothing is sent.</p>
          {deployEstimate ? (deployEstimate.error ? <div className="notice notice--bad">{deployEstimate.error}</div> : (
            <>
              <div className="stats">
                <div className="stat"><span className="stat-v sm">{deployEstimate.network}</span><span className="stat-l">network</span></div>
                <div className="stat"><span className="stat-v sm">{Number(deployEstimate.gasUnits).toLocaleString()}</span><span className="stat-l">gas units</span></div>
                <div className="stat"><span className="stat-v sm">{deployEstimate.costEth}</span><span className="stat-l">ETH</span></div>
                <div className="stat"><span className="stat-v sm">${deployEstimate.costUsd}</span><span className="stat-l">USD</span></div>
              </div>
              <p className="meta" style={{ margin: '8px 0' }}>{deployEstimate.note || 'Estimate at current network conditions.'}</p>
              <ol className="text-2" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                <li>Hold at least <span className="num">{deployEstimate.costEth} ETH</span> on Arbitrum</li>
                <li><code>npx hardhat run scripts/deploy.js --network arbitrum</code></li>
                <li>Put the new address in <code>.env</code> as <code>ARBITRAGE_ADDRESS</code></li>
                <li>Set <code>tradingMode</code> and restart the bot</li>
              </ol>
            </>
          )) : null}
        </section>

        <section className="panel">
          <div className="panel-h"><div className="row"><h2 className="h2">Study settings</h2><span className="meta">read-only · config.json → edgeStudy</span></div></div>
          {es ? (
            <div className="kv">
              <div><span>Candidate floor</span><span className="num">{es.candidateFloorPct}% after fees</span></div>
              <div><span>Size ladder</span><span className="num">{(es.sizeLadderEth || []).join(' / ')} ETH</span></div>
              <div><span>Simulation cooldown</span><span className="num">{es.simCooldownMs ? `${Math.round(es.simCooldownMs / 1000)} s` : '—'}</span></div>
              <div><span>Flash-loan fee</span><span className="num">{es.flashLoanFeeBps} bps</span></div>
              <div><span>Gas limit used for netting</span><span className="num">{Number(es.gasLimit || 0).toLocaleString()}</span></div>
              <div><span>Study length</span><span className="num">{es.studyDays} days</span></div>
              <div><span>Study clock started</span><span className="num">{es.studyStartedAt ? new Date(es.studyStartedAt).toLocaleString() : 'first tick'}</span></div>
              <div><span>Infrastructure</span><span className="num">{es.infraCostUsdPerDay ? `$${es.infraCostUsdPerDay}/day` : 'not set'}</span></div>
            </div>
          ) : <div className="empty">The study is not running on this bot.</div>}
          <hr className="rule" />
          <h3 className="h3">On the machine</h3>
          <pre className="log" style={{ margin: 0, maxHeight: 'none', minHeight: 0, whiteSpace: 'pre' }}>{`sh scripts/edge-monitor-service.sh status     # is the monitor up, last tick
sh scripts/edge-monitor-service.sh logs       # follow stdout
sh scripts/edge-monitor-service.sh journal    # recall the journal (node scripts/journal.js …)
sh scripts/edge-monitor-service.sh commit     # commit + push today's journal now
node scripts/edge-report.js --handoff --public  # the daily line + the public snapshot`}</pre>
          <Explain>
            <p>The study runs as a launchd agent that survives crashes and logins. Each night a second agent writes the daily summary and the public snapshot; a third commits the journal and those outputs to git and pushes them.</p>
          </Explain>
        </section>
      </div>
    </>
  )
}
