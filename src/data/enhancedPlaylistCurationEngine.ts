// Enhanced Spotify Playlisting & Editorial Curation Engine
// Provides realistic playlist rank calculation (#1 Cover Star to #50),
// pre-pitch eligibility & acceptance probability telemetry, algorithmic waterfall progression,
// and detailed per-playlist daily stream contribution analytics.

import { GameState, Song } from '../types';
import {
  AUTHENTIC_SPOTIFY_PLAYLISTS,
  SpotifyPlaylistDefinition
} from './authenticSpotifyPlaylistSystem';
import { EXPANDED_SPOTIFY_PLAYLISTS } from './spotifyCatalogExpanded';
import { SPOTIFY_PLAYLISTS } from '../constants';

export interface PitchCriterionCheck {
  label: string;
  currentValue: string;
  targetValue: string;
  passed: boolean;
}

export interface SongPlaylistPitchPreview {
  songId: number;
  songTitle: string;
  playlistId: string;
  playlistName: string;
  alreadyPlaced: boolean;
  acceptanceChancePercent: number;
  estimatedEntryRank: number;
  estimatedDailyStreamBoost: number;
  tierLabel: 'Flagship Editorial' | 'Genre & Mood Editorial' | 'Viral & Algorithmic';
  verdictLabel: 'Strong Contender' | 'Competitive' | 'Long Shot' | 'Ineligible' | 'Active on Playlist';
  criteria: PitchCriterionCheck[];
  curatorNote: string;
}

export interface ActivePlaylistPlacementTelemetry {
  playlistId: string;
  playlistName: string;
  curator: string;
  category: string;
  gradient: string;
  coverAccent: string;
  followers: number;
  songId: number;
  songTitle: string;
  songCover: string;
  rank: number;
  isCoverStar: boolean;
  dailyStreamBoost: number;
  daysOnPlaylist: number;
  maxTenureDays: number;
  tenureHealthPercent: number;
  statusTag: 'COVER STAR' | 'POWER ROTATION' | 'CLIMBING' | 'STABLE' | 'EXPIRING SOON';
  playlistDef: SpotifyPlaylistDefinition;
}

const MAX_TENURE_BY_PLAYLIST: Record<string, number> = {
  nmf: 14,
  release_radar: 28,
  discover_weekly: 21,
  daily_mix_1: 45,
  v50: 35,
  pr: 42,
  rc: 56,
  tth: 70,
  chill_vibes: 60,
  workout_energy: 60,
  late_night: 60,
  feel_good: 60,
  sad_hour: 60,
  sunset_chill: 60,
  deep_focus: 90,
  peaceful_lofi: 90,
  club_hits: 50,
  beast_mode: 60
};

/**
 * Computes a realistic, merit-based rank (1 to 48) for a player's song inside a given playlist,
 * comparing the player's song momentum/streams/quality against NPC tracks in that playlist.
 */
export function computePlayerTrackPlaylistRank(
  song: Song,
  playlistId: string,
  npcScoresInPlaylist: number[],
  artistPopularity: number = 25
): number {
  const daily = song.dailyStreams || Math.round((song.streams || 0) / 14);
  const totalStreams = song.streams || 0;
  const quality = song.quality || 60;
  const momentum = song.momentum || 1.0;

  // Compute competitive editorial weight comparable to NPC sortWeight
  // Top NPCs have streams in the tens/hundreds of millions or pop*10000
  let editorialWeight =
    totalStreams * 0.55 +
    daily * 18 +
    quality * 120_000 +
    artistPopularity * 180_000 +
    momentum * 850_000;

  // New Music Friday & Release Radar prioritize fresh releases & high quality
  if (playlistId === 'nmf' || playlistId === 'release_radar') {
    editorialWeight += quality * 450_000 + artistPopularity * 350_000;
  }

  // Viral 50 prioritizes momentum and hype spikes
  if (playlistId === 'v50') {
    editorialWeight += momentum * 3_500_000 + daily * 30;
  }

  // Count how many NPC tracks beat this editorial weight
  let higherNpcCount = 0;
  for (const npcScore of npcScoresInPlaylist) {
    if (npcScore > editorialWeight) {
      higherNpcCount++;
    }
  }

  // Deterministic tie-breaker offset from song.id + playlistId
  const hash = (song.id * 13 + playlistId.charCodeAt(0) * 7) % 4;
  const rawRank = higherNpcCount + 1 + (higherNpcCount > 3 ? hash : 0);

  return Math.max(1, Math.min(48, rawRank));
}

/**
 * Evaluates a song's pre-pitch telemetry and acceptance probability for a specific playlist
 * so the player can see transparent requirements and odds before submitting a pitch.
 */
