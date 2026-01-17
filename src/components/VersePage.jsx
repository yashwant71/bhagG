'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getVerse, getNextVerseNumber, getPrevVerseNumber, getAllChapterNumbers, getVerseNumbers, getChapter } from '../data/utils'
import './VersePage.css'

const VersePage = () => {
  const params = useParams()
  const router = useRouter()
  
  // Handle both catch-all route format and direct params
  const chapter = Array.isArray(params?.params) ? params.params[0] : (params?.chapter || params?.params?.[0])
  const verseParam = Array.isArray(params?.params) ? params.params[1] : (params?.verse || params?.params?.[1])
  
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
  const [clickedWord, setClickedWord] = useState(null) // Track clicked word for persistent tooltip
  const [wordData, setWordData] = useState(null) // Store word data (translations + Sanskrit)
  const [toggledMeanings, setToggledMeanings] = useState({}) // Track which meanings show Sanskrit vs translation
  const [copied, setCopied] = useState(false) // For translation copy
  const [copiedSanskrit, setCopiedSanskrit] = useState(false) // For Sanskrit copy
  const [showNavMenu, setShowNavMenu] = useState(false) // Track navigation menu visibility
  const [hoveredWord, setHoveredWord] = useState(null) // Track hovered word for temporary tooltip
  const [hoveredWordData, setHoveredWordData] = useState(null) // Store hovered word data
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false) // Track language dropdown visibility
  const [animationKey, setAnimationKey] = useState(0) // Force animation restart on verse change
  const [animationsComplete, setAnimationsComplete] = useState(false) // Track if all Sanskrit word animations are complete
  const [clickedTranslationWord, setClickedTranslationWord] = useState(null) // Track clicked translation word
  const [translationWordData, setTranslationWordData] = useState(null) // Store translation word data
  const [translationTooltipPosition, setTranslationTooltipPosition] = useState(null) // Tooltip position style
  const [sanskritTooltipPosition, setSanskritTooltipPosition] = useState(null) // Sanskrit tooltip position
  const sanskritTooltipRef = useRef(null) // Ref for Sanskrit tooltip
  const translationTooltipRef = useRef(null) // Ref for translation tooltip
  
  // Bookmark management
  const getBookmarks = () => {
    try {
      const stored = localStorage.getItem('bg-bookmarks')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  }
  
  const [bookmarks, setBookmarks] = useState(getBookmarks)
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0) // For swipe animation
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState(null) // 'left' | 'right' | null
  const [isTransitioning, setIsTransitioning] = useState(false) // For card transition animation
  const [isEntering, setIsEntering] = useState(false) // For new card entering animation

  const touchStartX = useRef(null)
  const touchEndX = useRef(null)
  const touchStartY = useRef(null)
  const verseContainerRef = useRef(null)

  const chapterNum = parseInt(chapter || '1')
  // Only allow chapter 1, redirect if other chapter is accessed
  const validChapterNum = chapterNum === 1 ? 1 : 1
  const verseNum = verseParam || '1'
  const chapterVerseKey = `${validChapterNum}.${verseNum}`
  
  const currentVerseKey = `${validChapterNum}.${verseParam}`
  const isBookmarked = bookmarks.includes(currentVerseKey)
  
  // Get chapter data for centralized explanations
  const chapterData = getChapter(validChapterNum)
  
  // Update bookmarks when verse changes
  useEffect(() => {
    setBookmarks(getBookmarks())
  }, [validChapterNum, verseParam])
  
  const toggleBookmark = () => {
    const newBookmarks = isBookmarked
      ? bookmarks.filter(b => b !== currentVerseKey)
      : [...bookmarks, currentVerseKey]
    setBookmarks(newBookmarks)
    localStorage.setItem('bg-bookmarks', JSON.stringify(newBookmarks))
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

  // Check if swipe tutorial should be shown on first visit
  useEffect(() => {
    const checkSwipeTutorial = () => {
      try {
        const tutorialShown = localStorage.getItem('bg-swipe-tutorial-shown')
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
        
        // Show tutorial if never shown and on mobile
        if (!tutorialShown && isMobile) {
          setShowSwipeTutorial(true)
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setShowSwipeTutorial(false)
            try {
              localStorage.setItem('bg-swipe-tutorial-shown', Date.now().toString())
            } catch (err) {
              console.error('Error saving tutorial:', err)
            }
          }, 5000)
        }
      } catch (error) {
        console.error('Error checking swipe tutorial:', error)
      }
    }
    
    // Check after a delay to ensure page is loaded
    const timer = setTimeout(checkSwipeTutorial, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Check if we're entering from a swipe transition
    const storedDirection = sessionStorage.getItem('bg-swipe-direction')
    if (storedDirection) {
      setIsEntering(true)
      setSwipeDirection(storedDirection)
      sessionStorage.removeItem('bg-swipe-direction')
      
      // Animate card sliding in from opposite side
      setTimeout(() => {
        setIsEntering(false)
        setSwipeDirection(null)
      }, 300)
    }
    
    // Reset animation state when verse changes
    setIsLoaded(false)
    setAnimationsComplete(false) // Reset animations complete state
    setAnimationKey(prev => prev + 1) // Force animation restart
    window.scrollTo(0, 0)
    
    // Reset tooltip state when verse changes
    setClickedWord(null)
    setWordData(null)
    setToggledMeanings({})
    setHoveredWord(null)
    setHoveredWordData(null)
    setClickedTranslationWord(null)
    setTranslationWordData(null)
    setSanskritTooltipPosition(null)
    setTranslationTooltipPosition(null)
    
    // Reset swipe transition state when verse changes
    setIsTransitioning(false)
    setSwipeOffset(0)
    
    // Trigger animation after a brief delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, isEntering ? 50 : 50)
    
    return () => clearTimeout(timer)
  }, [chapter, verseParam])

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is on Sanskrit word or tooltip
      const isClickOnSanskritWord = e.target.closest('.sanskrit-word')
      const isClickOnTooltip = e.target.closest('.word-tooltip')
      const isClickOnTooltipMeaning = e.target.closest('.tooltip-meaning')
      
      // Close static tooltip if clicking outside Sanskrit word and tooltip
      if (clickedWord && !isClickOnSanskritWord && !isClickOnTooltip && !isClickOnTooltipMeaning) {
        setClickedWord(null)
        setWordData(null)
        setToggledMeanings({})
      }
      
      // Also close hover tooltip when clicking anywhere (except on Sanskrit word or tooltip)
      if (hoveredWord && !isClickOnSanskritWord && !isClickOnTooltip) {
        setHoveredWord(null)
        setHoveredWordData(null)
      }
      
      // Close language dropdown if clicking outside
      if (showLanguageDropdown) {
        const isClickInside = e.target.closest('.language-selector-container') || 
                              e.target.closest('.language-selector-button') ||
                              e.target.closest('.language-dropdown')
        if (!isClickInside) {
          setShowLanguageDropdown(false)
        }
      }
      
      // Close translation word tooltip if clicking outside
      if (clickedTranslationWord && !e.target.closest('.translation-word-reference') && !e.target.closest('.translation-word-tooltip')) {
        setClickedTranslationWord(null)
        setTranslationWordData(null)
        setTranslationTooltipPosition(null)
      }
      
      // Close Sanskrit tooltip if clicking outside
      if (clickedWord && !e.target.closest('.sanskrit-word') && !e.target.closest('.word-tooltip')) {
        setSanskritTooltipPosition(null)
      }
    }
    
    // Always add the event listener to handle tooltip closing
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [clickedWord, hoveredWord, showLanguageDropdown, clickedTranslationWord])
  
  // Clear hover state when word is clicked (becomes static)
  useEffect(() => {
    if (clickedWord) {
      setHoveredWord(null)
      setHoveredWordData(null)
    }
  }, [clickedWord])
  
  // Update tooltip positions on scroll/resize only - NOT when content changes
  useEffect(() => {
    const updateTooltipPositions = () => {
      // Update Sanskrit tooltip position - always above
      if (clickedWord && sanskritTooltipRef.current) {
        const wordElement = document.querySelector(`.sanskrit-word.tooltip-active`)
        if (wordElement) {
          const position = calculateTooltipPosition(wordElement, sanskritTooltipRef.current, true)
          setSanskritTooltipPosition(position)
        }
      }
      
      // Update translation tooltip position - can be below if needed
      if (clickedTranslationWord && translationTooltipRef.current) {
        const wordElement = document.querySelector(`.translation-word-reference.active`)
        if (wordElement) {
          const position = calculateTooltipPosition(wordElement, translationTooltipRef.current, false)
          setTranslationTooltipPosition(position)
        }
      }
    }
    
    window.addEventListener('scroll', updateTooltipPositions, true)
    window.addEventListener('resize', updateTooltipPositions)
    
    // Initial position calculation with a small delay to ensure DOM is ready
    // Only calculate when tooltip first opens, not when content changes
    const timeoutId = setTimeout(updateTooltipPositions, 10)
    
    return () => {
      window.removeEventListener('scroll', updateTooltipPositions, true)
      window.removeEventListener('resize', updateTooltipPositions)
      clearTimeout(timeoutId)
    }
  }, [clickedWord, clickedTranslationWord]) // Removed wordData and translationWordData - only recalculate on scroll/resize

  // Redirect to chapter 1 if trying to access other chapters
  useEffect(() => {
    if (chapterNum !== 1) {
      const verseNumbers = getVerseNumbers(1)
      if (verseNumbers.length > 0) {
        router.replace(`/verse/1/${verseNumbers[0]}`)
      }
    }
  }, [chapterNum, router])
  
  // Handle redirect if verse not found - must be before conditional return
  useEffect(() => {
    const verse = getVerse(validChapterNum, chapterVerseKey)
    if (!verse) {
      const verseNumbers = getVerseNumbers(1)
      if (verseNumbers.length > 0) {
        router.replace(`/verse/1/${verseNumbers[0]}`)
      }
    }
  }, [validChapterNum, chapterVerseKey, router])
  
  const verse = getVerse(validChapterNum, chapterVerseKey)
  
  // Parse Sanskrit text - safe even if verse is null
  const parseSanskritWithBrackets = (sanskritText) => {
    if (!sanskritText) return []
    const lines = sanskritText.split('\n')
    return lines.map(line => {
      const words = line.split(/\s+/).filter(w => w.length > 0)
      return words.map(word => {
        // Extract bracket IDs and remove brackets from display text
        // Support both numeric IDs [1] and dot notation IDs [1.1.1]
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
              // Extract ID - can be numeric or dot notation like "1.1.1"
              const idStr = word.substring(i + 1, j)
              // Store as string to support dot notation IDs
              if (idStr.length > 0) {
                ids.push(idStr)
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
    if (!sanskritText) return []
    const lines = sanskritText.split('\n')
    return lines.map(line => {
      return line.split(/\s+/).filter(word => word.length > 0).map(word => ({
        text: word,
        ids: []
      }))
    })
  }

  // Check if text has brackets (chapter1 format) - safe even if verse is null
  const hasBrackets = verse?.sanskrit && verse.sanskrit.includes('[')
  const isArrayFormat = Array.isArray(verse?.wordTranslations) && verse.wordTranslations[0]?.id
  
  const sanskritLines = verse ? ((hasBrackets && isArrayFormat) 
    ? parseSanskritWithBrackets(verse.sanskrit)
    : splitSanskritIntoWords(verse.sanskrit)) : []

  // Calculate delays: each word in a line gets a small delay, 
  // then next line starts right after the previous line's last word finishes
  const getWordDelay = (lineIndex, wordIndex, lineLength) => {
    // First line: each word has a small delay (0.06s apart - faster)
    if (lineIndex === 0) {
      return wordIndex * 0.06
    }
    
    // For lines after the first: start next line before previous line fully finishes
    // Each line's end time = last word start time + animation duration (0.7s)
    // Last word start time = first word start time + (wordCount - 1) * 0.06
    // Start next line when previous line is 60% done (overlap for faster feel)
    
    let previousLinesEndTime = 0
    
    // Calculate end time of all previous lines
    for (let i = 0; i < lineIndex; i++) {
      const prevLineWordCount = sanskritLines[i]?.length || 0
      const prevLineFirstWordDelay = i === 0 ? 0 : previousLinesEndTime
      const prevLineLastWordStartTime = prevLineFirstWordDelay + (prevLineWordCount - 1) * 0.06
      // Start next line when previous line is 60% done (0.6 * 0.7s = 0.42s)
      const prevLineStartNextLineTime = prevLineLastWordStartTime + 0.42
      previousLinesEndTime = prevLineStartNextLineTime
    }
    
    // Current line starts after previous lines are 60% done
    // Each word in current line has 0.06s delay from the previous word
    return previousLinesEndTime + (wordIndex * 0.06)
  }

  // Calculate when all animations complete (last word delay + animation duration)
  const calculateAnimationCompletionTime = useCallback(() => {
    if (sanskritLines.length === 0) return 0
    
    let lastWordDelay = 0
    // Find the last word's delay
    for (let lineIndex = 0; lineIndex < sanskritLines.length; lineIndex++) {
      const line = sanskritLines[lineIndex]
      for (let wordIndex = 0; wordIndex < line.length; wordIndex++) {
        const delay = getWordDelay(lineIndex, wordIndex, line.length)
        lastWordDelay = Math.max(lastWordDelay, delay)
      }
    }
    
    // Animation duration is 0.7s, so total time = last word delay + 0.7s
    return (lastWordDelay + 0.7) * 1000 // Convert to milliseconds
  }, [sanskritLines])

  // Set animations complete after all words have finished animating
  useEffect(() => {
    if (!isLoaded || sanskritLines.length === 0) {
      setAnimationsComplete(false)
      return
    }
    
    const completionTime = calculateAnimationCompletionTime()
    const timer = setTimeout(() => {
      setAnimationsComplete(true)
    }, completionTime)
    
    return () => clearTimeout(timer)
  }, [isLoaded, animationKey, sanskritLines, calculateAnimationCompletionTime])

  // Parse translation text to extract word references and make them clickable
  const parseTranslationText = (text) => {
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

  // Handle translation word click
  const handleTranslationWordClick = (refId, wordData, explanation, e) => {
    e.stopPropagation()
    
    if (clickedTranslationWord === refId) {
      setClickedTranslationWord(null)
      setTranslationWordData(null)
      setTranslationTooltipPosition(null)
      return
    }
    
    setClickedTranslationWord(refId)
    setTranslationWordData({ wordData, explanation })
    
    // Calculate position after state update
    // Translation tooltips can be below if needed
    setTimeout(() => {
      const wordElement = e.currentTarget
      const tooltipElement = translationTooltipRef.current
      if (wordElement && tooltipElement) {
        const position = calculateTooltipPosition(wordElement, tooltipElement, false)
        setTranslationTooltipPosition(position)
      } else {
        // Fallback if tooltip not yet rendered
        const position = calculateTooltipPosition(wordElement, null, false)
        setTranslationTooltipPosition(position)
      }
    }, 0)
  }
  
  // Navigation handlers
  const handleNextVerse = () => {
    const nextVerse = getNextVerseNumber(validChapterNum, chapterVerseKey)
    if (nextVerse) {
      // Parse the result (e.g., "1.2" -> ["1", "2"])
      const [nextChapter, nextVerseNum] = nextVerse.split('.')
      // Only allow chapter 1
      if (parseInt(nextChapter) === 1) {
        router.push(`/verse/${nextChapter}/${nextVerseNum}`)
      }
    }
  }

  const handlePrevVerse = () => {
    const prevVerse = getPrevVerseNumber(validChapterNum, chapterVerseKey)
    if (prevVerse) {
      // Parse the result (e.g., "1.1" -> ["1", "1"])
      const [prevChapter, prevVerseNum] = prevVerse.split('.')
      // Only allow chapter 1
      if (parseInt(prevChapter) === 1) {
        router.push(`/verse/${prevChapter}/${prevVerseNum}`)
      }
    }
  }

  // Swipe handlers for mobile - works on whole screen
  const handleTouchStart = (e) => {
    // Don't interfere with tooltip clicks or other interactions
    if (e.target.closest('.word-tooltip') || e.target.closest('.translation-word-tooltip') || e.target.closest('button')) {
      return
    }
    
    touchStartX.current = e.touches[0].clientX
    setIsSwiping(true)
    setSwipeOffset(0)
    
    // Hide tutorial when user starts swiping
    if (showSwipeTutorial) {
      setShowSwipeTutorial(false)
      try {
        localStorage.setItem('bg-swipe-tutorial-shown', Date.now().toString())
      } catch (error) {
        console.error('Error saving tutorial state:', error)
      }
    }
  }

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return
    
    // Don't interfere with tooltip interactions
    if (e.target.closest('.word-tooltip') || e.target.closest('.translation-word-tooltip')) {
      return
    }
    
    touchEndX.current = e.touches[0].clientX
    const distance = touchEndX.current - touchStartX.current
    
    // Only prevent default if swiping horizontally (not vertically)
    if (Math.abs(distance) > Math.abs(e.touches[0].clientY - (touchStartX.current ? 0 : 0))) {
      e.preventDefault()
    }
    
    // Update swipe offset for visual feedback (limit to prevent too much movement)
    const maxOffset = 150
    const offset = Math.max(-maxOffset, Math.min(maxOffset, distance))
    setSwipeOffset(offset)
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsSwiping(false)
      setSwipeOffset(0)
      touchStartX.current = null
      touchEndX.current = null
      touchStartY.current = null
      return
    }
    
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      // Swipe left - next verse
      // Start transition: current card slides left, new card comes from right
      setIsTransitioning(true)
      setSwipeDirection('left')
      setSwipeOffset(-window.innerWidth)
      
      // Navigate after animation starts
      setTimeout(() => {
        handleNextVerse()
        // Reset after navigation completes
        setTimeout(() => {
          setSwipeOffset(0)
          setIsSwiping(false)
          setIsTransitioning(false)
          setSwipeDirection(null)
        }, 50)
      }, 300)
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous verse
      // Start transition: current card slides right, new card comes from left
      setIsTransitioning(true)
      setSwipeDirection('right')
      setSwipeOffset(window.innerWidth)
      
      // Navigate after animation starts
      setTimeout(() => {
        handlePrevVerse()
        // Reset after navigation completes
        setTimeout(() => {
          setSwipeOffset(0)
          setIsSwiping(false)
          setIsTransitioning(false)
          setSwipeDirection(null)
        }, 50)
      }, 300)
    } else {
      // Not enough swipe distance, reset
      setSwipeOffset(0)
      setIsSwiping(false)
    }

    touchStartX.current = null
    touchEndX.current = null
    touchStartY.current = null
  }
  

  // Get word data helper function
  const getWordData = (lineIndex, wordIndex) => {
    if (!verse.wordTranslations) return null
    
    const segment = sanskritLines[lineIndex]?.[wordIndex]
    if (!segment) return null
    
    // Check if wordTranslations is an array with id field (chapter1 bracket format)
    if (Array.isArray(verse.wordTranslations) && segment.ids && segment.ids.length > 0) {
      // Get word data for all IDs in this word
      const wordsData = segment.ids
        .map(id => {
          // Ensure both are strings for comparison
          const idStr = String(id)
          const data = verse.wordTranslations.find(wt => String(wt.id) === idStr)
          if (!data) return null
          
          // Check for explanation by ID first
          let explanation = chapterData?.explanations?.find(e => e.id === idStr)
          // If not found, try to match by term name
          if (!explanation) {
            explanation = chapterData?.explanations?.find(e => 
              e.term === data.english || 
              e.term === data.hindi ||
              (data.english && (data.english.includes(e.term) || e.term.includes(data.english))) ||
              (data.hindi && (data.hindi.includes(e.term) || e.term.includes(data.hindi)))
            )
          }
          
          return { id: idStr, ...data, explanation: explanation || null }
        })
        .filter(w => w !== null)
      
      return wordsData.length > 0 ? wordsData : null
    } else if (!Array.isArray(verse.wordTranslations)) {
      // Object format (chapter2+ format) - use position-based keys
      const lineKey = lineIndex + 1
      const wordKeyNum = wordIndex + 1
      const key = `${lineKey}-${wordKeyNum}`
      
      const data = verse.wordTranslations[key]
      if (data) {
        // Check for explanation by term matching
        let explanation = chapterData?.explanations?.find(e => 
          e.term === data.english || 
          e.term === data.hindi ||
          (data.english && (data.english.includes(e.term) || e.term.includes(data.english))) ||
          (data.hindi && (data.hindi.includes(e.term) || e.term.includes(data.hindi)))
        )
        // For chapter2 format, use key as id for toggling
        return [{ id: key, key, ...data, explanation: explanation || null }]
      }
    }
    return null
  }

  // Handle word hover for temporary tooltip (desktop only)
  const handleWordHover = (lineIndex, wordIndex, e) => {
    const wordKey = `${lineIndex}-${wordIndex}`
    const wordsData = getWordData(lineIndex, wordIndex)
    
    // If hovering over a different word, close any existing static tooltip
    if (clickedWord && clickedWord !== wordKey) {
      setClickedWord(null)
      setWordData(null)
      setToggledMeanings({})
    }
    
    // Set new hover state immediately (no delay) for smooth transition between words
    if (wordsData) {
      setHoveredWord(wordKey)
      setHoveredWordData(wordsData)
    }
  }

  // Handle word leave (hide hover tooltip)
  const handleWordLeave = (e) => {
    // Only hide hover tooltip if word is not clicked (static)
    if (!clickedWord) {
      const relatedTarget = e.relatedTarget
      // Check if mouse is moving to tooltip or another word
      const isMovingToTooltip = relatedTarget && relatedTarget.closest('.word-tooltip')
      const isMovingToWord = relatedTarget && relatedTarget.closest('.sanskrit-word')
      
      // Only hide if not moving to tooltip or another word
      if (!isMovingToTooltip && !isMovingToWord) {
        // Small delay to allow smooth transition
        setTimeout(() => {
          // Double-check that we're not hovering over tooltip or another word now
          const tooltipElement = document.querySelector('.word-tooltip:hover')
          const wordElement = document.querySelector('.sanskrit-word.has-translation:hover')
          if (!clickedWord && !tooltipElement && !wordElement) {
            setHoveredWord(null)
            setHoveredWordData(null)
          }
        }, 100)
      }
    }
  }

  // Handle tooltip hover - convert hover tooltip to static when mouse enters tooltip
  const handleTooltipEnter = (lineIndex, wordIndex) => {
    // If hovering and mouse enters tooltip, make it static
    if (hoveredWord && !clickedWord) {
      const wordKey = `${lineIndex}-${wordIndex}`
      const wordsData = getWordData(lineIndex, wordIndex)
      
      if (wordsData) {
        setClickedWord(wordKey)
        setWordData(wordsData)
        setToggledMeanings({})
        setHoveredWord(null)
        setHoveredWordData(null)
      }
    }
  }

  // Calculate optimal tooltip position to avoid screen cutoff
  // For Sanskrit word tooltips, always position above
  const calculateTooltipPosition = (triggerElement, tooltipElement, alwaysAbove = true) => {
    if (!triggerElement) return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }
    
    const triggerRect = triggerElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    const spacing = 8
    // Get actual tooltip dimensions if available, otherwise use estimates
    const tooltipRect = tooltipElement?.getBoundingClientRect()
    const tooltipWidth = tooltipRect?.width || 300 // Fallback width
    const tooltipHeight = tooltipRect?.height || 100 // Fallback height
    
    // Calculate available space in each direction
    const spaceAbove = triggerRect.top
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceLeft = triggerRect.left
    const spaceRight = viewportWidth - triggerRect.right
    
    // Always position above for Sanskrit word tooltips
    let position = {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: `${spacing}px`,
      top: 'auto',
      right: 'auto',
      marginTop: '0',
      marginLeft: '0',
      marginRight: '0'
    }
    
    // Only allow below positioning if explicitly allowed (for translation tooltips)
    // Sanskrit word tooltips always stay above
    if (!alwaysAbove && spaceAbove < tooltipHeight + spacing && spaceBelow > spaceAbove) {
      position = {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: `${spacing}px`,
        bottom: 'auto',
        right: 'auto',
        marginBottom: '0',
        marginLeft: '0',
        marginRight: '0'
      }
    }
    
    // Adjust horizontal position if tooltip would overflow
    const triggerCenterX = triggerRect.left + triggerRect.width / 2
    const tooltipHalfWidth = tooltipWidth / 2
    const margin = 10 // Minimum margin from screen edge
    
    // Check if tooltip would overflow on the right
    if (triggerCenterX + tooltipHalfWidth + margin > viewportWidth) {
      const overflow = (triggerCenterX + tooltipHalfWidth + margin) - viewportWidth
      // Try shifting left
      const shiftedLeft = triggerCenterX - overflow
      if (shiftedLeft - tooltipHalfWidth >= margin) {
        // Can shift left within bounds
        position.transform = `translateX(calc(-50% - ${overflow}px))`
      } else {
        // Need to position at right edge
        position.left = 'auto'
        position.right = `${margin}px`
        position.transform = 'translateX(0)'
      }
    }
    // Check if tooltip would overflow on the left
    else if (triggerCenterX - tooltipHalfWidth - margin < 0) {
      const overflow = margin - (triggerCenterX - tooltipHalfWidth)
      // Try shifting right
      const shiftedRight = triggerCenterX + overflow
      if (shiftedRight + tooltipHalfWidth + margin <= viewportWidth) {
        // Can shift right within bounds
        position.transform = `translateX(calc(-50% + ${overflow}px))`
      } else {
        // Need to position at left edge
        position.left = `${margin}px`
        position.right = 'auto'
        position.transform = 'translateX(0)'
      }
    }
    
    return position
  }

  // Handle word click for persistent tooltip
  const handleWordClick = (lineIndex, wordIndex, e) => {
    e.stopPropagation()
    
    const wordKey = `${lineIndex}-${wordIndex}`
    const wordsData = getWordData(lineIndex, wordIndex)
    
    if (!wordsData) return
    
    // Toggle tooltip - if already open, close it; otherwise open it
    if (clickedWord === wordKey) {
      setClickedWord(null)
      setWordData(null)
      setToggledMeanings({})
      setHoveredWord(null)
      setHoveredWordData(null)
      setSanskritTooltipPosition(null)
      return
    }
    
    // Set clicked word (static tooltip)
    setClickedWord(wordKey)
    setWordData(wordsData)
    setToggledMeanings({}) // Reset toggles for new word
    // Clear hover state when clicking
    setHoveredWord(null)
    setHoveredWordData(null)
    
    // Calculate position after state update (using setTimeout to ensure DOM is updated)
    // Always position Sanskrit tooltips above
    setTimeout(() => {
      const wordElement = e.target.closest('.sanskrit-word')
      const tooltipElement = sanskritTooltipRef.current
      if (wordElement && tooltipElement) {
        const position = calculateTooltipPosition(wordElement, tooltipElement, true)
        setSanskritTooltipPosition(position)
      }
    }, 0)
  }

  // Toggle between translation and transliteration for a specific word
  const handleMeaningClick = (wordId, e) => {
    e.stopPropagation() // Prevent closing the tooltip
    setToggledMeanings(prev => ({
      ...prev,
      [wordId]: !prev[wordId] // Toggle: true = show transliteration, false = show translation
    }))
    // Do NOT recalculate position - keep the same position when toggling content
  }

  // Handle copy to clipboard
  const handleCopySanskrit = async () => {
    try {
      // Get the Sanskrit text, removing brackets if present
      let sanskritText = verse.sanskrit || ''
      // Remove bracket IDs for cleaner copy (e.g., "धृतराष्ट्र[1.1.1]" -> "धृतराष्ट्र")
      // Support both numeric [1] and dot notation [1.1.1]
      sanskritText = sanskritText.replace(/\[[\d.]+\]/g, '')
      await navigator.clipboard.writeText(sanskritText)
      setCopiedSanskrit(true)
      setTimeout(() => setCopiedSanskrit(false), 2000)
    } catch (error) {
      console.error('Failed to copy Sanskrit text:', error)
    }
  }

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

  // If verse not found, return null early (after all hooks)
  if (!verse) {
    return (
      <div className="verse-page">
        <div className="verse-background"></div>
      <div 
        ref={verseContainerRef}
        className="verse-container"
        style={{
          transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none',
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>
          Verse not found
        </div>
      </div>
      </div>
    )
  }

  // Get all chapters and verses for navigation menu
  const allChapters = getAllChapterNumbers()
  const chaptersData = allChapters.map(chNum => {
    const chapter = getChapter(chNum)
    const verses = getVerseNumbers(chNum)
    return {
      number: chNum,
      name: chapter?.chapterName || `Chapter ${chNum}`,
      verses: verses
    }
  })

  // Handle navigation to a specific chapter/verse
  const handleNavigateToVerse = (chNum, verseNum) => {
    // Only allow navigation to chapter 1
    if (chNum !== 1) {
      // Redirect to chapter 1 if trying to access other chapters
      const verseNumbers = getVerseNumbers(1)
      if (verseNumbers.length > 0) {
        router.push(`/verse/1/${verseNumbers[0]}`)
      }
      setShowNavMenu(false)
      return
    }
    router.push(`/verse/${chNum}/${verseNum}`)
    setShowNavMenu(false)
  }

  return (
    <div 
      className="verse-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="verse-background"></div>
      
      {/* Mobile Swipe Tutorial - App-like Banner */}
      {showSwipeTutorial && (
        <div className="swipe-tutorial">
          <div className="swipe-tutorial-banner">
            <div className="swipe-tutorial-content">
              <div className="swipe-tutorial-arrow-container">
                <svg className="swipe-arrow-left" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </div>
              <div className="swipe-tutorial-center">
                <div className="swipe-tutorial-hand-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/>
                    <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
                <span className="swipe-tutorial-text">Swipe to navigate</span>
              </div>
              <div className="swipe-tutorial-arrow-container">
                <svg className="swipe-arrow-right" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Menu Overlay */}
      {showNavMenu && (
        <>
          <div className="nav-menu-overlay" onClick={() => setShowNavMenu(false)}></div>
          <div className="nav-menu-panel">
            <div className="nav-menu-header">
              <h3>Navigate to Verse</h3>
              <button 
                className="nav-menu-close"
                onClick={() => setShowNavMenu(false)}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="nav-menu-content">
              {chaptersData.map(chapter => (
                <div key={chapter.number} className="nav-menu-chapter">
                  <div className="nav-menu-chapter-header">
                    <span className="nav-menu-chapter-number">Chapter {chapter.number}</span>
                    <span className="nav-menu-chapter-name">{chapter.name}</span>
                  </div>
                  <div className="nav-menu-verses">
                    {chapter.verses.map(verseNum => {
                      const isActive = validChapterNum === chapter.number && verseNum === verseParam
                      const verseKey = `${chapter.number}.${verseNum}`
                      const isVerseBookmarked = bookmarks.includes(verseKey)
                      return (
                        <button
                          key={verseNum}
                          className={`nav-menu-verse ${isActive ? 'active' : ''} ${isVerseBookmarked ? 'bookmarked' : ''}`}
                          onClick={() => handleNavigateToVerse(chapter.number, verseNum)}
                        >
                          {verseNum}
                          {isVerseBookmarked && (
                            <svg 
                              className="bookmark-icon"
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="currentColor" 
                              stroke="currentColor" 
                              strokeWidth="2"
                            >
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      <div className="verse-carousel-wrapper">
        <div 
          ref={verseContainerRef}
          className={`verse-container ${isTransitioning ? `swipe-${swipeDirection}` : ''} ${isEntering ? `enter-${swipeDirection}` : ''}`}
          style={{
            transform: isTransitioning 
              ? swipeDirection === 'left' 
                ? `translateX(-100%)` 
                : swipeDirection === 'right'
                ? `translateX(100%)`
                : 'none'
              : isEntering
              ? swipeDirection === 'left'
                ? 'translateX(0%)' // Slide in from right (starts at 100%, animates to 0%)
                : swipeDirection === 'right'
                ? 'translateX(0%)' // Slide in from left (starts at -100%, animates to 0%)
                : 'none'
              : swipeOffset !== 0 
                ? `translateX(${swipeOffset}px)` 
                : 'none',
            transition: isSwiping ? 'none' : (isTransitioning || isEntering ? 'transform 0.3s ease-out' : 'transform 0.3s ease-out')
          }}
        >
        {/* Pretext/Context Section */}
        {verse.pretext && (
          <div className="pretext-wrapper" key={`pretext-${chapterVerseKey}-${animationKey}`}>
            <div className="pretext-section">
              <div className={`pretext-text ${translation === 'hindi' ? 'hindi-text' : ''}`}>
                {typeof verse.pretext === 'string' 
                  ? verse.pretext 
                  : (translation === 'english' ? verse.pretext.english : verse.pretext.hindi)
                }
              </div>
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
        )}
        
        {/* Sanskrit Words Section - Primary Focus */}
        <div className="sanskrit-section">
          <div className="sanskrit-words-container">
            {sanskritLines.map((line, lineIndex) => (
              <div key={lineIndex} className="sanskrit-line">
                {line.map((segment, wordIndex) => {
                  const delay = getWordDelay(lineIndex, wordIndex, line.length)
                  const wordKey = `${lineIndex}-${wordIndex}`
                  const isClicked = clickedWord === wordKey
                  const isHovered = hoveredWord === wordKey && !clickedWord
                  const wordText = segment.text || segment
                  const hasTranslation = segment.ids && segment.ids.length > 0
                  const tooltipData = isClicked ? wordData : (isHovered ? hoveredWordData : null)
                  
                  return (
                    <span
                      key={`${chapterVerseKey}-${lineIndex}-${wordIndex}`}
                      className={`sanskrit-word ${isLoaded ? 'animate-in' : ''} ${hasTranslation ? 'has-translation' : ''} ${animationsComplete ? 'animations-complete' : ''} ${isClicked ? 'tooltip-active' : ''} ${isHovered ? 'tooltip-hover' : ''}`}
                      data-word={wordText}
                      style={{
                        ['--animation-delay']: `${delay}s`
                      }}
                      onMouseEnter={(e) => hasTranslation && animationsComplete && handleWordHover(lineIndex, wordIndex, e)}
                      onMouseLeave={(e) => hasTranslation && animationsComplete && handleWordLeave(e)}
                      onClick={(e) => hasTranslation && animationsComplete && handleWordClick(lineIndex, wordIndex, e)}
                    >
                      {wordText}
                      {tooltipData && (
                        <span 
                          ref={isClicked ? sanskritTooltipRef : null}
                          className={`word-tooltip ${isClicked ? 'tooltip-static' : 'tooltip-hover'} ${translation === 'hindi' ? 'hindi-text' : ''} ${isClicked && tooltipData.some(w => {
                            const wordId = w.id || w.key
                            return chapterData?.explanations?.find(e => e.id === wordId)
                          }) ? 'has-explanation' : ''}`}
                          onMouseEnter={() => handleTooltipEnter(lineIndex, wordIndex)}
                          style={isClicked && sanskritTooltipPosition ? sanskritTooltipPosition : undefined}
                        >
                          <div className="tooltip-content-wrapper">
                            <div className="tooltip-words-row">
                              {tooltipData.map((word, idx) => {
                                const wordId = word.id || word.key
                                // First try to find explanation by ID
                                let explanation = chapterData?.explanations?.find(e => e.id === wordId)
                                // If not found, try to match by term name
                                if (!explanation) {
                                  const wordText = word[translation] || word.english || ''
                                  explanation = chapterData?.explanations?.find(e => 
                                    e.term === wordText || 
                                    wordText.includes(e.term) ||
                                    (word.english && (e.term === word.english || word.english.includes(e.term))) ||
                                    (word.hindi && (e.term === word.hindi || word.hindi.includes(e.term)))
                                  )
                                }
                                const showTransliteration = toggledMeanings[wordId]
                                const hasExplanation = !!explanation
                                
                                return (
                                  <span key={wordId || idx}>
                                    <span 
                                      className={`tooltip-word ${hasExplanation ? 'has-explanation' : ''} ${isClicked ? 'clickable' : ''}`}
                                      onClick={isClicked ? (e) => {
                                        e.stopPropagation()
                                        handleMeaningClick(wordId, e)
                                      } : undefined}
                                      style={isClicked ? { cursor: 'pointer' } : {}}
                                    >
                                      {showTransliteration && word.transliteration 
                                        ? word.transliteration 
                                        : (word[translation] || word.english || '')
                                      }
                                    </span>
                                    {idx < tooltipData.length - 1 && <span className="tooltip-separator"> • </span>}
                                  </span>
                                )
                              })}
                            </div>
                            {isClicked && tooltipData.some(w => {
                              const wordId = w.id || w.key
                              return chapterData?.explanations?.find(e => e.id === wordId)
                            }) && (
                              <div className="tooltip-explanations-row">
                                {tooltipData.map((word, idx) => {
                                  const wordId = word.id || word.key
                                  // First try to find explanation by ID
                                  let explanation = chapterData?.explanations?.find(e => e.id === wordId)
                                  // If not found, try to match by term name
                                  if (!explanation) {
                                    const wordText = word[translation] || word.english || ''
                                    explanation = chapterData?.explanations?.find(e => 
                                      e.term === wordText || 
                                      wordText.includes(e.term) ||
                                      (word.english && (e.term === word.english || word.english.includes(e.term))) ||
                                      (word.hindi && (e.term === word.hindi || word.hindi.includes(e.term)))
                                    )
                                  }
                                  if (!explanation) return null
                                  
                                  return (
                                    <span key={wordId || idx} className="tooltip-explanation-item">
                                      <span className="tooltip-explanation-term">{(translation === 'hindi' && explanation.termHindi) ? explanation.termHindi : explanation.term}:</span> {translation === 'hindi' && explanation.descHindi ? explanation.descHindi : explanation.desc}
                                      {idx < tooltipData.length - 1 && tooltipData.slice(idx + 1).some(w => {
                                        const nextWordId = w.id || w.key
                                        return chapterData?.explanations?.find(e => e.id === nextWordId)
                                      }) && <span className="tooltip-explanation-separator"> • </span>}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
          
          {/* Verse Number and Navigation Controls */}
          <div className="verse-number-container">
            {/* Bookmark button - on the left */}
            <button 
              className="verse-bookmark-button"
              onClick={toggleBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill={isBookmarked ? "currentColor" : "none"} 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            
            <button 
              className="verse-nav-button verse-nav-prev"
              onClick={handlePrevVerse}
              aria-label="Previous verse"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            <button 
              className="verse-number-clickable"
              onClick={() => setShowNavMenu(true)}
              aria-label="Select verse"
            >
              {chapterVerseKey}
            </button>
            
            <button 
              className="verse-nav-button verse-nav-next"
              onClick={handleNextVerse}
              aria-label="Next verse"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
            
            {/* Copy button for Sanskrit text - next to the right arrow */}
            <button 
              className="verse-copy-button"
              onClick={handleCopySanskrit}
              aria-label={copiedSanskrit ? "Copied!" : "Copy Sanskrit text"}
            >
              {copiedSanskrit ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Translation Section - In Card */}
        <div className="translation-wrapper" key={`translation-${chapterVerseKey}-${animationKey}`}>
          <div className="translation-label">Translation</div>
          <div className="translation-card">
            <div className="translation-header">
              <div className={`translation-text ${translation === 'hindi' ? 'hindi-text' : ''}`}>
                {(() => {
                  const text = translation === 'english' ? verse.english.text : verse.hindi.text
                  const parsed = parseTranslationText(text)
                  
                  return parsed.map((part, idx) => {
                    if (part.type === 'text') {
                      return <span key={idx}>{part.content}</span>
                    } else {
                      const isClicked = clickedTranslationWord === part.refId
                      return (
                        <span key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                          <span
                            className={`translation-word-reference ${isClicked ? 'active' : ''}`}
                            onClick={(e) => handleTranslationWordClick(part.refId, part.wordData, part.explanation, e)}
                          >
                            {part.wordText}
                          </span>
                          {isClicked && translationWordData && (
                            <div 
                              ref={translationTooltipRef}
                              className="translation-word-tooltip"
                              style={{
                                position: 'absolute',
                                ...(translationTooltipPosition || {
                                  bottom: '100%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  marginBottom: '8px'
                                }),
                                maxWidth: 'min(400px, calc(100vw - 2rem))'
                              }}
                            >
                              {translationWordData.wordData && (
                                <div className="tooltip-word-data">
                                  <div className="tooltip-word-sanskrit">{translationWordData.wordData.sanskrit}</div>
                                  {translationWordData.wordData.transliteration && (
                                    <div className="tooltip-word-transliteration">({translationWordData.wordData.transliteration})</div>
                                  )}
                                  <div className="tooltip-word-translation">
                                    {translationWordData.wordData[translation] || translationWordData.wordData.english}
                                  </div>
                                </div>
                              )}
                              {translationWordData.explanation && (
                                <div className="tooltip-word-explanation">
                                  <strong>{(translation === 'hindi' && translationWordData.explanation.termHindi) ? translationWordData.explanation.termHindi : translationWordData.explanation.term}:</strong> {translation === 'hindi' && translationWordData.explanation.descHindi ? translationWordData.explanation.descHindi : translationWordData.explanation.desc}
                                </div>
                              )}
                            </div>
                          )}
                        </span>
                      )
                    }
                  })
                })()}
              </div>
              <button 
                className="copy-button"
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy translation'}
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
    </div>
  )
}

export default VersePage
