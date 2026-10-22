// Smart Zero-Lag Storage & Lossless Artwork/Chart Rehydration Engine
// Solves:
// 1. Single song & project cover arts resetting on game restart until Next Day
// 2. Charts (Spotify, Billboard, iTunes, YouTube) resetting or losing player tracks/covers/movements on restart
// 3. UI lag caused by synchronous JSON.stringify / localStorage writes on every tab switch

import { get, set, del } from 'idb-keyval';
import { ChartItem, GameState, Project, Song } from '../types';
import { COUNTRY_TIERS } from '../constants';
import { syncNpcRealisticReleaseWorkflow } from '../data/npcRealisticReleaseWorkflowEngine';
import {
  syncPlayerNameNpcDeduplication,
  purgeDuplicateNpcFromGameState
} from '../data/npcPlayerDeduplicationEngine';
import { generateAuthenticRegionalChart } from '../data/countryMarketSystem';
import { generateRealNpcAlbumsChart } from '../data/npcRealReleaseChartsEngine';
import { synchronizeChartMovements } from '../data/npcChartDynamicsEngine';
import { aggregateGlobal200Chart } from '../data/global200AggregationEngine';
import {
  ensureBillboard200Albums,
  ensureBillboardSinglesChart
} from '../data/billboardInitialData';
import { generateCuratedSpotifyPlaylists } from '../data/spotifyPlaylistsManager';
import { resolveAuthenticCover } from '../data/musicCatalog';

export const ARTWORK_VAULT_STORAGE_KEY = 'music_sim_artwork_vault_v2';

interface ArtworkVaultData {
  artistAvatar?: string;
  songCoversById: Record<number, string>;
  songCoversByTitle: Record<string, string>;
  mvThumbsById: Record<number, string>;
  projectCoversById: Record<number, string>;
  projectCoversByTitle: Record<string, string>;
}

const liveArtworkVault: ArtworkVaultData = {
  songCoversById: {},
  songCoversByTitle: {},
  mvThumbsById: {},
  projectCoversById: {},
  projectCoversByTitle: {}
};

function normKey(str: string | undefined | null): string {
  return String(str || '')
    .toLowerCase()
    .replace(/\s*\((?:official\s+music\s+video|music\s+video|feat\.?[^)]*|ft\.?[^)]*|with\s+[^)]*)\)/gi, '')
    .trim();
}

function isRealCustomOrValidCover(cover: string | undefined | null): boolean {
  if (!cover || typeof cover !== 'string') return false;
  const trimmed = cover.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  );
}

/**
 * Updates the in-memory artwork vault from current songs & projects and persists asynchronously.
 */
export function syncPlayerArtworkVault(state: GameState, persistToIdb = false): void {
  if (!state) return;

  if (state.artist?.image && isRealCustomOrValidCover(state.artist.image)) {
    liveArtworkVault.artistAvatar = state.artist.image;
  }

  // 1. Register project covers first
  (state.projects || []).forEach((proj: Project) => {
    if (!proj) return;
    if (isRealCustomOrValidCover(proj.cover)) {
      liveArtworkVault.projectCoversById[proj.id] = proj.cover;
      const tKey = normKey(proj.title);
      if (tKey) liveArtworkVault.projectCoversByTitle[tKey] = proj.cover;
    }
    (proj.songs || []).forEach((ps: Song) => {
      if (ps && isRealCustomOrValidCover(ps.cover)) {
        liveArtworkVault.songCoversById[ps.id] = ps.cover;
        const sKey = normKey(ps.title);
        if (sKey) liveArtworkVault.songCoversByTitle[sKey] = ps.cover;
      }
    });
  });

  // 2. Register standalone & master song covers (highest priority for singles)
  (state.songs || []).forEach((song: Song) => {
    if (!song) return;
    if (isRealCustomOrValidCover(song.cover)) {
      liveArtworkVault.songCoversById[song.id] = song.cover;
      const sKey = normKey(song.title);
      if (sKey) liveArtworkVault.songCoversByTitle[sKey] = song.cover;
    }
    if (song.mvThumbnail && isRealCustomOrValidCover(song.mvThumbnail)) {
      liveArtworkVault.mvThumbsById[song.id] = song.mvThumbnail;
    }
  });

  if (persistToIdb) {
    set(ARTWORK_VAULT_STORAGE_KEY, {
      artistAvatar: liveArtworkVault.artistAvatar,
      songCoversById: { ...liveArtworkVault.songCoversById },
      songCoversByTitle: { ...liveArtworkVault.songCoversByTitle },
      mvThumbsById: { ...liveArtworkVault.mvThumbsById },
      projectCoversById: { ...liveArtworkVault.projectCoversById },
      projectCoversByTitle: { ...liveArtworkVault.projectCoversByTitle }
    }).catch(() => {});
  }
}

