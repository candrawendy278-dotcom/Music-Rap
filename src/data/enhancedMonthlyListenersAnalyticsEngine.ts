// Enhanced Spotify 28-Day Rolling Monthly Listeners & Global City Audience Engine
// Models authentic Spotify monthly listener dynamics:
// 1. 28-day rolling stream conversion (new release discovery vs. catalog repeat listeners)
// 2. Editorial & algorithmic playlist unique reach boost
// 3. Collaboration crossover listeners from featured NPC artists
// 4. Daily listener delta (+/-), All-Time Career Peak, World Rank, and Top 5 Global Listener Cities!

import { GameState, Song } from '../types';
import { getNpcCollabExpectations } from './collabNegotiationAndRoyaltyEngine';
import { getTopArtistsByMonthlyListeners } from './spotifyCatalogExpanded';

export interface ListenerCityStat {
  city: string;
  country: string;
  flag: string;
  listeners: number;
  sharePercent: number;
}

export interface MonthlyListenersAnalytics {
  monthlyListeners: number;
  listenerDelta: number;
  peakListeners: number;
  globalRank: number | null;
  followerRatioPercent: number;
  playlistReachListeners: number;
  collabCrossoverListeners: number;
  organicCatalogListeners: number;
  topCities: ListenerCityStat[];
}

const GLOBAL_MUSIC_HUBS: Array<{
  city: string;
  countryCode: string;
  country: string;
  flag: string;
  baseShare: number;
}> = [
  { city: 'Jakarta', countryCode: 'ID', country: 'Indonesia', flag: '🇮🇩', baseShare: 0.052 },
  { city: 'London', countryCode: 'GB', country: 'United Kingdom', flag: '🇬🇧', baseShare: 0.046 },
  { city: 'Los Angeles', countryCode: 'US', country: 'United States', flag: '🇺🇸', baseShare: 0.044 },
  { city: 'São Paulo', countryCode: 'BR', country: 'Brazil', flag: '🇧🇷', baseShare: 0.041 },
  { city: 'Mexico City', countryCode: 'MX', country: 'Mexico', flag: '🇲🇽', baseShare: 0.039 },
  { city: 'New York City', countryCode: 'US', country: 'United States', flag: '🇺🇸', baseShare: 0.037 },
  { city: 'Tokyo', countryCode: 'JP', country: 'Japan', flag: '🇯🇵', baseShare: 0.034 },
  { city: 'Sydney', countryCode: 'AU', country: 'Australia', flag: '🇦🇺', baseShare: 0.031 },
  { city: 'Manila', countryCode: 'PH', country: 'Philippines', flag: '🇵🇭', baseShare: 0.029 },
  { city: 'Seoul', countryCode: 'KR', country: 'South Korea', flag: '🇰🇷', baseShare: 0.027 }
];

/**
 * Computes the next day's realistic 28-day rolling Spotify Monthly Listeners,
 * daily delta (+/-), and career peak monthly listeners.
 */
