'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import VersePage from '../../../src/components/VersePage'
import { getVerseNumbers, getAllChapterNumbers } from '../../../src/data/utils'

export default function VersePageRoute() {
  const params = useParams()
  const router = useRouter()
  
  const chapter = params?.params?.[0]
  const verse = params?.params?.[1]

  useEffect(() => {
    if (chapter && !verse) {
      // Case: /verse/1 (only chapter, no verse) - redirect to first verse of that chapter
      const chapterNum = parseInt(chapter)
      // Only allow chapter 1
      if (chapterNum !== 1) {
        const verseNumbers = getVerseNumbers(1)
        if (verseNumbers.length > 0) {
          router.replace(`/verse/1/${verseNumbers[0]}`)
        }
        return
      }
      const verseNumbers = getVerseNumbers(chapterNum)
      if (verseNumbers.length > 0) {
        router.replace(`/verse/${chapterNum}/${verseNumbers[0]}`)
      } else {
        // If chapter doesn't exist, redirect to chapter 1 first verse
        const verseNumbers = getVerseNumbers(1)
        if (verseNumbers.length > 0) {
          router.replace(`/verse/1/${verseNumbers[0]}`)
        }
      }
    } else if (!chapter && !verse) {
      // Case: /verse (no chapter, no verse) - redirect to chapter 1 first verse
      const verseNumbers = getVerseNumbers(1)
      if (verseNumbers.length > 0) {
        router.replace(`/verse/1/${verseNumbers[0]}`)
      }
    } else if (chapter && verse) {
      // If trying to access a chapter other than 1, redirect to chapter 1
      const chapterNum = parseInt(chapter)
      if (chapterNum !== 1) {
        const verseNumbers = getVerseNumbers(1)
        if (verseNumbers.length > 0) {
          router.replace(`/verse/1/${verseNumbers[0]}`)
        }
      }
    }
  }, [chapter, verse, router])

  // If we have both chapter and verse, render the page
  if (chapter && verse) {
    return <VersePage />
  }

  // Otherwise, show nothing while redirecting
  return null
}
