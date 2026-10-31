import { useState, useCallback, useEffect } from 'react';
import { formatNum, formatNumFull } from '../constants';
import { ChartItem, GameState, Song, Project } from '../types';
import { NPCS, COUNTRY_TIERS } from '../constants';
import { getTrackCoverArt } from '../data/npcAssets';
import { getNpcVideoThumbnail } from '../data/npcYoutubeThumbnails';
import { getRealisticTrackTitle, getRealisticAlbumTitle, getSimulatedSingleEntry, getSimulatedAlbumEntry, getSimulatedVideoEntry } from '../data/musicCatalog';
import { evaluateSongHitScope, getCountryMarketProfile, generateAuthenticRegionalChart } from '../data/countryMarketSystem';
import { getCalibratedITunesAlbumScore } from '../data/albumSalesAndMarketCalibrator';
import { calculateDailyArtistGrowth } from '../data/artistGrowthEngine';
import { processDailyMarketStep } from '../data/marketStabilityEngine';
import { generateCuratedSpotifyPlaylists } from '../data/spotifyPlaylistsManager';
import { synchronizeChartMovements } from '../data/npcChartDynamicsEngine';
import { aggregateGlobal200Chart } from '../data/global200AggregationEngine';
import { recordWeeklyChartSnapshot } from '../data/billboardHistoryEngine';
import { updatePlayerBillboardHistoryOnMonday } from '../data/playerBillboardHistoryTracker';
import { calculateRealisticMonthlyListeners } from '../data/realisticSpotifyMonthlyListenersEngine';
import { evaluatePlaylistTenureAndRotations } from '../data/spotifyPlaylistTenureEngine';
import { createInitialSkillState, processDailySkillTraining } from '../data/skillSystemEngine';
import { getEnsuredPlayerFans, processDailyFanGrowth } from '../data/fansSystemEngine';
import { advanceXSocialDaily } from '../data/xSocialEngine';
import {
  getInitialBillboardSingles,
  getInitialBillboardAlbums,
  ensureBillboard200Albums,
  ensureBillboardSinglesChart
} from '../data/billboardInitialData';
import { syncNpcRealisticReleaseWorkflow } from '../data/npcRealisticReleaseWorkflowEngine';
import { generateRealNpcAlbumsChart } from '../data/npcRealReleaseChartsEngine';
import {
  syncPlayerNameNpcDeduplication,
  purgeDuplicateNpcFromGameState
} from '../data/npcPlayerDeduplicationEngine';
import { processDailyRivalSystemStep } from '../data/rivalBeefSystemEngine';
import { processDailyJobContractSalary } from '../data/jobsSystemEngine';
import { processDailyCollabRoyaltySplits } from '../data/collabNegotiationAndRoyaltyEngine';
import { calculateEnhancedMonthlyListenersStep } from '../data/enhancedMonthlyListenersAnalyticsEngine';
import { processDailyAwardsCalendarStep } from '../data/awardsFormulaAndSimulationEngine';
import { generateAwardEventXPosts } from '../data/awardsXAnnouncementEngine';
import { processDailyMerchWebstoreStep } from '../data/merchWebstoreEngine';
import { processDailyWorldTourStep } from '../data/worldTourSystemEngine';
import { calculateDailyExpensesBreakdown } from '../data/dailyExpensesEngine';
import { processDailyVanguardHonorsStep } from '../data/vanguardHonorsEngine';
import { processDailyGlobalRadioEcosystemStep } from '../data/globalRadioEcosystemEngine';
import { processDailyStaffTeamStep, calculateStaffTeamSynergyBuffs } from '../data/staffTeamEngine';
import { processDailyRecordLabelStep } from '../data/recordLabelSystemEngine';
import { syncActiveRosterArtistsToSharedWorld } from '../data/rosterSharedWorldBridge';
import { processDailyRecordLabelMerchStep } from '../data/recordLabelMerchEngine';
import { syncWorldNpcDeduplicationWithRoster } from '../data/rosterLifecycleAndNpcDedupEngine';

syncNpcRealisticReleaseWorkflow('2026-01-01T00:00:00');

