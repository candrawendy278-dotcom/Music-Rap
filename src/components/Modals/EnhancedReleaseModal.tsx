import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNumFull, formatMoney } from '../../constants';
import { getEnsuredSkillState } from '../../data/skillSystemEngine';
import { getDetailedFanDemographics } from '../../data/fansSystemEngine';
import {
  triggerRivalCounterReleaseOnPlayerDrop,
  injectRivalCounterReleaseIntoNpcCatalog
} from '../../data/rivalBeefSystemEngine';
import {
  SINGLE_ROLE_OPTIONS,
  ExtendedTrackRole,
  calculateInitialProjectPreSaves
} from '../../data/preReleaseCountdownEngine';
import {
  REAL_WORLD_DISTRIBUTORS,
  AUDIO_DELIVERY_FORMATS,
  PHYSICAL_RETAIL_TIERS,
  PRIORITY_TERRITORY_OPTIONS,
  RealDistributorId,
  AudioDeliveryFormatId,
  PhysicalRetailTierId,
  PriorityTerritoryOption,
  getRealDistributorById,
  getAudioDeliveryFormatById,
  getPhysicalRetailTierById,
  evaluateDistributorEligibility,
  calculateDistributorAdvanceOffer,
  generateAuthenticISRC,
  generateAuthenticUPC
} from '../../data/realWorldMusicDistributionEngine';

interface EnhancedReleaseModalProps {
  onClose: () => void;
}

const MARKETING_CAMPAIGNS = [
  {
    id: 'indie',
    name: 'Organic Social & Fanbase Drop',
    cost: 0,
    baseHypeBoost: 10,
    badge: 'Free · +10 Base Hype',
    desc: 'Word-of-mouth rollout driven by your core listeners, X timeline, and organic discovery.'
  },
  {
    id: 'ad_campaign',
    name: 'Viral Digital, Pre-Save & Creator Sound Ads',
    cost: 8000,
    baseHypeBoost: 35,
    badge: '$8,000 · +35 Base Hype',
    desc: 'Targeted algorithmic audio ads, short-form creator sound trends, and DSP marquee banners.'
  },
  {
    id: 'major_push',
    name: 'Global Press, Times Square & Radio Syndicate Blitz',
    cost: 30000,
    baseHypeBoost: 70,
    badge: '$30,000 · +70 Base Hype',
    desc: 'Full-scale blockbuster era rollout: global outdoor billboards, late-night press & commercial radio impact.'
  }
] as const;

