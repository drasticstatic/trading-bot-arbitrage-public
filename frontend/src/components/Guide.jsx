import React from 'react'
import { useSelector } from 'react-redux'
import { isStaticHost } from '../store/websocket'
import { DEXES } from '../lib/dex'

/**
 * Guide — "How it works": the section Christopher teaches from. One pass from a poll to a decision,
 * what the colors mean, where the data goes, what keeps it safe, and how the versions work.
 */
export default function Guide() {
  const lineage = useSelector(s => s.bot.lineage)
  const demo = isStaticHost()
  const base = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/').replace(/\/?$/, '/')
  const stops = (lineage || []).filter(s => s.open)

  return (
    <section className="panel guide" id="how">
      <div className="panel-h">
        <h2 className="h2"><i className="ph-duotone ph-graduation-cap" aria-hidden="true" />How it works</h2>
        <span className="meta">the whole machine in one screen, for the desk, the class and the board</span>
      </div>
      <p><b>FortunaTrades ARB</b> is the DEX-arbitrage lane of a two-lane operation: Fortuna trades perps, this bot watches decentralized exchanges on Arbitrum for the same token priced differently on two pools, and would buy on the cheap one and sell on the rich one in a single transaction funded by a flash loan. Before any wallet is funded it runs a <b>seven-day study</b> that answers one question: is there an edge worth gas on these pairs, on these venues?</p>

      <div className="guide-grid">
        <div>
          <h3 className="h3">From a poll to a decision</h3>
          <ol className="steps">
            <li><span><b>Price every pool in one block.</b> Each fee tier of each DEX is its own venue; a multicall reads them all at the same block so no price is older than another.</span></li>
            <li><span><b>Rank routes after fees.</b> For each pair, the cheapest pool to buy on and the richest to sell on, scored after both pool fees. That number is the <i>tape</i>.</span></li>
            <li><span><b>Quote the round trip.</b> Any positive after-fee route becomes a candidate and gets quoted at five sizes through the real quoter contracts.</span></li>
            <li><span><b>Net the costs.</b> Gas at the current price and the flash-loan fee come off. A candidate still positive has <i>cleared</i>; one above the threshold <i>would have fired</i>.</span></li>
            <li><span><b>Write it down.</b> Every event the page shows lands in the journal; every candidate lands in the study log; the nightly report commits both to the repo.</span></li>
            <li><span><b>Tell the phone.</b> Would-fire, cleared, errors, stops, trades and the nightly line go to a lock screen through ntfy. Nothing else does.</span></li>
            <li><span><b>Decide on the week.</b> The gate in <code>GO_NOGO.md</code>: funding becomes a sizing decision, not a bet, when would-fire candidates over a full week net more than gas and infrastructure.</span></li>
          </ol>
        </div>
        <div>
          <h3 className="h3">What the colors mean</h3>
          <div className="swatches">
            {DEXES.map(d => <div key={d.key}><i style={{ '--c': `var(--dex-${d.key})` }} />{d.label}</div>)}
            <div><i style={{ '--c': 'var(--good)' }} />cleared, fired, success</div>
            <div><i style={{ '--c': 'var(--warn)' }} />cleared but under threshold, warning</div>
            <div><i style={{ '--c': 'var(--bad)' }} />loss, error, stopped</div>
            <div><i style={{ '--c': 'var(--indigo)' }} />the study's own marks</div>
            <div><i style={{ '--c': 'var(--cyan)' }} />live data, progress</div>
          </div>
          <h3 className="h3" style={{ marginTop: 16 }}>Where the data goes</h3>
          <p>The journal under <code>logs/journal/</code> is one line per event per day, with the trading mode stamped and RPC keys scrubbed. The Journal section reads any day back. At 23:55 the report writes the day's summary and a public snapshot; at 23:58 a commit pushes both, so the repo is the memory and Fortuna's terminal can show this lane without asking.</p>
          <h3 className="h3">What keeps it safe</h3>
          <p>In monitor mode nothing can send a transaction, and this page never could: every trade is a step the operator confirms. The public copy is built from an allowlist (the front end, the snapshot, the examples), never from logs, config or keys. Balances stay on the private machine; addresses are never shown.</p>
        </div>
      </div>

      <h3 className="h3" style={{ marginTop: 16 }}>Versions</h3>
      <p>Every version of this terminal stays online, the way a time machine would. The first stop is the DApp University build Christopher started from; the current stop is this page, the edge terminal. The next line gets drawn when the next overhaul lands, so the journey stays readable without a crowd of entries. Earlier copies greet you with a note and point forward; the live copy shows nothing and never links back.</p>
      {stops.length ? (
        <ul className="stops" style={{ maxWidth: 560 }}>
          {stops.map(s => (
            <li key={s.id}>
              <a href={s.kind === 'live' ? (demo ? base : 'https://drasticstatic.github.io/trading-bot-arbitrage-public/') : `${demo ? base : 'https://drasticstatic.github.io/trading-bot-arbitrage-public/'}${s.url}`} className={s.kind === 'live' ? 'is-live' : ''}>
                <strong><i className={`ph-duotone ${s.kind === 'live' ? 'ph-broadcast' : 'ph-rewind'}`} aria-hidden="true" />{s.label}</strong>
                <span className="when">{s.when || ''}</span>
                <small>{s.note}</small>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <h3 className="h3" style={{ marginTop: 16 }}>Run it yourself</h3>
      <pre className="cmd">{`git clone https://github.com/drasticstatic/trading-bot-arbitrage-public && cd trading-bot-arbitrage-public
cp .env.example .env            `}<span className="c"># add an Alchemy key; leave the wallet keys blank for monitor mode</span>{`
npm install && (cd frontend && npm install && npm run build)
EDGE_MONITOR=1 node bot.js      `}<span className="c"># serves this terminal on http://localhost:5050</span>{`
node scripts/journal.js --days 7
node scripts/notify.js --status `}<span className="c"># phone alerts: ${PUBLIC_TOPIC_NOTE}</span></pre>
      <div className="links">
        <a className="btn btn--sm" href={`${base}phone-alerts.html`} target="_blank" rel="noopener noreferrer"><i className="ph-duotone ph-device-mobile" aria-hidden="true" />Phone alerts</a>
        <a className="btn btn--sm" href={`${base}edge/latest.json`} target="_blank" rel="noopener noreferrer"><i className="ph-duotone ph-file-code" aria-hidden="true" />Public snapshot (JSON)</a>
        <a className="btn btn--sm" href="https://github.com/drasticstatic/trading-bot-arbitrage-public" target="_blank" rel="noopener noreferrer"><i className="ph-duotone ph-github-logo" aria-hidden="true" />Source</a>
        <a className="btn btn--sm" href="https://drasticstatic.github.io/trading-assistant-public-preview/data/progression/terminal/" target="_blank" rel="noopener noreferrer"><i className="ph-duotone ph-chart-line-up" aria-hidden="true" />Fortuna's perps terminal</a>
      </div>
    </section>
  )
}
const PUBLIC_TOPIC_NOTE = 'subscribe to fortunatrades-arb-live in the ntfy app'
