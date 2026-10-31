import { GameState, Project, Song } from '../types';
import { getEnsuredStaffState, HiredStaffMember, StaffRoleId } from './staffTeamEngine';
import { RiaaCertifiedRecord } from './riaaCertificationEngine';
import {
  simulateRosterArtistAsPlayerDaily,
  syncActiveRosterArtistsToSharedWorld,
} from './rosterSharedWorldBridge';
import {
  MIN_RECORD_LABEL_CAPITAL_INVESTMENT,
  evaluateRecordLabelFoundingEligibility,
  processDailyRosterTrustHiatusAndStaffPayroll,
} from './rosterTrustHiatusPayrollEngine';
import { processDailyRosterInternationalShows } from './rosterInternationalShowsEngine';

export type RecordLabelTier = 1 | 2 | 3;

export type RecordDealTypeId =
  | 'licensing'
  | 'exclusive_royalty'
  | 'joint_venture'
  | 'major_360';

export interface RecordDealStructureDef {
  id: RecordDealTypeId;
  name: string;
  shortTag: string;
  masterOwnershipLabel: string;
  mastersOwnedByArtistDefault: boolean;
  advanceMultiplier: number;
  budgetMultiplier: number;
  artistRoyaltyMin: number;
  artistRoyaltyDefault: number;
  artistRoyaltyMax: number;
  ancillary360CutPct: number;
  description: string;
  clauses: string[];
}

export interface RecordLabelPartner {
  id: string;
  name: string;
  shortMonogram: string;
  parentGroup: string;
  tier: RecordLabelTier;
  tierLabel: 'Indie Boutique' | 'Mid-Major' | 'Global Major';
  headquarters: string;
  foundedYear: number;
  logoDataUri: string;
  brandPrimaryHex: string;
  brandAccentHex: string;
  prestigeScore: number;
  minPopularity: number;
  allowedDealTypes: RecordDealTypeId[];
  preferredDealType: RecordDealTypeId;
  baseAdvancePerAlbum: number;
  baseMarketingBudgetPerAlbum: number;
  arQualityFloor: number;
  radioLeverageBonus: number;
  playlistPitchBonusPct: number;
  globalDistributionReachPct: number;
  bio: string;
  signaturePerks: string[];
}

export type LabelPitchStatus = 'pending_review' | 'interested' | 'declined';

export interface LabelPitchSubmission {
  labelId: string;
  labelName: string;
  submittedDate: string;
  demoSongId?: number;
  demoSongTitle: string;
  demoSongQuality: number;
  daysRemaining: number; // Starts at 7 days (1 week)
  status: LabelPitchStatus;
  arFeedback: string;
  offerExpiresDaysLeft?: number; // 21 days to sign once approved
  cooldownDaysLeft?: number;     // 14 days if declined
}

export interface RecordContractProposal {
  labelId: string;
  dealType: RecordDealTypeId;
  albumQuota: number;        // 1 to 4 albums/EPs
  singleQuota: number;       // 2 to 10 singles
  offeredAdvance: number;
  artistRoyaltyPct: number;
}

export interface ActiveArtistLabelContract {
  contractRef: string;
  labelId: string;
  labelName: string;
  parentGroup: string;
  tier: RecordLabelTier;
  dealType: RecordDealTypeId;
  dealTypeName: string;
  signedDate: string;
  totalAdvanceReceived: number;
  unrecoupedBalance: number;
  totalRoyaltiesRecouped: number;
  netRoyaltiesPaidToArtist: number;
  total360AncillaryCutPaid: number;
  artistRoyaltyPct: number;
  ancillary360CutPct: number;
  mastersOwnedByArtist: boolean;
  masterBuybackPrice: number;
  albumQuotaTotal: number;
  albumsDelivered: number;
  singleQuotaTotal: number;
  singlesDelivered: number;
  arQualityFloor: number;
  arTrustScore: number; // 0 to 100
  availableMarketingBudget: number;
  totalMarketingBudgetGranted: number;
  countedSongIds: number[];
  countedProjectIds: number[];
}

export interface ImprintSignedArtist {
  id: string;
  name: string;
  stageName?: string;
  realName?: string;
  avatarUrl?: string;
  bio?: string;
  initials: string;
  genre: string;
  country: string;
  popularity: number;
  fans?: number;
  monthlyListeners?: number;
  hype: number;
  potential: number;
  signedDate: string;
  contractRef?: string;
  termMonths?: number;
  daysRemaining?: number;
  advancePaid: number;
  unrecoupedAdvance: number;
  imprintRoyaltyCutPct: number;
  ancillary360CutPct?: number;
  albumsCommitted: number;
  albumsReleased: number;
  singlesCommitted?: number;
  singlesReleased?: number;
  daysUntilNextRelease: number;
  totalStreamsGenerated: number;
  dailyStreams: number;
  totalGrossGenerated: number;
  totalNetProfitForImprint: number;
  latestReleaseTitle: string;
  latestReleaseQuality: number;
  songs?: Song[];
  projects?: Project[];
  staffRoster?: Partial<Record<StaffRoleId, HiredStaffMember>>;
  riaaCertifications?: RiaaCertifiedRecord[];
  isFormerRoster?: boolean;
  contractExpired?: boolean;
  willingToRenew?: boolean;
  promoCooldownDaysLeft?: number;
  lastPromoCampaignDate?: string;
  labelTrust?: number;
  fatigueScore?: number;
  consecutiveComebacksWithoutRest?: number;
  daysSinceLastComeback?: number;
  hiatusStatus?: 'active' | 'requesting_hiatus' | 'on_hiatus';
  hiatusDaysLeft?: number;
}

export interface ImprintScoutCandidate {
  id: string;
  name: string;
  initials: string;
  genre: string;
  country: string;
  popularity: number;
  potential: number;
  askingAdvance: number;
  recommendedImprintCutPct: number;
  albumsCommitted: number;
  bio: string;
}

export interface PlayerImprintState {
  isFounded: boolean;
  imprintName: string;
  name?: string;
  logoUrl?: string;
  foundedDate: string;
  headquarters: string;
  distributionPartnerId: 'indie_direct' | 'awal_orchard' | 'major_umg_jv';
  distributionPartnerName: string;
  distributorCutPct: number;
  prestige: number;
  valuation: number;
  totalRevenueGenerated: number;
  totalNetProfitEarned: number;
  dailyImprintNetIncome: number;
  signedRoster: ImprintSignedArtist[];
  labelStaffRoster?: Partial<Record<StaffRoleId, HiredStaffMember>>;
  youtubeChannel?: any;
  xAccount?: any;
}

export interface LabelAccountingStatementItem {
  id: string;
  date: string;
  title: string;
  detail: string;
  amount: number;
  direction: 'credit' | 'debit' | 'recoup' | 'neutral';
  category: 'advance' | 'recoupment' | 'budget_grant' | 'quota' | 'buyback' | 'imprint' | 'pitch';
}

export interface RecordLabelSystemState {
  activeContract: ActiveArtistLabelContract | null;
  pitches: Record<string, LabelPitchSubmission>;
  completedContractsCount: number;
  imprint: PlayerImprintState;
  statements: LabelAccountingStatementItem[];
  lastProcessedDate?: string;
}

/**
 * Helper to generate crisp, high-resolution SVG Crest Logos for each Record Label.
 */
