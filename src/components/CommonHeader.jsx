'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllChapterNumbers, getChapter } from '../data/utils'
import './CommonHeader.css'

const CommonHeader = ({ 
  chapterNum, 
  translation, 
  onTranslationChange,
  centerContent = null,
  rightContent = null
}) => {
  const router = useRouter()
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showChapterDropdown, setShowChapterDropdown] = useState(false)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLanguageDropdown) {
        const isClickInside = e.target.closest('.language-selector-container')
        if (!isClickInside) {
          setShowLanguageDropdown(false)
        }
      }
      if (showChapterDropdown) {
        const isClickInside = e.target.closest('.chapter-selector-container')
        if (!isClickInside) {
          setShowChapterDropdown(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageDropdown, showChapterDropdown])

  const allChapters = getAllChapterNumbers()

  return (
    <header className="common-header">
      <div className="header-inner">
        <div className="header-left">
          <button 
            className="header-home-button" 
            onClick={() => router.push('/')}
            aria-label="Back to Home"
            title="Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
        </div>

        <div className="header-center">
          {centerContent}
        </div>

        <div className="header-right">
          <div className="chapter-selector-container">
            <button 
              className="header-chapter-button"
              onClick={() => router.push(`/chapter/${chapterNum}`)}
              title={`Chapter ${chapterNum}: ${getChapter(chapterNum)?.chapterName}`}
            >
              <span className="chapter-label">Ch {chapterNum}</span>
              <span className="chapter-name-header">{getChapter(chapterNum)?.chapterName}</span>
            </button>
            <button 
              className={`chapter-dropdown-trigger ${showChapterDropdown ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setShowChapterDropdown(!showChapterDropdown)
              }}
              aria-label="Select chapter"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            
            {showChapterDropdown && (
              <div className="chapter-dropdown">
                {allChapters.map(chNum => {
                  const chData = getChapter(chNum)
                  return (
                    <button
                      key={chNum}
                      className={`chapter-option ${parseInt(chapterNum) === chNum ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/chapter/${chNum}`)
                        setShowChapterDropdown(false)
                      }}
                    >
                      <div className="chapter-option-info">
                        <span className="chapter-option-number">Chapter {chNum}</span>
                        <span className="chapter-option-name">{chData?.chapterName}</span>
                      </div>
                      {parseInt(chapterNum) === chNum && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

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
                    onTranslationChange('english')
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
                    onTranslationChange('hindi')
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
          
          {rightContent}
        </div>
      </div>
    </header>
  )
}

export default CommonHeader
