// Selective Regional & Country Breakout Engine
// Simulates authentic real-world territorial music consumption where:
// 1. A song can smash in specific countries or regions (e.g. US + select European markets)
//    without automatically being a hit in Asia, Latin America, or every country at once.
// 2. Genre & cultural alignment shape which continents/countries embrace a track.
// 3. The artist's Home Country always contributes meaningfully as a core pillar,
//    without monopolizing the artist's entire global market share.

import { Song } from '../types';
import { COUNTRY_TIERS } from '../constants';
import { getCountryMarketProfile, RegionGroup } from './countryMarketSystem';
import { REAL_WORLD_NPCS } from './realWorldArtistCatalog';

export type RegionalBreakoutArchetype =
  | 'western_transatlantic'      // Strong in US/CA + select Europe/Oceania, quiet in Asia
  | 'euro_oceania_wave'          // Strong across European markets + Australia/UK, moderate US, low Asia
  | 'asian_pacific_phenomenon'   // Strong in East/Southeast Asia + Oceania, quiet in Europe/LatAm
  | 'americas_crossover'         // Strong in North America + Latin America + Spain, quiet in Asia/East EU
  | 'selective_multi_country'    // Hits in Home Country + 3-5 specific breakout countries across the map
  | 'dual_market_viral'          // Massive in Home Country + 1-2 surprise viral foreign markets
  | 'pan_global_hit';            // Broad multi-continent smash, still with country-by-country variation

export interface SongRegionalBreakoutProfile {
  archetype: RegionalBreakoutArchetype;
  archetypeLabel: string;
  archetypeSummary: string;
  primaryRegions: RegionGroup[];
  secondaryRegions: RegionGroup[];
  breakoutCountries: string[];   // Specific countries where this song caught fire (1.35x - 2.10x)
  coldCountries: string[];       // Countries where the song failed to connect (0.14x - 0.32x)
  countryMultipliers: Record<string, number>;
  homeMarketWeightMultiplier: number;
}

const breakoutProfileCache = new Map<string, SongRegionalBreakoutProfile>();

