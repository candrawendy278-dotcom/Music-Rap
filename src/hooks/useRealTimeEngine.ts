import { useEffect } from 'react';
import { GameState } from '../types';

export function useRealTimeEngine(
  state: GameState,
  setState: any
) {
  useEffect(() => {
    if (!state?.isStarted || state?.gameMode !== 'realtime') return;

    const interval = setInterval(() => {
      setState((prev: GameState) => {
        if (!prev || prev.gameMode !== 'realtime') return prev;

        const now = Date.now();
        const lastUpdate = prev.lastRealTimeUpdate || now;
        const deltaMs = now - lastUpdate;
        
        // Let's assume 1 real second = 1 game second.
        // Wait, the user said "hari berganti itu kayak dunia nyata 24 jam"
        // So 24 real hours = 1 game day.
        // The dailyPotential in the game is calculated per day.
        // So we divide daily increments by (24 * 60 * 60 * 1000) = 86,400,000 ms.
        // BUT they still need the day to change, charts to update, etc.
        // What if we just add the streams continuously based on their current momentum?

        const deltaDays = deltaMs / 86400000; 

        if (deltaDays <= 0) {
            if (!prev.lastRealTimeUpdate) {
                return { ...prev, lastRealTimeUpdate: now };
            }
            return prev;
        }

        let nextState = { ...prev, lastRealTimeUpdate: now };
        let totalStreamRatePerSecond = 0;
        let realtimeRevenueEarned = 0;

        // Continuous streams/views accumulation
        nextState.songs = nextState.songs.map(song => {
          if (song.status === 'released') {
             const rng = 1.0; // static rng for real-time
             const tierMultiplier = prev.artist?.tier === 1 ? 1.5 : (prev.artist?.tier === 2 ? 1.8 : 1.0);
             const baseMultiplier = 300 + (prev.popularity * 250) + (prev.hype * 80);
             
             let playlistBoost = 1.0;
             if (song.playlistPlacements) {
                 song.playlistPlacements.forEach(pid => {
                     if (pid === 'tth') playlistBoost += 1.5;
                     else if (pid === 'nmf') playlistBoost += 0.3;
                     else if (pid === 'rc') playlistBoost += 0.8;
                     else if (pid === 'pr') playlistBoost += 0.4;
                     else if (pid === 'v50') playlistBoost += 0.6;
                 });
             }
             
             // The stream rate per DAY: prioritize song's dailyStreams if already computed
             const streamRatePerDay = (song.dailyStreams !== undefined && song.dailyStreams > 0)
                 ? song.dailyStreams
                 : ((song.basePotential || 0) * (song.momentum || 1) * rng * baseMultiplier * tierMultiplier * playlistBoost);
             const streamsToAdd = streamRatePerDay * deltaDays;
             totalStreamRatePerSecond += (streamRatePerDay / 86400);

             let mvViewsToAdd = 0;
             if (song.hasMV) {
                 const dailyViewsRate = song.dailyViews !== undefined ? song.dailyViews : (streamRatePerDay * 0.65);
                 mvViewsToAdd = dailyViewsRate * deltaDays;
                 if ((song.mvAdsDays || 0) > 0) {
                     mvViewsToAdd += (75000 * deltaDays);
                 }
             }

             const radioToAdd = (song.dailyRadioPlays !== undefined ? song.dailyRadioPlays : ((song.basePotential || 0) * (song.momentum || 1) * 25)) * deltaDays;
             const salesToAdd = (song.dailyPureSales !== undefined ? song.dailyPureSales : (streamsToAdd * 0.00015)) * deltaDays;

             const collabKeepRatio = song.collabId && song.collabId !== 'none'
                 ? Math.max(0.2, 1 - (song.collabRoyaltyPercent || 0) / 100)
                 : 1.0;
             realtimeRevenueEarned +=
                 (streamsToAdd * 0.0038 + mvViewsToAdd * 0.0022 + salesToAdd * 0.70) * collabKeepRatio;

             return {
                 ...song,
                 streams: (song.streams || 0) + streamsToAdd,
                 views: (song.views || 0) + mvViewsToAdd,
                 radioPlays: (song.radioPlays || 0) + radioToAdd,
                 pureSales: (song.pureSales || 0) + salesToAdd,
             };
          }
          return song;
        });

        nextState.projects = nextState.projects.map(proj => {
            if (proj.status === 'released') {
                const projSalesToAdd = ((proj.basePotential || 0) * (proj.momentum || 1) * (100 + (nextState.artist?.popularity || 0) * 800) * 0.08) * deltaDays;
                realtimeRevenueEarned += projSalesToAdd * 4.5;
                return {
                    ...proj,
                    pureSales: (proj.pureSales || 0) + projSalesToAdd
                };
            }
            return proj;
        });

        if (realtimeRevenueEarned > 0) {
            nextState.money = Math.max(0, (nextState.money || 0) + realtimeRevenueEarned);
        }
        nextState.currentStreamRate = totalStreamRatePerSecond;

        return nextState;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [state?.isStarted, state?.gameMode]);
}
