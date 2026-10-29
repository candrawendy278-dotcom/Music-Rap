import { GameState } from '../types';
import { formatNumFull } from '../constants';
import type { ActiveWorldTour, WorldTourState } from './worldTourSystemEngine';
import type { XPost } from './xSocialEngine';

export interface TourCooldownStatus {
  isOnCooldown: boolean;
  daysRemaining: number;
  totalCooldownDays: number;
  cooldownEndDate: string | null;
  lastTourTitle: string | null;
  lastCompletedDate: string | null;
  recoveryProgressPct: number;
  statusHeadline: string;
  statusDescription: string;
}

/**
 * Calculates a long post-tour recovery & rest period after a World Tour finishes.
 * Base cooldown: 120 days (4 months) + 8 days per concert date played (up to 240 days / ~8 months).
 */
export function calculateTourCooldownDuration(completedShowsCount: number): number {
  const shows = Math.max(1, completedShowsCount);
  const rawDays = 120 + shows * 8;
  return Math.min(240, Math.max(120, rawDays));
}

/**
 * Computes the exact calendar date (YYYY-MM-DD) when the post-tour cooldown expires.
 */
export function computeCooldownEndDate(
  currentDateStr: string,
  cooldownDays: number
): string {
  const baseDate = new Date(currentDateStr);
  const safeDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const end = new Date(safeDate);
  end.setDate(end.getDate() + Math.max(0, cooldownDays));
  return end.toISOString().split('T')[0];
}

/**
 * Applies the post-tour cooldown fields onto WorldTourState right when the final show of an active tour completes,
 * and generates a @TouringData Tour Finale & Post-Tour Recovery Announcement post for X.
 */
export function applyTourCompletionCooldown(params: {
  state: GameState;
  tourState: WorldTourState;
  completedTour: ActiveWorldTour;
  currentDateObj: Date;
  resolvedTourBanner: string;
}): {
  updatedTourState: WorldTourState;
  finaleXPost: XPost;
} {
  const {
    state,
    tourState,
    completedTour,
    currentDateObj,
    resolvedTourBanner
  } = params;

  const totalShows = Math.max(
    1,
    completedTour.totalShowsCompleted || completedTour.stops.length
  );
  const cooldownTotalDays = calculateTourCooldownDuration(totalShows);
  const completedDateStr = currentDateObj.toISOString().split('T')[0];
  const cooldownEndDate = computeCooldownEndDate(
    completedDateStr,
    cooldownTotalDays
  );

  const artistName = state.artist?.name || 'Artist';
  const totalCombinedGross =
    (completedTour.totalTicketGross || 0) +
    (completedTour.totalMerchBoothGross || 0) +
    (completedTour.totalSponsorGross || 0);

  const finaleXPost: XPost = {
    id: `tour_finale_cooldown_${Date.now()}_${completedTour.id}`,
    authorName: 'Touring Data',
    authorHandle: '@TouringData',
    authorAvatar: state.artist?.image || resolvedTourBanner,
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    timeAgo: 'Just now',
    dateCreated: state.date,
    content: `🏁 OFFICIAL WORLD TOUR FINALE: ${artistName}'s "${
      completedTour.title
    }" has officially wrapped after ${totalShows} global dates, grossing $${formatNumFull(
      totalCombinedGross
    )} from ${formatNumFull(
      completedTour.totalAttendance
    )} total attendees! ${artistName} now enters a mandatory ${cooldownTotalDays}-day Post-Tour Recovery & Rest Period until ${cooldownEndDate}.`,
    image: resolvedTourBanner,
    mediaBadge: `TOUR WRAPPED • ${cooldownTotalDays}D RECOVERY`,
    mediaTitle: `${artistName} — ${completedTour.title} (Final Boxscore)`,
    mediaSubtitle: `${totalShows} Shows • $${formatNumFull(
      totalCombinedGross
    )} Total Gross • Next Tour Available: ${cooldownEndDate}`,
    likes: Math.round(28_000 + completedTour.totalAttendance * 0.14),
    reposts: Math.round(6_900 + completedTour.totalAttendance * 0.035),
    replies: Math.round(1_450 + completedTour.totalAttendance * 0.01),
    views: Math.round(240_000 + completedTour.totalAttendance * 1.15),
    daysOld: 0
  };

  const updatedTourState: WorldTourState = {
    ...tourState,
    cooldownDaysLeft: cooldownTotalDays,
    cooldownTotalDays,
    cooldownEndDate,
    lastCompletedTourTitle: completedTour.title,
    lastCompletedTourDate: completedDateStr
  };

  return {
    updatedTourState,
    finaleXPost
  };
}

