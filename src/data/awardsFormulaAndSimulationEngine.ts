// Awards Formula, Eligibility, Nomination & Winner Simulation Engine
// Powers both The GRAMMY Awards and MTV Video Music Awards (VMAs)
// Evaluates Player and NPCs using the exact same multi-factor formula:
// Quality/Craft Mastery, Billboard Chart Peak & Longevity, Commercial Streams/Sales,
// YouTube MV Visual Velocity, Fanbase/Cultural Hype, and FYC/Voting Campaigns.

import { GameState, ChartItem } from '../types';
import { REAL_WORLD_NPCS } from './realWorldArtistCatalog';
import { getNpcLivingAttributes } from './npcLivingArtistAttributesAndMarketEngine';
import { getEnsuredSkillState, calculateMasteryRank } from './skillSystemEngine';
import {
  AwardShowType,
  AwardCategoryDef,
  AWARD_CALENDAR_CONFIG,
  CAMPAIGN_TIER_OPTIONS,
  getCategoriesForShow,
  doesGenreMatchCategory
} from './awardsCategoriesConfig';

export interface NomineeScoreBreakdown {
  qualityAndCraft: number;    // 0 - 100
  chartImpact: number;        // 0 - 100
  commercialVolume: number;   // 0 - 100
  visualVelocity: number;     // 0 - 100
  fanAndCulturalHype: number; // 0 - 100
  campaignBonus: number;      // 0 - 6.5
  finalWeightedScore: number; // 0 - 106.5
}

export interface AwardNominee {
  id: string;
  artistName: string;
  isPlayer: boolean;
  workTitle: string;          // Song title, Album title, MV title, or Artist Name
  secondaryLabel: string;     // Featured artist, Genre, or format credit
  coverArt: string;
  genre: string;
  streams: number;
  views: number;
  sales: number;
  chartPeak: number | null;
  scoreBreakdown: NomineeScoreBreakdown;
  isWinner?: boolean;
}

export interface AwardCategoryResult {
  categoryId: string;
  categoryName: string;
  shortName: string;
  field: string;
  isMajor: boolean;
  subjectType: string;
  nominees: AwardNominee[];
  winner: AwardNominee;
}

export interface ArtistAwardTally {
  artistName: string;
  isPlayer: boolean;
  avatar: string;
  nominations: number;
  wins: number;
  majorWins: number;
  nominatedCategories: string[];
  wonCategories: string[];
}

export interface AwardSeasonRecord {
  id: string;
  show: AwardShowType;
  editionYear: number;
  editionLabel: string;       // e.g. "68th Annual GRAMMY Awards" or "2026 MTV Video Music Awards"
  nominationsDate: string;
  ceremonyDate: string;
  phase: 'nominations_announced' | 'ceremony_completed';
  categories: AwardCategoryResult[];
  artistTallies: ArtistAwardTally[];
  biggestWinner: ArtistAwardTally | null;
  mostNominated: ArtistAwardTally | null;
}

export interface PlayerShowCampaignState {
  preferredSongId?: number | null;
  preferredAlbumId?: number | null;
  preferredVideoSongId?: number | null;
  purchasedCampaignIds: string[];
  totalBonusScore: number;
}

export interface AwardsSystemState {
  initialized: boolean;
  grammysCampaign: PlayerShowCampaignState;
  vmasCampaign: PlayerShowCampaignState;
  activeSeasons: {
    grammys: AwardSeasonRecord | null;
    vmas: AwardSeasonRecord | null;
  };
  history: AwardSeasonRecord[];
  pendingLiveCeremony: AwardSeasonRecord | null;
  pendingNominationsAnnouncement: AwardSeasonRecord | null;
  lastProcessedDate: string;
}

