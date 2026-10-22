const fs = require('fs');
let code = fs.readFileSync('src/hooks/useRealTimeEngine.ts', 'utf8');

// Fix salesToAdd for songs
code = code.replace(
    /const salesToAdd = \(\(song\.basePotential \|\| 0\) \* \(song\.momentum \|\| 1\) \* 0\.03\) \* deltaDays;/g,
    'const salesToAdd = streamsToAdd * 0.0025;'
);

// Add project sales to real time engine
const projLogic = `
        nextState.projects = nextState.projects.map(proj => {
            if (proj.status === 'released') {
                const projSalesToAdd = ((proj.basePotential || 0) * (proj.momentum || 1) * (100 + (nextState.artist?.popularity || 0) * 800) * 0.08) * deltaDays;
                return {
                    ...proj,
                    pureSales: (proj.pureSales || 0) + projSalesToAdd
                };
            }
            return proj;
        });
`;

code = code.replace(
    /        nextState\.currentStreamRate = totalStreamRatePerSecond;/g,
    projLogic + '\n        nextState.currentStreamRate = totalStreamRatePerSecond;'
);

fs.writeFileSync('src/hooks/useRealTimeEngine.ts', code);
