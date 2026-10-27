// Realistic NPC Release Workflow & Zero-Based Competitive Stream Engine
// Implements authentic real-world release rollouts for all 155+ NPC artists:
// 1. Workflow A ('single_first_then_album'): NPC releases Lead Single first (starting at 0 streams),
//    followed by a 2nd Pre-Release Single (starting at 0 streams), and then the Full Studio Album
//    (where pre-released singles keep their earned streams and all remaining album tracks start at 0 streams).
// 2. Workflow B ('simultaneous_album_and_single'): NPC releases the Full Studio Album and Singles
//    simultaneously on the same day, with all tracks and singles starting from 0 streams.
// 3. Every NPC release starts at 0 streams on release day and accumulates daily streams, sales,
//    and radio airplay organically day-by-day to compete fairly with the player.

import type { DetailedNPC, NpcAlbum, NpcSong } from './npcAssets';
import {
  REAL_WORLD_NPCS,
  resolveRealWorldCoverArt,
  normalizeRealArtistName
} from './realWorldArtistCatalog';
import {
  getAuthenticAlbumFullTracklist,
  type AuthenticAlbumTrackEntry
} from './npcAnnualReleaseCycleAndTracklistEngine';

export type NpcReleaseWorkflowType =
  | 'single_first_then_album'
  | 'simultaneous_album_and_single';

export type NpcRolloutPhase =
  | 'lead_single_phase'
  | 'second_single_phase'
  | 'album_released_phase'
  | 'post_album_single_phase';

export interface SimulatedNpcTrackState {
  title: string;
  trackType: 'lead_single' | 'single' | 'b_side';
  releaseDayOfYear: number;
  daysSinceRelease: number;
  isReleased: boolean;
  streams: number;
  dailyStreams: number;
  weeklyStreams: number;
  sales: number;
  dailySales: number;
  radio: number;
  cover: string;
}

export interface NpcRolloutStepItem {
  stepNumber: number;
  roleLabel: string;
  title: string;
  isAlbumStep: boolean;
  releaseDayOfYear: number;
  isReleased: boolean;
  daysRemaining: number;
  streams: number;
  dailyStreams: number;
  cover: string;
}

export interface NpcWorkflowStatusSummary {
  npcId: string;
  npcName: string;
  gameYear: number;
  dayOfYear: number;
  workflowType: NpcReleaseWorkflowType;
  workflowLabel: string;
  workflowDescription: string;
  currentPhase: NpcRolloutPhase;
  phaseBadgeText: string;
  eraAlbumTitle: string;
  eraAlbumCover: string;
  isAlbumReleased: boolean;
  albumReleaseDayOfYear: number;
  daysUntilAlbumRelease: number;
  releasedSinglesCount: number;
  totalAlbumTracksCount: number;
  rolloutSteps: NpcRolloutStepItem[];
  upcomingAlbumTracks: SimulatedNpcTrackState[];
}

interface NpcMasterCatalogSnapshot {
  id: string;
  name: string;
  pop: number;
  hype: number;
  tier: number;
  masterAlbums: NpcAlbum[];
  masterSongs: NpcSong[];
}

const masterNpcCatalogMap = new Map<string, NpcMasterCatalogSnapshot>();
let lastSyncedDateKey: string | null = null;
const npcWorkflowStatusMap = new Map<string, NpcWorkflowStatusSummary>();

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

import {
  REAL_WORLD_ALBUM_TRACKLISTS
} from './npcAnnualReleaseCycleAndTracklistEngine';
import { COMPLETE_REAL_WORLD_ALBUM_TRACKLISTS } from './completeAlbumTracklistRegistry';
import {
  getVerifiedOfficialReleaseCover,
  getVerifiedSpotifyNpcPortrait
} from './spotifyOfficialNpcPortraitsAndCovers';

