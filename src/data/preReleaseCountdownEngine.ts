// Pre-Release Rollout & Spotify Upcoming Release Countdown Engine
// Powers the full era rollout system:
// 1. Single Role Classification (Lead Single, Pre-Release Single, Promotional Single, Official/Focus Single, B-Side)
// 2. Scheduled Project Pre-Save Accumulation & Day-1 Conversion Multipliers
// 3. Real-time Countdown Timer Breakdown (Days | Hours | Minutes | Seconds)
// 4. Deterministic NPC Upcoming Album/EP Countdowns on Spotify Artist Profiles

import { GameState, Project, Song } from '../types';
import { DetailedNPC } from './npcAssets';
import { resolveRealWorldCoverArt, normalizeRealArtistName } from './realWorldArtistCatalog';
import { getVerifiedOfficialReleaseCover } from './spotifyOfficialNpcPortraitsAndCovers';
import { getAuthenticAlbumFullTracklist } from './npcAnnualReleaseCycleAndTracklistEngine';
import {
  getNpcWorkflowStatus,
  getMasterNpcCatalogSnapshot
} from './npcRealisticReleaseWorkflowEngine';

export type ExtendedTrackRole =
  | 'lead_single'
  | 'pre_release_single'
  | 'promotional_single'
  | 'single'
  | 'b_side';

export interface SingleRoleOptionMeta {
  id: ExtendedTrackRole;
  label: string;
  shortBadge: string;
  description: string;
  streamMult: number;
  radioMult: number;
  salesMult: number;
  preSaveBoost: number;
  hypeBonus: number;
  badgeClass: string;
}

export const SINGLE_ROLE_OPTIONS: SingleRoleOptionMeta[] = [
  {
    id: 'lead_single',
    label: 'Lead Single',
    shortBadge: 'Lead Single',
    description: 'Primary era opener. Maximum radio impact (+25%), flagship editorial pitching, and longest chart longevity.',
    streamMult: 1.20,
    radioMult: 1.25,
    salesMult: 1.20,
    preSaveBoost: 1.35,
    hypeBonus: 6,
    badgeClass: 'bg-amber-900/50 text-amber-300 border-amber-700/40'
  },
  {
    id: 'pre_release_single',
    label: 'Pre-Release Single',
    shortBadge: 'Pre-Release Single',
    description: 'Official single dropped ahead of your Album/EP or during its Spotify Countdown. Drives heavy album Pre-Saves (+45%) and streams.',
    streamMult: 1.12,
    radioMult: 1.05,
    salesMult: 1.10,
    preSaveBoost: 1.45,
    hypeBonus: 5,
    badgeClass: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/40'
  },
  {
    id: 'promotional_single',
    label: 'Promotional Single',
    shortBadge: 'Promo Single',
    description: 'Instant-grat teaser track for core fans before album drop. Sparks Day-1 fan buzz and Pre-Saves without full radio servicing.',
    streamMult: 0.95,
    radioMult: 0.25,
    salesMult: 1.15,
    preSaveBoost: 1.30,
    hypeBonus: 3,
    badgeClass: 'bg-pink-900/50 text-pink-300 border-pink-700/40'
  },
  {
    id: 'single',
    label: 'Official Single',
    shortBadge: 'Single',
    description: 'Standard official single release (standalone single, album focus track, or post-album single) with full playlist & radio eligibility.',
    streamMult: 1.06,
    radioMult: 1.0,
    salesMult: 1.0,
    preSaveBoost: 1.15,
    hypeBonus: 4,
    badgeClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40'
  }
];

export function getTrackRoleBadgeMeta(trackType?: string): {
  label: string;
  className: string;
} {
  switch (trackType) {
    case 'lead_single':
      return {
        label: 'Lead Single',
        className: 'bg-amber-900/50 text-amber-300 border-amber-700/40'
      };
    case 'pre_release_single':
      return {
        label: 'Pre-Release Single',
        className: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/40'
      };
    case 'promotional_single':
      return {
        label: 'Promo Single',
        className: 'bg-pink-900/50 text-pink-300 border-pink-700/40'
      };
    case 'b_side':
      return {
        label: 'B-Side',
        className: 'bg-purple-900/50 text-purple-300 border-purple-700/40'
      };
    default:
      return {
        label: 'Single',
        className: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40'
      };
  }
}

