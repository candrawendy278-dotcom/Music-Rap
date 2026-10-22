// Universal Chart Movement, Re-Entry, New Debut, Up/Down & Equal ('=') Engine
// Powers authentic movement indicators across ALL charts in the game:
// - Spotify Daily Top 50 & Weekly Top 50 (Global + All Countries)
// - Billboard Hot 100, Global 200, Regional Top 100 & Billboard 200 Albums
// - iTunes Top Songs & Top Albums (Global + All Countries)
// - YouTube Daily & Weekly Top Music Videos (Global + All Countries)

import { ChartItem } from '../types';

export type ChartMovementStatus = 'up' | 'down' | 'equal' | 're-entry' | 'new';

export interface ComputedChartMovement {
  status: ChartMovementStatus;
  delta: number; // positive = moved up, negative = moved down, 0 = equal/new/re-entry
  lastPosition: number | null;
  peakPosition: number;
  weeksOnChart: number;
  isReEntry: boolean;
  isNew: boolean;
  badgeText: string; // e.g. '+3', '-2', '=', 'RE-ENTRY', 'NEW'
}

interface HistoricalChartEntry {
  peakPosition: number;
  weeksOnChart: number;
  lastSeenRank: number;
  firstSeenEpochDay: number;
  lastSeenEpochDay: number;
  timesChartedInPrevEditions: number;
}

// Persistent in-memory registry of songs/albums that have appeared in PREVIOUS chart editions
const chartHistoryRegistry: Map<string, Map<string, HistoricalChartEntry>> = new Map();

function makeEntryKey(artist: string, title: string): string {
  const cleanTitle = (title || '')
    .toLowerCase()
    .replace(/\s*\(official music video\)/gi, '')
    .replace(/\s*\(music video\)/gi, '')
    .replace(/\s*\((?:feat\.|ft\.|with)\s+[^)]+\)/gi, '')
    .trim();
  const cleanArtist = (artist || '')
    .toLowerCase()
    .split(',')[0]
    .trim();
  return `${cleanArtist}::${cleanTitle}`;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function getEpochDays(currentDateInput?: string | Date): number {
  const d = currentDateInput
    ? typeof currentDateInput === 'string'
      ? new Date(currentDateInput)
      : currentDateInput
    : new Date('2026-01-01T00:00:00Z');
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(
    0,
    Math.floor((d.getTime() - new Date('2026-01-01T00:00:00Z').getTime()) / 86400000)
  );
}

/**
 * Helper to determine if a song/album is a brand-new release that MUST NEVER be labeled RE-ENTRY.
 */
function isFreshNewRelease(item: ChartItem, epochDays: number): boolean {
  const daysOut = (item as any).daysSinceRelease;
  const weeks = item.weeksOnChart || item.weeks || 1;

  // Player song/album in its first week or first 7 days since release is ALWAYS a fresh release
  if (item.isPlayer) {
    if (daysOut !== undefined && daysOut <= 7) return true;
    if (weeks <= 1 && (item.lastPosition === null || item.lastPosition === undefined)) return true;
  }

  // NPC song/album released within the last 7 days (when game has advanced past Day 0)
  if (epochDays > 0 && daysOut !== undefined && daysOut <= 7) {
    return true;
  }

  return false;
}

/**
 * Generates an organic daily/weekly competitive velocity multiplier (0.48x to 1.82x)
 * that shifts significantly on EVERY new day and week so NPC songs/albums genuinely
 * trade ranks (+, -), drop out of the chart, re-enter (RE-ENTRY), and debut (NEW).
 */