export interface TrophyItem {
  id: string;
  show: AwardShowType;
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

export interface ArtistTrophyRoomProfile {
  artistName: string;
  isPlayer: boolean;
  avatar: string;
  grammyWins: number;
  grammyNominations: number;
  grammyBigFourWins: number;
  vmaWins: number;
  vmaNominations: number;
  vmaMajorWins: number;
  totalWins: number;
  totalNominations: number;
  trophies: TrophyItem[];
}

let cachedFallbackAwardsState: AwardsSystemState | null = null;
let cachedFallbackArtistKey = '';

function clamp100(val: number): number {
  return Math.max(10, Math.min(100, Number(val.toFixed(1))));
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
 * Computes the official edition title for a given year and award show
 */
export function getAwardEditionLabel(show: AwardShowType, year: number): string {
  if (show === 'grammys') {
    const editionNum = Math.max(67, year - 1958); // 2026 = 68th Annual GRAMMY Awards
    const suffix =
      editionNum % 10 === 1 && editionNum % 100 !== 11
        ? 'st'
        : editionNum % 10 === 2 && editionNum % 100 !== 12
        ? 'nd'
        : editionNum % 10 === 3 && editionNum % 100 !== 13
        ? 'rd'
        : 'th';
    return `${editionNum}${suffix} Annual GRAMMY Awards`;
  }
  return `${year} MTV Video Music Awards`;
}

/**
 * Ensures the AwardsSystemState exists on GameState and caches fallback initialization
 * so UI components never trigger redundant simulations on re-render.
 */
export function getEnsuredAwardsState(state: GameState): AwardsSystemState {
  const existing = (state as any).awardsState as AwardsSystemState | undefined;
  if (existing && existing.initialized) {
    return existing;
  }

  const artistKey = `${state.artist?.name || 'Player'}_${(state.songs || []).length}`;
  if (cachedFallbackAwardsState && cachedFallbackArtistKey === artistKey) {
    return cachedFallbackAwardsState;
  }

  const seededHistory = generateInauguralPastSeasons(state);

  const built: AwardsSystemState = {
    initialized: true,
    grammysCampaign: {
      preferredSongId: null,
      preferredAlbumId: null,
      preferredVideoSongId: null,
      purchasedCampaignIds: [],
      totalBonusScore: 0
    },
    vmasCampaign: {
      preferredSongId: null,
      preferredAlbumId: null,
      preferredVideoSongId: null,
      purchasedCampaignIds: [],
      totalBonusScore: 0
    },
    activeSeasons: {
      grammys: null,
      vmas: null
    },
    history: seededHistory,
    pendingLiveCeremony: null,
    pendingNominationsAnnouncement: null,
    lastProcessedDate: state.date ? state.date.split('T')[0] : '2026-01-01'
  };

  cachedFallbackAwardsState = built;
  cachedFallbackArtistKey = artistKey;
  return built;
}

interface UnifiedAwardCandidate {
  id: string;
  artistName: string;
  isPlayer: boolean;
  avatar: string;
  workTitle: string;
  secondaryLabel: string;
  coverArt: string;
  genre: string;
  subjectType: 'song' | 'album' | 'video' | 'artist' | 'collab';
  isCollab: boolean;
  hasMV: boolean;
  qualityScore: number;       // 0 - 100
  craftMasteryScore: number;  // 0 - 100
  streams: number;
  views: number;
  sales: number;
  chartPeak: number | null;
  weeksOnChart: number;
  popularity: number;
  hype: number;
  fans: number;
  tier: number;
  isPreferredByPlayer?: boolean;
}

/**
 * Collects all eligible candidates (Songs, Albums, Videos, Collabs, Artists)
 * from both the Player and the living NPC ecosystem.
 */
function collectUnifiedCandidates(
  state: GameState,
  show: AwardShowType,
  year: number
): UnifiedAwardCandidate[] {
  const candidates: UnifiedAwardCandidate[] = [];
  const playerName = state.artist?.name || 'Player';
  const playerAvatar =
    state.artist?.image ||
    `https://placehold.co/400x400/121216/D4AF37?text=${encodeURIComponent(playerName.charAt(0))}`;

  const playerSkills = getEnsuredSkillState(state.skills);
  const playerMastery = calculateMasteryRank(playerSkills);
  const playerCraftScore = clamp100(
    (playerMastery.averages.songwriting +
      playerMastery.averages.recording +
      playerMastery.averages.production) *
      10
  );

  const awardsState = (state as any).awardsState as AwardsSystemState | undefined;
  const campaignState =
    show === 'grammys' ? awardsState?.grammysCampaign : awardsState?.vmasCampaign;

  // Lookup map for chart peaks from Billboard Hot 100, Global 200 & Albums 200
  const songPeakMap = new Map<string, { peak: number; weeks: number }>();
  const albumPeakMap = new Map<string, { peak: number; weeks: number }>();

  const registerChartItems = (items: ChartItem[] | undefined, isAlbum: boolean) => {
    (items || []).forEach((item, index) => {
      if (!item) return;
      const key = `${(item.artist || '').toLowerCase()}::${(item.title || '').toLowerCase()}`;
      const pos = index + 1;
      const peak = Math.min(pos, item.peakPosition || item.peak || pos);
      const weeks = Math.max(1, item.weeksOnChart || item.weeks || 1);
      const targetMap = isAlbum ? albumPeakMap : songPeakMap;
      const prev = targetMap.get(key);
      if (!prev || peak < prev.peak) {
        targetMap.set(key, { peak, weeks: Math.max(weeks, prev?.weeks || 1) });
      }
    });
  };

  registerChartItems(state.billboard?.hot100, false);
  registerChartItems(state.billboard?.global200, false);
  registerChartItems(state.billboard?.albums200, true);

  if (state.billboard?.playerHistory) {
    Object.values(state.billboard.playerHistory).forEach(list => {
      (list || []).forEach(entry => {
        if (!entry) return;
        const key = `${playerName.toLowerCase()}::${(entry.title || '').toLowerCase()}`;
        const targetMap = entry.chartType === 'albums200' ? albumPeakMap : songPeakMap;
        const prev = targetMap.get(key);
        if (!prev || entry.peakPosition < prev.peak) {
          targetMap.set(key, {
            peak: entry.peakPosition,
            weeks: Math.max(entry.weeksOnChart || 1, prev?.weeks || 1)
          });
        }
      });
    });
  }

  // 1. ADD PLAYER SONGS, VIDEOS & COLLABS
  const releasedPlayerSongs = (state.songs || []).filter(s => s && s.status === 'released');
  releasedPlayerSongs.forEach(song => {
    const songTitle = song.title || 'Untitled';
    const key = `${playerName.toLowerCase()}::${songTitle.toLowerCase()}`;
    const chartInfo = songPeakMap.get(key);
    const hasCollab = Boolean(song.collabId && song.collabId !== 'none' && song.collabId !== '');
    const collabNpc = hasCollab
      ? REAL_WORLD_NPCS.find(n => n.id === song.collabId || n.name === song.collabId)
      : null;

    const secondaryLabel = collabNpc
      ? `feat. ${collabNpc.name} · ${song.genre || 'Pop'}`
      : `${song.genre || 'Pop'}`;

    const isPreferredSong = campaignState?.preferredSongId === song.id;
    const isPreferredVideo = campaignState?.preferredVideoSongId === song.id;

    candidates.push({
      id: `player_song_${song.id}`,
      artistName: playerName,
      isPlayer: true,
      avatar: playerAvatar,
      workTitle: songTitle,
      secondaryLabel,
      coverArt: song.cover || playerAvatar,
      genre: song.genre || 'Pop',
      subjectType: 'song',
      isCollab: hasCollab,
      hasMV: Boolean(song.hasMV),
      qualityScore: clamp100(song.quality || 72),
      craftMasteryScore: playerCraftScore,
      streams: Math.max(0, song.streams || 0),
      views: Math.max(0, song.views || 0),
      sales: Math.max(0, song.pureSales || 0),
      chartPeak: chartInfo?.peak || null,
      weeksOnChart: chartInfo?.weeks || 0,
      popularity: state.popularity || 2,
      hype: state.hype || 15,
      fans: state.fans || 250,
      tier: state.artist?.tier || 3,
      isPreferredByPlayer: isPreferredSong
    });

    if (hasCollab) {
      candidates.push({
        id: `player_collab_${song.id}`,
        artistName: `${playerName} & ${collabNpc ? collabNpc.name : song.collabId}`,
        isPlayer: true,
        avatar: playerAvatar,
        workTitle: songTitle,
        secondaryLabel: `Official Collaboration · ${song.genre || 'Pop'}`,
        coverArt: song.cover || playerAvatar,
        genre: song.genre || 'Pop',
        subjectType: 'collab',
        isCollab: true,
        hasMV: Boolean(song.hasMV),
        qualityScore: clamp100((song.quality || 75) + 3),
        craftMasteryScore: playerCraftScore,
        streams: Math.max(0, song.streams || 0),
        views: Math.max(0, song.views || 0),
        sales: Math.max(0, song.pureSales || 0),
        chartPeak: chartInfo?.peak || null,
        weeksOnChart: chartInfo?.weeks || 0,
        popularity: state.popularity || 2,
        hype: state.hype || 15,
        fans: state.fans || 250,
        tier: state.artist?.tier || 3,
        isPreferredByPlayer: isPreferredSong
      });
    }

    if (song.hasMV) {
      candidates.push({
        id: `player_video_${song.id}`,
        artistName: playerName,
        isPlayer: true,
        avatar: playerAvatar,
        workTitle: songTitle,
        secondaryLabel: `${song.mvDistributor === 'vevo' ? 'VEVO Official Video' : 'Official Music Video'} · ${song.genre || 'Pop'}`,
        coverArt: song.mvThumbnail || song.cover || playerAvatar,
        genre: song.genre || 'Pop',
        subjectType: 'video',
        isCollab: hasCollab,
        hasMV: true,
        qualityScore: clamp100((song.quality || 72) + (song.mvDistributor === 'vevo' ? 4 : 0)),
        craftMasteryScore: playerCraftScore,
        streams: Math.max(0, song.streams || 0),
        views: Math.max(0, song.views || 0),
        sales: Math.max(0, song.pureSales || 0),
        chartPeak: chartInfo?.peak || null,
        weeksOnChart: chartInfo?.weeks || 0,
        popularity: state.popularity || 2,
        hype: state.hype || 15,
        fans: state.fans || 250,
        tier: state.artist?.tier || 3,
        isPreferredByPlayer: isPreferredVideo || isPreferredSong
      });
    }
  });

  // 2. ADD PLAYER ALBUMS / PROJECTS
  const releasedPlayerProjects = (state.projects || []).filter(
    p => p && p.status === 'released' && (p.type === 'album' || p.type === 'ep')
  );
  releasedPlayerProjects.forEach(proj => {
    const projTitle = proj.title || 'Untitled Project';
    const key = `${playerName.toLowerCase()}::${projTitle.toLowerCase()}`;
    const chartInfo = albumPeakMap.get(key);
    const primaryGenre = proj.songs?.[0]?.genre || 'Pop';
    const totalStreams =
      proj.totalStreams ||
      (proj.songs || []).reduce((acc, s) => acc + (s?.streams || 0), 0);
    const totalViews = (proj.songs || []).reduce((acc, s) => acc + (s?.views || 0), 0);
    const isPreferredAlbum = campaignState?.preferredAlbumId === proj.id;

    candidates.push({
      id: `player_album_${proj.id}`,
      artistName: playerName,
      isPlayer: true,
      avatar: playerAvatar,
      workTitle: projTitle,
      secondaryLabel: `${proj.type === 'album' ? 'Studio Album' : 'Extended Play'} · ${proj.songs?.length || 1} Tracks`,
      coverArt: proj.cover || playerAvatar,
      genre: primaryGenre,
      subjectType: 'album',
      isCollab: false,
      hasMV: false,
      qualityScore: clamp100(proj.quality || 75),
      craftMasteryScore: playerCraftScore,
      streams: Math.max(0, totalStreams),
      views: Math.max(0, totalViews),
      sales: Math.max(0, proj.pureSales || 0),
      chartPeak: chartInfo?.peak || null,
      weeksOnChart: chartInfo?.weeks || 0,
      popularity: state.popularity || 2,
      hype: state.hype || 15,
      fans: state.fans || 250,
      tier: state.artist?.tier || 3,
      isPreferredByPlayer: isPreferredAlbum
    });
  });

  // 3. ADD PLAYER ARTIST CANDIDATE
  if (releasedPlayerSongs.length > 0) {
    const totalPlayerStreams = releasedPlayerSongs.reduce((acc, s) => acc + (s.streams || 0), 0);
    const totalPlayerViews = releasedPlayerSongs.reduce((acc, s) => acc + (s.views || 0), 0);
    const totalPlayerSales =
      releasedPlayerSongs.reduce((acc, s) => acc + (s.pureSales || 0), 0) +
      releasedPlayerProjects.reduce((acc, p) => acc + (p.pureSales || 0), 0);
    const bestSongQuality = Math.max(...releasedPlayerSongs.map(s => s.quality || 70));
    const bestChartPeak = releasedPlayerSongs.reduce<number | null>((best, s) => {
      const k = `${playerName.toLowerCase()}::${(s.title || '').toLowerCase()}`;
      const pk = songPeakMap.get(k)?.peak || null;
      if (pk === null) return best;
      return best === null ? pk : Math.min(best, pk);
    }, null);

    candidates.push({
      id: `player_artist_${playerName}`,
      artistName: playerName,
      isPlayer: true,
      avatar: playerAvatar,
      workTitle: playerName,
      secondaryLabel: `${releasedPlayerSongs[0]?.genre || 'Pop'} · ${releasedPlayerSongs.length} Releases`,
      coverArt: playerAvatar,
      genre: releasedPlayerSongs[0]?.genre || 'Pop',
      subjectType: 'artist',
      isCollab: false,
      hasMV: releasedPlayerSongs.some(s => s.hasMV),
      qualityScore: clamp100(bestSongQuality),
      craftMasteryScore: playerCraftScore,
      streams: totalPlayerStreams,
      views: totalPlayerViews,
      sales: totalPlayerSales,
      chartPeak: bestChartPeak,
      weeksOnChart: 8,
      popularity: state.popularity || 2,
      hype: state.hype || 15,
      fans: state.fans || 250,
      tier: state.artist?.tier || 3,
      isPreferredByPlayer: true
    });
  }

  // 4. ADD NPC CANDIDATES
  const dayOfYear = Math.max(
    1,
    Math.floor(
      (new Date(state.date || '2026-01-01').getTime() - new Date(`${year}-01-01`).getTime()) /
        86400000
    )
  );

  REAL_WORLD_NPCS.forEach((npc, npcIdx) => {
    if (!npc || !npc.name) return;
    if (npc.name.toLowerCase() === playerName.toLowerCase()) return;

    const living = getNpcLivingAttributes(npc.name, dayOfYear, true);
    const seed = hashSeed(`${npc.id}_${year}_${show}`);
    const npcAvatar =
      npc.image ||
      npc.avatar ||
      `https://placehold.co/400x400/18181B/FFFFFF?text=${encodeURIComponent(npc.name.charAt(0))}`;
    const npcGenre = npc.genre || 'Pop';

    const npcSongs = (npc.songs || []).slice(0, 3);
    npcSongs.forEach((song, sIdx) => {
      if (!song || !song.title) return;
      const sKey = `${npc.name.toLowerCase()}::${song.title.toLowerCase()}`;
      const chartData = songPeakMap.get(sKey);
      const songSeed = hashSeed(`${npc.id}_${song.title}_${year}`);

      const estimatedPeak =
        chartData?.peak ||
        Math.max(1, Math.min(95, Math.round(102 - living.popularity * 0.92 + (songSeed % 18) - 6)));
      const estimatedWeeks =
        chartData?.weeks || Math.max(2, Math.min(42, Math.round(living.popularity / 4) + (songSeed % 10)));

      const trackQuality = clamp100(
        living.skills.overallMastery * 0.62 +
          living.skills.songwriting * 0.22 +
          ((songSeed % 16) + 4)
      );

      const totalStreams = Math.max(
        song.streams || 15_000_000,
        Math.round(living.fans * (12 + (songSeed % 18)) * living.streamSynergyMultiplier)
      );
      const totalViews = Math.max(
        Math.round(totalStreams * (0.42 + ((songSeed % 28) / 100)) * living.youtubeViewSynergyMultiplier),
        5_000_000
      );
      const totalSales = Math.max(
        song.sales || 45_000,
        Math.round((totalStreams / 450) * living.salesSynergyMultiplier)
      );

      const cover = song.cover || npcAvatar;
      const isCollabTrack =
        song.title.toLowerCase().includes('feat') ||
        song.title.toLowerCase().includes('with') ||
        (songSeed % 5 === 0 && sIdx === 1);
      const collabPartner = isCollabTrack
        ? REAL_WORLD_NPCS[(npcIdx + 3 + (songSeed % 7)) % REAL_WORLD_NPCS.length]?.name || 'Special Guest'
        : '';

      candidates.push({
        id: `npc_song_${npc.id}_${sIdx}`,
        artistName: npc.name,
        isPlayer: false,
        avatar: npcAvatar,
        workTitle: song.title,
        secondaryLabel: isCollabTrack ? `feat. ${collabPartner} · ${npcGenre}` : npcGenre,
        coverArt: cover,
        genre: npcGenre,
        subjectType: 'song',
        isCollab: isCollabTrack,
        hasMV: true,
        qualityScore: trackQuality,
        craftMasteryScore: living.skills.overallMastery,
        streams: totalStreams,
        views: totalViews,
        sales: totalSales,
        chartPeak: estimatedPeak,
        weeksOnChart: estimatedWeeks,
        popularity: living.popularity,
        hype: living.hype,
        fans: living.fans,
        tier: living.tier
      });

      candidates.push({
        id: `npc_video_${npc.id}_${sIdx}`,
        artistName: npc.name,
        isPlayer: false,
        avatar: npcAvatar,
        workTitle: song.title,
        secondaryLabel: `Official Music Video · ${npcGenre}`,
        coverArt: cover,
        genre: npcGenre,
        subjectType: 'video',
        isCollab: isCollabTrack,
        hasMV: true,
        qualityScore: clamp100(trackQuality * 0.55 + living.skills.visuals * 0.45),
        craftMasteryScore: living.skills.visuals,
        streams: totalStreams,
        views: totalViews,
        sales: totalSales,
        chartPeak: estimatedPeak,
        weeksOnChart: estimatedWeeks,
        popularity: living.popularity,
        hype: living.hype,
        fans: living.fans,
        tier: living.tier
      });

      if (isCollabTrack) {
        candidates.push({
          id: `npc_collab_${npc.id}_${sIdx}`,
          artistName: `${npc.name} & ${collabPartner}`,
          isPlayer: false,
          avatar: npcAvatar,
          workTitle: song.title,
          secondaryLabel: `Collaboration · ${npcGenre}`,
          coverArt: cover,
          genre: npcGenre,
          subjectType: 'collab',
          isCollab: true,
          hasMV: true,
          qualityScore: trackQuality,
          craftMasteryScore: living.skills.overallMastery,
          streams: totalStreams,
          views: totalViews,
          sales: totalSales,
          chartPeak: estimatedPeak,
          weeksOnChart: estimatedWeeks,
          popularity: living.popularity,
          hype: living.hype,
          fans: living.fans,
          tier: living.tier
        });
      }
    });

    const topAlbum = (npc.albums || [])[0];
    if (topAlbum && topAlbum.title) {
      const aKey = `${npc.name.toLowerCase()}::${topAlbum.title.toLowerCase()}`;
      const albChart = albumPeakMap.get(aKey);
      const albSeed = hashSeed(`${npc.id}_album_${topAlbum.title}_${year}`);
      const albPeak =
        albChart?.peak ||
        Math.max(1, Math.min(80, Math.round(98 - living.popularity * 0.9 + (albSeed % 14) - 5)));
      const albWeeks = albChart?.weeks || Math.max(3, Math.min(48, Math.round(living.popularity / 3.5)));

      const albQuality = clamp100(
        living.skills.overallMastery * 0.65 +
          living.skills.production * 0.20 +
          ((albSeed % 15) + 3)
      );
      const albStreams = Math.max(
        topAlbum.streams || 85_000_000,
        Math.round(living.fans * (34 + (albSeed % 30)) * living.streamSynergyMultiplier)
      );
      const albSales = Math.max(
        topAlbum.sales || 120_000,
        Math.round((albStreams / 320) * living.salesSynergyMultiplier)
      );

      candidates.push({
        id: `npc_album_${npc.id}_0`,
        artistName: npc.name,
        isPlayer: false,
        avatar: npcAvatar,
        workTitle: topAlbum.title,
        secondaryLabel: `Studio Album · ${npcGenre}`,
        coverArt: topAlbum.cover || npcAvatar,
        genre: npcGenre,
        subjectType: 'album',
        isCollab: false,
        hasMV: false,
        qualityScore: albQuality,
        craftMasteryScore: living.skills.overallMastery,
        streams: albStreams,
        views: Math.round(albStreams * 0.35),
        sales: albSales,
        chartPeak: albPeak,
        weeksOnChart: albWeeks,
        popularity: living.popularity,
        hype: living.hype,
        fans: living.fans,
        tier: living.tier
      });
    }

    candidates.push({
      id: `npc_artist_${npc.id}`,
      artistName: npc.name,
      isPlayer: false,
      avatar: npcAvatar,
      workTitle: npc.name,
      secondaryLabel: `${npcGenre} · Global Recording Artist`,
      coverArt: npcAvatar,
      genre: npcGenre,
      subjectType: 'artist',
      isCollab: false,
      hasMV: true,
      qualityScore: clamp100(living.skills.overallMastery + ((seed % 11) - 4)),
      craftMasteryScore: living.skills.overallMastery,
      streams: Math.round(living.fans * 48 * living.streamSynergyMultiplier),
      views: Math.round(living.fans * 24 * living.youtubeViewSynergyMultiplier),
      sales: Math.round(living.fans * 0.16 * living.salesSynergyMultiplier),
      chartPeak: Math.max(1, Math.round(100 - living.popularity * 0.92)),
      weeksOnChart: 18,
      popularity: living.popularity,
      hype: living.hype,
      fans: living.fans,
      tier: living.tier
    });
  });

  return candidates;
}

/**
 * Evaluates a candidate's 0-100 sub-scores and weighted total for a specific category
 */
export function evaluateCandidateForCategory(
  candidate: UnifiedAwardCandidate,
  category: AwardCategoryDef,
  playerCampaignBonus: number,
  editionYear: number
): NomineeScoreBreakdown {
  const qualityAndCraft = clamp100(
    candidate.qualityScore * 0.68 + candidate.craftMasteryScore * 0.32
  );

  let chartImpact = 32;
  if (candidate.chartPeak !== null && candidate.chartPeak > 0) {
    const peakPoints =
      candidate.chartPeak === 1
        ? 96
        : candidate.chartPeak <= 3
        ? 91
        : candidate.chartPeak <= 5
        ? 86
        : candidate.chartPeak <= 10
        ? 80
        : candidate.chartPeak <= 25
        ? 68
        : candidate.chartPeak <= 50
        ? 55
        : Math.max(35, 100 - candidate.chartPeak * 0.65);
    const longevityBonus = Math.min(12, candidate.weeksOnChart * 0.45);
    chartImpact = clamp100(peakPoints * 0.88 + longevityBonus);
  } else {
    const streamImplied = Math.min(72, Math.log10(Math.max(10_000, candidate.streams)) * 9.2);
    chartImpact = clamp100(streamImplied);
  }

  const streamLog = Math.log10(Math.max(1_000, candidate.streams));
  const salesLog = Math.log10(Math.max(100, candidate.sales));
  const streamNorm = Math.min(100, Math.max(15, (streamLog - 4.2) * 18.5));
  const salesNorm = Math.min(100, Math.max(15, (salesLog - 2.2) * 21.0));
  const commercialVolume = clamp100(streamNorm * 0.68 + salesNorm * 0.32);

  const viewsLog = Math.log10(Math.max(1_000, candidate.views));
  const visualVelocity = candidate.hasMV
    ? clamp100(Math.min(100, Math.max(18, (viewsLog - 4.0) * 19.2)))
    : clamp100(streamNorm * 0.45);

  const fanLog = Math.log10(Math.max(250, candidate.fans));
  const fanNorm = Math.min(100, Math.max(18, (fanLog - 2.3) * 16.5));
  const fanAndCulturalHype = clamp100(
    candidate.popularity * 0.38 + candidate.hype * 0.34 + fanNorm * 0.28
  );

  let campaignBonus = 0;
  if (candidate.isPlayer) {
    campaignBonus = playerCampaignBonus + (candidate.isPreferredByPlayer ? 1.8 : 0);
  } else {
    const npcSeed = hashSeed(`${candidate.id}_${category.id}_${editionYear}`);
    campaignBonus = Number((((npcSeed % 38) / 10) * (candidate.popularity / 95)).toFixed(2));
  }

  const jurySeed = hashSeed(`${candidate.id}::${category.id}::${editionYear}`);
  const juryVariance = ((jurySeed % 37) - 18) * 0.1;

  const baseWeighted =
    qualityAndCraft * category.weights.qualityAndCraft +
    chartImpact * category.weights.chartImpact +
    commercialVolume * category.weights.commercialVolume +
    visualVelocity * category.weights.visualVelocity +
    fanAndCulturalHype * category.weights.fanAndCulturalHype;

  const finalWeightedScore = Number(
    Math.max(15, baseWeighted + campaignBonus + juryVariance).toFixed(2)
  );

  return {
    qualityAndCraft,
    chartImpact,
    commercialVolume,
    visualVelocity,
    fanAndCulturalHype,
    campaignBonus: Number(campaignBonus.toFixed(2)),
    finalWeightedScore
  };
}

/**
 * Generates a full season of Nominations & Winners for a given show and year.
 * IMPORTANT: Nominees are ordered alphabetically by title/artist on the ballot so
 * the winner's position is never spoiled before the envelope is opened!
 */
export function simulateAwardSeason(
  state: GameState,
  show: AwardShowType,
  editionYear: number,
  phase: 'nominations_announced' | 'ceremony_completed'
): AwardSeasonRecord {
  const categories = getCategoriesForShow(show);
  const allCandidates = collectUnifiedCandidates(state, show, editionYear);
  const awardsState = (state as any).awardsState as AwardsSystemState | undefined;
  const playerCampaign =
    show === 'grammys'
      ? awardsState?.grammysCampaign?.totalBonusScore || 0
      : awardsState?.vmasCampaign?.totalBonusScore || 0;

  const categoryResults: AwardCategoryResult[] = [];
  const tallyMap = new Map<string, ArtistAwardTally>();

  const registerTally = (nominee: AwardNominee, isWin: boolean, isMajor: boolean, categoryName: string) => {
    const primaryArtist = nominee.artistName.split(' & ')[0].split(' feat.')[0].trim();
    const key = primaryArtist.toLowerCase();
    const existing = tallyMap.get(key) || {
      artistName: primaryArtist,
      isPlayer: nominee.isPlayer,
      avatar: nominee.coverArt,
      nominations: 0,
      wins: 0,
      majorWins: 0,
      nominatedCategories: [],
      wonCategories: []
    };
    existing.nominations += 1;
    existing.nominatedCategories.push(categoryName);
    if (isWin) {
      existing.wins += 1;
      if (isMajor) existing.majorWins += 1;
      existing.wonCategories.push(categoryName);
    }
    tallyMap.set(key, existing);
  };

  categories.forEach(cat => {
    let pool = allCandidates.filter(c => {
      if (cat.subjectType === 'collab') {
        return c.subjectType === 'collab' || c.isCollab;
      }
      if (c.subjectType !== cat.subjectType) return false;
      if (cat.id.endsWith('_bna')) {
        return c.tier >= 2 || c.isPlayer || c.popularity <= 88;
      }
      return doesGenreMatchCategory(c.genre, cat);
    });

    if (pool.length < 6) {
      pool = allCandidates.filter(c => c.subjectType === (cat.subjectType === 'collab' ? 'song' : cat.subjectType));
    }

    const scored = pool.map(c => {
      const breakdown = evaluateCandidateForCategory(c, cat, playerCampaign, editionYear);
      const nominee: AwardNominee = {
        id: `${cat.id}_${c.id}`,
        artistName: c.artistName,
        isPlayer: c.isPlayer,
        workTitle: c.workTitle,
        secondaryLabel: c.secondaryLabel,
        coverArt: c.coverArt,
        genre: c.genre,
        streams: c.streams,
        views: c.views,
        sales: c.sales,
        chartPeak: c.chartPeak,
        scoreBreakdown: breakdown,
        isWinner: false
      };
      return nominee;
    });

    scored.sort((a, b) => b.scoreBreakdown.finalWeightedScore - a.scoreBreakdown.finalWeightedScore);

    const topNominees: AwardNominee[] = [];
    const artistCountInCat = new Map<string, number>();

    for (const nom of scored) {
      if (topNominees.length >= AWARD_CALENDAR_CONFIG[show].nomineesPerCategory) break;
      const aKey = nom.artistName.toLowerCase();
      const currentCount = artistCountInCat.get(aKey) || 0;
      const maxAllowed = nom.isPlayer ? 2 : 1;
      if (currentCount < maxAllowed) {
        topNominees.push(nom);
        artistCountInCat.set(aKey, currentCount + 1);
      }
    }

    if (topNominees.length === 0) return;

    // Mark the highest-scoring contender as the official winner
    const winner = { ...topNominees[0], isWinner: true };
    topNominees[0] = winner;

    topNominees.forEach((nom, idx) => {
      registerTally(nom, idx === 0, cat.isMajor, cat.shortName);
    });

    // Order nominees on the official ballot alphabetically by workTitle so #1 is NEVER spoiled!
    const ballotOrderedNominees = [...topNominees].sort((a, b) =>
      a.workTitle.localeCompare(b.workTitle)
    );

    categoryResults.push({
      categoryId: cat.id,
      categoryName: cat.name,
      shortName: cat.shortName,
      field: cat.field,
      isMajor: cat.isMajor,
      subjectType: cat.subjectType,
      nominees: ballotOrderedNominees,
      winner
    });
  });

  const artistTallies = Array.from(tallyMap.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.majorWins !== a.majorWins) return b.majorWins - a.majorWins;
    return b.nominations - a.nominations;
  });

