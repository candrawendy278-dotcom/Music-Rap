import type { GameState, Song } from '../types';
import type { XPost } from './xSocialEngine';

export type SampleTierId = 'none' | 'underground' | 'classic' | 'megahit';
export type SampleClearanceStatus = 'none' | 'cleared' | 'uncleared' | 'disputed' | 'settled';
export type SampleFlipTechnique = 'direct_loop' | 'chopped_pitched' | 'studio_replay';
export type SampleClearanceDealStructure =
  | 'standard'
  | 'buyout_low_royalty'
  | 'low_upfront_high_royalty';

export interface SampleCatalogItem {
  id: string;
  tier: Exclude<SampleTierId, 'none'>;
  tierLabel: string;
  sampleTitle: string;
  originalArtist: string;
  publisherEstate: string;
  eraLabel: string;
  bpmAndKey: string;
  elementType: string;
  waveformPreview: number[];
  genreFit: string[];
  qualityBoost: number;
  viralPotentialMult: number;
  upfrontClearanceFee: number;
  publishingRoyaltyPct: number; // % of track revenue paid to original publisher when cleared
  unclearedLawsuitBaseChancePerDay: number; // Base daily probability once song crosses stream threshold
  minStreamsForLawsuitCheck: number;
  lawsuitDemandAmount: number;
  lawsuitPunitiveRoyaltyPct: number;
}

export interface SongSampleInfo {
  sampleId: string;
  tier: SampleTierId;
  sampleTitle: string;
  originalArtist: string;
  eraLabel: string;
  bpmAndKey?: string;
  elementType?: string;
  flipTechnique?: SampleFlipTechnique;
  dealStructure?: SampleClearanceDealStructure;
  qualityBoost: number;
  viralPotentialMult: number;
  clearanceStatus: SampleClearanceStatus;
  upfrontFeePaid: number;
  publishingRoyaltyPct: number;
  royaltyPaidToday?: number;
  royaltyPaidTotal?: number;
}

export interface ActiveCopyrightDispute {
  id: string;
  songId: number;
  songTitle: string;
  sampleId: string;
  sampleTitle: string;
  originalArtist: string;
  publisherEstate?: string;
  fingerprintMatchPct?: number;
  filedDate: string;
  settlementDemandAmount: number;
  punitiveRoyaltyPct: number;
  courtDefenseCost: number;
  daysUntilDefaultJudgment: number;
  status: 'active' | 'settled' | 'won_in_court' | 'lost_in_court';
}

export interface SampleLegalSystemState {
  initialized: boolean;
  activeDisputes: ActiveCopyrightDispute[];
  resolvedDisputesCount: number;
  totalSettlementsPaid: number;
  totalSampleRoyaltiesPaid: number;
  sampleRoyaltiesPaidToday: number;
}

export const SAMPLE_FLIP_TECHNIQUES: {
  id: SampleFlipTechnique;
  name: string;
  shortLabel: string;
  description: string;
  extraQualityBonus: number;
  upfrontFeeMultiplier: number;
  unclearedDetectionMultiplier: number;
  courtDefenseBonusChance: number;
}[] = [
  {
    id: 'direct_loop',
    name: 'Direct Hook / Master Loop',
    shortLabel: 'Direct Loop',
    description:
      'Preserves the original master hook intact for maximum instant nostalgia and viral recognition.',
    extraQualityBonus: 1,
    upfrontFeeMultiplier: 1.0,
    unclearedDetectionMultiplier: 1.0,
    courtDefenseBonusChance: 0
  },
  {
    id: 'chopped_pitched',
    name: 'MPC Micro-Chop & Pitch-Shift',
    shortLabel: 'Chopped & Pitched',
    description:
      'Slices the sample into 16 MPC pads, shifts formants by +3 semitones, and reverses tails. Harder for audio-ID bots to flag (+12% Fair Use defense).',
    extraQualityBonus: 2,
    upfrontFeeMultiplier: 0.9,
    unclearedDetectionMultiplier: 0.62,
    courtDefenseBonusChance: 0.12
  },
  {
    id: 'studio_replay',
    name: 'Live Studio Interpolation Replay',
    shortLabel: 'Session Replay',
    description:
      'Re-records the melody with live studio musicians so you only need Composition Publishing clearance (saves 35% upfront master fee).',
    extraQualityBonus: 2,
    upfrontFeeMultiplier: 0.65,
    unclearedDetectionMultiplier: 0.78,
    courtDefenseBonusChance: 0.08
  }
];

export const SAMPLE_CLEARANCE_STRUCTURES: {
  id: SampleClearanceDealStructure;
  name: string;
  shortLabel: string;
  description: string;
  upfrontMultiplier: number;
  royaltyMultiplier: number;
}[] = [
  {
    id: 'standard',
    name: 'Standard Master & Publishing License',
    shortLabel: 'Standard Split',
    description: 'Industry-standard upfront advance paired with a balanced publishing split.',
    upfrontMultiplier: 1.0,
    royaltyMultiplier: 1.0
  },
  {
    id: 'buyout_low_royalty',
    name: 'High-Upfront Royalty Buyout',
    shortLabel: 'Low-Royalty Buyout',
    description: 'Pay 1.65x upfront advance to cut ongoing publishing royalties by 50%.',
    upfrontMultiplier: 1.65,
    royaltyMultiplier: 0.5
  },
  {
    id: 'low_upfront_high_royalty',
    name: 'Low-Advance Points Deal',
    shortLabel: 'Low Upfront / High Split',
    description: 'Cut upfront cash fee by 50% in exchange for a 1.35x higher backend royalty split.',
    upfrontMultiplier: 0.5,
    royaltyMultiplier: 1.35
  }
];

