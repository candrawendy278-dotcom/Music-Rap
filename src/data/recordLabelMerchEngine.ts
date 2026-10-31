// Record Label Official Merch & Vinyl Webstore Engine
// Powers the unified Record Label Store inside the Merch App (switched via Player Store vs Record Label Store).
// Allows the CEO/Player to press Vinyl LPs, CDs, Box Sets, and 480GSM Streetwear for any signed Roster Artist,
// with daily sales driven by each Roster Artist's fanbase, popularity, and hype, plus Billboard Pure Sales integration.

import { GameState } from '../types';
import {
  MerchCategory,
  MerchFormatId,
  MerchVariantStyle,
  MerchSpecTier,
  MerchPromoCampaignId,
  MerchProductItem,
  MerchStoreState,
  ApparelCustomDesign,
  getMerchFormatTemplate,
  getMerchSpecTierMeta,
  VINYL_AND_MERCH_COLORWAYS,
  BATCH_PRESSING_OPTIONS,
  MERCH_PROMO_CAMPAIGNS,
  isPhysicalMusicCategory,
  evaluateMerchPricingElasticity
} from './merchWebstoreEngine';
import { getEnsuredRecordLabelState, ImprintSignedArtist } from './recordLabelSystemEngine';
import { ensureRosterArtistFullFields } from './recordLabelCeoEngine';
import { isRosterArtistContractExpired } from './rosterLifecycleAndNpcDedupEngine';

export interface LabelMerchProductItem extends MerchProductItem {
  rosterArtistId: string;
  rosterArtistName: string;
  rosterArtistAvatar?: string;
}

export interface RecordLabelMerchStoreState extends Omit<MerchStoreState, 'items'> {
  items: LabelMerchProductItem[];
}

export function ensureRecordLabelMerchStoreState(state: GameState): RecordLabelMerchStoreState {
  const rl = getEnsuredRecordLabelState(state);
  const imprintName = rl.imprint?.imprintName || `${state.artist?.name || 'Artist'} Records`;
  const existing = (state as any).labelMerchStore as RecordLabelMerchStoreState | undefined;

  if (existing && Array.isArray(existing.items)) {
    return {
      ...existing,
      storeTitle: existing.storeTitle || `${imprintName.toUpperCase()} OFFICIAL LABEL STORE`,
      storeBannerSubtitle:
        existing.storeBannerSubtitle ||
        'Official Roster Vinyl Pressings, Collector Box Sets & Label Streetwear Archive',
      accentColor: existing.accentColor || '#A855F7',
      activePromoCampaign: existing.activePromoCampaign || 'none'
    };
  }

  return {
    storeTitle: `${imprintName.toUpperCase()} OFFICIAL LABEL STORE`,
    storeBannerSubtitle:
      'Official Roster Vinyl Pressings, Collector Box Sets & Label Streetwear Archive',
    accentColor: '#A855F7',
    activePromoCampaign: 'none',
    items: [],
    totalGrossRevenue: 0,
    totalPlatformAndFulfillmentFees: 0,
    totalWarehouseHoldingFees: 0,
    totalManufacturingCost: 0,
    totalNetProfit: 0,
    totalBillboardPureUnitsSold: 0,
    dailyRevenue: 0,
    dailyGrossSales: 0,
    dailyFeesAndOverhead: 0,
    dailyUnitsSold: 0,
    orderLogs: []
  };
}