  const mostNominatedList = [...artistTallies].sort((a, b) => {
    if (b.nominations !== a.nominations) return b.nominations - a.nominations;
    return b.wins - a.wins;
  });

  const cal = AWARD_CALENDAR_CONFIG[show];
  const nomYear = show === 'grammys' ? editionYear - 1 : editionYear;
  const nominationsDate = `${nomYear}-${String(cal.nominationsMonth).padStart(2, '0')}-${String(cal.nominationsDay).padStart(2, '0')}`;
  const ceremonyDate = `${editionYear}-${String(cal.ceremonyMonth).padStart(2, '0')}-${String(cal.ceremonyDay).padStart(2, '0')}`;

  return {
    id: `${show}_${editionYear}`,
    show,
    editionYear,
    editionLabel: getAwardEditionLabel(show, editionYear),
    nominationsDate,
    ceremonyDate,
    phase,
    categories: categoryResults,
    artistTallies,
    biggestWinner: artistTallies[0] || null,
    mostNominated: mostNominatedList[0] || null
  };
}

/**
 * Generates realistic 2025 inaugural seasons so the archive & NPC Trophy Rooms are immediately populated
 */
function generateInauguralPastSeasons(state: GameState): AwardSeasonRecord[] {
  const pastGrammys = simulateAwardSeason(state, 'grammys', 2025, 'ceremony_completed');
  const pastVmas = simulateAwardSeason(state, 'vmas', 2025, 'ceremony_completed');
  return [pastVmas, pastGrammys];
}