export const SAMPLE_CATALOG: SampleCatalogItem[] = [
  // --- TIER 1: UNDERGROUND CRATE DIGS ---
  {
    id: 'sample_70s_tokyo_jazz',
    tier: 'underground',
    tierLabel: 'Underground Crate Dig',
    sampleTitle: 'Midnight in Shibuya (1978 Vinyl Loop)',
    originalArtist: 'Hiroshi Sato & The Rhodes Ensemble',
    publisherEstate: 'Alfa Music Tokyo Archive',
    eraLabel: '1978 Japanese City-Pop / Jazz-Fusion',
    bpmAndKey: '94 BPM · F Minor',
    elementType: 'Fender Rhodes & Fretless Bass Loop',
    waveformPreview: [35, 62, 48, 80, 72, 55, 90, 64, 42, 78, 60, 45],
    genreFit: ['Hip-Hop', 'R&B', 'Electronic', 'Pop'],
    qualityBoost: 4,
    viralPotentialMult: 1.05,
    upfrontClearanceFee: 4_500,
    publishingRoyaltyPct: 8,
    unclearedLawsuitBaseChancePerDay: 0.012,
    minStreamsForLawsuitCheck: 450_000,
    lawsuitDemandAmount: 25_000,
    lawsuitPunitiveRoyaltyPct: 25
  },
  {
    id: 'sample_detroit_soul_45',
    tier: 'underground',
    tierLabel: 'Underground Crate Dig',
    sampleTitle: 'Tears on Woodward Ave (Vocal Chop)',
    originalArtist: 'The Velvet Imperials',
    publisherEstate: 'Motor City Wax Publishing',
    eraLabel: '1971 Private-Press Soul 45',
    bpmAndKey: '86 BPM · C# Minor',
    elementType: 'Pitched Falsetto Vocal Soul Chop',
    waveformPreview: [28, 75, 88, 52, 40, 84, 92, 60, 35, 70, 82, 50],
    genreFit: ['Hip-Hop', 'R&B', 'Pop'],
    qualityBoost: 5,
    viralPotentialMult: 1.07,
    upfrontClearanceFee: 6_500,
    publishingRoyaltyPct: 10,
    unclearedLawsuitBaseChancePerDay: 0.015,
    minStreamsForLawsuitCheck: 400_000,
    lawsuitDemandAmount: 35_000,
    lawsuitPunitiveRoyaltyPct: 28
  },
  {
    id: 'sample_uk_pirate_garage',
    tier: 'underground',
    tierLabel: 'Underground Crate Dig',
    sampleTitle: 'Brixton 2-Step Dubplate',
    originalArtist: 'DJ K-Swift & MC Vapour',
    publisherEstate: 'Rinse & South London Dubs Ltd.',
    eraLabel: '1999 London Pirate Radio Tape',
    bpmAndKey: '132 BPM · G Minor',
    elementType: 'Skippy 2-Step Garage Drum & Sub Groove',
    waveformPreview: [85, 40, 92, 35, 88, 50, 95, 42, 80, 60, 90, 48],
    genreFit: ['Electronic', 'Pop', 'Hip-Hop', 'R&B'],
    qualityBoost: 4,
    viralPotentialMult: 1.06,
    upfrontClearanceFee: 5_000,
    publishingRoyaltyPct: 9,
    unclearedLawsuitBaseChancePerDay: 0.012,
    minStreamsForLawsuitCheck: 500_000,
    lawsuitDemandAmount: 28_000,
    lawsuitPunitiveRoyaltyPct: 25
  },
  {
    id: 'sample_70s_italian_cinema',
    tier: 'underground',
    tierLabel: 'Underground Crate Dig',
    sampleTitle: 'Ombra di Roma (Giallo Film Score Strings)',
    originalArtist: 'Maestro Ennio & Cinecittà Orchestra',
    publisherEstate: 'CAM Sugar Rome Film Editions',
    eraLabel: '1974 Italian Suspense Soundtrack',
    bpmAndKey: '82 BPM · D Minor',
    elementType: 'Tremolo Harpsichord & Cinematic Strings',
    waveformPreview: [40, 55, 72, 90, 85, 68, 50, 78, 94, 62, 48, 38],
    genreFit: ['Hip-Hop', 'Rock', 'Pop', 'Electronic'],
    qualityBoost: 5,
    viralPotentialMult: 1.08,
    upfrontClearanceFee: 7_200,
    publishingRoyaltyPct: 10,
    unclearedLawsuitBaseChancePerDay: 0.014,
    minStreamsForLawsuitCheck: 420_000,
    lawsuitDemandAmount: 38_000,
    lawsuitPunitiveRoyaltyPct: 28
  },
  {
    id: 'sample_sao_paulo_bossa',
    tier: 'underground',
    tierLabel: 'Underground Crate Dig',
    sampleTitle: 'Vento de Ipanema (Nylon Guitar & Flute)',
    originalArtist: 'Carlos & Astrud Quarteto',
    publisherEstate: 'Editora Musical Rio Ltda.',
    eraLabel: '1968 Brazilian Bossa Nova LP',
    bpmAndKey: '105 BPM · A Minor',
    elementType: 'Warm Nylon Guitar & Flute Countermelody',
    waveformPreview: [45, 62, 58, 74, 52, 68, 80, 64, 55, 72, 60, 48],
    genreFit: ['Latin', 'R&B', 'Pop', 'Hip-Hop'],
    qualityBoost: 5,
    viralPotentialMult: 1.07,
    upfrontClearanceFee: 5_800,
    publishingRoyaltyPct: 9,
    unclearedLawsuitBaseChancePerDay: 0.013,
    minStreamsForLawsuitCheck: 430_000,
    lawsuitDemandAmount: 32_000,
    lawsuitPunitiveRoyaltyPct: 26
  },

  // --- TIER 2: ICONIC GENRE CLASSICS ---
  {
    id: 'sample_80s_synth_anthem',
    tier: 'classic',
    tierLabel: 'Iconic Genre Classic',
    sampleTitle: 'Neon Heartbeat (1984 Analog Synth Hook)',
    originalArtist: 'New Order Syndicate',
    publisherEstate: 'Factory Manchester Music Publishing',
    eraLabel: '1984 Synth-Wave Classic',
    bpmAndKey: '122 BPM · E Minor',
    elementType: 'Prophet-5 Arpeggio & Gated Snare Hook',
    waveformPreview: [75, 82, 68, 94, 78, 85, 92, 70, 88, 95, 76, 84],
    genreFit: ['Pop', 'Electronic', 'Rock', 'R&B'],
    qualityBoost: 8,
    viralPotentialMult: 1.12,
    upfrontClearanceFee: 28_000,
    publishingRoyaltyPct: 18,
    unclearedLawsuitBaseChancePerDay: 0.038,
    minStreamsForLawsuitCheck: 180_000,
    lawsuitDemandAmount: 140_000,
    lawsuitPunitiveRoyaltyPct: 48
  },
  {
    id: 'sample_90s_rnb_slowjam',
    tier: 'classic',
    tierLabel: 'Iconic Genre Classic',
    sampleTitle: 'Rain on My Windowpane (Chorus Interpolation)',
    originalArtist: 'Aaliyah & Timbaland Era Vault',
    publisherEstate: 'Blackground & Virginia Beach Publishing',
    eraLabel: '1997 Platinum R&B Slow Jam',
    bpmAndKey: '78 BPM · Bb Minor',
    elementType: 'Syncopated Vocal Harmony & Swing Percussion',
    waveformPreview: [50, 88, 76, 62, 92, 80, 58, 95, 74, 65, 86, 70],
    genreFit: ['R&B', 'Hip-Hop', 'Pop', 'Latin'],
    qualityBoost: 9,
    viralPotentialMult: 1.15,
    upfrontClearanceFee: 38_000,
    publishingRoyaltyPct: 22,
    unclearedLawsuitBaseChancePerDay: 0.045,
    minStreamsForLawsuitCheck: 150_000,
    lawsuitDemandAmount: 185_000,
    lawsuitPunitiveRoyaltyPct: 52
  },
  {
    id: 'sample_70s_arena_guitar',
    tier: 'classic',
    tierLabel: 'Iconic Genre Classic',
    sampleTitle: 'Silver Springs Overdrive (Lead Riff)',
    originalArtist: 'Mirage Canyon',
    publisherEstate: 'Laurel Canyon Heritage Rights',
    eraLabel: '1977 Classic Rock Staple',
    bpmAndKey: '112 BPM · G Major',
    elementType: 'Les Paul Analog Tape-Saturated Guitar Riff',
    waveformPreview: [65, 90, 85, 78, 94, 88, 72, 92, 86, 80, 96, 75],
    genreFit: ['Rock', 'Pop', 'Hip-Hop'],
    qualityBoost: 8,
    viralPotentialMult: 1.13,
    upfrontClearanceFee: 32_000,
    publishingRoyaltyPct: 20,
    unclearedLawsuitBaseChancePerDay: 0.04,
    minStreamsForLawsuitCheck: 160_000,
    lawsuitDemandAmount: 160_000,
    lawsuitPunitiveRoyaltyPct: 50
  },
  {
    id: 'sample_90s_french_touch_house',
    tier: 'classic',
    tierLabel: 'Iconic Genre Classic',
    sampleTitle: 'Stardust Boulevard (Filtered Disco Loop)',
    originalArtist: 'Roule & Montmartre Duo',
    publisherEstate: 'Paris Disques Publishing',
    eraLabel: '1998 French Touch Filter-House',
    bpmAndKey: '124 BPM · F# Minor',
    elementType: 'Phaser-Swept Disco Funk Guitar & Talkbox',
    waveformPreview: [82, 90, 76, 95, 88, 92, 84, 96, 80, 90, 94, 86],
    genreFit: ['Electronic', 'Pop', 'R&B', 'Hip-Hop'],
    qualityBoost: 9,
    viralPotentialMult: 1.16,
    upfrontClearanceFee: 35_000,
    publishingRoyaltyPct: 20,
    unclearedLawsuitBaseChancePerDay: 0.042,
    minStreamsForLawsuitCheck: 155_000,
    lawsuitDemandAmount: 175_000,
    lawsuitPunitiveRoyaltyPct: 50
  },
  {
    id: 'sample_90s_memphis_phonk_tape',
    tier: 'classic',
    tierLabel: 'Iconic Genre Classic',
    sampleTitle: ' Mystic Stylez 808 Cowbell & Vocal Chant',
    originalArtist: 'Triple Six Underground Clique',
    publisherEstate: 'Hypnotize Memphis Publishing',
    eraLabel: '1995 Memphis Cassette Classic',
    bpmAndKey: '140 BPM · C Minor',
    elementType: 'Distorted TR-808 Cowbell & Triplet Flow Chant',
    waveformPreview: [92, 65, 96, 70, 90, 62, 98, 75, 94, 68, 95, 80],
    genreFit: ['Hip-Hop', 'Electronic', 'Latin'],
    qualityBoost: 8,
    viralPotentialMult: 1.14,
    upfrontClearanceFee: 26_000,
    publishingRoyaltyPct: 17,
    unclearedLawsuitBaseChancePerDay: 0.036,
    minStreamsForLawsuitCheck: 175_000,
    lawsuitDemandAmount: 135_000,
    lawsuitPunitiveRoyaltyPct: 46
  },

  // --- TIER 3: GLOBAL MEGAHIT INTERPOLATIONS ---
  {
    id: 'sample_2000s_diamond_pop',
    tier: 'megahit',
    tierLabel: 'Global Megahit Interpolation',
    sampleTitle: 'Toxic Champagne (Main Melody Interpolation)',
    originalArtist: 'Max Martin & Stockholm Heritage Publishing',
    publisherEstate: 'Maratone & Universal Music Publishing',
    eraLabel: '2003 Diamond #1 Pop Smash',
    bpmAndKey: '143 BPM · C Minor',
    elementType: 'Bollywood Surf-String Hook & Chorus Melody',
    waveformPreview: [90, 96, 84, 98, 92, 88, 99, 94, 86, 97, 93, 95],
    genreFit: ['Pop', 'Electronic', 'R&B', 'Latin'],
    qualityBoost: 12,
    viralPotentialMult: 1.24,
    upfrontClearanceFee: 95_000,
    publishingRoyaltyPct: 32,
    unclearedLawsuitBaseChancePerDay: 0.085,
    minStreamsForLawsuitCheck: 60_000,
    lawsuitDemandAmount: 480_000,
    lawsuitPunitiveRoyaltyPct: 75
  },
  {
    id: 'sample_80s_king_of_pop_groove',
    tier: 'megahit',
    tierLabel: 'Global Megahit Interpolation',
    sampleTitle: 'Starlight Boogie (Bassline & Vocal Refrain)',
    originalArtist: 'Westlake Quincy Publishing Trust',
    publisherEstate: 'Mijac & Sony Music Publishing Catalog',
    eraLabel: '1982 Multi-Platinum Funk/Pop Milestone',
    bpmAndKey: '117 BPM · F# Minor',
    elementType: 'Iconic Minimoog Bassline & Horn Stabs',
    waveformPreview: [95, 88, 98, 92, 96, 85, 100, 90, 94, 89, 98, 92],
    genreFit: ['Pop', 'R&B', 'Hip-Hop', 'Electronic'],
    qualityBoost: 13,
    viralPotentialMult: 1.26,
    upfrontClearanceFee: 125_000,
    publishingRoyaltyPct: 35,
    unclearedLawsuitBaseChancePerDay: 0.095,
    minStreamsForLawsuitCheck: 50_000,
    lawsuitDemandAmount: 650_000,
    lawsuitPunitiveRoyaltyPct: 80
  },
  {
    id: 'sample_70s_bohemian_ stadium_choir',
    tier: 'megahit',
    tierLabel: 'Global Megahit Interpolation',
    sampleTitle: 'Crown of Champions (Operatic Piano & Stomp)',
    originalArtist: 'Soho Trident Arena Legends',
    publisherEstate: 'Queen Crest & EMI Publishing Trust',
    eraLabel: '1977 Diamond Stadium Rock Anthem',
    bpmAndKey: '108 BPM · F Major',
    elementType: 'Multi-Tracked Operatic Choir & Grand Piano',
    waveformPreview: [60, 75, 92, 98, 100, 88, 95, 99, 85, 94, 98, 90],
    genreFit: ['Rock', 'Pop', 'Hip-Hop'],
    qualityBoost: 13,
    viralPotentialMult: 1.25,
    upfrontClearanceFee: 115_000,
    publishingRoyaltyPct: 34,
    unclearedLawsuitBaseChancePerDay: 0.09,
    minStreamsForLawsuitCheck: 55_000,
    lawsuitDemandAmount: 590_000,
    lawsuitPunitiveRoyaltyPct: 78
  },
  {
    id: 'sample_2000s_san_juan_reggaeton',
    tier: 'megahit',
    tierLabel: 'Global Megahit Interpolation',
    sampleTitle: 'Fuego del Barrio (Classic Dembow Brass Hook)',
    originalArtist: 'El Cangri & Luny Tunes Archive',
    publisherEstate: 'Mas Flow San Juan Publishing',
    eraLabel: '2004 Global Reggaeton Crossover Anthem',
    bpmAndKey: '96 BPM · A Minor',
    elementType: 'Iconic Synth Brass Riff & Heavy Dembow Riddim',
    waveformPreview: [88, 94, 80, 96, 90, 85, 98, 92, 84, 95, 91, 89],
    genreFit: ['Latin', 'Pop', 'Hip-Hop', 'Electronic'],
    qualityBoost: 11,
    viralPotentialMult: 1.22,
    upfrontClearanceFee: 85_000,
    publishingRoyaltyPct: 30,
    unclearedLawsuitBaseChancePerDay: 0.08,
    minStreamsForLawsuitCheck: 65_000,
    lawsuitDemandAmount: 420_000,
    lawsuitPunitiveRoyaltyPct: 70
  }
];

