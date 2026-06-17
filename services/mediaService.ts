
import { supabase } from './supabase';
import { MediaAsset, AssetStatus } from '../types';

const BUCKETS = {
    VIDEO: 'video-bucket',
    SHORTS: 'shorts-bucket',
    THUMB: 'thumbnail-bucket',
    TEMP: 'temp-processing-bucket'
};

export const mediaService = {
    // --- STORAGE CORE ---

    async getSignedUploadUrl(bucketId: string, path: string): Promise<string> {
        // In a production app, this would call a Supabase function or server-side endpoint
        // that returns a signed URL with restricted permissions.
        // For this demo, we use the standard upload method with bucket constants.
        return `${bucketId}/${path}`;
    },

    async uploadToBucket(file: File, isShort: boolean): Promise<Partial<MediaAsset>> {
        const bucket = isShort ? BUCKETS.SHORTS : BUCKETS.VIDEO;
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const path = `${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        return {
            storage_path: path,
            bucket_id: bucket as any,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type
        };
    },

    async generateThumbnail(videoFile: File): Promise<string> {
        // Production: Call an Edge Function with FFmpeg
        // Demo: Return a high-res placeholder
        return `https://picsum.photos/seed/${Math.random()}/1280/720`;
    },

    // --- DB OPERATIONS ---

    async registerAsset(asset: Omit<MediaAsset, 'id' | 'created_at'>): Promise<string> {
        const { data, error } = await supabase
            .from('media_assets')
            .insert(asset)
            .select('id')
            .single();
        
        if (error) throw error;
        return data.id;
    },

    async updateAssetStatus(assetId: string, status: AssetStatus) {
        await supabase
            .from('media_assets')
            .update({ status })
            .eq('id', assetId);
    }
};
