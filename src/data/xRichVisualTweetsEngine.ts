// Rich Visual X (Twitter) Chart & Milestone Cards Engine
// Generates authentic real-data tweets and visual card payloads matching real-world
// @talkofthecharts, @chartdata, @SpotifyCharts, YouTube Music Charts, and Stan Twitter formats.

import { GameState, ChartItem } from '../types';
import { formatNumFull } from '../constants';
import { resolveAuthenticCover } from './musicCatalog';
import { XPost, getEnsuredXProfile } from './xSocialEngine';
import { resolveChartItemMovement } from './chartMovementAndReEntryEngine';
import { resolveSongMetadataAndCollabCredits } from './spotifyTrackMetadataAndCollabEngine';

export interface BillboardTop10Row {
  rank: number;
  title: string;
  artist: string;
  lastWeekText: string;
  isNew: boolean;
  isPlayer: boolean;
}

export interface TotcPredictionRow {
  rank: number;
  deltaText: string;
  deltaType: 'up' | 'down' | 'new' | 'equal';
  title: string;
  artist: string;
  cover: string;
  points: number;
  pctChangeText: string;
  pctPositive: boolean;
  peak: number;
  woc: number;
}

export interface AlbumTrackStreamRow {
  title: string;
  dailyStreams: number;
  totalStreams: number;
}

export interface YtMusicCardItem {
  rank: number;
  title: string;
  artist: string;
  cover: string;
  viewsText: string;
}

export interface XVisualCardPayload {
  cardType:
    | 'billboard_hot100_top10'
    | 'billboard_200_top10'
    | 'totc_predictions_table'
    | 'spotify_chart_split_card'
    | 'album_streams_poster'
    | 'yt_music_daily_mv_cards'
    | 'dual_itunes_yt_no1_banner'
    | 'dual_comparison_grid';
  chartDatedText?: string;
  weeksAtNo1?: number;
  billboardRows?: BillboardTop10Row[];
  predictionRows?: TotcPredictionRow[];
  spotifySplitCard?: {
    chartTitle: string;
    dateLabel: string;
    rank: number;
    songTitle: string;
    artistName: string;
    cover: string;
    dailyStreamsText: string;
  };
  albumPoster?: {
    albumTitle: string;
    artistName: string;
    dateLabel: string;
    cover: string;
    tracks: AlbumTrackStreamRow[];
    totalStreams: number;
    totalDailyStreams: number;
  };
  ytMusicCards?: {
    dateLabel: string;
    items: YtMusicCardItem[];
  };
  dualNo1Banner?: {
    songTitle: string;
    artistName: string;
    cover: string;
    itunesRank: number;
    ytRank: number;
    itunesSalesText: string;
    ytViewsText: string;
  };
  dualComparisonGrid?: {
    leftImage: string;
    rightImage: string;
    leftLabel: string;
    rightLabel: string;
  };
}

const AVATARS = {
  talkofthecharts: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&q=80',
  chartdata: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
  spotifyCharts: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=150&q=80',
  popbase: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80',
  youtubeMusic: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&q=80',
  fanAccount1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  fanAccount2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80'
};

