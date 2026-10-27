// Rival & Chart-Blocking Beef System Engine
// Implements an authentic music industry rivalry & feud system:
// 1. Dynamic Arch-Rival NPC who competes directly with the player on Spotify, iTunes, and Billboard.
// 2. Automatic Chart-Block Counter-Release: When the player drops a new Single or Project,
//    the Rival can surprise-drop a high-velocity Single/Project on the exact same day to block the player from #1.
// 3. Interactive Beef Escalation: Subliminal shade tweets, diss tracks, fanbase chart defense rallies,
//    and live head-to-head chart battle tracking.

import { GameState } from '../types';
import { formatNumFull, formatNum } from '../constants';
import {
  REAL_WORLD_NPCS,
  resolveRealWorldCoverArt,
  normalizeRealArtistName
} from './realWorldArtistCatalog';
import {
  getVerifiedOfficialReleaseCover,
  getVerifiedSpotifyNpcPortrait
} from './spotifyOfficialNpcPortraitsAndCovers';
import { isNpcMatchingPlayerName } from './npcPlayerDeduplicationEngine';
import { XPost, getEnsuredXProfile } from './xSocialEngine';

export interface ActiveRivalCounterRelease {
  title: string;
  type: 'single' | 'album' | 'ep';
  cover: string;
  releaseDate: string;
  daysSinceRelease: number;
  dailyStreams: number;
  totalStreams: number;
  weeklyStreams: number;
  dailySales: number;
  totalSales: number;
  radio: number;
  targetPlayerReleaseTitle: string;
  isBlockingAttempt: boolean;
}

export interface BeefHistoryEvent {
  id: string;
  date: string;
  type: 'counter_drop' | 'diss_tweet' | 'chart_win' | 'fan_rally' | 'rival_switch' | 'chart_clash';
  text: string;
}

export interface RivalSystemState {
  hasActiveRival: boolean;
  rivalryOriginReason: string;
  rivalNpcId: string;
  rivalName: string;
  rivalHandle: string;
  rivalAvatar: string;
  rivalGenre: string;
  rivalCountry: string;
  rivalPop: number;
  rivalHype: number;
  beefHeat: number; // 0 to 100
  beefStatusLabel:
    | 'No Active Rivalry'
    | 'Competitive Rivalry'
    | 'Subliminal Shade'
    | 'Active Chart War'
    | 'All-Out Industry Beef';
  playerChartWins: number;
  rivalChartWins: number;
  chartBlocksTriggered: number;
  lastBeefHeadline: string;
  activeCounterRelease: ActiveRivalCounterRelease | null;
  beefHistoryLog: BeefHistoryEvent[];
}

export function getBeefStatusLabel(
  heat: number,
  hasActiveRival = true
): RivalSystemState['beefStatusLabel'] {
  if (!hasActiveRival || heat <= 0) return 'No Active Rivalry';
  if (heat >= 80) return 'All-Out Industry Beef';
  if (heat >= 55) return 'Active Chart War';
  if (heat >= 30) return 'Subliminal Shade';
  return 'Competitive Rivalry';
}

function selectDefaultRivalNpc(state: GameState) {
  const playerName = state.artist?.name || '';
  const playerGenre = ((state.artist as any)?.genre || 'Pop').toLowerCase();
  const playerPop = state.popularity || 15;

  const eligibleNpcs = REAL_WORLD_NPCS.filter(
    npc => !isNpcMatchingPlayerName(npc.name, playerName)
  );

  // Find an iconic rival with similar genre or competitive tier
  const genreMatches = eligibleNpcs.filter(npc =>
    (npc.genre || '').toLowerCase().includes(playerGenre.split('/')[0].trim())
  );

  const pool = genreMatches.length >= 3 ? genreMatches : eligibleNpcs;
  // Sort by closeness to player popularity (or top stars if player is high pop)
  const targetPop = Math.max(65, Math.min(96, playerPop + 15));
  const sorted = [...pool].sort(
    (a, b) => Math.abs((a.pop || 85) - targetPop) - Math.abs((b.pop || 85) - targetPop)
  );

  return sorted[0] || eligibleNpcs[0] || REAL_WORLD_NPCS[0];
}

