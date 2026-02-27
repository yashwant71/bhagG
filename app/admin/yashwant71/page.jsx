'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
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
  const [language, setLanguage] = useState('sanskrit')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Chapters and Verses list (For now just Chapter 1)
  const availableChapters = [1]
  const [versesList, setVersesList] = useState([])

  useEffect(() => {
    // Check local storage for existing password
    const storedPass = localStorage.getItem('bg-admin-password')
    const adminPass = 'yashwant_gita_2024' // Updated password

    if (storedPass === adminPass) {
      setIsAuthenticated(true)
      setPassword(storedPass)
    } else {
      const pass = prompt('Please enter admin password:')
      if (pass === adminPass) {
        setIsAuthenticated(true)
        setPassword(pass)
        localStorage.setItem('bg-admin-password', pass)
      } else {
        alert('Incorrect password. Redirecting...')
        router.push('/')
      }
    }
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
          setWordTimestamps(langAudio.timestamps || [])
        } else {
          // Fallback to legacy structure for migration
          setAudioUrl(data.audio || '')
          setWordTimestamps(data.wordTimestamps || [])
        }
      } catch (error) {
        console.error('Failed to fetch verse detail:', error)
      }
    }
    if (isAuthenticated && verse) fetchVerseDetail()
  }, [chapter, verse, language, isAuthenticated])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsLoading(true)
    setStatus('Uploading audio...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('password', password)

    try {
      const response = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.url) {
        setAudioUrl(data.url)
        setStatus('Audio uploaded successfully!')
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
    setWordTimestamps([])
    audio.play()
    setStatus('Recording started. Clicks on words to set timing.')
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
          <div className="form-grid">
            <div className="form-group">
              <label>Select Chapter</label>
              <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
                {availableChapters.map(ch => (
                  <option key={ch} value={ch}>Chapter {ch}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Verse</label>
              <select value={verse} onChange={(e) => setVerse(e.target.value)}>
                {versesList.map(v => (
                  <option key={v} value={v}>Verse {v}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Audio Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="sanskrit">Sanskrit</option>
                <option value="hindi">Hindi</option>
                <option value="english">English</option>
              </select>
            </div>
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
            
            {audioUrl && (
              <div className="audio-preview">
                <p>Current Audio URL:</p>
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
