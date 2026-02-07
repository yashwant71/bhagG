'use client'

import { useParams, useRouter } from 'next/navigation'
import VersePage from '../../../src/components/VersePage'
import ChapterView from '../../../src/components/ChapterView'

export default function VersePageRoute() {
  const params = useParams()
  const router = useRouter()
  
  const chapter = params?.params?.[0]
  const verse = params?.params?.[1]
  
  // If we have both chapter and verse, show the verse detail page
  if (chapter && verse) {
    return <VersePage />
  }
  
  // If we only have chapter, redirect to correctly named chapter view
  if (chapter && !verse) {
    router.replace(`/chapter/${chapter}`)
    return null
  }

  // Otherwise, default redirect
  router.replace('/chapter/1')
  return null
}
