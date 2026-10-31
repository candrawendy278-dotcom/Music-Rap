import { GameState, Song, Project, NPC } from '../types';
import { formatNumFull } from '../constants';
import { DETAILED_NPCS, getNpcAvatar } from './npcAssets';
import type { XPost } from './xSocialEngine';

export type RiaaReleaseType = 'song' | 'project';

export type RiaaMetalClass = 'none' | 'gold' | 'platinum' | 'multi_platinum' | 'diamond';

export type RiaaFrameStyle =
  | 'obsidian_gallery'
  | 'gold_leaf_executive'
  | 'brushed_chrome'
  | 'mahogany_heritage';

export type RiaaMatboardStyle =
  | 'royal_obsidian'
  | 'crimson_velvet'
  | 'midnight_sapphire'
  | 'emerald_vault';

export type RiaaDiscLayout =
  | 'classic_crest'
  | 'double_symphony'
  | 'collector_shrine';

export interface RiaaTierDefinition {
  id: string;
  levelIndex: number;
  label: string;
  shortBadge: string;
  unitsRequired: number;
  metalClass: RiaaMetalClass;
  platinumMultiplier: number; // 0.5 for Gold, 1 for 1x Plat, 10 for 1x Diamond, etc.
  diamondCount: number; // 0 below 10M, 1 at 10M+, 2 at 20M+, etc.
  auditFee: number;
  popBoost: number;
  hypeBoost: number;
  fanBoost: number;
  legacyPoints: number;
}

export interface RiaaPlaqueCustomConfig {
  frameStyle: RiaaFrameStyle;
  matboardStyle: RiaaMatboardStyle;
  discLayout: RiaaDiscLayout;
  recipientLine: string;
  dedicationNote: string;
}

export interface RiaaCertifiedRecord {
  key: string; // e.g. 'song:12' or 'project:4'
  itemType: RiaaReleaseType;
  itemId: number;
  title: string;
  releaseSubtype: string; // 'Single' | 'Album' | 'EP'
  cover: string;
  highestCertifiedLevelIndex: number;
  highestTierId: string;
  highestTierLabel: string;
  shortBadge: string;
  metalClass: RiaaMetalClass;
  certifiedUnitsAtAudit: number;
  dateCertified: string;
  serialNumber: string;
  recordLabel: string;
  plaqueConfig: RiaaPlaqueCustomConfig;
  historyMilestones: Array<{
    tierId: string;
    tierLabel: string;
    certifiedDate: string;
    unitsAtAudit: number;
  }>;
}

export interface RiaaAuditLogEntry {
  id: string;
  date: string;
  itemKey: string;
  title: string;
  releaseSubtype: string;
  cover: string;
  previousTierLabel: string;
  newTierLabel: string;
  metalClass: RiaaMetalClass;
  auditedUnits: number;
  auditFeePaid: number;
  serialNumber: string;
}

export interface RiaaState {
  certifiedRecords: Record<string, RiaaCertifiedRecord>;
  auditLogs: RiaaAuditLogEntry[];
  totalAuditFeesPaid: number;
  totalLegacyPoints: number;
}

export interface RiaaItemAuditEvaluation {
  key: string;
  itemType: RiaaReleaseType;
  itemId: number;
  title: string;
  releaseSubtype: string;
  cover: string;
  releaseDate: string;
  recordLabel: string;
  // Exact unit math breakdown
  pureSalesUnits: number;
  streamingEquivalentUnits: number; // SEA (1:150 for singles, 1:1500 for albums)
  trackEquivalentUnits: number; // TEA (1:10 for albums)
  totalRawStreamsAndViews: number;
  totalEligibleRiaaUnits: number;
  // Current & eligible tiers
  currentCertifiedRecord: RiaaCertifiedRecord | null;
  currentCertifiedTier: RiaaTierDefinition | null;
  highestEligibleTier: RiaaTierDefinition | null;
  nextUpcomingTier: RiaaTierDefinition | null;
  newlyUnclaimedTiers: RiaaTierDefinition[];
  isEligibleForNewAudit: boolean;
  progressToNextPercent: number;
  unitsNeededForNext: number;
  // Cumulative audit cost & rewards for claiming all newly reached tiers
  totalAuditCost: number;
  labelSubsidyAmount: number;
  netArtistAuditFee: number;
  totalPopReward: number;
  totalHypeReward: number;
  totalFanReward: number;
  totalLegacyReward: number;
}

export interface RiaaLeaderboardArtistEntry {
  id: string;
  name: string;
  avatar: string;
  isPlayer: boolean;
  isRosterArtist?: boolean;
  rosterArtistId?: string;
  isFormerRoster?: boolean;
  labelName?: string;
  genre: string;
  totalCertifiedUnits: number;
  diamondCount: number;
  multiPlatinumCount: number;
  platinumCount: number;
  goldCount: number;
  totalPlaques: number;
  legacyScore: number;
  signatureDiamondTitle: string;
}

export const RIAA_FRAME_STYLES: Array<{
  id: RiaaFrameStyle;
  label: string;
  description: string;
  borderHex: string;
  innerTrimHex: string;
}> = [
  {
    id: 'obsidian_gallery',
    label: 'Obsidian Museum Black',
    description: 'Anodized gallery aluminum with champagne bevel trim',
    borderHex: '#18181B',
    innerTrimHex: '#D4AF37'
  },
  {
    id: 'gold_leaf_executive',
    label: '24K Brushed Gold Leaf',
    description: 'Executive label showcase frame in brushed 24-karat gold',
    borderHex: '#B48811',
    innerTrimHex: '#FEF08A'
  },
  {
    id: 'brushed_chrome',
    label: 'Specular Studio Chrome',
    description: 'Mirror-polished platinum alloy frame with diamond bevel',
    borderHex: '#A1A1AA',
    innerTrimHex: '#F4F4F5'
  },
  {
    id: 'mahogany_heritage',
    label: 'Heritage Mahogany & Brass',
    description: 'Classic recording academy walnut-mahogany with brass inlay',
    borderHex: '#451A03',
    innerTrimHex: '#F59E0B'
  }
];

