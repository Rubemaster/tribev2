import { useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, View } from '@react-three/drei'
import * as THREE from 'three'
import { loadMeshBinary, brainDataToColors } from '../lib/mesh'

let cachedMeshes = null

export default function BrainViewer({ brainData, currentTime, totalTimes, onTimeChange }) {
  const [meshes, setMeshes] = useState(cachedMeshes)
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const [rotZ, setRotZ] = useState(0)
  const [isoMode, setIsoMode] = useState(false)
  const [multiView, setMultiView] = useState(false)

  const VIEWS = {
    front:  [90, 180, 0],
    back:   [90, 180, 180],
    left:   [90, 180, 90],
    right:  [90, 180, -90],
    top:    [180, 180, 180],
    bottom: [180, 0, 180],
  }

  // Load meshes once (cached globally)
  useEffect(() => {
    if (cachedMeshes) { setMeshes(cachedMeshes); return }
    Promise.all([
      loadMeshBinary('/brain_left.bin.gz'),
      loadMeshBinary('/brain_right.bin.gz'),
    ]).then(([left, right]) => {
      cachedMeshes = { left, right }
      setMeshes(cachedMeshes)
    })
  }, [])

  return (
    <div className="brain-viewer">
      <div className="brain-canvas-wrap">
        {!meshes && (
          <div className="brain-loading">
            <div className="spinner" />
            <p>Loading brain mesh…</p>
          </div>
        )}
        {multiView ? (
          <div className="multi-view-grid">
            {Object.entries(VIEWS).map(([name, [x, y, z]]) => (
              <div key={name} className="multi-view-cell">
                <div className="multi-view-label">{name}</div>
                <Canvas
                  key={`mv-${name}`}
                  orthographic={isoMode}
                  camera={isoMode
                    ? { position: [0, 0, 200], zoom: 0.9, near: 1, far: 2000 }
                    : { position: [0, 0, 350], fov: 25, near: 1, far: 2000 }
                  }
                  style={{ background: '#f3f4f6' }}
                >
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[80, 120, 150]} intensity={0.8} />
                  <directionalLight position={[-80, -40, -80]} intensity={0.25} />
                  <Suspense fallback={null}>
                    {meshes && <BrainSurface meshes={meshes} brainData={brainData} rotX={x} rotY={y} rotZ={z} />}
                  </Suspense>
                  <OrbitControls enableDamping dampingFactor={0.08} minDistance={50} maxDistance={400} target={[0, 0, 0]} />
                </Canvas>
              </div>
            ))}
          </div>
        ) : (
          <Canvas
            key={isoMode ? 'iso' : 'persp'}
            orthographic={isoMode}
            camera={isoMode
              ? { position: [0, 0, 200], zoom: 1.6, near: 1, far: 2000 }
              : { position: [0, 0, 350], fov: 25, near: 1, far: 2000 }
            }
            style={{ background: '#f3f4f6' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[80, 120, 150]} intensity={0.8} />
            <directionalLight position={[-80, -40, -80]} intensity={0.25} />
            <Suspense fallback={null}>
              {meshes && <BrainSurface meshes={meshes} brainData={brainData} rotX={rotX} rotY={rotY} rotZ={rotZ} />}
            </Suspense>
            <OrbitControls
              enableDamping dampingFactor={0.08}
              minDistance={100} maxDistance={800}
              target={[0, 0, 0]}
            />
          </Canvas>
        )}
      </div>

      {/* View presets */}
      <div className="brain-toolbar">
        {!multiView && (
          <div className="view-presets">
            {Object.entries(VIEWS).map(([name, [x, y, z]]) => (
              <button key={name} className="view-btn" onClick={() => { setRotX(x); setRotY(y); setRotZ(z) }}>
                {name}
              </button>
            ))}
          </div>
        )}
        <button
          className={`tool-btn ${multiView ? 'active' : ''}`}
          onClick={() => setMultiView(!multiView)}
        >
          Multi-View
        </button>
        <button
          className={`tool-btn ${isoMode ? 'active' : ''}`}
          onClick={() => setIsoMode(!isoMode)}
        >
          Isometric
        </button>
      </div>


      {/* Rotation axis values */}
      <div className="rotation-inputs">
        <div className="rot-input">
          <label>X</label>
          <input type="number" min={-180} max={180} step={1} value={rotX}
            onChange={e => setRotX(Number(e.target.value) || 0)} />
          <span>°</span>
        </div>
        <div className="rot-input">
          <label>Y</label>
          <input type="number" min={-180} max={180} step={1} value={rotY}
            onChange={e => setRotY(Number(e.target.value) || 0)} />
          <span>°</span>
        </div>
        <div className="rot-input">
          <label>Z</label>
          <input type="number" min={-180} max={180} step={1} value={rotZ}
            onChange={e => setRotZ(Number(e.target.value) || 0)} />
          <span>°</span>
        </div>
      </div>

      {/* Timeline */}
      {totalTimes > 1 && (
        <div className="brain-timeline">
          <span>t = {currentTime + 1} / {totalTimes}</span>
          <input type="range" min={0} max={totalTimes - 1} value={currentTime}
            onChange={e => onTimeChange(Number(e.target.value))} />
        </div>
      )}
    </div>
  )
}

