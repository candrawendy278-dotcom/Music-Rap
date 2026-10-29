// Vanguard Music Honors (VMH) Simulation, Scoring & Calendar Engine
// Evaluates Player and Real-World NPCs across 5 balanced pillars:
// 1. Critical Acclaim (Pitchfork / Metacritic / Studio & Skill Mastery)
// 2. Chart Peaks & Longevity (Billboard Hot 100, Global 200, Billboard 200)
// 3. Streaming & Commercial Volume (Spotify/iTunes Streams + Pure Sales)
// 4. Touring & Visual Velocity (World Tour Boxscore Gross & Attendance + YouTube MV Views)
// 5. Cultural Hype & Vanguard Campaign Bonus
//
// STRICT RULES:
// - 1 Artist = Maximum 1 Entry per Category (no artist can have 2+ songs/albums in the same category).
// - Winners and final scores are SEALED during the Nominations phase and only revealed live on Ceremony Night.

import { GameState } from '../types';
import { REAL_WORLD_NPCS } from './realWorldArtistCatalog';
import { getNpcLivingAttributes } from './npcLivingArtistAttributesAndMarketEngine';
import { getEnsuredSkillState, calculateMasteryRank } from './skillSystemEngine';
import { XPost } from './xSocialEngine';
import {
  VanguardCategoryDef,
  VANGUARD_CALENDAR_CONFIG,
  VANGUARD_CAMPAIGN_TIERS,
  VANGUARD_CATEGORIES,
  doesGenreMatchVanguardCategory
} from './vanguardHonorsConfig';

export interface VanguardScoreBreakdown {
  criticalAcclaim: number;        // 0 - 100
  chartImpact: number;            // 0 - 100
  commercialVolume: number;       // 0 - 100
  touringAndVisualImpact: number; // 0 - 100
  fanAndCulturalHype: number;     // 0 - 100
  campaignBonus: number;          // 0 - 6.5
  finalWeightedScore: number;     // 0 - 106.5
}

export interface VanguardNominee {
  id: string;
  artistName: string;
  isPlayer: boolean;
  workTitle: string;
  secondaryLabel: string;
  coverArt: string;
  genre: string;
  streams: number;
  views: number;
  sales: number;
  tourGross: number;
  criticScore: number;
  chartPeak: number | null;
  scoreBreakdown: VanguardScoreBreakdown;
  isWinner?: boolean;
}

export interface VanguardCategoryResult {
  categoryId: string;
  categoryName: string;
  shortName: string;
  field: string;
  isMajor: boolean;
  subjectType: string;
  description: string;
  nominees: VanguardNominee[]; // Stored in unspoiled Official Ballot Order!
  winner: VanguardNominee;
}

export interface VanguardArtistTally {
  artistName: string;
  isPlayer: boolean;
  avatar: string;
  nominations: number;
  wins: number;
  majorWins: number;
  nominatedCategories: string[];
  wonCategories: string[];
}

export interface VanguardSeasonRecord {
  id: string;
  editionYear: number;
  editionLabel: string; // e.g. "2026 Vanguard Music Honors"
  nominationsDate: string;
  ceremonyDate: string;
  phase: 'nominations_announced' | 'ceremony_completed';
  categories: VanguardCategoryResult[];
  artistTallies: VanguardArtistTally[];
  biggestWinner: VanguardArtistTally | null;
  mostNominated: VanguardArtistTally | null;
}

export interface VanguardCampaignState {
  preferredSongId?: number | null;
  preferredAlbumId?: number | null;
  purchasedCampaignIds: string[];
  totalBonusScore: number;
}

export interface VanguardSystemState {
  initialized: boolean;
  campaign: VanguardCampaignState;
  activeSeason: VanguardSeasonRecord | null;
  history: VanguardSeasonRecord[];
  pendingLiveModalSeason: VanguardSeasonRecord | null;
  lastProcessedDate: string;
}

const VANGUARD_AVATAR = 'https://placehold.co/400x400/080B0F/D4AF37?text=VMH';
const CHARTDATA_AVATAR = 'https://placehold.co/400x400/0F172A/38BDF8?text=CD';
const POPBASE_AVATAR = 'https://placehold.co/400x400/4C1D95/F472B6?text=PB';

function clamp100(val: number): number {
  return Math.max(12, Math.min(100, Number(val.toFixed(1))));
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/**
 * Extracts all participating artist keys (primary + featured) so that
 * 1 artist can NEVER appear more than once in the same category.
 */
function extractParticipatingArtistKeys(artistName: string, secondaryLabel?: string): string[] {
  const keys = new Set<string>();
  const primaryParts = (artistName || '')
    .split(/\s*(?:&|,|\bfeat\.?|\bft\.?|\bwith\b|\bx\b)\s*/i)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  primaryParts.forEach(p => keys.add(p));

  if (secondaryLabel) {
    const featMatch = secondaryLabel.match(/feat\.\s*([^·•,()]+)/i);
    if (featMatch && featMatch[1]) {
      const guest = featMatch[1].trim().toLowerCase();
      if (guest) keys.add(guest);
    }
  }

  return Array.from(keys);
}

/**
 * Determines the upcoming or active Vanguard ceremony year and countdowns
 */
export function getVanguardShowScheduleStatus(state: GameState) {
  const currentDate = state.date ? new Date(state.date) : new Date('2026-01-01T00:00:00.000Z');
  const currentYear = currentDate.getUTCFullYear();
  const { nominationsMonth, nominationsDay, ceremonyMonth, ceremonyDay } = VANGUARD_CALENDAR_CONFIG;

  let targetCeremonyYear = currentYear;
  const ceremonyThisYear = new Date(Date.UTC(currentYear, ceremonyMonth - 1, ceremonyDay));

  if (currentDate.getTime() > ceremonyThisYear.getTime() + 7 * 86400000) {
    targetCeremonyYear = currentYear + 1;
  }

  const nextNominationsDate = new Date(Date.UTC(targetCeremonyYear, nominationsMonth - 1, nominationsDay));
  const nextCeremonyDate = new Date(Date.UTC(targetCeremonyYear, ceremonyMonth - 1, ceremonyDay));

  const daysUntilNominations = Math.max(
    0,
    Math.ceil((nextNominationsDate.getTime() - currentDate.getTime()) / 86400000)
  );
  const daysUntilCeremony = Math.max(
    0,
    Math.ceil((nextCeremonyDate.getTime() - currentDate.getTime()) / 86400000)
  );

  const isNominationsAnnounced = currentDate.getTime() >= nextNominationsDate.getTime();
  const isCeremonyNightOrPassed = currentDate.getTime() >= nextCeremonyDate.getTime();
  const isInVotingWindow = isNominationsAnnounced && !isCeremonyNightOrPassed;

  return {
    targetCeremonyYear,
    isNominationsAnnounced,
    isCeremonyNightOrPassed,
    isInVotingWindow,
    daysUntilNominations,
    daysUntilCeremony,
    nominationsDateFormatted: nextNominationsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    }),
    ceremonyDateFormatted: nextCeremonyDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    })
  };
}

