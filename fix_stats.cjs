const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/StatisticApp.tsx', 'utf8');

code = code.replace(
    /const totalStreams = releaseSongs.reduce\(\(a,c\) => a \+ \(c.streams\|\|0\), 0\);/,
    `const totalStreams = useMemo(() => {
      const standaloneSongs = state.songs.filter(s => s.status === 'released' && !state.projects.some(p => p.songs.some(ps => ps.id === s.id)));
      const projects = state.projects.filter(p => p.status === 'released');
      const projStreams = projects.reduce((acc, p) => acc + state.songs.filter(s => p.songs.some(ps => ps.id === s.id)).reduce((a, s) => a + (s.streams || 0), 0), 0);
      const songStreams = standaloneSongs.reduce((acc, s) => acc + (s.streams || 0), 0);
      return projStreams + songStreams;
  }, [state.songs, state.projects]);`
);

code = code.replace(
    /const totalSales = releaseSongs.reduce\(\(a,c\) => a \+ \(c.pureSales\|\|0\), 0\);/,
    `const totalSales = useMemo(() => {
      const standaloneSongs = state.songs.filter(s => s.status === 'released' && !state.projects.some(p => p.songs.some(ps => ps.id === s.id)));
      const projects = state.projects.filter(p => p.status === 'released');
      const projSales = projects.reduce((acc, p) => acc + (p.pureSales || 0) + state.songs.filter(s => p.songs.some(ps => ps.id === s.id)).reduce((a, s) => a + (s.pureSales || 0), 0), 0);
      const songSales = standaloneSongs.reduce((acc, s) => acc + (s.pureSales || 0), 0);
      return projSales + songSales;
  }, [state.songs, state.projects]);`
);

code = code.replace(
    /const totalViews = releaseSongs.reduce\(\(a,c\) => a \+ \(c.views\|\|0\), 0\);/,
    `const totalViews = useMemo(() => {
      const standaloneSongs = state.songs.filter(s => s.status === 'released' && !state.projects.some(p => p.songs.some(ps => ps.id === s.id)));
      const projects = state.projects.filter(p => p.status === 'released');
      const projViews = projects.reduce((acc, p) => acc + state.songs.filter(s => p.songs.some(ps => ps.id === s.id)).reduce((a, s) => a + (s.views || 0), 0), 0);
      const songViews = standaloneSongs.reduce((acc, s) => acc + (s.views || 0), 0);
      return projViews + songViews;
  }, [state.songs, state.projects]);`
);

fs.writeFileSync('src/components/Apps/StatisticApp.tsx', code);
