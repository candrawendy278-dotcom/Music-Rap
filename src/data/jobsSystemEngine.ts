// Career Jobs, Side Hustles & Daily Employment Engine
// Allows players to work daily shifts/gigs and enroll in steady part-time/industry jobs
// to earn extra income ($), fans, and hype to fund their studio recordings and music videos.

import { GameState } from '../types';
import { getEnsuredSkillState } from './skillSystemEngine';

export type JobTierCategory = 'part_time' | 'studio_gig' | 'vip_contract';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  category: JobTierCategory;
  categoryLabel: string;
  icon: string;
  accentColor: string;
  payPerShift: number;
  fanBonus?: number;
  hypeBonus?: number;
  minPopularity?: number;
  minAvgSkillLevel?: number;
  description: string;
}

export interface SteadyDailyContract {
  id: string;
  title: string;
  employer: string;
  dailySalary: number;
  minPopularity: number;
  icon: string;
  description: string;
}

export interface JobPaycheckRecord {
  id: string;
  jobTitle: string;
  company: string;
  amount: number;
  date: string;
  type: 'shift' | 'daily_salary';
}

export interface PlayerJobsState {
  lastWorkedDate: string;
  shiftsWorkedToday: number;
  maxShiftsPerDay: number;
  totalJobEarnings: number;
  totalShiftsCompleted: number;
  activeSteadyContractId: string | null;
  recentPaychecks: JobPaycheckRecord[];
}

export const MAX_SHIFTS_PER_DAY = 3;

export const STEADY_DAILY_CONTRACTS: SteadyDailyContract[] = [
  {
    id: 'contract_barista',
    title: 'Morning Cafe Barista',
    employer: 'Bluebird Espresso Bar',
    dailySalary: 165,
    minPopularity: 0,
    icon: 'ph-fill ph-coffee',
    description: 'Automatic daily paycheck every morning before you hit the studio.'
  },
  {
    id: 'contract_record_shop',
    title: 'Vinyl Store Curator',
    employer: 'Sunset Wax Records',
    dailySalary: 340,
    minPopularity: 2,
    icon: 'ph-fill ph-vinyl-record',
    description: 'Recommend albums to audiophiles and collect a steady daily wage.'
  },
  {
    id: 'contract_studio_runner',
    title: 'Assistant Studio Tech',
    employer: 'Apex Sound Labs',
    dailySalary: 780,
    minPopularity: 8,
    icon: 'ph-fill ph-sliders-horizontal',
    description: 'Set up condenser mics and patch bays for major label sessions.'
  },
  {
    id: 'contract_radio_host',
    title: 'Late-Night Radio DJ',
    employer: '98.5 Pulse FM',
    dailySalary: 1850,
    minPopularity: 22,
    icon: 'ph-fill ph-broadcast',
    description: 'Host a syndicated evening music show with guaranteed daily pay.'
  },
  {
    id: 'contract_ar_consultant',
    title: 'Executive A&R Advisor',
    employer: 'Universal Republic Group',
    dailySalary: 4500,
    minPopularity: 45,
    icon: 'ph-fill ph-briefcase',
    description: 'Advise major record executives on emerging trends and scouting.'
  }
];

