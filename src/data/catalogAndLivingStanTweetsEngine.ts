// Catalog Longevity, Multi-Era Discography & Living Stan Twitter Engine
// Ensures X (Twitter) accounts tweet about:
// 1. OLDER released songs, back-catalog classics, sleeper hits, and previous eras (not just the latest release!)
// 2. Multi-song daily streaming leaderboards (comparing newest single vs older catalog tracks with 100% real data)
// 3. Bilateral Collaboration chemistry & duet streaming milestones
// 4. Lively, expressive, high-variety Stan Twitter, Pop Crave, Pop Base, Chart Data, and Critic commentary
// Every single number, stream count, sales figure, and chart rank is 100% live GameState telemetry.

import { GameState, Song, ChartItem, Project } from '../types';
import { formatNumFull } from '../constants';
import { resolveAuthenticCover } from './musicCatalog';
import { XPost, getEnsuredXProfile } from './xSocialEngine';
import { resolveSongMetadataAndCollabCredits } from './spotifyTrackMetadataAndCollabEngine';
import { resolveChartItemMovement } from './chartMovementAndReEntryEngine';

const LIVING_AVATARS = {
  chartdata: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
  spotify: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150&q=80',
  spotifyCharts: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=150&q=80',
  appleMusic: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=150&q=80',
  popbase: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80',
  popcrave: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&q=80',
  talkofthecharts: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&q=80',
  rollingStone: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&q=80',
  stan1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  stan2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
  stan3: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80',
  stan4: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&q=80',
  stan5: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'
};

function getSongArt(song: Song | undefined, artistName: string, artistAvatar: string): string {
  if (!song) return artistAvatar;
  if (song.cover && song.cover.trim() !== '') return song.cover;
  if (song.mvThumbnail && song.mvThumbnail.trim() !== '') return song.mvThumbnail;
  return resolveAuthenticCover(artistName, song.title);
}

function getDayNumber(dateStr: string): number {
  const t = new Date(dateStr).getTime();
  return Number.isNaN(t) ? 1 : Math.floor(t / (1000 * 60 * 60 * 24));
}

function findChartEntryForSong(
  chart: ChartItem[] | undefined,
  songTitle: string,
  artistName: string,
  currentDate?: string
): {
  rank: number;
  movementBadge: string;
  peak: number;
  weeks: number;
  points: number;
} | null {
  if (!chart || chart.length === 0) return null;
  const targetTitle = songTitle.trim().toLowerCase();
  const idx = chart.findIndex(item => {
    const cleanItemTitle = item.title
      .replace(/\s*\(Official Music Video\)/i, '')
      .replace(/\s*\((?:feat\.|ft\.|with)\s+[^)]+\)/i, '')
      .trim()
      .toLowerCase();
    return (
      (item.isPlayer || item.artist.toLowerCase().includes(artistName.toLowerCase())) &&
      cleanItemTitle === targetTitle
    );
  });

  if (idx === -1) return null;
  const item = chart[idx];
  const rank = idx + 1;
  const mov = resolveChartItemMovement(item, rank, chart.length, currentDate);

  let movementBadge = '(=)';
  if (mov.status === 'new') movementBadge = '(NEW)';
  else if (mov.status === 're-entry') movementBadge = '(RE-ENTRY)';
  else if (mov.status === 'up') movementBadge = `(+${mov.delta})`;
  else if (mov.status === 'down') movementBadge = `(-${mov.delta})`;

  return {
    rank,
    movementBadge,
    peak: mov.peakPosition,
    weeks: mov.weeksOnChart,
    points: item.points || 0
  };
}

/**
 * Generates lively, expressive, real-data tweets covering:
 * - Older catalog songs & throwback classics (so accounts don't only tweet the latest release!)
 * - Multi-song artist catalog daily stream rankings
 * - Collab tracks & featured artist chemistry
 * - Vivid Stan Twitter discourse, Pop Crave / Pop Base viral posts, and chart longevity
 */
