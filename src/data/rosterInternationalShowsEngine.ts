import { GameState } from '../types';
import {
  ImprintSignedArtist,
  LabelAccountingStatementItem,
  getEnsuredRecordLabelState,
} from './recordLabelSystemEngine';
import { HiredStaffMember, StaffRoleId } from './staffTeamEngine';
import { getRosterTrustAndHiatusInfo } from './rosterTrustHiatusPayrollEngine';

export type RosterShowFormatId =
  | 'radio_press_tour'
  | 'primetime_tv_show'
  | 'international_showcase_festival';

export type StaffShowAutoStrategy =
  | 'weakest_markets'
  | 'tier1_powerhouses'
  | 'asia_pacific'
  | 'americas_europe';

export interface RosterCountryShowCatalogItem {
  countryCode: string;
  countryName: string;
  flag: string;
  regionGroup: 'North America' | 'Europe' | 'Asia-Pacific' | 'Latin America' | 'Southeast Asia';
  tier: 1 | 2 | 3;
  shows: Record<
    RosterShowFormatId,
    {
      title: string;
      networkOrVenue: string;
      description: string;
    }
  >;
}

export interface RosterShowFormatDefinition {
  id: RosterShowFormatId;
  label: string;
  shortTag: string;
  durationDays: number;
  cooldownDays: number;
  baseCost: number;
  baseAppearanceFee: number;
  baseCountryExpansionGain: number; // +Penetration % in target country
  baseGlobalPopGain: number;
  baseHypeGain: number;
  baseFansGain: number;
  baseFatigueCost: number;
}

export interface ActiveRosterInternationalShow {
  id: string;
  countryCode: string;
  countryName: string;
  flag: string;
  formatId: RosterShowFormatId;
  formatLabel: string;
  showTitle: string;
  networkOrVenue: string;
  totalDays: number;
  daysRemaining: number;
  bookedByStaff: boolean;
  netCostPaid: number;
  expectedAppearanceFee: number;
  expectedExpansionGain: number;
  expectedPopGain: number;
  expectedHypeGain: number;
  expectedFansGain: number;
  startedDate: string;
}

export interface CompletedRosterShowHistoryItem {
  id: string;
  date: string;
  countryCode: string;
  countryName: string;
  flag: string;
  showTitle: string;
  formatLabel: string;
  expansionGain: number;
  fansGained: number;
  bookedByStaff: boolean;
}

export interface RosterShowStaffSynergy {
  hasQualifiedShowStaff: boolean;
  activeStaffNames: string[];
  costDiscountPct: number;
  appearanceFeeMult: number;
  expansionAndFanMult: number;
  fatigueReductionPct: number;
}

export const ROSTER_SHOW_FORMATS: Record<RosterShowFormatId, RosterShowFormatDefinition> = {
  radio_press_tour: {
    id: 'radio_press_tour',
    label: 'National Radio & Viral Press Tour',
    shortTag: '3 Days • Radio & Press',
    durationDays: 3,
    cooldownDays: 4,
    baseCost: 24_000,
    baseAppearanceFee: 9_000,
    baseCountryExpansionGain: 14,
    baseGlobalPopGain: 0.6,
    baseHypeGain: 5,
    baseFansGain: 7_500,
    baseFatigueCost: 5,
  },
  primetime_tv_show: {
    id: 'primetime_tv_show',
    label: 'Prime-Time TV Music & Talk Broadcast',
    shortTag: '5 Days • Prime-Time TV',
    durationDays: 5,
    cooldownDays: 5,
    baseCost: 58_000,
    baseAppearanceFee: 26_000,
    baseCountryExpansionGain: 22,
    baseGlobalPopGain: 1.3,
    baseHypeGain: 10,
    baseFansGain: 18_500,
    baseFatigueCost: 8,
  },
  international_showcase_festival: {
    id: 'international_showcase_festival',
    label: 'International Arena Showcase & Festival Stage',
    shortTag: '7 Days • Headline Showcase',
    durationDays: 7,
    cooldownDays: 7,
    baseCost: 115_000,
    baseAppearanceFee: 65_000,
    baseCountryExpansionGain: 32,
    baseGlobalPopGain: 2.1,
    baseHypeGain: 16,
    baseFansGain: 38_000,
    baseFatigueCost: 12,
  },
};

