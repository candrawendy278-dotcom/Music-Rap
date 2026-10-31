import { GameState } from '../types';
import {
  ImprintSignedArtist,
  LabelAccountingStatementItem,
  getEnsuredRecordLabelState,
} from './recordLabelSystemEngine';
import {
  HiredStaffMember,
  STAFF_ROLE_DEFINITIONS,
  StaffPayrollCycle,
  StaffRoleId,
  getCycleDaysCount,
} from './staffTeamEngine';

export const MIN_RECORD_LABEL_CASH_REQUIRED = 100_000_000; // $100,000,000 ($100M)
export const MIN_RECORD_LABEL_CAPITAL_INVESTMENT = 100_000_000; // $100,000,000 ($100M)
export const MIN_RECORD_LABEL_POPULARITY = 60; // 60% Artist Popularity
export const MIN_RECORD_LABEL_RELEASED_SONGS = 5; // 5 Released Songs
export const MIN_RECORD_LABEL_TOTAL_STREAMS = 50_000_000; // 50M Career Streams

export interface LabelFoundingRequirementItem {
  id: string;
  label: string;
  currentText: string;
  targetText: string;
  met: boolean;
}

export interface LabelFoundingEligibilityResult {
  allRequirementsMet: boolean;
  requirements: LabelFoundingRequirementItem[];
  minCapitalInvestment: number;
  playerCash: number;
  playerPopularity: number;
  releasedSongsCount: number;
  releasedAlbumsCount: number;
  totalCareerStreams: number;
}

/**
 * Evaluates whether the Player meets all executive career & financial requirements
 * to unlock and found their own Record Label Imprint ($100M Cash + $100M Min Investment + Career Milestones).
 */
export function evaluateRecordLabelFoundingEligibility(
  state: GameState,
  proposedInvestment: number = MIN_RECORD_LABEL_CAPITAL_INVESTMENT
): LabelFoundingEligibilityResult {
  const playerCash = Math.round(Number(state?.money) || 0);
  const playerPopularity = Math.round(Number(state?.popularity) || 0);
  const releasedSongs = (state?.songs || []).filter((s) => s.status === 'released');
  const releasedProjects = (state?.projects || []).filter((p) => p.status === 'released');
  const totalCareerStreams = releasedSongs.reduce(
    (acc, s) => acc + (Number(s.streams) || 0),
    0
  );

  const effectiveInvestment = Math.max(
    MIN_RECORD_LABEL_CAPITAL_INVESTMENT,
    Math.round(Number(proposedInvestment) || MIN_RECORD_LABEL_CAPITAL_INVESTMENT)
  );

  const hasEnoughCash = playerCash >= effectiveInvestment && playerCash >= MIN_RECORD_LABEL_CASH_REQUIRED;
  const hasPopularity = playerPopularity >= MIN_RECORD_LABEL_POPULARITY;
  const hasCatalog =
    releasedSongs.length >= MIN_RECORD_LABEL_RELEASED_SONGS || releasedProjects.length >= 1;
  const hasStreams = totalCareerStreams >= MIN_RECORD_LABEL_TOTAL_STREAMS;

  const requirements: LabelFoundingRequirementItem[] = [
    {
      id: 'net_cash',
      label: 'Liquid Net Worth & Startup Capital ($100M+)',
      currentText: `$${playerCash.toLocaleString()}`,
      targetText: `$${effectiveInvestment.toLocaleString()} Required`,
      met: hasEnoughCash,
    },
    {
      id: 'popularity',
      label: 'Artist Industry Popularity Standing',
      currentText: `${playerPopularity}% Popularity`,
      targetText: `Min ${MIN_RECORD_LABEL_POPULARITY}% Popularity`,
      met: hasPopularity,
    },
    {
      id: 'catalog',
      label: 'Proven Commercial Discography',
      currentText: `${releasedSongs.length} Singles • ${releasedProjects.length} Albums/EPs`,
      targetText: `${MIN_RECORD_LABEL_RELEASED_SONGS}+ Released Songs (or 1+ Album)`,
      met: hasCatalog,
    },
    {
      id: 'streams',
      label: 'Career Global Streaming Milestone',
      currentText: `${totalCareerStreams.toLocaleString()} Streams`,
      targetText: `${MIN_RECORD_LABEL_TOTAL_STREAMS.toLocaleString()} Streams`,
      met: hasStreams,
    },
  ];

  return {
    allRequirementsMet: requirements.every((r) => r.met),
    requirements,
    minCapitalInvestment: MIN_RECORD_LABEL_CAPITAL_INVESTMENT,
    playerCash,
    playerPopularity,
    releasedSongsCount: releasedSongs.length,
    releasedAlbumsCount: releasedProjects.length,
    totalCareerStreams,
  };
}

