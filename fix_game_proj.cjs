const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

code = code.replace(
    /pureSales: \(proj\.pureSales \|\| 0\) \+ dailySales,\s*weeklyPureSales: \(proj\.weeklyPureSales \|\| 0\) \+ dailySales/g,
    'pureSales: (proj.pureSales || 0) + dailySales,\n            dailyPureSales: dailySales,\n            weeklyPureSales: (proj.weeklyPureSales || 0) + dailySales'
);

fs.writeFileSync('src/hooks/useGame.ts', code);
