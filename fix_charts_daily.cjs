const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// Fix 1: Close the weekly block after billboard
code = code.replace(
    /finalizeChart\(nextState\.billboard\.albums200, prevAlbums200, true\);/g,
    'finalizeChart(nextState.billboard.albums200, prevAlbums200, true);\n      } // END BILLBOARD WEEKLY'
);

// Fix 2: Move the reset weekly stats INTO the spotify weekly block (or just at the end of it)
code = code.replace(
    /        \}\n         \/\/ --- END SPOTIFY DAILY CHARTS ---\n         \/\/ Reset weekly stats for player\n         nextState\.songs = nextState\.songs\.map\(s => \(\{ \.\.\.s, weeklyStreams: 0, weeklyViews: 0, weeklyPureSales: 0, weeklyRadioPlays: 0 \}\)\);\n         nextState\.projects = nextState\.projects\.map\(p => \(\{ \.\.\.p, weeklyPureSales: 0 \}\)\);\n      \}/g,
    `            // Reset weekly stats for player\n            nextState.songs = nextState.songs.map(s => ({ ...s, weeklyStreams: 0, weeklyViews: 0, weeklyPureSales: 0, weeklyRadioPlays: 0 }));\n            nextState.projects = nextState.projects.map(p => ({ ...p, weeklyPureSales: 0 }));\n        }\n        // --- END SPOTIFY DAILY CHARTS ---`
);

// Verify changes by logging
fs.writeFileSync('src/hooks/useGame.ts', code);
