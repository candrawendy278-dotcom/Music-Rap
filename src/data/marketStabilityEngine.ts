// Dedicated Market Stability Engine
// Ensures smooth, realistic, industry-standard behavior across streaming, pure sales,
// radio airplay, and territorial market consumption without erratic jumps.

import { Song, Project } from '../types';
import { getCountryMarketProfile, evaluateSongHitScope } from './countryMarketSystem';
import {
  calculateRadioAirplayRotation,
  calculateYouTubeViewVelocity,
  calculatePureSales
} from './realisticIndustryMetricsEngine';
import {
  evaluateTrackRole,
  getTrackPromotionProfile,
  calculateRealisticArtistVelocity
} from './bSideAndSingleStrategyEngine';
import { calculateMusicVideoEngagement } from './musicVideoEngagementEngine';
import {
  evaluateDistinctTrackProfile,
  getIndividualSongOrganicVariance,
  getLaunchDaySurge
} from './bSideDistinctVelocityEngine';
import {
  evaluateOrganicMultiPlaylistPickups,
  calculateDynamicPlaylistMultiplier
} from './authenticSpotifyPlaylistSystem';
import {
  calculateRebalancedTrackSales,
  calculateRebalancedAlbumSales,
  calculateOrganicNonPitchedRetentionMultiplier
} from './chartSalesAndStabilityRebalancer';
import {
  calculateOrganicDailyStreams,
  calculateOrganicDailySales,
  calculateOrganicRadioAirplay,
  calculateOrganicMomentumDecay
} from './organicMusicMarketRebuild';
import { calculateSkillMarketSynergy } from './skillMarketSynergyEngine';
import type { PlayerSkillState } from './skillSystemEngine';
import { evaluateSingleDebutDynamics } from './singleDebutDynamicsEngine';
import {
  computeEnhancedSongMarketMultipliers,
  computeEnhancedYoutubeDailyViews,
  computeEnhancedProjectSales
} from './enhancedMarketMetricsEngine';
import { calculateDailyVisualizerAndLyricViews } from './youtubeVisualFormatsEngine';
import {
  calculateDailyProjectPreSaveGrowth,
  getPreSaveLaunchBoostMultipliers
} from './preReleaseCountdownEngine';
import {
  calculateStabilizedStreamsAndViewsHold,
  calculateStabilizedDailyPureSales
} from './homeCountryAndMarketStabilityImprover';
import {
  getRealDistributorById,
  getAudioDeliveryFormatById,
  getPhysicalRetailTierById,
  processDailyDistributionRoyaltySplit
} from './realWorldMusicDistributionEngine';

export interface MarketDailyUpdateResult {
  updatedSongs: Song[];
  updatedProjects: Project[];
  totalStreams: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
}

/**
 * Calculates a stable, authentic daily step for all released songs and projects.
 * Avoids erratic 30% swings; enforces organic day-of-week seasonality (weekends +5-10%)
 * and ties radio airplay realistically to artist popularity and song momentum.
 */
