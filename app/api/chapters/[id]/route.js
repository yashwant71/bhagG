import { getChapter } from '../../../../src/data/utils';

export async function GET(request, { params }) {
    const chapterId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const chapter = getChapter(chapterId);
    if (!chapter) {
        return Response.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Convert verses object to an array and sort by verse number
    const versesArray = Object.entries(chapter.verses)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([number, data]) => ({ number, ...data }));

    const totalVerses = versesArray.length;
    const paginatedVerses = versesArray.slice(offset, offset + limit);

    return Response.json({
        chapterNumber: chapter.chapterNumber,
        chapterName: chapter.chapterName,
        chapterNameSanskrit: chapter.chapterNameSanskrit,
        totalVerses,
        verses: paginatedVerses,
        hasMore: offset + limit < totalVerses,
        explanations: chapter.explanations || []
    });
}
