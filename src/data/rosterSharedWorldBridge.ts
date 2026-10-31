import { GameState, Project, Song } from '../types';
import { DetailedNPC } from './npcAssets';
import {
  ImprintSignedArtist,
  getEnsuredRecordLabelState,
} from './recordLabelSystemEngine';
import {
  buildRosterArtistAvatarSvg,
  buildRosterReleaseCoverSvg,
  ensureRosterArtistFullFields,
  getRosterArtistStaffBuffs,
} from './recordLabelCeoEngine';
import { processDailyMarketStep } from './marketStabilityEngine';
import { calculateDailyArtistGrowth } from './artistGrowthEngine';
import { processDailyFanGrowth } from './fansSystemEngine';
import { calculateEnhancedMonthlyListenersStep } from './enhancedMonthlyListenersAnalyticsEngine';
import { getVisualStyleById } from './youtubeVisualFormatsEngine';
import {
  canRosterArtistRenewContract,
  syncWorldNpcDeduplicationWithRoster,
} from './rosterLifecycleAndNpcDedupEngine';

export type SharedWorldRosterEntry = ImprintSignedArtist & {
  artist: ImprintSignedArtist;
  imprintName: string;
  imprintLogoUrl?: string;
};

let liveSharedWorldRosterCache: SharedWorldRosterEntry[] = [];

/**
 * Syncs all signed Roster Artists from the Player's Record Label Imprint into the live Shared World registry
 * so all charts (Spotify, Billboard, YouTube, iTunes), playlists, and directories can include them alongside the Player and NPCs.
 */
export function syncActiveRosterArtistsToSharedWorld(
  state?: GameState | null
): SharedWorldRosterEntry[] {
  if (!state) return liveSharedWorldRosterCache;
  try {
    const labelState = getEnsuredRecordLabelState(state);
    const imprint = labelState.imprint;
    // Always sync NPC deduplication (suppresses NPCs matching Player or Roster Artist names; restores NPCs if a Former Roster Artist was deleted)
    syncWorldNpcDeduplicationWithRoster(
      state.artist?.name,
      imprint?.signedRoster || []
    );
    if (!imprint || !imprint.isFounded || !Array.isArray(imprint.signedRoster)) {
      liveSharedWorldRosterCache = [];
      return liveSharedWorldRosterCache;
    }
    const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
    liveSharedWorldRosterCache = imprint.signedRoster.map((raw) => {
      const ensured = ensureRosterArtistFullFields(raw, dateStr);
      return {
        ...ensured,
        artist: ensured,
        imprintName: imprint.imprintName || 'Player Imprint',
        imprintLogoUrl: imprint.logoUrl,
      };
    });
  } catch {
    // Keep last valid cache on transient error
  }
  return liveSharedWorldRosterCache;
}

/**
 * Retrieves all active signed Roster Artists in the shared game world.
 */
export function getActiveSharedWorldRosterArtists(
  state?: GameState | null
): SharedWorldRosterEntry[] {
  if (state) {
    return syncActiveRosterArtistsToSharedWorld(state);
  }
  return liveSharedWorldRosterCache;
}

/**
 * Converts a signed Roster Artist into a DetailedNPC-compatible object (with `isRosterArtist: true`)
 * so they appear seamlessly in Spotify's Global Artists Directory, Charts, and Playlists.
 */