export function generateCatalogAndLivingStanTweets(state: GameState): XPost[] {
  const profile = getEnsuredXProfile(state);
  const artistName = profile.name;
  const cleanHandle = profile.handle.replace(/^@/, '');
  const artistAvatar =
    state.artist?.image ||
    `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent(artistName.charAt(0))}`;

  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const releasedProjects = (state.projects || []).filter(p => p.status === 'released');
  if (releasedSongs.length === 0) return [];

  const latestSong = releasedSongs[releasedSongs.length - 1];
  const olderSongs = releasedSongs.slice(0, -1);
  const latestDaysOut = (latestSong.daysSinceRelease ?? 0) + 1;
  const isBrandNewReleaseDay = latestDaysOut <= 2;

  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const dayNum = getDayNumber(dateStr);
  const timestamp = Date.now();
  const followers = profile.followers || 1000;

  const spGlobal = state.spotify?.charts?.['daily_global'] || [];
  const hot100 = state.billboard?.hot100 || [];

  const extraTweets: XPost[] = [];

  // =========================================================================
  // 1. MULTI-SONG CATALOG DAILY LEADERBOARD (@[handle]charts / @SpotifyCharts)
  // Shows top songs across the player's ENTIRE discography (new + older hits)
  // =========================================================================
  if (releasedSongs.length >= 2) {
    const sortedByDaily = [...releasedSongs].sort(
      (a, b) => (b.dailyStreams || 0) - (a.dailyStreams || 0)
    );
    const topTracks = sortedByDaily.slice(0, 5);
    const totalCatalogDaily = releasedSongs.reduce((sum, s) => sum + (s.dailyStreams || 0), 0);
    const totalCatalogLifetime = releasedSongs.reduce((sum, s) => sum + (s.streams || 0), 0);

    const lines = topTracks.map((s, i) => {
      const meta = resolveSongMetadataAndCollabCredits(s, artistName, state);
      const featSuffix = meta.featuredArtists.length > 0 ? ` (feat. ${meta.featuredArtists.join(', ')})` : '';
      return `#${i + 1}. "${meta.cleanTitle}"${featSuffix} — +${formatNumFull(s.dailyStreams || 0)} (${formatNumFull(s.streams || 0)} total)`;
    });

    extraTweets.push({
      id: `living-catalog-board-${timestamp}-1`,
      authorName: `${artistName} Charts`,
      authorHandle: `@${cleanHandle}charts`,
      authorAvatar: artistAvatar,
      isVerified: true,
      verifiedType: 'blue',
      category: 'fanbase',
      timeAgo: '45m',
      dateCreated: dateStr,
      content: `📈 Most-Streamed ${artistName} Songs on Spotify Today (${dateStr}):\n\n${lines.join('\n')}\n\n• Total Daily Catalog Streams: +${formatNumFull(totalCatalogDaily)}\n• Career Cumulative Streams: ${formatNumFull(totalCatalogLifetime)}`,
      image: getSongArt(topTracks[0], artistName, artistAvatar),
      mediaBadge: 'DISCOGRAPHY DAILY LEADERBOARD',
      mediaTitle: `${artistName} — Daily Catalog Update`,
      mediaSubtitle: `+${formatNumFull(totalCatalogDaily)} streams today across ${releasedSongs.length} tracks`,
      likes: Math.max(880, Math.round(followers * 0.062 + 340)),
      reposts: Math.max(210, Math.round(followers * 0.018 + 95)),
      replies: 59,
      views: Math.max(19500, Math.round(followers * 0.48 + 8200)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // =========================================================================
  // 2. OLDER CATALOG TRACK SPOTLIGHT (Back-Catalog Longevity / Sleeper Hit)
  // Picks an older released song so accounts don't only tweet the newest song!
  // =========================================================================
  if (olderSongs.length > 0) {
    // Deterministically rotate through older songs every day so every older track gets love
    const chosenOldSong = olderSongs[(dayNum + olderSongs.length) % olderSongs.length];
    const oldSongMeta = resolveSongMetadataAndCollabCredits(chosenOldSong, artistName, state);
    const oldCover = getSongArt(chosenOldSong, artistName, artistAvatar);
    const oldDaily = chosenOldSong.dailyStreams || 0;
    const oldTotal = chosenOldSong.streams || 0;
    const oldSales = chosenOldSong.pureSales || 0;
    const oldDaysOut = (chosenOldSong.daysSinceRelease ?? 7) + 1;
    const oldPrevDaily = chosenOldSong.prevDailyStreams || oldDaily;
    const oldPct =
      oldPrevDaily > 0 ? (((oldDaily - oldPrevDaily) / oldPrevDaily) * 100).toFixed(1) : '0.0';
    const oldPctFormatted = Number(oldPct) >= 0 ? `+${oldPct}%` : `${oldPct}%`;

    const oldSpEntry = findChartEntryForSong(spGlobal, chosenOldSong.title, artistName, state.date);
    const oldHot100Entry = findChartEntryForSong(hot100, chosenOldSong.title, artistName, state.date);

    // Choose a lively angle for the older song based on day rotation
    const catalogAngle = dayNum % 5;

    if (catalogAngle === 0) {
      // @PopCrave — Catalog classic longevity appreciation
      const chartNote = oldSpEntry
        ? ` (#${oldSpEntry.rank} ${oldSpEntry.movementBadge} on Global Spotify)`
        : ' (Global Spotify Chart: OUT)';
      extraTweets.push({
        id: `living-old-popcrave-${timestamp}-2`,
        authorName: 'Pop Crave',
        authorHandle: '@PopCrave',
        authorAvatar: LIVING_AVATARS.popcrave,
        isVerified: true,
        verifiedType: 'blue',
        category: 'media',
        timeAgo: '1h',
        dateCreated: dateStr,
        content: `${oldDaysOut} days after its release, ${oldSongMeta.formattedArtistCredits}'s "${oldSongMeta.cleanTitle}" earned +${formatNumFull(oldDaily)} daily streams on Spotify${chartNote} — bringing its lifetime total to ${formatNumFull(oldTotal)} streams and ${formatNumFull(oldSales)} pure sales. 💿`,
        image: oldCover,
        mediaBadge: oldSpEntry
          ? `GLOBAL SPOTIFY #${oldSpEntry.rank}`
          : `DAY ${oldDaysOut} • CHARTS: OUT`,
        mediaTitle: `${oldSongMeta.cleanTitle} — ${oldSongMeta.formattedArtistCredits}`,
        mediaSubtitle: `${formatNumFull(oldTotal)} Total Streams • +${formatNumFull(oldDaily)} Today`,
        likes: Math.max(2450, Math.round(followers * 0.088 + 1100)),
        reposts: Math.max(510, Math.round(followers * 0.022 + 240)),
        replies: 134,
        views: Math.max(62000, Math.round(followers * 0.68 + 25000)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else if (catalogAngle === 1) {
      // Stan Twitter viral throwback / "Aged like fine wine" post
      extraTweets.push({
        id: `living-old-stan-${timestamp}-2`,
        authorName: `${artistName} Vault`,
        authorHandle: `@${cleanHandle}vault`,
        authorAvatar: LIVING_AVATARS.stan3,
        isVerified: false,
        category: 'fanbase',
        timeAgo: '2h',
        dateCreated: dateStr,
        content: `can we talk about how "${oldSongMeta.cleanTitle}" aged like the finest wine in existence?! 😭🍷 ${oldDaysOut} days out and it STILL gained +${formatNumFull(oldDaily)} streams today (${formatNumFull(oldTotal)} total | Global Spotify: ${oldSpEntry ? `#${oldSpEntry.rank}` : 'OUT'})!! 🎧✨`,
        image: oldCover,
        mediaBadge: oldSpEntry
          ? `GLOBAL SPOTIFY #${oldSpEntry.rank}`
          : 'CATALOG TRACK • OUT OF CHARTS',
        likes: Math.max(1320, Math.round(followers * 0.075 + 480)),
        reposts: Math.max(340, Math.round(followers * 0.02 + 150)),
        replies: 89,
        views: Math.max(29000, Math.round(followers * 0.52 + 11000)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else if (catalogAngle === 2) {
      // @chartdata — Back-catalog streaming update with explicit #Rank or OUT
      const rankSnippet = ` (Billboard Hot 100: ${
        oldHot100Entry
          ? `#${oldHot100Entry.rank} ${oldHot100Entry.movementBadge}; Peak: #${oldHot100Entry.peak}`
          : 'OUT'
      } | Global Spotify: ${
        oldSpEntry ? `#${oldSpEntry.rank} ${oldSpEntry.movementBadge}` : 'OUT'
      })`;
      extraTweets.push({
        id: `living-old-chartdata-${timestamp}-2`,
        authorName: 'chart data',
        authorHandle: '@chartdata',
        authorAvatar: LIVING_AVATARS.chartdata,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: '2h',
        dateCreated: dateStr,
        content: `Catalog Update: "${oldSongMeta.cleanTitle}" by ${oldSongMeta.formattedArtistCredits} earned +${formatNumFull(oldDaily)} Spotify streams today (${oldPctFormatted})${rankSnippet}. It now sits at ${formatNumFull(oldTotal)} cumulative streams and ${formatNumFull(oldSales)} pure digital copies sold.`,
        image: oldCover,
        mediaBadge: oldHot100Entry
          ? `HOT 100 #${oldHot100Entry.rank}`
          : oldSpEntry
          ? `SPOTIFY #${oldSpEntry.rank}`
          : 'CHARTS: OUT',
        likes: Math.max(1890, Math.round(followers * 0.072 + 890)),
        reposts: Math.max(410, Math.round(followers * 0.019 + 190)),
        replies: 76,
        views: Math.max(47000, Math.round(followers * 0.61 + 21000)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else if (catalogAngle === 3) {
      // Stan debate: Newest single vs Older classic!
      const latestMeta = resolveSongMetadataAndCollabCredits(latestSong, artistName, state);
      extraTweets.push({
        id: `living-old-debate-${timestamp}-2`,
        authorName: `${artistName} Era`,
        authorHandle: `@${cleanHandle}era`,
        authorAvatar: LIVING_AVATARS.stan4,
        isVerified: false,
        category: 'fanbase',
        timeAgo: '3h',
        dateCreated: dateStr,
        content: `be 100% honest right now: are you team "${oldSongMeta.cleanTitle}" (${formatNumFull(oldTotal)} total streams) or team "${latestMeta.cleanTitle}" (${formatNumFull(latestSong.streams || 0)} total streams)?! 👀🔥 Both are pulling insane numbers today (+${formatNumFull(oldDaily)} vs +${formatNumFull(latestSong.dailyStreams || 0)}) so ${artistName} really never misses!!`,
        image: oldCover,
        mediaBadge: 'FANDOM DEBATE',
        likes: Math.max(1540, Math.round(followers * 0.082 + 520)),
        reposts: Math.max(390, Math.round(followers * 0.022 + 140)),
        replies: 245,
        views: Math.max(36000, Math.round(followers * 0.64 + 13500)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else {
      // @PopBase — Viral TikTok / Playlist resurgence of an older track
      extraTweets.push({
        id: `living-old-popbase-${timestamp}-2`,
        authorName: 'Pop Base',
        authorHandle: '@PopBase',
        authorAvatar: LIVING_AVATARS.popbase,
        isVerified: true,
        verifiedType: 'blue',
        category: 'media',
        timeAgo: '3h',
        dateCreated: dateStr,
        content: `${oldSongMeta.formattedArtistCredits}'s earlier release "${oldSongMeta.cleanTitle}" continues to show remarkable catalog stability, logging +${formatNumFull(oldDaily)} daily streams on Day ${oldDaysOut} (${formatNumFull(oldTotal)} total streams) as fans keep revisiting the era.`,
        image: oldCover,
        mediaBadge: 'CATALOG RESURGENCE',
        likes: Math.max(2150, Math.round(followers * 0.08 + 940)),
        reposts: Math.max(460, Math.round(followers * 0.02 + 210)),
        replies: 108,
        views: Math.max(54000, Math.round(followers * 0.65 + 22000)),
        isPlayerPost: false,
        daysOld: 0
      });
    }
  }

  // =========================================================================
  // 3. LIVELY STAN TWITTER & CRITIC COMMENTARY (Vivid, expressive, real data)
  // =========================================================================
  // Pick a target song: if latestSong is brand new (<=2 days), focus on latestSong;
  // otherwise alternate between latestSong, top-streamed song, and collaborations!
  const sortedByTotalStreams = [...releasedSongs].sort(
    (a, b) => (b.streams || 0) - (a.streams || 0)
  );
  const biggestCareerSong = sortedByTotalStreams[0] || latestSong;
  const collabSongs = releasedSongs.filter(s => {
    const m = resolveSongMetadataAndCollabCredits(s, artistName, state);
    return m.featuredArtists.length > 0;
  });

  // If the player has a collaboration song, celebrate the duet chemistry!
  if (collabSongs.length > 0 && (!isBrandNewReleaseDay || Boolean(latestSong.collabId))) {
    const collabTarget = collabSongs[(dayNum + collabSongs.length) % collabSongs.length];
    const collabMeta = resolveSongMetadataAndCollabCredits(collabTarget, artistName, state);
    const collabCover = getSongArt(collabTarget, artistName, artistAvatar);
    const cDaily = collabTarget.dailyStreams || 0;
    const cTotal = collabTarget.streams || 0;

    extraTweets.push({
      id: `living-collab-${timestamp}-3`,
      authorName: 'Pop Crave',
      authorHandle: '@PopCrave',
      authorAvatar: LIVING_AVATARS.popcrave,
      isVerified: true,
      verifiedType: 'blue',
      category: 'media',
      timeAgo: '2h',
      dateCreated: dateStr,
      content: `The vocal & production chemistry between ${collabMeta.primaryArtist} and ${collabMeta.featuredArtists.join(', ')} on "${collabMeta.cleanTitle}" continues to dominate streaming platforms, adding +${formatNumFull(cDaily)} streams today for a cumulative total of ${formatNumFull(cTotal)} streams! 🤝🔥`,
      image: collabCover,
      mediaBadge: `COLLAB HIT • ${collabMeta.formattedArtistCredits.toUpperCase()}`,
      mediaTitle: `${collabMeta.cleanTitle} — ${collabMeta.formattedArtistCredits}`,
      mediaSubtitle: `+${formatNumFull(cDaily)} daily streams • ${formatNumFull(cTotal)} total`,
      likes: Math.max(2750, Math.round(followers * 0.095 + 1250)),
      reposts: Math.max(620, Math.round(followers * 0.025 + 290)),
      replies: 156,
      views: Math.max(71000, Math.round(followers * 0.74 + 29000)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // Expressive Stan Twitter reaction with rich variety
  const focusSong =
    isBrandNewReleaseDay
      ? latestSong
      : releasedSongs[(dayNum * 3) % releasedSongs.length] || biggestCareerSong;
  const focusMeta = resolveSongMetadataAndCollabCredits(focusSong, artistName, state);
  const focusCover = getSongArt(focusSong, artistName, artistAvatar);
  const fDaily = focusSong.dailyStreams || 0;
  const fTotal = focusSong.streams || 0;
  const fSales = focusSong.pureSales || 0;
  const fDaysOut = (focusSong.daysSinceRelease ?? 0) + 1;
  const fSpChart = findChartEntryForSong(spGlobal, focusSong.title, artistName, state.date);

  const stanTemplates = [
    `WAIT— "${focusMeta.cleanTitle}" just pulled +${formatNumFull(fDaily)} streams on Day ${fDaysOut} (${formatNumFull(fTotal)} total) and people were really doubting ${artistName}'s longevity?! 😭👑 The way the chorus hits on headphones is pure serotonin, stream it 10x more today!!`,
    `nobody is doing bridges and vocal layering like ${focusMeta.formattedArtistCredits} right now... "${focusMeta.cleanTitle}" sitting at ${formatNumFull(fTotal)} total streams (+${formatNumFull(fDaily)} today) and ${formatNumFull(fSales)} pure copies sold is 100% organic demand 🎧🕯️✨`,
    `every single time "${focusMeta.cleanTitle}" comes on shuffle my entire mood shifts immediately 😭🔥 +${formatNumFull(fDaily)} streams in the last 24 hours alone (${formatNumFull(fTotal)} total)${fSpChart ? ` and holding at #${fSpChart.rank} ${fSpChart.movementBadge} globally` : ''}!! ${artistName} you will always be famous!!`,
    `the replay value on "${focusMeta.cleanTitle}" needs to be studied in music conservatories... Day ${fDaysOut}, +${formatNumFull(fDaily)} daily streams, ${formatNumFull(fTotal)} lifetime streams, zero skips, pure artistry from start to finish 💿💅`,
    `woke up, checked the charts, saw "${focusMeta.cleanTitle}" by ${focusMeta.formattedArtistCredits} clock another +${formatNumFull(fDaily)} Spotify streams today (${formatNumFull(fTotal)} total) and smiled 😁📈 When the music is THIS good, the public never stops tuning in!!`,
    `if "${focusMeta.cleanTitle}" has a million daily listeners I am one of them. If it has +${formatNumFull(fDaily)} streams today (${formatNumFull(fTotal)} total) I contributed at least 500 of them on loop 😭🎧 ${artistName}'s discography is genuinely unmatched!`
  ];

  const chosenStanText = stanTemplates[(dayNum + releasedSongs.length) % stanTemplates.length];

  extraTweets.push({
    id: `living-expressive-stan-${timestamp}-4`,
    authorName: `${artistName} HQ`,
    authorHandle: `@${cleanHandle}hq`,
    authorAvatar: LIVING_AVATARS.stan2,
    isVerified: false,
    category: 'fanbase',
    timeAgo: '3h',
    dateCreated: dateStr,
    content: chosenStanText,
    image: focusCover,
    mediaBadge: focusMeta.hasMusicVideo ? '🎬 OFFICIAL MV + AUDIO STREAMING' : 'FANBASE STREAMING PARTY',
    likes: Math.max(1180, Math.round(followers * 0.074 + 440)),
    reposts: Math.max(310, Math.round(followers * 0.021 + 130)),
    replies: 94,
    views: Math.max(26500, Math.round(followers * 0.56 + 10500)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 4. OLDER ALBUM / PROJECT TRACK-BY-TRACK & LONGEVITY TWEET
  // =========================================================================
  if (releasedProjects.length > 0) {
    const targetProj: Project =
      releasedProjects[(dayNum + releasedProjects.length) % releasedProjects.length];
    const projSongs = (targetProj.songs || []).map(ps => {
      const live = state.songs.find(gs => gs.id === ps.id);
      return live || ps;
    });
    const projLifetimeStreams = projSongs.reduce((sum, s) => sum + (s.streams || 0), 0);
    const projDailyStreams = projSongs.reduce((sum, s) => sum + (s.dailyStreams || 0), 0);
    const projSales = targetProj.pureSales || 0;

    if (projLifetimeStreams > 0) {
      extraTweets.push({
        id: `living-proj-deep-${timestamp}-5`,
        authorName: 'Talk of the Charts',
        authorHandle: '@talkofthecharts',
        authorAvatar: LIVING_AVATARS.talkofthecharts,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: '4h',
        dateCreated: dateStr,
        content: `Album Era Telemetry — ${artistName}'s "${targetProj.title}" (${targetProj.type.toUpperCase()}):\n\n• Daily Project Streams: +${formatNumFull(projDailyStreams)} today\n• Cumulative Era Streams: ${formatNumFull(projLifetimeStreams)}\n• Pure Album Units Sold: ${formatNumFull(projSales)} copies\n• Active Tracks: ${projSongs.length} songs generating daily recurrent streams`,
        image: targetProj.cover || focusCover,
        mediaBadge: `${targetProj.type.toUpperCase()} ERA LONGEVITY`,
        mediaTitle: `${targetProj.title} — ${artistName}`,
        mediaSubtitle: `+${formatNumFull(projDailyStreams)} daily streams • ${formatNumFull(projLifetimeStreams)} total`,
        likes: Math.max(1980, Math.round(followers * 0.078 + 910)),
        reposts: Math.max(440, Math.round(followers * 0.019 + 205)),
        replies: 92,
        views: Math.max(49000, Math.round(followers * 0.62 + 21500)),
        isPlayerPost: false,
        daysOld: 0
      });
    }
  }

  return extraTweets;
}