function buildLabelLogoSvg(
  bgHex: string,
  accentHex: string,
  monogram: string,
  subText: string,
  motif: 'vinyl' | 'crown' | 'globe' | 'star' | 'wave' | 'diamond'
): string {
  const motifPath =
    motif === 'crown'
      ? `<path d="M36 30 L44 40 L50 28 L56 40 L64 30 L62 44 L38 44 Z" fill="${accentHex}" opacity="0.9"/>`
      : motif === 'globe'
      ? `<circle cx="50" cy="34" r="9" stroke="${accentHex}" stroke-width="2" fill="none"/><ellipse cx="50" cy="34" rx="4.5" ry="9" stroke="${accentHex}" stroke-width="1.5" fill="none"/><line x1="41" y1="34" x2="59" y2="34" stroke="${accentHex}" stroke-width="1.5"/>`
      : motif === 'star'
      ? `<polygon points="50,23 53,31 61,31 55,36 57,44 50,39 43,44 45,36 39,31 47,31" fill="${accentHex}"/>`
      : motif === 'diamond'
      ? `<polygon points="50,22 60,33 50,44 40,33" fill="none" stroke="${accentHex}" stroke-width="2.5"/><circle cx="50" cy="33" r="3" fill="${accentHex}"/>`
      : motif === 'wave'
      ? `<path d="M36 34 Q43 24 50 34 T64 34" fill="none" stroke="${accentHex}" stroke-width="3" stroke-linecap="round"/>`
      : `<circle cx="50" cy="34" r="9" stroke="${accentHex}" stroke-width="2.2" fill="none"/><circle cx="50" cy="34" r="3" fill="${accentHex}"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}"/>
        <stop offset="100%" stop-color="#07090E"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#g)"/>
    <rect x="5" y="5" width="90" height="90" rx="18" fill="none" stroke="${accentHex}" stroke-width="1.8" stroke-opacity="0.55"/>
    <rect x="9" y="9" width="82" height="82" rx="14" fill="none" stroke="${accentHex}" stroke-width="0.7" stroke-opacity="0.3"/>
    ${motifPath}
    <text x="50" y="68" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="22" fill="#FFFFFF" letter-spacing="1.5">${monogram}</text>
    <text x="50" y="83" text-anchor="middle" font-family="monospace" font-weight="700" font-size="7.5" fill="${accentHex}" letter-spacing="2">${subText}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const RECORD_DEAL_STRUCTURES: Record<RecordDealTypeId, RecordDealStructureDef> = {
  licensing: {
    id: 'licensing',
    name: 'Master Licensing & Distribution Agreement',
    shortTag: 'Licensing (Own Masters)',
    masterOwnershipLabel: '100% Artist Master Ownership (Reverts Immediately)',
    mastersOwnedByArtistDefault: true,
    advanceMultiplier: 0.55,
    budgetMultiplier: 0.65,
    artistRoyaltyMin: 55,
    artistRoyaltyDefault: 68,
    artistRoyaltyMax: 78,
    ancillary360CutPct: 0,
    description:
      'You license your masters for a fixed quota while retaining full ownership and a high royalty split, in exchange for a smaller cash advance.',
    clauses: [
      'Artist retains 100% Master Copyright Ownership in perpetuity',
      'High Artist Royalty Share (55% – 78% net receipts)',
      'Zero 360° participation on Touring or Merchandise revenue',
      'Modest recoupable advance & targeted marketing grant',
    ],
  },
  exclusive_royalty: {
    id: 'exclusive_royalty',
    name: 'Exclusive Recording & Royalty Agreement',
    shortTag: 'Standard Royalty Deal',
    masterOwnershipLabel: 'Label Owns Masters (Eligible for Catalog Buyback)',
    mastersOwnedByArtistDefault: false,
    advanceMultiplier: 1.0,
    budgetMultiplier: 1.0,
    artistRoyaltyMin: 20,
    artistRoyaltyDefault: 32,
    artistRoyaltyMax: 45,
    ancillary360CutPct: 0,
    description:
      'Classic record label contract providing a substantial recoupable cash advance and full marketing/MV support while the label holds master rights.',
    clauses: [
      'Full Recoupable Cash Advance wired upon contract execution',
      'Dedicated Label Marketing, Radio & MV Production Budget Pool',
      'Royalties recoup your advance first; zero personal debt if unrecouped',
      'Master Buyback Clause unlocked at 65%+ A&R Trust',
    ],
  },
  joint_venture: {
    id: 'joint_venture',
    name: '50/50 Executive Joint Venture (JV)',
    shortTag: '50/50 Joint Venture',
    masterOwnershipLabel: 'Co-Owned Masters (50% Artist / 50% Label)',
    mastersOwnedByArtistDefault: true,
    advanceMultiplier: 0.85,
    budgetMultiplier: 1.15,
    artistRoyaltyMin: 45,
    artistRoyaltyDefault: 50,
    artistRoyaltyMax: 58,
    ancillary360CutPct: 0,
    description:
      'Co-equal partnership for established artists: shared master ownership, 50/50 profit split after recoupment, and amplified campaign funding.',
    clauses: [
      'Co-Owned Master Recordings (50/50 Undivided Interest)',
      'Balanced 45% – 58% Net Profit Split after recoupment',
      '+15% Boosted Label Marketing & Visual Budget Pool',
      'Zero ancillary cut on Live Touring or Merch',
    ],
  },
  major_360: {
    id: 'major_360',
    name: 'Global Superstar 360° All-Rights Deal',
    shortTag: 'Major 360° Deal',
    masterOwnershipLabel: 'Label Owns Masters + 15% Tour/Merch Participation',
    mastersOwnedByArtistDefault: false,
    advanceMultiplier: 1.65,
    budgetMultiplier: 1.6,
    artistRoyaltyMin: 24,
    artistRoyaltyDefault: 36,
    artistRoyaltyMax: 48,
    ancillary360CutPct: 15,
    description:
      'Maximum upfront cash advance (+65% larger) and massive global marketing/MV budgets, in exchange for master rights plus 15% of Merch & Tour net income.',
    clauses: [
      '+65% Mega Recoupable Cash Advance wired immediately',
      '+60% Maximum Global Marketing, Radio & MV Budget Pool',
      'Label participates in 15% of Net Merch & World Tour Revenue',
      'Full global priority across DSP playlists and international radio',
    ],
  },
};

export const RECORD_LABEL_PARTNERS: RecordLabelPartner[] = [
  // TIER 1: INDIE & BOUTIQUE
  {
    id: 'label_dirty_hit',
    name: 'Dirty Hit Records',
    shortMonogram: 'DH',
    parentGroup: 'Independent UK/US',
    tier: 1,
    tierLabel: 'Indie Boutique',
    headquarters: 'London / Los Angeles',
    foundedYear: 2009,
    logoDataUri: buildLabelLogoSvg('#2A0E17', '#F43F5E', 'DH', 'DIRTY HIT', 'vinyl'),
    brandPrimaryHex: '#2A0E17',
    brandAccentHex: '#F43F5E',
    prestigeScore: 68,
    minPopularity: 4,
    allowedDealTypes: ['licensing', 'exclusive_royalty', 'joint_venture'],
    preferredDealType: 'licensing',
    baseAdvancePerAlbum: 65000,
    baseMarketingBudgetPerAlbum: 45000,
    arQualityFloor: 62,
    radioLeverageBonus: 12,
    playlistPitchBonusPct: 15,
    globalDistributionReachPct: 72,
    bio: 'Cult-favorite independent label renowned for breaking alternative pop, bedroom pop, and indie icons with complete creative freedom.',
    signaturePerks: [
      'Artist-friendly licensing & master ownership terms',
      'Strong indie press & alternative playlist curation',
      'Accessible 62+ A&R Quality Floor requirement',
    ],
  },
  {
    id: 'label_sub_pop',
    name: 'Secretly & Sub Pop Group',
    shortMonogram: 'SP',
    parentGroup: 'Secretly Distribution',
    tier: 1,
    tierLabel: 'Indie Boutique',
    headquarters: 'Seattle / Bloomington',
    foundedYear: 1988,
    logoDataUri: buildLabelLogoSvg('#1F1909', '#F59E0B', 'SP', 'SUB POP', 'star'),
    brandPrimaryHex: '#1F1909',
    brandAccentHex: '#F59E0B',
    prestigeScore: 72,
    minPopularity: 8,
    allowedDealTypes: ['licensing', 'exclusive_royalty', 'joint_venture'],
    preferredDealType: 'licensing',
    baseAdvancePerAlbum: 95000,
    baseMarketingBudgetPerAlbum: 65000,
    arQualityFloor: 65,
    radioLeverageBonus: 15,
    playlistPitchBonusPct: 18,
    globalDistributionReachPct: 76,
    bio: 'Critically revered independent powerhouse that champions album-oriented artists, vinyl collector runs, and Pitchfork/Metacritic darlings.',
    signaturePerks: [
      'High critical prestige & vinyl retail reach',
      'Generous 68%+ licensing royalty splits',
      'Dedicated indie record store & college radio push',
    ],
  },
  {
    id: 'label_xl_recordings',
    name: 'XL Recordings',
    shortMonogram: 'XL',
    parentGroup: 'Beggars Group',
    tier: 1,
    tierLabel: 'Indie Boutique',
    headquarters: 'London / New York',
    foundedYear: 1989,
    logoDataUri: buildLabelLogoSvg('#0C1B2A', '#38BDF8', 'XL', 'LONDON • NY', 'diamond'),
    brandPrimaryHex: '#0C1B2A',
    brandAccentHex: '#38BDF8',
    prestigeScore: 82,
    minPopularity: 15,
    allowedDealTypes: ['licensing', 'exclusive_royalty', 'joint_venture'],
    preferredDealType: 'joint_venture',
    baseAdvancePerAlbum: 180000,
    baseMarketingBudgetPerAlbum: 115000,
    arQualityFloor: 68,
    radioLeverageBonus: 22,
    playlistPitchBonusPct: 24,
    globalDistributionReachPct: 84,
    bio: 'Legendary independent label capable of launching global diamond-certified albums while preserving complete artistic integrity.',
    signaturePerks: [
      'Global reach rivaling major labels with indie splits',
      '50/50 Joint Venture preferred structure',
      'Strong UK/Europe & North America crossover support',
    ],
  },

  // TIER 2: MID-MAJOR & PREMIER FLAGSHIP
  {
    id: 'label_qc_alamo',
    name: 'Quality Control / Alamo',
    shortMonogram: 'QC',
    parentGroup: 'HYBE America / Sony',
    tier: 2,
    tierLabel: 'Mid-Major',
    headquarters: 'Atlanta / New York',
    foundedYear: 2013,
    logoDataUri: buildLabelLogoSvg('#1A1128', '#A855F7', 'QC', 'QUALITY CTRL', 'crown'),
    brandPrimaryHex: '#1A1128',
    brandAccentHex: '#A855F7',
    prestigeScore: 84,
    minPopularity: 24,
    allowedDealTypes: ['exclusive_royalty', 'joint_venture', 'major_360'],
    preferredDealType: 'exclusive_royalty',
    baseAdvancePerAlbum: 420000,
    baseMarketingBudgetPerAlbum: 260000,
    arQualityFloor: 70,
    radioLeverageBonus: 35,
    playlistPitchBonusPct: 34,
    globalDistributionReachPct: 89,
    bio: 'Hit-making streaming juggernaut dominating hip-hop, R&B, and viral pop charts with aggressive DSP playlisting and street-to-arena marketing.',
    signaturePerks: [
      '$420K+ base advance per album cycle',
      'Aggressive Spotify/Apple flagship playlist pitching',
      'High-velocity viral MV & urban/pop radio blitz',
    ],
  },
  {
    id: 'label_bmg_concord',
    name: 'BMG / Loma Vista',
    shortMonogram: 'BMG',
    parentGroup: 'Bertelsmann / Concord',
    tier: 2,
    tierLabel: 'Mid-Major',
    headquarters: 'Berlin / Los Angeles',
    foundedYear: 2008,
    logoDataUri: buildLabelLogoSvg('#08201D', '#10B981', 'BMG', 'LOMA VISTA', 'wave'),
    brandPrimaryHex: '#08201D',
    brandAccentHex: '#10B981',
    prestigeScore: 86,
    minPopularity: 30,
    allowedDealTypes: ['licensing', 'exclusive_royalty', 'joint_venture'],
    preferredDealType: 'joint_venture',
    baseAdvancePerAlbum: 650000,
    baseMarketingBudgetPerAlbum: 380000,
    arQualityFloor: 72,
    radioLeverageBonus: 42,
    playlistPitchBonusPct: 38,
    globalDistributionReachPct: 92,
    bio: 'Modern artist-first mid-major offering major-scale advances and international sync/radio infrastructure without predatory 360 clauses.',
    signaturePerks: [
      'Supports Licensing & 50/50 JV at mid-major scale',
      '$650K+ base advance per album with transparent recoupment',
      'Strong European, US, and Asian physical/digital reach',
    ],
  },

  // TIER 3: GLOBAL MAJOR GIANTS
  {
    id: 'label_atlantic_wmg',
    name: 'Atlantic Records',
    shortMonogram: 'ATL',
    parentGroup: 'Warner Music Group (WMG)',
    tier: 3,
    tierLabel: 'Global Major',
    headquarters: 'New York / Los Angeles',
    foundedYear: 1947,
    logoDataUri: buildLabelLogoSvg('#230C0E', '#EF4444', 'ATL', 'WARNER MUSIC', 'vinyl'),
    brandPrimaryHex: '#230C0E',
    brandAccentHex: '#EF4444',
    prestigeScore: 93,
    minPopularity: 42,
    allowedDealTypes: ['exclusive_royalty', 'joint_venture', 'major_360'],
    preferredDealType: 'major_360',
    baseAdvancePerAlbum: 1600000,
    baseMarketingBudgetPerAlbum: 850000,
    arQualityFloor: 75,
    radioLeverageBonus: 65,
    playlistPitchBonusPct: 55,
    globalDistributionReachPct: 97,
    bio: 'Historic Warner Music flagship behind global stadium tours, blockbuster soundtrack eras, and multi-week Billboard Hot 100 #1 runs.',
    signaturePerks: [
      '$1.6M+ base advance per album ($2.6M+ on 360° deals)',
      '$850K+ per-album Label Marketing & MV Production Pool',
      'Massive global Top 40 radio & DSP editorial leverage',
    ],
  },
  {
    id: 'label_columbia_sony',
    name: 'Columbia Records',
    shortMonogram: 'COL',
    parentGroup: 'Sony Music Entertainment',
    tier: 3,
    tierLabel: 'Global Major',
    headquarters: 'New York / London',
    foundedYear: 1889,
    logoDataUri: buildLabelLogoSvg('#0D172A', '#60A5FA', 'COL', 'SONY MUSIC', 'globe'),
    brandPrimaryHex: '#0D172A',
    brandAccentHex: '#60A5FA',
    prestigeScore: 96,
    minPopularity: 50,
    allowedDealTypes: ['exclusive_royalty', 'joint_venture', 'major_360'],
    preferredDealType: 'exclusive_royalty',
    baseAdvancePerAlbum: 2400000,
    baseMarketingBudgetPerAlbum: 1200000,
    arQualityFloor: 78,
    radioLeverageBonus: 78,
    playlistPitchBonusPct: 64,
    globalDistributionReachPct: 99,
    bio: 'Premier Sony Music powerhouse home to Album of the Year GRAMMY winners, diamond vocalists, and worldwide cultural phenomena.',
    signaturePerks: [
      '$2.4M+ base advance per album cycle',
      '$1.2M+ per-album Label Marketing & Visual Budget',
      'Elite GRAMMY campaign & global radio power rotation',
    ],
  },
  {
    id: 'label_republic_umg',
    name: 'Republic Records',
    shortMonogram: 'REP',
    parentGroup: 'Universal Music Group (UMG)',
    tier: 3,
    tierLabel: 'Global Major',
    headquarters: 'New York / Santa Monica',
    foundedYear: 1995,
    logoDataUri: buildLabelLogoSvg('#1F1707', '#FBBF24', 'REP', 'UNIVERSAL', 'crown'),
    brandPrimaryHex: '#1F1707',
    brandAccentHex: '#FBBF24',
    prestigeScore: 99,
    minPopularity: 58,
    allowedDealTypes: ['exclusive_royalty', 'joint_venture', 'major_360'],
    preferredDealType: 'joint_venture',
    baseAdvancePerAlbum: 3800000,
    baseMarketingBudgetPerAlbum: 1850000,
    arQualityFloor: 80,
    radioLeverageBonus: 92,
    playlistPitchBonusPct: 75,
    globalDistributionReachPct: 100,
    bio: 'The undisputed #1 global chart empire under Universal Music Group, commanding unmatched streaming, radio, and retail dominance.',
    signaturePerks: [
      '$3.8M+ base advance per album (up to $15M+ multi-album deals)',
      '$1.85M+ per-album Label Marketing & Cinema MV Budget',
      'Maximum #1 Global DSP & Radio Airplay priority',
    ],
  },
];

export const IMPRINT_SCOUT_POOL: ImprintScoutCandidate[] = [
  {
    id: 'imp_art_1',
    name: 'Kaelen Vance',
    initials: 'KV',
    genre: 'Alternative R&B',
    country: 'US',
    popularity: 18,
    potential: 84,
    askingAdvance: 85000,
    recommendedImprintCutPct: 60,
    albumsCommitted: 2,
    bio: 'Late-night R&B vocalist with viral falsetto hooks and rapidly growing college streaming numbers.',
  },
  {
    id: 'imp_art_2',
    name: 'Nadia Solis',
    initials: 'NS',
    genre: 'Latin Pop',
    country: 'MX',
    popularity: 26,
    potential: 89,
    askingAdvance: 195000,
    recommendedImprintCutPct: 55,
    albumsCommitted: 2,
    bio: 'Bilingual pop starlet dominating LATAM and US Hispanic playlists with high-energy dance-pop singles.',
  },
  {
    id: 'imp_art_3',
    name: 'Juno & The Velvet',
    initials: 'JV',
    genre: 'Indie Pop',
    country: 'GB',
    popularity: 22,
    potential: 86,
    askingAdvance: 140000,
    recommendedImprintCutPct: 58,
    albumsCommitted: 2,
    bio: 'London synth-pop duo earning rave Pitchfork reviews and sold-out European theater dates.',
  },
  {
    id: 'imp_art_4',
    name: 'Tariq "Blaze" Sterling',
    initials: 'TS',
    genre: 'Hip-Hop / Melodic Rap',
    country: 'US',
    popularity: 35,
    potential: 92,
    askingAdvance: 420000,
    recommendedImprintCutPct: 50,
    albumsCommitted: 3,
    bio: 'Chart-climbing melodic rapper whose freestyles routinely debut in the Spotify US Top 25.',
  },
  {
    id: 'imp_art_5',
    name: 'Min-Seo (MINA)',
    initials: 'MS',
    genre: 'K-Pop / Global Pop',
    country: 'KR',
    popularity: 42,
    potential: 95,
    askingAdvance: 750000,
    recommendedImprintCutPct: 50,
    albumsCommitted: 3,
    bio: 'Solo K-Pop powerhouse with massive physical album pre-orders and global YouTube MV velocity.',
  },
  {
    id: 'imp_art_6',
    name: 'Soren Lind',
    initials: 'SL',
    genre: 'Electronic / Dance Pop',
    country: 'SE',
    popularity: 29,
    potential: 88,
    askingAdvance: 260000,
    recommendedImprintCutPct: 55,
    albumsCommitted: 2,
    bio: 'Scandinavian producer-vocalist crafting euphoric festival anthems across Europe and Australia.',
  },
];

const EDITORIAL_PLAYLIST_POOL = [
  "Today's Top Hits",
  'New Music Friday',
  'Pop Rising',
  'Global X',
  'Viral Hits',
  'RapCaviar',
  'Hot Hits USA',
  'Chill Hits',
];

export function getDefaultImprintLogoSvg(name: string): string {
  const initials = (name || 'SR')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return buildLabelLogoSvg('#1E160B', '#F59E0B', initials || 'SR', 'IMPRINT', 'crown');
}

export function getEnsuredRecordLabelState(state: GameState): RecordLabelSystemState {
  const raw = (state as any).recordLabelState;
  const defaultImprintName = `${state.artist?.name || 'Sovereign'} Records`;
  const defaultImprint: PlayerImprintState = {
    isFounded: false,
    imprintName: defaultImprintName,
    name: defaultImprintName,
    logoUrl: getDefaultImprintLogoSvg(defaultImprintName),
    foundedDate: '',
    headquarters: 'Los Angeles / London',
    distributionPartnerId: 'awal_orchard',
    distributionPartnerName: 'The Orchard / AWAL Global',
    distributorCutPct: 12,
    prestige: 15,
    valuation: 0,
    totalRevenueGenerated: 0,
    totalNetProfitEarned: 0,
    dailyImprintNetIncome: 0,
    signedRoster: [],
  };

  if (!raw || typeof raw !== 'object') {
    return {
      activeContract: null,
      pitches: {},
      completedContractsCount: 0,
      imprint: defaultImprint,
      statements: [],
    };
  }

  return {
    activeContract: raw.activeContract || null,
    pitches: raw.pitches && typeof raw.pitches === 'object' ? raw.pitches : {},
    completedContractsCount: Number(raw.completedContractsCount || 0),
    imprint: raw.imprint
      ? {
          ...defaultImprint,
          ...raw.imprint,
          name: raw.imprint.imprintName || raw.imprint.name || defaultImprintName,
          logoUrl: raw.imprint.logoUrl || getDefaultImprintLogoSvg(raw.imprint.imprintName || defaultImprintName),
        }
      : defaultImprint,
    statements: Array.isArray(raw.statements) ? raw.statements : [],
    lastProcessedDate: raw.lastProcessedDate,
  };
}

export function getRecordLabelById(labelId: string): RecordLabelPartner | undefined {
  return RECORD_LABEL_PARTNERS.find((l) => l.id === labelId);
}

/**
 * Step 1 of Signing to a Record Label:
 * Player submits an A&R Demo & EPK Pitch to a target Record Label.
 * The label takes 7 days (1 full week) to review the pitch before responding Next Week!
 */
export function submitRecordLabelPitch(
  state: GameState,
  labelId: string,
  demoSongId?: number
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  if (labelState.activeContract) {
    return {
      nextState: state,
      success: false,
      message: `You are already under contract with ${labelState.activeContract.labelName}.`,
    };
  }

  const label = getRecordLabelById(labelId);
  if (!label) {
    return { nextState: state, success: false, message: 'Record Label not found.' };
  }

  const existingPitch = labelState.pitches[labelId];
  if (existingPitch) {
    if (existingPitch.status === 'pending_review') {
      return {
        nextState: state,
        success: false,
        message: `Your A&R pitch to ${label.name} is already under review (${existingPitch.daysRemaining}d remaining until Next Week's decision).`,
      };
    }
    if (existingPitch.status === 'interested') {
      return {
        nextState: state,
        success: false,
        message: `${label.name} has already approved your pitch! Open their Official Contract Paper to negotiate and sign.`,
      };
    }
    if (existingPitch.status === 'declined' && (existingPitch.cooldownDaysLeft || 0) > 0) {
      return {
        nextState: state,
        success: false,
        message: `${label.name}'s A&R desk recently passed on your pitch. You may submit a new demo in ${existingPitch.cooldownDaysLeft} day(s).`,
      };
    }
  }

  const allSongs = state.songs || [];
  const demoSong =
    allSongs.find((s) => s.id === demoSongId) ||
    allSongs[allSongs.length - 1];

  const demoTitle = demoSong ? demoSong.title : `${state.artist?.name || 'Artist'} — Studio EPK Demo`;
  const demoQuality = demoSong ? demoSong.quality || 65 : 62;
  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];

  const newPitch: LabelPitchSubmission = {
    labelId: label.id,
    labelName: label.name,
    submittedDate: dateStr,
    demoSongId: demoSong?.id,
    demoSongTitle: demoTitle,
    demoSongQuality: demoQuality,
    daysRemaining: 7, // 1 Full Week A&R Board Review
    status: 'pending_review',
    arFeedback: `A&R Executive Board is reviewing "${demoTitle}" (Quality ${demoQuality}) and your streaming/market metrics. Decision arrives in 7 days (Next Week).`,
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_pitch_${Date.now()}_${label.id}`,
    date: dateStr,
    title: `Submitted A&R Demo Pitch to ${label.name}`,
    detail: `Submitted "${demoTitle}" (Q:${demoQuality}). Official A&R Board response scheduled for Next Week (7 days).`,
    amount: 0,
    direction: 'neutral',
    category: 'pitch',
  };

  return {
    nextState: {
      ...state,
      recordLabelState: {
        ...labelState,
        pitches: {
          ...labelState.pitches,
          [label.id]: newPitch,
        },
        statements: [stmt, ...labelState.statements].slice(0, 45),
      },
    },
    success: true,
    message: `Submitted "${demoTitle}" to ${label.name}'s A&R Board! You will receive their official decision Next Week (in 7 days).`,
  };
}