/**
 * Checks whether a release date falls within the Vanguard eligibility window
 * (May 1 of prior year through May 15 of ceremony year)
 */
export function isReleaseEligibleForVanguard(releaseDateStr: string | undefined, ceremonyYear: number): boolean {
  if (!releaseDateStr) return true;
  const rel = new Date(releaseDateStr);
  if (isNaN(rel.getTime())) return true;
  const startWindow = new Date(Date.UTC(ceremonyYear - 1, 4, 1)); // May 1 prior year
  const endWindow = new Date(Date.UTC(ceremonyYear, 4, 15));      // May 15 ceremony year
  return rel.getTime() >= startWindow.getTime() && rel.getTime() <= endWindow.getTime();
}

/**
 * Computes Player's real touring gross & attendance score (0-100) from World Tour history and active tour
 */
function calculatePlayerTouringScore(state: GameState): { tourScore: number; totalTourGross: number; tourLabel: string } {
  const tourState = (state as any).tourState;
  let totalGross = 0;
  let totalAttendance = 0;
  let completedShows = 0;
  let latestTourName = `${state.artist?.name || 'Artist'} World Tour`;

  if (tourState?.activeTour) {
    totalGross += Number(tourState.activeTour.totalGrossRevenue) || 0;
    totalAttendance += Number(tourState.activeTour.totalTicketsSold) || 0;
    completedShows += Number(tourState.activeTour.completedShowsCount) || 0;
    if (tourState.activeTour.tourName) latestTourName = tourState.activeTour.tourName;
  }

  if (Array.isArray(tourState?.completedTours)) {
    tourState.completedTours.forEach((t: any) => {
      totalGross += Number(t.totalGrossRevenue) || 0;
      totalAttendance += Number(t.totalTicketsSold) || 0;
      completedShows += Number(t.completedShowsCount || t.stops?.length) || 0;
      if (t.tourName) latestTourName = t.tourName;
    });
  }

  const totalViews = (state.songs || [])
    .filter(s => s && s.status === 'released')
    .reduce((acc, s) => acc + (Number(s.views) || 0), 0);

  const grossNorm = totalGross > 0 ? Math.min(62, Math.log10(Math.max(10000, totalGross)) * 8.2) : 18;
  const attendanceNorm = totalAttendance > 0 ? Math.min(22, Math.log10(Math.max(500, totalAttendance)) * 3.8) : 6;
  const visualNorm = totalViews > 0 ? Math.min(20, Math.log10(Math.max(1000, totalViews)) * 2.6) : 6;
  const showCountBonus = Math.min(8, completedShows * 0.45);

  return {
    tourScore: clamp100(grossNorm + attendanceNorm + visualNorm + showCountBonus),
    totalTourGross: totalGross,
    tourLabel: latestTourName
  };
}

/**
 * Builds candidate pool for a category and selects 6 nominees enforcing:
 * 1. STRICT 1-ARTIST-PER-CATEGORY RULE (neither primary nor featured artist can appear twice in the same category).
 * 2. Returns both the internal highest-scoring Winner AND the unspoiled Ballot Order list!
 */
