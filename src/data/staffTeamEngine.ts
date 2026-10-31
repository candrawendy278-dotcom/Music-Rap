import { GameState, Song } from '../types';

export type StaffRoleId =
  | 'manager'
  | 'publicist'
  | 'producer'
  | 'tour_agent'
  | 'radio_plugger'
  | 'creative_director';

export type StaffTier = 1 | 2 | 3;

export type StaffPayrollCycle = 'daily' | 'monthly' | 'yearly';

export type StaffContractTermMonths = 6 | 12 | 24 | 36;

export interface StaffRoleDefinition {
  id: StaffRoleId;
  title: string;
  shortTitle: string;
  department: string;
  icon: string;
  accentColor: string;
  description: string;
  autonomousDuties: string[];
  deliverableName: string;
  deliverableCode: string;
  deliverableDescription: string;
  autonomousCycleDays: number;
}

export interface StaffCandidate {
  id: string;
  roleId: StaffRoleId;
  tier: StaffTier;
  tierLabel: 'Junior' | 'Veteran' | 'Elite';
  name: string;
  initials: string;
  agencyTitle: string;
  bio: string;
  specialtyTag: string;
  preferredCycle: StaffPayrollCycle;
  preferredTermMonths: StaffContractTermMonths;
  signingBonus: number;
  /** Target daily equivalent rate used to derive daily, monthly (30d), and annual (365d) salary ranges */
  baseDailyRate: number;
  /** Minimum acceptable daily equivalent rate */
  minDailyRate: number;
  /** Maximum / generous ceiling daily equivalent rate */
  maxDailyRate: number;
  minPopularity: number;
  workMetrics: {
    overheadReductionPct: number;      // Manager: reduces recurring living, studio & management expenses
    dealNegotiationPower: number;      // Manager: negotiates commercial sync/licensing deals autonomously
    hypeProtectionPct: number;         // Publicist: prevents daily hype decay & protects public image
    pressReachPower: number;           // Publicist: organizes autonomous press briefings & media features
    studioQualityBonus: number;        // Producer: improves song Quality & potential in Studio
    masteringPolishPower: number;      // Producer: autonomous studio mix & master calibration points
    tourLogisticsSavingsPct: number;   // Tour Agent: lowers tour operational overhead
    venueBookingPower: number;         // Tour Agent: books private showcases & promoter guarantees
    radioServicingPower: number;       // Radio Plugger: services singles to radio stations daily
    playlistPitchSuccessPct: number;   // Radio Plugger: pitches tracks to Spotify editorial playlists
    visualMomentumBonus: number;       // Creative Director: strengthens MV/Visualizer campaign momentum
    campaignDurationBonusDays: number; // Creative Director: extends MV promotional campaign longevity
  };
}

export interface StaffContractProposal {
  candidateId: string;
  payrollCycle: StaffPayrollCycle;
  offeredSalaryPerCycle: number;
  signingBonus: number;
  termMonths: StaffContractTermMonths;
}

export interface HiredStaffMember {
  candidateId: string;
  roleId: StaffRoleId;
  tier: StaffTier;
  tierLabel: 'Junior' | 'Veteran' | 'Elite';
  name: string;
  initials: string;
  agencyTitle: string;
  specialtyTag: string;
  hiredDate: string;
  /** Contract & Payroll terms negotiated at signing */
  payrollCycle: StaffPayrollCycle;
  agreedSalaryPerCycle: number;
  dailyRetainer: number; // Daily equivalent for reference
  nextPaydayDaysLeft: number;
  contractTermMonths: StaffContractTermMonths;
  contractTotalDays: number;
  contractDaysRemaining: number;
  /** Progression & Autonomous Work state */
  level: number;        // 1 to 10
  xp: number;           // 0 to xpToNextLevel
  xpToNextLevel: number;
  loyalty: number;      // 0 to 100
  autonomousProgressDays: number;
  autonomousCycleTargetDays: number;
  currentTaskLabel: string;
  focusSongId?: number;
  activeDirectiveDaysLeft: number;
  totalDeliverablesCompleted: number;
}

export interface StaffActionLogItem {
  id: string;
  date: string;
  roleId: StaffRoleId;
  staffName: string;
  title: string;
  detail: string;
  category: 'contract' | 'autonomous_work' | 'payroll' | 'level_up' | 'bonus' | 'release';
}

export interface StaffTeamState {
  roster: Partial<Record<StaffRoleId, HiredStaffMember>>;
  actionLogs: StaffActionLogItem[];
  totalPayrollPaid: number;
  totalDeliverablesRun: number;
  lastProcessedDate?: string;
}

export interface StaffTeamSynergySummary {
  hiredCount: number;
  totalRoles: number;
  synergyTierLabel: 'Independent Setup' | 'Core Department (+5% Efficiency)' | 'Full Executive Team (+12% Efficiency)';
  synergyBonusMultiplier: number; // 1.0, 1.05, or 1.12
  /** Sum of daily retainers ONLY for staff on 'daily' payroll cycle (deducted daily) */
  totalDailyCyclePayroll: number;
  /** Pro-rata daily equivalent across all hired staff (for financial overview) */
  totalDailyEquivalentCost: number;
  expenseReductionPct: number;
  hypeRetentionBonusPct: number;
  qualityBonusPoints: number;
  tourLogisticsSavingsPct: number;
  radioServicingPower: number;
  playlistPitchChancePct: number;
  visualMomentumBonus: number;
  activePrShieldDays: number;
}

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

