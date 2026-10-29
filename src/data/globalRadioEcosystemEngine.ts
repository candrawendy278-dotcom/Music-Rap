// Global Radio Ecosystem Engine
// Authentic multi-territory broadcast simulation across 8 global territories & 24 flagship networks.
// Covers 5-Daypart rotation grids, Listener Callout & MScore research (Familiarity, Net Positive, Burnout),
// Official Add Dates, Independent Pluggers, Covert Payola & Watchdog (FCC/Ofcom/KPI) Investigations,
// Live Morning Show Interviews & Acoustic Radio Lounge sessions, and Billboard Airplay + Streaming discovery impact.

import { GameState, Song } from '../types';
import {
  RadioChartEntry,
  RadioFormatId,
  generateRadioAirplayChart
} from './radioAirplayChartEngine';

export type RadioTerritoryId =
  | 'ALL'
  | 'US'
  | 'GB'
  | 'EU'
  | 'ID'
  | 'JP'
  | 'KR'
  | 'BR'
  | 'LATAM';

export type RadioDaypartId =
  | 'morning_drive'
  | 'midday'
  | 'afternoon_drive'
  | 'evening'
  | 'overnight';

export interface RadioDaypartDefinition {
  id: RadioDaypartId;
  name: string;
  shortName: string;
  timeWindow: string;
  audiencePerSpinMultiplier: number;
  baseSpinSharePct: number;
  description: string;
}

export interface FlagshipStationNetwork {
  id: string;
  name: string;
  callSignOrFreq: string;
  city: string;
  territoryId: Exclude<RadioTerritoryId, 'ALL'>;
  ownerGroup: string;
  primaryFormat: RadioFormatId;
  weeklyCumeMillions: number;
  programDirector: string;
  signatureShow: string;
  loungeSessionName: string;
}

export interface RadioTerritoryDefinition {
  id: RadioTerritoryId;
  name: string;
  shortName: string;
  flag: string;
  monitoringBody: string;
  regulatoryWatchdog: string;
  panelStationsCount: number;
  audienceReachMultiplier: number;
  billboardHot100Weight: number;
  billboardGlobal200Weight: number;
  streamDiscoveryRatePerSpin: number;
  standardAddCost: number;
  indiePluggerCost: number;
  covertPayolaCost: number;
  interviewCost: number;
  loungeCost: number;
  genreAffinities: Record<string, number>;
  flagshipStations: FlagshipStationNetwork[];
}

export interface SongCalloutMetrics {
  songId?: number;
  title: string;
  artist: string;
  isPlayer: boolean;
  territoryId: RadioTerritoryId;
  familiarityPct: number; // 0-100%
  favoritePct: number; // 0-60%
  likePct: number; // 0-60%
  dislikePct: number; // 0-50%
  netPositiveScore: number; // (Favorite + Like) - Dislike
  burnoutRatePct: number; // 0-100%, >32% triggers Recurrent step-down
  mScore: number; // 0-100 station switching retention index
  calloutVerdict:
    | 'POWER CALLOUT'
    | 'STRONG TEST'
    | 'DEVELOPING'
    | 'HIGH BURNOUT'
    | 'POLARIZING';
}

export interface SongDaypartAllocation {
  daypartId: RadioDaypartId;
  spins7d: number;
  sharePct: number;
  audienceMillions: number;
  statusLabel: 'PEAK DRIVE' | 'ACTIVE ROTATION' | 'TESTING' | 'LOW';
}

export interface TerritorySongCampaignState {
  songId: number;
  territoryId: Exclude<RadioTerritoryId, 'ALL'>;
  servicedTier: 'none' | 'standard_add' | 'indie_plugger' | 'covert_payola';
  bonusDailySpins: number;
  familiarityBonus: number;
  netPositiveBonus: number;
  burnoutReduction: number;
  morningDriveBoostPct: number;
  lastServicedDate?: string;
  lastInterviewDate?: string;
  lastLoungeDate?: string;
  isBlacklisted?: boolean;
  blacklistUntilDate?: string;
}

export interface TerritoryWatchdogState {
  territoryId: Exclude<RadioTerritoryId, 'ALL'>;
  scrutinyPct: number; // 0-100%
  activeInvestigation?: {
    songId: number;
    songTitle: string;
    authority: string;
    dateTriggered: string;
    expiresDate: string;
    finePaid: number;
  } | null;
}

export interface RadioPromoLogItem {
  id: string;
  date: string;
  territoryId: Exclude<RadioTerritoryId, 'ALL'>;
  type: 'add_date' | 'plugger' | 'payola' | 'interview' | 'lounge' | 'scandal';
  headline: string;
  detail: string;
}

export interface GlobalRadioEcosystemState {
  campaigns: Record<string, TerritorySongCampaignState>; // key: `${songId}_${territoryId}`
  watchdogs: Record<Exclude<RadioTerritoryId, 'ALL'>, TerritoryWatchdogState>;
  logs: RadioPromoLogItem[];
  totalGlobalWeeklySpins: number;
  totalGlobalAudienceMillions: number;
  dailyRadioStreamDiscoveryBonus: number;
}

export interface EnhancedRadioChartEntry extends RadioChartEntry {
  territoryId: RadioTerritoryId;
  callout: SongCalloutMetrics;
  dayparts: SongDaypartAllocation[];
  isBlacklistedInTerritory?: boolean;
  hasActivePayolaPush?: boolean;
}

export const RADIO_DAYPART_DEFINITIONS: RadioDaypartDefinition[] = [
  {
    id: 'morning_drive',
    name: 'Morning Drive',
    shortName: 'AM Drive',
    timeWindow: '06:00 – 10:00',
    audiencePerSpinMultiplier: 1.45,
    baseSpinSharePct: 22,
    description: 'Peak commuter & morning show hours. Highest audience impressions per spin.'
  },
  {
    id: 'midday',
    name: 'Midday At-Work',
    shortName: 'Midday',
    timeWindow: '10:00 – 15:00',
    audiencePerSpinMultiplier: 1.15,
    baseSpinSharePct: 24,
    description: 'High workplace & retail retention. Ideal for high-familiarity Pop & Adult hits.'
  },
  {
    id: 'afternoon_drive',
    name: 'Afternoon Drive',
    shortName: 'PM Drive',
    timeWindow: '15:00 – 19:00',
    audiencePerSpinMultiplier: 1.35,
    baseSpinSharePct: 24,
    description: 'After-school & evening commute rush. Heavy Power Rotation & youth engagement.'
  },
  {
    id: 'evening',
    name: 'Evening Request',
    shortName: 'Evening',
    timeWindow: '19:00 – 24:00',
    audiencePerSpinMultiplier: 0.95,
    baseSpinSharePct: 18,
    description: 'Interactive countdowns & listener requests where rising singles build momentum.'
  },
  {
    id: 'overnight',
    name: 'Overnight Test',
    shortName: 'Overnight',
    timeWindow: '00:00 – 06:00',
    audiencePerSpinMultiplier: 0.45,
    baseSpinSharePct: 12,
    description: 'Early testing rotation for newly serviced singles before daytime promotion.'
  }
];