export const MIN_ROSTER_HIATUS_DAYS = 60; // Minimum 2 Months (60 Days)
export const MAX_ROSTER_HIATUS_DAYS = 120; // Up to 4 Months (120 Days)

export type RosterHiatusState = 'active' | 'requesting_hiatus' | 'on_hiatus';

export interface RosterTrustAndHiatusInfo {
  labelTrust: number; // 0 to 100
  trustTierLabel: 'Devoted to Label' | 'High Trust' | 'Cautious' | 'Frustrated' | 'Broken Trust';
  trustColorClass: string;
  fatigueScore: number; // 0 to 100
  consecutiveComebacksWithoutRest: number;
  daysSinceLastComeback: number;
  hiatusStatus: RosterHiatusState;
  hiatusDaysLeft: number;
  hiatusTotalDays: number;
  recommendedHiatusDays: number;
  hiatusReason: string;
  renewalChancePct: number;
  willingToRenew: boolean;
  canStartNewComebackInStudio: boolean;
  studioBlockReason: string | null;
}

/**
 * Calculates required Hiatus duration (minimum 60 days / 2 months, scaling up to 90-120 days if severely fatigued).
 */
export function getRecommendedRosterHiatusDays(artist: ImprintSignedArtist): number {
  const raw = artist as any;
  const fatigue = Math.max(0, Math.min(100, Number(raw.fatigueScore) || 0));
  const consecutive = Math.max(0, Number(raw.consecutiveComebacksWithoutRest) || 0);
  if (fatigue >= 90 || consecutive >= 5) return 120; // 4 Months
  if (fatigue >= 80 || consecutive >= 4) return 90; // 3 Months
  if (fatigue >= 70) return 75; // 2.5 Months
  return MIN_ROSTER_HIATUS_DAYS; // Minimum 60 Days (2 Months)
}

/**
 * Computes and normalizes a Roster Artist's Label Trust Bar (0-100), Comeback Fatigue (0-100),
 * Mandatory Hiatus Request state, and Contract Renewal probability.
 */