/**
 * Decrements the post-tour recovery cooldown counter by 1 day during daily game progression
 * when no active tour is running.
 */
export function tickDailyTourCooldown(
  tourState: WorldTourState,
  currentDateObj: Date
): WorldTourState {
  const currentLeft = tourState.cooldownDaysLeft || 0;
  if (currentLeft <= 0) {
    return tourState;
  }

  const nextLeft = Math.max(0, currentLeft - 1);
  const todayStr = currentDateObj.toISOString().split('T')[0];

  // Also check calendar date if cooldownEndDate was set
  if (tourState.cooldownEndDate && todayStr >= tourState.cooldownEndDate) {
    return {
      ...tourState,
      cooldownDaysLeft: 0
    };
  }

  return {
    ...tourState,
    cooldownDaysLeft: nextLeft
  };
}

/**
 * Evaluates whether the player is currently on a mandatory Post-Tour Recovery Cooldown
 * and returns formatted telemetry for the UI and tour launch guard.
 */
export function evaluateTourCooldownStatus(
  state: GameState
): TourCooldownStatus {
  const tourState = (state as any).tourState as WorldTourState | undefined;
  if (!tourState || tourState.activeTour) {
    return {
      isOnCooldown: false,
      daysRemaining: 0,
      totalCooldownDays: 0,
      cooldownEndDate: null,
      lastTourTitle: null,
      lastCompletedDate: null,
      recoveryProgressPct: 100,
      statusHeadline: 'Cleared for Global Touring',
      statusDescription:
        'Vocal cords, production crew, and stadium logistics are 100% rested and ready to launch a new World Tour.'
    };
  }

  const daysRemaining = Math.max(0, tourState.cooldownDaysLeft || 0);
  const totalCooldownDays = Math.max(
    daysRemaining,
    tourState.cooldownTotalDays || 0
  );

  if (daysRemaining <= 0) {
    return {
      isOnCooldown: false,
      daysRemaining: 0,
      totalCooldownDays: totalCooldownDays || 0,
      cooldownEndDate: tourState.cooldownEndDate || null,
      lastTourTitle:
        tourState.lastCompletedTourTitle ||
        tourState.pastTours?.[0]?.title ||
        null,
      lastCompletedDate: tourState.lastCompletedTourDate || null,
      recoveryProgressPct: 100,
      statusHeadline: 'Post-Tour Recovery Complete',
      statusDescription:
        'Your mandatory post-tour rest period has finished. You can now announce and launch a brand-new Era World Tour!'
    };
  }

  const elapsed = Math.max(0, totalCooldownDays - daysRemaining);
  const recoveryProgressPct =
    totalCooldownDays > 0
      ? Math.min(99, Math.max(1, Math.round((elapsed / totalCooldownDays) * 100)))
      : 0;

  const lastTourTitle =
    tourState.lastCompletedTourTitle ||
    tourState.pastTours?.[0]?.title ||
    'Previous World Tour';
  const resolvedEndDate =
    tourState.cooldownEndDate ||
    computeCooldownEndDate(state.date.split('T')[0], daysRemaining);

  return {
    isOnCooldown: true,
    daysRemaining,
    totalCooldownDays,
    cooldownEndDate: resolvedEndDate,
    lastTourTitle,
    lastCompletedDate: tourState.lastCompletedTourDate || null,
    recoveryProgressPct,
    statusHeadline: `Mandatory Post-Tour Rest & Recovery (${daysRemaining} Days Left)`,
    statusDescription: `Following the conclusion of "${lastTourTitle}", you and your touring crew are on a mandatory ${totalCooldownDays}-day vocal, physical, and stage logistics recovery break until ${resolvedEndDate}.`
  };
}