export function evaluateSongPitchPreview(
  song: Song,
  playlistId: string,
  state: GameState
): SongPlaylistPitchPreview {
  const pl =
    AUTHENTIC_SPOTIFY_PLAYLISTS.find(p => p.id === playlistId) ||
    EXPANDED_SPOTIFY_PLAYLISTS.find(p => p.id === playlistId) ||
    SPOTIFY_PLAYLISTS.find(p => p.id === playlistId);

  const playlistName = pl?.name || 'Editorial Playlist';
  const alreadyPlaced = Boolean(song.playlistPlacements?.includes(playlistId));

  const currentMs = new Date(state.date).getTime();
  const releaseMs = song.releaseDate ? new Date(song.releaseDate).getTime() : currentMs;
  const daysSinceRelease = Math.max(0, Math.floor((currentMs - releaseMs) / (1000 * 60 * 60 * 24)));

  const quality = Math.round(song.quality || 50);
  const pop = Math.round(state.popularity || 0);
  const hype = Math.round(state.hype || 0);
  const dailyStreams = song.dailyStreams || Math.round((song.streams || 0) / 14);
  const isBSide = song.trackType === 'b_side';
  const genreLower = (song.genre || '').toLowerCase();
  const subLower = (song.subgenre || '').toLowerCase();

  const criteria: PitchCriterionCheck[] = [];
  let chance = 50;
  let curatorNote = 'Curators evaluate production polish, audience retention, and genre fit.';
  let tierLabel: SongPlaylistPitchPreview['tierLabel'] = 'Genre & Mood Editorial';

  if (playlistId === 'tth') {
    tierLabel = 'Flagship Editorial';
    const singleOk = !isBSide || Boolean(song.hasMV);
    const popOk = pop >= 70;
    const qualOk = quality >= 80;
    const streamOk = dailyStreams >= 120_000 || pop >= 90;

    criteria.push(
      { label: 'Track Format', currentValue: isBSide ? 'B-Side' : 'Official Single', targetValue: 'Single / MV', passed: singleOk },
      { label: 'Artist Popularity', currentValue: `${pop}/100`, targetValue: '70+ Pop', passed: popOk },
      { label: 'Production Quality', currentValue: `${quality}/100`, targetValue: '80+ Quality', passed: qualOk },
      { label: 'Daily Velocity', currentValue: `${(dailyStreams / 1000).toFixed(0)}K/day`, targetValue: '120K+/day', passed: streamOk }
    );

    if (!singleOk || !popOk || !qualOk || !streamOk) {
      chance = 0;
      curatorNote = "Today's Top Hits strictly requires an active single with 80+ quality, 70+ popularity, and 120K+ daily streams.";
    } else {
      const score = quality * 0.45 + pop * 0.35 + hype * 0.2 + (song.hasMV ? 8 : 0) + (dailyStreams > 350_000 ? 10 : 0);
      chance = score >= 84 ? 68 : 22;
      curatorNote = 'Global flagship review: meets baseline requirements for Today’s Top Hits rotation.';
    }
  } else if (playlistId === 'rc') {
    tierLabel = 'Flagship Editorial';
    const isHipHop =
      genreLower.includes('rap') ||
      genreLower.includes('hip') ||
      genreLower.includes('trap') ||
      genreLower.includes('drill') ||
      genreLower.includes('r&b') ||
      subLower.includes('rap') ||
      subLower.includes('hip') ||
      subLower.includes('trap');
    const popOk = pop >= 45;
    const qualOk = quality >= 72;
    const score = quality * 0.5 + pop * 0.3 + hype * 0.2;
    const scoreOk = score >= 68;

    criteria.push(
      { label: 'Genre Alignment', currentValue: song.genre || 'Pop', targetValue: 'Hip-Hop / R&B', passed: isHipHop },
      { label: 'Street Footprint', currentValue: `${pop}/100`, targetValue: '45+ Pop', passed: popOk },
      { label: 'Track Quality', currentValue: `${quality}/100`, targetValue: '72+ Quality', passed: qualOk },
      { label: 'Editorial Index', currentValue: `${score.toFixed(0)} pts`, targetValue: '68+ pts', passed: scoreOk }
    );

    chance = isHipHop && popOk && qualOk && scoreOk ? 78 : 0;
    curatorNote = isHipHop
      ? 'RapCaviar editors prioritize hard-hitting production and strong urban buzz.'
      : 'Track genre does not match RapCaviar’s Hip-Hop/R&B editorial mandate.';
  } else if (playlistId === 'nmf') {
    tierLabel = 'Flagship Editorial';
    const freshOk = daysSinceRelease <= 14;
    const qualOk = quality >= 68;
    const popOk = pop >= 15;

    criteria.push(
      { label: 'Release Window', currentValue: `Day ${daysSinceRelease}`, targetValue: '≤ 14 Days', passed: freshOk },
      { label: 'Track Quality', currentValue: `${quality}/100`, targetValue: '68+ Quality', passed: qualOk },
      { label: 'Artist Footprint', currentValue: `${pop}/100`, targetValue: '15+ Pop', passed: popOk }
    );

    chance = freshOk && qualOk && popOk ? 88 : 0;
    curatorNote = freshOk
      ? 'Eligible for this week’s global New Music Friday editorial refresh.'
      : 'New Music Friday only accepts new releases within 14 days of drop.';
  } else if (playlistId === 'pr') {
    tierLabel = 'Flagship Editorial';
    const isPop =
      genreLower.includes('pop') ||
      genreLower.includes('dance') ||
      genreLower.includes('synth') ||
      genreLower.includes('disco') ||
      genreLower.includes('indie') ||
      genreLower.includes('r&b');
    const popOk = pop >= 25;
    const qualOk = quality >= 70;

    criteria.push(
      { label: 'Genre Fit', currentValue: song.genre || 'Pop', targetValue: 'Pop / Dance / Crossover', passed: isPop },
      { label: 'Artist Popularity', currentValue: `${pop}/100`, targetValue: '25+ Pop', passed: popOk },
      { label: 'Track Quality', currentValue: `${quality}/100`, targetValue: '70+ Quality', passed: qualOk }
    );

    chance = isPop && popOk && qualOk ? 82 : 0;
    curatorNote = 'Pop Rising spotlights fast-growing pop & crossover singles heading toward the Top 40.';
  } else if (playlistId === 'v50') {
    tierLabel = 'Viral & Algorithmic';
    const qualOk = quality >= 60;
    const viralOk = hype >= 35 || dailyStreams >= 35_000 || (song.momentum || 1) >= 1.15;

    criteria.push(
      { label: 'Track Quality', currentValue: `${quality}/100`, targetValue: '60+ Quality', passed: qualOk },
      { label: 'Viral Velocity', currentValue: `Hype ${hype} • ${(dailyStreams / 1000).toFixed(1)}K/d`, targetValue: '35+ Hype or 35K/d', passed: viralOk }
    );

    chance = qualOk && viralOk ? 85 : 0;
    curatorNote = 'Viral 50 tracks social velocity, share rate, and sudden streaming spikes.';
  } else {
    tierLabel =
      (pl as any)?.category === 'algorithmic' ? 'Viral & Algorithmic' : 'Genre & Mood Editorial';
    const qualTarget = playlistId === 'workout_energy' ? 65 : 60;
    const qualOk = quality >= qualTarget;
    const popOk = pop >= 10 || hype >= 15;

    criteria.push(
      { label: 'Production Quality', currentValue: `${quality}/100`, targetValue: `${qualTarget}+ Quality`, passed: qualOk },
      { label: 'Listener Engagement', currentValue: `Pop ${pop} / Hype ${hype}`, targetValue: '10+ Pop or 15+ Hype', passed: popOk }
    );

    chance = qualOk && popOk ? 84 : 0;
    curatorNote = `Curated for ${playlistName} listeners based on mood cohesion and completion rate.`;
  }

  if (alreadyPlaced) {
    chance = 100;
  }

  const baseDailyBoost =
    playlistId === 'tth'
      ? 52_000
      : playlistId === 'rc'
      ? 36_000
      : playlistId === 'nmf'
      ? 31_000
      : playlistId === 'v50'
      ? 33_000
      : playlistId === 'pr'
      ? 27_500
      : 16_500;

  const estimatedEntryRank = Math.max(
    1,
    Math.min(45, Math.round(42 - (quality * 0.22 + pop * 0.18)))
  );

  const posMultiplier = Math.max(0.45, 1.35 - (estimatedEntryRank - 1) * 0.025);
  const estimatedDailyStreamBoost = Math.round(baseDailyBoost * posMultiplier);

  let verdictLabel: SongPlaylistPitchPreview['verdictLabel'] = 'Ineligible';
  if (alreadyPlaced) verdictLabel = 'Active on Playlist';
  else if (chance >= 75) verdictLabel = 'Strong Contender';
  else if (chance >= 45) verdictLabel = 'Competitive';
  else if (chance > 0) verdictLabel = 'Long Shot';

  return {
    songId: song.id,
    songTitle: song.title,
    playlistId,
    playlistName,
    alreadyPlaced,
    acceptanceChancePercent: chance,
    estimatedEntryRank,
    estimatedDailyStreamBoost,
    tierLabel,
    verdictLabel,
    criteria,
    curatorNote
  };
}

