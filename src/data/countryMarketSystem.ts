import { ChartItem, Song } from '../types';
import { COUNTRY_TIERS, COUNTRY_NAMES } from '../constants';
import { getTrackCoverArt } from './npcAssets';
import { REAL_WORLD_NPCS } from './realWorldArtistCatalog';
import { getNpcVideoThumbnail } from './npcYoutubeThumbnails';
import { resolveAuthenticCover, getSimulatedSingleEntry } from './musicCatalog';
import { getNpcTrackDynamicMultiplier } from './npcChartDynamicsEngine';
import { convertToBillboardBreakdown } from './realisticIndustryMetricsEngine';
import { calculateRegionalBillboardBreakdown } from './billboardRegionalBreakdownEngine';
import {
  calculateChartLongevityDecay,
  calculateRebalancedBillboardPoints
} from './chartSalesAndStabilityRebalancer';
import {
  calculateAuthenticBillboardPoints,
  calculateBillboardAffinityScore
} from './billboardFormulaEngine';
import { getTightenedHot100CurveMultiplier } from './albumSalesAndMarketCalibrator';
import { calculatePlatformAffinityScore } from './calibratedMusicEcosystemEngine';

export type RegionGroup = 
  | 'North America' 
  | 'Latin America' 
  | 'East Asia' 
  | 'Southeast Asia' 
  | 'Europe' 
  | 'South Asia' 
  | 'Africa' 
  | 'Middle East' 
  | 'Oceania';

export interface CountryMarketProfile {
  code: string;
  name: string;
  regionGroup: RegionGroup;
  tier: number;
  marketSizeWeight: number; // 1 to 100
  streamingShare: number;   // 0 to 1
  youtubeShare: number;     // 0 to 1
  salesShare: number;       // 0 to 1
  radioShare: number;       // 0 to 1
  domesticLoyalty: number;  // 0 to 1 (how strongly domestic artists dominate local charts)
  dominantGenres: string[];
}

export const COUNTRY_MARKET_PROFILES: Record<string, CountryMarketProfile> = {
  'US': {
    code: 'US',
    name: 'United States',
    regionGroup: 'North America',
    tier: 1,
    marketSizeWeight: 100,
    streamingShare: 0.65,
    youtubeShare: 0.18,
    salesShare: 0.08,
    radioShare: 0.09,
    domesticLoyalty: 0.78,
    dominantGenres: ['Hip-Hop', 'Pop', 'Country', 'R&B']
  },
  'GB': {
    code: 'GB',
    name: 'United Kingdom',
    regionGroup: 'Europe',
    tier: 1,
    marketSizeWeight: 36,
    streamingShare: 0.70,
    youtubeShare: 0.15,
    salesShare: 0.08,
    radioShare: 0.07,
    domesticLoyalty: 0.72,
    dominantGenres: ['UK Drill', 'Pop', 'Electronic', 'Britpop']
  },
  'JP': {
    code: 'JP',
    name: 'Japan',
    regionGroup: 'East Asia',
    tier: 1,
    marketSizeWeight: 44,
    streamingShare: 0.42,
    youtubeShare: 0.28,
    salesShare: 0.25, // Very high physical/CD & digital purchases
    radioShare: 0.05,
    domesticLoyalty: 0.86, // Heavy domestic J-Pop/Rock/Anime preference
    dominantGenres: ['J-Pop', 'J-Rock', 'Anisong', 'City Pop']
  },
  'KR': {
    code: 'KR',
    name: 'South Korea',
    regionGroup: 'East Asia',
    tier: 1,
    marketSizeWeight: 32,
    streamingShare: 0.58,
    youtubeShare: 0.32, // Massive MV streaming
    salesShare: 0.08,
    radioShare: 0.02,
    domesticLoyalty: 0.88, // Overwhelming domestic K-pop preference
    dominantGenres: ['K-Pop', 'K-R&B', 'Ballad', 'K-HipHop']
  },
  'BR': {
    code: 'BR',
    name: 'Brazil',
    regionGroup: 'Latin America',
    tier: 2,
    marketSizeWeight: 38,
    streamingShare: 0.62,
    youtubeShare: 0.35, // Huge YouTube & Spotify market
    salesShare: 0.01,
    radioShare: 0.02,
    domesticLoyalty: 0.84, // Heavy Sertanejo/Funk/MPB preference
    dominantGenres: ['Sertanejo', 'Funk Brasileiro', 'Trap BR', 'MPB']
  },
  'MX': {
    code: 'MX',
    name: 'Mexico',
    regionGroup: 'Latin America',
    tier: 2,
    marketSizeWeight: 34,
    streamingShare: 0.60,
    youtubeShare: 0.36,
    salesShare: 0.02,
    radioShare: 0.02,
    domesticLoyalty: 0.82, // Reggaeton, Corridos Tumbados, Banda
    dominantGenres: ['Corridos Tumbados', 'Reggaeton', 'Latin Pop', 'Banda']
  },
  'ID': {
    code: 'ID',
    name: 'Indonesia',
    regionGroup: 'Southeast Asia',
    tier: 2,
    marketSizeWeight: 26,
    streamingShare: 0.50,
    youtubeShare: 0.48, // Very heavy YouTube music video market
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.80, // Strong Indonesian pop, indie, and dangdut preference
    dominantGenres: ['Pop Indonesia', 'Indie Pop', 'Dangdut', 'Acoustic Ballad']
  },
  'DE': {
    code: 'DE',
    name: 'Germany',
    regionGroup: 'Europe',
    tier: 1,
    marketSizeWeight: 34,
    streamingShare: 0.68,
    youtubeShare: 0.16,
    salesShare: 0.12, // High physical & download share
    radioShare: 0.04,
    domesticLoyalty: 0.68,
    dominantGenres: ['Deutschrap', 'Electronic', 'Pop', 'Schlager']
  },
  'FR': {
    code: 'FR',
    name: 'France',
    regionGroup: 'Europe',
    tier: 1,
    marketSizeWeight: 28,
    streamingShare: 0.66,
    youtubeShare: 0.22,
    salesShare: 0.08,
    radioShare: 0.04,
    domesticLoyalty: 0.76, // High domestic French rap & pop preference
    dominantGenres: ['French Rap', 'Pop Urbaine', 'Afro-Pop', 'Chanson']
  },
  'CA': {
    code: 'CA',
    name: 'Canada',
    regionGroup: 'North America',
    tier: 1,
    marketSizeWeight: 22,
    streamingShare: 0.70,
    youtubeShare: 0.18,
    salesShare: 0.06,
    radioShare: 0.06,
    domesticLoyalty: 0.64,
    dominantGenres: ['Hip-Hop', 'Pop', 'Alternative', 'R&B']
  },
  'AU': {
    code: 'AU',
    name: 'Australia',
    regionGroup: 'Oceania',
    tier: 1,
    marketSizeWeight: 20,
    streamingShare: 0.72,
    youtubeShare: 0.16,
    salesShare: 0.06,
    radioShare: 0.06,
    domesticLoyalty: 0.60,
    dominantGenres: ['Indie Rock', 'Pop', 'Electronic', 'Hip-Hop']
  },
  'IN': {
    code: 'IN',
    name: 'India',
    regionGroup: 'South Asia',
    tier: 2,
    marketSizeWeight: 30,
    streamingShare: 0.44,
    youtubeShare: 0.54, // Massive YouTube viewership
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.88, // Heavy Bollywood, Punjabi, and Desi Hip-Hop
    dominantGenres: ['Bollywood', 'Punjabi Pop', 'Desi Hip-Hop', 'Indie Hindi']
  },
  'NG': {
    code: 'NG',
    name: 'Nigeria',
    regionGroup: 'Africa',
    tier: 3,
    marketSizeWeight: 15,
    streamingShare: 0.52,
    youtubeShare: 0.45,
    salesShare: 0.01,
    radioShare: 0.02,
    domesticLoyalty: 0.90, // Dominant Afrobeats & Street Pop
    dominantGenres: ['Afrobeats', 'Street Pop', 'Afro-Fusion', 'Gospel']
  },
  'ES': {
    code: 'ES',
    name: 'Spain',
    regionGroup: 'Europe',
    tier: 2,
    marketSizeWeight: 18,
    streamingShare: 0.68,
    youtubeShare: 0.26,
    salesShare: 0.03,
    radioShare: 0.03,
    domesticLoyalty: 0.78, // Latin Urban & Spanish Pop
    dominantGenres: ['Reggaeton', 'Flamenco Urbano', 'Latin Pop', 'Trap']
  },
  'IT': {
    code: 'IT',
    name: 'Italy',
    regionGroup: 'Europe',
    tier: 2,
    marketSizeWeight: 19,
    streamingShare: 0.64,
    youtubeShare: 0.26,
    salesShare: 0.06,
    radioShare: 0.04,
    domesticLoyalty: 0.74, // Italian Trap & Pop
    dominantGenres: ['Italian Trap', 'Pop Italiano', 'Sanremo Ballad']
  },
  'PH': {
    code: 'PH',
    name: 'Philippines',
    regionGroup: 'Southeast Asia',
    tier: 2,
    marketSizeWeight: 16,
    streamingShare: 0.56,
    youtubeShare: 0.42,
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.76, // OPM (Original Pilipino Music) & P-Pop
    dominantGenres: ['OPM', 'P-Pop', 'Acoustic', 'RnB']
  },
  'AR': {
    code: 'AR',
    name: 'Argentina',
    regionGroup: 'Latin America',
    tier: 3,
    marketSizeWeight: 14,
    streamingShare: 0.65,
    youtubeShare: 0.33,
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.80, // Argentine Trap, RKT, Cuarteto
    dominantGenres: ['Argentine Trap', 'RKT', 'Urbano Latino', 'Rock Nacional']
  },
  'CO': {
    code: 'CO',
    name: 'Colombia',
    regionGroup: 'Latin America',
    tier: 3,
    marketSizeWeight: 13,
    streamingShare: 0.62,
    youtubeShare: 0.36,
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.82,
    dominantGenres: ['Reggaeton', 'Urbano Medellin', 'Vallenato']
  },
  'TH': {
    code: 'TH',
    name: 'Thailand',
    regionGroup: 'Southeast Asia',
    tier: 2,
    marketSizeWeight: 15,
    streamingShare: 0.52,
    youtubeShare: 0.46,
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.78,
    dominantGenres: ['T-Pop', 'Thai Indie', 'Hip-Hop TH']
  },
  'VN': {
    code: 'VN',
    name: 'Vietnam',
    regionGroup: 'Southeast Asia',
    tier: 2,
    marketSizeWeight: 14,
    streamingShare: 0.48,
    youtubeShare: 0.50,
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.82,
    dominantGenres: ['V-Pop', 'Vinahouse', 'Ballad VN']
  },
  'ZA': {
    code: 'ZA',
    name: 'South Africa',
    regionGroup: 'Africa',
    tier: 3,
    marketSizeWeight: 12,
    streamingShare: 0.58,
    youtubeShare: 0.38,
    salesShare: 0.02,
    radioShare: 0.02,
    domesticLoyalty: 0.84,
    dominantGenres: ['Amapiano', 'Afro-House', 'Hip-Hop ZA']
  },
  'SE': {
    code: 'SE',
    name: 'Sweden',
    regionGroup: 'Europe',
    tier: 1,
    marketSizeWeight: 12,
    streamingShare: 0.82, // Spotify birthplace, huge streaming share
    youtubeShare: 0.12,
    salesShare: 0.04,
    radioShare: 0.02,
    domesticLoyalty: 0.62,
    dominantGenres: ['Swedish Pop', 'Svensk Rap', 'Electronic']
  },
  'NL': {
    code: 'NL',
    name: 'Netherlands',
    regionGroup: 'Europe',
    tier: 1,
    marketSizeWeight: 13,
    streamingShare: 0.75,
    youtubeShare: 0.16,
    salesShare: 0.05,
    radioShare: 0.04,
    domesticLoyalty: 0.66,
    dominantGenres: ['Dutch Pop', 'Nederhop', 'EDM']
  },
  'TR': {
    code: 'TR',
    name: 'Turkey',
    regionGroup: 'Middle East',
    tier: 2,
    marketSizeWeight: 16,
    streamingShare: 0.56,
    youtubeShare: 0.42,
    salesShare: 0.01,
    radioShare: 0.01,
    domesticLoyalty: 0.82,
    dominantGenres: ['Turkish Rap', 'Türkçe Pop', 'Arabesque']
  }
};

