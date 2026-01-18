'use client'

import { useParams } from 'next/navigation'
import VersePage from '../../../src/components/VersePage'
import ChapterView from '../../../src/components/ChapterView'

export default function VersePageRoute() {
  const params = useParams()
  
  const chapter = params?.params?.[0]
  const verse = params?.params?.[1]
  
  // If we have both chapter and verse, show the verse detail page
  if (chapter && verse) {
    return <VersePage />
  }
  
  // If we only have chapter, show the chapter view with all verses
  if (chapter && !verse) {
    return <ChapterView />
  }

  // Otherwise, redirect to chapter 1 view (handled by ChapterView component)
  return <ChapterView />
}
