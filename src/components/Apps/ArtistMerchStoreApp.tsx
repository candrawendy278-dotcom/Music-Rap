import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull } from '../../constants';
import {
  MERCH_FORMAT_TEMPLATES,
  VINYL_AND_MERCH_COLORWAYS,
  BATCH_PRESSING_OPTIONS,
  MERCH_SPEC_TIERS,
  MERCH_PROMO_CAMPAIGNS,
  HYPE_STICKER_PRESETS,
  APPAREL_FONT_STYLES,
  APPAREL_GRAPHIC_MOTIFS,
  APPAREL_BACK_STYLES,
  MerchCategory,
  MerchFormatId,
  MerchVariantStyle,
  MerchSpecTier,
  MerchPromoCampaignId,
  MerchProductItem,
  ApparelFontStyle,
  ApparelGraphicMotif,
  ApparelBackPrintStyle,
  ApparelCustomDesign,
  isPhysicalMusicCategory,
  ensureMerchStoreState,
  getMerchFormatTemplate,
  getMerchSpecTierMeta,
  evaluateMerchPricingElasticity,
  createNewMerchProduct,
  restockMerchProduct,
  updateMerchProductPrice,
  setMerchStorePromoCampaign,
  removeMerchProductFromStore
} from '../../data/merchWebstoreEngine';
import { MerchVisualPreview } from './MerchVisualPreview';

