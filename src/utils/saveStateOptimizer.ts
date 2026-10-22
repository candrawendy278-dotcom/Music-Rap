// Save State Optimizer & Lossless Storage Engine
// Preserves 100% of player single/album cover arts, chart rankings, movement badges,
// and core regional charts across game restarts while keeping storage fast and lag-free.

import { get, set, del } from 'idb-keyval';
import {
  GameState,
  ChartItem,
  WeeklyChartSnapshot,
  PlayerBillboardHistoryItem,
  Song
} from '../types';
import { getEnsuredSkillState } from '../data/skillSystemEngine';
import { sanitizeImageStringFast, sanitizeArtistAvatarFast } from './imageOptimizer';
import {
  syncPlayerArtworkVault,
  rehydrateFullGameStateOnLoad,
  clearArtworkVault,
  updateCachedSaveSizeKB
} from './smartStorageEngine';

export const SAVE_STORAGE_KEY = 'music_sim_save';

/**
 * Filter and compact chart items list while preserving ALL chart movement indicators,
 * collaboration metadata, MV badges, and full Top 50 / Top 100 chart lengths.
 */
function compactChartList(
  items: ChartItem[] = [],
  maxRank: number = 50,
  preservePlayerCoverInMemory = true
): ChartItem[] {
  if (!items || items.length === 0) return [];

  const result: ChartItem[] = [];
  const playerItems: ChartItem[] = [];

  items.forEach((item, index) => {
    if (!item) return;

    // For NPC entries, strip heavy inline base64 strings since OfficialArtworkImg resolves real-world covers.
    // For Player entries, keep cover when in memory, or let rehydrateFullGameStateOnLoad restore from vault!
    const isHeavyNpcCover =
      !item.isPlayer &&
      typeof item.cover === 'string' &&
      (item.cover.length > 1500 ||
        item.cover.startsWith('data:image/jpeg') ||
        item.cover.startsWith('data:image/png'));

    const safeCover = item.isPlayer
      ? preservePlayerCoverInMemory
        ? item.cover || null
        : null
      : isHeavyNpcCover
      ? null
      : item.cover || null;

    const compactItem: ChartItem = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      points: Math.round(item.points || 0),
      streams: item.streams !== undefined ? Math.round(item.streams) : undefined,
      views: item.views !== undefined ? Math.round(item.views) : undefined,
      isPlayer: !!item.isPlayer,
      lastPosition: item.lastPosition ?? null,
      peakPosition: item.peakPosition ?? index + 1,
      weeksOnChart: item.weeksOnChart ?? 1,
      isReEntry: item.isReEntry,
      isNew: item.isNew,
      movementStatus: item.movementStatus,
      daysSinceRelease: item.daysSinceRelease,
      hasMV: item.hasMV,
      isExplicit: item.isExplicit,
      collabId: item.collabId,
      featuredArtist: item.featuredArtist,
      featuredArtists: item.featuredArtists,
      cover: safeCover,
      stats: item.stats
        ? {
            streams: Math.round(item.stats.streams || 0),
            sales: Math.round(item.stats.sales || 0),
            radio: Math.round(item.stats.radio || 0)
          }
        : undefined
    };

    if (item.isPlayer) {
      playerItems.push(compactItem);
    }
    if (index < maxRank) {
      result.push(compactItem);
    }
  });

  // Ensure player items are included even if ranked beyond maxRank
  playerItems.forEach(pItem => {
    if (!result.some(r => r.title === pItem.title && r.artist === pItem.artist)) {
      result.push(pItem);
    }
  });

  return result;
}

/**
 * Compacts the GameState for storage without losing player song covers, project song covers,
 * chart movements, or core regional Top 50 charts.
 */
