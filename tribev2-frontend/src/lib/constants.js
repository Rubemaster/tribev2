export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const MODALITIES = [
  { id: 'image', label: 'Image', accept: 'image/*' },
  { id: 'video', label: 'Video', accept: 'video/*' },
  { id: 'audio', label: 'Audio', accept: 'audio/*' },
  { id: 'text',  label: 'Text',  accept: '.txt' },
]

export const VIEW_PRESETS = {
  left:      { pos: [-60, 0, 0],   target: [0, 0, 0] },
  right:     { pos: [60, 0, 0],    target: [0, 0, 0] },
  front:     { pos: [0, 0, 60],    target: [0, 0, 0] },
  back:      { pos: [0, 0, -60],   target: [0, 0, 0] },
  top:       { pos: [0, 60, 0],    target: [0, 0, 0] },
  bottom:    { pos: [0, -60, 0],   target: [0, 0, 0] },
}
