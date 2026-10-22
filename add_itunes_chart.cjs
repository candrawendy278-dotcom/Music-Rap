const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

const generateITunesChartLogic = `
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
             
             chart.sort((a,b) => b.points - a.points);
             return chart.slice(0, 100);
         };

         const finalizeITunesChart = (chart, prevChart) => {
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
`;

if (!code.includes('const generateITunesChart = ')) {
    code = code.replace(
        /const generateITunesAlbumChart = \(region\) => \{/,
        generateITunesChartLogic + '\n         const generateITunesAlbumChart = (region) => {'
    );
    fs.writeFileSync('src/hooks/useGame.ts', code);
    console.log('Restored generateITunesChart');
} else {
    console.log('generateITunesChart already exists');
}