export const ROSTER_INTERNATIONAL_COUNTRIES: RosterCountryShowCatalogItem[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    regionGroup: 'North America',
    tier: 1,
    shows: {
      radio_press_tour: {
        title: 'iHeartRadio Live & SiriusXM Press Run',
        networkOrVenue: 'New York & Los Angeles Syndicated Radio',
        description: 'Acoustic live session and coast-to-coast Top 40 morning radio interviews.',
      },
      primetime_tv_show: {
        title: 'The Tonight Show & GMA Live Stage',
        networkOrVenue: 'NBC Studios Rockefeller Center (NYC)',
        description: 'National network television musical guest performance and couch interview.',
      },
      international_showcase_festival: {
        title: 'Coachella / Governors Ball Mainstage Showcase',
        networkOrVenue: 'Empire Polo Club & Kia Forum',
        description: 'High-production US festival set and bicoastal industry showcase.',
      },
    },
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    regionGroup: 'Europe',
    tier: 1,
    shows: {
      radio_press_tour: {
        title: 'BBC Radio 1 Live Lounge & Capital FM',
        networkOrVenue: 'BBC Broadcasting House (London)',
        description: 'Signature Live Lounge cover + original single session for UK radio.',
      },
      primetime_tv_show: {
        title: 'The Graham Norton Show & Later... with Jools Holland',
        networkOrVenue: 'BBC One Television Centre (London)',
        description: 'Prestigious UK prime-time broadcast performance watched across Britain.',
      },
      international_showcase_festival: {
        title: 'Glastonbury & London O2 Arena Showcase',
        networkOrVenue: 'The O2 Peninsula Square (London)',
        description: 'Major British festival stage and sold-out London headline showcase.',
      },
    },
  },
  {
    countryCode: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    regionGroup: 'Asia-Pacific',
    tier: 1,
    shows: {
      radio_press_tour: {
        title: 'J-Wave Tokyo & Tower Records Shibuya Event',
        networkOrVenue: 'Roppongi Hills & Shibuya (Tokyo)',
        description: 'FM radio takeover and physical CD/Vinyl high-touch fan event in Tokyo.',
      },
      primetime_tv_show: {
        title: 'TV Asahi Music Station (M-Sta) Special',
        networkOrVenue: 'TV Asahi Ark Hills Studio (Tokyo)',
        description: 'Iconic Friday night live Japanese television music broadcast.',
      },
      international_showcase_festival: {
        title: 'Summer Sonic Tokyo & Nippon Budokan Showcase',
        networkOrVenue: 'ZOZO Marine Stadium & Budokan',
        description: 'Massive Japanese festival stage and Tokyo arena fan showcase.',
      },
    },
  },
  {
    countryCode: 'KR',
    countryName: 'South Korea',
    flag: '🇰🇷',
    regionGroup: 'Asia-Pacific',
    tier: 2,
    shows: {
      radio_press_tour: {
        title: 'Dingo Killing Voice & KBS Cool FM Live',
        networkOrVenue: 'Yeouido Studios (Seoul)',
        description: 'Viral live vocal medley session and Seoul prime radio guesting.',
      },
      primetime_tv_show: {
        title: 'M Countdown & Inkigayo Comeback Special Stage',
        networkOrVenue: 'CJ ENM & SBS Prism Tower (Seoul)',
        description: 'Full-camera choreography & live vocal broadcast on Korean music television.',
      },
      international_showcase_festival: {
        title: 'KSPO Dome Seoul & K-Wave Global Festival',
        networkOrVenue: 'Olympic Park (Seoul)',
        description: 'Headline Seoul showcase with global livestream and fanclub meet.',
      },
    },
  },
  {
    countryCode: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    regionGroup: 'Southeast Asia',
    tier: 2,
    shows: {
      radio_press_tour: {
        title: 'Prambors FM Jakarta & Gen FM Press Tour',
        networkOrVenue: 'SCBD & Senayan (Jakarta)',
        description: 'High-engagement Jakarta radio circuit and viral Southeast Asia press day.',
      },
      primetime_tv_show: {
        title: 'Indonesian Television Music Awards Special',
        networkOrVenue: 'MNC Studios Kebon Jeruk (Jakarta)',
        description: 'National prime-time live broadcast to millions of Indonesian viewers.',
      },
      international_showcase_festival: {
        title: 'We The Fest & Gelora Bung Karno Showcase',
        networkOrVenue: 'GBK Senayan Complex (Jakarta)',
        description: 'Massive Jakarta festival headline set and Southeast Asia fan convention.',
      },
    },
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    flag: '🇩🇪',
    regionGroup: 'Europe',
    tier: 1,
    shows: {
      radio_press_tour: {
        title: '1LIVE Cologne & Radio Energy Berlin Session',
        networkOrVenue: 'WDR Media Park & Berlin',
        description: 'German national radio live session and continental European press tour.',
      },
      primetime_tv_show: {
        title: 'Late Night Berlin Prime TV Broadcast',
        networkOrVenue: 'Studio Berlin Adlershof',
        description: 'Prime-time German TV live stage and interview.',
      },
      international_showcase_festival: {
        title: 'Rock am Ring & Berlin Uber Arena Showcase',
        networkOrVenue: 'Nürburgring & Berlin',
        description: 'Central European festival headline slot and Berlin arena showcase.',
      },
    },
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    regionGroup: 'Europe',
    tier: 1,
    shows: {
      radio_press_tour: {
        title: 'NRJ Music Paris & Skyrock Planète Live',
        networkOrVenue: 'Rue Boileau Studios (Paris)',
        description: 'French national hit radio live performance and Paris fashion/music press.',
      },
      primetime_tv_show: {
        title: 'Quotidien & Taratata Live TV Stage',
        networkOrVenue: 'TMC / France 2 Studios (Paris)',
        description: 'Prestigious French prime-time live music broadcast.',
      },
      international_showcase_festival: {
        title: 'Lollapalooza Paris & Accor Arena Showcase',
        networkOrVenue: 'Hippodrome de Longchamp & Bercy (Paris)',
        description: 'Major Paris festival stage and European VIP showcase.',
      },
    },
  },
  {
    countryCode: 'BR',
    countryName: 'Brazil',
    flag: '🇧🇷',
    regionGroup: 'Latin America',
    tier: 2,
    shows: {
      radio_press_tour: {
        title: 'Jovem Pan Brasil & Mix FM São Paulo Run',
        networkOrVenue: 'Avenida Paulista (São Paulo)',
        description: 'Passionate Brazilian radio tour and fan street-team activation.',
      },
      primetime_tv_show: {
        title: 'TV Globo Prime Sunday Music Special',
        networkOrVenue: 'Estúdios Globo (Rio de Janeiro)',
        description: 'Coast-to-coast Brazilian television live performance.',
      },
      international_showcase_festival: {
        title: 'Rock in Rio & Allianz Parque Showcase',
        networkOrVenue: 'Cidade do Rock (Rio) & São Paulo',
        description: 'Electrifying South American festival stage in front of 80,000+ fans.',
      },
    },
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    regionGroup: 'Asia-Pacific',
    tier: 2,
    shows: {
      radio_press_tour: {
        title: 'Triple J Like A Version & Nova FM Sydney',
        networkOrVenue: 'ABC Ultimo Studios (Sydney)',
        description: 'Viral Triple J live cover session and Australian national radio circuit.',
      },
      primetime_tv_show: {
        title: 'Sunrise Live at Sydney Opera Forecourt',
        networkOrVenue: 'Sydney Harbour (Sydney)',
        description: 'Outdoor broadcast performance overlooking Sydney Harbour.',
      },
      international_showcase_festival: {
        title: 'Sydney Qudos Bank & Melbourne Rod Laver Showcase',
        networkOrVenue: 'Sydney & Melbourne',
        description: 'Dual-city Oceania arena showcase and festival headline run.',
      },
    },
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    regionGroup: 'North America',
    tier: 2,
    shows: {
      radio_press_tour: {
        title: 'CBC Music q Live & Virgin Radio Toronto',
        networkOrVenue: 'Canadian Broadcasting Centre (Toronto)',
        description: 'National Canadian radio session and Toronto media tour.',
      },
      primetime_tv_show: {
        title: 'ETalk & MuchMusic Queen Street Live Special',
        networkOrVenue: '299 Queen Street West (Toronto)',
        description: 'Iconic Canadian music television broadcast and fan plaza performance.',
      },
      international_showcase_festival: {
        title: 'OSHEAGA Montreal & Scotiabank Arena Showcase',
        networkOrVenue: 'Parc Jean-Drapeau (Montreal)',
        description: 'Premier Canadian festival stage and bilingual market expansion.',
      },
    },
  },
  {
    countryCode: 'MX',
    countryName: 'Mexico',
    flag: '🇲🇽',
    regionGroup: 'Latin America',
    tier: 2,
    shows: {
      radio_press_tour: {
        title: 'Exa FM & Los 40 Mexico City Live Session',
        networkOrVenue: 'Polanco & Reforma (CDMX)',
        description: 'High-reach Spanish-language radio tour across Mexico City.',
      },
      primetime_tv_show: {
        title: 'Televisa Chapultepec Prime Music Broadcast',
        networkOrVenue: 'Televisa San Ángel (CDMX)',
        description: 'National Mexican prime-time television stage and interview.',
      },
      international_showcase_festival: {
        title: 'Corona Capital & Estadio GNP Seguros Showcase',
        networkOrVenue: 'Autódromo Hermanos Rodríguez (CDMX)',
        description: 'Massive Mexico City festival stage and LATAM press summit.',
      },
    },
  },
  {
    countryCode: 'PH',
    countryName: 'Philippines',
    flag: '🇵🇭',
    regionGroup: 'Southeast Asia',
    tier: 3,
    shows: {
      radio_press_tour: {
        title: 'Wish 107.5 Bus Manila & MYX Live Session',
        networkOrVenue: 'Quezon City & BGC (Manila)',
        description: 'Viral Wish Bus mobile live vocal broadcast through Metro Manila.',
      },
      primetime_tv_show: {
        title: "ASAP Natin 'To Prime Sunday TV Stage",
        networkOrVenue: 'ABS-CBN Studios (Manila)',
        description: 'High-rating Philippine Sunday noon television concert broadcast.',
      },
      international_showcase_festival: {
        title: 'Mall of Asia Arena & Araneta Coliseum Showcase',
        networkOrVenue: 'Pasay & Cubao (Manila)',
        description: 'Sold-out Manila arena showcase with massive social media trend velocity.',
      },
    },
  },
];