function formatAlbumKeyTitle(rawAlbumTitle: string): string {
  return rawAlbumTitle
    .split(' ')
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function ensureMasterCatalogSnapshotCaptured() {
  if (masterNpcCatalogMap.size > 0) return;

  const combinedTracklistKeys = [
    ...Object.keys(REAL_WORLD_ALBUM_TRACKLISTS),
    ...Object.keys(COMPLETE_REAL_WORLD_ALBUM_TRACKLISTS)
  ];

  REAL_WORLD_NPCS.forEach(npc => {
    let orderedAlbums = [...(npc.albums || [])];
    const seenAlbumLower = new Set(orderedAlbums.map(a => a.title.toLowerCase().trim()));
    const prefix = `${npc.name.toLowerCase().trim()}::`;

    combinedTracklistKeys.forEach(fullKey => {
      if (fullKey.startsWith(prefix)) {
        const rawAlbTitle = fullKey.slice(prefix.length).trim();
        if (rawAlbTitle && !seenAlbumLower.has(rawAlbTitle)) {
          seenAlbumLower.add(rawAlbTitle);
          const cleanAlbTitle = formatAlbumKeyTitle(rawAlbTitle);
          const cover =
            getVerifiedOfficialReleaseCover(npc.name, cleanAlbTitle, true) ||
            resolveRealWorldCoverArt(npc.name, cleanAlbTitle, true);
          orderedAlbums.push({
            title: cleanAlbTitle,
            cover,
            sales: 450000,
            year: 2025
          });
        }
      }
    });

    if (npc.name === 'Taylor Swift') {
      const folkloreIdx = orderedAlbums.findIndex(
        a => a.title.toLowerCase() === 'folklore'
      );
      if (folkloreIdx > 0) {
        const [folkloreAlb] = orderedAlbums.splice(folkloreIdx, 1);
        orderedAlbums.unshift(folkloreAlb);
      }
    }

    const snapshot: NpcMasterCatalogSnapshot = {
      id: npc.id,
      name: npc.name,
      pop: npc.pop || 80,
      hype: npc.hype || 75,
      tier: npc.tier || 1,
      masterAlbums: orderedAlbums.map(a => ({ ...a })),
      masterSongs: (npc.songs || []).map(s => ({ ...s }))
    };

    masterNpcCatalogMap.set(npc.id, snapshot);
    masterNpcCatalogMap.set(npc.name.toLowerCase().trim(), snapshot);
  });
}

export function getMasterNpcCatalogSnapshot(
  npcNameOrId: string
): NpcMasterCatalogSnapshot | null {
  ensureMasterCatalogSnapshotCaptured();
  const clean = normalizeRealArtistName(npcNameOrId || '').toLowerCase().trim();
  return (
    masterNpcCatalogMap.get(npcNameOrId) ||
    masterNpcCatalogMap.get(clean) ||
    null
  );
}

function getDayOfYearZeroIndexed(date: Date): number {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const currentUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const diffMs = currentUtc.getTime() - startOfYear.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

/**
 * Computes realistic daily streams for a single day `d` (1-indexed day since track release)
 * with strong Lead Single, Single, and B-Side streaming velocity.
 */
function computeDailyStreamsForDay(
  npcPop: number,
  npcHype: number,
  trackType: 'lead_single' | 'single' | 'b_side',
  trackIdx: number,
  daySinceRelease: number,
  trackSeed: number
): number {
  if (daySinceRelease <= 0) return 0;

  const popFactor = Math.pow(Math.max(25, npcPop) / 100, 2.85);
  const hypeBoost = 0.75 + (Math.max(20, npcHype) / 100) * 0.55;
  const basePeakDaily = Math.max(38000, Math.floor(3250000 * popFactor * hypeBoost));

  let roleWeight = 1.0;
  if (trackType === 'lead_single') {
    roleWeight = 1.18;
  } else if (trackType === 'single') {
    roleWeight = trackIdx <= 2 ? 0.88 : 0.74;
  } else {
    const bSideDecay = Math.pow(0.92, Math.max(0, trackIdx - 2));
    roleWeight = Math.max(0.20, 0.42 * bSideDecay);
  }

  const viralRoll = trackSeed % 100;
  const viralMult =
    viralRoll >= 92
      ? 1.45
      : viralRoll >= 75
      ? 1.18
      : viralRoll <= 12
      ? 0.72
      : 0.92 + (viralRoll % 25) / 100;

  let lifecycleMult = 1.0;
  if (daySinceRelease === 1) {
    lifecycleMult = trackType === 'b_side' ? 1.15 : 1.05;
  } else if (daySinceRelease <= 7) {
    lifecycleMult =
      trackType === 'b_side'
        ? Math.max(0.62, 1.15 - (daySinceRelease - 1) * 0.065)
        : 1.12 + Math.sin((daySinceRelease / 7) * Math.PI) * 0.16;
  } else if (daySinceRelease <= 28) {
    lifecycleMult =
      trackType === 'b_side'
        ? Math.max(0.36, 0.62 * Math.pow(0.972, daySinceRelease - 7))
        : Math.max(0.76, 1.18 * Math.pow(0.988, daySinceRelease - 7));
  } else if (daySinceRelease <= 90) {
    lifecycleMult =
      trackType === 'b_side'
        ? Math.max(0.22, 0.36 * Math.pow(0.992, daySinceRelease - 28))
        : Math.max(0.46, 0.85 * Math.pow(0.992, daySinceRelease - 28));
  } else {
    lifecycleMult = trackType === 'b_side' ? 0.18 : 0.36;
  }

  const dailyWave = 0.94 + (((trackSeed + daySinceRelease * 37) % 13) / 100);

  return Math.max(
    1200,
    Math.floor(basePeakDaily * roleWeight * viralMult * lifecycleMult * dailyWave)
  );
}

function isIntroOrInterludeTitle(title: string): boolean {
  const norm = title.toLowerCase().trim();
  return (
    norm === 'intro' ||
    norm.startsWith('intro ') ||
    norm.includes('(intro)') ||
    norm.includes('interlude') ||
    norm.includes('(skit)') ||
    norm === 'outro' ||
    norm === 'mukadimah' ||
    norm === 'prelude'
  );
}

function normalizeTrackMatch(title: string): string {
  return String(title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s*\((feat|ft|with|from)[^)]*\)/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Simulates a single track's cumulative and daily metrics from its release day up to `currentDayOfYear`.
 * Tracks not yet released (`daysSinceRelease < 0`) have 0 streams.
 * Tracks that ARE released (`daysSinceRelease >= 0`) start with Day-1 opening streams on their release day (`daysSinceRelease === 0`)
 * and accumulate daily streams organically every day thereafter.
 */
function simulateTrackMetricsAtDay(
  artistName: string,
  albumTitle: string,
  trackTitle: string,
  trackType: 'lead_single' | 'single' | 'b_side',
  trackIdx: number,
  npcPop: number,
  npcHype: number,
  releaseDayOfYear: number,
  currentDayOfYear: number,
  albumCover: string
): SimulatedNpcTrackState {
  const daysSinceRelease = currentDayOfYear - releaseDayOfYear;

  // B-Side album cuts always use their parent studio album cover (authentic Spotify behavior).
  // Lead Singles & Singles use their official single cover (or parent album cover if identical).
  let cover = albumCover;
  if (trackType !== 'b_side') {
    const singleCover =
      getVerifiedOfficialReleaseCover(artistName, trackTitle, false, albumTitle) ||
      resolveRealWorldCoverArt(artistName, trackTitle, false);
    if (singleCover && !singleCover.startsWith('data:image/svg+xml')) {
      cover = singleCover;
    }
  }

  // Not released yet in the rollout schedule: 0 streams
  if (daysSinceRelease < 0) {
    return {
      title: trackTitle,
      trackType,
      releaseDayOfYear,
      daysSinceRelease: 0,
      isReleased: false,
      streams: 0,
      dailyStreams: 0,
      weeklyStreams: 0,
      sales: 0,
      dailySales: 0,
      radio: 0,
      cover
    };
  }

  const seed = hashString(`${artistName}::${trackTitle}`);
  // Effective tracking days: Day 0 (Release Day) counts as Day 1 (opening 24h velocity)
  const effectiveDaysTracked = daysSinceRelease + 1;
  let totalStreams = 0;
  let weeklyStreams = 0;
  let lastDailyStreams = 0;

  for (let d = 1; d <= effectiveDaysTracked; d++) {
    const daySt = computeDailyStreamsForDay(
      npcPop,
      npcHype,
      trackType,
      trackIdx,
      d,
      seed
    );
    totalStreams += daySt;
    if (d > effectiveDaysTracked - 7) {
      weeklyStreams += daySt;
    }
    if (d === effectiveDaysTracked) {
      lastDailyStreams = daySt;
    }
  }

  const dailySales = Math.max(
    10,
    Math.floor(lastDailyStreams * (trackType === 'lead_single' ? 0.0022 : 0.0014))
  );
  const totalSales = Math.max(
    dailySales,
    Math.floor(totalStreams * (trackType === 'lead_single' ? 0.0018 : 0.0011))
  );
  const radio =
    trackType === 'b_side'
      ? 0
      : Math.min(
          95000,
          Math.floor(
            (npcPop * 420 + lastDailyStreams * 0.018) *
              Math.min(1.0, effectiveDaysTracked / 14)
          )
        );

  return {
    title: trackTitle,
    trackType,
    releaseDayOfYear,
    daysSinceRelease,
    isReleased: true,
    streams: totalStreams,
    dailyStreams: lastDailyStreams,
    weeklyStreams,
    sales: totalSales,
    dailySales,
    radio,
    cover
  };
}

import {
  buildStaggeredMultiReleaseForNpc,
  setRecentScheduledNpcDrops,
  type ScheduledNpcDropEvent
} from './npcScheduledMultiReleaseEngine';
import { injectRivalCounterReleaseIntoNpcCatalog } from './rivalBeefSystemEngine';

/**
 * Synchronizes all 155+ NPCs' active releases, workflows, and stream counts
 * to the exact current game date (`currentDateInput`).
 */
export function syncNpcRealisticReleaseWorkflow(
  currentDateInput?: string | Date,
  force = false
): { yearChanged: boolean; activeYear: number; dayOfYear: number } {
  ensureMasterCatalogSnapshotCaptured();

  const parsedDate = currentDateInput
    ? typeof currentDateInput === 'string'
      ? new Date(currentDateInput)
      : currentDateInput
    : new Date('2026-01-01T00:00:00Z');

  const safeDate = Number.isNaN(parsedDate.getTime())
    ? new Date('2026-01-01T00:00:00Z')
    : parsedDate;

  const gameYear = safeDate.getUTCFullYear();
  const dayOfYear = getDayOfYearZeroIndexed(safeDate);
  const dateKey = `${gameYear}-${dayOfYear}`;

  if (!force && lastSyncedDateKey === dateKey) {
    injectRivalCounterReleaseIntoNpcCatalog();
    return { yearChanged: false, activeYear: gameYear, dayOfYear };
  }

  const prevYear = lastSyncedDateKey ? Number(lastSyncedDateKey.split('-')[0]) : null;
  lastSyncedDateKey = dateKey;

  const dropsCollector: ScheduledNpcDropEvent[] = [];

  REAL_WORLD_NPCS.forEach((npc, npcIdx) => {
    const master = masterNpcCatalogMap.get(npc.id);
    if (!master || master.masterAlbums.length === 0) return;

    // Ensure official Spotify profile portrait is always set on the NPC
    const officialPortrait = getVerifiedSpotifyNpcPortrait(npc.name);
    if (officialPortrait) {
      npc.avatar = officialPortrait;
      npc.image = officialPortrait;
    }

    const summary = buildStaggeredMultiReleaseForNpc(
      npc,
      master,
      npcIdx,
      gameYear,
      dayOfYear,
      dropsCollector
    );

    npcWorkflowStatusMap.set(npc.id, summary);
    npcWorkflowStatusMap.set(npc.name.toLowerCase(), summary);

    if (prevYear !== null && prevYear !== gameYear) {
      npc.hype = Math.min(99, Math.max(78, master.hype + ((npcIdx % 5) - 1)));
    }
  });

  setRecentScheduledNpcDrops(dropsCollector);
  injectRivalCounterReleaseIntoNpcCatalog();

  return {
    yearChanged: prevYear !== null && prevYear !== gameYear,
    activeYear: gameYear,
    dayOfYear
  };
}

/**
 * Retrieves the live rollout workflow summary for an NPC artist.
 */
export function getNpcWorkflowStatus(
  npcNameOrId: string,
  currentDateInput?: string | Date
): NpcWorkflowStatusSummary | null {
  if (currentDateInput) {
    syncNpcRealisticReleaseWorkflow(currentDateInput);
  }
  const clean = normalizeRealArtistName(npcNameOrId || '').toLowerCase();
  return (
    npcWorkflowStatusMap.get(npcNameOrId) ||
    npcWorkflowStatusMap.get(clean) ||
    null
  );
}