function buildCategoryNomineesAndWinner(
  state: GameState,
  category: VanguardCategoryDef,
  editionYear: number,
  campaign: VanguardCampaignState
): { ballotNominees: VanguardNominee[]; winner: VanguardNominee } {
  const candidates: VanguardNominee[] = [];
  const playerName = state.artist?.name || 'Player';
  const playerAvatar = state.artist?.image || 'https://placehold.co/300x300/18181b/34d399?text=P';
  const skillState = getEnsuredSkillState(state.skills);
  const masterySummary = calculateMasteryRank(skillState);
  const skillScore = clamp100(
    (masterySummary.averages.songwriting +
      masterySummary.averages.recording +
      masterySummary.averages.production) *
      10
  );

  const playerTourStats = calculatePlayerTouringScore(state);
  const playerPop = state.popularity || 5;
  const playerHype = state.hype || 15;
  const playerFans = state.fans || 500;
  const playerHypePillar = clamp100(
    playerPop * 0.45 + playerHype * 0.35 + Math.min(25, Math.log10(Math.max(100, playerFans)) * 3.4)
  );

  const hot100 = state.billboard?.hot100 || [];
  const global200 = state.billboard?.global200 || [];
  const albums200 = state.billboard?.albums200 || [];
  const playerHistory = state.billboard?.playerHistory || {};

  const getSongChartPeak = (title: string, artist: string, isPlayer: boolean): { peak: number | null; chartScore: number } => {
    const lowerTitle = (title || '').toLowerCase();
    const lowerArtist = (artist || '').toLowerCase();
    let bestPeak: number | null = null;
    let totalWeeks = 1;

    const matchEntry = (c: any) =>
      (c.title || '').toLowerCase() === lowerTitle &&
      (isPlayer ? c.isPlayer : (c.artist || '').toLowerCase().includes(lowerArtist));

    const hItem = hot100.find(matchEntry);
    const gItem = global200.find(matchEntry);

    if (hItem) {
      const p = hItem.peakPosition || hItem.peak || 50;
      bestPeak = bestPeak === null ? p : Math.min(bestPeak, p);
      totalWeeks = Math.max(totalWeeks, hItem.weeksOnChart || hItem.weeks || 1);
    }
    if (gItem) {
      const p = gItem.peakPosition || gItem.peak || 50;
      bestPeak = bestPeak === null ? p : Math.min(bestPeak, p);
      totalWeeks = Math.max(totalWeeks, gItem.weeksOnChart || gItem.weeks || 1);
    }

    if (isPlayer) {
      Object.values(playerHistory).forEach(list => {
        if (Array.isArray(list)) {
          const found = list.find(i => (i.title || '').toLowerCase() === lowerTitle);
          if (found) {
            bestPeak = bestPeak === null ? found.peakPosition : Math.min(bestPeak, found.peakPosition);
            totalWeeks = Math.max(totalWeeks, found.weeksOnChart || 1);
          }
        }
      });
    }

    if (bestPeak === null) {
      return { peak: null, chartScore: 28 };
    }
    const peakBase = Math.max(25, 101 - bestPeak * 0.72);
    const longevityBonus = Math.min(14, totalWeeks * 0.75);
    return { peak: bestPeak, chartScore: clamp100(peakBase + longevityBonus) };
  };

  const computeWeightedFinal = (
    criticalAcclaim: number,
    chartImpact: number,
    commercialVolume: number,
    touringAndVisualImpact: number,
    fanAndCulturalHype: number,
    campaignBonus: number
  ): VanguardScoreBreakdown => {
    const w = category.weights;
    const baseWeighted =
      criticalAcclaim * w.criticalAcclaim +
      chartImpact * w.chartImpact +
      commercialVolume * w.commercialVolume +
      touringAndVisualImpact * w.touringAndVisualImpact +
      fanAndCulturalHype * w.fanAndCulturalHype;

    return {
      criticalAcclaim: clamp100(criticalAcclaim),
      chartImpact: clamp100(chartImpact),
      commercialVolume: clamp100(commercialVolume),
      touringAndVisualImpact: clamp100(touringAndVisualImpact),
      fanAndCulturalHype: clamp100(fanAndCulturalHype),
      campaignBonus: Number(campaignBonus.toFixed(1)),
      finalWeightedScore: Number((baseWeighted + campaignBonus).toFixed(1))
    };
  };

  // --- 1. EVALUATE PLAYER WORKS ---
  const releasedSongs = (state.songs || []).filter(s => s && s.status === 'released');
  const releasedAlbums = (state.projects || []).filter(p => p && p.status === 'released');

  if (category.subjectType === 'song' || category.subjectType === 'collab') {
    const eligiblePlayerSongs = releasedSongs.filter(s => {
      if (category.subjectType === 'collab' && (!s.collabId || s.collabId === 'none')) return false;
      return doesGenreMatchVanguardCategory(s.genre, category);
    });

    eligiblePlayerSongs.forEach(song => {
      const isPreferred = campaign.preferredSongId === song.id;
      const bonus = (campaign.totalBonusScore || 0) + (isPreferred ? 2.4 : 0);
      const criticScore = clamp100((song.quality || 60) * 0.68 + skillScore * 0.32);
      const chartInfo = getSongChartPeak(song.title, playerName, true);
      const streams = Number(song.streams) || 0;
      const sales = Number(song.pureSales) || 0;
      const views = Number(song.views) || 0;

      const commScore = clamp100(
        (streams > 0 ? Math.min(72, Math.log10(Math.max(1000, streams)) * 9.2) : 20) +
          (sales > 0 ? Math.min(28, Math.log10(Math.max(100, sales)) * 4.8) : 5)
      );
      const tourVisScore = clamp100(
        playerTourStats.tourScore * 0.55 +
          (views > 0 ? Math.min(45, Math.log10(Math.max(1000, views)) * 5.8) : 14)
      );

      const breakdown = computeWeightedFinal(
        criticScore,
        chartInfo.chartScore,
        commScore,
        tourVisScore,
        playerHypePillar,
        bonus
      );

      const collabGuest =
        song.collabId && song.collabId !== 'none'
          ? REAL_WORLD_NPCS.find(n => n.id === song.collabId)?.name
          : undefined;

      candidates.push({
        id: `player_song_${song.id}_${category.id}`,
        artistName: collabGuest ? `${playerName} & ${collabGuest}` : playerName,
        isPlayer: true,
        workTitle: song.title,
        secondaryLabel: song.genre || 'Pop',
        coverArt: song.cover || playerAvatar,
        genre: song.genre || 'Pop',
        streams,
        views,
        sales,
        tourGross: playerTourStats.totalTourGross,
        criticScore,
        chartPeak: chartInfo.peak,
        scoreBreakdown: breakdown
      });
    });
  } else if (category.subjectType === 'album') {
    releasedAlbums.forEach(proj => {
      const isPreferred = campaign.preferredAlbumId === proj.id;
      const bonus = (campaign.totalBonusScore || 0) + (isPreferred ? 2.4 : 0);
      const criticScore = clamp100((proj.quality || 65) * 0.7 + skillScore * 0.3);
      const streams =
        Number(proj.totalStreams) ||
        (proj.songs || []).reduce((acc, s) => acc + (Number(s.streams) || 0), 0);
      const sales = Number(proj.pureSales) || 0;

      const albChartItem = albums200.find(
        a => a.isPlayer && (a.title || '').toLowerCase() === (proj.title || '').toLowerCase()
      );
      const bestPeak = albChartItem ? albChartItem.peakPosition || albChartItem.peak || 20 : null;
      const chartScore = bestPeak ? clamp100(101 - bestPeak * 0.65) : 34;

      const commScore = clamp100(
        (streams > 0 ? Math.min(68, Math.log10(Math.max(5000, streams)) * 8.6) : 22) +
          (sales > 0 ? Math.min(32, Math.log10(Math.max(500, sales)) * 5.2) : 6)
      );

      const breakdown = computeWeightedFinal(
        criticScore,
        chartScore,
        commScore,
        playerTourStats.tourScore,
        playerHypePillar,
        bonus
      );

      candidates.push({
        id: `player_album_${proj.id}_${category.id}`,
        artistName: playerName,
        isPlayer: true,
        workTitle: proj.title,
        secondaryLabel: proj.type === 'ep' ? 'Official EP' : 'Studio Album',
        coverArt: proj.cover || playerAvatar,
        genre: proj.songs?.[0]?.genre || 'Pop',
        streams,
        views: 0,
        sales,
        tourGross: playerTourStats.totalTourGross,
        criticScore,
        chartPeak: bestPeak,
        scoreBreakdown: breakdown
      });
    });
  } else if (category.subjectType === 'artist' || category.subjectType === 'tour') {
    if (releasedSongs.length > 0 || playerTourStats.totalTourGross > 0) {
      const avgSongQuality =
        releasedSongs.length > 0
          ? releasedSongs.reduce((acc, s) => acc + (s.quality || 65), 0) / releasedSongs.length
          : 65;
      const criticScore = clamp100(avgSongQuality * 0.65 + skillScore * 0.35);
      const totalStreams = releasedSongs.reduce((acc, s) => acc + (Number(s.streams) || 0), 0);
      const totalSales = releasedSongs.reduce((acc, s) => acc + (Number(s.pureSales) || 0), 0);
      const totalViews = releasedSongs.reduce((acc, s) => acc + (Number(s.views) || 0), 0);

      let bestArtistPeak: number | null = null;
      releasedSongs.forEach(s => {
        const p = getSongChartPeak(s.title, playerName, true).peak;
        if (p !== null) bestArtistPeak = bestArtistPeak === null ? p : Math.min(bestArtistPeak, p);
      });
      const chartScore = bestArtistPeak !== null ? clamp100(101 - bestArtistPeak * 0.68) : 32;
      const commScore = clamp100(
        (totalStreams > 0 ? Math.min(72, Math.log10(Math.max(5000, totalStreams)) * 8.8) : 22) +
          (totalSales > 0 ? Math.min(28, Math.log10(Math.max(500, totalSales)) * 4.8) : 6)
      );

      const breakdown = computeWeightedFinal(
        criticScore,
        chartScore,
        commScore,
        playerTourStats.tourScore,
        playerHypePillar,
        campaign.totalBonusScore || 0
      );

      candidates.push({
        id: `player_${category.subjectType}_${category.id}`,
        artistName: playerName,
        isPlayer: true,
        workTitle:
          category.subjectType === 'tour' ? playerTourStats.tourLabel : playerName,
        secondaryLabel:
          category.subjectType === 'tour'
            ? `Tour Boxscore: $${(playerTourStats.totalTourGross / 1_000_000).toFixed(2)}M`
            : `${releasedSongs.length} Singles · ${releasedAlbums.length} Projects`,
        coverArt: playerAvatar,
        genre: releasedSongs[0]?.genre || 'Pop',
        streams: totalStreams,
        views: totalViews,
        sales: totalSales,
        tourGross: playerTourStats.totalTourGross,
        criticScore,
        chartPeak: bestArtistPeak,
        scoreBreakdown: breakdown
      });
    }
  }

  // --- 2. EVALUATE REAL-WORLD NPCs ---
  REAL_WORLD_NPCS.forEach((npc, idx) => {
    if (npc.name.toLowerCase() === playerName.toLowerCase()) return;
    if (!doesGenreMatchVanguardCategory(npc.genre, category)) return;

    const living = getNpcLivingAttributes(npc.name, 140, true);
    const npcPop = living.popularity || npc.pop || 80;
    const npcHype = living.hype || npc.hype || 78;
    const seed = hashSeed(`${npc.id}_${category.id}_${editionYear}`);
    const variance = ((seed % 140) - 70) / 10; // -7.0 to +7.0

    const criticScore = clamp100(
      living.skills.overallMastery * 0.62 +
        npcPop * 0.28 +
        variance
    );

    const npcHot100Item = hot100.find(
      c => !c.isPlayer && (c.artist || '').toLowerCase().includes(npc.name.toLowerCase())
    );
    const simulatedPeak = npcHot100Item
      ? npcHot100Item.peakPosition || npcHot100Item.peak || Math.max(1, (seed % 25) + 1)
      : Math.max(1, (seed % 38) + 1);

    const chartScore = clamp100(100 - simulatedPeak * 0.72 + npcPop * 0.12);
    const commScore = clamp100(npcPop * 0.78 + (seed % 18));
    const tourGross = Math.round((npcPop * 1_650_000) * (0.75 + (seed % 50) / 100));
    const tourVisScore = clamp100(
      living.skills.overallMastery * 0.52 + npcPop * 0.38 + (seed % 12)
    );
    const hypeScore = clamp100(npcPop * 0.5 + npcHype * 0.42 + (seed % 10));

    const firstSong = npc.songs?.[seed % Math.max(1, npc.songs?.length || 1)];
    const firstAlbum = npc.albums?.[seed % Math.max(1, npc.albums?.length || 1)];

    let workTitle = npc.name;
    let artistDisplay = npc.name;
    let secondaryLabel = npc.genre || 'Pop';
    let coverArt = npc.avatar;

    if (category.subjectType === 'song' || category.subjectType === 'collab') {
      workTitle = firstSong?.title || `${npc.name} Anthem`;
      if (category.subjectType === 'collab') {
        const partnerNpc = REAL_WORLD_NPCS[(idx + 5) % REAL_WORLD_NPCS.length];
        const partnerName =
          partnerNpc && partnerNpc.name.toLowerCase() !== npc.name.toLowerCase()
            ? partnerNpc.name
            : 'The Weeknd';
        artistDisplay = `${npc.name} & ${partnerName}`;
        secondaryLabel = `${npc.genre || 'Pop'} Collaboration`;
      } else {
        secondaryLabel = npc.genre || 'Pop';
      }
      coverArt = firstSong?.cover || npc.avatar;
    } else if (category.subjectType === 'album') {
      workTitle = firstAlbum?.title || `${npc.name} (Deluxe)`;
      secondaryLabel = 'Studio Album';
      coverArt = firstAlbum?.cover || npc.avatar;
    } else if (category.subjectType === 'tour') {
      workTitle = `The ${firstAlbum?.title || npc.name} World Tour`;
      secondaryLabel = `Tour Boxscore: $${(tourGross / 1_000_000).toFixed(1)}M`;
      coverArt = npc.avatar;
    }

    const streams = (firstSong?.streams || 120_000_000) + (seed % 95_000_000);
    const views = Math.round(streams * 0.34);
    const sales = Math.round(streams * 0.0045);

    const breakdown = computeWeightedFinal(
      criticScore,
      chartScore,
      commScore,
      tourVisScore,
      hypeScore,
      0
    );

    candidates.push({
      id: `npc_${npc.id}_${category.id}_${editionYear}`,
      artistName: artistDisplay,
      isPlayer: false,
      workTitle,
      secondaryLabel,
      coverArt,
      genre: npc.genre || 'Pop',
      streams,
      views,
      sales,
      tourGross,
      criticScore,
      chartPeak: simulatedPeak,
      scoreBreakdown: breakdown
    });
  });

  // Sort candidates by score descending to pick the top 6 eligible nominees
  candidates.sort((a, b) => b.scoreBreakdown.finalWeightedScore - a.scoreBreakdown.finalWeightedScore);

  // STRICT 1-ARTIST-PER-CATEGORY ENFORCEMENT:
  // If ANY participating artist in a candidate is already nominated in this category, skip it!
  const topSixByScore: VanguardNominee[] = [];
  const usedArtistKeys = new Set<string>();

  for (const cand of candidates) {
    const artistKeys = extractParticipatingArtistKeys(cand.artistName, cand.secondaryLabel);
    const hasOverlap = artistKeys.some(k => usedArtistKeys.has(k));
    if (hasOverlap) continue;

    artistKeys.forEach(k => usedArtistKeys.add(k));
    topSixByScore.push(cand);
    if (topSixByScore.length >= VANGUARD_CALENDAR_CONFIG.nomineesPerCategory) break;
  }

  const topWinner = { ...topSixByScore[0], isWinner: true };
  const markedTopSix = topSixByScore.map((n, idx) => ({
    ...n,
    isWinner: idx === 0
  }));

  // Create an UNSPOILED Official Ballot Order (sorted deterministically by ballot hash/title, NOT by score!)
  // so players cannot tell who won before opening the envelope on Ceremony Night.
  const ballotNominees = [...markedTopSix].sort((a, b) => {
    const hashA = hashSeed(`${a.workTitle}_${a.artistName}_${category.id}_ballot`);
    const hashB = hashSeed(`${b.workTitle}_${b.artistName}_${category.id}_ballot`);
    return hashA - hashB;
  });

  return {
    ballotNominees,
    winner: topWinner
  };
}

