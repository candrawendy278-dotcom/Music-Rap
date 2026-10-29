import { GameState, Song, Project, NPC } from '../types';
import { formatNum, formatNumFull } from '../constants';
import { DETAILED_NPCS, getNpcAvatar } from './npcAssets';
import type { XPost } from './xSocialEngine';
import {
  applyTourCompletionCooldown,
  evaluateTourCooldownStatus,
  tickDailyTourCooldown
} from './tourCooldownEngine';

export type TourRegionId =
  | 'north_america'
  | 'europe'
  | 'asia'
  | 'latin_america'
  | 'oceania'
  | 'middle_east';

export type VenueTierId = 'club' | 'theater' | 'arena' | 'stadium';

export type MainStageArchitectureId =
  | 'proscenium_arch'
  | 'monolith_imax_led'
  | 'cyber_cathedral'
  | 'in_the_round_360'
  | 'colossal_mega_arch';

export type RunwayCatwalkId =
  | 'none'
  | 'straight_thrust'
  | 'diamond_catwalk'
  | 'dual_parallel'
  | 'infinity_loop';

export type BStageModuleId =
  | 'none'
  | 'acoustic_piano_island'
  | 'hydraulic_rising_cube'
  | 'levitation_ring';

export type EraLightingThemeId =
  | 'crimson_era'
  | 'midnight_sapphire'
  | 'golden_sovereign'
  | 'emerald_matrix'
  | 'neon_violet'
  | 'prismatic_white';

export type PresaleStrategyId =
  | 'verified_fan_code'
  | 'sponsor_cardholder_first'
  | 'open_general_rush';

export interface TourVenueSpec {
  tier: VenueTierId;
  tierLabel: string;
  venueName: string;
  capacity: number;
  rentalCost: number;
  minRecommendedPop: number;
  baseAcousticRating: number;
}

export interface TourCityDefinition {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  region: TourRegionId;
  regionLabel: string;
  /** SVG map coordinates on a 1000 x 520 global equirectangular projection */
  mapX: number;
  mapY: number;
  /** Label offset so adjacent cities never collide on the map */
  labelDx: number;
  labelDy: number;
  marketMultiplier: number; // 0.75 to 1.45 ticket purchasing power
  fanPassionBonus: number; // 1.0 to 1.35 crowd energy & merch conversion
  venues: Record<VenueTierId, TourVenueSpec>;
}

export interface TourStageConfig {
  mainStageId: MainStageArchitectureId;
  runwayId: RunwayCatwalkId;
  bStageId: BStageModuleId;
  lightingThemeId: EraLightingThemeId;
  hasPyro: boolean;
  hasLaserMatrix: boolean;
  hasPixMobWristbands: boolean;
  hasDroneSkyShow: boolean;
  hasLiveBandAndDancers: boolean;
  stageBannerText: string;
  backdropCover: string;
  customBannerUrl?: string;
}

export interface TourSponsorContract {
  id: string;
  name: string;
  tagline: string;
  reqPop: number;
  upfrontAdvance: number;
  perShowBonus: number;
  promoHypeBoost: number;
}

export interface TourSetlistConfig {
  act1SongIds: number[]; // Opening Statement
  act2SongIds: number[]; // Core Era Anthems
  act3SongIds: number[]; // Acoustic B-Stage
  act4SongIds: number[]; // Grand Finale Encore
  surpriseSongId: number | null;
}

export type SeatingZoneId =
  | 'nosebleed'
  | 'lower_bowl'
  | 'floor_standing'
  | 'golden_circle'
  | 'vip_package';

export interface TourVipPerksConfig {
  soundcheckParty: boolean;
  meetAndGreetPhoto: boolean;
  backstageLoungeCatering: boolean;
  signedPosterAndMerch: boolean;
  earlyEntryBarricade: boolean;
}

export const DEFAULT_VIP_PERKS: TourVipPerksConfig = {
  soundcheckParty: true,
  meetAndGreetPhoto: false,
  backstageLoungeCatering: true,
  signedPosterAndMerch: true,
  earlyEntryBarricade: true
};

export const VIP_PERKS_CATALOG: Array<{
  key: keyof TourVipPerksConfig;
  label: string;
  subtitle: string;
  costPerFan: number;
  valueBonus: number;
}> = [
  {
    key: 'soundcheckParty',
    label: 'Pre-Show Soundcheck Q&A Party',
    subtitle: 'Private 3-song acoustic rehearsal & stage side Q&A before doors open',
    costPerFan: 18,
    valueBonus: 115
  },
  {
    key: 'meetAndGreetPhoto',
    label: '1-on-1 Artist Meet & Greet Photo Op',
    subtitle: 'Professional backstage portrait with the artist + VIP laminate',
    costPerFan: 28,
    valueBonus: 230
  },
  {
    key: 'backstageLoungeCatering',
    label: 'VIP Champagne Lounge & Catering',
    subtitle: 'Private climate-controlled stadium club suite with complimentary bar',
    costPerFan: 22,
    valueBonus: 100
  },
  {
    key: 'signedPosterAndMerch',
    label: 'Autographed Tour Poster & Merch Box',
    subtitle: 'Hand-signed numbered city lithograph + exclusive VIP tour tote',
    costPerFan: 16,
    valueBonus: 90
  },
  {
    key: 'earlyEntryBarricade',
    label: 'Dedicated Early-Entry Barricade Access',
    subtitle: 'First access to the Golden Circle front rail 45 minutes before GA',
    costPerFan: 8,
    valueBonus: 70
  }
];

export const SEATING_ZONES_SPEC: Array<{
  id: SeatingZoneId;
  label: string;
  shortLabel: string;
  capacityShare: number;
  benchmarkMult: number;
  ringDescription: string;
}> = [
  {
    id: 'nosebleed',
    label: '300-Level Nosebleed Deck',
    shortLabel: '300-Lvl Upper',
    capacityShare: 0.28,
    benchmarkMult: 0.65,
    ringDescription: 'Outer upper stadium bowl • High volume, price-sensitive casual fans'
  },
  {
    id: 'lower_bowl',
    label: '100-Level Lower Bowl Reserved',
    shortLabel: '100-Lvl Bowl',
    capacityShare: 0.30,
    benchmarkMult: 1.08,
    ringDescription: 'Elevated sightline seating • Core concertgoers & Platinum surge zone'
  },
  {
    id: 'floor_standing',
    label: 'Main Floor Standing Pitch',
    shortLabel: 'Floor Pitch',
    capacityShare: 0.22,
    benchmarkMult: 1.32,
    ringDescription: 'General stadium pitch surrounding the catwalk & B-Stage'
  },
  {
    id: 'golden_circle',
    label: 'Golden Circle Front Barricade',
    shortLabel: 'Golden Circle',
    capacityShare: 0.14,
    benchmarkMult: 2.15,
    ringDescription: 'Up-close front stage & diamond runway pit for die-hard stans'
  },
  {
    id: 'vip_package',
    label: 'VIP Soundcheck & Meet/Greet Club',
    shortLabel: 'VIP Package',
    capacityShare: 0.06,
    benchmarkMult: 4.35,
    ringDescription: 'Ultra-exclusive front-row riser + custom VIP hospitality perks'
  }
];

export function evaluateVipPerksMetrics(vipPerks?: TourVipPerksConfig): {
  activePerksCount: number;
  costPerVipFan: number;
  perceivedValueBonus: number;
  demandBoostMult: number;
} {
  const perks = vipPerks || DEFAULT_VIP_PERKS;
  let activePerksCount = 0;
  let costPerVipFan = 0;
  let perceivedValueBonus = 0;

  VIP_PERKS_CATALOG.forEach(item => {
    if (perks[item.key]) {
      activePerksCount += 1;
      costPerVipFan += item.costPerFan;
      perceivedValueBonus += item.valueBonus;
    }
  });

  const demandBoostMult = 0.88 + activePerksCount * 0.065;
  return {
    activePerksCount,
    costPerVipFan,
    perceivedValueBonus,
    demandBoostMult
  };
}

export interface TourStopItem {
  id: string;
  stopNumber: number;
  cityId: string;
  cityName: string;
  countryCode: string;
  region: TourRegionId;
  venueTier: VenueTierId;
  venueName: string;
  capacity: number;
  nightNumber: number; // 1 = Night 1, 2 = Night 2 (Added Extra Date), etc.
  scheduledDate: string; // YYYY-MM-DD
  status: 'scheduled' | 'completed' | 'cancelled';
  projectedSelloutPct: number;
  canAddExtraNight: boolean;
  // Live Presale & Queue Tracking (updates daily before show date!)
  presalePhase: 'fan_presale' | 'sponsor_presale' | 'general_onsale' | 'sold_out';
  presaleTicketsSold: number;
  presaleSelloutPct: number;
  virtualQueueCount: number;
  presaleRevenueCollected: number;
  productionHoldUnlocked?: boolean;
  flashSaleApplied?: boolean;
  selloutAlertPosted?: boolean;
  tierSelloutPcts?: Record<SeatingZoneId, number>;
  // Populated when completed:
  ticketsSold?: number;
  selloutPct?: number;
  gaTicketsSold?: number;
  goldenCircleSold?: number;
  vipSold?: number;
  ticketGross?: number;
  vipGross?: number;
  merchBoothGross?: number;
  sponsorBonus?: number;
  totalGross?: number;
  venueRentalFee?: number;
  promoterCut?: number;
  logisticsAndCrewCost?: number;
  openingActFee?: number;
  netProfit?: number;
  surpriseSongTitle?: string;
  crowdRating?: number;
}

export interface ActiveWorldTour {
  id: string;
  title: string;
  eraProjectId: number | null;
  eraProjectTitle: string;
  coverArt: string;
  customBannerUrl?: string;
  status: 'active' | 'completed';
  announcedDate: string;
  kickoffDate: string; // Player-chosen start date for Stop #1
  daysBetweenShows: number; // 2, 3, or 4 days between stops
  presaleStrategy: PresaleStrategyId;
  fansFirstBlastSent?: boolean;
  stageConfig: TourStageConfig;
  setlist: TourSetlistConfig;
  openingActNpcIds: string[];
  sponsorId: string;
  // 5-Tier Seating Prices (gaPrice kept synced as weighted average of Nosebleed/LowerBowl/Floor)
  nosebleedPrice?: number;
  lowerBowlPrice?: number;
  floorStandingPrice?: number;
  gaPrice: number;
  goldenCirclePrice: number;
  vipPackagePrice: number;
  vipPerks?: TourVipPerksConfig;
  antiScalperExchangeEnabled?: boolean;
  dynamicPlatinumEnabled: boolean;
  stops: TourStopItem[];
  totalShowsCompleted: number;
  totalAttendance: number;
  totalTicketGross: number;
  totalMerchBoothGross: number;
  totalSponsorGross: number;
  totalExpenses: number;
  totalNetProfit: number;
}

export interface WorldTourState {
  initialized: boolean;
  vocalStamina: number; // 0 to 100
  draftStageConfig: TourStageConfig;
  activeTour: ActiveWorldTour | null;
  pastTours: ActiveWorldTour[];
  lifetimeTourGross: number;
  lifetimeTourAttendance: number;
  lifetimeShowsPlayed: number;
  cooldownDaysLeft?: number;
  cooldownTotalDays?: number;
  cooldownEndDate?: string;
  lastCompletedTourTitle?: string;
  lastCompletedTourDate?: string;
}

export interface GlobalTourBoxscoreEntry {
  id: string;
  artistName: string;
  tourTitle: string;
  avatar: string;
  isPlayer: boolean;
  showsCount: number;
  totalAttendance: number;
  totalGross: number;
  avgGrossPerShow: number;
  avgTicketPrice: number;
  signatureVenue: string;
}

// ============================================================================
// 1. STAGE ARCHITECT OPTIONS & PRICING
// ============================================================================

export const MAIN_STAGE_ARCHITECTURES: Array<{
  id: MainStageArchitectureId;
  name: string;
  subtitle: string;
  spanSpec: string;
  ledResolution: string;
  buildCost: number;
  perShowRigging: number;
  prodScore: number;
}> = [
  {
    id: 'proscenium_arch',
    name: 'Classic Proscenium Arch',
    subtitle: 'Traditional concert framing with dual side IMAG screens & steel roof truss',
    spanSpec: '42m × 18m • 60T Load',
    ledResolution: 'Dual 4K Side Wings',
    buildCost: 45_000,
    perShowRigging: 4_500,
    prodScore: 18
  },
  {
    id: 'monolith_imax_led',
    name: 'Panoramic IMAX LED Monolith',
    subtitle: '72-meter curved 8K LED wall with hydraulic split-entry doors & multi-level risers',
    spanSpec: '72m × 24m • 95T Load',
    ledResolution: '8K Seamless Curved Wall',
    buildCost: 165_000,
    perShowRigging: 14_000,
    prodScore: 30
  },
  {
    id: 'cyber_cathedral',
    name: 'Cybernetic Cathedral Rig',
    subtitle: 'Multi-story industrial scaffolding, kinetic light pods & automated overhead gantry',
    spanSpec: '78m × 28m • 125T Load',
    ledResolution: '12K Modular Matrix + Pods',
    buildCost: 290_000,
    perShowRigging: 24_000,
    prodScore: 38
  },
  {
    id: 'in_the_round_360',
    name: '360° Center-Bowl Island',
    subtitle: 'Zero-obstruction central stadium stage with suspended halo LED ring for max capacity',
    spanSpec: '48m Dia • 4-Tower Support',
    ledResolution: '360° Orbital Halo Screen',
    buildCost: 460_000,
    perShowRigging: 36_000,
    prodScore: 44
  },
  {
    id: 'colossal_mega_arch',
    name: 'Colossal Stadium Mega-Arch',
    subtitle: 'Architectural touring monument with 120ft spire, 3-story risers & wraparound IMAX',
    spanSpec: '88m × 36m • 165T Load',
    ledResolution: '16K Wraparound Mega-Canvas',
    buildCost: 680_000,
    perShowRigging: 52_000,
    prodScore: 50
  }
];

