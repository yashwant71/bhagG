'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react'
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
  
  // Floating UI for Chapter tooltips
  const {
    x,
    y,
    strategy,
    refs,
  } = useFloating({
    open: !!hoveredWord,
    placement: 'top',
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ['bottom', 'top'] }),
      shift({ padding: 10 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Update position reference when hovered word changes
  useEffect(() => {
    if (hoveredWord) {
      const element = document.querySelector(`.translation-word-reference.active`)
      if (element) refs.setPositionReference(element)
    }
  }, [hoveredWord, refs])
  
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
      router.replace('/chapter/1')
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
  
  // Handle word hover for tooltip
  const handleWordHover = (refId, wordData, explanation, e) => {
    e.stopPropagation()
    setHoveredWord(refId)
    setHoveredWordData({ wordData, explanation })
  }
  
  const handleWordLeave = () => {
    setHoveredWord(null)
    setHoveredWordData(null)
  }
  
  return (
    <div className="chapter-view-page">
      <div className="chapter-view-background"></div>
      
      <div className={`chapter-view-container ${isLoaded ? 'loaded' : ''}`}>
        {/* Navigation */}
        <div className="chapter-view-nav">
          <button 
            className="view-home-button" 
            onClick={() => router.push('/')}
            aria-label="Back to Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </button>
        </div>

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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                              onMouseEnter={(e) => {
                                handleWordHover(part.refId, part.wordData, part.explanation, e)
                                refs.setReference(e.currentTarget)
                              }}
                              onMouseLeave={handleWordLeave}
                              onClick={() => {}}
                            >
                              {part.wordText}
                            </span>
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

      {/* Global Translation Word Tooltip */}
      {hoveredWord && hoveredWordData && (
        <div 
          ref={refs.setFloating}
          className="translation-word-tooltip"
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            zIndex: 10000,
            pointerEvents: 'auto',
            visibility: x === null ? 'hidden' : 'visible'
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
    </div>
  )
}

export default ChapterView