export function getDailyCompetitiveRankWave(
  artist: string,
  title: string,
  currentDateInput?: string | Date,
  platform: string = 'spotify',
  region: string = 'global'
): number {
  const epochDays = getEpochDays(currentDateInput);
  const baseSeed = hashString(`${artist}::${title}::${platform}::${region}`);
  const dailyHash = hashString(`${artist}::${title}::${platform}::${region}::day_${epochDays}`);

  // 1. Discrete daily momentum swing (-32% to +42%) so each new day actively re-orders nearby songs
  const dailySwing = ((dailyHash % 75) - 32) / 100;

  // 2. Multi-day trend wave (3-day and 7-day cycles)
  const fastWave = Math.sin(epochDays * 1.65 + (baseSeed % 37)) * 0.18;
  const weeklyWave = Math.cos(epochDays * 0.72 + ((baseSeed >> 3) % 23)) * 0.14;

  // 3. Viral breakout / TikTok resurgence or temporary dip (creates real RE-ENTRY & big climbers!)
  const viralBucket = dailyHash % 100;
  let eventMultiplier = 1.0;
  if (viralBucket < 8) {
    eventMultiplier = 1.35 + (viralBucket % 7) * 0.05;
  } else if (viralBucket >= 8 && viralBucket < 16) {
    eventMultiplier = 0.62 + (viralBucket % 5) * 0.03;
  }

  const combined = (1.0 + dailySwing + fastWave + weeklyWave) * eventMultiplier;
  return Math.max(0.45, Math.min(1.85, combined));
}

/**
 * Computes realistic movement for an entry when no `prevChart` exists or when
 * generating a lively daily/weekly chart distribution.
 * STRICT RULE: A fresh/new song (`isFreshNewRelease`) can NEVER be assigned `'re-entry'`.
 */
function computeDynamicEntryMovement(
  item: ChartItem,
  currentRank: number,
  chartLimit: number,
  epochDays: number,
  chartKey: string
): {
  status: ChartMovementStatus;
  lastPosition: number | null;
  peakPosition: number;
  weeksOnChart: number;
  isReEntry: boolean;
} {
  const seed = hashString(
    `${item.artist}::${item.title}::${chartKey}::day_${epochDays}::rank_${currentRank}`
  );
  const weeks = Math.max(1, item.weeksOnChart || item.weeks || 1 + Math.floor(epochDays / 7));
  const daysOut = (item as any).daysSinceRelease ?? weeks * 7;
  const freshRelease = isFreshNewRelease(item, epochDays);

  // Brand-new player release on its debut or within first 2 days
  if (item.isPlayer && (daysOut <= 2 || (weeks <= 1 && item.lastPosition == null))) {
    return {
      status: 'new',
      lastPosition: null,
      peakPosition: currentRank,
      weeksOnChart: 1,
      isReEntry: false
    };
  }

  // Brand-new NPC release dropped within the last 2 days
  if (!item.isPlayer && epochDays > 0 && daysOut <= 2) {
    return {
      status: 'new',
      lastPosition: null,
      peakPosition: currentRank,
      weeksOnChart: 1,
      isReEntry: false
    };
  }

  // Deterministic per-day bucket (0..99) that changes every day (`epochDays`)
  const bucket = (seed + currentRank * 19 + epochDays * 31) % 100;

  // 1. NEW DEBUT (~6% of chart slots for genuinely fresh tracks)
  if (!item.isPlayer && bucket < 6 && currentRank > 3 && daysOut <= 14) {
    return {
      status: 'new',
      lastPosition: null,
      peakPosition: currentRank,
      weeksOnChart: 1,
      isReEntry: false
    };
  }

  // 2. RE-ENTRY (~7% of chart slots, ONLY allowed for older catalog songs that have been out > 14 days and > 2 weeks!)
  if (
    !freshRelease &&
    !item.isPlayer &&
    daysOut > 14 &&
    weeks >= 2 &&
    bucket >= 6 &&
    bucket < 13 &&
    currentRank >= 10
  ) {
    const estWeeks = Math.max(3, weeks);
    const estPeak = Math.max(1, Math.min(currentRank, currentRank - ((seed % 15) + 2)));
    return {
      status: 're-entry',
      lastPosition: null,
      peakPosition: estPeak,
      weeksOnChart: estWeeks,
      isReEntry: true
    };
  }

  // 3. EQUAL '=' (~10% of chart slots — e.g. #1 powerhouse hold or occasional steady rank)
  if ((currentRank === 1 && bucket < 35) || (bucket >= 13 && bucket < 23)) {
    const estPeak = Math.max(1, Math.min(currentRank, currentRank - (seed % 4)));
    return {
      status: 'equal',
      lastPosition: currentRank,
      peakPosition: estPeak,
      weeksOnChart: Math.max(2, weeks),
      isReEntry: false
    };
  }

  // 4. UP '▲' (~40% of chart slots)
  if (bucket >= 23 && bucket < 63) {
    const maxUpStep = Math.min(14, Math.max(2, Math.floor(chartLimit * 0.2)));
    const step = 1 + (seed % maxUpStep);
    const prevRank = Math.min(chartLimit, currentRank + step);
    if (prevRank > currentRank) {
      return {
        status: 'up',
        lastPosition: prevRank,
        peakPosition: Math.min(currentRank, Math.max(1, currentRank - (seed % 3))),
        weeksOnChart: Math.max(2, weeks),
        isReEntry: false
      };
    }
    // If at very bottom of chart (currentRank === chartLimit), make it move down from a higher rank instead of false RE-ENTRY
    const fallbackPrev = Math.max(1, currentRank - (1 + (seed % 5)));
    return {
      status: 'down',
      lastPosition: fallbackPrev,
      peakPosition: fallbackPrev,
      weeksOnChart: Math.max(2, weeks),
      isReEntry: false
    };
  }

  // 5. DOWN '▼' (remaining ~37% of chart slots)
  if (currentRank > 1) {
    const maxDownStep = Math.min(12, Math.max(1, currentRank - 1));
    const downStep = 1 + (seed % maxDownStep);
    const prevRank = Math.max(1, currentRank - downStep);
    return {
      status: 'down',
      lastPosition: prevRank,
      peakPosition: Math.min(prevRank, Math.max(1, prevRank - (seed % 4))),
      weeksOnChart: Math.max(2, weeks),
      isReEntry: false
    };
  }

  // If currentRank === 1, climb from #2 or #3
  const prevForNum1 = 2 + (seed % 3);
  return {
    status: 'up',
    lastPosition: prevForNum1,
    peakPosition: 1,
    weeksOnChart: Math.max(2, weeks),
    isReEntry: false
  };
}

