// Roster Brand Deals, CEO Award FYC Submissions, iTunes Catalog Resolver,
// and Roster X Profiles + Fandom Update Accounts Engine

import { GameState } from '../types';
import { formatNumFull } from '../constants';
import {
  AMBASSADOR_ROLE_TIERS,
  ActiveBrandContract,
  AmbassadorRoleTierId,
  BRAND_OFFERS_CATALOG,
  BrandOfferDefinition,
  IncomingBrandProposal,
  getAmbassadorRoleTierMeta,
  getBrandAuthenticLogoSvgDataUri,
  getBrandSignatureProductSvgDataUri,
} from './brandDealsEngine';
import {
  ImprintSignedArtist,
  getEnsuredRecordLabelState,
} from './recordLabelSystemEngine';
import {
  buildRosterArtistAvatarSvg,
  ensureRosterArtistFullFields,
} from './recordLabelCeoEngine';
import {
  getArtistDualContractStatus,
  getEnsuredImprintGroups,
} from './rosterGroupAndDualContractEngine';
import { XPost } from './xSocialEngine';
import { AwardShowType } from './awardsCategoriesConfig';

// ============================================================================
// 1. ROSTER BRAND DEALS INTERFACES & STATE
// ============================================================================

export interface RosterArtistBrandDealsRecord {
  artistId: string;
  activeContracts: ActiveBrandContract[];
  incomingProposals: IncomingBrandProposal[];
  brandAffinityByOfferId: Record<string, number>;
  totalGrossGenerated: number;
  totalLabelCutEarned: number;
  totalArtistCutEarned: number;
  lastPromotionMessage?: string | null;
}

export interface RosterAwardFycEntry {
  artistId: string;
  grammys: {
    preferredSongId: number | null;
    preferredAlbumId: number | null;
    preferredVideoSongId: number | null;
    priorityField: 'general' | 'pop_group' | 'genre' | 'bna';
    purchasedCampaignTiers: string[];
    campaignBonusScore: number;
    lastSubmittedDate?: string;
  };
  vmas: {
    preferredSongId: number | null;
    preferredAlbumId: number | null;
    preferredVideoSongId: number | null;
    priorityField: 'voty' | 'group' | 'pop' | 'bna';
    purchasedCampaignTiers: string[];
    campaignBonusScore: number;
    lastSubmittedDate?: string;
  };
}

export interface RosterFycCampaignTierOption {
  id: string;
  show: AwardShowType;
  title: string;
  subtitle: string;
  cost: number;
  bonusScore: number;
  trustGain: number;
  hypeGain: number;
  badge: string;
}

export const ROSTER_FYC_CAMPAIGN_TIERS: RosterFycCampaignTierOption[] = [
  {
    id: 'roster_grammy_mailer',
    show: 'grammys',
    title: 'Recording Academy Digital FYC Mailer',
    subtitle: 'Official lossless FYC screening package sent to 12,000 voting Academy members.',
    cost: 45_000,
    bonusScore: 1.6,
    trustGain: 3,
    hypeGain: 2.0,
    badge: 'TIER I · MAILER',
  },
  {
    id: 'roster_grammy_trade_blitz',
    show: 'grammys',
    title: 'Billboard & Variety Full-Page FYC Print Blitz',
    subtitle: 'Front-cover trade advertisements in Los Angeles, New York & Nashville.',
    cost: 135_000,
    bonusScore: 2.8,
    trustGain: 5,
    hypeGain: 4.0,
    badge: 'TIER II · TRADE ADS',
  },
  {
    id: 'roster_grammy_vip_screening',
    show: 'grammys',
    title: 'Private Academy Listening Gala & Showcase',
    subtitle: 'Executive acoustic showcase & producer Q&A for Recording Academy chapter governors.',
    cost: 290_000,
    bonusScore: 4.4,
    trustGain: 8,
    hypeGain: 6.5,
    badge: 'TIER III · GALA',
  },
  {
    id: 'roster_vma_stan_mobilizer',
    show: 'vmas',
    title: 'Global Fandom Double-Vote Mobilization Hub',
    subtitle: 'Dedicated voting microsite & Stan Twitter power-hour voting push.',
    cost: 35_000,
    bonusScore: 1.8,
    trustGain: 3,
    hypeGain: 3.0,
    badge: 'TIER I · FAN VOTE',
  },
  {
    id: 'roster_vma_times_square',
    show: 'vmas',
    title: 'MTV Times Square Billboard & TRL Takeover',
    subtitle: 'High-rotation MV spotlight across Times Square LED towers and MTV channels.',
    cost: 110_000,
    bonusScore: 3.0,
    trustGain: 5,
    hypeGain: 5.0,
    badge: 'TIER II · TIMES SQ',
  },
  {
    id: 'roster_vma_vanguard_lobby',
    show: 'vmas',
    title: 'Paramount & MTV Executive Screening Campaign',
    subtitle: 'Full editorial push for Video of the Year, Best Group & Best New Artist.',
    cost: 240_000,
    bonusScore: 4.5,
    trustGain: 7,
    hypeGain: 7.0,
    badge: 'TIER III · VANGUARD',
  },
];

// ============================================================================
// 2. ENSURE ROSTER BRAND DEALS RECORD & GENERATE PROPOSALS
// ============================================================================

export function determineBrandProposalForRosterArtist(
  artist: ImprintSignedArtist,
  offer: BrandOfferDefinition,
  existingAffinity: number = 0
): IncomingBrandProposal {
  const isGroup = Boolean((artist as any).isGroupEntity);
  const pop = Math.round(Number(artist.popularity) || 35);
  const hype = Math.round(Number(artist.hype) || 45);
  const groupScale = isGroup ? 1.35 : 1.0;

  let offeredRoleTierId: AmbassadorRoleTierId = 'friend_of_house';
  if (existingAffinity >= 110 && pop >= offer.minPopularity + 28) {
    offeredRoleTierId = 'face_of_brand';
  } else if (existingAffinity >= 70 || (pop >= offer.minPopularity + 20 && hype >= 65)) {
    offeredRoleTierId = 'global_ambassador';
  } else if (existingAffinity >= 35 || pop >= offer.minPopularity + 10) {
    offeredRoleTierId = 'house_ambassador';
  } else if (existingAffinity >= 12 || pop >= offer.minPopularity) {
    offeredRoleTierId = 'brand_ambassador';
  } else {
    offeredRoleTierId = 'friend_of_house';
  }

  const roleMeta = getAmbassadorRoleTierMeta(offeredRoleTierId);
  const offeredIsExclusive = offer.tier === 1 || offeredRoleTierId !== 'friend_of_house';
  const offeredDurationDays =
    offeredRoleTierId === 'face_of_brand' || offeredRoleTierId === 'global_ambassador'
      ? 180
      : offeredRoleTierId === 'house_ambassador'
      ? 120
      : 90;

  const signingBonus = Math.round(
    offer.signingBonus * roleMeta.signingBonusMultiplier * groupScale * 0.85
  );
  const dailyRetainer = Math.round(
    offer.dailyRetainer * roleMeta.retainerMultiplier * groupScale * 0.85
  );
  const shootBonusPayout = Math.round(
    offer.shootBonusPayout * roleMeta.shootPayoutMultiplier * groupScale * 0.85
  );
  const productRoyaltyPct = Number(
    (roleMeta.productRoyaltyPct * (offeredIsExclusive ? 1.15 : 0.9)).toFixed(1)
  );

  const popScale = (0.55 + pop / 90) * groupScale;
  const hypeScale = 0.7 + hype / 115;
  let estimatedDailyProductRoyalty = 0;
  for (const prod of offer.signatureProducts) {
    const estUnits = Math.round(prod.baseDailyUnits * popScale * hypeScale);
    const grossSales = estUnits * prod.retailPrice;
    estimatedDailyProductRoyalty += Math.round(
      grossSales * (productRoyaltyPct / 100) * 0.08
    );
  }

  const totalGuaranteedValue =
    signingBonus +
    dailyRetainer * offeredDurationDays +
    estimatedDailyProductRoyalty * offeredDurationDays;

  const roleDisplayTitle =
    offeredRoleTierId === 'face_of_brand'
      ? offer.faceOfDesignation
      : isGroup
      ? `${offer.brandName} Global Group ${roleMeta.title}`
      : `${offer.brandName} ${roleMeta.title}`;

  const stageName = artist.stageName || artist.name;

  return {
    id: `roster_prop_${artist.id}_${offer.id}`,
    offerId: offer.id,
    brandName: offer.brandName,
    heritageLabel: offer.heritageLabel,
    parentGroup: offer.parentGroup,
    vertical: offer.vertical,
    verticalLabel: offer.verticalLabel,
    offeredRoleTierId,
    offeredRoleTitle: roleDisplayTitle,
    offeredDurationDays,
    offeredIsExclusive,
    signingBonus,
    dailyRetainer,
    shootBonusPayout,
    productRoyaltyPct,
    estimatedDailyProductRoyalty,
    totalGuaranteedValue,
    terminationPenalty: Math.round(signingBonus * 0.65),
    executiveName: `${offer.brandName} VIP Talent Board`,
    executiveTitle: `Global Entertainment & Maison Relations, ${offer.brandName}`,
    offerLetterQuote: `"Our Maison has tracked ${stageName}'s rapid fanbase growth and visual presence. We formally invite your label to sign ${stageName} as ${roleDisplayTitle} with a ${productRoyaltyPct}% product royalty share."`,
    expiresInDays: 14,
  };
}

