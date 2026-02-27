import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        const { chapterId, verseId, audioUrl, fileName, wordTimestamps, language = 'sanskrit', password } = await request.json();

        // Check password against environment variable
        if (password !== process.env.ADMIN_PASSWORD) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const filePath = path.join(process.cwd(), 'src', 'data', `chapter${chapterId}.js`);

        try {
            await fs.access(filePath);
        } catch (error) {
            return Response.json({ error: `Chapter ${chapterId} file not found` }, { status: 404 });
        }

        let content = await fs.readFile(filePath, 'utf8');

        const verseKey = `"${verseId}": {`;
        const verseIndex = content.indexOf(verseKey);

        if (verseIndex === -1) {
            return Response.json({ error: `Verse ${verseId} not found in chapter ${chapterId}` }, { status: 404 });
        }

        // Find the matching closing brace for this verse
        let braceCount = 0;
        let verseEndIndex = -1;
        let started = false;

        for (let i = verseIndex + verseKey.length - 1; i < content.length; i++) {
            if (content[i] === '{') {
                braceCount++;
                started = true;
            } else if (content[i] === '}') {
                braceCount--;
                if (started && braceCount === 0) {
                    verseEndIndex = i;
                    break;
                }
            }
        }

        if (verseEndIndex === -1) {
            return Response.json({ error: 'Could not find closing brace for verse' }, { status: 500 });
        }

        let verseContent = content.slice(verseIndex, verseEndIndex + 1);

        // Remove old top-level audio/timestamps if they exist to keep data clean
        verseContent = verseContent.replace(/"audio":\s*".*?",?\n?\s*/g, '');
        verseContent = verseContent.replace(/"wordTimestamps":\s*\[.*?\],?\n?\s*/s, '');

        // Prepare new audioData structure
        const langData = { url: audioUrl, fileName, timestamps: wordTimestamps };

        // Find if audioData already exists
        const audioDataMatch = verseContent.match(/"audioData":\s*{(.*?)\n\s*},/s);

        if (audioDataMatch) {
            const existingEntries = audioDataMatch[1];
            const langKey = `"${language}":`;
            let updatedEntries = existingEntries;

            if (existingEntries.includes(langKey)) {
                // Update existing language
                const langRegex = new RegExp(`"${language}":\\s*{.*?}`, 's');
                updatedEntries = existingEntries.replace(langRegex, `"${language}": ${JSON.stringify(langData)}`);
            } else {
                // Add new language
                updatedEntries = existingEntries + `,\n        "${language}": ${JSON.stringify(langData)}`;
            }
            verseContent = verseContent.replace(existingEntries, updatedEntries);
        } else {
            // Create audioData
            const audioDataField = `"audioData": {\n        "${language}": ${JSON.stringify(langData)}\n      },`;
            verseContent = verseContent.replace(verseKey, `${verseKey}\n      ${audioDataField}`);
        }

        const finalContent = content.slice(0, verseIndex) + verseContent + content.slice(verseEndIndex + 1);
        await fs.writeFile(filePath, finalContent, 'utf8');

        return Response.json({ success: true, message: `Verse ${chapterId}.${verseId} ${language} audio updated successfully` });
    } catch (error) {
        console.error('Update verse error:', error);
        return Response.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