export const FLAGSHIP_STATION_NETWORKS: FlagshipStationNetwork[] = [
  // United States
  {
    id: 'us_kiis',
    name: 'KIIS-FM Los Angeles',
    callSignOrFreq: '102.7 FM • KIIS',
    city: 'Los Angeles, US',
    territoryId: 'US',
    ownerGroup: 'iHeartMedia',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 3.85,
    programDirector: 'Beata Murphy',
    signatureShow: 'On Air with Ryan Seacrest',
    loungeSessionName: 'iHeartRadio Theater LA Session'
  },
  {
    id: 'us_z100',
    name: 'Z100 New York',
    callSignOrFreq: '100.3 FM • WHTZ',
    city: 'New York, US',
    territoryId: 'US',
    ownerGroup: 'iHeartMedia',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 4.12,
    programDirector: 'Mark Medina',
    signatureShow: 'Elvis Duran and the Morning Show',
    loungeSessionName: 'Z100 Hammerstein Studio Live'
  },
  {
    id: 'us_hot97',
    name: 'Hot 97 New York',
    callSignOrFreq: '97.1 FM • WQHT',
    city: 'New York, US',
    territoryId: 'US',
    ownerGroup: 'Mediaco Broadcasting',
    primaryFormat: 'rhythmic_urban',
    weeklyCumeMillions: 2.65,
    programDirector: 'TT Torrez',
    signatureShow: 'Ebro in the Morning',
    loungeSessionName: 'Hot 97 Freestyle & Cypher Lounge'
  },
  // United Kingdom
  {
    id: 'gb_bbcr1',
    name: 'BBC Radio 1',
    callSignOrFreq: '97–99 FM • National',
    city: 'London, UK',
    territoryId: 'GB',
    ownerGroup: 'BBC Audio',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 7.95,
    programDirector: 'Aled Haydn Jones',
    signatureShow: 'Radio 1 Breakfast with Greg James',
    loungeSessionName: 'BBC Radio 1 Live Lounge (Maida Vale)'
  },
  {
    id: 'gb_capital',
    name: 'Capital FM UK',
    callSignOrFreq: '95.8 FM • London',
    city: 'London, UK',
    territoryId: 'GB',
    ownerGroup: 'Global Media',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 6.40,
    programDirector: 'Brent Tobin',
    signatureShow: 'Capital Breakfast with Jordan North',
    loungeSessionName: 'Capital Up Close Studio Session'
  },
  {
    id: 'gb_1xtra',
    name: 'BBC Radio 1Xtra',
    callSignOrFreq: 'DAB+ • National UK',
    city: 'London, UK',
    territoryId: 'GB',
    ownerGroup: 'BBC Audio',
    primaryFormat: 'rhythmic_urban',
    weeklyCumeMillions: 1.85,
    programDirector: 'Faron McKenzie',
    signatureShow: '1Xtra Rap Show & Nadia Jae Breakfast',
    loungeSessionName: '1Xtra Fire in the Booth Live'
  },
  // Continental Europe
  {
    id: 'eu_nrj',
    name: 'NRJ France & Europe',
    callSignOrFreq: '100.3 FM • Paris',
    city: 'Paris, France',
    territoryId: 'EU',
    ownerGroup: 'NRJ Group',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 5.70,
    programDirector: 'Morgan Serrano',
    signatureShow: 'Manu dans le 6/10 & Euro Hot 30',
    loungeSessionName: 'NRJ Live Session Paris'
  },
  {
    id: 'eu_1live',
    name: 'WDR 1LIVE Germany',
    callSignOrFreq: '106.7 FM • Cologne',
    city: 'Cologne, Germany',
    territoryId: 'EU',
    ownerGroup: 'WDR ARD',
    primaryFormat: 'hot_ac',
    weeklyCumeMillions: 3.45,
    programDirector: 'Schiwa Schlei',
    signatureShow: '1LIVE Morningshow',
    loungeSessionName: '1LIVE Radiokonzert Session'
  },
  {
    id: 'eu_rtl',
    name: 'RTL 102.5 Italy',
    callSignOrFreq: '102.5 FM • National',
    city: 'Milan, Italy',
    territoryId: 'EU',
    ownerGroup: 'RTL Group',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 6.10,
    programDirector: 'Lorenzo Suraci',
    signatureShow: 'Non Stop News & Power Hits',
    loungeSessionName: 'RTL 102.5 Suite Live Milan'
  },
  // Indonesia
  {
    id: 'id_prambors',
    name: 'Prambors FM 102.2',
    callSignOrFreq: '102.2 FM • 9 Cities',
    city: 'Jakarta, Indonesia',
    territoryId: 'ID',
    ownerGroup: 'Masima Radio Network',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 4.35,
    programDirector: 'Iqbal Tawakal',
    signatureShow: 'Prambors Morning Show & Top 40',
    loungeSessionName: 'Prambors Sunset Live Acoustic'
  },
  {
    id: 'id_hardrock',
    name: 'Hard Rock FM 87.6',
    callSignOrFreq: '87.6 FM • Jakarta/Bali',
    city: 'Jakarta, Indonesia',
    territoryId: 'ID',
    ownerGroup: 'MRA Broadcast Media',
    primaryFormat: 'hot_ac',
    weeklyCumeMillions: 2.15,
    programDirector: 'Rafiendra',
    signatureShow: 'Good Morning Hard Rockers Show',
    loungeSessionName: 'Hard Rock FM Intimate Lounge'
  },
  {
    id: 'id_genfm',
    name: 'Gen 98.7 FM Jakarta',
    callSignOrFreq: '98.7 FM • Jakarta',
    city: 'Jakarta, Indonesia',
    territoryId: 'ID',
    ownerGroup: 'Mahaka Radio Integra',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 3.60,
    programDirector: 'Adrian Syarkawie',
    signatureShow: 'Semangat Pagi Gen FM',
    loungeSessionName: 'Gen Live Music Corner'
  },
  // Japan
  {
    id: 'jp_jwave',
    name: 'J-WAVE 81.3 FM',
    callSignOrFreq: '81.3 FM • Tokyo',
    city: 'Tokyo, Japan',
    territoryId: 'JP',
    ownerGroup: 'J-Wave Inc. / JFL',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 3.25,
    programDirector: 'Kenichi Kamiya',
    signatureShow: 'SAISON CARD TOKIO HOT 100',
    loungeSessionName: 'J-WAVE Roppongi Hills Studio Live'
  },
  {
    id: 'jp_tokyofm',
    name: 'TOKYO FM 80.0',
    callSignOrFreq: '80.0 FM • JFN 38 Stn',
    city: 'Tokyo, Japan',
    territoryId: 'JP',
    ownerGroup: 'Japan FM Network',
    primaryFormat: 'hot_ac',
    weeklyCumeMillions: 4.50,
    programDirector: 'Hiroshi Sato',
    signatureShow: 'ONE MORNING & School of Lock!',
    loungeSessionName: 'TFM Ginza Sony Park Live'
  },
  {
    id: 'jp_fm802',
    name: 'FM802 Osaka',
    callSignOrFreq: '80.2 FM • Kansai',
    city: 'Osaka, Japan',
    territoryId: 'JP',
    ownerGroup: 'FM802 Co.',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 2.30,
    programDirector: 'Takashiima',
    signatureShow: 'OSAKAN HOT 100',
    loungeSessionName: 'FM802 Heavy Rotation Studio Session'
  },
  // South Korea
  {
    id: 'kr_kbscool',
    name: 'KBS Cool FM 89.1',
    callSignOrFreq: '89.1 MHz • Seoul',
    city: 'Seoul, South Korea',
    territoryId: 'KR',
    ownerGroup: 'Korean Broadcasting System',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 3.90,
    programDirector: 'Park Ji-hoon',
    signatureShow: 'KBS Cool FM Volume Up & Music Plaza',
    loungeSessionName: 'Yeouido Open Studio Acoustic Live'
  },
  {
    id: 'kr_mbcfm4u',
    name: 'MBC FM4U 91.9',
    callSignOrFreq: '91.9 MHz • National',
    city: 'Seoul, South Korea',
    territoryId: 'KR',
    ownerGroup: 'Munhwa Broadcasting',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 4.15,
    programDirector: 'Kim Seo-yeon',
    signatureShow: 'Noon Song of Hope (Kim Shin-young)',
    loungeSessionName: 'MBC Garden Studio Live'
  },
  {
    id: 'kr_sbspower',
    name: 'SBS Power FM 107.7',
    callSignOrFreq: '107.7 MHz • Seoul',
    city: 'Seoul, South Korea',
    territoryId: 'KR',
    ownerGroup: 'SBS Media',
    primaryFormat: 'rhythmic_urban',
    weeklyCumeMillions: 3.75,
    programDirector: 'Lee Min-ho',
    signatureShow: 'Two O’Clock Escape Cultwo Show',
    loungeSessionName: 'SBS Mokdong Live On-Air Stage'
  },
  // Brazil
  {
    id: 'br_jovempan',
    name: 'Jovem Pan FM Brasil',
    callSignOrFreq: '100.9 FM • São Paulo',
    city: 'São Paulo, Brazil',
    territoryId: 'BR',
    ownerGroup: 'Grupo Jovem Pan',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 5.40,
    programDirector: 'Tutinha / Paulinho',
    signatureShow: 'As 7 Melhores & Pânico na Rádio',
    loungeSessionName: 'Estúdio Jovem Pan Paulista Live'
  },
  {
    id: 'br_mixfm',
    name: 'Rádio Mix FM 106.3',
    callSignOrFreq: '106.3 FM • 42 Affiliates',
    city: 'São Paulo, Brazil',
    territoryId: 'BR',
    ownerGroup: 'Grupo Mix de Comunicação',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 3.80,
    programDirector: 'Willy',
    signatureShow: 'Top Mix & Cafezinho',
    loungeSessionName: 'Mix Acústico São Paulo'
  },
  {
    id: 'br_metropolitana',
    name: 'Metropolitana FM 98.5',
    callSignOrFreq: '98.5 FM • SP',
    city: 'São Paulo, Brazil',
    territoryId: 'BR',
    ownerGroup: 'Rede Metropolitana',
    primaryFormat: 'rhythmic_urban',
    weeklyCumeMillions: 2.95,
    programDirector: 'Jayr Sanzone',
    signatureShow: 'Chupim & Sequência Maxima',
    loungeSessionName: 'Metropolitana Pocket Show'
  },
  // Latin America
  {
    id: 'latam_los40',
    name: 'LOS40 México & LatAm',
    callSignOrFreq: '101.7 FM • CDMX / Bogotá',
    city: 'Mexico City / Bogotá',
    territoryId: 'LATAM',
    ownerGroup: 'PRISA Radio / TelevisaUnivision',
    primaryFormat: 'international',
    weeklyCumeMillions: 6.25,
    programDirector: 'Julio César Ramírez',
    signatureShow: ' ¡Ya Párate! & Del 40 al 1',
    loungeSessionName: 'LOS40 Básico Acoustic Session'
  },
  {
    id: 'latam_exa',
    name: 'Exa FM 104.9 Network',
    callSignOrFreq: '104.9 FM • 70 Cities',
    city: 'Mexico City, Mexico',
    territoryId: 'LATAM',
    ownerGroup: 'MVS Radio',
    primaryFormat: 'pop_chr',
    weeklyCumeMillions: 4.80,
    programDirector: 'Jessie Cervantes',
    signatureShow: 'Jessie en Exa & Exametro',
    loungeSessionName: 'Cabina Naranja Exa Live'
  },
  {
    id: 'latam_lamega',
    name: 'La Mega 90.9 Colombia',
    callSignOrFreq: '90.9 FM • RCN Radio',
    city: 'Bogotá / Medellín',
    territoryId: 'LATAM',
    ownerGroup: 'RCN Radio',
    primaryFormat: 'rhythmic_urban',
    weeklyCumeMillions: 3.40,
    programDirector: 'Alejandro Villalobos',
    signatureShow: 'El Mañanero de La Mega',
    loungeSessionName: 'Megaland Studio Session'
  }
];