/**
 * Simulates an entire Vanguard Music Honors season for a given year
 */
export function simulateVanguardSeason(
  state: GameState,
  editionYear: number,
  phase: 'nominations_announced' | 'ceremony_completed'
): VanguardSeasonRecord {
  const vState = (state as any).vanguardState as VanguardSystemState | undefined;
  const campaign: VanguardCampaignState = vState?.campaign || {
    preferredSongId: null,
    preferredAlbumId: null,
    purchasedCampaignIds: [],
    totalBonusScore: 0
  };

  const categories: VanguardCategoryResult[] = VANGUARD_CATEGORIES.map(cat => {
    const { ballotNominees, winner } = buildCategoryNomineesAndWinner(
      state,
      cat,
      editionYear,
      campaign
    );

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      shortName: cat.shortName,
      field: cat.field,
      isMajor: cat.isMajor,
      subjectType: cat.subjectType,
      description: cat.description,
      nominees: ballotNominees,
      winner
    };
  });

  // Build artist tallies
  const tallyMap = new Map<string, VanguardArtistTally>();
  categories.forEach(cat => {
    cat.nominees.forEach(nom => {
      const key = nom.artistName.toLowerCase();
      let entry = tallyMap.get(key);
      if (!entry) {
        entry = {
          artistName: nom.artistName,
          isPlayer: nom.isPlayer,
          avatar: nom.coverArt,
          nominations: 0,
          wins: 0,
          majorWins: 0,
          nominatedCategories: [],
          wonCategories: []
        };
        tallyMap.set(key, entry);
      }
      entry.nominations += 1;
      entry.nominatedCategories.push(cat.shortName);
      if (nom.isWinner) {
        entry.wins += 1;
        if (cat.isMajor) entry.majorWins += 1;
        entry.wonCategories.push(cat.shortName);
      }
    });
  });

  const artistTallies = Array.from(tallyMap.values()).sort((a, b) => {
    if (phase === 'ceremony_completed' && b.wins !== a.wins) return b.wins - a.wins;
    return b.nominations - a.nominations;
  });

  const mostNominated =
    [...artistTallies].sort((a, b) => b.nominations - a.nominations)[0] || null;
  const biggestWinner =
    [...artistTallies].sort((a, b) => b.wins - a.wins)[0] || null;

  return {
    id: `vanguard_season_${editionYear}`,
    editionYear,
    editionLabel: `${editionYear} Vanguard Music Honors`,
    nominationsDate: `${editionYear}-05-10`,
    ceremonyDate: `${editionYear}-06-20`,
    phase,
    categories,
    artistTallies,
    biggestWinner,
    mostNominated
  };
}

