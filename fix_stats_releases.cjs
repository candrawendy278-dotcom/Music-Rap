const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/StatisticApp.tsx', 'utf8');

code = code.replace(
    /const releaseSongs = useMemo\(\(\) => \{\s*return \[\.\.\.state\.songs\]\.filter\(s => s\.status === 'released'\)\.sort\(\(a, b\) => \(b\.streams \|\| 0\) - \(a\.streams \|\| 0\)\);\s*\}, \[state\.songs\]\);/g,
    `const releaseSongs = useMemo(() => {
     const all = [...state.songs.filter(s => s.status === 'released'), ...state.projects.filter(p => p.status === 'released')];
     return all.sort((a, b) => {
         const aTotal = (a.streams || 0) + (a.pureSales || 0) * 1000;
         const bTotal = (b.streams || 0) + (b.pureSales || 0) * 1000;
         return bTotal - aTotal;
     });
  }, [state.songs, state.projects]);`
);

fs.writeFileSync('src/components/Apps/StatisticApp.tsx', code);
