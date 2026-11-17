// Realistic Territorial Reach Tiers & Global-vs-Domestic Volume Calibration Engine
// Ensures that not every Roster Artist or Player release automatically succeeds worldwide:
// 1. Classifies releases into 4 dynamic territorial tiers:
//    - 'domestic_only'    (Domestic Powerhouse: strong #1-Top 10 home chart potential, modest global totals, cold abroad)
//    - 'regional_cluster' (Regional Wave: strong in Home Country + Home Continent, quiet in distant regions)
//    - 'pocket_markets'   (Pocket Market Breakout: hits in Home Country + 2-4 viral/collab foreign markets)
//    - 'global_crossover' (Global Crossover: multi-continent reach earned via high pop/hype, foreign collabs, international shows, priority region push, or rare viral chemistry)
// 2. Provides independent SkillState for Roster Artists so newly signed local acts do not inherit the Player CEO's maxed-out skills.
// 3. Calibrates Global vs. Country Streams, Pure Sales, and YouTube Views so domestic stars can top their national chart without inflated global numbers.

import { Song } from '../types';
import { COUNTRY_TIERS } from '../constants';
import { getCountryMarketProfile, RegionGroup } from './countryMarketSystem';
import { REAL_WORLD_NPCS } from './realWorldArtistCatalog';
import { evaluateSongPublicChemistry, PublicChemistryTier } from './publicChemistryLongevityEngine';
import { getEnsuredSkillState } from './skillSystemEngine';

export type MarketReachScopeTier =
  | 'domestic_only'
  | 'regional_cluster'
  | 'pocket_markets'
  | 'global_crossover';

export interface ReleaseTerritorialReachProfile {
  reachTier: MarketReachScopeTier;
  reachLabel: string;
  reachTierLabel: string;
  reachDescription: string;
  reachSummary: string;
  footprintVolumeScale: number;          // 0.24 - 1.08: scales total global streams, sales, and views
  homeCountryConcentrationShare: number; // 0.26 - 0.78: share of global volume concentrated in Home Country
  homeChartCompetitivenessBoost: number; // 1.05 - 1.65: helps domestic hits compete for #1-Top 10 at home
  foreignColdMarketDampener: number;     // 0.05 - 0.35: suppresses unexpanded foreign markets for non-global acts
  foreignCatalystCountries: string[];    // Foreign countries unlocked by collab, priority region, or high show penetration
  activeRegions: RegionGroup[];
  chemistryTier: PublicChemistryTier;
}

