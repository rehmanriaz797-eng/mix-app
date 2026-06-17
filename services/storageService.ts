
import { Video, Profile, SortShort, SAMPLE_VIDEO_URLS, Comment, Playlist, Channel, AnalyticsData, CreatorMessage, CreatorMessagingSettings, ShortComment, CommunityPost, LiveStream, MessageStatus } from '../types';

const STORAGE_KEYS = {
    MESSAGES: 'at_creator_messages_v4',
    MSG_SETTINGS: 'at_creator_settings_v1',
    WALLET: 'at_creator_wallet_v1',
    SUBS: 'azkaartube_subs_v5',
    HISTORY: 'azkaartube_history_v5',
    LIKED: 'azkaartube_liked_v5',
    LIKED_SHORTS: 'azkaartube_liked_shorts_v2',
    LIKED_COMMENTS: 'azkaartube_liked_comments_v2',
    CHANNEL_STATS: 'at_channel_stats_v2',
    COMMUNITY: 'at_community_posts_v2',
    LIVE: 'at_live_streams_v2',
    UPLOADS: 'at_uploads_v2',
    SHORTS_UPLOADS: 'at_shorts_uploads_v2'
};

const getJSON = (key: string, def: any) => {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : def;
    } catch { return def; }
};

const setJSON = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

// --- COMMUNITY ---
export const getCommunityPosts = (userId: string): CommunityPost[] => {
    const all = getJSON(STORAGE_KEYS.COMMUNITY, []);
    return all.filter((p: CommunityPost) => p.user_id === userId || userId === 'all');
};

export const saveCommunityPost = (post: CommunityPost) => {
    const all = getJSON(STORAGE_KEYS.COMMUNITY, []);
    setJSON(STORAGE_KEYS.COMMUNITY, [post, ...all]);
    window.dispatchEvent(new Event('storage'));
};

// --- LIVE ---
export const getLiveStreams = (userId: string): LiveStream[] => {
    const all = getJSON(STORAGE_KEYS.LIVE, []);
    return all.filter((s: LiveStream) => s.user_id === userId || userId === 'all');
};

export const saveLiveStream = (stream: LiveStream) => {
    const all = getJSON(STORAGE_KEYS.LIVE, []);
    setJSON(STORAGE_KEYS.LIVE, [stream, ...all]);
    window.dispatchEvent(new Event('storage'));
};

// --- MESSAGING & CREATOR HUB ---
export const getCreatorMessages = (convId: string): CreatorMessage[] => {
    const all = getJSON(STORAGE_KEYS.MESSAGES, []);
    return all.filter((m: CreatorMessage) => m.conversation_id === convId);
};

export const updateMessageStatus = (msgId: string, status: MessageStatus) => {
    const all = getJSON(STORAGE_KEYS.MESSAGES, []);
    const updated = all.map((m: CreatorMessage) => m.id === msgId ? { ...m, status } : m);
    setJSON(STORAGE_KEYS.MESSAGES, updated);
};

export const getCreatorSettings = (creatorId: string): CreatorMessagingSettings => {
    const allSettings = getJSON(STORAGE_KEYS.MSG_SETTINGS, {});
    return allSettings[creatorId] || {
        allowFrom: 'everyone',
        slowModeSeconds: 0,
        autoReplyEnabled: false,
        autoReplyText: "Thanks for reaching out! I'll get back to you soon.",
        paidMessagePrice: 0
    };
};

export const saveCreatorSettings = (creatorId: string, settings: CreatorMessagingSettings) => {
    const allSettings = getJSON(STORAGE_KEYS.MSG_SETTINGS, {});
    allSettings[creatorId] = settings;
    setJSON(STORAGE_KEYS.MSG_SETTINGS, allSettings);
};

export const updateWallet = (creatorId: string, amount: number) => {
    const wallets = getJSON(STORAGE_KEYS.WALLET, {});
    const current = wallets[creatorId] || { balance: 0, total_earned: 0 };
    wallets[creatorId] = {
        ...current,
        balance: (current.balance || 0) + amount,
        total_earned: (current.total_earned || 0) + amount
    };
    setJSON(STORAGE_KEYS.WALLET, wallets);
};

