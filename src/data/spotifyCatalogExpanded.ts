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
 * Calculates authentic Top 1-10 Artists by Spotify Monthly Listeners
 * Combines world-class superstar NPCs with the Player's real monthly listeners.
 */
export function getTopArtistsByMonthlyListeners(state: GameState): SpotifyTopArtistItem[] {
  const list: { name: string; avatar: string; monthlyListeners: number; isPlayer: boolean; npcData?: DetailedNPC }[] = [];

  // 1. Add NPCs with realistic Spotify listener figures (30M - 115M)
  DETAILED_NPCS.forEach(n => {
    // Top artists like The Weekend, Taylor Shift, Drakeo, Billie, Sabrina Carpenter have 70M - 115M listeners
    const baseListeners = Math.round(
      (n.pop * 950000) + (n.hype * 280000) + ((n.name.length * 991823) % 4500000)
    );

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