/**
 * Purchases an FYC (Grammys) or Fan Voting (VMAs) campaign tier for the Player
 */
export function purchaseAwardCampaignTier(
  state: GameState,
  show: AwardShowType,
  tierId: string
): { updatedState: GameState; success: boolean; message: string } {
  const tier = CAMPAIGN_TIER_OPTIONS.find(t => t.id === tierId && t.show === show);
  if (!tier) {
    return { updatedState: state, success: false, message: 'Invalid campaign tier selected.' };
  }

  if ((state.money || 0) < tier.cost) {
    return {
      updatedState: state,
      success: false,
      message: `Insufficient funds. You need $${tier.cost.toLocaleString()} to launch "${tier.name}".`
    };
  }

  const awardsState = getEnsuredAwardsState(state);
  const campaignKey = show === 'grammys' ? 'grammysCampaign' : 'vmasCampaign';
  const currentCampaign = awardsState[campaignKey];

  if (currentCampaign.purchasedCampaignIds.includes(tier.id)) {
    return {
      updatedState: state,
      success: false,
      message: `You have already activated "${tier.name}" for this season.`
    };
  }

  const updatedCampaign: PlayerShowCampaignState = {
    ...currentCampaign,
    purchasedCampaignIds: [...currentCampaign.purchasedCampaignIds, tier.id],
    totalBonusScore: Number(Math.min(9.5, currentCampaign.totalBonusScore + tier.scoreBonus).toFixed(2))
  };

  const nextAwardsState: AwardsSystemState = {
    ...awardsState,
    [campaignKey]: updatedCampaign
  };

  const nextState: GameState = {
    ...state,
    money: (state.money || 0) - tier.cost,
    hype: Math.min(100, Number(((state.hype || 15) + tier.hypeGain).toFixed(1))),
    awardsState: nextAwardsState
  } as any;

  if (nextAwardsState.activeSeasons[show]?.phase === 'nominations_announced') {
    const activeYr = nextAwardsState.activeSeasons[show]!.editionYear;
    nextAwardsState.activeSeasons[show] = simulateAwardSeason(
      nextState,
      show,
      activeYr,
      'nominations_announced'
    );
  }

  return {
    updatedState: nextState,
    success: true,
    message: `"${tier.name}" is now active! Your entries have stronger backing with ${show === 'grammys' ? 'Recording Academy voters' : 'global fan voters'} (+${tier.hypeGain}% Hype).`
  };
}

