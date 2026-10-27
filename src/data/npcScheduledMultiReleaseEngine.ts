// Scheduled Multi-Release NPC Calendar Engine
// Implements realistic, staggered year-round NPC release schedules:
// 1. On New Game (dayOfYear === 0): Simultaneous baseline releases so all charts (Singles & Albums)
//    are populated immediately on Day 1.
// 2. Across the 365-Day Year: NPCs do NOT all drop on the same day. Each NPC follows a staggered
//    release calendar (Lead Single -> Pre-Release Single -> Album Countdown -> Full Album Drop)
//    and artists with larger real-world discographies (e.g. Taylor Swift, Post Malone, Drake, etc.)
//    roll out up to 3 album eras per year while preserving their full back-catalog in Discography.

import type { DetailedNPC, NpcAlbum, NpcSong } from './npcAssets';
import { resolveRealWorldCoverArt } from './realWorldArtistCatalog';
import {
  getAuthenticAlbumFullTracklist,
  type AuthenticAlbumTrackEntry
} from './npcAnnualReleaseCycleAndTracklistEngine';
import { getVerifiedOfficialReleaseCover } from './spotifyOfficialNpcPortraitsAndCovers';
import { getNpcLivingAttributes } from './npcLivingArtistAttributesAndMarketEngine';
import type {
  SimulatedNpcTrackState,
  NpcRolloutStepItem,
  NpcReleaseWorkflowType,
  NpcRolloutPhase,
  NpcWorkflowStatusSummary
} from './npcRealisticReleaseWorkflowEngine';

export interface ScheduledNpcDropEvent {
  npcId: string;
  npcName: string;
  npcAvatar: string;
  npcPop: number;
  releaseTitle: string;
  releaseType: 'single' | 'ep' | 'album';
  releaseDayOfYear: number;
  daysSinceRelease: number;
  dailyStreams: number;
  totalStreams: number;
  cover: string;
  parentAlbumTitle?: string;
}

export interface MultiCycleNpcMasterSnapshot {
  id: string;
  name: string;
  pop: number;
  hype: number;
  tier: number;
  masterAlbums: NpcAlbum[];
  masterSongs: NpcSong[];
}

// Registry of recent scheduled drops for X / News feed reporting
let recentScheduledDropsCache: ScheduledNpcDropEvent[] = [];