export const STAFF_ROLE_DEFINITIONS: Record<StaffRoleId, StaffRoleDefinition> = {
  manager: {
    id: 'manager',
    title: 'Personal Artist Manager',
    shortTitle: 'Manager',
    department: 'Business & Contract Operations',
    icon: 'ph-briefcase',
    accentColor: 'text-amber-400',
    description: 'Handles your daily business administration, audits operational expenses, and autonomously closes commercial sync/licensing deals.',
    autonomousDuties: [
      'Continuously audits and reduces daily living, studio, and management overhead costs',
      'Autonomously negotiates commercial sync & brand licensing settlements every cycle',
      'Monitors contract compliance and distributor recoupment efficiency',
    ],
    deliverableName: 'Commercial Sync & Overhead Audit',
    deliverableCode: 'MGR-AUTO',
    deliverableDescription: 'Automatically negotiates licensing/sync settlements and locks in operational overhead savings.',
    autonomousCycleDays: 10,
  },
  publicist: {
    id: 'publicist',
    title: 'Head PR Publicist',
    shortTitle: 'PR Publicist',
    department: 'Public Relations & Media Press',
    icon: 'ph-megaphone-simple',
    accentColor: 'text-purple-400',
    description: 'Manages press relations, protects your artist reputation from media controversies, and autonomously secures magazine/blog press briefings.',
    autonomousDuties: [
      'Stabilizes daily artist Hype so momentum does not rapidly decay between releases',
      'Autonomously coordinates press features and media briefings every cycle',
      'Maintains an active PR reputation shield against controversy',
    ],
    deliverableName: 'Media Press Feature & PR Shield',
    deliverableCode: 'PR-AUTO',
    deliverableDescription: 'Automatically secures press coverage to boost artist Hype and refreshes your media reputation shield.',
    autonomousCycleDays: 9,
  },
  producer: {
    id: 'producer',
    title: 'In-House Producer & Sound Engineer',
    shortTitle: 'Producer / Eng',
    department: 'Studio & Master Engineering',
    icon: 'ph-sliders-horizontal',
    accentColor: 'text-emerald-400',
    description: 'Works directly in your Studio every day to oversee songwriting arrangements, vocal chains, and autonomous master calibration.',
    autonomousDuties: [
      'Polishes songs currently in writing/recording in the Studio every day',
      'Autonomously runs studio mixing & master calibration sessions to raise Track Quality & Potential',
      'Maintains reference-grade sonic standards across your catalog',
    ],
    deliverableName: 'Studio Mix & Master Calibration',
    deliverableCode: 'STU-AUTO',
    deliverableDescription: 'Automatically calibrates and upgrades the Quality and Base Potential of your Studio/catalog tracks.',
    autonomousCycleDays: 8,
  },
  tour_agent: {
    id: 'tour_agent',
    title: 'Tour & Live Booking Agent',
    shortTitle: 'Tour Agent',
    department: 'Live Routing & Venue Logistics',
    icon: 'ph-globe-hemisphere-west',
    accentColor: 'text-sky-400',
    description: 'Manages concert routing, reduces travel/production logistics costs on tour, and autonomously books private industry showcases.',
    autonomousDuties: [
      'Optimizes tour routing and cuts transport/venue logistics expenses during active World Tours',
      'Autonomously books private showcase appearances and corporate live guarantees',
      'Strengthens international promoter relationships',
    ],
    deliverableName: 'Private Showcase & Routing Settlement',
    deliverableCode: 'TOUR-AUTO',
    deliverableDescription: 'Automatically secures live showcase appearance guarantees and optimizes tour logistics.',
    autonomousCycleDays: 11,
  },
  radio_plugger: {
    id: 'radio_plugger',
    title: 'Radio & DSP Playlist Plugger',
    shortTitle: 'Radio Plugger',
    department: 'Airplay Servicing & DSP Pitching',
    icon: 'ph-broadcast',
    accentColor: 'text-cyan-400',
    description: 'Services your released singles to radio stations daily and autonomously pitches tracks to Spotify editorial playlist curators.',
    autonomousDuties: [
      'Services active singles to national and regional radio stations for daily airplay spins',
      'Autonomously pitches released singles to Spotify editorial playlists every cycle',
      'Protects playlist tenure and tracks radio callout response',
    ],
    deliverableName: 'Editorial Playlist & Radio Add Push',
    deliverableCode: 'RAD-AUTO',
    deliverableDescription: 'Automatically pitches your active single to editorial playlists and secures fresh radio rotation spins.',
    autonomousCycleDays: 7,
  },
  creative_director: {
    id: 'creative_director',
    title: 'Visual & Era Creative Director',
    shortTitle: 'Creative Director',
    department: 'Visual Direction & Era Aesthetics',
    icon: 'ph-film-slate',
    accentColor: 'text-rose-400',
    description: 'Directs music video treatments, visualizers, and cohesive visual identity, autonomously extending MV campaigns and era momentum.',
    autonomousDuties: [
      'Maintains visual momentum across all active releases with Music Videos or Visualizers',
      'Autonomously produces visual treatments, activates Visualizers, and extends MV ad campaigns',
      'Oversees cohesive art direction for your current era',
    ],
    deliverableName: 'Visual Treatment & MV Campaign Push',
    deliverableCode: 'VIS-AUTO',
    deliverableDescription: 'Automatically produces visual treatments, activates Visualizers, and extends MV campaign longevity.',
    autonomousCycleDays: 9,
  },
};

export const STAFF_ROLE_ORDER: StaffRoleId[] = [
  'manager',
  'publicist',
  'producer',
  'tour_agent',
  'radio_plugger',
  'creative_director',
];

