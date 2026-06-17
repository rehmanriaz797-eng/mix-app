
import { GoogleGenAI, Type } from "@google/genai";
import { ShortComment, SortShort, SAMPLE_VIDEO_URLS, Video, AIChatMessage } from "../types";
import { INITIAL_SHORTS } from "./storageService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes comment for toxicity, sentiment and constructive score.
 */
export const analyzeCommentAI = async (text: string): Promise<{ sentiment: ShortComment['ai_sentiment']; score: number; isSafe: boolean }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this comment: "${text}". 
            Sentiment options: positive, neutral, negative, toxic, constructive.
            Rate constructive quality 0-100.
            Identify if safe.
            Return ONLY JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentiment: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        isSafe: { type: Type.BOOLEAN }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"sentiment": "neutral", "score": 50, "isSafe": true}');
    } catch (e) {
        return { sentiment: 'neutral', score: 50, isSafe: true };
    }
};

/**
 * Generates context-aware smart replies.
 */
export const generateSmartReplies = async (history: string[]): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Suggest 3 viral, short, trendy replies to this conversation: ${history.join(' | ')}.
            Examples: "W", "PURE ART", "NEXT GEN". 
            Return JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || '["COOL", "LOVE THIS", "FIRE"]');
    } catch (e) {
        return ["LOVE IT!", "FIRE 🔥", "MORE PLS"];
    }
};

export const fetchSortFeed = async (mode: string, excludeIds: string[]): Promise<SortShort[]> => {
    return INITIAL_SHORTS.filter(s => !excludeIds.includes(s.id));
};

export const generatePersonalizedFeed = async (interests: string[]): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `The user is interested in: ${interests.join(', ')}. Generate 5 catchy, futuristic video topic tags. Return JSON array.`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '["Neural Flow", "Cyber Aesthetics", "Quantum Coding"]');
    } catch (e) {
        return ["Future Tech", "AI Discovery", "Edge Computing"];
    }
};

export const analyzeVideoContext = async (frameBase64: string, video: Video): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { data: frameBase64, mimeType: 'image/jpeg' } },
                    { text: `Analyze this video frame from "${video.title}". What is happening? Be technical and futuristic.` }
                ]
            }
        });
        return response.text || "Visual node processed successfully.";
    } catch (e) {
        return "Visual synchronization failure.";
    }
};

export const fastAIChat = async (history: AIChatMessage[]): Promise<string> => {
    try {
        const chat = ai.chats.create({ model: 'gemini-3-flash-preview' });
        const lastMsg = history[history.length - 1].content;
        const response = await chat.sendMessage({ message: lastMsg });
        return response.text || "Neural response empty.";
    } catch (e) {
        return "I am currently re-calibrating. Please wait.";
    }
};

export const moderateContent = async (text: string): Promise<{ isSafe: boolean; reason?: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Is this content safe for a futuristic social platform: "${text}"? Return JSON {isSafe: boolean, reason: string}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSafe: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"isSafe": true}');
    } catch (e) {
        return { isSafe: true };
    }
};

export const analyzeImage = async (base64: string, prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType: 'image/jpeg' } },
                    { text: prompt || "Analyze this image." }
                ]
            }
        });
        return response.text || "Image analysis complete.";
    } catch (e) {
        return "Error analyzing visual data.";
    }
};
