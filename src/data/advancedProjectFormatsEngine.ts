import type { GameState, Project, Song } from '../types';
import { resolveAuthenticCover } from './musicCatalog';

export type ExtendedProjectFormatType =
  | 'single_pack'
  | 'ep'
  | 'album'
  | 'mixtape'
  | 'deluxe'
  | 'remaster'
  | 'compilation';

export type MixtapeReleaseModel = 'free_street' | 'commercial';

export type AdvancedEditionVariantId =
  | 'deluxe_standard'
  | 'deluxe_3am'
  | 'deluxe_boxset'
  | 'mixtape_street_hosted'
  | 'mixtape_pirate_radio'
  | 'mixtape_commercial_dsp'
  | 'remaster_24bit'
  | 'remaster_spatial_vault'
  | 'comp_greatest_hits'
  | 'comp_bsides_rarities'
  | 'comp_live_symphony';

export type EditionAudioEngineerId =
  | 'standard_inhouse'
  | 'sterling_sound'
  | 'abbey_road_analog'
  | 'street_dj_host';

export interface ProjectFormatDefinition {
  id: ExtendedProjectFormatType;
  name: string;
  shortLabel: string;
  minTracks: number;
  maxTracks: number;
  trackRangeLabel: string;
  requiresParentAlbum: boolean;
  allowsUnreleasedTracks: boolean;
  allowsReleasedTracks: boolean;
  upfrontPackagingCost: number;
  hypeMultiplier: number;
  streamVelocityMultiplier: number;
  pureSalesMultiplier: number;
  description: string;
  icon: string;
}

export interface AdvancedEditionVariantSpec {
  id: AdvancedEditionVariantId;
  parentFormat: 'deluxe' | 'mixtape' | 'remaster' | 'compilation';
  name: string;
  badgeLabel: string;
  subtitle: string;
  upfrontCost: number;
  qualityBonus: number;
  hypeMultiplier: number;
  streamVelocityMultiplier: number;
  pureSalesMultiplier: number;
  mixtapeModel?: MixtapeReleaseModel;
  defaultSuffix: string;
  perks: string[];
}

export interface EditionAudioEngineerSpec {
  id: EditionAudioEngineerId;
  name: string;
  studioLocation: string;
  fee: number;
  qualityBonus: number;
  hypeBonusPct: number;
  salesBonusPct: number;
  description: string;
}

export const EDITION_AUDIO_ENGINEERS: EditionAudioEngineerSpec[] = [
  {
    id: 'standard_inhouse',
    name: 'In-House Digital Mastering',
    studioLocation: 'Label Reference Suite',
    fee: 0,
    qualityBonus: 0,
    hypeBonusPct: 0,
    salesBonusPct: 0,
    description: 'Standard loudness-normalized digital delivery for all streaming platforms.'
  },
  {
    id: 'sterling_sound',
    name: 'Sterling Sound Mastering',
    studioLocation: 'Edgewater, NJ / NYC',
    fee: 3_500,
    qualityBonus: 2,
    hypeBonusPct: 5,
    salesBonusPct: 6,
    description: 'Grammy-winning mastering console chain for punchy low-end and playlist clarity.'
  },
  {
    id: 'abbey_road_analog',
    name: 'Abbey Road Half-Speed Vinyl & Atmos',
    studioLocation: 'St John’s Wood, London',
    fee: 5_500,
    qualityBonus: 3,
    hypeBonusPct: 6,
    salesBonusPct: 14,
    description: 'Custom EMI TG12410 transfer and audiophile vinyl lacquer cut for collectors.'
  },
  {
    id: 'street_dj_host',
    name: 'Iconic Street DJ Host & Sirens',
    studioLocation: 'Atlanta / NYC Mixtape Circuit',
    fee: 2_000,
    qualityBonus: 1,
    hypeBonusPct: 16,
    salesBonusPct: 0,
    description: 'Exclusive DJ drops, tape rewinds, and street cosign tags that ignite viral buzz.'
  }
];

