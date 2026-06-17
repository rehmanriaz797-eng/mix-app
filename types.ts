
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  premium_tier?: 'basic' | 'plus' | 'pro';
  wallet_balance?: number;
  is_vip?: boolean;
  fan_type?: 'priority' | 'subscriber' | 'normal';
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'flagged';

export interface CreatorMessagingSettings {
    allowFrom: 'everyone' | 'subscribers' | 'paid_members';
    slowModeSeconds: number;
    autoReplyEnabled: boolean;
    autoReplyText: string;
    paidMessagePrice: number; // 0 for free
    isShadowBanned?: boolean;
}

export interface CreatorMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: 'text' | 'image' | 'video' | 'voice_note' | 'sticker';
    media_url?: string;
    status: MessageStatus;
    is_encrypted?: boolean;
    is_paid?: boolean;
    amount?: number;
    flag_reason?: string;
    created_at: string;
    profiles?: Profile;
}

export interface CommunityPost {
    id: string;
    user_id: string;
    content: string;
    media_url?: string;
    type: 'text' | 'poll' | 'image';
    poll_options?: { label: string; votes: number }[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: Profile;
}

export interface LiveStream {
    id: string;
    user_id: string;
    title: string;
    thumbnail_url: string;
    viewer_count: number;
    is_live: boolean;
    started_at: string;
    profiles: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'voice_note';
  media_url?: string;
  status: MessageStatus;
  is_encrypted?: boolean;
  created_at: string;
}

export interface Post { id: string; user_id: string; content: string; media_url?: string; media_type?: 'image' | 'video'; likes_count: number; comments_count: number; created_at: string; profiles?: Profile; }
export interface Call { id: string; session_id: string; caller_id: string; receiver_id: string; type: 'voice' | 'video'; status: 'ringing' | 'ongoing' | 'ended'; created_at: string; ended_at?: string; }
export interface Story { id: string; user_id: string; media_url: string; media_type: 'image' | 'video'; created_at: string; expires_at: string; profiles?: Profile; }
export interface Reel { id: string; user_id: string; caption: string; video_url: string; thumbnail_url?: string; likes_count: number; created_at: string; profiles: Profile; }
export interface MarketplaceItem { id: string; user_id: string; title: string; price: number; currency: string; description: string; category: string; condition: 'new' | 'used'; city: string; location_lat: number; location_lng: number; photos: string[]; status: 'active' | 'sold' | 'inactive'; created_at: string; distance?: number; profiles?: Profile; }
export type NotificationMood = 'chill' | 'energetic' | 'urgent' | 'curious' | 'social';
export interface SmartNotification { id: string; type: string; priority: 'low' | 'medium' | 'high' | 'critical'; mood: NotificationMood; title: string; message: string; metadata?: any; isRead: boolean; isGlowActive: boolean; createdAt: string; }
export interface UserGlowSettings { interestSliders: Record<string, number>; quietHoursActive: boolean; moodPreference: NotificationMood; glowLevel: number; }
export interface WatchStreak { currentStreak: number; lastWatchDate: string; riskLevel: 'safe' | 'at_risk'; }
export interface OpeningThemeConfig { id: string; primary_color: string; audio_frequency: number; }
export type CommentSentiment = 'positive' | 'neutral' | 'negative' | 'toxic' | 'constructive';
export interface ShortComment { id: string; short_id: string; user_id: string; content: string; likes_count: number; reply_count: number; created_at: string; profiles: Profile; ai_sentiment?: CommentSentiment; is_ai_highlighted?: boolean; ai_quality_score?: number; is_pinned?: boolean; has_creator_heart?: boolean; }
export interface Video { id: string; title: string; description?: string; videoUrl?: string; thumbnailUrl?: string; duration: string; views: string; postedAt: string; channelName: string; channelAvatarUrl: string; channelHandle: string; likes?: number; tags?: string[]; }
export interface Channel { id: string; name: string; handle: string; avatar: string; banner: string; description: string; subscribers: number; }
export interface SortShort { id: string; user_id: string; title: string; video_url: string; thumbnail_url: string; caption: string; likes_count: number; comments_count: number; profiles: Profile; created_at: string; duration_label: string; tags?: string[]; music_name?: string; share_count?: number; ai_score?: number; momentum_score?: number; watch_time_avg?: number; loop_count?: number; early_skips?: number; }
export interface AIChatMessage { role: 'user' | 'model'; content: string; timestamp: number; }
export const SAMPLE_VIDEO_URLS = [ 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' ];
export interface Comment { id: string; text: string; author: string; avatar: string; created_at: string; }
export interface Playlist { id: string; title: string; video_ids: string[]; created_at: string; }
export interface AnalyticsData { totalViews: number; totalLikes: number; subscribersGained: number; viewsHistory: number[]; }
export interface CreatorWallet { id: string; user_id: string; balance: number; pending_balance: number; total_earned: number; currency: string; }
export interface UserSubscription { id: string; user_id: string; plan_id: string; status: string; current_period_end: string; }
export type BillingCycle = 'monthly' | 'yearly';
export type PayoutMethod = 'bank' | 'easypaisa' | 'jazzcash' | 'stripe';
export interface WalletTransaction { id: string; wallet_id: string; amount: number; type: 'tip' | 'ad_revenue' | 'withdrawal'; status: 'pending' | 'completed' | 'failed'; metadata: any; created_at: string; }
export interface SubscriptionPlan { id: string; name: string; tier: 'basic' | 'plus' | 'pro'; price: number; currency: string; features: string[]; is_popular?: boolean; }
export type UploadPipeline = 'long_form' | 'shorts';
export interface UploadSession { id: string; user_id: string; pipeline: UploadPipeline; file_name: string; file_size: number; total_parts: number; uploaded_parts: number; status: 'uploading' | 'processing' | 'completed' | 'failed'; created_at: string; }
export interface ProcessingJob { id: string; upload_id: string; stage: 'queued' | 'ai_precheck' | 'fingerprinting' | 'encoding' | 'ready'; progress: number; eta_seconds: number; details: any; }
export type ClaimAction = 'MONETIZE_CLAIMANT' | 'BLOCK' | 'TRACK' | 'REGION_RESTRICT' | 'TAKEDOWN';
export interface CopyrightClaim { id: string; video_id: string; matched_asset_id: string; claimant_name: string; match_segment: { start: number; end: number }; confidence_score: number; action_enforced: ClaimAction; explanation_plain: string; policy_details: string; risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; }
export type AssetStatus = 'active' | 'processing' | 'flagged' | 'archived';
export interface MediaAsset { id: string; user_id: string; storage_path: string; bucket_id: 'video-bucket' | 'shorts-bucket' | 'thumbnail-bucket' | 'temp-processing-bucket'; original_filename: string; file_size: number; mime_type: string; status: AssetStatus; created_at: string; }
export interface AICaptionSet { primary_title: string; captions: { short_vertical: string; long_tutorial: string; teaser_hook: string; }; emojis: string[]; cta_lines: string[]; platform_optimized: { youtube: string; facebook: string; tiktok: string; }; }
export interface AIHashtagSet { tags: string[]; reach_potential: number; }
export type RecoveryAction = 'trim_segment' | 'mute_audio' | 'swap_track' | 'dispute_claim';
export type Jurisdiction = 'US' | 'EU' | 'ASIA' | 'GLOBAL';
export type AppealStatus = 'pending' | 'rejected' | 'upheld';
export interface LegalAppeal { id: string; claim_id: string; user_justification: string; jurisdiction: Jurisdiction; status: AppealStatus; created_at: string; }
export interface ThumbnailVariant { id: string; style_preset: 'VIRAL_GLOW' | 'CONTRAST_POP' | 'TEXT_HEAVY' | 'MINIMAL'; preview_url: string; }
export interface ForensicLog { id: string; event_type: 'upload' | 'deletion' | 'modification' | 'access'; merkle_root: string; timestamp: string; actor_signature: string; payload_hash: string; }
export interface InteractiveSticker { id: string; type: 'poll' | 'qa' | 'product_link'; x: number; y: number; data: any; }
