import { ChartItem, GameState } from '../types';
import { calculateRegionalBillboardBreakdown } from './billboardRegionalBreakdownEngine';
import { resolveChartItemMovement } from './chartMovementAndReEntryEngine';

export type ChartMoveResult = ReturnType<typeof resolveChartItemMovement>;

export interface ComprehensiveBillboardBreakdown {
  chartTypeLabel: string;
  regionLabel: string;
  marketDescription: string;
  isAlbumChart: boolean;
  totalWeeklyUnits: number;

  // Singles Metrics (Hot 100 / Global 200 / Regional Top 100)
  onDemandAudioStreams: number;
  videoStreams: number;
  totalStreamsSES: number;
  pureDigitalSales: number;
  radioAirplayImpressions: number;

  // Album Metrics (Billboard 200)
  pureAlbumSales: number;
  seaUnits: number; // Streaming Equivalent Albums (1,500 on-demand streams = 1 unit)
  teaUnits: number; // Track Equivalent Albums (10 track sales = 1 unit)
  albumOnDemandStreams: number;
  individualTrackSales: number;

  // Point Share Percentages (sums to 100%)
  share1Label: string;
  share1Pct: number;
  share1Color: string;
  share1Subtext: string;

  share2Label: string;
  share2Pct: number;
  share2Color: string;
  share2Subtext: string;

  share3Label: string;
  share3Pct: number;
  share3Color: string;
  share3Subtext: string;

  // Formula Explanation & Velocity Telemetry
  formulaSummaryText: string;
  pacingNextWeekProjection: number;
  certificationStatus: string;
  territorialHighlight: string;
}

/**
 * Generates an accurate, Luminate-grade Billboard breakdown for any entry on:
 * 1. US Billboard Hot 100 (Streams + Pure Sales + Radio Airplay)
 * 2. Billboard Global 200 (Worldwide On-Demand Audio/Video Streams + Pure Sales, 0 Radio)
 * 3. Regional Singles Top 100 (Country-calibrated Streams + Sales + Local Airplay)
 * 4. Billboard 200 Albums (Pure Album Sales + SEA [1,500 streams = 1 unit] + TEA [10 track sales = 1 unit])
 */