export const RIAA_MATBOARD_STYLES: Array<{
  id: RiaaMatboardStyle;
  label: string;
  bgGradient: string;
  swatchHex: string;
}> = [
  {
    id: 'royal_obsidian',
    label: 'Obsidian Velvet',
    bgGradient: 'radial-gradient(circle at 50% 25%, #1F2029 0%, #09090D 100%)',
    swatchHex: '#121218'
  },
  {
    id: 'crimson_velvet',
    label: 'Academy Crimson Velvet',
    bgGradient: 'radial-gradient(circle at 50% 25%, #4C0519 0%, #190209 100%)',
    swatchHex: '#4C0519'
  },
  {
    id: 'midnight_sapphire',
    label: 'Midnight Sapphire Suede',
    bgGradient: 'radial-gradient(circle at 50% 25%, #0F172A 0%, #030712 100%)',
    swatchHex: '#0F172A'
  },
  {
    id: 'emerald_vault',
    label: 'Emerald Archive Velvet',
    bgGradient: 'radial-gradient(circle at 50% 25%, #064E3B 0%, #021C15 100%)',
    swatchHex: '#064E3B'
  }
];

export const RIAA_DISC_LAYOUTS: Array<{
  id: RiaaDiscLayout;
  label: string;
  description: string;
}> = [
  {
    id: 'classic_crest',
    label: 'Classic RIAA Crest',
    description: 'Single metallic master disc above artwork & engraved plate'
  },
  {
    id: 'double_symphony',
    label: 'Dual Overlapping Discs',
    description: 'Twin overlapping metallic LPs flanking the master sleeve'
  },
  {
    id: 'collector_shrine',
    label: 'Cathedral Triple Showcase',
    description: 'Executive three-disc pyramid layout for multi-platinum eras'
  }
];

/**
 * Generates the complete RIAA Certification Ladder from Gold (500K) through 3x Diamond (30M).
 */
export const RIAA_CERTIFICATION_TIERS: RiaaTierDefinition[] = (() => {
  const tiers: RiaaTierDefinition[] = [
    {
      id: 'gold',
      levelIndex: 1,
      label: 'RIAA Gold®',
      shortBadge: 'GOLD',
      unitsRequired: 500_000,
      metalClass: 'gold',
      platinumMultiplier: 0.5,
      diamondCount: 0,
      auditFee: 1_500,
      popBoost: 1,
      hypeBoost: 3,
      fanBoost: 2_500,
      legacyPoints: 15
    },
    {
      id: 'platinum_1x',
      levelIndex: 2,
      label: 'RIAA Platinum®',
      shortBadge: 'PLATINUM',
      unitsRequired: 1_000_000,
      metalClass: 'platinum',
      platinumMultiplier: 1,
      diamondCount: 0,
      auditFee: 2_800,
      popBoost: 2,
      hypeBoost: 5,
      fanBoost: 6_000,
      legacyPoints: 35
    }
  ];

  // 2x Platinum through 9x Platinum
  for (let m = 2; m <= 9; m++) {
    tiers.push({
      id: `platinum_${m}x`,
      levelIndex: m + 1,
      label: `RIAA ${m}x Multi-Platinum®`,
      shortBadge: `${m}x PLAT`,
      unitsRequired: m * 1_000_000,
      metalClass: 'multi_platinum',
      platinumMultiplier: m,
      diamondCount: 0,
      auditFee: 3_500 + m * 400,
      popBoost: m >= 5 ? 2 : 1,
      hypeBoost: 4 + Math.floor(m / 2),
      fanBoost: 5_000 + m * 1_800,
      legacyPoints: 30 + m * 10
    });
  }

  // 10x Platinum = 1x Diamond
  tiers.push({
    id: 'diamond_1x',
    levelIndex: 11,
    label: 'RIAA Diamond® (10x Platinum)',
    shortBadge: 'DIAMOND',
    unitsRequired: 10_000_000,
    metalClass: 'diamond',
    platinumMultiplier: 10,
    diamondCount: 1,
    auditFee: 12_000,
    popBoost: 4,
    hypeBoost: 12,
    fanBoost: 35_000,
    legacyPoints: 200
  });

  // 11x through 19x Platinum (Diamond + Multi-Platinum)
  for (let m = 11; m <= 19; m++) {
    tiers.push({
      id: `platinum_${m}x`,
      levelIndex: m + 1,
      label: `RIAA ${m}x Multi-Platinum® (Diamond)`,
      shortBadge: `${m}x PLAT`,
      unitsRequired: m * 1_000_000,
      metalClass: 'diamond',
      platinumMultiplier: m,
      diamondCount: 1,
      auditFee: 8_500,
      popBoost: 2,
      hypeBoost: 6,
      fanBoost: 15_000,
      legacyPoints: 85
    });
  }

  // 20x Platinum = 2x Diamond
  tiers.push({
    id: 'diamond_2x',
    levelIndex: 21,
    label: 'RIAA 2x Diamond® (20x Platinum)',
    shortBadge: '2x DIAMOND',
    unitsRequired: 20_000_000,
    metalClass: 'diamond',
    platinumMultiplier: 20,
    diamondCount: 2,
    auditFee: 18_000,
    popBoost: 5,
    hypeBoost: 16,
    fanBoost: 65_000,
    legacyPoints: 350
  });

  // 25x Platinum
  tiers.push({
    id: 'platinum_25x',
    levelIndex: 22,
    label: 'RIAA 25x Multi-Platinum® (2x Diamond)',
    shortBadge: '25x PLAT',
    unitsRequired: 25_000_000,
    metalClass: 'diamond',
    platinumMultiplier: 25,
    diamondCount: 2,
    auditFee: 20_000,
    popBoost: 4,
    hypeBoost: 12,
    fanBoost: 50_000,
    legacyPoints: 260
  });

  // 30x Platinum = 3x Diamond
  tiers.push({
    id: 'diamond_3x',
    levelIndex: 23,
    label: 'RIAA 3x Diamond® (30x Platinum)',
    shortBadge: '3x DIAMOND',
    unitsRequired: 30_000_000,
    metalClass: 'diamond',
    platinumMultiplier: 30,
    diamondCount: 3,
    auditFee: 25_000,
    popBoost: 6,
    hypeBoost: 20,
    fanBoost: 90_000,
    legacyPoints: 500
  });

  return tiers;
})();