export function getRosterTrustAndHiatusInfo(
  artist: ImprintSignedArtist
): RosterTrustAndHiatusInfo {
  const raw = artist as any;

  // Default trust starts at 75% (adjusted by royalty fairness if never initialized)
  const fairCutBonus =
    (artist.imprintRoyaltyCutPct || 50) <= 45
      ? 6
      : (artist.imprintRoyaltyCutPct || 50) >= 70
      ? -8
      : 0;
  const labelTrust = Math.max(
    0,
    Math.min(
      100,
      typeof raw.labelTrust === 'number' ? Math.round(raw.labelTrust) : 75 + fairCutBonus
    )
  );

  const fatigueScore = Math.max(
    0,
    Math.min(100, typeof raw.fatigueScore === 'number' ? Math.round(raw.fatigueScore) : 12)
  );
  const consecutiveComebacksWithoutRest = Math.max(
    0,
    Number(raw.consecutiveComebacksWithoutRest) || 0
  );
  const daysSinceLastComeback = Math.max(
    0,
    typeof raw.daysSinceLastComeback === 'number' ? raw.daysSinceLastComeback : 25
  );

  const recommendedHiatusDays = getRecommendedRosterHiatusDays(artist);
  let rawHiatusDaysLeft = Math.max(0, Math.round(Number(raw.hiatusDaysLeft) || 0));
  const rawHiatusTotalDays = Math.max(0, Math.round(Number(raw.hiatusTotalDays) || 0));

  // Migrate any legacy <60d hiatus so active hiatuses always respect the 2-month (60d) minimum
  if (
    (raw.hiatusStatus === 'on_hiatus' || rawHiatusDaysLeft > 0) &&
    rawHiatusTotalDays < MIN_ROSTER_HIATUS_DAYS &&
    rawHiatusDaysLeft > 0
  ) {
    const legacyBase = rawHiatusTotalDays > 0 ? rawHiatusTotalDays : 28;
    const daysAlreadyElapsed = Math.max(0, legacyBase - rawHiatusDaysLeft);
    rawHiatusDaysLeft = Math.max(1, MIN_ROSTER_HIATUS_DAYS - daysAlreadyElapsed);
  }

  const hiatusDaysLeft = rawHiatusDaysLeft;
  const hiatusTotalDays =
    hiatusDaysLeft > 0
      ? Math.max(MIN_ROSTER_HIATUS_DAYS, rawHiatusTotalDays, hiatusDaysLeft)
      : Math.max(MIN_ROSTER_HIATUS_DAYS, recommendedHiatusDays);

  let hiatusStatus: RosterHiatusState =
    raw.hiatusStatus === 'on_hiatus' || hiatusDaysLeft > 0
      ? 'on_hiatus'
      : raw.hiatusStatus === 'requesting_hiatus' ||
        fatigueScore >= 75 ||
        consecutiveComebacksWithoutRest >= 3
      ? 'requesting_hiatus'
      : 'active';

  if (hiatusStatus === 'on_hiatus' && hiatusDaysLeft <= 0) {
    hiatusStatus = 'active';
  }

  const stageName = artist.stageName || artist.name;
  const monthsApprox = (recommendedHiatusDays / 30).toFixed(recommendedHiatusDays % 30 === 0 ? 0 : 1);
  const hiatusReason =
    hiatusStatus === 'on_hiatus'
      ? `${stageName} is currently on an approved Label Hiatus (${hiatusDaysLeft}d remaining of ${hiatusTotalDays}d • Min 2 Months) to recover from comeback exhaustion.`
      : hiatusStatus === 'requesting_hiatus'
      ? `${stageName} is exhausted from back-to-back releases (Fatigue ${fatigueScore}%) and is requesting a ${recommendedHiatusDays}-day (${monthsApprox} Months, Min 60d) Hiatus before their next comeback!`
      : `Ready for studio production, global shows, and active promotions (Fatigue ${fatigueScore}%).`;

  // Trust Tier & Renewal Probability directly driven by Label Trust Bar
  let trustTierLabel: RosterTrustAndHiatusInfo['trustTierLabel'] = 'High Trust';
  let trustColorClass = 'text-emerald-400';
  if (labelTrust >= 82) {
    trustTierLabel = 'Devoted to Label';
    trustColorClass = 'text-emerald-400';
  } else if (labelTrust >= 65) {
    trustTierLabel = 'High Trust';
    trustColorClass = 'text-teal-300';
  } else if (labelTrust >= 48) {
    trustTierLabel = 'Cautious';
    trustColorClass = 'text-amber-300';
  } else if (labelTrust >= 30) {
    trustTierLabel = 'Frustrated';
    trustColorClass = 'text-orange-400';
  } else {
    trustTierLabel = 'Broken Trust';
    trustColorClass = 'text-rose-400';
  }

  const royaltyFairnessMod = Math.round((55 - (artist.imprintRoyaltyCutPct || 50)) * 0.45);
  const renewalChancePct = Math.max(
    0,
    Math.min(100, Math.round(labelTrust * 1.05 + royaltyFairnessMod))
  );

  // If Label Trust is low (< 48%), the artist refuses to renew their contract!
  const willingToRenew = labelTrust >= 48 && renewalChancePct >= 50;

  let canStartNewComebackInStudio = true;
  let studioBlockReason: string | null = null;

  if (hiatusStatus === 'on_hiatus') {
    canStartNewComebackInStudio = false;
    studioBlockReason = `${stageName} is currently on Hiatus for ${hiatusDaysLeft} more days. Wait for their rest period to finish, or force an early comeback (Warning: -35% Label Trust!).`;
  } else if (hiatusStatus === 'requesting_hiatus') {
    canStartNewComebackInStudio = false;
    studioBlockReason = `${stageName} has requested a mandatory Hiatus due to comeback exhaustion (${fatigueScore}% Fatigue after ${consecutiveComebacksWithoutRest} back-to-back releases). Approve their Hiatus (+14% Label Trust) or Force Comeback (-30% Label Trust) to continue.`;
  }

  return {
    labelTrust,
    trustTierLabel,
    trustColorClass,
    fatigueScore,
    consecutiveComebacksWithoutRest,
    daysSinceLastComeback,
    hiatusStatus,
    hiatusDaysLeft,
    hiatusTotalDays,
    recommendedHiatusDays,
    hiatusReason,
    renewalChancePct,
    willingToRenew,
    canStartNewComebackInStudio,
    studioBlockReason,
  };
}