export function getEnsuredRosterBrandDealsRecord(
  state: GameState,
  artist: ImprintSignedArtist
): RosterArtistBrandDealsRecord {
  const map: Record<string, RosterArtistBrandDealsRecord> =
    (state as any).rosterBrandDealsByArtistId || {};
  const existing = map[artist.id];

  const signedIds = new Set((existing?.activeContracts || []).map((c) => c.offerId));
  const affinityMap = existing?.brandAffinityByOfferId || {};
  const pop = Number(artist.popularity) || 35;
  const hype = Number(artist.hype) || 45;

  let proposals = (existing?.incomingProposals || []).filter(
    (p) => !signedIds.has(p.offerId) && p.expiresInDays > 0
  );

  if (proposals.length === 0) {
    // Generate 3 to 5 tailored proposals from BRAND_OFFERS_CATALOG
    const qualified = BRAND_OFFERS_CATALOG.filter(
      (o) => !signedIds.has(o.id) && pop + 12 >= o.minPopularity && hype + 12 >= o.minHype
    );
    const pool =
      qualified.length >= 4
        ? qualified.slice(0, 5)
        : [
            ...qualified,
            ...BRAND_OFFERS_CATALOG.filter(
              (o) => !signedIds.has(o.id) && !qualified.some((q) => q.id === o.id)
            )
              .sort((a, b) => a.minPopularity - b.minPopularity)
              .slice(0, Math.max(0, 4 - qualified.length)),
          ];

    proposals = pool.map((offer) =>
      determineBrandProposalForRosterArtist(
        artist,
        offer,
        affinityMap[offer.id] || 0
      )
    );
  } else {
    proposals = proposals.map((p) => {
      const offer = BRAND_OFFERS_CATALOG.find((o) => o.id === p.offerId);
      if (!offer) return p;
      return determineBrandProposalForRosterArtist(
        artist,
        offer,
        affinityMap[offer.id] || 0
      );
    });
  }

  return {
    artistId: artist.id,
    activeContracts: existing?.activeContracts || [],
    incomingProposals: proposals,
    brandAffinityByOfferId: affinityMap,
    totalGrossGenerated: Number(existing?.totalGrossGenerated) || 0,
    totalLabelCutEarned: Number(existing?.totalLabelCutEarned) || 0,
    totalArtistCutEarned: Number(existing?.totalArtistCutEarned) || 0,
    lastPromotionMessage: existing?.lastPromotionMessage || null,
  };
}

/**
 * CEO accepts a Brand Deal on behalf of a signed Roster Artist or Official Group.
 * Enforces K-Pop Dual Contract rules: if a Group Member is on a 'group_only' contract,
 * the CEO cannot sign solo brand deals for them until their Solo Contract is re-acquired!
 */
export function acceptRosterArtistBrandDeal(
  state: GameState,
  artistId: string,
  offerId: string
): {
  success: boolean;
  message: string;
  nextState: GameState;
} {
  const rl = getEnsuredRecordLabelState(state);
  const imprint = rl.imprint;
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { success: false, message: 'Roster artist not found.', nextState: state };
  }
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);

  if (dual.isGroupMember && !dual.canManageSoloStudio) {
    return {
      success: false,
      message: `${dual.formattedStageName} only holds a Group Contract with your label. You do not hold their Solo Exclusive Contract to sign solo brand endorsements! Sign group deals via ${dual.groupName} or re-acquire their Solo Contract.`,
      nextState: state,
    };
  }

  const offer = BRAND_OFFERS_CATALOG.find((o) => o.id === offerId);
  if (!offer) {
    return { success: false, message: 'Brand offer not found.', nextState: state };
  }

  const record = getEnsuredRosterBrandDealsRecord(state, artist);
  if (record.activeContracts.some((c) => c.offerId === offerId)) {
    return {
      success: false,
      message: `${dual.formattedStageName} already has an active contract with ${offer.brandName}.`,
      nextState: state,
    };
  }

  const conflict = record.activeContracts.find(
    (c) => c.vertical === offer.vertical && c.offerId !== offer.id
  );
  if (conflict) {
    return {
      success: false,
      message: `Category Exclusivity Conflict: ${dual.formattedStageName} already represents ${conflict.brandName} in ${offer.verticalLabel}.`,
      nextState: state,
    };
  }

  const proposal = determineBrandProposalForRosterArtist(
    artist,
    offer,
    record.brandAffinityByOfferId[offer.id] || 0
  );

  const labelShareRatio = Math.max(
    0.25,
    Math.min(0.85, (Number((artist as any).imprintRoyaltyPct) || 70) / 100)
  );
  const labelBonusCut = Math.round(proposal.signingBonus * labelShareRatio);
  const artistBonusCut = proposal.signingBonus - labelBonusCut;

  const initialAffinity = (record.brandAffinityByOfferId[offer.id] || 0) + 18;

  const newContract: ActiveBrandContract = {
    offerId: offer.id,
    brandName: offer.brandName,
    heritageLabel: offer.heritageLabel,
    campaignTitle: offer.campaignTitle,
    faceOfDesignation: offer.faceOfDesignation,
    vertical: offer.vertical,
    verticalLabel: offer.verticalLabel,
    tier: offer.tier,
    roleTierId: proposal.offeredRoleTierId,
    roleTitle: proposal.offeredRoleTitle,
    isExclusive: proposal.offeredIsExclusive,
    productRoyaltyPct: proposal.productRoyaltyPct,
    brandAffinityXp: initialAffinity,
    capsuleDropsLaunched: 0,
    daysSinceLastCapsuleDrop: 99,
    dailyProductUnitsSold: offer.signatureProducts.reduce(
      (s, p) => s + p.baseDailyUnits,
      0
    ),
    dailyProductRoyaltyEarned: proposal.estimatedDailyProductRoyalty,
    totalProductRoyaltiesEarned: 0,
    signedDate: dateStr,
    daysRemaining: proposal.offeredDurationDays,
    totalDurationDays: proposal.offeredDurationDays,
    signingBonus: proposal.signingBonus,
    dailyRetainer: proposal.dailyRetainer,
    shootDeliverableName: offer.shootDeliverableName,
    shootBonusPayout: proposal.shootBonusPayout,
    shootHypeGain: offer.shootHypeGain,
    shootCooldownDays: offer.shootCooldownDays,
    daysSinceLastShoot: offer.shootCooldownDays,
    shootsCompleted: 0,
    terminationPenalty: proposal.terminationPenalty,
    totalEarnedFromContract: proposal.signingBonus,
  };

  const updatedRecord: RosterArtistBrandDealsRecord = {
    ...record,
    activeContracts: [newContract, ...record.activeContracts],
    incomingProposals: record.incomingProposals.filter((p) => p.offerId !== offer.id),
    brandAffinityByOfferId: {
      ...record.brandAffinityByOfferId,
      [offer.id]: initialAffinity,
    },
    totalGrossGenerated: record.totalGrossGenerated + proposal.signingBonus,
    totalLabelCutEarned: record.totalLabelCutEarned + labelBonusCut,
    totalArtistCutEarned: record.totalArtistCutEarned + artistBonusCut,
  };

  const nextRoster = imprint.signedRoster.map((r) => {
    if (r.id !== artistId) return r;
    const ens = ensureRosterArtistFullFields(r, dateStr);
    return {
      ...ens,
      popularity: Math.min(100, (ens.popularity || 35) + (offer.tier === 1 ? 3 : 2)),
      hype: Math.min(100, (ens.hype || 45) + (offer.tier === 1 ? 7 : 4)),
      fans: (ens.fans || 25_000) + (offer.tier === 1 ? 28_000 : 14_000),
      labelTrust: Math.min(100, ((ens as any).labelTrust ?? 78) + 4),
      totalGrossRevenue: (((ens as any).totalGrossRevenue as number) || 0) + proposal.signingBonus,
      totalLabelProfit: (((ens as any).totalLabelProfit as number) || 0) + labelBonusCut,
      activeBrandBadges: [
        `${offer.brandName} (${getAmbassadorRoleTierMeta(proposal.offeredRoleTierId).shortBadge})`,
        ...(((ens as any).activeBrandBadges as string[]) || []).filter(
          (b) => !b.startsWith(offer.brandName)
        ),
      ].slice(0, 5),
    } as any;
  });

  // Also post an announcement on X from @PopBase and the Artist/Fandom account!
  const roleMeta = getAmbassadorRoleTierMeta(proposal.offeredRoleTierId);
  const heroProd = offer.signatureProducts[0];
  const prodImg = heroProd
    ? getBrandSignatureProductSvgDataUri(heroProd, offer.brandName)
    : getBrandAuthenticLogoSvgDataUri(offer.id, offer.accentColor, offer.logoText);

  const xAnnouncement: XPost = {
    id: `roster_brand_${artist.id}_${offer.id}_${Date.now()}`,
    authorName: 'Pop Base',
    authorHandle: '@PopBase',
    authorAvatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80',
    isVerified: true,
    verifiedType: 'blue',
    category: 'media',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: `OFFICIAL: ${offer.brandName} has appointed ${dual.formattedStageName} (${imprint.imprintName}) as ${proposal.offeredRoleTitle} for their "${offer.campaignTitle}" global campaign! ✨👜`,
    image: prodImg,
    mediaBadge: roleMeta.shortBadge,
    mediaTitle: `${dual.formattedStageName} × ${offer.brandName}`,
    mediaSubtitle: `${proposal.offeredRoleTitle} • ${proposal.productRoyaltyPct}% Global Product Royalty`,
    likes: Math.round(35_000 + (artist.popularity || 40) * 1_800),
    reposts: Math.round(8_400 + (artist.popularity || 40) * 420),
    replies: 1_240,
    views: Math.round(420_000 + (artist.popularity || 40) * 19_000),
    isPlayerPost: false,
    daysOld: 0,
  };

  const nextState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + labelBonusCut,
    xPosts: [xAnnouncement, ...(state.xPosts || [])].slice(0, 120),
    rosterBrandDealsByArtistId: {
      ...((state as any).rosterBrandDealsByArtistId || {}),
      [artist.id]: updatedRecord,
    },
    recordLabelState: {
      ...rl,
      imprint: {
        ...imprint,
        signedRoster: nextRoster,
        totalRevenueGenerated: (imprint.totalRevenueGenerated || 0) + labelBonusCut,
      },
    },
  } as any;

  return {
    success: true,
    message: `Signed ${dual.formattedStageName} with ${offer.brandName} as ${proposal.offeredRoleTitle}! Gross Signing Bonus: $${proposal.signingBonus.toLocaleString()} (Your Label Cut: +$${labelBonusCut.toLocaleString()}).`,
    nextState,
  };
}

