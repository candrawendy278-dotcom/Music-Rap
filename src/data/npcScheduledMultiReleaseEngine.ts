// Scheduled Multi-Release NPC Calendar Engine
// Implements realistic, staggered year-round NPC release schedules:
// 1. On New Game (dayOfYear === 0): Simultaneous baseline releases so all charts (Singles & Albums)
//    are populated immediately on Day 1.
// 2. Across the 365-Day Year: NPCs do NOT all drop on the same day. Each NPC follows a staggered
//    release calendar and actively drops up to 2 Projects (2 Studio Albums, or Album + EP) and
//    4-6 Singles across the year so the music industry feels alive every single week.

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

  // First-day and first-week sales rush for singles, scaled by NPC's dedicated Fans & Fan Engagement skill
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

/**
 * Resolves a second project (2nd Studio Album or EP) for the NPC's second annual release cycle
 * so every NPC can release 2 projects (Album/EP) + multiple singles in a year.
 */
function resolveSecondProjectForYear(
  npcName: string,
  master: MultiCycleNpcMasterSnapshot,
  era1Idx: number,
  era1AlbumTitle: string,
  era1Cover: string
): {
  title: string;
  cover: string;
  projectType: 'album' | 'ep';
  tracks: AuthenticAlbumTrackEntry[];
} {
  if (master.masterAlbums.length >= 2) {
    const era2Idx = (era1Idx + 1) % master.masterAlbums.length;
    const chosen2 = master.masterAlbums[era2Idx];
    const verifiedCover = getVerifiedOfficialReleaseCover(npcName, chosen2.title, true);
    const resolvedCover =
      verifiedCover || resolveRealWorldCoverArt(npcName, chosen2.title, true);
    const cover2 =
      resolvedCover && !resolvedCover.startsWith('data:image/svg+xml')
        ? resolvedCover
        : chosen2.cover || era1Cover;

    const fullTracks = getAuthenticAlbumFullTracklist(
      npcName,
      chosen2.title,
      master.pop,
      master.masterSongs
    );
    return {
      title: chosen2.title,
      cover: cover2,
      projectType: fullTracks.length <= 7 ? 'ep' : 'album',
      tracks: fullTracks
    };
  }

  // Fallback if NPC only has 1 master album in catalog: create an authentic 6-track EP / Deluxe Edition
  const baseTracks = getAuthenticAlbumFullTracklist(
    npcName,
    era1AlbumTitle,
    master.pop,
    master.masterSongs
  );
  const epTracks: AuthenticAlbumTrackEntry[] = baseTracks.slice(0, 5).map((t, i) => ({
    title: i === 0 ? `${t.title} (Extended Mix)` : i === 1 ? `${t.title} (Live Session)` : t.title,
    streams: t.streams,
    trackType: i <= 1 ? 'single' : 'b_side'
  }));

  return {
    title: `${era1AlbumTitle} (Deluxe EP)`,
    cover: era1Cover,
    projectType: 'ep',
    tracks: epTracks
  };
}

/**
 * Executes the staggered 2-cycle annual release schedule for all NPCs.
 * - On Day 0 (New Game): All NPCs have their baseline simultaneous release active so charts are full.
 * - On Day 1..364: NPCs drop new singles, EPs, and 2nd albums on staggered dates throughout the year!
 */