function hashSchedule(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function isIntroOrInterlude(title: string): boolean {
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

function normalizeMatch(title: string): string {
  return String(title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s*\((feat|ft|with|from)[^)]*\)/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Computes realistic daily streams for an NPC track on day `d` (1-indexed day since track release)
 * with organic front-loaded opening velocity, natural Week 1 cooldown, and longevity.
 */
export function computeStaggeredNpcDailyStreams(
  npcPop: number,
  npcHype: number,
  trackType: 'lead_single' | 'single' | 'b_side',
  trackIdx: number,
  daySinceRelease: number,
  trackSeed: number
): number {
  if (daySinceRelease <= 0) return 0;

  const popFactor = Math.pow(Math.max(25, npcPop) / 100, 2.75);
  const hypeBoost = 0.78 + (Math.max(20, npcHype) / 100) * 0.55;
  const basePeakDaily = Math.max(35000, Math.floor(3350000 * popFactor * hypeBoost));

  let roleWeight = 1.0;
  if (trackType === 'lead_single') {
    roleWeight = 1.22;
  } else if (trackType === 'single') {
    roleWeight = trackIdx <= 2 ? 0.92 : 0.78;
  } else {
    const bSideDecay = Math.pow(0.92, Math.max(0, trackIdx - 2));
    roleWeight = Math.max(0.20, 0.42 * bSideDecay);
  }

  const viralRoll = trackSeed % 100;
  const viralMult =
    viralRoll >= 92
      ? 1.48
      : viralRoll >= 75
      ? 1.2
      : viralRoll <= 12
      ? 0.74
      : 0.92 + (viralRoll % 25) / 100;

  // Original debut/opening levels with improved post-week-1 longevity (especially for B-sides)
  let lifecycleMult = 1.0;
  if (daySinceRelease === 1) {
    lifecycleMult = trackType === 'b_side' ? 1.18 : 1.26;
  } else if (daySinceRelease <= 7) {
    if (trackType === 'b_side') {
      lifecycleMult = Math.max(0.62, 1.15 - (daySinceRelease - 1) * 0.065);
    } else if (viralRoll >= 84) {
      // Viral riser during Week 1
      lifecycleMult = 1.12 + Math.sin((daySinceRelease / 7) * Math.PI) * 0.22;
    } else {
      // Natural post-debut settle
      lifecycleMult = Math.max(0.74, 1.06 - (daySinceRelease - 1) * 0.045);
    }
  } else if (daySinceRelease <= 28) {
    lifecycleMult =
      trackType === 'b_side'
        ? Math.max(0.38, 0.64 * Math.pow(0.972, daySinceRelease - 7))
        : Math.max(0.66, 0.88 * Math.pow(0.988, daySinceRelease - 7));
  } else if (daySinceRelease <= 90) {
    lifecycleMult =
      trackType === 'b_side'
        ? Math.max(0.24, 0.38 * Math.pow(0.992, daySinceRelease - 28))
        : Math.max(0.46, 0.72 * Math.pow(0.993, daySinceRelease - 28));
  } else {
    lifecycleMult = trackType === 'b_side' ? 0.20 : 0.38;
  }

  const dailyWave = 0.93 + (((trackSeed + daySinceRelease * 41) % 15) / 100);

  return Math.max(
    1200,
    Math.floor(basePeakDaily * roleWeight * viralMult * lifecycleMult * dailyWave)
  );
}

function simulateTrackAtDay(
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

  let cover = albumCover;
  if (trackType !== 'b_side') {
    const singleCover =
      getVerifiedOfficialReleaseCover(artistName, trackTitle, false, albumTitle) ||
      resolveRealWorldCoverArt(artistName, trackTitle, false);
    if (singleCover && !singleCover.startsWith('data:image/svg+xml')) {
      cover = singleCover;
    }
  }

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

  const seed = hashSchedule(`${artistName}::${trackTitle}`);
  const effectiveDaysTracked = daysSinceRelease + 1;
  const npcAttr = getNpcLivingAttributes(
    artistName,
    currentDayOfYear,
    daysSinceRelease <= 14
  );

  let totalStreams = 0;
  let weeklyStreams = 0;
  let lastDailyStreams = 0;

  for (let d = 1; d <= effectiveDaysTracked; d++) {
    const rawDaySt = computeStaggeredNpcDailyStreams(
      npcAttr.popularity,
      npcAttr.hype,
      trackType,
      trackIdx,
      d,
      seed
    );
    const daySt = Math.round(rawDaySt * npcAttr.streamSynergyMultiplier);
    totalStreams += daySt;
    if (d > effectiveDaysTracked - 7) {
      weeklyStreams += daySt;
    }
    if (d === effectiveDaysTracked) {
      lastDailyStreams = daySt;
    }
  }

  const salesRushMult =
    effectiveDaysTracked === 1
      ? 1.75
      : effectiveDaysTracked <= 7
      ? 1.22
      : 0.78;

  const effectiveStreamPool =
    lastDailyStreams <= 1_200_000
      ? lastDailyStreams
      : 1_200_000 + Math.pow(lastDailyStreams - 1_200_000, 0.78) * 16.5;

  const dailySales = Math.max(
    10,
    Math.floor(
      effectiveStreamPool *
        (trackType === 'lead_single' ? 0.00145 : trackType === 'single' ? 0.00105 : 0.00035) *
        salesRushMult *
        Math.min(1.45, Math.pow(npcAttr.salesSynergyMultiplier, 0.75))
    )
  );
  const totalSales = Math.max(
    dailySales,
    Math.floor(
      totalStreams *
        (trackType === 'lead_single' ? 0.0011 : trackType === 'single' ? 0.0008 : 0.00028) *
        Math.min(1.45, Math.pow(npcAttr.salesSynergyMultiplier, 0.75))
    )
  );
  const radio =
    trackType === 'b_side'
      ? 0
      : Math.min(
          98000,
          Math.floor(
            (npcAttr.popularity * 430 + lastDailyStreams * 0.019) *
              Math.min(1.0, effectiveDaysTracked / 12)
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

function selectSingleIndicesForTracklist(
  rawTracks: AuthenticAlbumTrackEntry[],
  masterHitNormSet: Set<string>
): number[] {
  const candidateIndices: number[] = [];

  rawTracks.forEach((trk, idx) => {
    if (!isIntroOrInterlude(trk.title) && masterHitNormSet.has(normalizeMatch(trk.title))) {
      candidateIndices.push(idx);
    }
  });
  rawTracks.forEach((trk, idx) => {
    if (
      !candidateIndices.includes(idx) &&
      !isIntroOrInterlude(trk.title) &&
      (trk.trackType === 'lead_single' || trk.trackType === 'single')
    ) {
      candidateIndices.push(idx);
    }
  });
  rawTracks.forEach((trk, idx) => {
    if (
      candidateIndices.length < 4 &&
      !candidateIndices.includes(idx) &&
      !isIntroOrInterlude(trk.title)
    ) {
      candidateIndices.push(idx);
    }
  });
  if (candidateIndices.length === 0 && rawTracks.length > 0) {
    candidateIndices.push(0);
  }
  return candidateIndices;
}

function resolveProjectByIndex(
  npcName: string,
  master: MultiCycleNpcMasterSnapshot,
  albumIdx: number,
  fallbackCover: string
): {
  title: string;
  cover: string;
  projectType: 'album' | 'ep';
  tracks: AuthenticAlbumTrackEntry[];
} {
  const chosen = master.masterAlbums[albumIdx % master.masterAlbums.length];
  const verifiedCover = getVerifiedOfficialReleaseCover(npcName, chosen.title, true);
  const resolvedCover =
    verifiedCover || resolveRealWorldCoverArt(npcName, chosen.title, true);
  const cover =
    resolvedCover && !resolvedCover.startsWith('data:image/svg+xml')
      ? resolvedCover
      : chosen.cover || fallbackCover;

  const fullTracks = getAuthenticAlbumFullTracklist(
    npcName,
    chosen.title,
    master.pop,
    master.masterSongs
  );
  return {
    title: chosen.title,
    cover,
    projectType: fullTracks.length <= 7 ? 'ep' : 'album',
    tracks: fullTracks
  };
}

function buildSimulatedAlbumObject(
  title: string,
  cover: string,
  year: number,
  daysOut: number,
  simTracks: SimulatedNpcTrackState[]
): NpcAlbum {
  const totalStreams = simTracks.reduce((sum, t) => sum + t.streams, 0);
  const dailyStreams = simTracks.reduce((sum, t) => sum + t.dailyStreams, 0);
  const weeklyStreams = simTracks.reduce((sum, t) => sum + t.weeklyStreams, 0);
  const totalSales = simTracks.reduce((sum, t) => sum + t.sales, 0);
  const dailySales = simTracks.reduce((sum, t) => sum + t.dailySales, 0);
  const debutAlbumBoost = daysOut === 0 ? 1.55 : daysOut <= 3 ? 1.22 : 0.85;
  const albumDailyPureSales = Math.max(
    25,
    Math.floor(
      (dailySales * 0.27 + Math.pow(Math.max(100, dailyStreams), 0.72) * 0.21) * debutAlbumBoost
    )
  );
  const albumTotalPureSales = Math.max(
    albumDailyPureSales,
    Math.floor(totalSales * 0.25 + Math.pow(Math.max(100, totalStreams), 0.74) * 0.24)
  );

  return {
    title,
    cover,
    sales: albumTotalPureSales,
    dailySales: albumDailyPureSales,
    weeklySales: albumDailyPureSales * Math.min(7, Math.max(1, daysOut + 1)),
    streams: totalStreams,
    dailyStreams,
    weeklyStreams,
    daysSinceRelease: daysOut,
    year,
    tracks: simTracks.map(t => ({
      title: t.title,
      streams: t.streams,
      dailyStreams: t.dailyStreams,
      weeklyStreams: t.weeklyStreams,
      sales: t.sales,
      dailySales: t.dailySales,
      radio: t.radio,
      daysSinceRelease: t.daysSinceRelease,
      cover: t.cover,
      trackType: t.trackType
    }))
  };
}

/**
 * Executes the staggered multi-era annual release schedule for all NPCs.
 * - Every scheduled album era follows: Lead Single -> Pre-Release Single -> Fixed Album Release Day.
 * - While `leadSingleDay <= dayOfYear < albumReleaseDay`, the NPC's Upcoming Release Countdown
 *   counts down 1 day per turn and releases the exact album on `dayOfYear === albumReleaseDay`.
 * - Artists with 3+ real albums roll out up to 3 distinct albums per year AND keep their
 *   remaining real-world catalog albums in their Discography.
 */
export function buildStaggeredMultiReleaseForNpc(
  npc: DetailedNPC,
  master: MultiCycleNpcMasterSnapshot,
  npcIdx: number,
  gameYear: number,
  dayOfYear: number,
  dropsCollector: ScheduledNpcDropEvent[]
): NpcWorkflowStatusSummary {
  const totalRealAlbums = Math.max(1, master.masterAlbums.length);
  const yearOffset = Math.max(0, gameYear - 2026);
  const erasPerYear = totalRealAlbums >= 3 ? 3 : totalRealAlbums === 2 ? 2 : 1;
  const era1Idx = (yearOffset * erasPerYear) % totalRealAlbums;

  const project1 = resolveProjectByIndex(npc.name, master, era1Idx, '');
  const album1Title = project1.title;
  const album1Cover = project1.cover;
  const rawTracks1 = project1.tracks;

  const masterHitNormSet = new Set(
    (master.masterSongs || []).map(s => normalizeMatch(s.title)).filter(Boolean)
  );

  const singleIndices1 = selectSingleIndicesForTracklist(rawTracks1, masterHitNormSet);
  const singleOrderMap1 = new Map<number, number>();
  singleIndices1.slice(0, 4).forEach((tIdx, orderIdx) => {
    singleOrderMap1.set(tIdx, orderIdx + 1);
  });

  const scheduleHash = hashSchedule(`${npc.id}::${gameYear}::staggered_v2`);
  const workflowType: NpcReleaseWorkflowType =
    scheduleHash % 10 < 7 ? 'single_first_then_album' : 'simultaneous_album_and_single';

  // --- ERA 1 SCHEDULE (Lead Single on Day 0 -> Pre-Release Single -> Album Drop on Day 9..24) ---
  const leadSingle1Day = 0;
  const isDayZeroAlbumLaunch =
    workflowType === 'simultaneous_album_and_single' && npcIdx % 4 === 0;
  const secondSingle1Day = isDayZeroAlbumLaunch
    ? 0
    : 3 + ((scheduleHash + npcIdx * 3) % 6); // Day 3..8
  const album1ReleaseDay = isDayZeroAlbumLaunch
    ? 0
    : secondSingle1Day + 6 + ((scheduleHash + npcIdx * 7) % 11); // Day 9..24
  const postAlbumSingle1Day = album1ReleaseDay + 8 + (scheduleHash % 10);

  const isAlbum1Released = dayOfYear >= album1ReleaseDay;

  const simulatedTracks1: SimulatedNpcTrackState[] = rawTracks1.map((trk, idx) => {
    const ord = singleOrderMap1.get(idx) || 0;
    let role: 'lead_single' | 'single' | 'b_side' =
      ord === 1 ? 'lead_single' : ord >= 2 && ord <= 4 ? 'single' : 'b_side';

    let trackReleaseDay = album1ReleaseDay;
    if (ord === 1) {
      trackReleaseDay = leadSingle1Day;
    } else if (ord === 2) {
      trackReleaseDay = secondSingle1Day;
    } else if (ord === 3) {
      trackReleaseDay = album1ReleaseDay;
    } else if (ord === 4) {
      trackReleaseDay = album1ReleaseDay;
      if (dayOfYear < postAlbumSingle1Day) {
        role = 'b_side';
      }
    }

    return simulateTrackAtDay(
      npc.name,
      album1Title,
      trk.title,
      role,
      idx,
      master.pop,
      master.hype,
      trackReleaseDay,
      dayOfYear,
      album1Cover
    );
  });

  // --- ERA 2 SCHEDULE (2nd Real Album if totalRealAlbums >= 2, else Deluxe EP) ---
  const hasSecondRealAlbum = totalRealAlbums >= 2;
  const era2Idx = hasSecondRealAlbum ? (era1Idx + 1) % totalRealAlbums : era1Idx;
  const secondProject = hasSecondRealAlbum
    ? resolveProjectByIndex(npc.name, master, era2Idx, album1Cover)
    : {
        title: `${album1Title} (Deluxe EP)`,
        cover: album1Cover,
        projectType: 'ep' as const,
        tracks: rawTracks1.slice(0, 5).map((t, i) => ({
          title:
            i === 0
              ? `${t.title} (Extended Mix)`
              : i === 1
              ? `${t.title} (Live Session)`
              : t.title,
          streams: t.streams,
          trackType: (i <= 1 ? 'single' : 'b_side') as 'lead_single' | 'single' | 'b_side'
        }))
      };

  const era2LeadSingleDay = album1ReleaseDay + 5 + ((scheduleHash + npcIdx * 5) % 9);
  const era2SecondSingleDay = era2LeadSingleDay + 4 + (scheduleHash % 5);
  const era2ProjectReleaseDay = era2SecondSingleDay + 6 + ((scheduleHash >> 3) % 10);

  const singleIndices2 = selectSingleIndicesForTracklist(secondProject.tracks, masterHitNormSet);
  const singleOrderMap2 = new Map<number, number>();
  singleIndices2.slice(0, 3).forEach((tIdx, orderIdx) => {
    singleOrderMap2.set(tIdx, orderIdx + 1);
  });

  const isEra2ProjectReleased = dayOfYear >= era2ProjectReleaseDay;

  const simulatedTracks2: SimulatedNpcTrackState[] = secondProject.tracks.map((trk, idx) => {
    const ord = singleOrderMap2.get(idx) || 0;
    const role: 'lead_single' | 'single' | 'b_side' =
      ord === 1 ? 'lead_single' : ord === 2 || ord === 3 ? 'single' : 'b_side';

    let trackReleaseDay = era2ProjectReleaseDay;
    if (ord === 1) {
      trackReleaseDay = era2LeadSingleDay;
    } else if (ord === 2) {
      trackReleaseDay = era2SecondSingleDay;
    }

    return simulateTrackAtDay(
      npc.name,
      secondProject.title,
      trk.title,
      role,
      idx,
      master.pop,
      Math.min(99, master.hype + 3),
      trackReleaseDay,
      dayOfYear,
      secondProject.cover
    );
  });

  // --- ERA 3 SCHEDULE (3rd Real Studio Album in same year for artists with 3+ albums) ---
  const hasThirdRealAlbum = totalRealAlbums >= 3;
  const era3Idx = hasThirdRealAlbum ? (era1Idx + 2) % totalRealAlbums : era1Idx;
  const thirdProject = hasThirdRealAlbum
    ? resolveProjectByIndex(npc.name, master, era3Idx, album1Cover)
    : null;

  const era3LeadSingleDay = era2ProjectReleaseDay + 7 + ((scheduleHash + npcIdx * 11) % 10);
  const era3SecondSingleDay = era3LeadSingleDay + 4 + ((scheduleHash >> 2) % 5);
  const era3ProjectReleaseDay = era3SecondSingleDay + 6 + ((scheduleHash >> 4) % 10);
  const isEra3ProjectReleased = Boolean(thirdProject && dayOfYear >= era3ProjectReleaseDay);

  const singleIndices3 = thirdProject
    ? selectSingleIndicesForTracklist(thirdProject.tracks, masterHitNormSet)
    : [];
  const singleOrderMap3 = new Map<number, number>();
  singleIndices3.slice(0, 3).forEach((tIdx, orderIdx) => {
    singleOrderMap3.set(tIdx, orderIdx + 1);
  });

  const simulatedTracks3: SimulatedNpcTrackState[] = thirdProject
    ? thirdProject.tracks.map((trk, idx) => {
        const ord = singleOrderMap3.get(idx) || 0;
        const role: 'lead_single' | 'single' | 'b_side' =
          ord === 1 ? 'lead_single' : ord === 2 || ord === 3 ? 'single' : 'b_side';

        let trackReleaseDay = era3ProjectReleaseDay;
        if (ord === 1) {
          trackReleaseDay = era3LeadSingleDay;
        } else if (ord === 2) {
          trackReleaseDay = era3SecondSingleDay;
        }

        return simulateTrackAtDay(
          npc.name,
          thirdProject.title,
          trk.title,
          role,
          idx,
          master.pop,
          Math.min(99, master.hype + 5),
          trackReleaseDay,
          dayOfYear,
          thirdProject.cover
        );
      })
    : [];

  // Collect recently dropped singles/projects (released within the last 2 days) for X feed news!
  if (dayOfYear > 0) {
    [...simulatedTracks1, ...simulatedTracks2, ...simulatedTracks3].forEach(t => {
      if (
        t.isReleased &&
        (t.trackType === 'lead_single' || t.trackType === 'single') &&
        t.daysSinceRelease >= 0 &&
        t.daysSinceRelease <= 2
      ) {
        dropsCollector.push({
          npcId: npc.id,
          npcName: npc.name,
          npcAvatar: npc.avatar || npc.image || '',
          npcPop: master.pop,
          releaseTitle: t.title,
          releaseType: 'single',
          releaseDayOfYear: t.releaseDayOfYear,
          daysSinceRelease: t.daysSinceRelease,
          dailyStreams: t.dailyStreams,
          totalStreams: t.streams,
          cover: t.cover
        });
      }
    });

    if (isAlbum1Released && dayOfYear - album1ReleaseDay <= 2) {
      const alb1Daily = simulatedTracks1.reduce((s, t) => s + t.dailyStreams, 0);
      const alb1Total = simulatedTracks1.reduce((s, t) => s + t.streams, 0);
      dropsCollector.push({
        npcId: npc.id,
        npcName: npc.name,
        npcAvatar: npc.avatar || npc.image || '',
        npcPop: master.pop,
        releaseTitle: album1Title,
        releaseType: simulatedTracks1.length <= 7 ? 'ep' : 'album',
        releaseDayOfYear: album1ReleaseDay,
        daysSinceRelease: dayOfYear - album1ReleaseDay,
        dailyStreams: alb1Daily,
        totalStreams: alb1Total,
        cover: album1Cover
      });
    }

    if (isEra2ProjectReleased && dayOfYear - era2ProjectReleaseDay <= 2) {
      const alb2Daily = simulatedTracks2.reduce((s, t) => s + t.dailyStreams, 0);
      const alb2Total = simulatedTracks2.reduce((s, t) => s + t.streams, 0);
      dropsCollector.push({
        npcId: npc.id,
        npcName: npc.name,
        npcAvatar: npc.avatar || npc.image || '',
        npcPop: master.pop,
        releaseTitle: secondProject.title,
        releaseType: secondProject.projectType,
        releaseDayOfYear: era2ProjectReleaseDay,
        daysSinceRelease: dayOfYear - era2ProjectReleaseDay,
        dailyStreams: alb2Daily,
        totalStreams: alb2Total,
        cover: secondProject.cover
      });
    }

    if (thirdProject && isEra3ProjectReleased && dayOfYear - era3ProjectReleaseDay <= 2) {
      const alb3Daily = simulatedTracks3.reduce((s, t) => s + t.dailyStreams, 0);
      const alb3Total = simulatedTracks3.reduce((s, t) => s + t.streams, 0);
      dropsCollector.push({
        npcId: npc.id,
        npcName: npc.name,
        npcAvatar: npc.avatar || npc.image || '',
        npcPop: master.pop,
        releaseTitle: thirdProject.title,
        releaseType: thirdProject.projectType,
        releaseDayOfYear: era3ProjectReleaseDay,
        daysSinceRelease: dayOfYear - era3ProjectReleaseDay,
        dailyStreams: alb3Daily,
        totalStreams: alb3Total,
        cover: thirdProject.cover
      });
    }
  }

  // --- COMBINE ACTIVE SINGLES & ALBUMS ACROSS ERAS ---
  const combinedSimTracks = [...simulatedTracks3, ...simulatedTracks2, ...simulatedTracks1];
  const seenTrackTitles = new Set<string>();
  const deduplicatedTracks: SimulatedNpcTrackState[] = [];

  for (const t of combinedSimTracks) {
    if (!t.isReleased) continue;
    const key = normalizeMatch(t.title);
    if (!seenTrackTitles.has(key)) {
      seenTrackTitles.add(key);
      deduplicatedTracks.push(t);
    }
  }

  const releasedSingles = deduplicatedTracks
    .filter(t => t.trackType === 'lead_single' || t.trackType === 'single')
    .sort((a, b) => {
      if (a.daysSinceRelease <= 14 && b.daysSinceRelease > 14) return -1;
      if (b.daysSinceRelease <= 14 && a.daysSinceRelease > 14) return 1;
      return b.dailyStreams - a.dailyStreams;
    });

  const releasedBSides = deduplicatedTracks
    .filter(t => t.trackType === 'b_side')
    .sort((a, b) => b.dailyStreams - a.dailyStreams)
    .slice(0, 6);

  const finalActiveSongs = [...releasedSingles, ...releasedBSides];

  npc.songs = finalActiveSongs.map(trk => ({
    title: trk.title,
    streams: trk.streams,
    dailyStreams: trk.dailyStreams,
    weeklyStreams: trk.weeklyStreams,
    radio: trk.radio,
    sales: trk.sales,
    dailySales: trk.dailySales,
    daysSinceRelease: trk.daysSinceRelease,
    trackType: trk.trackType,
    cover: trk.cover
  }));

  // Build active albums list:
  // 1. Any current-year eras (Era 3, Era 2, Era 1) that have ALREADY released
  // 2. For artists with multiple real albums (e.g. Taylor Swift, Post Malone, Travis Scott, etc.),
  //    include all of their other real studio albums that are NOT currently waiting in an unreleased
  //    countdown of this year so their Discography displays their full real-world album catalog!
  const activeAlbums: NpcAlbum[] = [];
  const addedAlbumTitlesLower = new Set<string>();
  const unreleasedCurrentYearTitlesLower = new Set<string>();

  if (!isAlbum1Released) {
    unreleasedCurrentYearTitlesLower.add(album1Title.toLowerCase().trim());
  }
  if (hasSecondRealAlbum && !isEra2ProjectReleased) {
    unreleasedCurrentYearTitlesLower.add(secondProject.title.toLowerCase().trim());
  }
  if (thirdProject && !isEra3ProjectReleased) {
    unreleasedCurrentYearTitlesLower.add(thirdProject.title.toLowerCase().trim());
  }

  if (thirdProject && isEra3ProjectReleased) {
    const daysOut3 = Math.max(0, dayOfYear - era3ProjectReleaseDay);
    activeAlbums.push(
      buildSimulatedAlbumObject(
        thirdProject.title,
        thirdProject.cover,
        gameYear,
        daysOut3,
        simulatedTracks3
      )
    );
    addedAlbumTitlesLower.add(thirdProject.title.toLowerCase().trim());
  }

  if (isEra2ProjectReleased) {
    const daysOut2 = Math.max(0, dayOfYear - era2ProjectReleaseDay);
    activeAlbums.push(
      buildSimulatedAlbumObject(
        secondProject.title,
        secondProject.cover,
        gameYear,
        daysOut2,
        simulatedTracks2
      )
    );
    addedAlbumTitlesLower.add(secondProject.title.toLowerCase().trim());
  }

  let totalAlbum1Streams = 0;
  let dailyAlbum1Streams = 0;

  if (isAlbum1Released) {
    totalAlbum1Streams = simulatedTracks1.reduce((sum, t) => sum + t.streams, 0);
    dailyAlbum1Streams = simulatedTracks1.reduce((sum, t) => sum + t.dailyStreams, 0);
    const daysOut1 = Math.max(0, dayOfYear - album1ReleaseDay);
    activeAlbums.push(
      buildSimulatedAlbumObject(
        album1Title,
        album1Cover,
        gameYear,
        daysOut1,
        simulatedTracks1
      )
    );
    addedAlbumTitlesLower.add(album1Title.toLowerCase().trim());
  }

  // Include all other established real studio albums from the NPC's master catalog
  // that are not currently scheduled as an unreleased future drop in the current year.
  if (totalRealAlbums > 1) {
    let catalogYearOffset = 1;
    master.masterAlbums.forEach((catAlb, catIdx) => {
      const cleanTitleLower = catAlb.title.toLowerCase().trim();
      if (
        addedAlbumTitlesLower.has(cleanTitleLower) ||
        unreleasedCurrentYearTitlesLower.has(cleanTitleLower) ||
        cleanTitleLower.includes('(deluxe ep)')
      ) {
        return;
      }

      const resolvedProj = resolveProjectByIndex(npc.name, master, catIdx, album1Cover);
      const catSimTracks = resolvedProj.tracks.map((trk, idx) =>
        simulateTrackAtDay(
          npc.name,
          resolvedProj.title,
          trk.title,
          trk.trackType,
          idx,
          master.pop,
          master.hype,
          0,
          Math.max(14, dayOfYear + catalogYearOffset * 12),
          resolvedProj.cover
        )
      );

      const catAlbumObj = buildSimulatedAlbumObject(
        resolvedProj.title,
        resolvedProj.cover,
        Math.max(2017, gameYear - catalogYearOffset),
        dayOfYear + catalogYearOffset * 30,
        catSimTracks
      );
      activeAlbums.push(catAlbumObj);
      addedAlbumTitlesLower.add(cleanTitleLower);
      catalogYearOffset++;
    });
  }

  npc.albums = activeAlbums;

  // Build Rollout Steps across Era 1, Era 2, and Era 3
  const trk1 = simulatedTracks1[singleIndices1[0] ?? 0] || simulatedTracks1[0];
  const era2LeadTrk = simulatedTracks2[singleIndices2[0] ?? 0] || simulatedTracks2[0];
  const era3LeadTrk =
    thirdProject && simulatedTracks3.length > 0
      ? simulatedTracks3[singleIndices3[0] ?? 0] || simulatedTracks3[0]
      : null;

  const rolloutSteps: NpcRolloutStepItem[] = [
    {
      stepNumber: 1,
      roleLabel: 'Era 1 Lead Single',
      title: trk1?.title || album1Title,
      isAlbumStep: false,
      releaseDayOfYear: leadSingle1Day,
      isReleased: dayOfYear >= leadSingle1Day,
      daysRemaining: Math.max(0, leadSingle1Day - dayOfYear),
      streams: trk1?.streams || 0,
      dailyStreams: trk1?.dailyStreams || 0,
      cover: trk1?.cover || album1Cover
    },
    {
      stepNumber: 2,
      roleLabel: `Project #1 (${simulatedTracks1.length <= 7 ? 'EP' : 'Album'})`,
      title: album1Title,
      isAlbumStep: true,
      releaseDayOfYear: album1ReleaseDay,
      isReleased: isAlbum1Released,
      daysRemaining: Math.max(0, album1ReleaseDay - dayOfYear),
      streams: isAlbum1Released ? totalAlbum1Streams : 0,
      dailyStreams: isAlbum1Released ? dailyAlbum1Streams : 0,
      cover: album1Cover
    },
    {
      stepNumber: 3,
      roleLabel: 'Era 2 Lead Single',
      title: era2LeadTrk?.title || secondProject.title,
      isAlbumStep: false,
      releaseDayOfYear: era2LeadSingleDay,
      isReleased: dayOfYear >= era2LeadSingleDay,
      daysRemaining: Math.max(0, era2LeadSingleDay - dayOfYear),
      streams: dayOfYear >= era2LeadSingleDay ? era2LeadTrk?.streams || 0 : 0,
      dailyStreams: dayOfYear >= era2LeadSingleDay ? era2LeadTrk?.dailyStreams || 0 : 0,
      cover: era2LeadTrk?.cover || secondProject.cover
    },
    {
      stepNumber: 4,
      roleLabel: `Project #2 (${secondProject.projectType.toUpperCase()})`,
      title: secondProject.title,
      isAlbumStep: true,
      releaseDayOfYear: era2ProjectReleaseDay,
      isReleased: isEra2ProjectReleased,
      daysRemaining: Math.max(0, era2ProjectReleaseDay - dayOfYear),
      streams: isEra2ProjectReleased
        ? simulatedTracks2.reduce((s, t) => s + t.streams, 0)
        : 0,
      dailyStreams: isEra2ProjectReleased
        ? simulatedTracks2.reduce((s, t) => s + t.dailyStreams, 0)
        : 0,
      cover: secondProject.cover
    }
  ];

  if (thirdProject && era3LeadTrk) {
    rolloutSteps.push(
      {
        stepNumber: 5,
        roleLabel: 'Era 3 Lead Single',
        title: era3LeadTrk.title || thirdProject.title,
        isAlbumStep: false,
        releaseDayOfYear: era3LeadSingleDay,
        isReleased: dayOfYear >= era3LeadSingleDay,
        daysRemaining: Math.max(0, era3LeadSingleDay - dayOfYear),
        streams: dayOfYear >= era3LeadSingleDay ? era3LeadTrk.streams || 0 : 0,
        dailyStreams: dayOfYear >= era3LeadSingleDay ? era3LeadTrk.dailyStreams || 0 : 0,
        cover: era3LeadTrk.cover || thirdProject.cover
      },
      {
        stepNumber: 6,
        roleLabel: `Project #3 (${thirdProject.projectType.toUpperCase()})`,
        title: thirdProject.title,
        isAlbumStep: true,
        releaseDayOfYear: era3ProjectReleaseDay,
        isReleased: isEra3ProjectReleased,
        daysRemaining: Math.max(0, era3ProjectReleaseDay - dayOfYear),
        streams: isEra3ProjectReleased
          ? simulatedTracks3.reduce((s, t) => s + t.streams, 0)
          : 0,
        dailyStreams: isEra3ProjectReleased
          ? simulatedTracks3.reduce((s, t) => s + t.dailyStreams, 0)
          : 0,
        cover: thirdProject.cover
      }
    );
  }

  // Determine the currently active or next upcoming album tracks for countdown inspection
  let activeUpcomingTracks = simulatedTracks1;
  let nextAlbumReleaseDay = album1ReleaseDay;
  let currentEraTitle = album1Title;
  let currentEraCover = album1Cover;

  if (!isAlbum1Released) {
    activeUpcomingTracks = simulatedTracks1;
    nextAlbumReleaseDay = album1ReleaseDay;
    currentEraTitle = album1Title;
    currentEraCover = album1Cover;
  } else if (!isEra2ProjectReleased) {
    activeUpcomingTracks = simulatedTracks2;
    nextAlbumReleaseDay = era2ProjectReleaseDay;
    currentEraTitle = secondProject.title;
    currentEraCover = secondProject.cover;
  } else if (thirdProject && !isEra3ProjectReleased) {
    activeUpcomingTracks = simulatedTracks3;
    nextAlbumReleaseDay = era3ProjectReleaseDay;
    currentEraTitle = thirdProject.title;
    currentEraCover = thirdProject.cover;
  } else if (thirdProject && isEra3ProjectReleased) {
    activeUpcomingTracks = simulatedTracks3;
    nextAlbumReleaseDay = era3ProjectReleaseDay;
    currentEraTitle = thirdProject.title;
    currentEraCover = thirdProject.cover;
  } else {
    activeUpcomingTracks = simulatedTracks2;
    nextAlbumReleaseDay = era2ProjectReleaseDay;
    currentEraTitle = secondProject.title;
    currentEraCover = secondProject.cover;
  }

  let currentPhase: NpcRolloutPhase = 'album_released_phase';
  let phaseBadgeText = `Era "${currentEraTitle}" Active`;
  if (!isAlbum1Released) {
    currentPhase = 'lead_single_phase';
    phaseBadgeText = `Single Out • "${album1Title}" in ${Math.max(1, album1ReleaseDay - dayOfYear)}d`;
  } else if (!isEra2ProjectReleased) {
    currentPhase = 'second_single_phase';
    phaseBadgeText = `Era 2 Single Out • "${secondProject.title}" in ${Math.max(1, era2ProjectReleaseDay - dayOfYear)}d`;
  } else if (thirdProject && !isEra3ProjectReleased) {
    currentPhase = 'second_single_phase';
    phaseBadgeText = `Era 3 Single Out • "${thirdProject.title}" in ${Math.max(1, era3ProjectReleaseDay - dayOfYear)}d`;
  } else {
    currentPhase = 'post_album_single_phase';
    phaseBadgeText = `"${currentEraTitle}" Out Now`;
  }

  return {
    npcId: npc.id,
    npcName: npc.name,
    gameYear,
    dayOfYear,
    workflowType,
    workflowLabel: `${erasPerYear}-Project Staggered Annual Schedule`,
    workflowDescription: `Releases ${erasPerYear} full projects plus staggered pre-release singles across ${gameYear}.`,
    currentPhase,
    phaseBadgeText,
    eraAlbumTitle: currentEraTitle,
    eraAlbumCover: currentEraCover,
    isAlbumReleased:
      isAlbum1Released &&
      isEra2ProjectReleased &&
      (!thirdProject || isEra3ProjectReleased),
    albumReleaseDayOfYear: nextAlbumReleaseDay,
    daysUntilAlbumRelease: Math.max(0, nextAlbumReleaseDay - dayOfYear),
    releasedSinglesCount: releasedSingles.length,
    totalAlbumTracksCount:
      simulatedTracks1.length + simulatedTracks2.length + simulatedTracks3.length,
    rolloutSteps,
    upcomingAlbumTracks: activeUpcomingTracks
  };
}

export function setRecentScheduledNpcDrops(drops: ScheduledNpcDropEvent[]) {
  recentScheduledDropsCache = drops
    .sort((a, b) => b.dailyStreams - a.dailyStreams)
    .slice(0, 25);
}

export function getRecentScheduledNpcDrops(): ScheduledNpcDropEvent[] {
  return recentScheduledDropsCache;
}
