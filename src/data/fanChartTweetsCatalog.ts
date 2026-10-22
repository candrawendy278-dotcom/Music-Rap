/**
 * Comprehensive Catalog of Authentic Fan, Stan Twitter, and Music Chart Tweets
 * Modeled after real-world chart trackers (@chartdata, @SpotifyCharts, @billboard, @talkofthecharts, @chartmetrics)
 * and stan Twitter fanbase accounts (@[artist]charts, @[artist]daily, @stan_[artist], @[artist]spotify).
 */

export interface ChartTweetTemplate {
  source: 'chartdata' | 'spotifyCharts' | 'billboard' | 'talkofthecharts' | 'popbase' | 'popcrave';
  category: 'chart' | 'streaming' | 'prediction' | 'news';
  buildContent: (params: {
    artist: string;
    songTitle?: string;
    albumTitle?: string;
    streams: number;
    dailyStreams: number;
    peakPosition?: number;
    currentPosition?: number;
    points?: number;
    weeks?: number;
    sales?: number;
  }) => string;
}

export interface FanTweetTemplate {
  vibe: 'hype' | 'streaming_party' | 'defending' | 'lyrics_appreciation' | 'manifesting' | 'tiktok_viral' | 'itunes_push';
  authorSuffix: string;
  avatarSeed: number;
  buildContent: (params: {
    artist: string;
    songTitle?: string;
    albumTitle?: string;
    streams: number;
    dailyStreams: number;
    position?: number;
  }) => string;
}

export const CHART_TWEET_TEMPLATES: ChartTweetTemplate[] = [
  {
    source: 'chartdata',
    category: 'chart',
    buildContent: ({ artist, songTitle, streams }) =>
      `"${songTitle}" by ${artist} has now surpassed ${formatCompactStreams(streams)} streams on Spotify.\n\nIt is one of their fastest tracks to hit this milestone. 📈`,
  },
  {
    source: 'chartdata',
    category: 'chart',
    buildContent: ({ artist, songTitle, dailyStreams, currentPosition }) =>
      `${artist}'s "${songTitle}" reaches a new daily high of +${dailyStreams.toLocaleString()} streams on Spotify, ranking #${currentPosition || 12} on today's chart.`,
  },
  {
    source: 'chartdata',
    category: 'chart',
    buildContent: ({ artist, songTitle }) =>
      `"${songTitle}" by ${artist} enters the Top 50 on the Global Digital Artist Daily Chart today. 🔥`,
  },
  {
    source: 'spotifyCharts',
    category: 'streaming',
    buildContent: ({ artist, songTitle, dailyStreams }) =>
      `Daily Top Songs Global 🌍\n\n"${songTitle}" by ${artist} earns +${dailyStreams.toLocaleString()} filtered streams in the past 24 hours!\n\nKeep listening: spotify.link/chart-daily`,
  },
  {
    source: 'spotifyCharts',
    category: 'streaming',
    buildContent: ({ artist, songTitle }) =>
      `Biggest single-day stream gainers on the Global Spotify Chart:\n\n🔥 +18.4% — ${artist}, "${songTitle}"\n\nClimbing across all major territories.`,
  },
  {
    source: 'billboard',
    category: 'chart',
    buildContent: ({ artist, songTitle, currentPosition, weeks }) =>
      `Billboard Hot 100:\n\n#${currentPosition || 14} (+6) "${songTitle}", ${artist} [${weeks || 1} weeks]. *new peak*`,
  },
  {
    source: 'billboard',
    category: 'chart',
    buildContent: ({ artist, albumTitle, currentPosition }) =>
      `Billboard 200:\n\n#${currentPosition || 8} ${artist} — "${albumTitle || 'Debut Era'}" remains in the Top 10 with strong streaming units this week.`,
  },
  {
    source: 'talkofthecharts',
    category: 'prediction',
    buildContent: ({ artist, songTitle, points }) =>
      `Early Hot 100 Final Predictions (Tracking Week):\n\n#${points && points > 180 ? 4 : 11} "${songTitle}" — ${artist} (~${Math.round(points || 120)} pts)\n\nRadio support is picking up alongside strong Spotify US stability.`,
  },
  {
    source: 'talkofthecharts',
    category: 'prediction',
    buildContent: ({ artist, songTitle }) =>
      `US Radio Update (Mediabase / BDS):\n\n"${songTitle}" by ${artist} picked up +14 new adds across Pop and Rhythmic stations today! 📻`,
  },
  {
    source: 'popbase',
    category: 'news',
    buildContent: ({ artist, songTitle }) =>
      `${artist}'s "${songTitle}" is currently having an organic viral moment across social media, seeing daily streaming increases of over 20%.`,
  },
  {
    source: 'popcrave',
    category: 'news',
    buildContent: ({ artist, songTitle }) =>
      `${artist} continues their breakout run with "${songTitle}", maintaining steady gains on Global Apple Music and Spotify Top 50.`,
  }
];

