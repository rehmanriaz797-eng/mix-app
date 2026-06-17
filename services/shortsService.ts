
import { SortShort } from "../types";

/**
 * AzkaarTube High-Velocity Ranking Logic
 * Treat Shorts as a separate behavior engine.
 */
export const shortsService = {
  /**
   * Proprierary Neural Ranking Algorithm
   * Score = (WT% * 4) + (Loops * 3) + (Likes * 2) + (Comments * 1) - (EarlySkips * 6)
   */
  calculateResonance: (short: SortShort): number => {
    const watchPct = short.watch_time_avg || 0.8;
    const loops = short.loop_count || 0;
    const likes = short.likes_count || 0;
    const comments = short.comments_count || 0;
    const skips = short.early_skips || 0;

    return (watchPct * 400) + (loops * 30) + (likes * 2) + (comments * 1) - (skips * 60);
  },

  /**
   * Sorts feed based on resonance and unseen content memory.
   */
  rankFeed: (shorts: SortShort[], seenIds: string[]): SortShort[] => {
    return [...shorts].sort((a, b) => {
      const isASeen = seenIds.includes(a.id);
      const isBSeen = seenIds.includes(b.id);
      
      if (!isASeen && isBSeen) return -1;
      if (isASeen && !isBSeen) return 1;

      return shortsService.calculateResonance(b) - shortsService.calculateResonance(a);
    });
  },

  markAsSeen: (id: string) => {
    const seen = JSON.parse(sessionStorage.getItem('az_seen_v3') || '[]');
    if (!seen.includes(id)) {
      sessionStorage.setItem('az_seen_v3', JSON.stringify([...seen, id].slice(-200)));
    }
  },

  getSeenIds: (): string[] => {
    try {
      return JSON.parse(sessionStorage.getItem('az_seen_v3') || '[]');
    } catch { return []; }
  }
};
