// Player Billboard Artist History Tracker
// Tracks, updates, and formats player's official Billboard chart history across ALL regional charts
// matching the authentic Billboard.com Artist Chart History specification:
// - Stat counters: No. 1 Hits, Songs/Albums, Top 10 Hits
// - Table columns: Debut Date (M/D/YY), Peak Pos., Peak Date (M/D/YY), Wks. on Chart
// - Multi-region support: Hot 100, Global 200, Billboard 200 Albums, and all international country charts

import { ChartItem, GameState, PlayerBillboardHistoryItem } from '../types';
import { COUNTRY_NAMES } from '../constants';

/**
 * Formats a Date into standard Billboard Artist History format (M/D/YY, e.g. "2/22/25")
 */
export function formatBillboardHistoryDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '1/12/26';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = String(d.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Returns authentic banner and dropdown labels for any chart category or country code
 */
export function getChartRegionLabels(chartType: string): { banner: string; dropdown: string; category: string } {
  if (chartType === 'hot100' || chartType === 'US') {
    return {
      banner: 'BILLBOARD HOT 100™',
      dropdown: 'Billboard Hot 100™ (United States)',
      category: 'SONGS'
    };
  }
  if (chartType === 'global200') {
    return {
      banner: 'BILLBOARD GLOBAL 200™',
      dropdown: 'Billboard Global 200™ (Worldwide)',
      category: 'SONGS'
    };
  }
  if (chartType === 'albums200') {
    return {
      banner: 'BILLBOARD 200™',
      dropdown: 'Billboard 200™ (Albums)',
      category: 'ALBUMS'
    };
  }
  if (chartType === 'GB') {
    return {
      banner: 'UK OFFICIAL SINGLES CHART™',
      dropdown: 'UK Official Singles™ (United Kingdom)',
      category: 'SONGS'
    };
  }
  if (chartType === 'ID') {
    return {
      banner: 'BILLBOARD INDONESIA SONGS™',
      dropdown: 'Billboard Indonesia Songs™',
      category: 'SONGS'
    };
  }
  if (chartType === 'JP') {
    return {
      banner: 'BILLBOARD JAPAN HOT 100™',
      dropdown: 'Billboard Japan Hot 100™',
      category: 'SONGS'
    };
  }
  if (chartType === 'KR') {
    return {
      banner: 'BILLBOARD SOUTH KOREA SONGS™',
      dropdown: 'Billboard South Korea Songs™',
      category: 'SONGS'
    };
  }
  if (chartType === 'BR') {
    return {
      banner: 'BILLBOARD BRAZIL HOT 100™',
      dropdown: 'Billboard Brazil Hot 100™',
      category: 'SONGS'
    };
  }
  if (chartType === 'CA') {
    return {
      banner: 'BILLBOARD CANADIAN HOT 100™',
      dropdown: 'Billboard Canadian Hot 100™',
      category: 'SONGS'
    };
  }
  if (chartType === 'AU') {
    return {
      banner: 'ARIA TOP 100 SINGLES™',
      dropdown: 'ARIA Top 100 Singles™ (Australia)',
      category: 'SONGS'
    };
  }

  const countryName = COUNTRY_NAMES[chartType] || chartType;
  return {
    banner: `BILLBOARD ${countryName.toUpperCase()} TOP 100™`,
    dropdown: `Billboard ${countryName} Top 100™`,
    category: 'SONGS'
  };
}

/**
 * Updates player history records across all charts when Monday chart updates occur
 */
export function updatePlayerBillboardHistoryOnMonday(
  currentState: GameState,
  currentDate: Date
): Record<string, PlayerBillboardHistoryItem[]> {
  const historyMap: Record<string, PlayerBillboardHistoryItem[]> = {
    ...(currentState.billboard.playerHistory || {})
  };

  const formattedDate = formatBillboardHistoryDate(currentDate);

  const checkAndRecord = (
    chartItems: ChartItem[] = [],
    chartKey: string
  ) => {
    if (!historyMap[chartKey]) {
      historyMap[chartKey] = [];
    }
    const list = historyMap[chartKey];

    chartItems.forEach((item, idx) => {
      if (!item.isPlayer) return;
      const position = idx + 1;
      const existing = list.find(r => r.title.trim().toLowerCase() === item.title.trim().toLowerCase());

      if (!existing) {
        list.push({
          title: item.title,
          artist: item.artist,
          chartType: chartKey as any,
          debutDate: formattedDate,
          peakPosition: position,
          peakDate: formattedDate,
          weeksOnChart: 1,
          weeksAtPeak: 1,
          lastPosition: item.lastPosition || null,
          cover: item.cover || null,
          isPlayer: true,
          points: item.points,
          stats: item.stats
        });
      } else {
        existing.weeksOnChart = (existing.weeksOnChart || 1) + 1;
        existing.lastPosition = item.lastPosition || null;
        existing.points = item.points;
        if (item.stats) existing.stats = item.stats;
        if (position < existing.peakPosition) {
          existing.peakPosition = position;
          existing.peakDate = formattedDate;
          existing.weeksAtPeak = 1;
        } else if (position === existing.peakPosition) {
          existing.weeksAtPeak = (existing.weeksAtPeak || 1) + 1;
        }
      }
    });
  };

  // 1. Hot 100 (US)
  checkAndRecord(currentState.billboard.hot100 || [], 'hot100');
  checkAndRecord(currentState.billboard.hot100 || [], 'US');

  // 2. Global 200
  checkAndRecord(currentState.billboard.global200 || [], 'global200');

  // 3. Billboard 200 Albums
  checkAndRecord(currentState.billboard.albums200 || [], 'albums200');

  // 4. All Regional Country Charts
  if (currentState.billboard.regionalSingles) {
    Object.entries(currentState.billboard.regionalSingles).forEach(([regionCode, items]) => {
      checkAndRecord(items, regionCode);
    });
  }

  return historyMap;
}

/**
 * Retrieves player artist chart history records for any selected chart (Global, Hot 100, Albums, or Regional)
 */
export function getPlayerBillboardRecords(
  state: GameState,
  chartType: string
): {
  records: PlayerBillboardHistoryItem[];
  no1Hits: number;
  totalSongs: number;
  top10Hits: number;
} {
  const storedList = state.billboard.playerHistory?.[chartType] || [];
  const recordsMap = new Map<string, PlayerBillboardHistoryItem>();

  // 1. Add stored history items
  storedList.forEach(item => {
    recordsMap.set(item.title.trim().toLowerCase(), { ...item });
  });

  // 2. Scan currently active chart items in this game state
  let activeChart: ChartItem[] = [];
  if (chartType === 'hot100' || chartType === 'US') {
    activeChart = state.billboard.hot100 || state.billboard.regionalSingles?.['US'] || [];
  } else if (chartType === 'global200') {
    activeChart = state.billboard.global200 || [];
  } else if (chartType === 'albums200') {
    activeChart = state.billboard.albums200 || [];
  } else if (state.billboard.regionalSingles?.[chartType]) {
    activeChart = state.billboard.regionalSingles[chartType];
  }

  const currentDateFormatted = formatBillboardHistoryDate(state.date);

  activeChart.forEach((item, idx) => {
    if (!item.isPlayer) return;
    const key = item.title.trim().toLowerCase();
    const pos = idx + 1;

    if (!recordsMap.has(key)) {
      recordsMap.set(key, {
        title: item.title,
        artist: item.artist,
        chartType: chartType as any,
        debutDate: currentDateFormatted,
        peakPosition: pos,
        peakDate: currentDateFormatted,
        weeksOnChart: item.weeksOnChart || 1,
        weeksAtPeak: 1,
        lastPosition: item.lastPosition || null,
        cover: item.cover || null,
        isPlayer: true,
        points: item.points,
        stats: item.stats
      });
    } else {
      const rec = recordsMap.get(key)!;
      if (pos < rec.peakPosition) {
        rec.peakPosition = pos;
        rec.peakDate = currentDateFormatted;
        rec.weeksAtPeak = 1;
      } else if (pos === rec.peakPosition && rec.weeksOnChart < (item.weeksOnChart || 1)) {
        rec.weeksAtPeak = (rec.weeksAtPeak || 1) + 1;
      }
      rec.weeksOnChart = Math.max(rec.weeksOnChart, item.weeksOnChart || 1);
      rec.points = item.points;
      if (item.stats) rec.stats = item.stats;
    }
  });

  // Sort records by peakPosition ascending (No. 1 hits first, etc.)
  const records = Array.from(recordsMap.values()).sort((a, b) => {
    if (a.peakPosition !== b.peakPosition) {
      return a.peakPosition - b.peakPosition;
    }
    return (b.weeksOnChart || 0) - (a.weeksOnChart || 0);
  });

  const no1Hits = records.filter(r => r.peakPosition === 1).length;
  const totalSongs = records.length;
  const top10Hits = records.filter(r => r.peakPosition <= 10).length;

  return {
    records,
    no1Hits,
    totalSongs,
    top10Hits
  };
}
