// Expanded Spotify Playlist Catalog & Top Monthly Listeners System
// Adds authentic Spotify Moods, Vibes, Flagships, and Algorithmic shelves
// along with the Top 1-10 Monthly Listeners horizontal showcase.

import { ChartItem, GameState, Song } from '../types';
import { NPCS } from '../constants';
import { getTrackCoverArt, DetailedNPC, DETAILED_NPCS } from './npcAssets';

export interface SpotifyPlaylistMeta {
  id: string;
  name: string;
  desc: string;
  category: 'flagship' | 'mood' | 'algorithmic' | 'genre';
  gradient: string;
  followers: number;
  icon?: string;
}

export const EXPANDED_SPOTIFY_PLAYLISTS: SpotifyPlaylistMeta[] = [
  // --- FLAGSHIPS ---
  {
    id: 'tth',
    name: "Today's Top Hits",
    desc: 'The biggest songs in the world right now. Cover: Global Superstars.',
    category: 'flagship',
    gradient: 'from-blue-600 to-indigo-950',
    followers: 34850000
  },
  {
    id: 'nmf',
    name: 'New Music Friday',
    desc: 'The best new releases from today, curated by Spotify editors.',
    category: 'flagship',
    gradient: 'from-pink-600 to-rose-950',
    followers: 4320000
  },
  {
    id: 'pr',
    name: 'Pop Rising',
    desc: 'The future of pop music starts right here. Discover tomorrow’s hits today.',
    category: 'flagship',
    gradient: 'from-fuchsia-600 to-purple-950',
    followers: 3120000
  },
  {
    id: 'rc',
    name: 'RapCaviar',
    desc: 'Music at the speed of culture. The premier destination for hip-hop.',
    category: 'genre',
    gradient: 'from-emerald-600 to-teal-950',
    followers: 15980000
  },
  {
    id: 'v50',
    name: 'Viral 50 - Global',
    desc: 'The most viral tracks across social platforms and trending feeds.',
    category: 'flagship',
    gradient: 'from-cyan-600 to-sky-950',
    followers: 2450000
  },

  // --- MOODS & VIBES ---
  {
    id: 'chill_vibes',
    name: 'Chill Vibes',
    desc: 'Kick back, relax, and ease into the mellow groove of smooth melodic sounds.',
    category: 'mood',
    gradient: 'from-amber-600 to-stone-900',
    followers: 8750000
  },
  {
    id: 'workout_energy',
    name: 'Workout Energy',
    desc: 'High-octane, pumping beats designed to fuel your hardest training sessions.',
    category: 'mood',
    gradient: 'from-orange-600 to-red-950',
    followers: 7420000
  },
  {
    id: 'late_night',
    name: 'Late Night Drive',
    desc: 'Atmospheric nocturnal soundscapes for empty roads and neon highways.',
    category: 'mood',
    gradient: 'from-violet-700 to-neutral-950',
    followers: 5830000
  },
  {
    id: 'feel_good',
    name: 'Feel-Good Indie',
    desc: 'Sunshine melodies, warm acoustic chords, and uplifting good energy.',
    category: 'mood',
    gradient: 'from-yellow-600 to-emerald-950',
    followers: 4950000
  },
  {
    id: 'sad_hour',
    name: 'Sad Hour',
    desc: 'Emotional ballads, honest confessions, and songs for tender hearts.',
    category: 'mood',
    gradient: 'from-slate-600 to-blue-950',
    followers: 6180000
  },
  {
    id: 'sunset_chill',
    name: 'Sunset Acoustic',
    desc: 'Golden-hour acoustic sessions, warm fingerpicking, and mellow vocal harmonies.',
    category: 'mood',
    gradient: 'from-amber-500 to-rose-950',
    followers: 4120000
  },

  // --- FOCUS & AMBIENT ---
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    desc: 'Calm atmospheric beats and clean instrumental textures to stay in the zone.',
    category: 'mood',
    gradient: 'from-teal-600 to-slate-950',
    followers: 4720000
  },
  {
    id: 'peaceful_lofi',
    name: 'Peaceful Lo-Fi',
    desc: 'Cozy vinyl crackles, soft rhodes chords, and chill tape-warped loops.',
    category: 'mood',
    gradient: 'from-indigo-500 to-zinc-950',
    followers: 3890000
  },

  // --- PARTY & HIGH ENERGY ---
  {
    id: 'club_hits',
    name: 'Club & Dance Anthems',
    desc: 'Peak-time festival bangers, floor-fillers, and hypnotic bass drops.',
    category: 'genre',
    gradient: 'from-purple-600 to-pink-950',
    followers: 5820000
  },
  {
    id: 'beast_mode',
    name: 'Beast Mode',
    desc: 'Aggressive rap, heavy kicks, and uncompromising gym motivation.',
    category: 'genre',
    gradient: 'from-red-600 to-black',
    followers: 6890000
  },

  // --- ALGORITHMIC & DISCOVERY ---
  {
    id: 'release_radar',
    name: 'Release Radar',
    desc: 'Catch all the newest music from the artists you follow and love.',
    category: 'algorithmic',
    gradient: 'from-teal-600 to-gray-950',
    followers: 19800000
  },
  {
    id: 'discover_weekly',
    name: 'Discover Weekly',
    desc: 'Your weekly mixtape of fresh discoveries and deep algorithmic picks.',
    category: 'algorithmic',
    gradient: 'from-indigo-600 to-neutral-950',
    followers: 17200000
  },
  {
    id: 'daily_mix_1',
    name: 'Daily Mix 1',
    desc: 'Personalized radio blending your favorite hits with seamless recommendations.',
    category: 'algorithmic',
    gradient: 'from-emerald-700 to-black',
    followers: 14200000
  }
];

