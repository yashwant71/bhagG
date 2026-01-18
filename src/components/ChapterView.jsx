'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getChapter, getVerseNumbers, getVerse } from '../data/utils'
import './ChapterView.css'

const ChapterView = () => {
  const params = useParams()
  const router = useRouter()
  
  const chapter = Array.isArray(params?.params) ? params.params[0] : (params?.chapter || params?.params?.[0])
  const chapterNum = parseInt(chapter || '1')
  
  // Only allow chapter 1
  const validChapterNum = chapterNum === 1 ? 1 : 1
  
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
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hoveredWord, setHoveredWord] = useState(null)
  const [hoveredWordData, setHoveredWordData] = useState(null)
  const [hoveredWordPosition, setHoveredWordPosition] = useState(null)
  
  const chapterData = getChapter(validChapterNum)
  const verseNumbers = getVerseNumbers(validChapterNum)
  
  useEffect(() => {
    setIsLoaded(true)
    window.scrollTo(0, 0)
  }, [validChapterNum])
  
  // Save language preference to localStorage whenever it changes
  const updateTranslation = (lang) => {
    setTranslation(lang)
    try {
      localStorage.setItem('bg-translation-language', lang)
    } catch (error) {
      console.error('Failed to save language preference:', error)
    }
  }
  
  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLanguageDropdown) {
        const isClickInside = e.target.closest('.language-selector-container') || 
                              e.target.closest('.language-selector-button') ||
                              e.target.closest('.language-dropdown')
        if (!isClickInside) {
          setShowLanguageDropdown(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageDropdown])
  
  // Redirect if trying to access other chapters
  useEffect(() => {
    if (chapterNum !== 1) {
      router.replace('/verse/1')
    }
  }, [chapterNum, router])
  
  if (!chapterData) {
    return null
  }
  
  const handleVerseClick = (verseNum) => {
    router.push(`/verse/${validChapterNum}/${verseNum}`)
  }
  
  // Parse translation text to extract word references (remove brackets, make hoverable)
  const parseTranslationText = (text, verse) => {
    if (!text || !verse || !verse.wordTranslations) return [{ type: 'text', content: text }]
    
    const parts = []
    // Match word followed by reference like "word[1.1.1]" - but don't show brackets
    const regex = /(\S+?)(\[[\d.]+\])/g
    let lastIndex = 0
    let match
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
      }
      
      const wordText = match[1]
      const refMatch = match[2]
      const refId = refMatch.slice(1, -1) // Remove brackets
      
      // Find the word data
      const wordData = Array.isArray(verse.wordTranslations) 
        ? verse.wordTranslations.find(w => w.id === refId)
        : null
      
      // Find explanation if exists from centralized explanations
      const explanation = chapterData?.explanations?.find(e => e.id === refId)
      
      parts.push({
        type: 'reference',
        refId,
        wordText,
        wordData,
        explanation
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) })
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
  }
  
  // Calculate tooltip position (similar to VersePage)
  const calculateTooltipPosition = (triggerElement) => {
    if (!triggerElement) return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }
    
    const triggerRect = triggerElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    const spacing = 8
    const tooltipWidth = 300 // Estimated width
    const tooltipHeight = 150 // Estimated height
    
    // Calculate available space
    const spaceAbove = triggerRect.top
    const spaceBelow = viewportHeight - triggerRect.bottom
    
    // Prefer above, but can be below if needed
    let position = {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: `${spacing}px`,
      top: 'auto',
      right: 'auto'
    }
    
    // If not enough space above but enough below, position below
    if (spaceAbove < tooltipHeight + spacing && spaceBelow > spaceAbove) {
      position = {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: `${spacing}px`,
        bottom: 'auto',
        right: 'auto'
      }
    }
    
    // Adjust horizontal position to prevent overflow
    const triggerCenterX = triggerRect.left + triggerRect.width / 2
    const tooltipHalfWidth = tooltipWidth / 2
    const margin = 10
    
    if (triggerCenterX + tooltipHalfWidth + margin > viewportWidth) {
      const overflow = (triggerCenterX + tooltipHalfWidth + margin) - viewportWidth
      position.transform = `translateX(calc(-50% - ${overflow}px))`
    } else if (triggerCenterX - tooltipHalfWidth - margin < 0) {
      const overflow = margin - (triggerCenterX - tooltipHalfWidth)
      position.transform = `translateX(calc(-50% + ${overflow}px))`
    }
    
    return position
  }
  
  // Handle word hover for tooltip
  const handleWordHover = (refId, wordData, explanation, e) => {
    e.stopPropagation()
    setHoveredWord(refId)
    setHoveredWordData({ wordData, explanation })
    
    // Calculate position after a brief delay to ensure DOM is ready
    setTimeout(() => {
      const wordElement = e.currentTarget
      const position = calculateTooltipPosition(wordElement)
      setHoveredWordPosition(position)
    }, 0)
  }
  
  const handleWordLeave = () => {
    setHoveredWord(null)
    setHoveredWordData(null)
    setHoveredWordPosition(null)
  }
  
  return (
    <div className="chapter-view-page">
      <div className="chapter-view-background"></div>
      
      <div className={`chapter-view-container ${isLoaded ? 'loaded' : ''}`}>
        {/* Chapter Header */}
        <div className="chapter-header">
          <div className="chapter-title-section">
            <h1 className="chapter-number">Chapter {validChapterNum}</h1>
            <h2 className="chapter-name">{chapterData.chapterName}</h2>
            {chapterData.chapterNameSanskrit && (
              <p className="chapter-name-sanskrit">{chapterData.chapterNameSanskrit}</p>
            )}
          </div>
          
          {/* Language Selector */}
          <div className="language-selector-container">
            <button
              className="language-selector-button"
              onClick={(e) => {
                e.stopPropagation()
                setShowLanguageDropdown(!showLanguageDropdown)
              }}
              aria-label="Select language"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </button>
            {showLanguageDropdown && (
              <div className="language-dropdown">
                <button
                  className={`language-option ${translation === 'english' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateTranslation('english')
                    setShowLanguageDropdown(false)
                  }}
                >
                  <span>English</span>
                  {translation === 'english' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </button>
                <button
                  className={`language-option ${translation === 'hindi' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateTranslation('hindi')
                    setShowLanguageDropdown(false)
                  }}
                >
                  <span>हिंदी</span>
                  {translation === 'hindi' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Verses List */}
        <div className="verses-list">
          {verseNumbers.map((verseNum, index) => {
            const verse = getVerse(validChapterNum, `${validChapterNum}.${verseNum}`)
            if (!verse) return null
            
            const verseText = translation === 'english' ? verse.english?.text : verse.hindi?.text
            const parsedText = parseTranslationText(verseText || '', verse)
            
            return (
              <div 
                key={verseNum}
                className="verse-card"
                onClick={() => handleVerseClick(verseNum)}
              >
                <div className="verse-card-header">
                  <span className="verse-number">{validChapterNum}.{verseNum}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18L15 12L9 6"/>
                  </svg>
                </div>
                
                <div className="verse-card-content">
                  <div className={`verse-translation ${translation === 'hindi' ? 'hindi-text' : ''}`}>
                    {parsedText.map((part, idx) => {
                      if (part.type === 'text') {
                        return <span key={idx}>{part.content}</span>
                      } else {
                        const isHovered = hoveredWord === part.refId
                        return (
                          <span 
                            key={idx} 
                            style={{ position: 'relative', display: 'inline-block' }}
                          >
                            <span
                              className={`translation-word-reference ${isHovered ? 'active' : ''}`}
                              onMouseEnter={(e) => handleWordHover(part.refId, part.wordData, part.explanation, e)}
                              onMouseLeave={handleWordLeave}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {part.wordText}
                            </span>
                            {isHovered && hoveredWordData && (
                              <div 
                                className="translation-word-tooltip"
                                style={{
                                  position: 'absolute',
                                  ...(hoveredWordPosition || {
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '8px'
                                  }),
                                  zIndex: 10000
                                }}
                                onMouseEnter={() => {}} // Keep tooltip visible
                                onMouseLeave={handleWordLeave}
                              >
                                {hoveredWordData.wordData && (
                                  <div className="tooltip-word-data">
                                    <div className="tooltip-word-sanskrit">{hoveredWordData.wordData.sanskrit}</div>
                                    {hoveredWordData.wordData.transliteration && (
                                      <div className="tooltip-word-transliteration">({hoveredWordData.wordData.transliteration})</div>
                                    )}
                                    <div className="tooltip-word-translation">
                                      {hoveredWordData.wordData[translation] || hoveredWordData.wordData.english}
                                    </div>
                                  </div>
                                )}
                                {hoveredWordData.explanation && (
                                  <div className="tooltip-word-explanation">
                                    <strong>{(translation === 'hindi' && hoveredWordData.explanation.termHindi) ? hoveredWordData.explanation.termHindi : hoveredWordData.explanation.term}:</strong> {translation === 'hindi' && hoveredWordData.explanation.descHindi ? hoveredWordData.explanation.descHindi : hoveredWordData.explanation.desc}
                                  </div>
                                )}
                              </div>
                            )}
                          </span>
                        )
                      }
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ChapterView