/**
 * Updates the Player's flagship submission choice (Song, Album, or Music Video)
 */
export function setPlayerPreferredSubmission(
  state: GameState,
  show: AwardShowType,
  type: 'song' | 'album' | 'video',
  itemId: number | null
): GameState {
  const awardsState = getEnsuredAwardsState(state);
  const campaignKey = show === 'grammys' ? 'grammysCampaign' : 'vmasCampaign';
  const currentCampaign = { ...awardsState[campaignKey] };

  if (type === 'song') currentCampaign.preferredSongId = itemId;
  if (type === 'album') currentCampaign.preferredAlbumId = itemId;
  if (type === 'video') currentCampaign.preferredVideoSongId = itemId;

  const nextAwardsState: AwardsSystemState = {
    ...awardsState,
    [campaignKey]: currentCampaign
  };

  const nextState: GameState = {
    ...state,
    awardsState: nextAwardsState
  } as any;

  if (nextAwardsState.activeSeasons[show]?.phase === 'nominations_announced') {
    const activeYr = nextAwardsState.activeSeasons[show]!.editionYear;
    nextAwardsState.activeSeasons[show] = simulateAwardSeason(
      nextState,
      show,
      activeYr,
      'nominations_announced'
    );
  }

  return nextState;
}

/**
 * Processes daily Award Calendar checks during nextDay()
 * Returns updated AwardsSystemState plus any triggered Nomination or Ceremony event for X announcements.
 */