export function ensureRiaaState(state: GameState): RiaaState {
  const existing = (state as any).riaaState as RiaaState | undefined;
  if (existing && existing.certifiedRecords && Array.isArray(existing.auditLogs)) {
    return existing;
  }
  return {
    certifiedRecords: {},
    auditLogs: [],
    totalAuditFeesPaid: 0,
    totalLegacyPoints: 0
  };
}

export function getRiaaTierById(id: string): RiaaTierDefinition | null {
  return RIAA_CERTIFICATION_TIERS.find(t => t.id === id) || null;
}

export function getHighestEligibleRiaaTier(
  units: number
): RiaaTierDefinition | null {
  let highest: RiaaTierDefinition | null = null;
  for (const tier of RIAA_CERTIFICATION_TIERS) {
    if (units >= tier.unitsRequired) {
      highest = tier;
    } else {
      break;
    }
  }
  return highest;
}

export function getNextRiaaTierAfter(
  currentLevelIndex: number
): RiaaTierDefinition | null {
  return (
    RIAA_CERTIFICATION_TIERS.find(t => t.levelIndex > currentLevelIndex) || null
  );
}

/**
 * Evaluates a single Song using the Official RIAA Digital Single Award formula:
 * 1 RIAA Unit = 1 Pure Single Sale OR 150 On-Demand Audio/Video Streams.
 */
export function evaluateSongRiaaAudit(
  state: GameState,
  song: Song
): RiaaItemAuditEvaluation {
  const riaa = ensureRiaaState(state);
  const key = `song:${song.id}`;
  const currentCert = riaa.certifiedRecords[key] || null;

  const pureSalesUnits = Math.max(0, Math.floor(song.pureSales || 0));
  const rawStreamsAndViews =
    Math.max(0, song.streams || 0) +
    Math.max(0, song.views || 0) +
    Math.max(0, song.visualizerViews || 0) +
    Math.max(0, song.lyricVideoViews || 0);

  // Official RIAA Single Ratio: 150 On-Demand Streams = 1 Unit
  const streamingEquivalentUnits = Math.floor(rawStreamsAndViews / 150);
  const totalEligibleRiaaUnits = pureSalesUnits + streamingEquivalentUnits;

  const parentProject = state.projects.find(p =>
    p.songs?.some(ps => ps.id === song.id)
  );
  const recordLabel =
    parentProject?.recordLabel ||
    (state.popularity >= 45 ? 'Republic / Universal Music Group' : 'Independent Direct');

  return buildAuditEvaluation({
    state,
    key,
    itemType: 'song',
    itemId: song.id,
    title: song.title,
    releaseSubtype: 'Single',
    cover: song.cover || state.artist?.image || '',
    releaseDate: song.releaseDate || state.date,
    recordLabel,
    pureSalesUnits,
    streamingEquivalentUnits,
    trackEquivalentUnits: 0,
    totalRawStreamsAndViews: rawStreamsAndViews,
    totalEligibleRiaaUnits,
    currentCert
  });
}

/**
 * Evaluates an Album or EP using the Official RIAA Album Award (SEA + TEA + Pure) formula:
 * 1 RIAA Album Unit = 1 Pure Album/Vinyl/CD Sale + (1,500 Track Streams = 1 SEA) + (10 Track Sales = 1 TEA)
 */
export function evaluateProjectRiaaAudit(
  state: GameState,
  project: Project
): RiaaItemAuditEvaluation {
  const riaa = ensureRiaaState(state);
  const key = `project:${project.id}`;
  const currentCert = riaa.certifiedRecords[key] || null;

  // Match live songs in state.songs that belong to this project
  const projectTracks = state.songs.filter(s =>
    project.songs?.some(ps => ps.id === s.id)
  );
  const tracksToUse = projectTracks.length > 0 ? projectTracks : project.songs || [];

  const pureSalesUnits = Math.max(0, Math.floor(project.pureSales || 0));

  const rawStreamsAndViews = tracksToUse.reduce(
    (sum, s) =>
      sum +
      Math.max(0, s.streams || 0) +
      Math.max(0, s.views || 0) +
      Math.max(0, s.visualizerViews || 0) +
      Math.max(0, s.lyricVideoViews || 0),
    0
  );

  const totalTrackPureSales = tracksToUse.reduce(
    (sum, s) => sum + Math.max(0, s.pureSales || 0),
    0
  );

  // Official RIAA Album Formula: 1,500 streams = 1 SEA unit; 10 track sales = 1 TEA unit
  const streamingEquivalentUnits = Math.floor(rawStreamsAndViews / 1500);
  const trackEquivalentUnits = Math.floor(totalTrackPureSales / 10);
  const totalEligibleRiaaUnits =
    pureSalesUnits + streamingEquivalentUnits + trackEquivalentUnits;

  const subtypeLabel =
    project.type === 'album'
      ? 'Album'
      : project.type === 'ep'
      ? 'EP'
      : 'Single Pack';

  const recordLabel =
    project.recordLabel ||
    (state.popularity >= 45 ? 'Interscope / Universal Music' : 'Independent Direct');

  return buildAuditEvaluation({
    state,
    key,
    itemType: 'project',
    itemId: project.id,
    title: project.title,
    releaseSubtype: subtypeLabel,
    cover: project.cover || state.artist?.image || '',
    releaseDate: project.releaseDate || state.date,
    recordLabel,
    pureSalesUnits,
    streamingEquivalentUnits,
    trackEquivalentUnits,
    totalRawStreamsAndViews: rawStreamsAndViews,
    totalEligibleRiaaUnits,
    currentCert
  });
}