export function getEnsuredSampleLegalState(state: GameState): SampleLegalSystemState {
  const existing = (state as any)?.sampleLegalState as SampleLegalSystemState | undefined;
  if (existing && existing.initialized && Array.isArray(existing.activeDisputes)) {
    return existing;
  }
  return {
    initialized: true,
    activeDisputes: [],
    resolvedDisputesCount: 0,
    totalSettlementsPaid: 0,
    totalSampleRoyaltiesPaid: 0,
    sampleRoyaltiesPaidToday: 0
  };
}

/**
 * Checks if the player has hired Legal Counsel in their Executive Staff Team,
 * which reduces upfront sample clearance fees by up to 28% and royalty splits by up to 6%.
 */
export function getLegalCounselClearanceDiscount(state: GameState): {
  hasLegalCounsel: boolean;
  counselLevel: number;
  feeDiscountMultiplier: number;
  royaltyPointReduction: number;
  courtWinBonusChance: number;
} {
  const staffRoster = (state as any)?.staffState?.roster || {};
  const legalStaff = staffRoster['legal_counsel'] || staffRoster['attorney'] || null;
  if (!legalStaff) {
    return {
      hasLegalCounsel: false,
      counselLevel: 0,
      feeDiscountMultiplier: 1.0,
      royaltyPointReduction: 0,
      courtWinBonusChance: 0
    };
  }
  const lv = Math.max(1, Number(legalStaff.level) || 1);
  return {
    hasLegalCounsel: true,
    counselLevel: lv,
    feeDiscountMultiplier: Math.max(0.72, 1 - lv * 0.05),
    royaltyPointReduction: Math.min(6, Math.round(lv * 1.2)),
    courtWinBonusChance: Math.min(0.28, lv * 0.055)
  };
}

