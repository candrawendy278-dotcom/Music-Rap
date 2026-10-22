const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

const newITunesLogic = `
         const generateITunesAlbumChart = (region) => {
             let chart = [];
             
             nextState.projects.filter(p => p.status === 'released').forEach(p => {
                  let globalSt = p.dailyPureSales || 0;
                  
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
                  let regionModifier = region === 'global' ? 1 : (0.3 + Math.random() * 1.4);
                  let baseSt = (n.pop * 1200) * (0.8 + Math.random() * 0.4) * regionModifier; 
                  
                  let regSt = baseSt; 
                  if (region !== 'global') { 
                      let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.5 + 0.5); 
                      regSt = baseSt * (weight / 150); 
                  }
                  
                  chart.push({ title: n.name + ' Studio Album', artist: n.name, points: regSt, isPlayer: false, cover: null, lastPosition: null });
             });
             
             chart.sort((a,b) => b.points - a.points);
             return chart.slice(0, 50);
         };

         // Generate Global Daily
         const prevITGlobalDaily = nextState.itunes.charts['daily_global'] || [];
         nextState.itunes.charts['daily_global'] = generateITunesChart('global');
         finalizeITunesChart(nextState.itunes.charts['daily_global'], prevITGlobalDaily);

         const prevITAlbumsGlobalDaily = nextState.itunes.charts['albums_global'] || [];
         nextState.itunes.charts['albums_global'] = generateITunesAlbumChart('global');
         finalizeITunesChart(nextState.itunes.charts['albums_global'], prevITAlbumsGlobalDaily);

         // Generate all countries Daily
         Object.keys(COUNTRY_TIERS).forEach(cc => {
             const prevITCountryDaily = nextState.itunes.charts[\`daily_\${cc}\`] || [];
             nextState.itunes.charts[\`daily_\${cc}\`] = generateITunesChart(cc);
             finalizeITunesChart(nextState.itunes.charts[\`daily_\${cc}\`], prevITCountryDaily);

             const prevITAlbumsCountryDaily = nextState.itunes.charts[\`albums_\${cc}\`] || [];
             nextState.itunes.charts[\`albums_\${cc}\`] = generateITunesAlbumChart(cc);
             finalizeITunesChart(nextState.itunes.charts[\`albums_\${cc}\`], prevITAlbumsCountryDaily);
         });
`;

code = code.replace(
    /\/\/ Generate Global Daily[\s\S]*?finalizeITunesChart\(nextState\.itunes\.charts\[\`daily_\$\{cc\}\`\], prevITCountryDaily\);\s*\}\);/g,
    newITunesLogic
);

fs.writeFileSync('src/hooks/useGame.ts', code);
