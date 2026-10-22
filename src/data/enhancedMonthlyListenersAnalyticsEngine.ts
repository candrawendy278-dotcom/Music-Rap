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

  const avgStreamsPerUniqueListenerPerMonth = 4.2 + (popularity / 100) * 1.6;
  const rolling28DayStreamPool = dailyStreams * 28;
  const streamDerivedListeners = Math.round(
    rolling28DayStreamPool / avgStreamsPerUniqueListenerPerMonth
  );

  // 1. New Release Discovery Surge (tracks released within last 21 days bring high unique listener discovery)
  let newReleaseBonus = 0;
  let playlistReachBonus = 0;
  let collabCrossoverBonus = 0;

  releasedSongs.forEach(song => {
    const daysOut = song.daysSinceRelease ?? 0;
    const sDaily = song.dailyStreams || 0;

    if (daysOut <= 21) {
      const freshnessFactor = Math.max(0.15, (22 - daysOut) / 22);
      newReleaseBonus += Math.round(sDaily * 2.4 * freshnessFactor);
    }

    // 2. Playlist placements bring casual unique listeners
    const plCount = song.playlistPlacements?.length || 0;
    if (plCount > 0) {
      playlistReachBonus += Math.round(sDaily * Math.min(1.8, plCount * 0.45) + plCount * 4200);
    }

    // 3. Collaboration crossover audience from featured NPC artist
    if (song.collabId && song.collabId !== 'none') {
      const exp = getNpcCollabExpectations(song.collabId, popularity);
      const decay = daysOut <= 28 ? 1.0 : Math.max(0.25, 28 / Math.max(28, daysOut));
      collabCrossoverBonus += Math.round(
        (sDaily * (1.2 + exp.audienceCrossoverBoost * 3) + exp.npcPop * 650) * decay
      );
    }
  });

  // 4. Passive catalog discovery from followers & artist buzz
  const followerActiveListeners = Math.round(
    followers * (0.42 + Math.min(0.45, hype / 180))
  );
  const discoveryFloor = Math.round(popularity * 1200 + hype * 380);

  const rawTargetListeners = Math.max(
    streamDerivedListeners + newReleaseBonus + playlistReachBonus + collabCrossoverBonus,
    followerActiveListeners + collabCrossoverBonus + discoveryFloor
  );

  // Smooth 28-day rolling window inertia
  let nextListeners = rawTargetListeners;
  if (previousListeners > 0) {
    if (rawTargetListeners >= previousListeners) {
      // Surges quickly when new music, playlists, or collabs hit
      nextListeners = Math.round(previousListeners * 0.72 + rawTargetListeners * 0.28);
    } else {
      // Gradual 28-day rolling decay when between eras
      nextListeners = Math.round(previousListeners * 0.91 + rawTargetListeners * 0.09);
    }
  }

  const hardCap = 148_000_000;
  const finalListeners = Math.min(hardCap, Math.max(0, nextListeners));
  const listenerDelta = finalListeners - previousListeners;
  const peakListeners = Math.max(previousPeak || 0, previousListeners, finalListeners);

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