export function getEnsuredRivalState(state: GameState): RivalSystemState {
  const existing = (state as any).rivalState as RivalSystemState | undefined;
  const playerName = state.artist?.name || '';

  if (existing) {
    // Check if this save genuinely had an active rivalry or was just the old Day-1 placeholder
    const hadRealHistory =
      existing.hasActiveRival === true ||
      (existing.hasActiveRival === undefined &&
        ((existing.chartBlocksTriggered || 0) > 0 ||
          (existing.playerChartWins || 0) > 0 ||
          (existing.rivalChartWins || 0) > 0 ||
          Boolean(existing.activeCounterRelease) ||
          (existing.beefHistoryLog || []).some(e => e.id !== 'init-beef-1')));

    if (
      hadRealHistory &&
      existing.rivalNpcId &&
      !isNpcMatchingPlayerName(existing.rivalName, playerName)
    ) {
      const liveNpc = REAL_WORLD_NPCS.find(
        n => n.id === existing.rivalNpcId || n.name.toLowerCase() === existing.rivalName.toLowerCase()
      );
      const portrait =
        getVerifiedSpotifyNpcPortrait(existing.rivalName) ||
        liveNpc?.avatar ||
        existing.rivalAvatar;

      return {
        ...existing,
        hasActiveRival: true,
        rivalryOriginReason:
          existing.rivalryOriginReason ||
          `Ignited from direct chart & release competition against ${existing.rivalName}.`,
        rivalAvatar: portrait,
        beefStatusLabel: getBeefStatusLabel(existing.beefHeat || 45, true)
      };
    }
  }

  return {
    hasActiveRival: false,
    rivalryOriginReason: '',
    rivalNpcId: '',
    rivalName: '',
    rivalHandle: '',
    rivalAvatar: '',
    rivalGenre: '',
    rivalCountry: '',
    rivalPop: 0,
    rivalHype: 0,
    beefHeat: 0,
    beefStatusLabel: 'No Active Rivalry',
    playerChartWins: 0,
    rivalChartWins: 0,
    chartBlocksTriggered: 0,
    lastBeefHeadline:
      'No active industry feud. Rivalries begin naturally when your music clashes with another artist on the charts, collides on release day, or when you call an artist out on X.',
    activeCounterRelease: null,
    beefHistoryLog: []
  };
}

let latestCachedRivalState: RivalSystemState | null = null;

/**
 * Injects the Rival's active counter-release into `REAL_WORLD_NPCS` so that Spotify,
 * Billboard Hot 100 / Global 200 / 200, iTunes, and YouTube charts immediately rank it
 * head-to-head against the player!
 */
export function injectRivalCounterReleaseIntoNpcCatalog(state?: GameState) {
  if (state && (state as any).rivalState) {
    latestCachedRivalState = (state as any).rivalState as RivalSystemState;
  }
  const rivalState =
    (state ? ((state as any).rivalState as RivalSystemState | undefined) : undefined) ||
    latestCachedRivalState;
  if (!rivalState || !rivalState.hasActiveRival || !rivalState.activeCounterRelease) return;

  const counter = rivalState.activeCounterRelease;
  const targetNpc = REAL_WORLD_NPCS.find(
    n =>
      n.id === rivalState.rivalNpcId ||
      normalizeRealArtistName(n.name).toLowerCase() ===
        normalizeRealArtistName(rivalState.rivalName).toLowerCase()
  );

  if (!targetNpc) return;

  targetNpc.songs = targetNpc.songs || [];
  const existingSongIdx = targetNpc.songs.findIndex(
    s => s.title.toLowerCase() === counter.title.toLowerCase()
  );

  const counterSongEntry = {
    title: counter.title,
    streams: counter.totalStreams,
    dailyStreams: counter.dailyStreams,
    weeklyStreams: counter.weeklyStreams,
    radio: counter.radio,
    sales: counter.totalSales,
    dailySales: counter.dailySales,
    daysSinceRelease: counter.daysSinceRelease,
    trackType: 'lead_single' as const,
    cover: counter.cover
  };

  if (existingSongIdx >= 0) {
    targetNpc.songs[existingSongIdx] = counterSongEntry;
  } else {
    targetNpc.songs.unshift(counterSongEntry);
  }

  // If the counter-release is an album or EP, also ensure it is at the top of `targetNpc.albums`
  if (counter.type === 'album' || counter.type === 'ep') {
    targetNpc.albums = targetNpc.albums || [];
    const existingAlbIdx = targetNpc.albums.findIndex(
      a => a.title.toLowerCase() === counter.title.toLowerCase()
    );
    const albEntry = {
      title: counter.title,
      cover: counter.cover,
      sales: Math.max(counter.dailySales, Math.floor(counter.totalStreams / 1500 + counter.totalSales * 0.45)),
      dailySales: Math.max(50, Math.floor(counter.dailyStreams / 1500 + counter.dailySales * 0.45)),
      weeklySales: Math.max(250, Math.floor(counter.weeklyStreams / 1500 + counter.dailySales * 2.5)),
      streams: counter.totalStreams,
      dailyStreams: counter.dailyStreams,
      weeklyStreams: counter.weeklyStreams,
      daysSinceRelease: counter.daysSinceRelease,
      year: new Date(state?.date || counter.releaseDate || '2026-01-01').getFullYear() || 2026,
      tracks: [
        counterSongEntry,
        ...(targetNpc.songs.slice(1, 7).map(s => ({
          ...s,
          trackType: 'b_side' as const
        })))
      ]
    };
    if (existingAlbIdx >= 0) {
      targetNpc.albums[existingAlbIdx] = albEntry;
    } else {
      targetNpc.albums.unshift(albEntry);
    }
  }
}

/**
 * Picks a real song/album title and official artwork from the Rival NPC's catalog
 * for their surprise chart-blocking counter-drop.
 */
