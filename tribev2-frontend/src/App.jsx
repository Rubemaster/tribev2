import { useState, useCallback } from 'react'
import { MODALITIES } from './lib/constants'
import { uploadStimulus, pollResult, fetchBrainData } from './lib/api'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
import BrainViewer from './components/BrainViewer'
import StatusPanel from './components/StatusPanel'
import './App.css'

export default function App() {
  // Stimulus A
  const [modalityA, setModalityA] = useState('image')
  const [fileA, setFileA] = useState(null)
  const [textA, setTextA] = useState('')
  // Stimulus B
  const [modalityB, setModalityB] = useState('image')
  const [fileB, setFileB] = useState(null)
  const [textB, setTextB] = useState('')
  // Shared
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [brainData, setBrainData] = useState(null)
  const [jobId, setJobId] = useState(null)

  const handleReset = useCallback(() => {
    setFileA(null); setFileB(null)
    setTextA(''); setTextB('')
    setStatus('idle')
    setResult(null)
    setError(null)
    setBrainData(null)
    setCurrentTime(0)
    setJobId(null)
  }, [])

  const handleSubmit = useCallback(async (slot) => {
    const modality = slot === 'A' ? modalityA : modalityB
    const file = slot === 'A' ? fileA : fileB
    const text = slot === 'A' ? textA : textB
    if (modality === 'text' && !text.trim()) return
    if (modality !== 'text' && !file) return

    setStatus('uploading')
    setError(null)
    setResult(null)
    setBrainData(null)

    try {
      const { jobId } = await uploadStimulus({ modality, file, text })
      setJobId(jobId)
      setStatus('processing')

      for (let i = 0; i < 360; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const data = await pollResult(jobId)
        if (!data) continue
        if (data.status === 'done') {
          setResult(data.result)
          setStatus('done')
          const frame = await fetchBrainData(jobId, 0)
          if (frame) setBrainData(frame)
          return
        }
        if (data.status === 'error') throw new Error(data.error || 'Processing failed')
      }
      throw new Error('Timed out (12 min)')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [modalityA, modalityB, fileA, fileB, textA, textB])

  const handleTimeChange = useCallback(async (t) => {
    setCurrentTime(t)
    if (!jobId) return
    const data = await fetchBrainData(jobId, t)
    if (data) setBrainData(data)
  }, [jobId])

  const showResults = status === 'done' && result

  return (
    <div className="app">
      <Header />

      <div className="layout">
        {/* Left: input controls */}
        <aside className="sidebar">
          <InputPanel
            label="Stimulus A"
            modality={modalityA}
            setModality={setModalityA}
            file={fileA}
            setFile={setFileA}
            textInput={textA}
            setTextInput={setTextA}
            disabled={status === 'processing'}
          />
          <InputPanel
            label="Stimulus B"
            modality={modalityB}
            setModality={setModalityB}
            file={fileB}
            setFile={setFileB}
            textInput={textB}
            setTextInput={setTextB}
            disabled={status === 'processing'}
          />
          <div className="sidebar-actions">
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit('A')}
              disabled={status === 'processing' || (modalityA === 'text' ? !textA.trim() : !fileA)}
            >
              {status === 'processing' ? 'Processing…' : 'Predict A'}
            </button>
            <button className="btn btn-ghost" onClick={handleReset} disabled={status === 'processing'}>
              Reset
            </button>
          </div>
          {showResults && (
            <ResultsPanel
              result={result}
              currentTime={currentTime}
              onTimeChange={handleTimeChange}
            />
          )}
        </aside>

        {/* Right: brain viewer */}
        <main className="main-view">
          <BrainViewer
            brainData={brainData}
            currentTime={currentTime}
            totalTimes={result?.timesteps || 1}
            onTimeChange={handleTimeChange}
          />
          {!showResults && status !== 'idle' && (
            <div className="status-inline">
              <StatusPanel status={status} error={error} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