/**
 * Executes a Brand Campaign Shoot & Product Drop for a signed Roster Artist's active Brand Contract.
 * Boosts Brand Affinity XP (can trigger automatic Brand Board Tier Promotion up to "The Face Of..."),
 * pays out the Label Cut to the Player CEO, and posts a Fandom update on X!
 */
export function executeRosterArtistBrandShoot(
  state: GameState,
  artistId: string,
  offerId: string
): {
  success: boolean;
  message: string;
  nextState: GameState;
} {
  const rl = getEnsuredRecordLabelState(state);
  const imprint = rl.imprint;
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { success: false, message: 'Roster artist not found.', nextState: state };
  }
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);

  if (dual.isGroupMember && !dual.canManageSoloStudio) {
    return {
      success: false,
      message: `${dual.formattedStageName} is on a Group-Only Contract. Solo brand shoots are managed by their external agency.`,
      nextState: state,
    };
  }

  const record = getEnsuredRosterBrandDealsRecord(state, artist);
  const contract = record.activeContracts.find((c) => c.offerId === offerId);
  if (!contract) {
    return { success: false, message: 'Active brand contract not found.', nextState: state };
  }

  const offer = BRAND_OFFERS_CATALOG.find((o) => o.id === offerId);
  const affinityGain = 24;
  const nextAffinity = (contract.brandAffinityXp || 18) + affinityGain;

  let currentRoleTierId: AmbassadorRoleTierId =
    contract.roleTierId || 'brand_ambassador';
  let currentRoleTitle = contract.roleTitle || `${contract.brandName} Ambassador`;
  let currentRetainer = contract.dailyRetainer;
  let currentShootPayout = contract.shootBonusPayout;
  let currentRoyaltyPct = contract.productRoyaltyPct ?? 4.0;
  let promotionBonus = 0;
  let promotionAlert = '';

  const currentMeta = getAmbassadorRoleTierMeta(currentRoleTierId);
  const nextMeta = AMBASSADOR_ROLE_TIERS.find((t) => t.order === currentMeta.order + 1);
  if (offer && nextMeta && nextAffinity >= nextMeta.requiredAffinityForPromotion) {
    const promotedProposal = determineBrandProposalForRosterArtist(
      artist,
      offer,
      nextAffinity
    );
    currentRoleTierId = nextMeta.id;
    currentRoleTitle =
      nextMeta.id === 'face_of_brand'
        ? offer.faceOfDesignation
        : `${offer.brandName} ${nextMeta.title}`;
    currentRetainer = promotedProposal.dailyRetainer;
    currentShootPayout = promotedProposal.shootBonusPayout;
    currentRoyaltyPct = promotedProposal.productRoyaltyPct;
    promotionBonus = Math.round(promotedProposal.signingBonus * 0.4);
    promotionAlert = ` 🌟 TIER ELEVATION: ${offer.brandName} promoted ${dual.formattedStageName} to ${currentRoleTitle} (+$${promotionBonus.toLocaleString()} bonus)!`;
  }

  // Calculate product royalty surge from the campaign shoot
  const productRoyaltySurge = Math.round(
    (contract.dailyProductRoyaltyEarned || 8_500) * 6.5
  );
  const totalGrossPayout = currentShootPayout + productRoyaltySurge + promotionBonus;

  const labelShareRatio = Math.max(
    0.25,
    Math.min(0.85, (Number((artist as any).imprintRoyaltyPct) || 70) / 100)
  );
  const labelCut = Math.round(totalGrossPayout * labelShareRatio);
  const artistCut = totalGrossPayout - labelCut;

  const updatedContracts = record.activeContracts.map((c) => {
    if (c.offerId !== offerId) return c;
    return {
      ...c,
      roleTierId: currentRoleTierId,
      roleTitle: currentRoleTitle,
      dailyRetainer: currentRetainer,
      shootBonusPayout: currentShootPayout,
      productRoyaltyPct: currentRoyaltyPct,
      brandAffinityXp: nextAffinity,
      shootsCompleted: (c.shootsCompleted || 0) + 1,
      daysSinceLastShoot: 0,
      totalProductRoyaltiesEarned:
        (c.totalProductRoyaltiesEarned || 0) + productRoyaltySurge,
      totalEarnedFromContract: (c.totalEarnedFromContract || 0) + totalGrossPayout,
    };
  });

  const updatedRecord: RosterArtistBrandDealsRecord = {
    ...record,
    activeContracts: updatedContracts,
    brandAffinityByOfferId: {
      ...record.brandAffinityByOfferId,
      [offerId]: nextAffinity,
    },
    totalGrossGenerated: record.totalGrossGenerated + totalGrossPayout,
    totalLabelCutEarned: record.totalLabelCutEarned + labelCut,
    totalArtistCutEarned: record.totalArtistCutEarned + artistCut,
    lastPromotionMessage: promotionAlert || null,
  };

  const nextRoster = imprint.signedRoster.map((r) => {
    if (r.id !== artistId) return r;
    const ens = ensureRosterArtistFullFields(r, dateStr);
    return {
      ...ens,
      popularity: Math.min(100, (ens.popularity || 35) + 2),
      hype: Math.min(100, (ens.hype || 45) + Math.round(contract.shootHypeGain || 6)),
      fans: (ens.fans || 25_000) + 16_500,
      labelTrust: Math.min(100, ((ens as any).labelTrust ?? 78) + 3),
      totalGrossRevenue: (((ens as any).totalGrossRevenue as number) || 0) + totalGrossPayout,
      totalLabelProfit: (((ens as any).totalLabelProfit as number) || 0) + labelCut,
      activeBrandBadges: [
        `${contract.brandName} (${getAmbassadorRoleTierMeta(currentRoleTierId).shortBadge})`,
        ...(((ens as any).activeBrandBadges as string[]) || []).filter(
          (b) => !b.startsWith(contract.brandName)
        ),
      ].slice(0, 5),
    } as any;
  });

  const heroProd = offer?.signatureProducts?.[0];
  const prodImg =
    heroProd && offer
      ? getBrandSignatureProductSvgDataUri(heroProd, offer.brandName)
      : offer
      ? getBrandAuthenticLogoSvgDataUri(offer.id, offer.accentColor, offer.logoText)
      : undefined;

  const fanAccount = getRosterArtistFandomXAccountMeta(state, artist);
  const fanPost: XPost = {
    id: `roster_brand_shoot_${artist.id}_${Date.now()}`,
    authorName: fanAccount.fandomAccountName,
    authorHandle: fanAccount.fandomHandle,
    authorAvatar: artist.avatarUrl || buildRosterArtistAvatarSvg(dual.formattedStageName),
    isVerified: true,
    verifiedType: 'blue',
    category: 'fanbase',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: `📸 GLOBAL CAMPAIGN IMPACT: ${dual.formattedStageName} stars in ${contract.brandName}'s "${contract.shootDeliverableName}" as ${currentRoleTitle}!\n\n• Featured Product: ${heroProd?.name || contract.campaignTitle}\n• Campaign Impact XP: ${nextAffinity} pts\n• Sold Out across flagship boutiques worldwide 🔥`,
    image: prodImg,
    mediaBadge: `${contract.brandName.toUpperCase()} × ${dual.formattedStageName.toUpperCase()}`,
    likes: Math.round(24_000 + (artist.popularity || 40) * 1_450),
    reposts: Math.round(6_800 + (artist.popularity || 40) * 380),
    replies: 890,
    views: Math.round(290_000 + (artist.popularity || 40) * 14_000),
    isPlayerPost: false,
    daysOld: 0,
  };

  const nextState: GameState = {
    ...state,
    money: (Number(state.money) || 0) + labelCut,
    xPosts: [fanPost, ...(state.xPosts || [])].slice(0, 120),
    rosterBrandDealsByArtistId: {
      ...((state as any).rosterBrandDealsByArtistId || {}),
      [artist.id]: updatedRecord,
    },
    recordLabelState: {
      ...rl,
      imprint: {
        ...imprint,
        signedRoster: nextRoster,
        totalRevenueGenerated: (imprint.totalRevenueGenerated || 0) + labelCut,
      },
    },
  } as any;

  return {
    success: true,
    message: `${dual.formattedStageName} completed "${contract.shootDeliverableName}" for ${contract.brandName}! Gross Payout + Product Royalties: $${totalGrossPayout.toLocaleString()} (Your Label Cut: +$${labelCut.toLocaleString()}).${promotionAlert}`,
    nextState,
  };
}