export const RUNWAY_CATWALK_OPTIONS: Array<{
  id: RunwayCatwalkId;
  name: string;
  subtitle: string;
  buildCost: number;
  perShowRigging: number;
  prodScore: number;
}> = [
  {
    id: 'none',
    name: 'No Extended Catwalk',
    subtitle: 'Standard stage apron maximizing general floor standing room',
    buildCost: 0,
    perShowRigging: 0,
    prodScore: 0
  },
  {
    id: 'straight_thrust',
    name: '45m Center Thrust Runway',
    subtitle: 'Direct LED-floor runway cutting deep into the Golden Circle pit',
    buildCost: 35_000,
    perShowRigging: 3_200,
    prodScore: 8
  },
  {
    id: 'diamond_catwalk',
    name: 'Diamond Era Catwalk',
    subtitle: 'Iconic geometric diamond center enclosure with internal VIP Club pit',
    buildCost: 110_000,
    perShowRigging: 9_500,
    prodScore: 16
  },
  {
    id: 'dual_parallel',
    name: 'Dual Parallel Runways',
    subtitle: 'Twin left/right stadium walkways spanning the entire floor length',
    buildCost: 145_000,
    perShowRigging: 12_000,
    prodScore: 18
  },
  {
    id: 'infinity_loop',
    name: '360° Enclosing Infinity Track',
    subtitle: 'Full-floor continuous runway circuit connecting Main Stage & B-Stage',
    buildCost: 210_000,
    perShowRigging: 16_500,
    prodScore: 22
  }
];

export const B_STAGE_MODULES: Array<{
  id: BStageModuleId;
  name: string;
  subtitle: string;
  buildCost: number;
  perShowRigging: number;
  prodScore: number;
}> = [
  {
    id: 'none',
    name: 'No Secondary B-Stage',
    subtitle: 'All acts performed on main stage and primary runway',
    buildCost: 0,
    perShowRigging: 0,
    prodScore: 0
  },
  {
    id: 'acoustic_piano_island',
    name: 'Acoustic Piano & Strings Island',
    subtitle: 'Intimate rear-floor circular stage for Act III acoustic & surprise songs',
    buildCost: 28_000,
    perShowRigging: 2_500,
    prodScore: 7
  },
  {
    id: 'hydraulic_rising_cube',
    name: 'Hydraulic 30ft Rising LED Cube',
    subtitle: 'Telescopic glass-and-LED pillar elevating the artist above the arena floor',
    buildCost: 85_000,
    perShowRigging: 7_800,
    prodScore: 13
  },
  {
    id: 'levitation_ring',
    name: 'Kinetic Suspended Halo Platform',
    subtitle: 'Floating aerial ring stage that travels over the crowd during the finale',
    buildCost: 155_000,
    perShowRigging: 14_000,
    prodScore: 18
  }
];

export const ERA_LIGHTING_THEMES: Array<{
  id: EraLightingThemeId;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  glowClass: string;
}> = [
  {
    id: 'crimson_era',
    name: 'Crimson Velvet & Gold',
    primaryHex: '#F43F5E',
    secondaryHex: '#F59E0B',
    glowClass: 'from-rose-500/30 via-amber-500/15 to-transparent'
  },
  {
    id: 'midnight_sapphire',
    name: 'Midnight Sapphire & Cyan',
    primaryHex: '#38BDF8',
    secondaryHex: '#6366F1',
    glowClass: 'from-sky-500/30 via-indigo-500/15 to-transparent'
  },
  {
    id: 'golden_sovereign',
    name: '24K Sovereign Champagne',
    primaryHex: '#FBBF24',
    secondaryHex: '#FEF08A',
    glowClass: 'from-amber-400/30 via-yellow-300/15 to-transparent'
  },
  {
    id: 'emerald_matrix',
    name: 'Cyber Emerald & Neon Lime',
    primaryHex: '#10B981',
    secondaryHex: '#A3E635',
    glowClass: 'from-emerald-500/30 via-lime-400/15 to-transparent'
  },
  {
    id: 'neon_violet',
    name: 'Ultraviolet Synthwave',
    primaryHex: '#C084FC',
    secondaryHex: '#EC4899',
    glowClass: 'from-purple-500/30 via-pink-500/15 to-transparent'
  },
  {
    id: 'prismatic_white',
    name: 'Strobe Titanium Monochrome',
    primaryHex: '#F8FAFC',
    secondaryHex: '#94A3B8',
    glowClass: 'from-zinc-200/30 via-slate-400/15 to-transparent'
  }
];

export const PRESALE_STRATEGIES: Array<{
  id: PresaleStrategyId;
  name: string;
  subtitle: string;
  fanGoodwillBonus: number;
  presaleVelocityMult: number;
  scalperProtectionLabel: string;
}> = [
  {
    id: 'verified_fan_code',
    name: 'Verified Fan Registration Codes',
    subtitle: 'Prioritizes core fans via unique SMS access codes; blocks 94% of scalper bots.',
    fanGoodwillBonus: 1.15,
    presaleVelocityMult: 1.22,
    scalperProtectionLabel: '94% Anti-Bot Shield'
  },
  {
    id: 'sponsor_cardholder_first',
    name: 'VIP & Sponsor Cardholder Early Access',
    subtitle: '48-hour exclusive window for VIP packages and sponsor cardholders before general sale.',
    fanGoodwillBonus: 1.05,
    presaleVelocityMult: 1.3,
    scalperProtectionLabel: 'Tier-1 Revenue Priority'
  },
  {
    id: 'open_general_rush',
    name: 'Instant Global Public Onsale Rush',
    subtitle: 'All tickets drop simultaneously in a massive virtual queue with dynamic surge pricing.',
    fanGoodwillBonus: 0.98,
    presaleVelocityMult: 1.42,
    scalperProtectionLabel: 'High Queue Surge'
  }
];

export const TOUR_SPONSORS: TourSponsorContract[] = [
  {
    id: 'self_funded',
    name: 'Independent Direct Production',
    tagline: '100% independent tour control with zero corporate branding obligations.',
    reqPop: 0,
    upfrontAdvance: 0,
    perShowBonus: 0,
    promoHypeBoost: 0
  },
  {
    id: 'cash_app_visa',
    name: 'Cash App & Visa Presale Live',
    tagline: 'Exclusive cardholder presale marketing + $110K production advance.',
    reqPop: 15,
    upfrontAdvance: 110_000,
    perShowBonus: 7_500,
    promoHypeBoost: 3
  },
  {
    id: 'red_bull_sound',
    name: 'Red Bull Arena Sound Series',
    tagline: 'High-energy festival & arena activation + $280K upfront tour subsidy.',
    reqPop: 35,
    upfrontAdvance: 280_000,
    perShowBonus: 16_500,
    promoHypeBoost: 5
  },
  {
    id: 'bose_apple_music',
    name: 'Bose Spatial & Apple Music Live',
    tagline: 'Global spatial audio livestream sponsorship + $650K stage build grant.',
    reqPop: 58,
    upfrontAdvance: 650_000,
    perShowBonus: 38_000,
    promoHypeBoost: 8
  },
  {
    id: 'amex_platinum_global',
    name: 'American Express Global Stadium Tour',
    tagline: 'Tier-1 global stadium naming rights, VIP lounges + $1.65M upfront advance.',
    reqPop: 78,
    upfrontAdvance: 1_650_000,
    perShowBonus: 85_000,
    promoHypeBoost: 12
  }
];

// ============================================================================
// 2. 26 GLOBAL CITIES & REAL ICONIC 4-TIER VENUES DATABASE (WITH NON-OVERLAPPING OFFSETS)
// ============================================================================

function buildCityVenues(params: {
  club: [string, number];
  theater: [string, number];
  arena: [string, number];
  stadium: [string, number];
  costMult: number;
}): Record<VenueTierId, TourVenueSpec> {
  const { club, theater, arena, stadium, costMult } = params;
  return {
    club: {
      tier: 'club',
      tierLabel: 'Intimate Club',
      venueName: club[0],
      capacity: club[1],
      rentalCost: Math.round(club[1] * 8 * costMult),
      minRecommendedPop: 5,
      baseAcousticRating: 84
    },
    theater: {
      tier: 'theater',
      tierLabel: 'Historic Theater',
      venueName: theater[0],
      capacity: theater[1],
      rentalCost: Math.round(theater[1] * 12 * costMult),
      minRecommendedPop: 22,
      baseAcousticRating: 91
    },
    arena: {
      tier: 'arena',
      tierLabel: 'Major Arena',
      venueName: arena[0],
      capacity: arena[1],
      rentalCost: Math.round(arena[1] * 18 * costMult),
      minRecommendedPop: 48,
      baseAcousticRating: 89
    },
    stadium: {
      tier: 'stadium',
      tierLabel: 'Global Stadium',
      venueName: stadium[0],
      capacity: stadium[1],
      rentalCost: Math.round(stadium[1] * 22 * costMult),
      minRecommendedPop: 75,
      baseAcousticRating: 95
    }
  };
}