/**
 * Ensures Vanguard state is initialized on GameState
 */
export function getEnsuredVanguardState(state: GameState): VanguardSystemState {
  const existing = (state as any).vanguardState as VanguardSystemState | undefined;
  if (existing && existing.initialized) {
    return existing;
  }

  const baseYear = state.artist?.startYear || 2026;
  const inauguralSeason = simulateVanguardSeason(
    state,
    baseYear - 1,
    'ceremony_completed'
  );

  return {
    initialized: true,
    campaign: {
      preferredSongId: null,
      preferredAlbumId: null,
      purchasedCampaignIds: [],
      totalBonusScore: 0
    },
    activeSeason: null,
    history: [inauguralSeason],
    pendingLiveModalSeason: null,
    lastProcessedDate: state.date ? state.date.split('T')[0] : ''
  };
}

/**
 * Purchase a Vanguard FYC Campaign Showcase tier
 */
export function purchaseVanguardCampaignTier(
  state: GameState,
  tierId: string
): {
  success: boolean;
  message: string;
  updatedMoney: number;
  updatedHype: number;
  updatedVanguardState: VanguardSystemState;
} {
  const vState = getEnsuredVanguardState(state);
  const tier = VANGUARD_CAMPAIGN_TIERS.find(t => t.id === tierId);
  if (!tier) {
    return {
      success: false,
      message: 'Campaign tier not found.',
      updatedMoney: state.money,
      updatedHype: state.hype,
      updatedVanguardState: vState
    };
  }

  if (vState.campaign.purchasedCampaignIds.includes(tierId)) {
    return {
      success: false,
      message: 'You have already activated this Vanguard Council campaign showcase for the current season.',
      updatedMoney: state.money,
      updatedHype: state.hype,
      updatedVanguardState: vState
    };
  }

  if ((state.money || 0) < tier.cost) {
    return {
      success: false,
      message: `Insufficient funds. You need $${tier.cost.toLocaleString()} to launch ${tier.name}.`,
      updatedMoney: state.money,
      updatedHype: state.hype,
      updatedVanguardState: vState
    };
  }

  const newPurchased = [...vState.campaign.purchasedCampaignIds, tierId];
  const newBonus = Math.min(
    6.5,
    Number(((vState.campaign.totalBonusScore || 0) + tier.scoreBonus).toFixed(1))
  );

  const updatedVanguardState: VanguardSystemState = {
    ...vState,
    campaign: {
      ...vState.campaign,
      purchasedCampaignIds: newPurchased,
      totalBonusScore: newBonus
    }
  };

  return {
    success: true,
    message: `Activated "${tier.name}"! (+${tier.scoreBonus} Vanguard Council Score Bonus & +${tier.hypeGain} Hype).`,
    updatedMoney: Math.max(0, (state.money || 0) - tier.cost),
    updatedHype: Math.min(100, Number(((state.hype || 0) + tier.hypeGain).toFixed(2))),
    updatedVanguardState
  };
}