/**
 * Applies fatigue and trust impact when a Roster Artist drops a new release (Single, EP, or Album).
 * If the artist was pushed into a rapid comeback without rest, their fatigue spikes, trust drops,
 * and they will demand a Hiatus!
 */
export function applyRosterComebackReleaseFatigue(
  artist: ImprintSignedArtist,
  releaseKind: 'single' | 'project'
): ImprintSignedArtist {
  const info = getRosterTrustAndHiatusInfo(artist);
  const addedFatigue = releaseKind === 'project' ? 40 : 28;
  const rapidPenalty = info.daysSinceLastComeback < 18 ? 18 : info.daysSinceLastComeback < 30 ? 8 : 0;
  const nextFatigue = Math.min(100, info.fatigueScore + addedFatigue + rapidPenalty);
  const nextConsecutive = info.consecutiveComebacksWithoutRest + 1;

  // If pushed too hard (rapid release or high fatigue), trust drops; if well-rested, trust rises slightly!
  let trustDelta = 2;
  if (info.fatigueScore >= 65 || nextConsecutive >= 3 || info.daysSinceLastComeback < 14) {
    trustDelta = -10;
  } else if (info.daysSinceLastComeback >= 28 && info.fatigueScore <= 35) {
    trustDelta = 4;
  }

  const nextTrust = Math.max(0, Math.min(100, info.labelTrust + trustDelta));
  const shouldRequestHiatus = nextFatigue >= 72 || nextConsecutive >= 3;

  const updated: ImprintSignedArtist = {
    ...artist,
    willingToRenew: nextTrust >= 48,
  };
  (updated as any).labelTrust = nextTrust;
  (updated as any).morale = nextTrust;
  (updated as any).fatigueScore = nextFatigue;
  (updated as any).consecutiveComebacksWithoutRest = nextConsecutive;
  (updated as any).daysSinceLastComeback = 0;
  (updated as any).hiatusStatus = shouldRequestHiatus ? 'requesting_hiatus' : 'active';
  (updated as any).hiatusDaysLeft = 0;

  return updated;
}

/**
 * CEO Action: Approves a Roster Artist's requested Hiatus (or grants a proactive rest period).
 * Minimum Hiatus duration is strictly 60 days (2 Months), and can be 60, 75, 90, or 120 days.
 * Boosts Label Trust (+14% to +18%), resets comeback fatigue, and places the artist on Hiatus.
 */
export function approveRosterArtistHiatus(
  state: GameState,
  artistId: string,
  durationDays?: number
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const info = getRosterTrustAndHiatusInfo(target);
  if (info.hiatusStatus === 'on_hiatus') {
    return {
      nextState: state,
      success: false,
      message: `${target.stageName || target.name} is already on Hiatus (${info.hiatusDaysLeft}d remaining).`,
    };
  }

  const effectiveDuration = Math.max(
    MIN_ROSTER_HIATUS_DAYS,
    Math.min(
      MAX_ROSTER_HIATUS_DAYS,
      Math.round(Number(durationDays) || info.recommendedHiatusDays || MIN_ROSTER_HIATUS_DAYS)
    )
  );
  const extraMonthsTrustBonus = effectiveDuration >= 90 ? 4 : effectiveDuration >= 75 ? 2 : 0;
  const nextTrust = Math.min(100, info.labelTrust + 14 + extraMonthsTrustBonus);

  const updatedArtist: ImprintSignedArtist = {
    ...target,
    willingToRenew: nextTrust >= 48,
  };
  (updatedArtist as any).labelTrust = nextTrust;
  (updatedArtist as any).morale = nextTrust;
  (updatedArtist as any).fatigueScore = Math.max(0, info.fatigueScore - 45);
  (updatedArtist as any).consecutiveComebacksWithoutRest = 0;
  (updatedArtist as any).hiatusStatus = 'on_hiatus';
  (updatedArtist as any).hiatusDaysLeft = effectiveDuration;
  (updatedArtist as any).hiatusTotalDays = effectiveDuration;

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const stageName = target.stageName || target.name;
  const monthsLabel = (effectiveDuration / 30).toFixed(effectiveDuration % 30 === 0 ? 0 : 1);
  const stmt: LabelAccountingStatementItem = {
    id: `stmt_hiatus_app_${Date.now()}_${artistId}`,
    date: dateStr,
    title: `Approved ${effectiveDuration}-Day (${monthsLabel}M) Hiatus for ${stageName}`,
    detail: `Granted ${stageName} an official ${effectiveDuration}-day (${monthsLabel} months) rest break to recover from comeback fatigue. Label Trust increased to ${nextTrust}%!`,
    amount: 0,
    direction: 'neutral',
    category: 'imprint',
  };

  return {
    nextState: {
      ...state,
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
    },
    success: true,
    message: `Approved ${effectiveDuration}-day (${monthsLabel} Months) Hiatus for ${stageName}! Label Trust increased to ${nextTrust}%.`,
  };
}

