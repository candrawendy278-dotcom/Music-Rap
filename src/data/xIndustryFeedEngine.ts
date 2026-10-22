// Authentic Music Industry & Stan Twitter Feed Engine for X
// Generates high-variety, realistic tweets on every in-game "Next Day" turn:
// 1. Chart Data & Analytics: @chartdata, @SpotifyCharts, @billboard, @talkofthecharts
// 2. Official Streaming Platforms: @Spotify, @YouTubeMusic, @AppleMusic, @iTunes
// 3. Official Artist Fanbase Charts: "[Artist Name] Charts" (@[cleanHandle]charts), "[Artist Name] Updates" (@[cleanHandle]updates)
// 4. Stan Twitter & Fan Reactions: "[Artist Name] Daily", @stan_[cleanHandle], @[cleanHandle]era, @[cleanHandle]hq
// 5. EVERY tweet includes the track's cover art or artist profile picture as an attached media card!

import { GameState, Song } from '../types';
import { formatNumFull, formatNum } from '../constants';
import { resolveAuthenticCover } from './musicCatalog';
import { XPost, getEnsuredXProfile } from './xSocialEngine';
import { CHART_TWEET_TEMPLATES, FAN_STAN_TWEET_TEMPLATES } from './fanChartTweetsCatalog';
import { generateAccurateDailyTweets } from './accurateChartAndStanTweetsEngine';

// Authentic Platform & News Avatars (Crisp CDN Images)
const BRAND_AVATARS = {
  chartdata: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
  spotify: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150&q=80',
  spotifyCharts: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=150&q=80',
  youtubeMusic: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&q=80',
  appleMusic: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=150&q=80',
  itunes: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&q=80',
  billboard: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&q=80',
  popbase: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80',
  popcrave: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&q=80',
  talkofthecharts: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&q=80',
  fanAvatar1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  fanAvatar2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
  fanAvatar3: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80'
};

/**
 * Returns a high-quality cover image for a song or artist fallback
 */
function getSongCoverImage(song: Song | undefined, artistName: string, artistAvatar: string): string {
  if (!song) return artistAvatar;
  if (song.cover && song.cover.trim() !== '') return song.cover;
  if (song.mvThumbnail && song.mvThumbnail.trim() !== '') return song.mvThumbnail;
  return resolveAuthenticCover(artistName, song.title);
}

/**
 * Generates fresh new tweets when the player advances a day ("Next Day").
 * Uses 100% live-telemetry-accurate data from accurateChartAndStanTweetsEngine.ts!
 */
export function generateDailyTweetsForNewDay(state: GameState): XPost[] {
  return generateAccurateDailyTweets(state);
}

