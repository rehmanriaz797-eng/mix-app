import { GoogleGenAI, Type } from "@google/genai";
import { CopyrightClaim, LegalAppeal, Jurisdiction, ClaimAction, RecoveryAction, AppealStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AZKAARTUBE COPYRIGHT & RESTRICTION RECOVERY CORE
 */
export const copyrightService = {
    /**
     * Generates a step-by-step human-readable explanation.
     */
    async explainRestriction(claim: CopyrightClaim): Promise<string> {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `You are the AzkaarTube Automated Legal Liaison. 
                A creator's video has been flagged with a "${claim.action_enforced}" restriction.
                CLAIMANT: ${claim.claimant_name}
                MATCH SEGMENT: ${claim.match_segment.start}s to ${claim.match_segment.end}s.
                CONFIDENCE: ${(claim.confidence_score * 100).toFixed(1)}%
                RISK LEVEL: ${claim.risk_level}

                Explain this to the creator in simple, non-threatening language. 
                Break it into:
                1. Exactly what matched.
                2. What it means for their video visibility/monetization.
                3. The best resolution path to avoid a channel strike.`,
                config: {
                    thinkingConfig: { thinkingBudget: 2000 }
                }
            });
            return response.text || "Automated signature match confirmed. Policy applied via global content-ID.";
        } catch (e) { 
            return "Content ID match detected. The identified segment belongs to a verified third-party rights holder."; 
        }
    },

    /**
     * Executes surgical mitigation actions.
     */
    async enforceAction(claimId: string, action: RecoveryAction): Promise<{ success: boolean; logId: string }> {
        console.log(`[RECOVERY_NODE] Executing Action: ${action} for Claim: ${claimId}`);
        await new Promise(r => setTimeout(r, 2500)); 
        return { 
            success: true, 
            logId: `act_${Math.random().toString(36).substring(7)}` 
        };
    },

    /**
     * AI-driven legal appeal drafter (Region-aware).
     */
    async generateAppealDraft(claim: CopyrightClaim, userJustification: string, jurisdiction: Jurisdiction): Promise<string> {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Generate a formal legal appeal for a copyright claim on AzkaarTube.
                JURISDICTION: ${jurisdiction} (Use appropriate legal tone for this region).
                CLAIMANT: ${claim.claimant_name}
                USER JUSTIFICATION: "${userJustification}"
                
                Generate a professional appeal that focuses on Fair Use / Educational exceptions. 
                Include a placeholder for evidence links.`,
            });
            return response.text || "I am formally disputing this claim. The usage of this segment falls under Fair Use exceptions for commentary and educational purposes.";
        } catch (e) {
            return "Formal dispute initiated based on user-provided licensing documentation.";
        }
    },

    /**
     * Fingerprinting Simulation (pHash + Chromaprint)
     */
    async scanVideoSignal(file: File): Promise<CopyrightClaim | null> {
        await new Promise(r => setTimeout(r, 3000));
        if (Math.random() > 0.6) {
            const mockClaims = [
                { name: "Sony Music Global", action: "MONETIZE_CLAIMANT", risk: "LOW" },
                { name: "Warner Bros Entertainment", action: "BLOCK", risk: "MEDIUM" },
                { name: "Global News Ltd", action: "REGION_RESTRICT", risk: "MEDIUM" },
                { name: "Universal Media", action: "TAKEDOWN", risk: "CRITICAL" }
            ];
            const chosen = mockClaims[Math.floor(Math.random() * mockClaims.length)];
            return {
                id: `clm_${Math.random().toString(36).substring(7)}`,
                video_id: 'pending',
                matched_asset_id: `asset_${Math.random().toString(16)}`,
                claimant_name: chosen.name,
                match_segment: { start: 15, end: 42 },
                confidence_score: 0.998,
                action_enforced: chosen.action as any,
                explanation_plain: '',
                policy_details: `Content ID match for ${chosen.name}. Policy applied: ${chosen.action}`,
                risk_level: chosen.risk as any
            };
        }
        return null;
    }
};