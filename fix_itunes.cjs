const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

const replacement = `
             for (let i = 0; i < 60; i++) {
                  const art = fakeArtistsSpotify[i % fakeArtistsSpotify.length];
                  const trk = fakeTracksSpotify[i % fakeTracksSpotify.length] + ' ' + (i % 5 + 1);
                  let baseSt = 150000 * Math.pow(0.85, Math.pow(i, 0.8));
                  
                  let regSt = baseSt; 
                  if (region !== 'global') { 
                      let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.8 + 0.2); 
                      regSt = baseSt * (weight / 150); 
                  }
                  
                  chart.push({ title: trk, artist: art, points: regSt, isPlayer: false, cover: null, lastPosition: null });
             }
`;

code = code.replace(
    /             chart.sort\(\(a,b\) => b.points - a.points\);\n             return chart.slice\(0, 50\);\n         };\n\n         const generateITunesAlbumChart/g,
    replacement + '\n             chart.sort((a,b) => b.points - a.points);\n             return chart.slice(0, 50);\n         };\n\n         const generateITunesAlbumChart'
);

const albumReplacement = `
             for (let i = 0; i < 60; i++) {
                  const art = fakeArtistsSpotify[i % fakeArtistsSpotify.length];
                  const trk = fakeTracksSpotify[i % fakeTracksSpotify.length] + ' Album';
                  let baseSt = 80000 * Math.pow(0.85, Math.pow(i, 0.8));
                  
                  let regSt = baseSt; 
                  if (region !== 'global') { 
                      let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.8 + 0.2); 
                      regSt = baseSt * (weight / 150); 
                  }
                  
                  chart.push({ title: trk, artist: art, points: regSt, isPlayer: false, cover: null, lastPosition: null });
             }
`;

code = code.replace(
    /             chart.sort\(\(a,b\) => b.points - a.points\);\n             return chart.slice\(0, 50\);\n         };\n\n         \/\/ Generate ITunes Daily/g,
    albumReplacement + '\n             chart.sort((a,b) => b.points - a.points);\n             return chart.slice(0, 50);\n         };\n\n         // Generate ITunes Daily'
);

fs.writeFileSync('src/hooks/useGame.ts', code);
