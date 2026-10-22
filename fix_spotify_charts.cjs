const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

const spotifyLogic = `
         // --- SPOTIFY DAILY CHARTS ---
         nextState.spotify.charts = nextState.spotify.charts || {};
         nextState.spotify.playlists = nextState.spotify.playlists || {};
         
         const fakeArtistsSpotify = ['Drakeo', 'Bad Bunnyito', 'Taylor Swiftly', 'The Weekend', 'Dua Peepa', 'Ed Shearin', 'Billie Eyelash', 'Ariana Grande Venti', 'Posty', 'Olivia Rodrigoa', 'Justin Beebs', 'Doja Kitty', 'Harry Styles', 'SZA', 'Kendrick Llama'];
         const fakeTracksSpotify = ['Smash Hit', 'Vibes', 'Heartbreak', 'Summer Night', 'Late Night', 'Party', 'Chill', 'Love', 'Sadness', 'Joy', 'Anger', 'Fear', 'Disgust', 'Surprise', 'Anticipation', 'Trust'];

         const generateSpotifyChart = (isWeekly, region) => {
             let chart = [];
             
             nextState.songs.filter(s => s.status === 'released').forEach(s => {
                  let baseSt = isWeekly ? (s.weeklyStreams || 0) : ((s.basePotential * s.momentum) * (200 + (nextState.artist?.popularity || 0) * 150));
                  
                  let totalW = 0;
                  const w = {};
                  Object.keys(COUNTRY_TIERS).forEach(cc => {
                      w[cc] = (5 - COUNTRY_TIERS[cc]) * (Math.random() * 0.5 + 0.5);
                      if (cc === nextState.artist?.country) w[cc] *= 4;
                      totalW += w[cc];
                  });
                  
                  let regSt = baseSt * (w[region] / totalW);
                  if (region === 'global') regSt = baseSt;
                  
                  if (regSt > 0) {
                      chart.push({ title: s.title, artist: nextState.artist?.name || '', points: regSt, isPlayer: true, cover: s.cover, lastPosition: null });
                  }
             });
             
             NPCS.forEach(n => {
                  n.songs?.forEach(s => {
                       let regionModifier = region === 'global' ? 1 : (0.2 + Math.random() * 1.8);
                       let baseSt = isWeekly ? (n.pop * 180000 * (0.8 + Math.random() * 0.4)) : (n.pop * 25000 * (0.8 + Math.random() * 0.4));
                       baseSt *= regionModifier;
                       
                       let regSt = baseSt; 
                       if (region !== 'global') { 
                           let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.5 + 0.5); 
                           regSt = baseSt * (weight / 150); 
                       }
                       
                       chart.push({ title: s.title, artist: n.name, points: regSt, isPlayer: false, cover: null, lastPosition: null });
                  });
             });
             
             for (let i = 0; i < 60; i++) {
                  const art = fakeArtistsSpotify[i % fakeArtistsSpotify.length];
                  const trk = fakeTracksSpotify[i % fakeTracksSpotify.length] + ' ' + (i % 5 + 1);
                  let baseSt = isWeekly ? (25000000 * Math.pow(0.85, Math.pow(i, 0.8))) : (3500000 * Math.pow(0.85, Math.pow(i, 0.8)));
                  
                  let regSt = baseSt; 
                  if (region !== 'global') { 
                      let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.8 + 0.2); 
                      regSt = baseSt * (weight / 150); 
                  }
                  
                  chart.push({ title: art + ' - ' + trk, artist: art, points: regSt, isPlayer: false, cover: null, lastPosition: null });
             }
             
             chart.sort((a,b) => b.points - a.points);
             return chart.slice(0, 50);
         };

         const finalizeSpotifyChart = (chart, prevChart) => {
             chart.forEach((item, idx) => {
                 const currPos = idx + 1;
                 const prev = prevChart ? prevChart.find(c => c.title === item.title && c.artist === item.artist) : null;
                 if (prev) {
                     item.lastPosition = prevChart.indexOf(prev) + 1;
                 } else {
                     item.lastPosition = null; 
                 }
             });
         };

         // Generate Global Daily
         const prevGlobalDaily = nextState.spotify.charts['daily_global'] || [];
         nextState.spotify.charts['daily_global'] = generateSpotifyChart(false, 'global');
         finalizeSpotifyChart(nextState.spotify.charts['daily_global'], prevGlobalDaily);

         Object.keys(COUNTRY_TIERS).forEach(cc => {
             const prevCountryDaily = nextState.spotify.charts[\`daily_\${cc}\`] || [];
             nextState.spotify.charts[\`daily_\${cc}\`] = generateSpotifyChart(false, cc);
             finalizeSpotifyChart(nextState.spotify.charts[\`daily_\${cc}\`], prevCountryDaily);
         });
`;

code = code.replace(
    /         const generateITunesChart = \(region\) => \{/,
    spotifyLogic + '\n         const generateITunesChart = (region) => {'
);

fs.writeFileSync('src/hooks/useGame.ts', code);