/**
 * Returns the ensured Country Market Penetration map (0-100% per country code) for a Roster Artist.
 * Home country starts at a higher baseline; foreign markets start lower and grow via International Shows.
 */
export function getEnsuredRosterCountryExpansionMap(
  artist: ImprintSignedArtist
): Record<string, number> {
  const rawMap = (artist as any).countryExpansionMap;
  const homeCountry = artist.country || 'US';
  const basePop = Math.max(10, Number(artist.popularity) || 32);

  const result: Record<string, number> = {};
  for (const c of ROSTER_INTERNATIONAL_COUNTRIES) {
    const existingVal =
      rawMap && typeof rawMap === 'object' && typeof rawMap[c.countryCode] === 'number'
        ? rawMap[c.countryCode]
        : undefined;
    if (existingVal !== undefined) {
      result[c.countryCode] = Math.max(0, Math.min(100, Math.round(existingVal)));
    } else if (c.countryCode === homeCountry) {
      result[c.countryCode] = Math.min(95, Math.max(35, Math.round(basePop * 0.95)));
    } else {
      result[c.countryCode] = Math.min(45, Math.max(8, Math.round(basePop * 0.28)));
    }
  }
  return result;
}

/**
 * Computes the regional chart & streaming multiplier in `region` for a Roster Artist
 * based on their Country Market Penetration (`countryExpansionMap[region]`) and whether they are
 * currently performing a live Show in that country!
 */
