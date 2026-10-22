const fs = require('fs');

// 1. Restore useGame.ts
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// We replace `const activeCountries = Array.from(...)` and `activeCountries.forEach` back to `Object.keys(COUNTRY_TIERS).forEach`
code = code.replace(
    /const activeCountries = Array\.from\(new Set\(\['US', 'GB', 'KR', nextState\.artist\?\.country\]\.filter\(Boolean\)\)\);\n\s*activeCountries\.forEach/g,
    `Object.keys(COUNTRY_TIERS).forEach`
);

code = code.replace(
    /activeCountries\.forEach/g,
    `Object.keys(COUNTRY_TIERS).forEach`
);

// Optimize the save to be debounced
code = code.replace(
    /useEffect\(\(\) => \{\n\s*if \(state\.isStarted\) \{\n\s*set\('music_sim_save', state\)\.catch\(console\.error\);\n\s*\}\n\s*\}, \[state\]\);/g,
    `useEffect(() => {
    if (state.isStarted) {
        const timeout = setTimeout(() => {
            set('music_sim_save', state).catch(console.error);
        }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [state]);`
);

fs.writeFileSync('src/hooks/useGame.ts', code);

// 2. Restore ITunesApp.tsx
let itunesCode = fs.readFileSync('src/components/Apps/ITunesApp.tsx', 'utf8');
itunesCode = itunesCode.replace(
    /\{Array\.from\(new Set\(\['US', 'GB', 'KR', state\.artist\?\.country\]\.filter\(Boolean\)\)\)\.map\(c => \(/g,
    `{Object.keys(COUNTRY_NAMES).map(c => (`
);
itunesCode = itunesCode.replace(
    /key=\{c as string\} value=\{c as string\}/g,
    `key={c} value={c}`
);
itunesCode = itunesCode.replace(
    /COUNTRY_NAMES\[c as string\]/g,
    `COUNTRY_NAMES[c]`
);
fs.writeFileSync('src/components/Apps/ITunesApp.tsx', itunesCode);

// 3. Restore SpotifyApp.tsx
let spotifyCode = fs.readFileSync('src/components/Apps/SpotifyApp.tsx', 'utf8');
spotifyCode = spotifyCode.replace(
    /\{Array\.from\(new Set\(\['US', 'GB', 'KR', state\.artist\?\.country\]\.filter\(Boolean\)\)\)\.map\(c => \(/g,
    `{Object.keys(COUNTRY_NAMES).map(c => (`
);
spotifyCode = spotifyCode.replace(
    /key=\{c as string\} value=\{c as string\}/g,
    `key={c} value={c}`
);
spotifyCode = spotifyCode.replace(
    /COUNTRY_NAMES\[c as string\]/g,
    `COUNTRY_NAMES[c]`
);
fs.writeFileSync('src/components/Apps/SpotifyApp.tsx', spotifyCode);