function buildAuditEvaluation(params: {
  state: GameState;
  key: string;
  itemType: RiaaReleaseType;
  itemId: number;
  title: string;
  releaseSubtype: string;
  cover: string;
  releaseDate: string;
  recordLabel: string;
  pureSalesUnits: number;
  streamingEquivalentUnits: number;
  trackEquivalentUnits: number;
  totalRawStreamsAndViews: number;
  totalEligibleRiaaUnits: number;
  currentCert: RiaaCertifiedRecord | null;
}): RiaaItemAuditEvaluation {
  const {
    state,
    key,
    itemType,
    itemId,
    title,
    releaseSubtype,
    cover,
    releaseDate,
    recordLabel,
    pureSalesUnits,
    streamingEquivalentUnits,
    trackEquivalentUnits,
    totalRawStreamsAndViews,
    totalEligibleRiaaUnits,
    currentCert
  } = params;

  const currentLevelIndex = currentCert?.highestCertifiedLevelIndex || 0;
  const currentCertifiedTier = currentCert
    ? getRiaaTierById(currentCert.highestTierId)
    : null;

  const highestEligibleTier = getHighestEligibleRiaaTier(totalEligibleRiaaUnits);

  const newlyUnclaimedTiers = RIAA_CERTIFICATION_TIERS.filter(
    t =>
      t.levelIndex > currentLevelIndex &&
      totalEligibleRiaaUnits >= t.unitsRequired
  );

  const isEligibleForNewAudit = newlyUnclaimedTiers.length > 0;

  const targetNextTier =
    getNextRiaaTierAfter(
      highestEligibleTier ? highestEligibleTier.levelIndex : currentLevelIndex
    ) || RIAA_CERTIFICATION_TIERS[RIAA_CERTIFICATION_TIERS.length - 1];

  const prevThreshold = highestEligibleTier
    ? highestEligibleTier.unitsRequired
    : 0;
  const span = Math.max(1, targetNextTier.unitsRequired - prevThreshold);
  const progressToNextPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(((totalEligibleRiaaUnits - prevThreshold) / span) * 100)
    )
  );
  const unitsNeededForNext = Math.max(
    0,
    targetNextTier.unitsRequired - totalEligibleRiaaUnits
  );

  const totalAuditCost = newlyUnclaimedTiers.reduce(
    (sum, t) => sum + t.auditFee,
    0
  );
  const hasMajorLabel =
    recordLabel.toLowerCase() !== 'independent direct' &&
    recordLabel.toLowerCase() !== 'independent' &&
    state.popularity >= 25;
  const labelSubsidyAmount = hasMajorLabel ? Math.round(totalAuditCost * 0.45) : 0;
  const netArtistAuditFee = Math.max(0, totalAuditCost - labelSubsidyAmount);

  const totalPopReward = newlyUnclaimedTiers.reduce(
    (sum, t) => sum + t.popBoost,
    0
  );
  const totalHypeReward = newlyUnclaimedTiers.reduce(
    (sum, t) => sum + t.hypeBoost,
    0
  );
  const totalFanReward = newlyUnclaimedTiers.reduce(
    (sum, t) => sum + t.fanBoost,
    0
  );
  const totalLegacyReward = newlyUnclaimedTiers.reduce(
    (sum, t) => sum + t.legacyPoints,
    0
  );

  return {
    key,
    itemType,
    itemId,
    title,
    releaseSubtype,
    cover,
    releaseDate,
    recordLabel,
    pureSalesUnits,
    streamingEquivalentUnits,
    trackEquivalentUnits,
    totalRawStreamsAndViews,
    totalEligibleRiaaUnits,
    currentCertifiedRecord: currentCert,
    currentCertifiedTier,
    highestEligibleTier,
    nextUpcomingTier: targetNextTier,
    newlyUnclaimedTiers,
    isEligibleForNewAudit,
    progressToNextPercent,
    unitsNeededForNext,
    totalAuditCost,
    labelSubsidyAmount,
    netArtistAuditFee,
    totalPopReward,
    totalHypeReward,
    totalFanReward,
    totalLegacyReward
  };
}

/**
 * Evaluates all released songs and projects for the player.
 */
export function evaluateAllPlayerRiaaItems(state: GameState): {
  allItems: RiaaItemAuditEvaluation[];
  eligibleItems: RiaaItemAuditEvaluation[];
  certifiedItems: RiaaCertifiedRecord[];
  summary: {
    totalCertifiedUnits: number;
    diamondCount: number;
    multiPlatinumCount: number;
    platinumCount: number;
    goldCount: number;
    totalPlaques: number;
    legacyScore: number;
  };
} {
  const riaa = ensureRiaaState(state);

  const songEvals = (state.songs || [])
    .filter(s => s.status === 'released')
    .map(s => evaluateSongRiaaAudit(state, s));

  const projectEvals = (state.projects || [])
    .filter(p => p.status === 'released')
    .map(p => evaluateProjectRiaaAudit(state, p));

  const allItems = [...projectEvals, ...songEvals].sort(
    (a, b) => b.totalEligibleRiaaUnits - a.totalEligibleRiaaUnits
  );

  const eligibleItems = allItems.filter(i => i.isEligibleForNewAudit);

  const certifiedItems = Object.values(riaa.certifiedRecords).sort(
    (a, b) => b.certifiedUnitsAtAudit - a.certifiedUnitsAtAudit
  );

  let totalCertifiedUnits = 0;
  let diamondCount = 0;
  let multiPlatinumCount = 0;
  let platinumCount = 0;
  let goldCount = 0;

  for (const cert of certifiedItems) {
    const tier = getRiaaTierById(cert.highestTierId);
    totalCertifiedUnits += cert.certifiedUnitsAtAudit;
    if (!tier) continue;
    if (tier.diamondCount >= 1) {
      diamondCount += tier.diamondCount;
    }
    if (tier.platinumMultiplier >= 2) {
      multiPlatinumCount += 1;
    } else if (tier.platinumMultiplier >= 1) {
      platinumCount += 1;
    } else if (tier.metalClass === 'gold') {
      goldCount += 1;
    }
  }

  return {
    allItems,
    eligibleItems,
    certifiedItems,
    summary: {
      totalCertifiedUnits,
      diamondCount,
      multiPlatinumCount,
      platinumCount,
      goldCount,
      totalPlaques: certifiedItems.length,
      legacyScore: riaa.totalLegacyPoints
    }
  };
}

/**
 * Helper to look up the current certified badge for a song or project (used in CatalogItem & StatisticApp).
 */