/**
 * Computes the target cash advance and marketing budget for a given label, deal type, and album quota.
 */
export function calculateDealFinancialTargets(
  label: RecordLabelPartner,
  dealType: RecordDealTypeId,
  albumQuota: number
): {
  minAdvance: number;
  targetAdvance: number;
  maxAdvance: number;
  marketingBudgetPool: number;
  singleQuota: number;
  royaltyMin: number;
  royaltyTarget: number;
  royaltyMax: number;
} {
  const structure = RECORD_DEAL_STRUCTURES[dealType];
  const quotaScale = Math.pow(Math.max(1, albumQuota), 0.92);
  const rawTargetAdvance =
    label.baseAdvancePerAlbum * quotaScale * structure.advanceMultiplier;

  const targetAdvance = Math.round(rawTargetAdvance / 5000) * 5000;
  const minAdvance = Math.round((targetAdvance * 0.65) / 5000) * 5000;
  const maxAdvance = Math.round((targetAdvance * 1.35) / 5000) * 5000;

  const marketingBudgetPool =
    Math.round(
      (label.baseMarketingBudgetPerAlbum * quotaScale * structure.budgetMultiplier) / 5000
    ) * 5000;

  const singleQuota = Math.max(2, albumQuota * 2);

  return {
    minAdvance,
    targetAdvance,
    maxAdvance,
    marketingBudgetPool,
    singleQuota,
    royaltyMin: structure.artistRoyaltyMin,
    royaltyTarget: structure.artistRoyaltyDefault,
    royaltyMax: structure.artistRoyaltyMax,
  };
}