export const GLOBAL_TOUR_CITIES: TourCityDefinition[] = [
  // NORTH AMERICA
  {
    id: 'los_angeles',
    city: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    regionLabel: 'North America',
    mapX: 162,
    mapY: 198,
    labelDx: -32,
    labelDy: 14,
    marketMultiplier: 1.42,
    fanPassionBonus: 1.25,
    venues: buildCityVenues({
      club: ['The Troubadour West Hollywood', 1_800],
      theater: ['Greek Theatre Los Angeles', 5_900],
      arena: ['Kia Forum / Crypto.com Arena', 18_500],
      stadium: ['SoFi Stadium Inglewood', 71_500],
      costMult: 1.3
    })
  },
  {
    id: 'chicago',
    city: 'Chicago',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    regionLabel: 'North America',
    mapX: 236,
    mapY: 172,
    labelDx: -24,
    labelDy: -11,
    marketMultiplier: 1.28,
    fanPassionBonus: 1.18,
    venues: buildCityVenues({
      club: ['Metro Chicago', 1_900],
      theater: ['The Chicago Theatre', 5_400],
      arena: ['United Center', 21_500],
      stadium: ['Soldier Field', 63_500],
      costMult: 1.18
    })
  },
  {
    id: 'toronto',
    city: 'Toronto',
    country: 'Canada',
    countryCode: 'CA',
    region: 'north_america',
    regionLabel: 'North America',
    mapX: 262,
    mapY: 156,
    labelDx: 0,
    labelDy: -12,
    marketMultiplier: 1.25,
    fanPassionBonus: 1.22,
    venues: buildCityVenues({
      club: ['History Toronto', 2_500],
      theater: ['Massey Hall', 5_500],
      arena: ['Scotiabank Arena', 19_800],
      stadium: ['Rogers Centre Dome', 54_000],
      costMult: 1.16
    })
  },
  {
    id: 'new_york',
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    regionLabel: 'North America',
    mapX: 282,
    mapY: 176,
    labelDx: 30,
    labelDy: 4,
    marketMultiplier: 1.45,
    fanPassionBonus: 1.28,
    venues: buildCityVenues({
      club: ['Bowery Ballroom NYC', 2_100],
      theater: ['Radio City Music Hall', 6_015],
      arena: ['Madison Square Garden', 20_789],
      stadium: ['MetLife Stadium East Rutherford', 82_500],
      costMult: 1.35
    })
  },
  {
    id: 'atlanta',
    city: 'Atlanta',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    regionLabel: 'North America',
    mapX: 252,
    mapY: 198,
    labelDx: -26,
    labelDy: 12,
    marketMultiplier: 1.26,
    fanPassionBonus: 1.22,
    venues: buildCityVenues({
      club: ['Tabernacle Club Stage', 2_500],
      theater: ['Fox Theatre Atlanta', 5_200],
      arena: ['State Farm Arena', 18_900],
      stadium: ['Mercedes-Benz Stadium', 73_000],
      costMult: 1.15
    })
  },
  {
    id: 'miami',
    city: 'Miami',
    country: 'United States',
    countryCode: 'US',
    region: 'north_america',
    regionLabel: 'North America',
    mapX: 266,
    mapY: 222,
    labelDx: 24,
    labelDy: 12,
    marketMultiplier: 1.32,
    fanPassionBonus: 1.24,
    venues: buildCityVenues({
      club: ['ZeyZey Miami Live', 2_000],
      theater: ['Fillmore Miami Beach', 4_800],
      arena: ['Kaseya Center', 19_600],
      stadium: ['Hard Rock Stadium', 65_300],
      costMult: 1.22
    })
  },
  // LATIN AMERICA
  {
    id: 'mexico_city',
    city: 'Mexico City',
    country: 'Mexico',
    countryCode: 'MX',
    region: 'latin_america',
    regionLabel: 'Latin America',
    mapX: 206,
    mapY: 248,
    labelDx: -32,
    labelDy: 12,
    marketMultiplier: 1.05,
    fanPassionBonus: 1.36,
    venues: buildCityVenues({
      club: ['Auditorio Blackberry', 3_200],
      theater: ['Auditorio Nacional', 9_600],
      arena: ['Palacio de los Deportes', 20_500],
      stadium: ['Estadio GNP Seguros (Foro Sol)', 65_000],
      costMult: 0.92
    })
  },
  {
    id: 'bogota',
    city: 'Bogotá',
    country: 'Colombia',
    countryCode: 'CO',
    region: 'latin_america',
    regionLabel: 'Latin America',
    mapX: 280,
    mapY: 292,
    labelDx: -24,
    labelDy: 12,
    marketMultiplier: 0.94,
    fanPassionBonus: 1.3,
    venues: buildCityVenues({
      club: ['Royal Center Bogotá', 2_600],
      theater: ['Teatro Mayor', 5_400],
      arena: ['Movistar Arena Bogotá', 15_500],
      stadium: ['Estadio El Campín', 48_500],
      costMult: 0.85
    })
  },
  {
    id: 'sao_paulo',
    city: 'São Paulo',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'latin_america',
    regionLabel: 'Latin America',
    mapX: 356,
    mapY: 368,
    labelDx: 30,
    labelDy: 4,
    marketMultiplier: 1.02,
    fanPassionBonus: 1.38,
    venues: buildCityVenues({
      club: ['Cine Joia São Paulo', 2_400],
      theater: ['Espaço Unimed Hall', 8_000],
      arena: ['Ibirapuera Arena', 18_000],
      stadium: ['Allianz Parque / MorumBIS', 67_000],
      costMult: 0.9
    })
  },
  {
    id: 'buenos_aires',
    city: 'Buenos Aires',
    country: 'Argentina',
    countryCode: 'AR',
    region: 'latin_america',
    regionLabel: 'Latin America',
    mapX: 326,
    mapY: 414,
    labelDx: 0,
    labelDy: 15,
    marketMultiplier: 0.95,
    fanPassionBonus: 1.4,
    venues: buildCityVenues({
      club: ['Niceto Club Palermo', 2_200],
      theater: ['Teatro Gran Rex', 6_200],
      arena: ['Movistar Arena BA', 16_500],
      stadium: ['Estadio River Plate (Monumental)', 84_500],
      costMult: 0.85
    })
  },
  // EUROPE
  {
    id: 'london',
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'europe',
    regionLabel: 'Europe',
    mapX: 474,
    mapY: 138,
    labelDx: -28,
    labelDy: -6,
    marketMultiplier: 1.4,
    fanPassionBonus: 1.28,
    venues: buildCityVenues({
      club: ['KOKO Camden / Scala', 2_200],
      theater: ['Royal Albert Hall', 5_850],
      arena: ['The O2 Arena London', 20_000],
      stadium: ['Wembley Stadium', 90_000],
      costMult: 1.32
    })
  },
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    region: 'europe',
    regionLabel: 'Europe',
    mapX: 490,
    mapY: 154,
    labelDx: -24,
    labelDy: 10,
    marketMultiplier: 1.34,
    fanPassionBonus: 1.25,
    venues: buildCityVenues({
      club: ['La Cigale Pigalle', 2_000],
      theater: ["L'Olympia Paris", 5_400],
      arena: ['Accor Arena Bercy', 20_300],
      stadium: ['Stade de France / La Défense', 81_300],
      costMult: 1.26
    })
  },
  {
    id: 'amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    region: 'europe',
    regionLabel: 'Europe',
    mapX: 502,
    mapY: 136,
    labelDx: 0,
    labelDy: -12,
    marketMultiplier: 1.32,
    fanPassionBonus: 1.22,
    venues: buildCityVenues({
      club: ['Paradiso Amsterdam', 1_800],
      theater: ['AFAS Live Hall', 6_000],
      arena: ['Ziggo Dome', 17_000],
      stadium: ['Johan Cruijff ArenA', 56_500],
      costMult: 1.22
    })
  },
  {
    id: 'berlin',
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    region: 'europe',
    regionLabel: 'Europe',
    mapX: 526,
    mapY: 142,
    labelDx: 26,
    labelDy: -4,
    marketMultiplier: 1.3,
    fanPassionBonus: 1.22,
    venues: buildCityVenues({
      club: ['Columbiahalle Berlin', 3_000],
      theater: ['Tempodrom Berlin', 5_600],
      arena: ['Uber Arena Berlin', 17_500],
      stadium: ['Olympiastadion Berlin', 74_400],
      costMult: 1.2
    })
  },
  {
    id: 'stockholm',
    city: 'Stockholm',
    country: 'Sweden',
    countryCode: 'SE',
    region: 'europe',
    regionLabel: 'Europe',
    mapX: 536,
    mapY: 112,
    labelDx: 28,
    labelDy: -6,
    marketMultiplier: 1.34,
    fanPassionBonus: 1.2,
    venues: buildCityVenues({
      club: ['Berns Salonger', 1_900],
      theater: ['Annexet Stockholm', 5_100],
      arena: ['Avicii Arena', 16_500],
      stadium: ['Strawberry Arena (Friends)', 60_000],
      costMult: 1.24
    })
  },
  {
    id: 'madrid',
    city: 'Madrid',
    country: 'Spain',
    countryCode: 'ES',
    region: 'europe',
    regionLabel: 'Europe',
    mapX: 472,
    mapY: 178,
    labelDx: -26,
    labelDy: 13,
    marketMultiplier: 1.22,
    fanPassionBonus: 1.28,
    venues: buildCityVenues({
      club: ['La Riviera Madrid', 2_500],
      theater: ['Palacio Vistalegre', 7_500],
      arena: ['WiZink Center Madrid', 17_450],
      stadium: ['Estadio Santiago Bernabéu', 78_000],
      costMult: 1.14
    })
  },
  {
    id: 'milan',
    city: 'Milan',
    country: 'Italy',
    countryCode: 'IT',
    region: 'europe',
    regionLabel: 'Europe',
    mapX: 516,
    mapY: 168,
    labelDx: 24,
    labelDy: 12,
    marketMultiplier: 1.25,
    fanPassionBonus: 1.26,
    venues: buildCityVenues({
      club: ['Alcatraz Milano', 2_800],
      theater: ['Teatro degli Arcimboldi', 5_200],
      arena: ['Unipol Forum Assago', 15_800],
      stadium: ['Stadio San Siro (Ippodromo)', 75_800],
      costMult: 1.16
    })
  },
  // MIDDLE EAST
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'UAE',
    countryCode: 'AE',
    region: 'middle_east',
    regionLabel: 'Middle East',
    mapX: 632,
    mapY: 226,
    labelDx: 0,
    labelDy: 14,
    marketMultiplier: 1.38,
    fanPassionBonus: 1.18,
    venues: buildCityVenues({
      club: ['Zero Gravity Stage Dubai', 2_200],
      theater: ['Dubai Opera House', 5_200],
      arena: ['Coca-Cola Arena / Etihad Arena', 18_000],
      stadium: ['Zayed Sports City Stadium', 52_000],
      costMult: 1.28
    })
  },
  // EAST & SE ASIA
  {
    id: 'seoul',
    city: 'Seoul',
    country: 'South Korea',
    countryCode: 'KR',
    region: 'asia',
    regionLabel: 'East & SE Asia',
    mapX: 814,
    mapY: 184,
    labelDx: -24,
    labelDy: -10,
    marketMultiplier: 1.32,
    fanPassionBonus: 1.36,
    venues: buildCityVenues({
      club: ['YES24 Live Hall Seoul', 2_500],
      theater: ['Olympic Hall Seoul', 6_200],
      arena: ['KSPO Dome / Inspire Arena', 16_800],
      stadium: ['Goyang / Jamsil Olympic Stadium', 65_500],
      costMult: 1.2
    })
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    region: 'asia',
    regionLabel: 'East & SE Asia',
    mapX: 854,
    mapY: 192,
    labelDx: 26,
    labelDy: -4,
    marketMultiplier: 1.38,
    fanPassionBonus: 1.34,
    venues: buildCityVenues({
      club: ['Zepp Shinjuku / Liquidroom', 2_400],
      theater: ['Nippon Budokan Hall', 9_500],
      arena: ['Saitama Super Arena', 22_500],
      stadium: ['Tokyo Dome / Nissan Stadium', 64_000],
      costMult: 1.25
    })
  },
  {
    id: 'bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    region: 'asia',
    regionLabel: 'East & SE Asia',
    mapX: 756,
    mapY: 254,
    labelDx: -28,
    labelDy: -6,
    marketMultiplier: 1.08,
    fanPassionBonus: 1.35,
    venues: buildCityVenues({
      club: ['Voice Space Bangkok', 2_400],
      theater: ['Union Hall Bangkok', 7_500],
      arena: ['IMPACT Arena Muang Thong Thani', 15_500],
      stadium: ['Rajamangala National Stadium', 58_500],
      costMult: 0.95
    })
  },
  {
    id: 'manila',
    city: 'Manila',
    country: 'Philippines',
    countryCode: 'PH',
    region: 'asia',
    regionLabel: 'East & SE Asia',
    mapX: 818,
    mapY: 256,
    labelDx: 28,
    labelDy: 4,
    marketMultiplier: 1.02,
    fanPassionBonus: 1.38,
    venues: buildCityVenues({
      club: ['New Frontier Theater', 2_800],
      theater: ['Araneta Coliseum', 9_200],
      arena: ['SM Mall of Asia Arena', 16_500],
      stadium: ['Philippine Arena Bulacan', 55_000],
      costMult: 0.9
    })
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    region: 'asia',
    regionLabel: 'East & SE Asia',
    mapX: 768,
    mapY: 292,
    labelDx: -32,
    labelDy: 6,
    marketMultiplier: 1.36,
    fanPassionBonus: 1.3,
    venues: buildCityVenues({
      club: ['Capitol Theatre Singapore', 2_200],
      theater: ['The Star Theatre', 5_400],
      arena: ['Singapore Indoor Stadium', 14_000],
      stadium: ['Singapore National Stadium', 62_000],
      costMult: 1.24
    })
  },
  {
    id: 'jakarta',
    city: 'Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    region: 'asia',
    regionLabel: 'East & SE Asia',
    mapX: 784,
    mapY: 316,
    labelDx: 28,
    labelDy: 12,
    marketMultiplier: 1.04,
    fanPassionBonus: 1.38,
    venues: buildCityVenues({
      club: ['Bengkel Space SCBD', 2_500],
      theater: ['The Kasablanka Hall / Beach City', 6_800],
      arena: ['Indonesia Arena Senayan', 16_500],
      stadium: ['Gelora Bung Karno Main Stadium (GBK)', 77_200],
      costMult: 0.92
    })
  },
  // OCEANIA
  {
    id: 'sydney',
    city: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    region: 'oceania',
    regionLabel: 'Oceania',
    mapX: 882,
    mapY: 392,
    labelDx: 28,
    labelDy: -4,
    marketMultiplier: 1.34,
    fanPassionBonus: 1.25,
    venues: buildCityVenues({
      club: ['Enmore Theatre Sydney', 2_500],
      theater: ['Hordern Pavilion', 5_800],
      arena: ['Qudos Bank Arena', 21_000],
      stadium: ['Accor Stadium Sydney Olympic Park', 81_500],
      costMult: 1.24
    })
  },
  {
    id: 'melbourne',
    city: 'Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    region: 'oceania',
    regionLabel: 'Oceania',
    mapX: 858,
    mapY: 412,
    labelDx: -32,
    labelDy: 12,
    marketMultiplier: 1.32,
    fanPassionBonus: 1.28,
    venues: buildCityVenues({
      club: ['Forum Melbourne', 2_200],
      theater: ['Margaret Court Arena', 7_500],
      arena: ['Rod Laver Arena', 15_800],
      stadium: ['Melbourne Cricket Ground (MCG)', 94_000],
      costMult: 1.22
    })
  }
];

// ============================================================================
// 3. STATE INITIALIZATION & STAGE PRODUCTION EVALUATOR
// ============================================================================

export function createDefaultStageConfig(state?: GameState): TourStageConfig {
  const artistName = state?.artist?.name || 'ARTIST';
  const latestProject = (state?.projects || []).filter(p => p.status === 'released')[0];
  const latestSong = (state?.songs || []).filter(s => s.status === 'released')[0];

  return {
    mainStageId: 'monolith_imax_led',
    runwayId: 'diamond_catwalk',
    bStageId: 'acoustic_piano_island',
    lightingThemeId: 'crimson_era',
    hasPyro: true,
    hasLaserMatrix: true,
    hasPixMobWristbands: true,
    hasDroneSkyShow: false,
    hasLiveBandAndDancers: true,
    stageBannerText: `${artistName.toUpperCase()} • THE ERA WORLD TOUR`,
    backdropCover:
      latestProject?.cover ||
      latestSong?.cover ||
      state?.artist?.image ||
      ''
  };
}

export function ensureWorldTourState(state: GameState): WorldTourState {
  const existing = (state as any).tourState as WorldTourState | undefined;
  if (existing && existing.initialized) {
    return existing;
  }
  return {
    initialized: true,
    vocalStamina: 100,
    draftStageConfig: createDefaultStageConfig(state),
    activeTour: null,
    pastTours: [],
    lifetimeTourGross: 0,
    lifetimeTourAttendance: 0,
    lifetimeShowsPlayed: 0
  };
}

