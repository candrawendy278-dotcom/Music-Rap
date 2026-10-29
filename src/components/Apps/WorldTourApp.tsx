import React, { useState, useMemo, useRef } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull } from '../../constants';
import { DETAILED_NPCS, getNpcAvatar } from '../../data/npcAssets';
import {
  GLOBAL_TOUR_CITIES,
  MAIN_STAGE_ARCHITECTURES,
  RUNWAY_CATWALK_OPTIONS,
  B_STAGE_MODULES,
  ERA_LIGHTING_THEMES,
  PRESALE_STRATEGIES,
  TOUR_SPONSORS,
  PresaleStrategyId,
  SeatingZoneId,
  TourStageConfig,
  TourSetlistConfig,
  TourVipPerksConfig,
  DEFAULT_VIP_PERKS,
  VenueTierId,
  ensureWorldTourState,
  evaluateStageArchitectureMetrics,
  estimateCityShowDemand,
  launchNewWorldTour,
  addSoldOutExtraNightToTour,
  triggerVerifiedFanPresaleBlast,
  unlockProductionHoldSeats,
  triggerFlashSalePriceDrop,
  rescheduleTourStopDate,
  purchaseTourVocalRecovery,
  updateActiveTourBanner,
  shareTourBannerPromoToX,
  buildGlobalTourBoxscoreLeaderboard
} from '../../data/worldTourSystemEngine';
import TourStagePreview from './TourStagePreview';
import TourWorldMap from './TourWorldMap';
import TourTicketSeatingConsole from './TourTicketSeatingConsole';

type TourAppTab =
  | 'overview'
  | 'stage'
  | 'planner'
  | 'boxscore'
  | 'leaderboard';

type PlannerWizardStep = 1 | 2 | 3 | 4;
type StageSubSection = 'banner' | 'main_rig' | 'catwalk' | 'fx';

/**
 * Compresses an uploaded image file from a mobile phone gallery into a lightweight DataURL
 * (max 900px width, JPEG 0.82) so localStorage remains fast and never overflows.
 */
function compressMobileBannerFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const resultStr = e.target?.result as string;
      if (!resultStr) {
        reject(new Error('Could not read image file'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxWidth = 900;
        const maxHeight = 560;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(resultStr);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(resultStr);
      img.src = resultStr;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export default function WorldTourApp() {
  const { state, setState } = useGameContext();
  const tourState = useMemo(() => ensureWorldTourState(state), [state]);
  const activeTour = tourState.activeTour;

  const [activeTab, setActiveTab] = useState<TourAppTab>(
    activeTour ? 'overview' : 'planner'
  );
  const [plannerStep, setPlannerStep] = useState<PlannerWizardStep>(1);
  const [stageSubSection, setStageSubSection] =
    useState<StageSubSection>('main_rig');

  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const artistName = state.artist?.name || 'Artist';
  const currentGameDateStr = state.date.split('T')[0];

  const releasedProjects = useMemo(
    () => (state.projects || []).filter(p => p.status === 'released'),
    [state.projects]
  );
  const releasedSongs = useMemo(
    () => (state.songs || []).filter(s => s.status === 'released'),
    [state.songs]
  );

  // Stage Architect state (syncs with activeTour or draftStageConfig)
  const [stageConfig, setStageConfig] = useState<TourStageConfig>(
    () => activeTour?.stageConfig || tourState.draftStageConfig
  );

  // Custom Tour Banner URL / Uploaded DataURL
  const [customBannerUrl, setCustomBannerUrl] = useState<string>(
    () =>
      activeTour?.customBannerUrl ||
      activeTour?.coverArt ||
      tourState.draftStageConfig.customBannerUrl ||
      tourState.draftStageConfig.backdropCover ||
      releasedProjects[0]?.cover ||
      state.artist?.image ||
      ''
  );
  const [bannerUrlInput, setBannerUrlInput] = useState<string>('');

  // Tour Planner state
  const [tourTitle, setTourTitle] = useState<string>(() => {
    const latestAlbum = releasedProjects[0];
    return latestAlbum
      ? `The ${latestAlbum.title} World Tour`
      : `The ${artistName} Era World Tour`;
  });
  const [eraProjectId, setEraProjectId] = useState<number | null>(
    () => releasedProjects[0]?.id || null
  );

  // Player-controlled Tour Kickoff Date & Pacing
  const [kickoffDate, setKickoffDate] = useState<string>(() => {
    const d = new Date(state.date);
    d.setDate(d.getDate() + 10); // Default 10-day presale window before Night 1
    return d.toISOString().split('T')[0];
  });
  const [daysBetweenShows, setDaysBetweenShows] = useState<number>(3);
  const [presaleStrategy, setPresaleStrategy] =
    useState<PresaleStrategyId>('verified_fan_code');

  const [selectedStops, setSelectedStops] = useState<
    Array<{ cityId: string; venueTier: VenueTierId; customDate?: string }>
  >(() => {
    const defaultTier: VenueTierId =
      (state.popularity || 5) >= 72
        ? 'stadium'
        : (state.popularity || 5) >= 44
        ? 'arena'
        : (state.popularity || 5) >= 20
        ? 'theater'
        : 'club';
    return [
      { cityId: 'los_angeles', venueTier: defaultTier },
      { cityId: 'new_york', venueTier: defaultTier },
      { cityId: 'london', venueTier: defaultTier },
      { cityId: 'paris', venueTier: defaultTier },
      { cityId: 'tokyo', venueTier: defaultTier },
      { cityId: 'jakarta', venueTier: defaultTier }
    ];
  });

  const [selectedMapCityId, setSelectedMapCityId] =
    useState<string>('los_angeles');

  // 5-Tier Stadium Seating Prices
  const [nosebleedPrice, setNosebleedPrice] = useState<number>(() =>
    Math.min(140, Math.max(30, Math.round(28 + (state.popularity || 10) * 0.85)))
  );
  const [lowerBowlPrice, setLowerBowlPrice] = useState<number>(() =>
    Math.min(240, Math.max(50, Math.round(48 + (state.popularity || 10) * 1.35)))
  );
  const [floorStandingPrice, setFloorStandingPrice] = useState<number>(() =>
    Math.min(310, Math.max(65, Math.round(62 + (state.popularity || 10) * 1.65)))
  );
  const [goldenCirclePrice, setGoldenCirclePrice] = useState<number>(() =>
    Math.min(450, Math.max(95, Math.round(95 + (state.popularity || 10) * 2.4)))
  );
  const [vipPackagePrice, setVipPackagePrice] = useState<number>(() =>
    Math.min(
      950,
      Math.max(195, Math.round(210 + (state.popularity || 10) * 4.5))
    )
  );
  const [vipPerks, setVipPerks] =
    useState<TourVipPerksConfig>(DEFAULT_VIP_PERKS);
  const [antiScalperExchangeEnabled, setAntiScalperExchangeEnabled] =
    useState<boolean>(true);
  const [dynamicPlatinumEnabled, setDynamicPlatinumEnabled] =
    useState<boolean>(true);
  const [sponsorId, setSponsorId] = useState<string>('self_funded');
  const [openingActNpcIds, setOpeningActNpcIds] = useState<string[]>([]);

  // Weighted General Admission average synced from the 3 non-VIP/GC tiers
  const gaPrice = useMemo(
    () =>
      Math.round(
        (nosebleedPrice * 0.28 +
          lowerBowlPrice * 0.3 +
          floorStandingPrice * 0.22) /
          0.8
      ),
    [nosebleedPrice, lowerBowlPrice, floorStandingPrice]
  );

  // Setlist Builder State
  const [setlist, setSetlist] = useState<TourSetlistConfig>(() => {
    const ids = releasedSongs.map(s => s.id);
    return {
      act1SongIds: ids.slice(0, 2),
      act2SongIds: ids.slice(2, 5),
      act3SongIds: ids.slice(5, 7),
      act4SongIds:
        ids.slice(7, 9).length > 0 ? ids.slice(7, 9) : ids.slice(0, 1),
      surpriseSongId: ids[0] || null
    };
  });

  const [leaderboardSort, setLeaderboardSort] = useState<
    'gross' | 'attendance' | 'avg'
  >('gross');

  const closeApp = () => {
    setState(prev => ({ ...prev, activeApp: 'none' }));
  };

  const applyNewTourBanner = (newBanner: string, successText?: string) => {
    if (!newBanner) return;
    setCustomBannerUrl(newBanner);
    const nextConfig: TourStageConfig = {
      ...stageConfig,
      customBannerUrl: newBanner,
      backdropCover: newBanner
    };
    setStageConfig(nextConfig);
    setState(prev => updateActiveTourBanner(prev, newBanner));
    if (successText) {
      setBannerMessage({
        type: 'success',
        text: successText
      });
    }
  };

  const handleMobileBannerFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressMobileBannerFile(file);
      applyNewTourBanner(
        compressedDataUrl,
        'Official Tour Banner uploaded! Displayed on 3D Stage & attached to @TouringData X reports.'
      );
    } catch {
      setBannerMessage({
        type: 'error',
        text: 'Could not process image file. Try another photo from your gallery.'
      });
    }
    e.target.value = '';
  };

  const handleShareBannerToX = () => {
    const res = shareTourBannerPromoToX(state, customBannerUrl, tourTitle);
    if (!res.success) {
      setBannerMessage({
        type: 'error',
        text: res.error || 'Could not post banner to X.'
      });
      return;
    }
    setState(res.updatedState);
    setBannerMessage({
      type: 'success',
      text: 'Official Tour Banner & Boxscore Report posted to @TouringData on X! (+1.5 Hype)'
    });
  };

  const applyQuickPresaleWindow = (daysFromNow: number) => {
    const d = new Date(state.date);
    d.setDate(d.getDate() + daysFromNow);
    const nextKickoff = d.toISOString().split('T')[0];
    setKickoffDate(nextKickoff);
    setSelectedStops(prev =>
      prev.map(({ cityId, venueTier }) => ({ cityId, venueTier }))
    );
  };

  const updateStageConfig = (patch: Partial<TourStageConfig>) => {
    const next = { ...stageConfig, ...patch };
    setStageConfig(next);
    setState(prev => {
      const ts = ensureWorldTourState(prev);
      return {
        ...prev,
        ...({
          tourState: {
            ...ts,
            draftStageConfig: next,
            activeTour: ts.activeTour
              ? { ...ts.activeTour, stageConfig: next }
              : null
          }
        } as any)
      };
    });
  };

  const stageMetrics = useMemo(
    () => evaluateStageArchitectureMetrics(stageConfig),
    [stageConfig]
  );

  const recommendedTierByCity = useMemo(() => {
    const map: Record<string, VenueTierId> = {};
    const pop = state.popularity || 5;
    const rec: VenueTierId =
      pop >= 72
        ? 'stadium'
        : pop >= 44
        ? 'arena'
        : pop >= 20
        ? 'theater'
        : 'club';
    GLOBAL_TOUR_CITIES.forEach(c => {
      map[c.id] = rec;
    });
    return map;
  }, [state.popularity]);

  // Compute resolved schedule dates & financial projections for the Planner
  const plannerProjections = useMemo(() => {
    let totalCap = 0;
    let totalProjAttendance = 0;
    let totalVirtualQueue = 0;
    let totalProjGross = 0;
    let totalProjMerch = 0;
    let totalProjNet = 0;

    const baseKickoff = new Date(`${kickoffDate}T00:00:00`);
    const safeBase = isNaN(baseKickoff.getTime())
      ? new Date(state.date)
      : baseKickoff;

    const stopPreviews = selectedStops.map((st, idx) => {
      const city =
        GLOBAL_TOUR_CITIES.find(c => c.id === st.cityId) ||
        GLOBAL_TOUR_CITIES[0];
      const d = new Date(safeBase);
      d.setDate(d.getDate() + idx * Math.max(1, daysBetweenShows));
      const resolvedDate = st.customDate || d.toISOString().split('T')[0];

      const est = estimateCityShowDemand({
        state,
        city,
        venueTier: st.venueTier,
        stageConfig,
        gaPrice,
        nosebleedPrice,
        lowerBowlPrice,
        floorStandingPrice,
        goldenCirclePrice,
        vipPackagePrice,
        vipPerks,
        antiScalperExchangeEnabled,
        dynamicPlatinumEnabled,
        openingActNpcIds,
        presaleStrategy
      });

      totalCap += city.venues[st.venueTier].capacity;
      totalProjAttendance += est.projectedAttendance;
      totalVirtualQueue += est.estimatedVirtualQueue;
      totalProjGross += est.projectedTicketGross + est.projectedMerchGross;
      totalProjMerch += est.projectedMerchGross;
      totalProjNet += est.projectedNetProfit;

      return {
        ...st,
        cityDef: city,
        venueSpec: city.venues[st.venueTier],
        resolvedDate,
        est
      };
    });

    const sampleCity =
      GLOBAL_TOUR_CITIES.find(c => c.id === selectedMapCityId) ||
      GLOBAL_TOUR_CITIES[0];
    const sampleVenueTier = recommendedTierByCity[sampleCity.id] || 'arena';
    const sampleEst = estimateCityShowDemand({
      state,
      city: sampleCity,
      venueTier: sampleVenueTier,
      stageConfig,
      gaPrice,
      nosebleedPrice,
      lowerBowlPrice,
      floorStandingPrice,
      goldenCirclePrice,
      vipPackagePrice,
      vipPerks,
      antiScalperExchangeEnabled,
      dynamicPlatinumEnabled,
      openingActNpcIds,
      presaleStrategy
    });

    return {
      stopPreviews,
      totalCap,
      totalProjAttendance,
      totalVirtualQueue,
      totalProjGross,
      totalProjMerch,
      totalProjNet,
      elasticityVerdict: sampleEst.priceElasticityVerdict,
      sampleTierBreakdown: sampleEst.tierBreakdown,
      sampleVenueName: `${sampleCity.venues[sampleVenueTier].venueName} (${sampleCity.city})`
    };
  }, [
    selectedStops,
    kickoffDate,
    daysBetweenShows,
    presaleStrategy,
    state,
    stageConfig,
    gaPrice,
    nosebleedPrice,
    lowerBowlPrice,
    floorStandingPrice,
    goldenCirclePrice,
    vipPackagePrice,
    vipPerks,
    antiScalperExchangeEnabled,
    dynamicPlatinumEnabled,
    openingActNpcIds,
    selectedMapCityId,
    recommendedTierByCity
  ]);

  // Live Presale & Queue summary for Active Tour
  const activePresaleSummary = useMemo(() => {
    if (!activeTour) return null;
    const totalCapacity = activeTour.stops.reduce((s, st) => s + st.capacity, 0);
    const totalPresaleSold = activeTour.stops.reduce(
      (s, st) =>
        s +
        (st.status === 'completed'
          ? st.ticketsSold || 0
          : st.presaleTicketsSold || 0),
      0
    );
    const totalVirtualQueue = activeTour.stops
      .filter(s => s.status === 'scheduled')
      .reduce((s, st) => s + (st.virtualQueueCount || 0), 0);
    const totalPresaleRevenue = activeTour.stops.reduce(
      (s, st) =>
        s +
        (st.status === 'completed'
          ? (st.ticketGross || 0) + (st.vipGross || 0)
          : st.presaleRevenueCollected || 0),
      0
    );
    const overallPct = Math.min(
      100,
      Math.round((totalPresaleSold / Math.max(1, totalCapacity)) * 100)
    );
    return {
      totalCapacity,
      totalPresaleSold,
      totalVirtualQueue,
      totalPresaleRevenue,
      overallPct
    };
  }, [activeTour]);

  const handleQuickAddStop = (cityId: string, venueTier: VenueTierId) => {
    setSelectedStops(prev => [...prev, { cityId, venueTier }]);
    const cityObj = GLOBAL_TOUR_CITIES.find(c => c.id === cityId);
    setBannerMessage({
      type: 'success',
      text: `Added ${cityObj?.city} (${cityObj?.venues[venueTier].venueName}) to tour routing.`
    });
  };

  const handleApplyRegionalLegPreset = (
    region: 'na' | 'eu' | 'asia' | 'world_stadium'
  ) => {
    const defaultTier = recommendedTierByCity['los_angeles'] || 'arena';
    if (region === 'na') {
      setSelectedStops([
        { cityId: 'los_angeles', venueTier: defaultTier },
        { cityId: 'chicago', venueTier: defaultTier },
        { cityId: 'toronto', venueTier: defaultTier },
        { cityId: 'new_york', venueTier: defaultTier },
        { cityId: 'atlanta', venueTier: defaultTier },
        { cityId: 'miami', venueTier: defaultTier }
      ]);
    } else if (region === 'eu') {
      setSelectedStops([
        { cityId: 'london', venueTier: defaultTier },
        { cityId: 'paris', venueTier: defaultTier },
        { cityId: 'amsterdam', venueTier: defaultTier },
        { cityId: 'berlin', venueTier: defaultTier },
        { cityId: 'milan', venueTier: defaultTier },
        { cityId: 'madrid', venueTier: defaultTier }
      ]);
    } else if (region === 'asia') {
      setSelectedStops([
        { cityId: 'tokyo', venueTier: defaultTier },
        { cityId: 'seoul', venueTier: defaultTier },
        { cityId: 'manila', venueTier: defaultTier },
        { cityId: 'bangkok', venueTier: defaultTier },
        { cityId: 'singapore', venueTier: defaultTier },
        { cityId: 'jakarta', venueTier: defaultTier }
      ]);
    } else {
      setSelectedStops(
        GLOBAL_TOUR_CITIES.slice(0, 14).map(c => ({
          cityId: c.id,
          venueTier: defaultTier
        }))
      );
    }
  };

  const handleAutoCurateSetlist = () => {
    const sorted = [...releasedSongs].sort(
      (a, b) => (b.streams || 0) - (a.streams || 0)
    );
    const ids = sorted.map(s => s.id);
    if (ids.length === 0) return;
    setSetlist({
      act1SongIds: ids.slice(0, 2),
      act2SongIds:
        ids.slice(2, 5).length > 0 ? ids.slice(2, 5) : ids.slice(0, 2),
      act3SongIds:
        ids.slice(5, 7).length > 0 ? ids.slice(5, 7) : ids.slice(0, 1),
      act4SongIds: ids.slice(0, 2),
      surpriseSongId: ids[ids.length - 1] || ids[0]
    });
    setBannerMessage({
      type: 'success',
      text: 'Auto-curated your highest-streaming catalog tracks across Acts I–IV!'
    });
  };

  const toggleSongInAct = (
    actKey: 'act1SongIds' | 'act2SongIds' | 'act3SongIds' | 'act4SongIds',
    songId: number
  ) => {
    setSetlist(prev => {
      const current = prev[actKey];
      const exists = current.includes(songId);
      const next = exists
        ? current.filter(id => id !== songId)
        : [...current, songId];
      return { ...prev, [actKey]: next };
    });
  };

  const handleChangeZonePrice = (zoneId: SeatingZoneId, newPrice: number) => {
    if (zoneId === 'nosebleed') setNosebleedPrice(newPrice);
    else if (zoneId === 'lower_bowl') setLowerBowlPrice(newPrice);
    else if (zoneId === 'floor_standing') setFloorStandingPrice(newPrice);
    else if (zoneId === 'golden_circle') setGoldenCirclePrice(newPrice);
    else if (zoneId === 'vip_package') setVipPackagePrice(newPrice);
  };

  const handleAutoOptimizePrices = () => {
    const pop = state.popularity || 10;
    const prod = stageMetrics.productionScore;
    setNosebleedPrice(
      Math.min(180, Math.max(30, Math.round(28 + pop * 0.85 + prod * 0.14)))
    );
    setLowerBowlPrice(
      Math.min(310, Math.max(50, Math.round(48 + pop * 1.38 + prod * 0.25)))
    );
    setFloorStandingPrice(
      Math.min(380, Math.max(65, Math.round(62 + pop * 1.7 + prod * 0.34)))
    );
    setGoldenCirclePrice(
      Math.min(620, Math.max(95, Math.round(98 + pop * 2.45 + prod * 0.55)))
    );
    setVipPackagePrice(
      Math.min(1250, Math.max(195, Math.round(215 + pop * 4.5 + prod * 1.1)))
    );
    setBannerMessage({
      type: 'success',
      text: 'Auto-balanced all 5 stadium seating zones for maximum sell-out speed & boxscore yield!'
    });
  };

  const handleToggleVipPerk = (perkKey: keyof TourVipPerksConfig) => {
    setVipPerks(prev => ({ ...prev, [perkKey]: !prev[perkKey] }));
  };

  const handleLaunchTour = () => {
    const res = launchNewWorldTour({
      state,
      title: tourTitle,
      eraProjectId,
      kickoffDate,
      daysBetweenShows,
      presaleStrategy,
      customBannerUrl,
      stageConfig: {
        ...stageConfig,
        customBannerUrl,
        backdropCover: customBannerUrl || stageConfig.backdropCover
      },
      setlist,
      openingActNpcIds,
      sponsorId,
      gaPrice,
      nosebleedPrice,
      lowerBowlPrice,
      floorStandingPrice,
      goldenCirclePrice,
      vipPackagePrice,
      vipPerks,
      antiScalperExchangeEnabled,
      dynamicPlatinumEnabled,
      selectedStops
    });

    if (!res.success) {
      setBannerMessage({
        type: 'error',
        text: res.error || 'Could not launch World Tour.'
      });
      return;
    }

    setState(res.updatedState);
    setBannerMessage({
      type: 'success',
      text: `"${tourTitle}" Presale Queue is LIVE & Official Tour Banner posted to @TouringData on X!`
    });
    setActiveTab('overview');
  };

  const handleSendVerifiedFanBlast = () => {
    const res = triggerVerifiedFanPresaleBlast(state);
    if (!res.success) {
      setBannerMessage({
        type: 'error',
        text: res.error || 'Could not send Presale Blast.'
      });
      return;
    }
    setState(res.updatedState);
    setBannerMessage({
      type: 'success',
      text: 'Verified Fan Presale Code Blast dispatched! Presale ticket claims surged +16% across all dates.'
    });
  };

  const handleUnlockProductionHold = (stopId: string) => {
    const res = unlockProductionHoldSeats(state, stopId);
    if (!res.success) {
      setBannerMessage({
        type: 'error',
        text: res.error || 'Could not unlock production-hold seats.'
      });
      return;
    }
    setState(res.updatedState);
    setBannerMessage({
      type: 'success',
      text: 'Released +8.5% Side-Stage & Production-Hold seats to meet sold-out demand!'
    });
  };

  const handleFlashSalePriceDrop = (stopId: string) => {
    const res = triggerFlashSalePriceDrop(state, stopId);
    if (!res.success) {
      setBannerMessage({
        type: 'error',
        text: res.error || 'Could not apply Last-Minute Flash Price Drop.'
      });
      return;
    }
    setState(res.updatedState);
    setBannerMessage({
      type: 'success',
      text: '⚡ Last-Minute Flash Sale (-20%) triggered! Remaining stadium inventory surged +22%!'
    });
  };

  const handleRescheduleStop = (stopId: string, newDate: string) => {
    if (!newDate) return;
    const res = rescheduleTourStopDate(state, stopId, newDate);
    if (res.success) {
      setState(res.updatedState);
      setBannerMessage({
        type: 'success',
        text: `Updated concert date to ${newDate}.`
      });
    }
  };

  const handleAddExtraNight = (stopId: string) => {
    const res = addSoldOutExtraNightToTour(state, stopId);
    if (!res.success) {
      setBannerMessage({
        type: 'error',
        text: res.error || 'Cannot add extra date.'
      });
      return;
    }
    setState(res.updatedState);
    setBannerMessage({
      type: 'success',
      text: 'Added Sold-Out Extra Residency Night due to overwhelming presale demand!'
    });
  };

  const handleVocalRecovery = () => {
    const res = purchaseTourVocalRecovery(state);
    if (!res.success) {
      setBannerMessage({
        type: 'error',
        text: res.error || 'Insufficient funds.'
      });
      return;
    }
    setState(res.updatedState);
    setBannerMessage({
      type: 'success',
      text: 'Vocal Coach & Medical IV Recovery restored +32% Stamina!'
    });
  };

  const globalLeaderboard = useMemo(() => {
    const list = buildGlobalTourBoxscoreLeaderboard(state);
    if (leaderboardSort === 'attendance') {
      return [...list].sort((a, b) => b.totalAttendance - a.totalAttendance);
    }
    if (leaderboardSort === 'avg') {
      return [...list].sort((a, b) => b.avgGrossPerShow - a.avgGrossPerShow);
    }
    return list;
  }, [state, leaderboardSort]);

  const candidateOpeners = useMemo(() => {
    const pName = artistName.toLowerCase();
    return DETAILED_NPCS.filter(
      n => n.name.toLowerCase() !== pName && (n.pop || 50) <= 86
    ).slice(0, 18);
  }, [artistName]);

  // Reusable Mobile-Friendly Tour Banner Uploader & X Poster Card
  const renderTourBannerStudioCard = (compactMode = false) => {
    const activeBannerImg =
      activeTour?.customBannerUrl ||
      activeTour?.coverArt ||
      customBannerUrl ||
      stageConfig.backdropCover ||
      state.artist?.image ||
      '';

    return (
      <div className="p-3.5 rounded-2xl bg-[#0E1322] border border-rose-400/35 space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
              Official Tour Poster &amp; X Report Banner
            </span>
            <h3 className="text-xs font-black text-white">
              Upload Custom Tour Banner (Phone Gallery / URL)
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[9px] font-mono text-sky-300 shrink-0">
            @TouringData X Ready
          </span>
        </div>

        {/* Live 16:9 Widescreen Tour Banner Preview */}
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black/70 border border-white/15">
          {activeBannerImg ? (
            <img
              src={activeBannerImg}
              alt="Official Tour Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
              No Tour Banner Selected
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono text-[8.5px] font-black uppercase tracking-wider">
                  OFFICIAL WORLD TOUR POSTER
                </span>
                <div className="text-sm font-black text-white truncate mt-1">
                  {activeTour ? activeTour.title : tourTitle}
                </div>
                <div className="text-[10px] font-mono text-zinc-300 truncate">
                  {artistName} • Kickoff:{' '}
                  {activeTour ? activeTour.kickoffDate : kickoffDate}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white text-zinc-950 font-black text-[10.5px] shadow-md active:scale-95 transition cursor-pointer shrink-0"
              >
                📱 Upload Photo
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Native Phone Gallery File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleMobileBannerFileUpload}
          className="hidden"
        />

        {/* Quick Action Row: Upload From Phone Gallery + Share Banner to X */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 border border-rose-400/45 text-rose-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <i className="ph-bold ph-image text-sm" />
            <span>Choose From Phone</span>
          </button>

          <button
            type="button"
            onClick={handleShareBannerToX}
            className="py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 border border-sky-400/45 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <i className="ph-bold ph-share-network text-sm" />
            <span>Post Banner to X</span>
          </button>
        </div>

        {!compactMode && (
          <>
            {/* Paste Image URL Option */}
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={bannerUrlInput}
                onChange={e => setBannerUrlInput(e.target.value)}
                placeholder="Or paste custom image URL (https://...)"
                className="flex-1 px-3 py-2 rounded-xl bg-black/55 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (bannerUrlInput.trim()) {
                    applyNewTourBanner(
                      bannerUrlInput.trim(),
                      'Applied custom Tour Banner URL!'
                    );
                    setBannerUrlInput('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0 cursor-pointer"
              >
                Apply URL
              </button>
            </div>

            {/* Era Album Cover Quick Presets */}
            {releasedProjects.length > 0 && (
              <div>
                <span className="text-[9.5px] font-mono uppercase text-zinc-400 block mb-1.5">
                  Or Pick Era Album Artwork as Tour Banner:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {releasedProjects.map(proj => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() =>
                        applyNewTourBanner(
                          proj.cover,
                          `Selected "${proj.title}" artwork as Tour Banner.`
                        )
                      }
                      className={`flex items-center gap-2 p-1.5 rounded-xl border shrink-0 cursor-pointer active:scale-95 transition ${
                        activeBannerImg === proj.cover
                          ? 'bg-rose-500/20 border-rose-400'
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <img
                        src={proj.cover}
                        alt={proj.title}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <span className="text-[10px] font-bold text-white pr-1">
                        {proj.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05070D] text-white flex flex-col max-w-md mx-auto overflow-hidden select-none">
      {/* Mobile-Optimized Executive Touring Header */}
      <header className="px-3.5 pt-3.5 pb-2.5 bg-[#0B0E18]/95 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/30 via-amber-400/20 to-sky-500/25 border border-rose-400/45 flex items-center justify-center shrink-0">
              <i className="ph-fill ph-globe-hemisphere-west text-rose-400 text-xl" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-white truncate">
                  WORLD TOUR STUDIO
                </h1>
                {activeTour && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-mono font-bold">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 truncate font-mono">
                3D Stage • Presale Queue • @TouringData Banner
              </p>
            </div>
          </div>

          <button
            onClick={closeApp}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-zinc-200 cursor-pointer shrink-0"
          >
            <i className="ph-bold ph-x text-base" />
          </button>
        </div>

        {/* Thumb-Friendly 5-Tab Navigation Bar */}
        <div className="grid grid-cols-5 gap-1 mt-2.5 p-1 bg-[#111524] rounded-xl border border-white/10">
          {[
            { id: 'overview' as const, icon: 'ph-map-trifold', label: 'Tour' },
            { id: 'stage' as const, icon: 'ph-cube-focus', label: '3D Stage' },
            {
              id: 'planner' as const,
              icon: 'ph-calendar-plus',
              label: activeTour ? 'New Tour' : 'Plan Tour'
            },
            { id: 'boxscore' as const, icon: 'ph-receipt', label: 'Boxscore' },
            { id: 'leaderboard' as const, icon: 'ph-trophy', label: 'Rank' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className={`ph-bold ${tab.icon} text-xs`} />
              <span className="truncate leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Scrollable Viewport */}
      <div className="flex-1 overflow-y-auto pb-28 space-y-3.5">
        {bannerMessage && (
          <div
            className={`mx-3.5 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              bannerMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}
          >
            <span>{bannerMessage.text}</span>
            <button
              onClick={() => setBannerMessage(null)}
              className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer shrink-0"
            >
              <i className="ph-bold ph-x" />
            </button>
          </div>
        )}

        {/* =====================================================================
            TAB 1: ACTIVE TOUR, BANNER HERO, PRESALE QUEUE & WORLD MAP
           ===================================================================== */}
        {activeTab === 'overview' && (
          <div className="px-3.5 mt-3 space-y-3.5">
            {/* Vocal Stamina & Lifetime Touring Telemetry */}
            <div className="p-3.5 rounded-2xl bg-[#0E1220] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Artist Vocal &amp; Touring Stamina
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-sm font-mono font-black ${
                        tourState.vocalStamina >= 60
                          ? 'text-emerald-400'
                          : tourState.vocalStamina >= 35
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tourState.vocalStamina}%
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {tourState.vocalStamina >= 60
                        ? 'Optimal Live Condition'
                        : 'Vocal Fatigue — IV Recovery Advised'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleVocalRecovery}
                  className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-400/35 text-emerald-300 text-[10.5px] font-mono font-bold cursor-pointer shrink-0"
                >
                  +32% Vocal IV ($12.5K)
                </button>
              </div>

              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    tourState.vocalStamina >= 60
                      ? 'bg-emerald-400'
                      : tourState.vocalStamina >= 35
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${tourState.vocalStamina}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 font-mono tabular-nums text-center">
                <div>
                  <div className="text-[10px] text-zinc-400 font-sans">
                    Lifetime Boxscore
                  </div>
                  <div className="text-xs font-black text-emerald-400 mt-0.5">
                    ${formatNum(tourState.lifetimeTourGross)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 font-sans">
                    Tickets Sold
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    {formatNum(tourState.lifetimeTourAttendance)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 font-sans">
                    Shows Played
                  </div>
                  <div className="text-xs font-black text-amber-300 mt-0.5">
                    {tourState.lifetimeShowsPlayed}
                  </div>
                </div>
              </div>
            </div>

            {activeTour && activePresaleSummary ? (
              <div className="space-y-3.5">
                {/* Official Tour Banner Hero & Live Presale Command Card */}
                <div className="rounded-2xl bg-[#0F1322] border border-rose-400/40 overflow-hidden shadow-xl">
                  {/* Widescreen Tour Banner Header */}
                  <div className="relative w-full aspect-[16/8.5] bg-black">
                    {(activeTour.customBannerUrl || activeTour.coverArt) && (
                      <img
                        src={activeTour.customBannerUrl || activeTour.coverArt}
                        alt={activeTour.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1322] via-black/45 to-transparent flex flex-col justify-between p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-mono text-[9.5px] font-black uppercase">
                          {activeTour.eraProjectTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/70 border border-white/15 font-mono text-[10px] font-bold text-amber-300">
                          {activeTour.totalShowsCompleted}/
                          {activeTour.stops.length} Played
                        </span>
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="text-base font-black text-white truncate">
                            {activeTour.title}
                          </h2>
                          <p className="text-[10.5px] font-mono text-zinc-300">
                            Kickoff: {activeTour.kickoffDate} • Every{' '}
                            {activeTour.daysBetweenShows} Days
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-xs border border-white/20 text-white text-[10px] font-bold cursor-pointer active:scale-95"
                          >
                            📱 Change Banner
                          </button>
                          <button
                            type="button"
                            onClick={handleShareBannerToX}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-[10px] font-black cursor-pointer active:scale-95"
                          >
                            Post to X
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hidden File Input for Active Tour Banner Change */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMobileBannerFileUpload}
                    className="hidden"
                  />

                  <div className="p-3.5 space-y-3">
                    {/* Presale Progress Bar */}
                    <div className="p-2.5 rounded-xl bg-black/45 border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-sky-300 font-bold uppercase">
                          🎟️ Ticketmaster Presale ({activePresaleSummary.overallPct}
                          %)
                        </span>
                        <span className="text-white font-bold">
                          {formatNumFull(activePresaleSummary.totalPresaleSold)}{' '}
                          / {formatNumFull(activePresaleSummary.totalCapacity)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 transition-all"
                          style={{
                            width: `${activePresaleSummary.overallPct}%`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
                        <span>
                          Queue:{' '}
                          <strong className="text-amber-300">
                            {formatNumFull(
                              activePresaleSummary.totalVirtualQueue
                            )}{' '}
                            waiting
                          </strong>
                        </span>
                        <span>
                          Escrow:{' '}
                          <strong className="text-emerald-400">
                            $
                            {formatNum(
                              activePresaleSummary.totalPresaleRevenue
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Spotify Fans First / Verified Fan Code Blast CTA */}
                    {!activeTour.fansFirstBlastSent && (
                      <button
                        type="button"
                        onClick={handleSendVerifiedFanBlast}
                        className="w-full py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 border border-sky-400/40 text-sky-200 text-xs font-bold flex items-center justify-between cursor-pointer transition"
                      >
                        <span>📲 Send Verified Fan Presale Code Blast</span>
                        <span className="font-mono text-[10px] text-emerald-300 font-black">
                          +16% Surge
                        </span>
                      </button>
                    )}

                    {/* Realized Tour Financials */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 font-mono tabular-nums text-[11px] text-center">
                      <div>
                        <div className="text-[10px] text-zinc-400 font-sans">
                          Boxscore Gross
                        </div>
                        <div className="font-bold text-white">
                          ${formatNum(activeTour.totalTicketGross)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-sans">
                          Merch Booth
                        </div>
                        <div className="font-bold text-sky-300">
                          ${formatNum(activeTour.totalMerchBoothGross)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-sans">
                          Net Profit
                        </div>
                        <div
                          className={`font-bold ${
                            activeTour.totalNetProfit >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          ${formatNum(activeTour.totalNetProfit)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Global Flight Route Map */}
                <TourWorldMap
                  stops={activeTour.stops.map(s => ({
                    cityId: s.cityId,
                    venueTier: s.venueTier,
                    status: s.status,
                    nightNumber: s.nightNumber,
                    presaleSelloutPct: s.presaleSelloutPct
                  }))}
                  selectedCityId={selectedMapCityId}
                  onSelectCity={city => setSelectedMapCityId(city.id)}
                  interactiveMode="active_tour"
                  recommendedTierByCity={recommendedTierByCity}
                />

                {/* Stop-by-Stop Presale, Rescheduling & Residency Controls */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Tour Dates, Presale &amp; Extra Nights
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Today: {currentGameDateStr}
                    </span>
                  </div>

                  {activeTour.stops.map(stop => {
                    const presalePct =
                      stop.status === 'completed'
                        ? stop.selloutPct || 100
                        : stop.presaleSelloutPct || 0;
                    const presaleSold =
                      stop.status === 'completed'
                        ? stop.ticketsSold || stop.capacity
                        : stop.presaleTicketsSold || 0;

                    return (
                      <div
                        key={stop.id}
                        className={`p-3 rounded-xl border transition space-y-2 ${
                          stop.status === 'completed'
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-[#0F1322] border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] font-bold text-zinc-200">
                                #{stop.stopNumber} • Night {stop.nightNumber}
                              </span>
                              <span className="text-xs font-black text-white">
                                {stop.cityName} ({stop.countryCode})
                              </span>
                              {stop.status === 'completed' ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                                  PLAYED • {stop.selloutPct}%
                                </span>
                              ) : (
                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                    presalePct >= 100
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                                      : presalePct >= 88
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/35'
                                      : 'bg-sky-500/20 text-sky-300'
                                  }`}
                                >
                                  {stop.presalePhase === 'sold_out' ||
                                  presalePct >= 100
                                    ? '100% SOLD OUT'
                                    : presalePct >= 88
                                    ? `🔥 FAST SELLING (${presalePct}%)`
                                    : `${presalePct}% PRESALE`}
                                </span>
                              )}
                              {stop.flashSaleApplied && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[8.5px] font-bold">
                                  ⚡ FLASH -20%
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                              {stop.venueName} • Cap:{' '}
                              {formatNumFull(stop.capacity)}
                            </div>
                          </div>

                          {stop.status === 'completed' &&
                          stop.totalGross !== undefined ? (
                            <div className="text-right font-mono tabular-nums shrink-0">
                              <div className="text-xs font-black text-emerald-400">
                                +${formatNum(stop.totalGross)}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                {formatNumFull(stop.ticketsSold || 0)} sold
                              </div>
                            </div>
                          ) : (
                            <div className="text-right shrink-0">
                              <input
                                type="date"
                                value={stop.scheduledDate}
                                min={currentGameDateStr}
                                onChange={e =>
                                  handleRescheduleStop(stop.id, e.target.value)
                                }
                                className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[10px] font-mono text-amber-300 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>

                        {stop.status === 'scheduled' && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                              <span>
                                Claimed:{' '}
                                <strong className="text-white">
                                  {formatNumFull(presaleSold)} /{' '}
                                  {formatNumFull(stop.capacity)}
                                </strong>
                              </span>
                              <span>
                                Queue:{' '}
                                <strong className="text-sky-300">
                                  {formatNumFull(stop.virtualQueueCount || 0)}
                                </strong>
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  presalePct >= 95
                                    ? 'bg-emerald-400'
                                    : presalePct >= 85
                                    ? 'bg-amber-400'
                                    : 'bg-sky-400'
                                }`}
                                style={{ width: `${presalePct}%` }}
                              />
                            </div>

                            {/* 5-Zone Stadium Seating Mini Breakdown */}
                            {stop.tierSelloutPcts && (
                              <div className="grid grid-cols-5 gap-1 pt-1">
                                {[
                                  {
                                    id: 'nosebleed' as const,
                                    label: '300-Lvl'
                                  },
                                  {
                                    id: 'lower_bowl' as const,
                                    label: '100-Lvl'
                                  },
                                  {
                                    id: 'floor_standing' as const,
                                    label: 'Floor'
                                  },
                                  {
                                    id: 'golden_circle' as const,
                                    label: 'Gold Pit'
                                  },
                                  { id: 'vip_package' as const, label: 'VIP' }
                                ].map(z => {
                                  const zPct =
                                    stop.tierSelloutPcts?.[z.id] ?? presalePct;
                                  return (
                                    <div
                                      key={z.id}
                                      className="px-1.5 py-1 rounded bg-black/40 border border-white/5 text-center font-mono"
                                    >
                                      <div className="text-[8px] text-zinc-400 truncate">
                                        {z.label}
                                      </div>
                                      <div
                                        className={`text-[9.5px] font-bold ${
                                          zPct >= 95
                                            ? 'text-emerald-400'
                                            : zPct >= 80
                                            ? 'text-amber-300'
                                            : 'text-sky-300'
                                        }`}
                                      >
                                        {zPct}%
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {stop.status === 'scheduled' &&
                          (stop.canAddExtraNight ||
                            (presalePct >= 88 &&
                              !stop.productionHoldUnlocked) ||
                            (presalePct < 92 && !stop.flashSaleApplied)) && (
                            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                              {presalePct < 92 && !stop.flashSaleApplied && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFlashSalePriceDrop(stop.id)
                                  }
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 border border-rose-400/40 text-rose-200 text-[10px] font-mono font-bold cursor-pointer"
                                >
                                  ⚡ Flash Price Drop (-20% • +22% Sales)
                                </button>
                              )}

                              {presalePct >= 88 &&
                                !stop.productionHoldUnlocked && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUnlockProductionHold(stop.id)
                                    }
                                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 border border-sky-400/40 text-sky-200 text-[10px] font-mono font-bold cursor-pointer"
                                  >
                                    🔓 Unlock Hold Seats (+8.5%)
                                  </button>
                                )}

                              {stop.canAddExtraNight && (
                                <button
                                  type="button"
                                  onClick={() => handleAddExtraNight(stop.id)}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 text-[10px] font-black cursor-pointer"
                                >
                                  + Add Night {stop.nightNumber + 1}
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {renderTourBannerStudioCard(true)}
                <TourWorldMap
                  stops={selectedStops}
                  selectedCityId={selectedMapCityId}
                  onSelectCity={city => setSelectedMapCityId(city.id)}
                  interactiveMode="planner"
                  onQuickAddCityStop={handleQuickAddStop}
                  recommendedTierByCity={recommendedTierByCity}
                />
                <div className="p-4 rounded-2xl bg-[#0F1322] border border-white/10 text-center space-y-3">
                  <h3 className="text-sm font-black text-white">
                    Ready to Launch Your Era World Tour?
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Upload your custom Tour Banner, customize your 3D Stadium Stage, and open the Ticketmaster Presale Queue!
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveTab('stage')}
                      className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold cursor-pointer"
                    >
                      🏟️ 3D Stage Architect
                    </button>
                    <button
                      onClick={() => setActiveTab('planner')}
                      className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-95 text-white text-xs font-black cursor-pointer"
                    >
                      🗓️ Plan &amp; Launch →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: MOBILE-ERGONOMIC 3D STAGE ARCHITECT & FX STUDIO
           ===================================================================== */}
        {activeTab === 'stage' && (
          <div className="px-3.5 mt-3 space-y-3.5">
            {/* Multi-Angle Interactive Stage Preview Always Visible on Top */}
            <TourStagePreview config={stageConfig} artistName={artistName} />

            {/* Thumb-Friendly Sub-Navigation Pills so Phone Users Don't Scroll Forever */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#111524] rounded-xl border border-white/10">
              {[
                { id: 'main_rig' as const, label: '1. Main Rig' },
                { id: 'catwalk' as const, label: '2. Catwalk' },
                { id: 'fx' as const, label: '3. Light & FX' },
                { id: 'banner' as const, label: '4. Banner' }
              ].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setStageSubSection(sub.id)}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95 ${
                    stageSubSection === sub.id
                      ? 'bg-sky-400 text-zinc-950 font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-SECTION 1: MAIN STAGE ARCHITECTURE */}
            {stageSubSection === 'main_rig' && (
              <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Select Main Stage Architecture
                </h3>
                <div className="space-y-2">
                  {MAIN_STAGE_ARCHITECTURES.map(arch => {
                    const selected = stageConfig.mainStageId === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() =>
                          updateStageConfig({ mainStageId: arch.id })
                        }
                        className={`w-full text-left p-3 rounded-xl border transition cursor-pointer active:scale-99 flex items-center justify-between gap-2 ${
                          selected
                            ? 'bg-rose-500/15 border-rose-400'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white">
                            {arch.name}
                          </div>
                          <div className="text-[10px] font-mono text-rose-300 mt-0.5">
                            {arch.spanSpec} • {arch.ledResolution}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {arch.subtitle}
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-xs font-bold text-amber-300">
                            ${formatNumFull(arch.buildCost)}
                          </div>
                          <div className="text-[9px] text-zinc-400">
                            +{arch.prodScore} Prod
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-SECTION 2: CATWALK & B-STAGE */}
            {stageSubSection === 'catwalk' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-sky-400">
                    Catwalk &amp; Runway Geometry
                  </h3>
                  <div className="space-y-2">
                    {RUNWAY_CATWALK_OPTIONS.map(rw => {
                      const selected = stageConfig.runwayId === rw.id;
                      return (
                        <button
                          key={rw.id}
                          type="button"
                          onClick={() => updateStageConfig({ runwayId: rw.id })}
                          className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            selected
                              ? 'bg-sky-500/15 border-sky-400'
                              : 'bg-black/40 border-white/10'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              {rw.name}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {rw.subtitle}
                            </div>
                          </div>
                          <div className="text-right font-mono text-[11px] text-sky-300 shrink-0">
                            ${formatNumFull(rw.buildCost)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Secondary B-Stage Island
                  </h3>
                  <div className="space-y-2">
                    {B_STAGE_MODULES.map(bs => {
                      const selected = stageConfig.bStageId === bs.id;
                      return (
                        <button
                          key={bs.id}
                          type="button"
                          onClick={() => updateStageConfig({ bStageId: bs.id })}
                          className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            selected
                              ? 'bg-amber-500/15 border-amber-400'
                              : 'bg-black/40 border-white/10'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              {bs.name}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {bs.subtitle}
                            </div>
                          </div>
                          <div className="text-right font-mono text-[11px] text-amber-300 shrink-0">
                            ${formatNumFull(bs.buildCost)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SECTION 3: ERA LIGHTING & CONCERT FX */}
            {stageSubSection === 'fx' && (
              <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Era Lighting Palette &amp; Concert FX Rig
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {ERA_LIGHTING_THEMES.map(th => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() =>
                        updateStageConfig({ lightingThemeId: th.id })
                      }
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer active:scale-95 ${
                        stageConfig.lightingThemeId === th.id
                          ? 'bg-white/15 border-white'
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-white/30"
                        style={{ backgroundColor: th.primaryHex }}
                      />
                      <span className="text-[11px] font-bold text-white truncate">
                        {th.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  {[
                    {
                      key: 'hasPyro' as const,
                      label: '🔥 Stadium Pyrotechnics & Flame Jets',
                      cost: '$32K • +7 Prod'
                    },
                    {
                      key: 'hasLaserMatrix' as const,
                      label: '⚡ 64-Unit Laser Matrix & Cryo CO2',
                      cost: '$40K • +7 Prod'
                    },
                    {
                      key: 'hasPixMobWristbands' as const,
                      label: '⌚ Synchronized LED Crowd Wristbands',
                      cost: '$25K • +6 Prod'
                    },
                    {
                      key: 'hasDroneSkyShow' as const,
                      label: '🛸 600-Drone Stadium Sky Formation',
                      cost: '$95K • +5 Prod'
                    },
                    {
                      key: 'hasLiveBandAndDancers' as const,
                      label: '💃 Live Band & 24 Choreography Dancers',
                      cost: '$45K • +8 Prod'
                    }
                  ].map(fx => (
                    <button
                      key={fx.key}
                      type="button"
                      onClick={() =>
                        updateStageConfig({ [fx.key]: !stageConfig[fx.key] })
                      }
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer active:scale-99 ${
                        stageConfig[fx.key]
                          ? 'bg-emerald-500/15 border-emerald-400/50'
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold text-white">
                        {fx.label}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold shrink-0">
                        {stageConfig[fx.key] ? 'ACTIVE ✓' : fx.cost}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-SECTION 4: STAGE LED TEXT & CUSTOM TOUR BANNER */}
            {stageSubSection === 'banner' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-2.5">
                  <label className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Main 8K LED Wall Typography Text
                  </label>
                  <input
                    type="text"
                    value={stageConfig.stageBannerText}
                    onChange={e =>
                      updateStageConfig({ stageBannerText: e.target.value })
                    }
                    maxLength={32}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                {renderTourBannerStudioCard(false)}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 3: MOBILE 4-STEP TOUR PLANNER WIZARD (PHONE USER ERGONOMICS)
           ===================================================================== */}
        {activeTab === 'planner' && (
          <div className="px-3.5 mt-3 space-y-3.5">
            {/* Step-by-Step Mobile Wizard Progress Bar */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#111524] rounded-xl border border-white/10">
              {[
                { step: 1 as const, label: '1. Banner & Date' },
                { step: 2 as const, label: '2. Map & Venues' },
                { step: 3 as const, label: '3. Tickets & VIP' },
                { step: 4 as const, label: '4. Setlist & Go' }
              ].map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setPlannerStep(s.step)}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95 ${
                    plannerStep === s.step
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* WIZARD STEP 1: TOUR BANNER UPLOAD, TITLE, KICKOFF DATE & PRESALE */}
            {plannerStep === 1 && (
              <div className="space-y-3.5">
                {renderTourBannerStudioCard(false)}

                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                    Tour Title &amp; Era Album Link
                  </h3>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Official World Tour Title
                    </label>
                    <input
                      type="text"
                      value={tourTitle}
                      onChange={e => setTourTitle(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs font-bold text-white"
                      placeholder="e.g. The Midnight Era World Tour"
                    />
                  </div>

                  {releasedProjects.length > 0 && (
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Associated Era Album / EP
                      </label>
                      <select
                        value={eraProjectId || ''}
                        onChange={e =>
                          setEraProjectId(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs font-bold text-white"
                      >
                        <option value="">Career Anthology Tour (All Eras)</option>
                        {releasedProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.type.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Kickoff Date & Ticketmaster Presale Strategy */}
                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Kickoff Date &amp; Presale System
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Today: {currentGameDateStr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Kickoff Date (Night 1)
                      </label>
                      <input
                        type="date"
                        value={kickoffDate}
                        min={currentGameDateStr}
                        onChange={e => setKickoffDate(e.target.value)}
                        className="w-full px-2.5 py-2.5 rounded-xl bg-black/60 border border-amber-400/40 text-xs font-mono font-bold text-amber-300 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Show Pacing
                      </label>
                      <select
                        value={daysBetweenShows}
                        onChange={e =>
                          setDaysBetweenShows(Number(e.target.value))
                        }
                        className="w-full px-2.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs font-mono font-bold text-white"
                      >
                        <option value={2}>Every 2 Days</option>
                        <option value={3}>Every 3 Days</option>
                        <option value={4}>Every 4 Days</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Quick Presale Countdown Window:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { days: 5, label: '+5 Days' },
                        { days: 10, label: '+10 Days' },
                        { days: 18, label: '+18 Days' },
                        { days: 30, label: '+30 Days' }
                      ].map(w => (
                        <button
                          key={w.days}
                          type="button"
                          onClick={() => applyQuickPresaleWindow(w.days)}
                          className="py-2 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-[10px] font-mono font-bold text-sky-300 cursor-pointer"
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                      Ticketmaster Presale Queue Strategy:
                    </span>
                    {PRESALE_STRATEGIES.map(ps => {
                      const selected = presaleStrategy === ps.id;
                      return (
                        <button
                          key={ps.id}
                          type="button"
                          onClick={() => setPresaleStrategy(ps.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                            selected
                              ? 'bg-sky-500/15 border-sky-400'
                              : 'bg-black/40 border-white/10'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white">
                              {ps.name}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {ps.subtitle}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-sky-400/15 text-sky-300 font-mono text-[9px] font-bold shrink-0">
                            {ps.scalperProtectionLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPlannerStep(2)}
                  className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-99 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Next: Global Map &amp; Venues (Step 2/4) →
                </button>
              </div>
            )}

            {/* WIZARD STEP 2: INTERACTIVE WORLD MAP & VENUE ROUTING */}
            {plannerStep === 2 && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Global Itinerary ({selectedStops.length} Dates)
                    </h3>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'na' as const, label: 'US/CA' },
                        { id: 'eu' as const, label: 'Europe' },
                        { id: 'asia' as const, label: 'Asia' },
                        { id: 'world_stadium' as const, label: '14-City World' }
                      ].map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            handleApplyRegionalLegPreset(preset.id)
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[9.5px] font-mono font-bold text-zinc-200 cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <TourWorldMap
                    stops={selectedStops}
                    selectedCityId={selectedMapCityId}
                    onSelectCity={c => setSelectedMapCityId(c.id)}
                    interactiveMode="planner"
                    onQuickAddCityStop={handleQuickAddStop}
                    recommendedTierByCity={recommendedTierByCity}
                  />

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {plannerProjections.stopPreviews.map((st, idx) => (
                      <div
                        key={`${st.cityId}_${idx}`}
                        className="p-2.5 rounded-xl bg-black/45 border border-white/10 flex flex-col gap-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-[10px] text-rose-400 font-bold mr-1.5">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-white">
                              {st.cityDef.city}
                            </span>
                            <span className="text-[10px] text-zinc-400 ml-1.5">
                              • {st.venueSpec.venueName}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedStops(prev =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-white/5 text-zinc-400 hover:text-rose-400 flex items-center justify-center cursor-pointer"
                          >
                            <i className="ph-bold ph-trash" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <input
                            type="date"
                            value={st.resolvedDate}
                            min={currentGameDateStr}
                            onChange={e => {
                              const val = e.target.value;
                              setSelectedStops(prev =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? { ...item, customDate: val }
                                    : item
                                )
                              );
                            }}
                            className="bg-[#151928] border border-white/15 rounded-lg px-2 py-1 text-[10px] font-mono text-amber-300"
                          />

                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-mono text-emerald-400">
                              {st.est.projectedSelloutPct}% Est.
                            </span>
                            <select
                              value={st.venueTier}
                              onChange={e => {
                                const newTier = e.target.value as VenueTierId;
                                setSelectedStops(prev =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { ...item, venueTier: newTier }
                                      : item
                                  )
                                );
                              }}
                              className="bg-[#181C2B] border border-white/15 rounded-lg px-2 py-1 text-[10px] font-mono text-white"
                            >
                              <option value="club">Club</option>
                              <option value="theater">Theater</option>
                              <option value="arena">Arena</option>
                              <option value="stadium">Stadium</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlannerStep(1)}
                    className="py-3 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlannerStep(3)}
                    className="py-3 rounded-xl bg-rose-500 text-white font-black text-xs cursor-pointer"
                  >
                    Next: Tickets &amp; VIP →
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 3: 5-TIER INTERACTIVE STADIUM SEATING MAP, VIP PERKS & SPONSORS */}
            {plannerStep === 3 && (
              <div className="space-y-3.5">
                <TourTicketSeatingConsole
                  mode="planner"
                  nosebleedPrice={nosebleedPrice}
                  lowerBowlPrice={lowerBowlPrice}
                  floorStandingPrice={floorStandingPrice}
                  goldenCirclePrice={goldenCirclePrice}
                  vipPackagePrice={vipPackagePrice}
                  vipPerks={vipPerks}
                  antiScalperExchangeEnabled={antiScalperExchangeEnabled}
                  dynamicPlatinumEnabled={dynamicPlatinumEnabled}
                  tierBreakdown={plannerProjections.sampleTierBreakdown}
                  elasticityVerdict={plannerProjections.elasticityVerdict}
                  venueNamePreview={plannerProjections.sampleVenueName}
                  onChangeZonePrice={handleChangeZonePrice}
                  onAutoOptimizePrices={handleAutoOptimizePrices}
                  onToggleVipPerk={handleToggleVipPerk}
                  onToggleAntiScalper={() =>
                    setAntiScalperExchangeEnabled(!antiScalperExchangeEnabled)
                  }
                  onToggleDynamicPlatinum={() =>
                    setDynamicPlatinumEnabled(!dynamicPlatinumEnabled)
                  }
                />

                {/* Corporate Sponsor & NPC Openers */}
                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                    Tour Title Sponsor &amp; NPC Openers
                  </h3>

                  <div className="space-y-1.5">
                    {TOUR_SPONSORS.map(sp => {
                      const locked = (state.popularity || 0) < sp.reqPop;
                      const selected = sponsorId === sp.id;
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          disabled={locked}
                          onClick={() => setSponsorId(sp.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                            locked
                              ? 'opacity-45 bg-black/20 border-white/5 cursor-not-allowed'
                              : selected
                              ? 'bg-amber-500/15 border-amber-400 cursor-pointer'
                              : 'bg-black/40 border-white/10 cursor-pointer'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white">
                              {sp.name}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {sp.tagline}
                            </div>
                          </div>
                          <div className="text-right font-mono text-[10px] shrink-0">
                            {locked ? (
                              <span className="text-rose-400">
                                Req {sp.reqPop} Pop
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold">
                                +${formatNum(sp.upfrontAdvance)} Adv
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1.5">
                      Invite NPC Opening Acts (Max 2):
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {candidateOpeners.map(npc => {
                        const isPicked = openingActNpcIds.includes(npc.id);
                        return (
                          <button
                            key={npc.id}
                            type="button"
                            onClick={() => {
                              setOpeningActNpcIds(prev =>
                                prev.includes(npc.id)
                                  ? prev.filter(id => id !== npc.id)
                                  : prev.length < 2
                                  ? [...prev, npc.id]
                                  : [prev[1], npc.id]
                              );
                            }}
                            className={`p-2 rounded-xl border flex items-center gap-2 shrink-0 cursor-pointer ${
                              isPicked
                                ? 'bg-sky-500/20 border-sky-400'
                                : 'bg-black/40 border-white/10'
                            }`}
                          >
                            <img
                              src={
                                npc.image ||
                                npc.avatar ||
                                getNpcAvatar(npc.name)
                              }
                              alt={npc.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="text-left">
                              <div className="text-[11px] font-bold text-white">
                                {npc.name}
                              </div>
                              <div className="text-[9px] font-mono text-zinc-400">
                                Pop {npc.pop}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlannerStep(2)}
                    className="py-3 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlannerStep(4)}
                    className="py-3 rounded-xl bg-rose-500 text-white font-black text-xs cursor-pointer"
                  >
                    Next: Setlist &amp; Launch →
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 4: ERA SETLIST ACTS & FINAL TOUR LAUNCH */}
            {plannerStep === 4 && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Era Setlist Acts I–IV
                    </h3>
                    <button
                      type="button"
                      onClick={handleAutoCurateSetlist}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      ✨ Auto-Curate Hits
                    </button>
                  </div>

                  {releasedSongs.length === 0 ? (
                    <p className="text-xs text-zinc-400">
                      Release at least 1 song in the Studio before building a tour setlist.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {(
                        [
                          {
                            key: 'act1SongIds' as const,
                            title: 'Act I: Opening Era Statement'
                          },
                          {
                            key: 'act2SongIds' as const,
                            title: 'Act II: High-Energy Stadium Anthems'
                          },
                          {
                            key: 'act3SongIds' as const,
                            title: 'Act III: Acoustic B-Stage & Ballads'
                          },
                          {
                            key: 'act4SongIds' as const,
                            title: 'Act IV: Grand Finale Encore'
                          }
                        ] as const
                      ).map(act => (
                        <div key={act.key} className="space-y-1.5">
                          <div className="text-[10px] font-mono font-bold text-zinc-300">
                            {act.title} ({setlist[act.key].length} tracks)
                          </div>
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                            {releasedSongs.map(song => {
                              const active = setlist[act.key].includes(song.id);
                              return (
                                <button
                                  key={song.id}
                                  type="button"
                                  onClick={() =>
                                    toggleSongInAct(act.key, song.id)
                                  }
                                  className={`px-3 py-1.5 rounded-lg border text-[10.5px] font-bold shrink-0 cursor-pointer active:scale-95 ${
                                    active
                                      ? 'bg-rose-500 text-white border-rose-400'
                                      : 'bg-black/40 text-zinc-400 border-white/10'
                                  }`}
                                >
                                  {song.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final Tour Launch Card with Banner Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 via-[#141829] to-[#0D101B] border border-rose-400/45 space-y-3">
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                    <div className="p-2.5 rounded-xl bg-black/45 border border-white/10">
                      <div className="text-[10px] text-zinc-400 font-sans">
                        Projected Tour Gross
                      </div>
                      <div className="text-sm font-black text-emerald-400 mt-0.5">
                        ${formatNum(plannerProjections.totalProjGross)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/45 border border-white/10">
                      <div className="text-[10px] text-zinc-400 font-sans">
                        Est. Presale Queue
                      </div>
                      <div className="text-sm font-black text-sky-300 mt-0.5">
                        {formatNum(plannerProjections.totalVirtualQueue)} Fans
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/45 border border-white/10">
                      <div className="text-[10px] text-zinc-400 font-sans">
                        Stage Build Cost
                      </div>
                      <div className="text-sm font-black text-amber-300 mt-0.5">
                        ${formatNumFull(stageMetrics.upfrontBuildCost)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/45 border border-white/10">
                      <div className="text-[10px] text-zinc-400 font-sans">
                        Projected Net Profit
                      </div>
                      <div className="text-sm font-black text-white mt-0.5">
                        ${formatNum(plannerProjections.totalProjNet)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchTour}
                    className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-99 text-white font-black text-xs tracking-wide uppercase shadow-lg cursor-pointer transition"
                  >
                    🚀 Launch Tour &amp; Post Banner to X ({selectedStops.length}{' '}
                    Dates)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 4: OFFICIAL BILLBOARD BOXSCORE & VENUE MERCH BOOTH LEDGER
           ===================================================================== */}
        {activeTab === 'boxscore' && (
          <div className="px-3.5 mt-3 space-y-3.5">
            {(() => {
              const allCompletedStops = [
                ...(activeTour?.stops.filter(s => s.status === 'completed') ||
                  []),
                ...tourState.pastTours.flatMap(t =>
                  t.stops.filter(s => s.status === 'completed')
                )
              ];

              if (allCompletedStops.length === 0) {
                return (
                  <div className="p-8 rounded-2xl bg-[#0F1322] border border-white/10 text-center space-y-2.5">
                    <i className="ph-duotone ph-ticket text-3xl text-rose-400" />
                    <h3 className="text-sm font-bold text-white">
                      No Official Boxscore Reports Yet
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Once your World Tour reaches its Kickoff Date, advance days to play scheduled stadium/arena dates and receive verified @TouringData X boxscore reports with your Tour Banner attached.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Verified @TouringData Boxscore ({allCompletedStops.length}{' '}
                      Shows)
                    </h3>
                    <button
                      type="button"
                      onClick={handleShareBannerToX}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      📢 Share Summary to X
                    </button>
                  </div>

                  {allCompletedStops.map(stop => (
                    <div
                      key={stop.id}
                      className="p-3.5 rounded-2xl bg-[#0F1322] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">
                              {stop.venueName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                              {stop.selloutPct}% SOLD
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {stop.cityName}, {stop.countryCode} • Night{' '}
                            {stop.nightNumber} ({stop.scheduledDate})
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums">
                          <div className="text-xs font-black text-emerald-400">
                            ${formatNumFull(stop.totalGross || 0)}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {formatNumFull(stop.ticketsSold || 0)} /{' '}
                            {formatNumFull(stop.capacity)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] tabular-nums text-center">
                        <div>
                          <span className="text-zinc-400 block font-sans">
                            Ticket + VIP
                          </span>
                          <strong className="text-white">
                            $
                            {formatNum(
                              (stop.ticketGross || 0) + (stop.vipGross || 0)
                            )}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-sans">
                            Merch Booth
                          </span>
                          <strong className="text-sky-300">
                            ${formatNum(stop.merchBoothGross || 0)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-sans">
                            Net Profit
                          </span>
                          <strong className="text-emerald-400">
                            +${formatNum(stop.netProfit || 0)}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span>
                          🎹 Surprise: &quot;{stop.surpriseSongTitle}&quot;
                        </span>
                        <span className="text-amber-300">
                          Crowd: {stop.crowdRating}/100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* =====================================================================
            TAB 5: GLOBAL ALL-TIME TOUR BOXSCORE LEADERBOARD (PLAYER VS. NPCS)
           ===================================================================== */}
        {activeTab === 'leaderboard' &&
          (() => {
            const playerIdx = globalLeaderboard.findIndex(e => e.isPlayer);
            const playerEntry = globalLeaderboard[playerIdx];
            return (
              <div className="px-3.5 mt-3 space-y-3.5">
                {playerEntry && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500/20 via-[#181524] to-[#101422] border border-rose-400/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="px-2 py-1 rounded-lg bg-rose-500 text-white font-mono text-xs font-black shrink-0">
                        #{playerIdx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {playerEntry.artistName} — {playerEntry.tourTitle}
                        </div>
                        <div className="text-[10px] text-zinc-300 font-mono tabular-nums">
                          {playerEntry.showsCount} Shows •{' '}
                          {formatNum(playerEntry.totalAttendance)} Attendance
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="text-xs font-black text-emerald-400">
                        ${formatNum(playerEntry.totalGross)}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        ${formatNum(playerEntry.avgGrossPerShow)}/show
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    All-Time Boxscore ({globalLeaderboard.length})
                  </span>
                  <div className="flex items-center gap-1 p-0.5 bg-[#161926] rounded-lg border border-white/10">
                    {[
                      { id: 'gross' as const, label: 'Gross $' },
                      { id: 'attendance' as const, label: 'Tickets' },
                      { id: 'avg' as const, label: 'Avg/Show' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setLeaderboardSort(s.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                          leaderboardSort === s.id
                            ? 'bg-rose-500 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {globalLeaderboard.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        entry.isPlayer
                          ? 'bg-rose-500/10 border-rose-400/50'
                          : 'bg-[#0F1322] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`w-6 text-center font-mono text-xs font-black shrink-0 ${
                            idx === 0
                              ? 'text-amber-300'
                              : idx === 1
                              ? 'text-zinc-200'
                              : idx === 2
                              ? 'text-amber-600'
                              : 'text-zinc-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        {entry.avatar ? (
                          <img
                            src={entry.avatar}
                            alt={entry.artistName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0 bg-zinc-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {entry.artistName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">
                              {entry.artistName}
                            </span>
                            {entry.isPlayer && (
                              <span className="text-[9px] font-mono font-bold uppercase text-rose-300">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-rose-300 font-semibold truncate">
                            {entry.tourTitle}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono tabular-nums truncate">
                            {entry.showsCount} Shows •{' '}
                            {formatNum(entry.totalAttendance)} Tickets •{' '}
                            {entry.signatureVenue}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="text-xs font-black text-emerald-400">
                          ${formatNum(entry.totalGross)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          ${formatNum(entry.avgGrossPerShow)}/night
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