export const STAFF_CANDIDATE_POOL: StaffCandidate[] = [
  // 1. MANAGER
  {
    id: 'mgr_tier_1',
    roleId: 'manager',
    tier: 1,
    tierLabel: 'Junior',
    name: 'Marcus Vance',
    initials: 'MV',
    agencyTitle: 'Boutique Artist Management',
    bio: 'Former indie tour road-manager who audits every studio and travel invoice to keep your daily burn rate under control.',
    specialtyTag: '-8% Overhead • Sync Deal Desk',
    preferredCycle: 'daily',
    preferredTermMonths: 6,
    signingBonus: 18000,
    baseDailyRate: 1350,
    minDailyRate: 1000,
    maxDailyRate: 1850,
    minPopularity: 0,
    workMetrics: {
      overheadReductionPct: 8,
      dealNegotiationPower: 1.2,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'mgr_tier_2',
    roleId: 'manager',
    tier: 2,
    tierLabel: 'Veteran',
    name: 'Elena Rostova',
    initials: 'ER',
    agencyTitle: 'Vanguard Talent Group',
    bio: 'Seasoned executive manager who restructures vendor contracts and autonomously closes high-value commercial sync deals.',
    specialtyTag: '-16% Overhead • Veteran Sync Desk',
    preferredCycle: 'monthly',
    preferredTermMonths: 12,
    signingBonus: 115000,
    baseDailyRate: 7200,
    minDailyRate: 5600,
    maxDailyRate: 9600,
    minPopularity: 22,
    workMetrics: {
      overheadReductionPct: 16,
      dealNegotiationPower: 2.6,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'mgr_tier_3',
    roleId: 'manager',
    tier: 3,
    tierLabel: 'Elite',
    name: 'Sterling Thorne',
    initials: 'ST',
    agencyTitle: 'Crown Sovereign Management',
    bio: 'Industry powerhouse mogul who commands massive brand licensing settlements and runs a global executive empire.',
    specialtyTag: '-25% Overhead • Global Mogul Desk',
    preferredCycle: 'yearly',
    preferredTermMonths: 24,
    signingBonus: 520000,
    baseDailyRate: 32000,
    minDailyRate: 25000,
    maxDailyRate: 44000,
    minPopularity: 52,
    workMetrics: {
      overheadReductionPct: 25,
      dealNegotiationPower: 5.0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },

  // 2. PUBLICIST
  {
    id: 'pr_tier_1',
    roleId: 'publicist',
    tier: 1,
    tierLabel: 'Junior',
    name: 'Chloe Lin',
    initials: 'CL',
    agencyTitle: 'Pulse Digital Press',
    bio: 'Dedicated music blog publicist who secures indie press mentions and keeps your public Hype steady.',
    specialtyTag: '+12% Hype Stability • Indie Press',
    preferredCycle: 'daily',
    preferredTermMonths: 6,
    signingBonus: 15000,
    baseDailyRate: 1150,
    minDailyRate: 850,
    maxDailyRate: 1550,
    minPopularity: 0,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 12,
      pressReachPower: 1,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'pr_tier_2',
    roleId: 'publicist',
    tier: 2,
    tierLabel: 'Veteran',
    name: 'Julian Mercer',
    initials: 'JM',
    agencyTitle: 'Mercer & Slate Communications',
    bio: 'Veteran entertainment publicist with direct lines to major music magazines, culture editors, and talk shows.',
    specialtyTag: '+24% Hype Stability • National Media',
    preferredCycle: 'monthly',
    preferredTermMonths: 12,
    signingBonus: 95000,
    baseDailyRate: 6200,
    minDailyRate: 4800,
    maxDailyRate: 8200,
    minPopularity: 20,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 24,
      pressReachPower: 2.1,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'pr_tier_3',
    roleId: 'publicist',
    tier: 3,
    tierLabel: 'Elite',
    name: 'Celeste St. Clair',
    initials: 'CS',
    agencyTitle: 'Aether Global PR',
    bio: 'Crisis-proof image architect who shields A-list superstars from controversy and commands global cover stories.',
    specialtyTag: '+38% Hype Stability • Global Cover PR',
    preferredCycle: 'yearly',
    preferredTermMonths: 24,
    signingBonus: 420000,
    baseDailyRate: 26500,
    minDailyRate: 21000,
    maxDailyRate: 36000,
    minPopularity: 48,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 38,
      pressReachPower: 3.5,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },

  // 3. PRODUCER / ENGINEER
  {
    id: 'prod_tier_1',
    roleId: 'producer',
    tier: 1,
    tierLabel: 'Junior',
    name: 'Devon "Koda" Brooks',
    initials: 'DB',
    agencyTitle: 'Bedroom-to-Billboard Audio',
    bio: 'In-house tracking and mix engineer who tightens vocal takes and raises the baseline Quality of your Studio recordings.',
    specialtyTag: '+5 Studio Track Quality • Vocal Mixing',
    preferredCycle: 'daily',
    preferredTermMonths: 6,
    signingBonus: 24000,
    baseDailyRate: 1600,
    minDailyRate: 1200,
    maxDailyRate: 2200,
    minPopularity: 0,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 5,
      masteringPolishPower: 4,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'prod_tier_2',
    roleId: 'producer',
    tier: 2,
    tierLabel: 'Veteran',
    name: 'Henrik Lindqvist',
    initials: 'HL',
    agencyTitle: 'Stockholm Sonic Lab',
    bio: 'Acclaimed Scandinavian vocal producer and mastering engineer who elevates hook structure and sonic depth in the Studio.',
    specialtyTag: '+10 Studio Track Quality • Analog Master',
    preferredCycle: 'monthly',
    preferredTermMonths: 12,
    signingBonus: 135000,
    baseDailyRate: 8400,
    minDailyRate: 6500,
    maxDailyRate: 11200,
    minPopularity: 25,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 10,
      masteringPolishPower: 7,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'prod_tier_3',
    roleId: 'producer',
    tier: 3,
    tierLabel: 'Elite',
    name: 'Dante "Apex" Moretti',
    initials: 'DM',
    agencyTitle: 'Abbey & Sunset Mastering',
    bio: 'Grammy-winning executive producer who works hands-on in your Studio to craft reference-grade master recordings.',
    specialtyTag: '+16 Studio Track Quality • Reference Lab',
    preferredCycle: 'yearly',
    preferredTermMonths: 24,
    signingBonus: 620000,
    baseDailyRate: 36000,
    minDailyRate: 28500,
    maxDailyRate: 48000,
    minPopularity: 55,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 16,
      masteringPolishPower: 12,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },

  // 4. TOUR AGENT
  {
    id: 'tour_tier_1',
    roleId: 'tour_agent',
    tier: 1,
    tierLabel: 'Junior',
    name: 'Samira Al-Mansoor',
    initials: 'SA',
    agencyTitle: 'Horizon Live Routing',
    bio: 'Road-tested booking agent who coordinates regional club routing, festival slots, and local venue logistics.',
    specialtyTag: '-10% Tour Logistics Cost • Club Routing',
    preferredCycle: 'daily',
    preferredTermMonths: 6,
    signingBonus: 17000,
    baseDailyRate: 1250,
    minDailyRate: 950,
    maxDailyRate: 1700,
    minPopularity: 0,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 10,
      venueBookingPower: 1.2,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'tour_tier_2',
    roleId: 'tour_agent',
    tier: 2,
    tierLabel: 'Veteran',
    name: 'Damon Kowalski',
    initials: 'DK',
    agencyTitle: 'Atlas Arena Touring',
    bio: 'International live agent who negotiates higher venue guarantees and streamlines multi-country tour production.',
    specialtyTag: '-20% Tour Logistics Cost • Arena Booking',
    preferredCycle: 'monthly',
    preferredTermMonths: 12,
    signingBonus: 110000,
    baseDailyRate: 7000,
    minDailyRate: 5400,
    maxDailyRate: 9400,
    minPopularity: 24,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 20,
      venueBookingPower: 2.5,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'tour_tier_3',
    roleId: 'tour_agent',
    tier: 3,
    tierLabel: 'Elite',
    name: 'Victoria Kensington',
    initials: 'VK',
    agencyTitle: 'Olympus Global Live',
    bio: 'Premier stadium tour architect who secures flagship festival headliners and top-tier global promoter settlements.',
    specialtyTag: '-32% Tour Logistics Cost • Global Stadiums',
    preferredCycle: 'yearly',
    preferredTermMonths: 24,
    signingBonus: 490000,
    baseDailyRate: 30000,
    minDailyRate: 24000,
    maxDailyRate: 41000,
    minPopularity: 50,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 32,
      venueBookingPower: 4.8,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },

  // 5. RADIO PLUGGER
  {
    id: 'radio_tier_1',
    roleId: 'radio_plugger',
    tier: 1,
    tierLabel: 'Junior',
    name: 'Ricky Santoro',
    initials: 'RS',
    agencyTitle: 'Airwave Indie Promotions',
    bio: 'Regional radio plugger who services your singles to FM stations and submits pitches to DSP playlist editors.',
    specialtyTag: 'Regional Radio Servicing • 28% Playlist Pitch',
    preferredCycle: 'daily',
    preferredTermMonths: 6,
    signingBonus: 19500,
    baseDailyRate: 1400,
    minDailyRate: 1050,
    maxDailyRate: 1900,
    minPopularity: 0,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 38,
      playlistPitchSuccessPct: 28,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'radio_tier_2',
    roleId: 'radio_plugger',
    tier: 2,
    tierLabel: 'Veteran',
    name: 'Simone Beauregard',
    initials: 'SB',
    agencyTitle: 'Syndicate Broadcast & DSP',
    bio: 'Trusted by national Top 40 program directors and Spotify/Apple editorial curators for priority single servicing.',
    specialtyTag: 'National Radio Servicing • 55% Playlist Pitch',
    preferredCycle: 'monthly',
    preferredTermMonths: 12,
    signingBonus: 108000,
    baseDailyRate: 6800,
    minDailyRate: 5300,
    maxDailyRate: 9100,
    minPopularity: 22,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 90,
      playlistPitchSuccessPct: 55,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },
  {
    id: 'radio_tier_3',
    roleId: 'radio_plugger',
    tier: 3,
    tierLabel: 'Elite',
    name: 'Lawrence "Kingpin" Bell',
    initials: 'LB',
    agencyTitle: 'PowerRotation Global Media',
    bio: 'Industry legend who secures flagship editorial playlist covers and heavy national radio power rotation.',
    specialtyTag: 'Global Power Rotation • 85% Playlist Pitch',
    preferredCycle: 'yearly',
    preferredTermMonths: 24,
    signingBonus: 460000,
    baseDailyRate: 28500,
    minDailyRate: 22500,
    maxDailyRate: 39000,
    minPopularity: 48,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 185,
      playlistPitchSuccessPct: 85,
      visualMomentumBonus: 0,
      campaignDurationBonusDays: 0,
    },
  },

  // 6. CREATIVE DIRECTOR
  {
    id: 'creative_tier_1',
    roleId: 'creative_director',
    tier: 1,
    tierLabel: 'Junior',
    name: 'Sora Takahashi',
    initials: 'ST',
    agencyTitle: 'Kinetix Visual Studio',
    bio: 'Visual editor and art director who crafts loopable visualizers, lyric videos, and cohesive single cover art.',
    specialtyTag: '+4 Visual Momentum • +3 Days MV Campaign',
    preferredCycle: 'daily',
    preferredTermMonths: 6,
    signingBonus: 16500,
    baseDailyRate: 1200,
    minDailyRate: 900,
    maxDailyRate: 1650,
    minPopularity: 0,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 4,
      campaignDurationBonusDays: 3,
    },
  },
  {
    id: 'creative_tier_2',
    roleId: 'creative_director',
    tier: 2,
    tierLabel: 'Veteran',
    name: 'Mateo Valiente',
    initials: 'MV',
    agencyTitle: 'Nocturne Cinema & Design',
    bio: 'Award-winning music video director who oversees high-impact visual eras, MV treatments, and stage design.',
    specialtyTag: '+8 Visual Momentum • +5 Days MV Campaign',
    preferredCycle: 'monthly',
    preferredTermMonths: 12,
    signingBonus: 102000,
    baseDailyRate: 6400,
    minDailyRate: 5000,
    maxDailyRate: 8600,
    minPopularity: 21,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 8,
      campaignDurationBonusDays: 5,
    },
  },
  {
    id: 'creative_tier_3',
    roleId: 'creative_director',
    tier: 3,
    tierLabel: 'Elite',
    name: 'Freya Lindholm',
    initials: 'FL',
    agencyTitle: 'Atelier Haus Creative',
    bio: 'Visionary world-building creative director behind iconic album eras, cinema-grade music videos, and visual rollouts.',
    specialtyTag: '+14 Visual Momentum • +8 Days MV Campaign',
    preferredCycle: 'yearly',
    preferredTermMonths: 24,
    signingBonus: 440000,
    baseDailyRate: 27500,
    minDailyRate: 21500,
    maxDailyRate: 37500,
    minPopularity: 46,
    workMetrics: {
      overheadReductionPct: 0,
      dealNegotiationPower: 0,
      hypeProtectionPct: 0,
      pressReachPower: 0,
      studioQualityBonus: 0,
      masteringPolishPower: 0,
      tourLogisticsSavingsPct: 0,
      venueBookingPower: 0,
      radioServicingPower: 0,
      playlistPitchSuccessPct: 0,
      visualMomentumBonus: 14,
      campaignDurationBonusDays: 8,
    },
  },
];