export const getAllCreatorConversations = (creatorId: string): any[] => {
    let allMessages = getJSON(STORAGE_KEYS.MESSAGES, []);
    
    // Seed exactly like screenshots if empty
    if (allMessages.length === 0) {
        const mockData: CreatorMessage[] = [
            { 
                id: 'm1', conversation_id: 'c1', sender_id: 'f1', content: 'You shared a ...', message_type: 'text', status: 'read', created_at: '2026-01-01T08:02:00Z', 
                profiles: { id: 'f1', username: 'mw1741890@gmail.c...', full_name: 'Mirza Ayan', avatar_url: 'https://picsum.photos/seed/ayan/100', fan_type: 'normal' } as any 
            },
            { id: 'm1_v1', conversation_id: 'c1', sender_id: 'f1', content: 'Shared video', message_type: 'video', media_url: 'https://picsum.photos/seed/vid1/300/500', status: 'read', created_at: '2025-09-10T20:39:00Z' },
            { id: 'm1_s1', conversation_id: 'c1', sender_id: 'me', content: 'Big emoji', message_type: 'sticker', status: 'read', created_at: '2025-09-10T20:54:00Z' },
            { 
                id: 'm2', conversation_id: 'c2', sender_id: 'f2', content: 'sent a sticker', message_type: 'sticker', status: 'delivered', created_at: '2025-12-18T15:30:00Z', 
                profiles: { id: 'f2', username: 'Ao sidhe rasty pr', avatar_url: 'https://picsum.photos/seed/rasty/100', fan_type: 'subscriber' } as any 
            },
            { 
                id: 'm3', conversation_id: 'c3', sender_id: 'f3', content: 'You shared a ...', message_type: 'text', status: 'read', created_at: '2025-12-04T09:15:00Z', 
                profiles: { id: 'f3', username: 'عبد الله احمد این غزہ . 💔', avatar_url: 'https://picsum.photos/seed/abdullah/100', fan_type: 'subscriber' } as any 
            },
            { 
                id: 'm4', conversation_id: 'c4', sender_id: 'f4', content: 'You shared a ...', message_type: 'text', status: 'read', created_at: '2025-12-04T10:00:00Z', 
                profiles: { id: 'f4', username: '✨ SANI ✨', avatar_url: 'https://picsum.photos/seed/sani/100', fan_type: 'subscriber' } as any 
            },
            { 
                id: 'm5', conversation_id: 'c5', sender_id: 'f5', content: 'You shared a ...', message_type: 'text', status: 'read', created_at: '2025-12-04T11:20:00Z', 
                profiles: { id: 'f5', username: 'Nawaz Ansarii', avatar_url: 'https://picsum.photos/seed/nawaz/100', fan_type: 'normal' } as any 
            },
            { 
                id: 'm8', conversation_id: 'c8', sender_id: 'f8', content: 'You shared a ...', message_type: 'text', status: 'read', created_at: '2025-12-04T16:10:00Z', 
                profiles: { id: 'f8', username: 'muhammadjunaid1485', avatar_url: 'https://picsum.photos/seed/junaid/100', fan_type: 'normal' } as any 
            }
        ];
        setJSON(STORAGE_KEYS.MESSAGES, mockData);
        allMessages = mockData;
    }

    const uniqueConvIds = Array.from(new Set(allMessages.map((m: any) => m.conversation_id))) as string[];

    return uniqueConvIds.map(id => {
        const convMsgs = allMessages.filter((m: any) => m.conversation_id === id);
        const lastMsg = convMsgs[convMsgs.length - 1];
        const fanEntry = convMsgs.find((m: any) => m.profiles);
        const fanProfile = fanEntry?.profiles || { 
            username: 'Node_' + id.substring(0,4), 
            avatar_url: `https://picsum.photos/seed/${id}/100`,
            fan_type: 'normal'
        };
        
        // Match user's unread badge from screenshot
        const unreadCount = id === 'c2' ? 2 : 0;

        return {
            id,
            fan: fanProfile,
            lastMessage: lastMsg.content,
            time: lastMsg.created_at,
            unread: unreadCount,
            isPaid: lastMsg.is_paid || false,
            fanType: fanProfile.fan_type || 'normal'
        };
    }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export const saveCreatorMessage = (msg: CreatorMessage) => {
    const all = getJSON(STORAGE_KEYS.MESSAGES, []);
    setJSON(STORAGE_KEYS.MESSAGES, [...all, msg]);
    window.dispatchEvent(new CustomEvent('at_new_message', { detail: msg }));
    window.dispatchEvent(new Event('storage'));
};

// --- UPLOADS & VIDEOS ---
export const INITIAL_SHORTS: SortShort[] = [
    {
        id: 's1', user_id: 'u1', title: 'Cyber Tokyo 2025', caption: 'Neo vibes in the rain. #neon #cyberpunk',
        video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail_url: 'https://picsum.photos/seed/s1/400/700',
        likes_count: 12400, comments_count: 852, profiles: { id: 'u1', username: 'NeonSeeker', avatar_url: 'https://picsum.photos/seed/u1/100' },
        created_at: new Date().toISOString(), duration_label: '0:15', tags: ['neon', 'tokyo']
    }
];

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'v1', title: 'The Future of Neural Networks', description: 'Deep dive into 2025 AI.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnailUrl: 'https://picsum.photos/seed/v1/1280/720',
    duration: '12:45', views: '1.2M', postedAt: '2 days ago',
    channelName: 'Neural Frontiers', channelAvatarUrl: 'https://picsum.photos/seed/ai/100',
    channelHandle: '@neural', likes: 45000, tags: ['ai', 'tech']
  },
  {
    id: 'v2', title: 'Synthesized Reality Alpha', description: 'Exploring digital horizons.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnailUrl: 'https://picsum.photos/seed/v2/1280/720',
    duration: '08:20', views: '840K', postedAt: '5 hours ago',
    channelName: 'AzkaarTube Official', channelAvatarUrl: 'https://picsum.photos/seed/at/100',
    channelHandle: '@creator', likes: 12000, tags: ['official', 'vibe']
  }
];

