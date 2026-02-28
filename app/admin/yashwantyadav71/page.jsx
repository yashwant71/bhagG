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
  const [isTesting, setIsTesting] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [nextWordIndex, setNextWordIndex] = useState(-1)
  const [recordingAudio, setRecordingAudio] = useState(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Spacebar for timing words during recording
      if (e.code === 'Space' && isRecording) {
        e.preventDefault()
        const words = getSanskritWords()
        if (nextWordIndex >= 0 && nextWordIndex < words.length) {
          handleWordClick(nextWordIndex)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, nextWordIndex, recordingAudio])

  useEffect(() => {
    const fetchVerses = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapter}?limit=1000`)
        const data = await response.json()
        if (data && data.verses) {
          setVersesList(data.verses)
          
          // Auto-select the first verse without audio for current language
          const firstMissing = data.verses.find(v => !v.audioData?.[language])
          if (firstMissing) {
            setVerse(firstMissing.number)
          } else if (data.verses.length > 0) {
            setVerse(data.verses[0].number)
          }
        }
      } catch (error) {
        console.error('Failed to fetch verses:', error)
      }
    }
    if (isAuthenticated) fetchVerses()
  }, [chapter, isAuthenticated, language])

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
    setNextWordIndex(1)
    audio.play()
    setStatus('Recording started. Use SPACE or Click words to set timings.')
    audio.onended = () => {
      setIsRecording(false)
      setNextWordIndex(-1)
      setStatus('Recording ended.')
    }
  }

  const stopRecording = () => {
    if (recordingAudio) {
      recordingAudio.pause()
      setIsRecording(false)
      setNextWordIndex(-1)
      setStatus('Recording stopped.')
    }
  }

  const startTesting = () => {
    if (!audioUrl) {
      alert('Please upload/set an audio URL first.')
      return
    }
    if (wordTimestamps.length === 0) {
      alert('Please record timings first.')
      return
    }

    const audio = new Audio(audioUrl)
    setRecordingAudio(audio)
    setIsTesting(true)
    setCurrentWordIndex(-1)
    
    audio.play()
    setStatus('Testing timings...')

    audio.ontimeupdate = () => {
      const currentTime = audio.currentTime
      // Find the index of the word that should be highlighted
      const index = wordTimestamps.reduce((acc, time, idx) => {
        if (time !== undefined && currentTime >= time) return idx
        return acc
      }, -1)
      setCurrentWordIndex(index)
    }

    audio.onended = () => {
      setIsTesting(false)
      setCurrentWordIndex(-1)
      setStatus('Test ended.')
    }
  }

  const stopTesting = () => {
    if (recordingAudio) {
      recordingAudio.pause()
      setIsTesting(false)
      setCurrentWordIndex(-1)
      setStatus('Test stopped.')
    }
  }

  const handleWordClick = (wordIndex) => {
    if (!isRecording || !recordingAudio) return
    
    const time = recordingAudio.currentTime
    setWordTimestamps(prev => {
      const newTimestamps = [...prev]
      newTimestamps[wordIndex] = parseFloat(time.toFixed(3))
      return newTimestamps
    })
    
    // Auto-advance to next word
    setNextWordIndex(wordIndex + 1)
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
        
        // Update local versesList state to reflect completion
        setVersesList(prev => prev.map(v => 
          v.number === verse 
          ? { 
              ...v, 
              audioData: { 
                ...v.audioData, 
                [language]: { url: audioUrl, fileName, timestamps: wordTimestamps } 
              } 
            } 
          : v
        ))

        // Auto-advance to next verse
        const currentIndex = versesList.findIndex(v => v.number === verse)
        if (currentIndex !== -1 && currentIndex < versesList.length - 1) {
          const nextVerseNum = versesList[currentIndex + 1].number
          setTimeout(() => {
            setVerse(nextVerseNum)
            setStatus(`Moved to Verse ${nextVerseNum}`)
            // Reset temporary recording states for the new verse
            setAudioUrl('')
            setFileName('')
            setWordTimestamps([])
            setNextWordIndex(-1)
          }, 1500)
        } else {
          setStatus('Chapter complete! All verses timed.')
        }
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
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h1>Gita Admin</h1>
          </div>
          <div className="sidebar-content">
            <div className="chapter-nav">
              <h3>Chapters</h3>
              <div className="chapter-tabs">
                {availableChapters.map(ch => (
                  <button 
                    key={ch} 
                    className={`chapter-tab ${chapter === ch ? 'active' : ''}`}
                    onClick={() => setChapter(ch)}
                  >
                    Ch {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="verse-nav">
              <h3>Verses (Chapter {chapter})</h3>
              <div className="verse-grid">
                {versesList.map(v => {
                  const isDone = !!v.audioData?.[language]
                  return (
                    <div 
                      key={v.number}
                      className={`verse-box ${verse === v.number ? 'selected' : ''} ${isDone ? 'done' : ''}`}
                      onClick={() => setVerse(v.number)}
                    >
                      {v.number}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <header className="admin-top-bar">
            <div className="user-info">
              <p>Welcome, <strong>{username}</strong></p>
            </div>
            <button className="back-home-btn" onClick={() => router.push('/')}>
              Exit Admin
            </button>
          </header>

          <div className="admin-content-inner">
            <div className="admin-card-row">
              {/* Left Column: Audio Upload & Settings */}
              <div className="admin-panel-card">
                <h3>Audio Configuration</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <CustomDropdown 
                    label="Target Language"
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
                      disabled={isLoading || isRecording || isTesting}
                    />
                    <div className="file-input-button">
                      {isLoading && !audioUrl ? 'Uploading...' : 'Upload New Audio'}
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
                        {isLoading ? 'Uploading...' : 'Confirm Upload'}
                      </button>
                    </div>
                  )}
                  
                  {audioUrl && (
                    <div className="audio-preview">
                      <p>Current Cloud URL:</p>
                      <code>{audioUrl}</code>
                      {fileName && (
                          <p className="filename-small">Original: {fileName}</p>
                      )}
                    </div>
                  )}
                </div>

                {status && (
                  <div className={`status-message ${status.includes('Successfully') ? 'success' : ''}`}>
                    {status}
                  </div>
                )}
              </div>

              {/* Right Column: Timings */}
              {selectedVerseData && (
                <div className="admin-panel-card">
                  <div className="recording-section" style={{ border: 'none', paddingTop: 0 }}>
                    <h3>Word Timing Recorder</h3>
                    <div className="recording-controls">
                      {!isRecording ? (
                        <button className="record-button start" onClick={startRecording} disabled={isTesting}>
                          Record Timings
                        </button>
                      ) : (
                        <button className="record-button stop" onClick={stopRecording}>
                          Stop
                        </button>
                      )}

                      {!isTesting ? (
                        <button 
                          className="record-button test"
                          onClick={startTesting}
                          disabled={isRecording || wordTimestamps.length === 0}
                        >
                          Verify Match
                        </button>
                      ) : (
                        <button className="record-button stop" onClick={stopTesting}>
                          Stop Verify
                        </button>
                      )}

                      <button 
                        className="reset-timings" 
                        onClick={() => setWordTimestamps([])}
                        disabled={isRecording || isTesting}
                      >
                        Reset
                      </button>
                    </div>

                    <div className="sanskrit-recording-area">
                      {getSanskritWords().map((word, idx) => (
                        <button 
                          key={idx}
                          className={`record-word-btn ${wordTimestamps[idx] !== undefined ? 'timed' : ''} ${currentWordIndex === idx ? 'active' : ''} ${isRecording && nextWordIndex === idx ? 'next-to-time' : ''}`}
                          onClick={() => handleWordClick(idx)}
                        >
                          <span className="word-text">{word}</span>
                          <span className="word-time">
                            {wordTimestamps[idx] !== undefined ? `${wordTimestamps[idx]}s` : '--'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button 
                      className="save-button" 
                      onClick={handleSave}
                      disabled={isLoading || !audioUrl || wordTimestamps.length === 0}
                    >
                      {isLoading ? 'Saving...' : `Finalize & Save Verse ${verse}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminPage
