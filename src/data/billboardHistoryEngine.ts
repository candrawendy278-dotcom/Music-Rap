// Billboard Chart History Engine
// Provides functionality to archive, manage, search, and view historical weekly chart snapshots
// from previous tracking weeks in the game.

import { ChartItem, GameState, WeeklyChartSnapshot } from '../types';

/**
 * Formats a Date object into standard Billboard Chart Week label (e.g. "Week of Jan 19, 2026")
 */
export function formatBillboardChartWeekLabel(date: Date | string): { label: string; formattedDate: string; isoDate: string } {
  const d = typeof date === 'string' ? new Date(date) : date;
  const isoDate = d.toISOString().split('T')[0];
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const fullOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  
  const shortDate = d.toLocaleDateString('en-US', options);
  const formattedDate = d.toLocaleDateString('en-US', fullOptions);
  
  return {
    label: `Week of ${shortDate}`,
    formattedDate,
    isoDate
  };
}

/**
 * Clones and compacts chart items: keeps top N items + all player-owned records
 */
function cloneAndCompactChartItems(items: ChartItem[] = [], maxRank: number = 40): ChartItem[] {
  const result: ChartItem[] = [];
  const playerItems: ChartItem[] = [];

  items.forEach((item, index) => {
    const compactItem: ChartItem = {
      title: item.title,
      artist: item.artist,
      points: Math.round(item.points || 0),
      isPlayer: !!item.isPlayer,
      lastPosition: item.lastPosition ?? null,
      peakPosition: item.peakPosition ?? (index + 1),
      weeksOnChart: item.weeksOnChart ?? 1,
      cover: item.cover || null,
      stats: item.stats ? {
        streams: Math.round(item.stats.streams || 0),
        sales: Math.round(item.stats.sales || 0),
        radio: Math.round(item.stats.radio || 0)
      } : undefined
    };

    if (item.isPlayer) {
      playerItems.push(compactItem);
    } else if (index < maxRank) {
      result.push(compactItem);
    }
  });

  playerItems.forEach(pItem => {
    if (!result.some(r => r.title === pItem.title && r.artist === pItem.artist)) {
      result.push(pItem);
    }
  });

  return result;
}

/**
 * Records a new weekly chart snapshot into the history array on Monday.
 * Prevents duplicate snapshots on the same date and limits history to the recent 14 weeks.
 */
export function recordWeeklyChartSnapshot(
  existingHistory: WeeklyChartSnapshot[] = [],
  state: GameState,
  currentDate: Date
): WeeklyChartSnapshot[] {
  const { label, formattedDate, isoDate } = formatBillboardChartWeekLabel(currentDate);
  const weekNumber = existingHistory.length + 1;

  // Clone and compact Billboard state (pruning to top 40 + all player items)
  const snapshot: WeeklyChartSnapshot = {
    date: isoDate,
    formattedDate,
    weekNumber,
    label,
    hot100: cloneAndCompactChartItems(state.billboard.hot100, 40),
    global200: cloneAndCompactChartItems(state.billboard.global200 || [], 40),
    albums200: cloneAndCompactChartItems(state.billboard.albums200 || [], 30),
    regionalSingles: state.billboard.regionalSingles ? Object.fromEntries(
      Object.entries(state.billboard.regionalSingles)
        .map(([k, v]) => [k, v.filter(item => item.isPlayer)])
        .filter(([_, v]) => v.length > 0)
    ) : {}
  };

  // Filter out any existing snapshot with same ISO date
  const filtered = existingHistory.filter(h => h.date !== isoDate);
  
  // Return updated history sorted by date descending, capped at 14 weeks
  return [snapshot, ...filtered].slice(0, 14);
}

/**
 * Searches across all historical snapshots for any track title or artist.
 * Returns each week the song charted, its position, and weekly performance stats.
 */
export interface HistoricalSongAppearance {
  weekDate: string;
  weekLabel: string;
  chartType: 'global200' | 'hot100' | 'albums200';
  position: number;
  points: number;
  stats?: {
    streams: number;
    sales: number;
    radio: number;
  };
}

export interface HistoricalSongMatch {
  title: string;
  artist: string;
  isPlayer: boolean;
  cover?: string | null;
  peakPosition: number;
  weeksCount: number;
  appearances: HistoricalSongAppearance[];
}

