import { LingoDotDevEngine } from "lingo.dev/sdk";

const getApiKey = () => {
    return process.env.LINGODOTDEV_API_KEY ||
        process.env.LINGO_DEV_API_KEY ||
        process.env.NEXT_PUBLIC_LINGO_DEV_API_KEY ||
        "";
};

const apiKey = getApiKey();

if (apiKey) {
    console.log("Lingo.dev API key found and initialized.");
} else {
    console.warn("Warning: Lingo.dev API key is not defined in environment variables.");
}

export const isLingoEnabled = !!apiKey;

export const lingoDotDev = new LingoDotDevEngine({
    apiKey: apiKey,
});
