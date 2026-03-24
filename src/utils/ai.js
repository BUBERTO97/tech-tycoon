// ── Single card (legacy, kept for reference) ──────────────────────────────
export const generateGeminiCard = async (stats, sprints, eraName, lang) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const prompt = [
        'You are an AI generating dynamic game events for a startup management card swipe game called "Tech Tycoon" (Tinder-style decisions).',
        `Context:\nEra: ${eraName} (Sprint ${sprints})`,
        `Current Company Stats (0-100): Security ${stats.security}, Morale ${stats.morale}, Tech ${stats.tech}, Budget ${stats.budget}.`,
        'Player loses if any stat hits 0 or 100.',
        `Target Language: ${lang}`,
        '',
        'Generate a JSON object representing a SINGLE event card.',
        'Return ONLY valid JSON (no markdown wrappers):',
        '{ "isEasterEgg": boolean, "loc": { "char": "...", "text": "...", "left": "...", "right": "...", "up": "..." },',
        '  "left": {...}, "right": {...}, "up": {...} }'
    ].join('\n');

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
            }),
        }
    );
    if (!response.ok) throw new Error('API failed');
    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
};

// ── Batch card generation ─────────────────────────────────────────────────
export const generateGeminiCards = async (stats, sprints, eraName, lang, count) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const prompt = [
        'You are an AI generating dynamic game events for a startup management card swipe game called "Tech Tycoon" (Tinder-style decisions).',
        `Context:\nEra: ${eraName} (Sprint ${sprints})`,
        `Current Company Stats (0-100): Security ${stats.security}, Morale ${stats.morale}, Tech ${stats.tech}, Budget ${stats.budget}.`,
        'Player loses if any stat hits 0 or 100.',
        `Target Language: ${lang}`,
        '',
        `Generate an ARRAY of ${count} DIFFERENT event card objects. Return ONLY a valid JSON array (no markdown):`,
        '[{ "isEasterEgg": bool, "loc": { "char":"...", "text":"...", "left":"...", "right":"...", "up":"..." },',
        '   "left":{...}, "right":{...}, "up":{...} }]',
        'Stat modifiers must be numbers between -30 and +30. Omit stats that do not change.',
    ].join('\n');

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
            }),
        }
    );
    if (!response.ok) throw new Error('API failed');
    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
};