function pickRivalCounterReleaseMeta(
  rivalNpcId: string,
  rivalName: string,
  releaseKind: 'single' | 'project',
  existingCounterTitle?: string
): { title: string; cover: string; type: 'single' | 'album' | 'ep' } {
  const npc = REAL_WORLD_NPCS.find(
    n => n.id === rivalNpcId || n.name.toLowerCase() === rivalName.toLowerCase()
  );

  if (npc) {
    if (releaseKind === 'project' && npc.albums && npc.albums.length > 0) {
      const candidateAlb =
        npc.albums.find(a => a.title !== existingCounterTitle) || npc.albums[0];
      const cover =
        getVerifiedOfficialReleaseCover(npc.name, candidateAlb.title, true) ||
        resolveRealWorldCoverArt(npc.name, candidateAlb.title, true) ||
        candidateAlb.cover ||
        npc.avatar ||
        '';
      return {
        title: `${candidateAlb.title} (Deluxe Edition)`,
        cover,
        type: 'album'
      };
    }

    if (npc.songs && npc.songs.length > 0) {
      const candidateSong =
        npc.songs.find(s => s.title !== existingCounterTitle) || npc.songs[0];
      const cover =
        getVerifiedOfficialReleaseCover(npc.name, candidateSong.title, false) ||
        resolveRealWorldCoverArt(npc.name, candidateSong.title, false) ||
        candidateSong.cover ||
        npc.avatar ||
        '';
      return {
        title: candidateSong.title,
        cover,
        type: 'single'
      };
    }
  }

  const fallbackCover =
    getVerifiedSpotifyNpcPortrait(rivalName) ||
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80';
  return {
    title: releaseKind === 'project' ? 'THE BLOCKADE (Deluxe)' : 'CROWN WATCH',
    cover: fallbackCover,
    type: releaseKind === 'project' ? 'album' : 'single'
  };
}

/**
 * Triggered immediately when the player releases a Single or Project (`EnhancedReleaseModal`).
 * Only triggers a surprise counter-release if the player ALREADY has an active rival, OR if the player
 * has already built real chart stature and a threatened peer NPC sparks a feud over the same-day release date.
 */
