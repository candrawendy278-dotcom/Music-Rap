// Authentic Spotify Playlist System & Organic Discovery Engine
// Implements real-world Spotify curation mechanics:
// 1. Diverse playlist categories: Flagships, Moods, Focus, Workout, Party, Algorithmic / Made For You
// 2. Automated Organic Placement: songs automatically get placed on multiple playlists
//    (Release Radar, Discover Weekly, Moods, Viral, Pop Rising) even if player NEVER pitches!
// 3. Rotational Fatigue & Dynamic Stability: realistic playlist lifecycle and healthy non-pitch streaming baselines

import { Song, GameState, ChartItem } from '../types';
import { NPCS } from '../constants';
import { DetailedNPC, DETAILED_NPCS } from './npcAssets';

export interface SpotifyPlaylistDefinition {
  id: string;
  name: string;
  desc: string;
  category: 'flagship' | 'mood' | 'focus' | 'party' | 'algorithmic';
  gradient: string;
  coverAccent: string;
  followers: number;
  iconName?: string;
  curator: 'Spotify Editorial' | 'Spotify Algorithm' | 'Spotify Viral';
  eligibleGenres?: string[];
  minQuality?: number;
  minHype?: number;
}

export const AUTHENTIC_SPOTIFY_PLAYLISTS: SpotifyPlaylistDefinition[] = [
  // --- FLAGSHIPS & GLOBAL EDITORIAL ---
  {
    id: 'tth',
    name: "Today's Top Hits",
    desc: 'The biggest songs in the world right now. Global chart-toppers and cultural smashes.',
    category: 'flagship',
    gradient: 'from-blue-600 to-indigo-950',
    coverAccent: '#1e40af',
    followers: 34920000,
    curator: 'Spotify Editorial',
    minQuality: 65,
    minHype: 45
  },
  {
    id: 'nmf',
    name: 'New Music Friday',
    desc: 'The essential guide to this week’s best new music, updated every Friday.',
    category: 'flagship',
    gradient: 'from-rose-600 to-pink-950',
    coverAccent: '#be123c',
    followers: 4380000,
    curator: 'Spotify Editorial',
    minQuality: 45
  },
  {
    id: 'pr',
    name: 'Pop Rising',
    desc: 'The future of pop music starts here. Discover tomorrow’s chart-toppers today.',
    category: 'flagship',
    gradient: 'from-fuchsia-600 to-purple-950',
    coverAccent: '#a21caf',
    followers: 3190000,
    curator: 'Spotify Editorial',
    eligibleGenres: ['Pop', 'Dance Pop', 'Synthpop', 'Indie Pop', 'Latin Pop'],
    minQuality: 52
  },
  {
    id: 'rc',
    name: 'RapCaviar',
    desc: 'Music at the speed of culture. The world’s premiere hip-hop and trap destination.',
    category: 'flagship',
    gradient: 'from-emerald-600 to-teal-950',
    coverAccent: '#047857',
    followers: 16120000,
    curator: 'Spotify Editorial',
    eligibleGenres: ['Hip-Hop', 'Trap', 'Drill', 'R&B', 'East Coast', 'West Coast'],
    minQuality: 55
  },
  {
    id: 'v50',
    name: 'Viral 50 - Global',
    desc: 'The most shared, talked-about, and viral tracks across the globe right now.',
    category: 'flagship',
    gradient: 'from-cyan-600 to-sky-950',
    coverAccent: '#0369a1',
    followers: 2480000,
    curator: 'Spotify Viral',
    minQuality: 50
  },

  // --- MOODS & VIBES ---
  {
    id: 'chill_vibes',
    name: 'Chill Vibes',
    desc: 'Smooth melodies, easy rhythms, and laid-back grooves for peaceful unwinding.',
    category: 'mood',
    gradient: 'from-amber-600 to-stone-900',
    coverAccent: '#b45309',
    followers: 8940000,
    curator: 'Spotify Editorial',
    minQuality: 48
  },
  {
    id: 'workout_energy',
    name: 'Workout Energy',
    desc: 'High-BPM heavy hitters and adrenaline beats to push through your limits.',
    category: 'mood',
    gradient: 'from-orange-600 to-red-950',
    coverAccent: '#c2410c',
    followers: 7650000,
    curator: 'Spotify Editorial',
    minQuality: 50
  },
  {
    id: 'late_night',
    name: 'Late Night Drive',
    desc: 'Nocturnal synths, atmospheric basslines, and neon highways under city lights.',
    category: 'mood',
    gradient: 'from-violet-700 to-neutral-950',
    coverAccent: '#6d28d9',
    followers: 5980000,
    curator: 'Spotify Editorial',
    minQuality: 52
  },
  {
    id: 'feel_good',
    name: 'Feel-Good Indie',
    desc: 'Warm acoustic guitars, sunny choruses, and unapologetically good vibrations.',
    category: 'mood',
    gradient: 'from-yellow-600 to-emerald-950',
    coverAccent: '#ca8a04',
    followers: 5120000,
    curator: 'Spotify Editorial',
    minQuality: 50
  },
  {
    id: 'sad_hour',
    name: 'Sad Hour',
    desc: 'Intimate confessions, haunting harmonies, and songs for rainy afternoons.',
    category: 'mood',
    gradient: 'from-slate-600 to-blue-950',
    coverAccent: '#475569',
    followers: 6350000,
    curator: 'Spotify Editorial',
    minQuality: 48
  },
  {
    id: 'sunset_chill',
    name: 'Sunset Acoustic',
    desc: 'Golden-hour acoustic sessions, warm fingerpicking, and mellow vocal harmonies.',
    category: 'mood',
    gradient: 'from-amber-500 to-rose-950',
    coverAccent: '#d97706',
    followers: 4120000,
    curator: 'Spotify Editorial',
    minQuality: 45
  },

  // --- FOCUS & AMBIENT ---
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    desc: 'Calm atmospheric beats and clean instrumental textures to stay in the zone.',
    category: 'focus',
    gradient: 'from-teal-600 to-slate-950',
    coverAccent: '#0d9488',
    followers: 4720000,
    curator: 'Spotify Editorial',
    minQuality: 45
  },
  {
    id: 'peaceful_lofi',
    name: 'Peaceful Lo-Fi',
    desc: 'Cozy vinyl crackles, soft rhodes chords, and chill tape-warped loops.',
    category: 'focus',
    gradient: 'from-indigo-500 to-zinc-950',
    coverAccent: '#6366f1',
    followers: 3890000,
    curator: 'Spotify Editorial',
    minQuality: 42
  },

  // --- PARTY & HIGH ENERGY ---
  {
    id: 'club_hits',
    name: 'Club & Dance Anthems',
    desc: 'Peak-time festival bangers, floor-fillers, and hypnotic bass drops.',
    category: 'party',
    gradient: 'from-purple-600 to-pink-950',
    coverAccent: '#9333ea',
    followers: 5820000,
    curator: 'Spotify Editorial',
    minQuality: 52
  },
  {
    id: 'beast_mode',
    name: 'Beast Mode',
    desc: 'Aggressive rap, heavy kicks, and uncompromising gym motivation.',
    category: 'party',
    gradient: 'from-red-600 to-black',
    coverAccent: '#dc2626',
    followers: 6890000,
    curator: 'Spotify Editorial',
    minQuality: 54
  },

  // --- ALGORITHMIC & MADE FOR YOU ---
  {
    id: 'release_radar',
    name: 'Release Radar',
    desc: 'Your personalized mix of fresh new music from artists you follow.',
    category: 'algorithmic',
    gradient: 'from-teal-600 to-zinc-950',
    coverAccent: '#0d9488',
    followers: 20500000,
    curator: 'Spotify Algorithm'
  },
  {
    id: 'discover_weekly',
    name: 'Discover Weekly',
    desc: 'Your weekly mixtape of fresh music and underground gems tailored to your taste.',
    category: 'algorithmic',
    gradient: 'from-indigo-600 to-neutral-950',
    coverAccent: '#4f46e5',
    followers: 18100000,
    curator: 'Spotify Algorithm'
  },
  {
    id: 'daily_mix_1',
    name: 'Daily Mix 1',
    desc: 'Personalized radio blending your favorite hits with seamless algorithmic recommendations.',
    category: 'algorithmic',
    gradient: 'from-emerald-700 to-black',
    coverAccent: '#059669',
    followers: 14200000,
    curator: 'Spotify Algorithm'
  }
];