export function buildStaggeredMultiReleaseForNpc(
  npc: DetailedNPC,
  master: MultiCycleNpcMasterSnapshot,
  npcIdx: number,
  gameYear: number,
  dayOfYear: number,
  dropsCollector: ScheduledNpcDropEvent[]
): NpcWorkflowStatusSummary {
  const yearOffset = Math.max(0, gameYear - 2026);
  const era1Idx = (yearOffset * 2) % master.masterAlbums.length;
  const chosenAlbum1 = master.masterAlbums[era1Idx];
  const album1Title = chosenAlbum1.title;

  const verifiedAlb1Cover = getVerifiedOfficialReleaseCover(npc.name, album1Title, true);
  const resolvedAlb1Cover =
    verifiedAlb1Cover || resolveRealWorldCoverArt(npc.name, album1Title, true);
  const album1Cover =
    resolvedAlb1Cover && !resolvedAlb1Cover.startsWith('data:image/svg+xml')
      ? resolvedAlb1Cover
      : chosenAlbum1.cover || resolvedAlb1Cover;

  const rawTracks1 = getAuthenticAlbumFullTracklist(
    npc.name,
    album1Title,
    master.pop,
    master.masterSongs
  );

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
    scheduleHash % 10 < 6 ? 'single_first_then_album' : 'simultaneous_album_and_single';

  // --- CYCLE 1 SCHEDULE (H1: Day 0 .. Day 160) ---
  // On New Game (Day 0), Lead Single #1 is ALWAYS released on Day 0 so every NPC has an active single on Day 1.
  // For Album #1: ~35% of NPCs drop Album #1 on Day 0 (so New Game album charts are full),
  // while the remaining 65% stagger their Album #1 drop across Day 3 to Day 120 so new albums drop every week!
  const leadSingle1Day = 0;
  const isDayZeroAlbumLaunch = workflowType === 'simultaneous_album_and_single' || npcIdx % 3 === 0;
  const secondSingle1Day = isDayZeroAlbumLaunch
    ? 0
    : 2 + ((scheduleHash + npcIdx * 5) % 42); // Staggered Day 2..43
  const album1ReleaseDay = isDayZeroAlbumLaunch
    ? 0
    : Math.max(secondSingle1Day + 3, 6 + ((scheduleHash + npcIdx * 9) % 95)); // Staggered Day 6..100
  const postAlbumSingle1Day = album1ReleaseDay + 12 + (scheduleHash % 24);

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

  // --- CYCLE 2 SCHEDULE (2nd Album / EP / Standalone Singles in same year!) ---
  // Staggered across Day 10 to Day 310 so every single week of the year has fresh Era 2 drops!
  const secondProject = resolveSecondProjectForYear(
    npc.name,
    master,
    era1Idx,
    album1Title,
    album1Cover
  );

  const cycle2Offset = 10 + ((scheduleHash * 7 + npcIdx * 13) % 260); // Staggered Day 10..269
  const era2LeadSingleDay = Math.max(album1ReleaseDay + 8, cycle2Offset);
  const era2SecondSingleDay = era2LeadSingleDay + 5 + (scheduleHash % 12);
  const era2ProjectReleaseDay = era2SecondSingleDay + 6 + ((scheduleHash >> 3) % 16);

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
      Math.min(99, master.hype + 4),
      trackReleaseDay,
      dayOfYear,
      secondProject.cover
    );
  });

  // Collect recently dropped singles/projects (released within the last 2 days) for X feed news!
  if (dayOfYear > 0) {
    [...simulatedTracks1, ...simulatedTracks2].forEach(t => {
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
  }

  // --- COMBINE ACTIVE SINGLES & ALBUMS FROM BOTH CYCLES ---
  const combinedSimTracks = [...simulatedTracks2, ...simulatedTracks1];
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
      // Prioritize newer releases so fresh singles actively climb charts
      if (a.daysSinceRelease <= 14 && b.daysSinceRelease > 14) return -1;
      if (b.daysSinceRelease <= 14 && a.daysSinceRelease > 14) return 1;
      return b.dailyStreams - a.dailyStreams;
    });

  const releasedBSides = deduplicatedTracks
    .filter(t => t.trackType === 'b_side')
    .sort((a, b) => b.dailyStreams - a.dailyStreams)
    .slice(0, 4);

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

  // Build active albums list (can hold BOTH Era 2 Project and Era 1 Album!)
  const activeAlbums: NpcAlbum[] = [];

  if (isEra2ProjectReleased) {
    const totalStreams2 = simulatedTracks2.reduce((sum, t) => sum + t.streams, 0);
    const dailyStreams2 = simulatedTracks2.reduce((sum, t) => sum + t.dailyStreams, 0);
    const weeklyStreams2 = simulatedTracks2.reduce((sum, t) => sum + t.weeklyStreams, 0);
    const totalSales2 = simulatedTracks2.reduce((sum, t) => sum + t.sales, 0);
    const dailySales2 = simulatedTracks2.reduce((sum, t) => sum + t.dailySales, 0);
    const daysOut2 = Math.max(0, dayOfYear - era2ProjectReleaseDay);
    const debutAlbumBoost2 = daysOut2 === 0 ? 1.55 : daysOut2 <= 3 ? 1.22 : 0.85;
    const albumDailyPureSales2 = Math.max(
      25,
      Math.floor((dailySales2 * 0.28 + Math.pow(Math.max(100, dailyStreams2), 0.72) * 0.22) * debutAlbumBoost2)
    );
    const albumTotalPureSales2 = Math.max(
      albumDailyPureSales2,
      Math.floor(totalSales2 * 0.26 + Math.pow(Math.max(100, totalStreams2), 0.74) * 0.25)
    );

    activeAlbums.push({
      title: secondProject.title,
      cover: secondProject.cover,
      sales: albumTotalPureSales2,
      dailySales: albumDailyPureSales2,
      weeklySales: albumDailyPureSales2 * Math.min(7, Math.max(1, daysOut2 + 1)),
      streams: totalStreams2,
      dailyStreams: dailyStreams2,
      weeklyStreams: weeklyStreams2,
      daysSinceRelease: daysOut2,
      year: gameYear,
      tracks: simulatedTracks2.map(t => ({
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
    });
  }

  let totalAlbum1Streams = 0;
  let dailyAlbum1Streams = 0;

  if (isAlbum1Released) {
    totalAlbum1Streams = simulatedTracks1.reduce((sum, t) => sum + t.streams, 0);
    dailyAlbum1Streams = simulatedTracks1.reduce((sum, t) => sum + t.dailyStreams, 0);
    const weeklyStreams1 = simulatedTracks1.reduce((sum, t) => sum + t.weeklyStreams, 0);
    const totalSales1 = simulatedTracks1.reduce((sum, t) => sum + t.sales, 0);
    const dailySales1 = simulatedTracks1.reduce((sum, t) => sum + t.dailySales, 0);
    const daysOut1 = Math.max(0, dayOfYear - album1ReleaseDay);
    const debutAlbumBoost1 = daysOut1 === 0 ? 1.55 : daysOut1 <= 3 ? 1.22 : 0.85;
    const albumDailyPureSales1 = Math.max(
      25,
      Math.floor((dailySales1 * 0.26 + Math.pow(Math.max(100, dailyAlbum1Streams), 0.72) * 0.20) * debutAlbumBoost1)
    );
    const albumTotalPureSales1 = Math.max(
      albumDailyPureSales1,
      Math.floor(totalSales1 * 0.25 + Math.pow(Math.max(100, totalAlbum1Streams), 0.74) * 0.24)
    );

    activeAlbums.push({
      title: album1Title,
      cover: album1Cover,
      sales: albumTotalPureSales1,
      dailySales: albumDailyPureSales1,
      weeklySales: albumDailyPureSales1 * Math.min(7, Math.max(1, daysOut1 + 1)),
      streams: totalAlbum1Streams,
      dailyStreams: dailyAlbum1Streams,
      weeklyStreams: weeklyStreams1,
      daysSinceRelease: daysOut1,
      year: gameYear,
      tracks: simulatedTracks1.map(t => ({
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
    });
  }

  // If Era 1 Album is still in its Upcoming Release countdown, include the NPC's previous real catalog album in Discography
  if (activeAlbums.length === 0 && master.masterAlbums.length > 0) {
    const prevAlbIdx = (era1Idx + master.masterAlbums.length - 1) % master.masterAlbums.length;
    const prevAlb = master.masterAlbums[prevAlbIdx];
    const prevAlbCover =
      getVerifiedOfficialReleaseCover(npc.name, prevAlb.title, true) ||
      resolveRealWorldCoverArt(npc.name, prevAlb.title, true) ||
      prevAlb.cover ||
      album1Cover;
    const prevRawTracks = getAuthenticAlbumFullTracklist(
      npc.name,
      prevAlb.title,
      master.pop,
      master.masterSongs
    );
    const prevSimTracks = prevRawTracks.map((trk, idx) =>
      simulateTrackAtDay(
        npc.name,
        prevAlb.title,
        trk.title,
        trk.trackType,
        idx,
        master.pop,
        master.hype,
        0,
        dayOfYear,
        prevAlbCover
      )
    );
    const prevTotalStreams = prevSimTracks.reduce((sum, t) => sum + t.streams, 0);
    const prevDailyStreams = prevSimTracks.reduce((sum, t) => sum + t.dailyStreams, 0);
    const prevWeeklyStreams = prevSimTracks.reduce((sum, t) => sum + t.weeklyStreams, 0);
    const prevTotalSales = prevSimTracks.reduce((sum, t) => sum + t.sales, 0);
    const prevDailySales = prevSimTracks.reduce((sum, t) => sum + t.dailySales, 0);

    activeAlbums.push({
      title: prevAlb.title,
      cover: prevAlbCover,
      sales: Math.max(50000, Math.floor(prevTotalSales * 0.28)),
      dailySales: Math.max(100, Math.floor(prevDailySales * 0.25)),
      weeklySales: Math.max(700, Math.floor(prevDailySales * 1.6)),
      streams: prevTotalStreams,
      dailyStreams: prevDailyStreams,
      weeklyStreams: prevWeeklyStreams,
      daysSinceRelease: dayOfYear + 30,
      year: Math.max(2024, gameYear - 1),
      tracks: prevSimTracks.map(t => ({
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
    });
  }

  npc.albums = activeAlbums;

  // Build Rollout Steps showing both Cycle 1 and Cycle 2 activity
  const trk1 = simulatedTracks1[singleIndices1[0] ?? 0] || simulatedTracks1[0];
  const trk2 = simulatedTracks1[singleIndices1[1] ?? 0] || trk1;
  const era2LeadTrk = simulatedTracks2[singleIndices2[0] ?? 0] || simulatedTracks2[0];

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

  let currentPhase: NpcRolloutPhase = 'album_released_phase';
  let phaseBadgeText = `Era 1 "${album1Title}" Active`;
  if (!isAlbum1Released) {
    currentPhase = 'lead_single_phase';
    phaseBadgeText = `Single Out • "${album1Title}" in ${Math.max(1, album1ReleaseDay - dayOfYear)}d`;
  } else if (isEra2ProjectReleased) {
    currentPhase = 'post_album_single_phase';
    phaseBadgeText = `2nd Project "${secondProject.title}" Out Now`;
  } else if (dayOfYear >= era2LeadSingleDay) {
    currentPhase = 'second_single_phase';
    phaseBadgeText = `Era 2 Single Out • "${secondProject.title}" in ${Math.max(1, era2ProjectReleaseDay - dayOfYear)}d`;
  }

  return {
    npcId: npc.id,
    npcName: npc.name,
    gameYear,
    dayOfYear,
    workflowType,
    workflowLabel: '2-Project Staggered Annual Schedule',
    workflowDescription: `Releases "${album1Title}" & "${secondProject.title}" plus staggered singles across ${gameYear}.`,
    currentPhase,
    phaseBadgeText,
    eraAlbumTitle: isEra2ProjectReleased ? secondProject.title : album1Title,
    eraAlbumCover: isEra2ProjectReleased ? secondProject.cover : album1Cover,
    isAlbumReleased: isAlbum1Released || isEra2ProjectReleased,
    albumReleaseDayOfYear: isAlbum1Released ? era2ProjectReleaseDay : album1ReleaseDay,
    daysUntilAlbumRelease: isAlbum1Released
      ? Math.max(0, era2ProjectReleaseDay - dayOfYear)
      : Math.max(0, album1ReleaseDay - dayOfYear),
    releasedSinglesCount: releasedSingles.length,
    totalAlbumTracksCount: simulatedTracks1.length + simulatedTracks2.length,
    rolloutSteps,
    upcomingAlbumTracks: isEra2ProjectReleased ? simulatedTracks2 : simulatedTracks1
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
