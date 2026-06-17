
import { supabase } from './supabase';
import { Message } from '../types';
import { encryptionService } from './encryptionService';

// Fallback key for demo purposes if handshake hasn't happened
let cachedKey: CryptoKey | null = null;

const getOrGenerateKey = async (chatId: string) => {
    // 1. Try to get session key
    const stored = encryptionService.getSessionKey(chatId);
    if (stored) {
        return encryptionService.importKey(stored);
    }
    
    // 2. If not, generate and store (Simplification for the demo)
    const newKey = await encryptionService.generateKey();
    const exported = await encryptionService.exportKey(newKey);
    encryptionService.storeSessionKey(chatId, exported);
    return newKey;
};

export const messagingService = {
    async sendMessage(
        conversationId: string, 
        senderId: string, 
        content: string, 
        type: Message['message_type'] = 'text',
        file?: File | Blob
    ) {
        let mediaUrl = null;
        let finalContent = content;
        let isEncrypted = false;

        // 1. Handle Media Upload
        if (file) {
            const ext = type === 'voice_note' ? 'webm' : (file as File).name?.split('.').pop() || 'dat';
            const path = `chats/${conversationId}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('media').getPublicUrl(path);
            mediaUrl = data.publicUrl;
        }

        // 2. Handle Encryption (Text only for now, media URL is protected by RLS ideally)
        if (type === 'text' && content) {
            try {
                const key = await getOrGenerateKey(conversationId);
                const { ciphertext, iv } = await encryptionService.encryptMessage(content, key);
                // Store as JSON string: { "c": "...", "iv": "..." }
                finalContent = JSON.stringify({ c: ciphertext, iv });
                isEncrypted = true;
            } catch (e) {
                console.error("Encryption failed, sending plain", e);
            }
        }

        // 3. Insert into DB
        const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: finalContent || (type === 'voice_note' ? 'Voice Message' : 'Media'),
            message_type: type,
            media_url: mediaUrl,
            status: 'sent', // Initial status
            is_encrypted: isEncrypted
        });

        if (error) throw error;
    },

    async decryptMessageContent(conversationId: string, encryptedContent: string): Promise<string> {
        try {
            const key = await getOrGenerateKey(conversationId);
            const parsed = JSON.parse(encryptedContent);
            if (parsed.c && parsed.iv) {
                return await encryptionService.decryptMessage(parsed.c, parsed.iv, key);
            }
            return encryptedContent;
        } catch (e) {
            return "⚠️ Message corrupted";
        }
    },

    async markAsRead(messageIds: string[]) {
        if (messageIds.length === 0) return;
        await supabase.from('messages')
            .update({ status: 'read' })
            .in('id', messageIds);
    },

    async createGroup(name: string, participantIds: string[], avatarFile?: File) {
        let avatarUrl = null;
        if (avatarFile) {
            const path = `avatars/${Date.now()}_${avatarFile.name}`;
            await supabase.storage.from('media').upload(path, avatarFile);
            const { data } = supabase.storage.from('media').getPublicUrl(path);
            avatarUrl = data.publicUrl;
        }

        // 1. Create Conversation
        const { data: conv, error } = await supabase.from('conversations')
            .insert({ name, is_group: true, group_avatar: avatarUrl })
            .select()
            .single();
        
        if (error) throw error;

        // 2. Add Participants
        const participants = participantIds.map(uid => ({
            conversation_id: conv.id,
            user_id: uid,
            role: 'member'
        }));
        
        await supabase.from('conversation_participants').insert(participants);
        return conv;
    }
};
