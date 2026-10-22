const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/StatisticApp.tsx', 'utf8');

// The issue with double counting is in `totalStreams`, `totalSales`, `totalViews` calculation.
// We should only sum the streams of the standalone singles and projects.
code = code.replace(
    /const totalStreams = releaseSongs.reduce\(\(a,c\) => a \+ \(c.streams\|\|0\), 0\);/,
    `const standaloneSongs = state.songs.filter(s => s.status === 'released' && !state.projects.some(p => p.songs.some(ps => ps.id === s.id)));
  const totalStreams = [...standaloneSongs, ...projsWithId].reduce((a,c) => a + (c.streams||0), 0);`
);
code = code.replace(
    /const totalSales = releaseSongs.reduce\(\(a,c\) => a \+ \(c.pureSales\|\|0\), 0\);/,
    `const totalSales = [...standaloneSongs, ...projsWithId].reduce((a,c) => a + (c.pureSales||0), 0);`
);
code = code.replace(
    /const totalViews = releaseSongs.reduce\(\(a,c\) => a \+ \(c.views\|\|0\), 0\);/,
    `const totalViews = [...standaloneSongs, ...projsWithId].reduce((a,c) => a + (c.views||0), 0);`
);

// We need to move the standaloneSongs calculation inside useMemo or define it properly.
// Let's just fix it properly in the useMemo.
