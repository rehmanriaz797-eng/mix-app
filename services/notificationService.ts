
import { SmartNotification, NotificationMood, WatchStreak, UserGlowSettings } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const STORAGE_KEYS = {
    NOTIFICATIONS: 'azkaartube_notifications_v2',
    GLOW_SETTINGS: 'azkaartube_glow_settings',
    STREAKS: 'azkaartube_streaks',
    LAST_AI_GEN: 'azkaartube_last_notif_gen'
};

const getSafeStorage = (key: string, def: any) => {
    try {
        const val = localStorage.getItem(key);
        if (!val || val === "undefined") return def;
        const parsed = JSON.parse(val);
        return parsed || def;
    } catch (e) {
        return def;
    }
};

const setStorage = (key: string, val: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
};

class NotificationBrain {
    private notifications: SmartNotification[] = [];
    private listeners: ((notifs: SmartNotification[]) => void)[] = [];
    private settingsListeners: ((settings: UserGlowSettings) => void)[] = [];
    
    private settings: UserGlowSettings;
    private streak: WatchStreak;

    constructor() {
        this.notifications = getSafeStorage(STORAGE_KEYS.NOTIFICATIONS, []);
        this.settings = getSafeStorage(STORAGE_KEYS.GLOW_SETTINGS, {
            interestSliders: { 'Gaming': 80, 'Tech': 90, 'Music': 40 },
            quietHoursActive: false,
            moodPreference: 'energetic',
            glowLevel: 45
        });
        this.streak = getSafeStorage(STORAGE_KEYS.STREAKS, {
            currentStreak: 5,
            lastWatchDate: new Date().toISOString(),
            riskLevel: 'safe'
        });

        if (this.notifications.length === 0) {
            this.seedInitialNotifications();
        }
    }

    private seedInitialNotifications() {
        const seed: SmartNotification[] = [
            {
                id: 'streak-1',
                type: 'streak_risk',
                priority: 'critical',
                mood: 'urgent',
                title: '5-Day Streak on the Line!',
                message: "Don't let your progress vanish! Watch a quick reel now.",
                metadata: { probabilityScore: 0.98, route: '/', previewUrl: 'https://picsum.photos/seed/forest/600/400' },
                isRead: false,
                isGlowActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        this.notifications = seed;
        setStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    }

    subscribe(callback: (notifs: SmartNotification[]) => void) {
        this.listeners.push(callback);
        return () => { this.listeners = this.listeners.filter(l => l !== callback); };
    }

    subscribeSettings(callback: (settings: UserGlowSettings) => void) {
        this.settingsListeners.push(callback);
        return () => { this.settingsListeners = this.settingsListeners.filter(l => l !== callback); };
    }

    private notify() {
        this.listeners.forEach(l => l([...this.notifications]));
    }

    private notifySettings() {
        this.settingsListeners.forEach(l => l({ ...this.settings }));
    }

    async generateIntelligence(): Promise<void> {
        const lastGen = Number(localStorage.getItem(STORAGE_KEYS.LAST_AI_GEN) || 0);
        if (Date.now() - lastGen < 1000 * 60 * 15 && this.notifications.length > 2) {
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `AI Notification Engine for Azkaartube. User: ${this.settings.moodPreference}, Streak: ${this.streak.currentStreak}. Quiet Hours: ${this.settings.quietHoursActive}.`;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview", 
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            priority: { type: Type.STRING },
                            mood: { type: Type.STRING },
                            title: { type: Type.STRING },
                            message: { type: Type.STRING },
                            probabilityScore: { type: Type.NUMBER },
                            route: { type: Type.STRING }
                        }
                    }
                }
            });

            const text = response.text;
            if (!text) return;
            const aiData = JSON.parse(text);
            if (aiData.probabilityScore < 0.2) return;

            const newNotif: SmartNotification = {
                id: Math.random().toString(36).substring(7),
                type: aiData.type || 'ai_curated',
                priority: aiData.priority || 'medium',
                mood: aiData.mood || 'chill',
                title: aiData.title || 'Personalized for you',
                message: aiData.message || 'Explore the latest trending content on Azkaartube.',
                metadata: {
                    probabilityScore: aiData.probabilityScore || 0.5,
                    route: aiData.route || '/',
                    previewUrl: `https://picsum.photos/seed/${Math.random()}/600/400`
                },
                isRead: false,
                isGlowActive: !this.settings.quietHoursActive && (aiData.priority === 'high' || aiData.priority === 'critical'),
                createdAt: new Date().toISOString()
            };

            this.notifications = [newNotif, ...this.notifications].slice(0, 20);
            localStorage.setItem(STORAGE_KEYS.LAST_AI_GEN, Date.now().toString());
            setStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
            this.notify();

        } catch (e: any) {}
    }

    getNotifications() { return this.notifications || []; }
    getSettings() { return this.settings; }
    getStreak() { return this.streak; }

    markAsRead(id: string) {
        this.notifications = this.notifications.map(n => n.id === id ? { ...n, isRead: true, isGlowActive: false } : n);
        setStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
        this.notify();
    }

    clearAll() {
        this.notifications = [];
        setStorage(STORAGE_KEYS.NOTIFICATIONS, []);
        this.notify();
    }

    updateMood(mood: NotificationMood) {
        this.settings.moodPreference = mood;
        setStorage(STORAGE_KEYS.GLOW_SETTINGS, this.settings);
        this.notifySettings();
        this.generateIntelligence();
    }

    updateSlider(key: string, val: number) {
        this.settings.interestSliders[key] = val;
        setStorage(STORAGE_KEYS.GLOW_SETTINGS, this.settings);
        this.notifySettings();
    }

    toggleQuietHours() {
        this.settings.quietHoursActive = !this.settings.quietHoursActive;
        setStorage(STORAGE_KEYS.GLOW_SETTINGS, this.settings);
        this.notifySettings();
        if (this.settings.quietHoursActive) {
            this.notifications = this.notifications.map(n => ({ ...n, isGlowActive: false }));
            setStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
            this.notify();
        }
    }
}

export const notificationService = new NotificationBrain();
