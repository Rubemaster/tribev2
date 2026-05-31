import { API_BASE } from './constants'

export async function uploadStimulus({ modality, file, text }) {
  const fd = new FormData()
  fd.append('modality', modality)
  if (modality === 'text') {
    fd.append('text', text)
  } else {
    fd.append('file', file)
  }
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function pollResult(jobId) {
  const res = await fetch(`${API_BASE}/api/result/${jobId}`)
  if (!res.ok) return null
  return res.json()
}

export async function fetchBrainData(jobId, timestep) {
  const res = await fetch(`${API_BASE}/api/brain-data/${jobId}/${timestep}`)
  if (!res.ok) return null
  return res.json()
}
