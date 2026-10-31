// Real-World Music Distribution & DSP Technical Delivery Engine
// Models authentic music industry distribution deals (DistroKid, TuneCore Pro, AWAL, EMPIRE,
// The Orchard / Sony Music, Republic / UMG Syndicate), Artist/Distributor Royalty Splits,
// Recoupable Label Advances, ISRC/UPC Registration, Dolby Atmos & Hi-Res Lossless Mastering,
// YouTube Content ID Monetization, Priority Territory Focus, and Physical Retail Allocation.

import { Song, Project } from '../types';
import { RegionGroup } from './countryMarketSystem';

export type RealDistributorId =
  | 'distrokid'
  | 'tunecore'
  | 'awal'
  | 'empire'
  | 'the_orchard'
  | 'republic_umg';

export type AudioDeliveryFormatId = 'standard' | 'hires_lossless' | 'dolby_atmos';

export type PhysicalRetailTierId = 'none' | 'indie_record_stores' | 'global_retail_chains';

export type PriorityTerritoryOption = 'auto' | RegionGroup;

export interface RealDistributorProfile {
  id: RealDistributorId;
  name: string;
  parentCompany: string;
  tierLabel: string;
  upfrontFee: number;
  artistRoyaltyPercent: number;
  distributorCutPercent: number;
  minPopularityReq: number;
  minQualityReq: number;
  baseAdvanceSingle: number;
  baseAdvanceProject: number;
  hypeMultiplier: number;
  potentialMultiplier: number;
  playlistPitchBonus: number;
  pureSalesConversionMult: number;
  radioSyndicationMult: number;
  deliverySpeedLabel: string;
  dspPartnersSummary: string;
  description: string;
}

export interface AudioDeliveryFormatSpec {
  id: AudioDeliveryFormatId;
  name: string;
  shortLabel: string;
  costPerTrack: number;
  costCapProject: number;
  streamRetentionMult: number;
  pureSalesMult: number;
  playlistBonus: number;
  technicalSpec: string;
  description: string;
}

export interface PhysicalRetailTierSpec {
  id: PhysicalRetailTierId;
  name: string;
  shortLabel: string;
  costSingle: number;
  costProject: number;
  firstWeekSalesBoostMult: number;
  bonusFirstDayUnitsSingle: number;
  bonusFirstDayUnitsProject: number;
  retailersList: string;
  description: string;
}

