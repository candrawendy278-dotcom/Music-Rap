const fs = require('fs');

// 1. Optimize useGame.ts
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// Replace the country generation loop for Spotify
code = code.replace(
    /Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{\n             const prevCountryDaily = nextState\.spotify\.charts\[`daily_\$\{cc\}`\] \|\| \[\];\n             nextState\.spotify\.charts\[`daily_\$\{cc\}`\] = generateSpotifyChart\(false, cc\);\n             finalizeSpotifyChart\(nextState\.spotify\.charts\[`daily_\$\{cc\}`\], prevCountryDaily\);\n         \}\);/,
    `const activeCountries = Array.from(new Set(['US', 'GB', 'KR', nextState.artist?.country].filter(Boolean)));
         activeCountries.forEach(cc => {
             const prevCountryDaily = nextState.spotify.charts[\`daily_\${cc}\`] || [];
             nextState.spotify.charts[\`daily_\${cc}\`] = generateSpotifyChart(false, cc);
             finalizeSpotifyChart(nextState.spotify.charts[\`daily_\${cc}\`], prevCountryDaily);
         });`
);

// Replace for Spotify Weekly
code = code.replace(
    /Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{\n                 const prevCountryWeekly = nextState\.spotify\.charts\[`weekly_\$\{cc\}`\] \|\| \[\];\n                 nextState\.spotify\.charts\[`weekly_\$\{cc\}`\] = generateSpotifyChart\(true, cc\);\n                 finalizeSpotifyChart\(nextState\.spotify\.charts\[`weekly_\$\{cc\}`\], prevCountryWeekly\);\n             \}\);/,
    `activeCountries.forEach(cc => {
                 const prevCountryWeekly = nextState.spotify.charts[\`weekly_\${cc}\`] || [];
                 nextState.spotify.charts[\`weekly_\${cc}\`] = generateSpotifyChart(true, cc);
                 finalizeSpotifyChart(nextState.spotify.charts[\`weekly_\${cc}\`], prevCountryWeekly);
             });`
);

// Replace for iTunes Daily
code = code.replace(
    /Object\.keys\(COUNTRY_TIERS\)\.forEach\(cc => \{\n             const prevITCountryDaily = nextState\.itunes\.charts\[`daily_\$\{cc\}`\] \|\| \[\];\n             nextState\.itunes\.charts\[`daily_\$\{cc\}`\] = generateITunesChart\(cc\);\n             finalizeITunesChart\(nextState\.itunes\.charts\[`daily_\$\{cc\}`\], prevITCountryDaily\);\n\n             const prevITAlbumsCountryDaily = nextState\.itunes\.charts\[`albums_\$\{cc\}`\] \|\| \[\];\n             nextState\.itunes\.charts\[`albums_\$\{cc\}`\] = generateITunesAlbumChart\(cc\);\n             finalizeITunesChart\(nextState\.itunes\.charts\[`albums_\$\{cc\}`\], prevITAlbumsCountryDaily\);\n         \}\);/,
    `activeCountries.forEach(cc => {
             const prevITCountryDaily = nextState.itunes.charts[\`daily_\${cc}\`] || [];
             nextState.itunes.charts[\`daily_\${cc}\`] = generateITunesChart(cc);
             finalizeITunesChart(nextState.itunes.charts[\`daily_\${cc}\`], prevITCountryDaily);

             const prevITAlbumsCountryDaily = nextState.itunes.charts[\`albums_\${cc}\`] || [];
             nextState.itunes.charts[\`albums_\${cc}\`] = generateITunesAlbumChart(cc);
             finalizeITunesChart(nextState.itunes.charts[\`albums_\${cc}\`], prevITAlbumsCountryDaily);
         });`
);

fs.writeFileSync('src/hooks/useGame.ts', code);

// 2. Fix UI in iTunesApp.tsx
let itunesCode = fs.readFileSync('src/components/Apps/ITunesApp.tsx', 'utf8');
itunesCode = itunesCode.replace(
    /\{Object\.keys\(COUNTRY_NAMES\)\.map\(c => \(\n                      <option key=\{c\} value=\{c\} className="bg-\[\#1A1A1A\]">\{COUNTRY_NAMES\[c\]\} Top 50<\/option>\n                   \)\)\}/,
    `{Array.from(new Set(['US', 'GB', 'KR', state.artist?.country].filter(Boolean))).map(c => (
                      <option key={c as string} value={c as string} className="bg-[#1A1A1A]">{COUNTRY_NAMES[c as string]} Top 50</option>
                   ))}`
);
itunesCode = itunesCode.replace(
    /\{Object\.keys\(COUNTRY_NAMES\)\.map\(c => \(\n                      <option key=\{c\} value=\{c\}>\{COUNTRY_NAMES\[c\]\} iTunes Top 50<\/option>\n                  \)\)\}/,
    `{Array.from(new Set(['US', 'GB', 'KR', state.artist?.country].filter(Boolean))).map(c => (
                      <option key={c as string} value={c as string}>{COUNTRY_NAMES[c as string]} iTunes Top 50</option>
                  ))}`
);
fs.writeFileSync('src/components/Apps/ITunesApp.tsx', itunesCode);

// 3. Fix UI in SpotifyApp.tsx
let spotifyCode = fs.readFileSync('src/components/Apps/SpotifyApp.tsx', 'utf8');
spotifyCode = spotifyCode.replace(
    /\{Object\.keys\(COUNTRY_NAMES\)\.map\(c => \(\n                      <option key=\{c\} value=\{c\}>\{COUNTRY_NAMES\[c\]\} Top 50<\/option>\n                  \)\)\}/,
    `{Array.from(new Set(['US', 'GB', 'KR', state.artist?.country].filter(Boolean))).map(c => (
                      <option key={c as string} value={c as string}>{COUNTRY_NAMES[c as string]} Top 50</option>
                  ))}`
);
fs.writeFileSync('src/components/Apps/SpotifyApp.tsx', spotifyCode);