export function getCycleDaysCount(cycle: StaffPayrollCycle): number {
  if (cycle === 'yearly') return 365;
  if (cycle === 'monthly') return 30;
  return 1;
}

/**
 * Returns the candidate's salary range (min, target, max) for a chosen payroll cycle.
 * Monthly contracts include a 5% structure discount; Annual contracts include a 12% structure discount.
 */
export function getCandidateSalaryRangeForCycle(
  candidate: StaffCandidate,
  cycle: StaffPayrollCycle
): { min: number; target: number; max: number; cycleLabel: string; shortUnit: string } {
  if (cycle === 'daily') {
    return {
      min: candidate.minDailyRate,
      target: candidate.baseDailyRate,
      max: candidate.maxDailyRate,
      cycleLabel: 'Daily Disbursement Rate',
      shortUnit: '/day',
    };
  }
  if (cycle === 'monthly') {
    const mult = 30 * 0.95; // 5% monthly structure discount
    return {
      min: Math.round((candidate.minDailyRate * mult) / 500) * 500,
      target: Math.round((candidate.baseDailyRate * mult) / 500) * 500,
      max: Math.round((candidate.maxDailyRate * mult) / 500) * 500,
      cycleLabel: 'Monthly Executive Retainer (30 Days)',
      shortUnit: '/mo',
    };
  }
  const mult = 365 * 0.88; // 12% annual contract discount
  return {
    min: Math.round((candidate.minDailyRate * mult) / 5000) * 5000,
    target: Math.round((candidate.baseDailyRate * mult) / 5000) * 5000,
    max: Math.round((candidate.maxDailyRate * mult) / 5000) * 5000,
    cycleLabel: 'Annual Executive Compensation (365 Days)',
    shortUnit: '/yr',
  };
}

/**
 * Evaluates a player's contract proposal to a candidate and returns acceptance chance, initial loyalty, and feedback.
 */
export function evaluateStaffContractProposal(
  candidate: StaffCandidate,
  proposal: StaffContractProposal
): {
  acceptanceChancePct: number;
  initialLoyalty: number;
  reactionQuote: string;
  isAcceptable: boolean;
} {
  const range = getCandidateSalaryRangeForCycle(candidate, proposal.payrollCycle);
  if (proposal.offeredSalaryPerCycle < range.min) {
    return {
      acceptanceChancePct: 0,
      initialLoyalty: 40,
      reactionQuote: `"My agency floor for a ${candidate.tierLabel} ${STAFF_ROLE_DEFINITIONS[candidate.roleId].shortTitle} is $${range.min.toLocaleString()}${range.shortUnit}. We cannot execute below that threshold."`,
      isAcceptable: false,
    };
  }

  // Normalized position between min (0.0) and max (1.0)
  const salaryRatio = Math.max(
    0,
    Math.min(1.25, (proposal.offeredSalaryPerCycle - range.min) / Math.max(1, range.max - range.min))
  );

  // Bonus if payroll cycle matches candidate's preferred cycle
  const cycleMatchBonus = proposal.payrollCycle === candidate.preferredCycle ? 8 : 0;
  // Bonus if contract length matches or exceeds preferred length
  const termBonus =
    proposal.termMonths === candidate.preferredTermMonths
      ? 6
      : proposal.termMonths > candidate.preferredTermMonths
      ? 4
      : -4;

  const rawAcceptance = Math.round(58 + salaryRatio * 38 + cycleMatchBonus + termBonus);
  const acceptanceChancePct = Math.max(25, Math.min(100, rawAcceptance));
  const initialLoyalty = Math.max(
    68,
    Math.min(98, Math.round(72 + salaryRatio * 22 + (cycleMatchBonus > 0 ? 4 : 0)))
  );

  let reactionQuote = `"These terms reflect market value for my tier. I am prepared to sign and begin operations immediately."`;
  if (proposal.offeredSalaryPerCycle >= range.target * 1.08) {
    reactionQuote = `"A top-tier compensation package. My entire agency team will prioritize your career around the clock."`;
  } else if (proposal.offeredSalaryPerCycle < range.target * 0.94) {
    reactionQuote = `"This offer is below my standard market retainer, though I am open to considering it."`;
  }

  return {
    acceptanceChancePct,
    initialLoyalty,
    reactionQuote,
    isAcceptable: true,
  };
}

export function getEnsuredStaffState(state: GameState): StaffTeamState {
  const raw = (state as any).staffState;
  if (!raw || typeof raw !== 'object') {
    return {
      roster: {},
      actionLogs: [],
      totalPayrollPaid: 0,
      totalDeliverablesRun: 0,
    };
  }
  return {
    roster: raw.roster || {},
    actionLogs: Array.isArray(raw.actionLogs) ? raw.actionLogs : [],
    totalPayrollPaid: Number(raw.totalPayrollPaid || 0),
    totalDeliverablesRun: Number(raw.totalDeliverablesRun || raw.totalDirectivesRun || 0),
    lastProcessedDate: raw.lastProcessedDate,
  };
}

export function getCandidateById(candidateId: string): StaffCandidate | undefined {
  return STAFF_CANDIDATE_POOL.find((c) => c.id === candidateId);
}

/**
 * Computes the level & loyalty scaling multiplier for an individual hired staff member.
 */
export function getMemberEffectivenessMultiplier(member: HiredStaffMember): number {
  const levelScale = 1 + Math.max(0, Math.min(9, (member.level || 1) - 1)) * 0.05;
  const loyaltyScale =
    member.loyalty >= 85 ? 1.05 : member.loyalty < 40 ? 0.85 : 1.0;
  return Number((levelScale * loyaltyScale).toFixed(3));
}