export const ADVANCED_EDITION_VARIANTS: AdvancedEditionVariantSpec[] = [
  // DELUXE VARIANTS
  {
    id: 'deluxe_standard',
    parentFormat: 'deluxe',
    name: 'Standard Deluxe (Disc 2 Bonus Pack)',
    badgeLabel: 'DELUXE EDITION',
    subtitle: 'Combines parent album units + 2–8 new bonus tracks',
    upfrontCost: 6_500,
    qualityBonus: 3,
    hypeMultiplier: 1.28,
    streamVelocityMultiplier: 1.24,
    pureSalesMultiplier: 1.42,
    defaultSuffix: '(Deluxe)',
    perks: [
      'Rolls all parent album tracks + bonus cuts into one unified Billboard 200 entry',
      '+28% release Hype surge and +24% streaming velocity boost',
      'Revives parent album momentum in weekly charts'
    ]
  },
  {
    id: 'deluxe_3am',
    parentFormat: 'deluxe',
    name: '3AM / Complete Digital Edition',
    badgeLabel: '3AM COMPLETE EDITION',
    subtitle: 'Surprise late-night streaming expansion engineered for viral playlists',
    upfrontCost: 8_500,
    qualityBonus: 4,
    hypeMultiplier: 1.36,
    streamVelocityMultiplier: 1.44,
    pureSalesMultiplier: 1.3,
    defaultSuffix: '(3AM Complete Edition)',
    perks: [
      'Massive +44% first-week streaming velocity spike on Spotify & Apple Music',
      '+4 Master Quality boost across newly added bonus sessions',
      'Triggers instant social timeline wave from core stans'
    ]
  },
  {
    id: 'deluxe_boxset',
    parentFormat: 'deluxe',
    name: 'Collector Box Set & Exclusive Vinyl Deluxe',
    badgeLabel: 'COLLECTOR DELUXE BOX',
    subtitle: 'Heavyweight 180g gatefold vinyl, hardcover zine & alternate artwork',
    upfrontCost: 14_000,
    qualityBonus: 5,
    hypeMultiplier: 1.32,
    streamVelocityMultiplier: 1.22,
    pureSalesMultiplier: 1.82,
    defaultSuffix: '(Collector’s Deluxe Box)',
    perks: [
      'Huge 1.82x Pure Sales multiplier from physical vinyl & D2C box sets',
      '+5 Master Quality bonus from audiophile pressing',
      'Maximizes first-week pure album equivalent units'
    ]
  },

  // MIXTAPE VARIANTS
  {
    id: 'mixtape_street_hosted',
    parentFormat: 'mixtape',
    name: 'Free Street Mixtape (DatPiff / SoundCloud Circuit)',
    badgeLabel: 'FREE STREET TAPE',
    subtitle: 'Zero packaging cost, raw street credibility & 75% lower sample lawsuit risk',
    upfrontCost: 0,
    qualityBonus: 2,
    hypeMultiplier: 1.48,
    streamVelocityMultiplier: 1.2,
    pureSalesMultiplier: 0.55,
    mixtapeModel: 'free_street',
    defaultSuffix: '(Street Tape)',
    perks: [
      '$0 upfront distribution cost and +48% street Hype multiplier',
      '75% reduction in uncleared sample copyright detection risk',
      'Rapidly converts casual listeners into die-hard core fans'
    ]
  },
  {
    id: 'mixtape_pirate_radio',
    parentFormat: 'mixtape',
    name: 'Underground Club & Pirate Radio Tape',
    badgeLabel: 'PIRATE RADIO TAPE',
    subtitle: 'Continuous club blends, exclusive freestyles & late-night radio rip aesthetic',
    upfrontCost: 1_500,
    qualityBonus: 3,
    hypeMultiplier: 1.42,
    streamVelocityMultiplier: 1.32,
    pureSalesMultiplier: 0.68,
    mixtapeModel: 'free_street',
    defaultSuffix: '(Radio Tape)',
    perks: [
      '+32% streaming velocity and +42% underground Hype boost',
      'Protected under promotional street-tape sample shield',
      '+3 Quality bonus from seamless DJ transitions'
    ]
  },
  {
    id: 'mixtape_commercial_dsp',
    parentFormat: 'mixtape',
    name: 'Commercial Streaming Mixtape (All DSPs)',
    badgeLabel: 'COMMERCIAL MIXTAPE',
    subtitle: 'Full Spotify, Apple Music & Billboard 200 chart eligibility with full royalties',
    upfrontCost: 4_000,
    qualityBonus: 3,
    hypeMultiplier: 1.32,
    streamVelocityMultiplier: 1.28,
    pureSalesMultiplier: 0.95,
    mixtapeModel: 'commercial',
    defaultSuffix: '(Mixtape)',
    perks: [
      '100% monetization across streaming platforms and digital storefronts',
      'Full Billboard 200 chart eligibility at a fraction of studio LP cost',
      '+28% streaming velocity with flexible 5–20 track curation'
    ]
  },

  // REMASTER VARIANTS
  {
    id: 'remaster_24bit',
    parentFormat: 'remaster',
    name: '24-Bit / 192kHz Anniversary Remaster',
    badgeLabel: '24-BIT REMASTER',
    subtitle: 'High-resolution analog tape restoration + optional unreleased vault cuts',
    upfrontCost: 12_000,
    qualityBonus: 5,
    hypeMultiplier: 1.24,
    streamVelocityMultiplier: 1.2,
    pureSalesMultiplier: 1.6,
    defaultSuffix: '(Remastered)',
    perks: [
      'Permanently upgrades audio quality of all included parent album tracks (+4 Quality)',
      '1.60x Pure Sales multiplier from anniversary vinyl reissues',
      'Breathes new chart life into classic catalog albums'
    ]
  },
  {
    id: 'remaster_spatial_vault',
    parentFormat: 'remaster',
    name: 'Dolby Atmos Spatial Master + "From The Vault" Disc',
    badgeLabel: 'ATMOS + VAULT EDITION',
    subtitle: 'Definitive archival reissue pairing spatial audio with 1–6 prized vault songs',
    upfrontCost: 18_500,
    qualityBonus: 7,
    hypeMultiplier: 1.38,
    streamVelocityMultiplier: 1.35,
    pureSalesMultiplier: 1.78,
    defaultSuffix: '(Deluxe Anniversary Edition)',
    perks: [
      '+7 Project Quality bonus and +5 permanent track quality upgrade',
      '1.78x Pure Sales & 1.35x Streaming Velocity from "From The Vault" fan demand',
      'Featured placement on DSP Spatial Audio & Classics banners'
    ]
  },

  // COMPILATION VARIANTS
  {
    id: 'comp_greatest_hits',
    parentFormat: 'compilation',
    name: 'Essential Greatest Hits: The Singles Anthology',
    badgeLabel: 'GREATEST HITS',
    subtitle: 'Definitive career retrospective bundling your highest-streaming released hits',
    upfrontCost: 8_000,
    qualityBonus: 3,
    hypeMultiplier: 1.2,
    streamVelocityMultiplier: 1.18,
    pureSalesMultiplier: 1.55,
    defaultSuffix: ': Greatest Hits',
    perks: [
      'Bundles 6–25 career hits into an evergreen passive-income catalog juggernaut',
      '1.55x Pure Sales multiplier from holiday & collector physical sales',
      'Attracts new generation listeners to your back catalog'
    ]
  },
  {
    id: 'comp_bsides_rarities',
    parentFormat: 'compilation',
    name: 'B-Sides, Demos & Unreleased Rarities Box',
    badgeLabel: 'B-SIDES & RARITIES',
    subtitle: 'Curated deep-cuts, loosies, and studio vault sessions for hardcore fans',
    upfrontCost: 9_500,
    qualityBonus: 4,
    hypeMultiplier: 1.28,
    streamVelocityMultiplier: 1.22,
    pureSalesMultiplier: 1.62,
    defaultSuffix: ': B-Sides & Rarities',
    perks: [
      'Can freely mix unreleased studio vault recordings and released deep cuts',
      '1.62x Pure Sales multiplier from collector box set demand',
      '+28% Hype boost among core fanbase'
    ]
  },
  {
    id: 'comp_live_symphony',
    parentFormat: 'compilation',
    name: 'Live Symphony & Acoustic Sessions Anthology',
    badgeLabel: 'LIVE & ACOUSTIC LP',
    subtitle: 'Stripped-back acoustic & orchestral re-recordings of signature catalog songs',
    upfrontCost: 11_000,
    qualityBonus: 5,
    hypeMultiplier: 1.25,
    streamVelocityMultiplier: 1.16,
    pureSalesMultiplier: 1.58,
    defaultSuffix: ' (Live & Acoustic)',
    perks: [
      '+5 Project Quality boost from live orchestral arrangement prestige',
      'Strong Grammy / critical acclaim profile and 1.58x Pure Sales',
      'Extends the lifespan of your biggest singles'
    ]
  }
];