export const getVideos = async (cat: string = 'all', page: number = 0) => {
    const subs = getJSON(STORAGE_KEYS.SUBS, []);
    const uploads = getJSON(STORAGE_KEYS.UPLOADS, []);
    const all = [...INITIAL_VIDEOS, ...uploads];

    if (cat === 'subscriptions') return all.filter(v => subs.includes(v.channelHandle));
    if (cat === 'liked') return all.slice(0, 2); // Sim
    if (cat === 'History') return getJSON(STORAGE_KEYS.HISTORY, []);
    if (cat === 'trending') return all.sort((a,b) => parseInt(b.views) - parseInt(a.views));
    
    return all;
};

export const getShorts = async (): Promise<SortShort[]> => {
    const uploads = getJSON(STORAGE_KEYS.SHORTS_UPLOADS, []);
    return [...INITIAL_SHORTS, ...uploads];
};

export const getUploadedVideos = async () => getJSON(STORAGE_KEYS.UPLOADS, []);
export const uploadVideo = async (v: any) => {
    const ups = await getUploadedVideos();
    const videoWithId = { ...v, id: 'uv_' + Date.now() };
    setJSON(STORAGE_KEYS.UPLOADS, [videoWithId, ...ups]);
};

export const deleteVideo = async (id: string) => {
    const ups = await getUploadedVideos();
    setJSON(STORAGE_KEYS.UPLOADS, ups.filter((v: any) => v.id !== id));
};

export const updateVideo = async (video: any) => {
    const ups = await getUploadedVideos();
    setJSON(STORAGE_KEYS.UPLOADS, ups.map((v: any) => v.id === video.id ? video : v));
};