export function getRosterArtistCountryExpansionMultiplier(
  artist: ImprintSignedArtist,
  region: string
): number {
  if (!region || region === 'global') return 1.0;
  const map = getEnsuredRosterCountryExpansionMap(artist);
  const penetration = map[region] ?? Math.min(40, Math.max(10, Math.round((artist.popularity || 32) * 0.3)));

  // Baseline 30% penetration = 1.0x; 100% penetration = 1.85x regional chart & stream power!
  const baseMult = 0.82 + (penetration / 100) * 1.03;

  const activeShow: ActiveRosterInternationalShow | null =
    (artist as any).activeInternationalShow || null;
  const activeShowBoost =
    activeShow && activeShow.countryCode === region ? 1.28 : 1.0;

  return Number((baseMult * activeShowBoost).toFixed(3));
}

/**
 * Evaluates Staff Team synergy for booking and managing Roster International Shows.
 * Checks both the Roster Artist's dedicated Staff Team (`artist.staffRoster`) and the
 * Label Executive Division (`imprint.labelStaffRoster`).
 */
export function getRosterShowStaffSynergy(
  state: GameState,
  artist: ImprintSignedArtist
): RosterShowStaffSynergy {
  const labelState = getEnsuredRecordLabelState(state);
  const execRoster: Partial<Record<StaffRoleId, HiredStaffMember>> =
    (labelState.imprint as any)?.labelStaffRoster || {};
  const artistRoster: Partial<Record<StaffRoleId, HiredStaffMember>> =
    artist.staffRoster || {};

  const showRoles: StaffRoleId[] = [
    'booking_agent',
    'publicist',
    'marketing_vp',
    'manager',
  ];

  const activeStaffNames: string[] = [];
  let totalTierPower = 0;

  for (const rId of showRoles) {
    const artMember = artistRoster[rId];
    const execMember = execRoster[rId];
    if (artMember) {
      activeStaffNames.push(`${artMember.name} (Artist Team)`);
      totalTierPower += (artMember.tier || 1) * 1.25;
    } else if (execMember) {
      activeStaffNames.push(`${execMember.name} (Label HQ)`);
      totalTierPower += (execMember.tier || 1) * 0.95;
    }
  }

  const hasQualifiedShowStaff = activeStaffNames.length > 0;
  const costDiscountPct = Math.min(35, Math.round(totalTierPower * 3.2));
  const appearanceFeeMult = Number((1 + Math.min(0.45, totalTierPower * 0.042)).toFixed(2));
  const expansionAndFanMult = Number((1 + Math.min(0.5, totalTierPower * 0.048)).toFixed(2));
  const fatigueReductionPct = Math.min(30, Math.round(totalTierPower * 2.8));

  return {
    hasQualifiedShowStaff,
    activeStaffNames,
    costDiscountPct,
    appearanceFeeMult,
    expansionAndFanMult,
    fatigueReductionPct,
  };
}