export function calculateEffectiveSampleClearanceTerms(
  state: GameState,
  sample: SampleCatalogItem,
  flipTechnique: SampleFlipTechnique = 'direct_loop',
  dealStructure: SampleClearanceDealStructure = 'standard'
): {
  effectiveUpfrontFee: number;
  effectiveRoyaltyPct: number;
  effectiveQualityBoost: number;
  hasLegalDiscount: boolean;
} {
  const discount = getLegalCounselClearanceDiscount(state);
  const flipMeta =
    SAMPLE_FLIP_TECHNIQUES.find(f => f.id === flipTechnique) || SAMPLE_FLIP_TECHNIQUES[0];
  const structureMeta =
    SAMPLE_CLEARANCE_STRUCTURES.find(s => s.id === dealStructure) ||
    SAMPLE_CLEARANCE_STRUCTURES[0];

  const effectiveUpfrontFee = Math.round(
    sample.upfrontClearanceFee *
      discount.feeDiscountMultiplier *
      flipMeta.upfrontFeeMultiplier *
      structureMeta.upfrontMultiplier
  );

  const baseReducedRoyalty = Math.max(
    4,
    sample.publishingRoyaltyPct - discount.royaltyPointReduction
  );
  const effectiveRoyaltyPct = Math.max(
    3,
    Math.min(65, Math.round(baseReducedRoyalty * structureMeta.royaltyMultiplier))
  );

  return {
    effectiveUpfrontFee,
    effectiveRoyaltyPct,
    effectiveQualityBoost: sample.qualityBoost + flipMeta.extraQualityBonus,
    hasLegalDiscount: discount.hasLegalCounsel
  };
}