// --- CORE UTILS ---
export const isSubscribedTo = (h: string) => getJSON(STORAGE_KEYS.SUBS, []).includes(h);
export const toggleSubscribe = (h: string) => {
    const subs = getJSON(STORAGE_KEYS.SUBS, []);
    const isSub = subs.includes(h);
    const next = isSub ? subs.filter((s: string) => s !== h) : [...subs, h];
    setJSON(STORAGE_KEYS.SUBS, next);
    window.dispatchEvent(new CustomEvent('azkaartube_sub_update', { detail: { handle: h, isSubscribed: !isSub } }));
    return !isSub;
};

export const isVideoLiked = (id: string) => getJSON(STORAGE_KEYS.LIKED, []).includes(id);
export const toggleLikeVideo = (id: string) => {
    const liked = getJSON(STORAGE_KEYS.LIKED, []);
    const isLiked = liked.includes(id);
    const next = isLiked ? liked.filter((s: string) => s !== id) : [...liked, id];
    setJSON(STORAGE_KEYS.LIKED, next);
    return !isLiked;
};

export const isVideoDisliked = (id: string) => getJSON(STORAGE_KEYS.LIKED + '_dis', []).includes(id);
export const toggleDislikeVideo = (id: string) => {
    const disliked = getJSON(STORAGE_KEYS.LIKED + '_dis', []);
    const isDis = disliked.includes(id);
    const next = isDis ? disliked.filter((s: string) => s !== id) : [...disliked, id];
    setJSON(STORAGE_KEYS.LIKED + '_dis', next);
    return !isDis;
};

export const addToHistory = (v: any) => {
    const hist = getJSON(STORAGE_KEYS.HISTORY, []);
    setJSON(STORAGE_KEYS.HISTORY, [v, ...hist.filter((i: any) => i.id !== v.id)].slice(0, 50));
};

export const getVideoById = async (id: string) => {
    const all = [...INITIAL_VIDEOS, ...getJSON(STORAGE_KEYS.UPLOADS, [])];
    return all.find(v => v.id === id) || all[0];
};

export const getPlaylists = () => getJSON('at_playlists_v2', []);
export const createPlaylist = (t: string, vId?: string) => {
    const pl = getPlaylists();
    const newP = { id: `pl_${Date.now()}`, title: t, video_ids: vId ? [vId] : [], created_at: new Date().toISOString() };
    setJSON('at_playlists_v2', [newP, ...pl]);
    return newP;
};
export const toggleVideoInPlaylist = (pId: string, vId: string) => {
    const pl = getPlaylists();
    const updated = pl.map((p: any) => {
        if (p.id === pId) {
            const has = p.video_ids.includes(vId);
            return { ...p, video_ids: has ? p.video_ids.filter((i: any) => i !== vId) : [...p.video_ids, vId] };
        }
        return p;
    });
    setJSON('at_playlists_v2', updated);
};

export const getUserChannel = async () => getJSON('at_channel_v2', { 
    id: 'me', 
    name: 'AzkaarTube Creator', 
    handle: '@creator', 
    avatar: 'https://picsum.photos/seed/me/100', 
    banner: 'https://picsum.photos/seed/banner/1200/400', 
    description: 'The heartbeat of the creator ecosystem.', 
    subscribers: 1250 
});

export const getChannelByHandle = async (h: string) => {
    if (h === '@creator') return getUserChannel();
    return { 
        id: h, 
        name: h.substring(1).charAt(0).toUpperCase() + h.substring(2), 
        handle: h, 
        avatar: `https://picsum.photos/seed/${h}/100`, 
        banner: `https://picsum.photos/seed/${h}_banner/1200/400`, 
        description: 'Syncing frequencies across the global node.', 
        subscribers: 5420 
    };
};

export const updateUserChannel = async (d: any) => {
    const cur = await getUserChannel();
    const next = { ...cur, ...d };
    setJSON('at_channel_v2', next);
    return next;
};

export const getAnalytics = async () => ({ 
    totalViews: 1250000, 
    totalLikes: 45000, 
    subscribersGained: 1250, 
    viewsHistory: [10, 20, 15, 30, 25, 40, 35] 
});