/**
 * Books and dispatches a Roster Artist to an International Show in `countryCode`.
 * Can be triggered manually by the Player CEO or automatically by the Staff Team when `bookedByStaff = true`.
 */
export function sendRosterArtistToInternationalShow(
  state: GameState,
  artistId: string,
  countryCode: string,
  formatId: RosterShowFormatId,
  bookedByStaff = false
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const stageName = target.stageName || target.name;
  const trustAndHiatus = getRosterTrustAndHiatusInfo(target);

  if (trustAndHiatus.hiatusStatus === 'on_hiatus') {
    return {
      nextState: state,
      success: false,
      message: `${stageName} is currently on Hiatus (${trustAndHiatus.hiatusDaysLeft}d remaining) and cannot travel for international shows.`,
    };
  }
  if (trustAndHiatus.hiatusStatus === 'requesting_hiatus') {
    return {
      nextState: state,
      success: false,
      message: `${stageName} is requesting a mandatory Hiatus due to exhaustion (${trustAndHiatus.fatigueScore}% Fatigue). Approve their Hiatus first.`,
    };
  }

  const existingShow: ActiveRosterInternationalShow | null =
    (target as any).activeInternationalShow || null;
  if (existingShow && existingShow.daysRemaining > 0) {
    return {
      nextState: state,
      success: false,
      message: `${stageName} is already performing in ${existingShow.flag} ${existingShow.countryName} ("${existingShow.showTitle}" • ${existingShow.daysRemaining}d left).`,
    };
  }

  const cooldownLeft = Math.max(0, Number((target as any).showCooldownDaysLeft) || 0);
  if (cooldownLeft > 0) {
    return {
      nextState: state,
      success: false,
      message: `${stageName} is recovering from international travel (${cooldownLeft}d show cooldown remaining).`,
    };
  }

  const countryMeta =
    ROSTER_INTERNATIONAL_COUNTRIES.find((c) => c.countryCode === countryCode) ||
    ROSTER_INTERNATIONAL_COUNTRIES[0];
  const formatDef = ROSTER_SHOW_FORMATS[formatId] || ROSTER_SHOW_FORMATS.radio_press_tour;
  const showDetail = countryMeta.shows[formatDef.id];
  const synergy = getRosterShowStaffSynergy(state, target);

  const tierCostMult = countryMeta.tier === 1 ? 1.2 : countryMeta.tier === 2 ? 1.0 : 0.85;
  const grossCost = Math.round(
    formatDef.baseCost * tierCostMult * (1 - synergy.costDiscountPct / 100)
  );
  const currentMoney = Math.round(Number(state.money) || 0);

  if (currentMoney < grossCost) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient funds to book "${showDetail.title}" in ${countryMeta.countryName} ($${grossCost.toLocaleString()} required).`,
    };
  }

  const popScale = Math.max(0.75, (Number(target.popularity) || 32) / 42);
  const expectedAppearanceFee = Math.round(
    formatDef.baseAppearanceFee * tierCostMult * popScale * synergy.appearanceFeeMult
  );
  const expectedExpansionGain = Math.round(
    formatDef.baseCountryExpansionGain * synergy.expansionAndFanMult
  );
  const expectedPopGain = Number(
    (formatDef.baseGlobalPopGain * synergy.expansionAndFanMult).toFixed(1)
  );
  const expectedHypeGain = Math.round(
    formatDef.baseHypeGain * synergy.expansionAndFanMult
  );
  const expectedFansGain = Math.round(
    formatDef.baseFansGain * popScale * synergy.expansionAndFanMult
  );
  const fatigueAdded = Math.max(
    2,
    Math.round(formatDef.baseFatigueCost * (1 - synergy.fatigueReductionPct / 100))
  );

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const activeShow: ActiveRosterInternationalShow = {
    id: `rshow_${Date.now()}_${artistId}_${countryMeta.countryCode}`,
    countryCode: countryMeta.countryCode,
    countryName: countryMeta.countryName,
    flag: countryMeta.flag,
    formatId: formatDef.id,
    formatLabel: formatDef.label,
    showTitle: showDetail.title,
    networkOrVenue: showDetail.networkOrVenue,
    totalDays: formatDef.durationDays,
    daysRemaining: formatDef.durationDays,
    bookedByStaff,
    netCostPaid: grossCost,
    expectedAppearanceFee,
    expectedExpansionGain,
    expectedPopGain,
    expectedHypeGain,
    expectedFansGain,
    startedDate: dateStr,
  };

  // Immediate kickoff boost (+35% of expansion & hype up front, remainder on completion)
  const currentMap = getEnsuredRosterCountryExpansionMap(target);
  const immediateExpansion = Math.max(3, Math.round(expectedExpansionGain * 0.35));
  const nextMap = {
    ...currentMap,
    [countryMeta.countryCode]: Math.min(
      100,
      (currentMap[countryMeta.countryCode] || 15) + immediateExpansion
    ),
  };

  const updatedArtist: ImprintSignedArtist = {
    ...target,
    hype: Math.min(100, Math.round((target.hype || 45) + Math.max(2, Math.round(expectedHypeGain * 0.4)))),
  };
  (updatedArtist as any).countryExpansionMap = nextMap;
  (updatedArtist as any).activeInternationalShow = activeShow;
  (updatedArtist as any).fatigueScore = Math.min(100, trustAndHiatus.fatigueScore + fatigueAdded);

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_rshow_book_${Date.now()}_${artistId}`,
    date: dateStr,
    title: `${bookedByStaff ? '[Staff Auto-Booked] ' : ''}Dispatched ${stageName} to ${countryMeta.flag} ${countryMeta.countryName}: ${showDetail.title}`,
    detail: `${formatDef.durationDays}-Day ${formatDef.label} at ${showDetail.networkOrVenue} • Production & Travel: -$${grossCost.toLocaleString()} • Expected Territory Expansion: +${expectedExpansionGain}% in ${countryMeta.countryName}.`,
    amount: grossCost,
    direction: 'debit',
    category: 'imprint',
  };

  const nextState: GameState = {
    ...state,
    money: currentMoney - grossCost,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: labelState.imprint.signedRoster.map((a) =>
          a.id === artistId ? updatedArtist : a
        ),
      },
      statements: [stmt, ...labelState.statements].slice(0, 45),
    },
  };

  return {
    nextState,
    success: true,
    message: `${bookedByStaff ? 'Staff Team dispatched' : 'Dispatched'} ${stageName} to ${countryMeta.flag} ${countryMeta.countryName} for "${showDetail.title}" (${formatDef.durationDays} days)!`,
  };
}

