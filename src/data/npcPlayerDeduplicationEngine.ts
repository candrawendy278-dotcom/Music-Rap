// Player vs. NPC Artist Name Deduplication Engine
// Automatically removes any NPC artist whose name matches the Player's artist name
// so there is never a duplicate artist in the directory, charts, playlists, or social feed.

import { NPCS } from '../constants';
import { ChartItem, GameState, NPC } from '../types';
import { DetailedNPC } from './npcAssets';
import { REAL_WORLD_NPCS, normalizeRealArtistName } from './realWorldArtistCatalog';

interface BackupRosterState {
  detailedNpcs: DetailedNPC[];
  baseNpcs: NPC[];
}

let backupRoster: BackupRosterState | null = null;
let currentDeduplicatedPlayerName: string = '';

function foldArtistNameForCompare(name: string): string {
  if (!name) return '';
  const normalized = normalizeRealArtistName(name.trim());
  return normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function rawFoldForCompare(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function ensureRosterBackupCaptured() {
  if (backupRoster) return;
  backupRoster = {
    detailedNpcs: REAL_WORLD_NPCS.map(n => ({
      ...n,
      songs: (n.songs || []).map(s => ({ ...s })),
      albums: (n.albums || []).map(a => ({
        ...a,
        tracks: a.tracks ? a.tracks.map(t => ({ ...t })) : undefined
      }))
    })),
    baseNpcs: NPCS.map(n => ({
      ...n,
      songs: n.songs ? n.songs.map(s => ({ ...s })) : undefined,
      albums: n.albums ? n.albums.map(a => ({ ...a })) : undefined
    }))
  };
}

/**
 * Checks if an artist name (including collaborations like "Bruno Mars & Lady Gaga")
 * matches the Player's artist name.
 */
export function isNpcMatchingPlayerName(
  candidateArtistName: string | undefined | null,
  playerArtistName?: string | null
): boolean {
  const activePlayer = (playerArtistName ?? currentDeduplicatedPlayerName ?? '').trim();
  if (!activePlayer || !candidateArtistName) return false;

  const targetFolded = foldArtistNameForCompare(activePlayer);
  const targetRawFolded = rawFoldForCompare(activePlayer);
  if (!targetFolded && !targetRawFolded) return false;

  const candFolded = foldArtistNameForCompare(candidateArtistName);
  const candRawFolded = rawFoldForCompare(candidateArtistName);

  if (
    (targetFolded && candFolded === targetFolded) ||
    (targetRawFolded && candRawFolded === targetRawFolded)
  ) {
    return true;
  }

  // Also check individual artists in a collaboration string
  const parts = String(candidateArtistName)
    .split(/\s*(?:&|,|feat\.?|ft\.?|with|x|\+|and|\/)\s*/i)
    .map(p => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const partFolded = foldArtistNameForCompare(part);
    const partRaw = rawFoldForCompare(part);
    if (
      (targetFolded && partFolded === targetFolded) ||
      (targetRawFolded && partRaw === targetRawFolded)
    ) {
      return true;
    }
  }

  return false;
}

import { getActiveSharedWorldRosterArtists } from './rosterSharedWorldBridge';
import { syncWorldNpcDeduplicationWithRoster } from './rosterLifecycleAndNpcDedupEngine';

/**
 * Synchronizes the global NPC arrays (`REAL_WORLD_NPCS` / `DETAILED_NPCS` and `NPCS`)
 * so that any NPC whose name matches `playerName` or any Active/Former Roster Artist is automatically removed.
 * If the player starts a new game with a different name or deletes a Former Roster Artist, previously removed NPCs are restored first.
 */
export function syncPlayerNameNpcDeduplication(playerName?: string | null): boolean {
  ensureRosterBackupCaptured();
  const cleanPlayer = (playerName || '').trim();
  currentDeduplicatedPlayerName = cleanPlayer;

  const rosterArtists = getActiveSharedWorldRosterArtists();
  syncWorldNpcDeduplicationWithRoster(cleanPlayer, rosterArtists);
  return true;
}

function filterChartArrayAgainstPlayer(
  chart: ChartItem[] | undefined,
  playerName: string
): ChartItem[] {
  if (!chart || !Array.isArray(chart)) return [];
  return chart.filter(item => {
    if (item.isPlayer) return true;
    return !isNpcMatchingPlayerName(item.artist, playerName);
  });
}

/**
 * Purges any duplicate NPC entries matching `state.artist?.name` from the entire `GameState`
 * (Billboard charts, Spotify charts & playlists, iTunes charts, YouTube charts, and X social posts).
 */
export function purgeDuplicateNpcFromGameState(state: GameState): GameState {
  const playerName = state.artist?.name?.trim() || '';
  syncPlayerNameNpcDeduplication(playerName);

  if (!playerName) return state;

  const nextState: GameState = { ...state };

  if (nextState.billboard) {
    const regionalSingles: Record<string, ChartItem[]> = {};
    if (nextState.billboard.regionalSingles) {
      for (const [cc, list] of Object.entries(nextState.billboard.regionalSingles)) {
        regionalSingles[cc] = filterChartArrayAgainstPlayer(list, playerName);
      }
    }
    nextState.billboard = {
      ...nextState.billboard,
      hot100: filterChartArrayAgainstPlayer(nextState.billboard.hot100, playerName),
      global200: filterChartArrayAgainstPlayer(nextState.billboard.global200, playerName),
      albums200: filterChartArrayAgainstPlayer(nextState.billboard.albums200, playerName),
      regionalSingles
    };
  }

  if (nextState.spotify) {
    const spCharts: Record<string, ChartItem[]> = {};
    if (nextState.spotify.charts) {
      for (const [k, list] of Object.entries(nextState.spotify.charts)) {
        spCharts[k] = filterChartArrayAgainstPlayer(list, playerName);
      }
    }
    const spPlaylists: Record<string, ChartItem[]> = {};
    if (nextState.spotify.playlists) {
      for (const [k, list] of Object.entries(nextState.spotify.playlists)) {
        spPlaylists[k] = filterChartArrayAgainstPlayer(list, playerName);
      }
    }
    nextState.spotify = {
      ...nextState.spotify,
      charts: spCharts,
      playlists: spPlaylists
    };
  }

  if (nextState.itunes && nextState.itunes.charts) {
    const itCharts: Record<string, ChartItem[]> = {};
    for (const [k, list] of Object.entries(nextState.itunes.charts)) {
      itCharts[k] = filterChartArrayAgainstPlayer(list, playerName);
    }
    nextState.itunes = {
      ...nextState.itunes,
      charts: itCharts
    };
  }

  if (nextState.youtube && nextState.youtube.charts) {
    const ytCharts: Record<string, ChartItem[]> = {};
    for (const [k, list] of Object.entries(nextState.youtube.charts)) {
      ytCharts[k] = filterChartArrayAgainstPlayer(list, playerName);
    }
    nextState.youtube = {
      ...nextState.youtube,
      charts: ytCharts
    };
  }

  if (nextState.xPosts && Array.isArray(nextState.xPosts)) {
    nextState.xPosts = nextState.xPosts.filter(post => {
      if ((post as any).isPlayer || (post as any).authorId === 'player') return true;
      return !isNpcMatchingPlayerName(post.authorName, playerName);
    });
  }

  return nextState;
}