export function createRecordLabelMerchProduct(params: {
  state: GameState;
  rosterArtistId: string;
  formatId: MerchFormatId;
  linkedReleaseType: 'project' | 'song' | 'era' | 'standalone_merch';
  linkedReleaseId?: number;
  linkedReleaseTitle: string;
  isPreOrderRelease?: boolean;
  scheduledReleaseDate?: string;
  coverArt: string;
  colorwayId: string;
  customColorway?: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    variantStyle: MerchVariantStyle;
  };
  specTier?: MerchSpecTier;
  hasObiStrip?: boolean;
  hypeStickerText?: string;
  apparelDesign?: ApparelCustomDesign;
  customName?: string;
  customSubtitle?: string;
  retailPrice: number;
  batchUnits: number;
  isLimitedEdition: boolean;
  isSigned: boolean;
}): {
  success: boolean;
  error?: string;
  updatedState: GameState;
  newItem?: LabelMerchProductItem;
} {
  const {
    state,
    rosterArtistId,
    formatId,
    linkedReleaseType,
    linkedReleaseId,
    linkedReleaseTitle,
    isPreOrderRelease = false,
    scheduledReleaseDate,
    coverArt,
    colorwayId,
    customColorway,
    specTier = 'deluxe_heavyweight',
    hasObiStrip = false,
    hypeStickerText = '',
    apparelDesign,
    customName,
    customSubtitle,
    retailPrice,
    batchUnits,
    isLimitedEdition,
    isSigned
  } = params;

  const rl = getEnsuredRecordLabelState(state);
  if (!rl.imprint.isFounded) {
    return {
      success: false,
      error: 'Launch your Record Label Imprint first before opening the Label Merch Store.',
      updatedState: state
    };
  }

  const rawRosterArtist = rl.imprint.signedRoster.find(a => a.id === rosterArtistId);
  if (!rawRosterArtist) {
    return {
      success: false,
      error: 'Select a signed Roster Artist for this merchandise drop.',
      updatedState: state
    };
  }

  if (isRosterArtistContractExpired(rawRosterArtist)) {
    return {
      success: false,
      error: `${rawRosterArtist.stageName || rawRosterArtist.name}'s contract has expired. Renew their contract first.`,
      updatedState: state
    };
  }

  const rosterArtist = ensureRosterArtistFullFields(rawRosterArtist);
  const artistDisplayName = rosterArtist.stageName || rosterArtist.name;

  const template = getMerchFormatTemplate(formatId);
  const tierMeta = getMerchSpecTierMeta(specTier);
  const colorway = customColorway
    ? {
        id: 'custom_bespoke',
        name: customColorway.name || 'Bespoke Label Edition',
        primaryColor: customColorway.primaryColor,
        secondaryColor: customColorway.secondaryColor,
        variantStyle: customColorway.variantStyle
      }
    : VINYL_AND_MERCH_COLORWAYS.find(c => c.id === colorwayId) ||
      VINYL_AND_MERCH_COLORWAYS[0];

  const batchOption =
    BATCH_PRESSING_OPTIONS.find(b => b.units === batchUnits) ||
    BATCH_PRESSING_OPTIONS[1];

  const signedExtraCost = isSigned && template.supportsSignedOption ? 2.5 : 0;
  const obiExtraCost = hasObiStrip && template.category === 'vinyl' ? 1.25 : 0;
  const effectiveUnitCost = Math.max(
    2,
    Math.round(
      (template.unitManufacturingCost * tierMeta.costMultiplier +
        signedExtraCost +
        obiExtraCost) *
        batchOption.costDiscountMultiplier *
        100
    ) / 100
  );

  const totalManufacturingCost = Math.round(effectiveUnitCost * batchUnits);

  if (state.money < totalManufacturingCost) {
    return {
      success: false,
      error: `Insufficient funds for label manufacturing run ($${totalManufacturingCost.toLocaleString()} required).`,
      updatedState: state
    };
  }

  const isPhysicalMusic = isPhysicalMusicCategory(template.category);
  const clampedPrice = Math.max(
    template.minRetailPrice,
    Math.min(template.maxRetailPrice, Math.round(retailPrice))
  );

  const defaultTitle = isPhysicalMusic
    ? `${artistDisplayName} — ${linkedReleaseTitle} (${colorway.name} ${template.shortLabel})`
    : `${artistDisplayName} — ${
        apparelDesign?.frontText || artistDisplayName.toUpperCase()
      } ${template.shortLabel}`;

  const defaultSubtitle = isPhysicalMusic
    ? `${tierMeta.shortTag} • ${colorway.name}${hasObiStrip ? ' + Japanese OBI' : ''}${
        isSigned ? ' • Hand-Signed by ' + artistDisplayName : ''
      }`
    : `${tierMeta.shortTag} • ${colorway.name} Official Label Capsule`;

  const newItem: LabelMerchProductItem = {
    id: `lbl_merch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    rosterArtistId: rosterArtist.id,
    rosterArtistName: artistDisplayName,
    rosterArtistAvatar: rosterArtist.avatar,
    name: customName && customName.trim() ? customName.trim() : defaultTitle,
    subtitle:
      customSubtitle && customSubtitle.trim() ? customSubtitle.trim() : defaultSubtitle,
    category: template.category,
    formatId: template.id,
    formatLabel: template.shortLabel,
    linkedReleaseType: isPhysicalMusic ? linkedReleaseType : 'standalone_merch',
    linkedReleaseId: isPhysicalMusic ? linkedReleaseId : undefined,
    linkedReleaseTitle: isPhysicalMusic
      ? linkedReleaseTitle
      : `${artistDisplayName} Official Capsule`,
    isPreOrderRelease: Boolean(isPhysicalMusic && isPreOrderRelease),
    scheduledReleaseDate: isPhysicalMusic ? scheduledReleaseDate : undefined,
    coverArt: coverArt || rosterArtist.avatar || state.artist?.image || '',
    colorwayId: colorway.id,
    colorwayName: colorway.name,
    primaryColor: colorway.primaryColor,
    secondaryColor: colorway.secondaryColor,
    variantStyle:
      template.id === 'vinyl_picture' ? 'picture_disc' : colorway.variantStyle,
    specTier,
    hasObiStrip: Boolean(hasObiStrip && template.category === 'vinyl'),
    hypeStickerText:
      template.category === 'vinyl' || template.category === 'physical_music'
        ? hypeStickerText
        : undefined,
    apparelDesign: !isPhysicalMusic ? apparelDesign : undefined,
    maxPerCustomer: 4,
    unitCost: effectiveUnitCost,
    retailPrice: clampedPrice,
    stockRemaining: batchUnits,
    totalPressed: batchUnits,
    totalSold: 0,
    dailySold: 0,
    preOrdersAccumulated: 0,
    totalRevenue: 0,
    totalGrossSales: 0,
    totalManufacturingSpent: totalManufacturingCost,
    daysActiveOnStore: 0,
    saturationPercent: 0,
    demandPhaseLabel: 'Fresh Label Drop',
    isLimitedEdition,
    isSigned: Boolean(isSigned && template.supportsSignedOption),
    isBundle: Boolean(isPhysicalMusic),
    countsForBillboard: Boolean(template.countsForBillboard && isPhysicalMusic),
    createdAtDate: String(state.date).split('T')[0]
  };

  const store = ensureRecordLabelMerchStoreState(state);
  const nextStore: RecordLabelMerchStoreState = {
    ...store,
    items: [newItem, ...store.items],
    totalManufacturingCost: store.totalManufacturingCost + totalManufacturingCost,
    totalNetProfit: store.totalNetProfit - totalManufacturingCost
  };

  const nextState: GameState = {
    ...state,
    money: state.money - totalManufacturingCost,
    recordLabelState: {
      ...rl,
      imprint: {
        ...rl.imprint,
        totalImprintExpenses:
          (rl.imprint.totalImprintExpenses || 0) + totalManufacturingCost
      }
    },
    labelMerchStore: nextStore
  } as any;

  return {
    success: true,
    updatedState: nextState,
    newItem
  };
}

export function restockRecordLabelMerchProduct(
  state: GameState,
  productId: string,
  additionalUnits: number
): { success: boolean; error?: string; updatedState: GameState } {
  const store = ensureRecordLabelMerchStoreState(state);
  const target = store.items.find(i => i.id === productId);
  if (!target) {
    return { success: false, error: 'Product not found.', updatedState: state };
  }

  const batchMeta =
    BATCH_PRESSING_OPTIONS.find(b => b.units === additionalUnits) ||
    BATCH_PRESSING_OPTIONS[1];
  const restockCost = Math.round(
    target.unitCost * additionalUnits * batchMeta.costDiscountMultiplier
  );

  if (state.money < restockCost) {
    return {
      success: false,
      error: `Insufficient funds for restock ($${restockCost.toLocaleString()} required).`,
      updatedState: state
    };
  }

  const updatedItems = store.items.map(item =>
    item.id === productId
      ? {
          ...item,
          stockRemaining: item.stockRemaining + additionalUnits,
          totalPressed: item.totalPressed + additionalUnits,
          totalManufacturingSpent: item.totalManufacturingSpent + restockCost
        }
      : item
  );

  const rl = getEnsuredRecordLabelState(state);

  return {
    success: true,
    updatedState: {
      ...state,
      money: state.money - restockCost,
      recordLabelState: {
        ...rl,
        imprint: {
          ...rl.imprint,
          totalImprintExpenses: (rl.imprint.totalImprintExpenses || 0) + restockCost
        }
      },
      labelMerchStore: {
        ...store,
        items: updatedItems,
        totalManufacturingCost: store.totalManufacturingCost + restockCost,
        totalNetProfit: store.totalNetProfit - restockCost
      }
    } as any
  };
}

export function updateRecordLabelMerchPrice(
  state: GameState,
  productId: string,
  newPrice: number
): GameState {
  const store = ensureRecordLabelMerchStoreState(state);
  const updatedItems = store.items.map(item => {
    if (item.id !== productId) return item;
    const tmpl = getMerchFormatTemplate(item.formatId);
    const clamped = Math.max(
      tmpl.minRetailPrice,
      Math.min(tmpl.maxRetailPrice, Math.round(newPrice))
    );
    return { ...item, retailPrice: clamped };
  });

  return {
    ...state,
    labelMerchStore: {
      ...store,
      items: updatedItems
    }
  } as any;
}

export function setRecordLabelMerchPromoCampaign(
  state: GameState,
  campaignId: MerchPromoCampaignId
): GameState {
  const store = ensureRecordLabelMerchStoreState(state);
  return {
    ...state,
    labelMerchStore: {
      ...store,
      activePromoCampaign: campaignId
    }
  } as any;
}

export function removeRecordLabelMerchProduct(
  state: GameState,
  productId: string
): GameState {
  const store = ensureRecordLabelMerchStoreState(state);
  return {
    ...state,
    labelMerchStore: {
      ...store,
      items: store.items.filter(i => i.id !== productId)
    }
  } as any;
}

/**
 * Daily simulation tick for the Record Label Merch Store.
 * Computes daily D2C sales for each Roster Artist's merch items, credits pure sales to their Billboard/RIAA songs & projects,
 * and splits net revenue according to the Roster Artist's label contract.
 */
export function processDailyRecordLabelMerchStep(
  state: GameState,
  _date?: Date
): {
  nextState: GameState;
  dailyNetProfitForLabel: number;
  nextLabelMerchStore: RecordLabelMerchStoreState;
  labelNetRevenueIncrement: number;
  updatedRoster: ImprintSignedArtist[];
} {
  const rl = getEnsuredRecordLabelState(state);
  const store = ensureRecordLabelMerchStoreState(state);
  const roster = (rl.imprint.signedRoster || []).map(a => ensureRosterArtistFullFields(a));

  if (!rl.imprint.isFounded || store.items.length === 0) {
    const idleStore: RecordLabelMerchStoreState = {
      ...store,
      dailyRevenue: 0,
      dailyGrossSales: 0,
      dailyFeesAndOverhead: 0,
      dailyUnitsSold: 0
    };
    (state as any).labelMerchStore = idleStore;
    return {
      nextState: state,
      dailyNetProfitForLabel: 0,
      nextLabelMerchStore: idleStore,
      labelNetRevenueIncrement: 0,
      updatedRoster: roster
    };
  }

  const campaignMeta =
    MERCH_PROMO_CAMPAIGNS.find(c => c.id === store.activePromoCampaign) ||
    MERCH_PROMO_CAMPAIGNS[0];

  let dailyNetLabelRevenue = 0;
  let dailyGrossSales = 0;
  let dailyFeesAndOverhead = 0;
  let dailyUnitsSold = 0;
  let addedBillboardUnits = 0;
  const newLogs = [...(store.orderLogs || [])];
  const dateStr = String(state.date).split('T')[0];

  // Track pure sales boosts per roster artist
  const artistSongSalesBoost = new Map<string, Map<number, number>>();
  const artistProjectSalesBoost = new Map<string, Map<number, number>>();
  const artistRoyaltyEarned = new Map<string, number>();

  const updatedItems: LabelMerchProductItem[] = store.items.map(item => {
    if (item.stockRemaining <= 0) {
      return {
        ...item,
        dailySold: 0,
        daysActiveOnStore: (item.daysActiveOnStore || 0) + 1,
        demandPhaseLabel: 'Sold Out'
      };
    }

    const rosterArt = roster.find(a => a.id === item.rosterArtistId);
    const fans = rosterArt?.fans || 15_000;
    const pop = rosterArt?.popularity || 35;
    const hype = rosterArt?.hype || 40;
    const isExpired = rosterArt ? isRosterArtistContractExpired(rosterArt) : false;

    const template = getMerchFormatTemplate(item.formatId);
    const specMeta = getMerchSpecTierMeta(item.specTier || 'standard');
    const effectivePrice = Math.max(
      1,
      Math.round(item.retailPrice * campaignMeta.priceMultiplier)
    );

    const elasticity = evaluateMerchPricingElasticity(
      template,
      effectivePrice,
      pop,
      hype,
      item.specTier || 'standard',
      item.isSigned,
      Boolean(item.hasObiStrip)
    );

    const daysActive = (item.daysActiveOnStore || 0) + 1;
    const lifecycleDecay =
      daysActive <= 3
        ? 1.35
        : daysActive <= 10
        ? 1.0
        : daysActive <= 25
        ? 0.65
        : 0.35;

    const baseBuyerPool =
      Math.pow(Math.max(500, fans), 0.56) * 0.24 +
      pop * 1.4 +
      hype * 1.8;

    const rawDemand =
      baseBuyerPool *
      template.demandMultiplier *
      specMeta.demandMultiplier *
      elasticity.elasticityMultiplier *
      campaignMeta.demandMultiplier *
      lifecycleDecay *
      (isExpired ? 0.35 : 1.0);

    const unitsSold = Math.min(
      item.stockRemaining,
      Math.max(0, Math.round(rawDemand * (0.88 + ((daysActive * 17) % 25) * 0.01)))
    );

    if (unitsSold <= 0) {
      return {
        ...item,
        dailySold: 0,
        daysActiveOnStore: daysActive
      };
    }

    const grossRev = unitsSold * effectivePrice;
    const fulfillmentFee = Math.round(grossRev * 0.14);
    const netMerchProceeds = Math.max(0, grossRev - fulfillmentFee);

    // Split net proceeds according to Roster Artist's label royalty split (Label typically keeps 50%-80% of Label Store D2C)
    const labelSharePct = rosterArt
      ? Math.max(35, Math.min(85, rosterArt.labelRoyaltySplit || 55))
      : 60;
    const labelCut = Math.round(netMerchProceeds * (labelSharePct / 100));
    const artistCut = Math.max(0, netMerchProceeds - labelCut);

    dailyGrossSales += grossRev;
    dailyFeesAndOverhead += fulfillmentFee;
    dailyNetLabelRevenue += labelCut;
    dailyUnitsSold += unitsSold;

    if (rosterArt && artistCut > 0) {
      artistRoyaltyEarned.set(
        rosterArt.id,
        (artistRoyaltyEarned.get(rosterArt.id) || 0) + artistCut
      );
    }

    if (item.countsForBillboard && isPhysicalMusicCategory(item.category)) {
      addedBillboardUnits += unitsSold;
      if (rosterArt) {
        if (item.linkedReleaseType === 'project' && item.linkedReleaseId) {
          const pMap =
            artistProjectSalesBoost.get(rosterArt.id) || new Map<number, number>();
          pMap.set(item.linkedReleaseId, (pMap.get(item.linkedReleaseId) || 0) + unitsSold);
          artistProjectSalesBoost.set(rosterArt.id, pMap);
        } else if (item.linkedReleaseType === 'song' && item.linkedReleaseId) {
          const sMap =
            artistSongSalesBoost.get(rosterArt.id) || new Map<number, number>();
          sMap.set(item.linkedReleaseId, (sMap.get(item.linkedReleaseId) || 0) + unitsSold);
          artistSongSalesBoost.set(rosterArt.id, sMap);
        }
      }
    }

    if (unitsSold >= 5) {
      newLogs.unshift({
        id: `lbl_ord_${Date.now()}_${item.id}`,
        date: dateStr,
        productId: item.id,
        productName: item.name,
        formatLabel: item.formatLabel,
        unitsSold,
        grossRevenue: grossRev,
        netPayout: labelCut,
        feesDeducted: fulfillmentFee + artistCut,
        countedForBillboard: item.countsForBillboard
      });
    }

    const nextStock = item.stockRemaining - unitsSold;
    const nextTotalSold = item.totalSold + unitsSold;

    return {
      ...item,
      stockRemaining: nextStock,
      totalSold: nextTotalSold,
      dailySold: unitsSold,
      totalRevenue: item.totalRevenue + labelCut,
      totalGrossSales: (item.totalGrossSales || 0) + grossRev,
      daysActiveOnStore: daysActive,
      saturationPercent: Math.min(
        100,
        Math.round((nextTotalSold / Math.max(1000, fans * 0.25)) * 100)
      ),
      demandPhaseLabel:
        nextStock <= 0
          ? 'Sold Out'
          : daysActive <= 3
          ? 'Launch Surge'
          : daysActive <= 12
          ? 'Steady Demand'
          : 'Catalog Tail'
    };
  });

  // Apply Billboard Pure Sales and recouped royalties to Roster Artists
  const updatedRoster = roster.map(art => {
    const sBoosts = artistSongSalesBoost.get(art.id);
    const pBoosts = artistProjectSalesBoost.get(art.id);
    const artistCut = artistRoyaltyEarned.get(art.id) || 0;

    if (!sBoosts && !pBoosts && artistCut <= 0) return art;

    const nextSongs = (art.songs || []).map(s => {
      const addSales = sBoosts?.get(s.id) || 0;
      if (addSales <= 0) return s;
      return {
        ...s,
        pureSales: (s.pureSales || 0) + addSales,
        dailyPureSales: (s.dailyPureSales || 0) + addSales,
        weeklyPureSales: (s.weeklyPureSales || 0) + addSales
      };
    });

    const nextProjects = (art.projects || []).map(p => {
      const addSales = pBoosts?.get(p.id) || 0;
      if (addSales <= 0) return p;
      return {
        ...p,
        pureSales: (p.pureSales || 0) + addSales,
        dailyPureSales: (p.dailyPureSales || 0) + addSales,
        weeklyPureSales: (p.weeklyPureSales || 0) + addSales
      };
    });

    const nextUnrecouped = Math.max(0, (art.unrecoupedBalance || 0) - artistCut);

    return {
      ...art,
      songs: nextSongs,
      projects: nextProjects,
      unrecoupedBalance: nextUnrecouped
    };
  });

  const nextStore: RecordLabelMerchStoreState = {
    ...store,
    items: updatedItems,
    totalGrossRevenue: store.totalGrossRevenue + dailyGrossSales,
    totalPlatformAndFulfillmentFees:
      (store.totalPlatformAndFulfillmentFees || 0) + dailyFeesAndOverhead,
    totalNetProfit: store.totalNetProfit + dailyNetLabelRevenue,
    totalBillboardPureUnitsSold:
      store.totalBillboardPureUnitsSold + addedBillboardUnits,
    dailyRevenue: dailyNetLabelRevenue,
    dailyGrossSales,
    dailyFeesAndOverhead,
    dailyUnitsSold,
    orderLogs: newLogs.slice(0, 40)
  };

  (state as any).labelMerchStore = nextStore;
  rl.imprint.signedRoster = updatedRoster;
  rl.imprint.totalImprintRevenue =
    (rl.imprint.totalImprintRevenue || 0) + dailyNetLabelRevenue;
  (state as any).recordLabel = rl;

  return {
    nextState: state,
    dailyNetProfitForLabel: dailyNetLabelRevenue,
    nextLabelMerchStore: nextStore,
    labelNetRevenueIncrement: dailyNetLabelRevenue,
    updatedRoster
  };
}