// ─── 3D Brain Surface ───────────────────────────────────────────
function BrainSurface({ meshes, brainData, rotX, rotY, rotZ }) {
  const leftColors = useMemo(() => {
    if (!meshes?.left) return null
    if (brainData?.left) return brainDataToColors(brainData.left)
    // Synthetic: Y-coordinate gradient (bottom=blue, top=red)
    return syntheticColors(meshes.left.vertices, 'y')
  }, [brainData, meshes])

  const rightColors = useMemo(() => {
    if (!meshes?.right) return null
    if (brainData?.right) return brainDataToColors(brainData.right)
    return syntheticColors(meshes.right.vertices, 'y')
  }, [brainData, meshes])

  return (
    <group>
      {meshes.left && leftColors && (
        <ColoredMesh mesh={meshes.left} colors={leftColors} rotX={rotX} rotY={rotY} rotZ={rotZ} />
      )}
      {meshes.right && rightColors && (
        <ColoredMesh mesh={meshes.right} colors={rightColors} rotX={rotX} rotY={rotY} rotZ={rotZ} />
      )}
    </group>
  )
}

// Synthetic vertex coloring based on position (for testing without real predictions)
function syntheticColors(vertices, axis) {
  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
  const n = vertices.length / 3
  const vals = new Float32Array(n)
  let min = Infinity, max = -Infinity
  for (let i = 0; i < n; i++) {
    const v = vertices[i * 3 + idx]
    vals[i] = v
    if (v < min) min = v
    if (v > max) max = v
  }
  // Normalize -1 to 1
  const range = max - min || 1
  const offset = (max + min) / 2
  const scaled = new Float32Array(n)
  for (let i = 0; i < n; i++) scaled[i] = (vals[i] - offset) / (range / 2)
  return brainDataToColors(scaled)
}

function ColoredMesh({ mesh, colors, rotX, rotY, rotZ }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(mesh.vertices, 3))
    g.setIndex(new THREE.BufferAttribute(mesh.faces, 1))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [mesh, colors])

  // R3F declarative rotation — the canonical way, GPU-handled
  const rotation = useMemo(() => [
    THREE.MathUtils.degToRad(rotX),
    THREE.MathUtils.degToRad(rotY),
    THREE.MathUtils.degToRad(rotZ),
  ], [rotX, rotY, rotZ])

  return (
    <mesh geometry={geo} rotation={rotation}>
      <meshStandardMaterial vertexColors roughness={0.42} metalness={0.06} side={THREE.DoubleSide} />
    </mesh>
  )
}