/**
 * Builds complete active playlist telemetry for the player across all 18 Spotify playlists.
 */
export function buildPlayerPlaylistAnalytics(
  state: GameState,
  curatedMap: Record<string, any[]>
): {
  placements: ActivePlaylistPlacementTelemetry[];
  totalDailyPlaylistStreams: number;
  totalPlaylistReachFollowers: number;
  coverStarCount: number;
  flagshipPlacementCount: number;
} {
  const placements: ActivePlaylistPlacementTelemetry[] = [];
  let totalDailyPlaylistStreams = 0;
  let totalPlaylistReachFollowers = 0;
  let coverStarCount = 0;
  let flagshipPlacementCount = 0;
  const countedPlaylists = new Set<string>();

  const currentMs = new Date(state.date).getTime();

  AUTHENTIC_SPOTIFY_PLAYLISTS.forEach(pl => {
    const stateTracks = state.spotify?.playlists?.[pl.id];
    const tracks =
      stateTracks && stateTracks.length > 0 ? stateTracks : curatedMap[pl.id] || [];

    tracks.forEach((item: any, idx: number) => {
      if (!item.isPlayer) return;

      const matchingSong = state.songs.find(
        s => s.title.toLowerCase() === (item.title || '').toLowerCase()
      );
      if (!matchingSong) return;

      const rank = idx + 1;
      const isCoverStar = rank === 1;
      if (isCoverStar) coverStarCount++;
      if (pl.category === 'flagship') flagshipPlacementCount++;

      if (!countedPlaylists.has(pl.id)) {
        countedPlaylists.add(pl.id);
        totalPlaylistReachFollowers += pl.followers || 0;
      }

      const releaseMs = matchingSong.releaseDate
        ? new Date(matchingSong.releaseDate).getTime()
        : currentMs;
      const daysOnPlaylist = Math.max(
        1,
        Math.floor((currentMs - releaseMs) / (1000 * 60 * 60 * 24))
      );
      const maxTenureDays = MAX_TENURE_BY_PLAYLIST[pl.id] || 60;
      const tenureHealthPercent = Math.max(
        5,
        Math.min(100, Math.round(((maxTenureDays - daysOnPlaylist) / maxTenureDays) * 100))
      );

      const baseBoost =
        pl.id === 'tth'
          ? 54_000
          : pl.id === 'rc'
          ? 38_000
          : pl.id === 'nmf'
          ? 31_000
          : pl.id === 'v50'
          ? 33_000
          : pl.category === 'flagship'
          ? 27_000
          : pl.category === 'algorithmic'
          ? 18_500
          : 14_000;

      const rankFactor = isCoverStar
        ? 1.45
        : rank <= 5
        ? 1.25
        : rank <= 15
        ? 1.0
        : Math.max(0.4, 0.95 - (rank - 15) * 0.02);

      const dailyStreamBoost = Math.round(baseBoost * rankFactor);
      totalDailyPlaylistStreams += dailyStreamBoost;

      let statusTag: ActivePlaylistPlacementTelemetry['statusTag'] = 'STABLE';
      if (isCoverStar) statusTag = 'COVER STAR';
      else if (rank <= 10) statusTag = 'POWER ROTATION';
      else if ((matchingSong.momentum || 1) >= 1.15) statusTag = 'CLIMBING';
      else if (tenureHealthPercent <= 20) statusTag = 'EXPIRING SOON';

      placements.push({
        playlistId: pl.id,
        playlistName: pl.name,
        curator: pl.curator,
        category: pl.category,
        gradient: pl.gradient,
        coverAccent: pl.coverAccent,
        followers: pl.followers,
        songId: matchingSong.id,
        songTitle: matchingSong.title,
        songCover: matchingSong.cover,
        rank,
        isCoverStar,
        dailyStreamBoost,
        daysOnPlaylist,
        maxTenureDays,
        tenureHealthPercent,
        statusTag,
        playlistDef: pl
      });
    });
  });

  placements.sort((a, b) => {
    if (a.isCoverStar && !b.isCoverStar) return -1;
    if (!a.isCoverStar && b.isCoverStar) return 1;
    return b.dailyStreamBoost - a.dailyStreamBoost;
  });

  return {
    placements,
    totalDailyPlaylistStreams,
    totalPlaylistReachFollowers,
    coverStarCount,
    flagshipPlacementCount
  };
}