export const REAL_WORLD_DISTRIBUTORS: RealDistributorProfile[] = [
  {
    id: 'distrokid',
    name: 'DistroKid',
    parentCompany: 'Independent DIY Aggregator',
    tierLabel: 'DIY Direct-to-DSP',
    upfrontFee: 25,
    artistRoyaltyPercent: 100,
    distributorCutPercent: 0,
    minPopularityReq: 0,
    minQualityReq: 0,
    baseAdvanceSingle: 0,
    baseAdvanceProject: 0,
    hypeMultiplier: 1.0,
    potentialMultiplier: 1.0,
    playlistPitchBonus: 0,
    pureSalesConversionMult: 1.0,
    radioSyndicationMult: 1.0,
    deliverySpeedLabel: 'Instant DSP Ingestion',
    dspPartnersSummary: 'Spotify, Apple Music, iTunes, YouTube Music, TikTok, Amazon',
    description:
      'Keep 100% of your master royalties for a flat $25 upload fee. No label advance or editorial frontpage push.'
  },
  {
    id: 'tunecore',
    name: 'TuneCore Pro + Publishing',
    parentCompany: 'Believe Digital Group',
    tierLabel: 'DIY + Store & Sync Admin',
    upfrontFee: 60,
    artistRoyaltyPercent: 100,
    distributorCutPercent: 0,
    minPopularityReq: 0,
    minQualityReq: 0,
    baseAdvanceSingle: 0,
    baseAdvanceProject: 0,
    hypeMultiplier: 1.06,
    potentialMultiplier: 1.04,
    playlistPitchBonus: 3,
    pureSalesConversionMult: 1.08,
    radioSyndicationMult: 1.02,
    deliverySpeedLabel: 'Priority Store Ingestion',
    dspPartnersSummary: '150+ Global DSPs, iTunes Pre-Order Storefront & Global Publishing Admin',
    description:
      '100% artist royalties with international digital storefront optimization (+8% iTunes download conversion).'
  },
  {
    id: 'awal',
    name: 'AWAL (Artists Without A Label)',
    parentCompany: 'Sony Music Independent Services',
    tierLabel: 'Selective Indie Partner',
    upfrontFee: 0,
    artistRoyaltyPercent: 85,
    distributorCutPercent: 15,
    minPopularityReq: 14,
    minQualityReq: 65,
    baseAdvanceSingle: 3500,
    baseAdvanceProject: 12000,
    hypeMultiplier: 1.18,
    potentialMultiplier: 1.10,
    playlistPitchBonus: 10,
    pureSalesConversionMult: 1.10,
    radioSyndicationMult: 1.08,
    deliverySpeedLabel: 'Curated A&R Ingestion',
    dspPartnersSummary: 'Spotify Fresh Finds / Editorial Desk, Apple Music Indie, Global DSPs',
    description:
      'Selective roster deal: $0 upfront fee, 85/15 royalty split, optional recoupable advance, and dedicated indie editorial pitching.'
  },
  {
    id: 'empire',
    name: 'EMPIRE Distribution',
    parentCompany: 'EMPIRE Independent Holdings',
    tierLabel: 'Independent Powerhouse',
    upfrontFee: 0,
    artistRoyaltyPercent: 80,
    distributorCutPercent: 20,
    minPopularityReq: 26,
    minQualityReq: 70,
    baseAdvanceSingle: 10000,
    baseAdvanceProject: 34000,
    hypeMultiplier: 1.28,
    potentialMultiplier: 1.16,
    playlistPitchBonus: 16,
    pureSalesConversionMult: 1.14,
    radioSyndicationMult: 1.18,
    deliverySpeedLabel: 'VIP DSP & Street Impact',
    dspPartnersSummary: 'RapCaviar / Today’s Top Hits Desk, Apple Music Frontpage, Urban & Rhythmic Radio',
    description:
      'Premier independent label services: 80/20 royalty split, substantial recoupable cash advance, and aggressive DSP & radio crossover.'
  },
  {
    id: 'the_orchard',
    name: 'The Orchard',
    parentCompany: 'Sony Music Entertainment',
    tierLabel: 'Global Label Services',
    upfrontFee: 0,
    artistRoyaltyPercent: 75,
    distributorCutPercent: 25,
    minPopularityReq: 42,
    minQualityReq: 74,
    baseAdvanceSingle: 28000,
    baseAdvanceProject: 90000,
    hypeMultiplier: 1.45,
    potentialMultiplier: 1.24,
    playlistPitchBonus: 24,
    pureSalesConversionMult: 1.22,
    radioSyndicationMult: 1.28,
    deliverySpeedLabel: 'Global Territory Priority',
    dspPartnersSummary: 'Worldwide Sony DSP Network, Multi-Continent Editorial & Retail Chain Supply',
    description:
      'Full global distribution infrastructure across 45+ offices: 75/25 split, high recoupable advance, and multi-continent playlist & retail reach.'
  },
  {
    id: 'republic_umg',
    name: 'Republic / UMG Global Syndicate',
    parentCompany: 'Universal Music Group',
    tierLabel: 'Major Label Flagship Deal',
    upfrontFee: 0,
    artistRoyaltyPercent: 65,
    distributorCutPercent: 35,
    minPopularityReq: 58,
    minQualityReq: 78,
    baseAdvanceSingle: 75000,
    baseAdvanceProject: 240000,
    hypeMultiplier: 1.78,
    potentialMultiplier: 1.35,
    playlistPitchBonus: 35,
    pureSalesConversionMult: 1.35,
    radioSyndicationMult: 1.48,
    deliverySpeedLabel: 'Day-One Global Takeover',
    dspPartnersSummary: 'New Music Friday #1 Pitch, Global Pop Radio Syndicate, Worldwide Physical & Banner Blitz',
    description:
      'Blockbuster major label syndicate: 65/35 split, massive recoupable cash advance, global DSP marquee banners, and Mediabase/Global radio push.'
  }
];

