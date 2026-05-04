import React, { useState, useEffect } from 'react'

const bounceKeyframes = `
@keyframes ghBannerBounce {
  0%, 100% { transform: translateY(0); }
  40%       { transform: translateY(-10px); }
  60%       { transform: translateY(-5px); }
}
@keyframes ghBannerGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(99,102,241,0.5), 0 0 20px rgba(168,85,247,0.3); }
  50%       { box-shadow: 0 0 22px rgba(99,102,241,0.9), 0 0 44px rgba(168,85,247,0.6); }
}
`

function GHPagesBanner() {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const isGHPages =
      window.location.hostname.endsWith('github.io') ||
      window.location.hostname.endsWith('githubusercontent.com')
    if (isGHPages) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{bounceKeyframes}</style>
      <div style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.70)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}>
        <div style={{
          background: 'linear-gradient(160deg, #0f0f1a 0%, #1a1035 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '20px',
          padding: '44px 40px 32px',
          maxWidth: '520px',
          width: '90%',
          textAlign: 'center',
          color: '#fff',
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.7)',
          display: 'flex', flexDirection: 'column', gap: '0',
        }}>

          {/* Bouncing construction emoji */}
          <div style={{
            fontSize: '52px', lineHeight: 1, marginBottom: '18px',
            display: 'inline-block',
            animation: 'ghBannerBounce 1.8s ease-in-out infinite',
          }}>
            🚧
          </div>

          <h2 style={{ marginBottom: '10px', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.3px' }}>
            GitHub Pages Preview
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: '10px', fontSize: '15px' }}>
            This dashboard is hosted as a <strong style={{ color: '#fff' }}>portfolio showcase</strong>.
            The live WebSocket feed and price screener require the local bot backend and
            a Hardhat fork node running on your machine.
          </p>

          <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontSize: '13px', marginBottom: '16px' }}>
            You can explore the full UI — screener panels, trade log, execution overlay,
            and wallet panel — but live arbitrage signals need the backend connected.
          </p>

          {/* Setup note */}
          <p style={{
            color: 'rgba(180, 220, 255, 0.85)',
            lineHeight: 1.6, fontSize: '13px', marginBottom: '28px',
            background: 'rgba(99,102,241,0.08)',
            borderRadius: '8px', padding: '10px 14px',
          }}>
            ⚡ To run locally: clone the repo → add your <strong style={{ color: '#fff' }}>Alchemy API key</strong> → start the Hardhat fork → launch the bot backend → <code style={{ color: 'rgba(180,220,255,1)' }}>npm run dev</code>
          </p>

          {/* CTA button */}
          <button
            onClick={() => setVisible(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              border: 'none', borderRadius: '10px', color: '#fff',
              padding: '13px 32px', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer', width: '100%', letterSpacing: '0.2px',
              animation: hovered ? 'none' : 'ghBannerGlow 2s ease-in-out infinite',
              transform: hovered ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }}
          >
            Explore the Demo →
          </button>

          {/* Repo link footer */}
          <p style={{ marginTop: '18px', marginBottom: 0, fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
            <a
              href="https://github.com/drasticstatic/trading-bot-arbitrage-public"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
              onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
            >
              View source on GitHub ↗
            </a>
          </p>

        </div>
      </div>
    </>
  )
}

export default GHPagesBanner
