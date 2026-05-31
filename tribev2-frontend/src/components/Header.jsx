export default function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-emoji">TRIBE</span>
        <div>
          <h1>TRIBE v2</h1>
          <p>Multimodal Brain Encoding</p>
        </div>
      </div>
      <div className="header-meta">
        <span className="pill">RTX 3090 · 24GB</span>
        <span className="pill accent">Meta AI · FAIR</span>
      </div>
    </header>
  )
}
