export default function ResultsPanel({ result, currentTime, onTimeChange }) {
  const times = result?.timesteps || 0

  return (
    <div className="results-panel">
      {/* Stats row */}
      <div className="stats-row">
        <StatBox value={times} label="Timesteps" />
        <StatBox value={result?.vertices?.toLocaleString() || '—'} label="Vertices" />
        <StatBox value={result?.predictionSummary?.mean?.toFixed(4) || '—'} label="Mean μ" />
        <StatBox value={result?.modality || '—'} label="Modality" />
      </div>

      {/* Timeline */}
      {times > 1 && (
        <div className="timeline">
          <div className="timeline-top">
            <span className="timeline-label">Timestep {currentTime + 1} of {times}</span>
            <div className="timeline-btns">
              <button className="btn btn-tiny" disabled={currentTime === 0} onClick={() => onTimeChange(currentTime - 1)}>◀</button>
              <button className="btn btn-tiny" disabled={currentTime >= times - 1} onClick={() => onTimeChange(currentTime + 1)}>▶</button>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={times - 1}
            value={currentTime}
            onChange={e => onTimeChange(Number(e.target.value))}
            className="timeline-slider"
          />
        </div>
      )}

      {/* Color scale */}
      <div className="colorbar">
        <span className="cb-label">−</span>
        <div className="cb-gradient" />
        <span className="cb-label">+</span>
      </div>
    </div>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="stat-box">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
