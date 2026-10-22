/**
 * Hiatus System Engine
 * Manages artist hiatus state, expense reduction, popularity preservation,
 * accelerated skill training while away from the public eye, and Comeback Anticipation boost.
 */

import { GameState } from '../types';

export interface HiatusStatusSummary {
  isActive: boolean;
  hiatusDays: number;
  comebackHypeBonus: number;
  comebackStreamMultiplier: number;
  expenseReductionPct: number;
  trainingSpeedMultiplier: number;
  statusLabel: string;
  description: string;
}

/**
 * Computes current Hiatus metrics and accumulated Comeback Anticipation.
 */
export function getHiatusStatusSummary(state: Partial<GameState>): HiatusStatusSummary {
  const isActive = Boolean(state.isHiatus);
  const hiatusDays = Math.max(0, (state as any).hiatusDays || 0);

  // Each day on hiatus builds anticipation up to +45 Hype boost upon return
  const comebackHypeBonus = Math.min(45, Number((hiatusDays * 1.5).toFixed(1)));
  const comebackStreamMultiplier = Number((1 + Math.min(0.5, hiatusDays * 0.018)).toFixed(2));

  if (!isActive) {
    return {
      isActive: false,
      hiatusDays: 0,
      comebackHypeBonus: 0,
      comebackStreamMultiplier: 1.0,
      expenseReductionPct: 0,
      trainingSpeedMultiplier: 1,
      statusLabel: 'Active Era',
      description: 'Full public schedule. Normal daily expenses, chart promotion, and Hype cycle.'
    };
  }

  let statusLabel = 'Early Sabbatical';
  if (hiatusDays >= 21) {
    statusLabel = 'Legendary Mystery Era';
  } else if (hiatusDays >= 7) {
    statusLabel = 'High Comeback Anticipation';
  }

  return {
    isActive: true,
    hiatusDays,
    comebackHypeBonus,
    comebackStreamMultiplier,
    expenseReductionPct: 80,
    trainingSpeedMultiplier: 2,
    statusLabel,
    description: 'Popularity decay frozen · Daily expenses cut by 80% · Studio Skill training 2x faster · Building comeback buzz.'
  };
}