export function convertRosterArtistToDetailedNpc(
  rawInput: ImprintSignedArtist | SharedWorldRosterEntry | any,
  imprintName = 'Record Label Imprint',
  dateStr = '2026-01-01'
): DetailedNPC & {
  isRosterArtist: boolean;
  rosterArtistId: string;
  labelImprintName: string;
  realName: string;
  fans: number;
  monthlyListeners: number;
  listenerDelta: number;
  rawSongs: Song[];
  rawProjects: Project[];
} {
  const rawArt: ImprintSignedArtist =
    rawInput && typeof rawInput === 'object' && 'artist' in rawInput && rawInput.artist
      ? rawInput.artist
      : rawInput;
  const resolvedImprintName =
    (rawInput && typeof rawInput === 'object' && rawInput.imprintName) ||
    (rawInput && typeof rawInput === 'object' && rawInput.labelImprintName) ||
    imprintName;

  const art = ensureRosterArtistFullFields(rawArt, dateStr);
  const stageName = art.stageName || art.name;
  const avatar = art.avatarUrl || buildRosterArtistAvatarSvg(stageName);
  const releasedSongs = (art.songs || []).filter(
    (s) => s.status === 'released' || !(s as any).status
  );
  const releasedProjects = (art.projects || []).filter(
    (p) => p.status === 'released' || !(p as any).status
  );

  const mappedSongs = releasedSongs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: stageName,
    isRosterArtist: true,
    isPlayer: false,
    genre: s.genre || art.genre || 'Pop',
    isExplicit: Boolean((s as any).isExplicit),
    streams: s.streams || 0,
    dailyStreams: s.dailyStreams || 0,
    weeklyStreams: s.weeklyStreams || (s.dailyStreams || 0) * 7,
    sales: s.pureSales || (s as any).sales || 0,
    dailySales: s.dailyPureSales || (s as any).dailySales || 0,
    radio: s.radioPlays || (s as any).radio || 0,
    daysSinceRelease: s.daysSinceRelease ?? 1,
    cover: s.cover || buildRosterReleaseCoverSvg(stageName, s.title, 'Single'),
    hasMV: Boolean(s.hasMV),
    views: s.views || 0,
    dailyViews: s.dailyViews || 0,
    collabId: s.collabId,
    trackType: (s.trackType || 'single') as 'single' | 'lead_single' | 'b_side',
  }));

  const mappedAlbums = releasedProjects.map((p) => {
    const relYear = p.releaseDate
      ? new Date(p.releaseDate).getFullYear()
      : new Date(dateStr).getFullYear();
    const tracks = (p.songs || []).map((ps) => {
      const liveSong = releasedSongs.find((ls) => ls.id === ps.id) || ps;
      return {
        id: liveSong.id,
        title: liveSong.title,
        artist: stageName,
        isRosterArtist: true,
        isPlayer: false,
        genre: liveSong.genre || art.genre || 'Pop',
        isExplicit: Boolean((liveSong as any).isExplicit),
        collabId: liveSong.collabId,
        hasMV: Boolean(liveSong.hasMV),
        streams: liveSong.streams || 0,
        dailyStreams: liveSong.dailyStreams || 0,
        weeklyStreams: liveSong.weeklyStreams || 0,
        sales: liveSong.pureSales || 0,
        trackType: (liveSong.trackType || 'b_side') as 'single' | 'lead_single' | 'b_side',
        cover: liveSong.cover || p.cover,
      };
    });
    return {
      title: p.title,
      year: Number.isNaN(relYear) ? 2026 : relYear,
      cover: p.cover || buildRosterReleaseCoverSvg(stageName, p.title, 'Album'),
      daysSinceRelease: 1,
      tracks,
    };
  });

  return {
    id: art.id,
    name: stageName,
    genre: art.genre || 'Pop',
    country: art.country || 'US',
    tier: art.popularity >= 75 ? 1 : art.popularity >= 45 ? 2 : 3,
    pop: art.popularity || 35,
    hype: art.hype || 45,
    avatar,
    image: avatar,
    bio:
      art.bio ||
      `Official recording artist signed to ${resolvedImprintName}. Hailing from ${art.country}, ${stageName} (${art.realName || stageName}) is building a global catalog across streaming and radio.`,
    songs: mappedSongs as any,
    albums: mappedAlbums as any,
    isRosterArtist: true,
    rosterArtistId: art.id,
    labelImprintName: resolvedImprintName,
    realName: art.realName || stageName,
    fans: art.fans || Math.round((art.popularity || 35) * 4500),
    monthlyListeners:
      art.monthlyListeners || Math.max(25000, (art.dailyStreams || 5000) * 28),
    listenerDelta: (art as any).listenerDelta || Math.round((art.dailyStreams || 2500) * 0.14),
    rawSongs: art.songs || [],
    rawProjects: art.projects || [],
  };
}

/**
 * Looks up a signed Roster Artist by stage name or ID and returns their merged ImprintSignedArtist + DetailedNPC representation if found.
 */
