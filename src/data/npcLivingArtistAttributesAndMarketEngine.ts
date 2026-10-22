// NPC Living Artist Attributes & Unified Market Simulation Engine
// Gives every NPC artist their own living Fans, Popularity, Hype, and Craft Skills
// (Songwriting, Recording/Vocals, Production, Visuals/MV, Fan Engagement) — just like the Player —
// and computes NPC Streaming, Pure Sales, and YouTube MV Views using the exact same rules and balance.

import { REAL_WORLD_NPCS } from './realWorldArtistCatalog';
import { getCountryMarketProfile } from './countryMarketSystem';

export interface NpcSkillProfile {
  songwriting: number;   // 1 - 100
  recording: number;     // 1 - 100
  production: number;    // 1 - 100
  visuals: number;       // 1 - 100 (YouTube MV quality & replay value)
  fanEngagement: number; // 1 - 100 (Pure sales & stanbase mobilization)
  overallMastery: number;
}

export interface NpcLivingAttributes {
  npcId: string;
  npcName: string;
  country: string;
  genre: string;
  tier: number;
  popularity: number;    // 1 - 100 (dynamic)
  hype: number;          // 1 - 100 (dynamic era hype)
  fans: number;          // Dedicated core fanbase count
  skills: NpcSkillProfile;
  streamSynergyMultiplier: number;
  salesSynergyMultiplier: number;
  youtubeViewSynergyMultiplier: number;
}

export interface UnifiedNpcTrackMetrics {
  dailyStreams: number;
  weeklyStreams: number;
  totalStreams: number;
  dailySales: number;
  weeklySales: number;
  totalSales: number;
  dailyViews: number;
  weeklyViews: number;
  totalViews: number;
  radioImpressions: number;
}

const npcLivingAttributesCache = new Map<string, NpcLivingAttributes>();

function hashNpcSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/**
 * Resolves or builds the living attributes (Fans, Popularity, Hype, and Skills)
 * for any NPC artist so they operate under the exact same RPG & market mechanics as the Player.
 */
export function getNpcLivingAttributes(
  npcNameOrId: string,
  dayOfYear: number = 1,
  hasRecentDropWithin14Days: boolean = false
): NpcLivingAttributes {
  const key = (npcNameOrId || '').toLowerCase().trim();
  const npc =
    REAL_WORLD_NPCS.find(
      n => n.id.toLowerCase() === key || n.name.toLowerCase() === key
    ) || REAL_WORLD_NPCS[0];

  const seed = hashNpcSeed(npc.id + '::' + npc.name);
  const basePop = Math.max(30, Math.min(100, Number(npc.pop || 78)));
  const baseHype = Math.max(25, Math.min(100, Number(npc.hype || 72)));
  const tier = npc.tier || (basePop >= 90 ? 1 : basePop >= 78 ? 2 : 3);

  // Dynamic Popularity & Era Hype oscillation across the year
  const wave = Math.sin(((dayOfYear + (seed % 90)) / 45) * Math.PI);
  const dynamicPop = Math.max(
    28,
    Math.min(100, Number((basePop + wave * 2.2 + (hasRecentDropWithin14Days ? 2.5 : 0)).toFixed(1)))
  );
  const dynamicHype = Math.max(
    22,
    Math.min(
      100,
      Number(
        (
          baseHype +
          wave * 4.5 +
          (hasRecentDropWithin14Days ? 14.0 : -2.0)
        ).toFixed(1)
      )
    )
  );

  // Authentic Dedicated Core Fanbase (scales exponentially with Popularity & Stan Culture)
  const genreLower = (npc.genre || '').toLowerCase();
  const stanGenreBonus =
    genreLower.includes('k-pop')
      ? 1.42
      : genreLower.includes('pop') || genreLower.includes('hip-hop') || genreLower.includes('latin')
      ? 1.22
      : 1.05;

  const baseFans = Math.round(
    Math.pow(dynamicPop / 100, 3.4) * 58_000_000 * stanGenreBonus * (0.88 + ((seed % 25) / 100))
  );
  const fans = Math.max(45_000, baseFans);

  // Craft Skills (1-100 scale, mirroring Player's Mastery Academy)
  const skillBase = Math.max(48, Math.min(96, Math.round(basePop * 0.92)));
  const songwriting = Math.min(99, Math.max(45, skillBase + ((seed % 15) - 6)));
  const recording = Math.min(99, Math.max(45, skillBase + (((seed >> 4) % 15) - 6)));
  const production = Math.min(99, Math.max(45, skillBase + (((seed >> 8) % 15) - 5)));
  const visuals = Math.min(99, Math.max(45, skillBase + (((seed >> 12) % 17) - 5)));
  const fanEngagement = Math.min(99, Math.max(45, skillBase + (((seed >> 16) % 17) - 5)));
  const overallMastery = Math.round((songwriting + recording + production + visuals + fanEngagement) / 5);

  // Skill Market Synergies (matching Player's skillMarketSynergyEngine)
  const streamSynergyMultiplier = Number(
    (0.88 + (overallMastery / 100) * 0.34 + (fans / 60_000_000) * 0.18).toFixed(3)
  );
  const salesSynergyMultiplier = Number(
    (0.85 + (fanEngagement / 100) * 0.45 + (fans / 50_000_000) * 0.35).toFixed(3)
  );
  const youtubeViewSynergyMultiplier = Number(
    (0.90 + (visuals / 100) * 0.38 + (dynamicHype / 100) * 0.22).toFixed(3)
  );

  const result: NpcLivingAttributes = {
    npcId: npc.id,
    npcName: npc.name,
    country: npc.country || 'US',
    genre: npc.genre || 'Pop',
    tier,
    popularity: dynamicPop,
    hype: dynamicHype,
    fans,
    skills: {
      songwriting,
      recording,
      production,
      visuals,
      fanEngagement,
      overallMastery
    },
    streamSynergyMultiplier,
    salesSynergyMultiplier,
    youtubeViewSynergyMultiplier
  };

  npcLivingAttributesCache.set(key, result);
  return result;
}