export function calculateStaffTeamSynergyBuffs(state: GameState): StaffTeamSynergySummary {
  const staffState = getEnsuredStaffState(state);
  const hiredMembers = STAFF_ROLE_ORDER.map((r) => staffState.roster[r]).filter(
    (m): m is HiredStaffMember => Boolean(m)
  );
  const hiredCount = hiredMembers.length;

  let synergyBonusMultiplier = 1.0;
  let synergyTierLabel: StaffTeamSynergySummary['synergyTierLabel'] = 'Independent Setup';
  if (hiredCount >= 6) {
    synergyBonusMultiplier = 1.12;
    synergyTierLabel = 'Full Executive Team (+12% Efficiency)';
  } else if (hiredCount >= 3) {
    synergyBonusMultiplier = 1.05;
    synergyTierLabel = 'Core Department (+5% Efficiency)';
  }

  let totalDailyCyclePayroll = 0;
  let totalDailyEquivalentCost = 0;
  let expenseReductionPct = 0;
  let hypeRetentionBonusPct = 0;
  let qualityBonusPoints = 0;
  let tourLogisticsSavingsPct = 0;
  let radioServicingPower = 0;
  let playlistPitchChancePct = 0;
  let visualMomentumBonus = 0;
  let activePrShieldDays = 0;

  for (const member of hiredMembers) {
    const cycle = member.payrollCycle || 'daily';
    if (cycle === 'daily') {
      totalDailyCyclePayroll += member.agreedSalaryPerCycle || member.dailyRetainer;
    }
    totalDailyEquivalentCost += member.dailyRetainer || 0;

    const candidate = getCandidateById(member.candidateId);
    if (!candidate) continue;

    const eff = getMemberEffectivenessMultiplier(member) * synergyBonusMultiplier;
    const m = candidate.workMetrics;

    expenseReductionPct += m.overheadReductionPct * eff;
    hypeRetentionBonusPct += m.hypeProtectionPct * eff;
    qualityBonusPoints += m.studioQualityBonus * eff;
    tourLogisticsSavingsPct += m.tourLogisticsSavingsPct * eff;
    radioServicingPower += m.radioServicingPower * eff;
    playlistPitchChancePct += m.playlistPitchSuccessPct * eff;
    visualMomentumBonus += m.visualMomentumBonus * eff;

    if ((member.activeDirectiveDaysLeft || 0) > 0 && member.roleId === 'publicist') {
      activePrShieldDays = Math.max(activePrShieldDays, member.activeDirectiveDaysLeft);
      hypeRetentionBonusPct += 12;
    }
  }

  return {
    hiredCount,
    totalRoles: STAFF_ROLE_ORDER.length,
    synergyTierLabel,
    synergyBonusMultiplier,
    totalDailyCyclePayroll: Math.round(totalDailyCyclePayroll),
    totalDailyEquivalentCost: Math.round(totalDailyEquivalentCost),
    expenseReductionPct: Math.min(35, Math.round(expenseReductionPct)),
    hypeRetentionBonusPct: Math.min(60, Math.round(hypeRetentionBonusPct)),
    qualityBonusPoints: Math.round(qualityBonusPoints),
    tourLogisticsSavingsPct: Math.min(40, Math.round(tourLogisticsSavingsPct)),
    radioServicingPower: Math.round(radioServicingPower),
    playlistPitchChancePct: Math.min(95, Math.round(playlistPitchChancePct)),
    visualMomentumBonus: Math.round(visualMomentumBonus),
    activePrShieldDays,
  };
}

/**
 * Signs a candidate using a negotiated employment contract proposal.
 */
export function signStaffContractWithProposal(
  state: GameState,
  proposal: StaffContractProposal
): { nextState: GameState; success: boolean; message: string } {
  const candidate = getCandidateById(proposal.candidateId);
  if (!candidate) {
    return { nextState: state, success: false, message: 'Candidate not found in agency pool.' };
  }

  const currentPop = Math.round(Number(state.popularity) || 0);
  if (currentPop < candidate.minPopularity) {
    return {
      nextState: state,
      success: false,
      message: `${candidate.name} requires at least ${candidate.minPopularity}% Artist Popularity to enter contract talks.`,
    };
  }

  const evalResult = evaluateStaffContractProposal(candidate, proposal);
  if (!evalResult.isAcceptable) {
    return {
      nextState: state,
      success: false,
      message: evalResult.reactionQuote,
    };
  }

  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < proposal.signingBonus) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient funds for the $${proposal.signingBonus.toLocaleString()} contract signing bonus.`,
    };
  }

  // Check if candidate accepts when offer is below 100% certainty
  const roll = Math.random() * 100;
  if (roll > evalResult.acceptanceChancePct) {
    return {
      nextState: state,
      success: false,
      message: `${candidate.name} declined your offer (${evalResult.acceptanceChancePct}% acceptance odds). Try offering closer to market rate or matching their preferred ${candidate.preferredCycle.toUpperCase()} disbursement schedule.`,
    };
  }

  const staffState = getEnsuredStaffState(state);
  const existing = staffState.roster[candidate.roleId];
  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];

  const cycleDays = getCycleDaysCount(proposal.payrollCycle);
  const contractTotalDays = proposal.termMonths * 30;
  const dailyEquivalent = Math.max(50, Math.round(proposal.offeredSalaryPerCycle / cycleDays));
  const roleDef = STAFF_ROLE_DEFINITIONS[candidate.roleId];

  const newMember: HiredStaffMember = {
    candidateId: candidate.id,
    roleId: candidate.roleId,
    tier: candidate.tier,
    tierLabel: candidate.tierLabel,
    name: candidate.name,
    initials: candidate.initials,
    agencyTitle: candidate.agencyTitle,
    specialtyTag: candidate.specialtyTag,
    hiredDate: dateStr,
    payrollCycle: proposal.payrollCycle,
    agreedSalaryPerCycle: proposal.offeredSalaryPerCycle,
    dailyRetainer: dailyEquivalent,
    nextPaydayDaysLeft: cycleDays,
    contractTermMonths: proposal.termMonths,
    contractTotalDays,
    contractDaysRemaining: contractTotalDays,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    loyalty: evalResult.initialLoyalty,
    autonomousProgressDays: 0,
    autonomousCycleTargetDays: roleDef.autonomousCycleDays,
    currentTaskLabel: roleDef.autonomousDuties[0],
    activeDirectiveDaysLeft: 0,
    totalDeliverablesCompleted: 0,
  };

  const nextRoster = {
    ...staffState.roster,
    [candidate.roleId]: newMember,
  };

  const cycleUnit =
    proposal.payrollCycle === 'daily'
      ? '/day'
      : proposal.payrollCycle === 'monthly'
      ? '/month'
      : '/year';

  const logEntry: StaffActionLogItem = {
    id: `staff_contract_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: dateStr,
    roleId: candidate.roleId,
    staffName: candidate.name,
    title: existing
      ? `Executed ${proposal.termMonths}M Contract with ${candidate.name} (Replaced ${existing.name})`
      : `Executed ${proposal.termMonths}-Month Contract with ${candidate.name} (${roleDef.shortTitle})`,
    detail: `Contract Retainer: $${proposal.offeredSalaryPerCycle.toLocaleString()}${cycleUnit} (${proposal.payrollCycle.toUpperCase()}) • Signing Bonus: $${proposal.signingBonus.toLocaleString()}`,
    category: 'contract',
  };

  const nextState: GameState = {
    ...state,
    money: currentMoney - proposal.signingBonus,
    staffState: {
      ...staffState,
      roster: nextRoster,
      actionLogs: [logEntry, ...staffState.actionLogs].slice(0, 40),
    },
  };

  return {
    nextState,
    success: true,
    message: `${candidate.name} executed a ${proposal.termMonths}-month employment contract ($${proposal.offeredSalaryPerCycle.toLocaleString()}${cycleUnit}) and has begun autonomous operations!`,
  };
}

/**
 * Renews an existing staff member's contract for an additional term.
 */