/**
 * Returns complete profile with safe fallback for any country code.
 */
export function getCountryMarketProfile(cc: string): CountryMarketProfile {
  if (COUNTRY_MARKET_PROFILES[cc]) {
    return COUNTRY_MARKET_PROFILES[cc];
  }
  const tier = COUNTRY_TIERS[cc] || 3;
  const name = COUNTRY_NAMES[cc] || cc;
  return {
    code: cc,
    name,
    regionGroup: 'Europe',
    tier,
    marketSizeWeight: Math.max(8, 28 - tier * 8),
    streamingShare: 0.60,
    youtubeShare: 0.34,
    salesShare: 0.03,
    radioShare: 0.03,
    domesticLoyalty: 0.65,
    dominantGenres: ['Pop', 'Hip-Hop', 'Local Indie']
  };
}

// -----------------------------------------------------------------------------------------
// AUTHENTIC DOMESTIC ARTISTS & HITS CATALOG FOR EACH REGION / COUNTRY
// -----------------------------------------------------------------------------------------

export interface DomesticHit {
  artist: string;
  title: string;
  genre: string;
  primaryCountries: string[]; // Countries where this is a huge domestic smash
  isLocalOnly: boolean;       // If true, rarely charts outside its primary region
}

export const AUTHENTIC_DOMESTIC_HITS: DomesticHit[] = [
  // SOUTH KOREA (KR) Domestic Hits
  { artist: 'NewJeans', title: 'Super Shy', genre: 'K-Pop', primaryCountries: ['KR', 'JP', 'TW', 'ID', 'PH'], isLocalOnly: false },
  { artist: 'IU', title: 'Love wins all', genre: 'K-Ballad', primaryCountries: ['KR'], isLocalOnly: true },
  { artist: 'aespa', title: 'Supernova', genre: 'K-Pop', primaryCountries: ['KR', 'JP', 'TH', 'VN'], isLocalOnly: false },
  { artist: 'ILLIT', title: 'Magnetic', genre: 'K-Pop', primaryCountries: ['KR', 'JP', 'TW'], isLocalOnly: false },
  { artist: 'DAY6', title: 'Time of Our Life', genre: 'K-Band', primaryCountries: ['KR'], isLocalOnly: true },
  { artist: 'EXO', title: 'The First Snow', genre: 'Ballad', primaryCountries: ['KR'], isLocalOnly: true },

  // JAPAN (JP) Domestic Hits
  { artist: 'Fujii Kaze', title: 'Shinunoga E-Wa', genre: 'J-Pop', primaryCountries: ['JP', 'TW', 'KR'], isLocalOnly: false },
  { artist: 'YOASOBI', title: 'Idol', genre: 'J-Pop', primaryCountries: ['JP', 'TW'], isLocalOnly: false },
  { artist: 'Kenshi Yonezu', title: 'KICK BACK', genre: 'J-Rock', primaryCountries: ['JP'], isLocalOnly: true },
  { artist: 'Ado', title: 'Show', genre: 'J-Pop', primaryCountries: ['JP'], isLocalOnly: true },
  { artist: 'Mrs. GREEN APPLE', title: 'Lilac', genre: 'J-Rock', primaryCountries: ['JP'], isLocalOnly: true },
  { artist: 'Official HIGE DANdism', title: 'Subtitle', genre: 'J-Pop', primaryCountries: ['JP'], isLocalOnly: true },

  // BRAZIL (BR) Domestic Hits
  { artist: 'Ana Castela', title: 'Nosso Quadro', genre: 'Sertanejo', primaryCountries: ['BR', 'PT'], isLocalOnly: true },
  { artist: 'MC Ryan SP', title: 'Let\'s Go 4', genre: 'Funk Brasileiro', primaryCountries: ['BR'], isLocalOnly: true },
  { artist: 'Gusttavo Lima', title: 'Desejo Imortal', genre: 'Sertanejo', primaryCountries: ['BR'], isLocalOnly: true },
  { artist: 'Ludmilla', title: 'Maldivas', genre: 'Pagode', primaryCountries: ['BR', 'PT'], isLocalOnly: true },
  { artist: 'Luísa Sonza', title: 'Chico', genre: 'Pop BR', primaryCountries: ['BR'], isLocalOnly: true },
  { artist: 'Alok', title: 'Hear Me Now', genre: 'Electronic', primaryCountries: ['BR'], isLocalOnly: true },

  // LATIN AMERICA (MX, AR, CO, CL)
  { artist: 'Peso Pluma', title: 'Ella Baila Sola', genre: 'Corridos Tumbados', primaryCountries: ['MX', 'US', 'CO', 'AR'], isLocalOnly: false },
  { artist: 'Feid', title: 'LUNA', genre: 'Reggaeton', primaryCountries: ['CO', 'MX', 'ES', 'AR'], isLocalOnly: false },
  { artist: 'Bizarrap', title: 'Quevedo: Bzrp Music Sessions, Vol. 52', genre: 'Argentine Trap', primaryCountries: ['AR', 'ES', 'MX', 'CL'], isLocalOnly: false },
  { artist: 'María Becerra', title: 'Corazón Vacío', genre: 'Urbano Latino', primaryCountries: ['AR', 'CL', 'UY'], isLocalOnly: true },
  { artist: 'Fuerza Regida', title: 'TQM', genre: 'Banda', primaryCountries: ['MX', 'US'], isLocalOnly: true },
  { artist: 'Young Miko', title: 'offline', genre: 'Latin Trap', primaryCountries: ['MX', 'ES', 'CO'], isLocalOnly: true },

  // INDONESIA & SOUTHEAST ASIA (ID, PH, TH, VN, MY)
  { artist: 'Tulus', title: 'Hati-Hati di Jalan', genre: 'Pop Indonesia', primaryCountries: ['ID', 'MY', 'SG'], isLocalOnly: true },
  { artist: 'Bernadya', title: 'Kata Mereka Ini Berlebihan', genre: 'Indie Pop', primaryCountries: ['ID', 'MY'], isLocalOnly: true },
  { artist: 'Hindia', title: 'Evaluasi', genre: 'Indie Pop', primaryCountries: ['ID'], isLocalOnly: true },
  { artist: 'Mahalini', title: 'Sial', genre: 'Acoustic Ballad', primaryCountries: ['ID', 'MY'], isLocalOnly: true },
  { artist: 'Juicy Luicy', title: 'Lantas', genre: 'Pop Indonesia', primaryCountries: ['ID'], isLocalOnly: true },
  { artist: 'Sal Priadi', title: 'Dari Planet Lain', genre: 'Indie Pop', primaryCountries: ['ID'], isLocalOnly: true },
  { artist: 'BINI', title: 'Pantropiko', genre: 'P-Pop', primaryCountries: ['PH'], isLocalOnly: true },
  { artist: 'Lola Amour', title: 'Raining in Manila', genre: 'OPM', primaryCountries: ['PH'], isLocalOnly: true },
  { artist: 'Three Man Down', title: 'ฝนตกไหม', genre: 'T-Pop', primaryCountries: ['TH'], isLocalOnly: true },
  { artist: 'Sơn Tùng M-TP', title: 'Making My Way', genre: 'V-Pop', primaryCountries: ['VN'], isLocalOnly: true },

  // FRANCE (FR)
  { artist: 'Gazo', title: 'DIE', genre: 'French Rap', primaryCountries: ['FR', 'BE', 'CH'], isLocalOnly: true },
  { artist: 'Jul', title: 'Bande organisée', genre: 'Pop Urbaine', primaryCountries: ['FR'], isLocalOnly: true },
  { artist: 'Aya Nakamura', title: 'Djadja', genre: 'Afro-Pop', primaryCountries: ['FR', 'BE', 'NL'], isLocalOnly: false },
  { artist: 'Ninho', title: 'Lettre à une femme', genre: 'French Rap', primaryCountries: ['FR', 'BE'], isLocalOnly: true },
  { artist: 'Tiakola', title: 'Meuda', genre: 'Afro-Pop', primaryCountries: ['FR'], isLocalOnly: true },

  // GERMANY (DE)
  { artist: 'Apache 207', title: 'Komet', genre: 'Deutschrap', primaryCountries: ['DE', 'AT', 'CH'], isLocalOnly: true },
  { artist: 'Luciano', title: 'Beautiful Girl', genre: 'Deutschrap', primaryCountries: ['DE', 'AT', 'CH'], isLocalOnly: true },
  { artist: 'AYLIVA', title: 'Wunder', genre: 'Pop', primaryCountries: ['DE', 'AT'], isLocalOnly: true },
  { artist: 'Bonez MC', title: '500 PS', genre: 'Deutschrap', primaryCountries: ['DE', 'AT'], isLocalOnly: true },
  { artist: 'Nina Chuba', title: 'Wildberry Lillet', genre: 'Pop', primaryCountries: ['DE', 'CH'], isLocalOnly: true },

  // UNITED KINGDOM (GB)
  { artist: 'Central Cee', title: 'Sprinter', genre: 'UK Drill', primaryCountries: ['GB', 'IE', 'AU', 'NZ'], isLocalOnly: false },
  { artist: 'Dave', title: 'Starlight', genre: 'UK Rap', primaryCountries: ['GB', 'IE'], isLocalOnly: true },
  { artist: 'Stormzy', title: 'Hide & Seek', genre: 'Grime', primaryCountries: ['GB', 'IE'], isLocalOnly: true },
  { artist: 'RAYE', title: 'Escapism.', genre: 'Pop', primaryCountries: ['GB', 'IE', 'US', 'AU'], isLocalOnly: false },
  { artist: 'Fred again..', title: 'Delilah (pull me out of this)', genre: 'Electronic', primaryCountries: ['GB', 'AU', 'US'], isLocalOnly: false },

  // AFRICA (NG, ZA)
  { artist: 'Burna Boy', title: 'Last Last', genre: 'Afrobeats', primaryCountries: ['NG', 'ZA', 'GB', 'US'], isLocalOnly: false },
  { artist: 'Asake', title: 'Lonely At The Top', genre: 'Street Pop', primaryCountries: ['NG', 'GH', 'GB'], isLocalOnly: false },
  { artist: 'Rema', title: 'Calm Down', genre: 'Afrobeats', primaryCountries: ['NG', 'IN', 'US', 'FR'], isLocalOnly: false },
  { artist: 'Tyler ICU', title: 'Mnike', genre: 'Amapiano', primaryCountries: ['ZA', 'NG', 'KE'], isLocalOnly: true },
  { artist: 'Tyla', title: 'Water', genre: 'Afro-Pop', primaryCountries: ['ZA', 'NG', 'US', 'GB'], isLocalOnly: false },

  // SOUTH ASIA (IN, PK)
  { artist: 'Arijit Singh', title: 'Kesariya', genre: 'Bollywood', primaryCountries: ['IN', 'PK', 'BD', 'NP'], isLocalOnly: true },
  { artist: 'Diljit Dosanjh', title: 'Lover', genre: 'Punjabi Pop', primaryCountries: ['IN', 'CA', 'GB'], isLocalOnly: false },
  { artist: 'AP Dhillon', title: 'Brown Munde', genre: 'Desi Hip-Hop', primaryCountries: ['IN', 'CA', 'GB'], isLocalOnly: false },
  { artist: 'Shubh', title: 'Cheques', genre: 'Desi Hip-Hop', primaryCountries: ['IN', 'CA', 'PK'], isLocalOnly: true },
  { artist: 'King', title: 'Maan Meri Jaan', genre: 'Indie Hindi', primaryCountries: ['IN', 'PK'], isLocalOnly: true }
];