/**
 * Evaluates a player's proposed Record Label Contract before signing.
 */
export function evaluateRecordContractProposal(
  state: GameState,
  proposal: RecordContractProposal
): {
  approvalChancePct: number;
  isAcceptable: boolean;
  boardReaction: string;
  managerBonusPct: number;
  marketingBudgetPool: number;
} {
  const label = getRecordLabelById(proposal.labelId);
  if (!label) {
    return {
      approvalChancePct: 0,
      isAcceptable: false,
      boardReaction: 'Label not found.',
      managerBonusPct: 0,
      marketingBudgetPool: 0,
    };
  }

  const targets = calculateDealFinancialTargets(
    label,
    proposal.dealType,
    proposal.albumQuota
  );

  const staffState = getEnsuredStaffState(state);
  const manager = staffState.roster.manager;
  const managerBonusPct = manager ? manager.tier * 5 + Math.round(manager.level * 0.8) : 0;

  const currentPop = Number(state.popularity) || 0;
  const popSurplusBonus = Math.max(
    0,
    Math.min(18, Math.round((currentPop - label.minPopularity) * 0.45))
  );

  if (
    proposal.offeredAdvance > targets.maxAdvance * 1.05 ||
    proposal.artistRoyaltyPct > targets.royaltyMax
  ) {
    return {
      approvalChancePct: 0,
      isAcceptable: false,
      boardReaction: `"Our Business Affairs department cannot approve an advance above $${targets.maxAdvance.toLocaleString()} or a royalty split exceeding ${targets.royaltyMax}% under a ${RECORD_DEAL_STRUCTURES[proposal.dealType].shortTag}."`,
      managerBonusPct,
      marketingBudgetPool: targets.marketingBudgetPool,
    };
  }

  const advanceRatio =
    (proposal.offeredAdvance - targets.targetAdvance) /
    Math.max(1, targets.maxAdvance - targets.targetAdvance);
  const advanceScoreShift = Math.round(-advanceRatio * 28);

  const royaltyDiff = proposal.artistRoyaltyPct - targets.royaltyTarget;
  const royaltyScoreShift = Math.round(-royaltyDiff * 2.4);

  const preferredDealBonus = proposal.dealType === label.preferredDealType ? 8 : 0;

  const rawApproval =
    78 +
    advanceScoreShift +
    royaltyScoreShift +
    preferredDealBonus +
    managerBonusPct +
    popSurplusBonus;

  const approvalChancePct = Math.max(15, Math.min(100, rawApproval));

  let boardReaction = `"These clauses are fair and balanced for both ${label.name} and your artistic career. Our President of A&R is ready to countersign."`;
  if (approvalChancePct >= 88) {
    boardReaction = `"Our Executive Board enthusiastically approves this contract draft. We are prepared to wire your $${proposal.offeredAdvance.toLocaleString()} advance immediately upon signature."`;
  } else if (approvalChancePct < 55) {
    boardReaction = `"Your requested advance and royalty points push the upper limits of our A&R valuation. There is a risk the Board rejects this draft."`;
  }

  return {
    approvalChancePct,
    isAcceptable: true,
    boardReaction,
    managerBonusPct,
    marketingBudgetPool: targets.marketingBudgetPool,
  };
}

/**
 * Executes and signs a Record Label Deal for the player artist (requires an approved A&R Pitch).
 */