export function renewStaffContract(
  state: GameState,
  roleId: StaffRoleId,
  termMonths: StaffContractTermMonths,
  payrollCycle: StaffPayrollCycle,
  agreedSalaryPerCycle: number
): { nextState: GameState; success: boolean; message: string } {
  const staffState = getEnsuredStaffState(state);
  const member = staffState.roster[roleId];
  if (!member) {
    return { nextState: state, success: false, message: 'No staff member currently occupies this role.' };
  }

  const candidate = getCandidateById(member.candidateId);
  const renewalBonus = Math.round((candidate?.signingBonus || member.dailyRetainer * 10) * 0.5);
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < renewalBonus) {
    return {
      nextState: state,
      success: false,
      message: `Need $${renewalBonus.toLocaleString()} for the contract renewal retainer fee.`,
    };
  }

  const cycleDays = getCycleDaysCount(payrollCycle);
  const addedDays = termMonths * 30;
  const dailyEquivalent = Math.max(50, Math.round(agreedSalaryPerCycle / cycleDays));
  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];

  const updatedMember: HiredStaffMember = {
    ...member,
    payrollCycle,
    agreedSalaryPerCycle,
    dailyRetainer: dailyEquivalent,
    nextPaydayDaysLeft: cycleDays,
    contractTermMonths: termMonths,
    contractTotalDays: addedDays,
    contractDaysRemaining: addedDays,
    loyalty: Math.min(100, member.loyalty + 10),
  };

  const cycleUnit =
    payrollCycle === 'daily' ? '/day' : payrollCycle === 'monthly' ? '/month' : '/year';

  const logEntry: StaffActionLogItem = {
    id: `staff_renew_${Date.now()}`,
    date: dateStr,
    roleId,
    staffName: member.name,
    title: `Renewed ${member.name}'s Executive Contract (${termMonths} Months)`,
    detail: `Updated Retainer: $${agreedSalaryPerCycle.toLocaleString()}${cycleUnit} (${payrollCycle.toUpperCase()}) • Renewal Bonus: $${renewalBonus.toLocaleString()}`,
    category: 'contract',
  };

  const nextState: GameState = {
    ...state,
    money: currentMoney - renewalBonus,
    staffState: {
      ...staffState,
      roster: {
        ...staffState.roster,
        [roleId]: updatedMember,
      },
      actionLogs: [logEntry, ...staffState.actionLogs].slice(0, 40),
    },
  };

  return {
    nextState,
    success: true,
    message: `Renewed ${member.name}'s contract for ${termMonths} months ($${agreedSalaryPerCycle.toLocaleString()}${cycleUnit})!`,
  };
}

export function setStaffFocusSong(
  state: GameState,
  roleId: StaffRoleId,
  songId?: number
): GameState {
  const staffState = getEnsuredStaffState(state);
  const member = staffState.roster[roleId];
  if (!member) return state;

  return {
    ...state,
    staffState: {
      ...staffState,
      roster: {
        ...staffState.roster,
        [roleId]: {
          ...member,
          focusSongId: songId,
        },
      },
    },
  };
}

export function releaseStaffMember(
  state: GameState,
  roleId: StaffRoleId
): { nextState: GameState; success: boolean; message: string } {
  const staffState = getEnsuredStaffState(state);
  const existing = staffState.roster[roleId];
  if (!existing) {
    return { nextState: state, success: false, message: 'No staff member currently occupies this role.' };
  }

  const severanceCost = (existing.dailyRetainer || 1000) * 5;
  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];

  const nextRoster = { ...staffState.roster };
  delete nextRoster[roleId];

  const logEntry: StaffActionLogItem = {
    id: `staff_rel_${Date.now()}`,
    date: dateStr,
    roleId,
    staffName: existing.name,
    title: `Terminated Contract with ${existing.name} (${STAFF_ROLE_DEFINITIONS[roleId].shortTitle})`,
    detail: `Paid 5-day early buyout settlement ($${severanceCost.toLocaleString()})`,
    category: 'release',
  };

  const nextState: GameState = {
    ...state,
    money: Math.max(0, (Number(state.money) || 0) - severanceCost),
    staffState: {
      ...staffState,
      roster: nextRoster,
      actionLogs: [logEntry, ...staffState.actionLogs].slice(0, 40),
    },
  };

  return {
    nextState,
    success: true,
    message: `Terminated contract with ${existing.name} (Paid $${severanceCost.toLocaleString()} buyout).`,
  };
}

