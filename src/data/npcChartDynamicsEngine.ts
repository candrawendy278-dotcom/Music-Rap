// NPC Dynamic Chart Engine
// Powers dynamic, fluctuating, living music charts with realistic song lifecycles:
// Debuts, Viral Spikes, Peak Windows, Natural Decay, Recurrent Falloffs, and position shifts (+/-).

import { ChartItem } from '../types';

export type TrackLifecyclePhase = 'debut' | 'climbing' | 'peaking' | 'decaying' | 'viral_spike' | 'recurrent';

export interface DynamicNpcTrackProfile {
  title: string;
  artist: string;
  baseGlobalScore: number;
  genre: string;
  countryOrigin: string;
  hasMV: boolean;
  isLocalOnly?: boolean;
}

/**
 * Computes a dynamic temporal multiplier for an NPC track based on game date/week.
 * Allows songs to naturally rise, peak, fluctuate, and drop over in-game time.
 */
export function getNpcTrackDynamicMultiplier(
  title: string,
  artist: string,
  baseScore: number,
  currentDate: Date
): {
  dynamicScoreMultiplier: number;
  lifecyclePhase: TrackLifecyclePhase;
  weeksOnChart: number;
  simulatedLastRankDelta: number;
} {
  // Deterministic seed based on track title & artist
  let hash = 0;
  const str = `${title}__${artist}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const trackSeed = Math.abs(hash);

  // In-game epoch: calculate weeks elapsed from game starting epoch (2026-01-01)
  const gameTime = currentDate.getTime();
  const baseEpoch = new Date('2026-01-01T00:00:00Z').getTime();
  const elapsedDays = Math.max(0, Math.floor((gameTime - baseEpoch) / (1000 * 60 * 60 * 24)));
  const elapsedWeeks = Math.floor(elapsedDays / 7);

  // Each track has a release offset in weeks (so they don't all start at week 0)
  const releaseOffsetWeeks = (trackSeed % 26);
  // Lifecycle length: typically 12 - 32 weeks
  const lifecycleLengthWeeks = 14 + ((trackSeed >> 3) % 18);

  const effectiveAgeWeeks = Math.max(0, (elapsedWeeks + releaseOffsetWeeks) % lifecycleLengthWeeks);
  const weeksOnChart = Math.max(1, effectiveAgeWeeks + 1);

  // Daily fluctuation within the week (±4%)
  const dayOfWeek = currentDate.getDay();
  const dailyWave = Math.sin((elapsedDays * 0.9) + (trackSeed % 7)) * 0.04;

  // Track lifecycle curve:
  // Phase 1 (Week 0-1): Debut / Initial Blast (0.75 - 1.15)
  // Phase 2 (Week 2-5): Rapid climb / Viral spread (1.05 - 1.35)
  // Phase 3 (Week 6-10): Peak plateau (1.20 - 1.45)
  // Phase 4 (Week 11-18): Steady organic decay (0.90 -> 0.45)
  // Phase 5 (Week 19+): Recurrent / catalog (0.35 -> 0.15)
  let phase: TrackLifecyclePhase = 'climbing';
  let phaseMult = 1.0;
  let simulatedDelta = 0; // Rank delta: positive means moved up, negative means fell

  // Check for viral spike event (every ~8 weeks for certain energetic tracks)
  const isViralCandidate = ((trackSeed % 5) === 0);
  const isViralWeek = isViralCandidate && ((elapsedWeeks + (trackSeed % 4)) % 9 === 0);

  if (isViralWeek && weeksOnChart > 3) {
    phase = 'viral_spike';
    phaseMult = 1.38 + ((trackSeed % 15) / 100);
    simulatedDelta = 6 + (trackSeed % 12); // Surges up 6 to 17 spots!
  } else if (effectiveAgeWeeks <= 1) {
    phase = 'debut';
    phaseMult = 0.85 + ((trackSeed % 25) / 100);
    simulatedDelta = 0; // New entry
  } else if (effectiveAgeWeeks <= 5) {
    phase = 'climbing';
    const climbProgress = (effectiveAgeWeeks - 1) / 4;
    phaseMult = 0.95 + (climbProgress * 0.35);
    simulatedDelta = 2 + (trackSeed % 5); // Rising +2 to +6
  } else if (effectiveAgeWeeks <= 9) {
    phase = 'peaking';
    // Gentle oscillation at the peak (holding or shifting ±1-2 spots)
    const peakOscillation = Math.cos(elapsedDays * 0.4 + trackSeed) * 0.06;
    phaseMult = 1.25 + peakOscillation;
    simulatedDelta = (trackSeed % 3) - 1; // -1, 0, or +1
  } else if (effectiveAgeWeeks <= 18) {
    phase = 'decaying';
    const decayProgress = (effectiveAgeWeeks - 9) / 9;
    phaseMult = Math.max(0.40, 1.20 - (decayProgress * 0.75));
    simulatedDelta = -1 - (trackSeed % 4); // Falling -1 to -4
  } else {
    phase = 'recurrent';
    phaseMult = Math.max(0.18, 0.40 - ((effectiveAgeWeeks - 18) * 0.03));
    simulatedDelta = -2 - (trackSeed % 5); // Falling towards chart exit
  }

  // Final dynamic multiplier for this date
  const finalMult = Math.max(0.15, (phaseMult + dailyWave));

  return {
    dynamicScoreMultiplier: finalMult,
    lifecyclePhase: phase,
    weeksOnChart,
    simulatedLastRankDelta: simulatedDelta
  };
}

import { synchronizeAndEnrichChartMovements } from './chartMovementAndReEntryEngine';

/**
 * Harmonizes and updates a newly computed chart against its previous edition,
 * ensuring accurate lastPosition, realistic movements (up, down, new, re-entry, equal),
 * and sensible peak/weeks statistics.
 */
export function synchronizeChartMovements(
  newChart: ChartItem[],
  prevChart: ChartItem[] | null | undefined,
  isWeeklyChart = false,
  currentDate?: Date | string,
  chartKey?: string
): ChartItem[] {
  return synchronizeAndEnrichChartMovements(
    newChart,
    prevChart,
    chartKey || (isWeeklyChart ? 'weekly_sync' : 'daily_sync'),
    isWeeklyChart,
    currentDate
  );
}