function deterministicReachHash(songId: number | string, title: string, salt: string): number {
  const str = `${songId}_${title || 'track'}_${salt}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Builds an independent SkillState for a Signed Roster Artist based on their own
 * vocalSkill, stagePresence, potential, and popularity so they never inherit the Player's
 * maxed-out global skill multipliers during daily market simulation.
 */
export function buildRosterArtistIndependentSkillState(artist: {
  id?: string;
  vocalSkill?: number;
  stagePresence?: number;
  potential?: number;
  popularity?: number;
}): ReturnType<typeof getEnsuredSkillState> {
  const vocal = Math.max(35, Math.min(99, Number(artist.vocalSkill) || 64));
  const stage = Math.max(35, Math.min(99, Number(artist.stagePresence) || 62));
  const pot = Math.max(45, Math.min(99, Number(artist.potential) || 72));
  const pop = Math.max(10, Math.min(99, Number(artist.popularity) || 32));

  // Map 0-100 roster attributes onto the 1-10 skill level scale realistically
  const songLevel = Math.max(1, Math.min(10, Math.round((vocal * 0.45 + pot * 0.35 + pop * 0.20) / 10.5)));
  const recLevel = Math.max(1, Math.min(10, Math.round((vocal * 0.60 + stage * 0.25 + pop * 0.15) / 10.5)));
  const prodLevel = Math.max(1, Math.min(10, Math.round((pot * 0.50 + vocal * 0.25 + pop * 0.25) / 10.5)));

  const base = getEnsuredSkillState(undefined);
  const scaleSubSkills = <T extends Record<string, any>>(group: T, targetLevel: number): T => {
    const out: Record<string, any> = { ...group };
    Object.keys(group).forEach((key) => {
      if (group[key] && typeof group[key] === 'object') {
        out[key] = {
          ...group[key],
          level: targetLevel,
          xp: 0,
        };
      }
    });
    return out as T;
  };

  return {
    ...base,
    songwriting: scaleSubSkills(base.songwriting, songLevel),
    recording: scaleSubSkills(base.recording, recLevel),
    production: scaleSubSkills(base.production, prodLevel),
  };
}

/**
 * Evaluates a song's realistic Territorial Reach Tier and Global Footprint Scale.
 * Incorporates:
 * - Artist Popularity & Hype
 * - Foreign Collaborator (`song.collabId`)
 * - Priority Region Targeting (`song.priorityRegion`)
 * - International Show Country Penetration (`countryExpansionMap`)
 * - Song Quality & Public Chemistry (`mega_hit`, `sleeper_hit`, `solid_hit`, `normal`, `underperform`, `front_loaded_flop`)
 */
export function evaluateReleaseTerritorialReachProfile(params: {
  song: Song;
  artistCountry?: string;
  artistPopularity?: number;
  artistHype?: number;
  countryExpansionMap?: Record<string, number>;
  completedInternationalShowsCount?: number;
  completedShowsCount?: number;
  hasLabelMarketingPush?: boolean;
  potential?: number;
}): ReleaseTerritorialReachProfile {
  const {
    song,
    artistCountry = 'US',
    artistPopularity = 30,
    artistHype = 35,
    countryExpansionMap,
    completedInternationalShowsCount,
    completedShowsCount,
    hasLabelMarketingPush = false,
  } = params;
  const effectiveShowsCount = completedInternationalShowsCount ?? completedShowsCount ?? 0;

  const homeCode = (artistCountry || 'US').toUpperCase();
  const homeProfile = getCountryMarketProfile(homeCode);
  const homeRegion = homeProfile.regionGroup;
  const pop = Math.max(5, Math.min(100, Number(artistPopularity) || 28));
  const hype = Math.max(5, Math.min(100, Number(artistHype) || 32));
  const quality = Math.max(40, Math.min(100, Number(song?.quality) || 68));
  const isSingle = song?.trackType !== 'b_side';
  const daysOut = Math.max(0, Number(song?.daysSinceRelease) || 0);

  const chemistry = evaluateSongPublicChemistry({
    song,
    daysSinceRelease: daysOut,
    isSingle,
  });

  const seed = deterministicReachHash(song?.id || 1, song?.title || 'Track', homeCode);
  const roll = seed % 100;

  // 1. Identify International Crossover Catalysts
  const foreignCatalystCountries: string[] = [];
  let hasForeignCollab = false;
  let collabRegion: RegionGroup | null = null;

  if (song?.collabId && song.collabId !== 'none') {
    const collabNpc = REAL_WORLD_NPCS.find(
      n =>
        n.id.toLowerCase() === String(song.collabId).toLowerCase() ||
        n.name.toLowerCase() === String(song.collabId).toLowerCase()
    );
    const collabCountry = (collabNpc?.country || 'US').toUpperCase();
    hasForeignCollab = collabCountry !== homeCode || (collabNpc?.pop || 80) >= 82;
    if (collabCountry && collabCountry !== homeCode) {
      foreignCatalystCountries.push(collabCountry);
      collabRegion = getCountryMarketProfile(collabCountry).regionGroup;
    }
  }

  const priorityRegion: RegionGroup | null =
    song?.priorityRegion && song.priorityRegion !== 'auto'
      ? (song.priorityRegion as RegionGroup)
      : null;
  const hasForeignPriorityRegion = Boolean(priorityRegion && priorityRegion !== homeRegion);

  // Check International Shows / Country Penetration map for foreign markets with >= 42% penetration
  let highPenetrationForeignCount = 0;
  if (countryExpansionMap && typeof countryExpansionMap === 'object') {
    Object.entries(countryExpansionMap).forEach(([cc, val]) => {
      const cleanCc = cc.toUpperCase();
      if (cleanCc !== homeCode && Number(val) >= 42) {
        highPenetrationForeignCount++;
        if (!foreignCatalystCountries.includes(cleanCc)) {
          foreignCatalystCountries.push(cleanCc);
        }
      }
    });
  }

  // If priorityRegion is set, include 2 top countries from that priority region as catalyst markets
  if (priorityRegion) {
    const regionCountries = Object.keys(COUNTRY_TIERS).filter(
      cc => cc !== homeCode && getCountryMarketProfile(cc).regionGroup === priorityRegion
    );
    for (let i = 0; i < Math.min(2, regionCountries.length); i++) {
      const pick = regionCountries[(seed + i * 17) % regionCountries.length];
      if (pick && !foreignCatalystCountries.includes(pick)) {
        foreignCatalystCountries.push(pick);
      }
    }
  }

  const hasGlobalPlaylist = Boolean(
    Array.isArray(song?.playlistPlacements) &&
      song.playlistPlacements.some(p => p === 'tth' || p === 'v50')
  );

  // Compute an International Crossover Readiness Score (0 - 100)
  let crossoverScore = pop * 0.48 + (hype - 25) * 0.18 + Math.max(0, quality - 65) * 0.45;
  if (hasForeignCollab) crossoverScore += 18;
  if (hasForeignPriorityRegion) crossoverScore += 12;
  if (highPenetrationForeignCount > 0) {
    crossoverScore += Math.min(22, highPenetrationForeignCount * 6 + effectiveShowsCount * 2.5);
  }
  const songPromoBudget = Number((song as any)?.promoBudget || (song as any)?.marketingBudget || 0);
  if (hasLabelMarketingPush || songPromoBudget > 0) {
    crossoverScore += 9;
  }
  if (hasGlobalPlaylist) {
    crossoverScore += 14;
  }

  // Adjust by Public Chemistry Tier (flops stay local; viral sleeper/mega hits can cross borders)
  if (chemistry.tier === 'front_loaded_flop') {
    crossoverScore -= 26;
  } else if (chemistry.tier === 'underperform') {
    crossoverScore -= 16;
  } else if (chemistry.tier === 'sleeper_hit') {
    crossoverScore += 15;
  } else if (chemistry.tier === 'mega_hit') {
    crossoverScore += 28;
  }

  // Album B-sides naturally stay much closer to the core fanbase than promoted singles
  if (!isSingle) {
    crossoverScore -= 18;
  }

  // Deterministic variance (-8 to +8) so even the same artist can have one release go global and the next stay domestic/regional
  const songVariance = (roll % 17) - 8;
  const finalCrossoverScore = crossoverScore + songVariance;

  // 2. Assign MarketReachScopeTier
  let reachTier: MarketReachScopeTier;
  if (
    finalCrossoverScore >= 74 ||
    (chemistry.tier === 'mega_hit' && pop >= 52) ||
    (pop >= 82 && quality >= 78 && chemistry.tier !== 'front_loaded_flop' && chemistry.tier !== 'underperform')
  ) {
    reachTier = 'global_crossover';
  } else if (
    finalCrossoverScore >= 54 ||
    hasForeignCollab ||
    hasForeignPriorityRegion ||
    highPenetrationForeignCount >= 2 ||
    (chemistry.tier === 'sleeper_hit' && roll < 65)
  ) {
    // Split between Pocket Markets (specific foreign countries) and Regional Cluster (home continent wave)
    reachTier =
      hasForeignCollab || hasForeignPriorityRegion || highPenetrationForeignCount >= 2 || roll % 2 === 0
        ? 'pocket_markets'
        : 'regional_cluster';
  } else if (finalCrossoverScore >= 38 || (pop >= 45 && roll < 50)) {
    reachTier = 'regional_cluster';
  } else {
    reachTier = 'domestic_only';
  }

  // 3. Configure Footprint Volume Scale, Home Concentration & Foreign Gating per Tier
  const isMajorHomeMarket = ['US', 'JP', 'GB', 'DE', 'KR', 'BR', 'MX', 'FR', 'ID', 'IN'].includes(homeCode);

  let reachLabel = 'Domestic Powerhouse';
  let reachDescription = `Concentrated fanbase in ${homeProfile.name}; modest international footprint.`;
  let footprintVolumeScale = 0.30;
  let homeCountryConcentrationShare = 0.68;
  let homeChartCompetitivenessBoost = 1.48;
  let foreignColdMarketDampener = 0.08;
  let activeRegions: RegionGroup[] = [homeRegion];

  switch (reachTier) {
    case 'domestic_only': {
      reachLabel = 'Domestic Powerhouse';
      reachDescription = `Charting primarily in ${homeProfile.name} with loyal local support and minimal overseas reach.`;
      // Modest global volume (24% - 38% of full global ceiling), while concentrating 62% - 78% in Home Country!
      footprintVolumeScale = (isMajorHomeMarket ? 0.32 : 0.25) + (seed % 7) * 0.01;
      homeCountryConcentrationShare = homeCode === 'US' ? 0.76 : isMajorHomeMarket ? 0.68 : 0.62;
      homeChartCompetitivenessBoost = 1.52;
      foreignColdMarketDampener = 0.07;
      activeRegions = [homeRegion];
      break;
    }
    case 'regional_cluster': {
      reachLabel = `${homeRegion} Regional Wave`;
      reachDescription = `Strong momentum in ${homeProfile.name} and neighboring ${homeRegion} markets, quiet in distant continents.`;
      footprintVolumeScale = 0.46 + (seed % 11) * 0.01; // 0.46 - 0.56
      homeCountryConcentrationShare = homeCode === 'US' ? 0.54 : 0.44;
      homeChartCompetitivenessBoost = 1.34;
      foreignColdMarketDampener = 0.14;
      activeRegions = [homeRegion];
      if (priorityRegion && !activeRegions.includes(priorityRegion)) {
        activeRegions.push(priorityRegion);
      }
      break;
    }
    case 'pocket_markets': {
      reachLabel = 'Pocket Market Breakout';
      reachDescription = `Surging in ${homeProfile.name} and ${Math.max(2, foreignCatalystCountries.length)} selective overseas territories.`;
      footprintVolumeScale = 0.58 + (seed % 15) * 0.01; // 0.58 - 0.72
      homeCountryConcentrationShare = homeCode === 'US' ? 0.46 : 0.36;
      homeChartCompetitivenessBoost = 1.24;
      foreignColdMarketDampener = 0.16;
      activeRegions = [homeRegion];
      if (collabRegion && !activeRegions.includes(collabRegion)) activeRegions.push(collabRegion);
      if (priorityRegion && !activeRegions.includes(priorityRegion)) activeRegions.push(priorityRegion);
      break;
    }
    case 'global_crossover': {
      reachLabel = 'Global Crossover Hit';
      reachDescription = `Broad multi-continent streaming, sales, and video velocity across global charts.`;
      footprintVolumeScale = 0.88 + Math.min(0.18, (pop - 55) * 0.004); // 0.88 - 1.06
      homeCountryConcentrationShare = homeCode === 'US' ? 0.36 : 0.26;
      homeChartCompetitivenessBoost = 1.12;
      foreignColdMarketDampener = 0.32;
      activeRegions = [
        'North America',
        'Europe',
        'East Asia',
        'Southeast Asia',
        'Latin America',
        'Oceania',
      ];
      break;
    }
  }

  return {
    reachTier,
    reachLabel,
    reachTierLabel: reachLabel,
    reachDescription,
    reachSummary: reachDescription,
    footprintVolumeScale: Number(footprintVolumeScale.toFixed(3)),
    homeCountryConcentrationShare: Number(homeCountryConcentrationShare.toFixed(3)),
    homeChartCompetitivenessBoost: Number(homeChartCompetitivenessBoost.toFixed(3)),
    foreignColdMarketDampener: Number(foreignColdMarketDampener.toFixed(3)),
    foreignCatalystCountries,
    activeRegions,
    chemistryTier: chemistry.tier,
  };
}

/**
 * Calibrates country-specific pure sales and YouTube video propensity multipliers
 * so artists from physical/digital buying strongholds (JP, KR, US, DE, GB) or
 * high-video-velocity regions (ID, BR, MX, PH, TH, IN, KR) reflect authentic market behavior.
 */
export function getOriginMarketSalesAndViewsMultipliers(
  homeCountryCode: string,
  reachTier: MarketReachScopeTier
): {
  pureSalesMultiplier: number;
  videoViewsMultiplier: number;
  youtubeViewsMultiplier: number;
} {
  const cc = (homeCountryCode || 'US').toUpperCase();
  const profile = getCountryMarketProfile(cc);

  // Sales culture: JP, KR, US, DE, GB have strong pure purchase habits
  let pureSalesMultiplier = Math.max(0.75, Math.min(1.55, profile.salesShare / 0.045));
  if (['JP', 'KR'].includes(cc)) {
    pureSalesMultiplier = Math.max(pureSalesMultiplier, 1.38);
  } else if (['US', 'GB', 'DE', 'AU', 'CA'].includes(cc)) {
    pureSalesMultiplier = Math.max(pureSalesMultiplier, 1.15);
  }

  // Video culture: Southeast Asia, Latin America, South Asia, Korea have high YouTube music video engagement
  let videoViewsMultiplier = Math.max(0.78, Math.min(1.42, profile.youtubeShare / 0.28));
  if (['ID', 'PH', 'TH', 'VN', 'BR', 'MX', 'IN', 'KR'].includes(cc)) {
    videoViewsMultiplier = Math.max(videoViewsMultiplier, 1.18);
  }

  // Domestic-only releases have slightly higher per-stream fan purchase loyalty at home,
  // but their overall global volume is already bounded by footprintVolumeScale.
  if (reachTier === 'domestic_only') {
    pureSalesMultiplier *= 1.08;
    videoViewsMultiplier *= 0.94;
  }

  const roundedViewsMult = Number(videoViewsMultiplier.toFixed(3));
  return {
    pureSalesMultiplier: Number(pureSalesMultiplier.toFixed(3)),
    videoViewsMultiplier: roundedViewsMult,
    youtubeViewsMultiplier: roundedViewsMult,
  };
}