export function calculateEnhancedMonthlyListenersStep(params: {
  dailyStreams: number;
  popularity: number;
  hype: number;
  followers: number;
  previousListeners: number;
  previousPeak?: number;
  releasedSongs?: Song[];
}): {
  listeners: number;
  listenerDelta: number;
  peakListeners: number;
} {
  const {
    dailyStreams = 0,
    popularity = 2,
    hype = 15,
    followers = 0,
    previousListeners = 0,
    previousPeak = 0,
    releasedSongs = []
  } = params;

  // Sort released songs by daily streams descending to account for multi-track listener overlap
  // (Listeners playing Track #2, #3, etc. on an album largely overlap with Track #1's unique listeners)
  const sortedByDaily = [...releasedSongs].sort(
    (a, b) => (b.dailyStreams || 0) - (a.dailyStreams || 0)
  );

  let effectiveUniqueDailyReach = 0;
  if (sortedByDaily.length > 0) {
    sortedByDaily.forEach((song, idx) => {
      const sDaily = Math.max(0, song.dailyStreams || 0);
      const overlapWeight =
        idx === 0 ? 1.0 :
        idx === 1 ? 0.34 :
        idx === 2 ? 0.20 :
        idx < 6 ? 0.10 : 0.04;
      effectiveUniqueDailyReach += sDaily * overlapWeight;
    });
  } else {
    effectiveUniqueDailyReach = dailyStreams * 0.75;
  }

  // Average streams per unique listener over a 28-day window (typically 7.2 to 12.5 streams/listener/month)
  const avgStreamsPerUniqueListenerPerMonth =
    7.2 + (popularity / 100) * 3.1 + Math.min(2.2, releasedSongs.length * 0.1);
  const rolling28DayUniqueStreamPool = effectiveUniqueDailyReach * 28;
  const baseStreamListeners = Math.round(
    rolling28DayUniqueStreamPool / avgStreamsPerUniqueListenerPerMonth
  );

  // 1. Bounded New Release & Editorial Playlist reach multipliers (casual discovery lift)
  let maxFreshnessBoost = 0;
  let totalPlaylistScore = 0;
  const collabBonuses: number[] = [];

  sortedByDaily.forEach((song, idx) => {
    const daysOut = song.daysSinceRelease ?? 0;
    const sDaily = Math.max(0, song.dailyStreams || 0);

    if (daysOut <= 21 && sDaily > 0) {
      const freshnessFactor = Math.max(0.1, (22 - daysOut) / 22);
      const trackWeight = idx === 0 ? 1.0 : idx === 1 ? 0.45 : 0.2;
      maxFreshnessBoost = Math.max(maxFreshnessBoost, freshnessFactor * 0.16 * trackWeight);
    }

    const plCount = song.playlistPlacements?.length || 0;
    if (plCount > 0) {
      const plWeight = idx === 0 ? 1.0 : idx < 3 ? 0.4 : 0.15;
      totalPlaylistScore += Math.min(4, plCount) * 0.032 * plWeight;
    }

    // 2. Collaboration crossover audience from featured NPC artist (discounted for multiple collabs)
    if (song.collabId && song.collabId !== 'none') {
      const exp = getNpcCollabExpectations(song.collabId, popularity);
      const decay = daysOut <= 28 ? 1.0 : Math.max(0.2, 28 / Math.max(28, daysOut));
      const songCollabBonus = Math.round(
        (sDaily * (0.42 + exp.audienceCrossoverBoost * 0.85) + exp.npcPop * 1400) * decay
      );
      collabBonuses.push(songCollabBonus);
    }
  });

  collabBonuses.sort((a, b) => b - a);
  const collabCrossoverBonus = Math.round(
    collabBonuses.reduce((sum, val, i) => sum + val * (i === 0 ? 1.0 : i === 1 ? 0.3 : 0.1), 0)
  );

  const reachMultiplier = 1 + Math.min(0.16, maxFreshnessBoost) + Math.min(0.18, totalPlaylistScore);
  const streamDerivedListeners = Math.round(baseStreamListeners * reachMultiplier);

  // 3. Passive catalog discovery from followers & artist buzz (with realistic active ratio)
  const rawFollowerActive = Math.round(
    followers * (0.19 + Math.min(0.14, hype / 420))
  );
  const followerActiveListeners =
    rawFollowerActive > 28_000_000
      ? 28_000_000 + Math.round((rawFollowerActive - 28_000_000) * 0.45)
      : rawFollowerActive;

  const discoveryFloor = Math.round(popularity * 850 + hype * 240);

  // Combine stream reach and passive follower reach (accounting for overlap between followers and active streamers)
  const uncompressedTarget = Math.max(
    streamDerivedListeners + Math.round(followerActiveListeners * 0.42) + collabCrossoverBonus,
    followerActiveListeners + Math.round(streamDerivedListeners * 0.35) + collabCrossoverBonus + discoveryFloor
  );

  // Soft compression curve above 58M so only historic global peaks reach 85M - 110M
  const softKnee = 58_000_000;
  const rawTargetListeners =
    uncompressedTarget > softKnee
      ? softKnee + Math.round(Math.pow(uncompressedTarget - softKnee, 0.88) * 1.45)
      : uncompressedTarget;

  // Smooth 28-day rolling window inertia (with automatic downward recalibration for legacy inflated saves)
  let nextListeners = rawTargetListeners;
  if (previousListeners > 0) {
    if (previousListeners > rawTargetListeners * 1.55 && previousListeners > 12_000_000) {
      // Fast recalibration if previous save had legacy inflated listener numbers
      nextListeners = Math.round(rawTargetListeners * 1.06);
    } else if (rawTargetListeners >= previousListeners) {
      // Surges smoothly when new music, playlists, or collabs hit
      nextListeners = Math.round(previousListeners * 0.74 + rawTargetListeners * 0.26);
    } else {
      // Gradual 28-day rolling decay when between eras
      nextListeners = Math.round(previousListeners * 0.90 + rawTargetListeners * 0.10);
    }
  }

  const hardCap = 112_000_000;
  const finalListeners = Math.min(hardCap, Math.max(0, nextListeners));
  const listenerDelta = finalListeners - previousListeners;
  const peakListeners = Math.min(
    hardCap,
    Math.max(
      previousPeak > hardCap ? finalListeners : (previousPeak || 0),
      finalListeners
    )
  );

  return {
    listeners: finalListeners,
    listenerDelta,
    peakListeners
  };
}