export function payStaffMoraleBonus(
  state: GameState,
  roleId: StaffRoleId
): { nextState: GameState; success: boolean; message: string } {
  const staffState = getEnsuredStaffState(state);
  const member = staffState.roster[roleId];
  if (!member) {
    return { nextState: state, success: false, message: 'No staff member hired in this slot.' };
  }

  const bonusCost = (member.dailyRetainer || 1000) * 5;
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < bonusCost) {
    return {
      nextState: state,
      success: false,
      message: `Need $${bonusCost.toLocaleString()} to award a 5-day executive performance bonus.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : new Date().toISOString().split('T')[0];
  const nextLoyalty = Math.min(100, member.loyalty + 18);
  let nextLevel = member.level;
  let nextXp = member.xp + 35;
  let nextXpCap = member.xpToNextLevel;

  if (nextLevel < 10 && nextXp >= nextXpCap) {
    nextXp -= nextXpCap;
    nextLevel += 1;
    nextXpCap = Math.round(nextXpCap * 1.25);
  }

  const updatedMember: HiredStaffMember = {
    ...member,
    loyalty: nextLoyalty,
    level: nextLevel,
    xp: nextXp,
    xpToNextLevel: nextXpCap,
  };

  const logEntry: StaffActionLogItem = {
    id: `staff_bonus_${Date.now()}`,
    date: dateStr,
    roleId,
    staffName: member.name,
    title: `Awarded Executive Performance Bonus to ${member.name}`,
    detail: `+$${bonusCost.toLocaleString()} bonus • Morale now ${nextLoyalty}% • Level ${nextLevel}`,
    category: 'bonus',
  };

  const nextState: GameState = {
    ...state,
    money: currentMoney - bonusCost,
    staffState: {
      ...staffState,
      roster: {
        ...staffState.roster,
        [roleId]: updatedMember,
      },
      actionLogs: [logEntry, ...staffState.actionLogs].slice(0, 40),
    },
  };

  return {
    nextState,
    success: true,
    message: `Paid $${bonusCost.toLocaleString()} performance bonus to ${member.name}! Morale is now ${nextLoyalty}%.`,
  };
}

/**
 * Helper that executes a staff member's major deliverable automatically when their autonomous cycle completes.
 */
function executeAutonomousDeliverableForRole(
  state: GameState,
  staffState: StaffTeamState,
  member: HiredStaffMember,
  synergyBonusMultiplier: number,
  dateStr: string
): void {
  const roleId = member.roleId;
  const roleDef = STAFF_ROLE_DEFINITIONS[roleId];
  const candidate = getCandidateById(member.candidateId);
  const eff = getMemberEffectivenessMultiplier(member) * synergyBonusMultiplier;

  const allSongs = state.songs || [];
  const releasedSongs = allSongs.filter((s) => s.status === 'released');
  const studioSongs = allSongs.filter(
    (s) => s.status === 'writing' || s.status === 'written' || s.status === 'recording' || s.status === 'recorded'
  );

  const chosenSong: Song | undefined =
    allSongs.find((s) => s.id === member.focusSongId) ||
    (roleId === 'producer' && studioSongs.length > 0
      ? studioSongs[studioSongs.length - 1]
      : releasedSongs[releasedSongs.length - 1] || allSongs[allSongs.length - 1]);

  let logDetail = '';
  const currentPop = Number(state.popularity) || 2;

  if (roleId === 'manager') {
    const dealPower = (candidate?.workMetrics.dealNegotiationPower || 1.2) * eff;
    const syncFee = Math.round((4500 + currentPop * 320) * dealPower);
    state.money = (state.money || 0) + syncFee;
    state.dailyIncome = (state.dailyIncome || 0) + syncFee;
    logDetail = `Autonomously closed a $${syncFee.toLocaleString()} commercial sync & licensing settlement and audited daily overhead (-${Math.round((candidate?.workMetrics.overheadReductionPct || 8) * eff)}%).`;
  } else if (roleId === 'publicist') {
    const pressPower = (candidate?.workMetrics.pressReachPower || 1) * eff;
    const hypeGain = Number((3.8 * pressPower).toFixed(1));
    state.hype = Math.min(100, Number(((state.hype || 15) + hypeGain).toFixed(1)));
    member.activeDirectiveDaysLeft = 7;
    logDetail = `Autonomously coordinated a press feature (+${hypeGain}% Hype) and refreshed your 7-day media reputation shield.`;
  } else if (roleId === 'producer') {
    if (chosenSong) {
      const polishPoints = Math.max(2, Math.round((candidate?.workMetrics.masteringPolishPower || 4) * eff));
      const potentialPoints = Math.max(2, Math.round(polishPoints * 0.75));
      chosenSong.quality = Math.min(100, (chosenSong.quality || 60) + polishPoints);
      chosenSong.basePotential = Math.min(100, (chosenSong.basePotential || 60) + potentialPoints);
      logDetail = `Autonomously completed studio mix & master calibration on "${chosenSong.title}" (+${polishPoints} Quality, +${potentialPoints} Potential).`;
    } else {
      logDetail = `Calibrated studio vocal chain and analog mastering console for upcoming sessions.`;
    }
  } else if (roleId === 'tour_agent') {
    const bookingPower = (candidate?.workMetrics.venueBookingPower || 1.2) * eff;
    const showcaseGuarantee = Math.round((5200 + currentPop * 360) * bookingPower);
    state.money = (state.money || 0) + showcaseGuarantee;
    state.dailyIncome = (state.dailyIncome || 0) + showcaseGuarantee;
    logDetail = `Autonomously booked a private promoter showcase (+$${showcaseGuarantee.toLocaleString()} appearance guarantee) and optimized live routing.`;
  } else if (roleId === 'radio_plugger') {
    const targetRelease =
      releasedSongs.find((s) => s.id === member.focusSongId) ||
      releasedSongs[releasedSongs.length - 1];
    if (targetRelease) {
      const radioAdd = Math.round((candidate?.workMetrics.radioServicingPower || 40) * eff * 2.2);
      const currentPlacements = Array.isArray(targetRelease.playlistPlacements)
        ? [...targetRelease.playlistPlacements]
        : [];
      const availablePlaylists = EDITORIAL_PLAYLIST_POOL.filter((p) => !currentPlacements.includes(p));
      const pitchChance = Math.min(95, Math.round((candidate?.workMetrics.playlistPitchSuccessPct || 30) * eff));
      const wonPlaylist =
        availablePlaylists.length > 0 && Math.random() * 100 <= pitchChance
          ? availablePlaylists[Math.floor(Math.random() * availablePlaylists.length)]
          : null;

      if (wonPlaylist) {
        targetRelease.playlistPlacements = [...currentPlacements, wonPlaylist];
      }
      targetRelease.radioPlays = (targetRelease.radioPlays || 0) + radioAdd;
      targetRelease.dailyRadioPlays = (targetRelease.dailyRadioPlays || 0) + Math.round(radioAdd * 0.35);
      targetRelease.weeklyRadioPlays = (targetRelease.weeklyRadioPlays || 0) + radioAdd;

      logDetail = wonPlaylist
        ? `Autonomously pitched "${targetRelease.title}" onto Spotify's "${wonPlaylist}" playlist and secured +${radioAdd} radio station spins.`
        : `Autonomously serviced "${targetRelease.title}" to radio program directors (+${radioAdd} airplay spins).`;
    } else {
      logDetail = `Maintained relationships with national radio program directors and DSP editorial curators.`;
    }
  } else if (roleId === 'creative_director') {
    if (chosenSong) {
      const extraDays = Math.max(2, Math.round((candidate?.workMetrics.campaignDurationBonusDays || 3) * eff));
      const momentumGainPoints = Math.max(2, Math.round((candidate?.workMetrics.visualMomentumBonus || 4) * eff));
      const normalizedMom =
        chosenSong.momentum && chosenSong.momentum <= 2.5 ? chosenSong.momentum : 1.0;
      chosenSong.hasVisualizer = true;
      chosenSong.mvAdsDays = (chosenSong.mvAdsDays || 0) + extraDays;
      chosenSong.momentum = Number(
        Math.min(1.32, normalizedMom + momentumGainPoints * 0.012).toFixed(3)
      );
      logDetail = `Autonomously directed visual campaign for "${chosenSong.title}" (+${extraDays} MV campaign days, Visualizer active, +${momentumGainPoints}% Visual Retention).`;
    } else {
      logDetail = `Developed era visual storyboards and stage art direction concepts.`;
    }
  }

  // Grant XP for completing an autonomous deliverable
  member.xp += 35;
  if (member.level < 10 && member.xp >= member.xpToNextLevel) {
    member.xp -= member.xpToNextLevel;
    member.level += 1;
    member.xpToNextLevel = Math.round(member.xpToNextLevel * 1.25);
  }
  member.totalDeliverablesCompleted = (member.totalDeliverablesCompleted || 0) + 1;
  staffState.totalDeliverablesRun = (staffState.totalDeliverablesRun || 0) + 1;

  staffState.actionLogs.unshift({
    id: `staff_auto_${Date.now()}_${roleId}`,
    date: dateStr,
    roleId,
    staffName: member.name,
    title: `${member.name} (${roleDef.shortTitle}) — ${roleDef.deliverableName}`,
    detail: logDetail,
    category: 'autonomous_work',
  });
}

/**
 * Runs every in-game day during the main daily tick in useGame.ts.
 * Handles:
 * 1. Contract expiration countdowns
 * 2. Daily, Monthly (30d), and Yearly (365d) Payroll settlements
 * 3. Continuous daily duties & autonomous deliverable cycles
 */