// -----------------------------------------------------------------------------------------
// HIT TRAJECTORY & VIRAL CLASSIFICATION
// -----------------------------------------------------------------------------------------

export type HitScope = 'local_gem' | 'domestic_sensation' | 'regional_hit' | 'global_crossover';

export interface HitScopeInfo {
  scope: HitScope;
  label: string;
  badgeColor: string;
  description: string;
  domesticSharePercent: number; // e.g., 75% for domestic sensations, 25% for global
  internationalReach: number;   // 0.1 to 1.0
}

/**
 * Determines whether a song is viral locally only vs globally across all markets.
 * Purely follows the user request:
 * "kadang lagu artis asli itu ada yang viral tapi cuman di region dia doang,
 * ada lagu artis yang viralnya ke semua region mendunia".
 */
export function evaluateSongHitScope(
  song: Song,
  artistCountry: string,
  artistPop: number,
  artistHype: number
): HitScopeInfo {
  const momentum = song.momentum || 0.5;
  const quality = song.quality || 50;
  const totalStreams = song.streams || 0;
  const hasGlobalPlaylist = song.playlistPlacements && song.playlistPlacements.some(p => p === 'tth' || p === 'v50');

  // Criteria for Global Crossover:
  // Must have high quality, strong global hype, high streams, or major global playlist
  if (
    (artistPop >= 65 && quality >= 78 && momentum >= 0.75) ||
    (hasGlobalPlaylist && quality >= 70) ||
    totalStreams > 20000000
  ) {
    return {
      scope: 'global_crossover',
      label: 'Global Crossover Hit',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      description: 'Viral across all continents. Charting in US, Europe, Asia & Latin America simultaneously.',
      domesticSharePercent: 22,
      internationalReach: 0.95
    };
  }

  // Criteria for Regional Hit:
  if (
    (artistPop >= 40 && momentum >= 0.6) ||
    (quality >= 75 && momentum >= 0.5) ||
    totalStreams > 5000000
  ) {
    return {
      scope: 'regional_hit',
      label: 'Regional Smash',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      description: 'Strong breakout across culturally aligned markets and neighboring territories.',
      domesticSharePercent: 48,
      internationalReach: 0.65
    };
  }

  // Criteria for Domestic Sensation (Viral Lokal):
  // Very popular in home country! Can reach #1 domestically while unknown abroad!
  if (momentum >= 0.4 || quality >= 60 || (song.dailyStreams || 0) > 20000) {
    return {
      scope: 'domestic_sensation',
      label: 'Domestic Viral Sensation',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      description: 'Massive viral hit in home territory! Holding top domestic spots and dominating local charts.',
      domesticSharePercent: 78,
      internationalReach: 0.25
    };
  }

  // Baseline Local Gem
  return {
    scope: 'local_gem',
    label: 'Local Cult Favorite',
    badgeColor: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40',
    description: 'Niche listener base concentrated heavily within the domestic hometown market.',
    domesticSharePercent: 88,
    internationalReach: 0.12
  };
}