/**
 * CEO pitches any Maison from BRAND_OFFERS_CATALOG on behalf of a Roster Artist or Official Group.
 */
export function pitchBrandForRosterArtist(
  state: GameState,
  artistId: string,
  offerId: string
): {
  success: boolean;
  message: string;
  nextState: GameState;
} {
  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = rl.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { success: false, message: 'Roster artist not found.', nextState: state };
  }
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);

  if (dual.isGroupMember && !dual.canManageSoloStudio) {
    return {
      success: false,
      message: `${dual.formattedStageName} is on a Group-Only Contract. Solo brand pitches are locked.`,
      nextState: state,
    };
  }

  const offer = BRAND_OFFERS_CATALOG.find((o) => o.id === offerId);
  if (!offer) {
    return { success: false, message: 'Maison not found.', nextState: state };
  }

  const record = getEnsuredRosterBrandDealsRecord(state, artist);
  if (record.activeContracts.some((c) => c.offerId === offerId)) {
    return {
      success: false,
      message: `${dual.formattedStageName} already has an active deal with ${offer.brandName}.`,
      nextState: state,
    };
  }

  const pop = Number(artist.popularity) || 35;
  const isGroup = Boolean((artist as any).isGroupEntity);
  const effectivePop = isGroup ? pop + 10 : pop;

  if (effectivePop + 8 < offer.minPopularity) {
    return {
      success: false,
      message: `${offer.brandName}'s Board requires at least ${offer.minPopularity - 8} Popularity (Current: ${pop}) before sending an official contract offer.`,
      nextState: state,
    };
  }

  const newProposal = determineBrandProposalForRosterArtist(
    artist,
    offer,
    record.brandAffinityByOfferId[offer.id] || 0
  );

  const updatedRecord: RosterArtistBrandDealsRecord = {
    ...record,
    incomingProposals: [
      newProposal,
      ...record.incomingProposals.filter((p) => p.offerId !== offerId),
    ],
  };

  return {
    success: true,
    message: `${offer.brandName}'s Talent Board reviewed your pitch and sent an official "${newProposal.offeredRoleTitle}" proposal for ${dual.formattedStageName}!`,
    nextState: {
      ...state,
      rosterBrandDealsByArtistId: {
        ...((state as any).rosterBrandDealsByArtistId || {}),
        [artist.id]: updatedRecord,
      },
    } as any,
  };
}

// ============================================================================
// 3. CEO AWARD SUBMISSIONS (FOR YOUR CONSIDERATION / FYC) FOR ROSTER ARTISTS
// ============================================================================

export function getEnsuredRosterAwardFycEntry(
  state: GameState,
  artist: ImprintSignedArtist
): RosterAwardFycEntry {
  const map: Record<string, RosterAwardFycEntry> =
    (state as any).rosterAwardFycByArtistId || {};
  const existing = map[artist.id];

  const releasedSongs = (artist.songs || []).filter((s) => s && s.status === 'released');
  const releasedProjects = (artist.projects || []).filter(
    (p) => p && p.status === 'released'
  );
  const releasedMvs = releasedSongs.filter((s) => s.hasMV);

  const defaultSongId =
    releasedSongs.length > 0 ? releasedSongs[releasedSongs.length - 1].id : null;
  const defaultAlbumId =
    releasedProjects.length > 0 ? releasedProjects[releasedProjects.length - 1].id : null;
  const defaultVideoId =
    releasedMvs.length > 0
      ? releasedMvs[releasedMvs.length - 1].id
      : defaultSongId;
  const isGroup = Boolean((artist as any).isGroupEntity);

  if (existing) {
    return {
      artistId: artist.id,
      grammys: {
        preferredSongId: existing.grammys?.preferredSongId ?? defaultSongId,
        preferredAlbumId: existing.grammys?.preferredAlbumId ?? defaultAlbumId,
        preferredVideoSongId: existing.grammys?.preferredVideoSongId ?? defaultVideoId,
        priorityField:
          existing.grammys?.priorityField || (isGroup ? 'pop_group' : 'general'),
        purchasedCampaignTiers: existing.grammys?.purchasedCampaignTiers || [],
        campaignBonusScore: Number(existing.grammys?.campaignBonusScore) || 0,
        lastSubmittedDate: existing.grammys?.lastSubmittedDate,
      },
      vmas: {
        preferredSongId: existing.vmas?.preferredSongId ?? defaultSongId,
        preferredAlbumId: existing.vmas?.preferredAlbumId ?? defaultAlbumId,
        preferredVideoSongId: existing.vmas?.preferredVideoSongId ?? defaultVideoId,
        priorityField: existing.vmas?.priorityField || (isGroup ? 'group' : 'voty'),
        purchasedCampaignTiers: existing.vmas?.purchasedCampaignTiers || [],
        campaignBonusScore: Number(existing.vmas?.campaignBonusScore) || 0,
        lastSubmittedDate: existing.vmas?.lastSubmittedDate,
      },
    };
  }

  return {
    artistId: artist.id,
    grammys: {
      preferredSongId: defaultSongId,
      preferredAlbumId: defaultAlbumId,
      preferredVideoSongId: defaultVideoId,
      priorityField: isGroup ? 'pop_group' : 'general',
      purchasedCampaignTiers: [],
      campaignBonusScore: 0,
    },
    vmas: {
      preferredSongId: defaultSongId,
      preferredAlbumId: defaultAlbumId,
      preferredVideoSongId: defaultVideoId,
      priorityField: isGroup ? 'group' : 'voty',
      purchasedCampaignTiers: [],
      campaignBonusScore: 0,
    },
  };
}

/**
 * CEO saves/submits official Award FYC entries (Song, Album, Video & Priority Field) for a Roster Artist or Group.
 */