export function processDailyAwardsCalendarStep(
  state: GameState,
  currentDate: Date
): {
  updatedAwardsState: AwardsSystemState;
  triggeredEvent: {
    eventType: 'nominations' | 'ceremony';
    season: AwardSeasonRecord;
  } | null;
} {
  const awardsState = getEnsuredAwardsState(state);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();

  let nextAwards: AwardsSystemState = {
    ...awardsState,
    activeSeasons: { ...awardsState.activeSeasons },
    history: [...awardsState.history],
    lastProcessedDate: currentDate.toISOString().split('T')[0]
  };

  let triggeredEvent: {
    eventType: 'nominations' | 'ceremony';
    season: AwardSeasonRecord;
  } | null = null;

  // 1. GRAMMY NOMINATIONS: November 15 (for next year's February ceremony)
  if (
    month === AWARD_CALENDAR_CONFIG.grammys.nominationsMonth &&
    day === AWARD_CALENDAR_CONFIG.grammys.nominationsDay
  ) {
    const targetCeremonyYear = year + 1;
    const season = simulateAwardSeason(state, 'grammys', targetCeremonyYear, 'nominations_announced');
    nextAwards.activeSeasons.grammys = season;
    nextAwards.pendingNominationsAnnouncement = season;
    triggeredEvent = { eventType: 'nominations', season };
  }

  // Ensure initial January 2026 nominations exist
  if (
    month === 1 &&
    !nextAwards.activeSeasons.grammys &&
    !nextAwards.history.some(h => h.show === 'grammys' && h.editionYear === year)
  ) {
    const season = simulateAwardSeason(state, 'grammys', year, 'nominations_announced');
    nextAwards.activeSeasons.grammys = season;
  }

  // 2. GRAMMY CEREMONY NIGHT: February 5
  if (
    month === AWARD_CALENDAR_CONFIG.grammys.ceremonyMonth &&
    day === AWARD_CALENDAR_CONFIG.grammys.ceremonyDay
  ) {
    const completedSeason = simulateAwardSeason(state, 'grammys', year, 'ceremony_completed');
    nextAwards.activeSeasons.grammys = completedSeason;
    nextAwards.history = [
      completedSeason,
      ...nextAwards.history.filter(h => h.id !== completedSeason.id)
    ];
    nextAwards.pendingLiveCeremony = completedSeason;
    nextAwards.grammysCampaign = {
      preferredSongId: null,
      preferredAlbumId: null,
      preferredVideoSongId: null,
      purchasedCampaignIds: [],
      totalBonusScore: 0
    };
    triggeredEvent = { eventType: 'ceremony', season: completedSeason };
  }

  // 3. MTV VMAs NOMINATIONS: August 1
  if (
    month === AWARD_CALENDAR_CONFIG.vmas.nominationsMonth &&
    day === AWARD_CALENDAR_CONFIG.vmas.nominationsDay
  ) {
    const season = simulateAwardSeason(state, 'vmas', year, 'nominations_announced');
    nextAwards.activeSeasons.vmas = season;
    nextAwards.pendingNominationsAnnouncement = season;
    triggeredEvent = { eventType: 'nominations', season };
  }

  // 4. MTV VMAs CEREMONY NIGHT: September 12
  if (
    month === AWARD_CALENDAR_CONFIG.vmas.ceremonyMonth &&
    day === AWARD_CALENDAR_CONFIG.vmas.ceremonyDay
  ) {
    const completedSeason = simulateAwardSeason(state, 'vmas', year, 'ceremony_completed');
    nextAwards.activeSeasons.vmas = completedSeason;
    nextAwards.history = [
      completedSeason,
      ...nextAwards.history.filter(h => h.id !== completedSeason.id)
    ];
    nextAwards.pendingLiveCeremony = completedSeason;
    nextAwards.vmasCampaign = {
      preferredSongId: null,
      preferredAlbumId: null,
      preferredVideoSongId: null,
      purchasedCampaignIds: [],
      totalBonusScore: 0
    };
    triggeredEvent = { eventType: 'ceremony', season: completedSeason };
  }

  return {
    updatedAwardsState: nextAwards,
    triggeredEvent
  };
}