/**
 * Applies a realistic competitive neighbor rank shuffle to NPC tracks when too many items
 * in `newChart` landed on the exact same index as `prevChart`, ensuring real rank swaps!
 */
function ensureCompetitiveNpcMobility(
  newChart: ChartItem[],
  prevChart: ChartItem[] | null | undefined,
  epochDays: number,
  chartKey: string
): ChartItem[] {
  if (!prevChart || prevChart.length === 0 || newChart.length < 4) {
    return newChart;
  }

  const prevRankByKey = new Map<string, number>();
  prevChart.forEach((p, idx) => {
    prevRankByKey.set(makeEntryKey(p.artist, p.title), idx + 1);
  });

  let sameRankCount = 0;
  newChart.forEach((item, idx) => {
    const prevRank = prevRankByKey.get(makeEntryKey(item.artist, item.title));
    if (prevRank === idx + 1) {
      sameRankCount++;
    }
  });

  if (sameRankCount <= Math.ceil(newChart.length * 0.16)) {
    return newChart;
  }

  const working = [...newChart];
  const n = working.length;

  for (let i = 0; i < n - 1; i++) {
    const itemA = working[i];
    if (itemA.isPlayer) continue;

    const keyA = makeEntryKey(itemA.artist, itemA.title);
    const prevRankA = prevRankByKey.get(keyA);
    const seed = hashString(`${keyA}::${chartKey}::mobility_${epochDays}_${i}`);

    if (i === 0 && seed % 100 < 35) continue;
    if (prevRankA !== i + 1 && seed % 100 < 40) continue;

    const offset = 1 + (seed % Math.min(4, n - 1 - i));
    const j = i + offset;
    const itemB = working[j];
    if (!itemB || itemB.isPlayer) continue;

    const ptsA = itemA.points;
    const ptsB = itemB.points;
    working[i] = {
      ...itemB,
      points: Math.max(ptsA, ptsB),
      score: Math.max(ptsA, ptsB)
    };
    working[j] = {
      ...itemA,
      points: Math.min(ptsA, ptsB),
      score: Math.min(ptsA, ptsB)
    };
  }

  return working;
}