export const JOB_LISTINGS: JobListing[] = [
  // TIER 1: Everyday Part-Time Hustles (0 Requirements)
  {
    id: 'job_coffee_shift',
    title: 'Late-Night Barista Shift',
    company: 'Velvet Roast Coffee',
    category: 'part_time',
    categoryLabel: 'Part-Time Hustle',
    icon: 'ph-fill ph-coffee',
    accentColor: 'text-amber-600 bg-amber-500/10',
    payPerShift: 180,
    description: 'Pull espresso shots and serve late-night customers to fund your studio time.'
  },
  {
    id: 'job_vinyl_clerk',
    title: 'Record Store Counter Shift',
    company: 'Amoeba Vintage Vinyl',
    category: 'part_time',
    categoryLabel: 'Part-Time Hustle',
    icon: 'ph-fill ph-vinyl-record',
    accentColor: 'text-emerald-600 bg-emerald-500/10',
    payPerShift: 240,
    hypeBonus: 0.1,
    description: 'Organize crate imports, price rare pressings, and network with local music heads.'
  },
  {
    id: 'job_street_busking',
    title: 'Downtown Acoustic Busking',
    company: 'Metro Arts Plaza',
    category: 'part_time',
    categoryLabel: 'Part-Time Hustle',
    icon: 'ph-fill ph-guitar',
    accentColor: 'text-blue-600 bg-blue-500/10',
    payPerShift: 310,
    fanBonus: 18,
    hypeBonus: 0.15,
    description: 'Perform live acoustic sets for commuters, earning cash tips and new street fans.'
  },
  {
    id: 'job_stagehand',
    title: 'Arena Concert Stagehand',
    company: 'LiveNation Touring Crew',
    category: 'part_time',
    categoryLabel: 'Part-Time Hustle',
    icon: 'ph-fill ph-speaker-high',
    accentColor: 'text-purple-600 bg-purple-500/10',
    payPerShift: 420,
    description: 'Rig stage lighting and soundboards for touring headliners.'
  },

  // TIER 2: Studio & Music Freelance Gigs
  {
    id: 'job_backing_vocalist',
    title: 'Session Backing Vocalist',
    company: 'Westlake Recording Studios',
    category: 'studio_gig',
    categoryLabel: 'Studio Freelance',
    icon: 'ph-fill ph-microphone-stage',
    accentColor: 'text-rose-600 bg-rose-500/10',
    payPerShift: 850,
    fanBonus: 30,
    minAvgSkillLevel: 2,
    description: 'Record lush vocal harmonies and ad-libs for commercial studio releases.'
  },
  {
    id: 'job_demo_mixing',
    title: 'Freelance Mixing & Mastering',
    company: 'SoundCloud & Indie Clients',
    category: 'studio_gig',
    categoryLabel: 'Studio Freelance',
    icon: 'ph-fill ph-faders',
    accentColor: 'text-indigo-600 bg-indigo-500/10',
    payPerShift: 1350,
    minAvgSkillLevel: 3,
    description: 'Polish vocal stems and master tracks for independent artists.'
  },
  {
    id: 'job_club_dj',
    title: 'Rooftop Lounge Guest Set',
    company: 'Soho Sky Club',
    category: 'studio_gig',
    categoryLabel: 'Studio Freelance',
    icon: 'ph-fill ph-headphones',
    accentColor: 'text-cyan-600 bg-cyan-500/10',
    payPerShift: 1950,
    fanBonus: 65,
    hypeBonus: 0.25,
    minPopularity: 5,
    description: 'Spin a 2-hour live set and preview unreleased snippets to a packed crowd.'
  },
  {
    id: 'job_ghostwriter',
    title: 'Top-Line Hook Ghostwriter',
    company: 'Sony/ATV Publishing Camp',
    category: 'studio_gig',
    categoryLabel: 'Studio Freelance',
    icon: 'ph-fill ph-pen-nib',
    accentColor: 'text-violet-600 bg-violet-500/10',
    payPerShift: 2900,
    minAvgSkillLevel: 4,
    minPopularity: 10,
    description: 'Write infectious pop melodies and hooks for major label roster artists.'
  },

  // TIER 3: Executive & VIP Contracts
  {
    id: 'job_sync_jingle',
    title: 'Global TV Commercial Sync',
    company: 'Ogilvy Media Agency',
    category: 'vip_contract',
    categoryLabel: 'VIP Contract',
    icon: 'ph-fill ph-television',
    accentColor: 'text-amber-600 bg-amber-500/10',
    payPerShift: 5800,
    fanBonus: 120,
    minPopularity: 18,
    minAvgSkillLevel: 5,
    description: 'Produce a 60-second custom soundtrack for an international ad campaign.'
  },
  {
    id: 'job_private_gala',
    title: 'Private Luxury Gala Showcase',
    company: 'Beverly Hills Prestige Events',
    category: 'vip_contract',
    categoryLabel: 'VIP Contract',
    icon: 'ph-fill ph-champagne',
    accentColor: 'text-pink-600 bg-pink-500/10',
    payPerShift: 11500,
    fanBonus: 240,
    hypeBonus: 0.4,
    minPopularity: 30,
    description: 'Perform an exclusive intimate set for entertainment executives and VIPs.'
  },
  {
    id: 'job_masterclass',
    title: 'Guest Music Academy Mentor',
    company: 'Berklee Masterclass Series',
    category: 'vip_contract',
    categoryLabel: 'VIP Contract',
    icon: 'ph-fill ph-graduation-cap',
    accentColor: 'text-teal-600 bg-teal-500/10',
    payPerShift: 19500,
    fanBonus: 380,
    hypeBonus: 0.5,
    minPopularity: 50,
    minAvgSkillLevel: 7,
    description: 'Host a sold-out workshop breaking down your vocal and production workflow.'
  },
  {
    id: 'job_fashion_campaign',
    title: 'Runway Soundtrack Director',
    company: 'Paris & Milan Fashion Week',
    category: 'vip_contract',
    categoryLabel: 'VIP Contract',
    icon: 'ph-fill ph-crown',
    accentColor: 'text-neutral-900 bg-neutral-900/10',
    payPerShift: 35000,
    fanBonus: 750,
    hypeBonus: 0.8,
    minPopularity: 70,
    minAvgSkillLevel: 8,
    description: 'Curate and score the official runway audio for a luxury fashion house.'
  }
];

