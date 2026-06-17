

import { SubscriptionPlan, UserSubscription, BillingCycle } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const subscriptionService = {
    async getPlans(): Promise<SubscriptionPlan[]> {
        // Detect region for specialized pricing
        const isSouthAsia = await this.detectRegion('SouthAsia');
        
        return [
            { id: 'plan_basic', name: 'Neural Basic', tier: 'basic', price: isSouthAsia ? 399 : 4.99, currency: isSouthAsia ? 'PKR' : 'USD', features: ['Zero Ads', 'Premium Badge', 'Audio Mode'] },
            { id: 'plan_plus', name: 'Neural Plus', tier: 'plus', price: isSouthAsia ? 799 : 9.99, currency: isSouthAsia ? 'PKR' : 'USD', features: ['8K Streaming', 'Smart Downloads', 'Exclusive Feed'], is_popular: true },
            { id: 'plan_pro', name: 'Creator Pro', tier: 'pro', price: isSouthAsia ? 1499 : 19.99, currency: isSouthAsia ? 'PKR' : 'USD', features: ['Revenue Boost', 'AI Editing Tools', 'VIP Support'] }
        ];
    },

    async detectRegion(target: string): Promise<boolean> {
        return true; // Simplified for demo
    },

    /**
     * Retrieves the current user's subscription status from local storage.
     */
    getSubscriptionStatus(): UserSubscription | null {
        try {
            const data = localStorage.getItem('azkaartube_subscription_data');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Update getAISuggestion signature to accept userId.
     */
    async getAISuggestion(userId: string, usage: any) {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `The user ${userId} has watched 40 hours of tech videos and 10 hours of music. Suggest a premium plan based on usage ${JSON.stringify(usage)}. Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { planId: { type: Type.STRING }, reason: { type: Type.STRING } }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    },

    /**
     * Implement missing subscribe method to update user subscription status.
     */
    async subscribe(userId: string, planId: string, billingCycle: BillingCycle, paymentChannel: string) {
        // Logic to simulate subscription activation
        const newSub: UserSubscription = {
            id: `sub_${Math.random().toString(36).substring(7)}`,
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem('azkaartube_subscription_data', JSON.stringify(newSub));
        return newSub;
    }
};
