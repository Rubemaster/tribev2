export default function StatusPanel({ status, error }) {
  switch (status) {
    case 'idle':
      return null
    case 'uploading':
      return <p className="status-text">Uploading to server…</p>
    case 'processing':
      return (
        <div className="processing-indicator">
          <div className="spinner" />
          <p className="status-text">TRIBE v2 is predicting brain activity across 20,000 cortical vertices. This may take a minute.</p>
        </div>
      )
    case 'error':
      return (
        <div className="result-error">
          <p><strong>Error</strong> &mdash; {error}</p>
        </div>
      )
    default:
      return null
  }
}
