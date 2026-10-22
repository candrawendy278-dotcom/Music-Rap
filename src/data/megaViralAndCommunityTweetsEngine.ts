// Mega Viral, Industry Analytics & Community Stan Twitter Engine for X
// Expands daily & starter X feeds with 10+ living, ultra-expressive tweet categories
// 100% powered by live GameState telemetry (zero mock numbers):
// - @PopTingz, @StatsSpotify, @HITSDD (HITS Daily Double), @RIAA, @Mediabase, @NME, @Vulture
// - Viral Quote Tweets, Stan Threads (@[handle]stats, @[handle]archive, @[handle]lyricbot, @viralpopclips)
// - Monthly Listeners Milestones & Collaboration Chemistry Spotlights

import { GameState, Song } from '../types';
import { formatNumFull, formatNum } from '../constants';
import { resolveAuthenticCover } from './musicCatalog';
import { XPost, getEnsuredXProfile } from './xSocialEngine';
import { resolveSongMetadataAndCollabCredits } from './spotifyTrackMetadataAndCollabEngine';
import { X_BRAND_PROFILE_PICTURES, resolveXAccountAvatar } from './xAccountAvatarsAndMoreTweetsEngine';

function getSongArt(song: Song | undefined, artistName: string, artistAvatar: string): string {
  if (!song) return artistAvatar;
  if (song.cover && song.cover.trim() !== '') return song.cover;
  if (song.mvThumbnail && song.mvThumbnail.trim() !== '') return song.mvThumbnail;
  return resolveAuthenticCover(artistName, song.title);
}

/**
 * Generates a rich wave of additional daily tweets from @PopTingz, @StatsSpotify, @HITSDD,
 * @RIAA, @Mediabase, @NME, Quote Tweets, Collaboration buzz, and Stan Twitter threads.
 */