export interface TopArtistMonthlyItem {
  rank: number;
  name: string;
  avatar: string;
  monthlyListeners: number;
  formattedListeners: string;
  isPlayer: boolean;
  npcData?: DetailedNPC;
}

import { isNpcMatchingPlayerName } from './npcPlayerDeduplicationEngine';
import {
  getActiveSharedWorldRosterArtists,
  convertRosterArtistToDetailedNpc
} from './rosterSharedWorldBridge';
import { getEnsuredRecordLabelState } from './recordLabelSystemEngine';

/**
 * Computes authentic Top 1-20 Artists by monthly listeners on Spotify from real NPC releases, Roster Artists & Player
 */
export function computeTop10MonthlyArtists(state: GameState): TopArtistMonthlyItem[] {
  const list: { name: string; avatar: string; monthlyListeners: number; isPlayer: boolean; npcData?: DetailedNPC }[] = [];
  const playerName = state?.artist?.name || '';

  DETAILED_NPCS.forEach(n => {
    if (isNpcMatchingPlayerName(n.name, playerName)) return;

    const activeDailyStreams = (n.songs || []).reduce(
      (sum, s) => sum + (s.dailyStreams ?? Math.floor((s.streams || 0) / 28)),
      0
    );
    const activeListeners = Math.round(activeDailyStreams * 18);
    const catalogBaseListeners = Math.round(
      (n.pop * 620000) + (n.hype * 180000) + ((n.name.length * 412105) % 2500000)
    );
    const baseListeners = Math.max(catalogBaseListeners, activeListeners);

    list.push({
      name: n.name,
      avatar: n.avatar || n.image || '',
      monthlyListeners: baseListeners,
      isPlayer: false,
      npcData: n
    });
  });

  // Include Signed Record Label Roster Artists in the shared world
  const labelState = state ? getEnsuredRecordLabelState(state) : null;
  const imprintName = labelState?.imprint?.imprintName || 'Record Label';
  const dateStr = state?.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rosterArtists = getActiveSharedWorldRosterArtists(state);
  rosterArtists.forEach(rArt => {
    const detailed = convertRosterArtistToDetailedNpc(rArt, imprintName, dateStr);
    list.push({
      name: detailed.name,
      avatar: detailed.avatar,
      monthlyListeners: rArt.monthlyListeners || Math.round((rArt.dailyStreams || 5000) * 28),
      isPlayer: false,
      npcData: detailed
    });
  });

  if (state.artist && state.spotify) {
    list.push({
      name: state.artist.name,
      avatar: state.artist.image || '',
      monthlyListeners: state.spotify.listeners || 0,
      isPlayer: true
    });
  }

  list.sort((a, b) => b.monthlyListeners - a.monthlyListeners);

  return list.slice(0, 20).map((item, idx) => ({
    rank: idx + 1,
    name: item.name,
    avatar: item.avatar,
    monthlyListeners: item.monthlyListeners,
    formattedListeners: item.monthlyListeners.toLocaleString('en-US'),
    isPlayer: item.isPlayer,
    npcData: item.npcData
  }));
}