/**
 * Configures Staff Team Auto-Booking & Territory Expansion settings for a Roster Artist (or all Roster Artists).
 */
export function configureRosterStaffShowAutomation(
  state: GameState,
  artistId: string | 'ALL',
  enabled: boolean,
  strategy?: StaffShowAutoStrategy,
  preferredFormat?: 'auto' | RosterShowFormatId
): { nextState: GameState; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const nextRoster = (labelState.imprint.signedRoster || []).map((art) => {
    if (artistId !== 'ALL' && art.id !== artistId) return art;
    const updated = { ...art };
    (updated as any).staffAutoBookShows = enabled;
    if (strategy) {
      (updated as any).staffShowStrategy = strategy;
    } else if (!(updated as any).staffShowStrategy) {
      (updated as any).staffShowStrategy = 'weakest_markets';
    }
    if (preferredFormat) {
      (updated as any).staffPreferredShowTier = preferredFormat;
    } else if (!(updated as any).staffPreferredShowTier) {
      (updated as any).staffPreferredShowTier = 'auto';
    }
    return updated;
  });

  return {
    nextState: {
      ...state,
      recordLabelState: {
        ...labelState,
        imprint: {
          ...labelState.imprint,
          signedRoster: nextRoster,
        },
      },
    },
    message:
      artistId === 'ALL'
        ? `Staff Team Auto-Show Management ${enabled ? 'enabled' : 'disabled'} for all Roster Artists.`
        : `Staff Team Auto-Show Management ${enabled ? 'enabled' : 'disabled'}.`,
  };
}

/**
 * Picks the optimal country and show format when the Staff Team automatically manages a Roster Artist's international schedule.
 */