export const RADIO_TERRITORY_DEFINITIONS: RadioTerritoryDefinition[] = [
  {
    id: 'ALL',
    name: 'All Global Territories (Combined)',
    shortName: 'Global Combined',
    flag: '🌐',
    monitoringBody: 'Mediabase + Global Radiomonitor',
    regulatoryWatchdog: 'International Broadcast Compliance',
    panelStationsCount: 2150,
    audienceReachMultiplier: 1.0,
    billboardHot100Weight: 0.45,
    billboardGlobal200Weight: 1.0,
    streamDiscoveryRatePerSpin: 14.5,
    standardAddCost: 4500,
    indiePluggerCost: 14000,
    covertPayolaCost: 45000,
    interviewCost: 6000,
    loungeCost: 9500,
    genreAffinities: { pop: 1.15, 'r&b': 1.08, 'hip-hop': 1.08, 'k-pop': 1.05, latin: 1.05, rock: 1.0 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.slice(0, 8)
  },
  {
    id: 'US',
    name: 'United States (Mediabase / BDS)',
    shortName: 'United States',
    flag: '🇺🇸',
    monitoringBody: 'Mediabase / Luminate BDS',
    regulatoryWatchdog: 'FCC Enforcement Bureau (47 U.S.C. § 317)',
    panelStationsCount: 680,
    audienceReachMultiplier: 1.35,
    billboardHot100Weight: 1.0,
    billboardGlobal200Weight: 0.34,
    streamDiscoveryRatePerSpin: 18.0,
    standardAddCost: 3500,
    indiePluggerCost: 12500,
    covertPayolaCost: 42000,
    interviewCost: 5000,
    loungeCost: 8500,
    genreAffinities: { pop: 1.2, 'hip-hop': 1.3, rap: 1.3, 'r&b': 1.25, country: 1.25, rock: 1.0 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'US')
  },
  {
    id: 'GB',
    name: 'United Kingdom (RAJAR / Official UK)',
    shortName: 'United Kingdom',
    flag: '🇬🇧',
    monitoringBody: 'RAJAR / Radiomonitor UK',
    regulatoryWatchdog: 'Ofcom Broadcast Standards Code',
    panelStationsCount: 210,
    audienceReachMultiplier: 0.92,
    billboardHot100Weight: 0.0,
    billboardGlobal200Weight: 0.14,
    streamDiscoveryRatePerSpin: 15.5,
    standardAddCost: 2800,
    indiePluggerCost: 9500,
    covertPayolaCost: 32000,
    interviewCost: 4200,
    loungeCost: 7500,
    genreAffinities: { pop: 1.28, dance: 1.35, electronic: 1.3, indie: 1.2, 'hip-hop': 1.1 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'GB')
  },
  {
    id: 'EU',
    name: 'Continental Europe (NRJ / RTL)',
    shortName: 'Europe',
    flag: '🇪🇺',
    monitoringBody: 'Radiomonitor Europe Top 100',
    regulatoryWatchdog: 'EBU & ARCOM Broadcast Watchdog',
    panelStationsCount: 380,
    audienceReachMultiplier: 1.05,
    billboardHot100Weight: 0.0,
    billboardGlobal200Weight: 0.16,
    streamDiscoveryRatePerSpin: 14.0,
    standardAddCost: 3000,
    indiePluggerCost: 10500,
    covertPayolaCost: 35000,
    interviewCost: 4500,
    loungeCost: 7200,
    genreAffinities: { pop: 1.25, dance: 1.38, synth: 1.25, rock: 1.1 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'EU')
  },
  {
    id: 'ID',
    name: 'Indonesia (Prambors / Hard Rock FM)',
    shortName: 'Indonesia',
    flag: '🇮🇩',
    monitoringBody: 'ASIRI / Prambors & Hard Rock Panel',
    regulatoryWatchdog: 'KPI (Komisi Penyiaran Indonesia)',
    panelStationsCount: 165,
    audienceReachMultiplier: 0.85,
    billboardHot100Weight: 0.0,
    billboardGlobal200Weight: 0.09,
    streamDiscoveryRatePerSpin: 16.5,
    standardAddCost: 1800,
    indiePluggerCost: 6500,
    covertPayolaCost: 22000,
    interviewCost: 2800,
    loungeCost: 4800,
    genreAffinities: { pop: 1.35, 'r&b': 1.22, indie: 1.25, ballad: 1.3, 'k-pop': 1.2 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'ID')
  },
  {
    id: 'JP',
    name: 'Japan (J-Wave / Billboard Japan)',
    shortName: 'Japan',
    flag: '🇯🇵',
    monitoringBody: 'Billboard Japan Radio / Radiko',
    regulatoryWatchdog: 'MIC Japan Broadcast Ethics Council',
    panelStationsCount: 140,
    audienceReachMultiplier: 0.88,
    billboardHot100Weight: 0.0,
    billboardGlobal200Weight: 0.10,
    streamDiscoveryRatePerSpin: 15.0,
    standardAddCost: 2600,
    indiePluggerCost: 9000,
    covertPayolaCost: 30000,
    interviewCost: 4000,
    loungeCost: 6800,
    genreAffinities: { pop: 1.25, 'j-pop': 1.4, 'k-pop': 1.28, rock: 1.22, synth: 1.18 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'JP')
  },
  {
    id: 'KR',
    name: 'South Korea (KBS Cool / MBC FM4U)',
    shortName: 'South Korea',
    flag: '🇰🇷',
    monitoringBody: 'Circle Airplay / Broadcast Monitor',
    regulatoryWatchdog: 'KCC (Korea Communications Commission)',
    panelStationsCount: 120,
    audienceReachMultiplier: 0.82,
    billboardHot100Weight: 0.0,
    billboardGlobal200Weight: 0.08,
    streamDiscoveryRatePerSpin: 17.5,
    standardAddCost: 2400,
    indiePluggerCost: 8200,
    covertPayolaCost: 28000,
    interviewCost: 3600,
    loungeCost: 6200,
    genreAffinities: { 'k-pop': 1.45, pop: 1.3, 'r&b': 1.22, dance: 1.25, 'hip-hop': 1.12 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'KR')
  },
  {
    id: 'BR',
    name: 'Brazil (Crowley / Jovem Pan)',
    shortName: 'Brazil',
    flag: '🇧🇷',
    monitoringBody: 'Crowley Broadcast Analysis Brasil',
    regulatoryWatchdog: 'Anatel & ABERT Compliance',
    panelStationsCount: 220,
    audienceReachMultiplier: 0.90,
    billboardHot100Weight: 0.0,
    billboardGlobal200Weight: 0.09,
    streamDiscoveryRatePerSpin: 16.0,
    standardAddCost: 2000,
    indiePluggerCost: 7000,
    covertPayolaCost: 24000,
    interviewCost: 3200,
    loungeCost: 5400,
    genreAffinities: { pop: 1.3, latin: 1.32, dance: 1.25, 'r&b': 1.15 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'BR')
  },
  {
    id: 'LATAM',
    name: 'Latin America (Monitor Latino / LOS40)',
    shortName: 'Latin America',
    flag: '🌎',
    monitoringBody: 'Monitor Latino / LOS40 Panel',
    regulatoryWatchdog: 'IFT & CRC Broadcast Standards',
    panelStationsCount: 235,
    audienceReachMultiplier: 0.94,
    billboardHot100Weight: 0.0,
    billboardGlobal200Weight: 0.11,
    streamDiscoveryRatePerSpin: 16.2,
    standardAddCost: 2200,
    indiePluggerCost: 7500,
    covertPayolaCost: 26000,
    interviewCost: 3400,
    loungeCost: 5800,
    genreAffinities: { latin: 1.45, pop: 1.28, reggaeton: 1.42, dance: 1.2, 'hip-hop': 1.15 },
    flagshipStations: FLAGSHIP_STATION_NETWORKS.filter(s => s.territoryId === 'LATAM')
  }
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getEnsuredRadioEcosystemState(state: GameState): GlobalRadioEcosystemState {
  const existing = (state as any).radioEcosystemState as GlobalRadioEcosystemState | undefined;
  const territories: Array<Exclude<RadioTerritoryId, 'ALL'>> = [
    'US',
    'GB',
    'EU',
    'ID',
    'JP',
    'KR',
    'BR',
    'LATAM'
  ];

  const defaultWatchdogs = {} as Record<Exclude<RadioTerritoryId, 'ALL'>, TerritoryWatchdogState>;
  territories.forEach(t => {
    defaultWatchdogs[t] = existing?.watchdogs?.[t] || {
      territoryId: t,
      scrutinyPct: 0,
      activeInvestigation: null
    };
  });

  return {
    campaigns: existing?.campaigns || {},
    watchdogs: defaultWatchdogs,
    logs: existing?.logs || [],
    totalGlobalWeeklySpins: existing?.totalGlobalWeeklySpins || 0,
    totalGlobalAudienceMillions: existing?.totalGlobalAudienceMillions || 0,
    dailyRadioStreamDiscoveryBonus: existing?.dailyRadioStreamDiscoveryBonus || 0
  };
}

export function getTerritoryDefinition(territoryId: RadioTerritoryId): RadioTerritoryDefinition {
  return (
    RADIO_TERRITORY_DEFINITIONS.find(t => t.id === territoryId) ||
    RADIO_TERRITORY_DEFINITIONS[0]
  );
}

export function computeSongCalloutMetrics(
  entry: {
    songId?: number;
    title: string;
    artist: string;
    isPlayer: boolean;
    weeksOnChart: number;
    weeklySpins: number;
    spinBullet: number;
    genre: string;
  },
  state: GameState,
  territoryId: RadioTerritoryId
): SongCalloutMetrics {
  const eco = getEnsuredRadioEcosystemState(state);
  const effectiveTerritory: Exclude<RadioTerritoryId, 'ALL'> =
    territoryId === 'ALL' ? 'US' : territoryId;

  const campaignKey = entry.songId ? `${entry.songId}_${effectiveTerritory}` : '';
  const campaign = campaignKey ? eco.campaigns[campaignKey] : undefined;

  const playerSong = entry.songId ? state.songs.find(s => s.id === entry.songId) : undefined;
  const quality = playerSong?.quality || 78;
  const seed = hashSeed(`${entry.artist}::${entry.title}::${territoryId}`);

  // Familiarity grows with weeks on chart, weekly spins, and interviews/pluggers
  const baseFamiliarity = Math.min(
    98,
    Math.round(
      24 +
        entry.weeksOnChart * 4.4 +
        (entry.weeklySpins / 18500) * 38 +
        (campaign?.familiarityBonus || 0)
    )
  );
  const familiarityPct = Math.max(12, Math.min(99, baseFamiliarity));

  // Favorite & Like percentages driven by song quality and acoustic lounge sessions
  const qualityFactor = (quality - 60) * 0.45;
  const favoritePct = Math.max(
    10,
    Math.min(
      52,
      Math.round(
        21 +
          qualityFactor +
          ((seed % 9) - 4) +
          Math.round((campaign?.netPositiveBonus || 0) * 0.6)
      )
    )
  );
  const likePct = Math.max(
    18,
    Math.min(
      48,
      Math.round(31 + (seed % 7) + Math.round((campaign?.netPositiveBonus || 0) * 0.4))
    )
  );

  // Burnout rises after Week 6 in heavy rotation
  const rawBurnout =
    entry.weeksOnChart <= 4
      ? 4 + entry.weeksOnChart * 1.8
      : entry.weeksOnChart <= 9
      ? 11 + (entry.weeksOnChart - 4) * 3.4 + (entry.weeklySpins > 13000 ? 4 : 0)
      : 28 + (entry.weeksOnChart - 9) * 3.8;

  const payolaFatiguePenalty =
    campaign?.servicedTier === 'covert_payola' ? 5 : 0;

  const burnoutRatePct = Math.max(
    3,
    Math.min(
      64,
      Math.round(rawBurnout + payolaFatiguePenalty - (campaign?.burnoutReduction || 0))
    )
  );

  const dislikePct = Math.max(
    4,
    Math.min(
      42,
      Math.round(burnoutRatePct * 0.55 + Math.max(0, 75 - quality) * 0.35)
    )
  );

  const netPositiveScore = favoritePct + likePct - dislikePct;

  // MScore (Listener station-switching retention index 0-100)
  const mScore = Math.max(
    42,
    Math.min(
      99,
      Math.round(64 + netPositiveScore * 0.48 - burnoutRatePct * 0.32)
    )
  );

  let calloutVerdict: SongCalloutMetrics['calloutVerdict'] = 'DEVELOPING';
  if (burnoutRatePct >= 32) {
    calloutVerdict = 'HIGH BURNOUT';
  } else if (netPositiveScore >= 42 && familiarityPct >= 65) {
    calloutVerdict = 'POWER CALLOUT';
  } else if (netPositiveScore >= 28 && familiarityPct >= 45) {
    calloutVerdict = 'STRONG TEST';
  } else if (dislikePct >= 24) {
    calloutVerdict = 'POLARIZING';
  }

  return {
    songId: entry.songId,
    title: entry.title,
    artist: entry.artist,
    isPlayer: entry.isPlayer,
    territoryId,
    familiarityPct,
    favoritePct,
    likePct,
    dislikePct,
    netPositiveScore,
    burnoutRatePct,
    mScore,
    calloutVerdict
  };
}

export function computeSongDaypartBreakdown(
  weeklySpins: number,
  audienceMillions: number,
  callout: SongCalloutMetrics,
  morningDriveBoostPct = 0
): SongDaypartAllocation[] {
  // Songs with strong callout or morning interview boosts get higher Morning & Afternoon Drive shares
  const isPower = callout.calloutVerdict === 'POWER CALLOUT' || weeklySpins >= 11500;
  const isTesting = callout.familiarityPct < 45 && weeklySpins < 4200;

  const rawWeights: Record<RadioDaypartId, number> = {
    morning_drive: isPower ? 26 + morningDriveBoostPct : isTesting ? 14 + morningDriveBoostPct : 21 + morningDriveBoostPct,
    midday: isPower ? 25 : isTesting ? 19 : 24,
    afternoon_drive: isPower ? 26 : isTesting ? 18 : 24,
    evening: isPower ? 15 : isTesting ? 25 : 19,
    overnight: isPower ? 8 : isTesting ? 24 : 12
  };

  const weightSum = Object.values(rawWeights).reduce((acc, v) => acc + v, 0) || 100;

  return RADIO_DAYPART_DEFINITIONS.map(dp => {
    const sharePct = Math.round((rawWeights[dp.id] / weightSum) * 100);
    const spins7d = Math.max(5, Math.round((weeklySpins * sharePct) / 100));
    const weightedAud = Number(
      (
        audienceMillions *
        (sharePct / 100) *
        (dp.audiencePerSpinMultiplier / 1.12)
      ).toFixed(2)
    );

    let statusLabel: SongDaypartAllocation['statusLabel'] = 'ACTIVE ROTATION';
    if ((dp.id === 'morning_drive' || dp.id === 'afternoon_drive') && sharePct >= 24) {
      statusLabel = 'PEAK DRIVE';
    } else if (dp.id === 'overnight' && sharePct >= 18) {
      statusLabel = 'TESTING';
    } else if (sharePct <= 11) {
      statusLabel = 'LOW';
    }

    return {
      daypartId: dp.id,
      spins7d,
      sharePct,
      audienceMillions: weightedAud,
      statusLabel
    };
  });
}

/**
 * Generates a full territory-aware and format-aware Top 50 Radio Airplay chart
 * enriched with 5-Daypart rotations, Listener Callout & MScore telemetry, and Payola/Blacklist status.
 */
export function generateTerritoryRadioChart(
  state: GameState,
  territoryId: RadioTerritoryId = 'ALL',
  formatId: RadioFormatId = 'all'
): {
  territoryMeta: RadioTerritoryDefinition;
  baseChart: ReturnType<typeof generateRadioAirplayChart>;
  entries: EnhancedRadioChartEntry[];
  playerEntries: EnhancedRadioChartEntry[];
  greatestGainer: EnhancedRadioChartEntry | null;
  mostAdded: EnhancedRadioChartEntry | null;
} {
  const territoryMeta = getTerritoryDefinition(territoryId);
  const baseChart = generateRadioAirplayChart(state, formatId);
  const eco = getEnsuredRadioEcosystemState(state);

  const effectiveTerritory: Exclude<RadioTerritoryId, 'ALL'> =
    territoryId === 'ALL' ? 'US' : territoryId;

  const adjustedEntries: EnhancedRadioChartEntry[] = baseChart.entries.map(item => {
    const genreKey = (item.genre || 'pop').toLowerCase();
    let genreTerritoryMult = 1.0;
    Object.entries(territoryMeta.genreAffinities).forEach(([g, mult]) => {
      if (genreKey.includes(g)) {
        genreTerritoryMult = Math.max(genreTerritoryMult, mult);
      }
    });

    // Deterministic regional variance for NPC tracks so different countries have distinct leaders
    const regSeed = hashSeed(`${item.artist}::${item.title}::${territoryId}`);
    const npcRegionalWave = item.isPlayer
      ? 1.0
      : territoryId === 'ALL'
      ? 1.0
      : 0.76 + ((regSeed % 48) / 100);

    // Check player territory campaign
    const campaignKey = item.songId ? `${item.songId}_${effectiveTerritory}` : '';
    const campaign = campaignKey ? eco.campaigns[campaignKey] : undefined;

    // If territory is 'ALL', aggregate bonuses across all 8 territories for the player song
    let territoryCampaignBonusSpins = 0;
    let morningBoostPct = 0;
    let isBlacklisted = false;
    let hasActivePayolaPush = false;

    if (item.isPlayer && item.songId) {
      if (territoryId === 'ALL') {
        Object.values(eco.campaigns).forEach(c => {
          if (c.songId === item.songId) {
            if (c.isBlacklisted) {
              territoryCampaignBonusSpins -= 1400;
            } else {
              territoryCampaignBonusSpins += c.bonusDailySpins * 7;
              morningBoostPct = Math.max(morningBoostPct, c.morningDriveBoostPct || 0);
              if (c.servicedTier === 'covert_payola') hasActivePayolaPush = true;
            }
          }
        });
      } else if (campaign) {
        isBlacklisted = Boolean(campaign.isBlacklisted);
        hasActivePayolaPush = campaign.servicedTier === 'covert_payola';
        morningBoostPct = campaign.morningDriveBoostPct || 0;
        territoryCampaignBonusSpins = isBlacklisted
          ? -Math.round(item.weeklySpins * 0.68)
          : campaign.bonusDailySpins * 7;
      }
    }

    const panelScale =
      territoryId === 'ALL'
        ? 1.0
        : Math.max(0.32, territoryMeta.panelStationsCount / 680);

    const rawWeeklySpins = Math.round(
      (item.weeklySpins * panelScale * genreTerritoryMult * npcRegionalWave) +
        territoryCampaignBonusSpins
    );

    const weeklySpins = Math.max(85, Math.min(24500, rawWeeklySpins));
    const dailySpins = Math.max(12, Math.round(weeklySpins / 7));

    const spinBullet = Math.round(
      item.spinBullet * panelScale * (isBlacklisted ? -1.5 : hasActivePayolaPush ? 1.35 : 1.0)
    );

    const audPerSpin = 0.0038 * territoryMeta.audienceReachMultiplier;
    const audienceMillions = Number((weeklySpins * audPerSpin).toFixed(2));
    const audienceDeltaMillions = Number((spinBullet * audPerSpin).toFixed(2));

    const callout = computeSongCalloutMetrics(
      {
        songId: item.songId,
        title: item.title,
        artist: item.artist,
        isPlayer: item.isPlayer,
        weeksOnChart: item.weeksOnChart,
        weeklySpins,
        spinBullet,
        genre: item.genre
      },
      state,
      territoryId
    );

    // Apply Callout Burnout step-down if burnout >= 32%
    const burnoutPenaltyMult = callout.burnoutRatePct >= 32 ? 0.74 : 1.0;
    const finalWeeklySpins = Math.max(80, Math.round(weeklySpins * burnoutPenaltyMult));
    const finalAudienceMillions = Number((audienceMillions * burnoutPenaltyMult).toFixed(2));

    const dayparts = computeSongDaypartBreakdown(
      finalWeeklySpins,
      finalAudienceMillions,
      callout,
      morningBoostPct
    );

    const stationCoverageRatio = Math.min(
      1,
      Math.max(0.14, finalWeeklySpins / Math.max(2500, 14500 * panelScale))
    );
    const stationsOn = Math.max(
      6,
      Math.min(
        territoryMeta.panelStationsCount,
        Math.round(territoryMeta.panelStationsCount * stationCoverageRatio)
      )
    );

    const stIdx = regSeed % Math.max(1, territoryMeta.flagshipStations.length);
    const leadStation =
      territoryMeta.flagshipStations[stIdx]?.name || item.leadStation;

    let rotationTier: RadioChartEntry['rotationTier'] = item.rotationTier;
    if (isBlacklisted) rotationTier = 'ON THE VERGE';
    else if (finalWeeklySpins >= 11500 * panelScale) rotationTier = 'POWER ROTATION';
    else if (finalWeeklySpins >= 6800 * panelScale) rotationTier = 'HEAVY ROTATION';
    else if (finalWeeklySpins >= 3400 * panelScale) rotationTier = 'MEDIUM ROTATION';
    else if (spinBullet > 0) rotationTier = 'CLIMBING';
    else rotationTier = 'ON THE VERGE';

    return {
      ...item,
      territoryId,
      weeklySpins: finalWeeklySpins,
      dailySpins: Math.max(12, Math.round(finalWeeklySpins / 7)),
      spinBullet,
      audienceMillions: finalAudienceMillions,
      audienceDeltaMillions,
      stationsOn,
      totalPanelStations: territoryMeta.panelStationsCount,
      leadStation,
      rotationTier,
      callout,
      dayparts,
      isBlacklistedInTerritory: isBlacklisted,
      hasActivePayolaPush,
      isGreatestGainer: false,
      isMostAdded: false,
      isAirplayNumberOne: false
    };
  });

  adjustedEntries.sort(
    (a, b) => b.audienceMillions - a.audienceMillions || b.weeklySpins - a.weeklySpins
  );

  let maxBullet = -999999;
  let gainerIdx = -1;
  let maxAdds = -1;
  let addedIdx = -1;

  const rankedEntries = adjustedEntries.map((entry, idx) => {
    const rank = idx + 1;
    if (entry.spinBullet > maxBullet && rank <= 40) {
      maxBullet = entry.spinBullet;
      gainerIdx = idx;
    }
    if (entry.newStationAdds > maxAdds) {
      maxAdds = entry.newStationAdds;
      addedIdx = idx;
    }
    return {
      ...entry,
      rank,
      isAirplayNumberOne: rank === 1
    };
  });

  if (gainerIdx >= 0 && rankedEntries[gainerIdx]) {
    rankedEntries[gainerIdx].isGreatestGainer = true;
  }
  if (addedIdx >= 0 && rankedEntries[addedIdx]) {
    rankedEntries[addedIdx].isMostAdded = true;
  }

  return {
    territoryMeta,
    baseChart,
    entries: rankedEntries,
    playerEntries: rankedEntries.filter(e => e.isPlayer),
    greatestGainer: gainerIdx >= 0 ? rankedEntries[gainerIdx] : null,
    mostAdded: addedIdx >= 0 ? rankedEntries[addedIdx] : null
  };
}

/**
 * Executes a territory radio promotion action:
 * - 'standard_add': Official Radio Add Date Servicing (Safe, steady spins + familiarity)
 * - 'indie_plugger': Independent Plugger Team (Legal afternoon/evening drive push + callout boost)
 * - 'covert_payola': Under-the-table Payola (Massive immediate Power Rotation & Morning Drive push, raises Watchdog Scrutiny)
 */
export function executeTerritoryRadioServiceAction(
  state: GameState,
  songId: number,
  territoryId: Exclude<RadioTerritoryId, 'ALL'>,
  tier: 'standard_add' | 'indie_plugger' | 'covert_payola'
): {
  updatedState: GameState;
  success: boolean;
  message: string;
  scandalTriggered?: boolean;
} {
  const territory = getTerritoryDefinition(territoryId);
  const targetSong = state.songs.find(s => s.id === songId);
  if (!targetSong) {
    return { updatedState: state, success: false, message: 'Selected single not found.' };
  }

  const cost =
    tier === 'standard_add'
      ? territory.standardAddCost
      : tier === 'indie_plugger'
      ? territory.indiePluggerCost
      : territory.covertPayolaCost;

  if (state.money < cost) {
    return {
      updatedState: state,
      success: false,
      message: `Insufficient budget ($${cost.toLocaleString()} required for ${territory.shortName} ${
        tier === 'standard_add'
          ? 'Official Add Servicing'
          : tier === 'indie_plugger'
          ? 'Independent Plugger Retainer'
          : 'Covert Payola Campaign'
      }).`
    };
  }

  const eco = getEnsuredRadioEcosystemState(state);
  const campaignKey = `${songId}_${territoryId}`;
  const prevCampaign: TerritorySongCampaignState = eco.campaigns[campaignKey] || {
    songId,
    territoryId,
    servicedTier: 'none',
    bonusDailySpins: 0,
    familiarityBonus: 0,
    netPositiveBonus: 0,
    burnoutReduction: 0,
    morningDriveBoostPct: 0
  };

  if (prevCampaign.isBlacklisted) {
    return {
      updatedState: state,
      success: false,
      message: `"${targetSong.title}" is currently suspended by ${territory.regulatoryWatchdog} in ${territory.shortName} due to a Payola compliance violation.`
    };
  }

  const prevWatchdog = eco.watchdogs[territoryId] || {
    territoryId,
    scrutinyPct: 0,
    activeInvestigation: null
  };

  const qualityFactor = (targetSong.quality || 70) / 70;
  let addedDailySpins = 0;
  let famAdd = 0;
  let netAdd = 0;
  let morningAdd = 0;
  let scrutinyDelta = 0;
  let scandalTriggered = false;

  if (tier === 'standard_add') {
    addedDailySpins = Math.round((240 + (state.popularity || 20) * 12) * qualityFactor);
    famAdd = 8;
    netAdd = 3;
    morningAdd = 2;
    scrutinyDelta = -4; // Clean servicing lowers suspicion
  } else if (tier === 'indie_plugger') {
    addedDailySpins = Math.round((560 + (state.popularity || 20) * 18) * qualityFactor);
    famAdd = 15;
    netAdd = 7;
    morningAdd = 5;
    scrutinyDelta = 0;
  } else {
    // Covert Payola
    addedDailySpins = Math.round((1350 + (state.popularity || 20) * 28) * qualityFactor);
    famAdd = 24;
    netAdd = 4;
    morningAdd = 12;
    scrutinyDelta = 34;
  }

  const newScrutiny = Math.max(0, Math.min(100, prevWatchdog.scrutinyPct + scrutinyDelta));

  // Check if Covert Payola triggers an immediate regulatory raid when scrutiny >= 68%
  const roll = (hashSeed(`${state.date}::${songId}::${territoryId}::${newScrutiny}`) % 100);
  if (tier === 'covert_payola' && newScrutiny >= 65 && roll < newScrutiny - 30) {
    scandalTriggered = true;
  }

  const dateStr = (state.date || new Date().toISOString()).split('T')[0];

  if (scandalTriggered) {
    const updatedCampaign: TerritorySongCampaignState = {
      ...prevCampaign,
      servicedTier: 'covert_payola',
      bonusDailySpins: 0,
      isBlacklisted: true,
      lastServicedDate: dateStr
    };

    const updatedWatchdog: TerritoryWatchdogState = {
      territoryId,
      scrutinyPct: 85,
      activeInvestigation: {
        songId,
        songTitle: targetSong.title,
        authority: territory.regulatoryWatchdog,
        dateTriggered: dateStr,
        expiresDate: 'Active Suspension',
        finePaid: cost
      }
    };

    const newLog: RadioPromoLogItem = {
      id: `log_${Date.now()}_${territoryId}`,
      date: dateStr,
      territoryId,
      type: 'scandal',
      headline: `${territory.regulatoryWatchdog} Payola Investigation!`,
      detail: `Undisclosed payments for "${targetSong.title}" exposed in ${territory.shortName}. Flagship networks suspended rotation and Billboard airplay points were penalized.`
    };

    const updatedSongs = state.songs.map(s => {
      if (s.id !== songId) return s;
      const penalizedDailyRadio = Math.max(25, Math.round((s.dailyRadioPlays || 200) * 0.35));
      return {
        ...s,
        dailyRadioPlays: penalizedDailyRadio,
        weeklyRadioPlays: penalizedDailyRadio * 7,
        momentum: Math.max(0.5, (s.momentum || 1.0) - 0.25)
      };
    });

    const nextState: GameState = {
      ...state,
      money: state.money - cost,
      dailyExpense: (state.dailyExpense || 0) + cost,
      hype: Math.max(5, Number(((state.hype || 15) - 4.5).toFixed(2))),
      songs: updatedSongs
    };
    (nextState as any).radioEcosystemState = {
      ...eco,
      campaigns: { ...eco.campaigns, [campaignKey]: updatedCampaign },
      watchdogs: { ...eco.watchdogs, [territoryId]: updatedWatchdog },
      logs: [newLog, ...eco.logs].slice(0, 40)
    };

    return {
      updatedState: nextState,
      success: false,
      scandalTriggered: true,
      message: `ALERT: ${territory.regulatoryWatchdog} intercepted covert Payola payments for "${targetSong.title}" in ${territory.shortName}! Flagship stations pulled the single from rotation.`
    };
  }

  // Successful promotion
  const updatedCampaign: TerritorySongCampaignState = {
    ...prevCampaign,
    servicedTier: tier,
    bonusDailySpins: prevCampaign.bonusDailySpins + addedDailySpins,
    familiarityBonus: Math.min(45, prevCampaign.familiarityBonus + famAdd),
    netPositiveBonus: Math.min(28, prevCampaign.netPositiveBonus + netAdd),
    morningDriveBoostPct: Math.min(18, prevCampaign.morningDriveBoostPct + morningAdd),
    lastServicedDate: dateStr
  };

  const updatedWatchdog: TerritoryWatchdogState = {
    ...prevWatchdog,
    scrutinyPct: newScrutiny
  };

  const streamDiscoveryGain = Math.round(
    addedDailySpins * territory.streamDiscoveryRatePerSpin
  );

  const updatedSongs: Song[] = state.songs.map(s => {
    if (s.id !== songId) return s;
    const nextDailyRadio = (s.dailyRadioPlays || 0) + addedDailySpins;
    const nextDailyStreams = (s.dailyStreams || 0) + streamDiscoveryGain;
    return {
      ...s,
      radioPlays: (s.radioPlays || 0) + addedDailySpins * 7,
      dailyRadioPlays: nextDailyRadio,
      weeklyRadioPlays: (s.weeklyRadioPlays || 0) + addedDailySpins * 7,
      dailyStreams: nextDailyStreams,
      weeklyStreams: (s.weeklyStreams || 0) + streamDiscoveryGain,
      streams: (s.streams || 0) + streamDiscoveryGain,
      momentum: Math.min(2.6, (s.momentum || 1.0) + (tier === 'covert_payola' ? 0.22 : 0.12))
    };
  });

  const actionLabel =
    tier === 'standard_add'
      ? 'Official Add Date Servicing'
      : tier === 'indie_plugger'
      ? 'Independent Plugger Campaign'
      : 'Covert Payola Drive Push';

  const newLog: RadioPromoLogItem = {
    id: `log_${Date.now()}_${territoryId}`,
    date: dateStr,
    territoryId,
    type: tier === 'standard_add' ? 'add_date' : tier === 'indie_plugger' ? 'plugger' : 'payola',
    headline: `${territory.flag} ${territory.shortName}: ${actionLabel}`,
    detail: `"${targetSong.title}" gained +${addedDailySpins.toLocaleString()} daily spins across ${territory.flagshipStations[0]?.name || territory.shortName} (+${streamDiscoveryGain.toLocaleString()} discovery streams/day).`
  };

  const nextState: GameState = {
    ...state,
    money: state.money - cost,
    dailyExpense: (state.dailyExpense || 0) + cost,
    dailyStreamsTotal: (state.dailyStreamsTotal || 0) + streamDiscoveryGain,
    songs: updatedSongs
  };

  (nextState as any).radioEcosystemState = {
    ...eco,
    campaigns: { ...eco.campaigns, [campaignKey]: updatedCampaign },
    watchdogs: { ...eco.watchdogs, [territoryId]: updatedWatchdog },
    logs: [newLog, ...eco.logs].slice(0, 40)
  };

  return {
    updatedState: nextState,
    success: true,
    message: `${territory.flag} "${targetSong.title}" serviced via ${actionLabel} in ${territory.shortName}! +${addedDailySpins.toLocaleString()} daily spins & +${streamDiscoveryGain.toLocaleString()} daily discovery streams.`
  };
}

/**
 * Books a Live Morning Show Interview or Acoustic Radio Lounge session in a specific territory.
 */
export function executeRadioLiveAppearanceBooking(
  state: GameState,
  songId: number,
  territoryId: Exclude<RadioTerritoryId, 'ALL'>,
  appearanceType: 'morning_interview' | 'live_lounge'
): {
  updatedState: GameState;
  success: boolean;
  message: string;
} {
  const territory = getTerritoryDefinition(territoryId);
  const targetSong = state.songs.find(s => s.id === songId);
  if (!targetSong) {
    return { updatedState: state, success: false, message: 'Selected single not found.' };
  }

  const cost =
    appearanceType === 'morning_interview'
      ? territory.interviewCost
      : territory.loungeCost;

  if (state.money < cost) {
    return {
      updatedState: state,
      success: false,
      message: `Insufficient budget ($${cost.toLocaleString()} production & travel fee required).`
    };
  }

  const eco = getEnsuredRadioEcosystemState(state);
  const campaignKey = `${songId}_${territoryId}`;
  const prevCampaign: TerritorySongCampaignState = eco.campaigns[campaignKey] || {
    songId,
    territoryId,
    servicedTier: 'standard_add',
    bonusDailySpins: 0,
    familiarityBonus: 0,
    netPositiveBonus: 0,
    burnoutReduction: 0,
    morningDriveBoostPct: 0
  };

  if (prevCampaign.isBlacklisted) {
    return {
      updatedState: state,
      success: false,
      message: `Flagship networks in ${territory.shortName} cannot book live appearances while "${targetSong.title}" is under broadcast investigation.`
    };
  }

  const dateStr = (state.date || new Date().toISOString()).split('T')[0];
  if (
    appearanceType === 'morning_interview' &&
    prevCampaign.lastInterviewDate === dateStr
  ) {
    return {
      updatedState: state,
      success: false,
      message: `You already completed a Morning Show Interview in ${territory.shortName} today.`
    };
  }
  if (
    appearanceType === 'live_lounge' &&
    prevCampaign.lastLoungeDate === dateStr
  ) {
    return {
      updatedState: state,
      success: false,
      message: `You already recorded a Live Lounge session in ${territory.shortName} today.`
    };
  }

  const leadStation = territory.flagshipStations[0];
  const showName =
    appearanceType === 'morning_interview'
      ? leadStation?.signatureShow || `${territory.shortName} Morning Drive`
      : leadStation?.loungeSessionName || `${territory.shortName} Live Lounge`;

  const spinBoost = appearanceType === 'morning_interview' ? 380 : 460;
  const streamDiscoveryBoost = Math.round(
    spinBoost * territory.streamDiscoveryRatePerSpin * (appearanceType === 'live_lounge' ? 1.45 : 1.15)
  );

  const updatedCampaign: TerritorySongCampaignState = {
    ...prevCampaign,
    bonusDailySpins: prevCampaign.bonusDailySpins + spinBoost,
    familiarityBonus: Math.min(
      48,
      prevCampaign.familiarityBonus + (appearanceType === 'morning_interview' ? 14 : 9)
    ),
    netPositiveBonus: Math.min(
      32,
      prevCampaign.netPositiveBonus + (appearanceType === 'live_lounge' ? 12 : 5)
    ),
    burnoutReduction: Math.min(
      24,
      prevCampaign.burnoutReduction + (appearanceType === 'live_lounge' ? 10 : 3)
    ),
    morningDriveBoostPct: Math.min(
      20,
      prevCampaign.morningDriveBoostPct + (appearanceType === 'morning_interview' ? 8 : 4)
    ),
    lastInterviewDate:
      appearanceType === 'morning_interview' ? dateStr : prevCampaign.lastInterviewDate,
    lastLoungeDate:
      appearanceType === 'live_lounge' ? dateStr : prevCampaign.lastLoungeDate
  };

  const updatedSongs = state.songs.map(s => {
    if (s.id !== songId) return s;
    return {
      ...s,
      radioPlays: (s.radioPlays || 0) + spinBoost * 7,
      dailyRadioPlays: (s.dailyRadioPlays || 0) + spinBoost,
      weeklyRadioPlays: (s.weeklyRadioPlays || 0) + spinBoost * 7,
      dailyStreams: (s.dailyStreams || 0) + streamDiscoveryBoost,
      weeklyStreams: (s.weeklyStreams || 0) + streamDiscoveryBoost,
      streams: (s.streams || 0) + streamDiscoveryBoost,
      momentum: Math.min(2.6, (s.momentum || 1.0) + 0.14)
    };
  });

  const newLog: RadioPromoLogItem = {
    id: `log_${Date.now()}_${territoryId}`,
    date: dateStr,
    territoryId,
    type: appearanceType === 'morning_interview' ? 'interview' : 'lounge',
    headline: `${territory.flag} On-Air: ${showName}`,
    detail:
      appearanceType === 'morning_interview'
        ? `Live Morning Drive interview boosted "${targetSong.title}" Familiarity (+14%) & Morning Drive rotation (+${spinBoost} daily spins).`
        : `Acoustic session on ${showName} boosted Callout Net Positive (+12), reduced listener burnout, and added +${streamDiscoveryBoost.toLocaleString()} streams.`
  };

  const nextState: GameState = {
    ...state,
    money: state.money - cost,
    dailyExpense: (state.dailyExpense || 0) + cost,
    dailyStreamsTotal: (state.dailyStreamsTotal || 0) + streamDiscoveryBoost,
    songs: updatedSongs
  };

  (nextState as any).radioEcosystemState = {
    ...eco,
    campaigns: { ...eco.campaigns, [campaignKey]: updatedCampaign },
    logs: [newLog, ...eco.logs].slice(0, 40)
  };

  return {
    updatedState: nextState,
    success: true,
    message: `${territory.flag} Completed ${showName} for "${targetSong.title}"! Callout scores, Morning Drive share, and Billboard Airplay / streaming discovery velocity increased.`
  };
}

/**
 * Daily simulation step for the Global Radio Ecosystem:
 * - Decays Watchdog Scrutiny slightly on clean days
 * - Computes territorial radio spin velocity and Callout Net Positive / Burnout shifts
 * - Feeds domestic & international radio airplay directly into Billboard Airplay points (`dailyRadioPlays`/`weeklyRadioPlays`)
 *   and organic daily streaming discovery (`dailyStreams`) without cash royalty or fan bloat.
 */
export function processDailyGlobalRadioEcosystemStep(
  state: GameState,
  currentDate: Date
): {
  updatedSongs: Song[];
  updatedRadioState: GlobalRadioEcosystemState;
  dailyStreamDiscoveryAdded: number;
} {
  const eco = getEnsuredRadioEcosystemState(state);
  const updatedCampaigns: Record<string, TerritorySongCampaignState> = { ...eco.campaigns };
  const updatedWatchdogs = { ...eco.watchdogs };

  // 1. Decay watchdog scrutiny by 3% per day when not actively triggering payola
  (Object.keys(updatedWatchdogs) as Array<Exclude<RadioTerritoryId, 'ALL'>>).forEach(tKey => {
    const w = updatedWatchdogs[tKey];
    if (w) {
      updatedWatchdogs[tKey] = {
        ...w,
        scrutinyPct: Math.max(0, w.scrutinyPct - 3)
      };
    }
  });

  // 2. Apply daily territorial campaign spins & organic streaming discovery to released player songs
  const currentMs = currentDate.getTime();
  let dailyStreamDiscoveryAdded = 0;

  const updatedSongs = state.songs.map(song => {
    if (song.status !== 'released') return song;

    const releaseMs = song.releaseDate ? new Date(song.releaseDate).getTime() : currentMs;
    const daysOut = Math.max(1, Math.floor((currentMs - releaseMs) / (1000 * 60 * 60 * 24)));

    // Recurrent decay after 120 days
    const ageRetention = daysOut <= 60 ? 0.97 : daysOut <= 110 ? 0.90 : 0.78;

    let songTerritoryDailySpinBoost = 0;
    let songDailyStreamDiscovery = 0;

    (Object.keys(updatedCampaigns) as string[]).forEach(cKey => {
      const camp = updatedCampaigns[cKey];
      if (!camp || camp.songId !== song.id) return;

      const nextBonusSpins = Math.max(0, Math.round(camp.bonusDailySpins * ageRetention));
      updatedCampaigns[cKey] = {
        ...camp,
        bonusDailySpins: nextBonusSpins
      };

      if (!camp.isBlacklisted && nextBonusSpins > 0) {
        const terr = getTerritoryDefinition(camp.territoryId);
        // Weight US airplay directly and global territories proportionally for Billboard Airplay & Global 200
        const billboardSpinCredit = Math.round(
          nextBonusSpins * (camp.territoryId === 'US' ? 1.0 : 0.45 + terr.billboardGlobal200Weight)
        );
        songTerritoryDailySpinBoost += billboardSpinCredit;

        // Organic streaming discovery driven by territorial radio reach (streams only, no direct cash royalty bloat)
        const discoveryStreams = Math.round(
          nextBonusSpins * (terr.streamDiscoveryRatePerSpin * 0.42)
        );
        songDailyStreamDiscovery += discoveryStreams;
      }
    });

    if (songTerritoryDailySpinBoost <= 0 && songDailyStreamDiscovery <= 0) {
      return song;
    }

    dailyStreamDiscoveryAdded += songDailyStreamDiscovery;
    const nextDailyRadio = (song.dailyRadioPlays || 0) + songTerritoryDailySpinBoost;
    const nextWeeklyRadio = Math.max(
      nextDailyRadio * 7,
      (song.weeklyRadioPlays || 0) + songTerritoryDailySpinBoost
    );

    return {
      ...song,
      radioPlays: (song.radioPlays || 0) + songTerritoryDailySpinBoost,
      dailyRadioPlays: nextDailyRadio,
      weeklyRadioPlays: nextWeeklyRadio,
      dailyStreams: (song.dailyStreams || 0) + songDailyStreamDiscovery,
      weeklyStreams: (song.weeklyStreams || 0) + songDailyStreamDiscovery,
      streams: (song.streams || 0) + songDailyStreamDiscovery
    };
  });

  return {
    updatedSongs,
    updatedRadioState: {
      ...eco,
      campaigns: updatedCampaigns,
      watchdogs: updatedWatchdogs,
      dailyRadioStreamDiscoveryBonus: dailyStreamDiscoveryAdded
    },
    dailyStreamDiscoveryAdded
  };
}