export function processDailyMarketStep(
  songs: Song[],
  projects: Project[],
  artistCountry: string,
  artistPopularity: number,
  artistHype: number,
  artistTier: number,
  currentDate: Date,
  playerSkills?: PlayerSkillState,
  playerFans?: number
): MarketDailyUpdateResult {
  const dayOfWeek = currentDate.getDay();
  // Realistic music industry weekend streaming lift (Friday & Saturday +8%)
  const weekendLift = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.08 : (dayOfWeek === 1 ? 0.96 : 1.0);

  // Subtle organic daily variance: ±2.5% (smooth, not jumping wildly)
  const dayHash = (currentDate.getDate() * 13 + currentDate.getMonth() * 19) % 11;
  const organicVariance = 0.975 + (dayHash / 200);

  const countryProfile = getCountryMarketProfile(artistCountry);
  const tierMultiplier = artistTier === 1 ? 1.4 : (artistTier === 2 ? 1.6 : 1.0);

  let totalStreams = 0;
  let totalViews = 0;
  let totalSales = 0;
  let totalRevenue = 0;

  // Organically pick up songs into Release Radar, Moods, and Editorial lists
  const { updatedSongs: songsWithOrganicPlaylists } = evaluateOrganicMultiPlaylistPickups(
    songs,
    artistPopularity,
    artistHype,
    currentDate
  );

  const allReleasedSnapshot = songsWithOrganicPlaylists.filter(s => s.status === 'released');

  const updatedSongs = songsWithOrganicPlaylists.map(song => {
    // 1. Check recording completion
    if (song.status === 'recording' && song.daysLeft !== undefined) {
      if (song.daysLeft > 1) return { ...song, daysLeft: song.daysLeft - 1 };
      return { ...song, daysLeft: 0, status: 'recorded' as const };
    }

    // 2. Check scheduled release
    if (song.status === 'scheduled' && song.releaseDate) {
      const todayStr = currentDate.toISOString().split('T')[0];
      if (todayStr >= song.releaseDate) {
        song = { ...song, status: 'released' as const, momentum: 1.0, daysSinceRelease: undefined };
      }
    }

    if (song.status === 'released') {
      // Accurate release day counter:
      // On the very first day a newly released song is processed (streams === 0), daysSinceRelease is 0 (Debut Day 1!).
      // Each subsequent day increments daysSinceRelease by 1 (Day 2 = 1, Day 3 = 2, ..., Day 7 = 6).
      let daysSinceRelease: number;
      if ((song.streams || 0) === 0 && song.daysSinceRelease === undefined) {
        daysSinceRelease = 0;
      } else if (song.daysSinceRelease !== undefined) {
        daysSinceRelease = song.daysSinceRelease + 1;
      } else {
        const releaseDateObj = song.releaseDate ? new Date(song.releaseDate) : currentDate;
        daysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - releaseDateObj.getTime()) / (1000 * 60 * 60 * 24)) - 1);
      }

      // Distinguish official singles vs album B-sides
      const trackRole = evaluateTrackRole(song, projects);
      const trackProfile = getTrackPromotionProfile(trackRole, daysSinceRelease);

      // Find parent project and track position to evaluate distinct track persona (breakout vs core vs deep cut)
      const parentProject = projects.find(p => p.songs && p.songs.some(ps => ps.id === song.id));
      const trackIndex = parentProject ? parentProject.songs.findIndex(ps => ps.id === song.id) : undefined;
      const totalTracks = parentProject ? parentProject.songs.length : undefined;
      const distinctProfile = evaluateDistinctTrackProfile(song, parentProject, trackIndex, totalTracks);
      const perSongVariance = getIndividualSongOrganicVariance(song.id, song.title, currentDate);
      const isSingle = trackRole !== 'b_side';
      const singleDebut = isSingle ? evaluateSingleDebutDynamics({
        song: { ...song, daysSinceRelease },
        daysSinceRelease,
        artistHype,
        artistPopularity,
        isLeadSingle: trackRole === 'lead_single',
        fans: playerFans,
        allReleasedSongs: allReleasedSnapshot
      }) : null;

      const launchSurge = isSingle
        ? (singleDebut?.debutStreamMultiplier ?? getLaunchDaySurge(daysSinceRelease, true, artistHype))
        : getLaunchDaySurge(daysSinceRelease, false, artistHype);

      // Calculate skill market synergies (Streaming, Sales, and Radio Airplay multipliers)
      const skillSynergy = calculateSkillMarketSynergy({
        skills: playerSkills,
        song
      });

      // Organic momentum decay powered by craft mastery, hit viability, and dedicated fans
      const newMomentum = calculateOrganicMomentumDecay({
        song,
        trackRole,
        skills: playerSkills,
        decayAcceleration: trackProfile.decayAcceleration,
        daysSinceRelease,
        fans: playerFans
      });

      // Calculate album era factor for B-sides:
      let albumEraFactor = 1.0;
      if (parentProject) {
        const projQuality = parentProject.quality !== undefined ? parentProject.quality : 50;
        const projMomentum = parentProject.momentum !== undefined ? parentProject.momentum : 1.0;
        if (projQuality >= 75 && projMomentum >= 0.55) {
          albumEraFactor = 1.25;
        } else if (projQuality >= 55 && projMomentum >= 0.40) {
          albumEraFactor = 1.0;
        } else if (projQuality < 45 || projMomentum < 0.30) {
          albumEraFactor = Math.max(0.35, 0.40 + (projQuality / 100) * 0.30) * Math.max(0.45, projMomentum);
        } else {
          albumEraFactor = 0.80;
        }
      }

      // 1. Organic Daily Streams:
      // Rebuilt dynamically: responds smoothly to Hype, Popularity, Quality, Craft Mastery, Fans, Track Role, and Lifecycle
      const rawDailyStreams = calculateOrganicDailyStreams({
        song: { ...song, momentum: newMomentum, daysSinceRelease },
        parentProject,
        artistPopularity,
        artistHype,
        artistTier,
        artistCountry,
        skills: playerSkills,
        daysSinceRelease,
        trackRole,
        albumEraFactor,
        weekendLift,
        organicVariance: organicVariance * perSongVariance,
        collabMultiplier: distinctProfile.collabSurge,
        bSideModifier: distinctProfile.streamingModifier,
        trackIndex,
        launchSurge: trackRole === 'b_side' ? undefined : launchSurge,
        fans: playerFans
      });

      const enhancedMetrics = computeEnhancedSongMarketMultipliers(
        song,
        artistPopularity,
        artistHype,
        playerFans || 0,
        daysSinceRelease,
        allReleasedSnapshot
      );

      const projPreSaveBoost =
        parentProject && parentProject.preSaves && daysSinceRelease <= 2
          ? getPreSaveLaunchBoostMultipliers(parentProject.preSaves)
          : null;
      const preSaveStreamMult =
        projPreSaveBoost
          ? daysSinceRelease === 0
            ? projPreSaveBoost.streamBoostMultiplier
            : 1 + (projPreSaveBoost.streamBoostMultiplier - 1) * 0.45
          : 1.0;
      const preSavePerTrackBonus =
        projPreSaveBoost && daysSinceRelease === 0 && totalTracks
          ? Math.round(projPreSaveBoost.bonusFirstDayStreams / Math.max(1, totalTracks))
          : 0;

      const computedDailyStreams = Math.max(
        0,
        Math.round(
          rawDailyStreams * enhancedMetrics.streamMultiplier * preSaveStreamMult +
            enhancedMetrics.playlistOrganicBoost +
            preSavePerTrackBonus
        )
      );

      // MV daily views using authentic video velocity model + audio-to-video spillover
      const { dailyViews: rawDailyViews, remainingAdDays: newMvAdsDays } = calculateYouTubeViewVelocity(
        song,
        computedDailyStreams,
        artistCountry,
        daysSinceRelease,
        organicVariance,
        singleDebut?.debutYoutubeMultiplier
      );
      const computedDailyViews = computeEnhancedYoutubeDailyViews(
        rawDailyViews,
        song,
        computedDailyStreams,
        daysSinceRelease
      );

      const distroSpec = getRealDistributorById(
        song.distributorId || parentProject?.distributorId || parentProject?.distributor
      );
      const audioFormatSpec = getAudioDeliveryFormatById(
        song.audioFormat || parentProject?.audioFormat
      );
      const retailSpec = getPhysicalRetailTierById(
        song.physicalRetailPush || parentProject?.physicalRetailPush
      );

      // Stabilize post-debut streams and YouTube views (Soft Day 2 dip, smooth Week 1-4 hold + Audio Format retention)
      const { stabilizedDailyStreams: baseStabilizedStreams, stabilizedDailyViews: dailyViews } =
        calculateStabilizedStreamsAndViewsHold({
          song,
          daysSinceRelease,
          computedDailyStreams: Math.round(
            computedDailyStreams * audioFormatSpec.streamRetentionMult
          ),
          computedDailyViews,
          artistPopularity,
          artistHype,
          isSingle,
          weekendLift,
          organicVariance: organicVariance * perSongVariance
        });
      const dailyStreams = baseStabilizedStreams;
      const newViews = (song.views || 0) + dailyViews;

      // 2. Organic Commercial Radio Airplay:
      const radioRotation = calculateOrganicRadioAirplay({
        song: { ...song, momentum: newMomentum, daysSinceRelease },
        dailyStreams,
        artistPopularity,
        artistHype,
        artistCountry,
        skills: playerSkills,
        daysSinceRelease,
        isSingle: trackRole !== 'b_side',
        radioModifier: distinctProfile.radioModifier * distroSpec.radioSyndicationMult,
        radioEligibilityMultiplier: trackProfile.radioEligibilityMultiplier
      });
      const dailyRadio = radioRotation.dailySpins;

      // 3. Organic Pure Digital & Physical Track Sales (with Audio Format & Retail Store Push):
      const effectiveSalesModifier = isSingle
        ? (singleDebut?.debutSalesMultiplier ?? distinctProfile.salesModifier)
        : distinctProfile.salesModifier;

      const rawDailySales = calculateOrganicDailySales({
        dailyStreams,
        song: { ...song, daysSinceRelease },
        artistPopularity,
        artistHype,
        skills: playerSkills,
        daysSinceRelease,
        isSingle: trackRole !== 'b_side',
        organicVariance: organicVariance * perSongVariance,
        salesModifier: effectiveSalesModifier,
        fans: playerFans
      });
      const computedDailySales = Math.max(0, Math.round(rawDailySales * enhancedMetrics.salesMultiplier));
      const baseStabilizedSales = calculateStabilizedDailyPureSales({
        song,
        daysSinceRelease,
        stabilizedDailyStreams: dailyStreams,
        computedDailySales,
        artistPopularity,
        artistHype,
        playerFans: playerFans || 0,
        isSingle,
        organicVariance: organicVariance * perSongVariance
      });
      const retailSingleMult =
        isSingle && daysSinceRelease <= 6 ? retailSpec.firstWeekSalesBoostMult : 1.0;
      const retailDay1Bonus =
        isSingle && daysSinceRelease === 0 ? retailSpec.bonusFirstDayUnitsSingle : 0;
      const dailySales = Math.max(
        0,
        Math.round(
          baseStabilizedSales *
            distroSpec.pureSalesConversionMult *
            audioFormatSpec.pureSalesMult *
            retailSingleMult +
            retailDay1Bonus
        )
      );

      const newRadioPlays = (song.radioPlays || 0) + dailyRadio;
      const newPureSales = (song.pureSales || 0) + dailySales;
      const newStreams = (song.streams || 0) + dailyStreams;

      // Realistic Music Video likes accumulation
      let updatedMvLikes = song.mvLikes;
      if (song.hasMV) {
        const eng = calculateMusicVideoEngagement(
          { ...song, views: newViews },
          undefined,
          artistHype,
          currentDate.toISOString()
        );
        updatedMvLikes = eng.likes;
      }

      // Separate Visualizer & Lyric Video daily views (distinct from Official MV views)
      const extraVisualMetrics = calculateDailyVisualizerAndLyricViews({
        song,
        dailyStreams,
        artistPopularity,
        artistHype,
        daysSinceRelease
      });
      const newVisualizerViews = (song.visualizerViews || 0) + extraVisualMetrics.dailyVisualizerViews;
      const newLyricVideoViews = (song.lyricVideoViews || 0) + extraVisualMetrics.dailyLyricVideoViews;
      const newVisualizerLikes = (song.visualizerLikes || 0) + extraVisualMetrics.newVisualizerLikes;
      const newLyricVideoLikes = (song.lyricVideoLikes || 0) + extraVisualMetrics.newLyricVideoLikes;
      const combinedExtraDailyViews =
        extraVisualMetrics.dailyVisualizerViews + extraVisualMetrics.dailyLyricVideoViews;

      totalStreams += dailyStreams;
      totalViews += dailyViews + combinedExtraDailyViews;
      totalSales += dailySales;
      // Authentic blended gross revenue: $0.0038/stream + $0.70/track download + $0.0022/YouTube view
      const grossSongRevenue =
        dailyStreams * 0.0038 +
        dailySales * 0.70 +
        (dailyViews + combinedExtraDailyViews) * 0.0022;

      const royaltySplitResult = processDailyDistributionRoyaltySplit({
        grossBaseRevenue: grossSongRevenue,
        dailyStreams,
        dailyViews: dailyViews + combinedExtraDailyViews,
        distributorId: song.distributorId || parentProject?.distributorId || parentProject?.distributor,
        royaltyArtistShare: song.royaltyArtistShare ?? parentProject?.royaltyArtistShare,
        unrecoupedAdvance: song.unrecoupedAdvance || 0,
        totalRoyaltiesEarned: song.totalRoyaltiesEarned || 0,
        contentIdEnabled: Boolean(song.contentIdEnabled ?? parentProject?.contentIdEnabled)
      });

      totalRevenue += royaltySplitResult.netPayableToArtistToday;

      // Weekly accumulation (rolling 7-day window for radio so old songs don't accumulate forever!)
      const weeklyStreams = (song.weeklyStreams || 0) + dailyStreams;
      const weeklyViews = (song.weeklyViews || 0) + dailyViews;
      const weeklyRadioPlays = Math.round(
        ((song.weeklyRadioPlays ? Math.min(song.weeklyRadioPlays, dailyRadio * 8) : dailyRadio * 6) * 6) / 7 +
          dailyRadio
      );
      const weeklyPureSales = (song.weeklyPureSales || 0) + dailySales;

      const prevStreams = song.dailyStreams !== undefined 
        ? song.dailyStreams 
        : Math.max(0, Math.floor(dailyStreams * (1 - (0.015 + ((song.id % 5) - 2) * 0.01))));
      const dailyChange = dailyStreams - prevStreams;
      const dailyChangePercent = prevStreams > 0 ? ((dailyChange / prevStreams) * 100) : 0;

      return {
        ...song,
        daysSinceRelease,
        momentum: newMomentum,
        streams: newStreams,
        views: newViews,
        mvLikes: updatedMvLikes,
        mvAdsDays: newMvAdsDays,
        visualizerViews: newVisualizerViews,
        dailyVisualizerViews: extraVisualMetrics.dailyVisualizerViews,
        visualizerLikes: newVisualizerLikes,
        lyricVideoViews: newLyricVideoViews,
        dailyLyricVideoViews: extraVisualMetrics.dailyLyricVideoViews,
        lyricVideoLikes: newLyricVideoLikes,
        radioPlays: newRadioPlays,
        pureSales: newPureSales,
        dailyStreams,
        prevDailyStreams: prevStreams,
        dailyChange,
        dailyChangePercent,
        dailyViews,
        dailyRadioPlays: dailyRadio,
        dailyPureSales: dailySales,
        weeklyStreams,
        weeklyViews,
        weeklyRadioPlays,
        weeklyPureSales,
        unrecoupedAdvance: royaltySplitResult.newUnrecoupedAdvance,
        totalRoyaltiesEarned: royaltySplitResult.newTotalRoyaltiesEarned
      };
    }
    return song;
  });

  // Released & Scheduled albums pure sales, pre-saves & momentum
  const updatedProjects = projects.map(proj => {
    if (proj.status === 'scheduled' && proj.releaseDate) {
      const todayStr = currentDate.toISOString().split('T')[0];
      if (todayStr >= proj.releaseDate) {
        proj = { ...proj, status: 'released' as const, momentum: 1.0, dailyPreSaves: 0 };
      } else {
        // Still counting down: accumulate daily Pre-Saves!
        const preSaveStep = calculateDailyProjectPreSaveGrowth(
          proj,
          updatedSongs,
          artistPopularity,
          artistHype,
          playerFans || 250,
          currentDate
        );
        return {
          ...proj,
          preSaves: preSaveStep.totalPreSaves,
          dailyPreSaves: preSaveStep.dailyPreSavesAdded
        };
      }
    }

    if (proj.status === 'released') {
      const projReleaseObj = proj.releaseDate ? new Date(proj.releaseDate) : currentDate;
      const projDaysSinceRelease = Math.max(0, Math.floor((currentDate.getTime() - projReleaseObj.getTime()) / (1000 * 60 * 60 * 24)));
      const newMomentum = Math.max(0.015, (proj.momentum || 1) * 0.972);
      const preSaveBoost = getPreSaveLaunchBoostMultipliers(proj.preSaves || 0);

      // Calibrated album pure sales: realistic industry volumes (thousands per day at launch, sustainable catalog)
      const rawAlbumSales = calculateRebalancedAlbumSales(
        proj.basePotential || 1,
        artistPopularity,
        newMomentum,
        projDaysSinceRelease,
        organicVariance,
        artistHype,
        proj.type === 'ep'
      );
      const projDistroSpec = getRealDistributorById(proj.distributorId || proj.distributor);
      const projAudioSpec = getAudioDeliveryFormatById(proj.audioFormat);
      const projRetailSpec = getPhysicalRetailTierById(proj.physicalRetailPush);

      const baseDailySales = Math.round(
        computeEnhancedProjectSales(
          rawAlbumSales,
          proj,
          artistHype,
          projDaysSinceRelease
        ) *
          projDistroSpec.pureSalesConversionMult *
          projAudioSpec.pureSalesMult
      );
      const retailProjMult =
        projDaysSinceRelease <= 6 ? projRetailSpec.firstWeekSalesBoostMult : 1.0;
      const retailProjDay1Bonus =
        projDaysSinceRelease === 0 ? projRetailSpec.bonusFirstDayUnitsProject : 0;

      const dailySales =
        projDaysSinceRelease === 0
          ? Math.round(
              baseDailySales * preSaveBoost.salesBoostMultiplier * retailProjMult +
                preSaveBoost.bonusFirstDaySales +
                retailProjDay1Bonus
            )
          : projDaysSinceRelease <= 6
          ? Math.round(
              baseDailySales *
                (1 + (preSaveBoost.salesBoostMultiplier - 1) * 0.45) *
                retailProjMult
            )
          : baseDailySales;

      const grossAlbumRevenue = dailySales * 9.99;
      const projRoyaltySplit = processDailyDistributionRoyaltySplit({
        grossBaseRevenue: grossAlbumRevenue,
        dailyStreams: 0,
        dailyViews: 0,
        distributorId: proj.distributorId || proj.distributor,
        royaltyArtistShare: proj.royaltyArtistShare,
        unrecoupedAdvance: proj.unrecoupedAdvance || 0,
        totalRoyaltiesEarned: proj.totalRoyaltiesEarned || 0,
        contentIdEnabled: false
      });

      totalRevenue += projRoyaltySplit.netPayableToArtistToday;
      totalSales += dailySales;

      const projSongs = updatedSongs.filter(s => proj.songs && proj.songs.some(ps => ps.id === s.id));
      const projDailyStreams = projSongs.reduce((acc, s) => acc + (s.dailyStreams || 0), 0);
      const projTotalStreams = projSongs.reduce((acc, s) => acc + (s.streams || 0), 0);
      const prevProjDaily = proj.dailyStreams !== undefined ? proj.dailyStreams : Math.floor(projDailyStreams * 0.98);
      const projChange = projDailyStreams - prevProjDaily;
      const projChangePercent = prevProjDaily > 0 ? ((projChange / prevProjDaily) * 100) : 0;

      return {
        ...proj,
        momentum: newMomentum,
        pureSales: (proj.pureSales || 0) + dailySales,
        dailyPureSales: dailySales,
        weeklyPureSales: (proj.weeklyPureSales || 0) + dailySales,
        dailyStreams: projDailyStreams,
        prevDailyStreams: prevProjDaily,
        dailyChange: projChange,
        dailyChangePercent: projChangePercent,
        totalStreams: projTotalStreams,
        unrecoupedAdvance: projRoyaltySplit.newUnrecoupedAdvance,
        totalRoyaltiesEarned: projRoyaltySplit.newTotalRoyaltiesEarned
      };
    }
    return proj;
  });

  return {
    updatedSongs,
    updatedProjects,
    totalStreams,
    totalViews,
    totalSales,
    totalRevenue
  };
}