/**
 * Set preferred Player song or album submission for Vanguard Music Honors
 */
export function setVanguardPreferredSubmission(
  state: GameState,
  type: 'song' | 'album',
  itemId: number | null
): VanguardSystemState {
  const vState = getEnsuredVanguardState(state);
  return {
    ...vState,
    campaign: {
      ...vState.campaign,
      preferredSongId: type === 'song' ? itemId : vState.campaign.preferredSongId,
      preferredAlbumId: type === 'album' ? itemId : vState.campaign.preferredAlbumId
    }
  };
}

/**
 * Generates official X posts for Vanguard Music Honors Nominations (May 10) and Live Ceremony Night (June 20)
 */
export function generateVanguardXPosts(
  state: GameState,
  season: VanguardSeasonRecord,
  eventType: 'nominations' | 'ceremony'
): XPost[] {
  const posts: XPost[] = [];
  const dateStr = state.date ? state.date.split('T')[0] : new Date().toISOString().split('T')[0];
  const playerName = state.artist?.name || '';

  const makePost = (params: {
    idSuffix: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    verifiedType: 'gold' | 'blue';
    category: 'chart' | 'media' | 'platform' | 'fanbase';
    content: string;
    image?: string;
    mediaBadge?: string;
    mediaTitle?: string;
    mediaSubtitle?: string;
    likesBase: number;
  }): XPost => {
    const likes = Math.round(params.likesBase * (0.92 + Math.random() * 0.2));
    const reposts = Math.round(likes * 0.24);
    const replies = Math.round(likes * 0.08);
    const views = Math.round(likes * 15);

    return {
      id: `vanguard_${season.id}_${eventType}_${params.idSuffix}_${Date.now()}`,
      authorName: params.authorName,
      authorHandle: params.authorHandle,
      authorAvatar: params.authorAvatar,
      isVerified: true,
      verifiedType: params.verifiedType,
      category: params.category,
      timeAgo: 'Just now',
      dateCreated: dateStr,
      content: params.content,
      image: params.image,
      mediaBadge: params.mediaBadge,
      mediaTitle: params.mediaTitle,
      mediaSubtitle: params.mediaSubtitle,
      likes,
      reposts,
      replies,
      views,
      bookmarks: Math.round(likes * 0.1),
      daysOld: 0
    };
  };

  if (eventType === 'nominations') {
    const topNominated = [...season.artistTallies]
      .sort((a, b) => b.nominations - a.nominations)
      .slice(0, 6);

    if (topNominated.length > 0) {
      const lines = topNominated
        .map((t, idx) => `#${idx + 1}. ${t.artistName} — ${t.nominations} nominations`)
        .join('\n');

      posts.push(
        makePost({
          idSuffix: 'most_nominated',
          authorName: 'chart data',
          authorHandle: '@chartdata',
          authorAvatar: CHARTDATA_AVATAR,
          verifiedType: 'gold',
          category: 'chart',
          content: `Most nominated artists at the ${season.editionLabel}:\n\n${lines}`,
          image: topNominated[0].avatar,
          mediaBadge: 'VANGUARD HONORS TALLY',
          mediaTitle: `${topNominated[0].artistName} leads with ${topNominated[0].nominations} Vanguard nominations`,
          mediaSubtitle: season.editionLabel,
          likesBase: 138000
        })
      );
    }

    const majorCats = season.categories.filter(c => c.isMajor).slice(0, 3);
    majorCats.forEach(cat => {
      const nomLines = cat.nominees
        .map(n =>
          n.workTitle === n.artistName
            ? `• ${n.artistName}`
            : `• "${n.workTitle}" — ${n.artistName}`
        )
        .join('\n');

      posts.push(
        makePost({
          idSuffix: `nom_${cat.categoryId}`,
          authorName: 'Vanguard Music Honors',
          authorHandle: '@VanguardHonors',
          authorAvatar: VANGUARD_AVATAR,
          verifiedType: 'gold',
          category: 'media',
          content: `OFFICIAL NOMINEES: ${cat.categoryName} (${season.editionLabel}):\n\n${nomLines}`,
          image: cat.nominees[0]?.coverArt,
          mediaBadge: 'OBSIDIAN MONOLITH NOMINEES',
          mediaTitle: cat.categoryName,
          mediaSubtitle: '1 Artist Per Category · Envelopes Sealed Until June 20',
          likesBase: 94000
        })
      );
    });
  } else {
    const topWinners = [...season.artistTallies]
      .filter(t => t.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 6);

    if (topWinners.length > 0) {
      const lines = topWinners
        .map((t, idx) => `#${idx + 1}. ${t.artistName} — ${t.wins} Monoliths`)
        .join('\n');

      posts.push(
        makePost({
          idSuffix: 'most_wins',
          authorName: 'chart data',
          authorHandle: '@chartdata',
          authorAvatar: CHARTDATA_AVATAR,
          verifiedType: 'gold',
          category: 'chart',
          content: `Most awarded artists at the ${season.editionLabel}:\n\n${lines}`,
          image: topWinners[0].avatar,
          mediaBadge: 'VANGUARD WINNERS HAUL',
          mediaTitle: `${topWinners[0].artistName} sweeps with ${topWinners[0].wins} Obsidian Monoliths`,
          mediaSubtitle: season.editionLabel,
          likesBase: 185000
        })
      );
    }

    const playerTally = season.artistTallies.find(
      t => t.isPlayer || t.artistName.toLowerCase() === playerName.toLowerCase()
    );
    if (playerTally && playerTally.wins > 0) {
      posts.push(
        makePost({
          idSuffix: 'player_victory',
          authorName: 'Pop Base',
          authorHandle: '@PopBase',
          authorAvatar: POPBASE_AVATAR,
          verifiedType: 'gold',
          category: 'media',
          content: `${playerTally.artistName} takes home ${playerTally.wins} Obsidian Vanguard Monolith${
            playerTally.wins > 1 ? 's' : ''
          } at the ${season.editionLabel} (${playerTally.wonCategories.join(', ')}).`,
          image: playerTally.avatar,
          mediaBadge: 'VANGUARD WINNER',
          mediaTitle: `${playerTally.artistName} wins ${playerTally.wins} Vanguard Honors`,
          mediaSubtitle: season.editionLabel,
          likesBase: 162000
        })
      );
    }
  }

  return posts;
}

