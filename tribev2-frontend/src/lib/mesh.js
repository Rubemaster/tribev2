/**
 * Load fsaverage5 brain mesh from binary.gz format.
 * Format: [nVerts: u32, nFaces: u32, verts: Float32[nVerts*3], faces: Uint32[nFaces*3]]
 */
export async function loadMeshBinary(url) {
  const r = await fetch(url)
  const buf = await r.arrayBuffer()
  const header = new Uint32Array(buf, 0, 2)
  const nVerts = header[0]
  const nFaces = header[1]
  const vertices = new Float32Array(buf, 8, nVerts * 3)
  const faces = new Uint32Array(buf, 8 + nVerts * 3 * 4, nFaces * 3)
  return { vertices, faces, nVerts, nFaces }
}

/**
 * Convert raw prediction data to RGB vertex colors.
 * Red/blue diverging colormap: blue(-) → white(0) → red(+)
 */
export function brainDataToColors(data, scaleValue = null) {
  const arr = new Float32Array(data.length * 3)
  let max = scaleValue ?? Math.max(...data.map(Math.abs))
  if (max === 0) max = 1
  const s = 1.0 / max
  for (let i = 0; i < data.length; i++) {
    const v = data[i] * s
    if (v > 0) {
      arr[i * 3]     = 1.0
      arr[i * 3 + 1] = 1.0 - v
      arr[i * 3 + 2] = 1.0 - v
    } else {
      const a = -v
      arr[i * 3]     = 1.0 - a
      arr[i * 3 + 1] = 1.0 - a
      arr[i * 3 + 2] = 1.0
    }
  }
  return arr
}
