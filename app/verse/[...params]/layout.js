import { getVerse, getChapter } from '../../../src/data/utils'

export async function generateMetadata({ params }) {
  try {
    const chapter = params?.params?.[0]
    const verse = params?.params?.[1]
    
    if (!chapter || !verse) {
      return {
        title: 'Bhagavad Gita - Verse',
        description: 'Read the Bhagavad Gita verse',
      }
    }

    const chapterNum = parseInt(chapter)
    // Only process chapter 1 to avoid issues
    if (isNaN(chapterNum) || chapterNum !== 1) {
      return {
        title: `Bhagavad Gita Chapter ${chapter} Verse ${verse}`,
        description: 'Read the Bhagavad Gita verse with Sanskrit text and translations',
      }
    }

    const verseNum = verse
    const verseData = getVerse(chapterNum, verseNum)
    const chapterData = getChapter(chapterNum)

    if (!verseData) {
      return {
        title: `Bhagavad Gita Chapter ${chapterNum} Verse ${verseNum}`,
        description: 'Read the Bhagavad Gita verse with Sanskrit text and translations',
      }
    }

    // Get verse text preview (first 150 characters of English translation)
    const verseText = verseData.english?.text || verseData.english?.meaning || ''
    const preview = verseText.length > 150 ? verseText.substring(0, 150) + '...' : verseText

    return {
      title: `Bhagavad Gita Chapter ${chapterNum} Verse ${verseNum} - ${chapterData?.chapterName || 'Divine Wisdom'}`,
      description: `${preview} Read the complete verse with Sanskrit text, transliteration, and Hindi translation.`,
      keywords: `Bhagavad Gita Chapter ${chapterNum} Verse ${verseNum}, Gita ${chapterNum}.${verseNum}, ${chapterData?.chapterName || ''}, Sanskrit, translation, Hindi, English`,
      openGraph: {
        title: `Bhagavad Gita Chapter ${chapterNum} Verse ${verseNum}`,
        description: preview,
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title: `Bhagavad Gita Chapter ${chapterNum} Verse ${verseNum}`,
        description: preview,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Bhagavad Gita - Verse',
      description: 'Read the Bhagavad Gita verse',
    }
  }
}

export default function VerseLayout({ children }) {
  return <>{children}</>
}