/**
 * Computes the complete Artist Profile Trophy Room for the Player or any NPC artist
 */
export function getArtistTrophyRoomSummary(
  state: GameState,
  targetArtistName?: string
): ArtistTrophyRoomProfile {
  const awardsState = getEnsuredAwardsState(state);
  const playerName = state.artist?.name || 'Artist';
  const artistName = targetArtistName || playerName;
  const isPlayer = artistName.toLowerCase() === playerName.toLowerCase();

  const avatar = isPlayer
    ? state.artist?.image || `https://placehold.co/400x400/121216/D4AF37?text=${encodeURIComponent(artistName.charAt(0))}`
    : REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === artistName.toLowerCase())?.image ||
      `https://placehold.co/400x400/18181B/FFFFFF?text=${encodeURIComponent(artistName.charAt(0))}`;

  let grammyWins = 0;
  let grammyNominations = 0;
  let grammyBigFourWins = 0;
  let vmaWins = 0;
  let vmaNominations = 0;
  let vmaMajorWins = 0;
  const trophies: TrophyItem[] = [];

  const seasonsToScan: AwardSeasonRecord[] = [...awardsState.history];
  (['grammys', 'vmas'] as const).forEach(show => {
    const active = awardsState.activeSeasons[show];
    if (active && !seasonsToScan.some(s => s.id === active.id)) {
      seasonsToScan.unshift(active);
    }
  });

  seasonsToScan.forEach(season => {
    const isCompleted = season.phase === 'ceremony_completed';
    season.categories.forEach(cat => {
      cat.nominees.forEach(nom => {
        const nomPrimary = nom.artistName.split(' & ')[0].split(' feat.')[0].trim();
        const matchesArtist =
          nomPrimary.toLowerCase() === artistName.toLowerCase() ||
          nom.artistName.toLowerCase().includes(artistName.toLowerCase());

        if (!matchesArtist) return;

        // Only count as a Win if the ceremony is actually completed!
        const won = Boolean(isCompleted && nom.isWinner);
        if (season.show === 'grammys') {
          grammyNominations += 1;
          if (won) {
            grammyWins += 1;
            if (cat.isMajor) grammyBigFourWins += 1;
          }
        } else {
          vmaNominations += 1;
          if (won) {
            vmaWins += 1;
            if (cat.isMajor) vmaMajorWins += 1;
          }
        }

        trophies.push({
          id: `${season.id}_${cat.categoryId}_${nom.workTitle}`,
          show: season.show,
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
    grammyWins,
    grammyNominations,
    grammyBigFourWins,
    vmaWins,
    vmaNominations,
    vmaMajorWins,
    totalWins: grammyWins + vmaWins,
    totalNominations: grammyNominations + vmaNominations,
    trophies
  };
}