export default function EnhancedReleaseModal({ onClose }: EnhancedReleaseModalProps) {
  const { state, setState, setInfoModal } = useGameContext();

  const todayStr = state.date.split('T')[0];
  const artistCountry = state.artist?.country || 'US';

  const releaseItems = useMemo(() => {
    const singles = state.songs
      .filter(s => {
        if (s.status === 'recorded' || s.status === 'packaged') return true;
        if (s.status === 'released' && s.trackType === 'b_side') return true;
        if (s.status === 'scheduled') {
          const parentProj = state.projects.find(
            p => p.status === 'scheduled' && p.songs?.some(ps => ps.id === s.id)
          );
          if (parentProj) return true;
        }
        return false;
      })
      .map(s => {
        const parentProj = state.projects.find(p =>
          p.songs?.some(ps => ps.id === s.id)
        );
        const roleLabel =
          s.status === 'released' && s.trackType === 'b_side'
            ? `Post-Release Single · from "${parentProj?.title || 'Album'}"`
            : s.status === 'scheduled' && parentProj
            ? `Countdown Pre-Release Single · from "${parentProj.title}"`
            : s.status === 'packaged' && parentProj
            ? `Album Track · from "${parentProj.title}"`
            : 'Standalone Master';
        const defaultRole: ExtendedTrackRole =
          s.status === 'scheduled' && parentProj
            ? 'pre_release_single'
            : s.status === 'packaged' && parentProj
            ? parentProj.songs.some(ps => ps.status === 'released' && ps.trackType === 'lead_single')
              ? 'pre_release_single'
              : 'lead_single'
            : 'single';
        return {
          key: `song_${s.id}`,
          kind: 'single' as const,
          id: s.id,
          title: s.title,
          subtitle: `${s.subgenre || s.genre} · ${roleLabel}`,
          cover: s.cover || parentProj?.cover,
          quality: Math.round(s.quality || 50),
          trackCount: 1,
          hasCollab: Boolean(s.collabId && s.collabId !== 'none'),
          parentProjectId: parentProj?.id,
          parentProjectTitle: parentProj?.title,
          defaultRole
        };
      });

    const projects = state.projects
      .filter(p => p.status === 'created')
      .map(p => ({
        key: `proj_${p.id}`,
        kind: 'project' as const,
        id: p.id,
        title: p.title,
        subtitle: `${p.type === 'album' ? 'Studio Album' : p.type === 'ep' ? 'EP' : 'Single Pack'} · ${p.songs.length} Tracks`,
        cover: p.cover,
        quality: Math.round(p.quality || 50),
        trackCount: p.songs.length,
        hasCollab: p.songs.some(s => s.collabId && s.collabId !== 'none'),
        parentProjectId: undefined,
        parentProjectTitle: undefined,
        defaultRole: 'single' as ExtendedTrackRole
      }));

    return [...projects, ...singles];
  }, [state.songs, state.projects]);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [releaseTarget, setReleaseTarget] = useState<string>(
    releaseItems.length > 0 ? releaseItems[0].key : ''
  );
  const [singleRole, setSingleRole] = useState<ExtendedTrackRole>(
    releaseItems.length > 0 ? releaseItems[0].defaultRole : 'single'
  );
  const [focusTrackId, setFocusTrackId] = useState<number | 'none'>('none');
  const [distributorId, setDistributorId] = useState<RealDistributorId>('distrokid');
  const [takeAdvance, setTakeAdvance] = useState<boolean>(true);
  const [audioFormat, setAudioFormat] = useState<AudioDeliveryFormatId>('standard');
  const [contentIdEnabled, setContentIdEnabled] = useState<boolean>(true);
  const [priorityRegion, setPriorityRegion] = useState<PriorityTerritoryOption>('auto');
  const [physicalRetailPush, setPhysicalRetailPush] = useState<PhysicalRetailTierId>('none');
  const [strategy, setStrategy] = useState<string>('indie');
  const [releaseDate, setReleaseDate] = useState<string>(todayStr);

  const selectedItem = releaseItems.find(item => item.key === releaseTarget);
  const selectedProjectObj = useMemo(() => {
    if (!selectedItem || selectedItem.kind !== 'project') return null;
    return state.projects.find(p => p.id === selectedItem.id) || null;
  }, [selectedItem, state.projects]);

  const activeDistro = getRealDistributorById(distributorId);
  const activeAudioFormat = getAudioDeliveryFormatById(audioFormat);
  const activeRetailTier = getPhysicalRetailTierById(physicalRetailPush);
  const activeCampaign = MARKETING_CAMPAIGNS.find(c => c.id === strategy) || MARKETING_CAMPAIGNS[0];
  const activeSingleRoleMeta =
    SINGLE_ROLE_OPTIONS.find(r => r.id === singleRole) || SINGLE_ROLE_OPTIONS[3];

  const availableAdvanceOffer = useMemo(() => {
    if (!selectedItem) return 0;
    return calculateDistributorAdvanceOffer({
      distributor: activeDistro,
      kind: selectedItem.kind,
      projectType: selectedProjectObj?.type,
      artistPopularity: state.popularity || 2,
      artistHype: state.hype || 15,
      masterQuality: selectedItem.quality || 60
    });
  }, [selectedItem, selectedProjectObj, activeDistro, state.popularity, state.hype]);

  const effectiveAdvanceTaken =
    availableAdvanceOffer > 0 && takeAdvance ? availableAdvanceOffer : 0;

  const audioFormatCost = useMemo(() => {
    if (!selectedItem) return 0;
    if (selectedItem.kind === 'single') return activeAudioFormat.costPerTrack;
    return Math.min(
      activeAudioFormat.costCapProject,
      activeAudioFormat.costPerTrack * Math.max(1, selectedItem.trackCount)
    );
  }, [selectedItem, activeAudioFormat]);

  const retailCost = useMemo(() => {
    if (!selectedItem) return 0;
    return selectedItem.kind === 'project'
      ? activeRetailTier.costProject
      : activeRetailTier.costSingle;
  }, [selectedItem, activeRetailTier]);

  const grossRolloutCost =
    activeDistro.upfrontFee + audioFormatCost + retailCost + activeCampaign.cost;
  const netCashImpact = effectiveAdvanceTaken - grossRolloutCost;
  const isImmediateRelease = releaseDate <= todayStr;

  const previewCodes = useMemo(() => {
    if (!selectedItem) return { isrc: 'US-DK4-26-10001', upc: '198004100001' };
    const isrc = generateAuthenticISRC(
      selectedItem.id,
      selectedItem.title,
      artistCountry,
      distributorId,
      2026
    );
    const upc = generateAuthenticUPC(selectedItem.id, selectedItem.title, distributorId);
    return { isrc, upc };
  }, [selectedItem, artistCountry, distributorId]);

  // Commercial & Hype Forecast Calculation
  const forecast = useMemo(() => {
    if (!selectedItem) {
      return {
        hypeGain: 0,
        projectedHype: state.hype || 0,
        basePotential: 0,
        estFirstDayStreams: 0,
        estFirstWeekPureSales: 0,
        estInitialPreSaves: 0
      };
    }

    const roleHypeExtra = selectedItem.kind === 'single' ? activeSingleRoleMeta.hypeBonus : 0;
    const rawHypeBoost =
      activeCampaign.baseHypeBoost * activeDistro.hypeMultiplier +
      roleHypeExtra +
      activeAudioFormat.playlistBonus * 0.4;
    const projectedHype = Math.min(100, Number(((state.hype || 0) + rawHypeBoost).toFixed(1)));
    const hypeGain = Number((projectedHype - (state.hype || 0)).toFixed(1));

    const tierMultiplier = state.artist?.tier === 1 ? 1.4 : state.artist?.tier === 2 ? 1.7 : 1.0;
    const collabBonus = selectedItem.hasCollab ? 25 : 0;
    const singleRoleMult = selectedItem.kind === 'single' ? activeSingleRoleMeta.streamMult : 1.0;

    const rawPot =
      selectedItem.kind === 'single'
        ? ((selectedItem.quality * 0.5) +
            ((state.popularity || 0) * 0.3) +
            (projectedHype * 0.2) +
            collabBonus) *
          tierMultiplier *
          activeDistro.potentialMultiplier *
          activeAudioFormat.streamRetentionMult *
          singleRoleMult
        : ((selectedItem.quality * 0.5) +
            ((state.popularity || 0) * 0.4) +
            (projectedHype * 0.15)) *
          tierMultiplier *
          activeDistro.potentialMultiplier *
          activeAudioFormat.streamRetentionMult;

    const skills = getEnsuredSkillState(state.skills);
    const fanDemo = getDetailedFanDemographics(
      state.fans ?? 250,
      state.popularity || 0,
      projectedHype,
      skills
    );

    const singleDayStreamEst = Math.round(
      (rawPot * 950 + fanDemo.dailyStreamingFloor) * (1 + projectedHype / 120)
    );
    const estFirstDayStreams =
      selectedItem.kind === 'project'
        ? Math.round(singleDayStreamEst * Math.min(selectedItem.trackCount, 12) * 0.68)
        : singleDayStreamEst;

    const retailDay1Bonus =
      selectedItem.kind === 'project'
        ? activeRetailTier.bonusFirstDayUnitsProject
        : activeRetailTier.bonusFirstDayUnitsSingle;

    const estFirstWeekPureSales = Math.round(
      ((fanDemo.superfansStans * 0.42 + rawPot * 45) *
        fanDemo.pureSalesMultiplier *
        activeDistro.pureSalesConversionMult *
        activeAudioFormat.pureSalesMult *
        activeRetailTier.firstWeekSalesBoostMult *
        (selectedItem.kind === 'project' ? 1.65 : 0.75 * activeSingleRoleMeta.salesMult)) +
        retailDay1Bonus
    );

    const estInitialPreSaves =
      selectedItem.kind === 'project' && selectedProjectObj && !isImmediateRelease
        ? calculateInitialProjectPreSaves(
            selectedProjectObj,
            state.popularity || 2,
            projectedHype,
            state.fans || 250,
            distributorId,
            strategy
          )
        : 0;

    return {
      hypeGain,
      projectedHype,
      basePotential: Math.round(rawPot),
      estFirstDayStreams,
      estFirstWeekPureSales,
      estInitialPreSaves
    };
  }, [
    selectedItem,
    selectedProjectObj,
    activeCampaign,
    activeDistro,
    activeAudioFormat,
    activeRetailTier,
    activeSingleRoleMeta,
    isImmediateRelease,
    distributorId,
    strategy,
    state.hype,
    state.popularity,
    state.fans,
    state.artist,
    state.skills
  ]);

  const handleSubmit = () => {
    if (!selectedItem) return;

    // Note: if the distributor pays an upfront Advance, that advance can cover the rollout & marketing expenses!
    if (state.money + effectiveAdvanceTaken < grossRolloutCost) {
      const neededOutOfPocket = grossRolloutCost - effectiveAdvanceTaken;
      return setInfoModal({
        title: 'Insufficient Funds',
        desc: `You need ${formatMoney(neededOutOfPocket)} out-of-pocket after your ${formatMoney(
          effectiveAdvanceTaken
        )} distributor advance (Available: ${formatMoney(state.money)}).`
      });
    }

    const newMoney = Math.max(0, state.money + netCashImpact);
    const newHype = forecast.projectedHype;
    const tierMultiplier = state.artist?.tier === 1 ? 1.4 : state.artist?.tier === 2 ? 1.7 : 1.0;
    const targetStatus = isImmediateRelease ? 'released' : 'scheduled';

    setState(p => {
      const nextP = { ...p, money: newMoney, hype: newHype };

      if (releaseTarget.startsWith('song_')) {
        const id = parseInt(releaseTarget.split('_')[1]);
        let updatedSongPot = 0;
        const chosenTrackType = singleRole;

        nextP.songs = nextP.songs.map(s => {
          if (s.id === id) {
            const collabBonus = s.collabId && s.collabId !== 'none' ? 25 : 0;
            const calcPot =
              ((s.quality * 0.5) + (state.popularity * 0.3) + (newHype * 0.2) + collabBonus) *
              tierMultiplier *
              activeDistro.potentialMultiplier *
              activeAudioFormat.streamRetentionMult *
              activeSingleRoleMeta.streamMult;
            updatedSongPot = Math.max(s.basePotential || 0, calcPot);
            return {
              ...s,
              status: targetStatus,
              releaseDate: s.status === 'released' ? (s.releaseDate || releaseDate) : releaseDate,
              trackType: chosenTrackType,
              basePotential: updatedSongPot,
              momentum: Math.max(s.momentum || 1.0, 1.08),
              distributorId,
              royaltyArtistShare: activeDistro.artistRoyaltyPercent,
              advanceAmount: effectiveAdvanceTaken,
              unrecoupedAdvance: effectiveAdvanceTaken,
              totalRoyaltiesEarned: s.totalRoyaltiesEarned || 0,
              isrcCode: previewCodes.isrc,
              upcCode: previewCodes.upc,
              audioFormat,
              contentIdEnabled,
              priorityRegion,
              physicalRetailPush
            };
          }
          return s;
        });

        // Synchronize inside parent project if applicable
        nextP.projects = nextP.projects.map(pr => {
          if (!pr.songs || !pr.songs.some(ps => ps.id === id)) return pr;
          const preSaveBonus =
            pr.status === 'scheduled'
              ? Math.round((pr.preSaves || 250) * (activeSingleRoleMeta.preSaveBoost - 1) + 450)
              : 0;
          return {
            ...pr,
            preSaves: (pr.preSaves || 0) + preSaveBonus,
            songs: pr.songs.map(ps =>
              ps.id === id
                ? {
                    ...ps,
                    status: targetStatus,
                    releaseDate: ps.status === 'released' ? (ps.releaseDate || releaseDate) : releaseDate,
                    trackType: chosenTrackType,
                    basePotential: updatedSongPot || ps.basePotential,
                    distributorId,
                    royaltyArtistShare: activeDistro.artistRoyaltyPercent,
                    isrcCode: previewCodes.isrc,
                    upcCode: previewCodes.upc,
                    audioFormat,
                    contentIdEnabled,
                    priorityRegion,
                    physicalRetailPush
                  }
                : ps
            )
          };
        });
      } else if (releaseTarget.startsWith('proj_')) {
        const id = parseInt(releaseTarget.split('_')[1]);
        let projBasePot = 0;
        const project = state.projects.find(pr => pr.id === id);
        const initialPreSaves =
          project && !isImmediateRelease
            ? calculateInitialProjectPreSaves(
                project,
                state.popularity || 2,
                newHype,
                state.fans || 250,
                distributorId,
                strategy
              )
            : 0;

        nextP.projects = nextP.projects.map(pr => {
          if (pr.id === id) {
            projBasePot =
              ((pr.quality * 0.5) + (state.popularity * 0.4) + (newHype * 0.15)) *
              tierMultiplier *
              activeDistro.potentialMultiplier *
              activeAudioFormat.streamRetentionMult;
            return {
              ...pr,
              status: targetStatus,
              releaseDate,
              basePotential: projBasePot,
              preSaves: initialPreSaves,
              dailyPreSaves: Math.round(initialPreSaves * 0.18),
              distributor: distributorId,
              distributorId,
              royaltyArtistShare: activeDistro.artistRoyaltyPercent,
              advanceAmount: effectiveAdvanceTaken,
              unrecoupedAdvance: Math.round(effectiveAdvanceTaken * 0.35),
              totalRoyaltiesEarned: pr.totalRoyaltiesEarned || 0,
              upcCode: previewCodes.upc,
              audioFormat,
              contentIdEnabled,
              priorityRegion,
              physicalRetailPush,
              marketingStrategy: strategy,
              focusTrackId: focusTrackId !== 'none' ? focusTrackId : pr.focusTrackId
            };
          }
          return pr;
        });

        if (project) {
          const projSongIds = project.songs.map(s => s.id);
          const perTrackAdvanceShare =
            projSongIds.length > 0
              ? Math.round((effectiveAdvanceTaken * 0.65) / projSongIds.length)
              : 0;
          let hasAssignedLeadSingle = nextP.songs.some(
            s => projSongIds.includes(s.id) && s.trackType === 'lead_single'
          );

          nextP.songs = nextP.songs.map(s => {
            if (projSongIds.includes(s.id)) {
              const isFocusTrack = focusTrackId !== 'none' && s.id === focusTrackId;
              const trackIsrc =
                s.isrcCode ||
                generateAuthenticISRC(s.id, s.title, artistCountry, distributorId, 2026);
              if (s.status !== 'released') {
                const resolvedTrackType: ExtendedTrackRole =
                  project.type === 'single_pack'
                    ? 'single'
                    : isFocusTrack
                    ? 'single'
                    : s.trackType && s.trackType !== 'b_side'
                    ? s.trackType
                    : 'b_side';
                return {
                  ...s,
                  status: targetStatus,
                  releaseDate,
                  trackType: resolvedTrackType,
                  basePotential:
                    projBasePot *
                    (project.type === 'single_pack' || isFocusTrack
                      ? 0.98
                      : 0.58 + (s.quality / 100) * 0.25 + (s.collabId !== 'none' ? 0.2 : 0.0)),
                  cover: project.cover,
                  distributorId,
                  royaltyArtistShare: activeDistro.artistRoyaltyPercent,
                  advanceAmount: (s.advanceAmount || 0) + perTrackAdvanceShare,
                  unrecoupedAdvance: (s.unrecoupedAdvance || 0) + perTrackAdvanceShare,
                  isrcCode: trackIsrc,
                  upcCode: previewCodes.upc,
                  audioFormat,
                  contentIdEnabled,
                  priorityRegion,
                  physicalRetailPush
                };
              } else {
                let preservedRole: ExtendedTrackRole = s.trackType || 'single';
                if (!s.trackType || s.trackType === 'b_side') {
                  if (!hasAssignedLeadSingle) {
                    preservedRole = 'lead_single';
                    hasAssignedLeadSingle = true;
                  } else {
                    preservedRole = 'pre_release_single';
                  }
                }
                return {
                  ...s,
                  trackType: preservedRole,
                  distributorId: s.distributorId || distributorId,
                  royaltyArtistShare: s.royaltyArtistShare ?? activeDistro.artistRoyaltyPercent,
                  isrcCode: trackIsrc,
                  upcCode: previewCodes.upc,
                  audioFormat: s.audioFormat || audioFormat,
                  contentIdEnabled: s.contentIdEnabled ?? contentIdEnabled,
                  priorityRegion:
                    priorityRegion !== 'auto' ? priorityRegion : s.priorityRegion || 'auto'
                };
              }
            }
            return s;
          });

          nextP.projects = nextP.projects.map(pr => {
            if (pr.id === id) {
              return {
                ...pr,
                songs: pr.songs.map(ps => {
                  const updatedGlobalSong = nextP.songs.find(gs => gs.id === ps.id);
                  return {
                    ...ps,
                    status:
                      targetStatus === 'released' || ps.status === 'released'
                        ? 'released'
                        : 'scheduled',
                    trackType: updatedGlobalSong?.trackType || ps.trackType,
                    basePotential:
                      ps.status !== 'released' ? projBasePot * 0.75 : ps.basePotential,
                    cover: pr.cover,
                    distributorId,
                    royaltyArtistShare: activeDistro.artistRoyaltyPercent,
                    isrcCode: updatedGlobalSong?.isrcCode,
                    upcCode: previewCodes.upc,
                    audioFormat,
                    contentIdEnabled,
                    priorityRegion,
                    physicalRetailPush
                  };
                })
              };
            }
            return pr;
          });
        }
      }

      if (isImmediateRelease) {
        const rivalDrop = triggerRivalCounterReleaseOnPlayerDrop(
          nextP,
          selectedItem.title,
          selectedItem.kind,
          forecast.estFirstDayStreams
        );
        (nextP as any).rivalState = rivalDrop.updatedRivalState;
        if (rivalDrop.didTriggerCounterDrop) {
          nextP.xPosts = [...rivalDrop.counterDropTweets, ...(nextP.xPosts || [])];
          injectRivalCounterReleaseIntoNpcCatalog(nextP);
        }
      }

      return nextP;
    });

    const previewDrop = isImmediateRelease
      ? triggerRivalCounterReleaseOnPlayerDrop(
          state,
          selectedItem.title,
          selectedItem.kind,
          forecast.estFirstDayStreams
        )
      : null;

    const advanceMsg =
      effectiveAdvanceTaken > 0
        ? ` You received a ${formatMoney(effectiveAdvanceTaken)} recoupable advance (${activeDistro.artistRoyaltyPercent}/${activeDistro.distributorCutPercent} royalty split).`
        : ` You retain ${activeDistro.artistRoyaltyPercent}% of master royalties.`;

    if (isImmediateRelease) {
      if (previewDrop && previewDrop.didTriggerCounterDrop) {
        setInfoModal({
          title: 'Worldwide Release Live & Rival Chart Alert!',
          desc: `"${selectedItem.title}" is now out globally via ${activeDistro.name} (+${forecast.hypeGain}% Hype)!${advanceMsg} CHART BLOCK ALERT: ${previewDrop.updatedRivalState.rivalName} just surprise-dropped on the same day!`
        });
      } else {
        setInfoModal({
          title: 'Worldwide DSP Delivery Live!',
          desc: `"${selectedItem.title}" (${activeAudioFormat.shortLabel} · ISRC ${previewCodes.isrc}) is now live via ${activeDistro.name} (+${forecast.hypeGain}% Hype).${advanceMsg}`
        });
      }
    } else {
      setInfoModal({
        title:
          selectedItem.kind === 'project'
            ? 'Spotify Release Countdown Live!'
            : 'Global Single Release Scheduled',
        desc:
          selectedItem.kind === 'project'
            ? `"${selectedItem.title}" (UPC ${previewCodes.upc}) is scheduled for ${releaseDate} via ${activeDistro.name} with ${formatNumFull(
                forecast.estInitialPreSaves
              )} initial Spotify Pre-Saves!${advanceMsg}`
            : `"${selectedItem.title}" (${activeSingleRoleMeta.label} · ISRC ${previewCodes.isrc}) is scheduled for ${releaseDate} via ${activeDistro.name}.${advanceMsg}`
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F7] w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="font-semibold text-emerald-700">Global DSP Distribution</span>
              <span aria-hidden="true">·</span>
              <span>Step {currentStep} of 3</span>
              {selectedItem && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-neutral-600">
                    {selectedItem.kind === 'project'
                      ? `UPC ${previewCodes.upc}`
                      : `ISRC ${previewCodes.isrc}`}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight mt-0.5">
              {currentStep === 1
                ? '01. Select Master, Role & Schedule'
                : currentStep === 2
                ? '02. Distributor Contract, Split & Advance'
                : '03. DSP Technical Specs, Territory & Rollout'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        {/* 3-Step Navigation Bar */}
        <div className="px-5 pt-3 pb-2.5 bg-white border-b border-neutral-100">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { num: 1, name: 'Master & Date' },
              { num: 2, name: 'Distributor & Split' },
              { num: 3, name: 'DSP Specs & Push' }
            ].map(s => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num as 1 | 2 | 3)}
                  className="text-left cursor-pointer"
                >
                  <div className="h-1.5 rounded-full overflow-hidden bg-neutral-100 mb-1.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCurrent ? 'bg-neutral-900 w-full' : isPast ? 'bg-emerald-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono tabular-nums font-bold ${
                        isCurrent ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      0{s.num}
                    </span>
                    <span
                      className={`text-[11px] font-semibold truncate ${
                        isCurrent ? 'text-neutral-900' : 'text-neutral-500'
                      }`}
                    >
                      {s.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {releaseItems.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 text-xl mx-auto">
              <i className="ph-bold ph-rocket-launch"></i>
            </div>
            <h4 className="font-bold text-neutral-900 text-sm">No Masters Ready for Distribution</h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Finish recording a song in the Recording Studio or package a project in Create Project before launching a release.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-xl mt-2 active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* STEP 1: MASTER SELECTION, SINGLE ROLE & SCHEDULE */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-neutral-700">
                        Select Recorded Master or Packaged Project ({releaseItems.length})
                      </label>
                    </div>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {releaseItems.map(item => {
                        const isSelected = releaseTarget === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => {
                              setReleaseTarget(item.key);
                              setSingleRole(item.defaultRole);
                              setFocusTrackId('none');
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <img
                              src={item.cover}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200/60"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-neutral-900 truncate">
                                  {item.title}
                                </span>
                                <span className="text-xs font-mono tabular-nums font-bold text-emerald-700 shrink-0">
                                  Master {item.quality}/100
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5">{item.subtitle}</div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                                <span className="font-semibold text-neutral-700">
                                  {item.kind === 'project' ? 'Project Release' : 'Single Release'}
                                </span>
                                {item.hasCollab && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-semibold text-amber-700">
                                      Feat. Collaborator (+25 Pot)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Single Rollout Type Selector */}
                  {selectedItem?.kind === 'single' && (
                    <div className="p-4 bg-white rounded-xl border border-neutral-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-neutral-900">
                            Single Rollout Classification
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Choose how this single is serviced to DSPs, playlists & radio
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-neutral-700">
                          {activeSingleRoleMeta.shortBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {SINGLE_ROLE_OPTIONS.map(opt => {
                          const isChosen = singleRole === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSingleRole(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                isChosen
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold">{opt.label}</span>
                                <span
                                  className={`text-[10px] font-mono tabular-nums font-semibold ${
                                    isChosen ? 'text-emerald-300' : 'text-neutral-600'
                                  }`}
                                >
                                  +{opt.hypeBonus}% Hype
                                </span>
                              </div>
                              <p
                                className={`text-[10px] mt-1 leading-snug ${
                                  isChosen ? 'text-neutral-300' : 'text-neutral-500'
                                }`}
                              >
                                {opt.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Project Focus Single Selector */}
                  {selectedItem?.kind === 'project' &&
                    selectedProjectObj &&
                    selectedProjectObj.type !== 'single_pack' && (
                      <div className="p-4 bg-white rounded-xl border border-neutral-200/80 space-y-2">
                        <div>
                          <div className="text-xs font-bold text-neutral-900">
                            Focus Single / Title Track on Release Day
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Select an unreleased album track to push as an Official Single when the project drops
                          </div>
                        </div>
                        <select
                          value={focusTrackId}
                          onChange={e =>
                            setFocusTrackId(
                              e.target.value === 'none' ? 'none' : Number(e.target.value)
                            )
                          }
                          className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-neutral-900"
                        >
                          <option value="none">
                            No Focus Single (Keep unreleased tracks as Album B-Sides)
                          </option>
                          {selectedProjectObj.songs
                            .filter(s => s.status !== 'released')
                            .map((s, idx) => (
                              <option key={s.id} value={s.id}>
                                Track #{idx + 1}: {s.title} (Quality {Math.round(s.quality)}/100) → Official Single
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                  {/* Release Date Timing & Spotify Countdown Presets */}
                  <div className="p-4 bg-white rounded-xl border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-neutral-900">
                          DSP Release Schedule & Spotify Pre-Release Countdown
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Schedule ahead to activate a Spotify Countdown & collect Pre-Saves
                        </div>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700">
                        {isImmediateRelease ? 'Immediate Drop' : `Scheduled: ${releaseDate}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReleaseDate(todayStr)}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                          isImmediateRelease
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        Today
                      </button>
                      {[7, 14, 21].map(daysOffset => {
                        const d = new Date(state.date);
                        d.setDate(d.getDate() + daysOffset);
                        const targetStr = d.toISOString().split('T')[0];
                        const isMatch = releaseDate === targetStr;
                        return (
                          <button
                            key={daysOffset}
                            type="button"
                            onClick={() => setReleaseDate(targetStr)}
                            className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                              isMatch
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            +{daysOffset}d Countdown
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-neutral-500">
                        Custom Release Date:
                      </span>
                      <input
                        type="date"
                        value={releaseDate}
                        min={todayStr}
                        onChange={e => setReleaseDate(e.target.value || todayStr)}
                        className="bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: REAL-WORLD DISTRIBUTOR ROSTER, ROYALTY SPLIT & RECOUPABLE ADVANCE */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-neutral-700">
                        Select Music Distributor or Label Services Partner
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-neutral-500">
                        Artist Pop: {Math.round(state.popularity || 0)}/100
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {REAL_WORLD_DISTRIBUTORS.map(d => {
                        const isSelected = distributorId === d.id;
                        const elig = evaluateDistributorEligibility(
                          d,
                          state.popularity || 0,
                          selectedItem?.quality || 60
                        );
                        const estAdv = calculateDistributorAdvanceOffer({
                          distributor: d,
                          kind: selectedItem?.kind || 'single',
                          projectType: selectedProjectObj?.type,
                          artistPopularity: state.popularity || 2,
                          artistHype: state.hype || 15,
                          masterQuality: selectedItem?.quality || 60
                        });

                        return (
                          <div
                            key={d.id}
                            onClick={() => {
                              if (!elig.eligible) return;
                              setDistributorId(d.id);
                            }}
                            className={`p-3.5 rounded-xl border transition-all ${
                              !elig.eligible
                                ? 'bg-neutral-100/80 border-neutral-200/70 opacity-65 cursor-not-allowed'
                                : isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10 cursor-pointer'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs sm:text-sm font-bold text-neutral-900">
                                    {d.name}
                                  </span>
                                  <span className="text-neutral-300" aria-hidden="true">·</span>
                                  <span className="text-[11px] text-neutral-500">
                                    {d.tierLabel}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 mt-0.5">
                                  {d.dspPartnersSummary}
                                </div>
                              </div>

                              <div className="text-right font-mono tabular-nums shrink-0">
                                <div className="text-xs font-bold text-emerald-700">
                                  {d.artistRoyaltyPercent}% Artist / {d.distributorCutPercent}% Distro
                                </div>
                                <div className="text-[11px] text-neutral-600">
                                  {estAdv > 0
                                    ? `Advance: +${formatMoney(estAdv)}`
                                    : `Upload Fee: ${formatMoney(d.upfrontFee)}`}
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-neutral-600 mt-1.5 leading-relaxed">
                              {d.description}
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-neutral-100 text-[11px] font-mono tabular-nums">
                              <div className="text-neutral-600">
                                <span>Reach x{d.potentialMultiplier.toFixed(2)}</span>
                                <span className="mx-1.5" aria-hidden="true">·</span>
                                <span>Hype x{d.hypeMultiplier.toFixed(2)}</span>
                                <span className="mx-1.5" aria-hidden="true">·</span>
                                <span>Radio x{d.radioSyndicationMult.toFixed(2)}</span>
                              </div>
                              <span
                                className={
                                  elig.eligible
                                    ? 'text-emerald-700 font-sans font-semibold'
                                    : 'text-amber-700 font-sans font-semibold'
                                }
                              >
                                {elig.reason}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recoupable Cash Advance Option (for Indie/Major Distributors) */}
                  {availableAdvanceOffer > 0 && (
                    <div className="p-4 bg-white rounded-xl border border-neutral-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-neutral-900">
                            Upfront Recoupable Label Advance Offer
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {activeDistro.name} offers {formatMoney(availableAdvanceOffer)} upfront, recouped from your {activeDistro.artistRoyaltyPercent}% royalty share
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-xs font-bold text-emerald-700">
                          {takeAdvance ? `+${formatMoney(availableAdvanceOffer)} Now` : '$0 Advance'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTakeAdvance(true)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            takeAdvance
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200'
                          }`}
                        >
                          <div className="text-xs font-bold font-mono tabular-nums">
                            Accept {formatMoney(availableAdvanceOffer)} Advance
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              takeAdvance ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            Paid immediately to your cash balance; future royalties recoup this balance first
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTakeAdvance(false)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            !takeAdvance
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200'
                          }`}
                        >
                          <div className="text-xs font-bold">
                            Decline Advance (Immediate Daily Royalties)
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              !takeAdvance ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            Start collecting your {activeDistro.artistRoyaltyPercent}% net royalties from Day 1 with zero recoupment debt
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DSP DELIVERY SPECS (ISRC/UPC, DOLBY ATMOS, PRIORITY TERRITORY, PHYSICAL RETAIL & MARKETING) */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* ISRC / UPC & Content ID Registry Bar */}
                  <div className="p-3.5 bg-white rounded-xl border border-neutral-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-neutral-500">
                        <span>ISRC & Barcode Metadata Registry</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-neutral-800 font-semibold">
                          ISRC {previewCodes.isrc}
                        </span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-neutral-800 font-semibold">
                          UPC {previewCodes.upc}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900 mt-0.5">
                        YouTube Content ID & Short-Form UGC Monetization
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContentIdEnabled(v => !v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        contentIdEnabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {contentIdEnabled ? 'Content ID Enabled' : 'Content ID Off'}
                    </button>
                  </div>

                  {/* Audio Mastering & Spatial Format */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      DSP Audio Mastering & Spatial Delivery Format
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {AUDIO_DELIVERY_FORMATS.map(fmt => {
                        const isSelected = audioFormat === fmt.id;
                        const itemFmtCost =
                          selectedItem?.kind === 'project'
                            ? Math.min(
                                fmt.costCapProject,
                                fmt.costPerTrack * Math.max(1, selectedItem.trackCount)
                              )
                            : fmt.costPerTrack;
                        return (
                          <div
                            key={fmt.id}
                            onClick={() => setAudioFormat(fmt.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-900">{fmt.name}</span>
                              <span className="text-xs font-mono tabular-nums font-semibold text-neutral-700">
                                {itemFmtCost > 0 ? formatMoney(itemFmtCost) : 'Included'}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {fmt.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority International Territory Focus */}
                  <div className="p-3.5 bg-white rounded-xl border border-neutral-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-neutral-900">
                          Territorial DSP & Regional Breakout Focus
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Concentrate international playlist & store pitching into a priority region (+35% regional weight)
                        </div>
                      </div>
                    </div>
                    <select
                      value={priorityRegion}
                      onChange={e => setPriorityRegion(e.target.value as PriorityTerritoryOption)}
                      className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-neutral-900"
                    >
                      {PRIORITY_TERRITORY_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-500">
                      {
                        (
                          PRIORITY_TERRITORY_OPTIONS.find(o => o.id === priorityRegion) ||
                          PRIORITY_TERRITORY_OPTIONS[0]
                        ).desc
                      }
                    </p>
                  </div>

                  {/* Physical & Retail Store Allocation */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Physical & Retail Store Distribution (CD / Vinyl / Target / HMV)
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {PHYSICAL_RETAIL_TIERS.map(tier => {
                        const isSelected = physicalRetailPush === tier.id;
                        const tierCost =
                          selectedItem?.kind === 'project' ? tier.costProject : tier.costSingle;
                        return (
                          <div
                            key={tier.id}
                            onClick={() => setPhysicalRetailPush(tier.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-900">
                                {tier.name}
                              </span>
                              <span className="text-xs font-mono tabular-nums font-semibold text-neutral-700">
                                {tierCost > 0 ? formatMoney(tierCost) : 'Digital Only'}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {tier.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Marketing Campaign Selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Global Marketing & Promotional Rollout
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {MARKETING_CAMPAIGNS.map(c => {
                        const isSelected = strategy === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setStrategy(c.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-neutral-900 ring-2 ring-neutral-900/10'
                                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-900">{c.name}</span>
                              <span className="text-xs font-mono tabular-nums font-semibold text-orange-700">
                                {c.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-0.5">{c.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Commercial & Financial Rollout Summary */}
                  <div className="bg-neutral-900 text-white rounded-xl p-4 border border-neutral-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-neutral-400">
                          <span>Distribution & Financial Summary</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>{activeDistro.name}</span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {activeDistro.artistRoyaltyPercent}/{activeDistro.distributorCutPercent} Split
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          {selectedItem?.title} · {activeAudioFormat.shortLabel}
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-xs font-bold text-emerald-400">
                          Hype: {(state.hype || 0).toFixed(0)}% → {forecast.projectedHype}% (+
                          {forecast.hypeGain}%)
                        </div>
                        <div className="text-[11px] text-neutral-300">
                          {netCashImpact >= 0
                            ? `Net Advance Payout: +${formatMoney(netCashImpact)}`
                            : `Net Out-of-Pocket: -${formatMoney(Math.abs(netCashImpact))}`}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-center font-mono tabular-nums">
                      <div className="bg-neutral-800/70 rounded-lg p-2">
                        <div className="text-[10px] font-sans text-neutral-400">
                          Est. Day 1 Streams
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          ~{formatNumFull(forecast.estFirstDayStreams)}
                        </div>
                      </div>
                      <div className="bg-neutral-800/70 rounded-lg p-2">
                        <div className="text-[10px] font-sans text-neutral-400">
                          Est. Week 1 Sales
                        </div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">
                          ~{formatNumFull(forecast.estFirstWeekPureSales)}
                        </div>
                      </div>
                      <div className="bg-neutral-800/70 rounded-lg p-2">
                        <div className="text-[10px] font-sans text-neutral-400">
                          {forecast.estInitialPreSaves > 0 ? 'Initial Pre-Saves' : 'Advance Taken'}
                        </div>
                        <div className="text-xs font-bold text-amber-300 mt-0.5">
                          {forecast.estInitialPreSaves > 0
                            ? `~${formatNumFull(forecast.estInitialPreSaves)}`
                            : formatMoney(effectiveAdvanceTaken)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-3.5 border-t border-neutral-200/80 bg-white flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <i className="ph-bold ph-arrow-left"></i>
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>
                    {currentStep === 1 ? 'Next: Choose Distributor' : 'Next: DSP Delivery Specs'}
                  </span>
                  <i className="ph-bold ph-arrow-right"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <i className="ph-fill ph-rocket-launch text-white text-sm"></i>
                  <span>
                    {isImmediateRelease ? 'Deliver & Launch Now' : 'Confirm DSP Delivery'} (
                    {netCashImpact >= 0
                      ? `+${formatMoney(netCashImpact)} Net`
                      : formatMoney(Math.abs(netCashImpact))}
                    )
                  </span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