export function getPlayerAverageSkillLevel(state: GameState): number {
  const skills = getEnsuredSkillState(state.skills);
  const allSubs = [
    ...Object.values(skills.songwriting || {}),
    ...Object.values(skills.recording || {}),
    ...Object.values(skills.production || {})
  ];
  if (allSubs.length === 0) return 1;
  const sum = allSubs.reduce((acc, s) => acc + (s.level || 1), 0);
  return Number((sum / allSubs.length).toFixed(1));
}

export function getEnsuredJobsState(state: GameState): PlayerJobsState {
  const currentDateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const existing = (state as any).jobsState as PlayerJobsState | undefined;

  if (!existing) {
    return {
      lastWorkedDate: currentDateStr,
      shiftsWorkedToday: 0,
      maxShiftsPerDay: MAX_SHIFTS_PER_DAY,
      totalJobEarnings: 0,
      totalShiftsCompleted: 0,
      activeSteadyContractId: 'contract_barista',
      recentPaychecks: []
    };
  }

  // Reset daily shift counter automatically if the in-game date has advanced!
  const isNewDay = existing.lastWorkedDate !== currentDateStr;
  return {
    ...existing,
    lastWorkedDate: currentDateStr,
    shiftsWorkedToday: isNewDay ? 0 : existing.shiftsWorkedToday,
    maxShiftsPerDay: MAX_SHIFTS_PER_DAY,
    recentPaychecks: existing.recentPaychecks || []
  };
}

/**
 * Checks whether a player meets the skill & popularity requirements for a job
 */
export function checkJobEligibility(
  job: JobListing,
  state: GameState
): { eligible: boolean; reason?: string } {
  const pop = state.popularity || 0;
  const avgSkill = getPlayerAverageSkillLevel(state);

  if (job.minPopularity && pop < job.minPopularity) {
    return {
      eligible: false,
      reason: `Requires ${job.minPopularity}% Popularity (Current: ${pop.toFixed(1)}%)`
    };
  }

  if (job.minAvgSkillLevel && avgSkill < job.minAvgSkillLevel) {
    return {
      eligible: false,
      reason: `Requires Avg Skill Lv.${job.minAvgSkillLevel} (Current: Lv.${avgSkill})`
    };
  }

  return { eligible: true };
}

/**
 * Processes automatic daily salary payout when the player advances to the Next Day.
 */
export function processDailyJobContractSalary(state: GameState, newDateStr: string): {
  salaryPaid: number;
  updatedJobsState: PlayerJobsState;
} {
  const jobsState = getEnsuredJobsState(state);
  const dateOnly = newDateStr.split('T')[0];

  const contract = STEADY_DAILY_CONTRACTS.find(
    c => c.id === jobsState.activeSteadyContractId
  );

  if (!contract) {
    return {
      salaryPaid: 0,
      updatedJobsState: {
        ...jobsState,
        lastWorkedDate: dateOnly,
        shiftsWorkedToday: 0
      }
    };
  }

  const salary = contract.dailySalary;
  const record: JobPaycheckRecord = {
    id: `pay_daily_${Date.now()}`,
    jobTitle: contract.title,
    company: contract.employer,
    amount: salary,
    date: dateOnly,
    type: 'daily_salary'
  };

  return {
    salaryPaid: salary,
    updatedJobsState: {
      ...jobsState,
      lastWorkedDate: dateOnly,
      shiftsWorkedToday: 0,
      totalJobEarnings: (jobsState.totalJobEarnings || 0) + salary,
      recentPaychecks: [record, ...(jobsState.recentPaychecks || [])].slice(0, 20)
    }
  };
}