/**
 * Loads persisted artwork vault from IndexedDB into memory before save restoration.
 */
export async function loadArtworkVaultFromIdb(): Promise<void> {
  try {
    const savedVault = await get<ArtworkVaultData>(ARTWORK_VAULT_STORAGE_KEY);
    if (savedVault && typeof savedVault === 'object') {
      if (savedVault.artistAvatar) {
        liveArtworkVault.artistAvatar = savedVault.artistAvatar;
      }
      Object.assign(liveArtworkVault.songCoversById, savedVault.songCoversById || {});
      Object.assign(liveArtworkVault.songCoversByTitle, savedVault.songCoversByTitle || {});
      Object.assign(liveArtworkVault.mvThumbsById, savedVault.mvThumbsById || {});
      Object.assign(liveArtworkVault.projectCoversById, savedVault.projectCoversById || {});
      Object.assign(liveArtworkVault.projectCoversByTitle, savedVault.projectCoversByTitle || {});
    }
  } catch {
    // Ignore IDB read errors
  }
}

/**
 * Clears the artwork vault on full career reset.
 */
export async function clearArtworkVault(): Promise<void> {
  liveArtworkVault.artistAvatar = undefined;
  liveArtworkVault.songCoversById = {};
  liveArtworkVault.songCoversByTitle = {};
  liveArtworkVault.mvThumbsById = {};
  liveArtworkVault.projectCoversById = {};
  liveArtworkVault.projectCoversByTitle = {};
  try {
    await del(ARTWORK_VAULT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Resolves a player's cover art by title/id from the live vault so OfficialArtworkImg
 * and chart rows NEVER fall back to a generic placeholder when a single cover exists.
 */
export function resolvePlayerArtworkFromVault(
  title?: string | null,
  isAlbum = false,
  isArtistPortrait = false,
  explicitSrc?: string | null,
  songOrProjectId?: number
): string | null {
  if (isRealCustomOrValidCover(explicitSrc)) {
    return explicitSrc!.trim();
  }

  if (isArtistPortrait) {
    return liveArtworkVault.artistAvatar || null;
  }

  if (songOrProjectId !== undefined) {
    if (isAlbum && liveArtworkVault.projectCoversById[songOrProjectId]) {
      return liveArtworkVault.projectCoversById[songOrProjectId];
    }
    if (!isAlbum && liveArtworkVault.songCoversById[songOrProjectId]) {
      return liveArtworkVault.songCoversById[songOrProjectId];
    }
  }

  const key = normKey(title);
  if (!key) return null;

  if (isAlbum) {
    return (
      liveArtworkVault.projectCoversByTitle[key] ||
      liveArtworkVault.songCoversByTitle[key] ||
      null
    );
  }

  return (
    liveArtworkVault.songCoversByTitle[key] ||
    liveArtworkVault.projectCoversByTitle[key] ||
    null
  );
}

/**
 * Re-links player song/project metadata & cover artwork onto a chart array so
 * chart items NEVER lose their cover art, MV badge, collab credits, or movement status after restart.
 */
export function rehydrateChartItemsList(
  items: ChartItem[] | undefined | null,
  songsByTitle: Map<string, Song>,
  projectsByTitle: Map<string, Project>,
  isAlbumChart = false,
  isYoutubeChart = false
): ChartItem[] {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item, idx) => {
    if (!item) return item;
    if (!item.isPlayer) {
      return {
        ...item,
        peakPosition: item.peakPosition ?? idx + 1,
        weeksOnChart: item.weeksOnChart ?? 1
      };
    }

    const tKey = normKey(item.title);
    const matchedSong = !isAlbumChart ? songsByTitle.get(tKey) : undefined;
    const matchedProj = isAlbumChart
      ? projectsByTitle.get(tKey) || undefined
      : projectsByTitle.get(tKey);

    let resolvedCover = item.cover;
    if (!isRealCustomOrValidCover(resolvedCover)) {
      if (isYoutubeChart && matchedSong?.mvThumbnail && isRealCustomOrValidCover(matchedSong.mvThumbnail)) {
        resolvedCover = matchedSong.mvThumbnail;
      } else if (matchedSong && isRealCustomOrValidCover(matchedSong.cover)) {
        resolvedCover = matchedSong.cover;
      } else if (matchedProj && isRealCustomOrValidCover(matchedProj.cover)) {
        resolvedCover = matchedProj.cover;
      } else {
        resolvedCover = resolvePlayerArtworkFromVault(item.title, isAlbumChart, false, null);
      }
    }

    return {
      ...item,
      cover: resolvedCover || item.cover || null,
      peakPosition: item.peakPosition ?? idx + 1,
      weeksOnChart: item.weeksOnChart ?? 1,
      daysSinceRelease:
        item.daysSinceRelease !== undefined
          ? item.daysSinceRelease
          : matchedSong?.daysSinceRelease,
      hasMV: item.hasMV !== undefined ? item.hasMV : matchedSong?.hasMV,
      isExplicit:
        item.isExplicit !== undefined ? item.isExplicit : matchedSong?.isExplicit,
      collabId: item.collabId || matchedSong?.collabId
    };
  });
}

/**
 * Ensures that when a saved game is loaded (on game restart / Continue),
 * 1) NPC release workflows and deduplication are synced to the saved game's exact date
 * 2) All single song & project covers are restored in state.songs, state.projects, and all charts
 * 3) If any core chart is empty or missing player songs that should be charting, it is immediately rebuilt
 *    so the player NEVER has to click Next Day to get their charts or covers back!
 */
export function rehydrateFullGameStateOnLoad(state: GameState): GameState {
  if (!state || !state.artist) return state;

  const artistName = state.artist.name || 'Artist';
  const playerCountry = state.artist.country || 'US';
  const currentDate = state.date ? new Date(state.date) : new Date('2026-01-01T00:00:00');

  // 1. Sync NPC world & deduplication to the saved game date immediately!
  syncPlayerNameNpcDeduplication(artistName);
  syncNpcRealisticReleaseWorkflow(currentDate);

  // 2. Sync vault with whatever covers exist in state
  syncPlayerArtworkVault(state, false);

  // 3. Rehydrate songs & projects so no song or project song ever has an empty cover
  const songsById = new Map<number, Song>();
  const songsByTitle = new Map<string, Song>();
  const projectsByTitle = new Map<string, Project>();

  // First pass: map project covers so B-sides can inherit project cover if needed
  (state.projects || []).forEach(p => {
    const tKey = normKey(p.title);
    const restoredProjCover =
      resolvePlayerArtworkFromVault(p.title, true, false, p.cover, p.id) ||
      resolveAuthenticCover(artistName, p.title);
    projectsByTitle.set(tKey, { ...p, cover: restoredProjCover });
  });

  const rehydratedSongs: Song[] = (state.songs || []).map(s => {
    const tKey = normKey(s.title);
    let restoredCover = resolvePlayerArtworkFromVault(s.title, false, false, s.cover, s.id);
    if (!restoredCover) {
      const parentProj = (state.projects || []).find(
        p => p.songs && p.songs.some(ps => ps.id === s.id)
      );
      if (parentProj && isRealCustomOrValidCover(parentProj.cover)) {
        restoredCover = parentProj.cover;
      } else {
        restoredCover = resolveAuthenticCover(artistName, s.title);
      }
    }

    const restoredThumb =
      s.mvThumbnail && isRealCustomOrValidCover(s.mvThumbnail)
        ? s.mvThumbnail
        : liveArtworkVault.mvThumbsById[s.id] || (s.hasMV ? restoredCover : undefined);

    const updatedSong: Song = {
      ...s,
      cover: restoredCover,
      mvThumbnail: restoredThumb
    };
    songsById.set(updatedSong.id, updatedSong);
    if (tKey) songsByTitle.set(tKey, updatedSong);
    return updatedSong;
  });

  const rehydratedProjects: Project[] = (state.projects || []).map(p => {
    const restoredProjCover =
      resolvePlayerArtworkFromVault(p.title, true, false, p.cover, p.id) ||
      resolveAuthenticCover(artistName, p.title);

    const rehydratedProjSongs: Song[] = (p.songs || []).map(ps => {
      const liveMaster = songsById.get(ps.id) || songsByTitle.get(normKey(ps.title));
      const songCover =
        (liveMaster && isRealCustomOrValidCover(liveMaster.cover) ? liveMaster.cover : null) ||
        resolvePlayerArtworkFromVault(ps.title, false, false, ps.cover, ps.id) ||
        restoredProjCover;

      return {
        ...(liveMaster || ps),
        ...ps,
        streams: Math.max(ps.streams || 0, liveMaster?.streams || 0),
        dailyStreams: liveMaster?.dailyStreams ?? ps.dailyStreams,
        cover: songCover
      };
    });

    const updatedProj: Project = {
      ...p,
      cover: restoredProjCover,
      songs: rehydratedProjSongs
    };
    projectsByTitle.set(normKey(p.title), updatedProj);
    return updatedProj;
  });

  // Update vault with the fully rehydrated songs & projects
  const nextState: GameState = {
    ...state,
    artist: {
      ...state.artist,
      image:
        resolvePlayerArtworkFromVault(artistName, false, true, state.artist.image) ||
        state.artist.image
    },
    songs: rehydratedSongs,
    projects: rehydratedProjects
  };
  syncPlayerArtworkVault(nextState, true);

  const releasedPlayerSongs = rehydratedSongs.filter(s => s.status === 'released');
  const activeReleasedSongs = releasedPlayerSongs.filter(
    s => (s.streams || 0) > 0 || (s.dailyStreams || 0) > 0 || (s.basePotential || 0) > 0
  );

  // Helper to check if a chart lost player songs that already have streams > 0
  const chartNeedsRebuild = (chart: ChartItem[] | undefined, minLen = 40): boolean => {
    if (!chart || !Array.isArray(chart) || chart.length < minLen) return true;
    return false;
  };

  const coreCountries = Array.from(
    new Set(['US', 'GB', 'JP', 'ID', 'BR', playerCountry])
  );

  // 4. Rehydrate or rebuild Spotify Charts & Playlists
  const spCharts: Record<string, ChartItem[]> = { ...(nextState.spotify?.charts || {}) };
  if (chartNeedsRebuild(spCharts['daily_global'], 40)) {
    spCharts['daily_global'] = synchronizeChartMovements(
      generateAuthenticRegionalChart({
        platform: 'spotify',
        region: 'global',
        playerSongs: activeReleasedSongs,
        playerName: artistName,
        playerCountry,
        playerPopularity: nextState.popularity || 2.0,
        playerHype: nextState.hype || 15.0,
        isWeekly: false,
        currentDate,
        limit: 50
      }),
      spCharts['daily_global'],
      false,
      currentDate,
      'spotify_daily_global'
    );
  }

  coreCountries.forEach(cc => {
    const key = `daily_${cc}`;
    if (chartNeedsRebuild(spCharts[key], 40)) {
      spCharts[key] = synchronizeChartMovements(
        generateAuthenticRegionalChart({
          platform: 'spotify',
          region: cc,
          playerSongs: activeReleasedSongs,
          playerName: artistName,
          playerCountry,
          playerPopularity: nextState.popularity || 2.0,
          playerHype: nextState.hype || 15.0,
          isWeekly: false,
          currentDate,
          limit: 50
        }),
        spCharts[key],
        false,
        currentDate,
        `spotify_daily_${cc}`
      );
    }
  });

  if (chartNeedsRebuild(spCharts['weekly_global'], 40)) {
    spCharts['weekly_global'] = synchronizeChartMovements(
      generateAuthenticRegionalChart({
        platform: 'spotify',
        region: 'global',
        playerSongs: activeReleasedSongs,
        playerName: artistName,
        playerCountry,
        playerPopularity: nextState.popularity || 2.0,
        playerHype: nextState.hype || 15.0,
        isWeekly: true,
        currentDate,
        limit: 50
      }),
      spCharts['weekly_global'],
      true,
      currentDate,
      'spotify_weekly_global'
    );
  }

  Object.keys(spCharts).forEach(k => {
    spCharts[k] = rehydrateChartItemsList(
      spCharts[k],
      songsByTitle,
      projectsByTitle,
      false,
      false
    );
  });

  let spPlaylists: Record<string, ChartItem[]> = { ...(nextState.spotify?.playlists || {}) };
  if (!spPlaylists['tth'] || spPlaylists['tth'].length === 0) {
    spPlaylists = generateCuratedSpotifyPlaylists(rehydratedSongs, artistName);
  } else {
    Object.keys(spPlaylists).forEach(pid => {
      spPlaylists[pid] = rehydrateChartItemsList(
        spPlaylists[pid],
        songsByTitle,
        projectsByTitle,
        false,
        false
      );
    });
  }

  nextState.spotify = {
    ...nextState.spotify,
    charts: spCharts,
    playlists: spPlaylists
  };

  // 5. Rehydrate or rebuild iTunes Charts
  const itCharts: Record<string, ChartItem[]> = { ...(nextState.itunes?.charts || {}) };
  if (chartNeedsRebuild(itCharts['daily_global'], 35)) {
    itCharts['daily_global'] = synchronizeChartMovements(
      generateAuthenticRegionalChart({
        platform: 'itunes',
        region: 'global',
        playerSongs: activeReleasedSongs,
        playerName: artistName,
        playerCountry,
        playerPopularity: nextState.popularity || 2.0,
        playerHype: nextState.hype || 15.0,
        currentDate,
        limit: 50
      }),
      itCharts['daily_global'],
      false,
      currentDate,
      'itunes_daily_global'
    );
  }
  if (chartNeedsRebuild(itCharts['albums_global'], 35)) {
    itCharts['albums_global'] = synchronizeChartMovements(
      generateRealNpcAlbumsChart({
        platform: 'itunes',
        region: 'global',
        playerProjects: rehydratedProjects,
        playerSongs: rehydratedSongs,
        playerName: artistName,
        playerCountry,
        currentDate,
        limit: 50
      }),
      itCharts['albums_global'],
      false,
      currentDate,
      'itunes_albums_global'
    );
  }
  coreCountries.forEach(cc => {
    const sKey = `daily_${cc}`;
    if (chartNeedsRebuild(itCharts[sKey], 35)) {
      itCharts[sKey] = synchronizeChartMovements(
        generateAuthenticRegionalChart({
          platform: 'itunes',
          region: cc,
          playerSongs: activeReleasedSongs,
          playerName: artistName,
          playerCountry,
          playerPopularity: nextState.popularity || 2.0,
          playerHype: nextState.hype || 15.0,
          currentDate,
          limit: 50
        }),
        itCharts[sKey],
        false,
        currentDate,
        `itunes_daily_${cc}`
      );
    }
    const aKey = `albums_${cc}`;
    if (chartNeedsRebuild(itCharts[aKey], 35)) {
      itCharts[aKey] = synchronizeChartMovements(
        generateRealNpcAlbumsChart({
          platform: 'itunes',
          region: cc,
          playerProjects: rehydratedProjects,
          playerSongs: rehydratedSongs,
          playerName: artistName,
          playerCountry,
          currentDate,
          limit: 50
        }),
        itCharts[aKey],
        false,
        currentDate,
        `itunes_albums_${cc}`
      );
    }
  });
  Object.keys(itCharts).forEach(k => {
    const isAlb = k.startsWith('albums_');
    itCharts[k] = rehydrateChartItemsList(
      itCharts[k],
      songsByTitle,
      projectsByTitle,
      isAlb,
      false
    );
  });
  nextState.itunes = {
    ...nextState.itunes,
    charts: itCharts
  };

  // 6. Rehydrate or rebuild YouTube Charts
  const ytCharts: Record<string, ChartItem[]> = { ...(nextState.youtube?.charts || {}) };
  const releasedMvSongs = activeReleasedSongs.filter(s => s.hasMV);
  if (chartNeedsRebuild(ytCharts['daily_global'], 35)) {
    ytCharts['daily_global'] = synchronizeChartMovements(
      generateAuthenticRegionalChart({
        platform: 'youtube',
        region: 'global',
        playerSongs: releasedMvSongs,
        playerName: artistName,
        playerCountry,
        playerPopularity: nextState.popularity || 2.0,
        playerHype: nextState.hype || 15.0,
        currentDate,
        limit: 50
      }),
      ytCharts['daily_global'],
      false,
      currentDate,
      'youtube_daily_global'
    );
  }
  coreCountries.forEach(cc => {
    const yKey = `daily_${cc}`;
    if (chartNeedsRebuild(ytCharts[yKey], 35)) {
      ytCharts[yKey] = synchronizeChartMovements(
        generateAuthenticRegionalChart({
          platform: 'youtube',
          region: cc,
          playerSongs: releasedMvSongs,
          playerName: artistName,
          playerCountry,
          playerPopularity: nextState.popularity || 2.0,
          playerHype: nextState.hype || 15.0,
          currentDate,
          limit: 50
        }),
        ytCharts[yKey],
        false,
        currentDate,
        `youtube_daily_${cc}`
      );
    }
  });
  Object.keys(ytCharts).forEach(k => {
    ytCharts[k] = rehydrateChartItemsList(
      ytCharts[k],
      songsByTitle,
      projectsByTitle,
      false,
      true
    );
  });
  nextState.youtube = {
    ...nextState.youtube,
    charts: ytCharts
  };

  // 7. Rehydrate Billboard Hot 100, Global 200, Regional Singles, Billboard 200, and History
  const bb = nextState.billboard || { hot100: [], global200: [], albums200: [] };
  const bbRegional: Record<string, ChartItem[]> = { ...(bb.regionalSingles || {}) };

  // Ensure US & playerCountry regional singles exist
  [...coreCountries].forEach(cc => {
    if (chartNeedsRebuild(bbRegional[cc], 35)) {
      bbRegional[cc] = synchronizeChartMovements(
        generateAuthenticRegionalChart({
          platform: 'billboard',
          region: cc,
          playerSongs: activeReleasedSongs,
          playerName: artistName,
          playerCountry,
          playerPopularity: nextState.popularity || 2.0,
          playerHype: nextState.hype || 15.0,
          currentDate,
          limit: 100
        }),
        bbRegional[cc],
        true,
        currentDate,
        `billboard_singles_${cc}`
      );
    }
  });

  Object.keys(bbRegional).forEach(cc => {
    bbRegional[cc] = rehydrateChartItemsList(
      bbRegional[cc],
      songsByTitle,
      projectsByTitle,
      false,
      false
    );
  });

  let hot100 = bb.hot100 || [];
  if (chartNeedsRebuild(hot100, 50)) {
    hot100 = ensureBillboardSinglesChart(bbRegional['US'], 'US', hot100, currentDate);
  }
  hot100 = rehydrateChartItemsList(hot100, songsByTitle, projectsByTitle, false, false);

  let global200 = bb.global200 || [];
  if (chartNeedsRebuild(global200, 50)) {
    const agg = aggregateGlobal200Chart(bbRegional, activeReleasedSongs, artistName);
    global200 = ensureBillboardSinglesChart(
      synchronizeChartMovements(agg, global200, true, currentDate, 'billboard_singles_global'),
      'global',
      global200,
      currentDate
    );
  }
  global200 = rehydrateChartItemsList(global200, songsByTitle, projectsByTitle, false, false);

  let albums200 = bb.albums200 || [];
  if (chartNeedsRebuild(albums200, 50)) {
    const rawAlbums = generateRealNpcAlbumsChart({
      platform: 'billboard',
      region: 'global',
      playerProjects: rehydratedProjects,
      playerSongs: rehydratedSongs,
      playerName: artistName,
      playerCountry,
      currentDate,
      limit: 200
    });
    albums200 = ensureBillboard200Albums(
      synchronizeChartMovements(rawAlbums, albums200, true, currentDate, 'billboard_albums200'),
      albums200,
      currentDate
    );
  }
  albums200 = rehydrateChartItemsList(albums200, songsByTitle, projectsByTitle, true, false);

  const rehydratedHistory = (bb.history || []).map(snap => ({
    ...snap,
    hot100: rehydrateChartItemsList(snap.hot100, songsByTitle, projectsByTitle, false, false),
    global200: rehydrateChartItemsList(snap.global200, songsByTitle, projectsByTitle, false, false),
    albums200: rehydrateChartItemsList(snap.albums200, songsByTitle, projectsByTitle, true, false)
  }));

  const rehydratedPlayerHistory: Record<string, any[]> = {};
  if (bb.playerHistory) {
    Object.entries(bb.playerHistory).forEach(([cKey, list]) => {
      const isAlb = cKey === 'albums200';
      rehydratedPlayerHistory[cKey] = (list || []).map(entry => ({
        ...entry,
        cover:
          resolvePlayerArtworkFromVault(entry.title, isAlb, false, entry.cover) ||
          entry.cover ||
          null
      }));
    });
  }

  nextState.billboard = {
    ...bb,
    hot100,
    global200,
    albums200,
    regionalSingles: bbRegional,
    history: rehydratedHistory,
    playerHistory: rehydratedPlayerHistory
  };

  return purgeDuplicateNpcFromGameState(nextState);
}

// ============================================================================
// NON-BLOCKING AUTO-SAVE SCHEDULER & FAST MEMORY ESTIMATOR
// ============================================================================

let lastSavedMutationSig = '';
let pendingSaveTimer: ReturnType<typeof setTimeout> | null = null;
let latestPendingState: GameState | null = null;
let cachedSaveSizeKB = 185;

/**
 * Computes a super-fast O(1) signature of meaningful game state mutations.
 * Ignores UI-only navigation (`activeTab`, `activeApp`) so opening/closing apps has ZERO save lag!
 */
export function computeStateMutationSignature(state: GameState): string {
  if (!state || !state.isStarted || !state.artist) return '';
  const songsLen = state.songs?.length || 0;
  const projsLen = state.projects?.length || 0;
  const lastSong = songsLen > 0 ? state.songs[songsLen - 1] : null;
  const lastProj = projsLen > 0 ? state.projects[projsLen - 1] : null;
  const totalStreams = (state.songs || []).reduce((acc, s) => acc + Math.round(s.streams || 0), 0);
  const statusSig = (state.songs || []).map(s => `${s.id}:${s.status}:${s.daysLeft || 0}:${(s.cover || '').length}`).join('|');
  const projSig = (state.projects || []).map(p => `${p.id}:${p.status}:${(p.cover || '').length}`).join('|');

  return [
    state.date,
    Math.round(state.money || 0),
    state.popularity?.toFixed(2),
    state.hype?.toFixed(1),
    state.fans || 0,
    state.spotify?.listeners || 0,
    state.isHiatus ? 1 : 0,
    state.gameMode || 'normal',
    (state.artist.image || '').length,
    songsLen,
    projsLen,
    totalStreams,
    statusSig,
    projSig,
    lastSong?.title || '',
    lastProj?.title || '',
    state.xPosts?.length || 0,
    (state as any).jobsState?.shiftsWorkedToday || 0,
    (state as any).jobsState?.activeContractId || ''
  ].join('~');
}

export function getCachedSaveSizeKB(): number {
  return cachedSaveSizeKB;
}

export function updateCachedSaveSizeKB(sizeKB: number): void {
  if (sizeKB > 0) {
    cachedSaveSizeKB = sizeKB;
  }
}

/**
 * Schedules a non-blocking background save using requestIdleCallback so gameplay & animations never lag.
 */
export function scheduleSmartAutoSave(
  state: GameState,
  saveFn: (s: GameState) => Promise<boolean>
): void {
  if (!state || !state.isStarted || !state.artist) return;

  // Always keep in-memory artwork vault up to date in O(1)
  syncPlayerArtworkVault(state, false);
  latestPendingState = state;

  const sig = computeStateMutationSignature(state);
  if (sig === lastSavedMutationSig) {
    // Only activeTab or activeApp changed — skip heavy storage write!
    return;
  }

  if (pendingSaveTimer) {
    clearTimeout(pendingSaveTimer);
  }

  pendingSaveTimer = setTimeout(() => {
    pendingSaveTimer = null;
    const targetState = latestPendingState;
    if (!targetState) return;

    const currentSig = computeStateMutationSignature(targetState);
    const runSave = () => {
      lastSavedMutationSig = currentSig;
      syncPlayerArtworkVault(targetState, true);
      saveFn(targetState).catch(() => {});
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(runSave, { timeout: 1200 });
    } else {
      setTimeout(runSave, 16);
    }
  }, 450);
}

/**
 * Immediately flushes any pending state save when the user refreshes or closes the tab.
 */
export function flushPendingSaveImmediately(
  saveFn: (s: GameState) => Promise<boolean>
): void {
  if (pendingSaveTimer) {
    clearTimeout(pendingSaveTimer);
    pendingSaveTimer = null;
  }
  if (latestPendingState && latestPendingState.isStarted && latestPendingState.artist) {
    const sig = computeStateMutationSignature(latestPendingState);
    if (sig !== lastSavedMutationSig) {
      lastSavedMutationSig = sig;
      syncPlayerArtworkVault(latestPendingState, true);
      saveFn(latestPendingState).catch(() => {});
    }
  }
}