/**
 * Generates a full Spotify Monthly Listeners & Where People Listen breakdown for SpotifyApp.
 */
export function getMonthlyListenerAnalyticsBreakdown(
  state: GameState
): MonthlyListenersAnalytics {
  const monthlyListeners = state.spotify?.listeners || 0;
  const listenerDelta = (state.spotify as any)?.listenerDelta || 0;
  const peakListeners = Math.max(
    monthlyListeners,
    (state.spotify as any)?.peakListeners || monthlyListeners
  );
  const followers = state.spotify?.followers || 0;
  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');

  // Check Global Rank among top world artists
  const topWorld = getTopArtistsByMonthlyListeners(state);
  const playerRankIdx = topWorld.findIndex(a => a.isPlayer);
  const globalRank = playerRankIdx >= 0 ? playerRankIdx + 1 : monthlyListeners >= 5_000_000 ? 150 : null;

  // Estimate source shares
  const hasPlaylists = releasedSongs.some(s => (s.playlistPlacements?.length || 0) > 0);
  const hasCollabs = releasedSongs.some(s => s.collabId && s.collabId !== 'none');

  const playlistShare = hasPlaylists ? 0.28 : 0.08;
  const collabShare = hasCollabs ? 0.24 : 0.0;
  const organicShare = Math.max(0.2, 1 - playlistShare - collabShare);

  const playlistReachListeners = Math.round(monthlyListeners * playlistShare);
  const collabCrossoverListeners = Math.round(monthlyListeners * collabShare);
  const organicCatalogListeners = Math.max(
    0,
    monthlyListeners - playlistReachListeners - collabCrossoverListeners
  );

  const followerRatioPercent =
    monthlyListeners > 0
      ? Math.min(100, Number(((followers / monthlyListeners) * 100).toFixed(1)))
      : 0;

  // Compute Top 5 Listener Cities (boosts home country hub to #1 or #2!)
  const playerCountry = state.artist?.country || 'US';
  const scoredCities = GLOBAL_MUSIC_HUBS.map(hub => {
    const isHomeCountry = hub.countryCode === playerCountry;
    const adjustedShare = isHomeCountry ? hub.baseShare * 1.45 : hub.baseShare;
    const listeners = Math.max(
      monthlyListeners > 0 ? 12 : 0,
      Math.round(monthlyListeners * adjustedShare)
    );
    return {
      city: hub.city,
      country: hub.country,
      flag: hub.flag,
      listeners,
      sharePercent: Number((adjustedShare * 100).toFixed(1))
    };
  })
    .sort((a, b) => b.listeners - a.listeners)
    .slice(0, 5);

  return {
    monthlyListeners,
    listenerDelta,
    peakListeners,
    globalRank,
    followerRatioPercent,
    playlistReachListeners,
    collabCrossoverListeners,
    organicCatalogListeners,
    topCities: scoredCities
  };
}
