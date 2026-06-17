
import { GoogleGenAI, Type } from "@google/genai";
import { Video } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const adEngine = {
    async analyzeVideoForAds(video: Video) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Analyze this video for ad targeting:
                Title: ${video.title}
                Description: ${video.description}
                Tags: ${video.tags?.join(', ')}
                
                Identify:
                1. Contextual category (Tech, Beauty, Finance, etc.)
                2. Optimal mid-roll break points (in seconds)
                3. Brand safety rating (G, PG, R)
                4. Targeted CPM estimation (based on niche depth)
                
                Return JSON.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            midRolls: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            brandSafety: { type: Type.STRING },
                            estimatedCpm: { type: Type.NUMBER }
                        }
                    }
                }
            });
            
            return JSON.parse(response.text || '{}');
        } catch (e) {
            return { category: 'General', midRolls: [], brandSafety: 'G', estimatedCpm: 2.50 };
        }
    },

    getPersonalizedAd(userHistory: string[], contextCategory: string) {
        // Simulation: Choose an ad from a mock pool
        const adPool = [
            { id: 'ad-1', brand: 'NeuralLink', category: 'Tech', creative: 'https://cdn.example.com/ads/tech1.mp4' },
            { id: 'ad-2', brand: 'AzkaarPay', category: 'Finance', creative: 'https://cdn.example.com/ads/fin1.mp4' },
            { id: 'ad-3', brand: 'CyberGlow', category: 'Beauty', creative: 'https://cdn.example.com/ads/beauty1.mp4' }
        ];

        return adPool.find(a => a.category === contextCategory) || adPool[0];
    }
};