/**
 * Clears an uncleared sample on an existing song in the player's catalog before a lawsuit hits.
 */
export function clearSongSampleInAdvance(
  state: GameState,
  songId: number,
  dealStructure: SampleClearanceDealStructure = 'standard'
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const song = (state.songs || []).find(s => s.id === songId);
  const sampleInfo = (song as any)?.sampleInfo as SongSampleInfo | undefined;
  if (!song || !sampleInfo || sampleInfo.tier === 'none') {
    return { success: false, message: 'This track does not contain a sample.', updatedState: state };
  }

  if (sampleInfo.clearanceStatus === 'cleared' || sampleInfo.clearanceStatus === 'settled') {
    return {
      success: false,
      message: `The sample on "${song.title}" is already cleared.`,
      updatedState: state
    };
  }

  const catalogSample = SAMPLE_CATALOG.find(c => c.id === sampleInfo.sampleId);
  if (!catalogSample) {
    return {
      success: false,
      message: 'Original sample publishing record not found.',
      updatedState: state
    };
  }

  const terms = calculateEffectiveSampleClearanceTerms(
    state,
    catalogSample,
    sampleInfo.flipTechnique || 'direct_loop',
    dealStructure
  );
  const currentMoney = Number(state.money) || 0;
  if (currentMoney < terms.effectiveUpfrontFee) {
    return {
      success: false,
      message: `Insufficient funds to clear "${catalogSample.sampleTitle}". Required: $${terms.effectiveUpfrontFee.toLocaleString()} (Available: $${Math.round(currentMoney).toLocaleString()}).`,
      updatedState: state
    };
  }

  const nextSongs = state.songs.map(s => {
    if (s.id !== songId) return s;
    const updatedSample: SongSampleInfo = {
      ...sampleInfo,
      clearanceStatus: 'cleared',
      dealStructure,
      upfrontFeePaid: terms.effectiveUpfrontFee,
      publishingRoyaltyPct: terms.effectiveRoyaltyPct
    };
    return {
      ...s,
      sampleInfo: updatedSample
    } as any;
  });

  // Also sync inside projects
  const nextProjects = (state.projects || []).map(p => ({
    ...p,
    songs: (p.songs || []).map(ps => {
      if (ps.id !== songId) return ps;
      return {
        ...ps,
        sampleInfo: {
          ...sampleInfo,
          clearanceStatus: 'cleared',
          dealStructure,
          upfrontFeePaid: terms.effectiveUpfrontFee,
          publishingRoyaltyPct: terms.effectiveRoyaltyPct
        }
      } as any;
    })
  }));

  return {
    success: true,
    message: `Cleared "${catalogSample.sampleTitle}" for "${song.title}"! Paid $${terms.effectiveUpfrontFee.toLocaleString()} upfront and locked in a ${terms.effectiveRoyaltyPct}% publishing split.`,
    updatedState: {
      ...state,
      money: Math.max(0, currentMoney - terms.effectiveUpfrontFee),
      songs: nextSongs,
      projects: nextProjects
    }
  };
}