export const EXTENDED_PROJECT_FORMATS: ProjectFormatDefinition[] = [
  {
    id: 'single_pack',
    name: 'Single Pack',
    shortLabel: 'Single Pack',
    minTracks: 1,
    maxTracks: 3,
    trackRangeLabel: '1–3 Tracks',
    requiresParentAlbum: false,
    allowsUnreleasedTracks: true,
    allowsReleasedTracks: true,
    upfrontPackagingCost: 0,
    hypeMultiplier: 1.0,
    streamVelocityMultiplier: 1.0,
    pureSalesMultiplier: 0.9,
    description: 'Maxi-single bundle or A-Side / B-Side pairing for rapid streaming velocity.',
    icon: 'ph-disc'
  },
  {
    id: 'ep',
    name: 'Extended Play (EP)',
    shortLabel: 'EP',
    minTracks: 3,
    maxTracks: 8,
    trackRangeLabel: '3–8 Tracks',
    requiresParentAlbum: false,
    allowsUnreleasedTracks: true,
    allowsReleasedTracks: true,
    upfrontPackagingCost: 0,
    hypeMultiplier: 1.08,
    streamVelocityMultiplier: 1.02,
    pureSalesMultiplier: 1.0,
    description: 'Cohesive mini-project that builds core fanbase loyalty and chart presence.',
    icon: 'ph-vinyl-record'
  },
  {
    id: 'album',
    name: 'Studio Album (LP)',
    shortLabel: 'Studio Album',
    minTracks: 8,
    maxTracks: 30,
    trackRangeLabel: '8+ Tracks',
    requiresParentAlbum: false,
    allowsUnreleasedTracks: true,
    allowsReleasedTracks: true,
    upfrontPackagingCost: 0,
    hypeMultiplier: 1.2,
    streamVelocityMultiplier: 1.1,
    pureSalesMultiplier: 1.35,
    description: 'Full-length era statement. Maximizes pure album sales, tour demand, and Billboard 200 dominance.',
    icon: 'ph-albums'
  },
  {
    id: 'mixtape',
    name: 'Mixtape (Street or Commercial)',
    shortLabel: 'Mixtape',
    minTracks: 5,
    maxTracks: 20,
    trackRangeLabel: '5–20 Tracks',
    requiresParentAlbum: false,
    allowsUnreleasedTracks: true,
    allowsReleasedTracks: true,
    upfrontPackagingCost: 0,
    hypeMultiplier: 1.35,
    streamVelocityMultiplier: 1.15,
    pureSalesMultiplier: 0.72,
    description: 'High-momentum tape with lower distribution overhead, street credibility, and surging fan growth.',
    icon: 'ph-cassette-tape'
  },
  {
    id: 'deluxe',
    name: 'Deluxe Edition Upgrade',
    shortLabel: 'Deluxe Edition',
    minTracks: 2,
    maxTracks: 8,
    trackRangeLabel: '2–8 Bonus Tracks',
    requiresParentAlbum: true,
    allowsUnreleasedTracks: true,
    allowsReleasedTracks: false,
    upfrontPackagingCost: 6_500,
    hypeMultiplier: 1.28,
    streamVelocityMultiplier: 1.24,
    pureSalesMultiplier: 1.42,
    description: 'Attaches newly recorded bonus tracks to an existing released Studio Album, combining total Billboard 200 units.',
    icon: 'ph-sparkle'
  },
  {
    id: 'remaster',
    name: 'Anniversary & Remastered Edition',
    shortLabel: 'Remastered Edition',
    minTracks: 1,
    maxTracks: 6,
    trackRangeLabel: 'Parent Album + 1–6 Vault Tracks',
    requiresParentAlbum: true,
    allowsUnreleasedTracks: true,
    allowsReleasedTracks: true,
    upfrontPackagingCost: 12_000,
    hypeMultiplier: 1.22,
    streamVelocityMultiplier: 1.18,
    pureSalesMultiplier: 1.55,
    description: '24-bit Spatial Audio remaster of a catalog album with optional vault tracks, revitalizing pure sales and catalog streams.',
    icon: 'ph-speaker-high'
  },
  {
    id: 'compilation',
    name: 'Greatest Hits / Compilation',
    shortLabel: 'Greatest Hits',
    minTracks: 6,
    maxTracks: 25,
    trackRangeLabel: '6–25 Hit Tracks',
    requiresParentAlbum: false,
    allowsUnreleasedTracks: true,
    allowsReleasedTracks: true,
    upfrontPackagingCost: 8_000,
    hypeMultiplier: 1.15,
    streamVelocityMultiplier: 1.12,
    pureSalesMultiplier: 1.48,
    description: 'Curated career retrospective bundling your biggest released singles into a high-margin catalog anthology.',
    icon: 'ph-trophy'
  }
];

