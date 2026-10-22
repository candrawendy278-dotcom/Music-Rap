// Billboard Regional Breakdown Engine
// Generates accurate, market-size calibrated unit breakdowns (SES, Direct Sales, Radio Impressions)
// tailored specifically for each country's territory profile and distinguishing between
// the Billboard Global 200 (worldwide streams & sales, 0 radio) and regional Hot 100 charts.

import { getCountryMarketProfile } from './countryMarketSystem';

export interface RegionalBillboardBreakdown {
  totalUnits: number;
  streamsSES: number;
  pureSalesDirect: number;
  radioImpressions: number;
  radioLabel: string;
  countryName: string;
  marketDescription: string;
}

/**
 * Calculates authentic Billboard unit breakdown reflecting the chosen country's
 * market size, streaming share, sales share, and radio airplay share.
 */
export function calculateRegionalBillboardBreakdown(
  totalPoints: number,
  regionCode: string,
  isAlbum = false
): RegionalBillboardBreakdown {
  const isGlobal = regionCode === 'global';

  if (isGlobal) {
    // Billboard Global 200 Formula:
    // Exclusively tracks worldwide streaming (official audio & video) and digital sales across 200+ territories.
    // Billboard rules explicitly EXCLUDE terrestrial radio airplay from Global 200!
    const globalStreams = isAlbum
      ? Math.round(totalPoints * 1450)
      : Math.round(totalPoints * 295); // ~60M - 110M weekly streams for #1 smash

    const globalSales = isAlbum
      ? Math.round(totalPoints * 0.28)
      : Math.round(totalPoints * 0.16); // ~25K - 60K downloads worldwide

    return {
      totalUnits: totalPoints,
      streamsSES: globalStreams,
      pureSalesDirect: globalSales,
      radioImpressions: 0,
      radioLabel: 'Worldwide (No Radio)',
      countryName: 'Global 200',
      marketDescription: 'Worldwide 200+ Territories (Streams & Sales Only)'
    };
  }

  const profile = getCountryMarketProfile(regionCode);
  const marketWeight = profile.marketSizeWeight; // e.g. 100 (US), 42 (JP), 38 (GB), 30 (ID)

  // 1. Streaming Ratio (SES)
  // Scaled by the country's streaming propensity
  const streamingPropensity = profile.streamingShare / 0.60;
  const streamsSES = isAlbum
    ? Math.round(totalPoints * 1350 * streamingPropensity)
    : Math.round(totalPoints * 260 * streamingPropensity);

  // 2. Direct Pure Sales (Physical & Digital Downloads)
  // In Japan, Germany, and UK, pure sales are much higher than in streaming-first territories (Indonesia, Brazil)
  const salesPropensity = profile.salesShare / 0.05;
  const pureSalesDirect = isAlbum
    ? Math.round(totalPoints * (0.20 * salesPropensity))
    : Math.round(totalPoints * (0.12 * salesPropensity));

  // 3. Radio Airplay Impressions (Audience)
  // US and UK have massive commercial radio tracking (Mediabase / BDS / Radiomonitor).
  // Some territories have very little commercial radio chart weighting.
  const radioPropensity = profile.radioShare / 0.04;
  let radioImpressions = 0;
  let radioLabel = 'Airplay Audience';

  if (!isAlbum) {
    if (profile.radioShare <= 0.01) {
      // Very low or zero radio tracking (e.g. streaming-only markets)
      radioImpressions = Math.round(totalPoints * 8 * radioPropensity * (marketWeight / 50));
      radioLabel = 'Regional Airplay (Minor)';
    } else {
      // Major commercial radio markets (US, UK, Germany, Canada, Australia)
      radioImpressions = Math.round(totalPoints * 75 * radioPropensity * (marketWeight / 70));
      radioLabel = 'Audience Imp.';
    }
  } else {
    radioImpressions = 0;
    radioLabel = 'N/A (Album Chart)';
  }

  return {
    totalUnits: totalPoints,
    streamsSES,
    pureSalesDirect,
    radioImpressions,
    radioLabel,
    countryName: profile.name,
    marketDescription: `${profile.name} (Market Size: ${marketWeight}/100)`
  };
}
