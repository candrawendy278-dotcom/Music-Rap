// Authentic Radio Airplay Chart Engine (Billboard Radio Songs & Mediabase Panel Simulation)
// Tracks All-Format Radio Songs Top 50, Pop CHR (Top 40), Rhythmic/Urban, Hot AC, and International Airplay.
// Computes Weekly & Daily Spins, 7-Day Spin Bullet (+/-), Audience Impressions (Millions),
// Panel Station Adds, Rotation Tiers (Power, Heavy, Medium, Sub-Power), and Greatest Gainer / Most Added honors.

import { GameState, Song } from '../types';
import { REAL_WORLD_NPCS, resolveRealWorldCoverArt, normalizeRealArtistName, normalizeRealTitle } from './realWorldArtistCatalog';
import { isNpcMatchingPlayerName, syncPlayerNameNpcDeduplication } from './npcPlayerDeduplicationEngine';

export type RadioFormatId = 'all' | 'pop_chr' | 'rhythmic_urban' | 'hot_ac' | 'international';

export interface RadioFormatMeta {
  id: RadioFormatId;
  name: string;
  shortName: string;
  panelSize: number;
  subtitle: string;
  flagshipStations: string[];
  accentColor: string;
  badgeText: string;
}

export interface RadioChartEntry {
  id: string;
  songId?: number;
  rank: number;
  lastWeek: number | null;
  peak: number;
  weeksOnChart: number;
  title: string;
  artist: string;
  cover: string | null;
  isPlayer: boolean;
  genre: string;
  weeklySpins: number;
  dailySpins: number;
  spinBullet: number; // + or - 7-day spin change
  audienceMillions: number; // e.g., 64.85 (in Millions)
  audienceDeltaMillions: number; // e.g., +3.42 (in Millions)
  stationsOn: number;
  totalPanelStations: number;
  newStationAdds: number;
  rotationTier: 'POWER ROTATION' | 'HEAVY ROTATION' | 'MEDIUM ROTATION' | 'CLIMBING' | 'ON THE VERGE';
  leadStation: string;
  isGreatestGainer?: boolean;
  isMostAdded?: boolean;
  isAirplayNumberOne?: boolean;
  collabId?: string;
  hasMV?: boolean;
  isExplicit?: boolean;
}

export const RADIO_FORMAT_DEFINITIONS: RadioFormatMeta[] = [
  {
    id: 'all',
    name: 'Billboard Radio Songs',
    shortName: 'All-Format Top 50',
    panelSize: 1200,
    subtitle: 'All-format US & North American terrestrial and satellite broadcast audience impressions.',
    flagshipStations: ['Z100 New York', 'KIIS-FM Los Angeles', 'Hot 97 NYC', 'SiriusXM Hits 1', 'B96 Chicago'],
    accentColor: '#38BDF8',
    badgeText: 'BILLBOARD AIRPLAY'
  },
  {
    id: 'pop_chr',
    name: 'Top 40 / Pop CHR',
    shortName: 'Pop CHR',
    panelSize: 180,
    subtitle: 'Mainstream Top 40 Contemporary Hit Radio panel tracked by Mediabase.',
    flagshipStations: ['KIIS-FM 102.7 LA', 'Z100 100.3 NY', '106.1 KISS FM Dallas', 'Y100 Miami', '99.7 NOW SF'],
    accentColor: '#EC4899',
    badgeText: 'MEDIABASE TOP 40'
  },
  {
    id: 'rhythmic_urban',
    name: 'Rhythmic & Hip-Hop/R&B',
    shortName: 'Rhythmic / Urban',
    panelSize: 145,
    subtitle: 'Hip-Hop, Rap, R&B, Trap, and Rhythmic Crossover broadcast airplay.',
    flagshipStations: ['WQHT Hot 97 NYC', 'KPWR Power 106 LA', 'WWPR Power 105.1 NY', 'V-103 Atlanta', 'WGCI Chicago'],
    accentColor: '#F59E0B',
    badgeText: 'RHYTHMIC PANEL'
  },
  {
    id: 'hot_ac',
    name: 'Hot AC & Adult Pop',
    shortName: 'Hot AC',
    panelSize: 160,
    subtitle: 'Adult Contemporary, Melodic Pop, Singer-Songwriter, and Crossover Rock airplay.',
    flagshipStations: ['104.3 MYfm LA', 'WPLJ / NEW 102.7 NY', 'Star 94.1 San Diego', 'Mix 104.1 Boston'],
    accentColor: '#A855F7',
    badgeText: 'ADULT POP PANEL'
  },
  {
    id: 'international',
    name: 'Global Airplay Top 50',
    shortName: 'Global Radio',
    panelSize: 850,
    subtitle: 'Worldwide national & commercial radio networks across UK, Europe, Asia, and LatAm.',
    flagshipStations: ['BBC Radio 1 UK', 'Capital FM London', 'NRJ France', 'Prambors FM Jakarta', 'J-Wave Tokyo'],
    accentColor: '#10B981',
    badgeText: 'GLOBAL BROADCAST'
  }
];

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function getFormatAffinityMultiplier(format: RadioFormatId, genre: string): number {
  const g = (genre || 'pop').toLowerCase();
  if (format === 'all') return 1.0;

  if (format === 'pop_chr') {
    if (g.includes('pop') || g.includes('dance') || g.includes('synth') || g.includes('disco')) return 1.32;
    if (g.includes('r&b') || g.includes('k-pop')) return 1.08;
    if (g.includes('rap') || g.includes('hip') || g.includes('trap')) return 0.78;
    return 0.9;
  }

  if (format === 'rhythmic_urban') {
    if (g.includes('rap') || g.includes('hip') || g.includes('trap') || g.includes('drill')) return 1.42;
    if (g.includes('r&b') || g.includes('afro') || g.includes('soul')) return 1.35;
    if (g.includes('pop') || g.includes('dance')) return 0.58;
    return 0.65;
  }

  if (format === 'hot_ac') {
    if (g.includes('pop') || g.includes('indie') || g.includes('folk') || g.includes('rock') || g.includes('alt') || g.includes('ballad')) return 1.35;
    if (g.includes('r&b')) return 0.95;
    if (g.includes('trap') || g.includes('drill') || g.includes('rap')) return 0.45;
    return 0.85;
  }

  if (format === 'international') {
    if (g.includes('pop') || g.includes('k-pop') || g.includes('dance') || g.includes('latin') || g.includes('afro')) return 1.28;
    return 1.0;
  }

  return 1.0;
}