export function getProjectFormatMeta(type?: string): ProjectFormatDefinition {
  return (
    EXTENDED_PROJECT_FORMATS.find(f => f.id === type) ||
    EXTENDED_PROJECT_FORMATS[2]
  );
}

export function getVariantsForFormat(
  format: 'deluxe' | 'mixtape' | 'remaster' | 'compilation'
): AdvancedEditionVariantSpec[] {
  return ADVANCED_EDITION_VARIANTS.filter(v => v.parentFormat === format);
}

export function getEditionVariantById(
  variantId?: AdvancedEditionVariantId
): AdvancedEditionVariantSpec | undefined {
  if (!variantId) return undefined;
  return ADVANCED_EDITION_VARIANTS.find(v => v.id === variantId);
}

export function getEditionEngineerById(
  engineerId?: EditionAudioEngineerId
): EditionAudioEngineerSpec {
  return (
    EDITION_AUDIO_ENGINEERS.find(e => e.id === engineerId) ||
    EDITION_AUDIO_ENGINEERS[0]
  );
}

export function formatProjectTypeBadge(project: Project): string {
  const customBadge = (project as any).editionVariantBadge as string | undefined;
  if (customBadge) return customBadge;

  const rawType = project.type as ExtendedProjectFormatType;
  if (rawType === 'mixtape') {
    const model = (project as any).mixtapeModel as MixtapeReleaseModel | undefined;
    return model === 'free_street' ? 'Free Street Mixtape' : 'Commercial Mixtape';
  }
  if (rawType === 'deluxe') return 'Deluxe Edition LP';
  if (rawType === 'remaster') return 'Anniversary Remaster';
  if (rawType === 'compilation') return 'Greatest Hits Anthology';
  if (rawType === 'album') return 'Studio Album';
  if (rawType === 'ep') return 'EP';
  return 'Single Pack';
}