export function evaluateStageArchitectureMetrics(config: TourStageConfig): {
  productionScore: number; // 0 to 100
  upfrontBuildCost: number;
  perShowRiggingCost: number;
  crowdHypeMultiplier: number;
  gradeLabel: string;
} {
  const mainSpec =
    MAIN_STAGE_ARCHITECTURES.find(m => m.id === config.mainStageId) ||
    MAIN_STAGE_ARCHITECTURES[0];
  const runwaySpec =
    RUNWAY_CATWALK_OPTIONS.find(r => r.id === config.runwayId) ||
    RUNWAY_CATWALK_OPTIONS[0];
  const bStageSpec =
    B_STAGE_MODULES.find(b => b.id === config.bStageId) || B_STAGE_MODULES[0];

  let buildCost = mainSpec.buildCost + runwaySpec.buildCost + bStageSpec.buildCost;
  let perShowCost =
    mainSpec.perShowRigging +
    runwaySpec.perShowRigging +
    bStageSpec.perShowRigging;
  let score = mainSpec.prodScore + runwaySpec.prodScore + bStageSpec.prodScore;

  if (config.hasPyro) {
    buildCost += 32_000;
    perShowCost += 6_500;
    score += 7;
  }
  if (config.hasLaserMatrix) {
    buildCost += 40_000;
    perShowCost += 5_500;
    score += 7;
  }
  if (config.hasPixMobWristbands) {
    buildCost += 25_000;
    perShowCost += 8_500;
    score += 6;
  }
  if (config.hasDroneSkyShow) {
    buildCost += 95_000;
    perShowCost += 14_000;
    score += 5;
  }
  if (config.hasLiveBandAndDancers) {
    buildCost += 45_000;
    perShowCost += 11_000;
    score += 8;
  }

  const productionScore = Math.min(100, score);
  const crowdHypeMultiplier = Number((1 + productionScore * 0.0045).toFixed(2));

  const gradeLabel =
    productionScore >= 90
      ? 'S+ Historical Stadium Spectacle'
      : productionScore >= 75
      ? 'A+ Arena/Stadium Blockbuster'
      : productionScore >= 55
      ? 'B+ High-Production Tour'
      : 'Standard Live Production';

  return {
    productionScore,
    upfrontBuildCost: buildCost,
    perShowRiggingCost: perShowCost,
    crowdHypeMultiplier,
    gradeLabel
  };
}

// ============================================================================
// 4. CITY DEMAND, VIRTUAL QUEUE & TICKET ELASTICITY ESTIMATOR
// ============================================================================

export interface TierDemandBreakdownItem {
  zoneId: SeatingZoneId;
  label: string;
  shortLabel: string;
  capacity: number;
  sold: number;
  selloutPct: number;
  price: number;
  gross: number;
  statusLabel: '100% SOLD OUT' | 'FAST SELLING' | 'STEADY DEMAND' | 'PRICE RESISTANCE';
}

export function estimateCityShowDemand(params: {
  state: GameState;
  city: TourCityDefinition;
  venueTier: VenueTierId;
  stageConfig: TourStageConfig;
  nosebleedPrice?: number;
  lowerBowlPrice?: number;
  floorStandingPrice?: number;
  gaPrice: number;
  goldenCirclePrice: number;
  vipPackagePrice: number;
  vipPerks?: TourVipPerksConfig;
  antiScalperExchangeEnabled?: boolean;
  dynamicPlatinumEnabled?: boolean;
  openingActNpcIds: string[];
  nightNumber?: number;
  presaleStrategy?: PresaleStrategyId;
  flashSaleApplied?: boolean;
}): {
  recommendedVenueTier: VenueTierId;
  projectedAttendance: number;
  projectedSelloutPct: number;
  estimatedVirtualQueue: number;
  canAddExtraNight: boolean;
  projectedTicketGross: number;
  projectedMerchGross: number;
  projectedNetProfit: number;
  vipPerksCost: number;
  tierBreakdown: Record<SeatingZoneId, TierDemandBreakdownItem>;
  priceElasticityVerdict:
    | 'Fair Value'
    | 'Underpriced (Instant Sellout)'
    | 'Premium Pricing'
    | 'Overpriced (Resistance)';
} {
  const {
    state,
    city,
    venueTier,
    stageConfig,
    nosebleedPrice,
    lowerBowlPrice,
    floorStandingPrice,
    gaPrice,
    goldenCirclePrice,
    vipPackagePrice,
    vipPerks,
    antiScalperExchangeEnabled = true,
    dynamicPlatinumEnabled = true,
    openingActNpcIds,
    nightNumber = 1,
    presaleStrategy = 'verified_fan_code',
    flashSaleApplied = false
  } = params;

  const venue = city.venues[venueTier];
  const pop = state.popularity || 5;
  const hype = state.hype || 15;
  const fans = state.fans || 500;
  const listeners = state.spotify?.listeners || 1000;

  const recommendedVenueTier: VenueTierId =
    pop >= 72
      ? 'stadium'
      : pop >= 44
      ? 'arena'
      : pop >= 20
      ? 'theater'
      : 'club';

  const openerBoost = openingActNpcIds.reduce((sum, id) => {
    const npc = DETAILED_NPCS.find(n => n.id === id);
    return sum + (npc ? (npc.pop || 40) * 140 : 0);
  }, 0);

  const stageMetrics = evaluateStageArchitectureMetrics(stageConfig);
  const stratSpec =
    PRESALE_STRATEGIES.find(p => p.id === presaleStrategy) ||
    PRESALE_STRATEGIES[0];
  const vipMetrics = evaluateVipPerksMetrics(vipPerks);
  const antiScalperMult = antiScalperExchangeEnabled ? 1.09 : 0.96;
  const flashPriceMult = flashSaleApplied ? 0.8 : 1.0;

  // Resolve all 5 zone prices
  const resolvedNosebleed = Math.round(
    (nosebleedPrice ?? Math.max(25, Math.round(gaPrice * 0.65))) * flashPriceMult
  );
  const resolvedLowerBowl = Math.round(
    (lowerBowlPrice ?? Math.max(45, Math.round(gaPrice * 1.08))) * flashPriceMult
  );
  const resolvedFloor = Math.round(
    (floorStandingPrice ?? Math.max(55, Math.round(gaPrice * 1.32))) * flashPriceMult
  );
  const resolvedGC = Math.round(goldenCirclePrice * flashPriceMult);
  const resolvedVIP = Math.round(vipPackagePrice * flashPriceMult);

  const pricesByZone: Record<SeatingZoneId, number> = {
    nosebleed: resolvedNosebleed,
    lower_bowl: resolvedLowerBowl,
    floor_standing: resolvedFloor,
    golden_circle: resolvedGC,
    vip_package: resolvedVIP
  };

  // Base city demand pool (how many fans in this city want to buy tickets)
  const rawCityDraw =
    (Math.pow(Math.max(4, pop), 1.92) * 32 +
      hype * 140 +
      Math.sqrt(fans) * 18 +
      Math.sqrt(listeners) * 3.8 +
      openerBoost) *
    city.fanPassionBonus *
    stageMetrics.crowdHypeMultiplier *
    stratSpec.fanGoodwillBonus *
    antiScalperMult *
    (flashSaleApplied ? 1.24 : 1.0);

  const multiNightFactor = Math.max(0.55, 1 - (nightNumber - 1) * 0.11);
  const benchmarkBase = Math.round((38 + pop * 1.45) * city.marketMultiplier);

  const tierBreakdown = {} as Record<SeatingZoneId, TierDemandBreakdownItem>;
  let totalProjectedAttendance = 0;
  let totalProjectedTicketGross = 0;

  SEATING_ZONES_SPEC.forEach(zone => {
    const zoneCap = Math.max(10, Math.round(venue.capacity * zone.capacityShare));
    const zonePrice = pricesByZone[zone.id];

    // Benchmark fair price for this specific stadium ring
    const zoneBenchmark =
      zone.id === 'vip_package'
        ? Math.round(benchmarkBase * zone.benchmarkMult + vipMetrics.perceivedValueBonus)
        : Math.round(benchmarkBase * zone.benchmarkMult);

    const ratio = zonePrice / Math.max(15, zoneBenchmark);
    let zoneElasticity = 1.0;
    if (ratio < 0.85) {
      zoneElasticity = 1.28;
    } else if (ratio <= 1.18) {
      zoneElasticity = 1.06;
    } else if (ratio <= 1.45) {
      zoneElasticity = 0.85;
    } else {
      zoneElasticity = Math.max(0.28, 1.38 - ratio * 0.68);
    }

    if (zone.id === 'vip_package') {
      zoneElasticity *= vipMetrics.demandBoostMult;
    }

    const rawZoneDemand = Math.round(
      rawCityDraw * zone.capacityShare * multiNightFactor * zoneElasticity
    );
    const zoneSold = Math.min(
      zoneCap,
      Math.max(Math.round(zoneCap * 0.18), rawZoneDemand)
    );
    const zoneSelloutPct = Math.min(100, Math.round((zoneSold / zoneCap) * 100));

    // Official Platinum dynamic surge applies to Lower Bowl, Floor, and Golden Circle when demand >= 85%
    const platinumMult =
      dynamicPlatinumEnabled &&
      zoneSelloutPct >= 85 &&
      (zone.id === 'lower_bowl' ||
        zone.id === 'floor_standing' ||
        zone.id === 'golden_circle')
        ? 1.18
        : 1.0;

    const zoneGross = Math.round(zoneSold * zonePrice * platinumMult);
    const statusLabel: TierDemandBreakdownItem['statusLabel'] =
      zoneSelloutPct >= 99
        ? '100% SOLD OUT'
        : zoneSelloutPct >= 80
        ? 'FAST SELLING'
        : zoneSelloutPct >= 52
        ? 'STEADY DEMAND'
        : 'PRICE RESISTANCE';

    tierBreakdown[zone.id] = {
      zoneId: zone.id,
      label: zone.label,
      shortLabel: zone.shortLabel,
      capacity: zoneCap,
      sold: zoneSold,
      selloutPct: zoneSelloutPct,
      price: zonePrice,
      gross: zoneGross,
      statusLabel
    };

    totalProjectedAttendance += zoneSold;
    totalProjectedTicketGross += zoneGross;
  });

  const projectedAttendance = Math.min(venue.capacity, totalProjectedAttendance);
  const projectedSelloutPct = Math.min(
    100,
    Math.round((projectedAttendance / venue.capacity) * 100)
  );

  const weightedAvgTicket =
    resolvedNosebleed * 0.28 +
    resolvedLowerBowl * 0.3 +
    resolvedFloor * 0.22 +
    resolvedGC * 0.14 +
    resolvedVIP * 0.06;
  const benchmarkWeighted = benchmarkBase * 1.38;
  const priceRatio = weightedAvgTicket / Math.max(20, benchmarkWeighted);

  let priceElasticityVerdict:
    | 'Fair Value'
    | 'Underpriced (Instant Sellout)'
    | 'Premium Pricing'
    | 'Overpriced (Resistance)' = 'Fair Value';

  if (priceRatio < 0.85) {
    priceElasticityVerdict = 'Underpriced (Instant Sellout)';
  } else if (priceRatio <= 1.2) {
    priceElasticityVerdict = 'Fair Value';
  } else if (priceRatio <= 1.5) {
    priceElasticityVerdict = 'Premium Pricing';
  } else {
    priceElasticityVerdict = 'Overpriced (Resistance)';
  }

  const estimatedVirtualQueue = Math.max(
    projectedAttendance,
    Math.round(rawCityDraw * multiNightFactor * 1.32)
  );

  const canAddExtraNight =
    projectedSelloutPct >= 95 &&
    rawCityDraw * multiNightFactor >= venue.capacity * 1.05 &&
    nightNumber < 4;

  const merchSpendPerHead = Math.round(
    (12 + pop * 0.18) * city.marketMultiplier * city.fanPassionBonus
  );
  const projectedMerchGross = projectedAttendance * merchSpendPerHead;

  const vipPerksCost =
    tierBreakdown.vip_package.sold * vipMetrics.costPerVipFan;
  const promoterCut = Math.round(totalProjectedTicketGross * 0.14);
  const projectedExpenses =
    venue.rentalCost +
    stageMetrics.perShowRiggingCost +
    promoterCut +
    vipPerksCost;
  const rawProjectedNet =
    totalProjectedTicketGross + projectedMerchGross - projectedExpenses;
  const promoterGuaranteeFloor = Math.round(
    (totalProjectedTicketGross + projectedMerchGross) * 0.25
  );
  const projectedNetProfit = Math.max(promoterGuaranteeFloor, rawProjectedNet);

  return {
    recommendedVenueTier,
    projectedAttendance,
    projectedSelloutPct,
    estimatedVirtualQueue,
    canAddExtraNight,
    projectedTicketGross: totalProjectedTicketGross,
    projectedMerchGross,
    projectedNetProfit,
    vipPerksCost,
    tierBreakdown,
    priceElasticityVerdict
  };
}

// ============================================================================
// 5. LAUNCH WORLD TOUR (WITH CUSTOM KICKOFF DATE & 5-TIER PRESALE ENGINE)
// ============================================================================