function deterministicSongHash(songId: number, title: string, salt: string): number {
  const str = `${songId}_${title || 'untitled'}_${salt}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Calculates natural genre-to-country cultural resonance (0.22 to 1.45).
 * For example, US Hip-Hop/Country resonates strongly in US/CA/GB/AU and select EU countries,
 * but has much lower organic pull in Indonesia, Japan, or Korea unless it's a viral crossover.
 */
export function getGenreTerritoryResonance(
  genre: string,
  subgenre: string,
  countryCode: string,
  regionGroup: RegionGroup
): number {
  const g = `${genre || ''} ${subgenre || ''}`.toLowerCase();
  const cc = (countryCode || 'US').toUpperCase();

  // Hip-Hop / Trap / Rap / Drill / Country
  if (g.includes('hip-hop') || g.includes('rap') || g.includes('trap') || g.includes('drill') || g.includes('country')) {
    if (g.includes('country')) {
      if (['US', 'CA', 'AU', 'IE', 'GB'].includes(cc)) return 1.45;
      if (regionGroup === 'Europe') return 0.55;
      return 0.22;
    }
    if (['US', 'CA', 'GB', 'FR', 'DE', 'NL', 'AU', 'ZA', 'NG'].includes(cc)) return 1.35;
    if (regionGroup === 'Europe' || regionGroup === 'Latin America') return 0.85;
    if (regionGroup === 'East Asia' || regionGroup === 'Southeast Asia' || regionGroup === 'South Asia') {
      return ['KR', 'JP', 'PH'].includes(cc) ? 0.48 : 0.26;
    }
    return 0.65;
  }

  // Electronic / Dance / EDM / House / Hyperpop / Disco
  if (g.includes('electronic') || g.includes('dance') || g.includes('edm') || g.includes('house') || g.includes('hyperpop') || g.includes('disco')) {
    if (regionGroup === 'Europe' || ['GB', 'DE', 'FR', 'NL', 'SE', 'BE', 'ES', 'IT', 'PL', 'AU'].includes(cc)) return 1.42;
    if (['US', 'CA', 'BR', 'MX'].includes(cc)) return 1.05;
    if (regionGroup === 'East Asia' || regionGroup === 'Southeast Asia') return 0.52;
    return 0.75;
  }

  // R&B / Soul / Acoustic / Ballad
  if (g.includes('r&b') || g.includes('soul') || g.includes('ballad') || g.includes('acoustic')) {
    if (['US', 'CA', 'GB', 'ID', 'PH', 'MY', 'KR', 'JP', 'AU', 'ZA'].includes(cc)) return 1.32;
    if (regionGroup === 'Southeast Asia' || regionGroup === 'North America') return 1.25;
    if (regionGroup === 'Europe') return 0.72;
    if (regionGroup === 'Latin America') return 0.62;
    return 0.75;
  }

  // Rock / Indie / Alternative / Pop Rock / Punk
  if (g.includes('rock') || g.includes('indie') || g.includes('alt') || g.includes('punk') || g.includes('metal')) {
    if (['GB', 'US', 'CA', 'AU', 'DE', 'JP', 'ID', 'BR', 'AR', 'MX', 'IT', 'ES', 'PL'].includes(cc)) return 1.30;
    if (regionGroup === 'Europe' || regionGroup === 'North America' || regionGroup === 'Oceania') return 1.18;
    return 0.68;
  }

  // K-Pop / J-Pop / Asian Pop
  if (g.includes('k-pop') || g.includes('j-pop') || g.includes('asian') || g.includes('city pop')) {
    if (regionGroup === 'East Asia' || regionGroup === 'Southeast Asia') return 1.48;
    if (['US', 'BR', 'MX', 'PE', 'CL', 'CA', 'AU'].includes(cc)) return 0.92;
    if (regionGroup === 'Europe') return 0.42;
    return 0.55;
  }

  // Latin / Reggaeton / Urbano
  if (g.includes('latin') || g.includes('reggaeton') || g.includes('urbano') || g.includes('salsa') || g.includes('bachata')) {
    if (regionGroup === 'Latin America' || ['ES', 'PT', 'US'].includes(cc)) return 1.48;
    if (['IT', 'FR', 'CH'].includes(cc)) return 1.08;
    if (regionGroup === 'East Asia' || regionGroup === 'Southeast Asia') return 0.24;
    return 0.45;
  }

  // Afrobeats / Afro
  if (g.includes('afro') || g.includes('amapiano')) {
    if (regionGroup === 'Africa' || ['GB', 'FR', 'NL', 'US', 'CA', 'BE'].includes(cc)) return 1.42;
    if (regionGroup === 'Europe') return 0.92;
    if (regionGroup === 'East Asia' || regionGroup === 'Southeast Asia') return 0.28;
    return 0.55;
  }

  // Mainstream Pop (Still has regional preferences depending on sub-flavor)
  if (regionGroup === 'North America' || regionGroup === 'Europe' || regionGroup === 'Oceania') return 1.15;
  if (regionGroup === 'Southeast Asia' || regionGroup === 'Latin America' || regionGroup === 'East Asia') return 1.02;
  return 0.90;
}

/**
 * Builds a deterministic, realistic regional breakout profile for a song.
 * Ensures that each song has its own unique international story:
 * some songs hit in the US & parts of Europe while missing Asia;
 * some hit in Southeast/East Asia & Oceania; some break out in 3-5 specific countries;
 * and home market contributes solidly without swallowing the entire global pie.
 */
export function evaluateSongRegionalBreakoutProfile(
  song: Song,
  artistCountry: string = 'US',
  artistPopularity: number = 25,
  artistHype: number = 25
): SongRegionalBreakoutProfile {
  const homeCode = (artistCountry || 'US').toUpperCase();
  const quality = song?.quality || 65;
  const hasGlobalPlaylist = Boolean(
    song?.playlistPlacements && song.playlistPlacements.some(p => p === 'tth' || p === 'v50')
  );

  const priorityReg =
    song?.priorityRegion && song.priorityRegion !== 'auto'
      ? (song.priorityRegion as RegionGroup)
      : null;

  const cacheKey = `${song?.id || 0}_${song?.title || ''}_${song?.genre || ''}_${song?.collabId || ''}_${priorityReg || 'auto'}_${homeCode}_${Math.round(artistPopularity / 5)}_${hasGlobalPlaylist ? 1 : 0}`;
  const cached = breakoutProfileCache.get(cacheKey);
  if (cached) return cached;
  if (breakoutProfileCache.size > 400) breakoutProfileCache.clear();

  const homeProfile = getCountryMarketProfile(homeCode);
  const homeRegion = homeProfile.regionGroup;
  const seed = deterministicSongHash(song?.id || 1, song?.title || 'Track', homeCode);

  // Check if song has a featured collaborator from a specific country
  let collabCountry: string | null = null;
  let collabRegion: RegionGroup | null = null;
  if (song?.collabId) {
    const collabNpc = REAL_WORLD_NPCS.find(
      n => n.id === song.collabId || n.name.toLowerCase() === String(song.collabId).toLowerCase()
    );
    if (collabNpc && collabNpc.country) {
      collabCountry = collabNpc.country.toUpperCase();
      collabRegion = getCountryMarketProfile(collabCountry).regionGroup;
    }
  }

  // Choose archetype based on artist origin, genre, quality, popularity, and song seed
  const roll = seed % 100;
  let archetype: RegionalBreakoutArchetype;

  const isMassiveGlobalCandidate =
    (artistPopularity >= 78 && quality >= 85 && hasGlobalPlaylist) ||
    (artistPopularity >= 85 && quality >= 82) ||
    (song?.streams || 0) >= 65_000_000;

  if (isMassiveGlobalCandidate && roll < 45) {
    archetype = 'pan_global_hit';
  } else if (homeRegion === 'North America' || homeRegion === 'Europe' || homeRegion === 'Oceania') {
    if (roll < 30) {
      archetype = 'western_transatlantic'; // Hits US/CA + select EU/AU, quiet in Asia/ID
    } else if (roll < 52) {
      archetype = 'euro_oceania_wave';     // Huge in Europe + AU + UK, moderate US, quiet in Asia
    } else if (roll < 70) {
      archetype = 'americas_crossover';    // Strong US/CA + LatAm/Spain, quiet in Asia
    } else if (roll < 88) {
      archetype = 'selective_multi_country';
    } else {
      archetype = 'dual_market_viral';
    }
  } else if (homeRegion === 'Southeast Asia' || homeRegion === 'East Asia' || homeRegion === 'South Asia') {
    if (roll < 34) {
      archetype = 'asian_pacific_phenomenon'; // Huge across Asia + AU, quiet in EU
    } else if (roll < 58) {
      archetype = 'selective_multi_country';  // Hits Home + select Western & Asian countries
    } else if (roll < 78) {
      archetype = 'western_transatlantic';    // Crossover into US/UK/EU + Home Country!
    } else {
      archetype = 'dual_market_viral';
    }
  } else {
    // Latin America, Africa, Middle East
    if (roll < 35) {
      archetype = 'americas_crossover';
    } else if (roll < 62) {
      archetype = 'selective_multi_country';
    } else if (roll < 82) {
      archetype = 'euro_oceania_wave';
    } else {
      archetype = 'dual_market_viral';
    }
  }

  let primaryRegions: RegionGroup[] = [homeRegion];
  let secondaryRegions: RegionGroup[] = [];
  let archetypeLabel = 'Selective Regional Hit';
  let archetypeSummary = 'Strong performance in core and select international markets.';

  switch (archetype) {
    case 'western_transatlantic':
      primaryRegions = ['North America', 'Europe', 'Oceania'];
      secondaryRegions = ['Latin America'];
      archetypeLabel = 'Western & European Crossover';
      archetypeSummary = 'Charting strongly in North America, select European territories & Oceania, with limited traction in Asia.';
      break;
    case 'euro_oceania_wave':
      primaryRegions = ['Europe', 'Oceania'];
      secondaryRegions = ['North America', 'Latin America'];
      archetypeLabel = 'European & Oceanic Wave';
      archetypeSummary = 'Breaking out across UK, Continental Europe & Australia, with selective crossover elsewhere.';
      break;
    case 'asian_pacific_phenomenon':
      primaryRegions = ['East Asia', 'Southeast Asia', 'Oceania'];
      secondaryRegions = ['North America', 'South Asia'];
      archetypeLabel = 'Asia-Pacific Breakout';
      archetypeSummary = 'Surging in East & Southeast Asia and Oceania, while remaining niche in Europe.';
      break;
    case 'americas_crossover':
      primaryRegions = ['North America', 'Latin America'];
      secondaryRegions = ['Europe'];
      archetypeLabel = 'Pan-Americas Crossover';
      archetypeSummary = 'Strong resonance across the US, Canada, Latin America & Iberia, with low Asian presence.';
      break;
    case 'selective_multi_country':
      primaryRegions = [homeRegion];
      secondaryRegions = ['North America', 'Europe', 'East Asia', 'Southeast Asia', 'Latin America'].filter(
        r => r !== homeRegion
      ) as RegionGroup[];
      archetypeLabel = 'Multi-Territory Selective Hit';
      archetypeSummary = 'Spiking in specific international pockets while bypassing other major markets.';
      break;
    case 'dual_market_viral':
      primaryRegions = [homeRegion];
      secondaryRegions = [collabRegion || 'North America'];
      archetypeLabel = 'Targeted Viral Breakout';
      archetypeSummary = 'Concentrated surge in home market and 2-3 viral overseas territories.';
      break;
    case 'pan_global_hit':
      primaryRegions = ['North America', 'Europe', 'East Asia', 'Southeast Asia', 'Latin America', 'Oceania'];
      secondaryRegions = ['South Asia', 'Africa', 'Middle East'];
      archetypeLabel = 'Worldwide Multi-Region Smash';
      archetypeSummary = 'Broad international reach with distinct country-by-country chart peaks.';
      break;
  }

  if (collabRegion && !primaryRegions.includes(collabRegion)) {
    primaryRegions.push(collabRegion);
  }
  if (priorityReg && !primaryRegions.includes(priorityReg)) {
    primaryRegions.unshift(priorityReg);
  }

  const allCountries = Object.keys(COUNTRY_TIERS);
  const breakoutCountries: string[] = [homeCode];
  if (collabCountry && collabCountry !== homeCode) {
    breakoutCountries.push(collabCountry);
  }
  const coldCountries: string[] = [];
  const countryMultipliers: Record<string, number> = {};

  // Pick 3 to 6 specific foreign "Hot Breakout Countries" for this song where it specifically clicks
  const foreignPool = allCountries.filter(c => c !== homeCode);
  const numHotCountries =
    archetype === 'dual_market_viral'
      ? 2
      : archetype === 'selective_multi_country'
      ? 4
      : archetype === 'pan_global_hit'
      ? 6
      : 4;

  // Prefer countries in primaryRegions when picking hot breakout countries
  const alignedForeign = foreignPool.filter(cc =>
    primaryRegions.includes(getCountryMarketProfile(cc).regionGroup)
  );
  const candidateHotPool = alignedForeign.length >= numHotCountries ? alignedForeign : foreignPool;

  for (let i = 0; i < numHotCountries; i++) {
    const pickIdx = (seed + i * 37) % candidateHotPool.length;
    const picked = candidateHotPool[pickIdx];
    if (picked && !breakoutCountries.includes(picked)) {
      breakoutCountries.push(picked);
    }
  }

  // If player targeted a specific Priority Territory during DSP Delivery, guarantee 2 breakout countries in that region
  if (priorityReg) {
    const priorityRegionCountries = foreignPool.filter(
      cc => getCountryMarketProfile(cc).regionGroup === priorityReg
    );
    for (let i = 0; i < Math.min(2, priorityRegionCountries.length); i++) {
      const pCountry = priorityRegionCountries[(seed + i * 19) % priorityRegionCountries.length];
      if (pCountry && !breakoutCountries.includes(pCountry)) {
        breakoutCountries.push(pCountry);
      }
    }
  }

  // Compute each country's specific multiplier
  allCountries.forEach(cc => {
    const prof = getCountryMarketProfile(cc);
    const isHome = cc === homeCode;
    const isCollabHome = collabCountry === cc;
    const isHotCountry = breakoutCountries.includes(cc);
    const inPrimaryRegion = primaryRegions.includes(prof.regionGroup);
    const inSecondaryRegion = secondaryRegions.includes(prof.regionGroup);

    const cHash = deterministicSongHash(song?.id || 1, song?.title || 'Track', cc) % 100;
    const genreResonance = getGenreTerritoryResonance(
      song?.genre || 'Pop',
      song?.subgenre || '',
      cc,
      prof.regionGroup
    );

    if (isHome) {
      // Home country contributes meaningfully (solid pillar), but does NOT swallow the entire global market!
      countryMultipliers[cc] = 1.65;
      return;
    }

    if (isCollabHome) {
      countryMultipliers[cc] = 1.75;
      return;
    }

    let baseMult = 0.45;

    if (archetype === 'pan_global_hit') {
      // Even a global smash has countries where it's huge (1.35x-1.65x) and countries where it's moderate (0.45x-0.85x)
      if (isHotCountry) {
        baseMult = 1.35 + (cHash / 100) * 0.35;
      } else if (inPrimaryRegion) {
        baseMult = cHash < 65 ? 0.85 + (cHash / 100) * 0.45 : 0.42 + (cHash / 100) * 0.25;
      } else {
        baseMult = 0.35 + (cHash / 100) * 0.40;
      }
    } else if (archetype === 'western_transatlantic') {
      // Example: Hits in US/CA and ~60% of Europe/Oceania, but NOT a hit in Indonesia/Asia!
      if (isHotCountry) {
        baseMult = 1.40 + (cHash / 100) * 0.40;
      } else if (prof.regionGroup === 'North America' || prof.regionGroup === 'Oceania') {
        baseMult = 1.05 + (cHash / 100) * 0.35;
      } else if (prof.regionGroup === 'Europe') {
        // Hits in some European countries, moderate/cold in others
        baseMult = cHash < 58 ? 1.08 + (cHash / 100) * 0.42 : 0.32 + (cHash / 100) * 0.25;
      } else if (prof.regionGroup === 'East Asia' || prof.regionGroup === 'Southeast Asia' || prof.regionGroup === 'South Asia') {
        // Explicitly cold in Asia (e.g. Indonesia, Japan, Korea) unless it was the artist's home country
        baseMult = 0.14 + (cHash / 100) * 0.18;
      } else {
        baseMult = 0.30 + (cHash / 100) * 0.25;
      }
    } else if (archetype === 'euro_oceania_wave') {
      if (isHotCountry) {
        baseMult = 1.45 + (cHash / 100) * 0.40;
      } else if (prof.regionGroup === 'Europe' || prof.regionGroup === 'Oceania') {
        baseMult = cHash < 68 ? 1.12 + (cHash / 100) * 0.40 : 0.45 + (cHash / 100) * 0.25;
      } else if (prof.regionGroup === 'North America') {
        baseMult = 0.55 + (cHash / 100) * 0.35;
      } else {
        baseMult = 0.16 + (cHash / 100) * 0.20;
      }
    } else if (archetype === 'asian_pacific_phenomenon') {
      if (isHotCountry) {
        baseMult = 1.50 + (cHash / 100) * 0.40;
      } else if (prof.regionGroup === 'Southeast Asia' || prof.regionGroup === 'East Asia') {
        baseMult = cHash < 70 ? 1.15 + (cHash / 100) * 0.42 : 0.45 + (cHash / 100) * 0.25;
      } else if (prof.regionGroup === 'Oceania' || prof.regionGroup === 'North America') {
        baseMult = 0.48 + (cHash / 100) * 0.35;
      } else {
        // Low in Europe / LatAm
        baseMult = 0.15 + (cHash / 100) * 0.18;
      }
    } else if (archetype === 'americas_crossover') {
      if (isHotCountry) {
        baseMult = 1.42 + (cHash / 100) * 0.38;
      } else if (prof.regionGroup === 'North America' || prof.regionGroup === 'Latin America' || cc === 'ES' || cc === 'PT') {
        baseMult = cHash < 68 ? 1.10 + (cHash / 100) * 0.38 : 0.45 + (cHash / 100) * 0.25;
      } else {
        baseMult = 0.16 + (cHash / 100) * 0.20;
      }
    } else if (archetype === 'selective_multi_country') {
      if (isHotCountry) {
        baseMult = 1.55 + (cHash / 100) * 0.45;
      } else if (cHash < 25) {
        // Secondary pocket countries where it also charts
        baseMult = 0.95 + (cHash / 100) * 0.35;
        if (!breakoutCountries.includes(cc)) breakoutCountries.push(cc);
      } else if (inPrimaryRegion) {
        baseMult = 0.55 + (cHash / 100) * 0.25;
      } else {
        baseMult = 0.16 + (cHash / 100) * 0.20;
      }
    } else {
      // dual_market_viral
      if (isHotCountry) {
        baseMult = 1.65 + (cHash / 100) * 0.45;
      } else if (inPrimaryRegion && cHash < 40) {
        baseMult = 0.65 + (cHash / 100) * 0.25;
      } else {
        baseMult = 0.14 + (cHash / 100) * 0.18;
      }
    }

    const priorityTerritoryBoost =
      priorityReg && prof.regionGroup === priorityReg ? 1.35 : 1.0;

    const combinedMult = Math.max(
      0.12,
      Math.min(2.35, baseMult * (0.65 + genreResonance * 0.35) * priorityTerritoryBoost)
    );
    countryMultipliers[cc] = Number(combinedMult.toFixed(3));

    if (combinedMult <= 0.32) {
      coldCountries.push(cc);
    }
  });

  // Home Market Weight Multiplier for territorial share pie:
  // Balanced so Home Country contributes meaningfully (e.g. 12% - 26% depending on country size and scope)
  // without ever monopolizing 60%-80% of the player's global streams on regional/global releases!
  const isHighLoyaltyHome = ['ID', 'KR', 'JP', 'NG', 'BR', 'PH', 'MX', 'IN', 'TH', 'VN', 'TR', 'AR', 'CO', 'PL'].includes(homeCode);
  const homeMarketWeightMultiplier =
    homeCode === 'US'
      ? 1.35
      : homeCode === 'GB'
      ? 1.75
      : isHighLoyaltyHome
      ? 2.65
      : 2.15;

  const profile: SongRegionalBreakoutProfile = {
    archetype,
    archetypeLabel,
    archetypeSummary,
    primaryRegions,
    secondaryRegions,
    breakoutCountries,
    coldCountries,
    countryMultipliers,
    homeMarketWeightMultiplier
  };

  breakoutProfileCache.set(cacheKey, profile);
  return profile;
}