export function signArtistRecordDeal(
  state: GameState,
  proposal: RecordContractProposal
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  if (labelState.activeContract) {
    return {
      nextState: state,
      success: false,
      message: `You are already signed to ${labelState.activeContract.labelName}. Complete your quota or execute a Contract Buyout first.`,
    };
  }

  const label = getRecordLabelById(proposal.labelId);
  if (!label) {
    return { nextState: state, success: false, message: 'Selected Record Label not found.' };
  }

  const pitch = labelState.pitches[label.id];
  if (!pitch || pitch.status !== 'interested') {
    return {
      nextState: state,
      success: false,
      message: `You must first submit an A&R Demo Pitch to ${label.name} and receive an Official Offer Letter before executing a contract.`,
    };
  }

  const evalRes = evaluateRecordContractProposal(state, proposal);
  if (!evalRes.isAcceptable) {
    return { nextState: state, success: false, message: evalRes.boardReaction };
  }

  const roll = Math.random() * 100;
  if (roll > evalRes.approvalChancePct) {
    return {
      nextState: state,
      success: false,
      message: `${label.name}'s Business Affairs Board declined your counter-offer (${evalRes.approvalChancePct}% approval odds). Adjust your advance or royalty split slightly and re-sign.`,
    };
  }

  const structure = RECORD_DEAL_STRUCTURES[proposal.dealType];
  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];

  const existingReleasedSongIds = (state.songs || [])
    .filter((s) => s.status === 'released')
    .map((s) => s.id);
  const existingReleasedProjectIds = (state.projects || [])
    .filter((p) => p.status === 'released')
    .map((p) => p.id);

  const masterBuybackPrice = Math.round(proposal.offeredAdvance * 1.45);

  const newContract: ActiveArtistLabelContract = {
    contractRef: `LBL-${label.shortMonogram}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    labelId: label.id,
    labelName: label.name,
    parentGroup: label.parentGroup,
    tier: label.tier,
    dealType: proposal.dealType,
    dealTypeName: structure.name,
    signedDate: dateStr,
    totalAdvanceReceived: proposal.offeredAdvance,
    unrecoupedBalance: proposal.offeredAdvance,
    totalRoyaltiesRecouped: 0,
    netRoyaltiesPaidToArtist: 0,
    total360AncillaryCutPaid: 0,
    artistRoyaltyPct: proposal.artistRoyaltyPct,
    ancillary360CutPct: structure.ancillary360CutPct,
    mastersOwnedByArtist: structure.mastersOwnedByArtistDefault,
    masterBuybackPrice,
    albumQuotaTotal: proposal.albumQuota,
    albumsDelivered: 0,
    singleQuotaTotal: proposal.singleQuota,
    singlesDelivered: 0,
    arQualityFloor: label.arQualityFloor,
    arTrustScore: 80,
    availableMarketingBudget: evalRes.marketingBudgetPool,
    totalMarketingBudgetGranted: evalRes.marketingBudgetPool,
    countedSongIds: existingReleasedSongIds,
    countedProjectIds: existingReleasedProjectIds,
  };

  const nextPitches = { ...labelState.pitches };
  delete nextPitches[label.id];

  const statementEntry: LabelAccountingStatementItem = {
    id: `stmt_adv_${Date.now()}`,
    date: dateStr,
    title: `Executed ${structure.shortTag} with ${label.name}`,
    detail: `Wired $${proposal.offeredAdvance.toLocaleString()} recoupable cash advance + unlocked $${evalRes.marketingBudgetPool.toLocaleString()} Label Marketing & MV Budget Pool (${proposal.albumQuota} Album / ${proposal.singleQuota} Single Quota).`,
    amount: proposal.offeredAdvance,
    direction: 'credit',
    category: 'advance',
  };

  const nextState: GameState = {
    ...state,
    money: Math.round((Number(state.money) || 0) + proposal.offeredAdvance),
    hype: Math.min(100, Number(((state.hype || 15) + label.tier * 3.5).toFixed(1))),
    recordLabelState: {
      ...labelState,
      activeContract: newContract,
      pitches: nextPitches,
      statements: [statementEntry, ...labelState.statements].slice(0, 45),
    },
  };

  return {
    nextState,
    success: true,
    message: `Executed official contract with ${label.name}! $${proposal.offeredAdvance.toLocaleString()} advance wired to your treasury.`,
  };
}

/**
 * Requisitions funds from the signed Record Label's Marketing & MV Budget Pool.
 */
export function requisitionLabelMarketingGrant(
  state: GameState,
  grantType: 'mv_production' | 'radio_playlist_blitz' | 'studio_ar_session',
  targetSongId?: number
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const contract = labelState.activeContract;
  if (!contract) {
    return {
      nextState: state,
      success: false,
      message: 'You must be signed to a Record Label to requisition label marketing budgets.',
    };
  }

  const label = getRecordLabelById(contract.labelId);
  const allSongs = state.songs || [];
  const releasedSongs = allSongs.filter((s) => s.status === 'released');
  const chosenSong: Song | undefined =
    allSongs.find((s) => s.id === targetSongId) ||
    releasedSongs[releasedSongs.length - 1] ||
    allSongs[allSongs.length - 1];

  if (!chosenSong) {
    return {
      nextState: state,
      success: false,
      message: 'Write, record, or release at least one song first to allocate label campaign funds.',
    };
  }

  const grantCost =
    grantType === 'mv_production'
      ? Math.min(contract.availableMarketingBudget, Math.max(25000, contract.tier * 45000))
      : grantType === 'radio_playlist_blitz'
      ? Math.min(contract.availableMarketingBudget, Math.max(20000, contract.tier * 35000))
      : Math.min(contract.availableMarketingBudget, Math.max(15000, contract.tier * 25000));

  if (contract.availableMarketingBudget < 15000) {
    return {
      nextState: state,
      success: false,
      message: `Your Label Marketing Budget Pool ($${contract.availableMarketingBudget.toLocaleString()}) is depleted. Deliver a new album or high-performing single to unlock an A&R budget top-up.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];
  let nextSongs = [...allSongs];
  let nextHype = Number(state.hype) || 15;
  let summaryText = '';

  if (grantType === 'mv_production') {
    const addedMvDays = 6 + contract.tier * 4;
    const momentumGain = 6 + contract.tier * 4;
    nextSongs = nextSongs.map((s) => {
      if (s.id !== chosenSong.id) return s;
      return {
        ...s,
        hasMV: true,
        hasVisualizer: true,
        mvDistributor: 'vevo',
        mvAdsDays: (s.mvAdsDays || 0) + addedMvDays,
        momentum: Math.min(100, (s.momentum || 50) + momentumGain),
      };
    });
    summaryText = `${contract.labelName} funded an official VEVO Music Video & ${addedMvDays}-day visual campaign for "${chosenSong.title}" ($${grantCost.toLocaleString()} label grant).`;
  } else if (grantType === 'radio_playlist_blitz') {
    const radioSpinsAdd = 150 + (label?.radioLeverageBonus || 30) * 6;
    const currentPlacements = Array.isArray(chosenSong.playlistPlacements)
      ? [...chosenSong.playlistPlacements]
      : [];
    const available = EDITORIAL_PLAYLIST_POOL.filter((p) => !currentPlacements.includes(p));
    const addedPlaylist =
      available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;

    nextSongs = nextSongs.map((s) => {
      if (s.id !== chosenSong.id) return s;
      return {
        ...s,
        playlistPlacements:
          addedPlaylist && s.status === 'released'
            ? [...(s.playlistPlacements || []), addedPlaylist]
            : s.playlistPlacements,
        radioPlays: (s.radioPlays || 0) + radioSpinsAdd,
        dailyRadioPlays: (s.dailyRadioPlays || 0) + Math.round(radioSpinsAdd * 0.35),
        weeklyRadioPlays: (s.weeklyRadioPlays || 0) + radioSpinsAdd,
      };
    });
    nextHype = Math.min(100, Number((nextHype + 4 + contract.tier * 2).toFixed(1)));
    summaryText = addedPlaylist
      ? `${contract.labelName} placed "${chosenSong.title}" on "${addedPlaylist}" and funded +${radioSpinsAdd} national radio spins ($${grantCost.toLocaleString()} label grant).`
      : `${contract.labelName} funded a national radio & DSP campaign for "${chosenSong.title}" (+${radioSpinsAdd} radio spins).`;
  } else {
    const qualityAdd = 4 + contract.tier * 3;
    const potentialAdd = 4 + contract.tier * 2;
    nextSongs = nextSongs.map((s) => {
      if (s.id !== chosenSong.id) return s;
      return {
        ...s,
        quality: Math.min(100, (s.quality || 60) + qualityAdd),
        basePotential: Math.min(100, (s.basePotential || 60) + potentialAdd),
      };
    });
    summaryText = `${contract.labelName} booked flagship studio A&R producers for "${chosenSong.title}" (+${qualityAdd} Quality, +${potentialAdd} Base Potential).`;
  }

  const updatedContract: ActiveArtistLabelContract = {
    ...contract,
    availableMarketingBudget: Math.max(0, contract.availableMarketingBudget - grantCost),
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_grant_${Date.now()}`,
    date: dateStr,
    title: `Label Budget Disbursed — ${
      grantType === 'mv_production'
        ? 'VEVO MV Production'
        : grantType === 'radio_playlist_blitz'
        ? 'Global Radio & DSP Push'
        : 'Flagship Studio A&R Session'
    }`,
    detail: summaryText,
    amount: grantCost,
    direction: 'neutral',
    category: 'budget_grant',
  };

  return {
    nextState: {
      ...state,
      hype: nextHype,
      songs: nextSongs,
      recordLabelState: {
        ...labelState,
        activeContract: updatedContract,
        statements: [stmt, ...labelState.statements].slice(0, 45),
      },
    },
    success: true,
    message: summaryText,
  };
}

/**
 * Purchases 100% Master Copyright Ownership back from the Record Label.
 */
export function buyBackMasterCatalogRights(
  state: GameState
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const contract = labelState.activeContract;
  if (!contract) {
    return { nextState: state, success: false, message: 'No active record contract found.' };
  }
  if (contract.mastersOwnedByArtist) {
    return {
      nextState: state,
      success: false,
      message: 'You already hold 100% ownership of your Master Catalog!',
    };
  }
  if (contract.arTrustScore < 65 && contract.unrecoupedBalance > 0) {
    return {
      nextState: state,
      success: false,
      message: `Requires at least 65% A&R Trust (currently ${contract.arTrustScore}%) or a fully recouped advance to exercise your Master Buyback clause.`,
    };
  }

  const currentMoney = Math.round(Number(state.money) || 0);
  const buybackCost = contract.masterBuybackPrice;
  if (currentMoney < buybackCost) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient funds for the $${buybackCost.toLocaleString()} Master Catalog Buyback settlement.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];
  const boostedRoyalty = Math.min(82, contract.artistRoyaltyPct + 18);

  const updatedContract: ActiveArtistLabelContract = {
    ...contract,
    mastersOwnedByArtist: true,
    artistRoyaltyPct: boostedRoyalty,
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_buyback_${Date.now()}`,
    date: dateStr,
    title: `Acquired 100% Master Catalog Ownership from ${contract.labelName}`,
    detail: `Paid $${buybackCost.toLocaleString()} master reversion settlement. Artist royalty rate increased to ${boostedRoyalty}%.`,
    amount: buybackCost,
    direction: 'debit',
    category: 'buyback',
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - buybackCost,
      recordLabelState: {
        ...labelState,
        activeContract: updatedContract,
        statements: [stmt, ...labelState.statements].slice(0, 45),
      },
    },
    success: true,
    message: `Congratulations! You now own 100% of your Master Recordings, and your royalty share rose to ${boostedRoyalty}%!`,
  };
}

