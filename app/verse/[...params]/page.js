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
      // Case: /verse/3 (only chapter, no verse) - redirect to first verse of that chapter
      const chapterNum = parseInt(chapter)
      const verseNumbers = getVerseNumbers(chapterNum)
      if (verseNumbers.length > 0) {
        router.replace(`/verse/${chapterNum}/${verseNumbers[0]}`)
      } else {
        // If chapter doesn't exist, redirect to first chapter's first verse
        const allChapters = getAllChapterNumbers()
        if (allChapters.length > 0) {
          const firstChapter = allChapters[0]
          const firstVerseNumbers = getVerseNumbers(firstChapter)
          if (firstVerseNumbers.length > 0) {
            router.replace(`/verse/${firstChapter}/${firstVerseNumbers[0]}`)
          }
        }
      }
    } else if (!chapter && !verse) {
      // Case: /verse (no chapter, no verse) - redirect to first chapter's first verse
      const allChapters = getAllChapterNumbers()
      if (allChapters.length > 0) {
        const firstChapter = allChapters[0]
        const firstVerseNumbers = getVerseNumbers(firstChapter)
        if (firstVerseNumbers.length > 0) {
          router.replace(`/verse/${firstChapter}/${firstVerseNumbers[0]}`)
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