// -----------------------------------------------------------------------------------------
// TERRITORIAL BREAKDOWN CALCULATOR (STREAMS, VIEWS, SALES PER COUNTRY)
// -----------------------------------------------------------------------------------------

export interface CountryMetricResult {
  code: string;
  name: string;
  flag: string;
  tier: number;
  regionGroup: RegionGroup;
  streams: number;
  views: number;
  pureSales: number;
  radio: number;
  totalUnits: number;
  marketSharePercent: number;
  isHomeMarket: boolean;
}

/**
 * Calculates realistic country-by-country breakdown for streams, views, and pure sales.
 */
export function calculateSongTerritorialBreakdown(
  song: Song,
  artistCountry: string = 'US',
  artistPop: number = 20,
  artistHype: number = 20,
  isWeekly = false
): CountryMetricResult[] {
  const hitInfo = evaluateSongHitScope(song, artistCountry, artistPop, artistHype);
  const homeProfile = getCountryMarketProfile(artistCountry);
  const homeRegion = homeProfile.regionGroup;

  const allCountries = Object.keys(COUNTRY_TIERS);
  const rawWeights: Record<string, number> = {};
  let sumWeight = 0;

  allCountries.forEach(cc => {
    const prof = getCountryMarketProfile(cc);
    let weight = prof.marketSizeWeight;

    const isHome = cc === artistCountry;
    const isSameRegion = prof.regionGroup === homeRegion;

    if (hitInfo.scope === 'domestic_sensation' || hitInfo.scope === 'local_gem') {
      // In a domestic hit, home country gets huge concentration!
      if (isHome) {
        weight *= 14;
      } else if (isSameRegion) {
        weight *= 1.8;
      } else {
        weight *= 0.15; // Barely any presence in distant continents
      }
    } else if (hitInfo.scope === 'regional_hit') {
      if (isHome) {
        weight *= 6;
      } else if (isSameRegion) {
        weight *= 3.5;
      } else {
        weight *= 0.6;
      }
    } else {
      // Global Crossover Hit:
      // Penetrates everywhere, but home country still has natural +25% hometown pride
      if (isHome) {
        weight *= 1.5;
      } else if (isSameRegion) {
        weight *= 1.2;
      }
    }

    // Add slight deterministic pseudo-random variance based on country code & title
    const titleLen = (song && song.title) ? song.title.length : 10;
    const hash = (cc.charCodeAt(0) * 17 + cc.charCodeAt(1) * 31 + titleLen) % 30;
    weight *= (0.85 + (hash / 100));

    rawWeights[cc] = Math.max(0.1, weight);
    sumWeight += rawWeights[cc];
  });

  // Support weekly tracking period metrics (e.g. for Billboard & Weekly Charts) vs all-time catalog totals
  const totalStreams = isWeekly
    ? ((song.weeklyStreams && song.weeklyStreams >= (song.dailyStreams || 0) * 3.5) ? song.weeklyStreams : (song.dailyStreams ? song.dailyStreams * 7 : (song.streams || 0)))
    : (song.streams || 0);

  const totalViews = isWeekly
    ? ((song.weeklyViews && song.weeklyViews >= (song.dailyViews || 0) * 3.5) ? song.weeklyViews : (song.dailyViews ? song.dailyViews * 7 : (song.views || 0)))
    : (song.views || 0);

  const totalSales = isWeekly
    ? ((song.weeklyPureSales && song.weeklyPureSales >= (song.dailyPureSales || 0) * 3.5) ? song.weeklyPureSales : (song.dailyPureSales ? song.dailyPureSales * 7 : (song.pureSales || 0)))
    : (song.pureSales || 0);

  const totalRadio = isWeekly
    ? ((song.weeklyRadioPlays && song.weeklyRadioPlays >= (song.dailyRadioPlays || 0) * 3.5) ? song.weeklyRadioPlays : (song.dailyRadioPlays ? song.dailyRadioPlays * 7 : (song.radioPlays || 0)))
    : (song.radioPlays || 0);

  const results: CountryMetricResult[] = allCountries.map(cc => {
    const prof = getCountryMarketProfile(cc);
    const fraction = rawWeights[cc] / sumWeight;
    const isHome = cc === artistCountry;

    // Adjust specific streams vs views vs sales based on that country's consumer culture:
    // e.g. Japan has higher sales propensity, Indonesia/India has higher YouTube view propensity
    const countryStreamWeight = fraction * (prof.streamingShare / 0.60);
    const countryViewWeight = fraction * (prof.youtubeShare / 0.30);
    const countrySalesWeight = fraction * (prof.salesShare / 0.05);
    const countryRadioWeight = fraction * (prof.radioShare / 0.04);

    const countryStreams = Math.round(totalStreams * countryStreamWeight);
    const countryViews = Math.round(totalViews * countryViewWeight);
    const countrySales = Math.round(totalSales * countrySalesWeight);
    const countryRadio = Math.round(totalRadio * countryRadioWeight);

    const totalUnits = countryStreams + (countrySales * 150) + (countryViews * 0.2);

    return {
      code: cc,
      name: prof.name,
      flag: getFlagEmoji(cc),
      tier: prof.tier,
      regionGroup: prof.regionGroup,
      streams: countryStreams,
      views: countryViews,
      pureSales: countrySales,
      radio: countryRadio,
      totalUnits,
      marketSharePercent: fraction * 100,
      isHomeMarket: isHome
    };
  });

  // Sort descending by total units
  results.sort((a, b) => b.totalUnits - a.totalUnits);

  return results;
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// -----------------------------------------------------------------------------------------
// AUTHENTIC REGIONAL CHART GENERATOR
// -----------------------------------------------------------------------------------------

export interface GenerateChartOptions {
  platform: 'billboard' | 'spotify' | 'youtube' | 'itunes';
  region: string; // 'global' or 2-letter country code
  playerSongs: Song[];
  playerName: string;
  playerCountry: string;
  playerPopularity: number;
  playerHype: number;
  isWeekly?: boolean;
  currentDate?: Date | string;
  limit?: number;
}

const COMPREHENSIVE_GLOBAL_HITS = [
  { artist: 'Taylor Swift', title: 'Cruel Summer', baseGlobalScore: 100, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Billie Eilish', title: 'BIRDS OF A FEATHER', baseGlobalScore: 97, genre: 'Alt-Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Sabrina Carpenter', title: 'Espresso', baseGlobalScore: 95, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Kendrick Lamar', title: 'Not Like Us', baseGlobalScore: 93, genre: 'Hip-Hop', countryOrigin: 'US', hasMV: true },
  { artist: 'Bruno Mars', title: 'Die With A Smile', baseGlobalScore: 91, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Bad Bunny', title: 'Tití Me Preguntó', baseGlobalScore: 89, genre: 'Reggaeton', countryOrigin: 'PR', hasMV: true },
  { artist: 'Drake', title: "God's Plan", baseGlobalScore: 87, genre: 'Hip-Hop', countryOrigin: 'CA', hasMV: true },
  { artist: 'Chappell Roan', title: 'Good Luck, Babe!', baseGlobalScore: 85, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'The Weeknd', title: 'Blinding Lights', baseGlobalScore: 83, genre: 'R&B', countryOrigin: 'CA', hasMV: true },
  { artist: 'Post Malone', title: 'I Had Some Help', baseGlobalScore: 81, genre: 'Pop Rap', countryOrigin: 'US', hasMV: true },
  { artist: 'Sabrina Carpenter', title: 'Please Please Please', baseGlobalScore: 79, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Kendrick Lamar', title: 'luther', baseGlobalScore: 77, genre: 'Hip-Hop', countryOrigin: 'US', hasMV: true },
  { artist: 'Taylor Swift', title: 'Fortnight', baseGlobalScore: 75, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'SZA', title: 'Snooze', baseGlobalScore: 74, genre: 'R&B', countryOrigin: 'US', hasMV: true },
  { artist: 'Ariana Grande', title: "we can't be friends (wait for your love)", baseGlobalScore: 72, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Charli XCX', title: 'Apple', baseGlobalScore: 70, genre: 'Hyperpop', countryOrigin: 'GB', hasMV: true },
  { artist: 'The Kid LAROI', title: 'STAY', baseGlobalScore: 68, genre: 'Pop', countryOrigin: 'AU', hasMV: true },
  { artist: 'Dua Lipa', title: 'Houdini', baseGlobalScore: 66, genre: 'Disco Pop', countryOrigin: 'GB', hasMV: true },
  { artist: 'Olivia Rodrigo', title: 'vampire', baseGlobalScore: 64, genre: 'Pop Rock', countryOrigin: 'US', hasMV: true },
  { artist: 'Doja Cat', title: 'Paint The Town Red', baseGlobalScore: 63, genre: 'Hip-Hop', countryOrigin: 'US', hasMV: true },
  { artist: 'Ariana Grande', title: 'yes, and?', baseGlobalScore: 62, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Ed Sheeran', title: 'Bad Habits', baseGlobalScore: 61, genre: 'Pop', countryOrigin: 'GB', hasMV: true },
  { artist: 'Taylor Swift', title: 'Midnight Rain', baseGlobalScore: 60, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Drake', title: 'One Dance', baseGlobalScore: 58, genre: 'Hip-Hop', countryOrigin: 'CA', hasMV: true },
  { artist: 'Bad Bunny', title: 'Moscow Mule', baseGlobalScore: 57, genre: 'Reggaeton', countryOrigin: 'PR', hasMV: true },
  { artist: 'Billie Eilish', title: 'LUNCH', baseGlobalScore: 56, genre: 'Alt-Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Harry Styles', title: 'As It Was', baseGlobalScore: 55, genre: 'Pop', countryOrigin: 'GB', hasMV: true },
  { artist: 'Travis Scott', title: 'FE!N', baseGlobalScore: 54, genre: 'Trap', countryOrigin: 'US', hasMV: true },
  { artist: 'Future & Metro Boomin', title: 'Like That', baseGlobalScore: 53, genre: 'Trap', countryOrigin: 'US', hasMV: true },
  { artist: 'Benson Boone', title: 'Beautiful Things', baseGlobalScore: 52, genre: 'Pop Rock', countryOrigin: 'US', hasMV: true },
  { artist: 'Teddy Swims', title: 'Lose Control', baseGlobalScore: 51, genre: 'Soul', countryOrigin: 'US', hasMV: true },
  { artist: 'Hozier', title: 'Too Sweet', baseGlobalScore: 50, genre: 'Indie Rock', countryOrigin: 'IE', hasMV: true },
  { artist: 'Tommy Richman', title: 'MILLION DOLLAR BABY', baseGlobalScore: 49, genre: 'Funk R&B', countryOrigin: 'US', hasMV: true },
  { artist: 'Beyoncé', title: "TEXAS HOLD 'EM", baseGlobalScore: 48, genre: 'Country Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Chappell Roan', title: 'Pink Pony Club', baseGlobalScore: 47, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Charli XCX', title: '360', baseGlobalScore: 46, genre: 'Hyperpop', countryOrigin: 'GB', hasMV: true },
  { artist: 'Kendrick Lamar', title: 'HUMBLE.', baseGlobalScore: 45, genre: 'Hip-Hop', countryOrigin: 'US', hasMV: true },
  { artist: 'The Kid LAROI', title: 'WITHOUT YOU', baseGlobalScore: 44, genre: 'Pop Rock', countryOrigin: 'AU', hasMV: true },
  { artist: 'ROSALÍA', title: 'DESPECHÁ', baseGlobalScore: 43, genre: 'Latin Pop', countryOrigin: 'ES', hasMV: true },
  { artist: 'Dua Lipa', title: 'Levitating', baseGlobalScore: 42, genre: 'Disco', countryOrigin: 'GB', hasMV: true },
  { artist: 'Post Malone', title: 'Circles', baseGlobalScore: 41, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'The Weeknd', title: 'Save Your Tears', baseGlobalScore: 40, genre: 'Pop', countryOrigin: 'CA', hasMV: true },
  { artist: 'Harry Styles', title: 'Watermelon Sugar', baseGlobalScore: 39, genre: 'Pop', countryOrigin: 'GB', hasMV: true },
  { artist: 'SZA', title: 'Kill Bill', baseGlobalScore: 38, genre: 'R&B', countryOrigin: 'US', hasMV: true },
  { artist: 'Olivia Rodrigo', title: 'drivers license', baseGlobalScore: 37, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Justin Bieber', title: 'Peaches', baseGlobalScore: 36, genre: 'Pop', countryOrigin: 'CA', hasMV: true },
  { artist: 'Doja Cat', title: 'Agora Hills', baseGlobalScore: 35, genre: 'R&B', countryOrigin: 'US', hasMV: true },
  { artist: 'Ariana Grande', title: '7 rings', baseGlobalScore: 34, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Ed Sheeran', title: 'Shape of You', baseGlobalScore: 33, genre: 'Pop', countryOrigin: 'GB', hasMV: true },
  { artist: 'Taylor Swift', title: 'Anti-Hero', baseGlobalScore: 32, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Drake', title: 'Rich Flex', baseGlobalScore: 31, genre: 'Hip-Hop', countryOrigin: 'CA', hasMV: true },
  { artist: 'Bad Bunny', title: 'MONACO', baseGlobalScore: 30, genre: 'Trap Latino', countryOrigin: 'PR', hasMV: true },
  { artist: 'Billie Eilish', title: 'bad guy', baseGlobalScore: 29, genre: 'Alt-Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Sabrina Carpenter', title: 'Taste', baseGlobalScore: 28, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Chappell Roan', title: 'HOT TO GO!', baseGlobalScore: 27, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'Charli XCX', title: 'Von dutch', baseGlobalScore: 26, genre: 'Hyperpop', countryOrigin: 'GB', hasMV: true },
  { artist: 'Kendrick Lamar', title: 'squabble up', baseGlobalScore: 25, genre: 'Hip-Hop', countryOrigin: 'US', hasMV: true },
  { artist: 'The Kid LAROI', title: 'BLEED', baseGlobalScore: 24, genre: 'Pop', countryOrigin: 'AU', hasMV: true },
  { artist: 'ROSALÍA', title: 'SAOKO', baseGlobalScore: 23, genre: 'Latin Pop', countryOrigin: 'ES', hasMV: true },
  { artist: 'Dua Lipa', title: 'Training Season', baseGlobalScore: 22, genre: 'Pop', countryOrigin: 'GB', hasMV: true },
  { artist: 'Post Malone', title: 'Sunflower', baseGlobalScore: 21, genre: 'Pop', countryOrigin: 'US', hasMV: true },
  { artist: 'The Weeknd', title: 'Starboy', baseGlobalScore: 20, genre: 'Electronic Pop', countryOrigin: 'CA', hasMV: true },
  { artist: 'Harry Styles', title: 'Late Night Talking', baseGlobalScore: 19, genre: 'Pop', countryOrigin: 'GB', hasMV: true },
  { artist: 'SZA', title: 'Saturn', baseGlobalScore: 18, genre: 'R&B', countryOrigin: 'US', hasMV: true },
  { artist: 'Olivia Rodrigo', title: 'good 4 u', baseGlobalScore: 17, genre: 'Pop Rock', countryOrigin: 'US', hasMV: true },
  { artist: 'Justin Bieber', title: 'Ghost', baseGlobalScore: 16, genre: 'Pop', countryOrigin: 'CA', hasMV: true },
  { artist: 'Doja Cat', title: 'Woman', baseGlobalScore: 15, genre: 'Pop', countryOrigin: 'US', hasMV: true }
];

import { generateRealNpcSinglesChart } from './npcRealReleaseChartsEngine';

/**
 * Generates an authentic country-specific chart 100% from actual NPC releases (`npc.songs` & `npc.albums`)
 * and the Player's released catalog — with zero mock filler data.
 */
export function generateAuthenticRegionalChart(options: GenerateChartOptions): ChartItem[] {
  return generateRealNpcSinglesChart(options);
}

export function legacyGenerateAuthenticRegionalChartUnused(options: GenerateChartOptions): ChartItem[] {
  const {
    platform,
    region,
    playerSongs,
    playerName,
    playerCountry,
    playerPopularity,
    playerHype,
    isWeekly = false,
    currentDate,
    limit = 50
  } = options;

  const effectiveDate = currentDate ? (typeof currentDate === 'string' ? new Date(currentDate) : currentDate) : new Date();

  const isGlobal = region === 'global';
  const profile = isGlobal ? null : getCountryMarketProfile(region);
  const domesticLoyalty = profile ? profile.domesticLoyalty : 0.45;
  const regionGroup = profile ? profile.regionGroup : 'North America';

  const chartEntries: ChartItem[] = [];

  // Helper to determine accurate territory peak #1 baseline for each platform
  // Ensures realistic market caps: NO country ever exceeds Global, and NO country has unrealistic figures (like 48M)
  const getTerritoryPeak = (): number => {
    if (isGlobal) {
      if (platform === 'spotify') {
        return isWeekly ? 63000000 : 9150000; // ~63M weekly vs ~9.15M daily streams at #1 Global Spotify
      }
      if (platform === 'youtube') return 22000000;  // ~22M daily views at #1 Global YouTube for massive viral MV debuts
      if (platform === 'billboard') return 240000;  // ~240K weekly units at #1 Billboard Global 200
      if (platform === 'itunes') return 16500;      // ~16.5K daily downloads at #1 iTunes Global (Fierce international digital sales)
      return 1000000;
    }

    // Country-specific Peak #1 capacities based on real industry metrics:
    const tier = profile ? profile.tier : 2;
    const countryCode = (region || 'US').toUpperCase();

    if (platform === 'spotify') {
      if (isWeekly) {
        // Realistic 7-Day Cumulative Streams for Spotify Weekly Top 50 (#1 spot)
        if (countryCode === 'US') return 22500000;
        if (countryCode === 'IN') return 12800000;
        if (countryCode === 'BR') return 10500000;
        if (countryCode === 'MX') return 9400000;
        if (countryCode === 'ID') return 8900000;
        if (countryCode === 'GB') return 6100000;
        if (countryCode === 'PH') return 5700000;
        if (countryCode === 'DE') return 5400000;
        if (countryCode === 'ES') return 5200000;
        if (countryCode === 'FR') return 5000000;
        if (countryCode === 'JP') return 4700000;
        if (countryCode === 'CA') return 4300000;
        if (countryCode === 'KR') return 4000000;
        if (countryCode === 'AU') return 3600000;
        if (tier === 1) return 4500000;
        if (tier === 2) return 3800000;
        if (tier === 3) return 1800000;
        return 650000;
      }

      // Daily Streams for Spotify Daily Top 50 (#1 spot)
      // US peak: ~3.25M, BR: ~1.5M, MX: ~1.35M, ID: ~1.28M, GB: ~880K, DE: ~780K, JP: ~680K, KR: ~580K
      if (countryCode === 'US') return 3250000;
      if (countryCode === 'BR') return 1500000;
      if (countryCode === 'MX') return 1350000;
      if (countryCode === 'ID') return 1280000;
      if (countryCode === 'IN') return 1850000;
      if (countryCode === 'GB') return 880000;
      if (countryCode === 'PH') return 820000;
      if (countryCode === 'DE') return 780000;
      if (countryCode === 'ES') return 750000;
      if (countryCode === 'FR') return 720000;
      if (countryCode === 'JP') return 680000;
      if (countryCode === 'CA') return 620000;
      if (countryCode === 'KR') return 580000;
      if (countryCode === 'AU') return 520000;
      if (tier === 1) return 650000;
      if (tier === 2) return 550000;
      if (tier === 3) return 260000;
      return 95000;
    }

    if (platform === 'youtube') {
      // YouTube Music Video Daily Views in single territory:
      // Strong premiere capability in major markets
      if (countryCode === 'IN') return 4800000;
      if (countryCode === 'US') return 4200000;
      if (countryCode === 'BR') return 3900000;
      if (countryCode === 'ID') return 3800000;
      if (countryCode === 'MX') return 3500000;
      if (countryCode === 'PH') return 1800000;
      if (countryCode === 'GB') return 1400000;
      if (countryCode === 'JP') return 1300000;
      if (countryCode === 'DE') return 1200000;
      if (countryCode === 'FR') return 1100000;
      if (tier === 1) return 1250000;
      if (tier === 2) return 950000;
      if (tier === 3) return 450000;
      return 180000;
    }

    if (platform === 'billboard') {
      if (countryCode === 'US') return 135000;
      if (tier === 1) return 70000;
      if (tier === 2) return 40000;
      if (tier === 3) return 18000;
      return 8000;
    }

    if (platform === 'itunes') {
      // Stiffened iTunes Top 50 competition based on real digital storefront battles
      if (countryCode === 'US') return 5800;
      if (countryCode === 'JP') return 3100;
      if (countryCode === 'GB') return 2600;
      if (countryCode === 'DE') return 1950;
      if (countryCode === 'FR') return 1650;
      if (countryCode === 'KR') return 1550;
      if (countryCode === 'AU') return 1400;
      if (countryCode === 'CA') return 1300;
      if (tier === 1) return 2200;
      if (tier === 2) return 1000;
      return 350;
    }

    return 500000;
  };

  const territoryPeak = getTerritoryPeak();

  // Calibrated, authentic rank decay curve multiplier based on real streaming & sales drop-offs
  const getCurveMultiplier = (rank: number): number => {
    if (platform === 'billboard') {
      // Tightened Billboard Hot 100 competition across top 10-100 positions
      return getTightenedHot100CurveMultiplier(rank);
    }
    if (platform === 'itunes') {
      // Fierce iTunes digital downloads curve: #1 = 100%, #5 = ~52%, #10 = ~38%, #25 = ~23%, #50 = ~14%
      // Ensures high competition throughout the top 50 so coasting is impossible without sustained sales
      return 0.08 + (0.92 * Math.pow(rank, -0.52));
    }
    // Spotify & YouTube streaming: #1 = 100%, #10 = ~45%, #25 = ~28%, #50 = ~16%
    return 0.12 + (0.88 * Math.pow(rank, -0.50));
  };

  interface CandidateItem {
    title: string;
    artist: string;
    isPlayer: boolean;
    cover: string;
    points: number;
    score: number;
    weeksOnChart: number;
    simulatedLastRankDelta?: number;
    stats?: { streams: number; sales: number; radio: number };
  }

  // 1. Build and score authentic NPC competitor pool
  const rawNpcCandidates: {
    title: string;
    artist: string;
    cover: string;
    score: number;
    weeksOnChart: number;
    simulatedLastRankDelta?: number;
  }[] = [];

  // A. Global Crossover Tracks with Dynamic NPC Lifecycle Engine
  COMPREHENSIVE_GLOBAL_HITS.forEach((track, idx) => {
    const dynamic = getNpcTrackDynamicMultiplier(track.title, track.artist, track.baseGlobalScore, effectiveDate);
    let score = track.baseGlobalScore * dynamic.dynamicScoreMultiplier;

    if (!isGlobal) {
      const isOriginCountry = track.countryOrigin === region;
      const resistanceFactor = Math.max(0.40, 1.05 - domesticLoyalty * 0.50);
      if (isOriginCountry) {
        score = score * 1.25;
      } else {
        score = score * resistanceFactor;
      }
    }

    const hash = ((track.title.length * 7) + idx * 13 + effectiveDate.getDate() * 3) % 7;
    score += (hash - 3) * 0.35;

    const coverArt = platform === 'youtube'
      ? getNpcVideoThumbnail(track.artist, track.title)
      : (getTrackCoverArt(track.artist, track.title) || resolveAuthenticCover(track.artist, track.title));

    rawNpcCandidates.push({
      title: platform === 'youtube' ? `${track.title} (Official Music Video)` : track.title,
      artist: track.artist,
      cover: coverArt,
      score: Math.max(1, score),
      weeksOnChart: dynamic.weeksOnChart,
      simulatedLastRankDelta: dynamic.simulatedLastRankDelta
    });
  });

  // A2. Active Annual NPC Singles (ensures every NPC's new yearly album singles chart globally & regionally)
  REAL_WORLD_NPCS.forEach((npc, npcIdx) => {
    const activeSongs = (npc.songs || []).slice(0, 2);
    activeSongs.forEach((s, sIdx) => {
      const candidateTitle = platform === 'youtube' ? `${s.title} (Official Music Video)` : s.title;
      if (rawNpcCandidates.some(c => c.artist === npc.name && c.title.toLowerCase() === candidateTitle.toLowerCase())) {
        return;
      }
      const baseScore = Math.max(20, (npc.pop - sIdx * 6) * (isGlobal ? 0.96 : (npc.country === region ? 1.18 : 0.78)));
      const dynamic = getNpcTrackDynamicMultiplier(s.title, npc.name, baseScore, effectiveDate);
      const score = baseScore * dynamic.dynamicScoreMultiplier + ((npcIdx % 5) * 0.4);
      const coverArt = platform === 'youtube'
        ? getNpcVideoThumbnail(npc.name, s.title)
        : (s.cover || getTrackCoverArt(npc.name, s.title) || resolveAuthenticCover(npc.name, s.title));

      rawNpcCandidates.push({
        title: candidateTitle,
        artist: npc.name,
        cover: coverArt,
        score: Math.max(1, score),
        weeksOnChart: dynamic.weeksOnChart,
        simulatedLastRankDelta: dynamic.simulatedLastRankDelta
      });
    });
  });

  // B. Domestic Hits from AUTHENTIC_DOMESTIC_HITS with Dynamic Engine
  AUTHENTIC_DOMESTIC_HITS.forEach((hit, idx) => {
    const isDomesticToThisCountry = !isGlobal && hit.primaryCountries.includes(region);
    const isDomesticToThisRegion = !isGlobal && hit.primaryCountries.some(cc => getCountryMarketProfile(cc).regionGroup === regionGroup);

    let baseScore = 0;
    if (isGlobal) {
      baseScore = !hit.isLocalOnly ? (48 + ((idx % 7) * 4)) : (4 + (idx % 4));
    } else {
      if (isDomesticToThisCountry) {
        baseScore = 86 + ((idx % 6) * 4.5);
      } else if (isDomesticToThisRegion && !hit.isLocalOnly) {
        baseScore = 28 + ((idx % 5) * 3);
      } else {
        baseScore = 2 + (idx % 3);
      }
    }

    const dynamic = getNpcTrackDynamicMultiplier(hit.title, hit.artist, baseScore, effectiveDate);
    const score = baseScore * dynamic.dynamicScoreMultiplier;

    const coverArt = platform === 'youtube'
      ? getNpcVideoThumbnail(hit.artist, hit.title)
      : (getTrackCoverArt(hit.artist, hit.title) || resolveAuthenticCover(hit.artist, hit.title));

    rawNpcCandidates.push({
      title: platform === 'youtube' ? `${hit.title} (Music Video)` : hit.title,
      artist: hit.artist,
      cover: coverArt,
      score: Math.max(1, score),
      weeksOnChart: dynamic.weeksOnChart,
      simulatedLastRankDelta: dynamic.simulatedLastRankDelta
    });
  });

  // C. Guarantee sufficient competitor depth (at least limit + 35 competitor tracks)
  // Prevents empty slots or unnatural rank squeezing
  const targetNpcCount = Math.max(limit + 35, 85);
  let simIdx = 0;
  while (rawNpcCandidates.length < targetNpcCount && simIdx < 150) {
    const sim = getSimulatedSingleEntry(simIdx);
    const simTitle = platform === 'youtube' ? `${sim.title} (Official Music Video)` : sim.title;
    const exists = rawNpcCandidates.some(c => c.title === simTitle && c.artist === sim.artist);
    if (!exists) {
      const dynamic = getNpcTrackDynamicMultiplier(sim.title, sim.artist, 30, effectiveDate);
      const baseScore = Math.max(2, (26 * Math.pow(0.975, simIdx)) * dynamic.dynamicScoreMultiplier);
      const coverArt = platform === 'youtube'
        ? getNpcVideoThumbnail(sim.artist, sim.title)
        : sim.cover;

      rawNpcCandidates.push({
        title: simTitle,
        artist: sim.artist,
        cover: coverArt,
        score: baseScore,
        weeksOnChart: dynamic.weeksOnChart,
        simulatedLastRankDelta: dynamic.simulatedLastRankDelta
      });
    }
    simIdx++;
  }

  // D. Sort NPC candidates by score descending and assign realistic territorial chart points
  rawNpcCandidates.sort((a, b) => b.score - a.score);

  const dayOfWeek = effectiveDate.getDay();
  const daySeasonality = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.05 : (dayOfWeek === 1 ? 0.96 : 1.0);

  const npcCandidates: CandidateItem[] = rawNpcCandidates.map((cand, idx) => {
    const rank = idx + 1;
    const curveMult = getCurveMultiplier(rank);
    // Dynamic sales surge on iTunes: discount campaigns, remixed versions, stan coordinated buying pushes
    const itunesCampaignBonus = (platform === 'itunes' && ((idx * 17 + effectiveDate.getDate() * 23) % 6 === 0)) ? 1.22 : 1.0;
    const subtleVariance = (0.985 + (((cand.title.length * 19) + (rank * 37) + (effectiveDate.getDate() * 11)) % 30) / 1000) * daySeasonality * itunesCampaignBonus;
    const computedPoints = Math.round(territoryPeak * curveMult * subtleVariance);

    return {
      title: cand.title,
      artist: cand.artist,
      isPlayer: false,
      cover: cand.cover,
      points: computedPoints,
      score: cand.score,
      weeksOnChart: cand.weeksOnChart,
      simulatedLastRankDelta: cand.simulatedLastRankDelta
    };
  });

  // 2. Evaluate Player's Released Songs by their authentic metrics
  const playerCandidates: CandidateItem[] = [];

  playerSongs.filter(s => s.status === 'released').forEach(s => {
    let rawPts = 0;

    if (isGlobal) {
      if (platform === 'billboard') {
        const weeklySales = (s.weeklyPureSales && s.weeklyPureSales >= (s.dailyPureSales || 0) * 3.5) ? s.weeklyPureSales : (s.dailyPureSales ? s.dailyPureSales * 7 : (s.pureSales || 0));
        const weeklyStreams = (s.weeklyStreams && s.weeklyStreams >= (s.dailyStreams || 0) * 3.5) ? s.weeklyStreams : (s.dailyStreams ? s.dailyStreams * 7 : (s.streams || 0));
        const weeklyRadio = (s.weeklyRadioPlays && s.weeklyRadioPlays >= (s.dailyRadioPlays || 0) * 3.5) ? s.weeklyRadioPlays : (s.dailyRadioPlays ? s.dailyRadioPlays * 7 : (s.radioPlays || 0));
        const weeklyVideo = s.hasMV ? ((s.weeklyViews && s.weeklyViews >= (s.dailyViews || 0) * 3.5) ? s.weeklyViews : (s.dailyViews ? s.dailyViews * 7 : (s.views || 0))) : 0;
        rawPts = calculateAuthenticBillboardPoints({
          weeklyAudioStreams: weeklyStreams,
          weeklyVideoViews: weeklyVideo,
          weeklyPureSales: weeklySales,
          weeklyRadioPlays: weeklyRadio,
          isGlobal: true
        });
      } else if (platform === 'spotify') {
        rawPts = isWeekly
          ? ((s.weeklyStreams && s.weeklyStreams > 0) ? s.weeklyStreams : ((s.dailyStreams || 0) * 7))
          : (s.dailyStreams !== undefined ? s.dailyStreams : 0);
      } else if (platform === 'youtube') {
        if (!s.hasMV) return;
        rawPts = s.dailyViews !== undefined ? s.dailyViews : 0;
      } else if (platform === 'itunes') {
        rawPts = s.dailyPureSales !== undefined ? s.dailyPureSales : (s.pureSales || 0);
      }
    } else {
      const isPlatformWeekly = platform === 'billboard' || isWeekly;
      const breakdown = calculateSongTerritorialBreakdown(s, playerCountry, playerPopularity, playerHype, isPlatformWeekly);
      const countryData = breakdown.find(b => b.code === region);
      const shareFraction = countryData ? (countryData.marketSharePercent / 100) : 0.01;

      if (platform === 'billboard') {
        if (countryData) {
          const videoViewsTerritory = s.hasMV ? Math.round(countryData.views || 0) : 0;
          rawPts = calculateAuthenticBillboardPoints({
            weeklyAudioStreams: countryData.streams,
            weeklyVideoViews: videoViewsTerritory,
            weeklyPureSales: countryData.pureSales,
            weeklyRadioPlays: countryData.radio,
            isGlobal: false
          });
        }
      } else if (platform === 'spotify') {
        const globalMetric = isWeekly
          ? ((s.weeklyStreams && s.weeklyStreams > 0) ? s.weeklyStreams : ((s.dailyStreams || 0) * 7))
          : (s.dailyStreams !== undefined ? s.dailyStreams : 0);
        rawPts = Math.round(globalMetric * shareFraction * (profile ? (profile.streamingShare / 0.60) : 1));
      } else if (platform === 'youtube') {
        if (!s.hasMV) return;
        const globalViews = s.dailyViews !== undefined ? s.dailyViews : 0;
        rawPts = Math.round(globalViews * shareFraction * (profile ? (profile.youtubeShare / 0.30) : 1));
      } else if (platform === 'itunes') {
        const globalSales = (s.dailyPureSales !== undefined && s.dailyPureSales > 0)
          ? s.dailyPureSales
          : (s.pureSales || 0);
        rawPts = Math.round(globalSales * shareFraction * (profile ? (profile.salesShare / 0.05) : 1));
      }
    }

    const finalPlayerPts = Math.round(rawPts);
    if (finalPlayerPts > 0) {
      playerCandidates.push({
        title: s.title,
        artist: playerName || 'Player Artist',
        isPlayer: true,
        cover: platform === 'youtube' ? (s.mvThumbnail || s.cover) : (s.cover || resolveAuthenticCover(playerName, s.title)),
        points: finalPlayerPts,
        score: finalPlayerPts,
        weeksOnChart: 1
      });
    }
  });

  // 3. COMBINE ALL COMPETITORS AND SORT STRICTLY DESCENDING BY POINTS
  // Resolves the bug where low-performing player songs crowded positions 45-50 / 95-100!
  // Player songs only enter the chart if their points genuinely beat the cutoff.
  const combinedCandidates: CandidateItem[] = [...npcCandidates, ...playerCandidates];
  combinedCandidates.sort((a, b) => b.points - a.points);

  // 4. Take the top 'limit' entries
  const selectedEntries = combinedCandidates.slice(0, limit);

  selectedEntries.forEach((cand, idx) => {
    const rank = idx + 1;
    const finalPoints = cand.points;

    let stats = cand.stats;
    if (!stats) {
      if (platform === 'billboard') {
        const regionalBreakdown = calculateRegionalBillboardBreakdown(finalPoints, region, false);
        stats = {
          streams: regionalBreakdown.streamsSES,
          sales: regionalBreakdown.pureSalesDirect,
          radio: regionalBreakdown.radioImpressions
        };
      } else if (platform === 'spotify') {
        stats = {
          streams: isWeekly ? finalPoints : Math.round(finalPoints * 7),
          sales: Math.round(finalPoints * (isWeekly ? 0.0014 : 0.0028)),
          radio: Math.round(finalPoints * (isWeekly ? 0.08 : 0.4))
        };
      } else if (platform === 'youtube') {
        stats = {
          streams: Math.round(finalPoints * 4.5),
          sales: Math.round(finalPoints * 0.0008),
          radio: Math.round(finalPoints * 0.06)
        };
      } else {
        stats = {
          streams: Math.round(finalPoints * 200),
          sales: finalPoints,
          radio: Math.round(finalPoints * 5)
        };
      }
    }

    let initialLastPos: number | null = null;
    if (cand.simulatedLastRankDelta !== undefined && cand.simulatedLastRankDelta !== 0) {
      initialLastPos = Math.max(1, rank + cand.simulatedLastRankDelta);
    } else if (rank <= 2) {
      initialLastPos = rank;
    } else if (rank % 7 === 0) {
      initialLastPos = null;
    } else {
      initialLastPos = Math.max(1, rank + (((rank * 7) % 5) - 2));
    }

    chartEntries.push({
      title: cand.title,
      artist: cand.artist,
      points: finalPoints,
      isPlayer: cand.isPlayer,
      cover: cand.cover,
      lastPosition: initialLastPos,
      peakPosition: Math.min(rank, initialLastPos || rank),
      weeksOnChart: cand.weeksOnChart || 1,
      stats
    });
  });

  return chartEntries;
}

