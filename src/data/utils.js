// Common utility functions for all chapters

// Import chapters
import { chapter1 } from './chapter1'
import { chapter2 } from './chapter2'
import { explanations } from './explanation'

// Chapter registry
const chapters = {
  1: chapter1,
  2: chapter2
}

// Helper function to get a chapter by number
export const getChapter = (chapterNumber) => {
  const chapter = chapters[chapterNumber]
  if (!chapter) return null

  // Merge global explanations into chapter data
  return {
    ...chapter,
    explanations: explanations
  }
}

// Helper function to get a verse by chapter and verse number
export const getVerse = (chapterNumber, verseNumber) => {
  const chapter = getChapter(chapterNumber)
  if (!chapter || !chapter.verses) return null

  // Extract just the verse number (e.g., "2.47" -> "47")
  const verseNum = verseNumber.includes('.') ? verseNumber.split('.')[1] : verseNumber
  return chapter.verses[verseNum] || null
}

// Helper function to get all verse numbers for a chapter
export const getVerseNumbers = (chapterNumber) => {
  const chapter = getChapter(chapterNumber)
  if (!chapter || !chapter.verses) return []

  return Object.keys(chapter.verses).sort((a, b) => parseInt(a) - parseInt(b))
}

// Helper function to get next verse number (with cross-chapter navigation)
export const getNextVerseNumber = (chapterNumber, currentVerseNumber) => {
  const chapterNum = parseInt(chapterNumber)
  const verseNumbers = getVerseNumbers(chapterNum)
  if (verseNumbers.length === 0) return null

  const currentNum = currentVerseNumber.includes('.') ? currentVerseNumber.split('.')[1] : currentVerseNumber
  const currentIndex = verseNumbers.indexOf(currentNum)

  // If not the last verse in current chapter, go to next verse
  if (currentIndex !== -1 && currentIndex < verseNumbers.length - 1) {
    return `${chapterNum}.${verseNumbers[currentIndex + 1]}`
  }

  // If last verse, go to first verse of next chapter if available
  const allChapters = getAllChapterNumbers()
  const chapterIndex = allChapters.indexOf(chapterNum)

  if (chapterIndex !== -1 && chapterIndex < allChapters.length - 1) {
    const nextChapterNum = allChapters[chapterIndex + 1]
    const nextChapterVerses = getVerseNumbers(nextChapterNum)
    if (nextChapterVerses.length > 0) {
      return `${nextChapterNum}.${nextChapterVerses[0]}`
    }
  }

  // If it's the absolute last verse of the last chapter, loop back to start of chapter 1
  return `1.1`
}

// Helper function to get previous verse number (with cross-chapter navigation)
export const getPrevVerseNumber = (chapterNumber, currentVerseNumber) => {
  const chapterNum = parseInt(chapterNumber)
  const verseNumbers = getVerseNumbers(chapterNum)
  if (verseNumbers.length === 0) return null

  const currentNum = currentVerseNumber.includes('.') ? currentVerseNumber.split('.')[1] : currentVerseNumber
  const currentIndex = verseNumbers.indexOf(currentNum)

  // If not the first verse in current chapter, go to previous verse
  if (currentIndex > 0) {
    return `${chapterNum}.${verseNumbers[currentIndex - 1]}`
  }

  // If first verse, go to last verse of previous chapter if available
  const allChapters = getAllChapterNumbers()
  const chapterIndex = allChapters.indexOf(chapterNum)

  if (chapterIndex > 0) {
    const prevChapterNum = allChapters[chapterIndex - 1]
    const prevChapterVerses = getVerseNumbers(prevChapterNum)
    if (prevChapterVerses.length > 0) {
      return `${prevChapterNum}.${prevChapterVerses[prevChapterVerses.length - 1]}`
    }
  }

  // If it's the first verse of chapter 1, loop to last verse of the last chapter
  const lastChapterNum = allChapters[allChapters.length - 1]
  const lastChapterVerses = getVerseNumbers(lastChapterNum)
  return `${lastChapterNum}.${lastChapterVerses[lastChapterVerses.length - 1]}`
}

// Helper function to get word translation for a specific word position
export const getWordTranslation = (chapterNumber, verseNumber, lineIndex, wordIndex, language) => {
  const verse = getVerse(chapterNumber, verseNumber)
  if (!verse || !verse.wordTranslations) return null

  const wordKey = `${lineIndex}-${wordIndex}`
  const wordData = verse.wordTranslations[wordKey]
  if (!wordData) return null

  return wordData[language] || wordData.english || null
}

// Get all available chapter numbers (sorted)
export const getAllChapterNumbers = () => {
  return Object.keys(chapters)
    .map(num => parseInt(num))
    .sort((a, b) => a - b)
}