/**
 * Daily calendar processor called inside useGame.ts nextDay transition
 */
export function processDailyVanguardHonorsStep(
  state: GameState,
  currentDate: Date
): {
  updatedVanguardState: VanguardSystemState;
  popGain: number;
  hypeGain: number;
  newXPosts: XPost[];
} {
  const vState = getEnsuredVanguardState(state);
  const dateKey = currentDate.toISOString().split('T')[0];

  if (vState.lastProcessedDate === dateKey) {
    return {
      updatedVanguardState: vState,
      popGain: 0,
      hypeGain: 0,
      newXPosts: []
    };
  }

  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth() + 1;
  const day = currentDate.getUTCDate();

  let updatedState: VanguardSystemState = {
    ...vState,
    lastProcessedDate: dateKey
  };
  let popGain = 0;
  let hypeGain = 0;
  let newXPosts: XPost[] = [];

  // 1. May 10: Official Vanguard Nominations Announcement (Envelopes Sealed!)
  if (
    month === VANGUARD_CALENDAR_CONFIG.nominationsMonth &&
    day === VANGUARD_CALENDAR_CONFIG.nominationsDay
  ) {
    const nomSeason = simulateVanguardSeason(state, year, 'nominations_announced');
    const playerTally = nomSeason.artistTallies.find(t => t.isPlayer);
    if (playerTally && playerTally.nominations > 0) {
      popGain += Math.min(2.5, playerTally.nominations * 0.35);
      hypeGain += Math.min(6.0, playerTally.nominations * 0.9);
    }

    updatedState = {
      ...updatedState,
      activeSeason: nomSeason,
      pendingLiveModalSeason: nomSeason
    };
    newXPosts = generateVanguardXPosts(state, nomSeason, 'nominations');
  }

  // 2. June 20: Live Vanguard Gala Ceremony Night (Interactive Envelope Reveal!)
  if (
    month === VANGUARD_CALENDAR_CONFIG.ceremonyMonth &&
    day === VANGUARD_CALENDAR_CONFIG.ceremonyDay
  ) {
    const ceremonySeason = simulateVanguardSeason(state, year, 'ceremony_completed');
    const playerTally = ceremonySeason.artistTallies.find(t => t.isPlayer);
    if (playerTally && playerTally.wins > 0) {
      popGain += Math.min(4.5, playerTally.wins * 0.8 + playerTally.majorWins * 0.6);
      hypeGain += Math.min(10.0, playerTally.wins * 1.8);
    }

    const filteredHistory = updatedState.history.filter(h => h.editionYear !== year);
    updatedState = {
      ...updatedState,
      activeSeason: ceremonySeason,
      history: [ceremonySeason, ...filteredHistory],
      pendingLiveModalSeason: ceremonySeason,
      campaign: {
        preferredSongId: null,
        preferredAlbumId: null,
        purchasedCampaignIds: [],
        totalBonusScore: 0
      }
    };
    newXPosts = generateVanguardXPosts(state, ceremonySeason, 'ceremony');
  }

  return {
    updatedVanguardState: updatedState,
    popGain,
    hypeGain,
    newXPosts
  };
}

