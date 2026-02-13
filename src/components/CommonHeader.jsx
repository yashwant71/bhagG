'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './CommonHeader.css'

const CommonHeader = ({ 
  chapterNum, 
  translation, 
  onTranslationChange,
  centerContent = null
}) => {
  const router = useRouter()
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  
  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLanguageDropdown) {
        const isClickInside = e.target.closest('.language-selector-container')
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
          <span className="header-separator">/</span>
          <button 
            className="header-chapter-button"
            onClick={() => router.push(`/chapter/${chapterNum}`)}
            title={`Chapter ${chapterNum}`}
          >
            Chapter {chapterNum}
          </button>
        </div>

        <div className="header-center">
          {centerContent}
        </div>

        <div className="header-right">
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
        </div>
      </div>
    </header>
  )
}

export default CommonHeader
