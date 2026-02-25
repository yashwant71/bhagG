'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react'
import { getChapter, getVerseNumbers, getVerse, getAllChapterNumbers } from '../data/utils'
import WordTooltipContent from './WordTooltipContent'
import TranslationTextRenderer from './TranslationTextRenderer'
import CommonHeader from './CommonHeader'
import './ChapterView.css'
import './VersePage.css' // Reuse styles

import LoadingScreen from './LoadingScreen'

const ChapterView = () => {
  const params = useParams()
  const router = useRouter()
  
  const chapter = Array.isArray(params?.params) ? params.params[0] : (params?.chapter || params?.params?.[0])
  const chapterNum = parseInt(chapter || '1')
  
  // Available chapters from data
  const allChapters = getAllChapterNumbers()
  const isValidChapter = allChapters.includes(chapterNum)
  const validChapterNum = isValidChapter ? chapterNum : 1
  
  const currentIndex = allChapters.indexOf(validChapterNum)
  const prevChapterNum = currentIndex > 0 ? allChapters[currentIndex - 1] : null
  const nextChapterNum = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null
  
  // Load language preference from localStorage, default to 'english'
  const getStoredLanguage = () => {
    try {
      const stored = localStorage.getItem('bg-translation-language')
      return stored === 'hindi' || stored === 'english' ? stored : 'english'
    } catch (error) {
      return 'english'
    }
  }
  
  const [chapterData, setChapterData] = useState(null)
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pageOffset, setPageOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [translation, setTranslation] = useState(getStoredLanguage)
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
  
  const fetchChapterData = useCallback(async (initial = false) => {
    const currentOffset = initial ? 0 : pageOffset
    const url = `/api/chapters/${validChapterNum}?limit=10&offset=${currentOffset}`
    
    try {
      if (initial) setLoading(true)
      else setLoadingMore(true)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (initial) {
        setChapterData(data)
        setVerses(data.verses)
      } else {
        setVerses(prev => [...prev, ...data.verses])
      }
      
      setHasMore(data.hasMore)
      setPageOffset(currentOffset + 10)
    } catch (error) {
      console.error('Failed to fetch chapter data:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsLoaded(true)
    }
  }, [validChapterNum, pageOffset])

  useEffect(() => {
    setPageOffset(0)
    setVerses([])
    fetchChapterData(true)
    window.scrollTo(0, 0)
  }, [validChapterNum])
  
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchChapterData()
    }
  }
  
  // Save language preference to localStorage whenever it changes
  const updateTranslation = (lang) => {
    setTranslation(lang)
    try {
      localStorage.setItem('bg-translation-language', lang)
    } catch (error) {
      console.error('Failed to save language preference:', error)
    }
  }
  
  // Close language dropdown when clicking outside (Now handled by CommonHeader)
  
  // Redirect if trying to access other chapters
  useEffect(() => {
    if (chapterNum !== 1) {
      router.replace('/chapter/1')
    }
  }, [chapterNum, router])
  
  const handleVerseClick = (verseNum) => {
    router.push(`/verse/${validChapterNum}/${verseNum}`)
  }
  
  // Parse translation text to extract word references and handle nesting
  const parseTranslationText = (text, verse) => {
    if (!text || !verse || !verse.wordTranslations) return [{ type: 'text', content: text }]
    
    const findWordData = (refId) => {
      return Array.isArray(verse.wordTranslations) 
        ? verse.wordTranslations.find(w => String(w.id) === String(refId) || w.explanationRef === refId)
        : null
    }
    
    const findExplanation = (refId, wordData) => {
      let exp = chapterData?.explanations?.find(e => e.id === refId)
      if (!exp && wordData) {
        exp = chapterData?.explanations?.find(e => e.id === wordData.explanationRef)
      }
      return exp
    }

    const parseContent = (str) => {
      const res = []
      let lastIdx = 0
      let currentIdx = 0
      
      while (currentIdx < str.length) {
        if (str[currentIdx] === '(') {
          if (currentIdx > lastIdx) {
            res.push({ type: 'text', content: str.substring(lastIdx, currentIdx) })
          }
          
          let depth = 1
          let j = currentIdx + 1
          while (j < str.length && depth > 0) {
            if (str[j] === '(') depth++
            if (str[j] === ')') depth--
            j++
          }
          
          if (j < str.length && str[j] === '[') {
            const wordContent = str.substring(currentIdx + 1, j - 1)
            let k = j + 1
            while (k < str.length && str[k] !== ']') {
              k++
            }
            
            if (k < str.length) {
              const refId = str.substring(j + 1, k)
              const wordData = findWordData(refId)
              const explanation = findExplanation(refId, wordData)
              
              res.push({
                type: 'reference',
                refId,
                wordText: parseContent(wordContent),
                wordData,
                explanation
              })
              
              lastIdx = k + 1
              currentIdx = k + 1
              continue
            }
          }
        }
        currentIdx++
      }
      
      if (lastIdx < str.length) {
        res.push({ type: 'text', content: str.substring(lastIdx) })
      }
      
      return res.length > 0 ? res : [{ type: 'text', content: str }]
    }
    
    return parseContent(text)
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
  
  if (loading && verses.length === 0) {
    return <LoadingScreen />
  }

  if (!chapterData) {
    return null
  }
  
  return (
    <div className="chapter-view-page">
      <div className="chapter-view-background"></div>
      
      <CommonHeader 
        chapterNum={validChapterNum}
        translation={translation}
        onTranslationChange={updateTranslation}
      />

      <div className={`chapter-view-container ${isLoaded ? 'loaded' : ''}`}>
        {/* Chapter Header */}
        <div className="chapter-header">
          <div className="chapter-title-section">
            <h1 className="chapter-name">{chapterData.chapterName}</h1>
            {chapterData.chapterNameSanskrit && (
              <p className="chapter-name-sanskrit">{chapterData.chapterNameSanskrit}</p>
            )}
          </div>
        </div>
        
        {/* Verses List */}
        <div className="verses-list">
          {verses.map((verse, index) => {
            const verseNum = verse.number
            const verseText = translation === 'english' ? verse.english?.text : verse.hindi?.text
            const parsedText = parseTranslationText(verseText || '', verse)
            
            return (
              <div 
                key={verseNum}
                className="verse-card"
              >
                <div className="verse-card-layout">
                  <div className="verse-card-content">
                    <div className="verse-card-left">
                      <span className="verse-number">{validChapterNum}.{verseNum}</span>
                    </div>
                    
                    <div className="verse-card-main">
                      <div className={`verse-translation ${translation === 'hindi' ? 'hindi-text' : ''}`}>
                        <TranslationTextRenderer 
                          parts={parsedText} 
                          onReferenceClick={handleWordHover}
                          activeRefId={hoveredWord}
                        />
                      </div>
                    </div>
                  </div>

                  <div 
                    className="verse-card-right"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVerseClick(verseNum)
                    }}
                    role="button"
                    aria-label={`View verse ${validChapterNum}.${verseNum}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleVerseClick(verseNum)
                      }
                    }}
                  >
                    <div className="arrow-indicator">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14m-7-7 7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="load-more-container">
            <button 
              className={`load-more-button ${loadingMore ? 'loading' : ''}`}
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? <span className="loader-dots">Loading</span> : 'Load More Verses'}
            </button>
          </div>
        )}

        {/* Chapter Navigation Bottom */}
        <div className="chapter-bottom-nav">
          <button 
            className={`nav-button prev ${!prevChapterNum ? 'disabled' : ''}`}
            onClick={() => prevChapterNum && router.push(`/chapter/${prevChapterNum}`)}
            disabled={!prevChapterNum}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            <div className="nav-info">
              <span className="nav-label">Previous</span>
              <span className="nav-name">{prevChapterNum ? `Chapter ${prevChapterNum}` : 'No Previous'}</span>
            </div>
          </button>

          <button 
            className="nav-button chapters"
            onClick={() => router.push('/')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>All Chapters</span>
          </button>

          <button 
            className={`nav-button next ${!nextChapterNum ? 'disabled' : ''}`}
            onClick={() => nextChapterNum && router.push(`/chapter/${nextChapterNum}`)}
            disabled={!nextChapterNum}
          >
            <div className="nav-info">
              <span className="nav-label">Next</span>
              <span className="nav-name">{nextChapterNum ? `Chapter ${nextChapterNum}` : 'Coming Soon'}</span>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Global Translation Word Tooltip */}
      {hoveredWord && hoveredWordData && (
        <div 
          ref={refs.setFloating}
          className={`translation-word-tooltip ${(hoveredWordData.explanation || hoveredWordData.wordData?.explanation) ? 'has-explanation' : ''}`}
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
        <WordTooltipContent 
          key={hoveredWord}
          words={hoveredWordData.wordData ? [hoveredWordData.wordData] : (hoveredWordData.explanation ? [{ ...hoveredWordData.explanation, english: hoveredWordData.explanation.term, hindi: hoveredWordData.explanation.termHindi, explanation: hoveredWordData.explanation }] : [])} 
          isTranslationMode={true} 
          translation={translation}
          chapterData={chapterData}
        />
        </div>
      )}
    </div>
  )
}

export default ChapterView
