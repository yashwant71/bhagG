import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVerse, getNextVerseNumber, getPrevVerseNumber } from '../data/utils'
import './VersePage.css'

const VersePage = () => {
  const { chapter, verse: verseParam } = useParams()
  const navigate = useNavigate()
  
  // Load language preference from localStorage, default to 'english'
  const getStoredLanguage = () => {
    try {
      const stored = localStorage.getItem('bg-translation-language')
      return stored === 'hindi' || stored === 'english' ? stored : 'english'
    } catch (error) {
      return 'english'
    }
  }
  
  const [translation, setTranslation] = useState(getStoredLanguage)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hoveredWord, setHoveredWord] = useState(null)
  const [hoveredWordTranslation, setHoveredWordTranslation] = useState(null)
  const [copied, setCopied] = useState(false)

  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  const chapterNum = parseInt(chapter || '2')
  const verseNum = verseParam || '47'
  const chapterVerseKey = `${chapterNum}.${verseNum}`

  // Save language preference to localStorage whenever it changes
  const updateTranslation = (lang) => {
    setTranslation(lang)
    try {
      localStorage.setItem('bg-translation-language', lang)
    } catch (error) {
      console.error('Failed to save language preference:', error)
    }
  }

  useEffect(() => {
    // Reset animation state when verse changes
    setIsLoaded(false)
    window.scrollTo(0, 0)
    
    // Trigger animation after a brief delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [chapter, verseParam])

  const verse = getVerse(chapterNum, chapterVerseKey)
  
  // Navigation handlers
  const handleNextVerse = () => {
    const nextVerse = getNextVerseNumber(chapterNum, chapterVerseKey)
    if (nextVerse) {
      // Parse the result (e.g., "2.48" -> ["2", "48"])
      const [nextChapter, nextVerseNum] = nextVerse.split('.')
      navigate(`/verse/${nextChapter}/${nextVerseNum}`)
    }
  }

  const handlePrevVerse = () => {
    const prevVerse = getPrevVerseNumber(chapterNum, chapterVerseKey)
    if (prevVerse) {
      // Parse the result (e.g., "2.46" -> ["2", "46"])
      const [prevChapter, prevVerseNum] = prevVerse.split('.')
      navigate(`/verse/${prevChapter}/${prevVerseNum}`)
    }
  }

  // Swipe handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      // Swipe left - next verse
      handleNextVerse()
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous verse
      handlePrevVerse()
    }

    touchStartX.current = null
    touchEndX.current = null
  }
  
  // If verse not found, return null or show error
  if (!verse) {
    return (
      <div className="verse-page">
        <div className="verse-background"></div>
        <div className="verse-container">
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>
            Verse not found
          </div>
        </div>
      </div>
    )
  }

  // Handle word hover for tooltip - supports bracket format with IDs
  const handleWordHover = (lineIndex, wordIndex) => {
    if (!verse.wordTranslations) return
    
    const wordKey = `${lineIndex}-${wordIndex}`
    const segment = sanskritLines[lineIndex]?.[wordIndex]
    
    if (!segment) return
    
    // Check if wordTranslations is an array with id field (chapter1 bracket format)
    if (Array.isArray(verse.wordTranslations) && segment.ids && segment.ids.length > 0) {
      // Get translations for all IDs in this word
      const translations = segment.ids
        .map(id => {
          const wordData = verse.wordTranslations.find(wt => wt.id === id)
          if (wordData) {
            return wordData[translation] || wordData.english || null
          }
          return null
        })
        .filter(t => t !== null)
      
      if (translations.length > 0) {
        // Combine multiple meanings with bullet separator
        const translationText = translations.join(' • ')
        setHoveredWord(wordKey)
        setHoveredWordTranslation(translationText)
      }
    } else if (!Array.isArray(verse.wordTranslations)) {
      // Object format (chapter2+ format) - use position-based keys
      const lineKey = lineIndex + 1
      const wordKeyNum = wordIndex + 1
      const key = `${lineKey}-${wordKeyNum}`
      
      const wordData = verse.wordTranslations[key]
      if (wordData) {
        const translationValue = wordData[translation] || wordData.english || null
        
        if (translationValue) {
          let translationText = translationValue
          
          // If it's an array, join with bullet separator
          if (Array.isArray(translationValue)) {
            translationText = translationValue.join(' • ')
          }
          // If it's a string but contains slash separators, convert to bullets
          else if (typeof translationValue === 'string' && translationValue.includes(' / ')) {
            translationText = translationValue.replace(/\s*\/\s*/g, ' • ')
          }
          
          setHoveredWord(wordKey)
          setHoveredWordTranslation(translationText)
        }
      }
    }
  }

  const handleWordLeave = () => {
    setHoveredWord(null)
    setHoveredWordTranslation(null)
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    const textToCopy = translation === 'english' ? verse.english.text : verse.hindi.text
    const fullText = `${textToCopy} (${chapterVerseKey})`
    
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Parse Sanskrit text with brackets - remove brackets from display but track IDs
  const parseSanskritWithBrackets = (sanskritText) => {
    const lines = sanskritText.split('\n')
    return lines.map(line => {
      const words = line.split(/\s+/).filter(w => w.length > 0)
      return words.map(word => {
        // Extract bracket IDs and remove brackets from display text
        const ids = []
        let displayText = ''
        let i = 0
        
        while (i < word.length) {
          if (word[i] === '[') {
            // Find closing bracket
            let j = i + 1
            while (j < word.length && word[j] !== ']') {
              j++
            }
            
            if (j < word.length) {
              // Extract ID
              const idStr = word.substring(i + 1, j)
              const id = parseInt(idStr, 10)
              if (!isNaN(id)) {
                ids.push(id)
              }
              i = j + 1
            } else {
              displayText += word[i]
              i++
            }
          } else {
            displayText += word[i]
            i++
          }
        }
        
        return { text: displayText, ids }
      })
    })
  }

  // Split Sanskrit text into words (for non-bracket format)
  const splitSanskritIntoWords = (sanskritText) => {
    const lines = sanskritText.split('\n')
    return lines.map(line => {
      return line.split(/\s+/).filter(word => word.length > 0).map(word => ({
        text: word,
        ids: []
      }))
    })
  }

  // Check if text has brackets (chapter1 format)
  const hasBrackets = verse.sanskrit && verse.sanskrit.includes('[')
  const isArrayFormat = Array.isArray(verse.wordTranslations) && verse.wordTranslations[0]?.id
  
  const sanskritLines = (hasBrackets && isArrayFormat) 
    ? parseSanskritWithBrackets(verse.sanskrit)
    : splitSanskritIntoWords(verse.sanskrit)

  // Calculate delays: each word in a line gets a small delay, 
  // then next line starts right after the previous line's last word finishes
  const getWordDelay = (lineIndex, wordIndex, lineLength) => {
    // First line: each word has a small delay (0.12s apart)
    if (lineIndex === 0) {
      return wordIndex * 0.12
    }
    
    // For lines after the first: calculate when previous lines finish
    // Each line's end time = last word start time + animation duration (1s)
    // Last word start time = first word start time + (wordCount - 1) * 0.12
    
    let previousLinesEndTime = 0
    
    // Calculate end time of all previous lines
    for (let i = 0; i < lineIndex; i++) {
      const prevLineWordCount = sanskritLines[i].length
      const prevLineFirstWordDelay = i === 0 ? 0 : previousLinesEndTime
      const prevLineLastWordStartTime = prevLineFirstWordDelay + (prevLineWordCount - 1) * 0.12
      const prevLineEndTime = prevLineLastWordStartTime + 1 // animation duration is 1s
      previousLinesEndTime = prevLineEndTime
    }
    
    // Current line starts after previous lines finish
    // Each word in current line has 0.12s delay from the previous word
    return previousLinesEndTime + (wordIndex * 0.12)
  }

  return (
    <div className="verse-page">
      <div className="verse-background"></div>
      
      <div className="verse-container">
        {/* Pretext/Context Section */}
        {verse.pretext && (
          <div className="pretext-section">
            <div className={`pretext-text ${translation === 'hindi' ? 'hindi-text' : ''}`}>
              {typeof verse.pretext === 'string' 
                ? verse.pretext 
                : (translation === 'english' ? verse.pretext.english : verse.pretext.hindi)
              }
            </div>
          </div>
        )}
        
        {/* Sanskrit Words Section - Primary Focus */}
        <div 
          className="sanskrit-section"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation arrows - Desktop only */}
          <button 
            className="nav-arrow nav-arrow-left"
            onClick={handlePrevVerse}
            aria-label="Previous verse"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          
          <button 
            className="nav-arrow nav-arrow-right"
            onClick={handleNextVerse}
            aria-label="Next verse"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <div className="sanskrit-words-container">
            {sanskritLines.map((line, lineIndex) => (
              <div key={lineIndex} className="sanskrit-line">
                {line.map((segment, wordIndex) => {
                  const delay = getWordDelay(lineIndex, wordIndex, line.length)
                  const wordKey = `${lineIndex}-${wordIndex}`
                  const isHovered = hoveredWord === wordKey
                  const wordText = segment.text || segment
                  const hasTranslation = segment.ids && segment.ids.length > 0
                  
                  return (
                    <span
                      key={`${chapterVerseKey}-${lineIndex}-${wordIndex}`}
                      className={`sanskrit-word ${isLoaded ? 'animate-in' : ''} ${hasTranslation ? 'has-translation' : ''}`}
                      data-word={wordText}
                      style={{
                        ['--animation-delay']: `${delay}s`
                      }}
                      onMouseEnter={() => handleWordHover(lineIndex, wordIndex)}
                      onMouseLeave={handleWordLeave}
                    >
                      {wordText}
                      {isHovered && hoveredWordTranslation && (
                        <span className={`word-tooltip ${translation === 'hindi' ? 'hindi-text' : ''}`}>{hoveredWordTranslation}</span>
                      )}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="verse-number">{chapterVerseKey}</div>
        </div>

        {/* Translation Section - In Card */}
        <div className="translation-wrapper">
          <div className="translation-toggle-container">
            <div className="translation-toggle-compact">
              <button
                className={`toggle-compact ${translation === 'english' ? 'active' : ''}`}
                onClick={() => updateTranslation('english')}
              >
                English
              </button>
              <button
                className={`toggle-compact ${translation === 'hindi' ? 'active' : ''}`}
                onClick={() => updateTranslation('hindi')}
              >
                हिंदी
              </button>
            </div>
          </div>

          <div className="translation-card">
            <div className="translation-header">
              <div className={`translation-text ${translation === 'hindi' ? 'hindi-text' : ''}`}>
                {translation === 'english' ? verse.english.text : verse.hindi.text}
              </div>
              <button 
                className="copy-button"
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy verse'}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
            <div className={`translation-meaning ${translation === 'hindi' ? 'hindi-text' : ''}`}>
              {translation === 'english' ? verse.english.meaning : verse.hindi.meaning}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VersePage
