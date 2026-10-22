const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/StatisticApp.tsx', 'utf8');

code = code.replace(
    /     const projsWithId = state\.projects\.filter\(p => p\.status === 'released'\)\.map\(p => \(\{ \.\.\.p, itemType: 'project' \}\)\);/g,
    `     const projsWithId = state.projects.filter(p => p.status === 'released').map(p => {
         const pSongs = state.songs.filter(s => p.songs.some(ps => ps.id === s.id));
         const totalStreams = pSongs.reduce((acc, s) => acc + (s.streams || 0), 0);
         const totalViews = pSongs.reduce((acc, s) => acc + (s.views || 0), 0);
         const totalRadio = pSongs.reduce((acc, s) => acc + (s.radioPlays || 0), 0);
         const totalSongSales = pSongs.reduce((acc, s) => acc + (s.pureSales || 0), 0);
         return {
             ...p,
             itemType: 'project',
             streams: totalStreams,
             views: totalViews,
             radioPlays: totalRadio,
             pureSales: (p.pureSales || 0) + totalSongSales, // combined sales
         };
     });`
);

fs.writeFileSync('src/components/Apps/StatisticApp.tsx', code);