export function submitRosterArtistAwardFycEntry(
  state: GameState,
  artistId: string,
  show: AwardShowType,
  payload: {
    preferredSongId: number | null;
    preferredAlbumId: number | null;
    preferredVideoSongId: number | null;
    priorityField: string;
  }
): {
  success: boolean;
  message: string;
  nextState: GameState;
} {
  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = rl.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { success: false, message: 'Roster artist not found.', nextState: state };
  }
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);

  if (dual.isGroupMember && !dual.canManageSoloStudio) {
    return {
      success: false,
      message: `${dual.formattedStageName} is on a Group-Only Contract. Solo award submissions are managed by their outside solo agency (you can still submit group entries for ${dual.groupName}!).`,
      nextState: state,
    };
  }

  const currentEntry = getEnsuredRosterAwardFycEntry(state, artist);
  const showState = show === 'grammys' ? currentEntry.grammys : currentEntry.vmas;

  // Give a +1.2 baseline official CEO FYC submission bonus when officially registered
  const baseSubmissionBoost = Math.max(showState.campaignBonusScore, 1.2);

  const updatedEntry: RosterAwardFycEntry = {
    ...currentEntry,
    [show]: {
      ...showState,
      preferredSongId: payload.preferredSongId,
      preferredAlbumId: payload.preferredAlbumId,
      preferredVideoSongId: payload.preferredVideoSongId,
      priorityField: payload.priorityField as any,
      campaignBonusScore: baseSubmissionBoost,
      lastSubmittedDate: dateStr,
    },
  };

  const selectedSong = (artist.songs || []).find((s) => s.id === payload.preferredSongId);
  const selectedAlbum = (artist.projects || []).find(
    (p) => p.id === payload.preferredAlbumId
  );

  const showLabel = show === 'grammys' ? 'The GRAMMY Awards' : 'MTV Video Music Awards';
  const fanMeta = getRosterArtistFandomXAccountMeta(state, artist);

  const fycPost: XPost = {
    id: `roster_fyc_${artist.id}_${show}_${Date.now()}`,
    authorName: fanMeta.fandomAccountName,
    authorHandle: fanMeta.fandomHandle,
    authorAvatar: artist.avatarUrl || buildRosterArtistAvatarSvg(dual.formattedStageName),
    isVerified: true,
    verifiedType: 'blue',
    category: 'chart',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: `🏆 FOR YOUR CONSIDERATION (${showLabel}):\n\n${rl.imprint.imprintName} has officially submitted ${dual.formattedStageName}'s ballot entries:\n• Song / Record Entry: "${selectedSong?.title || 'TBA'}"\n• Album / EP Entry: "${selectedAlbum?.title || 'N/A'}"\n• Priority Campaign Focus: ${payload.priorityField.toUpperCase()}`,
    image: selectedSong?.cover || selectedAlbum?.cover || artist.avatarUrl,
    mediaBadge: `OFFICIAL ${show.toUpperCase()} FYC BALLOT`,
    likes: Math.round(18_500 + (artist.popularity || 40) * 1_100),
    reposts: Math.round(5_200 + (artist.popularity || 40) * 310),
    replies: 640,
    views: Math.round(210_000 + (artist.popularity || 40) * 11_000),
    isPlayerPost: false,
    daysOld: 0,
  };

  const nextRoster = rl.imprint.signedRoster.map((r) => {
    if (r.id !== artistId) return r;
    const ens = ensureRosterArtistFullFields(r, dateStr);
    return {
      ...ens,
      labelTrust: Math.min(100, ((ens as any).labelTrust ?? 78) + 2),
      hype: Math.min(100, (ens.hype || 45) + 1.5),
    } as any;
  });

  return {
    success: true,
    message: `Registered official ${showLabel} FYC ballot entries for ${dual.formattedStageName}! (+2% Artist Trust)`,
    nextState: {
      ...state,
      xPosts: [fycPost, ...(state.xPosts || [])].slice(0, 120),
      rosterAwardFycByArtistId: {
        ...((state as any).rosterAwardFycByArtistId || {}),
        [artist.id]: updatedEntry,
      },
      recordLabelState: {
        ...rl,
        imprint: {
          ...rl.imprint,
          signedRoster: nextRoster,
        },
      },
    } as any,
  };
}

/**
 * CEO funds an Award FYC Outreach Campaign tier for a specific Roster Artist or Official Group.
 */
export function purchaseRosterArtistFycCampaign(
  state: GameState,
  artistId: string,
  tierId: string
): {
  success: boolean;
  message: string;
  nextState: GameState;
} {
  const tier = ROSTER_FYC_CAMPAIGN_TIERS.find((t) => t.id === tierId);
  if (!tier) {
    return { success: false, message: 'FYC campaign tier not found.', nextState: state };
  }

  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = rl.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { success: false, message: 'Roster artist not found.', nextState: state };
  }
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);

  if (dual.isGroupMember && !dual.canManageSoloStudio) {
    return {
      success: false,
      message: `${dual.formattedStageName} is on a Group-Only Contract. Fund FYC campaigns for their Group (${dual.groupName}) instead!`,
      nextState: state,
    };
  }

  const currentMoney = Number(state.money) || 0;
  if (currentMoney < tier.cost) {
    return {
      success: false,
      message: `Insufficient funds. "${tier.title}" requires $${tier.cost.toLocaleString()}.`,
      nextState: state,
    };
  }

  const entry = getEnsuredRosterAwardFycEntry(state, artist);
  const showBlock = tier.show === 'grammys' ? entry.grammys : entry.vmas;
  if (showBlock.purchasedCampaignTiers.includes(tier.id)) {
    return {
      success: false,
      message: `"${tier.title}" is already active for ${dual.formattedStageName}.`,
      nextState: state,
    };
  }

  const nextPurchased = [...showBlock.purchasedCampaignTiers, tier.id];
  const nextBonus = Number(
    Math.min(6.5, (showBlock.campaignBonusScore || 1.0) + tier.bonusScore).toFixed(2)
  );

  const updatedEntry: RosterAwardFycEntry = {
    ...entry,
    [tier.show]: {
      ...showBlock,
      purchasedCampaignTiers: nextPurchased,
      campaignBonusScore: nextBonus,
      lastSubmittedDate: dateStr,
    },
  };

  const nextRoster = rl.imprint.signedRoster.map((r) => {
    if (r.id !== artistId) return r;
    const ens = ensureRosterArtistFullFields(r, dateStr);
    return {
      ...ens,
      labelTrust: Math.min(100, ((ens as any).labelTrust ?? 78) + tier.trustGain),
      hype: Math.min(100, (ens.hype || 45) + tier.hypeGain),
      popularity: Math.min(100, (ens.popularity || 35) + 1),
    } as any;
  });

  return {
    success: true,
    message: `Activated "${tier.title}" for ${dual.formattedStageName}! (+${tier.bonusScore} Academy Ballot Score, +${tier.trustGain}% Artist Trust, +${tier.hypeGain}% Hype)`,
    nextState: {
      ...state,
      money: currentMoney - tier.cost,
      rosterAwardFycByArtistId: {
        ...((state as any).rosterAwardFycByArtistId || {}),
        [artist.id]: updatedEntry,
      },
      recordLabelState: {
        ...rl,
        imprint: {
          ...rl.imprint,
          signedRoster: nextRoster,
          totalExpensesPaid: (((rl.imprint as any).totalExpensesPaid as number) || 0) + tier.cost,
        },
      },
    } as any,
  };
}

// ============================================================================
// 4. ROSTER ARTIST X PROFILES & FANDOM / STAN STATS UPDATE ACCOUNTS
// ============================================================================

export interface RosterArtistXAccountMeta {
  artistId: string;
  isGroup: boolean;
  isGroupMember: boolean;
  groupName?: string;
  fandomName: string;
  // Official Artist / Group Account
  officialName: string;
  officialHandle: string;
  officialBio: string;
  officialAvatar: string;
  officialFollowers: number;
  officialFollowing: number;
  // Dedicated Fandom / Charts & Stats Tracker Account
  fandomAccountName: string;
  fandomHandle: string;
  fandomBio: string;
  fandomFollowers: number;
  activeBrandTitles: string[];
}

export function getRosterArtistFandomXAccountMeta(
  state: GameState,
  rawArtist: ImprintSignedArtist
): RosterArtistXAccountMeta {
  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);
  const groups = getEnsuredImprintGroups(state);

  const isGroup = Boolean((artist as any).isGroupEntity);
  const matchedGroup = groups.find(
    (g) => g.groupRosterArtistId === artist.id || g.id === (artist as any).groupId
  );

  const cleanAlnum = (dual.baseStageName || artist.stageName || artist.name)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 14);
  const cleanGroupAlnum = (matchedGroup?.groupName || dual.groupName || cleanAlnum)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 14);

  const fandomName = isGroup
    ? matchedGroup?.fandomName || `${artist.stageName} Official Fandom`
    : matchedGroup?.fandomName
    ? `${dual.baseStageName} (${matchedGroup.fandomName})`
    : `${dual.baseStageName} Stans`;

  const brandRecord = getEnsuredRosterBrandDealsRecord(state, artist);
  const activeBrandTitles = brandRecord.activeContracts.map(
    (c) => `${c.brandName} (${getAmbassadorRoleTierMeta(c.roleTierId).shortBadge})`
  );

  const releasedSongs = (artist.songs || []).filter((s) => s && s.status === 'released');
  const latestSong = releasedSongs[releasedSongs.length - 1];

  const brandLine =
    activeBrandTitles.length > 0
      ? `\n👜 Ambassador: ${activeBrandTitles.join(' • ')}`
      : '';
  const releaseLine = latestSong
    ? `\n💿 Latest Release: "${latestSong.title}" OUT NOW`
    : `\n🎙️ Signed to @${rl.imprint.imprintName.replace(/[^a-zA-Z0-9]/g, '')}`;

  const officialHandle = isGroup
    ? `@${cleanGroupAlnum}_official`
    : `@${cleanAlnum.toLowerCase()}_official`;

  const fandomAccountName = isGroup
    ? `${artist.stageName} Charts & Data (${matchedGroup?.fandomName || 'Fandom'} HQ)`
    : `${dual.formattedStageName} Charts & Updates`;

  const fandomHandle = isGroup
    ? `@${cleanGroupAlnum}Charts`
    : `@${cleanAlnum}Updates`;

  const officialBio = isGroup
    ? `Official X Account of ${artist.stageName} (${
        matchedGroup?.memberArtistIds?.length || 4
      }-Member Flagship Group under ${rl.imprint.imprintName}). Official Fandom: ${
        matchedGroup?.fandomName || 'Global'
      } ✨${brandLine}${releaseLine}`
    : `Official X Account of ${dual.formattedStageName} • Recording Artist under ${rl.imprint.imprintName} (${
        dual.contractScope === 'group_only'
          ? 'Group Contract Only'
          : dual.isGroupMember
          ? 'Group + Solo Exclusive'
          : 'Exclusive Soloist'
      }).${brandLine}${releaseLine}`;

  const fandomBio = isGroup
    ? `#1 Real-Time Charts, Spotify Streams, iTunes Pure Sales & YouTube MV Tracker for ${artist.stageName} by ${
        matchedGroup?.fandomName || 'Official Fans'
      } 📊🌐`
    : `#1 Daily Streaming, iTunes Sales, Billboard & Brand Endorsement Update Hub for ${dual.formattedStageName} 📊✨`;

  const fans = Math.max(15_000, Number(artist.fans) || 45_000);

  return {
    artistId: artist.id,
    isGroup,
    isGroupMember: dual.isGroupMember,
    groupName: dual.groupName,
    fandomName,
    officialName: dual.formattedStageName,
    officialHandle,
    officialBio,
    officialAvatar:
      artist.avatarUrl || buildRosterArtistAvatarSvg(dual.formattedStageName),
    officialFollowers: fans,
    officialFollowing: isGroup ? (matchedGroup?.memberArtistIds?.length || 4) + 2 : 14,
    fandomAccountName,
    fandomHandle,
    fandomBio,
    fandomFollowers: Math.round(fans * 0.42),
    activeBrandTitles,
  };
}