/**
 * Enriches and synchronizes any chart array against its previous edition (if available)
 * and historical chart registry, populating `lastPosition`, `peakPosition`, `weeksOnChart`,
 * `isReEntry`, `movementStatus`, and `movementDelta` on every item.
 */
export function synchronizeAndEnrichChartMovements(
  newChart: ChartItem[],
  prevChart: ChartItem[] | null | undefined,
  chartKey: string = 'default_chart',
  isWeeklyChart: boolean = false,
  currentDateInput?: string | Date
): ChartItem[] {
  if (!newChart || newChart.length === 0) return [];

  const epochDays = getEpochDays(currentDateInput);

  let historyMap = chartHistoryRegistry.get(chartKey);
  if (!historyMap) {
    historyMap = new Map<string, HistoricalChartEntry>();
    chartHistoryRegistry.set(chartKey, historyMap);
  }

  // ONLY record history from confirmed `prevChart` editions (previous days/weeks)!
  // This prevents a brand-new song generated on the current day from being mistaken as "already charted" on the same day.
  if (prevChart && prevChart.length > 0) {
    prevChart.forEach((p, idx) => {
      const k = makeEntryKey(p.artist, p.title);
      const existing = historyMap!.get(k);
      const pRank = idx + 1;
      const pPeak = p.peakPosition || p.peak || pRank;
      const pWeeks = p.weeksOnChart || p.weeks || 1;
      const prevEpoch = Math.max(0, epochDays - 1);
      historyMap!.set(k, {
        peakPosition: existing ? Math.min(existing.peakPosition, pPeak, pRank) : Math.min(pPeak, pRank),
        weeksOnChart: existing ? Math.max(existing.weeksOnChart, pWeeks) : pWeeks,
        lastSeenRank: pRank,
        firstSeenEpochDay: existing ? existing.firstSeenEpochDay : prevEpoch,
        lastSeenEpochDay: prevEpoch,
        timesChartedInPrevEditions: existing ? existing.timesChartedInPrevEditions + 1 : 1
      });
    });
  }

  const hasValidPrevChart = Boolean(prevChart && prevChart.length > 0);
  const mobileChart = hasValidPrevChart
    ? ensureCompetitiveNpcMobility(newChart, prevChart, epochDays, chartKey)
    : newChart;
  const chartLimit = mobileChart.length;

  let equalCountSoFar = 0;
  const maxAllowedEquals = Math.max(3, Math.floor(chartLimit * 0.14));

  return mobileChart.map((item, idx) => {
    const currentPos = idx + 1;
    const entryKey = makeEntryKey(item.artist, item.title);
    const historical = historyMap!.get(entryKey);
    const freshRelease = isFreshNewRelease(item, epochDays);

    if (hasValidPrevChart) {
      const prevIndex = prevChart!.findIndex(
        p => makeEntryKey(p.artist, p.title) === entryKey
      );

      if (prevIndex !== -1) {
        let lastPosition: number | null = prevIndex + 1;
        const prevItem = prevChart![prevIndex];
        const prevPeak = prevItem.peakPosition || prevItem.peak || lastPosition;
        let weeksOnChart = isWeeklyChart
          ? (prevItem.weeksOnChart || prevItem.weeks || 1) + 1
          : Math.max(prevItem.weeksOnChart || prevItem.weeks || 1, item.weeksOnChart || 1);

        let status: ChartMovementStatus = 'equal';
        let isReEntry = false;

        if (lastPosition > currentPos) {
          status = 'up';
        } else if (lastPosition < currentPos) {
          status = 'down';
        } else {
          if (item.isPlayer) {
            const playerDaysOut = (item as any).daysSinceRelease ?? 2;
            if (playerDaysOut <= 1 && weeksOnChart <= 1) {
              status = 'new';
              lastPosition = null;
            } else {
              status = 'equal';
              equalCountSoFar++;
            }
          } else {
            const holdSeed = hashString(`${entryKey}::${chartKey}::hold_${epochDays}`);
            const allowHold =
              equalCountSoFar < maxAllowedEquals &&
              ((currentPos <= 2 && holdSeed % 100 < 40) || holdSeed % 100 < 14);

            if (allowHold) {
              status = 'equal';
              equalCountSoFar++;
            } else {
              const dyn = computeDynamicEntryMovement(
                item,
                currentPos,
                chartLimit,
                epochDays,
                chartKey
              );
              status = dyn.status;
              lastPosition = dyn.lastPosition;
              isReEntry = dyn.isReEntry;
              weeksOnChart = Math.max(weeksOnChart, dyn.weeksOnChart);
            }
          }
        }

        const peakPosition = Math.min(
          prevPeak,
          currentPos,
          lastPosition !== null ? lastPosition : currentPos
        );

        return {
          ...item,
          lastPosition,
          lastWeek: lastPosition,
          peakPosition,
          peak: peakPosition,
          weeksOnChart,
          weeks: weeksOnChart,
          isReEntry,
          movementStatus: status,
          movementDelta: lastPosition !== null ? lastPosition - currentPos : 0,
          _movementEpochDay: epochDays
        } as ChartItem;
      } else {
        // Item was NOT in `prevChart`!
        // STRICT FIX: If this song/album is a fresh release (`freshRelease`) OR has never appeared in an earlier `prevChart` before,
        // it is 100% 'new' (NEW) — NEVER 're-entry'!
        const daysOut = (item as any).daysSinceRelease ?? 0;
        const itemWeeks = item.weeksOnChart || item.weeks || 1;

        const hasChartedInOlderEdition = Boolean(
          historical &&
            historical.timesChartedInPrevEditions >= 1 &&
            historical.firstSeenEpochDay < epochDays - 1
        );

        const isReEntry =
          !freshRelease &&
          (hasChartedInOlderEdition || (!item.isPlayer && daysOut > 14 && itemWeeks >= 3));

        const status: ChartMovementStatus = isReEntry ? 're-entry' : 'new';
        const peakPosition =
          isReEntry && historical
            ? Math.min(historical.peakPosition, currentPos)
            : currentPos;
        const weeksOnChart =
          isReEntry && historical
            ? historical.weeksOnChart + (isWeeklyChart ? 1 : 0)
            : isReEntry
            ? Math.max(2, itemWeeks)
            : 1;

        return {
          ...item,
          lastPosition: null,
          lastWeek: null,
          peakPosition,
          peak: peakPosition,
          weeksOnChart,
          weeks: weeksOnChart,
          isReEntry,
          movementStatus: status,
          movementDelta: 0,
          _movementEpochDay: epochDays
        } as ChartItem;
      }
    }

    // No prevChart passed (initial load or on-demand regional chart):
    const stampedEpoch = (item as any)._movementEpochDay;
    if (
      stampedEpoch === epochDays &&
      (item as any).movementStatus &&
      ((item as any).movementStatus !== 'new' || item.lastPosition !== null || (item as any).isReEntry)
    ) {
      // Double-check that a fresh release is never marked re-entry even if previously stamped
      if (freshRelease && (item as any).movementStatus === 're-entry') {
        return {
          ...item,
          lastPosition: null,
          lastWeek: null,
          isReEntry: false,
          movementStatus: 'new',
          movementDelta: 0
        } as ChartItem;
      }
      return item;
    }

    const simulated = computeDynamicEntryMovement(
      item,
      currentPos,
      chartLimit,
      epochDays,
      chartKey
    );

    return {
      ...item,
      lastPosition: simulated.lastPosition,
      lastWeek: simulated.lastPosition,
      peakPosition: simulated.peakPosition,
      peak: simulated.peakPosition,
      weeksOnChart: simulated.weeksOnChart,
      weeks: simulated.weeksOnChart,
      isReEntry: simulated.isReEntry,
      movementStatus: simulated.status,
      movementDelta:
        simulated.lastPosition !== null ? simulated.lastPosition - currentPos : 0,
      _movementEpochDay: epochDays
    } as ChartItem;
  });
}