function pickStaffAutomatedShowTarget(
  state: GameState,
  artist: ImprintSignedArtist
): { countryCode: string; formatId: RosterShowFormatId } | null {
  const map = getEnsuredRosterCountryExpansionMap(artist);
  const strategy: StaffShowAutoStrategy =
    (artist as any).staffShowStrategy || 'weakest_markets';
  const preferredTier: 'auto' | RosterShowFormatId =
    (artist as any).staffPreferredShowTier || 'auto';

  let candidateCountries = [...ROSTER_INTERNATIONAL_COUNTRIES];
  if (strategy === 'tier1_powerhouses') {
    candidateCountries = candidateCountries.filter((c) => c.tier === 1);
  } else if (strategy === 'asia_pacific') {
    candidateCountries = candidateCountries.filter(
      (c) => c.regionGroup === 'Asia-Pacific' || c.regionGroup === 'Southeast Asia'
    );
  } else if (strategy === 'americas_europe') {
    candidateCountries = candidateCountries.filter(
      (c) =>
        c.regionGroup === 'North America' ||
        c.regionGroup === 'Latin America' ||
        c.regionGroup === 'Europe'
    );
  }

  // Sort by lowest current penetration first (among markets < 95%)
  const unmaxed = candidateCountries.filter((c) => (map[c.countryCode] || 0) < 95);
  const pool = unmaxed.length > 0 ? unmaxed : candidateCountries;
  pool.sort((a, b) => (map[a.countryCode] || 0) - (map[b.countryCode] || 0));

  const chosenCountry = pool[0];
  if (!chosenCountry) return null;

  let formatId: RosterShowFormatId = 'radio_press_tour';
  if (preferredTier !== 'auto') {
    formatId = preferredTier;
  } else {
    const money = Number(state.money) || 0;
    const pop = Number(artist.popularity) || 32;
    if (money >= 2_000_000 && pop >= 48) {
      formatId = 'international_showcase_festival';
    } else if (money >= 500_000 && pop >= 30) {
      formatId = 'primetime_tv_show';
    } else {
      formatId = 'radio_press_tour';
    }
  }

  return { countryCode: chosenCountry.countryCode, formatId };
}

/**
 * Daily tick processor for Roster International Shows & Staff Team Auto-Show Booking.
 * Called inside `processDailyRecordLabelStep` every day.
 */