/**
 * CEO Action: Forces a Roster Artist to cancel their Hiatus / ignore their Hiatus Request and immediately
 * work on a new comeback. Severely damages Label Trust (-30% to -35%) and lowers contract renewal chances!
 */
export function forceRosterArtistComebackOverHiatus(
  state: GameState,
  artistId: string
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const info = getRosterTrustAndHiatusInfo(target);
  const penalty = info.hiatusStatus === 'on_hiatus' ? 35 : 30;
  const nextTrust = Math.max(0, info.labelTrust - penalty);

  const updatedArtist: ImprintSignedArtist = {
    ...target,
    willingToRenew: nextTrust >= 48,
  };
  (updatedArtist as any).labelTrust = nextTrust;
  (updatedArtist as any).morale = nextTrust;
  (updatedArtist as any).fatigueScore = Math.min(100, Math.max(45, info.fatigueScore));
  (updatedArtist as any).consecutiveComebacksWithoutRest = Math.max(
    1,
    info.consecutiveComebacksWithoutRest - 1
  );
  (updatedArtist as any).hiatusStatus = 'active';
  (updatedArtist as any).hiatusDaysLeft = 0;

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const stageName = target.stageName || target.name;
  const stmt: LabelAccountingStatementItem = {
    id: `stmt_force_cb_${Date.now()}_${artistId}`,
    date: dateStr,
    title: `Forced Comeback Directive: ${stageName}`,
    detail: `Overruled ${stageName}'s hiatus rest request. Label Trust dropped by -${penalty}% to ${nextTrust}% (${
      nextTrust < 48 ? 'Refuses Contract Renewal!' : 'Cautious'
    }).`,
    amount: 0,
    direction: 'neutral',
    category: 'imprint',
  };

  return {
    nextState: {
      ...state,
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
    },
    success: true,
    message: `Forced ${stageName} back into the studio! Warning: Label Trust dropped by -${penalty}% (now ${nextTrust}%).`,
  };
}

/**
 * CEO Action: Pays a $75,000 Label Goodwill & Wellness Bonus to a Roster Artist to boost Label Trust (+12%)
 * and reduce fatigue (-20%).
 */
export function grantRosterArtistTrustBonus(
  state: GameState,
  artistId: string
): { nextState: GameState; success: boolean; message: string } {
  const bonusCost = 75_000;
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < bonusCost) {
    return {
      nextState: state,
      success: false,
      message: `Granting a Label Goodwill & Wellness Bonus requires $${bonusCost.toLocaleString()}.`,
    };
  }

  const labelState = getEnsuredRecordLabelState(state);
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const info = getRosterTrustAndHiatusInfo(target);
  const nextTrust = Math.min(100, info.labelTrust + 12);
  const nextFatigue = Math.max(0, info.fatigueScore - 20);

  const updatedArtist: ImprintSignedArtist = {
    ...target,
    willingToRenew: nextTrust >= 48,
  };
  (updatedArtist as any).labelTrust = nextTrust;
  (updatedArtist as any).morale = nextTrust;
  (updatedArtist as any).fatigueScore = nextFatigue;

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const stageName = target.stageName || target.name;
  const stmt: LabelAccountingStatementItem = {
    id: `stmt_trust_bonus_${Date.now()}_${artistId}`,
    date: dateStr,
    title: `Artist Goodwill & Wellness Bonus: ${stageName}`,
    detail: `Paid $${bonusCost.toLocaleString()} executive bonus to ${stageName}. Label Trust rose to ${nextTrust}%!`,
    amount: bonusCost,
    direction: 'debit',
    category: 'imprint',
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - bonusCost,
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
    },
    success: true,
    message: `Paid $${bonusCost.toLocaleString()} Goodwill Bonus to ${stageName}! Label Trust is now ${nextTrust}%.`,
  };
}

