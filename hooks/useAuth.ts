
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Profile } from '../types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  ensureProfile: (user: any) => Promise<Profile | null>;
}

const PROFILE_COLUMNS = 'id, username, full_name, avatar_url, is_premium, premium_tier';

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  
  signOut: async () => {
    // 1. Immediate local state purge for instant UI feedback
    set({ user: null, profile: null, loading: false, initialized: true });
    
    try { 
      // 2. Clear known persistence keys
      localStorage.removeItem('azkaartube_subscription_data');
      localStorage.removeItem('supabase.auth.token');
      
      // 3. Inform server of signal termination
      await supabase.auth.signOut(); 
    } catch(e) {
      console.error("Auth signal termination error (server-side), continuing local cleanup.", e);
    } finally {
        // 4. Force hard reset to secure portal
        // Using window.location to bypass any potential react-router hang-ups
        const loginPath = window.location.origin + '/#/login';
        window.location.replace(loginPath);
        window.location.reload();
    }
  },

  ensureProfile: async (user: any): Promise<Profile | null> => {
    if (!user) return null;
    try {
        const { data: existingProfile } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', user.id).maybeSingle();
        if (existingProfile) return existingProfile as Profile;

        const metadata = user.user_metadata || {};
        const fallback = user.email?.split('@')[0] || `user_${user.id.substring(0, 5)}`;
        return {
            id: user.id,
            username: metadata.username || fallback,
            full_name: metadata.full_name || fallback,
            avatar_url: metadata.avatar_url || `https://picsum.photos/seed/${user.id}/100`,
            is_premium: false
        };
    } catch (err) {
        return null;
    }
  },

  checkSession: async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            set({ user: session.user });
            const profile = await get().ensureProfile(session.user);
            set({ profile });
        } else {
            set({ user: null, profile: null });
        }
    } catch (error) {
        console.error("Neural handshake verification failed.");
    } finally {
        set({ loading: false, initialized: true });
    }
  }
}));

// Global Auth Signal Listener
supabase.auth.onAuthStateChange(async (event, session) => {
    const auth = useAuth.getState();
    if (session?.user) {
        auth.setUser(session.user);
        const profile = await auth.ensureProfile(session.user);
        auth.setProfile(profile);
    } else if (event === 'SIGNED_OUT') {
        auth.setUser(null);
        auth.setProfile(null);
    }
});