/**
 * Resolves the exact movement metadata for any single ChartItem row at `currentRank` (1-indexed),
 * guaranteeing that a brand-new release is NEVER mislabeled as RE-ENTRY.
 */
export function resolveChartItemMovement(
  item: ChartItem,
  currentRank: number,
  chartLimit: number = 50,
  currentDateInput?: string | Date
): ComputedChartMovement {
  const epochDays = getEpochDays(currentDateInput);
  const explicitStatus = (item as any).movementStatus as ChartMovementStatus | undefined;
  const explicitReEntry = Boolean((item as any).isReEntry);
  const prevPos = item.lastPosition ?? item.lastWeek ?? null;
  const weeks = Math.max(1, item.weeksOnChart || item.weeks || 1);
  const peak = Math.min(item.peakPosition || item.peak || currentRank, currentRank);
  const freshRelease = isFreshNewRelease(item, epochDays);

  // If it's a fresh new release and has no previous position, it is ALWAYS 'new' (never 're-entry'!)
  if (freshRelease && prevPos === null) {
    return {
      status: 'new',
      delta: 0,
      lastPosition: null,
      peakPosition: currentRank,
      weeksOnChart: 1,
      isReEntry: false,
      isNew: true,
      badgeText: 'NEW'
    };
  }

  // 1. Explicit NEW
  if (explicitStatus === 'new' && prevPos === null) {
    return {
      status: 'new',
      delta: 0,
      lastPosition: null,
      peakPosition: currentRank,
      weeksOnChart: 1,
      isReEntry: false,
      isNew: true,
      badgeText: 'NEW'
    };
  }

  // 2. Explicit RE-ENTRY (only if NOT a fresh new release!)
  if (!freshRelease && (explicitStatus === 're-entry' || (explicitReEntry && prevPos === null))) {
    return {
      status: 're-entry',
      delta: 0,
      lastPosition: null,
      peakPosition: peak,
      weeksOnChart: Math.max(2, weeks),
      isReEntry: true,
      isNew: false,
      badgeText: 'RE-ENTRY'
    };
  }

  // 3. Valid previous position -> Up or Down
  if (prevPos !== null && prevPos !== undefined) {
    const delta = prevPos - currentRank;
    if (delta > 0) {
      return {
        status: 'up',
        delta,
        lastPosition: prevPos,
        peakPosition: Math.min(peak, currentRank),
        weeksOnChart: weeks,
        isReEntry: false,
        isNew: false,
        badgeText: `+${delta}`
      };
    }
    if (delta < 0) {
      return {
        status: 'down',
        delta,
        lastPosition: prevPos,
        peakPosition: Math.min(peak, prevPos),
        weeksOnChart: weeks,
        isReEntry: false,
        isNew: false,
        badgeText: `${delta}`
      };
    }

    const holdSeed = hashString(`${item.artist}::${item.title}::resolve_hold_${epochDays}`);
    if (item.isPlayer || (currentRank <= 2 && holdSeed % 100 < 38) || holdSeed % 100 < 14) {
      return {
        status: 'equal',
        delta: 0,
        lastPosition: prevPos,
        peakPosition: Math.min(peak, currentRank),
        weeksOnChart: weeks,
        isReEntry: false,
        isNew: false,
        badgeText: '='
      };
    }
  }

  // 4. Fallback / Dynamic resolution
  const simulated = computeDynamicEntryMovement(
    item,
    currentRank,
    chartLimit,
    epochDays,
    'live_ui_resolve'
  );
  const simDelta =
    simulated.lastPosition !== null ? simulated.lastPosition - currentRank : 0;

  return {
    status: simulated.status,
    delta: simDelta,
    lastPosition: simulated.lastPosition,
    peakPosition: simulated.peakPosition,
    weeksOnChart: simulated.weeksOnChart,
    isReEntry: simulated.isReEntry,
    isNew: simulated.status === 'new',
    badgeText:
      simulated.status === 'up'
        ? `+${simDelta}`
        : simulated.status === 'down'
        ? `${simDelta}`
        : simulated.status === 're-entry'
        ? 'RE-ENTRY'
        : simulated.status === 'new'
        ? 'NEW'
        : '='
  };
}