export function triggerRivalCounterReleaseOnPlayerDrop(
  state: GameState,
  playerReleaseTitle: string,
  playerReleaseKind: 'single' | 'project',
  estimatedPlayerFirstDayStreams: number
): {
  didTriggerCounterDrop: boolean;
  updatedRivalState: RivalSystemState;
  counterDropTweets: XPost[];
  headlineAlert: string;
} {
  let currentRival = getEnsuredRivalState(state);
  const playerProfile = getEnsuredXProfile(state);
  const playerName = playerProfile.name;
  const playerHandle = playerProfile.handle.replace(/^@/, '');
  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const timestamp = Date.now();

  // If the player does NOT have an active rival yet, do not randomly counter-block a new/rising artist!
  // Only ignite a release-collision rivalry if the player already has established chart clout & prior releases.
  if (!currentRival.hasActiveRival) {
    const priorReleases = (state.songs || []).filter(
      s => s.status === 'released' && s.title !== playerReleaseTitle
    ).length;
    const hasMajorMomentum =
      priorReleases >= 2 &&
      ((state.popularity || 0) >= 32 || estimatedPlayerFirstDayStreams >= 380000);

    if (!hasMajorMomentum) {
      return {
        didTriggerCounterDrop: false,
        updatedRivalState: currentRival,
        counterDropTweets: [],
        headlineAlert: ''
      };
    }

    // Player is a major chart force: a threatened same-genre peer steps up on release day, creating the cause of rivalry!
    const chosen = selectDefaultRivalNpc(state);
    const portrait =
      getVerifiedSpotifyNpcPortrait(chosen.name) ||
      chosen.avatar ||
      chosen.image ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80';
    const cleanHandle = `@${chosen.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    currentRival = {
      ...currentRival,
      hasActiveRival: true,
      rivalryOriginReason: `Release Day Collision: Ignited when ${chosen.name} surprise-dropped on the exact same day as "${playerReleaseTitle}" to defend their chart spot.`,
      rivalNpcId: chosen.id,
      rivalName: chosen.name,
      rivalHandle: cleanHandle,
      rivalAvatar: portrait,
      rivalGenre: chosen.genre || 'Pop',
      rivalCountry: chosen.country || 'US',
      rivalPop: chosen.pop || 85,
      rivalHype: chosen.hype || 82,
      beefHeat: 45,
      beefStatusLabel: 'Subliminal Shade'
    };
  }

  const meta = pickRivalCounterReleaseMeta(
    currentRival.rivalNpcId,
    currentRival.rivalName,
    playerReleaseKind,
    currentRival.activeCounterRelease?.title
  );

  // Calibrate Rival's counter-drop opening streams so it creates a realistic, neck-and-neck chart battle!
  const npcBasePower = Math.max(
    180000,
    Math.floor(3200000 * Math.pow(Math.max(40, currentRival.rivalPop) / 100, 2.7))
  );
  const competitiveRatio = 0.88 + ((timestamp % 25) / 100); // 0.88x .. 1.12x
  const targetOpeningStreams = Math.max(
    npcBasePower,
    Math.round(Math.max(85000, estimatedPlayerFirstDayStreams) * competitiveRatio)
  );

  // Pure sales variant push (Rival drops digital variants / iTunes discount to block Hot 100 #1)
  const openingDailySales = Math.max(
    450,
    Math.round(targetOpeningStreams * 0.0038 * (1 + currentRival.beefHeat / 150))
  );
  const openingRadio = Math.max(
    1200,
    Math.round(currentRival.rivalPop * 460 + targetOpeningStreams * 0.016)
  );

  const counterRelease: ActiveRivalCounterRelease = {
    title: meta.title,
    type: meta.type,
    cover: meta.cover,
    releaseDate: dateStr,
    daysSinceRelease: 0,
    dailyStreams: targetOpeningStreams,
    totalStreams: targetOpeningStreams,
    weeklyStreams: targetOpeningStreams,
    dailySales: openingDailySales,
    totalSales: openingDailySales,
    radio: openingRadio,
    targetPlayerReleaseTitle: playerReleaseTitle,
    isBlockingAttempt: true
  };

  const nextHeat = Math.min(100, Math.round(currentRival.beefHeat + 16));
  const headlineAlert = `🚨 CHART BLOCK ALERT: ${currentRival.rivalName} just surprise-dropped "${meta.title}" on the exact same day as "${playerReleaseTitle}" to block you from #1 on the charts!`;

  const updatedRivalState: RivalSystemState = {
    ...currentRival,
    hasActiveRival: true,
    rivalryOriginReason:
      currentRival.rivalryOriginReason ||
      `Release Day Collision: Ignited when ${currentRival.rivalName} surprise-dropped "${meta.title}" on the same day as "${playerReleaseTitle}".`,
    rivalHype: Math.min(100, currentRival.rivalHype + 8),
    beefHeat: nextHeat,
    beefStatusLabel: getBeefStatusLabel(nextHeat, true),
    chartBlocksTriggered: (currentRival.chartBlocksTriggered || 0) + 1,
    lastBeefHeadline: headlineAlert,
    activeCounterRelease: counterRelease,
    beefHistoryLog: [
      {
        id: `counter-${timestamp}`,
        date: dateStr,
        type: 'counter_drop',
        text: `${currentRival.rivalName} surprise-released "${meta.title}" hours after "${playerReleaseTitle}" dropped in a direct attempt to block #1!`
      },
      ...(currentRival.beefHistoryLog || []).slice(0, 14)
    ]
  };

  // Generate instant viral X tweets about the Chart-Block Beef!
  const followers = playerProfile.followers || 5000;
  const counterDropTweets: XPost[] = [
    {
      id: `rival-drop-popbase-${timestamp}`,
      authorName: 'Pop Base',
      authorHandle: '@PopBase',
      authorAvatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80',
      isVerified: true,
      verifiedType: 'blue',
      category: 'media',
      timeAgo: 'Just now',
      dateCreated: dateStr,
      content: `🚨 ${currentRival.rivalName} has surprise-released "${meta.title}" alongside discounted digital variants on the exact same day as ${playerName}'s "${playerReleaseTitle}", sparking a massive battle for #1 on the charts.`,
      image: meta.cover,
      mediaBadge: 'CHART WAR ALERT',
      mediaTitle: `${playerName} vs. ${currentRival.rivalName}`,
      mediaSubtitle: `"${playerReleaseTitle}" vs. "${meta.title}" • Battle for #1`,
      likes: Math.max(4800, Math.round(followers * 0.16 + 3200)),
      reposts: Math.max(1100, Math.round(followers * 0.04 + 640)),
      replies: 412,
      views: Math.max(125000, Math.round(followers * 1.4 + 68000)),
      isPlayerPost: false,
      daysOld: 0
    },
    {
      id: `rival-drop-shade-${timestamp}`,
      authorName: currentRival.rivalName,
      authorHandle: currentRival.rivalHandle,
      authorAvatar: currentRival.rivalAvatar,
      isVerified: true,
      verifiedType: 'blue',
      category: 'media',
      timeAgo: 'Just now',
      dateCreated: dateStr,
      content: `thought the charts needed real music today. "${meta.title}" out everywhere now. let's see who really runs this era 👑🤫`,
      image: meta.cover,
      mediaBadge: 'SURPRISE DROP',
      mediaTitle: `${meta.title} — ${currentRival.rivalName}`,
      mediaSubtitle: `Out Now • Direct Chart Competition`,
      likes: Math.max(6200, Math.round(followers * 0.18 + 4500)),
      reposts: Math.max(1450, Math.round(followers * 0.05 + 890)),
      replies: 680,
      views: Math.max(165000, Math.round(followers * 1.6 + 85000)),
      isPlayerPost: false,
      daysOld: 0
    },
    {
      id: `rival-drop-fanrally-${timestamp}`,
      authorName: `${playerName} Charts`,
      authorHandle: `@${playerHandle}charts`,
      authorAvatar: state.artist?.image || currentRival.rivalAvatar,
      isVerified: true,
      verifiedType: 'blue',
      category: 'fanbase',
      timeAgo: 'Just now',
      dateCreated: dateStr,
      content: `🚨 EMERGENCY FANDOM ALERT 🚨\n\n${currentRival.rivalName} just dropped "${meta.title}" on the exact same day to block ${playerName}'s "${playerReleaseTitle}" from #1!\n\n• Buy "${playerReleaseTitle}" on US iTunes NOW\n• Stream non-stop on focused playlists\n• Do NOT let them block our #1 debut! 🔥🕯️`,
      image: state.artist?.image || meta.cover,
      mediaBadge: 'DEFEND THE #1',
      likes: Math.max(1950, Math.round(followers * 0.08 + 900)),
      reposts: Math.max(780, Math.round(followers * 0.035 + 420)),
      replies: 230,
      views: Math.max(44000, Math.round(followers * 0.75 + 22000)),
      isPlayerPost: false,
      daysOld: 0
    }
  ];

  return {
    didTriggerCounterDrop: true,
    updatedRivalState,
    counterDropTweets,
    headlineAlert
  };
}

/**
 * Advances the Rival's counter-release metrics and head-to-head chart battle score every day.
 * If the player does not have a rival yet, checks if an organic chart collision/overtake occurs!
 */
export function processDailyRivalSystemStep(state: GameState): RivalSystemState {
  const rival = getEnsuredRivalState(state);
  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';

  const releasedPlayerSongs = (state.songs || []).filter(s => s.status === 'released');
  const latestPlayerSong = releasedPlayerSongs[releasedPlayerSongs.length - 1];

  // If the player has NO active rival yet, check for an organic cause of rivalry (Chart Clash / Overtake)
  if (!rival.hasActiveRival) {
    if (!latestPlayerSong) {
      return rival;
    }

    const pDaily = latestPlayerSong.dailyStreams || 0;
    const playerPop = state.popularity || 0;
    // A song needs meaningful chart velocity before established artists take notice and start beefing
    if (pDaily < 65000 && (playerPop < 22 || pDaily < 35000)) {
      return rival;
    }

    const playerName = state.artist?.name || 'You';
    const playerGenre = ((state.artist as any)?.genre || 'Pop').toLowerCase().split('/')[0].trim();

    // Find an NPC whose active song is in a tight chart battle with the player's song
    const clashingNpc = REAL_WORLD_NPCS.find(npc => {
      if (isNpcMatchingPlayerName(npc.name, playerName)) return false;
      const topSong = npc.songs?.[0];
      if (!topSong) return false;
      const npcDaily = topSong.dailyStreams || Math.floor((topSong.streams || 140000) / 14);
      const ratio = pDaily / Math.max(1, npcDaily);
      const isSameGenre = (npc.genre || '').toLowerCase().includes(playerGenre);
      // Trigger when player's daily streams are neck-and-neck with or overtaking the NPC's song
      return isSameGenre ? ratio >= 0.78 && ratio <= 1.45 : ratio >= 0.9 && ratio <= 1.25;
    });

    if (!clashingNpc) {
      return rival;
    }

    const clashingSongTitle = clashingNpc.songs?.[0]?.title || 'their latest single';
    const portrait =
      getVerifiedSpotifyNpcPortrait(clashingNpc.name) ||
      clashingNpc.avatar ||
      clashingNpc.image ||
      '';
    const cleanHandle = `@${clashingNpc.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const originReason = `Chart Clash: Ignited when your release "${latestPlayerSong.title}" (${formatNumFull(pDaily)}/d) collided with ${clashingNpc.name}'s "${clashingSongTitle}" on the daily charts.`;

    return {
      hasActiveRival: true,
      rivalryOriginReason: originReason,
      rivalNpcId: clashingNpc.id,
      rivalName: clashingNpc.name,
      rivalHandle: cleanHandle,
      rivalAvatar: portrait,
      rivalGenre: clashingNpc.genre || 'Pop',
      rivalCountry: clashingNpc.country || 'US',
      rivalPop: clashingNpc.pop || 84,
      rivalHype: clashingNpc.hype || 80,
      beefHeat: 46,
      beefStatusLabel: 'Subliminal Shade',
      playerChartWins: 1,
      rivalChartWins: 0,
      chartBlocksTriggered: 0,
      lastBeefHeadline: `🔥 NEW RIVALRY IGNITED: ${clashingNpc.name} threw shade on X after your track "${latestPlayerSong.title}" clashed with "${clashingSongTitle}" on the charts!`,
      activeCounterRelease: null,
      beefHistoryLog: [
        {
          id: `clash-${Date.now()}`,
          date: dateStr,
          type: 'chart_clash',
          text: `${originReason} ${clashingNpc.name} reacted to fan comparisons on X, kicking off an official chart rivalry!`
        }
      ]
    };
  }

  let updatedCounter = rival.activeCounterRelease ? { ...rival.activeCounterRelease } : null;
  let playerWins = rival.playerChartWins || 0;
  let rivalWins = rival.rivalChartWins || 0;
  let headline = rival.lastBeefHeadline;
  const newLogs = [...(rival.beefHistoryLog || [])];

  if (updatedCounter) {
    updatedCounter.daysSinceRelease = (updatedCounter.daysSinceRelease || 0) + 1;
    const d = updatedCounter.daysSinceRelease;

    // Realistic post-debut curve for the Rival's counter-release
    let decayFactor = 0.94;
    if (d === 1) {
      decayFactor = 0.86 + ((d * 17) % 10) / 100; // Day 2 natural post-debut settle
    } else if (d <= 7) {
      decayFactor = 0.94 + ((d * 13) % 9) / 100; // Week 1 stability
    } else {
      decayFactor = 0.955;
    }

    updatedCounter.dailyStreams = Math.max(
      25000,
      Math.round(updatedCounter.dailyStreams * decayFactor)
    );
    updatedCounter.totalStreams += updatedCounter.dailyStreams;
    updatedCounter.weeklyStreams =
      d < 7
        ? updatedCounter.totalStreams
        : Math.round(updatedCounter.dailyStreams * 6.8);

    updatedCounter.dailySales = Math.max(
      35,
      Math.round(updatedCounter.dailySales * (d <= 3 ? 0.72 : 0.88))
    );
    updatedCounter.totalSales += updatedCounter.dailySales;
    updatedCounter.radio = Math.min(
      96000,
      Math.round(updatedCounter.radio * 1.04 + 180)
    );

    // Head-to-head daily comparison against the player's latest song
    if (latestPlayerSong) {
      const pDaily = latestPlayerSong.dailyStreams || 0;
      const rDaily = updatedCounter.dailyStreams || 0;
      const diff = Math.abs(pDaily - rDaily);

      if (pDaily >= rDaily) {
        playerWins += 1;
        headline = `🔥 YOU LEAD THE CHART WAR: "${latestPlayerSong.title}" (${formatNumFull(pDaily)}/d) is currently out-streaming ${rival.rivalName}'s "${updatedCounter.title}" (${formatNumFull(rDaily)}/d) by +${formatNumFull(diff)} streams!`;
      } else {
        rivalWins += 1;
        headline = `⚠️ CHART BLOCK THREAT: ${rival.rivalName}'s "${updatedCounter.title}" (${formatNumFull(rDaily)}/d) is ahead of "${latestPlayerSong.title}" (${formatNumFull(pDaily)}/d) by ${formatNumFull(diff)} daily streams!`;
      }
    }
  } else if (latestPlayerSong) {
    // Compare against the Rival's top catalog song from REAL_WORLD_NPCS
    const liveRivalNpc = REAL_WORLD_NPCS.find(
      n => n.id === rival.rivalNpcId || n.name.toLowerCase() === rival.rivalName.toLowerCase()
    );
    const topRivalSong = liveRivalNpc?.songs?.[0];
    if (topRivalSong) {
      const pDaily = latestPlayerSong.dailyStreams || 0;
      const rDaily = topRivalSong.dailyStreams || 0;
      if (pDaily >= rDaily) {
        playerWins += 1;
        headline = `"${latestPlayerSong.title}" (${formatNumFull(pDaily)}/d) outpaced ${rival.rivalName}'s "${topRivalSong.title}" (${formatNumFull(rDaily)}/d) on today's global counter.`;
      } else {
        rivalWins += 1;
        headline = `${rival.rivalName}'s "${topRivalSong.title}" (${formatNumFull(rDaily)}/d) holds a lead over "${latestPlayerSong.title}" (${formatNumFull(pDaily)}/d).`;
      }
    }
  }

  const nextHeat = Math.max(25, Math.min(100, Number((rival.beefHeat * 0.985).toFixed(1))));

  const nextRivalState: RivalSystemState = {
    ...rival,
    hasActiveRival: true,
    beefHeat: nextHeat,
    beefStatusLabel: getBeefStatusLabel(nextHeat, true),
    playerChartWins: playerWins,
    rivalChartWins: rivalWins,
    lastBeefHeadline: headline,
    activeCounterRelease: updatedCounter,
    beefHistoryLog: newLogs.slice(0, 15)
  };

  // Inject into REAL_WORLD_NPCS so charts reflect today's updated numbers
  injectRivalCounterReleaseIntoNpcCatalog({
    ...state,
    rivalState: nextRivalState
  } as any);

  return nextRivalState;
}

/**
 * Player Action 1: Post a Subliminal Diss / Callout on X against the Arch-Rival.
 * Escalates Beef Heat, boosts Player Hype, and triggers a viral Rival clapback on X!
 */
export function executePlayerBeefDissAction(
  state: GameState,
  customShadeText?: string
): {
  updatedState: GameState;
  notification: string;
} {
  let rival = getEnsuredRivalState(state);
  const profile = getEnsuredXProfile(state);
  const playerName = profile.name;
  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const timestamp = Date.now();

  if (!rival.hasActiveRival) {
    const chosen = selectDefaultRivalNpc(state);
    const portrait =
      getVerifiedSpotifyNpcPortrait(chosen.name) ||
      chosen.avatar ||
      chosen.image ||
      '';
    const cleanHandle = `@${chosen.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    rival = {
      ...rival,
      hasActiveRival: true,
      rivalryOriginReason: `Public Callout: Ignited when you publicly called out ${chosen.name} on X.`,
      rivalNpcId: chosen.id,
      rivalName: chosen.name,
      rivalHandle: cleanHandle,
      rivalAvatar: portrait,
      rivalGenre: chosen.genre || 'Pop',
      rivalCountry: chosen.country || 'US',
      rivalPop: chosen.pop || 86,
      rivalHype: chosen.hype || 82,
      beefHeat: 35,
      beefStatusLabel: 'Subliminal Shade'
    };
  }

  const latestSong = (state.songs || []).filter(s => s.status === 'released').slice(-1)[0];

  const defaultDiss = latestSong
    ? `funny how some artists only drop when they see "${latestSong.title}" dominating the charts. organic hits don't need desperate tactics ☕💅`
    : `some people in this industry talk heavy until it's time to go studio for studio, vocal for vocal, chart for chart 🔥🤫`;

  const playerPostText = customShadeText?.trim() || defaultDiss;

  const playerDissPost: XPost = {
    id: `player-diss-${timestamp}`,
    authorName: profile.name,
    authorHandle: profile.handle,
    authorAvatar: state.artist?.image || rival.rivalAvatar,
    isVerified: true,
    verifiedType: 'blue',
    category: 'fanbase',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: playerPostText,
    likes: Math.max(5400, Math.round((profile.followers || 5000) * 0.19 + 3200)),
    reposts: Math.max(1300, Math.round((profile.followers || 5000) * 0.05 + 750)),
    replies: 540,
    views: Math.max(140000, Math.round((profile.followers || 5000) * 1.5 + 70000)),
    isPlayerPost: true,
    daysOld: 0
  };

  const rivalClapbackPost: XPost = {
    id: `rival-clapback-${timestamp}`,
    authorName: rival.rivalName,
    authorHandle: rival.rivalHandle,
    authorAvatar: rival.rivalAvatar,
    isVerified: true,
    verifiedType: 'blue',
    category: 'media',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: `imagine tweeting paragraphs when the scoreboard is right there on Billboard & Spotify. check the numbers @${profile.handle.replace(/^@/, '')} 💀📉`,
    quoteTweet: {
      authorName: profile.name,
      authorHandle: profile.handle,
      isVerified: true,
      verifiedType: 'blue',
      content: playerPostText
    },
    likes: Math.max(6800, Math.round((profile.followers || 5000) * 0.21 + 4800)),
    reposts: Math.max(1600, Math.round((profile.followers || 5000) * 0.055 + 920)),
    replies: 810,
    views: Math.max(185000, Math.round((profile.followers || 5000) * 1.8 + 95000)),
    isPlayerPost: false,
    daysOld: 0
  };

  const popCraveAlert: XPost = {
    id: `popcrave-feud-${timestamp}`,
    authorName: 'Pop Crave',
    authorHandle: '@PopCrave',
    authorAvatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&q=80',
    isVerified: true,
    verifiedType: 'blue',
    category: 'media',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: `👀 ${playerName} and ${rival.rivalName} are trading direct shots on X as their fanbase chart war intensifies across Spotify and Billboard.`,
    image: state.artist?.image || rival.rivalAvatar,
    mediaBadge: 'INDUSTRY FEUD',
    likes: Math.max(7500, Math.round((profile.followers || 5000) * 0.22 + 5400)),
    reposts: Math.max(1800, Math.round((profile.followers || 5000) * 0.06 + 1100)),
    replies: 690,
    views: Math.max(210000, Math.round((profile.followers || 5000) * 2.0 + 110000)),
    isPlayerPost: false,
    daysOld: 0
  };

  const nextHeat = Math.min(100, Math.round(rival.beefHeat + 20));
  const nextHype = Math.min(100, Number(((state.hype || 15) + 6.5).toFixed(1)));

  const updatedRivalState: RivalSystemState = {
    ...rival,
    hasActiveRival: true,
    beefHeat: nextHeat,
    beefStatusLabel: getBeefStatusLabel(nextHeat, true),
    lastBeefHeadline: `${playerName} & ${rival.rivalName} traded viral shots on X! Beef Heat surged to ${nextHeat}% (+6.5% Hype).`,
    beefHistoryLog: [
      {
        id: `diss-log-${timestamp}`,
        date: dateStr,
        type: 'diss_tweet',
        text: `You called out ${rival.rivalName} on X ("${playerPostText.slice(0, 58)}..."), sparking a viral clapback!`
      },
      ...(rival.beefHistoryLog || []).slice(0, 14)
    ]
  };

  const updatedState: GameState = {
    ...state,
    hype: nextHype,
    xPosts: [popCraveAlert, rivalClapbackPost, playerDissPost, ...(state.xPosts || [])],
    ...({ rivalState: updatedRivalState } as any)
  };

  return {
    updatedState,
    notification: `Diss posted on X! ${rival.rivalName} clapped back — Hype +6.5% & Beef Heat ${nextHeat}%!`
  };
}

/**
 * Player Action 2: Mobilize Dedicated Fans for a Chart-Block Defense Rally (Stationhead + iTunes Buying Party)
 * Boosts the player's latest released song streams and pure sales to overtake the Rival!
 */
export function executeFanbaseChartDefenseRally(
  state: GameState
): {
  updatedState: GameState;
  notification: string;
} {
  const rival = getEnsuredRivalState(state);
  if (!rival.hasActiveRival) {
    return {
      updatedState: state,
      notification: 'You need an active rivalry before launching a Chart-Block Defense Rally!'
    };
  }
  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const latestSong = releasedSongs[releasedSongs.length - 1];

  if (!latestSong) {
    return {
      updatedState: state,
      notification: 'Release a song first before rallying your fanbase for a chart battle!'
    };
  }

  const rallyCost = 5000;
  if (state.money < rallyCost) {
    return {
      updatedState: state,
      notification: 'Need $5,000 to sponsor a global Stationhead & iTunes Fanbase Rally!'
    };
  }

  const fans = state.fans || 500;
  const streamSurge = Math.max(
    45000,
    Math.round((latestSong.dailyStreams || 50000) * 0.18 + Math.pow(fans, 0.75) * 4)
  );
  const salesSurge = Math.max(
    350,
    Math.round((latestSong.dailyPureSales || 150) * 0.35 + Math.pow(fans, 0.65) * 0.8)
  );

  const updatedSongs = state.songs.map(s => {
    if (s.id === latestSong.id) {
      return {
        ...s,
        dailyStreams: (s.dailyStreams || 0) + streamSurge,
        streams: (s.streams || 0) + streamSurge,
        weeklyStreams: (s.weeklyStreams || 0) + streamSurge,
        dailyPureSales: (s.dailyPureSales || 0) + salesSurge,
        pureSales: (s.pureSales || 0) + salesSurge,
        weeklyPureSales: (s.weeklyPureSales || 0) + salesSurge
      };
    }
    return s;
  });

  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const timestamp = Date.now();
  const profile = getEnsuredXProfile(state);
  const cleanHandle = profile.handle.replace(/^@/, '');

  const rallyTweet: XPost = {
    id: `fan-rally-${timestamp}`,
    authorName: `${profile.name} Charts`,
    authorHandle: `@${cleanHandle}charts`,
    authorAvatar: state.artist?.image || rival.rivalAvatar,
    isVerified: true,
    verifiedType: 'blue',
    category: 'fanbase',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: `🔥 MASSIVE FANBASE RALLY UPDATE:\n\nDedicated stans just pushed "${latestSong.title}" by +${formatNumFull(streamSurge)} streams and +${formatNumFull(salesSurge)} pure digital sales on iTunes to counter ${rival.rivalName}'s chart block! Keep pushing for #1! 📈👑`,
    image: latestSong.cover || state.artist?.image,
    mediaBadge: 'CHART DEFENSE SURGE',
    likes: Math.max(2400, Math.round((profile.followers || 5000) * 0.11 + 1100)),
    reposts: Math.max(850, Math.round((profile.followers || 5000) * 0.04 + 450)),
    replies: 195,
    views: Math.max(54000, Math.round((profile.followers || 5000) * 0.85 + 25000)),
    isPlayerPost: false,
    daysOld: 0
  };

  const updatedRivalState: RivalSystemState = {
    ...rival,
    playerChartWins: (rival.playerChartWins || 0) + 1,
    lastBeefHeadline: `Your fanbase mobilized a massive rally for "${latestSong.title}", adding +${formatNum(streamSurge)} streams & +${formatNum(salesSurge)} pure sales against ${rival.rivalName}!`,
    beefHistoryLog: [
      {
        id: `rally-log-${timestamp}`,
        date: dateStr,
        type: 'fan_rally',
        text: `Fanbase Chart Defense added +${formatNumFull(streamSurge)} streams & +${formatNumFull(salesSurge)} pure sales to "${latestSong.title}"!`
      },
      ...(rival.beefHistoryLog || []).slice(0, 14)
    ]
  };

  return {
    updatedState: {
      ...state,
      money: state.money - rallyCost,
      songs: updatedSongs,
      dailyStreamsTotal: (state.dailyStreamsTotal || 0) + streamSurge,
      xPosts: [rallyTweet, ...(state.xPosts || [])],
      ...({ rivalState: updatedRivalState } as any)
    },
    notification: `Fanbase Rally surged "${latestSong.title}" by +${formatNumFull(streamSurge)} streams & +${formatNumFull(salesSurge)} pure sales!`
  };
}

/**
 * Allows the player to publicly call out or challenge any real-world NPC artist as their Arch-Rival.
 */
export function switchActiveRivalNpc(
  state: GameState,
  targetNpcId: string
): GameState {
  const chosen = REAL_WORLD_NPCS.find(n => n.id === targetNpcId);
  if (!chosen) return state;

  const portrait =
    getVerifiedSpotifyNpcPortrait(chosen.name) ||
    chosen.avatar ||
    chosen.image ||
    '';
  const cleanHandle = `@${chosen.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const prevRival = getEnsuredRivalState(state);
  const originReason = `Public Callout: Started when you publicly challenged ${chosen.name} to a head-to-head chart rivalry.`;

  const nextRivalState: RivalSystemState = {
    hasActiveRival: true,
    rivalryOriginReason: originReason,
    rivalNpcId: chosen.id,
    rivalName: chosen.name,
    rivalHandle: cleanHandle,
    rivalAvatar: portrait,
    rivalGenre: chosen.genre || 'Pop',
    rivalCountry: chosen.country || 'US',
    rivalPop: chosen.pop || 88,
    rivalHype: chosen.hype || 85,
    beefHeat: 55,
    beefStatusLabel: 'Active Chart War',
    playerChartWins: prevRival.playerChartWins || 0,
    rivalChartWins: prevRival.rivalChartWins || 0,
    chartBlocksTriggered: prevRival.chartBlocksTriggered || 0,
    lastBeefHeadline: `You publicly called out ${chosen.name} as your primary chart rival! Watch out when you drop your next single or album.`,
    activeCounterRelease: null,
    beefHistoryLog: [
      {
        id: `switch-${Date.now()}`,
        date: dateStr,
        type: 'rival_switch',
        text: `${originReason} (${chosen.genre} • ${chosen.pop}% Popularity).`
      },
      ...(prevRival.beefHistoryLog || []).slice(0, 14)
    ]
  };

  return {
    ...state,
    ...({ rivalState: nextRivalState } as any)
  };
}
