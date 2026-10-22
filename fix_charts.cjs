const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// Fix 1: Pure Sales calculation in useGame.ts
code = code.replace(
    /let dailySales = Math.floor\(\(song\.basePotential \|\| 0\) \* newMomentum \* 0\.03\);/g,
    'let dailySales = Math.floor(streams * 0.0025);'
);

code = code.replace(
    /const dailySales = Math.floor\(\(proj\.basePotential \|\| 0\) \* newMomentum \* 0\.4\);/g,
    'const dailySales = Math.floor((proj.basePotential || 0) * newMomentum * (200 + (nextState.artist?.popularity || 0) * 150) * 0.02);'
);

// Fix 2: Optimize chart generation for YouTube
code = code.replace(
    /let totalW = 0;\s*const w = \{\};\s*Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{ w\[cc\] = \(5 - COUNTRY_TIERS\[cc\]\) \* \(0\.5 \+ Math\.random\(\) \* 1\.5\); if\(cc===nextState\.artist\?\.country\) w\[cc\]\*=6; totalW\+=w\[cc\]; \}\);\s*let regSt = baseSt \* \(w\[region\] \/ totalW\);\s*if \(region === 'global'\) regSt = baseSt;/g,
    `let regSt = baseSt; if (region !== 'global') { let weight = (5 - COUNTRY_TIERS[region]) * (0.5 + Math.random() * 1.5); if (region === nextState.artist?.country) weight *= 6; regSt = baseSt * (weight / 150); }`
);

code = code.replace(
    /let totalW = 0;\s*const w = \{\};\s*Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{ w\[cc\] = 5 - COUNTRY_TIERS\[cc\]; if\(cc==='US'\|\|cc==='GB'\|\|cc==='KR'\) w\[cc\]\*=2; totalW\+=w\[cc\]; \}\);\s*let regSt = baseSt \* \(w\[region\] \/ totalW\);\s*if \(region === 'global'\) regSt = baseSt;/g,
    `let regSt = baseSt; if (region !== 'global') { let weight = 5 - COUNTRY_TIERS[region]; if (region === 'US' || region === 'GB' || region === 'KR') weight *= 2; regSt = baseSt * (weight / 150) * (0.8 + Math.random() * 0.4); }`
);

code = code.replace(
    /let totalW = 0;\s*const w = \{\};\s*Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{ w\[cc\] = \(5 - COUNTRY_TIERS\[cc\]\) \* \(Math\.random\(\) \* 0\.8 \+ 0\.2\); totalW\+=w\[cc\]; \}\);\s*let regSt = baseSt \* \(w\[region\] \/ totalW\);\s*if \(region === 'global'\) regSt = baseSt;/g,
    `let regSt = baseSt; if (region !== 'global') { let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.8 + 0.2); regSt = baseSt * (weight / 150); }`
);

// Fix 3: Optimize Spotify Chart
code = code.replace(
    /let totalW = 0;\s*const w = \{\};\s*Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{ w\[cc\] = 5 - COUNTRY_TIERS\[cc\]; if\(cc==='US'\|\|cc==='GB'\) w\[cc\]\*=2; totalW\+=w\[cc\]; \}\);\s*let regSt = baseSt \* \(w\[region\] \/ totalW\);\s*if \(region === 'global'\) regSt = baseSt;/g,
    `let regSt = baseSt; if (region !== 'global') { let weight = 5 - COUNTRY_TIERS[region]; if (region === 'US' || region === 'GB') weight *= 2; regSt = baseSt * (weight / 150) * (0.8 + Math.random() * 0.4); }`
);

// Fix 4: Optimize iTunes Chart
code = code.replace(
    /let totalW = 0;\s*const w: Record<string, number> = \{\};\s*Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{\s*w\[cc\] = \(5 - COUNTRY_TIERS\[cc\]\) \* \(Math\.random\(\) \* 0\.5 \+ 0\.5\);\s*if \(cc === nextState\.artist\?\.country\) w\[cc\] \*= 8;\s*totalW \+= w\[cc\];\s*\}\);\s*let regSt = globalSt \* \(w\[region\] \/ totalW\);\s*if \(region === 'global'\) regSt = globalSt;/g,
    `let regSt = globalSt; if (region !== 'global') { let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.5 + 0.5); if (region === nextState.artist?.country) weight *= 8; regSt = globalSt * (weight / 150); }`
);

code = code.replace(
    /let totalW = 0;\s*const w: Record<string, number> = \{\};\s*Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{ w\[cc\] = 5 - COUNTRY_TIERS\[cc\]; if\(cc==='US'\|\|cc==='GB'\) w\[cc\]\*=2; totalW\+=w\[cc\]; \}\);\s*let regSt = baseSt \* \(w\[region\] \/ totalW\);\s*if \(region === 'global'\) regSt = baseSt;/g,
    `let regSt = baseSt; if (region !== 'global') { let weight = 5 - COUNTRY_TIERS[region]; if (region === 'US' || region === 'GB') weight *= 2; regSt = baseSt * (weight / 150) * (0.8 + Math.random() * 0.4); }`
);

code = code.replace(
    /let totalW = 0;\s*const w: Record<string, number> = \{\};\s*Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{ w\[cc\] = \(5 - COUNTRY_TIERS\[cc\]\) \* \(Math\.random\(\) \* 0\.8 \+ 0\.2\); totalW\+=w\[cc\]; \}\);\s*let regSt = baseSt \* \(w\[region\] \/ totalW\);\s*if \(region === 'global'\) regSt = baseSt;/g,
    `let regSt = baseSt; if (region !== 'global') { let weight = (5 - COUNTRY_TIERS[region]) * (Math.random() * 0.8 + 0.2); regSt = baseSt * (weight / 150); }`
);

fs.writeFileSync('src/hooks/useGame.ts', code);
