// Official X (Twitter) Announcements Engine for The GRAMMY Awards & MTV VMAs
// Publishes comprehensive tweets when Nominations drop and when Ceremony Winners are crowned:
// 1. Who is nominated in each major category (Player & NPCs)
// 2. Most Nominated Artists leaderboard
// 3. Who won each category (Player & NPCs)
// 4. Final Trophy Haul leaderboard (how many trophies each artist brought home)

import { GameState } from '../types';
import { XPost } from './xSocialEngine';
import { AwardSeasonRecord } from './awardsFormulaAndSimulationEngine';

const GRAMMY_AVATAR = 'https://placehold.co/400x400/0A0A0C/D4AF37?text=GRAMMYs';
const VMA_AVATAR = 'https://placehold.co/400x400/09090F/FF1E8A?text=VMAs';
const CHARTDATA_AVATAR = 'https://placehold.co/400x400/0F172A/38BDF8?text=CD';
const POPBASE_AVATAR = 'https://placehold.co/400x400/4C1D95/F472B6?text=PB';

/**
 * Generates official X posts for either Nominations Day or Ceremony Night
 */
export function generateAwardEventXPosts(
  state: GameState,
  season: AwardSeasonRecord,
  eventType: 'nominations' | 'ceremony'
): XPost[] {
  const posts: XPost[] = [];
  const isGrammy = season.show === 'grammys';
  const officialName = isGrammy ? 'Recording Academy / GRAMMYs' : 'Video Music Awards';
  const officialHandle = isGrammy ? '@RecordingAcad' : '@vmas';
  const officialAvatar = isGrammy ? GRAMMY_AVATAR : VMA_AVATAR;
  const trophyLabel = isGrammy ? 'GRAMMY' : 'Moon Person';
  const trophyPlural = isGrammy ? 'GRAMMYs' : 'VMAs';
  const dateStr = state.date ? state.date.split('T')[0] : new Date().toISOString().split('T')[0];
  const playerName = state.artist?.name || '';

  const makePost = (params: {
    idSuffix: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    verifiedType: 'gold' | 'blue';
    category: 'chart' | 'media' | 'platform' | 'fanbase';
    content: string;
    image?: string;
    mediaBadge?: string;
    mediaTitle?: string;
    mediaSubtitle?: string;
    likesBase: number;
  }): XPost => {
    const likes = Math.round(params.likesBase * (0.9 + Math.random() * 0.25));
    const reposts = Math.round(likes * (0.22 + Math.random() * 0.08));
    const replies = Math.round(likes * (0.07 + Math.random() * 0.04));
    const views = Math.round(likes * (14 + Math.random() * 6));

    return {
      id: `award_${season.id}_${eventType}_${params.idSuffix}_${Date.now()}`,
      authorName: params.authorName,
      authorHandle: params.authorHandle,
      authorAvatar: params.authorAvatar,
      isVerified: true,
      verifiedType: params.verifiedType,
      category: params.category,
      timeAgo: 'Just now',
      dateCreated: dateStr,
      content: params.content,
      image: params.image,
      mediaBadge: params.mediaBadge,
      mediaTitle: params.mediaTitle,
      mediaSubtitle: params.mediaSubtitle,
      likes,
      reposts,
      replies,
      views,
      bookmarks: Math.round(likes * 0.09),
      daysOld: 0
    };
  };

  if (eventType === 'nominations') {
    // 1. Most Nominated Artists Leaderboard (@chartdata)
    const topNominated = [...season.artistTallies]
      .sort((a, b) => b.nominations - a.nominations)
      .slice(0, 6);

    if (topNominated.length > 0) {
      const leaderboardLines = topNominated
        .map((t, i) => `#${i + 1}. ${t.artistName} — ${t.nominations} nominations`)
        .join('\n');

      posts.push(
        makePost({
          idSuffix: 'most_nominated_leaders',
          authorName: 'chart data',
          authorHandle: '@chartdata',
          authorAvatar: CHARTDATA_AVATAR,
          verifiedType: 'gold',
          category: 'chart',
          content: `Most nominated artists at the ${season.editionLabel}:\n\n${leaderboardLines}`,
          image: topNominated[0].avatar,
          mediaBadge: 'OFFICIAL NOMINATIONS TALLY',
          mediaTitle: `${topNominated[0].artistName} leads with ${topNominated[0].nominations} nominations`,
          mediaSubtitle: season.editionLabel,
          likesBase: 145000
        })
      );
    }

    // 2. Major Category Nominee Lists (@RecordingAcad / @vmas)
    const majorCats = season.categories.filter(c => c.isMajor).slice(0, 4);
    majorCats.forEach(cat => {
      const nomList = cat.nominees
        .map(n =>
          n.workTitle === n.artistName
            ? `• ${n.artistName}`
            : `• "${n.workTitle}" — ${n.artistName}`
        )
        .join('\n');

      posts.push(
        makePost({
          idSuffix: `nom_cat_${cat.categoryId}`,
          authorName: officialName,
          authorHandle: officialHandle,
          authorAvatar: officialAvatar,
          verifiedType: 'gold',
          category: 'media',
          content: `OFFICIAL NOMINEES: ${cat.categoryName} (${season.editionLabel}):\n\n${nomList}`,
          image: cat.nominees[0]?.coverArt,
          mediaBadge: `${trophyPlural.toUpperCase()} NOMINEES`,
          mediaTitle: cat.categoryName,
          mediaSubtitle: `${cat.nominees.length} Official Nominees Announced`,
          likesBase: 98000
        })
      );
    });

    // 3. Player Nomination Spotlight (if Player received nominations)
    const playerTally = season.artistTallies.find(
      t => t.isPlayer || t.artistName.toLowerCase() === playerName.toLowerCase()
    );
    if (playerTally && playerTally.nominations > 0) {
      const playerNoms = season.categories
        .filter(c => c.nominees.some(n => n.isPlayer))
        .map(c => `• ${c.shortName}`)
        .slice(0, 7)
        .join('\n');

      posts.push(
        makePost({
          idSuffix: 'player_nom_spotlight',
          authorName: 'Pop Base',
          authorHandle: '@PopBase',
          authorAvatar: POPBASE_AVATAR,
          verifiedType: 'gold',
          category: 'media',
          content: `🚨 ${playerTally.artistName} has officially earned ${playerTally.nominations} nomination${playerTally.nominations > 1 ? 's' : ''} at the ${season.editionLabel}:\n\n${playerNoms}`,
          image: state.artist?.image || playerTally.avatar,
          mediaBadge: 'ARTIST SPOTLIGHT',
          mediaTitle: `${playerTally.artistName} · ${playerTally.nominations} ${trophyLabel} Nominations`,
          mediaSubtitle: season.editionLabel,
          likesBase: 165000
        })
      );
    }
  } else {
    // CEREMONY NIGHT: WINNERS & TOTAL TROPHIES TAKEN HOME

    // 1. Final Trophy Haul Leaderboard (@chartdata) — How many trophies each artist brought home
    const winnersLeaderboard = season.artistTallies.filter(t => t.wins > 0).slice(0, 6);
    if (winnersLeaderboard.length > 0) {
      const haulLines = winnersLeaderboard
        .map(
          (t, i) =>
            `#${i + 1}. ${t.artistName} — ${t.wins} ${t.wins === 1 ? 'trophy' : 'trophies'} (${t.nominations} noms)`
        )
        .join('\n');

      const biggest = winnersLeaderboard[0];
      posts.push(
        makePost({
          idSuffix: 'final_trophy_haul',
          authorName: 'chart data',
          authorHandle: '@chartdata',
          authorAvatar: CHARTDATA_AVATAR,
          verifiedType: 'gold',
          category: 'chart',
          content: `Most wins at the ${season.editionLabel} (Final Trophy Count):\n\n${haulLines}`,
          image: biggest.avatar,
          mediaBadge: 'NIGHT’S BIGGEST WINNER',
          mediaTitle: `${biggest.artistName} takes home ${biggest.wins} ${trophyPlural}`,
          mediaSubtitle: `Won: ${biggest.wonCategories.slice(0, 3).join(', ')}`,
          likesBase: 240000
        })
      );
    }

    // 2. Category-by-Category Official Winner Announcements (Major + Top Genre Categories)
    const announcedCategories = [
      ...season.categories.filter(c => c.isMajor),
      ...season.categories.filter(c => !c.isMajor).slice(0, 4)
    ];

    announcedCategories.forEach(cat => {
      const w = cat.winner;
      const winnerWorkLine =
        w.workTitle === w.artistName
          ? `${w.artistName}`
          : `"${w.workTitle}" by ${w.artistName}`;

      posts.push(
        makePost({
          idSuffix: `win_cat_${cat.categoryId}`,
          authorName: officialName,
          authorHandle: officialHandle,
          authorAvatar: officialAvatar,
          verifiedType: 'gold',
          category: 'media',
          content: `🏆 BREAKING: ${winnerWorkLine} wins ${cat.categoryName} at the ${season.editionLabel}!`,
          image: w.coverArt,
          mediaBadge: `${trophyLabel.toUpperCase()} WINNER`,
          mediaTitle: `${cat.categoryName}: ${w.artistName}`,
          mediaSubtitle: w.workTitle === w.artistName ? `Official ${trophyLabel} Winner` : `"${w.workTitle}" · Official ${trophyLabel} Winner`,
          likesBase: cat.isMajor ? 210000 : 115000
        })
      );
    });

    // 3. Player Trophy Haul Celebration (if Player won any trophies)
    const playerTally = season.artistTallies.find(
      t => t.isPlayer || t.artistName.toLowerCase() === playerName.toLowerCase()
    );
    if (playerTally && playerTally.wins > 0) {
      const wonList = playerTally.wonCategories.map(c => `🏆 ${c}`).join('\n');
      posts.push(
        makePost({
          idSuffix: 'player_trophy_haul',
          authorName: 'Pop Base',
          authorHandle: '@PopBase',
          authorAvatar: POPBASE_AVATAR,
          verifiedType: 'gold',
          category: 'media',
          content: `HISTORY MADE! ${playerTally.artistName} walks away from the ${season.editionLabel} with ${playerTally.wins} ${trophyLabel} ${playerTally.wins === 1 ? 'trophy' : 'trophies'} (from ${playerTally.nominations} nominations):\n\n${wonList}`,
          image: state.artist?.image || playerTally.avatar,
          mediaBadge: `${playerTally.wins}X ${trophyLabel.toUpperCase()} WINNER`,
          mediaTitle: `${playerTally.artistName} Sweeps ${playerTally.wins} Trophies Tonight`,
          mediaSubtitle: season.editionLabel,
          likesBase: 285000
        })
      );
    }
  }

  return posts;
}
