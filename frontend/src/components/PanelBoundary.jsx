import React from 'react'

/**
 * PanelBoundary — one panel's render error must not black out the whole dashboard.
 * The bot keeps running either way; this keeps the operator able to see that.
 */
export default class PanelBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.name || 'panel'}] render failed:`, error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="screener-card" style={{ padding: '16px 20px', marginBottom: '24px', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600, marginBottom: '4px' }}>
            {this.props.name || 'This panel'} could not render
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {String(this.state.error?.message || this.state.error)}. The bot is unaffected; reload the page after the next update, or check the browser console.
          </div>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: '10px', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #374151', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
