const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// I will insert fake artists and tracks into iTunes chart generation to ensure it reaches at least 50
const itunesChartReplacement = `
         const generateITunesChart = (region) => {
             let chart = [];
             
             nextState.songs.filter(s => s.status === 'released').forEach(s => {
                  let globalSt = s.dailyPureSales || ((s.basePotential * s.momentum) * 100);
                  
                  let totalW = 0;
                  const w = {};
                  Object.keys(COUNTRY_TIERS).forEach(cc => {
                      w[cc] = (5 - COUNTRY_TIERS[cc]) * (Math.random() * 0.5 + 0.5);
                      if (cc === nextState.artist?.country) w[cc] *= 8;
                      totalW += w[cc];
                  });
                  
                  let regSt = globalSt * (w[region] / totalW);
                  if (region === 'global') regSt = globalSt;
                  
                  if (regSt > 0) {
                      chart.push({ title: s.title, artist: nextState.artist?.name || '', points: regSt, isPlayer: true, cover: s.cover, lastPosition: null });
                  }
             });
             
             NPCS.forEach(n => {
                  n.songs?.forEach(s => {
                       let regionModifier = region === 'global' ? 1 : (0.3 + Math.random() * 1.4);
                       let baseSt = (n.pop * 350) * (0.8 + Math.random() * 0.4) * regionModifier; 
                       
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
                  const trk = fakeTracksSpotify[(i+3) % fakeTracksSpotify.length] + ' ' + (i % 3 + 1);
                  let baseSt = 80000 * Math.pow(0.85, Math.pow(i, 0.8));
                  
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

         const generateITunesAlbumChart = (region) => {
             let chart = [];
             
             nextState.projects.filter(p => p.status === 'released').forEach(p => {
                  const pSongs = nextState.songs.filter(s => p.songs.some(ps => ps.id === s.id));
                  const totalProjSales = (p.dailyPureSales || 0) + pSongs.reduce((acc, s) => acc + (s.dailyPureSales || 0), 0);
                  let globalSt = totalProjSales || ((p.basePotential * p.momentum) * 400);
                  
                  let totalW = 0;
                  const w = {};
                  Object.keys(COUNTRY_TIERS).forEach(cc => {
                      w[cc] = (5 - COUNTRY_TIERS[cc]) * (Math.random() * 0.5 + 0.5);
                      if (cc === nextState.artist?.country) w[cc] *= 8;
                      totalW += w[cc];
                  });
                  
                  let regSt = globalSt * (w[region] / totalW);
                  if (region === 'global') regSt = globalSt;
                  
                  if (regSt > 0) {
                      chart.push({ title: p.title, artist: nextState.artist?.name || '', points: regSt, isPlayer: true, cover: p.cover, lastPosition: null });
                  }
             });
             
             NPCS.forEach(n => {
                  n.albums?.forEach(a => {
                       let regionModifier = region === 'global' ? 1 : (0.2 + Math.random() * 1.5);
                       let baseSt = (n.pop * 1800) * (0.8 + Math.random() * 0.4) * regionModifier; 
                       
                       let regSt = baseSt; 
                       if (region !== 'global') { 
                           let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.5 + 0.5); 
                           regSt = baseSt * (weight / 150); 
                       }
                       
                       chart.push({ title: a.title, artist: n.name, points: regSt, isPlayer: false, cover: null, lastPosition: null });
                  });
             });

             const fakeAlbums = ['Greatest Hits', 'Summer Vibes EP', 'The Collection', 'Live from Paris', 'Unplugged', 'The Remixes', 'Gold', 'Platinum'];
             for (let i = 0; i < 60; i++) {
                  const art = fakeArtistsSpotify[(i+1) % fakeArtistsSpotify.length];
                  const title = fakeAlbums[i % fakeAlbums.length];
                  let baseSt = 250000 * Math.pow(0.85, Math.pow(i, 0.8));
                  
                  let regSt = baseSt; 
                  if (region !== 'global') { 
                      let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.8 + 0.2); 
                      regSt = baseSt * (weight / 150); 
                  }
                  
                  chart.push({ title: title, artist: art, points: regSt, isPlayer: false, cover: null, lastPosition: null });
             }
             
             chart.sort((a,b) => b.points - a.points);
             return chart.slice(0, 50);
         };
`;

code = code.replace(
    /const generateITunesChart = \(\w+\) => \{[\s\S]*?const generateITunesAlbumChart = \(\w+\) => \{[\s\S]*?return chart\.slice\(0, 50\);\n         \};/,
    itunesChartReplacement
);

fs.writeFileSync('src/hooks/useGame.ts', code);