function legacyGenerateDailyTweetsForNewDayUnused(state: GameState): XPost[] {
  const profile = getEnsuredXProfile(state);
  const artistName = profile.name;
  const cleanHandle = profile.handle.replace(/^@/, '');
  const artistAvatar = state.artist?.image || `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent(artistName.charAt(0))}`;
  
  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const releasedProjects = (state.projects || []).filter(p => p.status === 'released');
  const latestSong = releasedSongs[releasedSongs.length - 1];
  const latestProject = releasedProjects[releasedProjects.length - 1];
  const sortedByStreams = [...releasedSongs].sort((a, b) => (b.streams || 0) - (a.streams || 0));
  const topSong = sortedByStreams[0];

  const timestamp = Date.now();
  const dateStr = state.date ? state.date.split('T')[0] : new Date().toISOString().split('T')[0];
  const followers = profile.followers;
  const newTweets: XPost[] = [];

  // Pick a random high-profile NPC artist for industry interaction / chart rivalry
  const npcs = state.npcs || [];
  const featuredNpc = npcs.length > 0 ? npcs[Math.floor(Math.random() * npcs.length)] : null;

  // ==========================================
  // CASE A: Player has released at least one song
  // ==========================================
  if (latestSong) {
    const songCover = getSongCoverImage(latestSong, artistName, artistAvatar);
    const topSongCover = getSongCoverImage(topSong, artistName, artistAvatar);
    const dailyStreams = latestSong.dailyStreams || Math.max(1800, Math.round((latestSong.streams || 6000) * 0.08));
    const totalStreams = latestSong.streams || dailyStreams;
    const hot100Index = state.billboard?.hot100?.findIndex(i => i.isPlayer) ?? -1;
    const hot100Item = hot100Index >= 0 ? state.billboard?.hot100?.[hot100Index] : undefined;
    const hot100Rank = hot100Index >= 0 ? hot100Index + 1 : null;
    const itunesItem = state.itunes?.charts?.['daily_US']?.find(i => i.isPlayer) || state.itunes?.charts?.['daily_global']?.find(i => i.isPlayer);
    const itunesRank = itunesItem ? 1 : Math.max(2, Math.min(18, 20 - Math.round((latestSong.dailyPureSales || 25) / 10)));
    const radioSpins = latestSong.radioPlays || Math.round(dailyStreams * 0.008);
    const dayRandomizer = Math.floor(Math.random() * 4);

    // -------------------------------------------------------------
    // 1. [Artist Name] Charts (@[cleanHandle]charts) - Daily Breakdown
    // -------------------------------------------------------------
    if (dayRandomizer === 0) {
      newTweets.push({
        id: `daily-charts-${timestamp}-1`,
        authorName: `${artistName} Charts`,
        authorHandle: `@${cleanHandle}charts`,
        authorAvatar: artistAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'fanbase',
        timeAgo: 'Just now',
        dateCreated: dateStr,
        content: `📊 SPOTIFY DAILY COUNTER (${dateStr}):\n\n• "${latestSong.title}" — +${formatNumFull(dailyStreams)} filtered streams\n• Total Streams: ${formatNumFull(totalStreams)}\n• US Radio Impressions: ${formatNum(radioSpins * 1200)}\n\nKeep streaming & sharing links! #${cleanHandle.toUpperCase()}`,
        image: songCover,
        mediaBadge: 'SPOTIFY DAILY DATA',
        mediaTitle: `${latestSong.title} — ${artistName}`,
        mediaSubtitle: `+${formatNumFull(dailyStreams)} daily • ${formatNumFull(totalStreams)} total`,
        likes: Math.max(340, Math.round(followers * 0.045)),
        reposts: Math.max(88, Math.round(followers * 0.012)),
        replies: 46,
        views: Math.max(8200, Math.round(followers * 0.38)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else if (dayRandomizer === 1) {
      const milestoneTarget = Math.round((totalStreams * 1.35) / 100000) * 100000 || 500000;
      const streamsLeft = Math.max(5000, milestoneTarget - totalStreams);
      newTweets.push({
        id: `daily-charts-${timestamp}-1`,
        authorName: `${artistName} Charts`,
        authorHandle: `@${cleanHandle}charts`,
        authorAvatar: artistAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'fanbase',
        timeAgo: 'Just now',
        dateCreated: dateStr,
        content: `🎯 MILESTONE WATCH:\n\n"${latestSong.title}" is only ${formatNum(streamsLeft)} streams away from surpassing ${formatNum(milestoneTarget)} streams on @Spotify! 📈\n\nAdd it to your queue and keep streaming at 50%+ volume today! 🎧🔥`,
        image: songCover,
        mediaBadge: 'MILESTONE ALERT',
        mediaTitle: `${formatNum(milestoneTarget)} Target`,
        mediaSubtitle: `${formatNum(streamsLeft)} streams remaining`,
        likes: Math.max(420, Math.round(followers * 0.05)),
        reposts: Math.max(110, Math.round(followers * 0.015)),
        replies: 54,
        views: Math.max(9800, Math.round(followers * 0.42)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else if (dayRandomizer === 2) {
      newTweets.push({
        id: `daily-charts-${timestamp}-1`,
        authorName: `${artistName} Charts`,
        authorHandle: `@${cleanHandle}charts`,
        authorAvatar: artistAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'fanbase',
        timeAgo: 'Just now',
        dateCreated: dateStr,
        content: `🚨 US iTUNES STORE UPDATE:\n\n#${itunesRank}. "${latestSong.title}" — ${artistName} (+${Math.max(1, (timestamp % 3) + 1)})\n\nPure digital sales carry the highest weight for @billboard Hot 100 points! Buy all available versions on iTunes now! 💿👇`,
        image: songCover,
        mediaBadge: `US iTUNES #${itunesRank}`,
        mediaTitle: latestSong.title,
        mediaSubtitle: `Top Digital Song Sales • ${artistName}`,
        likes: Math.max(380, Math.round(followers * 0.042)),
        reposts: Math.max(95, Math.round(followers * 0.013)),
        replies: 40,
        views: Math.max(8900, Math.round(followers * 0.36)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else {
      newTweets.push({
        id: `daily-charts-${timestamp}-1`,
        authorName: `${artistName} Charts`,
        authorHandle: `@${cleanHandle}charts`,
        authorAvatar: artistAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'fanbase',
        timeAgo: 'Just now',
        dateCreated: dateStr,
        content: `📻 US MEDIABASE RADIO UPDATE:\n\n• "${latestSong.title}" — +${Math.max(12, Math.round(radioSpins * 0.15))} spins today\n• Audience Impressions: +${formatNum(Math.max(12000, radioSpins * 420))}\n• Callout scores trending up across Top 40 & Rhythmic formats! 📻✨`,
        image: songCover,
        mediaBadge: 'US RADIO AIRPLAY',
        likes: Math.max(290, Math.round(followers * 0.038)),
        reposts: Math.max(76, Math.round(followers * 0.01)),
        replies: 32,
        views: Math.max(7400, Math.round(followers * 0.3)),
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // -------------------------------------------------------------
    // 2. chart data (@chartdata) - Punchy Iconic Chart News
    // -------------------------------------------------------------
    const certThreshold = totalStreams >= 150000000 ? 'Platinum' : totalStreams >= 75000000 ? 'Gold' : null;
    if (latestProject && Math.random() > 0.5) {
      const projStreams = (latestProject.songs || []).reduce((acc, s) => {
        const live = state.songs.find(gs => gs.id === s.id);
        return acc + (live?.streams || s.streams || 0);
      }, 0);
      newTweets.push({
        id: `daily-chartdata-${timestamp}-2`,
        authorName: 'chart data',
        authorHandle: '@chartdata',
        authorAvatar: BRAND_AVATARS.chartdata,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: '38m',
        dateCreated: dateStr,
        content: `${artistName}'s '${latestProject.title}' has now surpassed ${formatNumFull(Math.max(projStreams, totalStreams))} total streams on Spotify across all tracks.`,
        image: latestProject.cover || songCover,
        mediaBadge: 'ALBUM MILESTONE',
        mediaTitle: latestProject.title,
        mediaSubtitle: `${artistName} • ${latestProject.type.toUpperCase()}`,
        likes: Math.max(2400, Math.round(followers * 0.10 + 1400)),
        reposts: Math.max(540, Math.round(followers * 0.025 + 310)),
        replies: 98,
        views: Math.max(64000, Math.round(followers * 0.75 + 30000)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else if (certThreshold && Math.random() > 0.45) {
      newTweets.push({
        id: `daily-chartdata-${timestamp}-2`,
        authorName: 'chart data',
        authorHandle: '@chartdata',
        authorAvatar: BRAND_AVATARS.chartdata,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: '42m',
        dateCreated: dateStr,
        content: `"${latestSong.title}" by ${artistName} is now officially eligible for RIAA ${certThreshold} certification in the US for selling over ${certThreshold === 'Platinum' ? '1,000,000' : '500,000'} units.`,
        image: songCover,
        mediaBadge: `RIAA ${certThreshold.toUpperCase()}`,
        likes: Math.max(2800, Math.round(followers * 0.12 + 1500)),
        reposts: Math.max(620, Math.round(followers * 0.03 + 340)),
        replies: 110,
        views: Math.max(72000, Math.round(followers * 0.8 + 35000)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else {
      newTweets.push({
        id: `daily-chartdata-${timestamp}-2`,
        authorName: 'chart data',
        authorHandle: '@chartdata',
        authorAvatar: BRAND_AVATARS.chartdata,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: '42m',
        dateCreated: dateStr,
        content: `"${latestSong.title}" by ${artistName} has now surpassed ${formatNumFull(totalStreams)} streams on Spotify (+${formatNumFull(dailyStreams)} yesterday).`,
        image: songCover,
        likes: Math.max(1400, Math.round(followers * 0.06 + 800)),
        reposts: Math.max(310, Math.round(followers * 0.018 + 190)),
        replies: 74,
        views: Math.max(48000, Math.round(followers * 0.6 + 22000)),
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // -------------------------------------------------------------
    // 3. Official Platform Tweet (Spotify / YouTube Music / Apple Music / iTunes)
    // -------------------------------------------------------------
    if (latestSong.hasMV && latestSong.views && latestSong.views > 25000 && Math.random() > 0.4) {
      const mvCover = latestSong.mvThumbnail || songCover;
      newTweets.push({
        id: `daily-ytm-${timestamp}-3`,
        authorName: 'YouTube Music',
        authorHandle: '@YouTubeMusic',
        authorAvatar: BRAND_AVATARS.youtubeMusic,
        isVerified: true,
        verifiedType: 'gold',
        category: 'platform',
        timeAgo: '1h',
        dateCreated: dateStr,
        content: `Trending Worldwide on YouTube 🎬\n\nThe official music video for "${latestSong.title}" by ${artistName} has crossed ${formatNumFull(latestSong.views)} views! Watch now on YouTube.`,
        image: mvCover,
        mediaBadge: 'YOUTUBE TRENDING MV',
        mediaTitle: `${artistName} - ${latestSong.title} (Official Music Video)`,
        mediaSubtitle: `${formatNumFull(latestSong.views)} views • Official Channel`,
        likes: 2450,
        reposts: 510,
        replies: 92,
        views: 65000,
        isPlayerPost: false,
        daysOld: 0
      });
    } else if (itunesRank <= 5 && Math.random() > 0.5) {
      newTweets.push({
        id: `daily-itunes-${timestamp}-3`,
        authorName: 'iTunes Store',
        authorHandle: '@iTunes',
        authorAvatar: BRAND_AVATARS.itunes,
        isVerified: true,
        verifiedType: 'gold',
        category: 'platform',
        timeAgo: '1h',
        dateCreated: dateStr,
        content: `US iTunes Top Songs Storefront:\n\n#${itunesRank} "${latestSong.title}" — ${artistName}\n\nSurging on the real-time digital sales chart today! 🎶`,
        image: songCover,
        mediaBadge: 'iTUNES STOREFRONT',
        likes: 1100,
        reposts: 240,
        replies: 48,
        views: 31000,
        isPlayerPost: false,
        daysOld: 0
      });
    } else {
      newTweets.push({
        id: `daily-spotifycharts-${timestamp}-3`,
        authorName: 'Spotify Charts',
        authorHandle: '@SpotifyCharts',
        authorAvatar: BRAND_AVATARS.spotifyCharts,
        isVerified: true,
        verifiedType: 'gold',
        category: 'chart',
        timeAgo: '1h',
        dateCreated: dateStr,
        content: `Daily Top Songs Global 🌍:\n\n"${latestSong.title}" by ${artistName} logs ${formatNumFull(dailyStreams)} filtered streams over the past 24 hours. Full chart at charts.spotify.com 📈`,
        image: songCover,
        mediaBadge: 'SPOTIFY CHARTS GLOBAL',
        likes: 2150,
        reposts: 460,
        replies: 84,
        views: 58000,
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // -------------------------------------------------------------
    // 4. Stan Twitter Quote-Tweet Reaction or NPC Artist Co-Sign
    // -------------------------------------------------------------
    if (featuredNpc && Math.random() > 0.45) {
      const npcHandle = `@${featuredNpc.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      newTweets.push({
        id: `daily-npccosign-${timestamp}-4`,
        authorName: featuredNpc.name,
        authorHandle: npcHandle,
        authorAvatar: featuredNpc.avatar || BRAND_AVATARS.popbase,
        isVerified: true,
        verifiedType: 'blue',
        category: 'media',
        timeAgo: '2h',
        dateCreated: dateStr,
        content: `been playing "${latestSong.title}" by @${cleanHandle} in the studio all week. that production and vocal pocket is crazy 🔥 respect.`,
        quoteTweet: {
          authorName: 'chart data',
          authorHandle: '@chartdata',
          isVerified: true,
          verifiedType: 'blue',
          content: `"${latestSong.title}" by ${artistName} has now surpassed ${formatNumFull(totalStreams)} streams on Spotify.`
        },
        likes: Math.max(4200, Math.round(followers * 0.14 + 2800)),
        reposts: Math.max(890, Math.round(followers * 0.035 + 520)),
        replies: 215,
        views: Math.max(95000, Math.round(followers * 1.1 + 54000)),
        isPlayerPost: false,
        daysOld: 0
      });
    } else {
      newTweets.push({
        id: `daily-updates-${timestamp}-4`,
        authorName: `${artistName} Updates`,
        authorHandle: `@${cleanHandle}updates`,
        authorAvatar: artistAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'fanbase',
        timeAgo: '2h',
        dateCreated: dateStr,
        content: `🚨 STATIONHEAD & STREAMING PARTY:\n\n• Keep volume above 50% on Spotify & Apple Music 🔊\n• Use our focused 2-hour playlist with 2 filler tracks between "${latestSong.title}" 🔁\n• Buy on iTunes if you haven't yet!\n\nLet's push for a new daily peak! 🎧🔥`,
        image: songCover,
        likes: Math.max(510, Math.round(followers * 0.055)),
        reposts: Math.max(140, Math.round(followers * 0.018)),
        replies: 62,
        views: Math.max(11500, Math.round(followers * 0.45)),
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // -------------------------------------------------------------
    // 5. Stan Twitter Viral Quote Reaction (@[cleanHandle]daily)
    // -------------------------------------------------------------
    const fanQuotes = [
      `THE BRIDGE ON "${latestSong.title}"?!?! I literally have chills all over my body ${artistName} put their whole soul into this record 😭🔥`,
      `not to be dramatic but "${latestSong.title}" is hands down Song of the Year like the vocal layering and mixing is unreal`,
      `The way "${latestSong.title}" is climbing every single DSP organically?! Pure listener demand. Real music always wins 👑✨`,
      `Looking at ${artistName}'s numbers from day 1 to crossing ${formatNum(totalStreams)} streams today... so proud to stan since day one 🥹❤️`,
      `EVERYONE WAKE UP!! "${latestSong.title}" just pulled +${formatNum(dailyStreams)} daily streams! Keep looping on all devices 🚀💿`,
      `The cover art and sonic direction for this era is 10/10. ${artistName} never misses 📸🖤`
    ];
    const chosenQuote = fanQuotes[Math.floor(Math.random() * fanQuotes.length)];
    const fanHandleName = `${artistName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    newTweets.push({
      id: `daily-fan-${timestamp}-5`,
      authorName: `${artistName} Daily`,
      authorHandle: `@${fanHandleName}daily`,
      authorAvatar: BRAND_AVATARS.fanAvatar1,
      isVerified: false,
      category: 'fanbase',
      timeAgo: '3h',
      dateCreated: dateStr,
      content: chosenQuote,
      quoteTweet: {
        authorName: `${artistName} Charts`,
        authorHandle: `@${cleanHandle}charts`,
        isVerified: true,
        verifiedType: 'blue',
        content: `📊 "${latestSong.title}" gathered +${formatNumFull(dailyStreams)} streams on Spotify yesterday (Total: ${formatNumFull(totalStreams)}).`
      },
      likes: Math.max(680, Math.round(followers * 0.065)),
      reposts: Math.max(180, Math.round(followers * 0.02)),
      replies: 48,
      views: Math.max(14000, Math.round(followers * 0.55)),
      isPlayerPost: false,
      daysOld: 0
    });

    // -------------------------------------------------------------
    // 6. Pop Base (@PopBase) or Talk of the Charts (@talkofthecharts)
    // -------------------------------------------------------------
    if (hot100Item && hot100Rank) {
      newTweets.push({
        id: `daily-talkofthecharts-${timestamp}-6`,
        authorName: 'Talk of the Charts',
        authorHandle: '@talkofthecharts',
        authorAvatar: BRAND_AVATARS.talkofthecharts,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: '4h',
        dateCreated: dateStr,
        content: `Early Billboard Hot 100 Predictions:\n\n#${hot100Rank}. "${hot100Item.title}" — ${artistName} (${formatNumFull(dailyStreams)} daily streams | #${itunesRank} US iTunes)\n\nStrong streaming stability and pure sales support this tracking week! 📈`,
        image: songCover,
        mediaBadge: `HOT 100 WATCH • #${hot100Rank}`,
        likes: 1850,
        reposts: 390,
        replies: 94,
        views: 42000,
        isPlayerPost: false,
        daysOld: 0
      });
    } else {
      newTweets.push({
        id: `daily-popbase-${timestamp}-6`,
        authorName: 'Pop Base',
        authorHandle: '@PopBase',
        authorAvatar: BRAND_AVATARS.popbase,
        isVerified: true,
        verifiedType: 'blue',
        category: 'media',
        timeAgo: '4h',
        dateCreated: dateStr,
        content: `"${latestSong.title}" by ${artistName} is surging across global streaming platforms, pulling ${formatNumFull(dailyStreams)} daily plays as fans praise its production and replay value.`,
        image: (topSongCover || artistAvatar),
        likes: 2100,
        reposts: 420,
        replies: 88,
        views: 52000,
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // -------------------------------------------------------------
    // 7. Billboard (@billboard) or Pop Crave (@PopCrave)
    // -------------------------------------------------------------
    if (Math.random() > 0.4) {
      newTweets.push({
        id: `daily-billboard-${timestamp}-7`,
        authorName: 'Billboard',
        authorHandle: '@billboard',
        authorAvatar: BRAND_AVATARS.billboard,
        isVerified: true,
        verifiedType: 'gold',
        category: 'media',
        timeAgo: '5h',
        dateCreated: dateStr,
        content: `📈 Hot Trending Songs: ${artistName}'s "${latestSong.title}" continues to build major streaming & sales momentum across North America and Europe this week.`,
        image: songCover,
        mediaBadge: 'BILLBOARD.COM',
        mediaTitle: `How ${artistName}'s "${latestSong.title}" Built Global Momentum`,
        mediaSubtitle: 'Billboard Chart Beat • Music Industry Report',
        likes: 3100,
        reposts: 580,
        replies: 120,
        views: 79000,
        isPlayerPost: false,
        daysOld: 0
      });
    } else {
      newTweets.push({
        id: `daily-popcrave-${timestamp}-7`,
        authorName: 'Pop Crave',
        authorHandle: '@PopCrave',
        authorAvatar: BRAND_AVATARS.popcrave,
        isVerified: true,
        verifiedType: 'blue',
        category: 'media',
        timeAgo: '5h',
        dateCreated: dateStr,
        content: `"${latestSong.title}" by ${artistName} has now crossed ${formatNumFull(totalStreams)} total streams as listeners call it one of the most addictive releases of the year. 🔥✨`,
        image: songCover,
        likes: 2750,
        reposts: 490,
        replies: 88,
        views: 64000,
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // -------------------------------------------------------------
    // 8. Authentic Chart Data Tracker (@chartdata / @talkofthecharts)
    // -------------------------------------------------------------
    const randomChartTemplate = CHART_TWEET_TEMPLATES[Math.floor(Math.random() * CHART_TWEET_TEMPLATES.length)];
    if (randomChartTemplate) {
      const chartAvatars: Record<string, string> = {
        chartdata: BRAND_AVATARS.chartdata,
        SpotifyCharts: BRAND_AVATARS.spotifyCharts,
        billboard: BRAND_AVATARS.billboard,
        talkofthecharts: BRAND_AVATARS.talkofthecharts,
        popbase: BRAND_AVATARS.popbase,
        popcrave: BRAND_AVATARS.popcrave
      };
      const chartHandle = `@${randomChartTemplate.source}`;
      newTweets.push({
        id: `daily-catalog-chart-${timestamp}-8`,
        authorName: randomChartTemplate.source === 'chartdata' ? 'chart data' : randomChartTemplate.source === 'talkofthecharts' ? 'Talk of the Charts' : 'Billboard Charts',
        authorHandle: chartHandle,
        authorAvatar: chartAvatars[randomChartTemplate.source] || BRAND_AVATARS.chartdata,
        isVerified: true,
        verifiedType: randomChartTemplate.source === 'billboard' ? 'gold' : 'blue',
        category: 'chart',
        timeAgo: '6h',
        dateCreated: dateStr,
        content: randomChartTemplate.buildContent({
          artist: artistName,
          songTitle: latestSong.title,
          streams: totalStreams,
          dailyStreams: dailyStreams,
          currentPosition: hot100Rank || 14,
          weeks: (latestSong as any).weeksOnChart || 1,
          points: (latestSong as any).chartPoints || Math.round(dailyStreams * 0.08)
        }),
        image: songCover,
        likes: Math.max(1200, Math.round(followers * 0.05)),
        reposts: Math.max(310, Math.round(followers * 0.015)),
        replies: 54,
        views: Math.max(25000, Math.round(followers * 0.4)),
        isPlayerPost: false,
        daysOld: 0
      });
    }

    // -------------------------------------------------------------
    // 9. Authentic Stan Fanbase Community Tweet (@[handle]daily, etc.)
    // -------------------------------------------------------------
    const randomFanTemplate = FAN_STAN_TWEET_TEMPLATES[Math.floor(Math.random() * FAN_STAN_TWEET_TEMPLATES.length)];
    if (randomFanTemplate) {
      const fanAvatars = [BRAND_AVATARS.fanAvatar1, BRAND_AVATARS.fanAvatar2, BRAND_AVATARS.fanAvatar3];
      const fanAvatar = fanAvatars[randomFanTemplate.avatarSeed % fanAvatars.length];
      newTweets.push({
        id: `daily-catalog-fan-${timestamp}-9`,
        authorName: `${artistName} ${randomFanTemplate.authorSuffix}`,
        authorHandle: `@${cleanHandle.toLowerCase()}${randomFanTemplate.authorSuffix.toLowerCase()}`,
        authorAvatar: fanAvatar,
        isVerified: false,
        category: 'fanbase',
        timeAgo: '7h',
        dateCreated: dateStr,
        content: randomFanTemplate.buildContent({
          artist: artistName,
          songTitle: latestSong.title,
          streams: totalStreams,
          dailyStreams: dailyStreams,
          position: itunesRank
        }),
        image: Math.random() > 0.4 ? songCover : artistAvatar,
        likes: Math.max(890, Math.round(followers * 0.06)),
        reposts: Math.max(230, Math.round(followers * 0.018)),
        replies: 62,
        views: Math.max(18000, Math.round(followers * 0.5)),
        isPlayerPost: false,
        daysOld: 0
      });
    }

  } else {
    // ==========================================
    // CASE B: Player has not released a song yet (Debut/Studio Era)
    // ==========================================
    newTweets.push({
      id: `daily-artistdaily-${timestamp}-1`,
      authorName: `${artistName} Daily`,
      authorHandle: `@${cleanHandle}daily`,
      authorAvatar: artistAvatar,
      isVerified: false,
      category: 'fanbase',
      timeAgo: 'Just now',
      dateCreated: dateStr,
      content: `Anticipation is building! Word from the recording studio is that ${artistName} is finalizing the debut era with world-class songwriting & production. Who's ready?! 🔥✨`,
      image: artistAvatar,
      likes: Math.max(160, Math.round(followers * 0.035)),
      reposts: Math.max(38, Math.round(followers * 0.009)),
      replies: 22,
      views: Math.max(3200, Math.round(followers * 0.22)),
      isPlayerPost: false,
      daysOld: 0
    });

    newTweets.push({
      id: `daily-popbase-${timestamp}-2`,
      authorName: 'Pop Base',
      authorHandle: '@PopBase',
      authorAvatar: BRAND_AVATARS.popbase,
      isVerified: true,
      verifiedType: 'blue',
      category: 'media',
      timeAgo: '1h',
      dateCreated: dateStr,
      content: `Rising artist ${artistName} is commanding major buzz across music circles as their official follower base expands to over ${formatNumFull(followers)} listeners.`,
      image: artistAvatar,
      likes: 850,
      reposts: 170,
      replies: 42,
      views: 24000,
      isPlayerPost: false,
      daysOld: 0
    });

    newTweets.push({
      id: `daily-fan-${timestamp}-3`,
      authorName: `${artistName} Updates`,
      authorHandle: `@${cleanHandle}updates`,
      authorAvatar: BRAND_AVATARS.fanAvatar2,
      isVerified: false,
      category: 'fanbase',
      timeAgo: '3h',
      dateCreated: dateStr,
      content: `Turn post notifications ON! When ${artistName} drops the first single, we are going to break all streaming records together! Fandom assemble 🔔❤️`,
      image: artistAvatar,
      likes: 310,
      reposts: 65,
      replies: 18,
      views: 6800,
      isPlayerPost: false,
      daysOld: 0
    });
  }

  return newTweets;
}

/**
 * Provides authentic starter feed tweets when the game begins or X is first opened.
 * Every tweet features the player's artist name and attached cover art or artist image.
 */
export function getInitialFeedTweets(state: GameState): XPost[] {
  const profile = getEnsuredXProfile(state);
  const artistName = profile.name;
  const cleanHandle = profile.handle.replace(/^@/, '');
  const artistAvatar = state.artist?.image || `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent(artistName.charAt(0))}`;
  const followers = profile.followers;

  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const latestSong = releasedSongs[releasedSongs.length - 1];
  const songCover = latestSong ? getSongCoverImage(latestSong, artistName, artistAvatar) : artistAvatar;

  const items: XPost[] = [];

  if (latestSong) {
    items.push({
      id: 'init-artistcharts',
      authorName: `${artistName} Charts`,
      authorHandle: `@${cleanHandle}charts`,
      authorAvatar: artistAvatar,
      isVerified: true,
      verifiedType: 'blue',
      category: 'fanbase',
      timeAgo: '1h',
      content: `Welcome to the official ${artistName} Charts update page! We track all Spotify streams, iTunes ranks, YouTube views, and Billboard points for ${artistName}. Stream "${latestSong.title}" now! 📊💿`,
      image: songCover,
      likes: Math.max(480, Math.round(followers * 0.045)),
      reposts: Math.max(120, Math.round(followers * 0.012)),
      replies: 58,
      views: Math.max(9200, Math.round(followers * 0.38)),
      isPlayerPost: false,
      daysOld: 0
    });

    items.push({
      id: 'init-spotify',
      authorName: 'Spotify',
      authorHandle: '@Spotify',
      authorAvatar: BRAND_AVATARS.spotify,
      isVerified: true,
      verifiedType: 'gold',
      category: 'platform',
      timeAgo: '2h',
      content: `Fresh on our radar. Stream "${latestSong.title}" by ${artistName} now on Spotify. 🎧✨`,
      image: songCover,
      likes: 3200,
      reposts: 640,
      replies: 140,
      views: 84000,
      isPlayerPost: false,
      daysOld: 0
    });

    items.push({
      id: 'init-chartdata',
      authorName: 'chart data',
      authorHandle: '@chartdata',
      authorAvatar: BRAND_AVATARS.chartdata,
      isVerified: true,
      verifiedType: 'blue',
      category: 'chart',
      timeAgo: '4h',
      content: `"${latestSong.title}" by ${artistName} is currently pacing strong across global digital music platforms.`,
      image: songCover,
      likes: 1650,
      reposts: 340,
      replies: 78,
      views: 45000,
      isPlayerPost: false,
      daysOld: 0
    });

    items.push({
      id: 'init-fan-stan',
      authorName: `${artistName} Daily`,
      authorHandle: `@${cleanHandle}daily`,
      authorAvatar: BRAND_AVATARS.fanAvatar1,
      isVerified: false,
      category: 'fanbase',
      timeAgo: '6h',
      content: `the bridge on "${latestSong.title}" literally left me speechless... ${artistName}'s vocal range and songwriting on this track is genuinely peak music 🔥❤️`,
      image: artistAvatar,
      likes: 720,
      reposts: 190,
      replies: 44,
      views: 16500,
      isPlayerPost: false,
      daysOld: 0
    });
  } else {
    items.push({
      id: 'init-artistcharts-start',
      authorName: `${artistName} Charts`,
      authorHandle: `@${cleanHandle}charts`,
      authorAvatar: artistAvatar,
      isVerified: true,
      verifiedType: 'blue',
      category: 'fanbase',
      timeAgo: '1h',
      content: `Welcome to ${artistName} Charts! Follow for daily streaming numbers, iTunes updates, playlist adds, and Billboard tracking news for ${artistName}! 📈✨`,
      image: artistAvatar,
      likes: Math.max(260, Math.round(followers * 0.032)),
      reposts: Math.max(55, Math.round(followers * 0.009)),
      replies: 28,
      views: Math.max(5200, Math.round(followers * 0.28)),
      isPlayerPost: false,
      daysOld: 0
    });

    items.push({
      id: 'init-popbase-start',
      authorName: 'Pop Base',
      authorHandle: '@PopBase',
      authorAvatar: BRAND_AVATARS.popbase,
      isVerified: true,
      verifiedType: 'blue',
      category: 'media',
      timeAgo: '2h',
      content: `${artistName} is officially launching their music career, with fans and industry tastemakers eagerly tuning in. 🎶`,
      image: artistAvatar,
      likes: 1250,
      reposts: 280,
      replies: 68,
      views: 36000,
      isPlayerPost: false,
      daysOld: 0
    });

    items.push({
      id: 'init-spotify-start',
      authorName: 'Spotify',
      authorHandle: '@Spotify',
      authorAvatar: BRAND_AVATARS.spotify,
      isVerified: true,
      verifiedType: 'gold',
      category: 'platform',
      timeAgo: '4h',
      content: `Keep an eye on ${artistName}. New sounds coming soon to the platform. 💚`,
      image: artistAvatar,
      likes: 2100,
      reposts: 420,
      replies: 95,
      views: 58000,
      isPlayerPost: false,
      daysOld: 0
    });

    items.push({
      id: 'init-fan-start',
      authorName: `${artistName} Updates`,
      authorHandle: `@${cleanHandle}updates`,
      authorAvatar: BRAND_AVATARS.fanAvatar2,
      isVerified: false,
      category: 'fanbase',
      timeAgo: '5h',
      content: `So excited to support ${artistName} from day one! Let's build the strongest fanbase together 🥹✨`,
      image: artistAvatar,
      likes: 380,
      reposts: 75,
      replies: 24,
      views: 7800,
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // Also include rich accurate telemetry & mega viral tweets right on initial open
  const extraLiveTweets = generateAccurateDailyTweets(state);
  return [...items, ...extraLiveTweets];
}