export interface DynamicOrganicPickupResult {
  updatedSongs: Song[];
  newPlacements: {
    songId: number;
    songTitle: string;
    playlistId: string;
    playlistName: string;
    reason: string;
  }[];
}

/**
 * Organically discovers and places player songs into multiple Spotify playlists
 * even if the player NEVER pitched!
 * Handles both singles and album cuts / B-sides.
 */
export function evaluateOrganicMultiPlaylistPickups(
  songs: Song[],
  artistPopularity: number,
  artistHype: number,
  currentDate: Date
): DynamicOrganicPickupResult {
  const newPlacements: DynamicOrganicPickupResult['newPlacements'] = [];

  const updatedSongs = songs.map(song => {
    if (song.status !== 'released') return song;

    const currentPlacements = new Set<string>(song.playlistPlacements || []);
    const initialCount = currentPlacements.size;

    const releaseDate = song.releaseDate ? new Date(song.releaseDate) : currentDate;
    const daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24)));
    const quality = song.quality || 50;
    const momentum = song.momentum || 1.0;
    const dailyStreams = song.dailyStreams || 0;
    const isSingle = !(song as any).parentProjectId || (song as any).role === 'single' || (song as any).role === 'lead_single' || song.trackType === 'single' || song.trackType === 'lead_single';

    // 1. ALL newly released tracks (singles & album cuts) AUTOMATICALLY get Release Radar
    // for active followers (Day 0 - Day 28)
    if (daysSinceRelease <= 28 && !currentPlacements.has('release_radar')) {
      currentPlacements.add('release_radar');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'release_radar',
        playlistName: 'Release Radar',
        reason: 'Automatically pushed to all followers and active listeners upon release.'
      });
    }

    // 2. Algorithmic Discover Weekly (After Day 7 if quality >= 48)
    if (daysSinceRelease >= 7 && daysSinceRelease <= 120 && quality >= 48 && !currentPlacements.has('discover_weekly')) {
      const hash = (song.id * 31 + currentDate.getDate()) % 100;
      if (hash < 50) {
        currentPlacements.add('discover_weekly');
        newPlacements.push({
          songId: song.id,
          songTitle: song.title,
          playlistId: 'discover_weekly',
          playlistName: 'Discover Weekly',
          reason: 'Algorithmic curation recommended this track to personalized listener feeds.'
        });
      }
    }

    // 3. Algorithmic Daily Mix 1 (Plays after release week based on momentum)
    if (daysSinceRelease >= 5 && momentum >= 0.40 && !currentPlacements.has('daily_mix_1')) {
      currentPlacements.add('daily_mix_1');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'daily_mix_1',
        playlistName: 'Daily Mix 1',
        reason: 'Algorithmic radio rotation based on listener repeat habits.'
      });
    }

    // 4. Multi-Mood Organic Placements
    // Real Spotify editorial adds tracks to 1-3 mood playlists matching genre/vibe
    const seed = (song.id * 19 + (song.title.charCodeAt(0) || 0) * 11) % 6;

    // A. Chill Vibes (Smooth, mellow quality cuts)
    if (quality >= 55 && !currentPlacements.has('chill_vibes') && (seed === 0 || seed === 1)) {
      currentPlacements.add('chill_vibes');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'chill_vibes',
        playlistName: 'Chill Vibes',
        reason: 'Organic placement by Spotify editorial for smooth mellow curation.'
      });
    }

    // B. Workout Energy or Beast Mode (High hype / intense beats)
    if ((artistHype >= 25 || quality >= 62) && seed === 2) {
      const plId = (song.genre === 'Hip-Hop' || song.genre === 'Trap') ? 'beast_mode' : 'workout_energy';
      const plName = plId === 'beast_mode' ? 'Beast Mode' : 'Workout Energy';
      if (!currentPlacements.has(plId)) {
        currentPlacements.add(plId);
        newPlacements.push({
          songId: song.id,
          songTitle: song.title,
          playlistId: plId,
          playlistName: plName,
          reason: `Selected organically by Spotify fitness curators for ${plName}.`
        });
      }
    }

    // C. Late Night Drive (Atmospheric nocturnal tracks)
    if (quality >= 56 && !currentPlacements.has('late_night') && seed === 3) {
      currentPlacements.add('late_night');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'late_night',
        playlistName: 'Late Night Drive',
        reason: 'Curated into Spotify nocturnal listening rotation.'
      });
    }

    // D. Feel-Good Indie or Sad Hour
    if (quality >= 58 && seed === 4) {
      const plId = song.id % 2 === 0 ? 'feel_good' : 'sad_hour';
      const plName = plId === 'feel_good' ? 'Feel-Good Indie' : 'Sad Hour';
      if (!currentPlacements.has(plId)) {
        currentPlacements.add(plId);
        newPlacements.push({
          songId: song.id,
          songTitle: song.title,
          playlistId: plId,
          playlistName: plName,
          reason: `Added organically to Spotify's ${plName} editorial shelf.`
        });
      }
    }

    // E. Sunset Acoustic or Deep Focus
    if (quality >= 52 && seed === 5) {
      const plId = song.genre === 'R&B' || song.genre === 'Pop' ? 'sunset_chill' : 'deep_focus';
      const plName = plId === 'sunset_chill' ? 'Sunset Acoustic' : 'Deep Focus';
      if (!currentPlacements.has(plId)) {
        currentPlacements.add(plId);
        newPlacements.push({
          songId: song.id,
          songTitle: song.title,
          playlistId: plId,
          playlistName: plName,
          reason: `Curated into Spotify's ${plName} rotation.`
        });
      }
    }

    // 5. Flagship Graduation (Organic Breakthroughs without pitch)
    // If a track picks up real traction from fans, Spotify editors naturally graduate it!

    // Pop Rising (Rising pop cuts)
    if (dailyStreams >= 65000 && momentum >= 0.65 && !currentPlacements.has('pr')) {
      currentPlacements.add('pr');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'pr',
        playlistName: 'Pop Rising',
        reason: 'Promoted by Spotify editors as a fast-rising breakout.'
      });
    }

    // RapCaviar (Hip-Hop cuts with momentum)
    if ((song.genre === 'Hip-Hop' || song.genre === 'Trap') && dailyStreams >= 85000 && momentum >= 0.70 && !currentPlacements.has('rc')) {
      currentPlacements.add('rc');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'rc',
        playlistName: 'RapCaviar',
        reason: 'Cultural traction earned this hip-hop track an organic RapCaviar spot.'
      });
    }

    // Viral 50 - Global (High streaming surge or buzz)
    if ((artistHype >= 40 || momentum >= 0.82) && dailyStreams >= 95000 && !currentPlacements.has('v50')) {
      currentPlacements.add('v50');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'v50',
        playlistName: 'Viral 50 - Global',
        reason: 'Rapid social & algorithmic velocity pushed this song onto Viral 50.'
      });
    }

    // Today's Top Hits (Mega smash threshold)
    if (dailyStreams >= 380000 && (artistPopularity >= 45 || momentum >= 0.88) && !currentPlacements.has('tth')) {
      currentPlacements.add('tth');
      newPlacements.push({
        songId: song.id,
        songTitle: song.title,
        playlistId: 'tth',
        playlistName: "Today's Top Hits",
        reason: 'Unstoppable numbers propelled this song to flagship placement on TTH!'
      });
    }

    if (currentPlacements.size > initialCount) {
      return {
        ...song,
        playlistPlacements: Array.from(currentPlacements)
      };
    }

    return song;
  });

  return { updatedSongs, newPlacements };
}

