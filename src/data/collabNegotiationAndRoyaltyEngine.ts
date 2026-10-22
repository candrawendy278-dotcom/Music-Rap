// Artist Collaboration Offer, Contract Negotiation & Daily Royalty Split Engine
// Allows the player to propose custom Upfront Feature Fees ($) + Master Royalty Splits (%)
// when inviting an NPC artist to feature on a track, and automatically deducts the agreed
// collaborator royalty split from daily streaming & sales revenue.

import { Song } from '../types';
import { REAL_WORLD_NPCS } from './realWorldArtistCatalog';
import { formatNumFull } from '../constants';

export interface NpcCollabExpectation {
  npcName: string;
  npcPop: number;
  npcGenre: string;
  npcAvatar?: string;
  tierLabel: 'Global Megastar' | 'A-List Hitmaker' | 'Mainstream Star' | 'Rising Chart Act';
  standardFee: number;
  standardRoyaltyPercent: number;
  minRoyaltyPercent: number;
  maxRoyaltyPercent: number;
  qualityBonus: number;
  audienceCrossoverBoost: number; // % boost to monthly listener discovery
}

export interface CollabOfferEvaluation {
  accepted: boolean;
  acceptanceScore: number; // 0 - 100
  statusLabel: 'CONTRACT ACCEPTED' | 'COUNTER-OFFER REQUIRED' | 'OFFER DECLINED';
  artistQuote: string;
  recommendedFee: number;
  recommendedRoyaltyPercent: number;
  qualityBonus: number;
  playerSharePercent: number;
  npcSharePercent: number;
}

/**
 * Computes an NPC artist's baseline upfront fee ($) and royalty split (%) expectations
 * based on their real-world popularity and the player's current industry standing.
 */
export function getNpcCollabExpectations(
  npcName: string,
  playerPopularity = 2.0
): NpcCollabExpectation {
  const found = REAL_WORLD_NPCS.find(
    n =>
      n.name.toLowerCase() === npcName.toLowerCase() ||
      n.id.toLowerCase() === npcName.toLowerCase()
  );

  const npcPop = found?.pop || 78;
  const npcGenre = found?.genre || 'Pop';
  const npcAvatar = found?.avatar || found?.image;

  // Mutual respect discount if player also has high popularity
  const cloutFactor = Math.max(0.55, 1 - Math.min(0.45, (playerPopularity || 0) / 200));

  let tierLabel: NpcCollabExpectation['tierLabel'] = 'Rising Chart Act';
  let baseFee = 1500;
  let standardRoyaltyPercent = 15;
  let qualityBonus = 12;
  let audienceCrossoverBoost = 0.12;

  if (npcPop >= 92) {
    tierLabel = 'Global Megastar';
    baseFee = 15000;
    standardRoyaltyPercent = 25;
    qualityBonus = 18;
    audienceCrossoverBoost = 0.28;
  } else if (npcPop >= 84) {
    tierLabel = 'A-List Hitmaker';
    baseFee = 7500;
    standardRoyaltyPercent = 20;
    qualityBonus = 15;
    audienceCrossoverBoost = 0.20;
  } else if (npcPop >= 75) {
    tierLabel = 'Mainstream Star';
    baseFee = 3500;
    standardRoyaltyPercent = 18;
    qualityBonus = 13;
    audienceCrossoverBoost = 0.15;
  } else {
    tierLabel = 'Rising Chart Act';
    baseFee = 1200;
    standardRoyaltyPercent = 15;
    qualityBonus = 12;
    audienceCrossoverBoost = 0.10;
  }

  const standardFee = Math.round((baseFee * cloutFactor) / 100) * 100;

  return {
    npcName: found?.name || npcName,
    npcPop,
    npcGenre,
    npcAvatar,
    tierLabel,
    standardFee,
    standardRoyaltyPercent,
    minRoyaltyPercent: 5,
    maxRoyaltyPercent: 50,
    qualityBonus,
    audienceCrossoverBoost
  };
}

/**
 * Evaluates a player's custom Collaboration Offer (Upfront Fee $ + Royalty Split %).
 * - Higher Royalty Split (%) allows the player to pay a lower (even $0) Upfront Fee!
 * - Higher Upfront Fee ($) allows the player to keep a larger share of the song's royalties!
 */