export function findRosterArtistByNameOrId(
  nameOrId: string,
  state?: GameState | null
): (Omit<ImprintSignedArtist, 'songs'> &
  ReturnType<typeof convertRosterArtistToDetailedNpc> & { songs: any }) | null {
  if (!nameOrId) return null;
  const target = nameOrId.trim().toLowerCase();
  const list = getActiveSharedWorldRosterArtists(state);
  const dateStr = state?.date ? String(state.date).split('T')[0] : '2026-01-01';

  for (const entry of list) {
    const stage = (entry.artist.stageName || entry.artist.name || '').trim().toLowerCase();
    const id = (entry.artist.id || '').trim().toLowerCase();
    if (stage === target || id === target) {
      const npcObj = convertRosterArtistToDetailedNpc(entry.artist, entry.imprintName, dateStr);
      return {
        ...entry.artist,
        ...npcObj,
      } as any;
    }
  }
  return null;
}

/**
 * Simulates 1 full day for a signed Roster Artist using the EXACT SAME engines as the Player:
 * - Advances writing ('writing' -> 'written'), recording ('recording' -> 'recorded'), and scheduled releases
 * - Runs `processDailyMarketStep` for authentic streams, YouTube views, pure sales, and revenue
 * - Applies Staff Team & Label Executive Division synergy buffs
 * - Runs `calculateDailyArtistGrowth` so the Roster Artist's Popularity & Hype shift dynamically (can surpass the Player!)
 * - Runs `processDailyFanGrowth` & `calculateEnhancedMonthlyListenersStep` for Fans & 28-day Monthly Listeners
 */
