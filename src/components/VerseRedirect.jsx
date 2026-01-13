import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVerseNumbers, getAllChapterNumbers } from '../data/utils'

// Component to handle redirects for edge cases
const VerseRedirect = () => {
  const { chapter, verse } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (chapter && !verse) {
      // Case: /verse/3 (only chapter, no verse) - redirect to first verse of that chapter
      const chapterNum = parseInt(chapter)
      const verseNumbers = getVerseNumbers(chapterNum)
      if (verseNumbers.length > 0) {
        navigate(`/verse/${chapterNum}/${verseNumbers[0]}`, { replace: true })
      } else {
        // If chapter doesn't exist, redirect to first chapter's first verse
        const allChapters = getAllChapterNumbers()
        if (allChapters.length > 0) {
          const firstChapter = allChapters[0]
          const firstVerseNumbers = getVerseNumbers(firstChapter)
          if (firstVerseNumbers.length > 0) {
            navigate(`/verse/${firstChapter}/${firstVerseNumbers[0]}`, { replace: true })
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
          navigate(`/verse/${firstChapter}/${firstVerseNumbers[0]}`, { replace: true })
        }
      }
    }
  }, [chapter, verse, navigate])

  // Return null or a loading indicator while redirecting
  return null
}

export default VerseRedirect