export function launchNewWorldTour(params: {
  state: GameState;
  title: string;
  eraProjectId: number | null;
  kickoffDate?: string;
  daysBetweenShows?: number;
  presaleStrategy?: PresaleStrategyId;
  customBannerUrl?: string;
  stageConfig: TourStageConfig;
  setlist: TourSetlistConfig;
  openingActNpcIds: string[];
  sponsorId: string;
  nosebleedPrice?: number;
  lowerBowlPrice?: number;
  floorStandingPrice?: number;
  gaPrice: number;
  goldenCirclePrice: number;
  vipPackagePrice: number;
  vipPerks?: TourVipPerksConfig;
  antiScalperExchangeEnabled?: boolean;
  dynamicPlatinumEnabled: boolean;
  selectedStops: Array<{
    cityId: string;
    venueTier: VenueTierId;
    customDate?: string;
  }>;
}): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const {
    state,
    title,
    eraProjectId,
    kickoffDate,
    daysBetweenShows = 3,
    presaleStrategy = 'verified_fan_code',
    customBannerUrl,
    stageConfig,
    setlist,
    openingActNpcIds,
    sponsorId,
    nosebleedPrice,
    lowerBowlPrice,
    floorStandingPrice,
    gaPrice,
    goldenCirclePrice,
    vipPackagePrice,
    vipPerks = DEFAULT_VIP_PERKS,
    antiScalperExchangeEnabled = true,
    dynamicPlatinumEnabled,
    selectedStops
  } = params;

  const cooldownStatus = evaluateTourCooldownStatus(state);
  if (cooldownStatus.isOnCooldown) {
    return {
      success: false,
      error: `Post-Tour Recovery Cooldown active: ${cooldownStatus.daysRemaining} days of mandatory rest remaining (Available on ${cooldownStatus.cooldownEndDate}).`,
      updatedState: state
    };
  }

  if (!title.trim()) {
    return {
      success: false,
      error: 'Please enter an official title for your World Tour.',
      updatedState: state
    };
  }

  if (selectedStops.length === 0) {
    return {
      success: false,
      error: 'Select at least 1 city on the World Map to build your tour routing.',
      updatedState: state
    };
  }

  const allSetlistSongs = [
    ...setlist.act1SongIds,
    ...setlist.act2SongIds,
    ...setlist.act3SongIds,
    ...setlist.act4SongIds
  ];
  if (allSetlistSongs.length === 0) {
    return {
      success: false,
      error: 'Add at least 1 released song to your Era Setlist before launching.',
      updatedState: state
    };
  }

  const sponsor =
    TOUR_SPONSORS.find(s => s.id === sponsorId) || TOUR_SPONSORS[0];
  const stageMetrics = evaluateStageArchitectureMetrics(stageConfig);
  const netUpfrontCost = stageMetrics.upfrontBuildCost - sponsor.upfrontAdvance;

  if (netUpfrontCost > 0 && state.money < netUpfrontCost) {
    return {
      success: false,
      error: `Insufficient funds for Stage Fabrication ($${formatNumFull(
        netUpfrontCost
      )} required after Sponsor Advance).`,
      updatedState: state
    };
  }

  const tourState = ensureWorldTourState(state);
  const currentGameDate = new Date(state.date);
  const defaultKickoff = new Date(currentGameDate);
  defaultKickoff.setDate(defaultKickoff.getDate() + 10);

  const parsedKickoff = kickoffDate
    ? new Date(`${kickoffDate}T00:00:00`)
    : defaultKickoff;
  const safeKickoffDate =
    !isNaN(parsedKickoff.getTime()) && parsedKickoff >= currentGameDate
      ? parsedKickoff
      : defaultKickoff;

  const eraProject = (state.projects || []).find(p => p.id === eraProjectId);
  const artistName = state.artist?.name || 'Artist';
  const stratSpec =
    PRESALE_STRATEGIES.find(p => p.id === presaleStrategy) ||
    PRESALE_STRATEGIES[0];

  const resolvedNosebleed =
    nosebleedPrice ?? Math.max(25, Math.round(gaPrice * 0.65));
  const resolvedLowerBowl =
    lowerBowlPrice ?? Math.max(45, Math.round(gaPrice * 1.08));
  const resolvedFloor =
    floorStandingPrice ?? Math.max(55, Math.round(gaPrice * 1.32));

  const builtStops: TourStopItem[] = selectedStops.map((sel, index) => {
    const cityDef =
      GLOBAL_TOUR_CITIES.find(c => c.id === sel.cityId) ||
      GLOBAL_TOUR_CITIES[0];
    const venueSpec = cityDef.venues[sel.venueTier];

    let showDateStr = sel.customDate;
    if (!showDateStr) {
      const showDate = new Date(safeKickoffDate);
      showDate.setDate(
        showDate.getDate() + index * Math.max(1, daysBetweenShows)
      );
      showDateStr = showDate.toISOString().split('T')[0];
    }

    const demandEst = estimateCityShowDemand({
      state,
      city: cityDef,
      venueTier: sel.venueTier,
      stageConfig,
      nosebleedPrice: resolvedNosebleed,
      lowerBowlPrice: resolvedLowerBowl,
      floorStandingPrice: resolvedFloor,
      gaPrice,
      goldenCirclePrice,
      vipPackagePrice,
      vipPerks,
      antiScalperExchangeEnabled,
      dynamicPlatinumEnabled,
      openingActNpcIds,
      nightNumber: 1,
      presaleStrategy
    });

    // Day-1 initial Fan Club Presale rush (38% to 75% of projected attendance sold on announcement day!)
    const initialPresaleFraction = Math.min(
      0.94,
      0.4 * stratSpec.presaleVelocityMult * (antiScalperExchangeEnabled ? 1.06 : 0.96)
    );
    const initialPresaleSold = Math.min(
      venueSpec.capacity,
      Math.round(demandEst.projectedAttendance * initialPresaleFraction)
    );
    const initialPresalePct = Math.min(
      100,
      Math.round((initialPresaleSold / venueSpec.capacity) * 100)
    );
    const avgTicketPrice = Math.round(
      resolvedNosebleed * 0.28 +
        resolvedLowerBowl * 0.3 +
        resolvedFloor * 0.22 +
        goldenCirclePrice * 0.14 +
        vipPackagePrice * 0.06
    );

    const tierSelloutPcts: Record<SeatingZoneId, number> = {
      nosebleed: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.nosebleed.selloutPct * initialPresaleFraction)
      ),
      lower_bowl: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.lower_bowl.selloutPct * initialPresaleFraction)
      ),
      floor_standing: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.floor_standing.selloutPct * initialPresaleFraction)
      ),
      golden_circle: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.golden_circle.selloutPct * Math.min(1, initialPresaleFraction * 1.18))
      ),
      vip_package: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.vip_package.selloutPct * Math.min(1, initialPresaleFraction * 1.24))
      )
    };

    return {
      id: `stop_${Date.now()}_${index}`,
      stopNumber: index + 1,
      cityId: cityDef.id,
      cityName: cityDef.city,
      countryCode: cityDef.countryCode,
      region: cityDef.region,
      venueTier: sel.venueTier,
      venueName: venueSpec.venueName,
      capacity: venueSpec.capacity,
      nightNumber: 1,
      scheduledDate: showDateStr,
      status: 'scheduled',
      projectedSelloutPct: demandEst.projectedSelloutPct,
      canAddExtraNight: demandEst.canAddExtraNight,
      presalePhase:
        initialPresalePct >= 100
          ? 'sold_out'
          : presaleStrategy === 'sponsor_cardholder_first'
          ? 'sponsor_presale'
          : 'fan_presale',
      presaleTicketsSold: initialPresaleSold,
      presaleSelloutPct: initialPresalePct,
      virtualQueueCount: demandEst.estimatedVirtualQueue,
      presaleRevenueCollected: initialPresaleSold * avgTicketPrice,
      productionHoldUnlocked: false,
      flashSaleApplied: false,
      selloutAlertPosted: initialPresalePct >= 100,
      tierSelloutPcts
    };
  });

  const totalDay1Queue = builtStops.reduce(
    (s, st) => s + st.virtualQueueCount,
    0
  );
  const totalDay1PresaleSold = builtStops.reduce(
    (s, st) => s + st.presaleTicketsSold,
    0
  );

  const resolvedBanner =
    (customBannerUrl && customBannerUrl.trim()) ||
    (stageConfig.customBannerUrl && stageConfig.customBannerUrl.trim()) ||
    stageConfig.backdropCover ||
    eraProject?.cover ||
    state.artist?.image ||
    '';

  const newTour: ActiveWorldTour = {
    id: `tour_${Date.now()}`,
    title: title.trim(),
    eraProjectId,
    eraProjectTitle: eraProject?.title || 'Career Anthology Era',
    coverArt: resolvedBanner,
    customBannerUrl: resolvedBanner,
    status: 'active',
    announcedDate: state.date.split('T')[0],
    kickoffDate:
      builtStops[0]?.scheduledDate ||
      safeKickoffDate.toISOString().split('T')[0],
    daysBetweenShows,
    presaleStrategy,
    fansFirstBlastSent: false,
    stageConfig: {
      ...stageConfig,
      customBannerUrl: resolvedBanner,
      backdropCover: resolvedBanner || stageConfig.backdropCover
    },
    setlist,
    openingActNpcIds,
    sponsorId: sponsor.id,
    nosebleedPrice: resolvedNosebleed,
    lowerBowlPrice: resolvedLowerBowl,
    floorStandingPrice: resolvedFloor,
    gaPrice,
    goldenCirclePrice,
    vipPackagePrice,
    vipPerks,
    antiScalperExchangeEnabled,
    dynamicPlatinumEnabled,
    stops: builtStops,
    totalShowsCompleted: 0,
    totalAttendance: 0,
    totalTicketGross: 0,
    totalMerchBoothGross: 0,
    totalSponsorGross: sponsor.upfrontAdvance,
    totalExpenses: stageMetrics.upfrontBuildCost,
    totalNetProfit: sponsor.upfrontAdvance - stageMetrics.upfrontBuildCost
  };

  const launchTweet: XPost = {
    id: `tour_announce_${Date.now()}`,
    authorName: 'Touring Data',
    authorHandle: '@TouringData',
    authorAvatar: state.artist?.image || newTour.coverArt,
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    timeAgo: 'Just now',
    dateCreated: state.date,
    content: `🚨 OFFICIAL TOUR POSTER & PRESALE ALERT: ${artistName} unveils "${
      newTour.title
    }" kicking off ${newTour.kickoffDate} across ${
      builtStops.length
    } global dates! Over ${formatNumFull(
      totalDay1Queue
    )} fans joined the Verified Fan Virtual Queue on Day 1 (${formatNumFull(
      totalDay1PresaleSold
    )} presale tickets already claimed).`,
    image: newTour.customBannerUrl || newTour.coverArt,
    mediaBadge: `${builtStops.length} DATES • OFFICIAL TOUR BANNER`,
    mediaTitle: `${artistName} — ${newTour.title}`,
    mediaSubtitle: `Kickoff: ${newTour.kickoffDate} • Stage Spec: ${stageMetrics.productionScore}/100`,
    likes: Math.round(22_000 + (state.popularity || 10) * 2_400),
    reposts: Math.round(5_400 + (state.popularity || 10) * 620),
    replies: Math.round(1_150 + (state.popularity || 10) * 160),
    views: Math.round(185_000 + (state.popularity || 10) * 22_000),
    daysOld: 0
  };

  const updatedTourState: WorldTourState = {
    ...tourState,
    vocalStamina: 100,
    draftStageConfig: stageConfig,
    activeTour: newTour
  };

  const updatedState: GameState = {
    ...state,
    money: state.money - netUpfrontCost,
    hype: Math.min(100, (state.hype || 15) + 4 + sponsor.promoHypeBoost),
    xPosts: [launchTweet, ...(state.xPosts || [])].slice(0, 120),
    ...({ tourState: updatedTourState } as any)
  };

  return {
    success: true,
    updatedState
  };
}

// ============================================================================
// 6. INTERACTIVE PRESALE & SCHEDULING ACTIONS
// ============================================================================

/**
 * Sends a Spotify Fans First & Verified Fan Code Blast to accelerate presale ticket velocity across all scheduled stops.
 */
export function triggerVerifiedFanPresaleBlast(state: GameState): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const tourState = ensureWorldTourState(state);
  const activeTour = tourState.activeTour;
  if (!activeTour) {
    return { success: false, error: 'No active tour.', updatedState: state };
  }
  if (activeTour.fansFirstBlastSent) {
    return {
      success: false,
      error: 'Verified Fan Presale Code Blast has already been dispatched for this tour.',
      updatedState: state
    };
  }

  const avgTicketPrice = Math.round(
    activeTour.gaPrice * 0.68 +
      activeTour.goldenCirclePrice * 0.22 +
      activeTour.vipPackagePrice * 0.1
  );

  const updatedStops = activeTour.stops.map(st => {
    if (st.status !== 'scheduled') return st;
    const boostTickets = Math.round(st.capacity * 0.16);
    const nextSold = Math.min(
      st.capacity,
      (st.presaleTicketsSold || 0) + boostTickets
    );
    const nextPct = Math.min(100, Math.round((nextSold / st.capacity) * 100));
    return {
      ...st,
      presaleTicketsSold: nextSold,
      presaleSelloutPct: nextPct,
      projectedSelloutPct: Math.max(st.projectedSelloutPct, nextPct),
      canAddExtraNight: nextPct >= 95 && st.nightNumber < 4,
      presalePhase:
        nextPct >= 100 ? ('sold_out' as const) : ('general_onsale' as const),
      presaleRevenueCollected: nextSold * avgTicketPrice
    };
  });

  const updatedTour: ActiveWorldTour = {
    ...activeTour,
    fansFirstBlastSent: true,
    stops: updatedStops
  };

  return {
    success: true,
    updatedState: {
      ...state,
      hype: Math.min(100, (state.hype || 15) + 2.5),
      ...({
        tourState: {
          ...tourState,
          activeTour: updatedTour
        }
      } as any)
    }
  };
}

/**
 * Unlocks Production-Hold / Side-Stage Nosebleed Seats (+8% extra venue capacity) on a sold-out or near-sold-out stop.
 */
export function unlockProductionHoldSeats(
  state: GameState,
  stopId: string
): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const tourState = ensureWorldTourState(state);
  const activeTour = tourState.activeTour;
  if (!activeTour) {
    return { success: false, error: 'No active tour.', updatedState: state };
  }

  const idx = activeTour.stops.findIndex(s => s.id === stopId);
  if (idx === -1) {
    return { success: false, error: 'Stop not found.', updatedState: state };
  }

  const target = activeTour.stops[idx];
  if (target.productionHoldUnlocked) {
    return {
      success: false,
      error: 'Production-hold seats already released for this date.',
      updatedState: state
    };
  }

  const extraSeats = Math.round(target.capacity * 0.085);
  const newCap = target.capacity + extraSeats;
  const newPresaleSold = Math.min(
    newCap,
    (target.presaleTicketsSold || 0) + Math.round(extraSeats * 0.92)
  );
  const avgTicketPrice = Math.round(
    activeTour.gaPrice * 0.68 +
      activeTour.goldenCirclePrice * 0.22 +
      activeTour.vipPackagePrice * 0.1
  );

  const updatedStop: TourStopItem = {
    ...target,
    capacity: newCap,
    presaleTicketsSold: newPresaleSold,
    presaleSelloutPct: Math.min(100, Math.round((newPresaleSold / newCap) * 100)),
    presaleRevenueCollected: newPresaleSold * avgTicketPrice,
    productionHoldUnlocked: true
  };

  const newStops = [...activeTour.stops];
  newStops[idx] = updatedStop;

  return {
    success: true,
    updatedState: {
      ...state,
      ...({
        tourState: {
          ...tourState,
          activeTour: {
            ...activeTour,
            stops: newStops
          }
        }
      } as any)
    }
  };
}