function formatDateUpper(dateStr: string): string {
  const d = new Date(dateStr || '2026-01-01');
  if (Number.isNaN(d.getTime())) return 'OCTOBER 31, 2026';
  return d
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function formatDateShortSlash(dateStr: string, daysOffset: number = 0): string {
  const d = new Date(dateStr || '2026-01-01');
  if (Number.isNaN(d.getTime())) return '27/10';
  d.setDate(d.getDate() + daysOffset);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function buildBillboardTop10Rows(
  chart: ChartItem[],
  currentDate?: string
): { rows: BillboardTop10Row[]; weeksAtNo1: number } {
  const top10 = chart.slice(0, 10);
  const rows: BillboardTop10Row[] = top10.map((item, idx) => {
    const rank = idx + 1;
    const mov = resolveChartItemMovement(item, rank, chart.length, currentDate);
    const isNew = mov.status === 'new' || mov.status === 're-entry' || !mov.lastPosition;
    const lastWeekText = isNew ? 'NEW' : String(mov.lastPosition);
    return {
      rank,
      title: item.title.replace(/\s*\(Official Music Video\)/i, '').trim(),
      artist: item.artist,
      lastWeekText,
      isNew,
      isPlayer: Boolean(item.isPlayer)
    };
  });

  const no1Item = top10[0];
  const weeksAtNo1 = Math.max(1, no1Item?.weeksOnChart || no1Item?.weeks || 1);
  return { rows, weeksAtNo1 };
}

/**
 * Generates authentic visual X tweets modeled directly on the 9 real-world X screenshots:
 * 1. @talkofthecharts — This week's Billboard Hot 100 top 10 (Neon Green Poster Card)
 * 2. @talkofthecharts — This week's Billboard 200 top 10 (Cyan Poster Card)
 * 3. @talkofthecharts — Early Billboard Hot 100 Predictions (Purple/White Table Card)
 * 4. @chartdata — Concise Hot 100 movement line: "Billboard Hot 100: #Rank(+/-) Song, @artist [X weeks]. *peak: #P*"
 * 5. Fan / Spotify Tracker — Multi-day "Song" on Global Spotify (Day 1..Day N or DD/MM run) + Official Spotify Charts Split Card
 * 6. Fan / Album Tracker — Album Tracklist Stream Breakdown Poster ("SURPASSES X STREAMS ON SPOTIFY")
 * 7. YouTube Music Daily Top Music Videos Chart Cards & Dual #1 Worldwide iTunes + YouTube Banner
 * 8. Biggest Streaming Days on Spotify Leaderboard with 2-Photo Grid
 */
export function generateRichVisualXFeedTweets(state: GameState): XPost[] {
  const profile = getEnsuredXProfile(state);
  const artistName = profile.name;
  const cleanHandle = profile.handle.replace(/^@/, '');
  const artistAvatar =
    state.artist?.image ||
    `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent(artistName.charAt(0))}`;

  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const datedUpper = formatDateUpper(dateStr);
  const timestamp = Date.now();
  const followers = profile.followers || 1200;

  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const releasedProjects = (state.projects || []).filter(p => p.status === 'released');
  const latestSong = releasedSongs[releasedSongs.length - 1];
  const latestProject = releasedProjects[releasedProjects.length - 1];

  const hot100Chart = state.billboard?.hot100 || [];
  const albums200Chart = state.billboard?.albums200 || [];
  const spotifyGlobalChart = state.spotify?.charts?.['daily_global'] || [];
  const ytGlobalChart = state.youtube?.charts?.['daily_global'] || [];
  const itunesGlobalChart = state.itunes?.charts?.['daily_global'] || [];

  const posts: XPost[] = [];

  // =========================================================================
  // 1. @talkofthecharts — This week's Billboard Hot 100 top 10 (Neon Green Card)
  // =========================================================================
  if (hot100Chart.length >= 10) {
    const { rows, weeksAtNo1 } = buildBillboardTop10Rows(hot100Chart, state.date);
    posts.push({
      id: `rich-totc-h100-${timestamp}`,
      authorName: 'Talk of the Charts',
      authorHandle: '@talkofthecharts',
      authorAvatar: AVATARS.talkofthecharts,
      isVerified: true,
      verifiedType: 'blue',
      category: 'chart',
      timeAgo: '1h',
      dateCreated: dateStr,
      content: `This week’s Billboard Hot 100 top 10`,
      visualCard: {
        cardType: 'billboard_hot100_top10',
        chartDatedText: `CHART DATED ${datedUpper}`,
        weeksAtNo1,
        billboardRows: rows
      },
      likes: Math.max(1450, Math.round(followers * 0.08 + 520)),
      reposts: Math.max(310, Math.round(followers * 0.018 + 110)),
      replies: 68,
      views: Math.max(38000, Math.round(followers * 0.55 + 16000)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // =========================================================================
  // 2. @talkofthecharts — This week's Billboard 200 top 10 (Cyan Card)
  // =========================================================================
  if (albums200Chart.length >= 10) {
    const { rows, weeksAtNo1 } = buildBillboardTop10Rows(albums200Chart, state.date);
    posts.push({
      id: `rich-totc-bb200-${timestamp}`,
      authorName: 'Talk of the Charts',
      authorHandle: '@talkofthecharts',
      authorAvatar: AVATARS.talkofthecharts,
      isVerified: true,
      verifiedType: 'blue',
      category: 'chart',
      timeAgo: '2h',
      dateCreated: dateStr,
      content: `This week’s Billboard 200 top 10`,
      visualCard: {
        cardType: 'billboard_200_top10',
        chartDatedText: `CHART DATED ${datedUpper}`,
        weeksAtNo1,
        billboardRows: rows
      },
      likes: Math.max(1220, Math.round(followers * 0.07 + 440)),
      reposts: Math.max(260, Math.round(followers * 0.015 + 90)),
      replies: 54,
      views: Math.max(32000, Math.round(followers * 0.48 + 14000)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // =========================================================================
  // 3. @talkofthecharts — Early Billboard Hot 100 Predictions Table Card
  // =========================================================================
  if (hot100Chart.length >= 10) {
    const predRows: TotcPredictionRow[] = hot100Chart.slice(0, 10).map((item, idx) => {
      const rank = idx + 1;
      const mov = resolveChartItemMovement(item, rank, hot100Chart.length, state.date);
      let deltaText = '=';
      let deltaType: 'up' | 'down' | 'new' | 'equal' = 'equal';
      if (mov.status === 'new') {
        deltaText = 'NEW';
        deltaType = 'new';
      } else if (mov.status === 're-entry') {
        deltaText = 'RE';
        deltaType = 'new';
      } else if (mov.status === 'up') {
        deltaText = `+${mov.delta}`;
        deltaType = 'up';
      } else if (mov.status === 'down') {
        deltaText = `-${mov.delta}`;
        deltaType = 'down';
      }

      const rawPts = Math.max(85, Math.round(item.points || 180));
      const pctNum =
        mov.status === 'new'
          ? 0
          : mov.status === 'up'
          ? Math.min(85, Math.max(2, mov.delta * 4))
          : mov.status === 'down'
          ? -Math.min(48, Math.max(2, mov.delta * 3))
          : 1;
      const pctChangeText =
        mov.status === 'new' ? '-' : `${pctNum >= 0 ? '+' : ''}${pctNum}%`;

      return {
        rank,
        deltaText,
        deltaType,
        title: item.title.replace(/\s*\(Official Music Video\)/i, '').trim(),
        artist: item.artist,
        cover: item.cover || resolveAuthenticCover(item.artist, item.title),
        points: rawPts,
        pctChangeText,
        pctPositive: pctNum >= 0,
        peak: mov.peakPosition || rank,
        woc: mov.weeksOnChart || 1
      };
    });

    const top1 = predRows[0];
    const top2 = predRows[1];
    posts.push({
      id: `rich-totc-pred-${timestamp}`,
      authorName: 'Talk of the Charts',
      authorHandle: '@talkofthecharts',
      authorAvatar: AVATARS.talkofthecharts,
      isVerified: true,
      verifiedType: 'blue',
      category: 'chart',
      timeAgo: '3h',
      dateCreated: dateStr,
      content: `Early Billboard Hot 100 Predictions:\n\n• "${top1.title}" by ${top1.artist} leads for #1 with ${top1.points} points\n• "${top2.title}" by ${top2.artist} follows at #2 with ${top2.points} points`,
      visualCard: {
        cardType: 'totc_predictions_table',
        chartDatedText: datedUpper,
        predictionRows: predRows
      },
      likes: Math.max(1180, Math.round(followers * 0.065 + 410)),
      reposts: Math.max(230, Math.round(followers * 0.014 + 80)),
      replies: 49,
      views: Math.max(29500, Math.round(followers * 0.42 + 12500)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // =========================================================================
  // 4. Player Song Tweet Formats:
  //    - @chartdata concise Hot 100 line ("Billboard Hot 100: #8(-3) Song, @artist [7 weeks]. *peak: #1 for 2 weeks*")
  //    - Day-by-Day & Date-by-Date Spotify Global Chart Run + Spotify Charts Official Split Card
  //    - Dual #1 Worldwide iTunes + YouTube Trending Card (if charting high)
  // =========================================================================
  if (latestSong) {
    const meta = resolveSongMetadataAndCollabCredits(latestSong, artistName, state);
    const cleanTitle = meta.cleanTitle;
    const creditedArtist = meta.formattedArtistCredits;
    const songCover =
      latestSong.cover ||
      latestSong.mvThumbnail ||
      resolveAuthenticCover(artistName, latestSong.title);
    const daysOut = Math.max(1, (latestSong.daysSinceRelease ?? 0) + 1);
    const currentDaily = Math.max(1, latestSong.dailyStreams || 0);
    const prevDaily = latestSong.prevDailyStreams || currentDaily;
    const totalStreams = Math.max(currentDaily, latestSong.streams || currentDaily);

    // Find on Hot 100 for @chartdata concise format
    const h100Idx = hot100Chart.findIndex(
      item =>
        item.isPlayer &&
        item.title.toLowerCase().includes(cleanTitle.toLowerCase())
    );
    if (h100Idx !== -1) {
      const item = hot100Chart[h100Idx];
      const rank = h100Idx + 1;
      const mov = resolveChartItemMovement(item, rank, hot100Chart.length, state.date);
      const movParen =
        mov.status === 'new'
          ? '(NEW)'
          : mov.status === 're-entry'
          ? '(RE)'
          : mov.status === 'up'
          ? `(+${mov.delta})`
          : mov.status === 'down'
          ? `(-${mov.delta})`
          : '(=)';
      const woc = mov.weeksOnChart || 1;
      const peak = mov.peakPosition || rank;

      posts.push({
        id: `rich-chartdata-h100line-${timestamp}`,
        authorName: 'chart data',
        authorHandle: '@chartdata',
        authorAvatar: AVATARS.chartdata,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: '45m',
        dateCreated: dateStr,
        content: `Billboard Hot 100: #${rank}${movParen} ${cleanTitle}, @${cleanHandle} [${woc} ${woc === 1 ? 'week' : 'weeks'}]. *peak: #${peak}*`,
        likes: Math.max(2100, Math.round(followers * 0.095 + 650)),
        reposts: Math.max(480, Math.round(followers * 0.024 + 140)),
        replies: 94,
        views: Math.max(46000, Math.round(followers * 0.65 + 19000)),
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // Find on Spotify Global Chart for Day-by-Day & Date-by-Date + Official Spotify Split Card
    const spIdx = spotifyGlobalChart.findIndex(
      item =>
        item.isPlayer &&
        item.title.toLowerCase().includes(cleanTitle.toLowerCase())
    );
    const spRank = spIdx !== -1 ? spIdx + 1 : Math.min(200, Math.max(1, Math.round(120 - (state.popularity || 10))));

    // Build realistic multi-day trajectory grounded in the song's actual totalStreams, prevDaily, and currentDaily
    const runLength = Math.min(10, Math.max(1, daysOut));
    const dayLines: string[] = [];
    const dateLines: string[] = [];

    for (let d = 1; d <= runLength; d++) {
      let dayStreamVal = currentDaily;
      let dayRankVal = spRank;
      if (d === runLength) {
        dayStreamVal = currentDaily;
        dayRankVal = spRank;
      } else if (d === runLength - 1 && prevDaily > 0) {
        dayStreamVal = prevDaily;
        dayRankVal = Math.min(200, Math.max(1, spRank + (currentDaily >= prevDaily ? 2 : -1)));
      } else {
        // Reconstruct earlier days proportionally so they align with cumulative history
        const avgHistorical = Math.max(
          1000,
          Math.round((totalStreams - currentDaily) / Math.max(1, daysOut - 1))
        );
        const dayCurve = d === 1 ? 1.12 : 0.92 + ((d * 7) % 19) * 0.01;
        dayStreamVal = Math.max(500, Math.round(avgHistorical * dayCurve));
        dayRankVal = Math.min(200, Math.max(1, spRank + ((runLength - d) % 4)));
      }

      dayLines.push(`Day ${d}: ${formatNumFull(dayStreamVal)} (#${dayRankVal})`);
      const dateSlash = formatDateShortSlash(dateStr, -(runLength - d));
      dateLines.push(`${dateSlash} - ${formatNumFull(dayStreamVal)} (#${dayRankVal})`);
    }

    // Format A: "@[handle]xSpotify — #Artist's 'Song' - Spotify Global Chart: DD/MM - X (#Rank)... Total - Y filtered streams" + Official Spotify Charts Split Card
    posts.push({
      id: `rich-sp-split-${timestamp}`,
      authorName: `${artistName} Spotify`,
      authorHandle: `@${cleanHandle}xSpotify`,
      authorAvatar: artistAvatar,
      isVerified: true,
      verifiedType: 'blue',
      category: 'platform',
      timeAgo: '1h',
      dateCreated: dateStr,
      content: `#${artistName.replace(/\s+/g, '')}’s "${cleanTitle}" - Spotify Global Chart:\n\n${dateLines.join('\n')}\n\nTotal - ${formatNumFull(totalStreams)} filtered streams`,
      visualCard: {
        cardType: 'spotify_chart_split_card',
        spotifySplitCard: {
          chartTitle: 'Top Songs Global',
          dateLabel: datedUpper,
          rank: spRank,
          songTitle: cleanTitle,
          artistName: creditedArtist,
          cover: songCover,
          dailyStreamsText: `${formatNumFull(currentDaily)} daily streams`
        }
      },
      likes: Math.max(1850, Math.round(followers * 0.088 + 540)),
      reposts: Math.max(440, Math.round(followers * 0.022 + 130)),
      replies: 76,
      views: Math.max(41000, Math.round(followers * 0.58 + 15000)),
      isPlayerPost: false,
      daysOld: 0
    });

    // Format B: Fan account "Song" on Global Spotify: Day 1: ... Day N: ...
    if (runLength >= 2) {
      posts.push({
        id: `rich-fan-dayrun-${timestamp}`,
        authorName: `${artistName} Updates`,
        authorHandle: `@${cleanHandle}Updates`,
        authorAvatar: AVATARS.fanAccount1,
        isVerified: true,
        verifiedType: 'blue',
        category: 'fanbase',
        timeAgo: '2h',
        dateCreated: dateStr,
        content: `"${cleanTitle}" on Global Spotify:\n${dayLines.join('\n')}`,
        image: latestSong.mvThumbnail || songCover,
        mediaBadge: `GLOBAL SPOTIFY #${spRank}`,
        likes: Math.max(920, Math.round(followers * 0.055 + 290)),
        reposts: Math.max(210, Math.round(followers * 0.013 + 65)),
        replies: 41,
        views: Math.max(22000, Math.round(followers * 0.35 + 8500)),
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // Format C: Dual Worldwide iTunes + YouTube Music Trending Card when song has MV or strong sales
    const itunesIdx = itunesGlobalChart.findIndex(
      item => item.isPlayer && item.title.toLowerCase().includes(cleanTitle.toLowerCase())
    );
    const ytIdx = ytGlobalChart.findIndex(
      item => item.isPlayer && item.title.toLowerCase().includes(cleanTitle.toLowerCase())
    );
    const itunesRank = itunesIdx !== -1 ? itunesIdx + 1 : 1;
    const ytRank = ytIdx !== -1 ? ytIdx + 1 : 1;

    if ((itunesIdx !== -1 && itunesRank <= 25) || (ytIdx !== -1 && ytRank <= 25) || latestSong.hasMV) {
      posts.push({
        id: `rich-dual-itunes-yt-${timestamp}`,
        authorName: `${artistName} Charts`,
        authorHandle: `@${cleanHandle}charts`,
        authorAvatar: artistAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'platform',
        timeAgo: '2h',
        dateCreated: dateStr,
        content: `"${cleanTitle}" by ${creditedArtist} is currently at #${itunesRank} on the Worldwide iTunes Song Chart and #${ytRank} on YouTube Music Trending Worldwide! 🌍🔥`,
        visualCard: {
          cardType: 'dual_itunes_yt_no1_banner',
          dualNo1Banner: {
            songTitle: cleanTitle,
            artistName: creditedArtist,
            cover: latestSong.mvThumbnail || songCover,
            itunesRank,
            ytRank,
            itunesSalesText: `+${formatNumFull(latestSong.dailyPureSales || 0)} sales`,
            ytViewsText: `+${formatNumFull(latestSong.dailyViews || 0)} views`
          }
        },
        likes: Math.max(1340, Math.round(followers * 0.072 + 380)),
        reposts: Math.max(310, Math.round(followers * 0.017 + 95)),
        replies: 58,
        views: Math.max(31000, Math.round(followers * 0.45 + 11000)),
        isPlayerPost: false,
        daysOld: 0
      });
    }
  }

  // =========================================================================
  // 5. Album / EP Tracklist Stream Breakdown Poster (like "PRESS PLAY — 100M STREAMS")
  // =========================================================================
  if (latestProject && latestProject.songs && latestProject.songs.length > 0) {
    const trackRows: AlbumTrackStreamRow[] = latestProject.songs.map(ps => {
      const liveSong = (state.songs || []).find(gs => gs.id === ps.id || gs.title === ps.title);
      const tDaily = liveSong?.dailyStreams || ps.dailyStreams || 0;
      const tTotal = liveSong?.streams || ps.streams || 0;
      return {
        title: ps.title,
        dailyStreams: tDaily,
        totalStreams: tTotal
      };
    });

    const totalAlbumStreams = trackRows.reduce((acc, r) => acc + r.totalStreams, 0);
    const totalAlbumDaily = trackRows.reduce((acc, r) => acc + r.dailyStreams, 0);
    const trackLinesText = trackRows
      .slice(0, 8)
      .map(t => `${t.title} — ${formatNumFull(t.totalStreams)}`)
      .join('\n');

    posts.push({
      id: `rich-album-poster-${timestamp}`,
      authorName: `${artistName} Data`,
      authorHandle: `@${cleanHandle}data`,
      authorAvatar: artistAvatar,
      isVerified: true,
      verifiedType: 'blue',
      category: 'platform',
      timeAgo: '3h',
      dateCreated: dateStr,
      content: `#${artistName.replace(/\s+/g, '')}'s "${latestProject.title}" on Spotify:\n\n${trackLinesText}\n\nTotal — ${formatNumFull(totalAlbumStreams)} (+${formatNumFull(totalAlbumDaily)} today)\n\n#${latestProject.title.replace(/[^a-zA-Z0-9]/g, '')} continues its strong run on Spotify!`,
      visualCard: {
        cardType: 'album_streams_poster',
        albumPoster: {
          albumTitle: latestProject.title,
          artistName,
          dateLabel: `DAILY STREAMS • ${datedUpper}`,
          cover: latestProject.cover || artistAvatar,
          tracks: trackRows.slice(0, 10),
          totalStreams: totalAlbumStreams,
          totalDailyStreams: totalAlbumDaily
        }
      },
      likes: Math.max(1680, Math.round(followers * 0.082 + 490)),
      reposts: Math.max(390, Math.round(followers * 0.02 + 115)),
      replies: 72,
      views: Math.max(39000, Math.round(followers * 0.52 + 14000)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // =========================================================================
  // 6. YouTube Music "Daily Top Music Videos Chart" Multi-Card Visual
  // =========================================================================
  if (ytGlobalChart.length >= 2) {
    const top2Yt: YtMusicCardItem[] = ytGlobalChart.slice(0, 2).map((item, idx) => ({
      rank: idx + 1,
      title: item.title.replace(/\s*\(Official Music Video\)/i, '').trim(),
      artist: item.artist,
      cover: item.cover || resolveAuthenticCover(item.artist, item.title),
      viewsText: `${formatNumFull(item.views || item.points || 0)} views`
    }));

    posts.push({
      id: `rich-yt-music-cards-${timestamp}`,
      authorName: 'YouTube Music Charts',
      authorHandle: '@YouTubeMusic',
      authorAvatar: AVATARS.youtubeMusic,
      isVerified: true,
      verifiedType: 'gold',
      category: 'platform',
      timeAgo: '3h',
      dateCreated: dateStr,
      content: `Daily Top Music Videos Chart — Global (${datedUpper}):\n\n#1. "${top2Yt[0].title}" — ${top2Yt[0].artist} (${top2Yt[0].viewsText})\n#2. "${top2Yt[1].title}" — ${top2Yt[1].artist} (${top2Yt[1].viewsText})`,
      visualCard: {
        cardType: 'yt_music_daily_mv_cards',
        ytMusicCards: {
          dateLabel: datedUpper,
          items: top2Yt
        }
      },
      likes: Math.max(1520, Math.round(followers * 0.075 + 460)),
      reposts: Math.max(340, Math.round(followers * 0.018 + 100)),
      replies: 63,
      views: Math.max(36000, Math.round(followers * 0.48 + 13500)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // =========================================================================
  // 7. Biggest Streaming Days on Spotify in <Year> Leaderboard + Dual Photo Grid
  // =========================================================================
  if (spotifyGlobalChart.length >= 6) {
    const yearStr = dateStr.slice(0, 4) || '2026';
    const top6 = spotifyGlobalChart.slice(0, 6);
    const lines = top6.map((item, idx) => {
      const st = item.stats?.streams || item.streams || item.points || 0;
      const mText = (st / 1_000_000).toFixed(2) + 'M';
      return `#${idx + 1} ${item.artist} "${item.title}" — ${mText}`;
    });

    const first = top6[0];
    const second = top6[1];

    posts.push({
      id: `rich-biggest-days-${timestamp}`,
      authorName: 'Pop Base',
      authorHandle: '@PopBase',
      authorAvatar: AVATARS.popbase,
      isVerified: true,
      verifiedType: 'blue',
      category: 'chart',
      timeAgo: '4h',
      dateCreated: dateStr,
      content: `Biggest streaming days on Spotify in ${yearStr} (Daily Global Leaders):\n\n${lines.join('\n')}`,
      visualCard: {
        cardType: 'dual_comparison_grid',
        dualComparisonGrid: {
          leftImage: first.cover || resolveAuthenticCover(first.artist, first.title),
          rightImage: second.cover || resolveAuthenticCover(second.artist, second.title),
          leftLabel: `#1 ${first.artist}`,
          rightLabel: `#2 ${second.artist}`
        }
      },
      likes: Math.max(2450, Math.round(followers * 0.1 + 780)),
      reposts: Math.max(520, Math.round(followers * 0.025 + 170)),
      replies: 112,
      views: Math.max(58000, Math.round(followers * 0.72 + 24000)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  return posts;
}