export default function ArtistMerchStoreApp() {
  const { state, setState } = useGameContext();
  const store = useMemo(() => ensureMerchStoreState(state), [state]);
  const artistName = state.artist?.name || 'Artist';

  const [activeMainView, setActiveMainView] = useState<
    'storefront' | 'campaigns' | 'backstage'
  >('storefront');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | MerchCategory | 'limited_preorder'
  >('all');
  const [sortBy, setSortBy] = useState<
    'featured' | 'bestselling' | 'price_desc' | 'price_asc' | 'stock_low'
  >('featured');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'lookbook'>('grid');

  const [selectedProduct, setSelectedProduct] = useState<MerchProductItem | null>(null);
  const [inspectorViewSide, setInspectorViewSide] = useState<'front' | 'back' | 'both'>(
    'both'
  );
  const [showDesignerModal, setShowDesignerModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(
    null
  );

  // Designer Studio State
  const [designerCategory, setDesignerCategory] = useState<MerchCategory>('vinyl');
  const [designerFormatId, setDesignerFormatId] =
    useState<MerchFormatId>('vinyl_splatter');
  const [designerReleaseChoice, setDesignerReleaseChoice] = useState<string>('auto');
  const [designerColorwayId, setDesignerColorwayId] =
    useState<string>('cobalt_splatter');
  const [useCustomColorway, setUseCustomColorway] = useState<boolean>(false);
  const [customPrimaryHex, setCustomPrimaryHex] = useState<string>('#18181B');
  const [customSecondaryHex, setCustomSecondaryHex] = useState<string>('#F4F4F5');
  const [customVariantStyle, setCustomVariantStyle] =
    useState<MerchVariantStyle>('splatter');
  const [designerSpecTier, setDesignerSpecTier] =
    useState<MerchSpecTier>('deluxe_heavyweight');
  const [designerHasObi, setDesignerHasObi] = useState<boolean>(false);
  const [designerHypeSticker, setDesignerHypeSticker] = useState<string>(
    '180G AUDIOPHILE VINYL'
  );
  const [designerCustomName, setDesignerCustomName] = useState<string>('');
  const [designerCustomSub, setDesignerCustomSub] = useState<string>('');
  const [designerRetailPrice, setDesignerRetailPrice] = useState<number>(46);
  const [designerBatchUnits, setDesignerBatchUnits] = useState<number>(2500);
  const [designerIsLimited, setDesignerIsLimited] = useState<boolean>(true);
  const [designerIsSigned, setDesignerIsSigned] = useState<boolean>(false);

  // Standalone Streetwear & Accessories Customizer State (Front + Back + Typography + Photo)
  const [previewGarmentSide, setPreviewGarmentSide] = useState<
    'front' | 'back' | 'both'
  >('both');
  const [apparelFrontText, setApparelFrontText] = useState<string>(
    artistName.toUpperCase()
  );
  const [apparelFrontSubText, setApparelFrontSubText] = useState<string>(
    'HEAVYWEIGHT ARCHIVE CAPSULE'
  );
  const [apparelBackHeading, setApparelBackHeading] = useState<string>(
    `${artistName.toUpperCase()} WORLD TOUR`
  );
  const [apparelBackText, setApparelBackText] = useState<string>(
    'NEW YORK • LONDON • TOKYO • PARIS • SEOUL • LOS ANGELES • JAKARTA • BERLIN'
  );
  const [apparelBackStyle, setApparelBackStyle] =
    useState<ApparelBackPrintStyle>('tour_dates_list');
  const [apparelFontStyle, setApparelFontStyle] =
    useState<ApparelFontStyle>('street_gothic');
  const [apparelMotif, setApparelMotif] =
    useState<ApparelGraphicMotif>('chrome_tribal');
  const [apparelCustomPhotoUrl, setApparelCustomPhotoUrl] = useState<string>(
    state.artist?.image || ''
  );
  const [apparelHasSleevePrint, setApparelHasSleevePrint] = useState<boolean>(true);

  const triggerToast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3200);
  };

  const closeApp = () => {
    setState(p => ({ ...p, activeApp: 'none' }));
  };

  const isCurrentFormatPhysicalMusic = isPhysicalMusicCategory(designerCategory);

  // Available projects & songs to link ONLY to Vinyl / Physical Music
  const linkableReleases = useMemo(() => {
    const list: Array<{
      key: string;
      type: 'project' | 'song';
      id: number;
      title: string;
      subtitle: string;
      cover: string;
      isScheduled: boolean;
      pureSales: number;
    }> = [];

    [...state.projects]
      .reverse()
      .forEach(p => {
        if (p.status === 'scheduled' || p.status === 'released') {
          list.push({
            key: `project:${p.id}`,
            type: 'project',
            id: p.id,
            title: p.title,
            subtitle:
              p.status === 'scheduled'
                ? `${p.type.toUpperCase()} • Scheduled Pre-Order (${p.releaseDate || ''})`
                : `${p.type.toUpperCase()} • Released`,
            cover: p.cover || state.artist?.image || '',
            isScheduled: p.status === 'scheduled',
            pureSales: p.pureSales || 0
          });
        }
      });

    [...state.songs]
      .reverse()
      .filter(s => s.status === 'released' || s.status === 'scheduled')
      .slice(0, 14)
      .forEach(s => {
        list.push({
          key: `song:${s.id}`,
          type: 'song',
          id: s.id,
          title: s.title,
          subtitle:
            s.status === 'scheduled'
              ? `Single • Scheduled Pre-Order`
              : `Single • Released`,
          cover: s.cover || state.artist?.image || '',
          isScheduled: s.status === 'scheduled',
          pureSales: s.pureSales || 0
        });
      });

    return list;
  }, [state.projects, state.songs, state.artist]);

  const activeSelectedRelease = useMemo(() => {
    if (linkableReleases.length === 0) {
      return {
        key: 'fallback',
        type: 'project' as const,
        id: undefined,
        title: `${artistName} Debut Pressing`,
        subtitle: 'Studio Release',
        cover: state.artist?.image || '',
        isScheduled: false,
        pureSales: 0
      };
    }
    if (designerReleaseChoice === 'auto') {
      return linkableReleases[0];
    }
    return (
      linkableReleases.find(r => r.key === designerReleaseChoice) ||
      linkableReleases[0]
    );
  }, [designerReleaseChoice, linkableReleases, artistName, state.artist]);

  const activeTemplate = useMemo(
    () => getMerchFormatTemplate(designerFormatId),
    [designerFormatId]
  );

  const activeSpecTierMeta = useMemo(
    () => getMerchSpecTierMeta(designerSpecTier),
    [designerSpecTier]
  );

  const activeColorway = useMemo(
    () =>
      VINYL_AND_MERCH_COLORWAYS.find(c => c.id === designerColorwayId) ||
      VINYL_AND_MERCH_COLORWAYS[0],
    [designerColorwayId]
  );

  const previewPrimaryColor = useCustomColorway
    ? customPrimaryHex
    : activeColorway.primaryColor;
  const previewSecondaryColor = useCustomColorway
    ? customSecondaryHex
    : activeColorway.secondaryColor;
  const previewVariantStyle: MerchVariantStyle =
    designerFormatId === 'vinyl_picture'
      ? 'picture_disc'
      : useCustomColorway
      ? customVariantStyle
      : activeColorway.variantStyle;

  const activeBatchMeta = useMemo(
    () =>
      BATCH_PRESSING_OPTIONS.find(b => b.units === designerBatchUnits) ||
      BATCH_PRESSING_OPTIONS[2],
    [designerBatchUnits]
  );

  const currentApparelDesign: ApparelCustomDesign = useMemo(
    () => ({
      frontText: apparelFrontText || artistName.toUpperCase(),
      frontSubText: apparelFrontSubText || 'OFFICIAL ARCHIVE',
      backHeading: apparelBackHeading || `${artistName.toUpperCase()} TOUR`,
      backText: apparelBackText,
      backPrintStyle: apparelBackStyle,
      fontStyle: apparelFontStyle,
      graphicMotif: apparelMotif,
      customGraphicUrl:
        apparelMotif === 'custom_photo' ? apparelCustomPhotoUrl : undefined,
      placement: 'center_chest',
      hasSleevePrint: apparelHasSleevePrint,
      defaultViewSide: activeTemplate.supportsFrontBackView
        ? previewGarmentSide
        : 'front'
    }),
    [
      apparelFrontText,
      apparelFrontSubText,
      apparelBackHeading,
      apparelBackText,
      apparelBackStyle,
      apparelFontStyle,
      apparelMotif,
      apparelCustomPhotoUrl,
      apparelHasSleevePrint,
      activeTemplate.supportsFrontBackView,
      previewGarmentSide,
      artistName
    ]
  );

  const effectiveUnitMfgCost = useMemo(() => {
    const signedAdd = designerIsSigned && activeTemplate.supportsSignedOption ? 2 : 0;
    const obiAdd = isCurrentFormatPhysicalMusic && designerHasObi ? 1 : 0;
    const sleeveAdd =
      !isCurrentFormatPhysicalMusic && apparelHasSleevePrint ? 2 : 0;
    const backPrintAdd =
      !isCurrentFormatPhysicalMusic &&
      activeTemplate.supportsFrontBackView &&
      apparelBackStyle !== 'clean_blank'
        ? 2
        : 0;

    return Math.max(
      2,
      Math.round(
        (activeTemplate.unitManufacturingCost * activeSpecTierMeta.costMultiplier +
          signedAdd +
          obiAdd +
          sleeveAdd +
          backPrintAdd) *
          activeBatchMeta.discount
      )
    );
  }, [
    activeTemplate,
    activeSpecTierMeta,
    designerIsSigned,
    isCurrentFormatPhysicalMusic,
    designerHasObi,
    apparelHasSleevePrint,
    apparelBackStyle,
    activeBatchMeta
  ]);

  const pricingEvaluation = useMemo(
    () =>
      evaluateMerchPricingElasticity(
        activeTemplate,
        designerRetailPrice,
        designerIsSigned && activeTemplate.supportsSignedOption,
        designerIsLimited,
        designerSpecTier
      ),
    [
      activeTemplate,
      designerRetailPrice,
      designerIsSigned,
      designerIsLimited,
      designerSpecTier
    ]
  );

  const totalUpfrontMfgCost = effectiveUnitMfgCost * designerBatchUnits;
  const projectedGrossRevenue = designerRetailPrice * designerBatchUnits;
  const projectedNetArtistRevenueAfterFees =
    pricingEvaluation.netArtistTakePerUnit * designerBatchUnits;
  const projectedNetProfit =
    projectedNetArtistRevenueAfterFees - totalUpfrontMfgCost;
  const unitNetProfitAfterFees =
    pricingEvaluation.netArtistTakePerUnit - effectiveUnitMfgCost;

  const activeCampaignMeta = useMemo(
    () =>
      MERCH_PROMO_CAMPAIGNS.find(c => c.id === store.activePromoCampaign) ||
      MERCH_PROMO_CAMPAIGNS[0],
    [store.activePromoCampaign]
  );

  const filteredAndSortedItems = useMemo(() => {
    let base = [...store.items];
    if (categoryFilter === 'limited_preorder') {
      base = base.filter(
        i => i.isPreOrderRelease || i.isLimitedEdition || i.isSigned
      );
    } else if (categoryFilter !== 'all') {
      base = base.filter(i => i.category === categoryFilter);
    }

    if (sortBy === 'bestselling') {
      base.sort((a, b) => b.totalSold - a.totalSold);
    } else if (sortBy === 'price_desc') {
      base.sort((a, b) => b.retailPrice - a.retailPrice);
    } else if (sortBy === 'price_asc') {
      base.sort((a, b) => a.retailPrice - b.retailPrice);
    } else if (sortBy === 'stock_low') {
      base.sort((a, b) => a.stockRemaining - b.stockRemaining);
    }
    return base;
  }, [store.items, categoryFilter, sortBy]);

  const totalActivePreOrders = useMemo(
    () => store.items.reduce((sum, i) => sum + (i.preOrdersAccumulated || 0), 0),
    [store.items]
  );

  const handleSelectFormat = (fmtId: MerchFormatId, cat: MerchCategory) => {
    const tmpl = getMerchFormatTemplate(fmtId);
    setDesignerCategory(cat);
    setDesignerFormatId(fmtId);
    setDesignerRetailPrice(tmpl.recommendedRetailPrice);
    if (!tmpl.supportsSignedOption) {
      setDesignerIsSigned(false);
    }
    if (fmtId === 'vinyl_signed') {
      setDesignerIsSigned(true);
      setDesignerHypeSticker('INCLUDES SIGNED ART CARD');
    } else if (cat === 'vinyl' || cat === 'physical_music') {
      setDesignerHypeSticker('180G AUDIOPHILE VINYL');
    } else {
      // Switch to obsidian black + white ink for clean default streetwear aesthetic
      if (designerColorwayId === 'cobalt_splatter') {
        setDesignerColorwayId('obsidian_black');
      }
      if (tmpl.supportsFrontBackView) {
        setPreviewGarmentSide('both');
      } else {
        setPreviewGarmentSide('front');
      }
    }
  };

  const handleUploadCustomGraphicFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        setApparelCustomPhotoUrl(ev.target.result);
        setApparelMotif('custom_photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLaunchProduct = () => {
    const isPhys = isPhysicalMusicCategory(designerCategory);
    const rel = activeSelectedRelease;

    const result = createNewMerchProduct({
      state,
      formatId: designerFormatId,
      customName: designerCustomName,
      customSubtitle: designerCustomSub,
      linkedReleaseType: isPhys ? rel.type : 'standalone_merch',
      linkedReleaseId: isPhys ? rel.id : undefined,
      colorwayId: designerColorwayId,
      customPrimaryColor: useCustomColorway ? customPrimaryHex : undefined,
      customSecondaryColor: useCustomColorway ? customSecondaryHex : undefined,
      customVariantStyle: useCustomColorway ? customVariantStyle : undefined,
      specTier: designerSpecTier,
      hasObiStrip: isPhys ? designerHasObi : false,
      hypeStickerText: isPhys ? designerHypeSticker : undefined,
      apparelDesign: !isPhys ? currentApparelDesign : undefined,
      retailPrice: designerRetailPrice,
      batchUnits: designerBatchUnits,
      isLimitedEdition: designerIsLimited,
      isSigned: designerIsSigned && activeTemplate.supportsSignedOption
    });

    if (!result.success) {
      triggerToast(result.error || 'Could not launch product.', 'err');
      return;
    }

    setState(result.updatedState);
    setShowDesignerModal(false);
    setDesignerCustomName('');
    setDesignerCustomSub('');
    triggerToast(
      `Published "${result.createdItem?.name}" (${designerBatchUnits.toLocaleString()} units pressed)!`,
      'ok'
    );
  };

  const handleRestockItem = (productId: string, units: number) => {
    const res = restockMerchProduct(state, productId, units);
    if (!res.success) {
      triggerToast(res.error || 'Failed to restock.', 'err');
      return;
    }
    setState(res.updatedState);
    const updatedStore = ensureMerchStoreState(res.updatedState);
    const refreshed = updatedStore.items.find(i => i.id === productId) || null;
    setSelectedProduct(refreshed);
    triggerToast(`Restocked +${units.toLocaleString()} units to warehouse!`, 'ok');
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    const nextState = updateMerchProductPrice(state, productId, newPrice);
    setState(nextState);
    const updatedStore = ensureMerchStoreState(nextState);
    const refreshed = updatedStore.items.find(i => i.id === productId) || null;
    setSelectedProduct(refreshed);
  };

  const handleVaultProduct = (productId: string) => {
    const nextState = removeMerchProductFromStore(state, productId);
    setState(nextState);
    setSelectedProduct(null);
    triggerToast('Item moved to Archive Vault and removed from storefront.', 'ok');
  };

  const handleSelectCampaign = (campId: MerchPromoCampaignId) => {
    const nextState = setMerchStorePromoCampaign(state, campId);
    setState(nextState);
    const camp = MERCH_PROMO_CAMPAIGNS.find(c => c.id === campId);
    triggerToast(`Storefront Strategy Active: ${camp?.name || 'Standard'}`, 'ok');
  };

  const featuredReleaseBanner = useMemo(() => {
    const scheduledProj = state.projects.find(p => p.status === 'scheduled');
    if (scheduledProj) {
      return {
        kicker: 'UPCOMING ALBUM PRE-ORDER VINYL & CDs',
        title: scheduledProj.title,
        subtitle: `Pre-order 180g Splatter Vinyl, Signed Jackets & Deluxe Box Sets ahead of ${scheduledProj.releaseDate}. Physical music formats count toward Billboard debut charts.`,
        cover: scheduledProj.cover || state.artist?.image || ''
      };
    }
    const latestProj = state.projects[state.projects.length - 1];
    if (latestProj) {
      return {
        kicker: 'OFFICIAL D2C VINYL & STREETWEAR ARCHIVE',
        title: latestProj.title,
        subtitle:
          'Direct-to-consumer 180g Vinyl pressings, Collector Box Sets, and custom Front & Back 480GSM Streetwear Capsules.',
        cover: latestProj.cover || state.artist?.image || ''
      };
    }
    return {
      kicker: 'OFFICIAL D2C ARTIST WEBSTORE',
      title: `${artistName.toUpperCase()} ATELIER & VINYL`,
      subtitle:
        'Press bespoke colored vinyl records for Billboard chart pushes and design standalone custom Front & Back streetwear.',
      cover: state.artist?.image || ''
    };
  }, [state.projects, state.artist, artistName]);

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#F8F8FA] dark:bg-[#0B0B0E] text-zinc-900 dark:text-zinc-100 z-50 flex flex-col overflow-hidden animate-fade-in">
      {/* TOP D2C ANNOUNCEMENT TICKER */}
      <div className="bg-zinc-950 text-zinc-200 px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase flex items-center justify-between border-b border-white/10 shrink-0">
        <span className="truncate">
          {activeCampaignMeta.id !== 'none'
            ? `${activeCampaignMeta.name} • ${activeCampaignMeta.badge}`
            : 'VINYL, CD & CASSETTE SALES COUNT TOWARD BILLBOARD CHARTS'}
        </span>
        <span className="text-emerald-400 font-bold shrink-0 ml-2">LIMIT 4/ORDER</span>
      </div>

      {/* MAIN STORE NAVIGATION BAR */}
      <header className="px-4 pt-3 pb-3 bg-white/95 dark:bg-[#111116]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 shrink-0 z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={closeApp}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-800 dark:text-white hover:opacity-80 transition cursor-pointer shrink-0"
            >
              <i className="ph-bold ph-arrow-left text-base"></i>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-wider uppercase truncate">
                {artistName} Official Store
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                <span>Cash: ${formatNum(state.money)}</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  +${formatNum(store.dailyRevenue)}/day
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDesignerModal(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <i className="ph-bold ph-plus text-xs"></i>
            <span>New Drop</span>
          </button>
        </div>

        {/* 3-Mode Storefront / Campaigns / Backstage Switcher */}
        <div className="grid grid-cols-3 gap-1 mt-3 p-1 bg-zinc-100 dark:bg-[#191922] rounded-lg">
          <button
            onClick={() => setActiveMainView('storefront')}
            className={`py-1.5 text-[11px] font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
              activeMainView === 'storefront'
                ? 'bg-white dark:bg-[#272734] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Storefront ({store.items.length})
          </button>
          <button
            onClick={() => setActiveMainView('campaigns')}
            className={`py-1.5 text-[11px] font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
              activeMainView === 'campaigns'
                ? 'bg-white dark:bg-[#272734] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Chart & Promo
          </button>
          <button
            onClick={() => setActiveMainView('backstage')}
            className={`py-1.5 text-[11px] font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
              activeMainView === 'backstage'
                ? 'bg-white dark:bg-[#272734] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Warehouse & P&L
          </button>
        </div>
      </header>

      {/* TOAST BANNER */}
      {toastMsg && (
        <div
          className={`mx-4 mt-2 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between shadow-lg z-30 ${
            toastMsg.type === 'err'
              ? 'bg-rose-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* MAIN SCROLLABLE VIEWPORT */}
      <div className="flex-1 overflow-y-auto pb-24">
        {activeMainView === 'storefront' && (
          <div>
            {/* EDITORIAL CAMPAIGN LOOKBOOK HERO */}
            <div className="relative mx-4 mt-4 rounded-xl overflow-hidden bg-zinc-950 text-white border border-zinc-200/20 dark:border-white/10 shadow-xl">
              {featuredReleaseBanner.cover && (
                <img
                  src={featuredReleaseBanner.cover}
                  alt={featuredReleaseBanner.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 blur-[2px]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/35" />

              <div className="relative z-10 p-4 flex items-center gap-3.5">
                {featuredReleaseBanner.cover && (
                  <img
                    src={featuredReleaseBanner.cover}
                    alt={featuredReleaseBanner.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-md object-cover shadow-2xl border border-white/25 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-400">
                    {featuredReleaseBanner.kicker}
                  </div>
                  <h2 className="text-lg font-black tracking-tight truncate mt-0.5">
                    {featuredReleaseBanner.title}
                  </h2>
                  <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2 mt-1">
                    {featuredReleaseBanner.subtitle}
                  </p>
                </div>
              </div>

              {/* KPI Strip inside Hero */}
              <div className="relative z-10 bg-black/75 border-t border-white/10 px-4 py-2.5 grid grid-cols-3 divide-x divide-white/10 text-center font-mono tabular-nums">
                <div>
                  <div className="text-xs font-black text-white">
                    {formatNumFull(store.totalBillboardPureUnitsSold)}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-sans">
                    Billboard Units
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-400">
                    ${formatNum(store.totalGrossRevenue)}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-sans">
                    Gross Revenue
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black text-sky-400">
                    {formatNumFull(totalActivePreOrders)}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-sans">
                    Pre-Orders Held
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORY FILTER & SORT BAR */}
            <div className="px-4 mt-4 space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                {[
                  { id: 'all' as const, label: 'All Drops' },
                  { id: 'vinyl' as const, label: '12" Vinyl LPs' },
                  { id: 'physical_music' as const, label: 'CDs, Cassettes & Box Sets' },
                  { id: 'apparel' as const, label: 'Streetwear Apparel' },
                  { id: 'accessory' as const, label: 'Accessories' },
                  { id: 'limited_preorder' as const, label: 'Signed & Pre-Orders' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      categoryFilter === tab.id
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                        : 'bg-zinc-200/75 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 rounded-md bg-white dark:bg-[#16161F] border border-zinc-200 dark:border-white/10 text-[11px] font-semibold"
                  >
                    <option value="featured">Featured Drops</option>
                    <option value="bestselling">Best Selling Units</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="stock_low">Low Stock Alert</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-md bg-zinc-200/70 dark:bg-white/5">
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      layoutMode === 'grid'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                        : 'text-zinc-500'
                    }`}
                  >
                    2-Col Grid
                  </button>
                  <button
                    onClick={() => setLayoutMode('lookbook')}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      layoutMode === 'lookbook'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                        : 'text-zinc-500'
                    }`}
                  >
                    Lookbook
                  </button>
                </div>
              </div>
            </div>

            {/* D2C PRODUCT CATALOG */}
            <div className="px-4 mt-3.5">
              {filteredAndSortedItems.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13131A] p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <i className="ph-duotone ph-vinyl-record text-2xl text-zinc-500 dark:text-zinc-400"></i>
                  </div>
                  <h3 className="text-sm font-bold">
                    Launch Your Official Vinyl & Streetwear Store
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Press 180g Splatter Vinyl LPs & Box Sets linked to your albums for Billboard chart pushes, or design standalone custom Front & Back 480GSM Hoodies and Tees.
                  </p>
                  <button
                    onClick={() => setShowDesignerModal(true)}
                    className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                  >
                    Open Vinyl & Streetwear Studio
                  </button>
                </div>
              ) : (
                <div
                  className={
                    layoutMode === 'grid'
                      ? 'grid grid-cols-2 gap-3.5'
                      : 'space-y-4'
                  }
                >
                  {filteredAndSortedItems.map(item => {
                    const isSoldOut = item.stockRemaining <= 0;
                    const stockPercent = Math.min(
                      100,
                      Math.round(
                        (item.stockRemaining / Math.max(1, item.totalPressed)) * 100
                      )
                    );
                    const effectivePrice = Math.max(
                      1,
                      Math.round(item.retailPrice * activeCampaignMeta.priceMultiplier)
                    );
                    const tierMeta = getMerchSpecTierMeta(item.specTier);
                    const isPhys = isPhysicalMusicCategory(item.category);

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedProduct(item);
                          setInspectorViewSide(
                            getMerchFormatTemplate(item.formatId).supportsFrontBackView
                              ? 'both'
                              : 'front'
                          );
                        }}
                        className="group rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#14141C] overflow-hidden flex flex-col justify-between transition hover:-translate-y-0.5 hover:border-zinc-400 dark:hover:border-white/25 cursor-pointer shadow-xs"
                      >
                        <div>
                          <div className="relative bg-gradient-to-b from-zinc-100 to-zinc-200/60 dark:from-[#1D1D28] dark:to-[#121218] border-b border-zinc-200/70 dark:border-white/5">
                            <MerchVisualPreview
                              formatId={item.formatId}
                              coverArt={item.coverArt}
                              title={item.linkedReleaseTitle}
                              artistName={artistName}
                              primaryColor={item.primaryColor}
                              secondaryColor={item.secondaryColor}
                              variantStyle={item.variantStyle}
                              isSigned={item.isSigned}
                              hasObiStrip={item.hasObiStrip}
                              hypeStickerText={item.hypeStickerText}
                              specTier={item.specTier}
                              apparelDesign={item.apparelDesign}
                              viewSide={
                                layoutMode === 'lookbook' &&
                                getMerchFormatTemplate(item.formatId)
                                  .supportsFrontBackView
                                  ? 'both'
                                  : item.apparelDesign?.defaultViewSide || 'front'
                              }
                              size={layoutMode === 'lookbook' ? 'lg' : 'md'}
                            />

                            <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider">
                              <span
                                className={
                                  isSoldOut
                                    ? 'text-rose-500'
                                    : item.isPreOrderRelease
                                    ? 'text-amber-400'
                                    : item.isLimitedEdition
                                    ? 'text-purple-400'
                                    : 'text-zinc-400'
                                }
                              >
                                {isSoldOut
                                  ? 'SOLD OUT'
                                  : item.isPreOrderRelease
                                  ? 'PRE-ORDER'
                                  : item.isLimitedEdition
                                  ? 'LIMITED RUN'
                                  : 'IN STOCK'}
                              </span>

                              {isPhys && item.countsForBillboard ? (
                                <span className="text-emerald-500 dark:text-emerald-400">
                                  BB200/H100
                                </span>
                              ) : (
                                <span className="text-zinc-400">ATELIER MERCH</span>
                              )}
                            </div>
                          </div>

                          <div className="p-3">
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                              {item.formatLabel} · {tierMeta.shortTag}
                            </div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                              {item.name}
                            </h4>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {isPhys
                                ? `Release: ${item.linkedReleaseTitle}`
                                : `${item.colorwayName}${
                                    item.apparelDesign?.backPrintStyle &&
                                    item.apparelDesign.backPrintStyle !== 'clean_blank'
                                      ? ' · Front & Back Print'
                                      : ''
                                  }`}
                            </div>
                          </div>
                        </div>

                        <div className="px-3 pb-3 pt-1">
                          <div className="flex items-baseline justify-between font-mono tabular-nums">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-zinc-900 dark:text-white">
                                ${effectivePrice}
                              </span>
                              {effectivePrice < item.retailPrice && (
                                <span className="text-[10px] line-through text-zinc-400">
                                  ${item.retailPrice}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {formatNum(item.totalSold)} sold
                            </span>
                          </div>

                           <div className="w-full h-1 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full transition-all ${
                                isSoldOut
                                  ? 'bg-rose-500'
                                  : stockPercent <= 20
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono tabular-nums">
                            <span>
                              {isSoldOut
                                ? '0 left'
                                : `${formatNum(item.stockRemaining)} left`}
                            </span>
                            {item.dailySold > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +{formatNum(item.dailySold)}/d
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-400 truncate max-w-[80px]">
                                {item.demandPhaseLabel || 'Active'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainView === 'campaigns' && (
          <div className="p-4 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Active Storefront Marketing & Conversion Strategy
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                Select how your official webstore promotes physical chart bundles, VIP fan drops, or warehouse clearance sales.
              </p>

              <div className="space-y-2.5">
                {MERCH_PROMO_CAMPAIGNS.map(camp => {
                  const isActive = store.activePromoCampaign === camp.id;
                  return (
                    <button
                      key={camp.id}
                      onClick={() => handleSelectCampaign(camp.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-[#14141C] hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          {camp.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {camp.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {camp.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                Billboard 200 & Hot 100 Physical Sales Contribution (Vinyl / CD / Tape / Box)
              </h3>
              <div className="space-y-2">
                {linkableReleases.slice(0, 8).map(rel => {
                  const linkedStoreItems = store.items.filter(
                    i =>
                      isPhysicalMusicCategory(i.category) &&
                      i.linkedReleaseType === rel.type &&
                      i.linkedReleaseId === rel.id &&
                      i.countsForBillboard
                  );
                  const webstoreUnits = linkedStoreItems.reduce(
                    (s, i) => s + i.totalSold,
                    0
                  );
                  const pendingPreOrders = linkedStoreItems.reduce(
                    (s, i) => s + (i.preOrdersAccumulated || 0),
                    0
                  );

                  return (
                    <div
                      key={rel.key}
                      className="p-3 rounded-xl bg-white dark:bg-[#14141C] border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={rel.cover}
                          alt={rel.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {rel.title}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {linkedStoreItems.length} physical music formats ·{' '}
                            {rel.isScheduled ? 'Scheduled Pre-Order' : 'Released'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {formatNumFull(webstoreUnits)} units
                        </div>
                        {pendingPreOrders > 0 ? (
                          <div className="text-[10px] text-amber-500">
                            {formatNumFull(pendingPreOrders)} queued Day-1
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-500">
                            Total pure: {formatNumFull(rel.pureSales)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeMainView === 'backstage' && (
          <div className="p-4 space-y-5">
             <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#14141C] border border-zinc-200 dark:border-white/10">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Gross Store Sales
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-white mt-1">
                  ${formatNumFull(store.totalGrossRevenue)}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  +${formatNumFull(store.dailyGrossSales ?? store.dailyRevenue)} gross/d
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#14141C] border border-zinc-200 dark:border-white/10">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Net Artist Profit
                </div>
                <div
                  className={`text-lg font-black mt-1 ${
                    store.totalNetProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-500'
                  }`}
                >
                  {store.totalNetProfit >= 0 ? '+' : '-'}$
                  {formatNumFull(Math.abs(store.totalNetProfit))}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +${formatNumFull(store.dailyRevenue)} net/d
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#14141C] border border-zinc-200 dark:border-white/10">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  D2C Fees & Storage
                </div>
                <div className="text-lg font-black text-rose-500 mt-1">
                  -$
                  {formatNumFull(
                    (store.totalPlatformAndFulfillmentFees || 0) +
                      (store.totalWarehouseHoldingFees || 0)
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Mfg Cost: -${formatNumFull(store.totalManufacturingCost)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#14141C] border border-zinc-200 dark:border-white/10">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Billboard Chart Units
                </div>
                <div className="text-lg font-black text-zinc-900 dark:text-white mt-1">
                  {formatNumFull(store.totalBillboardPureUnitsSold)}
                </div>
                <div className="text-[11px] text-sky-500 mt-0.5 font-sans">
                  {formatNumFull(totalActivePreOrders)} pre-orders queued
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                Warehouse Stock & Pressing Runs
              </h3>
              {store.items.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  No products pressed yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {store.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      className="p-3 rounded-xl bg-white dark:bg-[#14141C] border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:border-zinc-400 dark:hover:border-white/25 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{item.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono tabular-nums">
                          <span>${item.retailPrice} retail</span>
                          <span> · </span>
                          <span>${item.unitCost} cost</span>
                          <span> · </span>
                          <span>
                            {formatNumFull(item.stockRemaining)} /{' '}
                            {formatNumFull(item.totalPressed)} left
                          </span>
                        </div>
                      </div>

                      {!item.isLimitedEdition ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRestockItem(item.id, 1000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[11px] font-bold shrink-0 hover:opacity-90 transition cursor-pointer whitespace-nowrap"
                        >
                          +1,000 Stock
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-purple-500 shrink-0">
                          Limited Run
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                Recent Fulfilled Orders & Chart Shipments
              </h3>
              {store.orderLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  Orders will appear here as fans purchase your merch each day.
                </p>
              ) : (
                <div className="space-y-2">
                  {store.orderLogs.slice(0, 15).map(log => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-[#14141C] border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{log.productName}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {log.date} · {log.formatLabel}
                          {log.countedForBillboard ? ' · Counted for Billboard' : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {formatNumFull(log.unitsSold)} units
                        </div>
                        {log.grossRevenue > 0 && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            +${formatNumFull(log.grossRevenue)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT DETAIL, FRONT/BACK INSPECTOR, PRICE & RESTOCK MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-white dark:bg-[#13131A] text-zinc-900 dark:text-zinc-100 rounded-t-2xl border-t border-zinc-200 dark:border-white/15 max-h-[90vh] overflow-y-auto p-4 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {selectedProduct.formatLabel} ·{' '}
                {getMerchSpecTierMeta(selectedProduct.specTier).shortTag}
              </span>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <i className="ph-bold ph-x text-sm"></i>
              </button>
            </div>

            <div className="rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-200/70 dark:from-[#1E1E2A] dark:to-[#121218] border border-zinc-200 dark:border-white/10 mb-3 overflow-hidden">
              <MerchVisualPreview
                formatId={selectedProduct.formatId}
                coverArt={selectedProduct.coverArt}
                title={selectedProduct.linkedReleaseTitle}
                artistName={artistName}
                primaryColor={selectedProduct.primaryColor}
                secondaryColor={selectedProduct.secondaryColor}
                variantStyle={selectedProduct.variantStyle}
                isSigned={selectedProduct.isSigned}
                hasObiStrip={selectedProduct.hasObiStrip}
                hypeStickerText={selectedProduct.hypeStickerText}
                specTier={selectedProduct.specTier}
                apparelDesign={selectedProduct.apparelDesign}
                viewSide={inspectorViewSide}
                size="lg"
              />

              {/* Front / Back / Dual View Switcher if Garment supports it */}
              {getMerchFormatTemplate(selectedProduct.formatId)
                .supportsFrontBackView && (
                <div className="p-2 bg-white/85 dark:bg-black/50 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-center gap-1.5">
                  {(['front', 'back', 'both'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setInspectorViewSide(side)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                        inspectorViewSide === side
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                          : 'bg-zinc-200/70 dark:bg-white/10 text-zinc-500'
                      }`}
                    >
                      {side === 'both' ? 'Front + Back Spread' : `${side} View`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <h3 className="text-lg font-black leading-snug">{selectedProduct.name}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {selectedProduct.subtitle}
            </p>

             <div className="mt-3 p-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Craftsmanship Grade:</span>
                <span className="font-bold">
                  {getMerchSpecTierMeta(selectedProduct.specTier).name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Colorway & Finish:</span>
                <span className="font-bold">{selectedProduct.colorwayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Demand Lifecycle:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedProduct.demandPhaseLabel || 'Active Drop Window'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Core Fan Saturation:</span>
                <span className="font-mono font-bold">
                  {selectedProduct.saturationPercent ?? 0}% of Core Buyers Own This
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Chart Eligibility:</span>
                <span
                  className={`font-bold ${
                    selectedProduct.countsForBillboard
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {selectedProduct.countsForBillboard
                    ? `Counts for Billboard (${selectedProduct.linkedReleaseTitle})`
                    : 'Standalone Brand Merch (Revenue & Profit Only)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 my-4 font-mono tabular-nums text-center">
              <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-white/5">
                <div className="text-xs font-black">
                  {formatNumFull(selectedProduct.totalSold)}
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">Total Sold</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-white/5">
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  ${formatNumFull(selectedProduct.totalRevenue)}
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">Gross Sales</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-white/5">
                <div className="text-xs font-black">
                  {formatNumFull(selectedProduct.stockRemaining)}
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">In Stock</div>
              </div>
            </div>

            {(() => {
              const inspTmpl = getMerchFormatTemplate(selectedProduct.formatId);
              const inspEval = evaluateMerchPricingElasticity(
                inspTmpl,
                selectedProduct.retailPrice,
                selectedProduct.isSigned,
                selectedProduct.isLimitedEdition,
                selectedProduct.specTier
              );
              const netUnitProfit =
                inspEval.netArtistTakePerUnit - selectedProduct.unitCost;

              return (
                <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Retail Store Price</span>
                    <span className="font-mono tabular-nums text-sm">
                      ${selectedProduct.retailPrice}{' '}
                      <span className="text-[11px] text-zinc-500">
                        (Fair Benchmark: ${inspEval.benchmarkPrice})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={inspTmpl.minRetailPrice}
                    max={inspTmpl.maxRetailPrice}
                    value={selectedProduct.retailPrice}
                    onChange={e =>
                      handleUpdatePrice(selectedProduct.id, Number(e.target.value))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${inspEval.demandColor}`}>
                      {inspEval.demandLabel}
                    </span>
                    <span className="font-mono tabular-nums text-zinc-500">
                      Net Profit/u:{' '}
                      <strong
                        className={
                          netUnitProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }
                      >
                        {netUnitProfit >= 0 ? '+' : '-'}${Math.abs(netUnitProfit)}
                      </strong>{' '}
                      (Fee -${inspEval.platformAndFulfillmentCutPerUnit}, Mfg -$
                      {selectedProduct.unitCost})
                    </span>
                  </div>
                </div>
              );
            })()}

            {!selectedProduct.isLimitedEdition ? (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2">
                  Press Additional Inventory Batch
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 2500, 10000].map(units => {
                    const batchMeta =
                      BATCH_PRESSING_OPTIONS.find(b => b.units === units) ||
                      BATCH_PRESSING_OPTIONS[1];
                    const tmpl = getMerchFormatTemplate(selectedProduct.formatId);
                    const tierMeta = getMerchSpecTierMeta(selectedProduct.specTier);
                    const estCost =
                      Math.max(
                        2,
                        Math.round(
                          tmpl.unitManufacturingCost *
                            tierMeta.costMultiplier *
                            batchMeta.discount
                        )
                      ) * units;

                    return (
                      <button
                        key={units}
                        onClick={() => handleRestockItem(selectedProduct.id, units)}
                        className="p-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-center hover:opacity-90 transition cursor-pointer"
                      >
                        <div className="text-xs font-black font-mono tabular-nums">
                          +{formatNum(units)}
                        </div>
                        <div className="text-[10px] opacity-80 font-mono tabular-nums">
                          ${formatNum(estCost)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-600 dark:text-purple-300 font-semibold mb-4">
                Limited Edition Collector Pressing — Restocking is permanently locked to preserve collector scarcity.
              </div>
            )}

            <button
              type="button"
              onClick={() => handleVaultProduct(selectedProduct.id)}
              className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-500 text-xs font-bold hover:bg-rose-500/10 transition cursor-pointer"
            >
              Archive & Remove Item from Storefront
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM VINYL & STREETWEAR DESIGNER STUDIO MODAL */}
      {showDesignerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-white dark:bg-[#111117] text-zinc-900 dark:text-zinc-100 rounded-t-2xl border-t border-zinc-200 dark:border-white/15 max-h-[94vh] flex flex-col overflow-hidden animate-slide-up">
            {/* Designer Header */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {isCurrentFormatPhysicalMusic
                    ? 'Vinyl & Physical Music Pressing Studio'
                    : 'Bespoke Streetwear & Merch Atelier'}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isCurrentFormatPhysicalMusic
                    ? 'Link to an Album or Single for Billboard 200 & Hot 100 chart sales'
                    : 'Customize Front & Back graphics, typography, tour prints & photos'}
                </p>
              </div>
              <button
                onClick={() => setShowDesignerModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <i className="ph-bold ph-x text-sm"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
              {/* LIVE VISUAL PREVIEW STAGE */}
              <div className="rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-200/70 dark:from-[#1D1D2A] dark:to-[#111118] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-md">
                <MerchVisualPreview
                  formatId={designerFormatId}
                  coverArt={
                    isCurrentFormatPhysicalMusic
                      ? activeSelectedRelease.cover
                      : apparelCustomPhotoUrl || state.artist?.image || ''
                  }
                  title={
                    isCurrentFormatPhysicalMusic
                      ? activeSelectedRelease.title
                      : apparelFrontText || artistName
                  }
                  artistName={artistName}
                  primaryColor={previewPrimaryColor}
                  secondaryColor={previewSecondaryColor}
                  variantStyle={previewVariantStyle}
                  isSigned={designerIsSigned && activeTemplate.supportsSignedOption}
                  hasObiStrip={isCurrentFormatPhysicalMusic && designerHasObi}
                  hypeStickerText={
                    isCurrentFormatPhysicalMusic ? designerHypeSticker : undefined
                  }
                  specTier={designerSpecTier}
                  apparelDesign={
                    !isCurrentFormatPhysicalMusic ? currentApparelDesign : undefined
                  }
                  viewSide={
                    activeTemplate.supportsFrontBackView
                      ? previewGarmentSide
                      : 'front'
                  }
                  size="lg"
                />

                {/* Front / Back / Dual Spread Toggle Bar for Hoodies, Tees & Jackets */}
                {!isCurrentFormatPhysicalMusic &&
                  activeTemplate.supportsFrontBackView && (
                    <div className="px-3 py-2 bg-zinc-900/90 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        Garment View:
                      </span>
                      <div className="flex items-center gap-1">
                        {(['front', 'back', 'both'] as const).map(side => (
                          <button
                            key={side}
                            type="button"
                            onClick={() => setPreviewGarmentSide(side)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                              previewGarmentSide === side
                                ? 'bg-emerald-500 text-black'
                                : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                            }`}
                          >
                            {side === 'both' ? 'Front + Back' : side}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="px-3.5 py-2.5 bg-white/90 dark:bg-black/55 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold truncate">
                      {designerCustomName.trim() ||
                        (isCurrentFormatPhysicalMusic
                          ? `${activeSelectedRelease.title} — ${
                              designerIsSigned && activeTemplate.supportsSignedOption
                                ? 'Signed '
                                : ''
                            }${activeTemplate.shortLabel}`
                          : `${apparelFrontText || artistName} — ${
                              activeTemplate.shortLabel
                            }`)}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {isCurrentFormatPhysicalMusic
                        ? 'Counts 1:1 Toward Billboard Pure Sales'
                        : 'Standalone Brand Merch (High Margin)'}
                    </div>
                  </div>
                  <div className="font-mono tabular-nums font-black text-sm shrink-0">
                    ${designerRetailPrice}
                  </div>
                </div>
              </div>

              {/* STEP 1: PRODUCT CATEGORY & FORMAT */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
                  01. Select Product Category & Format
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {[
                    { id: 'vinyl' as const, label: 'Vinyl LPs' },
                    { id: 'physical_music' as const, label: 'CD/Tape/Box' },
                    { id: 'apparel' as const, label: 'Streetwear' },
                    { id: 'accessory' as const, label: 'Accessories' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const firstInCat = MERCH_FORMAT_TEMPLATES.find(
                          t => t.category === cat.id
                        );
                        if (firstInCat) handleSelectFormat(firstInCat.id, cat.id);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        designerCategory === cat.id
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {MERCH_FORMAT_TEMPLATES.filter(
                    t => t.category === designerCategory
                  ).map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectFormat(tmpl.id, tmpl.category)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        designerFormatId === tmpl.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5'
                      }`}
                    >
                      <div className="text-xs font-bold leading-snug">
                        {tmpl.shortLabel}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono tabular-nums">
                        Base ${tmpl.unitManufacturingCost}/u · Rec ${tmpl.recommendedRetailPrice}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 2: CONDITIONAL — PHYSICAL MUSIC LINKS TO ALBUM/SINGLE vs. STREETWEAR HAS FULL FRONT/BACK CUSTOMIZER */}
              {isCurrentFormatPhysicalMusic ? (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    02. Link Physical Release to Album or Single (Billboard Chart Eligible)
                  </label>
                  {linkableReleases.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500">
                      Record or schedule an Album, EP, or Single in the Studio to link physical chart copies.
                    </div>
                  ) : (
                    <>
                      <select
                        value={designerReleaseChoice}
                        onChange={e => setDesignerReleaseChoice(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-[#1C1C26] border border-zinc-200 dark:border-white/10 text-xs font-semibold"
                      >
                        {linkableReleases.map(rel => (
                          <option key={rel.key} value={rel.key}>
                            {rel.title} ({rel.subtitle})
                          </option>
                        ))}
                      </select>
                      {activeSelectedRelease.isScheduled && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          Pre-Order Active: All pre-ordered Vinyl/CD/Tape units will ship on Release Day for a Day-1 Billboard 200 / Hot 100 surge.
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* STANDALONE STREETWEAR & ACCESSORY CUSTOM DESIGN STUDIO (NO ALBUM LINK!) */
                <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-[#181822] border border-zinc-200 dark:border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      02. Custom Front & Back Streetwear Designer
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Standalone Brand Merch
                    </span>
                  </div>

                  {/* Front Slogan & Sub-caption */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                        Front Graphic Text / Logo
                      </label>
                      <input
                        type="text"
                        value={apparelFrontText}
                        onChange={e => setApparelFrontText(e.target.value)}
                        placeholder={artistName.toUpperCase()}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111117] border border-zinc-200 dark:border-white/10 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                        Front Sub-Text / Stamp
                      </label>
                      <input
                        type="text"
                        value={apparelFrontSubText}
                        onChange={e => setApparelFrontSubText(e.target.value)}
                        placeholder="480GSM ARCHIVE"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111117] border border-zinc-200 dark:border-white/10 text-xs"
                      />
                    </div>
                  </div>

                  {/* Typography Font Style */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1.5">
                      Typography Font Aesthetic
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {APPAREL_FONT_STYLES.map(font => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setApparelFontStyle(font.id)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                            apparelFontStyle === font.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5'
                          }`}
                        >
                          <div className={`text-[11px] truncate ${font.sampleClass}`}>
                            {apparelFrontText || artistName}
                          </div>
                          <div className="text-[9px] text-zinc-500 truncate mt-0.5">
                            {font.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Graphic Emblem OR Custom Photo Upload */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1.5">
                      Center Chest Emblem or Custom Photo Upload
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {APPAREL_GRAPHIC_MOTIFS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setApparelMotif(m.id)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                            apparelMotif === m.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">
                            {m.label}
                          </div>
                          <div className="text-[9px] text-zinc-500 truncate">
                            {m.description}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom Photo Upload / URL Input when 'custom_photo' is chosen */}
                    {apparelMotif === 'custom_photo' && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-white dark:bg-[#111117] border border-zinc-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold">
                            Upload Custom Graphic / Photo
                          </span>
                          <label className="px-2.5 py-1 rounded bg-emerald-500 text-black text-[10px] font-black cursor-pointer">
                            Choose Image File
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadCustomGraphicFile}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={apparelCustomPhotoUrl}
                          onChange={e => setApparelCustomPhotoUrl(e.target.value)}
                          placeholder="Or paste custom image URL..."
                          className="w-full px-2.5 py-1.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[11px]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Back Print Customizer (for Hoodies, Tees, and Varsity Jackets) */}
                  {activeTemplate.supportsFrontBackView && (
                    <div className="pt-2.5 border-t border-zinc-200 dark:border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Back Print Layout & Tour Dates
                        </label>
                        <button
                          type="button"
                          onClick={() => setPreviewGarmentSide('back')}
                          className="text-[10px] font-bold text-emerald-500 cursor-pointer"
                        >
                          Preview Back →
                        </button>
                      </div>

                      <select
                        value={apparelBackStyle}
                        onChange={e => {
                          setApparelBackStyle(e.target.value as ApparelBackPrintStyle);
                          setPreviewGarmentSide('both');
                        }}
                        className="w-full p-2 rounded-lg bg-white dark:bg-[#111117] border border-zinc-200 dark:border-white/10 text-xs font-semibold"
                      >
                        {APPAREL_BACK_STYLES.map(bs => (
                          <option key={bs.id} value={bs.id}>
                            {bs.label} — {bs.description}
                          </option>
                        ))}
                      </select>

                      {apparelBackStyle !== 'clean_blank' && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                              Back Header Text
                            </label>
                            <input
                              type="text"
                              value={apparelBackHeading}
                              onChange={e => setApparelBackHeading(e.target.value)}
                              placeholder={`${artistName.toUpperCase()} WORLD TOUR`}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111117] border border-zinc-200 dark:border-white/10 text-xs font-bold"
                            />
                          </div>

                          {(apparelBackStyle === 'tour_dates_list' ||
                            apparelBackStyle === 'manifesto_quote') && (
                            <div>
                              <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                                {apparelBackStyle === 'tour_dates_list'
                                  ? 'Tour Cities (Separate with • or comma)'
                                  : 'Back Manifesto / Quote Text'}
                              </label>
                              <textarea
                                rows={2}
                                value={apparelBackText}
                                onChange={e => setApparelBackText(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111117] border border-zinc-200 dark:border-white/10 text-[11px]"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {designerFormatId === 'apparel_hoodie' && (
                        <button
                          type="button"
                          onClick={() => setApparelHasSleevePrint(p => !p)}
                          className={`w-full p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                            apparelHasSleevePrint
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5'
                          }`}
                        >
                          <span className="text-xs font-bold">
                            Both Sleeves Screen-Print Detail
                          </span>
                          <span className="text-[10px] font-mono text-emerald-500">
                            {apparelHasSleevePrint ? 'ENABLED (+10% Demand)' : 'OFF'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: WAX / GARMENT COLORWAY & CUSTOM HEX PALETTE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    03. {isCurrentFormatPhysicalMusic ? 'Vinyl Wax / Shell Colorway' : 'Garment Dye & Print Ink Colorway'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomColorway(p => !p)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  >
                    {useCustomColorway ? 'Use Designer Presets' : 'Custom Hex Colors'}
                  </button>
                </div>

                {useCustomColorway ? (
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#1C1C26] border border-zinc-200 dark:border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold block mb-1">
                          {isCurrentFormatPhysicalMusic
                            ? 'Primary Wax Base'
                            : 'Garment Fabric Color'}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customPrimaryHex}
                            onChange={e => setCustomPrimaryHex(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <span className="text-xs font-mono uppercase">
                            {customPrimaryHex}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold block mb-1">
                          {isCurrentFormatPhysicalMusic
                            ? 'Splatter / Swirl Color'
                            : 'Print Ink / Trim Color'}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customSecondaryHex}
                            onChange={e => setCustomSecondaryHex(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                          />
                          <span className="text-xs font-mono uppercase">
                            {customSecondaryHex}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isCurrentFormatPhysicalMusic && (
                      <div>
                        <span className="text-[10px] font-bold block mb-1">
                          Wax Pressing Finish
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(
                            ['solid', 'translucent', 'splatter', 'marble'] as const
                          ).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setCustomVariantStyle(st)}
                              className={`py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                                customVariantStyle === st
                                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                                  : 'bg-white dark:bg-white/5 text-zinc-500'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {VINYL_AND_MERCH_COLORWAYS.map(cw => (
                      <button
                        key={cw.id}
                        type="button"
                        onClick={() => setDesignerColorwayId(cw.id)}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 text-left transition cursor-pointer ${
                          designerColorwayId === cw.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full shrink-0 border border-black/20 shadow-inner"
                          style={{
                            background: `linear-gradient(135deg, ${cw.primaryColor} 50%, ${cw.secondaryColor} 50%)`
                          }}
                        />
                        <span className="text-[11px] font-semibold leading-tight truncate">
                          {cw.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* STEP 4: CRAFTSMANSHIP & PACKAGING SPEC TIER */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
                  04. Craftsmanship & Material Grade
                </label>
                <div className="space-y-2">
                  {MERCH_SPEC_TIERS.map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setDesignerSpecTier(tier.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        designerSpecTier === tier.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{tier.name}</span>
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                          +{Math.round((tier.demandMultiplier - 1) * 100)}% Appeal
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {tier.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 5: EDITION TITLE & COLLECTOR FINISHING */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  05. Product Title & Collector Options
                </label>
                <input
                  type="text"
                  value={designerCustomName}
                  onChange={e => setDesignerCustomName(e.target.value)}
                  placeholder={
                    isCurrentFormatPhysicalMusic
                      ? `${activeSelectedRelease.title} — ${activeTemplate.shortLabel}`
                      : `${apparelFrontText || artistName} — ${activeTemplate.shortLabel}`
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#1C1C26] border border-zinc-200 dark:border-white/10 text-xs"
                />

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDesignerIsLimited(p => !p)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      designerIsLimited
                        ? 'border-purple-500 bg-purple-500/15'
                        : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Limited Run</div>
                    <div className="text-[9px] text-zinc-500">+32% Demand</div>
                  </button>

                  {isCurrentFormatPhysicalMusic && (
                    <button
                      type="button"
                      onClick={() => setDesignerHasObi(p => !p)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        designerHasObi
                          ? 'border-sky-500 bg-sky-500/15'
                          : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5'
                      }`}
                    >
                      <div className="text-[11px] font-bold">Obi Spine Strip</div>
                      <div className="text-[9px] text-zinc-500">+8% Appeal</div>
                    </button>
                  )}

                  {activeTemplate.supportsSignedOption && (
                    <button
                      type="button"
                      onClick={() => setDesignerIsSigned(p => !p)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        designerIsSigned
                          ? 'border-amber-500 bg-amber-500/15'
                          : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5'
                      }`}
                    >
                      <div className="text-[11px] font-bold">Hand-Signed</div>
                      <div className="text-[9px] text-zinc-500">+38% Demand</div>
                    </button>
                  )}
                </div>
              </div>

              {/* STEP 6: BATCH PRESSING RUN & RETAIL PRICING */}
              <div className="space-y-3 p-3.5 rounded-xl bg-zinc-100 dark:bg-[#191922] border border-zinc-200 dark:border-white/10">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span>06. Initial Production Run</span>
                    <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      Unit Cost: ${effectiveUnitMfgCost}/unit
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BATCH_PRESSING_OPTIONS.map(b => (
                      <button
                        key={b.units}
                        type="button"
                        onClick={() => setDesignerBatchUnits(b.units)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-mono tabular-nums transition cursor-pointer ${
                          designerBatchUnits === b.units
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                            : 'bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {formatNum(b.units)}
                      </button>
                    ))}
                  </div>
                </div>

                 <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>
                      Retail Price: ${designerRetailPrice}{' '}
                      <span className="text-[10px] font-normal text-zinc-500">
                        (Fair Benchmark: ${pricingEvaluation.benchmarkPrice})
                      </span>
                    </span>
                    <span className={`text-[11px] ${pricingEvaluation.demandColor}`}>
                      {pricingEvaluation.demandLabel}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={activeTemplate.minRetailPrice}
                    max={activeTemplate.maxRetailPrice}
                    value={designerRetailPrice}
                    onChange={e => setDesignerRetailPrice(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums mt-1">
                    <span>
                      D2C Fee (21.5% + $2.50): -$
                      {pricingEvaluation.platformAndFulfillmentCutPerUnit}/u
                    </span>
                    <span
                      className={
                        unitNetProfitAfterFees >= 0
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-rose-500 font-bold'
                      }
                    >
                      Net Profit/Unit:{' '}
                      {unitNetProfitAfterFees >= 0 ? '+' : '-'}$
                      {Math.abs(unitNetProfitAfterFees)}/u
                    </span>
                  </div>
                  {pricingEvaluation.elasticityMultiplier <= 0.16 && (
                    <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-500 font-semibold">
                      Overpricing Alert: Setting retail price far above the $
                      {pricingEvaluation.benchmarkPrice} benchmark triggers fan backlash and slashes daily conversion by up to 97%.
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-zinc-200 dark:border-white/10 space-y-1 text-xs font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="font-sans text-zinc-500 dark:text-zinc-400">
                      Upfront Manufacturing Cost:
                    </span>
                    <span className="font-bold text-rose-500">
                      -${formatNumFull(totalUpfrontMfgCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-zinc-500 dark:text-zinc-400">
                      Sell-Out Gross Revenue:
                    </span>
                    <span className="font-bold">
                      +${formatNumFull(projectedGrossRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-zinc-500 dark:text-zinc-400">
                      Net Artist Payout (After D2C Fees):
                    </span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      +${formatNumFull(projectedNetArtistRevenueAfterFees)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-zinc-500 dark:text-zinc-400">
                      Projected Net Profit (Sell-Out):
                    </span>
                    <span
                      className={`font-black ${
                        projectedNetProfit >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500'
                      }`}
                    >
                      {projectedNetProfit >= 0 ? '+' : '-'}$
                      {formatNumFull(Math.abs(projectedNetProfit))}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchProduct}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-98 cursor-pointer"
              >
                Produce {formatNumFull(designerBatchUnits)} Units & Publish to Store ($
                {formatNumFull(totalUpfrontMfgCost)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
