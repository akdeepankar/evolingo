'use server';

import { lingoDotDev, isLingoEnabled } from "@/lib/lingo";

/**
 * Translate simple text strings to a target language.
 */
export async function translateText(
    text: string,
    targetLocale: string,
    sourceLocale?: string
) {
    if (!text) return "";
    try {
        if (!isLingoEnabled) {
            return text;
        }

        const result = await lingoDotDev.localizeText(text, {
            sourceLocale: sourceLocale || null,
            targetLocale,
        });
        return result || text;
    } catch (error) {
        console.error("Action error in translateText:", error);
        return text;
    }
}

/**
 * Translate nested objects while preserving structure.
 */
export async function translateObject(
    content: Record<string, any>,
    targetLocale: string,
    sourceLocale: string = "en"
) {
    if (!content) return {};
    try {
        if (!isLingoEnabled) {
            return content;
        }

        const translated = await lingoDotDev.localizeObject(content, {
            sourceLocale,
            targetLocale,
        });

        // Ensure result is a plain serializable object
        return JSON.parse(JSON.stringify(translated));
    } catch (error) {
        console.error("Action error in translateObject:", error);
        return content;
    }
}

/**
 * Translate chat messages while preserving speaker names.
 */
export async function translateChat(
    conversation: { name: string; text: string }[],
    targetLocale: string,
    sourceLocale?: string
) {
    if (!Array.isArray(conversation) || conversation.length === 0) return [];

    try {
        if (!isLingoEnabled) {
            return conversation;
        }

        // Sanitize input
        const cleanConversation = conversation
            .filter(item => item && typeof item === 'object' && item.text)
            .map(item => ({
                name: String(item.name || 'Unknown'),
                text: String(item.text)
            }));

        if (cleanConversation.length === 0) return [];

        // Parallel translations
        const translated = await Promise.all(cleanConversation.map(async (msg) => {
            try {
                const translatedText = await translateText(msg.text, targetLocale, sourceLocale);
                return {
                    name: msg.name,
                    text: translatedText || msg.text
                };
            } catch (e) {
                return msg;
            }
        }));

        return JSON.parse(JSON.stringify(translated));
    } catch (error) {
        console.error("Action error in translateChat:", error);
        return conversation;
    }
}
