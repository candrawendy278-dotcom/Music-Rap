const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/ITunesApp.tsx', 'utf8');

code = code.replace(
    /const releaseSongs = useMemo\(\(\) => \{\s*return \[\.\.\.state\.songs\]\.filter\(s => s\.status === 'released'\)\.sort\(\(a,b\) => b\.pureSales - a\.pureSales\);\s*\}, \[state\.songs\]\);/g,
    `const releaseSongs = useMemo(() => {
     const all = [...state.songs.filter(s => s.status === 'released'), ...state.projects.filter(p => p.status === 'released')];
     return all.sort((a,b) => (b.pureSales || 0) - (a.pureSales || 0));
  }, [state.songs, state.projects]);`
);

code = code.replace(
    /const allReleasesByDate = useMemo\(\(\) => \{\s*return \[\.\.\.state\.songs\]\.filter\(s => s\.status === 'released'\)\.sort\(\(a, b\) => \{\s*const dateA = a\.releaseDate \|\| '';\s*const dateB = b\.releaseDate \|\| '';\s*return dateB\.localeCompare\(dateA\);\s*\}\);\s*\}, \[state\.songs\]\);/g,
    `const allReleasesByDate = useMemo(() => {
     const all = [...state.songs.filter(s => s.status === 'released'), ...state.projects.filter(p => p.status === 'released')];
     return all.sort((a, b) => {
         const dateA = a.releaseDate || '';
         const dateB = b.releaseDate || '';
         return dateB.localeCompare(dateA);
     });
  }, [state.songs, state.projects]);`
);

fs.writeFileSync('src/components/Apps/ITunesApp.tsx', code);