export function createAdvancedEditionProject(params: {
  state: GameState;
  format: 'deluxe' | 'mixtape' | 'remaster' | 'compilation';
  title: string;
  cover?: string | null;
  parentProjectId?: number | null;
  selectedSongIds: number[];
  mixtapeModel?: MixtapeReleaseModel;
  variantId?: AdvancedEditionVariantId;
  engineerId?: EditionAudioEngineerId;
  linerNotes?: string;
}): {
  success: boolean;
  message: string;
  updatedState: GameState;
} {
  const {
    state,
    format,
    title,
    cover,
    parentProjectId,
    selectedSongIds,
    mixtapeModel = 'commercial',
    variantId,
    engineerId = 'standard_inhouse',
    linerNotes
  } = params;

  const formatDef = getProjectFormatMeta(format);
  const variantSpec =
    getEditionVariantById(variantId) || getVariantsForFormat(format)[0];
  const engineerSpec = getEditionEngineerById(engineerId);

  const resolvedMixtapeModel: MixtapeReleaseModel =
    format === 'mixtape'
      ? variantSpec?.mixtapeModel || mixtapeModel
      : mixtapeModel;

  const currentMoney = Number(state.money) || 0;
  const basePackagingCost = variantSpec
    ? variantSpec.upfrontCost
    : format === 'mixtape' && resolvedMixtapeModel === 'free_street'
    ? 0
    : formatDef.upfrontPackagingCost;

  const effectiveUpfrontCost = basePackagingCost + engineerSpec.fee;

  if (currentMoney < effectiveUpfrontCost) {
    return {
      success: false,
      message: `Insufficient funds for ${variantSpec?.name || formatDef.name} & ${engineerSpec.name} ($${effectiveUpfrontCost.toLocaleString()} required).`,
      updatedState: state
    };
  }

  const parentProject =
    parentProjectId != null
      ? (state.projects || []).find(p => p.id === parentProjectId) || null
      : null;

  if ((format === 'deluxe' || format === 'remaster') && !parentProject) {
    return {
      success: false,
      message: `Please select a released parent album from your catalog to package a ${formatDef.name}.`,
      updatedState: state
    };
  }

  const selectedSongs = selectedSongIds
    .map(id => (state.songs || []).find(s => s.id === id))
    .filter((s): s is Song => Boolean(s));

  if (format === 'deluxe') {
    if (selectedSongs.length < 2 || selectedSongs.length > 8) {
      return {
        success: false,
        message: 'Deluxe Edition requires between 2 and 8 bonus tracks.',
        updatedState: state
      };
    }
  } else if (format === 'mixtape') {
    if (selectedSongs.length < 5 || selectedSongs.length > 20) {
      return {
        success: false,
        message: 'A Mixtape requires between 5 and 20 tracks.',
        updatedState: state
      };
    }
  } else if (format === 'remaster') {
    if (selectedSongs.length < 1 || selectedSongs.length > 6) {
      return {
        success: false,
        message: 'Anniversary Remaster requires between 1 and 6 Vault / Bonus tracks to accompany the parent album.',
        updatedState: state
      };
    }
  } else if (format === 'compilation') {
    if (selectedSongs.length < 6 || selectedSongs.length > 25) {
      return {
        success: false,
        message: 'Greatest Hits / Compilation requires between 6 and 25 tracks.',
        updatedState: state
      };
    }
  }

  // Build combined tracklist for Deluxe & Remaster (Parent tracks + new bonus/vault tracks)
  let combinedSongs: Song[] = [];
  if ((format === 'deluxe' || format === 'remaster') && parentProject) {
    const existingIds = new Set((parentProject.songs || []).map(s => s.id));
    const bonusTracks = selectedSongs.filter(s => !existingIds.has(s.id));
    combinedSongs = [...(parentProject.songs || []), ...bonusTracks];
  } else {
    combinedSongs = selectedSongs;
  }

  if (combinedSongs.length === 0) {
    return {
      success: false,
      message: 'Please select tracks to include in this edition.',
      updatedState: state
    };
  }

  const rawAvgQuality =
    combinedSongs.reduce((sum, s) => sum + (Number(s.quality) || 65), 0) /
    combinedSongs.length;

  const editionQualityBonus =
    (variantSpec?.qualityBonus ?? (format === 'remaster' ? 5 : format === 'deluxe' ? 3 : 2)) +
    engineerSpec.qualityBonus;

  const finalQuality = Math.min(100, Math.round(rawAvgQuality + editionQualityBonus));

  const resolvedTitle =
    title.trim() ||
    (parentProject
      ? `${parentProject.title} ${variantSpec?.defaultSuffix || (format === 'deluxe' ? '(Deluxe)' : '(Remastered)')}`
      : `${state.artist?.name || 'Artist'}${variantSpec?.defaultSuffix || ' Anthology'}`);

  const resolvedCover =
    cover ||
    parentProject?.cover ||
    resolveAuthenticCover(state.artist?.name || 'Artist', resolvedTitle);

  const effectiveHypeMult = Number(
    ((variantSpec?.hypeMultiplier || formatDef.hypeMultiplier) *
      (1 + engineerSpec.hypeBonusPct / 100)).toFixed(2)
  );
  const effectiveStreamMult = Number(
    (variantSpec?.streamVelocityMultiplier || formatDef.streamVelocityMultiplier).toFixed(2)
  );
  const effectiveSalesMult = Number(
    ((variantSpec?.pureSalesMultiplier || formatDef.pureSalesMultiplier) *
      (1 + engineerSpec.salesBonusPct / 100)).toFixed(2)
  );

  const newProjId = state.projectIdCounter || (state.projects?.length || 0) + 1;
  const newProject: Project = {
    id: newProjId,
    title: resolvedTitle,
    type: format as any,
    cover: resolvedCover,
    songs: combinedSongs.map(s => ({
      ...s,
      status: s.status === 'released' ? ('released' as const) : ('packaged' as const)
    })),
    status: 'created',
    quality: finalQuality,
    basePotential: parentProject
      ? Math.round((parentProject.basePotential || 55) * 1.18)
      : Math.round(finalQuality * 0.85),
    momentum: Number((1.22 * (effectiveHypeMult / 1.2)).toFixed(2)),
    pureSales: 0,
    weeklyPureSales: 0,
    parentProjectId: parentProject?.id,
    parentAlbumTitle: parentProject?.title,
    bonusTrackIds: selectedSongs.map(s => s.id),
    mixtapeModel: format === 'mixtape' ? resolvedMixtapeModel : undefined,
    editionVariantId: variantSpec?.id,
    editionVariantBadge: variantSpec?.badgeLabel,
    audioEngineerId: engineerSpec.id,
    audioEngineerName: engineerSpec.name,
    linerNotes: linerNotes?.trim() || undefined,
    customMultipliers: {
      hypeMultiplier: effectiveHypeMult,
      streamVelocityMultiplier: effectiveStreamMult,
      pureSalesMultiplier: effectiveSalesMult
    }
  } as any;

  const packagedIds = new Set(selectedSongs.map(s => s.id));
  const parentSongIds = new Set((parentProject?.songs || []).map(s => s.id));

  const nextSongs = (state.songs || []).map(s => {
    const isSelectedBonus = packagedIds.has(s.id);
    const isParentTrack = parentSongIds.has(s.id);
    if (!isSelectedBonus && !isParentTrack) return s;

    const qualityBump =
      format === 'remaster'
        ? Math.min(100, (s.quality || 65) + 4 + engineerSpec.qualityBonus)
        : isSelectedBonus
        ? Math.min(100, (s.quality || 65) + engineerSpec.qualityBonus)
        : s.quality;

    return {
      ...s,
      quality: qualityBump,
      status: s.status === 'released' ? ('released' as const) : ('packaged' as const)
    };
  });

  // Also revitalize parent album momentum if this is a Deluxe or Remaster
  const nextProjects = (state.projects || []).map(p => {
    if (parentProject && p.id === parentProject.id) {
      return {
        ...p,
        momentum: Number(Math.min(2.5, (Number(p.momentum) || 1.0) + 0.2).toFixed(2))
      };
    }
    return p;
  });

  return {
    success: true,
    message: `Packaged "${resolvedTitle}" (${variantSpec?.badgeLabel || formatProjectTypeBadge(newProject)} · ${combinedSongs.length} total tracks, ${finalQuality}/100 Master Quality via ${engineerSpec.name})! Head to the Release Studio to launch it.`,
    updatedState: {
      ...state,
      money: Math.max(0, currentMoney - effectiveUpfrontCost),
      songs: nextSongs,
      projects: [...nextProjects, newProject],
      projectIdCounter: newProjId + 1
    }
  };
}