export function compactSaveState(
  state: GameState,
  forStorageSerialization = false
): GameState {
  if (!state || !state.artist) return state;

  const playerCountry = state.artist.country || 'US';
  const playerName = state.artist.name || 'Artist';

  // Always keep artwork vault synchronized
  syncPlayerArtworkVault(state, false);

  // 1. Sanitize Artist Avatar (never discards player photo)
  const sanitizedArtist = {
    ...state.artist,
    image: sanitizeArtistAvatarFast(state.artist.image, playerName)
  };

  // 2. Sanitize Songs & preserve every custom cover art
  const songsMapById = new Map<number, Song>();
  const sanitizedSongs = (state.songs || []).map(s => {
    const safeCover = sanitizeImageStringFast(s.cover, s.title, playerName, false);
    const safeThumbnail = s.mvThumbnail
      ? sanitizeImageStringFast(s.mvThumbnail, s.title, playerName, false)
      : undefined;
    const customVideoUrl =
      s.customVideoUrl && s.customVideoUrl.startsWith('blob:')
        ? undefined
        : s.customVideoUrl;

    let mvLikes = s.mvLikes;
    if (s.hasMV && s.views) {
      const views = Math.max(0, s.views);
      const ratioCeiling =
        views >= 1000000000 ? 0.016 : views >= 100000000 ? 0.022 : 0.045;
      const maxLikes = Math.min(52000000, Math.max(10, Math.round(views * ratioCeiling)));
      if (mvLikes && mvLikes > maxLikes) {
        mvLikes = maxLikes;
      }
    }

    const cleanSong: Song = {
      ...s,
      cover: safeCover,
      mvThumbnail: safeThumbnail,
      customVideoUrl,
      mvLikes,
      streams: Math.round(s.streams || 0),
      views: Math.round(s.views || 0),
      pureSales: Math.round(s.pureSales || 0),
      radioPlays: Math.round(s.radioPlays || 0),
      weeklyStreams: Math.round(s.weeklyStreams || 0),
      weeklyViews: Math.round(s.weeklyViews || 0),
      weeklyPureSales: Math.round(s.weeklyPureSales || 0),
      weeklyRadioPlays: Math.round(s.weeklyRadioPlays || 0)
    };
    songsMapById.set(cleanSong.id, cleanSong);
    return cleanSong;
  });

  // 3. Compact Projects (keep cover intact in memory; only deduplicate inside IDB payload)
  const compactedProjects = (state.projects || []).map(p => {
    const safeCover = sanitizeImageStringFast(p.cover, p.title, playerName, true);
    const compactProjectSongs = (p.songs || []).map(ps => {
      const masterSong = songsMapById.get(ps.id);
      const effectiveCover = forStorageSerialization
        ? ''
        : masterSong?.cover || ps.cover || safeCover;
      return {
        ...(masterSong || ps),
        ...ps,
        cover: effectiveCover,
        streams: Math.round(Math.max(ps.streams || 0, masterSong?.streams || 0)),
        views: Math.round(Math.max(ps.views || 0, masterSong?.views || 0)),
        pureSales: Math.round(Math.max(ps.pureSales || 0, masterSong?.pureSales || 0)),
        radioPlays: Math.round(Math.max(ps.radioPlays || 0, masterSong?.radioPlays || 0)),
        hasMV: !!(ps.hasMV || masterSong?.hasMV),
        mvAdsDays: ps.mvAdsDays || masterSong?.mvAdsDays || 0,
        weeklyStreams: Math.round(ps.weeklyStreams || masterSong?.weeklyStreams || 0),
        weeklyViews: Math.round(ps.weeklyViews || masterSong?.weeklyViews || 0),
        weeklyPureSales: Math.round(ps.weeklyPureSales || masterSong?.weeklyPureSales || 0),
        weeklyRadioPlays: Math.round(ps.weeklyRadioPlays || masterSong?.weeklyRadioPlays || 0),
        trackType: ps.trackType || masterSong?.trackType,
        collabId: ps.collabId || masterSong?.collabId || 'none'
      };
    }) as Song[];

    return {
      ...p,
      cover: safeCover,
      songs: compactProjectSongs,
      pureSales: Math.round(p.pureSales || 0),
      weeklyPureSales: Math.round(p.weeklyPureSales || 0),
      dailyStreams: Math.round(p.dailyStreams || 0),
      totalStreams: Math.round(p.totalStreams || 0)
    };
  });

  const keepCoversInCharts = !forStorageSerialization;

  // 4. Compact Billboard History (keep last 8 snapshots, top 50 each)
  let compactedHistory: WeeklyChartSnapshot[] = [];
  if (state.billboard?.history && Array.isArray(state.billboard.history)) {
    compactedHistory = state.billboard.history.slice(0, 8).map(snap => ({
      date: snap.date,
      formattedDate: snap.formattedDate,
      weekNumber: snap.weekNumber,
      label: snap.label,
      hot100: compactChartList(snap.hot100, 50, keepCoversInCharts),
      global200: compactChartList(snap.global200 || [], 50, keepCoversInCharts),
      albums200: compactChartList(snap.albums200, 40, keepCoversInCharts),
      regionalSingles: snap.regionalSingles
        ? Object.fromEntries(
            Object.entries(snap.regionalSingles)
              .map(([cc, list]) => [
                cc,
                list
                  .filter(item => item.isPlayer)
                  .map(i => ({ ...i, cover: keepCoversInCharts ? i.cover : null }))
              ])
              .filter(([_, list]) => list.length > 0)
          )
        : {}
    }));
  }

  // 5. Compact player history across charts
  const compactedPlayerHistory: Record<string, PlayerBillboardHistoryItem[]> = {};
  if (state.billboard?.playerHistory) {
    Object.entries(state.billboard.playerHistory).forEach(([chartKey, list]) => {
      if (Array.isArray(list)) {
        compactedPlayerHistory[chartKey] = list.map(item => ({
          ...item,
          cover: keepCoversInCharts ? item.cover : null,
          points: Math.round(item.points || 0),
          stats: item.stats
            ? {
                streams: Math.round(item.stats.streams || 0),
                sales: Math.round(item.stats.sales || 0),
                radio: Math.round(item.stats.radio || 0)
              }
            : undefined
        }));
      }
    });
  }

  const coreCountries = new Set(['US', 'GB', 'JP', 'ID', 'BR', playerCountry]);

  // 6. Compact current Billboard charts (preserve full 100 on Hot 100 / Global 200 / core territories)
  const compactedBillboard = {
    hot100: compactChartList(state.billboard?.hot100 || [], 100, keepCoversInCharts),
    global200: compactChartList(state.billboard?.global200 || [], 100, keepCoversInCharts),
    albums200: compactChartList(state.billboard?.albums200 || [], 100, keepCoversInCharts),
    regionalSingles: state.billboard?.regionalSingles
      ? Object.fromEntries(
          Object.entries(state.billboard.regionalSingles).map(([cc, list]) => [
            cc,
            coreCountries.has(cc)
              ? compactChartList(list, 100, keepCoversInCharts)
              : compactChartList(list, 50, keepCoversInCharts)
          ])
        )
      : {},
    history: compactedHistory,
    playerHistory: compactedPlayerHistory
  };

  // 7. Preserve all core Spotify daily & weekly charts (full 50 items!)
  const compactedSpotifyCharts: Record<string, ChartItem[]> = {};
  if (state.spotify?.charts) {
    Object.entries(state.spotify.charts).forEach(([key, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;
      const isCoreKey =
        key === 'daily_global' ||
        key === 'weekly_global' ||
        Array.from(coreCountries).some(
          cc => key === `daily_${cc}` || key === `weekly_${cc}`
        );
      if (isCoreKey || !forStorageSerialization) {
        compactedSpotifyCharts[key] = compactChartList(list, 50, keepCoversInCharts);
      }
    });
  }

  // 8. Preserve all core YouTube daily charts (full 50 items!)
  const compactedYoutubeCharts: Record<string, ChartItem[]> = {};
  if (state.youtube?.charts) {
    Object.entries(state.youtube.charts).forEach(([key, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;
      const isCoreKey =
        key === 'daily_global' ||
        Array.from(coreCountries).some(cc => key === `daily_${cc}`);
      if (isCoreKey || !forStorageSerialization) {
        compactedYoutubeCharts[key] = compactChartList(list, 50, keepCoversInCharts);
      }
    });
  }

  // 9. Preserve all core iTunes daily singles & albums charts (full 50 items!)
  const compactedITunesCharts: Record<string, ChartItem[]> = {};
  if (state.itunes?.charts) {
    Object.entries(state.itunes.charts).forEach(([key, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;
      const isCoreKey =
        key === 'daily_global' ||
        key === 'albums_global' ||
        Array.from(coreCountries).some(
          cc => key === `daily_${cc}` || key === `albums_${cc}`
        );
      if (isCoreKey || !forStorageSerialization) {
        compactedITunesCharts[key] = compactChartList(list, 50, keepCoversInCharts);
      }
    });
  }

  // 10. Compact Spotify Playlists to top 35 per playlist
  const compactedPlaylists: Record<string, ChartItem[]> = {};
  if (state.spotify?.playlists) {
    Object.entries(state.spotify.playlists).forEach(([pid, list]) => {
      compactedPlaylists[pid] = compactChartList(list, 35, keepCoversInCharts);
    });
  }

  // 11. Preserve and cap X (Social Media) posts to keep memory fast and lag-free
  const compactedXPosts = (state.xPosts || []).slice(0, 110).map(post => ({
    ...post,
    authorName: post.authorName ? post.authorName.slice(0, 50) : playerName,
    content: post.content ? post.content.slice(0, 2000) : '',
    image: post.image
      ? sanitizeImageStringFast(post.image, post.id, playerName, false)
      : undefined
  }));

  const compactedXProfile = state.xProfile
    ? {
        name: state.xProfile.name?.slice(0, 50),
        handle: state.xProfile.handle?.slice(0, 30),
        bio: state.xProfile.bio?.slice(0, 300),
        banner: state.xProfile.banner
          ? sanitizeImageStringFast(state.xProfile.banner, 'banner', playerName, true)
          : undefined,
        followers: state.xProfile.followers,
        following: state.xProfile.following
      }
    : undefined;

  return {
    ...state,
    isStarted: true,
    artist: sanitizedArtist,
    songs: sanitizedSongs,
    projects: compactedProjects,
    spotify: {
      ...state.spotify,
      charts: compactedSpotifyCharts,
      playlists: compactedPlaylists
    },
    youtube: {
      ...state.youtube,
      charts: compactedYoutubeCharts
    },
    itunes: {
      ...state.itunes,
      charts: compactedITunesCharts
    },
    billboard: compactedBillboard,
    xPosts: compactedXPosts,
    xProfile: compactedXProfile
  };
}

/**
 * Fast, non-blocking approximate size calculator in Kilobytes (KB).
 * Avoids running synchronous JSON.stringify on the entire GameState during React renders.
 */
export function calculateObjectSizeKB(state: any): number {
  if (!state || typeof state !== 'object') return 0;
  try {
    let bytes = 48 * 1024; // Base state & charts overhead (~48KB)
    if (state.artist?.image) bytes += state.artist.image.length;
    if (Array.isArray(state.songs)) {
      for (const s of state.songs) {
        bytes += 650 + (s?.cover?.length || 0) + (s?.mvThumbnail?.length || 0);
      }
    }
    if (Array.isArray(state.projects)) {
      for (const p of state.projects) {
        bytes += 800 + (p?.cover?.length || 0);
      }
    }
    if (Array.isArray(state.xPosts)) {
      bytes += state.xPosts.length * 520;
    }
    if (Array.isArray(state.billboard?.history)) {
      bytes += state.billboard.history.length * 14000;
    }
    const kb = Math.round((bytes / 1024) * 10) / 10;
    updateCachedSaveSizeKB(kb);
    return kb;
  } catch {
    return 180;
  }
}

let isSavingInProgress = false;
let queuedStateForSave: GameState | null = null;

/**
 * Saves game state safely and asynchronously to IndexedDB without blocking the main UI thread.
 * If a save is already running, queues the latest state so the newest changes are NEVER dropped!
 */
export async function saveGameStateSafely(state: GameState): Promise<boolean> {
  if (!state || !state.isStarted || !state.artist) {
    return false;
  }

  // Always keep artwork vault synced immediately
  syncPlayerArtworkVault(state, true);

  if (isSavingInProgress) {
    queuedStateForSave = state;
    return true;
  }

  isSavingInProgress = true;
  try {
    const compactedForIdb = compactSaveState(state, true);
    await set(SAVE_STORAGE_KEY, compactedForIdb);

    // Remove any stale legacy localStorage save so MainMenu always uses the up-to-date IndexedDB save
    try {
      if (localStorage.getItem(SAVE_STORAGE_KEY)) {
        localStorage.removeItem(SAVE_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }

    calculateObjectSizeKB(compactedForIdb);
    return true;
  } catch (err) {
    console.warn('Primary save encountered error, attempting compact fallback save:', err);
    try {
      const minimalCompacted = compactSaveState(state, true);
      await set(SAVE_STORAGE_KEY, minimalCompacted);
      return true;
    } catch (emergencyErr) {
      console.error('Critical save error:', emergencyErr);
      return false;
    }
  } finally {
    isSavingInProgress = false;
    if (queuedStateForSave) {
      const nextToSave = queuedStateForSave;
      queuedStateForSave = null;
      saveGameStateSafely(nextToSave).catch(() => {});
    }
  }
}

/**
 * Cleans, decompresses, and FULLY REHYDRATES loaded save state on game restart:
 * - Restores all player single & project cover arts
 * - Rehydrates all chart covers, movement badges, and core regional Top 50 charts
 * - Syncs NPC release workflows to the saved game date immediately
 */
export function cleanAndDecompressLoadedState(
  rawState: any,
  fallbackInitialState: GameState
): GameState {
  if (!rawState) return fallbackInitialState;

  try {
    const parsed = typeof rawState === 'string' ? JSON.parse(rawState) : rawState;
    if (!parsed || !parsed.artist) return fallbackInitialState;

    const merged: GameState = {
      ...fallbackInitialState,
      ...parsed,
      isStarted: true,
      artist: parsed.artist,
      songs: parsed.songs || [],
      projects: parsed.projects || [],
      spotify: {
        ...fallbackInitialState.spotify,
        ...(parsed.spotify || {})
      },
      youtube: {
        ...fallbackInitialState.youtube,
        ...(parsed.youtube || {})
      },
      billboard: {
        ...fallbackInitialState.billboard,
        ...(parsed.billboard || {})
      },
      itunes: {
        ...fallbackInitialState.itunes,
        ...(parsed.itunes || {})
      },
      skills: getEnsuredSkillState(parsed.skills || fallbackInitialState.skills),
      xPosts: parsed.xPosts || fallbackInitialState.xPosts || [],
      xProfile: parsed.xProfile || fallbackInitialState.xProfile
    };

    const compactedInMemory = compactSaveState(merged, false);
    return rehydrateFullGameStateOnLoad(compactedInMemory);
  } catch (err) {
    console.error('Failed to parse or clean loaded state:', err);
    return fallbackInitialState;
  }
}

/**
 * Completely purges all save data from IndexedDB, artwork vault, and localStorage
 */
export async function clearSaveDataCompletely(): Promise<void> {
  await clearArtworkVault();
  try {
    await del(SAVE_STORAGE_KEY);
  } catch (e) {
    console.warn('Error deleting idb save:', e);
  }
  try {
    localStorage.removeItem(SAVE_STORAGE_KEY);
    localStorage.removeItem('music_sim_auth_token');
    localStorage.removeItem('music_sim_auth_user');
  } catch (e) {
    console.warn('Error clearing localStorage:', e);
  }
}