/**
 * Unified Daily & Weekly YouTube View Velocity Calculator used for BOTH Player and NPCs
 * so YouTube views are always fair, realistic, and proportional to audio streams, popularity,
 * hype, fanbase size, visual skill, and release-week premiere momentum.
 */
export function calculateUnifiedYoutubeViewsFromStreams(params: {
  dailyStreams: number;
  weeklyStreams?: number;
  artistCountry: string;
  artistPopularity: number;
  artistHype: number;
  artistFans: number;
  visualSkillLevel?: number; // 1 - 100
  daysSinceRelease: number;
  hasVEVO?: boolean;
  hasAdCampaign?: boolean;
  uniqueSeed?: number;
}): {
  dailyViews: number;
  weeklyViews: number;
  viewToStreamRatio: number;
} {
  const {
    dailyStreams,
    weeklyStreams = dailyStreams * 7,
    artistCountry,
    artistPopularity,
    artistHype,
    artistFans,
    visualSkillLevel = 75,
    daysSinceRelease,
    hasVEVO = true,
    hasAdCampaign = false,
    uniqueSeed = 50
  } = params;

  if (dailyStreams <= 0) {
    return { dailyViews: 0, weeklyViews: 0, viewToStreamRatio: 0 };
  }

  const profile = getCountryMarketProfile(artistCountry || 'US');
  // Clamp territory propensity so no single country explodes views unnaturally
  const territoryVideoFactor = Math.max(0.78, Math.min(1.28, profile.youtubeShare / 0.30));

  // Base ratio of YouTube MV views to Spotify/Audio streams on a normal catalog day (~52% to 72%)
  const popBoost = (Math.max(10, Math.min(100, artistPopularity)) / 100) * 0.16;
  const hypeBoost = (Math.max(10, Math.min(100, artistHype)) / 100) * 0.14;
  const visualBoost = (Math.max(20, Math.min(100, visualSkillLevel)) / 100) * 0.15;
  const fanBoost = Math.min(0.14, (artistFans / 60_000_000) * 0.14);

  const baseRatio = 0.42 + popBoost + hypeBoost + visualBoost + fanBoost;

  // Premiere Week Surge (applies identically to Player AND NPCs!)
  // Day 0-1: MV Premiere rush (~1.35x - 1.55x of base ratio, yielding ~85% - 125% of daily streams)
  // Day 2-3: Trending tab hold (~1.18x)
  // Day 4-7: First week momentum (~1.08x)
  // Day 8+: Normal organic visual catalog velocity
  let premiereMultiplier = 1.0;
  if (daysSinceRelease <= 0) {
    premiereMultiplier = 1.48;
  } else if (daysSinceRelease === 1) {
    premiereMultiplier = 1.32;
  } else if (daysSinceRelease <= 3) {
    premiereMultiplier = 1.18;
  } else if (daysSinceRelease <= 7) {
    premiereMultiplier = 1.08;
  } else if (daysSinceRelease <= 21) {
    premiereMultiplier = 0.96;
  } else {
    premiereMultiplier = 0.86;
  }

  const vevoMult = hasVEVO ? 1.06 : 0.96;
  const adMult = hasAdCampaign ? 1.14 : 1.0;
  const seedVariance = 0.92 + ((uniqueSeed % 19) / 100); // 0.92 to 1.10

  const finalDailyRatio = Math.min(
    1.45,
    baseRatio * territoryVideoFactor * premiereMultiplier * vevoMult * adMult * seedVariance
  );

  // Weekly ratio averages out the premiere spike across 7 days
  const weeklyPremiereMult =
    daysSinceRelease <= 7
      ? Math.min(1.22, premiereMultiplier * 0.92)
      : premiereMultiplier;
  const finalWeeklyRatio = Math.min(
    1.30,
    baseRatio * territoryVideoFactor * weeklyPremiereMult * vevoMult * adMult * seedVariance
  );

  const dailyViews = Math.max(100, Math.round(dailyStreams * finalDailyRatio));
  const weeklyViews = Math.max(dailyViews, Math.round(weeklyStreams * finalWeeklyRatio));

  return {
    dailyViews,
    weeklyViews,
    viewToStreamRatio: Number(finalDailyRatio.toFixed(3))
  };
}