export const initialState: GameState = {
  isStarted: false,
  artist: null,
  date: new Date('2026-01-01T00:00:00').toISOString(),
  money: 100000,
  popularity: 2.0,
  hype: 15.0,
  fans: 250,
  fansDelta: 0,
  dailyIncome: 0,
  dailyExpense: 150,
  dailyStreamsTotal: 0,
  songsIdCounter: 1,
  projectIdCounter: 1,
  songs: [],
  projects: [],
  spotify: { listeners: 0, followers: 0 },
  youtube: { subs: 0, charts: {} },
  billboard: {
    hot100: getInitialBillboardSingles('US'),
    global200: getInitialBillboardSingles('global'),
    albums200: getInitialBillboardAlbums()
  },
  itunes: { charts: {} },
  skills: createInitialSkillState(),
  xPosts: [],
  xProfile: { handle: '', bio: '', banner: '' },
  activeTab: 'dashboard',
  activeApp: 'none'
};

import { useRealTimeEngine } from './useRealTimeEngine';
import { saveGameStateSafely } from '../utils/saveStateOptimizer';
import {
  scheduleSmartAutoSave,
  flushPendingSaveImmediately
} from '../utils/smartStorageEngine';

export function useGame() {
  const [state, setState] = useState<GameState>(initialState);

  useRealTimeEngine(state, setState);

  // Whenever the Player's artist name is set or loaded, automatically remove any duplicate NPC with the same name
  useEffect(() => {
    const pName = state.artist?.name;
    syncPlayerNameNpcDeduplication(pName);
    if (pName) {
      setState(prev => purgeDuplicateNpcFromGameState(prev));
    }
  }, [state.artist?.name]);

  // Keep signed Record Label Roster Artists synced in the shared world cache for charts, playlists, and directories
  useEffect(() => {
    syncWorldNpcDeduplicationWithRoster(
      state.artist?.name,
      state.recordLabelState?.imprint?.signedRoster || []
    );
    syncActiveRosterArtistsToSharedWorld(state);
  }, [state.recordLabelState, state.date, state.artist?.name]);

  // Smart non-blocking auto-save: ignores UI tab/app switches (zero lag) and saves career mutations during idle frames
  useEffect(() => {
    if (state.isStarted) {
      scheduleSmartAutoSave(state, saveGameStateSafely);
    }
  }, [state]);

  // Flush any pending save immediately if the user reloads or closes the tab
  useEffect(() => {
    const handleUnloadOrHide = () => {
      flushPendingSaveImmediately(saveGameStateSafely);
    };
    window.addEventListener('pagehide', handleUnloadOrHide);
    window.addEventListener('beforeunload', handleUnloadOrHide);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleUnloadOrHide();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', handleUnloadOrHide);
      window.removeEventListener('beforeunload', handleUnloadOrHide);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);


  const [infoModal, setInfoModal] = useState<{title: string, desc: string} | null>(null);
  const [nextDayLoading, setNextDayLoading] = useState<{
    isLoading: boolean;
    stepMessage: string;
    progressPercent: number;
    currentDate?: string;
    nextDate?: string;
  }>({
    isLoading: false,
    stepMessage: '',
    progressPercent: 0
  });

  const nextDay = useCallback(() => {
    // If already processing, skip to avoid double execution
    if (nextDayLoading.isLoading) return;

    const currDateStr = state.date;
    const tomorrow = new Date(currDateStr);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDateStr = tomorrow.toISOString();

    // Start loading screen immediately
    setNextDayLoading({
      isLoading: true,
      stepMessage: 'Simulating 24h streams & radio airplay...',
      progressPercent: 30,
      currentDate: currDateStr,
      nextDate: nextDateStr
    });

    // Step 2: Charts
    setTimeout(() => {
      setNextDayLoading(prev => ({
        ...prev,
        stepMessage: 'Updating Billboard, Spotify & YouTube charts...',
        progressPercent: 65
      }));
    }, 240);

    // Step 3: Royalties
    setTimeout(() => {
      setNextDayLoading(prev => ({
        ...prev,
        stepMessage: 'Processing royalties & catalog earnings...',
        progressPercent: 88
      }));
    }, 480);

    // Step 4: Run the heavy state calculation non-blockingly so the browser stays fluid
    setTimeout(() => {
      try {
      setState(prev => {
        let nextState = { ...prev };
        let date = new Date(nextState.date);
        date.setDate(date.getDate() + 1);
        nextState.date = date.toISOString();

        try {
          // Sync Player & Roster-NPC deduplication & NPC realistic release workflow
          syncPlayerNameNpcDeduplication(nextState.artist?.name);
          syncWorldNpcDeduplicationWithRoster(
            nextState.artist?.name,
            nextState.recordLabelState?.imprint?.signedRoster || []
          );
          syncNpcRealisticReleaseWorkflow(date);

      // Update writing status (with Executive Producer quality floor bonus if hired)
      const staffSynergyForStudio = calculateStaffTeamSynergyBuffs(nextState);
      nextState.songs = nextState.songs.map(song => {
        if (song.status === 'writing' && song.daysLeft !== undefined) {
          if (song.daysLeft > 1) return { ...song, daysLeft: song.daysLeft - 1 };
          const boostedQuality = Math.min(
            100,
            Math.round((song.quality || 60) + (staffSynergyForStudio.qualityBonusPoints || 0) * 0.5)
          );
          return { ...song, daysLeft: 0, status: 'written' as const, quality: boostedQuality };
        }
        return song;
      });

      // Track Hiatus Days for Comeback Anticipation
      if (nextState.isHiatus) {
        (nextState as any).hiatusDays = ((nextState as any).hiatusDays || 0) + 1;
      } else {
        (nextState as any).hiatusDays = 0;
      }

      // Advance active skill training days (2x faster when on Hiatus!)
      if (nextState.skills) {
        const firstPass = processDailySkillTraining(nextState.skills);
        let finalSkills = firstPass.updatedSkills;
        const completedList = [...firstPass.completedTrainings];

        if (nextState.isHiatus) {
          const secondPass = processDailySkillTraining(finalSkills);
          finalSkills = secondPass.updatedSkills;
          completedList.push(...secondPass.completedTrainings);
        }

        nextState.skills = finalSkills;
        if (completedList.length > 0) {
          const names = completedList.map(t => `${t.skillName} (Lv. ${t.newLevel})`).join(', ');
          setTimeout(() => {
            setInfoModal({
              title: 'Skill Training Complete!',
              desc: `Your artist has mastered: ${names}! Your studio and songwriting output is permanently improved.`
            });
          }, 800);
        }
      }

      // Ensure player fan base
      const currentFans = getEnsuredPlayerFans(nextState);
      nextState.fans = currentFans;

      // Stable, authentic market simulation for all released songs and projects
      const marketResult = processDailyMarketStep(
        nextState.songs,
        nextState.projects,
        nextState.artist?.country || 'US',
        nextState.popularity || 2.0,
        nextState.hype || 15.0,
        nextState.artist?.tier || 3,
        date,
        nextState.skills,
        currentFans
      );

      // Process Collaboration Royalty Splits (deducts agreed % for featured NPC artists)
      const collabRoyaltyStep = processDailyCollabRoyaltySplits(marketResult.updatedSongs);
      nextState.songs = collabRoyaltyStep.updatedSongs;
      nextState.projects = marketResult.updatedProjects;

      // Process Official Artist Merch & Vinyl Webstore daily sales, pre-order waves & Billboard pure sales credits
      const merchStep = processDailyMerchWebstoreStep(nextState, date);
      nextState.projects = merchStep.updatedProjects;
      nextState.songs = merchStep.updatedSongs;
      nextState.merchStore = merchStep.updatedStore;

      // Process Global Radio Ecosystem daily step (feeds Billboard Airplay points & organic streaming discovery only)
      const radioEcoStep = processDailyGlobalRadioEcosystemStep(nextState, date);
      nextState.songs = radioEcoStep.updatedSongs;
      (nextState as any).radioEcosystemState = radioEcoStep.updatedRadioState;

      const totalStreams = marketResult.totalStreams + radioEcoStep.dailyStreamDiscoveryAdded;
      const totalViews = marketResult.totalViews;
      const totalSales = marketResult.totalSales + merchStep.dailyBillboardUnitsAdded;
      const netRevenueAfterCollabRoyalties = Math.max(
        0,
        marketResult.totalRevenue - collabRoyaltyStep.totalCollabRoyaltyDeducted
      );

      nextState.dailyStreamsTotal = totalStreams;
      const safeMerchDailyIncome = Math.max(0, Math.round(Number(merchStep.dailyMerchRevenue) || 0));
      nextState.dailyIncome = Math.max(0, Math.round(netRevenueAfterCollabRoyalties + safeMerchDailyIncome));

      // Process Executive Staff Team daily progression, XP leveling, directive cooldowns & passive/active buffs
      processDailyStaffTeamStep(nextState, date);

      // Process Record Label contract recoupment, quota deliveries, 360 splits & Player Imprint daily royalties
      processDailyRecordLabelStep(nextState, date);

      // Process Record Label Official Merch & Vinyl Webstore daily sales & Billboard pure sales credits for Roster Artists
      const labelMerchStep = processDailyRecordLabelMerchStep(nextState, date);
      if (labelMerchStep?.nextState) {
        nextState = labelMerchStep.nextState;
      }
      if (labelMerchStep?.nextLabelMerchStore) {
        (nextState as any).labelMerchStore = labelMerchStep.nextLabelMerchStore;
      }
      const labelMerchProfit =
        labelMerchStep?.dailyNetProfitForLabel ?? labelMerchStep?.labelNetRevenueIncrement ?? 0;
      if (labelMerchProfit > 0) {
        nextState.dailyIncome = Math.max(
          0,
          Math.round((nextState.dailyIncome || 0) + labelMerchProfit)
        );
      }

      const expenseBreakdown = calculateDailyExpensesBreakdown(nextState);
      nextState.dailyExpense = expenseBreakdown.rawRecurringExpense;
      const effectiveDailyExpense = expenseBreakdown.effectiveRecurringExpense;
      const currentMoneySafe = Math.max(0, Math.round(Number(nextState.money) || 0));
      nextState.money = Math.max(0, currentMoneySafe + nextState.dailyIncome - effectiveDailyExpense);

      // Calculate dynamic Popularity and Hype shifts using dedicated Artist Growth Engine
      const growth = calculateDailyArtistGrowth({
        currentPopularity: nextState.popularity || 2.0,
        currentHype: nextState.hype || 15.0,
        dailyStreamsTotal: totalStreams,
        dailyViewsTotal: totalViews,
        dailyPureSalesTotal: totalSales,
        releasedSongs: nextState.songs.filter(s => s.status === 'released'),
        releasedProjects: nextState.projects.filter(p => p.status === 'released'),
        currentDateStr: nextState.date.split('T')[0],
        isHiatus: nextState.isHiatus
      });

      nextState.popularity = growth.newPopularity;
      nextState.hype = growth.newHype;
      nextState.popDelta = growth.popDelta;
      nextState.hypeDelta = growth.hypeDelta;
      if (nextState.artist) {
        nextState.artist.popularity = growth.newPopularity;
        nextState.artist.hype = growth.newHype;
      }

      // Process Daily Fan Growth
      const fanGrowth = processDailyFanGrowth({
        currentFans,
        popularity: nextState.popularity || 2.0,
        hype: nextState.hype || 15.0,
        dailyStreams: totalStreams,
        dailyViews: totalViews,
        dailyPureSales: totalSales,
        releasedSongs: nextState.songs.filter(s => s.status === 'released'),
        skills: nextState.skills,
        hasRecentRelease: nextState.songs.some(s => s.status === 'released' && s.daysSinceRelease !== undefined && s.daysSinceRelease <= 3)
      });
      nextState.fans = fanGrowth.updatedFans;
      nextState.fansDelta = fanGrowth.dailyGain;

      const newFollowers = Math.floor(totalStreams * 0.0012);
      nextState.spotify.followers += newFollowers;
      
      // Dynamic playlist lifecycle: naturally rotates songs in and out of playlists based on tenure & velocity
      const playlistRotation = evaluatePlaylistTenureAndRotations(nextState.songs, date);
      nextState.songs = playlistRotation.updatedSongs;

      // Enhanced 28-day rolling Spotify Monthly Listeners (new release surge, playlist reach, collab crossover, peak & delta)
      const listenerStep = calculateEnhancedMonthlyListenersStep({
        dailyStreams: totalStreams,
        popularity: nextState.popularity,
        hype: nextState.hype,
        followers: nextState.spotify.followers,
        previousListeners: nextState.spotify.listeners,
        previousPeak: nextState.spotify.peakListeners || nextState.spotify.listeners,
        releasedSongs: nextState.songs.filter(s => s.status === 'released')
      });
      nextState.spotify.listeners = listenerStep.listeners;
      nextState.spotify.listenerDelta = listenerStep.listenerDelta;
      nextState.spotify.peakListeners = listenerStep.peakListeners;

      nextState.youtube.subs += Math.floor((totalStreams * 0.5) * 0.002);

      // Process Rival & Chart-Block Beef System before chart generation so Rival counter-drops compete on charts
      (nextState as any).rivalState = processDailyRivalSystemStep(nextState);

      if (date.getDay() === 1) {
         const countriesList = Object.keys(COUNTRY_TIERS);
         
         const prevHot100 = [...(nextState.billboard.hot100 || [])];
         const prevAlbums200 = [...(nextState.billboard.albums200 || [])];
         const prevGlobal = [...(nextState.billboard.global200 || [])];
         const prevRegional = { ...(nextState.billboard.regionalSingles || {}) };

         const releasedPlayerSongs = nextState.songs.filter(s => s.status === 'released');
         const pName = nextState.artist?.name || '';
         const pCountry = nextState.artist?.country || 'US';
         const pPop = nextState.popularity;
         const pHype = nextState.hype;

         // 1. Generate authentic regional Billboard singles for all countries in the game first
         nextState.billboard = {
           ...nextState.billboard,
           regionalSingles: {}
         };
         countriesList.forEach(cc => {
             const chart = generateAuthenticRegionalChart({
                 platform: 'billboard',
                 region: cc,
                 playerSongs: releasedPlayerSongs,
                 playerName: pName,
                 playerCountry: pCountry,
                 playerPopularity: pPop,
                 playerHype: pHype,
                 currentDate: date,
                 limit: 100
             });
             nextState.billboard.regionalSingles![cc] = synchronizeChartMovements(
                 chart,
                 prevRegional[cc],
                 true,
                 date,
                 `billboard_singles_${cc}`
             );
         });
         
         nextState.billboard.hot100 = ensureBillboardSinglesChart(
             nextState.billboard.regionalSingles['US'],
             'US',
             prevHot100,
             date
         );

         // 2. Aggregate Billboard Global 200 from all countries in the game (worldwide streaming + sales)
         const aggregatedGlobal200 = aggregateGlobal200Chart(
             nextState.billboard.regionalSingles,
             releasedPlayerSongs,
             pName
         );
         nextState.billboard.global200 = ensureBillboardSinglesChart(
             synchronizeChartMovements(aggregatedGlobal200, prevGlobal, true, date, 'billboard_singles_global'),
             'global',
             prevGlobal,
             date
         );

         const allAlbums = generateRealNpcAlbumsChart({
             platform: 'billboard',
             region: 'global',
             playerProjects: nextState.projects,
             playerSongs: nextState.songs,
             playerName: pName,
             playerCountry: pCountry,
             currentDate: date,
             limit: 200
         });
         nextState.billboard.albums200 = ensureBillboard200Albums(
             synchronizeChartMovements(allAlbums, prevAlbums200, true, date, 'billboard_albums200'),
             prevAlbums200,
             date
         );

          // Archive this week's finalized Billboard charts into historical snapshots
          nextState.billboard.history = recordWeeklyChartSnapshot(
              nextState.billboard.history || [],
              nextState,
              date
          );

          // Update player's official Billboard Artist Chart History
          nextState.billboard.playerHistory = updatePlayerBillboardHistoryOnMonday(
              nextState,
              date
          );
      } // END BILLBOARD WEEKLY



         // --- YOUTUBE DAILY CHARTS ---
         nextState.youtube = {
             ...nextState.youtube,
             charts: { ...(nextState.youtube.charts || {}) }
         };
         
         const generateYoutubeChart = (region: string) => {
             return generateAuthenticRegionalChart({
                 platform: 'youtube',
                 region,
                 playerSongs: nextState.songs.filter(s => s.status === 'released' && s.hasMV),
                 playerName: nextState.artist?.name || '',
                 playerCountry: nextState.artist?.country || 'US',
                 playerPopularity: nextState.popularity,
                 playerHype: nextState.hype,
                 currentDate: date,
                 limit: 50
             });
         };

         const finalizeYoutubeChart = (chart: any[], prevChart: any[], keyName: string) => {
             return synchronizeChartMovements(chart, prevChart, false, date, keyName);
         };

         // Core daily territories for instant, lag-free transitions (others fallback or generate on demand)
         const coreDailyCountries = Array.from(new Set(['US', 'GB', 'JP', 'ID', 'BR', nextState.artist?.country || 'US']));

         // Generate YouTube Global Daily
         const prevYTGlobalDaily = nextState.youtube.charts['daily_global'] || [];
         nextState.youtube.charts['daily_global'] = finalizeYoutubeChart(
             generateYoutubeChart('global'),
             prevYTGlobalDaily,
             'youtube_daily_global'
         );

         coreDailyCountries.forEach(cc => {
             const prevYTCountryDaily = nextState.youtube.charts[`daily_${cc}`] || [];
             nextState.youtube.charts[`daily_${cc}`] = finalizeYoutubeChart(
                 generateYoutubeChart(cc),
                 prevYTCountryDaily,
                 `youtube_daily_${cc}`
             );
         });

         // --- SPOTIFY DAILY CHARTS ---
         nextState.spotify = {
             ...nextState.spotify,
             charts: { ...(nextState.spotify.charts || {}) },
             playlists: { ...(nextState.spotify.playlists || {}) }
         };

         const generateSpotifyChart = (isWeekly: boolean, region: string) => {
             return generateAuthenticRegionalChart({
                 platform: 'spotify',
                 region,
                 playerSongs: nextState.songs.filter(s => s.status === 'released'),
                 playerName: nextState.artist?.name || '',
                 playerCountry: nextState.artist?.country || 'US',
                 playerPopularity: nextState.popularity,
                 playerHype: nextState.hype,
                 isWeekly,
                 currentDate: date,
                 limit: 50
             });
         };

         const finalizeSpotifyChart = (chart: any[], prevChart: any[], isWeekly = false, keyName = 'spotify_chart') => {
             return synchronizeChartMovements(chart, prevChart, isWeekly, date, keyName);
         };

         // Generate Global Daily
         const prevGlobalDaily = nextState.spotify.charts['daily_global'] || [];
         nextState.spotify.charts['daily_global'] = finalizeSpotifyChart(
             generateSpotifyChart(false, 'global'),
             prevGlobalDaily,
             false,
             'spotify_daily_global'
         );

         coreDailyCountries.forEach(cc => {
             const prevCountryDaily = nextState.spotify.charts[`daily_${cc}`] || [];
             nextState.spotify.charts[`daily_${cc}`] = finalizeSpotifyChart(
                 generateSpotifyChart(false, cc),
                 prevCountryDaily,
                 false,
                 `spotify_daily_${cc}`
             );
         });

         // --- ITUNES DAILY CHARTS ---
         nextState.itunes = {
             ...nextState.itunes,
             charts: { ...(nextState.itunes.charts || {}) }
         };
         
         const generateITunesChart = (region: string) => {
             return generateAuthenticRegionalChart({
                 platform: 'itunes',
                 region,
                 playerSongs: nextState.songs.filter(s => s.status === 'released'),
                 playerName: nextState.artist?.name || '',
                 playerCountry: nextState.artist?.country || 'US',
                 playerPopularity: nextState.popularity,
                 playerHype: nextState.hype,
                 currentDate: date,
                 limit: 50
             });
         };

         const generateITunesAlbumChart = (region: string) => {
             return generateRealNpcAlbumsChart({
                 platform: 'itunes',
                 region,
                 playerProjects: nextState.projects,
                 playerSongs: nextState.songs,
                 playerName: nextState.artist?.name || '',
                 playerCountry: nextState.artist?.country || 'US',
                 currentDate: date,
                 limit: 50
             });
         };

         const finalizeITunesChart = (currentChart: any[], prevChart: any[], keyName: string) => {
             return synchronizeChartMovements(currentChart, prevChart, false, date, keyName);
         };

         // Generate Global Daily
         const prevITGlobalDaily = nextState.itunes.charts['daily_global'] || [];
         nextState.itunes.charts['daily_global'] = finalizeITunesChart(
             generateITunesChart('global'),
             prevITGlobalDaily,
             'itunes_daily_global'
         );

         const prevITAlbumsGlobalDaily = nextState.itunes.charts['albums_global'] || [];
         nextState.itunes.charts['albums_global'] = finalizeITunesChart(
             generateITunesAlbumChart('global'),
             prevITAlbumsGlobalDaily,
             'itunes_albums_global'
         );

         // Generate core countries Daily
         coreDailyCountries.forEach(cc => {
             const prevITCountryDaily = nextState.itunes.charts[`daily_${cc}`] || [];
             nextState.itunes.charts[`daily_${cc}`] = finalizeITunesChart(
                 generateITunesChart(cc),
                 prevITCountryDaily,
                 `itunes_daily_${cc}`
             );

             const prevITAlbumsCountryDaily = nextState.itunes.charts[`albums_${cc}`] || [];
             nextState.itunes.charts[`albums_${cc}`] = finalizeITunesChart(
                 generateITunesAlbumChart(cc),
                 prevITAlbumsCountryDaily,
                 `itunes_albums_${cc}`
             );
         });

         // --- END ITUNES DAILY CHARTS ---

         const isMonday = date.getDay() === 1;
         const isWeeklyMissing = !nextState.spotify.charts['weekly_global'];

         if (isMonday || isWeeklyMissing) {
             const prevGlobalWeekly = nextState.spotify.charts['weekly_global'] || [];
             nextState.spotify.charts['weekly_global'] = finalizeSpotifyChart(
                 generateSpotifyChart(true, 'global'),
                 prevGlobalWeekly,
                 true,
                 'spotify_weekly_global'
             );
             
             const weeklyCountriesToSync = isMonday ? Object.keys(COUNTRY_TIERS) : coreDailyCountries;
             weeklyCountriesToSync.forEach(cc => {
                 const prevCountryWeekly = nextState.spotify.charts[`weekly_${cc}`] || [];
                 nextState.spotify.charts[`weekly_${cc}`] = finalizeSpotifyChart(
                     generateSpotifyChart(true, cc),
                     prevCountryWeekly,
                     true,
                     `spotify_weekly_${cc}`
                 );
             });
         }
         
         // Playlists update weekly or if uninitialized
         const isPlaylistsMissing = !nextState.spotify.playlists || !nextState.spotify.playlists['tth'] || nextState.spotify.playlists['tth'].length === 0;
         if (isMonday || isPlaylistsMissing) {
             nextState.spotify.playlists = generateCuratedSpotifyPlaylists(
                 nextState.songs,
                 nextState.artist?.name || ''
             );
         }

         if (isMonday) {
             // Reset weekly stats smoothly to today's count to start the new week without dropping to zero
             nextState.songs = nextState.songs.map(s => ({
                 ...s,
                 weeklyStreams: s.dailyStreams || 0,
                 weeklyViews: s.dailyViews || 0,
                 weeklyPureSales: s.dailyPureSales || 0,
                 weeklyRadioPlays: s.dailyRadioPlays || 0
             }));
             nextState.projects = nextState.projects.map(p => ({
                 ...p,
                 weeklyPureSales: p.dailyPureSales || 0
             }));
         }
        // --- END SPOTIFY DAILY CHARTS ---

        // Process Daily Job Contract Salary & reset daily shift stamina
        const jobSalaryStep = processDailyJobContractSalary(nextState, nextState.date);
        const safeSalaryPaid = Math.max(0, Math.round(Number(jobSalaryStep.salaryPaid) || 0));
        nextState.money = Math.max(0, (nextState.money || 0) + safeSalaryPaid);
        nextState.dailyIncome = (nextState.dailyIncome || 0) + safeSalaryPaid;
        (nextState as any).jobsState = jobSalaryStep.updatedJobsState;

        // Process Daily World Tour Stop, Boxscore Revenue, Merch Booth Sales & @TouringData X Reports
        const tourStep = processDailyWorldTourStep(nextState, date);
        (nextState as any).tourState = tourStep.updatedTourState;
        nextState.songs = tourStep.updatedSongs;
        if (tourStep.dailyTourNetIncome > 0) {
          const safeTourNet = Math.round(tourStep.dailyTourNetIncome);
          nextState.money = Math.max(0, (nextState.money || 0) + safeTourNet);
          nextState.dailyIncome = (nextState.dailyIncome || 0) + safeTourNet;
        }
        if (tourStep.popGain > 0) {
          nextState.popularity = Math.min(100, Number(((nextState.popularity || 0) + tourStep.popGain).toFixed(2)));
        }
        if (tourStep.hypeGain > 0) {
          nextState.hype = Math.min(100, Number(((nextState.hype || 0) + tourStep.hypeGain).toFixed(2)));
        }
        if (tourStep.fanGain > 0) {
          nextState.fans = (nextState.fans || 250) + tourStep.fanGain;
        }
        if (tourStep.newXPosts.length > 0) {
          nextState.xPosts = [...tourStep.newXPosts, ...(nextState.xPosts || [])].slice(0, 120);
        }

        // Advance X Social stats daily AFTER all charts are finalized so tweets report 100% accurate live ranks & points
        nextState.xPosts = advanceXSocialDaily(nextState.xPosts || [], nextState);

        // Process Annual GRAMMYs & MTV VMAs Calendar (Nominations & Ceremony Night + X Official Announcements)
        const awardsStep = processDailyAwardsCalendarStep(nextState, date);
        (nextState as any).awardsState = awardsStep.updatedAwardsState;
        if (awardsStep.triggeredEvent) {
          const awardTweets = generateAwardEventXPosts(
            nextState,
            awardsStep.triggeredEvent.season,
            awardsStep.triggeredEvent.eventType
          );
          nextState.xPosts = [...awardTweets, ...(nextState.xPosts || [])].slice(0, 120);
        }

        // Process Annual Vanguard Music Honors (May 10 Nominations & June 20 Live Gala Ceremony + X Announcements)
        const vanguardStep = processDailyVanguardHonorsStep(nextState, date);
        (nextState as any).vanguardState = vanguardStep.updatedVanguardState;
        if (vanguardStep.popGain > 0) {
          nextState.popularity = Math.min(100, Number(((nextState.popularity || 0) + vanguardStep.popGain).toFixed(2)));
        }
        if (vanguardStep.hypeGain > 0) {
          nextState.hype = Math.min(100, Number(((nextState.hype || 0) + vanguardStep.hypeGain).toFixed(2)));
        }
        if (vanguardStep.newXPosts.length > 0) {
          nextState.xPosts = [...vanguardStep.newXPosts, ...(nextState.xPosts || [])].slice(0, 120);
        }
        } catch (innerErr) {
          console.error('Error inside nextDay state calculation:', innerErr);
        }

        return nextState || prev;
      });
      } catch (err) {
        console.error('Error during nextDay transition:', err);
      } finally {
        // Complete progress smoothly
        setNextDayLoading(prev => ({
          ...prev,
          stepMessage: 'Day transition complete!',
          progressPercent: 100
        }));

        setTimeout(() => {
          setNextDayLoading({
            isLoading: false,
            stepMessage: '',
            progressPercent: 0
          });
        }, 300);
      }
    }, 720);
  }, [nextDayLoading.isLoading, state?.date]);

  const openInfo = useCallback((title: string, desc: string) => {
    setInfoModal({ title, desc });
  }, []);

  return {
    state,
    setState,
    nextDay,
    nextDayLoading,
    infoModal,
    setInfoModal,
    openInfo
  };
}