/**
 * Resolves an active copyright infringement lawsuit via Out-of-Court Settlement,
 * Publishing Surrender, or Contesting in Federal Court.
 */
export function resolveCopyrightDispute(
  state: GameState,
  disputeId: string,
  resolutionType: 'settle_cash' | 'surrender_publishing' | 'fight_in_court'
): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const legalState = getEnsuredSampleLegalState(state);
  const dispute = legalState.activeDisputes.find(d => d.id === disputeId);
  if (!dispute) {
    return { success: false, message: 'Active copyright dispute not found.', updatedState: state };
  }

  const currentMoney = Number(state.money) || 0;
  const discount = getLegalCounselClearanceDiscount(state);
  const todayStr = (state.date || new Date().toISOString()).split('T')[0];

  const disputedSong = (state.songs || []).find(s => s.id === dispute.songId);
  const songSampleInfo = (disputedSong as any)?.sampleInfo as SongSampleInfo | undefined;
  const flipMeta =
    SAMPLE_FLIP_TECHNIQUES.find(f => f.id === songSampleInfo?.flipTechnique) ||
    SAMPLE_FLIP_TECHNIQUES[0];

  if (resolutionType === 'settle_cash') {
    const settlementCost = Math.round(
      dispute.settlementDemandAmount * discount.feeDiscountMultiplier
    );
    if (currentMoney < settlementCost) {
      return {
        success: false,
        message: `You need $${settlementCost.toLocaleString()} to pay the out-of-court settlement (or choose Publishing Surrender).`,
        updatedState: state
      };
    }

    const settledRoyalty = Math.max(15, Math.round(dispute.punitiveRoyaltyPct * 0.55));
    const nextSongs = state.songs.map(s => {
      if (s.id !== dispute.songId) return s;
      const prevSample = (s as any).sampleInfo as SongSampleInfo | undefined;
      return {
        ...s,
        sampleInfo: prevSample
          ? {
              ...prevSample,
              clearanceStatus: 'settled',
              upfrontFeePaid: (prevSample.upfrontFeePaid || 0) + settlementCost,
              publishingRoyaltyPct: settledRoyalty
            }
          : undefined
      } as any;
    });

    const nextLegalState: SampleLegalSystemState = {
      ...legalState,
      activeDisputes: legalState.activeDisputes.filter(d => d.id !== disputeId),
      resolvedDisputesCount: legalState.resolvedDisputesCount + 1,
      totalSettlementsPaid: (legalState.totalSettlementsPaid || 0) + settlementCost
    };

    return {
      success: true,
      message: `Settled copyright claim on "${dispute.songTitle}" for $${settlementCost.toLocaleString()} and a ${settledRoyalty}% ongoing publishing share.`,
      updatedState: {
        ...state,
        money: Math.max(0, currentMoney - settlementCost),
        songs: nextSongs,
        sampleLegalState: nextLegalState
      } as any
    };
  }

  if (resolutionType === 'surrender_publishing') {
    const surrenderedPct = dispute.punitiveRoyaltyPct;
    const nextSongs = state.songs.map(s => {
      if (s.id !== dispute.songId) return s;
      const prevSample = (s as any).sampleInfo as SongSampleInfo | undefined;
      return {
        ...s,
        sampleInfo: prevSample
          ? {
              ...prevSample,
              clearanceStatus: 'settled',
              publishingRoyaltyPct: surrenderedPct
            }
          : undefined
      } as any;
    });

    const nextLegalState: SampleLegalSystemState = {
      ...legalState,
      activeDisputes: legalState.activeDisputes.filter(d => d.id !== disputeId),
      resolvedDisputesCount: legalState.resolvedDisputesCount + 1
    };

    return {
      success: true,
      message: `Avoided upfront cash damages by assigning ${surrenderedPct}% of "${dispute.songTitle}" publishing royalties to ${dispute.originalArtist}'s estate.`,
      updatedState: {
        ...state,
        songs: nextSongs,
        sampleLegalState: nextLegalState
      } as any
    };
  }

  // Fight in Federal Court
  const defenseCost = dispute.courtDefenseCost;
  if (currentMoney < defenseCost) {
    return {
      success: false,
      message: `Insufficient funds for federal trial defense ($${defenseCost.toLocaleString()} required).`,
      updatedState: state
    };
  }

  const winChance =
    0.34 + discount.courtWinBonusChance + flipMeta.courtDefenseBonusChance;
  const wonTrial = Math.random() < winChance;

  if (wonTrial) {
    const nextSongs = state.songs.map(s => {
      if (s.id !== dispute.songId) return s;
      const prevSample = (s as any).sampleInfo as SongSampleInfo | undefined;
      return {
        ...s,
        sampleInfo: prevSample
          ? {
              ...prevSample,
              clearanceStatus: 'cleared',
              publishingRoyaltyPct: 0
            }
          : undefined
      } as any;
    });

    const nextLegalState: SampleLegalSystemState = {
      ...legalState,
      activeDisputes: legalState.activeDisputes.filter(d => d.id !== disputeId),
      resolvedDisputesCount: legalState.resolvedDisputesCount + 1,
      totalSettlementsPaid: (legalState.totalSettlementsPaid || 0) + defenseCost
    };

    return {
      success: true,
      message: `VICTORY IN COURT! Expert musicologists proved your "${flipMeta.shortLabel}" transformation in "${dispute.songTitle}" is protected fair use. You keep 100% of publishing royalties!`,
      updatedState: {
        ...state,
        money: Math.max(0, currentMoney - defenseCost),
        hype: Math.min(100, Number(((state.hype || 0) + 4.5).toFixed(1))),
        songs: nextSongs,
        sampleLegalState: nextLegalState
      } as any
    };
  } else {
    const totalDamages = defenseCost + Math.round(dispute.settlementDemandAmount * 1.15);
    const nextSongs = state.songs.map(s => {
      if (s.id !== dispute.songId) return s;
      const prevSample = (s as any).sampleInfo as SongSampleInfo | undefined;
      return {
        ...s,
        sampleInfo: prevSample
          ? {
              ...prevSample,
              clearanceStatus: 'settled',
              publishingRoyaltyPct: dispute.punitiveRoyaltyPct
            }
          : undefined
      } as any;
    });

    const nextLegalState: SampleLegalSystemState = {
      ...legalState,
      activeDisputes: legalState.activeDisputes.filter(d => d.id !== disputeId),
      resolvedDisputesCount: legalState.resolvedDisputesCount + 1,
      totalSettlementsPaid: (legalState.totalSettlementsPaid || 0) + totalDamages
    };

    const artistName = state.artist?.name || 'Artist';
    const lawsuitPost: XPost = {
      id: `lawsuit_verdict_${dispute.id}_${Date.now()}`,
      authorName: 'chart data',
      authorHandle: '@chartdata',
      authorAvatar: 'https://placehold.co/120x120/090D16/F43F5E?text=CD',
      isVerified: true,
      verifiedType: 'gold',
      category: 'chart',
      content: `${artistName} ordered to pay $${totalDamages.toLocaleString()} and surrender ${dispute.punitiveRoyaltyPct}% publishing on "${dispute.songTitle}" following copyright verdict over "${dispute.sampleTitle}".`,
      likes: 42000,
      reposts: 6800,
      replies: 3100,
      views: 680000,
      timeAgo: 'Just now',
      dateCreated: todayStr
    };

    return {
      success: true,
      message: `Verdict lost: The court awarded ${dispute.originalArtist}'s estate $${totalDamages.toLocaleString()} (including legal fees) and ${dispute.punitiveRoyaltyPct}% of ongoing track royalties.`,
      updatedState: {
        ...state,
        money: Math.max(0, currentMoney - totalDamages),
        songs: nextSongs,
        xPosts: [lawsuitPost, ...(state.xPosts || [])].slice(0, 120),
        sampleLegalState: nextLegalState
      } as any
    };
  }
}

