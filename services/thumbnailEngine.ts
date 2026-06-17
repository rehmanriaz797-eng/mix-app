
import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailVariant } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const thumbnailEngine = {
    async generateVariants(videoId: string, baseImage: string): Promise<ThumbnailVariant[]> {
        try {
            // In production, baseImage would be a high-quality frame.
            // For demo, we generate variants with distinct "style" metadata
            const styles: ThumbnailVariant['style_preset'][] = ['VIRAL_GLOW', 'CONTRAST_POP', 'TEXT_HEAVY', 'MINIMAL'];
            
            return styles.map((style, idx) => ({
                id: `v-${idx}`,
                style_preset: style,
                preview_url: `https://picsum.photos/seed/${videoId}_${idx}/1280/720`
            }));
        } catch (e) {
            return [];
        }
    },

    async analyzeBestVariant(variants: ThumbnailVariant[]): Promise<string> {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Analyze these thumbnail style presets: ${variants.map(v => v.style_preset).join(', ')}. 
                Predict which one will yield the highest CTR (Click Through Rate) for a technology video. 
                Return ONLY the variant ID.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { winner_id: { type: Type.STRING } }
                    }
                }
            });
            const data = JSON.parse(response.text || '{}');
            return data.winner_id || variants[0].id;
        } catch (e) {
            return variants[0].id;
        }
    }
};