export const getTrendingVideos = async () => INITIAL_VIDEOS;
export const getSubscriptionVideos = async () => INITIAL_VIDEOS;
export const searchLocalVideos = async (q: string) => INITIAL_VIDEOS.filter(v => v.title.toLowerCase().includes(q.toLowerCase()));
export const getWatchPosition = (id: string) => {
    const positions = getJSON('at_watch_positions', {});
    return positions[id] || 0;
};
export const saveWatchPosition = (id: string, p: number) => {
    const positions = getJSON('at_watch_positions', {});
    positions[id] = p;
    setJSON('at_watch_positions', positions);
};
export const getNotifLevel = (c: string) => 'all';
export const setNotifLevel = (c: string, l: string) => {};
export const voteOnPoll = (id: string, i: number) => {
    const votes = getJSON('at_poll_votes', {});
    votes[id] = i;
    setJSON('at_poll_votes', votes);
};
export const getPollVote = (id: string) => {
    const votes = getJSON('at_poll_votes', {});
    return votes[id] !== undefined ? votes[id] : null;
};
export const generateThumbnail = async (f: File) => URL.createObjectURL(f);
export const clearHistory = () => setJSON(STORAGE_KEYS.HISTORY, []);
export const fetchShortComments = async (shortId: string): Promise<ShortComment[]> => {
    return [
        { id: 'sc1', short_id: shortId, user_id: 'u2', content: "This drop is insane! 🚀", likes_count: 142, reply_count: 5, created_at: new Date().toISOString(), profiles: { id: 'u2', username: 'SonicWave', avatar_url: 'https://picsum.photos/seed/wave/100', is_premium: true } },
        { id: 'sc2', short_id: shortId, user_id: 'u3', content: "Tutorial soon?", likes_count: 89, reply_count: 2, created_at: new Date().toISOString(), profiles: { id: 'u3', username: 'CodeMaster', avatar_url: 'https://picsum.photos/seed/code/100', is_premium: false } }
    ];
};
export const postShortComment = async (shortId: string, userId: string, content: string, profile: Profile): Promise<ShortComment> => ({ id: 'c_' + Date.now(), short_id: shortId, user_id: userId, content, likes_count: 0, reply_count: 0, created_at: new Date().toISOString(), profiles: profile });
export const toggleLikeComment = (id: string) => {
    const liked = getJSON(STORAGE_KEYS.LIKED_COMMENTS, []);
    const isLiked = liked.includes(id);
    const next = isLiked ? liked.filter((s: string) => s !== id) : [...liked, id];
    setJSON(STORAGE_KEYS.LIKED_COMMENTS, next);
    return !isLiked;
};
export const isCommentLiked = (id: string) => getJSON(STORAGE_KEYS.LIKED_COMMENTS, []).includes(id);
export const getComments = async (id: string) => [
    { id: 'c1', text: 'Neural signal verified. This content is high resonance.', author: 'Node_77', avatar: 'https://picsum.photos/seed/77/100', created_at: new Date().toISOString() },
    { id: 'c2', text: 'Quantum processing complete. Visuals are stunning.', author: 'Seeker_01', avatar: 'https://picsum.photos/seed/01/100', created_at: new Date().toISOString() },
    { id: 'c3', text: 'Direct link established. Subscribed for more.', author: 'Fan_88', avatar: 'https://picsum.photos/seed/88/100', created_at: new Date().toISOString() }
];
export const addComment = async (id: string, text: string) => {};
export const isShortLiked = (id: string) => getJSON(STORAGE_KEYS.LIKED_SHORTS, []).includes(id);
export const toggleLikeShort = (id: string) => {
    const liked = getJSON(STORAGE_KEYS.LIKED_SHORTS, []);
    const isLiked = liked.includes(id);
    const next = isLiked ? liked.filter((s: string) => s !== id) : [...liked, id];
    setJSON(STORAGE_KEYS.LIKED_SHORTS, next);
    return !isLiked;
};
export const getShortMetadata = (id: string) => INITIAL_SHORTS.find(s => s.id === id);