/**
 * Generates the Top 50 Radio Airplay Chart for the selected format and current game date.
 */
export function generateRadioAirplayChart(
  state: GameState,
  format: RadioFormatId = 'all'
): {
  formatMeta: RadioFormatMeta;
  entries: RadioChartEntry[];
  playerEntries: RadioChartEntry[];
  greatestGainer: RadioChartEntry | null;
  mostAdded: RadioChartEntry | null;
  totalPanelSpins: number;
} {
  const playerName = state.artist?.name || 'Artist';
  syncPlayerNameNpcDeduplication(playerName);

  const formatMeta =
    RADIO_FORMAT_DEFINITIONS.find(f => f.id === format) || RADIO_FORMAT_DEFINITIONS[0];

  const currentMs = new Date(state.date || Date.now()).getTime();
  const daySeed = Math.floor(currentMs / (1000 * 60 * 60 * 24));

  const rawCandidates: Array<Omit<RadioChartEntry, 'rank'>> = [];
  const seenKeys = new Set<string>();

  // 1. Evaluate Player Released Singles & Promoted Tracks
  const releasedPlayerSongs = (state.songs || []).filter(s => s.status === 'released');

  releasedPlayerSongs.forEach(song => {
    const isBSide = song.trackType === 'b_side';
    const rawRadio = song.weeklyRadioPlays || (song.dailyRadioPlays ? song.dailyRadioPlays * 7 : 0) || song.radioPlays || 0;
    const dailyStreams = song.dailyStreams || 0;

    // Unpromoted B-sides rarely get terrestrial radio spins unless massive viral crossover
    if (isBSide && rawRadio < 250 && dailyStreams < 250_000) return;

    const releaseMs = song.releaseDate ? new Date(song.releaseDate).getTime() : currentMs;
    const daysOut = Math.max(1, Math.floor((currentMs - releaseMs) / (1000 * 60 * 60 * 24)));
    const weeksOnChart = Math.max(1, Math.ceil(daysOut / 7));

    const affinity = getFormatAffinityMultiplier(format, song.genre || 'Pop');

    // Convert game radioPlays & streaming velocity into realistic Mediabase Weekly Spins
    // Top #1 songs on US Radio get ~15,000 - 19,500 weekly spins (~55M - 78M Audience)
    const streamSpinSupport = Math.pow(Math.max(0, dailyStreams), 0.72) * 1.15;
    const baseWeeklySpins = Math.round(
      ((rawRadio * 0.42) + streamSpinSupport + (song.quality || 65) * 28 + (state.popularity || 15) * 45) *
        affinity *
        (isBSide ? 0.25 : 1.0)
    );

    const clampedWeeklySpins = Math.max(120, Math.min(22_500, baseWeeklySpins));
    const dailySpins = Math.max(18, Math.round(clampedWeeklySpins / 7));

    // Calculate Spin Bullet (+ or - spins vs last week)
    const momentum = song.momentum || 1.0;
    const bulletFactor = daysOut <= 28 ? 0.14 * momentum : (momentum - 0.92) * 0.22;
    const spinBullet = Math.round(clampedWeeklySpins * Math.max(-0.28, Math.min(0.35, bulletFactor)));

    // Audience Impressions in Millions (1,000 spins ≈ 3.6M - 4.2M audience impressions on All-Format)
    const audPerSpin =
      format === 'all'
        ? 0.0041
        : format === 'international'
        ? 0.0038
        : 0.0029;
    const audienceMillions = Number((clampedWeeklySpins * audPerSpin).toFixed(2));
    const audienceDeltaMillions = Number((spinBullet * audPerSpin).toFixed(2));

    const stationCoverageRatio = Math.min(
      1,
      Math.max(0.12, clampedWeeklySpins / (format === 'all' ? 16_500 : 12_500))
    );
    const stationsOn = Math.max(
      8,
      Math.min(formatMeta.panelSize, Math.round(formatMeta.panelSize * stationCoverageRatio))
    );
    const newStationAdds =
      daysOut <= 21
        ? Math.max(2, Math.min(68, Math.round(stationsOn * (daysOut <= 7 ? 0.45 : 0.18))))
        : spinBullet > 300
        ? Math.max(1, Math.min(24, Math.round(spinBullet / 95)))
        : 0;

    let rotationTier: RadioChartEntry['rotationTier'] = 'ON THE VERGE';
    if (clampedWeeklySpins >= 12_500) rotationTier = 'POWER ROTATION';
    else if (clampedWeeklySpins >= 7_500) rotationTier = 'HEAVY ROTATION';
    else if (clampedWeeklySpins >= 3_800) rotationTier = 'MEDIUM ROTATION';
    else if (spinBullet > 0) rotationTier = 'CLIMBING';

    const stationIdx = (song.id + formatMeta.id.length) % formatMeta.flagshipStations.length;
    const leadStation = formatMeta.flagshipStations[stationIdx];

    const key = `${playerName.toLowerCase()}::${song.title.toLowerCase()}`;
    seenKeys.add(key);

    rawCandidates.push({
      id: `pl_radio_${song.id}`,
      songId: song.id,
      lastWeek: daysOut <= 7 ? null : null, // Computed after sorting
      peak: 1,
      weeksOnChart,
      title: song.title,
      artist: playerName,
      cover: song.cover,
      isPlayer: true,
      genre: song.genre || 'Pop',
      weeklySpins: clampedWeeklySpins,
      dailySpins,
      spinBullet,
      audienceMillions,
      audienceDeltaMillions,
      stationsOn,
      totalPanelStations: formatMeta.panelSize,
      newStationAdds,
      rotationTier,
      leadStation,
      collabId: song.collabId,
      hasMV: song.hasMV,
      isExplicit: song.isExplicit
    });
  });

  // 2. Evaluate Real-World NPC Radio Releases
  REAL_WORLD_NPCS.forEach((npc, npcIdx) => {
    if (isNpcMatchingPlayerName(npc.name, playerName)) return;

    const npcGenre = npc.genre || 'Pop';
    const affinity = getFormatAffinityMultiplier(format, npcGenre);
    if (affinity < 0.52) return;

    (npc.songs || []).slice(0, 3).forEach((s, sIdx) => {
      const cleanArtist = normalizeRealArtistName(npc.name);
      const cleanTitle = normalizeRealTitle(s.title);
      const key = `${cleanArtist.toLowerCase()}::${cleanTitle.toLowerCase()}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const hash = deterministicHash(`${key}::${format}`);
      const dailyWave = Math.sin((daySeed + (hash % 30)) * 0.22) * 0.08;

      // Base radio power from NPC song radio stat, streams, and artist popularity
      const rawNpcRadio = s.radio || Math.round((s.streams || 50_000_000) / 18_000);
      const popWeight = (npc.pop || 75) * 135;
      const trackDecay = sIdx === 0 ? 1.0 : sIdx === 1 ? 0.76 : 0.58;

      const baseSpins = Math.round(
        ((rawNpcRadio * 1.45) + popWeight + ((hash % 2400) - 900)) *
          affinity *
          trackDecay *
          (1 + dailyWave)
      );

      const weeklySpins = Math.max(950, Math.min(19_800, baseSpins));
      const dailySpins = Math.max(135, Math.round(weeklySpins / 7));

      // Spin bullet
      const bulletSwing = Math.sin((daySeed + (hash % 19)) * 0.35);
      const spinBullet = Math.round(weeklySpins * (bulletSwing * 0.14));

      const audPerSpin =
        format === 'all'
          ? 0.0041
          : format === 'international'
          ? 0.0038
          : 0.0029;
      const audienceMillions = Number((weeklySpins * audPerSpin).toFixed(2));
      const audienceDeltaMillions = Number((spinBullet * audPerSpin).toFixed(2));

      const stationRatio = Math.min(1, Math.max(0.25, weeklySpins / 15_500));
      const stationsOn = Math.min(
        formatMeta.panelSize,
        Math.max(18, Math.round(formatMeta.panelSize * stationRatio))
      );

      const weeksOnChart = 3 + ((hash + Math.floor(daySeed / 7)) % 26);
      const newStationAdds =
        weeksOnChart <= 4
          ? 14 + (hash % 38)
          : spinBullet > 400
          ? 4 + (hash % 15)
          : 0;

      let rotationTier: RadioChartEntry['rotationTier'] = 'MEDIUM ROTATION';
      if (weeklySpins >= 12_500) rotationTier = 'POWER ROTATION';
      else if (weeklySpins >= 7_500) rotationTier = 'HEAVY ROTATION';
      else if (weeklySpins >= 3_800) rotationTier = 'MEDIUM ROTATION';
      else if (spinBullet > 0) rotationTier = 'CLIMBING';
      else rotationTier = 'ON THE VERGE';

      const leadStation =
        formatMeta.flagshipStations[(npcIdx + sIdx) % formatMeta.flagshipStations.length];

      rawCandidates.push({
        id: `npc_radio_${npc.id}_${sIdx}`,
        lastWeek: null,
        peak: 1,
        weeksOnChart,
        title: cleanTitle,
        artist: cleanArtist,
        cover: s.cover || resolveRealWorldCoverArt(cleanArtist, cleanTitle, false),
        isPlayer: false,
        genre: npcGenre,
        weeklySpins,
        dailySpins,
        spinBullet,
        audienceMillions,
        audienceDeltaMillions,
        stationsOn,
        totalPanelStations: formatMeta.panelSize,
        newStationAdds,
        rotationTier,
        leadStation
      });
    });
  });

  // Sort by Audience Impressions (All-Format) or Weekly Spins (Format Panels)
  rawCandidates.sort((a, b) => {
    if (format === 'all') {
      return b.audienceMillions - a.audienceMillions || b.weeklySpins - a.weeklySpins;
    }
    return b.weeklySpins - a.weeklySpins;
  });

  const top50 = rawCandidates.slice(0, 50);

  // Assign rank, LW, Peak, Greatest Gainer, and Most Added
  let maxSpinBullet = -999_999;
  let greatestGainerIdx = -1;
  let maxAdds = -1;
  let mostAddedIdx = -1;
  let totalPanelSpins = 0;

  const entries: RadioChartEntry[] = top50.map((item, idx) => {
    const rank = idx + 1;
    totalPanelSpins += item.weeklySpins;

    // Compute realistic Last Week & Peak based on spinBullet
    const rankShift =
      item.weeksOnChart <= 1
        ? null
        : item.spinBullet > 800
        ? Math.min(50, rank + Math.max(1, Math.round(item.spinBullet / 420)))
        : item.spinBullet < -500
        ? Math.max(1, rank - Math.max(1, Math.round(Math.abs(item.spinBullet) / 450)))
        : rank;

    const peak =
      rankShift !== null ? Math.min(rank, rankShift, Math.max(1, rank - (idx % 3))) : rank;

    if (item.spinBullet > maxSpinBullet && rank <= 40) {
      maxSpinBullet = item.spinBullet;
      greatestGainerIdx = idx;
    }

    if (item.newStationAdds > maxAdds) {
      maxAdds = item.newStationAdds;
      mostAddedIdx = idx;
    }

    return {
      ...item,
      rank,
      lastWeek: rankShift,
      peak,
      isAirplayNumberOne: rank === 1
    };
  });

  if (greatestGainerIdx >= 0 && entries[greatestGainerIdx]) {
    entries[greatestGainerIdx].isGreatestGainer = true;
  }
  if (mostAddedIdx >= 0 && entries[mostAddedIdx]) {
    entries[mostAddedIdx].isMostAdded = true;
  }

  const playerEntries = entries.filter(e => e.isPlayer);

  return {
    formatMeta,
    entries,
    playerEntries,
    greatestGainer: greatestGainerIdx >= 0 ? entries[greatestGainerIdx] : null,
    mostAdded: mostAddedIdx >= 0 ? entries[mostAddedIdx] : null,
    totalPanelSpins
  };
}