/**
 * Reschedules a scheduled stop's date (lets player adjust dates anytime before the show is played).
 */
export function rescheduleTourStopDate(
  state: GameState,
  stopId: string,
  newDateStr: string
): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const tourState = ensureWorldTourState(state);
  const activeTour = tourState.activeTour;
  if (!activeTour) {
    return { success: false, error: 'No active tour.', updatedState: state };
  }

  const idx = activeTour.stops.findIndex(s => s.id === stopId);
  if (idx === -1) {
    return { success: false, error: 'Stop not found.', updatedState: state };
  }

  const newStops = [...activeTour.stops];
  newStops[idx] = {
    ...newStops[idx],
    scheduledDate: newDateStr
  };

  return {
    success: true,
    updatedState: {
      ...state,
      ...({
        tourState: {
          ...tourState,
          activeTour: {
            ...activeTour,
            stops: newStops
          }
        }
      } as any)
    }
  };
}

/**
 * Adds an Extra Sold-Out Night (Night 2 / Night 3 Residency) immediately after a high-demand scheduled stop.
 */
export function addSoldOutExtraNightToTour(
  state: GameState,
  stopId: string
): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const tourState = ensureWorldTourState(state);
  const activeTour = tourState.activeTour;
  if (!activeTour) {
    return { success: false, error: 'No active tour.', updatedState: state };
  }

  const targetIndex = activeTour.stops.findIndex(s => s.id === stopId);
  if (targetIndex === -1) {
    return { success: false, error: 'Stop not found.', updatedState: state };
  }

  const targetStop = activeTour.stops[targetIndex];
  if (!targetStop.canAddExtraNight) {
    return {
      success: false,
      error: 'Additional date threshold not reached for this city.',
      updatedState: state
    };
  }

  const cityDef =
    GLOBAL_TOUR_CITIES.find(c => c.id === targetStop.cityId) ||
    GLOBAL_TOUR_CITIES[0];
  const nextNightNumber = targetStop.nightNumber + 1;

  const nextDemand = estimateCityShowDemand({
    state,
    city: cityDef,
    venueTier: targetStop.venueTier,
    stageConfig: activeTour.stageConfig,
    gaPrice: activeTour.gaPrice,
    goldenCirclePrice: activeTour.goldenCirclePrice,
    vipPackagePrice: activeTour.vipPackagePrice,
    openingActNpcIds: activeTour.openingActNpcIds,
    nightNumber: nextNightNumber,
    presaleStrategy: activeTour.presaleStrategy
  });

  const baseShowDate = new Date(targetStop.scheduledDate);
  baseShowDate.setDate(baseShowDate.getDate() + 1);

  const initialExtraPresale = Math.min(
    targetStop.capacity,
    Math.round(nextDemand.projectedAttendance * 0.55)
  );
  const initialExtraPct = Math.min(
    100,
    Math.round((initialExtraPresale / targetStop.capacity) * 100)
  );
  const avgTicketPrice = Math.round(
    activeTour.gaPrice * 0.68 +
      activeTour.goldenCirclePrice * 0.22 +
      activeTour.vipPackagePrice * 0.1
  );

  const extraStop: TourStopItem = {
    ...targetStop,
    id: `stop_extra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    nightNumber: nextNightNumber,
    scheduledDate: baseShowDate.toISOString().split('T')[0],
    status: 'scheduled',
    projectedSelloutPct: nextDemand.projectedSelloutPct,
    canAddExtraNight: nextDemand.canAddExtraNight,
    presalePhase: 'fan_presale',
    presaleTicketsSold: initialExtraPresale,
    presaleSelloutPct: initialExtraPct,
    virtualQueueCount: nextDemand.estimatedVirtualQueue,
    presaleRevenueCollected: initialExtraPresale * avgTicketPrice,
    productionHoldUnlocked: false
  };

  const updatedOriginal: TourStopItem = {
    ...targetStop,
    canAddExtraNight: false
  };

  const newStops = [...activeTour.stops];
  newStops[targetIndex] = updatedOriginal;
  newStops.splice(targetIndex + 1, 0, extraStop);

  const reindexedStops = newStops.map((st, idx) => {
    if (idx > targetIndex + 1 && st.status === 'scheduled') {
      const shifted = new Date(st.scheduledDate);
      shifted.setDate(shifted.getDate() + 1);
      return {
        ...st,
        stopNumber: idx + 1,
        scheduledDate: shifted.toISOString().split('T')[0]
      };
    }
    return {
      ...st,
      stopNumber: idx + 1
    };
  });

  const updatedTour: ActiveWorldTour = {
    ...activeTour,
    stops: reindexedStops
  };

  return {
    success: true,
    updatedState: {
      ...state,
      hype: Math.min(100, (state.hype || 15) + 1.5),
      ...({
        tourState: {
          ...tourState,
          activeTour: updatedTour
        }
      } as any)
    }
  };
}

/**
 * Restores +32% Vocal & Physical Stamina using tour medical / vocal coach recovery ($12,500).
 */
export function purchaseTourVocalRecovery(state: GameState): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const cost = 12_500;
  if (state.money < cost) {
    return {
      success: false,
      error: 'Insufficient funds ($12,500 required for Vocal & IV Recovery Team).',
      updatedState: state
    };
  }
  const tourState = ensureWorldTourState(state);
  return {
    success: true,
    updatedState: {
      ...state,
      money: state.money - cost,
      ...({
        tourState: {
          ...tourState,
          vocalStamina: Math.min(100, tourState.vocalStamina + 32)
        }
      } as any)
    }
  };
}

/**
 * Updates the custom uploaded Tour Banner on both the draft Stage Config and any Active World Tour,
 * so future @TouringData X boxscore posts immediately include the player's uploaded banner.
 */
export function updateActiveTourBanner(
  state: GameState,
  bannerUrl: string
): GameState {
  const tourState = ensureWorldTourState(state);
  const cleanBanner = bannerUrl.trim();
  const nextDraft: TourStageConfig = {
    ...tourState.draftStageConfig,
    customBannerUrl: cleanBanner,
    backdropCover: cleanBanner || tourState.draftStageConfig.backdropCover
  };

  const nextActive: ActiveWorldTour | null = tourState.activeTour
    ? {
        ...tourState.activeTour,
        coverArt: cleanBanner || tourState.activeTour.coverArt,
        customBannerUrl: cleanBanner,
        stageConfig: {
          ...tourState.activeTour.stageConfig,
          customBannerUrl: cleanBanner,
          backdropCover:
            cleanBanner || tourState.activeTour.stageConfig.backdropCover
        }
      }
    : null;

  return {
    ...state,
    ...({
      tourState: {
        ...tourState,
        draftStageConfig: nextDraft,
        activeTour: nextActive
      }
    } as any)
  };
}

/**
 * Publishes an official @TouringData Tour Banner / Boxscore Bulletin post directly to X with the player's uploaded Tour Banner.
 */
export function shareTourBannerPromoToX(
  state: GameState,
  bannerOverride?: string,
  tourTitleOverride?: string
): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const tourState = ensureWorldTourState(state);
  const activeTour = tourState.activeTour;
  const artistName = state.artist?.name || 'Artist';

  const bannerImg =
    bannerOverride ||
    activeTour?.customBannerUrl ||
    activeTour?.coverArt ||
    tourState.draftStageConfig.customBannerUrl ||
    tourState.draftStageConfig.backdropCover ||
    state.artist?.image ||
    '';

  if (!bannerImg) {
    return {
      success: false,
      error: 'Please upload or select a Tour Banner image first.',
      updatedState: state
    };
  }

  const resolvedTitle =
    tourTitleOverride ||
    activeTour?.title ||
    `The ${artistName} Era World Tour`;

  const postContent = activeTour
    ? `📸 OFFICIAL TOUR REPORT: ${artistName}'s "${
        activeTour.title
      }" Official Tour Banner & Boxscore Update — ${
        activeTour.totalShowsCompleted
      }/${activeTour.stops.length} dates completed, ${formatNumFull(
        activeTour.totalAttendance
      )} tickets sold & $${formatNumFull(
        activeTour.totalTicketGross + activeTour.totalMerchBoothGross
      )} total gross!`
    : `✨ OFFICIAL TOUR POSTER REVEAL: ${artistName} unveils the official tour banner for "${resolvedTitle}"! Verified Fan Presale & Stadium Routing coming soon.`;

  const promoTweet: XPost = {
    id: `tour_banner_x_${Date.now()}`,
    authorName: 'Touring Data',
    authorHandle: '@TouringData',
    authorAvatar: state.artist?.image || bannerImg,
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    timeAgo: 'Just now',
    dateCreated: state.date,
    content: postContent,
    image: bannerImg,
    mediaBadge: activeTour
      ? `${activeTour.stops.length} DATES • OFFICIAL TOUR BANNER`
      : 'OFFICIAL TOUR POSTER REVEAL',
    mediaTitle: `${artistName} — ${resolvedTitle}`,
    mediaSubtitle: activeTour
      ? `Kickoff: ${activeTour.kickoffDate} • Gross: $${formatNumFull(
          activeTour.totalTicketGross
        )}`
      : `Stage Spec: ${
          evaluateStageArchitectureMetrics(tourState.draftStageConfig)
            .productionScore
        }/100`,
    likes: Math.round(19_500 + (state.popularity || 10) * 2_100),
    reposts: Math.round(4_800 + (state.popularity || 10) * 540),
    replies: Math.round(980 + (state.popularity || 10) * 140),
    views: Math.round(165_000 + (state.popularity || 10) * 19_500),
    daysOld: 0
  };

  return {
    success: true,
    updatedState: {
      ...state,
      hype: Math.min(100, (state.hype || 15) + 1.5),
      xPosts: [promoTweet, ...(state.xPosts || [])].slice(0, 120)
    }
  };
}

/**
 * Triggers a Last-Minute Flash Price Drop (-20% off remaining tickets) on a scheduled stop,
 * surging ticket claims by +22% of venue capacity and updating all 5 seating zones.
 */
export function triggerFlashSalePriceDrop(
  state: GameState,
  stopId: string
): {
  success: boolean;
  error?: string;
  updatedState: GameState;
} {
  const tourState = ensureWorldTourState(state);
  const activeTour = tourState.activeTour;
  if (!activeTour) {
    return { success: false, error: 'No active tour.', updatedState: state };
  }

  const idx = activeTour.stops.findIndex(s => s.id === stopId);
  if (idx === -1) {
    return { success: false, error: 'Stop not found.', updatedState: state };
  }

  const target = activeTour.stops[idx];
  if (target.status !== 'scheduled') {
    return {
      success: false,
      error: 'Show has already been completed.',
      updatedState: state
    };
  }
  if (target.flashSaleApplied) {
    return {
      success: false,
      error: 'Flash Price Drop has already been activated for this show.',
      updatedState: state
    };
  }

  const boostSeats = Math.round(target.capacity * 0.22);
  const nextSold = Math.min(
    target.capacity,
    (target.presaleTicketsSold || 0) + boostSeats
  );
  const nextPct = Math.min(100, Math.round((nextSold / target.capacity) * 100));

  const discountedAvgPrice = Math.round(
    (activeTour.gaPrice * 0.68 +
      activeTour.goldenCirclePrice * 0.22 +
      activeTour.vipPackagePrice * 0.1) *
      0.86
  );

  const prevTiers = target.tierSelloutPcts || {
    nosebleed: nextPct,
    lower_bowl: nextPct,
    floor_standing: nextPct,
    golden_circle: nextPct,
    vip_package: nextPct
  };

  const nextTiers: Record<SeatingZoneId, number> = {
    nosebleed: Math.min(100, prevTiers.nosebleed + 26),
    lower_bowl: Math.min(100, prevTiers.lower_bowl + 22),
    floor_standing: Math.min(100, prevTiers.floor_standing + 20),
    golden_circle: Math.min(100, prevTiers.golden_circle + 16),
    vip_package: Math.min(100, prevTiers.vip_package + 14)
  };

  const newlySoldOut = nextPct >= 100 && !target.selloutAlertPosted;
  const updatedStop: TourStopItem = {
    ...target,
    presaleTicketsSold: nextSold,
    presaleSelloutPct: nextPct,
    projectedSelloutPct: Math.max(target.projectedSelloutPct, nextPct),
    canAddExtraNight: target.canAddExtraNight || (nextPct >= 95 && target.nightNumber < 4),
    presalePhase: nextPct >= 100 ? 'sold_out' : 'general_onsale',
    presaleRevenueCollected: nextSold * discountedAvgPrice,
    flashSaleApplied: true,
    selloutAlertPosted: target.selloutAlertPosted || newlySoldOut,
    tierSelloutPcts: nextTiers
  };

  const newStops = [...activeTour.stops];
  newStops[idx] = updatedStop;

  const extraXPosts: XPost[] = [];
  if (newlySoldOut) {
    const artistName = state.artist?.name || 'Artist';
    const bannerImg =
      activeTour.customBannerUrl ||
      activeTour.coverArt ||
      state.artist?.image ||
      '';
    extraXPosts.push({
      id: `sellout_flash_x_${Date.now()}_${target.id}`,
      authorName: 'Touring Data',
      authorHandle: '@TouringData',
      authorAvatar: state.artist?.image || bannerImg,
      isVerified: true,
      verifiedType: 'gold',
      category: 'chart',
      timeAgo: 'Just now',
      dateCreated: state.date,
      content: `🚨 INSTANT SELL-OUT ALERT: ${artistName}'s "${
        activeTour.title
      }" at ${target.venueName} in ${target.cityName} (Night ${
        target.nightNumber
      }) is now 100% SOLD OUT (${formatNumFull(
        target.capacity
      )} tickets) ahead of showtime!`,
      image: bannerImg,
      mediaBadge: '100% SOLD OUT • BOX OFFICE',
      mediaTitle: `${artistName} — ${activeTour.title}`,
      mediaSubtitle: `${target.venueName} (${target.cityName}) • ${formatNumFull(
        target.capacity
      )} Cap`,
      likes: Math.round(16_000 + target.capacity * 0.42),
      reposts: Math.round(3_900 + target.capacity * 0.11),
      replies: Math.round(720 + target.capacity * 0.03),
      views: Math.round(135_000 + target.capacity * 3.4),
      daysOld: 0
    });
  }

  return {
    success: true,
    updatedState: {
      ...state,
      xPosts: [...extraXPosts, ...(state.xPosts || [])].slice(0, 120),
      ...({
        tourState: {
          ...tourState,
          activeTour: {
            ...activeTour,
            stops: newStops
          }
        }
      } as any)
    }
  };
}

// ============================================================================
// 7. DAILY WORLD TOUR & PRESALE SIMULATION STEP (CALLED IN useGame.ts nextDay)
// ============================================================================

export function processDailyWorldTourStep(
  state: GameState,
  currentDateObj: Date
): {
  updatedTourState: WorldTourState;
  dailyTourNetIncome: number;
  updatedSongs: Song[];
  newXPosts: XPost[];
  popGain: number;
  hypeGain: number;
  fanGain: number;
} {
  const tourState = ensureWorldTourState(state);
  const activeTour = tourState.activeTour;

  if (!activeTour || activeTour.status !== 'active') {
    const tickedCooldownState = tickDailyTourCooldown(
      tourState,
      currentDateObj
    );
    return {
      updatedTourState: {
        ...tickedCooldownState,
        vocalStamina: Math.min(100, (tickedCooldownState.vocalStamina || 100) + 10)
      },
      dailyTourNetIncome: 0,
      updatedSongs: state.songs,
      newXPosts: [],
      popGain: 0,
      hypeGain: 0,
      fanGain: 0
    };
  }

  const todayStr = currentDateObj.toISOString().split('T')[0];
  const avgTicketPrice = Math.round(
    (activeTour.nosebleedPrice ?? Math.round(activeTour.gaPrice * 0.65)) * 0.28 +
      (activeTour.lowerBowlPrice ?? Math.round(activeTour.gaPrice * 1.08)) * 0.3 +
      (activeTour.floorStandingPrice ?? Math.round(activeTour.gaPrice * 1.32)) * 0.22 +
      activeTour.goldenCirclePrice * 0.14 +
      activeTour.vipPackagePrice * 0.06
  );

  const artistName = state.artist?.name || 'Artist';
  const resolvedTourBanner =
    activeTour.customBannerUrl ||
    activeTour.stageConfig.customBannerUrl ||
    activeTour.coverArt ||
    state.artist?.image ||
    '';

  const presaleSelloutXPosts: XPost[] = [];

  // Step A: Advance Daily Presale & General Onsale Tickets for all upcoming scheduled stops!
  const presaleUpdatedStops = activeTour.stops.map(st => {
    if (st.status !== 'scheduled') return st;
    const cityDef =
      GLOBAL_TOUR_CITIES.find(c => c.id === st.cityId) ||
      GLOBAL_TOUR_CITIES[0];
    const demandEst = estimateCityShowDemand({
      state,
      city: cityDef,
      venueTier: st.venueTier,
      stageConfig: activeTour.stageConfig,
      nosebleedPrice: activeTour.nosebleedPrice,
      lowerBowlPrice: activeTour.lowerBowlPrice,
      floorStandingPrice: activeTour.floorStandingPrice,
      gaPrice: activeTour.gaPrice,
      goldenCirclePrice: activeTour.goldenCirclePrice,
      vipPackagePrice: activeTour.vipPackagePrice,
      vipPerks: activeTour.vipPerks,
      antiScalperExchangeEnabled: activeTour.antiScalperExchangeEnabled,
      dynamicPlatinumEnabled: activeTour.dynamicPlatinumEnabled,
      openingActNpcIds: activeTour.openingActNpcIds,
      nightNumber: st.nightNumber,
      presaleStrategy: activeTour.presaleStrategy,
      flashSaleApplied: st.flashSaleApplied
    });

    const targetCeiling = Math.min(
      st.capacity,
      Math.max(st.presaleTicketsSold || 0, demandEst.projectedAttendance)
    );
    const remainingToSell = Math.max(
      0,
      targetCeiling - (st.presaleTicketsSold || 0)
    );
    const dailyIncrement = Math.max(
      Math.round(st.capacity * 0.05),
      Math.round(remainingToSell * 0.36)
    );
    const nextPresaleSold = Math.min(
      targetCeiling,
      (st.presaleTicketsSold || 0) + dailyIncrement
    );
    const nextPresalePct = Math.min(
      100,
      Math.round((nextPresaleSold / Math.max(1, st.capacity)) * 100)
    );

    const nextPhase: TourStopItem['presalePhase'] =
      nextPresalePct >= 100
        ? 'sold_out'
        : nextPresalePct >= 75
        ? 'general_onsale'
        : 'fan_presale';

    const progressRatio =
      nextPresaleSold / Math.max(1, demandEst.projectedAttendance);
    const nextTierPcts: Record<SeatingZoneId, number> = {
      nosebleed: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.nosebleed.selloutPct * progressRatio)
      ),
      lower_bowl: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.lower_bowl.selloutPct * progressRatio)
      ),
      floor_standing: Math.min(
        100,
        Math.round(demandEst.tierBreakdown.floor_standing.selloutPct * progressRatio)
      ),
      golden_circle: Math.min(
        100,
        Math.round(
          demandEst.tierBreakdown.golden_circle.selloutPct *
            Math.min(1, progressRatio * 1.12)
        )
      ),
      vip_package: Math.min(
        100,
        Math.round(
          demandEst.tierBreakdown.vip_package.selloutPct *
            Math.min(1, progressRatio * 1.16)
        )
      )
    };

    const newlySoldOut = nextPresalePct >= 100 && !st.selloutAlertPosted;
    if (newlySoldOut && presaleSelloutXPosts.length < 1) {
      presaleSelloutXPosts.push({
        id: `presale_sellout_${Date.now()}_${st.id}`,
        authorName: 'Touring Data',
        authorHandle: '@TouringData',
        authorAvatar: state.artist?.image || resolvedTourBanner,
        isVerified: true,
        verifiedType: 'gold',
        category: 'chart',
        timeAgo: 'Just now',
        dateCreated: state.date,
        content: `🚨 SOLD OUT ALERT: ${artistName}'s "${
          activeTour.title
        }" at ${st.venueName} in ${st.cityName} (Night ${
          st.nightNumber
        }) has officially SOLD OUT all ${formatNumFull(
          st.capacity
        )} tickets during presale/onsale ahead of showtime!`,
        image: resolvedTourBanner,
        mediaBadge: '100% SOLD OUT • ADVANCE',
        mediaTitle: `${artistName} — ${activeTour.title}`,
        mediaSubtitle: `${st.venueName} (${st.cityName}) • ${formatNumFull(
          st.capacity
        )} Tickets Claimed`,
        likes: Math.round(15_000 + st.capacity * 0.4),
        reposts: Math.round(3_600 + st.capacity * 0.1),
        replies: Math.round(680 + st.capacity * 0.03),
        views: Math.round(125_000 + st.capacity * 3.2),
        daysOld: 0
      });
    }

    return {
      ...st,
      presalePhase: nextPhase,
      presaleTicketsSold: nextPresaleSold,
      presaleSelloutPct: nextPresalePct,
      projectedSelloutPct: Math.max(st.projectedSelloutPct, nextPresalePct),
      canAddExtraNight:
        st.canAddExtraNight || (nextPresalePct >= 95 && st.nightNumber < 4),
      virtualQueueCount: Math.max(
        0,
        Math.round((st.virtualQueueCount || demandEst.estimatedVirtualQueue) * 0.86)
      ),
      presaleRevenueCollected: nextPresaleSold * avgTicketPrice,
      selloutAlertPosted: st.selloutAlertPosted || newlySoldOut,
      tierSelloutPcts: nextTierPcts
    };
  });

  // Step B: Find any scheduled stop whose date is <= todayStr (process 1 show per day max)
  const stopIdx = presaleUpdatedStops.findIndex(
    s => s.status === 'scheduled' && s.scheduledDate <= todayStr
  );

  // If no show plays today (Presale Window or Travel/Rest Day)
  if (stopIdx === -1) {
    return {
      updatedTourState: {
        ...tourState,
        vocalStamina: Math.min(100, tourState.vocalStamina + 9),
        activeTour: {
          ...activeTour,
          stops: presaleUpdatedStops
        }
      },
      dailyTourNetIncome: 0,
      updatedSongs: state.songs,
      newXPosts: presaleSelloutXPosts,
      popGain: 0,
      hypeGain: presaleSelloutXPosts.length > 0 ? 1.5 : 0,
      fanGain: 0
    };
  }

  const stop = presaleUpdatedStops[stopIdx];
  const cityDef =
    GLOBAL_TOUR_CITIES.find(c => c.id === stop.cityId) || GLOBAL_TOUR_CITIES[0];
  const venueSpec = cityDef.venues[stop.venueTier];
  const stageMetrics = evaluateStageArchitectureMetrics(activeTour.stageConfig);
  const sponsor =
    TOUR_SPONSORS.find(s => s.id === activeTour.sponsorId) || TOUR_SPONSORS[0];

  const demandEst = estimateCityShowDemand({
    state,
    city: cityDef,
    venueTier: stop.venueTier,
    stageConfig: activeTour.stageConfig,
    nosebleedPrice: activeTour.nosebleedPrice,
    lowerBowlPrice: activeTour.lowerBowlPrice,
    floorStandingPrice: activeTour.floorStandingPrice,
    gaPrice: activeTour.gaPrice,
    goldenCirclePrice: activeTour.goldenCirclePrice,
    vipPackagePrice: activeTour.vipPackagePrice,
    vipPerks: activeTour.vipPerks,
    antiScalperExchangeEnabled: activeTour.antiScalperExchangeEnabled,
    dynamicPlatinumEnabled: activeTour.dynamicPlatinumEnabled,
    openingActNpcIds: activeTour.openingActNpcIds,
    nightNumber: stop.nightNumber,
    presaleStrategy: activeTour.presaleStrategy,
    flashSaleApplied: stop.flashSaleApplied
  });

  const staminaFactor =
    tourState.vocalStamina >= 50
      ? 1.0
      : tourState.vocalStamina >= 25
      ? 0.92
      : 0.78;

  const variance = 0.97 + Math.random() * 0.06;
  const ticketsSold = Math.min(
    stop.capacity,
    Math.max(
      stop.presaleTicketsSold || 0,
      Math.round(demandEst.projectedAttendance * staminaFactor * variance)
    )
  );
  const selloutPct = Math.min(
    100,
    Math.round((ticketsSold / Math.max(1, stop.capacity)) * 100)
  );

  const attendanceScale =
    ticketsSold / Math.max(1, demandEst.projectedAttendance);

  const gaTicketsSold = Math.round(ticketsSold * 0.78);
  const goldenCircleSold = Math.round(ticketsSold * 0.16);
  const vipSold = Math.max(0, ticketsSold - gaTicketsSold - goldenCircleSold);

  const vipGross = Math.round(
    (demandEst.tierBreakdown.vip_package?.gross ||
      vipSold * activeTour.vipPackagePrice) * attendanceScale
  );
  const ticketGross = Math.max(
    0,
    Math.round(demandEst.projectedTicketGross * attendanceScale) - vipGross
  );

  const hasActiveMerchStoreItems =
    ((state as any).merchStore?.items || []).length > 0;
  const merchCatalogBoost = hasActiveMerchStoreItems ? 1.28 : 1.0;
  const merchBoothGross = Math.round(
    demandEst.projectedMerchGross * attendanceScale * merchCatalogBoost
  );

  const sponsorBonus = sponsor.perShowBonus;
  const totalGross = ticketGross + vipGross + merchBoothGross + sponsorBonus;

  const venueRentalFee = venueSpec.rentalCost;
  const promoterCut = Math.round((ticketGross + vipGross) * 0.14);
  const logisticsAndCrewCost = stageMetrics.perShowRiggingCost;
  const openingActFee = activeTour.openingActNpcIds.length * 14_500;

  const rawShowExpenses =
    venueRentalFee + promoterCut + logisticsAndCrewCost + openingActFee;
  // Promoter Minimum Guarantee ensures artist always nets at least 25% of total show gross + sponsor bonus
  const promoterGuaranteeFloor = Math.round(totalGross * 0.25);
  const netProfit = Math.max(
    promoterGuaranteeFloor,
    totalGross - rawShowExpenses
  );
  const totalShowExpenses = Math.max(0, totalGross - netProfit);

  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const surpriseSong =
    releasedSongs.find(s => s.id === activeTour.setlist.surpriseSongId) ||
    releasedSongs[stopIdx % Math.max(1, releasedSongs.length)];

  const crowdRating = Math.min(
    100,
    Math.round(
      stageMetrics.productionScore * 0.55 +
        (tourState.vocalStamina || 80) * 0.3 +
        15
    )
  );

  const completedStop: TourStopItem = {
    ...stop,
    status: 'completed',
    presalePhase: 'sold_out',
    presaleTicketsSold: ticketsSold,
    presaleSelloutPct: selloutPct,
    ticketsSold,
    selloutPct,
    gaTicketsSold,
    goldenCircleSold,
    vipSold,
    ticketGross,
    vipGross,
    merchBoothGross,
    sponsorBonus,
    totalGross,
    venueRentalFee,
    promoterCut,
    logisticsAndCrewCost,
    openingActFee,
    netProfit,
    surpriseSongTitle: surpriseSong?.title || 'Unreleased Acoustic Medley',
    crowdRating
  };

  const newStops = [...presaleUpdatedStops];
  newStops[stopIdx] = completedStop;

  const anyRemaining = newStops.some(s => s.status === 'scheduled');

  const updatedTour: ActiveWorldTour = {
    ...activeTour,
    status: anyRemaining ? 'active' : 'completed',
    stops: newStops,
    totalShowsCompleted: activeTour.totalShowsCompleted + 1,
    totalAttendance: activeTour.totalAttendance + ticketsSold,
    totalTicketGross: activeTour.totalTicketGross + ticketGross + vipGross,
    totalMerchBoothGross: activeTour.totalMerchBoothGross + merchBoothGross,
    totalSponsorGross: activeTour.totalSponsorGross + sponsorBonus,
    totalExpenses: activeTour.totalExpenses + totalShowExpenses,
    totalNetProfit: activeTour.totalNetProfit + netProfit
  };

  const setlistIds = new Set([
    ...activeTour.setlist.act1SongIds,
    ...activeTour.setlist.act2SongIds,
    ...activeTour.setlist.act3SongIds,
    ...activeTour.setlist.act4SongIds,
    ...(surpriseSong ? [surpriseSong.id] : [])
  ]);

  const streamBoostPerSetlistTrack = Math.round(ticketsSold * 2.8);
  const updatedSongs = state.songs.map(s => {
    if (s.status === 'released' && setlistIds.has(s.id)) {
      return {
        ...s,
        streams: (s.streams || 0) + streamBoostPerSetlistTrack,
        dailyStreams: (s.dailyStreams || 0) + streamBoostPerSetlistTrack,
        weeklyStreams: (s.weeklyStreams || 0) + streamBoostPerSetlistTrack
      };
    }
    return s;
  });

  const newXPosts: XPost[] = [
    ...presaleSelloutXPosts,
    {
      id: `boxscore_x_${Date.now()}_${stop.id}`,
      authorName: 'Touring Data',
      authorHandle: '@TouringData',
      authorAvatar: state.artist?.image || resolvedTourBanner,
      isVerified: true,
      verifiedType: 'gold',
      category: 'chart',
      timeAgo: 'Just now',
      dateCreated: state.date,
      content: `📊 BOXSCORE REPORT: ${artistName}'s "${
        activeTour.title
      }" grossed $${formatNumFull(totalGross)} from ${formatNumFull(
        ticketsSold
      )} tickets (${selloutPct}% capacity) at ${stop.venueName} in ${
        stop.cityName
      } (Night ${stop.nightNumber})! Surprise Song: "${
        completedStop.surpriseSongTitle
      }".`,
      image: resolvedTourBanner,
      mediaBadge: selloutPct >= 99 ? '100% SOLD OUT' : `${selloutPct}% SOLD`,
      mediaTitle: `${artistName} — ${activeTour.title}`,
      mediaSubtitle: `${stop.venueName} (${stop.cityName}) • Gross: $${formatNumFull(
        totalGross
      )} • Merch: $${formatNumFull(merchBoothGross)}`,
      likes: Math.round(12_000 + ticketsSold * 0.45),
      reposts: Math.round(2_800 + ticketsSold * 0.12),
      replies: Math.round(540 + ticketsSold * 0.03),
      views: Math.round(92_000 + ticketsSold * 3.6),
      daysOld: 0
    }
  ];

  const nextStamina = Math.max(8, (tourState.vocalStamina || 100) - 13);

  let baseNextTourState: WorldTourState = {
    ...tourState,
    vocalStamina: nextStamina,
    activeTour: anyRemaining ? updatedTour : null,
    pastTours: anyRemaining
      ? tourState.pastTours
      : [updatedTour, ...tourState.pastTours],
    lifetimeTourGross: (tourState.lifetimeTourGross || 0) + totalGross,
    lifetimeTourAttendance:
      (tourState.lifetimeTourAttendance || 0) + ticketsSold,
    lifetimeShowsPlayed: (tourState.lifetimeShowsPlayed || 0) + 1
  };

  if (!anyRemaining) {
    const completionRes = applyTourCompletionCooldown({
      state,
      tourState: baseNextTourState,
      completedTour: updatedTour,
      currentDateObj,
      resolvedTourBanner
    });
    baseNextTourState = completionRes.updatedTourState;
    newXPosts.unshift(completionRes.finaleXPost);
  }

  return {
    updatedTourState: baseNextTourState,
    dailyTourNetIncome: netProfit,
    updatedSongs,
    newXPosts,
    popGain: Number(Math.min(0.65, ticketsSold / 140_000).toFixed(2)),
    hypeGain: Number(Math.min(2.2, ticketsSold / 35_000).toFixed(2)),
    fanGain: Math.round(ticketsSold * 0.085)
  };
}