/**
 * Executes an Early Contract Buyout (or completes a fulfilled contract) so the player can go independent or switch labels.
 */
export function buyoutOrCompleteRecordContract(
  state: GameState
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const contract = labelState.activeContract;
  if (!contract) {
    return { nextState: state, success: false, message: 'You have no active record contract.' };
  }

  const isQuotaFulfilled =
    contract.albumsDelivered >= contract.albumQuotaTotal &&
    contract.singlesDelivered >= contract.singleQuotaTotal;

  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];

  if (isQuotaFulfilled) {
    const stmt: LabelAccountingStatementItem = {
      id: `stmt_complete_${Date.now()}`,
      date: dateStr,
      title: `Completed Record Contract with ${contract.labelName}`,
      detail: `Fulfilled all delivery obligations (${contract.albumsDelivered}/${contract.albumQuotaTotal} Albums, ${contract.singlesDelivered}/${contract.singleQuotaTotal} Singles). You are now a free agent.`,
      amount: 0,
      direction: 'neutral',
      category: 'quota',
    };

    return {
      nextState: {
        ...state,
        recordLabelState: {
          ...labelState,
          activeContract: null,
          completedContractsCount: (labelState.completedContractsCount || 0) + 1,
          statements: [stmt, ...labelState.statements].slice(0, 45),
        },
      },
      success: true,
      message: `You have officially completed your contract with ${contract.labelName} and are now an Independent Free Agent!`,
    };
  }

  const buyoutFee = Math.round(
    contract.unrecoupedBalance + contract.totalAdvanceReceived * 0.25
  );
  const currentMoney = Math.round(Number(state.money) || 0);

  if (currentMoney < buyoutFee) {
    return {
      nextState: state,
      success: false,
      message: `Early Contract Buyout requires $${buyoutFee.toLocaleString()} (unrecouped balance + 25% release settlement).`,
    };
  }

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_buyout_${Date.now()}`,
    date: dateStr,
    title: `Executed Early Contract Buyout from ${contract.labelName}`,
    detail: `Settled $${buyoutFee.toLocaleString()} to buy out remaining obligations and return to Independent status.`,
    amount: buyoutFee,
    direction: 'debit',
    category: 'buyback',
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - buyoutFee,
      recordLabelState: {
        ...labelState,
        activeContract: null,
        statements: [stmt, ...labelState.statements].slice(0, 45),
      },
    },
    success: true,
    message: `Paid $${buyoutFee.toLocaleString()} to buy out your contract with ${contract.labelName}. You are now Independent!`,
  };
}

/**
 * Launches the player's own Record Label Imprint (with custom uploaded logo support!).
 */
export function foundPlayerRecordImprint(
  state: GameState,
  imprintName: string,
  headquarters: string,
  distributionPartnerId: 'indie_direct' | 'awal_orchard' | 'major_umg_jv',
  customLogoUrl?: string,
  capitalInvestment: number = MIN_RECORD_LABEL_CAPITAL_INVESTMENT
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  if (labelState.imprint.isFounded) {
    return { nextState: state, success: false, message: 'Your Record Label Imprint is already founded.' };
  }

  const effectiveCapital = Math.max(
    MIN_RECORD_LABEL_CAPITAL_INVESTMENT,
    Math.round(Number(capitalInvestment) || MIN_RECORD_LABEL_CAPITAL_INVESTMENT)
  );

  const eligibility = evaluateRecordLabelFoundingEligibility(state, effectiveCapital);
  if (!eligibility.allRequirementsMet) {
    const missing = eligibility.requirements
      .filter((r) => !r.met)
      .map((r) => `${r.label} (${r.targetText})`);
    return {
      nextState: state,
      success: false,
      message: `Cannot incorporate Record Label yet. Missing requirements: ${missing.join(' • ')}`,
    };
  }

  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < effectiveCapital) {
    return {
      nextState: state,
      success: false,
      message: `Launching your Record Label Imprint requires at least $${effectiveCapital.toLocaleString()} in startup capital investment.`,
    };
  }

  const partnerMap = {
    indie_direct: { name: 'Independent Direct Distribution', cut: 6, prestige: 18 },
    awal_orchard: { name: 'The Orchard / AWAL Global Partner', cut: 12, prestige: 32 },
    major_umg_jv: { name: 'Universal / Republic Global JV Distribution', cut: 18, prestige: 50 },
  };
  const chosenPartner = partnerMap[distributionPartnerId];
  const capitalBonusPrestige =
    effectiveCapital >= 250_000_000 ? 30 : effectiveCapital >= 150_000_000 ? 15 : 0;
  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];
  const cleanName = imprintName.trim() || `${state.artist?.name || 'Sovereign'} Records`;

  const updatedImprint: PlayerImprintState = {
    ...labelState.imprint,
    isFounded: true,
    imprintName: cleanName,
    logoUrl: customLogoUrl || getDefaultImprintLogoSvg(cleanName),
    foundedDate: dateStr,
    headquarters: headquarters || 'Los Angeles / London',
    distributionPartnerId,
    distributionPartnerName: chosenPartner.name,
    distributorCutPct: chosenPartner.cut,
    prestige: Math.min(100, chosenPartner.prestige + capitalBonusPrestige),
    valuation: effectiveCapital * 2,
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_imp_found_${Date.now()}`,
    date: dateStr,
    title: `Founded Record Label Imprint: ${cleanName}`,
    detail: `Incorporated in ${updatedImprint.headquarters} via ${chosenPartner.name} ($${effectiveCapital.toLocaleString()} capital investment).`,
    amount: effectiveCapital,
    direction: 'debit',
    category: 'imprint',
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - effectiveCapital,
      recordLabelState: {
        ...labelState,
        imprint: updatedImprint,
        statements: [stmt, ...labelState.statements].slice(0, 45),
      },
    },
    success: true,
    message: `Founded ${cleanName} with $${effectiveCapital.toLocaleString()} capital! You can now sign artists, manage staff payroll, and collect daily master royalties.`,
  };
}

/**
 * Updates the custom uploaded logo of the player's Record Label Imprint at any time,
 * and automatically syncs it to the Official Record Label YouTube Channel (Avatar & Banner)
 * and Official Record Label X Account (Avatar & Posts).
 */
export function updatePlayerImprintLogo(
  state: GameState,
  newLogoDataUrl: string
): GameState {
  const labelState = getEnsuredRecordLabelState(state);
  const existingYt = (labelState.imprint as any).youtubeChannel;
  const existingX = (labelState.imprint as any).xAccount;

  const updatedYt = existingYt
    ? {
        ...existingYt,
        avatarUrl: newLogoDataUrl,
        bannerUrl: newLogoDataUrl,
      }
    : undefined;

  const updatedX = existingX
    ? {
        ...existingX,
        avatarUrl: newLogoDataUrl,
        posts: Array.isArray(existingX.posts)
          ? existingX.posts.map((p: any) => ({ ...p, authorAvatar: newLogoDataUrl }))
          : [],
      }
    : undefined;

  const labelHandleLower = String(existingX?.handle || '').toLowerCase();
  const updatedGlobalXPosts = Array.isArray(state.xPosts)
    ? state.xPosts.map((p) => {
        const isLabelPost =
          String(p.id || '').startsWith('lbl_x_') ||
          p.verifiedType === 'gold' ||
          (labelHandleLower &&
            String(p.authorHandle || '').toLowerCase() === labelHandleLower);
        return isLabelPost ? { ...p, authorAvatar: newLogoDataUrl } : p;
      })
    : state.xPosts;

  return {
    ...state,
    xPosts: updatedGlobalXPosts,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        logoUrl: newLogoDataUrl,
        ...(updatedYt ? { youtubeChannel: updatedYt } : {}),
        ...(updatedX ? { xAccount: updatedX } : {}),
      } as any,
    },
  };
}

/**
 * Signs an artist from the Scouting Pool to the player's own Record Label Imprint.
 */