export const FAN_STAN_TWEET_TEMPLATES: FanTweetTemplate[] = [
  {
    vibe: 'streaming_party',
    authorSuffix: 'Daily',
    avatarSeed: 1,
    buildContent: ({ artist, songTitle, dailyStreams }) =>
      `🚨 STREAMING PARTY ALERT 🚨\n\n"${songTitle}" gained +${dailyStreams.toLocaleString()} streams yesterday! We are so close to cracking the next milestone! DO NOT stop streaming! Unmute on Spotify, loop with 3 playlist fillers in between! GO GO GO 🎧🔥🕯️`,
  },
  {
    vibe: 'hype',
    authorSuffix: 'Charts',
    avatarSeed: 2,
    buildContent: ({ artist, songTitle }) =>
      `THE ORGANIC HIT BEHAVIOR! They tried to say ${artist} wouldn't make noise this era and now "${songTitle}" is literally charting everywhere on every single platform?! Gagged them so bad 😭💅`,
  },
  {
    vibe: 'lyrics_appreciation',
    authorSuffix: 'HQ',
    avatarSeed: 3,
    buildContent: ({ artist, songTitle }) =>
      `the bridge and outro in "${songTitle}" literally clears everyone's whole discography i am not even exaggerating like the vocal production is insane... ${artist} you will always be famous 🧎‍♂️‍➡️✨`,
  },
  {
    vibe: 'manifesting',
    authorSuffix: 'Spotify',
    avatarSeed: 4,
    buildContent: ({ artist, songTitle }) =>
      `manifesting billboard hot 100 top 10 for "${songTitle}" next week 🕯️🕯️🕯️\n\neverybody buy the track on iTunes right now if you have $1.29 to spare, pure sales count so heavy towards chart points this week!! 💳📊`,
  },
  {
    vibe: 'tiktok_viral',
    authorSuffix: 'Trends',
    avatarSeed: 5,
    buildContent: ({ artist, songTitle }) =>
      `the way "${songTitle}" is everywhere on my TikTok FYP right now with thousands of new videos made today... the GP (general public) has finally caught on! ${artist} era is in full effect 📈✨`,
  },
  {
    vibe: 'defending',
    authorSuffix: 'Stats',
    avatarSeed: 6,
    buildContent: ({ artist, songTitle }) =>
      `anti accounts are quiet today seeing "${songTitle}" maintain 90%+ stream retention on day 4 of the tracking week! Longevity matters more than frontloaded noise and ${artist} has the longevity! 😌💅`,
  },
  {
    vibe: 'itunes_push',
    authorSuffix: 'Updates',
    avatarSeed: 7,
    buildContent: ({ artist, songTitle, position }) =>
      `iTunes US Update 🇺🇸\n\n#${position || 3} "${songTitle}" — ${artist}\n\nLet's get it to #1 before the midnight tracking cutoff! Gift copies to mutuals if you can! 🚀`,
  }
];

function formatCompactStreams(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
}