export interface CountdownTimeBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSecondsRemaining: number;
  formattedReleaseDate: string;
  shortReleaseDate: string;
  isReleased: boolean;
}

/**
 * Calculates live Days | Hours | Minutes | Seconds between the game's current date
 * (plus a live real-time offset inside the current day) and the target releaseDate.
 */
export function calculateReleaseCountdownBreakdown(
  currentGameDateStr: string,
  targetReleaseDateStr: string,
  liveTickOffsetSeconds: number = 0
): CountdownTimeBreakdown {
  const gameNow = new Date(currentGameDateStr);
  const cleanTarget = targetReleaseDateStr.includes('T')
    ? targetReleaseDateStr
    : `${targetReleaseDateStr}T00:00:00`;
  const targetDate = new Date(cleanTarget);

  const formattedReleaseDate = targetDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const shortReleaseDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Base difference in milliseconds from current game date to midnight of release date
  // Add a deterministic intraday hour/minute window (22h 51m 12s) so a newly scheduled release
  // shows full authentic Days | Hours | Minutes | Seconds like real Spotify Countdowns
  const rawDiffMs = targetDate.getTime() - gameNow.getTime();
  if (rawDiffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSecondsRemaining: 0,
      formattedReleaseDate,
      shortReleaseDate,
      isReleased: true
    };
  }

  const baseDays = Math.max(0, Math.floor(rawDiffMs / (1000 * 60 * 60 * 24)) - 1);
  const intradaySeedSeconds = 22 * 3600 + 51 * 60 + 19;
  const totalSecondsRemaining = Math.max(
    1,
    baseDays * 86400 + intradaySeedSeconds - (liveTickOffsetSeconds % 86400)
  );

  const days = Math.floor(totalSecondsRemaining / 86400);
  const hours = Math.floor((totalSecondsRemaining % 86400) / 3600);
  const minutes = Math.floor((totalSecondsRemaining % 3600) / 60);
  const seconds = totalSecondsRemaining % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSecondsRemaining,
    formattedReleaseDate,
    shortReleaseDate,
    isReleased: false
  };
}

/**
 * Calculates initial Pre-Saves when a Player schedules an upcoming Album/EP/Single Pack.
 */
export function calculateInitialProjectPreSaves(
  project: Project,
  popularity: number,
  hype: number,
  fans: number,
  distributorId: string = 'indie',
  strategyId: string = 'indie'
): number {
  const distroMult =
    distributorId === 'global'
      ? 1.65
      : distributorId === 'major'
      ? 1.35
      : distributorId === 'boutique'
      ? 1.15
      : 1.0;

  const promoMult =
    strategyId === 'major_push' ? 1.55 : strategyId === 'ad_campaign' ? 1.28 : 1.0;

  const releasedSinglesCount = (project.songs || []).filter(s => s.status === 'released').length;
  const singleRolloutBonus = 1 + Math.min(3, releasedSinglesCount) * 0.22;

  const fanBaseComponent = Math.pow(Math.max(50, fans), 0.78) * 1.35;
  const popHypeComponent = Math.pow(Math.max(1, popularity), 1.65) * 45 + Math.pow(Math.max(5, hype), 1.4) * 18;
  const qualityFactor = 0.7 + Math.max(30, project.quality || 60) / 110;

  return Math.max(
    25,
    Math.round((fanBaseComponent + popHypeComponent) * qualityFactor * distroMult * promoMult * singleRolloutBonus * 0.22)
  );
}

/**
 * Calculates daily Pre-Save additions while a project's status is 'scheduled'.
 */