export const AUDIO_DELIVERY_FORMATS: AudioDeliveryFormatSpec[] = [
  {
    id: 'standard',
    name: '16-Bit / 44.1kHz Standard Stereo',
    shortLabel: '16-Bit Stereo',
    costPerTrack: 0,
    costCapProject: 0,
    streamRetentionMult: 1.0,
    pureSalesMult: 1.0,
    playlistBonus: 0,
    technicalSpec: 'WAV / FLAC 16-bit 44.1kHz (-14 LUFS)',
    description: 'Standard Red Book digital master accepted by all streaming platforms.'
  },
  {
    id: 'hires_lossless',
    name: '24-Bit / 192kHz Hi-Res Lossless + Apple Digital Master',
    shortLabel: '24-Bit Hi-Res Lossless',
    costPerTrack: 350,
    costCapProject: 2200,
    streamRetentionMult: 1.04,
    pureSalesMult: 1.12,
    playlistBonus: 4,
    technicalSpec: '24-bit/192kHz ADM Certified Master',
    description: 'Certified high-resolution audiophile master (+12% iTunes/pure sales conversion & +4% stream hold).'
  },
  {
    id: 'dolby_atmos',
    name: 'Dolby Atmos Spatial Audio + 24-Bit ADM Suite',
    shortLabel: 'Dolby Atmos Spatial',
    costPerTrack: 1200,
    costCapProject: 6800,
    streamRetentionMult: 1.09,
    pureSalesMult: 1.18,
    playlistBonus: 10,
    technicalSpec: '7.1.4 ADM BWF Spatial + Binaural Render + 24-bit Lossless',
    description: 'Flagship spatial audio master featured in Apple Music Spatial & editorial playlists (+9% stream hold & +18% pure sales).'
  }
];

export const PHYSICAL_RETAIL_TIERS: PhysicalRetailTierSpec[] = [
  {
    id: 'none',
    name: 'Digital-Only DSP Delivery',
    shortLabel: 'Digital Only',
    costSingle: 0,
    costProject: 0,
    firstWeekSalesBoostMult: 1.0,
    bonusFirstDayUnitsSingle: 0,
    bonusFirstDayUnitsProject: 0,
    retailersList: 'Spotify, Apple Music, iTunes Store, YouTube, Amazon Digital',
    description: '100% digital streaming and download storefront distribution.'
  },
  {
    id: 'indie_record_stores',
    name: 'Indie Record Store Alliance (CD & 7" / 12" Vinyl)',
    shortLabel: 'Indie Record Stores',
    costSingle: 1800,
    costProject: 5500,
    firstWeekSalesBoostMult: 1.24,
    bonusFirstDayUnitsSingle: 420,
    bonusFirstDayUnitsProject: 1850,
    retailersList: 'Rough Trade (UK/US), Amoeba Music, Reckless Records, Local Record Shops',
    description: 'Physical CD and collector vinyl pressing shipped to independent record stores (+24% pure sales & chart units).'
  },
  {
    id: 'global_retail_chains',
    name: 'Global Retail Chain Allocation (Target, HMV, Tower, Fnac)',
    shortLabel: 'Global Retail Chains',
    costSingle: 6500,
    costProject: 18500,
    firstWeekSalesBoostMult: 1.55,
    bonusFirstDayUnitsSingle: 1650,
    bonusFirstDayUnitsProject: 6400,
    retailersList: 'Target & Walmart (US), HMV (UK), Tower Records (JP), Fnac (EU), JB Hi-Fi (AU)',
    description: 'Worldwide physical endcap stocking with exclusive retail editions (+55% pure sales & major Billboard 200 / Hot 100 boost).'
  }
];

export const PRIORITY_TERRITORY_OPTIONS: {
  id: PriorityTerritoryOption;
  label: string;
  shortBadge: string;
  desc: string;
}[] = [
  {
    id: 'auto',
    label: 'Global Balanced Delivery (Organic Territory Discovery)',
    shortBadge: 'Global Balanced',
    desc: 'Standard worldwide DSP ingestion; let each song find its organic regional breakout markets.'
  },
  {
    id: 'North America',
    label: 'North America Priority Push (US & Canada)',
    shortBadge: 'North America Focus',
    desc: '+35% territorial weight & DSP marketing concentration in the United States and Canada.'
  },
  {
    id: 'Europe',
    label: 'Pan-European Priority Push (UK, Germany, France, Nordics)',
    shortBadge: 'Europe Focus',
    desc: '+35% territorial weight across UK, Germany, France, Netherlands, Sweden, Italy & Spain.'
  },
  {
    id: 'East Asia',
    label: 'East Asia Priority Push (Japan, South Korea, Taiwan)',
    shortBadge: 'East Asia Focus',
    desc: '+35% territorial weight and high-pure-sales targeting in Japan and South Korea.'
  },
  {
    id: 'Southeast Asia',
    label: 'Southeast Asia Priority Push (Indonesia, Philippines, Thailand)',
    shortBadge: 'SE Asia Focus',
    desc: '+35% territorial weight across high-velocity streaming & YouTube markets in Southeast Asia.'
  },
  {
    id: 'Latin America',
    label: 'Latin America Priority Push (Brazil, Mexico, Argentina, Colombia)',
    shortBadge: 'Latin America Focus',
    desc: '+35% territorial weight across Latin American streaming and video powerhouses.'
  },
  {
    id: 'Oceania',
    label: 'Oceania Priority Push (Australia & New Zealand)',
    shortBadge: 'Oceania Focus',
    desc: '+35% territorial weight in Australia and New Zealand DSP & radio charts.'
  }
];