export function searchSongsAcrossHistory(
  history: WeeklyChartSnapshot[],
  query: string
): HistoricalSongMatch[] {
  if (!query || query.trim().length === 0) return [];
  const cleanQuery = query.toLowerCase().trim();
  const matchesMap = new Map<string, HistoricalSongMatch>();

  history.forEach(snapshot => {
    const checkList = [
      { list: snapshot.global200 || [], type: 'global200' as const },
      { list: snapshot.hot100 || [], type: 'hot100' as const },
      { list: snapshot.albums200 || [], type: 'albums200' as const }
    ];

    checkList.forEach(({ list, type }) => {
      list.forEach((item, idx) => {
        const titleMatch = item.title.toLowerCase().includes(cleanQuery);
        const artistMatch = item.artist.toLowerCase().includes(cleanQuery);

        if (titleMatch || artistMatch) {
          const key = `${item.title.toLowerCase()}___${item.artist.toLowerCase()}`;
          const position = idx + 1;

          if (!matchesMap.has(key)) {
            matchesMap.set(key, {
              title: item.title,
              artist: item.artist,
              isPlayer: item.isPlayer,
              cover: item.cover,
              peakPosition: position,
              weeksCount: 1,
              appearances: [{
                weekDate: snapshot.date,
                weekLabel: snapshot.label,
                chartType: type,
                position,
                points: item.points,
                stats: item.stats
              }]
            });
          } else {
            const entry = matchesMap.get(key)!;
            entry.peakPosition = Math.min(entry.peakPosition, position);
            entry.weeksCount += 1;
            entry.appearances.push({
              weekDate: snapshot.date,
              weekLabel: snapshot.label,
              chartType: type,
              position,
              points: item.points,
              stats: item.stats
            });
          }
        }
      });
    });
  });

  return Array.from(matchesMap.values()).sort((a, b) => a.peakPosition - b.peakPosition);
}

/**
 * Initializes past archive weeks if history is empty (e.g. newly loaded game),
 * generating archival snapshots for previous weeks of 2026.
 */
export function seedInitialChartHistoryIfEmpty(
  currentState: GameState,
  currentDate: Date
): WeeklyChartSnapshot[] {
  if (currentState.billboard.history && currentState.billboard.history.length > 0) {
    return currentState.billboard.history;
  }

  const initialHistory: WeeklyChartSnapshot[] = [];
  const currentWeekTime = currentDate.getTime();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // Generate 2 past weeks archival baseline
  for (let i = 2; i >= 1; i--) {
    const pastDate = new Date(currentWeekTime - (i * ONE_WEEK_MS));
    const { label, formattedDate, isoDate } = formatBillboardChartWeekLabel(pastDate);

    // Create authentic past snapshots based on current chart items with realistic historical shifts
    const pastHot100 = (currentState.billboard.hot100 || []).map((item, idx) => {
      const shift = (item.title.length + i) % 5 - 2;
      const pastPts = Math.round(item.points * (0.92 + (shift * 0.04)));
      return {
        ...item,
        points: pastPts,
        lastPosition: Math.max(1, idx + 1 + shift),
        weeksOnChart: Math.max(1, (item.weeksOnChart || 1) - i),
        stats: item.stats ? {
          streams: Math.round(item.stats.streams * (0.92 + (shift * 0.04))),
          sales: Math.round(item.stats.sales * (0.92 + (shift * 0.04))),
          radio: Math.round(item.stats.radio * (0.92 + (shift * 0.04)))
        } : undefined
      };
    });

    const pastGlobal200 = (currentState.billboard.global200 || []).map((item, idx) => {
      const shift = (item.title.length + i * 2) % 7 - 3;
      const pastPts = Math.round(item.points * (0.90 + (shift * 0.03)));
      return {
        ...item,
        points: pastPts,
        lastPosition: Math.max(1, idx + 1 + shift),
        weeksOnChart: Math.max(1, (item.weeksOnChart || 1) - i),
        stats: item.stats ? {
          streams: Math.round(item.stats.streams * (0.90 + (shift * 0.03))),
          sales: Math.round(item.stats.sales * (0.90 + (shift * 0.03))),
          radio: 0
        } : undefined
      };
    });

    const pastAlbums200 = (currentState.billboard.albums200 || []).map((item, idx) => {
      const shift = (item.title.length + i) % 4 - 2;
      const pastPts = Math.round(item.points * (0.94 + (shift * 0.03)));
      return {
        ...item,
        points: pastPts,
        lastPosition: Math.max(1, idx + 1 + shift),
        weeksOnChart: Math.max(1, (item.weeksOnChart || 1) - i),
        stats: item.stats ? {
          streams: Math.round(item.stats.streams * (0.94 + (shift * 0.03))),
          sales: Math.round(item.stats.sales * (0.94 + (shift * 0.03))),
          radio: 0
        } : undefined
      };
    });

    initialHistory.push({
      date: isoDate,
      formattedDate,
      weekNumber: 3 - i,
      label,
      hot100: pastHot100,
      global200: pastGlobal200,
      albums200: pastAlbums200,
      regionalSingles: currentState.billboard.regionalSingles || {}
    });
  }

  // Also include the current week if already started
  const { label: currLabel, formattedDate: currFormatted, isoDate: currIso } = formatBillboardChartWeekLabel(currentDate);
  initialHistory.unshift({
    date: currIso,
    formattedDate: currFormatted,
    weekNumber: 3,
    label: currLabel,
    hot100: cloneAndCompactChartItems(currentState.billboard.hot100 || [], 40),
    global200: cloneAndCompactChartItems(currentState.billboard.global200 || [], 40),
    albums200: cloneAndCompactChartItems(currentState.billboard.albums200 || [], 30),
    regionalSingles: currentState.billboard.regionalSingles ? Object.fromEntries(
      Object.entries(currentState.billboard.regionalSingles)
        .map(([k, v]) => [k, v.filter(item => item.isPlayer)])
        .filter(([_, v]) => v.length > 0)
    ) : {}
  });

  return initialHistory;
}
