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

import {
  getActiveSharedWorldRosterArtists,
  syncActiveRosterArtistsToSharedWorld,
} from './rosterSharedWorldBridge';
import {
  extractArtistNameAndGroupVariants,
  isNpcSuppressedByPlayerOrRoster,
  normalizeArtistComparisonKey,
  syncWorldNpcDeduplicationWithRoster,
} from './rosterLifecycleAndNpcDedupEngine';
import { ImprintSignedArtist } from './recordLabelSystemEngine';

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

function filterChartArrayAgainstPlayerAndRoster(
  chart: ChartItem[] | undefined,
  playerName: string,
  rosterArtists: ImprintSignedArtist[]
): ChartItem[] {
  if (!chart || !Array.isArray(chart)) return [];

  // Map roster artist IDs and base stage names to their current formatted stageName (e.g. "JENNIE" -> "JENNIE of BLACKPINK")
  const rosterById = new Map<string, ImprintSignedArtist>();
  const rosterByBaseNorm = new Map<string, ImprintSignedArtist>();
  for (const art of rosterArtists) {
    if (!art) continue;
    if (art.id) rosterById.set(art.id, art);
    const variants = extractArtistNameAndGroupVariants(
      art.stageName || art.name,
      (art as any).groupName,
      (art as any).baseStageName
    );
    for (const v of variants) {
      const k = normalizeArtistComparisonKey(v);
      if (k && !(art as any).isGroupEntity) {
        rosterByBaseNorm.set(k, art);
      }
    }
  }

  const result: ChartItem[] = [];
  for (const item of chart) {
    if (!item) continue;
    if (item.isPlayer) {
      result.push(item);
      continue;
    }

    const isRosterItem =
      Boolean((item as any).isRosterArtist) ||
      Boolean((item as any).rosterArtistId) ||
      String(item.id || '').startsWith('roster_');

    if (isRosterItem) {
      const rId = (item as any).rosterArtistId;
      const matchedRoster =
        (rId && rosterById.get(rId)) ||
        rosterByBaseNorm.get(
          normalizeArtistComparisonKey((item as any).primaryArtist || item.artist)
        );
      if (matchedRoster) {
        const currentStage = matchedRoster.stageName || matchedRoster.name;
        const baseName = (matchedRoster as any).baseStageName;
        let updatedArtistCredit = item.artist;
        if (
          baseName &&
          currentStage &&
          currentStage !== baseName &&
          normalizeArtistComparisonKey(item.artist) ===
            normalizeArtistComparisonKey(baseName)
        ) {
          updatedArtistCredit = currentStage;
        }
        result.push({
          ...item,
          artist: updatedArtistCredit,
          primaryArtist: currentStage || (item as any).primaryArtist,
        } as any);
      } else {
        result.push(item);
      }
      continue;
    }

    // NPC item: filter out if it matches Player name OR any signed/former Roster Artist (including base solo name like "JENNIE" when Roster has "JENNIE of BLACKPINK")
    if (
      isNpcMatchingPlayerName(item.artist, playerName) ||
      isNpcSuppressedByPlayerOrRoster(item.artist, playerName, rosterArtists) ||
      isNpcSuppressedByPlayerOrRoster(
        (item as any).primaryArtist,
        playerName,
        rosterArtists
      )
    ) {
      continue;
    }

    result.push(item);
  }

  return result;
}

/**
 * Purges any duplicate NPC entries matching `state.artist?.name` OR any signed Roster Artist
 * (including grouped Roster Artists like "JENNIE of BLACKPINK" vs NPC "JENNIE") from the entire `GameState`
 * (Billboard charts, Spotify charts & playlists, iTunes charts, YouTube charts, and X social posts).
 */
export function purgeDuplicateNpcFromGameState(state: GameState): GameState {
  const playerName = state.artist?.name?.trim() || '';
  const sharedRoster = syncActiveRosterArtistsToSharedWorld(state);
  const rosterArtists: ImprintSignedArtist[] =
    state.recordLabelState?.imprint?.signedRoster || sharedRoster || [];

  syncWorldNpcDeduplicationWithRoster(playerName, rosterArtists);

  if (!playerName && rosterArtists.length === 0) return state;

  const nextState: GameState = { ...state };

  if (nextState.billboard) {
    const regionalSingles: Record<string, ChartItem[]> = {};
    if (nextState.billboard.regionalSingles) {
      for (const [cc, list] of Object.entries(nextState.billboard.regionalSingles)) {
        regionalSingles[cc] = filterChartArrayAgainstPlayerAndRoster(
          list,
          playerName,
          rosterArtists
        );
      }
    }
    nextState.billboard = {
      ...nextState.billboard,
      hot100: filterChartArrayAgainstPlayerAndRoster(
        nextState.billboard.hot100,
        playerName,
        rosterArtists
      ),
      global200: filterChartArrayAgainstPlayerAndRoster(
        nextState.billboard.global200,
        playerName,
        rosterArtists
      ),
      albums200: filterChartArrayAgainstPlayerAndRoster(
        nextState.billboard.albums200,
        playerName,
        rosterArtists
      ),
      regionalSingles,
    };
  }

  if (nextState.spotify) {
    const spCharts: Record<string, ChartItem[]> = {};
    if (nextState.spotify.charts) {
      for (const [k, list] of Object.entries(nextState.spotify.charts)) {
        spCharts[k] = filterChartArrayAgainstPlayerAndRoster(
          list,
          playerName,
          rosterArtists
        );
      }
    }
    const spPlaylists: Record<string, ChartItem[]> = {};
    if (nextState.spotify.playlists) {
      for (const [k, list] of Object.entries(nextState.spotify.playlists)) {
        spPlaylists[k] = filterChartArrayAgainstPlayerAndRoster(
          list,
          playerName,
          rosterArtists
        );
      }
    }
    nextState.spotify = {
      ...nextState.spotify,
      charts: spCharts,
      playlists: spPlaylists,
    };
  }

  if (nextState.itunes && nextState.itunes.charts) {
    const itCharts: Record<string, ChartItem[]> = {};
    for (const [k, list] of Object.entries(nextState.itunes.charts)) {
      itCharts[k] = filterChartArrayAgainstPlayerAndRoster(
        list,
        playerName,
        rosterArtists
      );
    }
    nextState.itunes = {
      ...nextState.itunes,
      charts: itCharts,
    };
  }

  if (nextState.youtube && nextState.youtube.charts) {
    const ytCharts: Record<string, ChartItem[]> = {};
    for (const [k, list] of Object.entries(nextState.youtube.charts)) {
      ytCharts[k] = filterChartArrayAgainstPlayerAndRoster(
        list,
        playerName,
        rosterArtists
      );
    }
    nextState.youtube = {
      ...nextState.youtube,
      charts: ytCharts,
    };
  }

  if (nextState.xPosts && Array.isArray(nextState.xPosts)) {
    nextState.xPosts = nextState.xPosts.filter((post) => {
      if (
        post.isPlayerPost ||
        (post as any).isPlayer ||
        (post as any).authorId === 'player' ||
        Boolean((post as any).rosterArtistId) ||
        String(post.id || '').startsWith('post-') ||
        String(post.id || '').startsWith('lbl_x_') ||
        String(post.id || '').startsWith('roster_')
      ) {
        return true;
      }
      return (
        !isNpcMatchingPlayerName(post.authorName, playerName) &&
        !isNpcSuppressedByPlayerOrRoster(post.authorName, playerName, rosterArtists)
      );
    });
  }

  return nextState;
}