export function getRealDistributorById(id?: string): RealDistributorProfile {
  if (!id) return REAL_WORLD_DISTRIBUTORS[0];
  // Map legacy distributor IDs seamlessly
  if (id === 'indie') return REAL_WORLD_DISTRIBUTORS[0];
  if (id === 'boutique') return REAL_WORLD_DISTRIBUTORS[2]; // AWAL
  if (id === 'major') return REAL_WORLD_DISTRIBUTORS[4];    // The Orchard
  if (id === 'global') return REAL_WORLD_DISTRIBUTORS[5];   // Republic / UMG
  return REAL_WORLD_DISTRIBUTORS.find(d => d.id === id) || REAL_WORLD_DISTRIBUTORS[0];
}

export function getAudioDeliveryFormatById(id?: string): AudioDeliveryFormatSpec {
  return AUDIO_DELIVERY_FORMATS.find(f => f.id === id) || AUDIO_DELIVERY_FORMATS[0];
}

export function getPhysicalRetailTierById(id?: string): PhysicalRetailTierSpec {
  return PHYSICAL_RETAIL_TIERS.find(r => r.id === id) || PHYSICAL_RETAIL_TIERS[0];
}

/**
 * Checks whether the player meets the A&R requirements for a selective distributor
 */
export function evaluateDistributorEligibility(
  distributor: RealDistributorProfile,
  artistPopularity: number,
  masterQuality: number
): { eligible: boolean; reason: string } {
  if (distributor.minPopularityReq === 0 && distributor.minQualityReq === 0) {
    return { eligible: true, reason: 'Open to all independent artists' };
  }

  const meetsPop = artistPopularity >= distributor.minPopularityReq;
  const meetsQualityException =
    masterQuality >= distributor.minQualityReq + 8 &&
    artistPopularity >= distributor.minPopularityReq * 0.65;

  if (meetsPop || meetsQualityException) {
    return {
      eligible: true,
      reason: meetsPop
        ? `Qualified via Artist Popularity (${Math.round(artistPopularity)}/${distributor.minPopularityReq})`
        : `A&R Fast-Tracked via Master Quality (${Math.round(masterQuality)}/100)`
    };
  }

  return {
    eligible: false,
    reason: `Requires Popularity ${distributor.minPopularityReq}+ (or ${Math.ceil(
      distributor.minPopularityReq * 0.65
    )}+ Pop with ${distributor.minQualityReq + 8}+ Master Quality)`
  };
}

/**
 * Calculates the dynamic Recoupable Cash Advance offered by a distributor
 * based on artist popularity, hype, master quality, and single vs project type.
 */
export function calculateDistributorAdvanceOffer(params: {
  distributor: RealDistributorProfile;
  kind: 'single' | 'project';
  projectType?: 'single_pack' | 'ep' | 'album';
  artistPopularity: number;
  artistHype: number;
  masterQuality: number;
}): number {
  const { distributor, kind, projectType, artistPopularity, artistHype, masterQuality } = params;
  const baseAdvance =
    kind === 'project'
      ? distributor.baseAdvanceProject *
        (projectType === 'album' ? 1.15 : projectType === 'ep' ? 0.78 : 0.55)
      : distributor.baseAdvanceSingle;

  if (baseAdvance <= 0) return 0;

  const popScale = 0.75 + Math.pow(Math.max(10, artistPopularity) / 55, 1.25) * 0.65;
  const qualityScale = 0.85 + Math.max(0, masterQuality - 60) * 0.01;
  const hypeScale = 0.92 + Math.min(100, artistHype) * 0.0025;

  const rawOffer = baseAdvance * popScale * qualityScale * hypeScale;
  return Math.round(rawOffer / 250) * 250;
}

/**
 * Generates an authentic ISO 3901 ISRC code (e.g. "US-UM7-26-04912") for a song
 */
