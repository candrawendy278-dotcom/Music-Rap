const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// Fix 1: Project sales in nextDay
code = code.replace(
    /const dailySales = Math.floor\(\(proj\.basePotential \|\| 0\) \* newMomentum \* \(200 \+ \(nextState\.artist\?\.popularity \|\| 0\) \* 150\) \* 0\.02\);/g,
    'const dailySales = Math.floor((proj.basePotential || 0) * newMomentum * (100 + (nextState.artist?.popularity || 0) * 800) * 0.08);'
);

// Fix 2: Move Daily charts out of if (date.getDay() === 1) block
// Currently they are OUTSIDE of it in useRealTimeEngine, but we also need to check useGame.ts
// Ah wait, I grepped useRealTimeEngine.ts earlier for DAILY CHARTS and saw the daily charts logic inside useRealTimeEngine!
// WAIT! useRealTimeEngine.ts is for real-time. useGame.ts is for nextDay (normal mode).
// Does useGame.ts also have the daily charts?
