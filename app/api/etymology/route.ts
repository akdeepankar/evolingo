import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
    const { word, apiKey } = await req.json();

    if (!word) {
        console.error("Word is required");
        return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    if (apiKey) {
        try {
            const openai = new OpenAI({ apiKey: apiKey });
            const completion = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an expert historical linguist and etymologist. Tracing the history of words with high precision.
                        
                        Current Task: Trace the etymology of the given word.
                        
                        Output Format: JSON object with the following structure:
                        {
                            "root": { 
                                "word": string, 
                                "language": string, 
                                "meaning": string (detailed), 
                                "year": number (negative for BC), 
                                "location": { "lat": number, "lng": number, "country_code": string (ISO 2-letter code) },
                                "related_branches": [ { "word": string, "language": string, "meaning": string } ] (2-3 cognates/siblings from this root)
                            },
                            "path": [
                                { 
                                    "word": string, 
                                    "language": string, 
                                    "meaning": string (detailed), 
                                    "year": number, 
                                    "location": { "lat": number, "lng": number, "country_code": string (ISO 2-letter code) },
                                    "related_branches": [ { "word": string, "language": string, "meaning": string } ] (2-3 cognates/siblings that branched off at this stage)
                                }
                            ],
                            "current": { "word": string, "language": string, "meaning": string (detailed), "year": number, "location": { "lat": number, "lng": number, "country_code": string (ISO 2-letter code) } }
                        }

                        Rules:
                        1. **Detailed & Non-Repetitive**: Ensure each step in the 'path' represents a distinct evolutionary stage. Do NOT repeat the same word/language unless there was a significant shift in meaning or location.
                        2. **Historical Accuracy**: Use precise historical years and specific geographic coordinates (latitude/longitude) for the region where that form of the word was dominant. Include the modern ISO 2-character Country Code for that location.
                        3. **Rich Context**: The 'meaning' field should be descriptive, explaining distinct nuances of that era's usage.
                        4. **Granularity**: Provide at least 4-6 intermediate steps in the 'path' if the word's history allows.
                        5. **Timeline**: Ensure chronological order from root -> path -> current.
                        6. **Cultural Insight (IMPORTANT)**: For each step (root, path items, current), include a "cultural_insight" object.
                           - Find a famous local idiom, proverb, or poetic saying from that specific language/era involving the word.
                           - Structure: { "native_idiom": string (original script), "romanized": string (optional), "meaning": string (English), "origin_story": string (brief context) }.
                        7. **Branching Context**: For 'related_branches', strictly provide 2-3 significant words in *other* languages that share the same origin at that specific point in time (cognates). Do not list the word itself or its direct ancestor.
                        `
                    },
                    { role: "user", content: `Trace the detailed etymology of "${word}".` }
                ],
                model: "gpt-4o", // Upgrading to 4o for better detail if key supports it, otherwise fallback logic might be needed but usually keys work for both if paid.
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            if (content) {
                return NextResponse.json(JSON.parse(content));
            }
        } catch (error) {
            console.error("OpenAI API error:", error);
            // Fallback to mock if API fails
        }
    }

    // Fallback/Mock Data
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Returning mock etymology data");

    return NextResponse.json({
        root: { word: "dhghem", language: "Proto-Indo-European", meaning: "earth", year: -3000, location: { lat: 48.0, lng: 35.0 } }, // Pontic-Caspian steppe
        path: [
            { word: "humanus", language: "Latin", meaning: "human", year: 100, location: { lat: 41.9, lng: 12.5 } }, // Rome
            { word: "humain", language: "Old French", meaning: "human", year: 1200, location: { lat: 48.8, lng: 2.3 } } // Paris
        ],
        current: { word: word, language: "English", meaning: "A member of the species Homo sapiens", year: 2024, location: { lat: 51.5, lng: -0.1 } } // London
    });
}