/**
 * Runs daily during nextDay():
 * 1. Deducts agreed sample publishing royalty splits on cleared/settled tracks.
 * 2. Evaluates uncleared commercial tracks for potential copyright infringement notices.
 */
export function processDailySampleClearanceAndLawsuitsStep(
  state: GameState,
  grossRevenueToday: number
): {
  updatedSongs: Song[];
  updatedLegalState: SampleLegalSystemState;
  totalSampleRoyaltyDeductedToday: number;
  newXPosts: XPost[];
} {
  const legalState = getEnsuredSampleLegalState(state);
  const songs = state.songs || [];
  const todayStr = (state.date || new Date().toISOString()).split('T')[0];
  const artistName = state.artist?.name || 'Artist';

  // Check which songs belong to Free Street Mixtapes (which have 75% lower lawsuit risk)
  const freeMixtapeSongIds = new Set<number>();
  (state.projects || []).forEach(p => {
    if ((p as any).type === 'mixtape' && (p as any).mixtapeModel === 'free_street') {
      (p.songs || []).forEach(ps => freeMixtapeSongIds.add(ps.id));
    }
  });

  let totalSampleRoyaltyDeductedToday = 0;
  const newDisputes: ActiveCopyrightDispute[] = [...legalState.activeDisputes];
  const newXPosts: XPost[] = [];

  const updatedSongs = songs.map(song => {
    const sampleInfo = (song as any).sampleInfo as SongSampleInfo | undefined;
    if (!sampleInfo || sampleInfo.tier === 'none' || song.status !== 'released') {
      return song;
    }

    const dailyStreams = Number(song.dailyStreams) || 0;
    const dailySales = Number(song.dailyPureSales) || 0;
    const estimatedSongRevenueToday = dailyStreams * 0.0038 + dailySales * 0.95;

    let royaltyPaidToday = 0;
    if (
      (sampleInfo.clearanceStatus === 'cleared' || sampleInfo.clearanceStatus === 'settled') &&
      sampleInfo.publishingRoyaltyPct > 0
    ) {
      royaltyPaidToday = Math.round(
        estimatedSongRevenueToday * (sampleInfo.publishingRoyaltyPct / 100)
      );
      totalSampleRoyaltyDeductedToday += royaltyPaidToday;
    }

    // Check if an uncleared song triggers a copyright lawsuit today
    let nextClearanceStatus = sampleInfo.clearanceStatus;
    if (sampleInfo.clearanceStatus === 'uncleared') {
      const catalogItem = SAMPLE_CATALOG.find(c => c.id === sampleInfo.sampleId);
      const alreadyDisputed = newDisputes.some(d => d.songId === song.id);
      if (
        catalogItem &&
        !alreadyDisputed &&
        (Number(song.streams) || 0) >= catalogItem.minStreamsForLawsuitCheck
      ) {
        const isFreeMixtapeTrack = freeMixtapeSongIds.has(song.id);
        const flipMeta =
          SAMPLE_FLIP_TECHNIQUES.find(f => f.id === sampleInfo.flipTechnique) ||
          SAMPLE_FLIP_TECHNIQUES[0];
        const streamVelocityFactor = Math.min(2.2, 1 + dailyStreams / 250_000);
        const effectiveChance =
          catalogItem.unclearedLawsuitBaseChancePerDay *
          streamVelocityFactor *
          flipMeta.unclearedDetectionMultiplier *
          (isFreeMixtapeTrack ? 0.25 : 1.0);

        if (Math.random() < effectiveChance && newDisputes.length < 3) {
          nextClearanceStatus = 'disputed';
          const disputeObj: ActiveCopyrightDispute = {
            id: `dispute_${song.id}_${Date.now()}`,
            songId: song.id,
            songTitle: song.title,
            sampleId: catalogItem.id,
            sampleTitle: catalogItem.sampleTitle,
            originalArtist: catalogItem.originalArtist,
            publisherEstate: catalogItem.publisherEstate,
            fingerprintMatchPct:
              sampleInfo.flipTechnique === 'chopped_pitched' ? 68 : 94,
            filedDate: todayStr,
            settlementDemandAmount: catalogItem.lawsuitDemandAmount,
            punitiveRoyaltyPct: catalogItem.lawsuitPunitiveRoyaltyPct,
            courtDefenseCost: Math.round(catalogItem.lawsuitDemandAmount * 0.35),
            daysUntilDefaultJudgment: 14,
            status: 'active'
          };
          newDisputes.push(disputeObj);

          newXPosts.push({
            id: `x_copyright_suit_${song.id}_${Date.now()}`,
            authorName: 'Pop Base',
            authorHandle: '@PopBase',
            authorAvatar: 'https://placehold.co/120x120/111827/38BDF8?text=PB',
            isVerified: true,
            verifiedType: 'gold',
            category: 'media',
            content: `${artistName} has been hit with a copyright infringement notice by ${catalogItem.publisherEstate} (${catalogItem.originalArtist}) over an uncleared sample of "${catalogItem.sampleTitle}" on "${song.title}".`,
            mediaBadge: 'LEGAL DISPUTE',
            mediaTitle: `Copyright Claim: "${song.title}"`,
            mediaSubtitle: `Seeking $${catalogItem.lawsuitDemandAmount.toLocaleString()} or ${catalogItem.lawsuitPunitiveRoyaltyPct}% publishing`,
            likes: 34000,
            reposts: 5200,
            replies: 2400,
            views: 510000,
            timeAgo: 'Just now',
            dateCreated: todayStr
          });
        }
      }
    }

    return {
      ...song,
      sampleInfo: {
        ...sampleInfo,
        clearanceStatus: nextClearanceStatus,
        royaltyPaidToday,
        royaltyPaidTotal: (sampleInfo.royaltyPaidTotal || 0) + royaltyPaidToday
      }
    } as any;
  });

  totalSampleRoyaltyDeductedToday = Math.min(
    Math.round(grossRevenueToday * 0.65),
    totalSampleRoyaltyDeductedToday
  );

  return {
    updatedSongs,
    updatedLegalState: {
      ...legalState,
      activeDisputes: newDisputes,
      sampleRoyaltiesPaidToday: totalSampleRoyaltyDeductedToday,
      totalSampleRoyaltiesPaid:
        (legalState.totalSampleRoyaltiesPaid || 0) + totalSampleRoyaltyDeductedToday
    },
    totalSampleRoyaltyDeductedToday,
    newXPosts
  };
}