export interface LabelStaffPayrollSummary {
  execStaffCount: number;
  rosterStaffCount: number;
  totalStaffCount: number;
  execDailyEquivalent: number;
  rosterDailyEquivalent: number;
  totalDailyEquivalent: number;
  totalMonthlyEquivalent: number;
  upcomingPaydays: Array<{
    ownerLabel: string;
    staffName: string;
    roleTitle: string;
    payrollCycle: StaffPayrollCycle;
    salaryDue: number;
    daysLeft: number;
  }>;
}

/**
 * Computes the complete recurring salary obligations for all hired staff across:
 * 1) Label-Wide Executive Division (`imprint.labelStaffRoster`)
 * 2) Every Signed Roster Artist's Dedicated Staff Team (`artist.staffRoster`)
 */
export function calculateLabelAndRosterStaffPayrollSummary(
  state: GameState
): LabelStaffPayrollSummary {
  const labelState = getEnsuredRecordLabelState(state);
  const imprint = labelState.imprint;
  if (!imprint?.isFounded) {
    return {
      execStaffCount: 0,
      rosterStaffCount: 0,
      totalStaffCount: 0,
      execDailyEquivalent: 0,
      rosterDailyEquivalent: 0,
      totalDailyEquivalent: 0,
      totalMonthlyEquivalent: 0,
      upcomingPaydays: [],
    };
  }

  const upcomingPaydays: LabelStaffPayrollSummary['upcomingPaydays'] = [];
  let execStaffCount = 0;
  let execDailyEquivalent = 0;

  const execMap: Partial<Record<StaffRoleId, HiredStaffMember>> =
    (imprint as any).labelStaffRoster || {};
  (Object.keys(execMap) as StaffRoleId[]).forEach((rId) => {
    const m = execMap[rId];
    if (!m) return;
    execStaffCount += 1;
    const cycleDays = getCycleDaysCount(m.payrollCycle || 'monthly');
    const salary = Number(m.agreedSalaryPerCycle) || Number(m.dailyRetainer || 500) * cycleDays;
    const dailyEq = Math.round(salary / Math.max(1, cycleDays));
    execDailyEquivalent += dailyEq;

    upcomingPaydays.push({
      ownerLabel: `${imprint.imprintName} Exec Division`,
      staffName: m.name,
      roleTitle: STAFF_ROLE_DEFINITIONS[rId]?.shortTitle || rId,
      payrollCycle: m.payrollCycle || 'monthly',
      salaryDue: salary,
      daysLeft: Math.max(1, Number(m.nextPaydayDaysLeft) || cycleDays),
    });
  });

  let rosterStaffCount = 0;
  let rosterDailyEquivalent = 0;

  (imprint.signedRoster || []).forEach((art) => {
    const stageName = art.stageName || art.name;
    const staffMap: Partial<Record<StaffRoleId, HiredStaffMember>> = art.staffRoster || {};
    (Object.keys(staffMap) as StaffRoleId[]).forEach((rId) => {
      const m = staffMap[rId];
      if (!m) return;
      rosterStaffCount += 1;
      const cycleDays = getCycleDaysCount(m.payrollCycle || 'monthly');
      const salary = Number(m.agreedSalaryPerCycle) || Number(m.dailyRetainer || 450) * cycleDays;
      const dailyEq = Math.round(salary / Math.max(1, cycleDays));
      rosterDailyEquivalent += dailyEq;

      upcomingPaydays.push({
        ownerLabel: `${stageName} Team`,
        staffName: m.name,
        roleTitle: STAFF_ROLE_DEFINITIONS[rId]?.shortTitle || rId,
        payrollCycle: m.payrollCycle || 'monthly',
        salaryDue: salary,
        daysLeft: Math.max(1, Number(m.nextPaydayDaysLeft) || cycleDays),
      });
    });
  });

  upcomingPaydays.sort((a, b) => a.daysLeft - b.daysLeft);

  const totalDailyEquivalent = execDailyEquivalent + rosterDailyEquivalent;
  return {
    execStaffCount,
    rosterStaffCount,
    totalStaffCount: execStaffCount + rosterStaffCount,
    execDailyEquivalent,
    rosterDailyEquivalent,
    totalDailyEquivalent,
    totalMonthlyEquivalent: totalDailyEquivalent * 30,
    upcomingPaydays,
  };
}

/**
 * Processes 1 day of:
 * 1) Recurring Staff Payroll for the Label Executive Division & Roster Artist Staff Teams
 * 2) Roster Artist Hiatus countdowns, natural fatigue recovery, and Label Trust progression
 * Mutates `state` in place (called inside `processDailyRecordLabelTick`).
 */