/**
 * Calculates balanced playlist stream reach with realistic rotational decay
 * Avoids perpetual flat multipliers and prevents cliffs
 */
export function calculateDynamicPlaylistMultiplier(
  playlistPlacements: string[] = [],
  daysSinceRelease: number
): number {
  if (!playlistPlacements || playlistPlacements.length === 0) {
    return 1.0;
  }

  // Weeks in playlist determines rotation position (Top 5 vs Middle vs Lower shelf)
  const weeksIn = Math.floor(daysSinceRelease / 7);
  const rotationDecay = Math.max(0.65, 1.0 - (weeksIn * 0.05)); // Soft 5% rotation taper per week, floors at 65%

  let combinedBoost = 0;

  playlistPlacements.forEach(pid => {
    if (pid === 'tth') combinedBoost += 0.38 * rotationDecay;
    else if (pid === 'nmf') combinedBoost += (weeksIn <= 1 ? 0.22 : 0.08); // NMF is fresh-week focused
    else if (pid === 'rc') combinedBoost += 0.25 * rotationDecay;
    else if (pid === 'pr') combinedBoost += 0.18 * rotationDecay;
    else if (pid === 'v50') combinedBoost += 0.22 * rotationDecay;
    else if (pid === 'release_radar') combinedBoost += (weeksIn <= 3 ? 0.18 : 0.06);
    else if (pid === 'discover_weekly') combinedBoost += 0.15;
    else if (pid === 'daily_mix_1') combinedBoost += 0.12;
    else {
      // Mood & thematic lists
      combinedBoost += 0.12 * rotationDecay;
    }
  });

  // Balanced multiplier: maximum +95% boost even with multiple playlists, avoiding runaway divides
  return Math.min(1.95, 1.0 + combinedBoost);
}