export function calculateDailyProjectPreSaveGrowth(
  project: Project,
  allSongs: Song[],
  popularity: number,
  hype: number,
  fans: number,
  currentDate: Date
): {
  dailyPreSavesAdded: number;
  totalPreSaves: number;
} {
  const projSongIds = new Set((project.songs || []).map(s => s.id));
  const liveProjSongs = allSongs.filter(s => projSongIds.has(s.id));

  // Pre-released singles actively streaming drive daily pre-save conversions
  const releasedProjectSingles = liveProjSongs.filter(s => s.status === 'released');
  const activeSingleDailyStreams = releasedProjectSingles.reduce(
    (sum, s) => sum + (s.dailyStreams || 0),
    0
  );

  // Stream-to-PreSave conversion (~0.85% of daily streams on pre-release singles convert to pre-saves)
  const streamDrivenPreSaves = activeSingleDailyStreams * 0.0085;

  // Organic daily fan & hype momentum
  const fanDailyBase = Math.pow(Math.max(50, fans), 0.72) * 0.38;
  const hypeBase = Math.pow(Math.max(1, popularity), 1.45) * 12 + Math.pow(Math.max(5, hype), 1.35) * 8;

  // Urgency surge in the final 3 days before release
  let urgencyMultiplier = 1.0;
  if (project.releaseDate) {
    const releaseObj = new Date(project.releaseDate);
    const daysUntilDrop = Math.max(
      0,
      Math.ceil((releaseObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (daysUntilDrop <= 2) urgencyMultiplier = 1.65;
    else if (daysUntilDrop <= 5) urgencyMultiplier = 1.30;
  }

  const dayVariance = 0.93 + ((currentDate.getDate() * 7 + project.id * 11) % 15) / 100;
  const dailyPreSavesAdded = Math.max(
    10,
    Math.round((fanDailyBase + hypeBase + streamDrivenPreSaves) * urgencyMultiplier * dayVariance)
  );

  const currentTotal = project.preSaves || 0;
  return {
    dailyPreSavesAdded,
    totalPreSaves: currentTotal + dailyPreSavesAdded
  };
}

/**
 * Computes the Day-1 Streaming & Week-1 Sales multiplier earned from accumulated Pre-Saves.
 */
export function getPreSaveLaunchBoostMultipliers(preSaves: number = 0): {
  streamBoostMultiplier: number;
  salesBoostMultiplier: number;
  bonusFirstDayStreams: number;
  bonusFirstDaySales: number;
} {
  if (!preSaves || preSaves <= 0) {
    return {
      streamBoostMultiplier: 1.0,
      salesBoostMultiplier: 1.0,
      bonusFirstDayStreams: 0,
      bonusFirstDaySales: 0
    };
  }

  // Smooth logarithmic boost up to +45% streams and +35% sales, plus direct pre-save listener conversion
  const streamBoostMultiplier = Math.min(1.45, 1.0 + Math.log10(1 + preSaves / 1000) * 0.11);
  const salesBoostMultiplier = Math.min(1.35, 1.0 + Math.log10(1 + preSaves / 1500) * 0.09);

  // Each pre-save generates ~3.2 track streams on Day 1 and ~4.5% digital/physical unit conversion
  const bonusFirstDayStreams = Math.round(preSaves * 3.2);
  const bonusFirstDaySales = Math.round(preSaves * 0.045);

  return {
    streamBoostMultiplier,
    salesBoostMultiplier,
    bonusFirstDayStreams,
    bonusFirstDaySales
  };
}

/**
 * Generates authentic copyright lines for Spotify Countdown & Album footers.
 */
export function getProjectCopyrightLines(
  artistName: string,
  releaseDateStr?: string,
  distributorId?: string,
  customLabel?: string
): { copyrightLine: string; phonographicLine: string } {
  const year = releaseDateStr ? new Date(releaseDateStr).getFullYear() : 2026;
  const safeYear = Number.isNaN(year) ? 2026 : year;

  if (customLabel) {
    return {
      copyrightLine: `© ${safeYear} ${customLabel.toUpperCase()}`,
      phonographicLine: `℗ ${safeYear} ${customLabel.toUpperCase()}`
    };
  }

  let labelName = `${artistName.toUpperCase()} RECORDINGS`;
  if (distributorId === 'global') {
    labelName = `${artistName.toUpperCase()} / UNIVERSAL MUSIC GROUP`;
  } else if (distributorId === 'major') {
    labelName = `${artistName.toUpperCase()} / REPUBLIC RECORDS`;
  } else if (distributorId === 'boutique') {
    labelName = `${artistName.toUpperCase()} / SECRETLY GROUP`;
  }

  return {
    copyrightLine: `© ${safeYear} ${labelName}`,
    phonographicLine: `℗ ${safeYear} ${labelName}`
  };
}

export interface NpcUpcomingCountdownData {
  id: string;
  title: string;
  artistName: string;
  artistAvatar?: string;
  type: 'album' | 'ep';
  releaseDate: string;
  cover?: string;
  preSaves: number;
  labelName: string;
  tracks: Array<{
    id: string;
    title: string;
    artistName: string;
    isReleased: boolean;
    trackType: ExtendedTrackRole;
    streams?: number;
    isExplicit?: boolean;
  }>;
}

const AUTHENTIC_NPC_RECORD_LABELS: Record<string, string> = {
  'Taylor Swift': 'TAYLOR SWIFT / REPUBLIC RECORDS',
  'The Weeknd': 'XO / REPUBLIC RECORDS',
  'Billie Eilish': 'DARKROOM / INTERSCOPE RECORDS',
  'Sabrina Carpenter': 'ISLAND RECORDS',
  'Ariana Grande': 'REPUBLIC RECORDS',
  'Olivia Rodrigo': 'GEFFEN RECORDS',
  'Drake': 'OVO SOUND / REPUBLIC RECORDS',
  'Bad Bunny': 'RIMAS ENTERTAINMENT',
  'Kendrick Lamar': 'PGLANG / INTERSCOPE RECORDS',
  'SZA': 'TOP DAWG ENTERTAINMENT / RCA RECORDS',
  'Travis Scott': 'CACTUS JACK / EPIC RECORDS',
  'Post Malone': 'MERCURY / REPUBLIC RECORDS',
  'Dua Lipa': 'WARNER RECORDS',
  'Bruno Mars': 'ATLANTIC RECORDS',
  'Lady Gaga': 'INTERSCOPE RECORDS',
  'Beyoncé': 'PARKWOOD ENTERTAINMENT / COLUMBIA',
  'Chappell Roan': 'AMUSEMENT / ISLAND RECORDS',
  'Charli XCX': 'ATLANTIC RECORDS',
  'Gracie Abrams': 'INTERSCOPE RECORDS',
  'TOMORROW X TOGETHER': 'BIGHIT MUSIC',
  'NewJeans': 'ADOR',
  'BLACKPINK': 'YG ENTERTAINMENT / INTERSCOPE',
  'Jungkook': 'BIGHIT MUSIC',
  'Jennie': 'ODDATELIER / COLUMBIA RECORDS',
  'Lisa': 'LLOUD / RCA RECORDS',
  'Rosé': 'THEBLACKLABEL / ATLANTIC RECORDS',
  'Stray Kids': 'JYP ENTERTAINMENT / REPUBLIC',
  'aespa': 'SM ENTERTAINMENT',
  'LE SSERAFIM': 'SOURCE MUSIC'
};

/**
 * Generates an authentic upcoming release countdown for an NPC artist using 100% real-world
 * albums, official album covers, and real studio album tracklists from their actual discography.
 */
export function getNpcUpcomingReleaseCountdown(
  npc: DetailedNPC,
  currentDateStr: string
): NpcUpcomingCountdownData | null {
  if (!npc || !npc.name) return null;

  const cleanName = normalizeRealArtistName(npc.name).trim();
  const now = new Date(currentDateStr || '2026-01-01T00:00:00');
  const nameHash = cleanName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const workflow = getNpcWorkflowStatus(cleanName, currentDateStr);
  const master = getMasterNpcCatalogSnapshot(cleanName);

  const activeAlbumTitlesLower = new Set(
    (npc.albums || []).map(a => a.title.toLowerCase().trim())
  );

  // Determine the upcoming real album from the NPC's authentic discography
  // Must strictly be an UNRELEASED album (never an album already present in npc.albums)
  let chosenAlbumTitle = '';
  let chosenAlbumCover = '';
  let daysAhead = 12 + ((nameHash * 7 + now.getDate()) % 16);

  // 1. Check if the NPC's live staggered workflow has an upcoming unreleased real studio album
  if (workflow && workflow.rolloutSteps) {
    const upcomingAlbumStep = workflow.rolloutSteps.find(
      st =>
        st.isAlbumStep &&
        !st.isReleased &&
        st.daysRemaining > 0 &&
        !st.title.toLowerCase().includes('(deluxe ep)') &&
        !activeAlbumTitlesLower.has(st.title.toLowerCase().trim())
    );
    if (upcomingAlbumStep) {
      chosenAlbumTitle = upcomingAlbumStep.title;
      chosenAlbumCover = upcomingAlbumStep.cover;
      daysAhead = Math.max(2, upcomingAlbumStep.daysRemaining);
    }
  }

  // 2. Otherwise, pick an authentic album from the NPC's real-world master discography
  // ONLY if it is NOT already released in their active Discography
  if (!chosenAlbumTitle && master && master.masterAlbums.length > 0) {
    const unreleasedRealAlbum = master.masterAlbums.find(
      a =>
        !activeAlbumTitlesLower.has(a.title.toLowerCase().trim()) &&
        !a.title.toLowerCase().includes('(deluxe ep)')
    );

    if (unreleasedRealAlbum) {
      chosenAlbumTitle = unreleasedRealAlbum.title;
      chosenAlbumCover = unreleasedRealAlbum.cover || '';
    }
  }

  // If all of the NPC's albums are already released in their Discography, do not show a Pre-Save countdown
  if (!chosenAlbumTitle) return null;

  // Resolve 100% official real-world album cover art
  const officialCover =
    getVerifiedOfficialReleaseCover(cleanName, chosenAlbumTitle, true) ||
    resolveRealWorldCoverArt(cleanName, chosenAlbumTitle, true);
  if (officialCover && !officialCover.startsWith('data:image/svg+xml')) {
    chosenAlbumCover = officialCover;
  } else if (!chosenAlbumCover) {
    chosenAlbumCover =
      (npc.albums && npc.albums[0]?.cover) ||
      (npc.songs && npc.songs[0]?.cover) ||
      npc.image ||
      npc.avatar ||
      '';
  }

  // Resolve 100% authentic real-world tracklist for this exact album
  const rawTracklist = getAuthenticAlbumFullTracklist(
    cleanName,
    chosenAlbumTitle,
    npc.pop || master?.pop || 80,
    master?.masterSongs || npc.songs || []
  );

  if (!rawTracklist || rawTracklist.length === 0) return null;

  const futureDate = new Date(now.getTime());
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const releaseDate = futureDate.toISOString().split('T')[0];

  // Match only official singles (never b_sides) that have already dropped ahead of this upcoming album
  const activeNpcSinglesMap = new Map<string, { streams: number; trackType?: string }>();
  (npc.songs || []).forEach(s => {
    const tType = (s as any).trackType || 'single';
    if (tType !== 'b_side') {
      activeNpcSinglesMap.set(s.title.toLowerCase().trim(), {
        streams: s.streams || 0,
        trackType: tType
      });
    }
  });

  let unlockedPreReleaseCount = 0;
  const maxPreReleaseSingles = Math.min(2, Math.max(1, rawTracklist.length - 2));

  const tracks = rawTracklist.map((trk, idx) => {
    const activeMatch = activeNpcSinglesMap.get(trk.title.toLowerCase().trim());
    const canUnlockAsPreRelease =
      Boolean(activeMatch) && unlockedPreReleaseCount < maxPreReleaseSingles;
    const existingLeadSong = (npc.songs || [])[0];
    const defaultLeadStreams = Math.max(
      450_000,
      Math.floor((existingLeadSong?.streams || 2_200_000) * 0.85)
    );

    if (canUnlockAsPreRelease) {
      unlockedPreReleaseCount++;
      return {
        id: `npc_up_trk_${idx}`,
        title: trk.title,
        artistName: cleanName,
        isReleased: true,
        trackType: (unlockedPreReleaseCount === 1
          ? 'lead_single'
          : 'pre_release_single') as ExtendedTrackRole,
        streams:
          activeMatch?.streams && activeMatch.streams > 0
            ? activeMatch.streams
            : defaultLeadStreams,
        isExplicit: (nameHash + idx) % 5 === 1
      };
    }

    return {
      id: `npc_up_trk_${idx}`,
      title: trk.title,
      artistName: cleanName,
      isReleased: false,
      trackType: (trk.trackType || 'b_side') as ExtendedTrackRole,
      streams: 0,
      isExplicit: (nameHash + idx) % 5 === 2
    };
  });

  const popFactor = Math.max(40, npc.pop || 78);
  const preSaves = Math.round(Math.pow(popFactor, 2.3) * (15 + (nameHash % 9)));
  const projectType: 'album' | 'ep' = rawTracklist.length <= 7 ? 'ep' : 'album';
  const labelName =
    AUTHENTIC_NPC_RECORD_LABELS[cleanName] ||
    `${cleanName.toUpperCase()} / UNIVERSAL MUSIC GROUP`;

  return {
    id: `npc_countdown_${cleanName.toLowerCase().replace(/\s+/g, '_')}`,
    title: chosenAlbumTitle,
    artistName: cleanName,
    artistAvatar: npc.avatar || npc.image,
    type: projectType,
    releaseDate,
    cover: chosenAlbumCover,
    preSaves,
    labelName,
    tracks
  };
}