export function processDailyStaffTeamStep(state: GameState, currentDate: Date): void {
  const staffState = getEnsuredStaffState(state);
  const hiredRoles = STAFF_ROLE_ORDER.filter((r) => Boolean(staffState.roster[r]));
  if (hiredRoles.length === 0) {
    state.staffState = staffState;
    return;
  }

  const synergy = calculateStaffTeamSynergyBuffs(state);
  const isHiatus = Boolean(state.isHiatus);
  const discountMultiplier = isHiatus ? 0.2 : 1.0;
  const dateStr = currentDate.toISOString().split('T')[0];

  for (const roleId of hiredRoles) {
    const member = staffState.roster[roleId];
    if (!member) continue;

    const roleDef = STAFF_ROLE_DEFINITIONS[roleId];

    // Ensure legacy fields are migrated cleanly
    if (!member.payrollCycle) member.payrollCycle = 'daily';
    if (!member.agreedSalaryPerCycle) member.agreedSalaryPerCycle = member.dailyRetainer || 1200;
    if (member.nextPaydayDaysLeft === undefined) {
      member.nextPaydayDaysLeft = getCycleDaysCount(member.payrollCycle);
    }
    if (member.contractDaysRemaining === undefined) {
      member.contractTermMonths = 12;
      member.contractTotalDays = 360;
      member.contractDaysRemaining = 360;
    }
    if (member.autonomousProgressDays === undefined) {
      member.autonomousProgressDays = 0;
    }
    if (!member.autonomousCycleTargetDays) {
      member.autonomousCycleTargetDays = roleDef.autonomousCycleDays;
    }

    // 1. Contract Countdown
    member.contractDaysRemaining = Math.max(0, member.contractDaysRemaining - 1);
    if (member.contractDaysRemaining === 0) {
      staffState.actionLogs.unshift({
        id: `staff_exp_${Date.now()}_${roleId}`,
        date: dateStr,
        roleId,
        staffName: member.name,
        title: `${member.name}'s ${member.contractTermMonths}-Month Contract Expired`,
        detail: `${member.name} has completed their contract tenure and returned to the talent agency pool. You may negotiate a new agreement anytime.`,
        category: 'contract',
      });
      delete staffState.roster[roleId];
      continue;
    }

    // 2. Payroll Settlement (Daily vs Monthly vs Yearly)
    if (member.payrollCycle === 'daily') {
      const paidToday = Math.round(member.agreedSalaryPerCycle * discountMultiplier);
      staffState.totalPayrollPaid = (staffState.totalPayrollPaid || 0) + paidToday;
      member.nextPaydayDaysLeft = 1;
    } else {
      member.nextPaydayDaysLeft = Math.max(0, member.nextPaydayDaysLeft - 1);
      if (member.nextPaydayDaysLeft === 0) {
        const cycleDays = getCycleDaysCount(member.payrollCycle);
        const settlementAmount = Math.round(member.agreedSalaryPerCycle * discountMultiplier);
        if ((state.money || 0) >= settlementAmount) {
          state.money = Math.max(0, (state.money || 0) - settlementAmount);
          staffState.totalPayrollPaid = (staffState.totalPayrollPaid || 0) + settlementAmount;
          member.loyalty = Math.min(100, member.loyalty + 3);
          staffState.actionLogs.unshift({
            id: `staff_pay_${Date.now()}_${roleId}`,
            date: dateStr,
            roleId,
            staffName: member.name,
            title: `Disbursed ${member.payrollCycle === 'monthly' ? 'Monthly Retainer' : 'Annual Salary'} to ${member.name}`,
            detail: `Paid $${settlementAmount.toLocaleString()} (${member.payrollCycle.toUpperCase()} payroll disbursement).`,
            category: 'payroll',
          });
        } else {
          // Partial payment if funds are low, reduces morale
          const available = Math.max(0, Math.round(state.money || 0));
          state.money = 0;
          staffState.totalPayrollPaid = (staffState.totalPayrollPaid || 0) + available;
          member.loyalty = Math.max(20, member.loyalty - 18);
          staffState.actionLogs.unshift({
            id: `staff_pay_late_${Date.now()}_${roleId}`,
            date: dateStr,
            roleId,
            staffName: member.name,
            title: `Payroll Default on ${member.name}'s ${member.payrollCycle === 'monthly' ? 'Monthly' : 'Annual'} Retainer`,
            detail: `Insufficient funds for $${settlementAmount.toLocaleString()} disbursement. Staff morale dropped to ${member.loyalty}%.`,
            category: 'payroll',
          });
        }
        member.nextPaydayDaysLeft = cycleDays;
      }
    }

    // 3. Daily XP & Autonomous Deliverable Progress
    if (member.activeDirectiveDaysLeft > 0) {
      member.activeDirectiveDaysLeft = Math.max(0, member.activeDirectiveDaysLeft - 1);
    }

    const dailyXpGain = isHiatus ? 3 : 8;
    member.xp += dailyXpGain;
    if (member.level < 10 && member.xp >= member.xpToNextLevel) {
      member.xp -= member.xpToNextLevel;
      member.level += 1;
      member.xpToNextLevel = Math.round(member.xpToNextLevel * 1.25);

      staffState.actionLogs.unshift({
        id: `staff_lvl_${Date.now()}_${roleId}`,
        date: dateStr,
        roleId,
        staffName: member.name,
        title: `${member.name} promoted to Seniority Level ${member.level}`,
        detail: `Department efficiency in ${roleDef.department} increased (+${(member.level - 1) * 5}%).`,
        category: 'level_up',
      });
    }

    if (!isHiatus) {
      member.autonomousProgressDays += 1;
      const dutyIdx = member.autonomousProgressDays % roleDef.autonomousDuties.length;
      member.currentTaskLabel = roleDef.autonomousDuties[dutyIdx];

      if (member.autonomousProgressDays >= member.autonomousCycleTargetDays) {
        member.autonomousProgressDays = 0;
        executeAutonomousDeliverableForRole(
          state,
          staffState,
          member,
          synergy.synergyBonusMultiplier,
          dateStr
        );
      }
    }
  }

  // 4. Continuous Daily Background Duties (Studio Polish, Daily Radio Servicing, Hype Stability, Tour Savings)
  if (!isHiatus) {
    // Producer: Daily studio polish on songs currently in writing/recording
    if (staffState.roster.producer && state.songs && state.songs.length > 0) {
      const studioSongs = state.songs.filter(
        (s) => s.status === 'writing' || s.status === 'recording' || s.status === 'written'
      );
      const dailyPolish = Math.max(1, Math.round(synergy.qualityBonusPoints * 0.15));
      for (const s of studioSongs) {
        if ((s.quality || 60) < 98) {
          s.quality = Math.min(98, (s.quality || 60) + dailyPolish);
        }
      }
    }

    // Radio Plugger: Daily radio station servicing on active singles
    if (staffState.roster.radio_plugger && state.songs && state.songs.length > 0) {
      const activeReleases = state.songs.filter(
        (s) => s.status === 'released' && (s.daysSinceRelease ?? 0) <= 60
      );
      if (activeReleases.length > 0) {
        const pluggerMember = staffState.roster.radio_plugger;
        const focusSong =
          activeReleases.find((s) => s.id === pluggerMember.focusSongId) ||
          activeReleases[activeReleases.length - 1];
        const servicedSpins = Math.max(5, Math.round(synergy.radioServicingPower * 0.4));
        focusSong.dailyRadioPlays = (focusSong.dailyRadioPlays || 0) + servicedSpins;
        focusSong.radioPlays = (focusSong.radioPlays || 0) + servicedSpins;
        focusSong.weeklyRadioPlays = (focusSong.weeklyRadioPlays || 0) + servicedSpins;
      }
    }

    // Creative Director: Daily visual momentum retention on songs with MVs/Visualizers
    if (staffState.roster.creative_director && state.songs && state.songs.length > 0) {
      const visualSongs = state.songs.filter(
        (s) => s.status === 'released' && (s.hasMV || s.hasVisualizer) && (s.daysSinceRelease ?? 0) <= 45
      );
      const dailyMomHold = Math.min(0.012, (synergy.visualMomentumBonus || 4) * 0.0008);
      for (const s of visualSongs) {
        const safeMom = s.momentum && s.momentum <= 2.5 ? s.momentum : 1.0;
        s.momentum = Number(Math.min(1.25, safeMom + dailyMomHold).toFixed(4));
      }
    }

    // Publicist: Daily Hype protection
    if (staffState.roster.publicist && synergy.hypeRetentionBonusPct > 0) {
      const hypeSupport = Number(((synergy.hypeRetentionBonusPct / 100) * 0.65).toFixed(2));
      state.hype = Math.min(100, Number(((state.hype || 15) + hypeSupport).toFixed(2)));
    }

    // Tour Agent: Daily tour logistics savings when on an active tour
    const activeTour = (state as any).tourState?.activeTour;
    if (staffState.roster.tour_agent && activeTour && synergy.tourLogisticsSavingsPct > 0) {
      const dailyLogisticsRebate = Math.round(1250 * (synergy.tourLogisticsSavingsPct / 100));
      state.money = (state.money || 0) + dailyLogisticsRebate;
    }
  }

  staffState.actionLogs = staffState.actionLogs.slice(0, 40);
  staffState.lastProcessedDate = dateStr;
  state.staffState = staffState;
}