/**
 * Generates live Stan / Fandom Chart & Stats Update Tweets for all signed Roster Groups AND Soloists,
 * matching the exact same rich visual card formats (Spotify Global Split Card, Dual iTunes/YouTube Card,
 * Album Tracklist Poster, and Stan Day-by-Day Telemetry) that the Player gets!
 */
export function generateRosterFandomStatsUpdateTweets(state: GameState): XPost[] {
  const rl = getEnsuredRecordLabelState(state);
  if (!rl.imprint.isFounded || !Array.isArray(rl.imprint.signedRoster)) {
    return [];
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const datedUpper = new Date(dateStr || '2026-01-01')
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();

  const spGlobal = state.spotify?.charts?.['daily_global'] || [];
  const itGlobal = state.itunes?.charts?.['daily_global'] || [];
  const ytGlobal = state.youtube?.charts?.['daily_global'] || [];
  const hot100 = state.billboard?.hot100 || [];

  const normTitle = (t: string) =>
    (t || '')
      .replace(/\s*\(Official Music Video\)/i, '')
      .replace(/\s*\((?:feat\.|ft\.|with)\s+[^)]+\)/i, '')
      .trim()
      .toLowerCase();

  const posts: XPost[] = [];

  rl.imprint.signedRoster.forEach((rawArt, idx) => {
    const artist = ensureRosterArtistFullFields(rawArt, dateStr);
    const meta = getRosterArtistFandomXAccountMeta(state, artist);
    const releasedSongs = (artist.songs || []).filter((s) => s && s.status === 'released');
    const releasedProjects = (artist.projects || []).filter(
      (p) => p && p.status === 'released'
    );

    const latestSong = releasedSongs[releasedSongs.length - 1];
    const latestProject = releasedProjects[releasedProjects.length - 1];

    // 1. Official Artist / Group Pinned Status Post
    posts.push({
      id: `roster-official-pin-${artist.id}-${dateStr}`,
      authorName: meta.officialName,
      authorHandle: meta.officialHandle,
      authorAvatar: meta.officialAvatar,
      isVerified: true,
      verifiedType: meta.isGroup ? 'gold' : 'blue',
      category: 'fanbase',
      timeAgo: `${idx + 1}h`,
      dateCreated: dateStr,
      content: latestSong
        ? `Thank you to ${meta.fandomName} around the world for showing so much love to "${latestSong.title}" (${formatNumFull(
            latestSong.streams || 0
          )} streams)! ${
            meta.activeBrandTitles.length > 0
              ? `Excited for our upcoming ${meta.activeBrandTitles[0]} campaign shoot too ✨🖤`
              : 'More music coming soon via ' + rl.imprint.imprintName + ' 💿✨'
          }`
        : `Official X page of ${meta.officialName} under ${rl.imprint.imprintName}. New era loading in the studio 🎙️✨`,
      image: latestSong?.mvThumbnail || latestSong?.cover || undefined,
      mediaBadge: meta.isGroup
        ? `OFFICIAL GROUP • ${meta.fandomName.toUpperCase()}`
        : `OFFICIAL ROSTER ARTIST`,
      likes: Math.max(1_800, Math.round(meta.officialFollowers * 0.085)),
      reposts: Math.max(460, Math.round(meta.officialFollowers * 0.024)),
      replies: Math.max(95, Math.round(meta.officialFollowers * 0.005)),
      views: Math.max(32_000, Math.round(meta.officialFollowers * 0.55)),
      isPlayerPost: false,
      daysOld: 0,
    });

    // 2. Fandom / Stan Account Real-Time Song Stats & Visual Cards (Spotify + iTunes + YouTube + Hot 100)
    if (latestSong) {
      const targetNorm = normTitle(latestSong.title);
      const artLower = meta.officialName.toLowerCase();
      const baseLower = (artist.name || '').toLowerCase();

      const matchChartRank = (chart: any[]): number | null => {
        const foundIdx = chart.findIndex(
          (item) =>
            normTitle(item.title || '') === targetNorm &&
            ((item.artist || '').toLowerCase().includes(artLower) ||
              (baseLower && (item.artist || '').toLowerCase().includes(baseLower)))
        );
        return foundIdx !== -1 ? foundIdx + 1 : null;
      };

      const spRank = matchChartRank(spGlobal);
      const itRank = matchChartRank(itGlobal);
      const ytRank = matchChartRank(ytGlobal);
      const h100Rank = matchChartRank(hot100);

      const spRankLabel = spRank !== null ? `#${spRank}` : 'OUT';
      const itRankLabel = itRank !== null ? `#${itRank}` : 'OUT';
      const ytRankLabel = ytRank !== null ? `#${ytRank}` : 'OUT';
      const h100RankLabel = h100Rank !== null ? `#${h100Rank}` : 'Bubbling Under';

      const dailyStreams = Math.max(0, latestSong.dailyStreams || 0);
      const totalStreams = Math.max(dailyStreams, latestSong.streams || 0);
      const dailySales = Math.max(0, latestSong.dailyPureSales || 0);
      const totalSales = Math.max(dailySales, latestSong.pureSales || 0);
      const dailyViews = Math.max(0, latestSong.dailyViews || 0);
      const totalViews = Math.max(dailyViews, latestSong.views || 0);

      // Fandom Post A: Spotify Global Split Card + Full Platform Telemetry (Group & Soloist Fandom Update)
      posts.push({
        id: `roster-fandom-sp-${artist.id}-${latestSong.id}-${dateStr}`,
        authorName: meta.fandomAccountName,
        authorHandle: meta.fandomHandle,
        authorAvatar: meta.officialAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'chart',
        timeAgo: `${idx + 1}h`,
        dateCreated: dateStr,
        content: `📊 [${meta.fandomName.toUpperCase()} DAILY STATS UPDATE] — "${
          latestSong.title
        }" by ${meta.officialName}:\n\n• Global Spotify: ${spRankLabel} (+${formatNumFull(
          dailyStreams
        )} daily | ${formatNumFull(
          totalStreams
        )} total)\n• Worldwide iTunes: ${itRankLabel} (${formatNumFull(
          totalSales
        )} pure sales)\n• YouTube MV Views: ${ytRankLabel} (${formatNumFull(
          totalViews
        )} views)\n• Billboard Hot 100: ${h100RankLabel}`,
        visualCard: {
          cardType: 'spotify_chart_split_card',
          spotifySplitCard: {
            chartTitle: 'Top Songs Global',
            dateLabel: datedUpper,
            rank: spRank,
            rankLabel: spRankLabel,
            songTitle: latestSong.title,
            artistName: meta.officialName,
            cover: latestSong.cover || meta.officialAvatar,
            dailyStreamsText:
              spRank !== null
                ? `${formatNumFull(dailyStreams)} daily streams`
                : `OUT of Global 200 • ${formatNumFull(dailyStreams)} daily streams`,
          },
        },
        likes: Math.max(1_450, Math.round(meta.officialFollowers * 0.072)),
        reposts: Math.max(390, Math.round(meta.officialFollowers * 0.021)),
        replies: 64,
        views: Math.max(26_000, Math.round(meta.officialFollowers * 0.48)),
        isPlayerPost: false,
        daysOld: 0,
      });

      // Fandom Post B: Dual Worldwide iTunes + YouTube Music Banner Card
      posts.push({
        id: `roster-fandom-dual-${artist.id}-${latestSong.id}-${dateStr}`,
        authorName: meta.fandomAccountName,
        authorHandle: meta.fandomHandle,
        authorAvatar: meta.officialAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'platform',
        timeAgo: `${idx + 2}h`,
        dateCreated: dateStr,
        content: `🌐 Worldwide iTunes & YouTube Music Status — "${latestSong.title}" by ${meta.officialName} (${rl.imprint.imprintName}):\n\n• Worldwide iTunes Song Chart: ${itRankLabel} (+${formatNumFull(
          dailySales
        )} digital sales today)\n• YouTube Music Global Chart: ${ytRankLabel} (+${formatNumFull(
          dailyViews
        )} views today)`,
        visualCard: {
          cardType: 'dual_itunes_yt_no1_banner',
          dualNo1Banner: {
            songTitle: latestSong.title,
            artistName: meta.officialName,
            cover: latestSong.mvThumbnail || latestSong.cover || meta.officialAvatar,
            itunesRank: itRank,
            ytRank: ytRank,
            itunesSalesText: `+${formatNumFull(dailySales)} sales`,
            ytViewsText: `+${formatNumFull(dailyViews)} views`,
          },
        },
        likes: Math.max(1_180, Math.round(meta.officialFollowers * 0.06)),
        reposts: Math.max(290, Math.round(meta.officialFollowers * 0.017)),
        replies: 48,
        views: Math.max(21_000, Math.round(meta.officialFollowers * 0.39)),
        isPlayerPost: false,
        daysOld: 0,
      });
    }

    // 3. Fandom Album / EP Tracklist Stream Breakdown Poster
    if (latestProject && Array.isArray(latestProject.songs) && latestProject.songs.length > 0) {
      const tracks = latestProject.songs.map((ps) => {
        const liveSong = (artist.songs || []).find(
          (gs) => gs.id === ps.id || gs.title === ps.title
        );
        return {
          title: ps.title,
          dailyStreams: liveSong?.dailyStreams || ps.dailyStreams || 0,
          totalStreams: liveSong?.streams || ps.streams || 0,
        };
      });
      const totalAlbumStreams = tracks.reduce((s, r) => s + r.totalStreams, 0);
      const totalAlbumDaily = tracks.reduce((s, r) => s + r.dailyStreams, 0);

      posts.push({
        id: `roster-fandom-album-${artist.id}-${latestProject.id}-${dateStr}`,
        authorName: meta.fandomAccountName,
        authorHandle: meta.fandomHandle,
        authorAvatar: meta.officialAvatar,
        isVerified: true,
        verifiedType: 'blue',
        category: 'platform',
        timeAgo: `${idx + 3}h`,
        dateCreated: dateStr,
        content: `💿 [${meta.fandomName.toUpperCase()} ALBUM TRACKER] ${meta.officialName}'s "${
          latestProject.title
        }" on Spotify:\n\nTotal Streams: ${formatNumFull(
          totalAlbumStreams
        )} (+${formatNumFull(totalAlbumDaily)} today)\nTotal Pure Sales: ${formatNumFull(
          latestProject.pureSales || 0
        )} copies sold!`,
        visualCard: {
          cardType: 'album_streams_poster',
          albumPoster: {
            albumTitle: latestProject.title,
            artistName: meta.officialName,
            dateLabel: `DAILY STREAMS • ${datedUpper}`,
            cover: latestProject.cover || meta.officialAvatar,
            tracks: tracks.slice(0, 10),
            totalStreams: totalAlbumStreams,
            totalDailyStreams: totalAlbumDaily,
          },
        },
        likes: Math.max(1_320, Math.round(meta.officialFollowers * 0.068)),
        reposts: Math.max(340, Math.round(meta.officialFollowers * 0.019)),
        replies: 55,
        views: Math.max(24_500, Math.round(meta.officialFollowers * 0.44)),
        isPlayerPost: false,
        daysOld: 0,
      });
    }
  });

  return posts;
}