export function generateMegaViralAndCommunityTweets(state: GameState): XPost[] {
  const profile = getEnsuredXProfile(state);
  const artistName = profile.name;
  const cleanHandle = profile.handle.replace(/^@/, '');
  const artistAvatar =
    state.artist?.image ||
    `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent(artistName.charAt(0))}`;

  const releasedSongs = (state.songs || []).filter(s => s.status === 'released');
  const releasedProjects = (state.projects || []).filter(p => p.status === 'released');
  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const dayNum = Math.max(
    1,
    Math.floor(new Date(dateStr).getTime() / (1000 * 60 * 60 * 24))
  );
  const timestamp = Date.now();
  const followers = profile.followers || 1000;
  const monthlyListeners = state.spotify?.listeners || 0;
  const spotifyFollowers = state.spotify?.followers || 0;
  const posts: XPost[] = [];

  if (releasedSongs.length === 0) {
    // Pre-debut extra living tweets so even Day 1 feels buzzing
    posts.push({
      id: `mega-pre-poptingz-${timestamp}`,
      authorName: 'Pop Tingz',
      authorHandle: '@PopTingz',
      authorAvatar: X_BRAND_PROFILE_PICTURES.poptingz || resolveXAccountAvatar({ authorHandle: '@PopTingz', authorName: 'Pop Tingz' }),
      isVerified: true,
      verifiedType: 'blue',
      category: 'media',
      timeAgo: '45m',
      dateCreated: dateStr,
      content: `${artistName} has now reached ${formatNumFull(state.fans || 250)} dedicated core fans and ${formatNumFull(monthlyListeners)} monthly listeners ahead of their upcoming studio era.`,
      image: artistAvatar,
      mediaBadge: 'RISING ARTIST WATCH',
      likes: Math.max(920, Math.round(followers * 0.055 + 420)),
      reposts: Math.max(210, Math.round(followers * 0.014 + 95)),
      replies: 49,
      views: Math.max(24500, Math.round(followers * 0.45 + 11000)),
      isPlayerPost: false,
      daysOld: 0
    });

    posts.push({
      id: `mega-pre-stan-${timestamp}`,
      authorName: `${artistName} Archive`,
      authorHandle: `@${cleanHandle}archive`,
      authorAvatar: resolveXAccountAvatar({ authorHandle: `@${cleanHandle}archive`, authorName: `${artistName} Archive` }),
      isVerified: false,
      category: 'fanbase',
      timeAgo: '2h',
      dateCreated: dateStr,
      content: `claiming my Day 1 ticket right now because when ${artistName} drops the debut single, the entire timeline is going to shift 😭🕯️✨ (${(state.hype || 15).toFixed(1)}% Hype already!!)`,
      image: artistAvatar,
      likes: Math.max(410, Math.round(followers * 0.042 + 180)),
      reposts: Math.max(98, Math.round(followers * 0.011 + 45)),
      replies: 31,
      views: Math.max(9400, Math.round(followers * 0.32 + 4200)),
      isPlayerPost: false,
      daysOld: 0
    });

    return posts;
  }

  const latestSong = releasedSongs[releasedSongs.length - 1];
  const latestProject = releasedProjects.length > 0 ? releasedProjects[releasedProjects.length - 1] : undefined;
  const olderSongs = releasedSongs.slice(0, -1);
  const sortedByStreams = [...releasedSongs].sort((a, b) => (b.streams || 0) - (a.streams || 0));
  const biggestHit = sortedByStreams[0] || latestSong;
  const collabSongs = releasedSongs.filter(s => s.collabId && s.collabId !== 'none');

  // Rotate catalog targets so older songs, deep cuts, and hits all get tweeted about every day
  const catalogPick1 =
    olderSongs.length > 0
      ? olderSongs[dayNum % olderSongs.length]
      : latestSong;
  const catalogPick2 =
    olderSongs.length > 1
      ? olderSongs[(dayNum + 1) % olderSongs.length]
      : biggestHit;

  const totalCatalogStreams = releasedSongs.reduce((sum, s) => sum + (s.streams || 0), 0);
  const totalDailyStreams = releasedSongs.reduce((sum, s) => sum + (s.dailyStreams || 0), 0);
  const totalCatalogSales = releasedSongs.reduce((sum, s) => sum + (s.pureSales || 0), 0);

  const latestMeta = resolveSongMetadataAndCollabCredits(latestSong, artistName, state);
  const pick1Meta = resolveSongMetadataAndCollabCredits(catalogPick1, artistName, state);
  const pick2Meta = resolveSongMetadataAndCollabCredits(catalogPick2, artistName, state);
  const biggestMeta = resolveSongMetadataAndCollabCredits(biggestHit, artistName, state);

  const latestCover = getSongArt(latestSong, artistName, artistAvatar);
  const pick1Cover = getSongArt(catalogPick1, artistName, artistAvatar);
  const pick2Cover = getSongArt(catalogPick2, artistName, artistAvatar);
  const biggestCover = getSongArt(biggestHit, artistName, artistAvatar);

  // =========================================================================
  // 1. @StatsSpotify — Live Monthly Listeners & Full Catalog Daily Stream Update
  // =========================================================================
  const listenerDelta = (state.spotify as any)?.listenerDelta || 0;
  const listenerDeltaStr =
    listenerDelta > 0
      ? `+${formatNumFull(listenerDelta)} today`
      : listenerDelta < 0
      ? `${formatNumFull(listenerDelta)} today`
      : `holding steady today`;

  posts.push({
    id: `mega-statsspotify-${timestamp}-1`,
    authorName: 'Spotify Stats',
    authorHandle: '@StatsSpotify',
    authorAvatar: X_BRAND_PROFILE_PICTURES.statsspotify || resolveXAccountAvatar({ authorHandle: '@StatsSpotify', authorName: 'Spotify Stats' }),
    isVerified: true,
    verifiedType: 'blue',
    category: 'chart',
    timeAgo: '19m',
    dateCreated: dateStr,
    content: `🟢 ${artistName} — Spotify Daily Artist Overview (${dateStr}):\n\n• Monthly Listeners: ${formatNumFull(monthlyListeners)} (${listenerDeltaStr})\n• Daily Catalog Streams: +${formatNumFull(totalDailyStreams)}\n• Total Career Streams: ${formatNumFull(totalCatalogStreams)}\n• Spotify Followers: ${formatNumFull(spotifyFollowers)}`,
    image: artistAvatar,
    mediaBadge: 'SPOTIFY ARTIST TELEMETRY',
    mediaTitle: `${artistName} on Spotify`,
    mediaSubtitle: `${formatNumFull(monthlyListeners)} Monthly Listeners • +${formatNumFull(totalDailyStreams)} daily`,
    likes: Math.max(2650, Math.round(followers * 0.095 + 1150)),
    reposts: Math.max(610, Math.round(followers * 0.024 + 260)),
    replies: 134,
    views: Math.max(64000, Math.round(followers * 0.72 + 28000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 2. @PopTingz — Viral Culture & Catalog Milestone Headline
  // =========================================================================
  const popTingzTemplates = [
    `${ pick1Meta.formattedArtistCredits}'s "${pick1Meta.cleanTitle}" is experiencing a viral surge in listener engagement, earning +${formatNumFull(catalogPick1.dailyStreams || 0)} streams today (${formatNumFull(catalogPick1.streams || 0)} total).`,
    `With ${formatNumFull(monthlyListeners)} monthly listeners and ${formatNumFull(totalCatalogStreams)} career streams across ${releasedSongs.length} tracks, ${artistName} is cementing one of the strongest catalogs of the year.`,
    `"${biggestMeta.cleanTitle}" by ${biggestMeta.formattedArtistCredits} remains a massive streaming force, now standing at ${formatNumFull(biggestHit.streams || 0)} total Spotify streams (+${formatNumFull(biggestHit.dailyStreams || 0)} in the past 24 hours).`
  ];

  posts.push({
    id: `mega-poptingz-${timestamp}-2`,
    authorName: 'Pop Tingz',
    authorHandle: '@PopTingz',
    authorAvatar: X_BRAND_PROFILE_PICTURES.poptingz || resolveXAccountAvatar({ authorHandle: '@PopTingz', authorName: 'Pop Tingz' }),
    isVerified: true,
    verifiedType: 'blue',
    category: 'media',
    timeAgo: '37m',
    dateCreated: dateStr,
    content: popTingzTemplates[dayNum % popTingzTemplates.length],
    image: dayNum % 3 === 0 ? pick1Cover : biggestCover,
    mediaBadge: 'POP TINGZ EXCLUSIVE',
    likes: Math.max(3100, Math.round(followers * 0.105 + 1350)),
    reposts: Math.max(720, Math.round(followers * 0.027 + 310)),
    replies: 168,
    views: Math.max(79000, Math.round(followers * 0.82 + 34000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 3. @HITSDD (HITS Daily Double) — Pure Sales & Equivalent Units Report
  // =========================================================================
  const streamEquivalentUnits = Math.round(totalCatalogStreams / 150) + totalCatalogSales;
  const todayUnits = Math.round(totalDailyStreams / 150) + (latestSong.dailyPureSales || 0);
  posts.push({
    id: `mega-hitsdd-${timestamp}-3`,
    authorName: 'HITS Daily Double',
    authorHandle: '@HITSDD',
    authorAvatar: X_BRAND_PROFILE_PICTURES.hitsdd || resolveXAccountAvatar({ authorHandle: '@HITSDD', authorName: 'HITS Daily Double' }),
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    timeAgo: '1h',
    dateCreated: dateStr,
    content: `MARKET WATCH: ${artistName}'s catalog has now moved ${formatNumFull(streamEquivalentUnits)} total US & global single-equivalent units (+${formatNumFull(todayUnits)} units today), powered by ${formatNumFull(totalCatalogSales)} pure digital sales and ${formatNumFull(totalCatalogStreams)} on-demand audio streams.`,
    image: latestProject?.cover || latestCover,
    mediaBadge: 'HITS DAILY DOUBLE • MARKET DATA',
    mediaTitle: `${artistName} — Activity Report`,
    mediaSubtitle: `${formatNumFull(streamEquivalentUnits)} Total Units • ${formatNumFull(totalCatalogSales)} Pure Sales`,
    likes: Math.max(1980, Math.round(followers * 0.075 + 890)),
    reposts: Math.max(440, Math.round(followers * 0.019 + 195)),
    replies: 86,
    views: Math.max(51000, Math.round(followers * 0.62 + 21000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 4. @RIAA — Official Certification Pacing & Unit Eligibility
  // =========================================================================
  const biggestUnits = Math.round((biggestHit.streams || 0) / 150) + (biggestHit.pureSales || 0);
  const nextCertName =
    biggestUnits >= 10000000
      ? 'RIAA Diamond (10,000,000+ units)'
      : biggestUnits >= 2000000
      ? `RIAA ${Math.floor(biggestUnits / 1000000)}x Multi-Platinum`
      : biggestUnits >= 1000000
      ? 'RIAA Platinum (1,000,000+ units)'
      : biggestUnits >= 500000
      ? 'RIAA Gold (500,000+ units)'
      : `RIAA Gold Pacing (${Math.min(99, Math.max(1, Math.round((biggestUnits / 500000) * 100)))}% toward 500,000 units)`;

  posts.push({
    id: `mega-riaa-${timestamp}-4`,
    authorName: 'RIAA',
    authorHandle: '@RIAA',
    authorAvatar: X_BRAND_PROFILE_PICTURES.riaa || resolveXAccountAvatar({ authorHandle: '@RIAA', authorName: 'RIAA' }),
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    timeAgo: '2h',
    dateCreated: dateStr,
    content: `💿 CERTIFICATION TRACKER: "${biggestMeta.cleanTitle}" by ${biggestMeta.formattedArtistCredits} has accumulated ${formatNumFull(biggestUnits)} RIAA certification units (${formatNumFull(biggestHit.streams || 0)} streams + ${formatNumFull(biggestHit.pureSales || 0)} pure sales) — Status: ${nextCertName}.`,
    image: biggestCover,
    mediaBadge: 'RIAA GOLD & PLATINUM PROGRAM',
    likes: Math.max(2500, Math.round(followers * 0.088 + 1100)),
    reposts: Math.max(580, Math.round(followers * 0.022 + 240)),
    replies: 112,
    views: Math.max(63000, Math.round(followers * 0.69 + 26000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 5. Quote Tweet — Stan Account Quote-Tweeting @StatsSpotify or @chartdata!
  // =========================================================================
  const quoteReactions = [
    `LOOK AT THOSE NUMBERS 😭📈 "${pick1Meta.cleanTitle}" doing +${formatNumFull(catalogPick1.dailyStreams || 0)} daily streams and ${formatNumFull(monthlyListeners)} monthly listeners!! Remember when haters doubted ${artistName}?!`,
    `Oh ${artistName} is truly in a league of their own right now 🔥 +${formatNumFull(totalDailyStreams)} catalog streams in a single day and EVERY track in the discography is eating!!`,
    `The organic longevity is actually insane to witness 🥹✨ ${formatNumFull(totalCatalogStreams)} total streams and people are still discovering "${pick2Meta.cleanTitle}" every single day!`
  ];

  posts.push({
    id: `mega-quote-stan-${timestamp}-5`,
    authorName: `${artistName} Stats & News`,
    authorHandle: `@${cleanHandle}stats`,
    authorAvatar: resolveXAccountAvatar({ authorHandle: `@${cleanHandle}stats`, authorName: `${artistName} Stats` }),
    isVerified: true,
    verifiedType: 'blue',
    category: 'fanbase',
    timeAgo: '1h',
    dateCreated: dateStr,
    content: quoteReactions[dayNum % quoteReactions.length],
    quoteTweet: {
      authorName: 'Spotify Stats',
      authorHandle: '@StatsSpotify',
      authorAvatar: X_BRAND_PROFILE_PICTURES.statsspotify || resolveXAccountAvatar({ authorHandle: '@StatsSpotify', authorName: 'Spotify Stats' }),
      isVerified: true,
      verifiedType: 'blue',
      content: `${artistName} earns +${formatNumFull(totalDailyStreams)} streams across their catalog today on Spotify, pushing their monthly audience to ${formatNumFull(monthlyListeners)} monthly listeners.`
    },
    likes: Math.max(1620, Math.round(followers * 0.082 + 640)),
    reposts: Math.max(410, Math.round(followers * 0.023 + 170)),
    replies: 95,
    views: Math.max(38000, Math.round(followers * 0.61 + 15000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 6. Collaboration Chemistry & Royalty Partnership Spotlight (if player has a collab!)
  // =========================================================================
  if (collabSongs.length > 0) {
    const collabTarget = collabSongs[dayNum % collabSongs.length];
    const collabMeta = resolveSongMetadataAndCollabCredits(collabTarget, artistName, state);
    const collabCover = getSongArt(collabTarget, artistName, artistAvatar);
    const partnerName = collabMeta.featuredArtists[0] || collabTarget.collabId;
    const royaltySplit = (collabTarget as any).collabRoyaltyPercent;

    posts.push({
      id: `mega-collab-buzz-${timestamp}-6`,
      authorName: 'Viral Pop Clips',
      authorHandle: '@viralpopclips',
      authorAvatar: resolveXAccountAvatar({ authorHandle: '@viralpopclips', authorName: 'Viral Pop Clips' }),
      isVerified: true,
      verifiedType: 'blue',
      category: 'fanbase',
      timeAgo: '2h',
      dateCreated: dateStr,
      content: `Wait can we talk about how ${artistName} and ${partnerName} created generational history on "${collabMeta.cleanTitle}"?! 😭🔥 Pulling +${formatNumFull(collabTarget.dailyStreams || 0)} streams today (${formatNumFull(collabTarget.streams || 0)} total)${royaltySplit ? ` with a ${royaltySplit}% royalty split deal` : ''} — both fanbases are eating so good!!`,
      image: collabCover,
      mediaBadge: `COLLAB SPOTLIGHT • ${artistName.toUpperCase()} x ${partnerName.toUpperCase()}`,
      mediaTitle: collabMeta.cleanTitle,
      mediaSubtitle: `${collabMeta.formattedArtistCredits} • ${formatNumFull(collabTarget.streams || 0)} streams`,
      likes: Math.max(2250, Math.round(followers * 0.092 + 880)),
      reposts: Math.max(540, Math.round(followers * 0.025 + 210)),
      replies: 142,
      views: Math.max(52000, Math.round(followers * 0.68 + 22000)),
      isPlayerPost: false,
      daysOld: 0
    });
  }

  // =========================================================================
  // 7. @Mediabase — Radio Airplay & Spins Surge on Catalog or Current Single
  // =========================================================================
  const radioTarget = (catalogPick1.dailyRadioPlays || 0) > (latestSong.dailyRadioPlays || 0) ? catalogPick1 : latestSong;
  const radioMeta = resolveSongMetadataAndCollabCredits(radioTarget, artistName, state);
  const radioSpins = radioTarget.dailyRadioPlays || radioTarget.radioPlays || 0;
  const radioImpressions = radioSpins * 1150;

  posts.push({
    id: `mega-mediabase-${timestamp}-7`,
    authorName: 'Mediabase Charts',
    authorHandle: '@Mediabase',
    authorAvatar: X_BRAND_PROFILE_PICTURES.mediabase || resolveXAccountAvatar({ authorHandle: '@Mediabase', authorName: 'Mediabase' }),
    isVerified: true,
    verifiedType: 'gold',
    category: 'chart',
    timeAgo: '3h',
    dateCreated: dateStr,
    content: `📻 MEDIABASE AIRPLAY PANEL: "${radioMeta.cleanTitle}" by ${radioMeta.formattedArtistCredits} registers ${formatNumFull(radioSpins)} radio spins today (~${formatNum(radioImpressions)} audience impressions) alongside +${formatNumFull(radioTarget.dailyStreams || 0)} on-demand streams.`,
    image: getSongArt(radioTarget, artistName, artistAvatar),
    mediaBadge: 'MEDIABASE RADIO PANEL',
    likes: Math.max(1540, Math.round(followers * 0.064 + 670)),
    reposts: Math.max(330, Math.round(followers * 0.016 + 140)),
    replies: 64,
    views: Math.max(39000, Math.round(followers * 0.54 + 17000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 8. @[handle]archive & @[handle]lyricbot — Deep Cut / Older Catalog Love
  // =========================================================================
  const archiveTarget = olderSongs.length > 0 ? olderSongs[(dayNum * 3) % olderSongs.length] : latestSong;
  const archiveMeta = resolveSongMetadataAndCollabCredits(archiveTarget, artistName, state);
  const archiveCover = getSongArt(archiveTarget, artistName, artistAvatar);
  const archiveDaysOut = (archiveTarget.daysSinceRelease ?? 0) + 1;

  const archiveTemplates = [
    `${archiveDaysOut} days since ${archiveMeta.formattedArtistCredits} blessed us with "${archiveMeta.cleanTitle}" (${archiveTarget.genre} • ${archiveTarget.subgenre || 'Core'}) and it STILL pulled +${formatNumFull(archiveTarget.dailyStreams || 0)} streams today (${formatNumFull(archiveTarget.streams || 0)} total) 😭💿 Truly timeless!`,
    `Unpopular opinion: "${archiveMeta.cleanTitle}" is top 3 in ${artistName}'s entire catalog and the fact that it's still gaining +${formatNumFull(archiveTarget.dailyStreams || 0)} daily streams on Day ${archiveDaysOut} proves the general public agrees 🔥🎧`,
    `Late night headphones on, listening to "${archiveMeta.cleanTitle}" by ${archiveMeta.formattedArtistCredits} for the 500th time 🌌✨ ${formatNumFull(archiveTarget.streams || 0)} streams and every single second of the production is perfection.`
  ];

  posts.push({
    id: `mega-archive-${timestamp}-8`,
    authorName: `${artistName} Archive`,
    authorHandle: `@${cleanHandle}archive`,
    authorAvatar: resolveXAccountAvatar({ authorHandle: `@${cleanHandle}archive`, authorName: `${artistName} Archive` }),
    isVerified: false,
    category: 'fanbase',
    timeAgo: '4h',
    dateCreated: dateStr,
    content: archiveTemplates[dayNum % archiveTemplates.length],
    image: archiveCover,
    mediaBadge: `CATALOG ARCHIVE • DAY ${archiveDaysOut}`,
    likes: Math.max(1450, Math.round(followers * 0.078 + 540)),
    reposts: Math.max(375, Math.round(followers * 0.021 + 150)),
    replies: 108,
    views: Math.max(33500, Math.round(followers * 0.58 + 13500)),
    isPlayerPost: false,
    daysOld: 0
  });

  // =========================================================================
  // 9. @NME or @Vulture — Cultural Impact & Artistic Evolution Feature
  // =========================================================================
  const isNme = dayNum % 2 === 1;
  posts.push({
    id: `mega-nme-vulture-${timestamp}-9`,
    authorName: isNme ? 'NME' : 'Vulture',
    authorHandle: isNme ? '@NME' : '@Vulture',
    authorAvatar: isNme
      ? (X_BRAND_PROFILE_PICTURES.nme || resolveXAccountAvatar({ authorHandle: '@NME', authorName: 'NME' }))
      : (X_BRAND_PROFILE_PICTURES.vulture || resolveXAccountAvatar({ authorHandle: '@Vulture', authorName: 'Vulture' })),
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    timeAgo: '5h',
    dateCreated: dateStr,
    content: isNme
      ? `Why ${artistName} is dominating the conversation right now: with ${formatNumFull(monthlyListeners)} Spotify monthly listeners and "${pick2Meta.cleanTitle}" crossing ${formatNumFull(catalogPick2.streams || 0)} streams, every release feels like an event.`
      : `From "${biggestMeta.cleanTitle}" (${formatNumFull(biggestHit.streams || 0)} streams) to "${latestMeta.cleanTitle}" (+${formatNumFull(latestSong.dailyStreams || 0)} daily), ${artistName}'s catalog depth is turning casual listeners into lifelong stans.`,
    image: pick2Cover,
    mediaBadge: isNme ? 'NME MUSIC FEATURE' : 'VULTURE CRITIC PICK',
    likes: Math.max(1890, Math.round(followers * 0.074 + 810)),
    reposts: Math.max(415, Math.round(followers * 0.019 + 180)),
    replies: 92,
    views: Math.max(48000, Math.round(followers * 0.61 + 20500)),
    isPlayerPost: false,
    daysOld: 0
  });

  return posts;
}