export function processDailyRosterInternationalShows(
  state: GameState,
  currentDate: Date
): void {
  const labelState = getEnsuredRecordLabelState(state);
  const imprint = labelState.imprint;
  if (!imprint || !imprint.isFounded || !Array.isArray(imprint.signedRoster)) {
    return;
  }

  const dateStr = currentDate.toISOString().split('T')[0];

  // First pass: advance active shows and cooldowns
  imprint.signedRoster = imprint.signedRoster.map((art) => {
    const stageName = art.stageName || art.name;
    const currentMap = getEnsuredRosterCountryExpansionMap(art);
    const activeShow: ActiveRosterInternationalShow | null =
      (art as any).activeInternationalShow || null;
    let cooldownLeft = Math.max(0, Number((art as any).showCooldownDaysLeft) || 0);

    if (activeShow && activeShow.daysRemaining > 0) {
      const nextDaysLeft = Math.max(0, activeShow.daysRemaining - 1);

      // Daily streaming & fan discovery boost while performing in the country
      const dailyFansGain = Math.max(150, Math.round(activeShow.expectedFansGain / Math.max(1, activeShow.totalDays)));
      const nextFans = (art.fans || 15_000) + dailyFansGain;

      // Boost released songs' daily/weekly streams slightly from live broadcast exposure
      const showStreamBoost = Math.round((art.popularity || 32) * 320);
      const nextSongs = (art.songs || []).map((s, idx) => {
        if (s.status !== 'released' || idx > 1) return s;
        return {
          ...s,
          streams: (s.streams || 0) + showStreamBoost,
          dailyStreams: (s.dailyStreams || 0) + showStreamBoost,
          weeklyStreams: (s.weeklyStreams || 0) + showStreamBoost,
        };
      });

      if (nextDaysLeft === 0) {
        // Show completed! Credit remaining 65% of country expansion, global pop, hype, and appearance fee
        const remainingExpansion = Math.max(
          4,
          activeShow.expectedExpansionGain - Math.round(activeShow.expectedExpansionGain * 0.35)
        );
        const prevCountryScore = currentMap[activeShow.countryCode] || 15;
        const newCountryScore = Math.min(100, prevCountryScore + remainingExpansion);
        const nextMap = {
          ...currentMap,
          [activeShow.countryCode]: newCountryScore,
        };

        const nextPop = Math.min(
          100,
          Number(((art.popularity || 32) + activeShow.expectedPopGain).toFixed(1))
        );
        const nextHype = Math.min(
          100,
          Math.round((art.hype || 45) + Math.round(activeShow.expectedHypeGain * 0.6))
        );
        const feeEarned = activeShow.expectedAppearanceFee || 0;
        if (feeEarned > 0) {
          state.money = (state.money || 0) + feeEarned;
          state.dailyIncome = (state.dailyIncome || 0) + feeEarned;
          imprint.dailyImprintNetIncome = (imprint.dailyImprintNetIncome || 0) + feeEarned;
          imprint.totalRevenueGenerated = (imprint.totalRevenueGenerated || 0) + feeEarned;
          imprint.totalNetProfitEarned = (imprint.totalNetProfitEarned || 0) + feeEarned;
        }

        const formatDef =
          ROSTER_SHOW_FORMATS[activeShow.formatId] || ROSTER_SHOW_FORMATS.radio_press_tour;
        const history: CompletedRosterShowHistoryItem[] = Array.isArray(
          (art as any).recentShowHistory
        )
          ? [...(art as any).recentShowHistory]
          : [];
        history.unshift({
          id: activeShow.id,
          date: dateStr,
          countryCode: activeShow.countryCode,
          countryName: activeShow.countryName,
          flag: activeShow.flag,
          showTitle: activeShow.showTitle,
          formatLabel: activeShow.formatLabel,
          expansionGain: activeShow.expectedExpansionGain,
          fansGained: activeShow.expectedFansGain,
          bookedByStaff: activeShow.bookedByStaff,
        });

        labelState.statements.unshift({
          id: `stmt_rshow_done_${Date.now()}_${art.id}`,
          date: dateStr,
          title: `${stageName} Completed ${activeShow.flag} ${activeShow.countryName} Show: "${activeShow.showTitle}"`,
          detail: `${activeShow.countryName} Market Penetration rose to ${newCountryScore}% (+${activeShow.expectedExpansionGain}%) • +${activeShow.expectedFansGain.toLocaleString()} Fans • +$${feeEarned.toLocaleString()} Broadcast Appearance Fee.`,
          amount: feeEarned,
          direction: 'credit',
          category: 'imprint',
        });

        const updatedDone: ImprintSignedArtist = {
          ...art,
          popularity: nextPop,
          hype: nextHype,
          fans: nextFans,
          songs: nextSongs,
        };
        (updatedDone as any).countryExpansionMap = nextMap;
        (updatedDone as any).activeInternationalShow = null;
        (updatedDone as any).showCooldownDaysLeft = formatDef.cooldownDays;
        (updatedDone as any).completedShowsCount =
          (Number((art as any).completedShowsCount) || 0) + 1;
        (updatedDone as any).recentShowHistory = history.slice(0, 12);
        return updatedDone;
      }

      const updatedActive: ImprintSignedArtist = {
        ...art,
        fans: nextFans,
        songs: nextSongs,
      };
      (updatedActive as any).countryExpansionMap = currentMap;
      (updatedActive as any).activeInternationalShow = {
        ...activeShow,
        daysRemaining: nextDaysLeft,
      };
      return updatedActive;
    }

    if (cooldownLeft > 0) {
      cooldownLeft = Math.max(0, cooldownLeft - 1);
    }

    const updatedIdle: ImprintSignedArtist = { ...art };
    (updatedIdle as any).countryExpansionMap = currentMap;
    (updatedIdle as any).showCooldownDaysLeft = cooldownLeft;
    return updatedIdle;
  });

  // Persist intermediate state before Staff Team auto-booking pass
  (state as any).recordLabelState = labelState;

  // Second pass: Staff Team Auto-Booking for eligible Roster Artists
  let currentState: GameState = state;
  for (const art of labelState.imprint.signedRoster) {
    const autoEnabled = Boolean((art as any).staffAutoBookShows);
    if (!autoEnabled) continue;

    const isExpired = Boolean(art.isFormerRoster || art.contractExpired || (art.daysRemaining ?? 720) <= 0);
    if (isExpired) continue;

    const trustInfo = getRosterTrustAndHiatusInfo(art);
    if (trustInfo.hiatusStatus !== 'active' || trustInfo.fatigueScore >= 60) continue;

    const activeShow = (art as any).activeInternationalShow;
    const cooldown = Number((art as any).showCooldownDaysLeft) || 0;
    if (activeShow || cooldown > 0) continue;

    const synergy = getRosterShowStaffSynergy(currentState, art);
    if (!synergy.hasQualifiedShowStaff) continue;

    const targetPick = pickStaffAutomatedShowTarget(currentState, art);
    if (!targetPick) continue;

    const bookRes = sendRosterArtistToInternationalShow(
      currentState,
      art.id,
      targetPick.countryCode,
      targetPick.formatId,
      true
    );
    if (bookRes.success) {
      currentState = bookRes.nextState;
      state.money = currentState.money;
      (state as any).recordLabelState = (currentState as any).recordLabelState;
    }
  }
}