export function simulateRosterArtistAsPlayerDaily(
  state: GameState,
  rawArt: ImprintSignedArtist,
  currentDate: Date,
  distKeepMult: number
): {
  updatedArtist: ImprintSignedArtist;
  netForImprintToday: number;
  droppedNewReleaseTitle: string | null;
} {
  const dateStr = currentDate.toISOString().split('T')[0];
  const isMonday = currentDate.getDay() === 1;
  const art = ensureRosterArtistFullFields(rawArt, dateStr);
  const stageName = art.stageName || art.name;
  const staffBuffs = getRosterArtistStaffBuffs(state, art);

  const nextDaysRemaining = Math.max(0, (art.daysRemaining ?? 720) - 1);
  const isContractExpired = Boolean(
    art.isFormerRoster || art.contractExpired || nextDaysRemaining <= 0
  );
  const willingToRenew = isContractExpired
    ? art.willingToRenew !== undefined
      ? art.willingToRenew
      : canRosterArtistRenewContract({ ...art, daysRemaining: nextDaysRemaining })
    : true;
  const nextPromoCooldown = Math.max(0, (art.promoCooldownDaysLeft || 0) - 1);

  let currentHype = Number(art.hype) || 45;
  let currentPop = Number(art.popularity) || 32;
  const realisticMaxTrackDaily = Math.round(
    85000 + Math.pow(Math.max(5, currentPop), 2.25) * 320
  );

  // Track which songs/projects were scheduled before today's market step
  const prevScheduledSongIds = new Set(
    (art.songs || []).filter((s) => s.status === 'scheduled').map((s) => s.id)
  );
  const prevScheduledProjectIds = new Set(
    (art.projects || []).filter((p) => p.status === 'scheduled').map((p) => p.id)
  );

  // 1. Advance song writing ('writing' -> 'written') exactly like Player in useGame.ts.
  // Note: 'recording' -> 'recorded' and 'scheduled' -> 'released' are handled inside `processDailyMarketStep`!
  let updatedSongs: Song[] = (art.songs || []).map((rawSong) => {
    const safeMomentum =
      rawSong.momentum && rawSong.momentum <= 2.5 ? rawSong.momentum : 1.0;
    const safeDailyStreams = Math.min(
      realisticMaxTrackDaily,
      Math.max(0, rawSong.dailyStreams || 0)
    );
    const song: Song = {
      ...rawSong,
      artist: stageName,
      momentum: safeMomentum,
      dailyStreams: safeDailyStreams,
    } as Song;

    if (song.status === 'writing' && song.daysLeft !== undefined) {
      if (song.daysLeft > 1) return { ...song, daysLeft: song.daysLeft - 1 };
      const boostedQ = Math.min(
        100,
        Math.round((song.quality || 65) + staffBuffs.studioQualityBonus * 0.5)
      );
      return { ...song, daysLeft: 0, status: 'written' as const, quality: boostedQ };
    }
    return song;
  });

  let updatedProjects: Project[] = (art.projects || []).map((rawProj) => {
    const safeProjMom =
      rawProj.momentum && rawProj.momentum <= 2.5 ? rawProj.momentum : 1.0;
    return { ...rawProj, momentum: safeProjMom };
  });

  const nextDaysUntilRelease = art.daysUntilNextRelease || 24;
  let droppedNewReleaseTitle: string | null = null;

  // 2. Run the EXACT SAME `processDailyMarketStep` used for the Player (passing state.skills)!
  const artistTier = currentPop >= 75 ? 2 : currentPop >= 45 ? 1 : 3;
  const currentFans = Math.max(250, Number(art.fans) || Math.round(currentPop * 4200));

  const marketResult = processDailyMarketStep(
    updatedSongs,
    updatedProjects,
    art.country || 'US',
    currentPop,
    currentHype,
    artistTier,
    currentDate,
    state.skills,
    currentFans
  );

  // Accumulate daily streams & radio spins WITHOUT compounding dailyStreams by streamVelocityMult each day
  let totalDailyStreams = 0;
  let totalDailyViews = 0;
  let totalDailySales = 0;

  updatedSongs = marketResult.updatedSongs.map((s) => {
    if (s.status === 'released' && prevScheduledSongIds.has(s.id) && !droppedNewReleaseTitle) {
      droppedNewReleaseTitle = `${stageName} — "${s.title}"`;
    }
    if (s.status !== 'released') {
      return { ...s, artist: stageName } as Song;
    }
    const organicTrackStreams = Math.min(
      realisticMaxTrackDaily,
      Math.max(120, Math.round(s.dailyStreams || 0))
    );
    const nonCompoundingStaffAdd = isContractExpired
      ? 0
      : Math.round(
          Math.min(18000, organicTrackStreams * (staffBuffs.streamVelocityMult - 1) * 0.25)
        );
    const radioAdd = isContractExpired ? 0 : Math.round(staffBuffs.radioSpinsBonus * 0.25);

    const nextDailyViews = s.dailyViews || 0;
    const nextDailySales = s.dailyPureSales || 0;

    totalDailyStreams += organicTrackStreams + nonCompoundingStaffAdd;
    totalDailyViews +=
      nextDailyViews + (s.dailyLyricVideoViews || 0) + (s.dailyVisualizerViews || 0);
    totalDailySales += nextDailySales;

    const nextSong: Song = {
      ...s,
      artist: stageName,
      streams: (s.streams || 0) + nonCompoundingStaffAdd,
      dailyStreams: organicTrackStreams,
      weeklyStreams: isMonday
        ? organicTrackStreams + nonCompoundingStaffAdd
        : (s.weeklyStreams || 0) + nonCompoundingStaffAdd,
      radioPlays: (s.radioPlays || 0) + radioAdd,
      dailyRadioPlays: (s.dailyRadioPlays || 0) + radioAdd,
      weeklyRadioPlays: isMonday
        ? (s.dailyRadioPlays || 0) + radioAdd
        : (s.weeklyRadioPlays || 0) + radioAdd,
    } as Song;
    return nextSong;
  });

  updatedProjects = marketResult.updatedProjects.map((p) => {
    if (p.status === 'released' && prevScheduledProjectIds.has(p.id) && !droppedNewReleaseTitle) {
      droppedNewReleaseTitle = `${stageName} — "${p.title}" (${p.type.toUpperCase()})`;
    }
    const syncedProjSongs = (p.songs || []).map((ps) => {
      const liveMatch = updatedSongs.find((us) => us.id === ps.id);
      return liveMatch ? { ...liveMatch } : ({ ...ps, artist: stageName } as Song);
    });
    if (p.status !== 'released') {
      return { ...p, songs: syncedProjSongs };
    }
    totalDailySales += p.dailyPureSales || 0;
    return {
      ...p,
      songs: syncedProjSongs,
      weeklyPureSales: isMonday ? p.dailyPureSales || 0 : p.weeklyPureSales || 0,
    };
  });

  // 4. Calculate Dynamic Popularity & Hype Growth using the EXACT SAME `calculateDailyArtistGrowth` as the Player!
  const growth = calculateDailyArtistGrowth({
    currentPopularity: currentPop,
    currentHype: currentHype,
    dailyStreamsTotal: totalDailyStreams,
    dailyViewsTotal: totalDailyViews,
    dailyPureSalesTotal: totalDailySales,
    releasedSongs: updatedSongs.filter((s) => s.status === 'released'),
    releasedProjects: updatedProjects.filter((p) => p.status === 'released'),
    currentDateStr: dateStr,
    isHiatus: isContractExpired,
  });

  const nextPop = growth.newPopularity;
  const nextHype = growth.newHype;

  // 5. Calculate Daily Fan Growth using the EXACT SAME `processDailyFanGrowth` as the Player!
  const fanStep = processDailyFanGrowth({
    currentFans,
    popularity: nextPop,
    hype: nextHype,
    dailyStreams: totalDailyStreams,
    dailyViews: totalDailyViews,
    dailyPureSales: totalDailySales,
    releasedSongs: updatedSongs.filter((s) => s.status === 'released'),
    skills: state.skills,
    hasRecentRelease: updatedSongs.some(
      (s) => s.status === 'released' && (s.daysSinceRelease ?? 99) <= 3
    ),
  });
  const nextFans = Math.round(
    currentFans + Math.max(5, fanStep.dailyGain * (isContractExpired ? 0.65 : staffBuffs.fanGrowthMult))
  );

  // 6. Calculate 28-Day Rolling Spotify Monthly Listeners using the EXACT SAME `calculateEnhancedMonthlyListenersStep` as the Player!
  const prevFollowers = Math.max(
    Math.round(currentFans * 0.85),
    (art as any).spotifyFollowers || Math.round(currentFans * 0.85)
  );
  const nextFollowers = prevFollowers + Math.floor(totalDailyStreams * 0.0012);

  const listenerStep = calculateEnhancedMonthlyListenersStep({
    dailyStreams: totalDailyStreams,
    popularity: nextPop,
    hype: nextHype,
    followers: nextFollowers,
    previousListeners: art.monthlyListeners || Math.round(totalDailyStreams * 22),
    previousPeak: (art as any).peakListeners || art.monthlyListeners || 0,
    releasedSongs: updatedSongs.filter((s) => s.status === 'released'),
  });

  // 7. Calculate Label & Artist Royalties + Recoupment from actual market revenue
  // If contract is expired (Former Roster), the label still collects passive back-catalog master royalties at 50% of the prior split
  const rawCatalogRevenue = Math.max(
    Math.round(marketResult.totalRevenue * distKeepMult),
    Math.round(totalDailyStreams * 0.004 * distKeepMult)
  );
  const effectiveCutPct = isContractExpired
    ? Math.round((art.imprintRoyaltyCutPct || 50) * 0.5)
    : art.imprintRoyaltyCutPct || 50;
  const imprintShare = Math.round(rawCatalogRevenue * (effectiveCutPct / 100));
  const artistShare = Math.max(0, rawCatalogRevenue - imprintShare);

  let recoupFromArtist = 0;
  let nextUnrecouped = art.unrecoupedAdvance || 0;
  if (nextUnrecouped > 0 && !isContractExpired) {
    recoupFromArtist = Math.min(nextUnrecouped, Math.round(artistShare * 0.8));
    nextUnrecouped = Math.max(0, nextUnrecouped - recoupFromArtist);
  }

  const netForImprintToday = imprintShare + recoupFromArtist;
  const latestReleasedSong = updatedSongs.find((s) => s.status === 'released');

  const updatedArtist: ImprintSignedArtist = {
    ...art,
    popularity: nextPop,
    hype: nextHype,
    fans: nextFans,
    monthlyListeners: listenerStep.listeners,
    dailyStreams: totalDailyStreams,
    totalStreamsGenerated: (art.totalStreamsGenerated || 0) + totalDailyStreams,
    unrecoupedAdvance: nextUnrecouped,
    totalGrossGenerated: (art.totalGrossGenerated || 0) + rawCatalogRevenue,
    totalNetProfitForImprint: (art.totalNetProfitForImprint || 0) + netForImprintToday,
    daysUntilNextRelease: nextDaysUntilRelease,
    daysRemaining: nextDaysRemaining,
    isFormerRoster: isContractExpired,
    contractExpired: isContractExpired,
    willingToRenew,
    promoCooldownDaysLeft: nextPromoCooldown,
    singlesReleased: updatedSongs.filter((s) => s.status === 'released').length,
    albumsReleased: Math.max(
      art.albumsReleased || 0,
      updatedProjects.filter((p) => p.status === 'released').length
    ),
    latestReleaseTitle: latestReleasedSong
      ? `${stageName} — ${latestReleasedSong.title}`
      : art.latestReleaseTitle,
    latestReleaseQuality: latestReleasedSong
      ? latestReleasedSong.quality
      : art.latestReleaseQuality,
    songs: updatedSongs,
    projects: updatedProjects,
  };

  (updatedArtist as any).listenerDelta = listenerStep.listenerDelta;
  (updatedArtist as any).peakListeners = listenerStep.peakListeners;
  (updatedArtist as any).spotifyFollowers = nextFollowers;

  return {
    updatedArtist,
    netForImprintToday,
    droppedNewReleaseTitle,
  };
}