export function signArtistToPlayerImprint(
  state: GameState,
  candidateId: string,
  imprintRoyaltyCutPct: number,
  customAdvanceOffer?: number,
  customAlbumQuota?: number
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  if (!labelState.imprint.isFounded) {
    return {
      nextState: state,
      success: false,
      message: 'Found your Record Label Imprint first before signing roster artists.',
    };
  }

  const candidate = IMPRINT_SCOUT_POOL.find((c) => c.id === candidateId);
  if (!candidate) {
    return { nextState: state, success: false, message: 'Scouted artist not found.' };
  }

  if (labelState.imprint.signedRoster.some((a) => a.id === candidate.id)) {
    return { nextState: state, success: false, message: `${candidate.name} is already signed to your Imprint.` };
  }

  const advanceToWire = customAdvanceOffer ?? candidate.askingAdvance;
  const albumsCommitted = customAlbumQuota ?? candidate.albumsCommitted;

  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < advanceToWire) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient funds to wire ${candidate.name}'s $${advanceToWire.toLocaleString()} signing advance.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];

  const newSignedArtist: ImprintSignedArtist = {
    id: candidate.id,
    name: candidate.name,
    stageName: candidate.name,
    initials: candidate.initials,
    genre: candidate.genre,
    country: candidate.country,
    popularity: candidate.popularity,
    hype: 45,
    potential: candidate.potential,
    signedDate: dateStr,
    advancePaid: advanceToWire,
    unrecoupedAdvance: advanceToWire,
    imprintRoyaltyCutPct: Math.max(35, Math.min(75, imprintRoyaltyCutPct)),
    albumsCommitted,
    albumsReleased: 0,
    singlesCommitted: Math.max(2, albumsCommitted * 2),
    singlesReleased: 0,
    daysUntilNextRelease: 24,
    totalStreamsGenerated: 0,
    dailyStreams: 0,
    monthlyListeners: 0,
    totalGrossGenerated: 0,
    totalNetProfitForImprint: 0,
    latestReleaseTitle: 'No Releases Yet',
    latestReleaseQuality: 0,
    songs: [],
    projects: [],
  };

  const nextRoster = [...labelState.imprint.signedRoster, newSignedArtist];
  const updatedImprint: PlayerImprintState = {
    ...labelState.imprint,
    signedRoster: nextRoster,
    prestige: Math.min(100, labelState.imprint.prestige + 6),
    valuation: labelState.imprint.valuation + candidate.askingAdvance * 2.5,
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_imp_sign_${Date.now()}`,
    date: dateStr,
    title: `${labelState.imprint.imprintName} Signed ${candidate.name}`,
    detail: `Wired $${candidate.askingAdvance.toLocaleString()} advance (${newSignedArtist.imprintRoyaltyCutPct}% Imprint Master Share, ${candidate.albumsCommitted}-Album Deal).`,
    amount: candidate.askingAdvance,
    direction: 'debit',
    category: 'imprint',
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - candidate.askingAdvance,
      recordLabelState: {
        ...labelState,
        imprint: updatedImprint,
        statements: [stmt, ...labelState.statements].slice(0, 45),
      },
    },
    success: true,
    message: `Signed ${candidate.name} to ${labelState.imprint.imprintName}! Their catalog is now generating daily streams and royalties for your label.`,
  };
}

/**
 * Invests marketing & studio funds into a signed Imprint Artist.
 */
export function fundImprintArtistCampaign(
  state: GameState,
  artistId: string
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Signed artist not found on your roster.' };
  }

  if (
    target.isFormerRoster ||
    target.contractExpired ||
    (typeof target.daysRemaining === 'number' && target.daysRemaining <= 0)
  ) {
    return {
      nextState: state,
      success: false,
      message: `${target.stageName || target.name}'s recording contract has expired. Renew their contract first before funding new campaigns.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];
  const cooldownLeft = Number(target.promoCooldownDaysLeft || 0);
  if (cooldownLeft > 0 || target.lastPromoCampaignDate === dateStr) {
    return {
      nextState: state,
      success: false,
      message: `${target.stageName || target.name} already has an active promotional push running (${Math.max(1, cooldownLeft)}d cooldown remaining).`,
    };
  }

  const campaignCost = Math.round(25000 + target.popularity * 850);
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < campaignCost) {
    return {
      nextState: state,
      success: false,
      message: `Need $${campaignCost.toLocaleString()} to fund a global A&R & playlisting push for ${target.name}.`,
    };
  }

  const updatedRoster = labelState.imprint.signedRoster.map((art) => {
    if (art.id !== artistId) return art;
    const newPop = Math.min(98, Number((art.popularity + 1.5).toFixed(1)));
    const newHype = Math.min(100, Number((art.hype + 10).toFixed(1)));
    // Realistic bounded stream lift based on popularity (never compounds to 500M)
    const streamBoost = Math.min(
      55000,
      Math.round((art.popularity || 25) * 420 + 4500)
    );
    const maxRealisticArtistDaily = Math.round(
      85000 + Math.pow(Math.max(5, newPop), 2.25) * 320
    );
    const nextDailyStreams = Math.min(
      maxRealisticArtistDaily,
      (art.dailyStreams || 5000) + streamBoost
    );

    const updatedSongs = (art.songs || []).map((s, idx) => {
      if (s.status !== 'released' || idx > 0) return s;
      const trackBoost = Math.min(35000, streamBoost);
      return {
        ...s,
        dailyStreams: Math.min(maxRealisticArtistDaily, (s.dailyStreams || 2500) + trackBoost),
        streams: (s.streams || 0) + trackBoost,
        weeklyStreams: (s.weeklyStreams || 0) + trackBoost,
        radioPlays: (s.radioPlays || 0) + 120,
        dailyRadioPlays: (s.dailyRadioPlays || 0) + 120,
      };
    });

    return {
      ...art,
      popularity: newPop,
      hype: newHype,
      dailyStreams: nextDailyStreams,
      promoCooldownDaysLeft: 7,
      lastPromoCampaignDate: dateStr,
      songs: updatedSongs,
    };
  });

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_imp_promo_${Date.now()}`,
    date: dateStr,
    title: `Imprint Promo Push for ${target.name}`,
    detail: `Invested $${campaignCost.toLocaleString()} in playlisting & radio promo (+1.5% Popularity, +10% Hype, 7-day campaign active).`,
    amount: campaignCost,
    direction: 'debit',
    category: 'imprint',
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - campaignCost,
      recordLabelState: {
        ...labelState,
        imprint: {
          ...labelState.imprint,
          signedRoster: updatedRoster,
          valuation: labelState.imprint.valuation + campaignCost * 1.4,
        },
        statements: [stmt, ...labelState.statements].slice(0, 45),
      },
    },
    success: true,
    message: `Funded 7-day global promo campaign for ${target.name}! (+1.5% Popularity, +10% Hype & radio/playlist boost).`,
  };
}

/**
 * Runs every in-game day during the main daily tick in useGame.ts.
 * 0. Advances 7-day A&R Demo Pitch countdowns so labels respond Next Week with Interested or Declined!
 * 1. Detects newly released player songs & projects to credit Label Quotas & evaluate A&R Quality Floor.
 * 2. Processes Record Label Royalty Split & Advance Recoupment on player's daily revenue.
 * 3. Processes 360° Deal ancillary cut if signed to a 360 deal.
 * 4. Simulates the player's own Imprint roster daily streams, releases, advance recoupment, and net label profit.
 */
export function processDailyRecordLabelStep(state: GameState, currentDate: Date): void {
  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = currentDate.toISOString().split('T')[0];
  const isMonday = currentDate.getDay() === 1;

  // --- PART 0: PROCESS 7-DAY A&R DEMO PITCH REVIEWS ---
  const pitchKeys = Object.keys(labelState.pitches || {});
  const staffState = getEnsuredStaffState(state);
  const manager = staffState.roster.manager;
  const managerPitchBonus = manager ? manager.tier * 8 + manager.level * 1.2 : 0;

  for (const labelId of pitchKeys) {
    const pitch = labelState.pitches[labelId];
    if (!pitch) continue;

    if (pitch.status === 'pending_review') {
      pitch.daysRemaining = Math.max(0, (pitch.daysRemaining || 7) - 1);
      if (pitch.daysRemaining === 0) {
        const label = getRecordLabelById(labelId);
        if (!label) continue;

        const currentPop = Number(state.popularity) || 0;
        const currentHype = Number(state.hype) || 15;
        const popGap = currentPop - label.minPopularity;
        const qualityGap = pitch.demoSongQuality - label.arQualityFloor;

        // Calculate A&R Interest Score
        const interestScore =
          62 +
          popGap * 1.6 +
          qualityGap * 1.4 +
          currentHype * 0.22 +
          managerPitchBonus;

        const isInterested = popGap >= -4 && Math.random() * 100 <= Math.min(96, Math.max(18, interestScore));

        if (isInterested) {
          pitch.status = 'interested';
          pitch.offerExpiresDaysLeft = 21;
          pitch.arFeedback = `"We reviewed '${pitch.demoSongTitle}' at our weekly A&R board meeting and are impressed by your trajectory. We have prepared an Official Recording Contract for your signature."`;
          labelState.statements.unshift({
            id: `stmt_pitch_win_${Date.now()}_${label.id}`,
            date: dateStr,
            title: `A&R Offer Letter Received from ${label.name}!`,
            detail: `${label.name} approved your demo pitch ("${pitch.demoSongTitle}") and invited you to sign an Official Recording Contract (Offer valid for 21 days).`,
            amount: 0,
            direction: 'credit',
            category: 'pitch',
          });
        } else {
          pitch.status = 'declined';
          pitch.cooldownDaysLeft = 14;
          pitch.arFeedback =
            popGap < 0
              ? `"Thank you for submitting '${pitch.demoSongTitle}'. While promising, our roster requires at least ${label.minPopularity}% Artist Popularity. Let's reconnect once your audience grows."`
              : `"Our A&R board listened closely to '${pitch.demoSongTitle}' (Quality ${pitch.demoSongQuality}), but we are looking for a higher sonic benchmark (Q:${label.arQualityFloor}+) for this cycle."`;
          labelState.statements.unshift({
            id: `stmt_pitch_pass_${Date.now()}_${label.id}`,
            date: dateStr,
            title: `A&R Board Decision from ${label.name}: Passed`,
            detail: `${label.name} passed on "${pitch.demoSongTitle}" for now. You may re-pitch in 14 days.`,
            amount: 0,
            direction: 'neutral',
            category: 'pitch',
          });
        }
      }
    } else if (pitch.status === 'interested' && pitch.offerExpiresDaysLeft !== undefined) {
      pitch.offerExpiresDaysLeft = Math.max(0, pitch.offerExpiresDaysLeft - 1);
      if (pitch.offerExpiresDaysLeft === 0) {
        delete labelState.pitches[labelId];
      }
    } else if (pitch.status === 'declined' && pitch.cooldownDaysLeft !== undefined) {
      pitch.cooldownDaysLeft = Math.max(0, pitch.cooldownDaysLeft - 1);
      if (pitch.cooldownDaysLeft === 0) {
        delete labelState.pitches[labelId];
      }
    }
  }

  // --- PART 1: PLAYER'S ACTIVE RECORD LABEL CONTRACT ---
  const contract = labelState.activeContract;
  if (contract) {
    if (!Array.isArray(contract.countedSongIds)) contract.countedSongIds = [];
    if (!Array.isArray(contract.countedProjectIds)) contract.countedProjectIds = [];

    // A. Check for newly released player Singles
    const releasedSongs = (state.songs || []).filter((s) => s.status === 'released');
    for (const song of releasedSongs) {
      if (!contract.countedSongIds.includes(song.id)) {
        contract.countedSongIds.push(song.id);
        contract.singlesDelivered += 1;

        const qualityDiff = (song.quality || 65) - contract.arQualityFloor;
        const trustDelta = qualityDiff >= 5 ? 6 : qualityDiff >= 0 ? 3 : -5;
        contract.arTrustScore = Math.max(10, Math.min(100, contract.arTrustScore + trustDelta));

        const bonusGrant = qualityDiff >= 0 ? contract.tier * 20000 : 0;
        if (bonusGrant > 0) {
          contract.availableMarketingBudget += bonusGrant;
          contract.totalMarketingBudgetGranted += bonusGrant;
        }

        labelState.statements.unshift({
          id: `stmt_quota_s_${Date.now()}_${song.id}`,
          date: dateStr,
          title: `Delivered Single "${song.title}" to ${contract.labelName}`,
          detail: `Single Quota: ${contract.singlesDelivered}/${contract.singleQuotaTotal} • Quality ${song.quality} vs Floor ${contract.arQualityFloor} (${trustDelta >= 0 ? `+${trustDelta}%` : `${trustDelta}%`} A&R Trust)${bonusGrant > 0 ? ` • +$${bonusGrant.toLocaleString()} Marketing Grant` : ''}.`,
          amount: bonusGrant,
          direction: bonusGrant > 0 ? 'credit' : 'neutral',
          category: 'quota',
        });
      }
    }

    // B. Check for newly released player Albums / EPs
    const releasedProjects = (state.projects || []).filter((p) => p.status === 'released');
    for (const proj of releasedProjects) {
      if (!contract.countedProjectIds.includes(proj.id)) {
        contract.countedProjectIds.push(proj.id);
        if (proj.type === 'album' || proj.type === 'ep') {
          contract.albumsDelivered += 1;
          const qualityDiff = (proj.quality || 68) - contract.arQualityFloor;
          const trustDelta = qualityDiff >= 5 ? 10 : qualityDiff >= 0 ? 5 : -8;
          contract.arTrustScore = Math.max(10, Math.min(100, contract.arTrustScore + trustDelta));

          const label = getRecordLabelById(contract.labelId);
          const cycleTopUp =
            qualityDiff >= 0
              ? Math.round((label?.baseMarketingBudgetPerAlbum || 60000) * 0.5)
              : 0;
          if (cycleTopUp > 0) {
            contract.availableMarketingBudget += cycleTopUp;
            contract.totalMarketingBudgetGranted += cycleTopUp;
          }

          labelState.statements.unshift({
            id: `stmt_quota_p_${Date.now()}_${proj.id}`,
            date: dateStr,
            title: `Delivered ${proj.type.toUpperCase()} "${proj.title}" to ${contract.labelName}`,
            detail: `Album Quota: ${contract.albumsDelivered}/${contract.albumQuotaTotal} • Quality ${proj.quality} (${trustDelta >= 0 ? `+${trustDelta}%` : `${trustDelta}%`} A&R Trust)${cycleTopUp > 0 ? ` • +$${cycleTopUp.toLocaleString()} Cycle Budget Added` : ''}.`,
            amount: cycleTopUp,
            direction: cycleTopUp > 0 ? 'credit' : 'neutral',
            category: 'quota',
          });
        }
      }
    }

    // C. Daily Royalty Recoupment & Label Share Calculation
    const dailyCatalogGross = Math.max(0, Number(state.dailyIncome) || 0);
    if (dailyCatalogGross > 0) {
      const artistShareMult = Math.max(0.15, Math.min(0.85, contract.artistRoyaltyPct / 100));
      const artistEarnedToday = Math.round(dailyCatalogGross * artistShareMult);

      if (contract.unrecoupedBalance > 0) {
        const recoupApplied = Math.min(
          contract.unrecoupedBalance,
          Math.round(artistEarnedToday * 0.75)
        );
        contract.unrecoupedBalance = Math.max(0, contract.unrecoupedBalance - recoupApplied);
        contract.totalRoyaltiesRecouped = (contract.totalRoyaltiesRecouped || 0) + recoupApplied;

        const netKeptByArtist = Math.max(0, artistEarnedToday - recoupApplied);
        contract.netRoyaltiesPaidToArtist =
          (contract.netRoyaltiesPaidToArtist || 0) + netKeptByArtist;

        const deductionFromGross = Math.max(0, dailyCatalogGross - netKeptByArtist);
        state.dailyIncome = Math.max(0, dailyCatalogGross - deductionFromGross);

        if (isMonday && recoupApplied > 0) {
          labelState.statements.unshift({
            id: `stmt_recoup_${Date.now()}`,
            date: dateStr,
            title: `Weekly Royalty Recoupment — ${contract.labelName}`,
            detail: `$${recoupApplied.toLocaleString()} recouped today • Remaining unrecouped balance: $${contract.unrecoupedBalance.toLocaleString()}.`,
            amount: recoupApplied,
            direction: 'recoup',
            category: 'recoupment',
          });
        }
      } else {
        contract.netRoyaltiesPaidToArtist =
          (contract.netRoyaltiesPaidToArtist || 0) + artistEarnedToday;
        state.dailyIncome = artistEarnedToday;
      }

      if (contract.ancillary360CutPct > 0 && state.dailyIncome > 0) {
        const cut360 = Math.round(state.dailyIncome * (contract.ancillary360CutPct / 100) * 0.35);
        state.dailyIncome = Math.max(0, state.dailyIncome - cut360);
        contract.total360AncillaryCutPaid = (contract.total360AncillaryCutPaid || 0) + cut360;
      }
    }
  }

  // --- PART 2: PLAYER'S OWN RECORD LABEL IMPRINT (100% PLAYER-IDENTICAL DAILY SIMULATION) ---
  const imprint = labelState.imprint;
  if (imprint && imprint.isFounded && imprint.signedRoster.length > 0) {
    let totalImprintNetToday = 0;
    const distKeepMult = Math.max(0.75, 1 - (imprint.distributorCutPct || 12) / 100);

    imprint.signedRoster = imprint.signedRoster.map((art) => {
      const sim = simulateRosterArtistAsPlayerDaily(state, art, currentDate, distKeepMult);
      totalImprintNetToday += sim.netForImprintToday;

      if (sim.droppedNewReleaseTitle) {
        labelState.statements.unshift({
          id: `stmt_imp_drop_${Date.now()}_${art.id}`,
          date: dateStr,
          title: `${imprint.imprintName} Release: ${sim.droppedNewReleaseTitle}`,
          detail: `${sim.updatedArtist.stageName || sim.updatedArtist.name} dropped a new release under your Imprint (${sim.updatedArtist.dailyStreams.toLocaleString()} daily streams).`,
          amount: 0,
          direction: 'credit',
          category: 'imprint',
        });
      }

      return sim.updatedArtist;
    });

    imprint.dailyImprintNetIncome = totalImprintNetToday;
    imprint.totalRevenueGenerated = (imprint.totalRevenueGenerated || 0) + totalImprintNetToday;
    imprint.totalNetProfitEarned = (imprint.totalNetProfitEarned || 0) + totalImprintNetToday;
    imprint.valuation = Math.max(
      imprint.valuation || 200_000_000,
      Math.round(
        200_000_000 + imprint.totalRevenueGenerated * 2.2 + imprint.signedRoster.length * 1_500_000
      )
    );

    if (totalImprintNetToday > 0) {
      state.dailyIncome = (state.dailyIncome || 0) + totalImprintNetToday;
    }
  }

  // Persist Part 0-2 changes onto state.recordLabelState BEFORE Part 3 runs so Part 3 mutates the live updated roster
  labelState.statements = labelState.statements.slice(0, 45);
  labelState.lastProcessedDate = dateStr;
  (state as any).recordLabelState = labelState;

  // --- PART 3: RECURRING STAFF SALARY PAYROLL + ROSTER HIATUS & LABEL TRUST PROGRESSION ---
  if (imprint && imprint.isFounded) {
    processDailyRosterTrustHiatusAndStaffPayroll(state, currentDate);
    processDailyRosterInternationalShows(state, currentDate);
  }

  const finalLabelState = getEnsuredRecordLabelState(state);
  finalLabelState.statements = finalLabelState.statements.slice(0, 45);
  finalLabelState.lastProcessedDate = dateStr;
  (state as any).recordLabelState = finalLabelState;
  syncActiveRosterArtistsToSharedWorld(state);
}