/**
 * Allows the Player CEO to publish an official post from a signed Roster Artist's X account
 * OR trigger a Fandom Streaming Party & Stats Update on X!
 */
export function createRosterArtistOrFandomXPost(
  state: GameState,
  artistId: string,
  content: string,
  postAs: 'official_artist' | 'fandom_hub',
  attachedImage?: string
): {
  success: boolean;
  message: string;
  nextState: GameState;
} {
  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = rl.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { success: false, message: 'Roster artist not found.', nextState: state };
  }
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);

  if (postAs === 'official_artist' && dual.isGroupMember && !dual.canManageSoloStudio) {
    return {
      success: false,
      message: `${dual.formattedStageName} is on a Group-Only Contract. Their personal Solo X account is managed by their external solo agency (you can still post as ${dual.groupName} or view their Fandom Updates!).`,
      nextState: state,
    };
  }

  const meta = getRosterArtistFandomXAccountMeta(state, artist);
  const isFandom = postAs === 'fandom_hub';

  const newPost: XPost = {
    id: `roster_custom_x_${artist.id}_${Date.now()}`,
    authorName: isFandom ? meta.fandomAccountName : meta.officialName,
    authorHandle: isFandom ? meta.fandomHandle : meta.officialHandle,
    authorAvatar: meta.officialAvatar,
    isVerified: true,
    verifiedType: meta.isGroup && !isFandom ? 'gold' : 'blue',
    category: isFandom ? 'chart' : 'fanbase',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: content.trim(),
    image: attachedImage,
    mediaBadge: isFandom
      ? `${meta.fandomName.toUpperCase()} STREAMING PARTY`
      : `OFFICIAL ${meta.officialName.toUpperCase()}`,
    likes: Math.max(2_200, Math.round(meta.officialFollowers * 0.095)),
    reposts: Math.max(580, Math.round(meta.officialFollowers * 0.028)),
    replies: 145,
    views: Math.max(38_000, Math.round(meta.officialFollowers * 0.62)),
    isPlayerPost: false,
    daysOld: 0,
  };

  const nextRoster = rl.imprint.signedRoster.map((r) => {
    if (r.id !== artistId) return r;
    const ens = ensureRosterArtistFullFields(r, dateStr);
    return {
      ...ens,
      hype: Math.min(100, Number(((ens.hype || 45) + 1.5).toFixed(1))),
      fans: (ens.fans || 25_000) + 1_850,
    } as any;
  });

  return {
    success: true,
    message: `Published on X via ${newPost.authorHandle}! (+1.5% Hype & +1,850 Fans for ${meta.officialName})`,
    nextState: {
      ...state,
      xPosts: [newPost, ...(state.xPosts || [])].slice(0, 120),
      recordLabelState: {
        ...rl,
        imprint: {
          ...rl.imprint,
          signedRoster: nextRoster,
        },
      },
    } as any,
  };
}

// ============================================================================
// 5. ITUNES STORE ROSTER ARTIST LOOKUP HELPER
// ============================================================================

export function findSignedRosterArtistForItunes(
  state: GameState,
  artistNameQuery: string
): ImprintSignedArtist | null {
  if (!artistNameQuery) return null;
  const rl = getEnsuredRecordLabelState(state);
  if (!rl.imprint.isFounded || !Array.isArray(rl.imprint.signedRoster)) return null;

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const q = artistNameQuery.trim().toLowerCase();

  for (const raw of rl.imprint.signedRoster) {
    const art = ensureRosterArtistFullFields(raw, dateStr);
    const dual = getArtistDualContractStatus(art);
    const candidates = [
      art.stageName,
      art.name,
      dual.formattedStageName,
      dual.baseStageName,
    ]
      .filter(Boolean)
      .map((s) => s!.trim().toLowerCase());

    if (candidates.includes(q)) {
      return art;
    }
  }
  return null;
}

// ============================================================================
// 6. FULL PLAYER-PARITY X PROFILE & FEED PROXY ENGINE FOR ROSTER ARTISTS
// ============================================================================

export function getRosterArtistSavedXPosts(
  state: GameState,
  artistId: string
): XPost[] {
  const rl = getEnsuredRecordLabelState(state);
  const rawArtist = rl.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) return [];

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const meta = getRosterArtistFandomXAccountMeta(state, artist);
  const customProfile = (artist as any).xProfile || {};
  const activeHandleLower = (
    customProfile.handle ||
    meta.officialHandle ||
    ''
  ).toLowerCase();

  const map = new Map<string, XPost>();
  const savedOnArtist: XPost[] = Array.isArray((artist as any).xPosts)
    ? (artist as any).xPosts
    : [];

  savedOnArtist.forEach((p) => {
    if (p && p.id) map.set(p.id, p);
  });

  (state.xPosts || []).forEach((p) => {
    if (!p || !p.id) return;
    if (
      p.rosterArtistId === artistId ||
      String(p.id).startsWith(`roster_custom_x_${artistId}_`) ||
      String(p.id).startsWith(`roster-official-pin-${artistId}-`) ||
      (p.isPlayerPost &&
        activeHandleLower &&
        (p.authorHandle || '').toLowerCase() === activeHandleLower)
    ) {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    }
  });

  return Array.from(map.values());
}