export interface ProduceRosterArtistVideoOptions {
  artistId?: string;
  songId: number;
  visualType?: 'mv' | 'lyric_video' | 'visualizer';
  videoType?: 'mv' | 'lyric_video' | 'visualizer';
  mvDistributor?: 'indie' | 'vevo' | 'standard';
  mvUseAds?: 'no' | 'yes';
  useAds?: boolean;
  mvPromoteAds?: boolean;
  visualStyleId?: string;
  lyricStyle?: string;
  visualizerStyle?: string;
  customThumbnailUrl?: string;
  customVideoUrl?: string;
  customVideoName?: string;
}

/**
 * Produces an Official Music Video (MV), Lyric Video, or Visualizer for a Signed Roster Artist
 * using the EXACT SAME options as the Player (VEVO vs Indie, Paid YouTube Ad Campaign, Custom Video & Thumbnail, Visual Styles).
 */
export function produceRosterArtistVideoPlayerStyle(
  state: GameState,
  artistIdOrParams: string | ProduceRosterArtistVideoOptions,
  maybeOptions?: ProduceRosterArtistVideoOptions
): { nextState: GameState; success: boolean; message: string } {
  const params: ProduceRosterArtistVideoOptions =
    typeof artistIdOrParams === 'string'
      ? { ...(maybeOptions || { songId: 0 }), artistId: artistIdOrParams }
      : artistIdOrParams;

  const targetArtistId = params.artistId || '';
  const visualType = params.visualType || params.videoType || 'mv';

  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === targetArtistId);

  if (!rawArtist) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const stageName = artist.stageName || artist.name;
  const targetSong = (artist.songs || []).find((s) => s.id === params.songId);

  if (!targetSong) {
    return { nextState: state, success: false, message: 'Selected track not found.' };
  }

  const currentMoney = Math.round(Number(state.money) || 0);

  if (visualType === 'mv') {
    if (targetSong.hasMV) {
      return {
        nextState: state,
        success: false,
        message: `"${targetSong.title}" already has an Official Music Video on YouTube.`,
      };
    }

    const isVevo = params.mvDistributor === 'vevo';
    const hasAds = Boolean(
      params.mvUseAds === 'yes' || params.useAds === true || params.mvPromoteAds === true
    );
    const cost = (isVevo ? 8000 : 3000) + (hasAds ? 15000 : 0);

    if (currentMoney < cost) {
      return {
        nextState: state,
        success: false,
        message: `You need $${cost.toLocaleString()} to produce this Official Music Video.`,
      };
    }

    const hypeGain = isVevo ? 35 : 25;
    const adBoostMult = hasAds ? 1.55 : isVevo ? 1.35 : 1.0;
    const debutDailyViews = Math.round(
      ((artist.popularity || 35) * 1450 + (targetSong.quality || 75) * 480) * adBoostMult
    );
    const thumb =
      params.customThumbnailUrl ||
      targetSong.cover ||
      buildRosterReleaseCoverSvg(stageName, targetSong.title, 'Single');

    const updatedSongs = (artist.songs || []).map((s) =>
      s.id === targetSong.id
        ? {
            ...s,
            hasMV: true,
            mvDistributor: (isVevo ? 'vevo' : 'indie') as 'indie' | 'vevo',
            mvAdsDays: hasAds ? 10 : 0,
            mvThumbnail: thumb,
            customVideoUrl: params.customVideoUrl || undefined,
            views: (s.views || 0) + debutDailyViews,
            dailyViews: debutDailyViews,
            weeklyViews: debutDailyViews * 7,
            mvLikes: Math.round(debutDailyViews * 0.072),
          }
        : s
    );

    const updatedArtist: ImprintSignedArtist = {
      ...artist,
      hype: Math.min(100, (artist.hype || 45) + hypeGain),
      popularity: Math.min(100, Number(((artist.popularity || 32) + 1.5).toFixed(1))),
      songs: updatedSongs,
    };

    const nextRoster = labelState.imprint.signedRoster.map((a) =>
      a.id === artist.id ? updatedArtist : a
    );

    const nextState: GameState = {
      ...state,
      money: currentMoney - cost,
      recordLabelState: {
        ...labelState,
        imprint: {
          ...labelState.imprint,
          signedRoster: nextRoster,
        },
      },
    };
    syncActiveRosterArtistsToSharedWorld(nextState);

    return {
      nextState,
      success: true,
      message: `Official Music Video for ${stageName} - "${targetSong.title}" (${
        isVevo ? 'VEVO Network' : hasAds ? 'Paid Ad Campaign' : 'Standard Premiere'
      }) is now live on your Record Label YouTube Channel!`,
    };
  }

  // Lyric Video or Visualizer (same style options & costs as YouTubeVisualFormatModal)
  const resolvedStyleId =
    params.visualStyleId || params.lyricStyle || params.visualizerStyle;
  const styleObj = getVisualStyleById(resolvedStyleId) as any;
  const isLyric = visualType === 'lyric_video';

  if (isLyric && targetSong.hasLyricVideo) {
    return {
      nextState: state,
      success: false,
      message: `"${targetSong.title}" already has an Official Lyric Video on YouTube.`,
    };
  }
  if (!isLyric && targetSong.hasVisualizer) {
    return {
      nextState: state,
      success: false,
      message: `"${targetSong.title}" already has an Official Visualizer on YouTube.`,
    };
  }

  const cost = styleObj && typeof styleObj.cost === 'number' ? styleObj.cost : isLyric ? 800 : 500;
  if (currentMoney < cost) {
    return {
      nextState: state,
      success: false,
      message: `You need $${cost.toLocaleString()} to produce this ${
        isLyric ? 'Official Lyric Video' : 'Official Visualizer'
      }.`,
    };
  }

  const hypeGain =
    styleObj && typeof styleObj.hypeGain === 'number'
      ? styleObj.hypeGain
      : styleObj && typeof styleObj.hypeBonus === 'number'
      ? styleObj.hypeBonus
      : isLyric
      ? 12
      : 8;
  const viewMult =
    styleObj && typeof styleObj.viewMult === 'number'
      ? styleObj.viewMult
      : styleObj && typeof styleObj.viewVelocityMultiplier === 'number'
      ? styleObj.viewVelocityMultiplier
      : 1.0;
  const debutDailyViews = Math.round(
    ((artist.popularity || 35) * 680 + (targetSong.quality || 75) * 240) * viewMult
  );
  const thumb =
    params.customThumbnailUrl ||
    targetSong.cover ||
    buildRosterReleaseCoverSvg(stageName, targetSong.title, 'Single');

  const updatedSongs = (artist.songs || []).map((s) => {
    if (s.id !== targetSong.id) return s;
    if (isLyric) {
      return {
        ...s,
        hasLyricVideo: true,
        lyricVideoStyle: styleObj?.id || 'kinetic_neon',
        lyricVideoThumbnail: thumb,
        lyricVideoReleaseDate: dateStr,
        lyricVideoViews: (s.lyricVideoViews || 0) + debutDailyViews,
        dailyLyricVideoViews: debutDailyViews,
        lyricVideoLikes: Math.round(debutDailyViews * 0.064),
      };
    }
    return {
      ...s,
      hasVisualizer: true,
      visualizerStyle: styleObj?.id || 'vinyl_loop',
      visualizerThumbnail: thumb,
      visualizerReleaseDate: dateStr,
      visualizerViews: (s.visualizerViews || 0) + debutDailyViews,
      dailyVisualizerViews: debutDailyViews,
      visualizerLikes: Math.round(debutDailyViews * 0.058),
    };
  });

  const updatedArtist: ImprintSignedArtist = {
    ...artist,
    hype: Math.min(100, (artist.hype || 45) + hypeGain),
    songs: updatedSongs,
  };

  const nextRoster = labelState.imprint.signedRoster.map((a) =>
    a.id === artist.id ? updatedArtist : a
  );

  const nextState: GameState = {
    ...state,
    money: currentMoney - cost,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: nextRoster,
      },
    },
  };
  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: `Official ${isLyric ? 'Lyric Video' : 'Audio Visualizer'} for ${stageName} - "${
      targetSong.title
    }" is now streaming on your Record Label YouTube Channel!`,
  };
}
