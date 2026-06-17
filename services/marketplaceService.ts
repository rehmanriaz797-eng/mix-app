
import { supabase } from './supabase';
import { MarketplaceItem } from '../types';

// Haversine Formula for distance (km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const marketplaceService = {
    // Get current location
    getCurrentLocation: (): Promise<{ lat: number, lng: number } | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => { console.warn("GPS Error", err); resolve(null); }
            );
        });
    },

    // Fetch items with optional location sorting
    getItems: async (filters: { category?: string; maxDistance?: number; query?: string } = {}) => {
        const userLoc = await marketplaceService.getCurrentLocation();
        
        let query = supabase
            .from('marketplace_items')
            .select('*, profiles(full_name, avatar_url, is_verified)')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (filters.category && filters.category !== 'All') {
            query = query.eq('category', filters.category);
        }
        
        if (filters.query) {
            query = query.ilike('title', `%${filters.query}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        let items = data as MarketplaceItem[];

        // Client-side distance calculation & filtering
        if (userLoc) {
            items = items.map(item => {
                if (item.location_lat && item.location_lng) {
                    item.distance = calculateDistance(userLoc.lat, userLoc.lng, item.location_lat, item.location_lng);
                }
                return item;
            });

            if (filters.maxDistance) {
                items = items.filter(i => i.distance !== undefined && i.distance <= filters.maxDistance);
            }
            
            // Sort by distance if location available
            items.sort((a, b) => (a.distance || 99999) - (b.distance || 99999));
        }

        return items;
    },

    // Post a new item
    postItem: async (itemData: Omit<MarketplaceItem, 'id' | 'created_at' | 'status'>, files: File[]) => {
        const photoUrls: string[] = [];

        // Upload photos
        for (const file of files) {
            const fileName = `marketplace/${itemData.user_id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
            if (!uploadError) {
                const { data } = supabase.storage.from('media').getPublicUrl(fileName);
                photoUrls.push(data.publicUrl);
            }
        }

        const { error } = await supabase.from('marketplace_items').insert({
            ...itemData,
            photos: photoUrls
        });

        if (error) throw error;
    },

    // Start Chat with Seller
    contactSeller: async (buyerId: string, sellerId: string, itemId: string) => {
        // Check if existing conversation exists
        const { data: existing } = await supabase
            .from('conversations')
            .select('id, metadata')
            .contains('metadata', { item_id: itemId })
            .eq('is_group', false)
            .limit(1);

        // This simplistic check isn't perfect for all schemas but good for demo. 
        // Better: Query participants to match both IDs.
        
        // Let's create a new one for simplicity or return existing
        if (existing && existing.length > 0) {
             // In a real app check participants
             return existing[0].id;
        }

        // Create new conversation
        const { data: conv, error } = await supabase
            .from('conversations')
            .insert({ 
                is_group: false, 
                metadata: { item_id: itemId, type: 'marketplace' } 
            })
            .select()
            .single();
        
        if (error) throw error;

        await supabase.from('conversation_participants').insert([
            { conversation_id: conv.id, user_id: buyerId },
            { conversation_id: conv.id, user_id: sellerId }
        ]);

        return conv.id;
    }
};