export function buildRosterArtistXProxyState(
  state: GameState,
  artistId: string
): GameState | null {
  const rl = getEnsuredRecordLabelState(state);
  if (!rl.imprint.isFounded || !Array.isArray(rl.imprint.signedRoster)) {
    return null;
  }

  const rawArtist = rl.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) return null;

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const dual = getArtistDualContractStatus(artist);
  const meta = getRosterArtistFandomXAccountMeta(state, artist);
  const customProfile = (artist as any).xProfile || {};

  const activeName = (customProfile.name || meta.officialName || artist.stageName).trim();
  const rawHandle = (customProfile.handle || meta.officialHandle || '@artist').trim();
  const activeHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
  const activeBio =
    customProfile.bio !== undefined ? customProfile.bio : meta.officialBio;
  const activeBanner = customProfile.banner || '';
  const activeAvatar =
    customProfile.avatar || artist.avatarUrl || meta.officialAvatar;

  const candidateNamesLower = [
    activeName,
    artist.stageName,
    artist.name,
    dual.formattedStageName,
    dual.baseStageName,
  ]
    .filter(Boolean)
    .map((s) => s!.trim().toLowerCase());

  const matchesRosterItem = (itemArtist?: string): boolean => {
    if (!itemArtist) return false;
    const lower = itemArtist.trim().toLowerCase();
    return candidateNamesLower.some(
      (cand) =>
        cand.length > 0 &&
        (lower === cand ||
          lower.startsWith(`${cand} `) ||
          lower.includes(` ${cand}`) ||
          lower.includes(cand))
    );
  };

  const remapChartList = (list: any[] | undefined) => {
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
      ...item,
      isPlayer: matchesRosterItem(item.artist),
    }));
  };

  const remappedSpotifyCharts: Record<string, any[]> = {};
  if (state.spotify?.charts) {
    Object.entries(state.spotify.charts).forEach(([k, list]) => {
      remappedSpotifyCharts[k] = remapChartList(list);
    });
  }

  const remappedItunesCharts: Record<string, any[]> = {};
  if (state.itunes?.charts) {
    Object.entries(state.itunes.charts).forEach(([k, list]) => {
      remappedItunesCharts[k] = remapChartList(list);
    });
  }

  const remappedYoutubeCharts: Record<string, any[]> = {};
  if (state.youtube?.charts) {
    Object.entries(state.youtube.charts).forEach(([k, list]) => {
      remappedYoutubeCharts[k] = remapChartList(list);
    });
  }

  const savedRosterPosts = getRosterArtistSavedXPosts(state, artist.id);

  return {
    ...state,
    artist: {
      ...(state.artist || {}),
      name: activeName,
      country: (artist as any).country || state.artist?.country || 'United States',
      image: activeAvatar,
      startYear: (artist as any).startYear || state.artist?.startYear || 2026,
      age: (artist as any).age || 21,
      genre: artist.genre || 'Pop',
    } as any,
    fans: Math.max(1000, Number(artist.fans) || 25_000),
    popularity: Math.max(1, Number(artist.popularity) || 35),
    hype: Math.max(1, Number(artist.hype) || 45),
    songs: Array.isArray(artist.songs) ? artist.songs : [],
    projects: Array.isArray(artist.projects) ? artist.projects : [],
    xProfile: {
      name: activeName,
      handle: activeHandle,
      bio: activeBio,
      banner: activeBanner,
      followers: meta.officialFollowers,
      following: meta.officialFollowing,
      savedPlayerPosts: savedRosterPosts,
    },
    xPosts: savedRosterPosts,
    billboard: state.billboard
      ? {
          ...state.billboard,
          hot100: remapChartList(state.billboard.hot100),
          global200: remapChartList(state.billboard.global200),
          albums200: remapChartList(state.billboard.albums200),
        }
      : state.billboard,
    spotify: state.spotify
      ? {
          ...state.spotify,
          charts: remappedSpotifyCharts,
        }
      : state.spotify,
    itunes: state.itunes
      ? {
          ...state.itunes,
          charts: remappedItunesCharts,
        }
      : state.itunes,
    youtube: state.youtube
      ? {
          ...state.youtube,
          charts: remappedYoutubeCharts,
        }
      : state.youtube,
  };
}

export function saveRosterArtistXPost(
  state: GameState,
  artistId: string,
  newPost: XPost
): GameState {
  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';

  const taggedPost: XPost = {
    ...newPost,
    id: `roster_custom_x_${artistId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    isPlayerPost: true,
    rosterArtistId: artistId,
  };

  const nextRoster = rl.imprint.signedRoster.map((raw) => {
    if (raw.id !== artistId) return raw;
    const ens = ensureRosterArtistFullFields(raw, dateStr);
    const existingArtistPosts: XPost[] = Array.isArray((ens as any).xPosts)
      ? (ens as any).xPosts
      : [];
    return {
      ...ens,
      hype: Math.min(100, Number(((ens.hype || 45) + 0.35).toFixed(2))),
      xPosts: [taggedPost, ...existingArtistPosts].slice(0, 150),
    } as any;
  });

  return {
    ...state,
    xPosts: [taggedPost, ...(state.xPosts || [])],
    recordLabelState: {
      ...rl,
      imprint: {
        ...rl.imprint,
        signedRoster: nextRoster,
      },
    },
  };
}

export function saveRosterArtistXProfile(
  state: GameState,
  artistId: string,
  updated: {
    name: string;
    handle: string;
    bio: string;
    banner: string;
    avatar?: string;
  }
): GameState {
  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const cleanHandle = updated.handle.startsWith('@')
    ? updated.handle
    : `@${updated.handle}`;

  const nextRoster = rl.imprint.signedRoster.map((raw) => {
    if (raw.id !== artistId) return raw;
    const ens = ensureRosterArtistFullFields(raw, dateStr);
    const prevProfile = (ens as any).xProfile || {};
    const nextAvatar = updated.avatar || prevProfile.avatar || ens.avatarUrl;
    const existingPosts: XPost[] = Array.isArray((ens as any).xPosts)
      ? (ens as any).xPosts
      : [];

    const syncedPosts = existingPosts.map((p) => ({
      ...p,
      authorName: updated.name || p.authorName,
      authorHandle: cleanHandle || p.authorHandle,
      authorAvatar: nextAvatar || p.authorAvatar,
    }));

    return {
      ...ens,
      avatarUrl: nextAvatar,
      xProfile: {
        ...prevProfile,
        name: updated.name,
        handle: cleanHandle,
        bio: updated.bio,
        banner: updated.banner,
        avatar: nextAvatar,
      },
      xPosts: syncedPosts,
    } as any;
  });

  const updatedGlobalXPosts = (state.xPosts || []).map((p) => {
    if (
      p.rosterArtistId === artistId ||
      String(p.id || '').startsWith(`roster_custom_x_${artistId}_`)
    ) {
      return {
        ...p,
        authorName: updated.name || p.authorName,
        authorHandle: cleanHandle || p.authorHandle,
        authorAvatar: updated.avatar || p.authorAvatar,
      };
    }
    return p;
  });

  return {
    ...state,
    xPosts: updatedGlobalXPosts,
    recordLabelState: {
      ...rl,
      imprint: {
        ...rl.imprint,
        signedRoster: nextRoster,
      },
    },
  };
}

export function saveRosterArtistQuickAvatar(
  state: GameState,
  artistId: string,
  compressedAvatar: string
): GameState {
  const rl = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';

  const nextRoster = rl.imprint.signedRoster.map((raw) => {
    if (raw.id !== artistId) return raw;
    const ens = ensureRosterArtistFullFields(raw, dateStr);
    const prevProfile = (ens as any).xProfile || {};
    const existingPosts: XPost[] = Array.isArray((ens as any).xPosts)
      ? (ens as any).xPosts
      : [];

    return {
      ...ens,
      avatarUrl: compressedAvatar,
      xProfile: {
        ...prevProfile,
        avatar: compressedAvatar,
      },
      xPosts: existingPosts.map((p) => ({
        ...p,
        authorAvatar: compressedAvatar,
      })),
    } as any;
  });

  const updatedGlobalXPosts = (state.xPosts || []).map((p) => {
    if (
      p.rosterArtistId === artistId ||
      String(p.id || '').startsWith(`roster_custom_x_${artistId}_`)
    ) {
      return {
        ...p,
        authorAvatar: compressedAvatar,
      };
    }
    return p;
  });

  return {
    ...state,
    xPosts: updatedGlobalXPosts,
    recordLabelState: {
      ...rl,
      imprint: {
        ...rl.imprint,
        signedRoster: nextRoster,
      },
    },
  };
}