export interface SpotifyTopArtistItem {
  rank: number;
  name: string;
  avatar: string;
  monthlyListeners: number;
  formattedListeners: string;
  isPlayer: boolean;
  npcData?: DetailedNPC;
}

/**
 * Shared realistic Monthly Listeners calculator for NPC artists.
 * Accounts for multi-track listener overlap and non-linear global reach so:
 * - #1 Global Megastars (pop 97-99) sit around 82M - 106M
 * - A-List Stars (pop 88-95) sit around 45M - 76M
 * - Mainstream / Mid-Tier Stars (pop 75-87) sit around 16M - 42M
 */
export function calculateNpcMonthlyListeners(
  npc: DetailedNPC,
  extraCollabDailyStreams = 0
): number {
  const pop = Math.max(20, Math.min(99, npc.pop || 75));
  const hype = Math.max(15, Math.min(99, npc.hype || 70));

  const popRatio = pop / 100;
  const hypeRatio = hype / 100;

  // Deterministic artist variance so numbers look organic (not rounded to 000)
  let hash = 0;
  const nameStr = npc.name || 'Artist';
  for (let i = 0; i < nameStr.length; i++) {
    hash = (hash * 31 + nameStr.charCodeAt(i)) % 1_000_000;
  }
  const organicOffset = (hash % 2_400_000) - 900_000;

  // Non-linear global reach baseline from popularity and hype
  const popReach = Math.pow(popRatio, 2.55) * 68_000_000;
  const hypeReach = Math.pow(hypeRatio, 2.1) * 16_500_000;

  // Overlap-discounted active catalog stream contribution
  const sortedDaily = [...(npc.songs || [])]
    .map(s => Math.max(0, s.dailyStreams ?? Math.floor((s.streams ?? 0) / 35)))
    .sort((a, b) => b - a);

  let effectiveCatalogDaily = 0;
  sortedDaily.forEach((dStream, idx) => {
    const weight = idx === 0 ? 1.0 : idx === 1 ? 0.32 : idx === 2 ? 0.18 : 0.07;
    effectiveCatalogDaily += dStream * weight;
  });

  const streamReachContribution = Math.min(
    24_000_000,
    Math.round((effectiveCatalogDaily + extraCollabDailyStreams * 0.45) * 2.35)
  );

  const rawListeners = Math.round(
    popReach + hypeReach + streamReachContribution * 0.55 + organicOffset
  );

  // Soft compression above 78M and realistic ceiling at 108.5M
  const compressed =
    rawListeners > 78_000_000
      ? 78_000_000 + Math.round((rawListeners - 78_000_000) * 0.62)
      : rawListeners;

  return Math.max(850_000, Math.min(108_500_000, compressed));
}

/**
 * Calculates authentic Top 1-10 Artists by Spotify Monthly Listeners
 * Combines world-class superstar NPCs with the Player's real monthly listeners.
 */
export function getTopArtistsByMonthlyListeners(state: GameState): SpotifyTopArtistItem[] {
  const list: { name: string; avatar: string; monthlyListeners: number; isPlayer: boolean; npcData?: DetailedNPC }[] = [];

  // 1. Add NPCs with realistic calibrated Spotify listener figures
  DETAILED_NPCS.forEach(n => {
    const baseListeners = calculateNpcMonthlyListeners(n);

    list.push({
      name: n.name,
      avatar: n.avatar || n.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      monthlyListeners: baseListeners,
      isPlayer: false,
      npcData: n
    });
  });

  // 2. Add Player
  if (state.artist && state.spotify) {
    list.push({
      name: state.artist.name,
      avatar: state.artist.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80',
      monthlyListeners: state.spotify.listeners || 0,
      isPlayer: true
    });
  }

  // 3. Sort descending by monthly listeners and pick Top 10
  list.sort((a, b) => b.monthlyListeners - a.monthlyListeners);

  return list.slice(0, 10).map((item, idx) => ({
    rank: idx + 1,
    name: item.name,
    avatar: item.avatar,
    monthlyListeners: item.monthlyListeners,
    formattedListeners: item.monthlyListeners.toLocaleString('en-US'),
    isPlayer: item.isPlayer,
    npcData: item.npcData
  }));
}

