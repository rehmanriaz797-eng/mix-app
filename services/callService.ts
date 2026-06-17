import { supabase } from './supabase';
import { Call } from '../types';

export const callService = {
    // Initiate a call
    startCall: async (callerId: string, receiverId: string, type: 'voice' | 'video'): Promise<string> => {
        const sessionId = Math.random().toString(36).substring(7);
        
        const { error } = await supabase.from('calls').insert({
            session_id: sessionId,
            caller_id: callerId,
            receiver_id: receiverId,
            type: type,
            status: 'ringing'
        });

        if (error) throw error;
        return sessionId;
    },

    // Listen for incoming calls
    subscribeToIncomingCalls: (userId: string, onCall: (call: Call) => void) => {
        return supabase
            .channel(`incoming-calls:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'calls',
                filter: `receiver_id=eq.${userId}`
            }, (payload) => {
                if (payload.new.status === 'ringing') {
                    onCall(payload.new as Call);
                }
            })
            .subscribe();
    },

    // Listen for outgoing calls (so caller UI can trigger)
    subscribeToOutgoingCalls: (userId: string, onCall: (call: Call) => void) => {
        return supabase
            .channel(`outgoing-calls:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'calls',
                filter: `caller_id=eq.${userId}`
            }, (payload) => {
                if (payload.new.status === 'ringing') {
                    onCall(payload.new as Call);
                }
            })
            .subscribe();
    },

    // Answer a call
    answerCall: async (callId: string) => {
        await supabase.from('calls').update({ status: 'ongoing' }).eq('id', callId);
    },

    // Reject/End a call
    endCall: async (callId: string) => {
        await supabase.from('calls').update({ status: 'ended', ended_at: new Date() }).eq('id', callId);
    },

    // WebRTC Signaling Channel (Offer/Answer/ICE)
    getSignalChannel: (sessionId: string) => {
        return supabase.channel(`signaling:${sessionId}`);
    }
};