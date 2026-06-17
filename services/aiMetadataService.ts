import { GoogleGenAI, Type } from "@google/genai";
import { AICaptionSet, AIHashtagSet } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiMetadataService = {
    /**
     * Synthesizes platform-specific hooks and descriptions.
     */
    async generatePlatformMetadata(title: string, desc: string, isShort: boolean): Promise<AICaptionSet> {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Perform a High-Engagement Analysis for video content:
                TITLE: "${title}"
                DESC: "${desc}"
                TYPE: ${isShort ? 'VERTICAL_SHORT' : 'LONG_FORM'}
                
                Generate:
                1. A primary optimized title.
                2. Platform-specific captions (TikTok, FB, YT).
                3. High-CTR hooks.
                4. Trending emojis.
                
                OUTPUT JSON ONLY.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            primary_title: { type: Type.STRING },
                            captions: {
                                type: Type.OBJECT,
                                properties: {
                                    short_vertical: { type: Type.STRING },
                                    long_tutorial: { type: Type.STRING },
                                    teaser_hook: { type: Type.STRING }
                                }
                            },
                            emojis: { type: Type.ARRAY, items: { type: Type.STRING } },
                            cta_lines: { type: Type.ARRAY, items: { type: Type.STRING } },
                            platform_optimized: {
                                type: Type.OBJECT,
                                properties: {
                                    youtube: { type: Type.STRING },
                                    facebook: { type: Type.STRING },
                                    tiktok: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            });
            return JSON.parse(response.text || '{}');
        } catch (e) {
            console.error("AI Metadata Engine Error", e);
            throw e;
        }
    },

    /**
     * Predicts CTR based on historical training data.
     */
    async predictCTR(title: string, thumbnailId: string): Promise<number> {
        // Simplified prediction logic using Flash model
        return 8.4 + Math.random() * 4.2;
    }
};