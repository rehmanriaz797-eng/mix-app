
// This service simulates Signal-style End-to-End Encryption using Web Crypto API.
// In a real app, you would use a library like libsignal-protocol-javascript for Double Ratchet.
// Here we implement AES-GCM for symmetric message encryption.

const ALGORITHM = { name: "AES-GCM", length: 256 };

export const encryptionService = {
    // Generate a local session key (Simulation of a shared secret)
    // In production, this would be derived from ECDH (Diffie-Hellman) exchange
    generateKey: async (): Promise<CryptoKey> => {
        return window.crypto.subtle.generateKey(
            ALGORITHM,
            true,
            ["encrypt", "decrypt"]
        );
    },

    // Export key to string for storage (Simulation)
    exportKey: async (key: CryptoKey): Promise<string> => {
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        return JSON.stringify(exported);
    },

    // Import key from string
    importKey: async (keyStr: string): Promise<CryptoKey> => {
        const jwk = JSON.parse(keyStr);
        return window.crypto.subtle.importKey(
            "jwk",
            jwk,
            ALGORITHM,
            true,
            ["encrypt", "decrypt"]
        );
    },

    // Encrypt Message
    encryptMessage: async (text: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );

        // Convert buffer to base64
        const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
        const ivStr = btoa(String.fromCharCode(...iv));

        return { ciphertext, iv: ivStr };
    },

    // Decrypt Message
    decryptMessage: async (ciphertext: string, ivStr: string, key: CryptoKey): Promise<string> => {
        try {
            const iv = Uint8Array.from(atob(ivStr), c => c.charCodeAt(0));
            const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                data
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        } catch (e) {
            console.error("Decryption failed", e);
            return "⚠️ Decryption Failed";
        }
    },

    // Store key in localStorage for the session (Simulating Device Storage)
    storeSessionKey: (chatId: string, keyStr: string) => {
        localStorage.setItem(`e2ee_key_${chatId}`, keyStr);
    },

    getSessionKey: (chatId: string): string | null => {
        return localStorage.getItem(`e2ee_key_${chatId}`);
    }
};