export function generateAuthenticISRC(
  songId: number,
  title: string,
  artistCountry: string = 'US',
  distributorId: string = 'distrokid',
  releaseYear: number = 2026
): string {
  const cc = (artistCountry || 'US').toUpperCase().slice(0, 2);
  const registrantMap: Record<string, string> = {
    distrokid: 'DK4',
    tunecore: 'TC9',
    awal: 'AW2',
    empire: 'EM8',
    the_orchard: 'OR6',
    republic_umg: 'UM7'
  };
  const registrant = registrantMap[distributorId] || 'QM5';
  const yy = String(releaseYear).slice(-2);
  let hash = songId * 137;
  for (let i = 0; i < (title || '').length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) % 99999;
  }
  const designation = String(Math.abs(hash) % 90000 + 10000).padStart(5, '0');
  return `${cc}-${registrant}-${yy}-${designation}`;
}

/**
 * Generates an authentic 12-digit UPC barcode for a single or album release
 */
export function generateAuthenticUPC(
  itemId: number,
  title: string,
  distributorId: string = 'distrokid'
): string {
  const prefixMap: Record<string, string> = {
    distrokid: '198004',
    tunecore: '859741',
    awal: '505616',
    empire: '888915',
    the_orchard: '197189',
    republic_umg: '602458'
  };
  const prefix = prefixMap[distributorId] || '198004';
  let hash = itemId * 251;
  for (let i = 0; i < (title || '').length; i++) {
    hash = (hash * 43 + title.charCodeAt(i)) % 999999;
  }
  const suffix = String(Math.abs(hash) % 900000 + 100000).padStart(6, '0');
  return `${prefix}${suffix}`;
}

export interface DailyDistributionRoyaltyStepResult {
  grossRevenue: number;
  contentIdBonusRevenue: number;
  distributorCommission: number;
  artistGrossRoyalty: number;
  advanceRecoupedToday: number;
  netPayableToArtistToday: number;
  newUnrecoupedAdvance: number;
  newTotalRoyaltiesEarned: number;
}

/**
 * Processes daily gross revenue through the release's Distribution Contract:
 * 1. Adds YouTube Content ID / UGC micro-monetization if enabled
 * 2. Deducts the Distributor's royalty percentage (0% for DIY, 15%-35% for Indie/Major)
 * 3. Uses the Artist's royalty share to recoup any remaining `unrecoupedAdvance` first
 * 4. Pays out the remaining recouped net cash to the artist's bank balance
 */
export function processDailyDistributionRoyaltySplit(params: {
  grossBaseRevenue: number;
  dailyStreams: number;
  dailyViews: number;
  distributorId?: string;
  royaltyArtistShare?: number;
  unrecoupedAdvance?: number;
  totalRoyaltiesEarned?: number;
  contentIdEnabled?: boolean;
}): DailyDistributionRoyaltyStepResult {
  const {
    grossBaseRevenue,
    dailyStreams,
    dailyViews,
    distributorId,
    royaltyArtistShare,
    unrecoupedAdvance = 0,
    totalRoyaltiesEarned = 0,
    contentIdEnabled = false
  } = params;

  const distro = getRealDistributorById(distributorId);
  const artistSharePct =
    royaltyArtistShare !== undefined ? royaltyArtistShare : distro.artistRoyaltyPercent;

  // Content ID captures user-generated shorts, TikTok/Reels/YouTube UGC sound uses (~$0.00045 per stream/view equivalent)
  const contentIdBonusRevenue = contentIdEnabled
    ? (dailyStreams * 0.18 + dailyViews * 0.35) * 0.00055
    : 0;

  const grossRevenue = Math.max(0, grossBaseRevenue + contentIdBonusRevenue);
  const artistFraction = Math.max(0.1, Math.min(1.0, artistSharePct / 100));

  const artistGrossRoyalty = grossRevenue * artistFraction;
  const distributorCommission = Math.max(0, grossRevenue - artistGrossRoyalty);

  const currentUnrecouped = Math.max(0, unrecoupedAdvance);
  const advanceRecoupedToday = Math.min(currentUnrecouped, artistGrossRoyalty);
  const netPayableToArtistToday = Math.max(0, artistGrossRoyalty - advanceRecoupedToday);

  return {
    grossRevenue,
    contentIdBonusRevenue,
    distributorCommission,
    artistGrossRoyalty,
    advanceRecoupedToday,
    netPayableToArtistToday,
    newUnrecoupedAdvance: Math.max(0, Number((currentUnrecouped - advanceRecoupedToday).toFixed(2))),
    newTotalRoyaltiesEarned: Number((totalRoyaltiesEarned + artistGrossRoyalty).toFixed(2))
  };
}