export interface VanguardTrophyItem {
  id: string;
  show: 'vanguard';
  editionYear: number;
  editionLabel: string;
  categoryId: string;
  categoryName: string;
  workTitle: string;
  coverArt: string;
  isMajor: boolean;
  isWin: boolean;
  isCeremonyCompleted: boolean;
  finalScore: number;
}

export interface VanguardArtistTrophyProfile {
  artistName: string;
  isPlayer: boolean;
  avatar: string;
  vanguardWins: number;
  vanguardNominations: number;
  vanguardSupremeWins: number;
  trophies: VanguardTrophyItem[];
}

/**
 * Computes the complete Vanguard Music Honors Trophy Room profile for the Player or any NPC artist.
 * Strictly respects anti-spoiler rules: wins are only counted when season.phase === 'ceremony_completed'.
 */
export function getVanguardArtistTrophySummary(
  state: GameState,
  targetArtistName?: string
): VanguardArtistTrophyProfile {
  const vState = getEnsuredVanguardState(state);
  const playerName = state.artist?.name || 'Artist';
  const artistName = targetArtistName || playerName;
  const isPlayer = artistName.toLowerCase() === playerName.toLowerCase();

  const npcMatch = REAL_WORLD_NPCS.find(
    n => n.name.toLowerCase() === artistName.toLowerCase()
  );
  const avatar = isPlayer
    ? state.artist?.image ||
      `https://placehold.co/400x400/080B0F/D4AF37?text=${encodeURIComponent(
        artistName.charAt(0)
      )}`
    : npcMatch?.avatar ||
      (npcMatch as any)?.image ||
      `https://placehold.co/400x400/18181B/FFFFFF?text=${encodeURIComponent(
        artistName.charAt(0)
      )}`;

  let vanguardWins = 0;
  let vanguardNominations = 0;
  let vanguardSupremeWins = 0;
  const trophies: VanguardTrophyItem[] = [];

  const seasonsToScan: VanguardSeasonRecord[] = [...vState.history];
  if (
    vState.activeSeason &&
    !seasonsToScan.some(s => s.id === vState.activeSeason!.id)
  ) {
    seasonsToScan.unshift(vState.activeSeason);
  }

  const targetKey = artistName.trim().toLowerCase();

  seasonsToScan.forEach(season => {
    const isCompleted = season.phase === 'ceremony_completed';
    season.categories.forEach(cat => {
      cat.nominees.forEach(nom => {
        const participatingKeys = extractParticipatingArtistKeys(
          nom.artistName,
          nom.secondaryLabel
        );
        if (!participatingKeys.includes(targetKey)) return;

        const won = Boolean(isCompleted && nom.isWinner);
        vanguardNominations += 1;
        if (won) {
          vanguardWins += 1;
          if (cat.isMajor) vanguardSupremeWins += 1;
        }

        trophies.push({
          id: `${season.id}_${cat.categoryId}_${nom.workTitle}`,
          show: 'vanguard',
          editionYear: season.editionYear,
          editionLabel: season.editionLabel,
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          workTitle: nom.workTitle,
          coverArt: nom.coverArt,
          isMajor: cat.isMajor,
          isWin: won,
          isCeremonyCompleted: isCompleted,
          finalScore: nom.scoreBreakdown.finalWeightedScore
        });
      });
    });
  });

  trophies.sort((a, b) => {
    if (a.isWin !== b.isWin) return a.isWin ? -1 : 1;
    if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
    return b.editionYear - a.editionYear;
  });

  return {
    artistName,
    isPlayer,
    avatar,
    vanguardWins,
    vanguardNominations,
    vanguardSupremeWins,
    trophies
  };
}

