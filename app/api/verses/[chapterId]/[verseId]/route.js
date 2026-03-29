import { getVerse, getChapter, getNextVerseNumber, getPrevVerseNumber } from '../../../../../src/data/utils';

export async function GET(request, { params }) {
    const { chapterId, verseId } = await params;
    const chapterVerseKey = `${chapterId}.${verseId}`;

    const verse = getVerse(chapterId, verseId);
    if (!verse) {
        return Response.json({ error: 'Verse not found' }, { status: 404 });
    }

    const chapter = getChapter(chapterId);
    const nextVerse = getNextVerseNumber(chapterId, chapterVerseKey);
    const prevVerse = getPrevVerseNumber(chapterId, chapterVerseKey);

    return Response.json({
        chapterNumber: chapterId,
        verseNumber: verseId,
        ...verse,
        chapterExplanations: chapter.explanations,
        nextVerse,
        prevVerse
    });
}