export function getItemRiaaCertBadge(
  state: GameState,
  itemType: RiaaReleaseType,
  itemId: number
): {
  isCertified: boolean;
  isEligibleForUpgrade: boolean;
  shortBadge: string;
  metalClass: RiaaMetalClass;
  tierLabel: string;
} | null {
  const riaa = ensureRiaaState(state);
  const key = `${itemType}:${itemId}`;
  const cert = riaa.certifiedRecords[key];

  // Check if eligible right now
  let evalItem: RiaaItemAuditEvaluation | null = null;
  if (itemType === 'song') {
    const song = state.songs.find(s => s.id === itemId);
    if (song && song.status === 'released') {
      evalItem = evaluateSongRiaaAudit(state, song);
    }
  } else {
    const proj = state.projects.find(p => p.id === itemId);
    if (proj && proj.status === 'released') {
      evalItem = evaluateProjectRiaaAudit(state, proj);
    }
  }

  if (!cert && (!evalItem || !evalItem.isEligibleForNewAudit)) {
    return null;
  }

  if (cert) {
    return {
      isCertified: true,
      isEligibleForUpgrade: Boolean(evalItem?.isEligibleForNewAudit),
      shortBadge: cert.shortBadge,
      metalClass: cert.metalClass,
      tierLabel: cert.highestTierLabel
    };
  }

  return {
    isCertified: false,
    isEligibleForUpgrade: true,
    shortBadge: 'RIAA ELIGIBLE',
    metalClass: evalItem?.highestEligibleTier?.metalClass || 'gold',
    tierLabel: evalItem?.highestEligibleTier?.label || 'RIAA Eligible'
  };
}

/**
 * Submits an official RIAA Audit Request for a song or project, deducts the audit fee,
 * grants career Popularity/Hype/Fan rewards, creates/updates the 3D Commemorative Plaque,
 * and posts an official @RIAA announcement on X.
 */
export function submitRiaaCertificationAudit(params: {
  state: GameState;
  itemKey: string;
  plaqueConfig?: Partial<RiaaPlaqueCustomConfig>;
}): {
  success: boolean;
  error?: string;
  updatedState: GameState;
  certifiedRecord?: RiaaCertifiedRecord;
  newlyClaimedTier?: RiaaTierDefinition;
} {
  const { state, itemKey, plaqueConfig } = params;
  const { allItems } = evaluateAllPlayerRiaaItems(state);
  const evaluation = allItems.find(i => i.key === itemKey);

  if (!evaluation) {
    return {
      success: false,
      error: 'Release not found in your active catalog.',
      updatedState: state
    };
  }

  if (!evaluation.isEligibleForNewAudit || !evaluation.highestEligibleTier) {
    return {
      success: false,
      error: 'This release has not crossed a new RIAA unit threshold yet.',
      updatedState: state
    };
  }

  if (state.money < evaluation.netArtistAuditFee) {
    return {
      success: false,
      error: `Insufficient funds for RIAA Audit & Plaque manufacturing ($${formatNumFull(
        evaluation.netArtistAuditFee
      )} required).`,
      updatedState: state
    };
  }

  const riaa = ensureRiaaState(state);
  const artistName = state.artist?.name || 'Artist';
  const topNewTier = evaluation.highestEligibleTier;
  const existingCert = riaa.certifiedRecords[itemKey];

  const defaultConfig: RiaaPlaqueCustomConfig = existingCert?.plaqueConfig || {
    frameStyle:
      topNewTier.metalClass === 'diamond'
        ? 'brushed_chrome'
        : topNewTier.metalClass === 'gold'
        ? 'gold_leaf_executive'
        : 'obsidian_gallery',
    matboardStyle:
      topNewTier.metalClass === 'diamond'
        ? 'midnight_sapphire'
        : 'royal_obsidian',
    discLayout:
      topNewTier.platinumMultiplier >= 2
        ? 'collector_shrine'
        : topNewTier.platinumMultiplier >= 1
        ? 'double_symphony'
        : 'classic_crest',
    recipientLine: `PRESENTED TO ${artistName.toUpperCase()}`,
    dedicationNote: `TO COMMEMORATE ${formatNumFull(
      topNewTier.unitsRequired
    )} CERTIFIED RIAA® UNITS OF "${evaluation.title.toUpperCase()}"`
  };

  const finalPlaqueConfig: RiaaPlaqueCustomConfig = {
    ...defaultConfig,
    ...plaqueConfig
  };

  const serialHash = Math.abs(
    evaluation.itemId * 7919 + topNewTier.unitsRequired / 1000
  )
    .toString(16)
    .toUpperCase()
    .slice(0, 6);
  const serialNumber = `RIAA-${
    evaluation.itemType === 'project' ? 'ALB' : 'SGL'
  }-${serialHash}`;

  const updatedMilestones = [
    ...(existingCert?.historyMilestones || []),
    ...evaluation.newlyUnclaimedTiers.map(t => ({
      tierId: t.id,
      tierLabel: t.label,
      certifiedDate: state.date,
      unitsAtAudit: evaluation.totalEligibleRiaaUnits
    }))
  ];

  const newCertRecord: RiaaCertifiedRecord = {
    key: itemKey,
    itemType: evaluation.itemType,
    itemId: evaluation.itemId,
    title: evaluation.title,
    releaseSubtype: evaluation.releaseSubtype,
    cover: evaluation.cover,
    highestCertifiedLevelIndex: topNewTier.levelIndex,
    highestTierId: topNewTier.id,
    highestTierLabel: topNewTier.label,
    shortBadge: topNewTier.shortBadge,
    metalClass: topNewTier.metalClass,
    certifiedUnitsAtAudit: evaluation.totalEligibleRiaaUnits,
    dateCertified: state.date,
    serialNumber,
    recordLabel: evaluation.recordLabel,
    plaqueConfig: finalPlaqueConfig,
    historyMilestones: updatedMilestones
  };

  const newAuditLog: RiaaAuditLogEntry = {
    id: `riaa_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: state.date,
    itemKey,
    title: evaluation.title,
    releaseSubtype: evaluation.releaseSubtype,
    cover: evaluation.cover,
    previousTierLabel: existingCert ? existingCert.highestTierLabel : 'Uncertified',
    newTierLabel: topNewTier.label,
    metalClass: topNewTier.metalClass,
    auditedUnits: evaluation.totalEligibleRiaaUnits,
    auditFeePaid: evaluation.netArtistAuditFee,
    serialNumber
  };

  // Publish an official @RIAA announcement post to X
  const riaaXPost: XPost = {
    id: `riaa_x_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorName: 'RIAA',
    authorHandle: '@RIAA',
    authorAvatar: evaluation.cover,
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    timeAgo: 'Just now',
    dateCreated: state.date,
    content: `✨🏆 OFFICIAL CERTIFICATION: Congratulations to ${artistName}! "${
      evaluation.title
    }" (${evaluation.releaseSubtype}) is now officially certified ${
      topNewTier.label
    } in the United States for over ${formatNumFull(
      topNewTier.unitsRequired
    )} certified units! #RIAATopCertified #${artistName.replace(/\s+/g, '')}`,
    image: evaluation.cover,
    mediaBadge: topNewTier.shortBadge,
    mediaTitle: `${evaluation.title} — ${topNewTier.label}`,
    mediaSubtitle: `${formatNumFull(
      evaluation.totalEligibleRiaaUnits
    )} Total Audited Units • Serial #${serialNumber}`,
    likes: Math.round(
      14_000 + (state.popularity || 10) * 1_850 + topNewTier.platinumMultiplier * 9_500
    ),
    reposts: Math.round(
      3_200 + (state.popularity || 10) * 420 + topNewTier.platinumMultiplier * 2_400
    ),
    replies: Math.round(
      650 + (state.popularity || 10) * 95 + topNewTier.platinumMultiplier * 410
    ),
    views: Math.round(
      95_000 + (state.popularity || 10) * 14_000 + topNewTier.platinumMultiplier * 65_000
    ),
    daysOld: 0
  };

  const nextPop = Math.min(100, (state.popularity || 0) + evaluation.totalPopReward);
  const nextHype = Math.min(100, (state.hype || 0) + evaluation.totalHypeReward);
  const nextFans = (state.fans || 250) + evaluation.totalFanReward;

  const updatedRiaaState: RiaaState = {
    ...riaa,
    certifiedRecords: {
      ...riaa.certifiedRecords,
      [itemKey]: newCertRecord
    },
    auditLogs: [newAuditLog, ...riaa.auditLogs].slice(0, 60),
    totalAuditFeesPaid:
      (riaa.totalAuditFeesPaid || 0) + evaluation.netArtistAuditFee,
    totalLegacyPoints:
      (riaa.totalLegacyPoints || 0) + evaluation.totalLegacyReward
  };

  const updatedState: GameState = {
    ...state,
    money: state.money - evaluation.netArtistAuditFee,
    popularity: nextPop,
    hype: nextHype,
    fans: nextFans,
    xPosts: [riaaXPost, ...(state.xPosts || [])].slice(0, 120),
    ...({ riaaState: updatedRiaaState } as any)
  };

  return {
    success: true,
    updatedState,
    certifiedRecord: newCertRecord,
    newlyClaimedTier: topNewTier
  };
}

