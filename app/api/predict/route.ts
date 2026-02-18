import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
    const { word, year, context, apiKey } = await req.json();

    if (!word || !year) {
        return NextResponse.json({ error: 'Word and year are required' }, { status: 400 });
    }

    const apiKeyFromEnv = process.env.OPENAI_API_KEY;
    const effectiveApiKey = apiKey || apiKeyFromEnv;

    if (effectiveApiKey) {
        try {
            const openai = new OpenAI({ apiKey: effectiveApiKey });
            const completion = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a visionary linguistic futurist. Predict the evolution of a word based on current technological, social, and cultural trends.
                        
                        Task: Predict the form and usage of the word "${word}" in the year ${year}.
                        
                        Output JSON:
                        {
                            "year": number,
                            "word": string (evolved spelling),
                            "phonetic": string (IPA),
                            "context": string (e.g., "Space Colonization", "Neural Interfaces", "Hyper-Capitalism"),
                            "definition": string (detailed definition),
                            "example": string (usage in a sentence),
                            "post": string (a realistic social media post or message from that era using the word)
                        }

                        Rules:
                        1. **Creativity & Logic**: The evolution should follow linguistic principles (simplification, compounding, etc.) but be influenced by the specified context.
                        2. **Detailed World-Building**: The definition and example should hint at the state of the world in ${year}.
                        3. **No lazyness**: Do not just add "cyber-" or "-X". Think about how pronunciation and spelling drift over centuries.
                        `
                    },
                    { role: "user", content: `Predict the detailed evolution of "${word}" in the year ${year} assuming a context of ${context || 'radical technological integration'}.` }
                ],
                model: "gpt-4o",
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            if (content) {
                return NextResponse.json(JSON.parse(content));
            }
        } catch (error) {
            console.error("OpenAI API error:", error);
            // Fallback
        }
    }

    // Fallback/Mock Data
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Returning mock prediction data");

    return NextResponse.json({
        year: year,
        word: `${word}-X`,
        phonetic: `/ˈ${word} eks/`,
        context: context || "Technological Integration",
        definition: "A digitally enhanced version of the original concept.",
        example: `The ${word}-X is now standard in all sectors.`,
        post: `@future_user: Can't believe we used to use raw ${word}. #upgrade #2050`
    });
}
