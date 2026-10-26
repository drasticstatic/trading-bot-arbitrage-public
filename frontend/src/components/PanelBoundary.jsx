import React from 'react'

/**
 * PanelBoundary — one view's render error must not black out the terminal.
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
        <section className="panel">
          <div className="notice notice--warn">
            <div className="notice-t">{this.props.name || 'This view'} could not render</div>
            <div>{String(this.state.error?.message || this.state.error)}. The bot is unaffected. Try again after the next update, or check the browser console.</div>
          </div>
          <button className="btn btn--sm" onClick={() => this.setState({ error: null })}>Try again</button>
        </section>
      )
    }
    return this.props.children
  }
}