/**
 * Updates the custom frame, matboard, disc layout, or dedication engraving on an existing certified plaque.
 */
export function updateCertifiedPlaqueDesign(
  state: GameState,
  itemKey: string,
  plaqueConfig: Partial<RiaaPlaqueCustomConfig>
): GameState {
  const riaa = ensureRiaaState(state);
  const existing = riaa.certifiedRecords[itemKey];
  if (!existing) return state;

  const updatedRecord: RiaaCertifiedRecord = {
    ...existing,
    plaqueConfig: {
      ...existing.plaqueConfig,
      ...plaqueConfig
    }
  };

  return {
    ...state,
    ...({
      riaaState: {
        ...riaa,
        certifiedRecords: {
          ...riaa.certifiedRecords,
          [itemKey]: updatedRecord
        }
      }
    } as any)
  };
}

/**
 * Builds the Global All-Time RIAA Gold & Platinum Leaderboard comparing the Player against NPC Superstars.
 */
export function buildGlobalRiaaLeaderboard(
  state: GameState
): RiaaLeaderboardArtistEntry[] {
  const playerEval = evaluateAllPlayerRiaaItems(state);
  const artistName = state.artist?.name || 'Artist';
  const playerTopDiamond = playerEval.certifiedItems.find(
    c => c.metalClass === 'diamond'
  );
  const playerTopCert = playerEval.certifiedItems[0];

  const entries: RiaaLeaderboardArtistEntry[] = [
    {
      id: 'player_artist',
      name: artistName,
      avatar: state.artist?.image || '',
      isPlayer: true,
      genre: state.songs[0]?.genre || 'Pop / Contemporary',
      totalCertifiedUnits: playerEval.summary.totalCertifiedUnits,
      diamondCount: playerEval.summary.diamondCount,
      multiPlatinumCount: playerEval.summary.multiPlatinumCount,
      platinumCount: playerEval.summary.platinumCount,
      goldCount: playerEval.summary.goldCount,
      totalPlaques: playerEval.summary.totalPlaques,
      legacyScore: playerEval.summary.legacyScore,
      signatureDiamondTitle:
        playerTopDiamond?.title ||
        playerTopCert?.title ||
        'No Certified Releases Yet'
    }
  ];

  // Historical baseline benchmarks for iconic global artists + dynamic growth from live NPC songs/projects
  const ICONIC_RIAA_BASELINES: Record<
    string,
    {
      baseUnits: number;
      diamonds: number;
      multiPlat: number;
      plat: number;
      gold: number;
      signature: string;
    }
  > = {
    'drake': {
      baseUnits: 238_000_000,
      diamonds: 10,
      multiPlat: 58,
      plat: 42,
      gold: 35,
      signature: "God's Plan (16x Platinum)"
    },
    'taylor swift': {
      baseUnits: 214_500_000,
      diamonds: 7,
      multiPlat: 54,
      plat: 38,
      gold: 31,
      signature: 'Shake It Off / 1989 (Diamond)'
    },
    'rihanna': {
      baseUnits: 192_000_000,
      diamonds: 7,
      multiPlat: 44,
      plat: 28,
      gold: 22,
      signature: 'We Found Love (11x Platinum)'
    },
    'the weeknd': {
      baseUnits: 176_000_000,
      diamonds: 6,
      multiPlat: 39,
      plat: 24,
      gold: 19,
      signature: 'Blinding Lights (Diamond)'
    },
    'post malone': {
      baseUnits: 164_000_000,
      diamonds: 9,
      multiPlat: 34,
      plat: 21,
      gold: 16,
      signature: 'Sunflower (2x Diamond / 20x Plat)'
    },
    'eminem': {
      baseUnits: 227_500_000,
      diamonds: 6,
      multiPlat: 49,
      plat: 33,
      gold: 25,
      signature: 'Lose Yourself (13x Platinum)'
    },
    'travis scott': {
      baseUnits: 132_000_000,
      diamonds: 5,
      multiPlat: 31,
      plat: 20,
      gold: 18,
      signature: 'SICKO MODE (15x Platinum)'
    },
    'ariana grande': {
      baseUnits: 138_500_000,
      diamonds: 3,
      multiPlat: 36,
      plat: 25,
      gold: 20,
      signature: '7 rings (9x Platinum)'
    },
    'billie eilish': {
      baseUnits: 112_000_000,
      diamonds: 3,
      multiPlat: 27,
      plat: 19,
      gold: 15,
      signature: 'bad guy (Diamond)'
    },
    'sza': {
      baseUnits: 98_500_000,
      diamonds: 2,
      multiPlat: 26,
      plat: 18,
      gold: 14,
      signature: 'Kill Bill / SOS (8x Platinum)'
    },
    'kendrick lamar': {
      baseUnits: 118_000_000,
      diamonds: 3,
      multiPlat: 29,
      plat: 21,
      gold: 15,
      signature: 'HUMBLE. (Diamond)'
    },
    'bruno mars': {
      baseUnits: 158_000_000,
      diamonds: 6,
      multiPlat: 33,
      plat: 19,
      gold: 14,
      signature: 'Just the Way You Are (2x Diamond)'
    },
    'beyoncé': {
      baseUnits: 162_000_000,
      diamonds: 4,
      multiPlat: 41,
      plat: 29,
      gold: 24,
      signature: 'Halo / Single Ladies (Diamond)'
    },
    'justin bieber': {
      baseUnits: 168_500_000,
      diamonds: 5,
      multiPlat: 38,
      plat: 26,
      gold: 21,
      signature: 'Baby / Sorry (Diamond)'
    },
    'ed sheeran': {
      baseUnits: 154_000_000,
      diamonds: 5,
      multiPlat: 35,
      plat: 23,
      gold: 18,
      signature: 'Shape of You (13x Platinum)'
    },
    'kanye west': {
      baseUnits: 169_000_000,
      diamonds: 4,
      multiPlat: 42,
      plat: 31,
      gold: 27,
      signature: 'Stronger (Diamond)'
    },
    'katy perry': {
      baseUnits: 149_000_000,
      diamonds: 6,
      multiPlat: 31,
      plat: 20,
      gold: 16,
      signature: 'Firework / Dark Horse (12x Platinum)'
    },
    'lady gaga': {
      baseUnits: 144_000_000,
      diamonds: 5,
      multiPlat: 32,
      plat: 22,
      gold: 17,
      signature: 'Bad Romance / Poker Face (Diamond)'
    },
    'adele': {
      baseUnits: 136_000_000,
      diamonds: 4,
      multiPlat: 29,
      plat: 18,
      gold: 12,
      signature: '21 Album (14x Platinum / Diamond)'
    },
    'bad bunny': {
      baseUnits: 126_000_000,
      diamonds: 4,
      multiPlat: 34,
      plat: 24,
      gold: 19,
      signature: 'DÁKITI (24x Plat Latin / Diamond)'
    },
    'nicki minaj': {
      baseUnits: 129_000_000,
      diamonds: 3,
      multiPlat: 33,
      plat: 25,
      gold: 22,
      signature: 'Super Bass (12x Platinum)'
    },
    'imagine dragons': {
      baseUnits: 134_000_000,
      diamonds: 5,
      multiPlat: 28,
      plat: 19,
      gold: 15,
      signature: 'Radioactive (16x Platinum)'
    },
    'chris stapleton': {
      baseUnits: 108_000_000,
      diamonds: 2,
      multiPlat: 24,
      plat: 18,
      gold: 15,
      signature: 'Tennessee Whiskey (17x Platinum)'
    },
    'luke combs': {
      baseUnits: 104_500_000,
      diamonds: 2,
      multiPlat: 25,
      plat: 19,
      gold: 14,
      signature: 'Beautiful Crazy (12x Platinum)'
    },
    'olivia rodrigo': {
      baseUnits: 74_000_000,
      diamonds: 1,
      multiPlat: 19,
      plat: 14,
      gold: 11,
      signature: 'drivers license / good 4 u (7x Plat)'
    },
    'doja cat': {
      baseUnits: 86_000_000,
      diamonds: 2,
      multiPlat: 22,
      plat: 16,
      gold: 13,
      signature: 'Say So / Kiss Me More (8x Plat)'
    },
    'dua lipa': {
      baseUnits: 82_000_000,
      diamonds: 2,
      multiPlat: 20,
      plat: 15,
      gold: 12,
      signature: 'Levitating (Diamond)'
    },
    'sabrina carpenter': {
      baseUnits: 58_000_000,
      diamonds: 1,
      multiPlat: 15,
      plat: 12,
      gold: 10,
      signature: 'Espresso (6x Platinum)'
    }
  };

  const rawNpcs: NPC[] =
    state.npcs && state.npcs.length > 0 ? state.npcs : DETAILED_NPCS;
  const playerLower = (state.artist?.name || '').trim().toLowerCase();
  const suppressedNames = new Set<string>();
  if (playerLower) suppressedNames.add(playerLower);

  // Include all Signed & Former Roster Artists from the Player's Record Label Imprint!
  const imprint = (state as any).recordLabelState?.imprint;
  const signedRoster: any[] = Array.isArray(imprint?.signedRoster)
    ? imprint.signedRoster
    : [];

  for (const rArt of signedRoster) {
    const stageName = (rArt.stageName || rArt.name || '').trim();
    if (!stageName) continue;
    suppressedNames.add(stageName.toLowerCase());
    if (rArt.name) suppressedNames.add(String(rArt.name).trim().toLowerCase());

    const certs: RiaaCertifiedRecord[] = Array.isArray(rArt.riaaCertifications)
      ? rArt.riaaCertifications
      : [];
    let certUnitsSum = 0;
    let dCount = 0;
    let mpCount = 0;
    let pCount = 0;
    let gCount = 0;

    for (const c of certs) {
      certUnitsSum += c.certifiedUnitsAtAudit || 0;
      const tierDef = RIAA_CERTIFICATION_TIERS.find(t => t.id === c.highestTierId);
      if (tierDef && tierDef.diamondCount > 0) {
        dCount += tierDef.diamondCount;
      } else if (c.metalClass === 'diamond') {
        dCount += 1;
      }
      if (c.metalClass === 'multi_platinum' || c.metalClass === 'diamond') {
        mpCount += 1;
      } else if (c.metalClass === 'platinum') {
        pCount += 1;
      } else if (c.metalClass === 'gold') {
        gCount += 1;
      }
    }

    // Also compute live RIAA-eligible units across the Roster Artist's released catalog so active roster stars rank accurately
    const rSongs: Song[] = Array.isArray(rArt.songs) ? rArt.songs : [];
    const rProjects: Project[] = Array.isArray(rArt.projects) ? rArt.projects : [];
    const liveSongUnits = rSongs
      .filter(s => s.status === 'released')
      .reduce(
        (sum, s) =>
          sum +
          Math.floor(((s.streams || 0) + (s.views || 0)) / 150) +
          (s.pureSales || 0),
        0
      );
    const liveProjUnits = rProjects
      .filter(p => p.status === 'released')
      .reduce((sum, p) => sum + (p.pureSales || 0), 0);

    const totalRosterUnits = Math.max(certUnitsSum, liveSongUnits + liveProjUnits);
    const topCert = certs[0];
    const topSong = [...rSongs].sort((a, b) => (b.streams || 0) - (a.streams || 0))[0];

    entries.push({
      id: `roster_${rArt.id}`,
      name: stageName,
      avatar: rArt.avatarUrl || getNpcAvatar(stageName),
      isPlayer: false,
      isRosterArtist: true,
      rosterArtistId: rArt.id,
      isFormerRoster: Boolean(
        rArt.isFormerRoster ||
          rArt.contractExpired ||
          (typeof rArt.daysRemaining === 'number' && rArt.daysRemaining <= 0)
      ),
      labelName: imprint?.imprintName || 'Player Record Label',
      genre: rArt.genre || 'Pop',
      totalCertifiedUnits: totalRosterUnits,
      diamondCount: dCount,
      multiPlatinumCount: mpCount,
      platinumCount: pCount,
      goldCount: gCount,
      totalPlaques: certs.length,
      legacyScore: dCount * 200 + mpCount * 55 + pCount * 35 + gCount * 15,
      signatureDiamondTitle: topCert
        ? `${topCert.title} (${topCert.shortBadge})`
        : topSong
        ? `${topSong.title} (Active Catalog)`
        : `${stageName} Debut Catalog`
    });
  }

  rawNpcs
    .filter(npc => !suppressedNames.has(npc.name.trim().toLowerCase()))
    .forEach(npc => {
      const lower = npc.name.toLowerCase();
      const preset = ICONIC_RIAA_BASELINES[lower];

      // Calculate live units from NPC's active songs & albums in the simulation
      const liveSongUnits = (npc.songs || []).reduce(
        (sum, s) => sum + Math.floor((s.streams || 0) / 150) + (s.sales || 0),
        0
      );
      const liveAlbumUnits = (npc.albums || []).reduce(
        (sum, a) =>
          sum + Math.floor((a.streams || 0) / 1500) + (a.sales || 0),
        0
      );
      const totalLiveUnits = liveSongUnits + liveAlbumUnits;

      const topLiveSong = [...(npc.songs || [])].sort(
        (a, b) => (b.streams || 0) - (a.streams || 0)
      )[0];

      const baseUnits = preset
        ? preset.baseUnits
        : Math.round(
            Math.pow(Math.max(25, npc.pop || 50), 1.85) * 28_500 +
              (4 - Math.min(3, npc.tier || 2)) * 8_500_000
          );
      const totalCertifiedUnits = baseUnits + totalLiveUnits;

      const diamondCount = preset
        ? preset.diamonds + Math.floor(totalLiveUnits / 20_000_000)
        : Math.max(0, Math.floor(totalCertifiedUnits / 32_000_000));
      const multiPlatinumCount = preset
        ? preset.multiPlat + Math.floor(totalLiveUnits / 4_000_000)
        : Math.max(1, Math.floor(totalCertifiedUnits / 3_600_000));
      const platinumCount = preset
        ? preset.plat + Math.floor(totalLiveUnits / 1_800_000)
        : Math.max(2, Math.floor(totalCertifiedUnits / 2_200_000));
      const goldCount = preset
        ? preset.gold + Math.floor(totalLiveUnits / 900_000)
        : Math.max(3, Math.floor(totalCertifiedUnits / 1_500_000));

      const totalPlaques =
        diamondCount + multiPlatinumCount + platinumCount + goldCount;
      const legacyScore =
        diamondCount * 200 +
        multiPlatinumCount * 55 +
        platinumCount * 35 +
        goldCount * 15;

      entries.push({
        id: npc.id,
        name: npc.name,
        avatar: npc.image || npc.avatar || getNpcAvatar(npc.name),
        isPlayer: false,
        genre: npc.genre || 'Pop',
        totalCertifiedUnits,
        diamondCount,
        multiPlatinumCount,
        platinumCount,
        goldCount,
        totalPlaques,
        legacyScore,
        signatureDiamondTitle:
          preset?.signature ||
          (topLiveSong
            ? `${topLiveSong.title} (Multi-Platinum)`
            : `${npc.name} Anthology`)
      });
    });

  return entries.sort((a, b) => b.totalCertifiedUnits - a.totalCertifiedUnits);
}
