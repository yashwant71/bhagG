// Common utility functions for all chapters

// Import chapter 1 only
import { chapter1 } from './chapter1'

// Chapter registry - only chapter 1 available
const chapters = {
  1: chapter1
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
  
  // If last verse, loop to first verse of current chapter (only chapter 1 available)
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
  
  // If first verse, loop to last verse of current chapter (only chapter 1 available)
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