export function buildComprehensiveBillboardBreakdown(
  item: ChartItem,
  region: string,
  isAlbumChart: boolean,
  move: ChartMoveResult,
  state: GameState
): ComprehensiveBillboardBreakdown {
  const totalWeeklyUnits = Math.max(100, Math.round(Number(item.points || 1000)));
  const baseRegional = calculateRegionalBillboardBreakdown(totalWeeklyUnits, region, isAlbumChart);

  const playerSong =
    !isAlbumChart && item.isPlayer
      ? state.songs.find(s => s.id === Number(item.id) || s.title.toLowerCase() === item.title.toLowerCase())
      : null;

  const playerProject =
    isAlbumChart && item.isPlayer
      ? state.projects.find(p => p.id === Number(item.id) || p.title.toLowerCase() === item.title.toLowerCase())
      : null;

  if (isAlbumChart) {
    // BILLBOARD 200 ALBUMS FORMULA:
    // Total Album Units = Pure Album Sales + SEA (On-Demand Track Streams / 1,500) + TEA (Track Sales / 10)
    const rawPurePct = playerProject ? 0.34 : 0.28;
    const rawTeaPct = 0.04;

    const pureAlbumSales =
      playerProject && (playerProject.weeklyPureSales || 0) > 0
        ? Math.min(Math.round(totalWeeklyUnits * 0.65), playerProject.weeklyPureSales)
        : Math.max(10, Math.round(totalWeeklyUnits * rawPurePct));

    const teaUnits = Math.max(5, Math.round(totalWeeklyUnits * rawTeaPct));
    const seaUnits = Math.max(50, totalWeeklyUnits - pureAlbumSales - teaUnits);

    const albumOnDemandStreams = seaUnits * 1500;
    const individualTrackSales = teaUnits * 10;

    const share1Pct = Math.round((seaUnits / totalWeeklyUnits) * 100);
    const share2Pct = Math.round((pureAlbumSales / totalWeeklyUnits) * 100);
    const share3Pct = Math.max(1, 100 - share1Pct - share2Pct);

    const totalHistoricalUnits = totalWeeklyUnits * Math.max(1, move.weeksOnChart) * 0.85;
    let certificationStatus = 'Eligible for Chart Certification';
    if (totalHistoricalUnits >= 2_000_000) certificationStatus = 'RIAA 2x Multi-Platinum Eligible';
    else if (totalHistoricalUnits >= 1_000_000) certificationStatus = 'RIAA Platinum Eligible (1M+ Units)';
    else if (totalHistoricalUnits >= 500_000) certificationStatus = 'RIAA Gold Eligible (500K+ Units)';

    return {
      chartTypeLabel: 'Billboard 200 (Albums & EPs)',
      regionLabel: 'United States (Luminate)',
      marketDescription: 'Pure Album Copies + SEA (1,500 Streams = 1 Unit) + TEA (10 Track Sales = 1 Unit)',
      isAlbumChart: true,
      totalWeeklyUnits,
      onDemandAudioStreams: albumOnDemandStreams,
      videoStreams: 0,
      totalStreamsSES: albumOnDemandStreams,
      pureDigitalSales: pureAlbumSales,
      radioAirplayImpressions: 0,
      pureAlbumSales,
      seaUnits,
      teaUnits,
      albumOnDemandStreams,
      individualTrackSales,
      share1Label: 'SEA (Streaming Equivalent)',
      share1Pct,
      share1Color: 'bg-blue-600',
      share1Subtext: `${seaUnits.toLocaleString()} units (${albumOnDemandStreams.toLocaleString()} streams)`,
      share2Label: 'Pure Album Sales',
      share2Pct,
      share2Color: 'bg-emerald-600',
      share2Subtext: `${pureAlbumSales.toLocaleString()} physical & digital albums`,
      share3Label: 'TEA (Track Equivalent)',
      share3Pct,
      share3Color: 'bg-amber-500',
      share3Subtext: `${teaUnits.toLocaleString()} units (${individualTrackSales.toLocaleString()} track downloads)`,
      formulaSummaryText: '1 Album Unit = 1 Pure Album Sale OR 1,500 On-Demand Audio Streams (SEA) OR 10 Digital Track Sales (TEA).',
      pacingNextWeekProjection: Math.round(totalWeeklyUnits * (move.status === 'up' || move.status === 'new' ? 1.04 : 0.93)),
      certificationStatus,
      territorialHighlight: 'Strongest physical & vinyl collector share in US Metro Markets'
    };
  }

  // SINGLES CHARTS:
  // 1. Billboard Global 200 (200+ Territories, Streams + Digital Sales, 0 Radio)
  // 2. US Hot 100 (On-Demand Audio + Official Video + Digital/Physical Singles + US Radio Airplay)
  // 3. Regional Singles Top 100 (Country-specific Streams + Local Sales + Local Airplay)
  const isGlobal = region === 'global';
  const isUS = region === 'US';

  const actualStreams =
    item.stats?.streams && item.stats.streams > 0
      ? item.stats.streams
      : playerSong && (playerSong.weeklyStreams || 0) > 0 && isGlobal
      ? playerSong.weeklyStreams
      : baseRegional.streamsSES;

  const actualSales =
    item.stats?.sales && item.stats.sales > 0
      ? item.stats.sales
      : playerSong && (playerSong.weeklyPureSales || 0) > 0 && isGlobal
      ? playerSong.weeklyPureSales
      : baseRegional.pureSalesDirect;

  const actualRadio = isGlobal
    ? 0
    : item.stats?.radio !== undefined && item.stats.radio > 0 && isUS
    ? item.stats.radio
    : baseRegional.radioImpressions;

  // Split total streams into On-Demand Audio (~83%) vs Official Music Video (~17%)
  const videoShareRatio = playerSong?.hasMV || item.hasMV ? 0.21 : 0.14;
  const videoStreams = Math.round(actualStreams * videoShareRatio);
  const onDemandAudioStreams = Math.max(0, actualStreams - videoStreams);

  // Calculate point contributions for share bars
  let streamPointsWeight = isGlobal ? 0.86 : isUS ? 0.68 : 0.72;
  let salesPointsWeight = isGlobal ? 0.14 : isUS ? 0.12 : 0.11;

  if (actualRadio === 0 && !isGlobal) {
    streamPointsWeight = 0.85;
    salesPointsWeight = 0.15;
  }

  const share1Pct = Math.round(streamPointsWeight * 100);
  const share2Pct = Math.round(salesPointsWeight * 100);
  const share3Pct = isGlobal ? 0 : Math.max(0, 100 - share1Pct - share2Pct);

  const cumulativeStreamsEst = actualStreams * Math.max(1, move.weeksOnChart);
  let certificationStatus = 'Charting Single';
  if (cumulativeStreamsEst >= 500_000_000) certificationStatus = 'RIAA 3x Multi-Platinum Single';
  else if (cumulativeStreamsEst >= 150_000_000) certificationStatus = 'RIAA Platinum Single Eligible';
  else if (cumulativeStreamsEst >= 75_000_000) certificationStatus = 'RIAA Gold Single Eligible';

  return {
    chartTypeLabel: isGlobal
      ? 'Billboard Global 200'
      : isUS
      ? 'Billboard Hot 100'
      : `${baseRegional.countryName} Top 100 Singles`,
    regionLabel: baseRegional.countryName,
    marketDescription: baseRegional.marketDescription,
    isAlbumChart: false,
    totalWeeklyUnits,
    onDemandAudioStreams,
    videoStreams,
    totalStreamsSES: actualStreams,
    pureDigitalSales: actualSales,
    radioAirplayImpressions: actualRadio,
    pureAlbumSales: 0,
    seaUnits: 0,
    teaUnits: 0,
    albumOnDemandStreams: 0,
    individualTrackSales: 0,
    share1Label: isGlobal ? 'Global On-Demand Streams' : 'Streaming (Audio + Video)',
    share1Pct: isGlobal ? 100 - share2Pct : share1Pct,
    share1Color: 'bg-blue-600',
    share1Subtext: `${onDemandAudioStreams.toLocaleString()} audio · ${videoStreams.toLocaleString()} video`,
    share2Label: 'Pure Digital/Physical Sales',
    share2Pct,
    share2Color: 'bg-emerald-600',
    share2Subtext: `${actualSales.toLocaleString()} direct downloads & single copies`,
    share3Label: isGlobal ? 'Radio Airplay (Excluded on Global 200)' : 'Radio Airplay Audience',
    share3Pct,
    share3Color: isGlobal ? 'bg-gray-300' : 'bg-purple-600',
    share3Subtext: isGlobal
      ? 'Global 200 ranks purely on worldwide streaming & sales'
      : `${actualRadio.toLocaleString()} weekly terrestrial airplay impressions`,
    formulaSummaryText: isGlobal
      ? 'Billboard Global 200 aggregates official paid/ad-supported On-Demand Audio & Video streams plus digital track sales across 200+ territories worldwide (Radio excluded).'
      : isUS
      ? 'US Hot 100 combines Paid/Ad-Supported On-Demand Streams (Audio + Official Video), Pure Digital/Physical Single Sales, and US Radio Airplay Audience Impressions.'
      : `${baseRegional.countryName} Official Chart blends local DSP streaming velocity, regional digital purchases, and national airplay rotation.`,
    pacingNextWeekProjection: Math.round(totalWeeklyUnits * (move.status === 'up' || move.status === 'new' ? 1.06 : 0.94)),
    certificationStatus,
    territorialHighlight: isGlobal
      ? 'Top contributing markets: United States, United Kingdom, Japan, Brazil, Germany'
      : `Primary consumption hub: ${baseRegional.countryName} DSPs & Digital Retailers`
  };
}
