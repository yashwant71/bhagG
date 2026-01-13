// Common utility functions for all chapters

// Import all chapters
import { chapter1 } from './chapter1'
import { chapter2 } from './chapter2'
import { chapter3 } from './chapter3'
import { chapter4 } from './chapter4'

// Chapter registry - automatically includes all chapters
const chapters = {
  1: chapter1,
  2: chapter2,
  3: chapter3,
  4: chapter4
}

// Helper function to get a chapter by number
export const getChapter = (chapterNumber) => {
  return chapters[chapterNumber] || null
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
  const verseNumbers = getVerseNumbers(chapterNumber)
  if (verseNumbers.length === 0) return null
  
  const currentNum = currentVerseNumber.includes('.') ? currentVerseNumber.split('.')[1] : currentVerseNumber
  const currentIndex = verseNumbers.indexOf(currentNum)
  
  if (currentIndex === -1) return `${chapterNumber}.${verseNumbers[0]}`
  
  // If not the last verse in current chapter, go to next verse
  if (currentIndex < verseNumbers.length - 1) {
    return `${chapterNumber}.${verseNumbers[currentIndex + 1]}`
  }
  
  // If last verse, go to first verse of next chapter
  const allChapters = getAllChapterNumbers()
  const currentChapterIndex = allChapters.indexOf(chapterNumber)
  
  if (currentChapterIndex === -1) {
    // Current chapter not found, return first verse of current chapter
    return `${chapterNumber}.${verseNumbers[0]}`
  }
  
  // If not the last chapter, go to first verse of next chapter
  if (currentChapterIndex < allChapters.length - 1) {
    const nextChapter = allChapters[currentChapterIndex + 1]
    const nextChapterVerses = getVerseNumbers(nextChapter)
    if (nextChapterVerses.length > 0) {
      return `${nextChapter}.${nextChapterVerses[0]}`
    }
  }
  
  // If last chapter, loop to first verse of first chapter
  const firstChapter = allChapters[0]
  const firstChapterVerses = getVerseNumbers(firstChapter)
  if (firstChapterVerses.length > 0) {
    return `${firstChapter}.${firstChapterVerses[0]}`
  }
  
  // Fallback: loop to first verse of current chapter
  return `${chapterNumber}.${verseNumbers[0]}`
}

// Helper function to get previous verse number (with cross-chapter navigation)
export const getPrevVerseNumber = (chapterNumber, currentVerseNumber) => {
  const verseNumbers = getVerseNumbers(chapterNumber)
  if (verseNumbers.length === 0) return null
  
  const currentNum = currentVerseNumber.includes('.') ? currentVerseNumber.split('.')[1] : currentVerseNumber
  const currentIndex = verseNumbers.indexOf(currentNum)
  
  if (currentIndex === -1) return `${chapterNumber}.${verseNumbers[0]}`
  
  // If not the first verse in current chapter, go to previous verse
  if (currentIndex > 0) {
    return `${chapterNumber}.${verseNumbers[currentIndex - 1]}`
  }
  
  // If first verse, go to last verse of previous chapter
  const allChapters = getAllChapterNumbers()
  const currentChapterIndex = allChapters.indexOf(chapterNumber)
  
  if (currentChapterIndex === -1) {
    // Current chapter not found, return first verse of current chapter
    return `${chapterNumber}.${verseNumbers[0]}`
  }
  
  // If not the first chapter, go to last verse of previous chapter
  if (currentChapterIndex > 0) {
    const prevChapter = allChapters[currentChapterIndex - 1]
    const prevChapterVerses = getVerseNumbers(prevChapter)
    if (prevChapterVerses.length > 0) {
      const lastVerseIndex = prevChapterVerses.length - 1
      return `${prevChapter}.${prevChapterVerses[lastVerseIndex]}`
    }
  }
  
  // If first chapter, loop to last verse of last chapter
  const lastChapter = allChapters[allChapters.length - 1]
  const lastChapterVerses = getVerseNumbers(lastChapter)
  if (lastChapterVerses.length > 0) {
    const lastVerseIndex = lastChapterVerses.length - 1
    return `${lastChapter}.${lastChapterVerses[lastVerseIndex]}`
  }
  
  // Fallback: loop to last verse of current chapter
  const lastVerseIndex = verseNumbers.length - 1
  return `${chapterNumber}.${verseNumbers[lastVerseIndex]}`
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