export function evaluateCollabOffer(params: {
  npcName: string;
  playerPopularity: number;
  offeredFee: number;
  offeredRoyaltyPercent: number;
}): CollabOfferEvaluation {
  const { npcName, playerPopularity, offeredFee, offeredRoyaltyPercent } = params;
  const exp = getNpcCollabExpectations(npcName, playerPopularity);

  const safeFee = Math.max(0, Math.round(offeredFee || 0));
  const safeRoyalty = Math.max(0, Math.min(50, Math.round(offeredRoyaltyPercent || 0)));

  // Convert both upfront fee and royalty percentage into a unified Deal Value Index.
  // 1% of master royalties is valued at roughly (standardFee / standardRoyaltyPercent) * 1.15
  const dollarValuePerRoyaltyPoint = Math.max(120, Math.round(exp.standardFee / Math.max(10, exp.standardRoyaltyPercent)));

  const targetDealValue = exp.standardFee + exp.standardRoyaltyPercent * dollarValuePerRoyaltyPoint;
  const offeredDealValue = safeFee + safeRoyalty * dollarValuePerRoyaltyPoint;

  // Minimum floor: even with a huge upfront fee, an artist requires at least 5% backend points;
  // or if paying $0 upfront, they require a generous backend royalty split (e.g. 32% - 45%).
  const rawScore = Math.round((offeredDealValue / Math.max(1, targetDealValue)) * 88);
  const royaltyFloorPenalty = safeRoyalty < 5 ? 35 : 0;
  const acceptanceScore = Math.max(5, Math.min(100, rawScore - royaltyFloorPenalty));

  const accepted = acceptanceScore >= 82 && safeRoyalty >= 5;

  // Calculate a fair counter-offer based on whichever lever the player is leaning toward
  const shortfallValue = Math.max(0, Math.ceil((targetDealValue * 0.94) - offeredDealValue));
  const recommendedRoyaltyPercent = Math.min(
    50,
    Math.max(
      5,
      safeRoyalty + Math.ceil(shortfallValue / Math.max(1, dollarValuePerRoyaltyPoint))
    )
  );
  const recommendedFee = Math.max(
    0,
    Math.round((safeFee + shortfallValue) / 100) * 100
  );

  let statusLabel: CollabOfferEvaluation['statusLabel'] = 'OFFER DECLINED';
  let artistQuote = '';

  if (accepted) {
    statusLabel = 'CONTRACT ACCEPTED';
    if (safeFee === 0) {
      artistQuote = `"I love the vision for this record! Since you're giving me a ${safeRoyalty}% master royalty split on backend streams & sales, I'll waive the upfront fee. Let's make a smash hit!"`;
    } else if (safeRoyalty >= exp.standardRoyaltyPercent + 8) {
      artistQuote = `"${safeRoyalty}% backend royalties plus $${formatNumFull(safeFee)} upfront? My management signed off immediately — I'm sending my vocals to the studio today!"`;
    } else {
      artistQuote = `"Deal! $${formatNumFull(safeFee)} upfront fee and ${safeRoyalty}% of streaming & sales royalties works great for my team. Let's lock in this collaboration!"`;
    }
  } else if (acceptanceScore >= 60) {
    statusLabel = 'COUNTER-OFFER REQUIRED';
    artistQuote = `"We're super close to a deal! My team either needs the royalty split raised to around ${recommendedRoyaltyPercent}% (with your $${formatNumFull(safeFee)} fee) OR an upfront fee of $${formatNumFull(recommendedFee)} at ${safeRoyalty}% royalty."`;
  } else {
    statusLabel = 'OFFER DECLINED';
    artistQuote = `"As a ${exp.tierLabel} (Pop ${exp.npcPop}), my standard rate is $${formatNumFull(exp.standardFee)} + ${exp.standardRoyaltyPercent}% royalties. Increase either the upfront fee or the backend royalty % so my label can clear the feature."`;
  }

  return {
    accepted,
    acceptanceScore,
    statusLabel,
    artistQuote,
    recommendedFee,
    recommendedRoyaltyPercent,
    qualityBonus: exp.qualityBonus,
    playerSharePercent: 100 - safeRoyalty,
    npcSharePercent: safeRoyalty
  };
}

/**
 * Processes daily collaborator royalty splits across all released songs.
 * Deducts the agreed `collabRoyaltyPercent` from each collaboration song's daily revenue
 * and records cumulative royalties paid to the featured artist.
 */
export function processDailyCollabRoyaltySplits(songs: Song[]): {
  updatedSongs: Song[];
  totalCollabRoyaltyDeducted: number;
} {
  let totalCollabRoyaltyDeducted = 0;

  const updatedSongs = songs.map(song => {
    if (
      song.status !== 'released' ||
      !song.collabId ||
      song.collabId === 'none'
    ) {
      return song;
    }

    const royaltyPct = song.collabRoyaltyPercent ?? 0;
    if (royaltyPct <= 0) {
      return song;
    }

    // Calculate today's gross revenue generated by this specific song
    // Matches the exact streaming, video & digital sales payout rates in songLifecycleEngine.ts
    const streamRev = (song.dailyStreams || 0) * 0.0034;
    const videoRev = (song.dailyViews || 0) * 0.0018;
    const salesRev = (song.dailyPureSales || 0) * 1.29;
    const grossSongRevToday = Math.round(streamRev + videoRev + salesRev);

    const collaboratorCutToday = Math.round(grossSongRevToday * (royaltyPct / 100));
    totalCollabRoyaltyDeducted += collaboratorCutToday;

    return {
      ...song,
      collabRoyaltyPaidToday: collaboratorCutToday,
      collabRoyaltyPaidTotal: (song.collabRoyaltyPaidTotal || 0) + collaboratorCutToday
    };
  });

  return {
    updatedSongs,
    totalCollabRoyaltyDeducted
  };
}