// ============================================================================
// 8. GLOBAL ALL-TIME TOUR BOXSCORE LEADERBOARD (PLAYER VS. NPC TOURS)
// ============================================================================

export function buildGlobalTourBoxscoreLeaderboard(
  state: GameState
): GlobalTourBoxscoreEntry[] {
  const tourState = ensureWorldTourState(state);
  const artistName = state.artist?.name || 'Artist';

  const activeTour = tourState.activeTour;
  const bestPastTour = tourState.pastTours[0];
  const playerHeadlineTourTitle =
    activeTour?.title || bestPastTour?.title || `${artistName} Live World Tour`;

  const playerShows = Math.max(0, tourState.lifetimeShowsPlayed || 0);
  const playerAttendance = Math.max(0, tourState.lifetimeTourAttendance || 0);
  const playerGross = Math.max(0, tourState.lifetimeTourGross || 0);

  const entries: GlobalTourBoxscoreEntry[] = [
    {
      id: 'player_tour_entry',
      artistName,
      tourTitle: playerHeadlineTourTitle,
      avatar: state.artist?.image || '',
      isPlayer: true,
      showsCount: playerShows,
      totalAttendance: playerAttendance,
      totalGross: playerGross,
      avgGrossPerShow:
        playerShows > 0 ? Math.round(playerGross / playerShows) : 0,
      avgTicketPrice:
        playerAttendance > 0
          ? Math.round(playerGross / playerAttendance)
          : activeTour?.gaPrice || 85,
      signatureVenue:
        activeTour?.stops[0]?.venueName ||
        bestPastTour?.stops[0]?.venueName ||
        'No Tour Dates Played Yet'
    }
  ];

  const ICONIC_NPC_WORLD_TOURS: Record<
    string,
    {
      tourTitle: string;
      shows: number;
      attendance: number;
      gross: number;
      venue: string;
    }
  > = {
    'taylor swift': {
      tourTitle: 'The Eras Stadium World Tour',
      shows: 149,
      attendance: 10_168_000,
      gross: 2_077_618_000,
      venue: 'Wembley Stadium (8 Nights) / SoFi Stadium'
    },
    'coldplay': {
      tourTitle: 'Music of the Spheres World Tour',
      shows: 175,
      attendance: 10_300_000,
      gross: 1_144_000_000,
      venue: 'Estadio River Plate (10 Nights)'
    },
    'the weeknd': {
      tourTitle: 'After Hours Til Dawn Stadium Tour',
      shows: 110,
      attendance: 5_650_000,
      gross: 745_000_000,
      venue: 'SoFi Stadium / Stade de France'
    },
    'beyoncé': {
      tourTitle: 'RENAISSANCE World Stadium Tour',
      shows: 56,
      attendance: 2_776_855,
      gross: 579_800_000,
      venue: 'MetLife Stadium / Tottenham Hotspur'
    },
    'ed sheeran': {
      tourTitle: '+–=÷× (Mathematics) World Tour',
      shows: 134,
      attendance: 7_420_000,
      gross: 768_000_000,
      venue: 'Melbourne Cricket Ground (109,500 Record)'
    },
    'drake': {
      tourTitle: "It's All A Blur Arena Tour",
      shows: 80,
      attendance: 1_320_000,
      gross: 320_500_000,
      venue: 'Madison Square Garden / Scotiabank Arena'
    },
    'bad bunny': {
      tourTitle: "World's Hottest Stadium Tour",
      shows: 43,
      attendance: 1_835_000,
      gross: 435_400_000,
      venue: 'Estadio Azteca / Yankee Stadium'
    },
    'travis scott': {
      tourTitle: 'CIRCUS MAXIMUS Global Tour',
      shows: 78,
      attendance: 1_750_000,
      gross: 218_000_000,
      venue: 'Ippodromo San Siro Milan (80,000)'
    },
    'bruno mars': {
      tourTitle: 'Bruno Mars Live Stadium Residency',
      shows: 95,
      attendance: 3_850_000,
      gross: 486_000_000,
      venue: 'Tokyo Dome (7 Consecutive Sold-Out Nights)'
    },
    'kendrick lamar': {
      tourTitle: 'The Big Steppers & Grand National Tour',
      shows: 92,
      attendance: 1_820_000,
      gross: 284_000_000,
      venue: 'SoFi Stadium / Accor Arena Paris'
    },
    'billie eilish': {
      tourTitle: 'HIT ME HARD AND SOFT: THE TOUR',
      shows: 82,
      attendance: 1_460_000,
      gross: 212_000_000,
      venue: 'Kia Forum LA / The O2 London'
    },
    'sza': {
      tourTitle: 'SOS World Arena Tour',
      shows: 64,
      attendance: 1_120_000,
      gross: 168_500_000,
      venue: 'Madison Square Garden / Barclays Center'
    },
    'post malone': {
      tourTitle: 'F-1 Trillion & Twelve Carat Tour',
      shows: 76,
      attendance: 1_540_000,
      gross: 196_000_000,
      venue: 'O2 Arena / Nissan Stadium'
    },
    'ariana grande': {
      tourTitle: 'Sweetener & Eternal Sunshine World Tour',
      shows: 101,
      attendance: 1_680_000,
      gross: 224_000_000,
      venue: 'The O2 London / Kia Forum'
    },
    'lady gaga': {
      tourTitle: 'The Chromatica Ball & Mayhem Stadium Tour',
      shows: 48,
      attendance: 1_920_000,
      gross: 278_000_000,
      venue: 'Dodger Stadium / Tokyo Dome'
    },
    'olivia rodrigo': {
      tourTitle: 'GUTS World Arena & Stadium Tour',
      shows: 95,
      attendance: 1_650_000,
      gross: 204_500_000,
      venue: 'Philippine Arena (55,000) / MSG'
    },
    'dua lipa': {
      tourTitle: 'Radical Optimism Stadium & Arena Tour',
      shows: 84,
      attendance: 1_780_000,
      gross: 198_000_000,
      venue: 'Wembley Stadium (2 Sold-Out Nights)'
    },
    'sabrina carpenter': {
      tourTitle: "Short n' Sweet World Arena Tour",
      shows: 62,
      attendance: 1_040_000,
      gross: 138_000_000,
      venue: 'Madison Square Garden / Kia Forum'
    }
  };

  const rawNpcs: NPC[] =
    state.npcs && state.npcs.length > 0 ? state.npcs : DETAILED_NPCS;
  const playerLower = artistName.trim().toLowerCase();

  rawNpcs
    .filter(npc => npc.name.trim().toLowerCase() !== playerLower)
    .slice(0, 45)
    .forEach(npc => {
      const lower = npc.name.toLowerCase();
      const preset = ICONIC_NPC_WORLD_TOURS[lower];

      const liveStreams = (npc.songs || []).reduce(
        (sum, s) => sum + (s.streams || 0),
        0
      );
      const liveTourGrowth = Math.floor(liveStreams / 45);

      const showsCount = preset
        ? preset.shows
        : Math.max(24, Math.round((npc.pop || 50) * 0.85));
      const totalAttendance = preset
        ? preset.attendance + Math.floor(liveTourGrowth / 180)
        : Math.round(showsCount * ((npc.pop || 50) * 260));
      const totalGross = preset
        ? preset.gross + liveTourGrowth
        : Math.round(totalAttendance * (78 + (npc.pop || 50) * 0.95));

      entries.push({
        id: `npc_tour_${npc.id}`,
        artistName: npc.name,
        tourTitle: preset?.tourTitle || `${npc.name} Global World Tour`,
        avatar: npc.image || npc.avatar || getNpcAvatar(npc.name),
        isPlayer: false,
        showsCount,
        totalAttendance,
        totalGross,
        avgGrossPerShow: Math.round(totalGross / Math.max(1, showsCount)),
        avgTicketPrice: Math.round(totalGross / Math.max(1, totalAttendance)),
        signatureVenue:
          preset?.venue ||
          (npc.pop >= 80
            ? 'SoFi Stadium / Wembley Stadium'
            : 'Madison Square Garden / The O2')
      });
    });

  return entries.sort((a, b) => b.totalGross - a.totalGross);
}
