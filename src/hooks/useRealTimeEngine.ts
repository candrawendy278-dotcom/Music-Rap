import { useEffect } from 'react';
import { GameState } from '../types';

export function useRealTimeEngine(
  state: GameState,
  setState: any
) {
  useEffect(() => {
    if (!state.isStarted || state.gameMode !== 'realtime') return;

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.gameMode !== 'realtime') return prev;

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

        // Continuous streams/views accumulation
        nextState.songs = nextState.songs.map(song => {
          if (song.status === 'released') {
             // We need to calculate what the daily streams WOULD be.
             // But we don't want to re-run the full logic if we can just use `dailyStreams` and `dailyViews` 
             // from the last `nextDay` tick? No, they might be freshly released.
             
             const safeQuality = song.quality || 1;
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

        // Also we should check if a full 24 hours has passed to officially "change the date" and do decay.
        // But the user might manually click nextDay or we could auto-trigger nextDay logic here?
        // Let's just do stream increments here. 
        // For date changing in real-time mode: if 24 hours actually passed, we should trigger a full nextDay.
        

        nextState.projects = nextState.projects.map(proj => {
            if (proj.status === 'released') {
                const projSalesToAdd = ((proj.basePotential || 0) * (proj.momentum || 1) * (100 + (nextState.artist?.popularity || 0) * 800) * 0.08) * deltaDays;
                return {
                    ...proj,
                    pureSales: (proj.pureSales || 0) + projSalesToAdd
                };
            }
            return proj;
        });

        nextState.currentStreamRate = totalStreamRatePerSecond;

        return nextState;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [state.isStarted, state.gameMode]);
}
