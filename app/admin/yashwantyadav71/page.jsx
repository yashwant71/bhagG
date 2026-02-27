'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import CustomDropdown from '../../../src/components/CustomDropdown'
import './admin.css'

const AdminPage = () => {
  const params = useParams()
  const router = useRouter()
  const username = params.username

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [chapter, setChapter] = useState('1')
  const [verse, setVerse] = useState('1')
  const [audioUrl, setAudioUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [language, setLanguage] = useState('sanskrit')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Chapters and Verses list (For now just Chapter 1)
  const availableChapters = [1]
  const [versesList, setVersesList] = useState([])

  useEffect(() => {
    const checkAuth = async () => {
      // Check local storage for existing password
      const storedPass = localStorage.getItem('bg-admin-password')

      if (storedPass) {
        try {
          const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: storedPass })
          })
          const data = await response.json()
          if (data.success) {
            setIsAuthenticated(true)
            setPassword(storedPass)
            return
          }
        } catch (error) {
          console.error('Auth check failed:', error)
        }
      }

      // If no stored pass or verification failed, prompt for new one
      const pass = prompt('Please enter admin password:')
      if (!pass) {
        router.push('/')
        return
      }

      try {
        const response = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pass })
        })
        const data = await response.json()
        if (data.success) {
          setIsAuthenticated(true)
          setPassword(pass)
          localStorage.setItem('bg-admin-password', pass)
        } else {
          alert('Incorrect password. Redirecting...')
          localStorage.removeItem('bg-admin-password')
          router.push('/')
        }
      } catch (error) {
        alert('Verification failed. Try again.')
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

  const [selectedVerseData, setSelectedVerseData] = useState(null)
  const [wordTimestamps, setWordTimestamps] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingAudio, setRecordingAudio] = useState(null)

  useEffect(() => {
    const fetchVerses = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapter}?limit=1000`)
        const data = await response.json()
        if (data && data.verses) {
          setVersesList(data.verses.map(v => v.number))
        }
      } catch (error) {
        console.error('Failed to fetch verses:', error)
      }
    }
    if (isAuthenticated) fetchVerses()
  }, [chapter, isAuthenticated])

  useEffect(() => {
    const fetchVerseDetail = async () => {
      try {
        const response = await fetch(`/api/verses/${chapter}/${verse}`)
        const data = await response.json()
        setSelectedVerseData(data)
        
        // Try to fetch audio for selected language
        const langAudio = data.audioData?.[language]
        if (langAudio) {
          setAudioUrl(langAudio.url || '')
          setFileName(langAudio.fileName || '')
          setWordTimestamps(langAudio.timestamps || [])
        } else {
          // Fallback to legacy structure for migration
          setAudioUrl(data.audio || '')
          setWordTimestamps(data.wordTimestamps || [])
          setFileName('')
        }
      } catch (error) {
        console.error('Failed to fetch verse detail:', error)
      }
    }
    if (isAuthenticated && verse) fetchVerseDetail()
  }, [chapter, verse, language, isAuthenticated])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
    setFileName(file.name)
    setStatus(`File "${file.name}" picked. Please preview and then click Upload.`)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setStatus('Uploading to Cloudinary...')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('password', password)

    try {
      const response = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.url) {
        setAudioUrl(data.url)
        // Cleanup preview
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setSelectedFile(null)
        setPreviewUrl('')
        setStatus('Audio uploaded successfully! Use the recorder below to set timings.')
      } else {
        setStatus(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setStatus('Failed to upload file.')
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = () => {
    if (!audioUrl) {
      alert('Please upload/set an audio URL first.')
      return
    }
    const audio = new Audio(audioUrl)
    setRecordingAudio(audio)
    setIsRecording(true)
    // Automatically set first word to 0s
    setWordTimestamps([0.000])
    audio.play()
    setStatus('Recording started. First word set at 0s. Click on subsequent words.')
    audio.onended = () => {
      setIsRecording(false)
      setStatus('Recording ended.')
    }
  }

  const stopRecording = () => {
    if (recordingAudio) {
      recordingAudio.pause()
      setIsRecording(false)
      setStatus('Recording stopped.')
    }
  }

  const handleWordClick = (wordIndex) => {
    if (!isRecording || !recordingAudio) return
    
    const time = recordingAudio.currentTime
    const newTimestamps = [...wordTimestamps]
    newTimestamps[wordIndex] = parseFloat(time.toFixed(3))
    setWordTimestamps(newTimestamps)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setStatus('Saving to database...')

    try {
      const response = await fetch('/api/admin/update-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: chapter,
          verseId: verse,
          audioUrl,
          fileName,
          wordTimestamps: wordTimestamps.length > 0 ? wordTimestamps : undefined,
          language,
          password
        }),
      })

      const data = await response.json()
      if (data.success) {
        setStatus(`Successfully updated Chapter ${chapter} Verse ${verse}`)
      } else {
        setStatus(`Error: ${data.error}`)
      }
    } catch (error) {
      setStatus('Failed to save. Check console for details.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) return null

  // Function to split sanskrit into words for clickable interface
  const getSanskritWords = () => {
    if (!selectedVerseData?.sanskrit) return []
    // Split by spaces and remove brackets [1.1.1]
    return selectedVerseData.sanskrit.replace(/\[.*?\]/g, '').split(/\s+/).filter(w => w.length > 0)
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1>Gita Admin Panel</h1>
        <p className="admin-subtitle">Welcome, {username}</p>

        <div className="admin-card">
          <div className="selector-grid">
            <CustomDropdown 
              label="Select Chapter"
              value={chapter}
              options={availableChapters.map(ch => ({ value: ch, label: `Chapter ${ch}` }))}
              onChange={(val) => setChapter(val)}
            />

            <CustomDropdown 
              label="Select Verse"
              value={verse}
              options={versesList.map(v => ({ value: v, label: `Verse ${v}` }))}
              onChange={(val) => setVerse(val)}
            />

            <CustomDropdown 
              label="Audio Language"
              value={language}
              options={[
                { value: 'sanskrit', label: 'Sanskrit' },
                { value: 'hindi', label: 'Hindi' },
                { value: 'english', label: 'English' }
              ]}
              onChange={(val) => setLanguage(val)}
            />
          </div>

          <div className="upload-section">
            <label className="file-input-label">
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange} 
                disabled={isLoading || isRecording}
              />
              <div className="file-input-button">
                {isLoading && !audioUrl ? 'Uploading...' : 'Pick Audio File'}
              </div>
            </label>
            
            {previewUrl && (
              <div className="preview-container">
                <p>Preview Picked File:</p>
                <audio src={previewUrl} controls className="admin-audio-preview" />
                <button 
                  className="confirm-upload-btn" 
                  onClick={handleUpload}
                  disabled={isLoading}
                >
                  {isLoading ? 'Uploading...' : 'Confirm & Upload to Cloudinary'}
                </button>
              </div>
            )}
            
            {audioUrl && (
              <div className="audio-preview">
                <p>Cloud URL (Ready to Save):</p>
                <code>{audioUrl}</code>
              </div>
            )}
          </div>

          {selectedVerseData && (
            <div className="recording-section">
              <h3>Word Timing Recorder</h3>
              <div className="recording-controls">
                {!isRecording ? (
                  <button className="record-button start" onClick={startRecording}>
                    Start Recording Timings
                  </button>
                ) : (
                  <button className="record-button stop" onClick={stopRecording}>
                    Stop Recording
                  </button>
                )}
                <button 
                  className="reset-timings" 
                  onClick={() => setWordTimestamps([])}
                  disabled={isRecording}
                >
                  Reset Timings
                </button>
              </div>

              <div className="sanskrit-recording-area">
                {getSanskritWords().map((word, idx) => (
                  <button 
                    key={idx}
                    className={`record-word-btn ${wordTimestamps[idx] !== undefined ? 'timed' : ''}`}
                    onClick={() => handleWordClick(idx)}
                  >
                    <span className="word-text">{word}</span>
                    <span className="word-time">
                      {wordTimestamps[idx] !== undefined ? `${wordTimestamps[idx]}s` : '--'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={isLoading || !audioUrl}
          >
            {isLoading ? 'Saving...' : 'Save to Verse Data'}
          </button>

          {status && <div className={`status-message ${status.includes('Successfully') ? 'success' : ''}`}>{status}</div>}
        </div>

        <button className="back-home" onClick={() => router.push('/')}>
          Back to App
        </button>
      </div>
    </div>
  )
}

export default AdminPage