export function processDailyRosterTrustHiatusAndStaffPayroll(
  state: GameState,
  currentDate: Date
): { totalPayrollDeductedToday: number } {
  const labelState = getEnsuredRecordLabelState(state);
  const imprint = labelState.imprint;
  if (!imprint || !imprint.isFounded) {
    return { totalPayrollDeductedToday: 0 };
  }

  const dateStr = currentDate.toISOString().split('T')[0];
  let totalPayrollDeductedToday = 0;
  const payrollLinesToday: string[] = [];
  let missedPayrollCount = 0;

  // Helper to tick one staff map (either Label Exec Division or a Roster Artist's team)
  const tickStaffMap = (
    staffMap: Partial<Record<StaffRoleId, HiredStaffMember>> | undefined,
    ownerLabel: string
  ): Partial<Record<StaffRoleId, HiredStaffMember>> => {
    if (!staffMap) return {};
    const nextMap: Partial<Record<StaffRoleId, HiredStaffMember>> = {};

    (Object.keys(staffMap) as StaffRoleId[]).forEach((rId) => {
      const member = staffMap[rId];
      if (!member) return;

      const cycle: StaffPayrollCycle = member.payrollCycle || 'monthly';
      const cycleDays = getCycleDaysCount(cycle);
      const salaryPerCycle =
        Number(member.agreedSalaryPerCycle) ||
        Math.round((Number(member.dailyRetainer) || 450) * cycleDays);

      const nextContractDays = Math.max(0, (member.contractDaysRemaining ?? 360) - 1);
      if (nextContractDays <= 0) {
        // Staff member's contract ended; auto-renew if player can afford, otherwise release
        labelState.statements.unshift({
          id: `stmt_staff_exp_${Date.now()}_${rId}_${ownerLabel}`,
          date: dateStr,
          title: `Staff Contract Completed: ${member.name} (${ownerLabel})`,
          detail: `${member.name} (${STAFF_ROLE_DEFINITIONS[rId]?.title || rId}) completed their term with ${ownerLabel}.`,
          amount: 0,
          direction: 'neutral',
          category: 'imprint',
        });
        return;
      }

      let nextPayday = (member.nextPaydayDaysLeft ?? cycleDays) - 1;
      let nextLoyalty = member.loyalty ?? 78;

      if (cycle === 'daily' || nextPayday <= 0) {
        const amountDue =
          cycle === 'daily'
            ? Number(member.dailyRetainer) || Math.round(salaryPerCycle / cycleDays)
            : salaryPerCycle;

        if ((state.money || 0) >= amountDue) {
          state.money = (state.money || 0) - amountDue;
          totalPayrollDeductedToday += amountDue;
          nextLoyalty = Math.min(100, nextLoyalty + (cycle === 'daily' ? 0.1 : 1.5));
          if (cycle !== 'daily') {
            payrollLinesToday.push(
              `${member.name} (${ownerLabel} • ${
                STAFF_ROLE_DEFINITIONS[rId]?.shortTitle || rId
              }): $${amountDue.toLocaleString()}`
            );
          }
        } else {
          // Missed payroll!
          missedPayrollCount += 1;
          nextLoyalty = Math.max(10, nextLoyalty - 15);
          labelState.statements.unshift({
            id: `stmt_payroll_miss_${Date.now()}_${rId}_${ownerLabel}`,
            date: dateStr,
            title: `Missed Staff Salary Payroll: ${member.name} (${ownerLabel})`,
            detail: `Insufficient funds to pay $${amountDue.toLocaleString()} salary for ${member.name}. Staff loyalty & artist trust decreased!`,
            amount: amountDue,
            direction: 'debit',
            category: 'imprint',
          });
        }
        nextPayday = cycleDays;
      }

      nextMap[rId] = {
        ...member,
        nextPaydayDaysLeft: nextPayday,
        contractDaysRemaining: nextContractDays,
        loyalty: nextLoyalty,
      };
    });

    return nextMap;
  };

  // 1. Tick Label-Wide Executive Division Staff Payroll
  (imprint as any).labelStaffRoster = tickStaffMap(
    (imprint as any).labelStaffRoster,
    `${imprint.imprintName} HQ`
  );

  // 2. Tick Each Roster Artist's Dedicated Staff Payroll + Hiatus & Label Trust Progression
  imprint.signedRoster = (imprint.signedRoster || []).map((art) => {
    const stageName = art.stageName || art.name;
    const nextStaffRoster = tickStaffMap(art.staffRoster, stageName);
    const info = getRosterTrustAndHiatusInfo(art);

    let nextTrust = info.labelTrust;
    let nextFatigue = info.fatigueScore;
    let nextConsecutive = info.consecutiveComebacksWithoutRest;
    const nextDaysSinceComeback = info.daysSinceLastComeback + 1;
    let nextHiatusStatus: RosterHiatusState = info.hiatusStatus;
    let nextHiatusDaysLeft = info.hiatusDaysLeft;
    let nextHiatusTotalDays = info.hiatusTotalDays;

    if (missedPayrollCount > 0) {
      nextTrust = Math.max(0, nextTrust - 6);
    }

    if (nextHiatusStatus === 'on_hiatus') {
      nextHiatusDaysLeft = Math.max(0, nextHiatusDaysLeft - 1);
      // Smoothly recover fatigue while on 60+ day hiatus
      nextFatigue = Math.max(0, Math.round(nextFatigue - 2));
      if (nextHiatusDaysLeft <= 0) {
        nextHiatusStatus = 'active';
        nextHiatusTotalDays = 0;
        nextFatigue = 0;
        nextConsecutive = 0;
        nextTrust = Math.min(100, nextTrust + 4);
        labelState.statements.unshift({
          id: `stmt_hiatus_done_${Date.now()}_${art.id}`,
          date: dateStr,
          title: `${stageName} Returned from Hiatus Refreshed!`,
          detail: `${stageName} has completed their multi-month rest period (0% Fatigue • ${nextTrust}% Label Trust) and is ready for their next studio comeback.`,
          amount: 0,
          direction: 'credit',
          category: 'imprint',
        });
      }
    } else if (nextHiatusStatus === 'requesting_hiatus') {
      // If the CEO ignores their hiatus request for weeks without approving it, trust slowly erodes
      if (nextDaysSinceComeback > 7 && currentDate.getDay() === 1) {
        nextTrust = Math.max(0, nextTrust - 2);
      }
    } else {
      // Active state: gentle natural fatigue recovery if not releasing non-stop
      if (nextDaysSinceComeback >= 14 && nextFatigue > 0) {
        nextFatigue = Math.max(0, nextFatigue - 1);
      }
      if (nextDaysSinceComeback >= 35 && nextConsecutive > 0 && nextFatigue <= 20) {
        nextConsecutive = Math.max(0, nextConsecutive - 1);
      }
      // Fair royalty split + active staff team slowly builds trust on Mondays
      if (currentDate.getDay() === 1 && Object.keys(nextStaffRoster).length > 0) {
        nextTrust = Math.min(100, nextTrust + 1);
      }
    }

    const updatedArt: ImprintSignedArtist = {
      ...art,
      staffRoster: nextStaffRoster,
      willingToRenew: nextTrust >= 48,
    };
    (updatedArt as any).labelTrust = nextTrust;
    (updatedArt as any).morale = nextTrust;
    (updatedArt as any).fatigueScore = nextFatigue;
    (updatedArt as any).consecutiveComebacksWithoutRest = nextConsecutive;
    (updatedArt as any).daysSinceLastComeback = nextDaysSinceComeback;
    (updatedArt as any).hiatusStatus = nextHiatusStatus;
    (updatedArt as any).hiatusDaysLeft = nextHiatusDaysLeft;
    (updatedArt as any).hiatusTotalDays = nextHiatusTotalDays;

    return updatedArt;
  });

  if (payrollLinesToday.length > 0) {
    labelState.statements.unshift({
      id: `stmt_lbl_payroll_${Date.now()}`,
      date: dateStr,
      title: `${imprint.imprintName} Staff & Roster Salary Payroll`,
      detail: `Paid $${totalPayrollDeductedToday.toLocaleString()} in recurring staff salaries (${payrollLinesToday.join(' • ')}).`,
      amount: totalPayrollDeductedToday,
      direction: 'debit',
      category: 'imprint',
    });
  }

  if (totalPayrollDeductedToday > 0) {
    imprint.dailyImprintNetIncome = (imprint.dailyImprintNetIncome || 0) - totalPayrollDeductedToday;
    imprint.totalNetProfitEarned = (imprint.totalNetProfitEarned || 0) - totalPayrollDeductedToday;
  }

  (state as any).recordLabelState = labelState;

  return { totalPayrollDeductedToday };
}
