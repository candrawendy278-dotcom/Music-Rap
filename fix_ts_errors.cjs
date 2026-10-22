const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// The finalizeITunesChart function was likely deleted.
const finalizeITunesChartCode = `
         const finalizeITunesChart = (currentChart: any[], prevChart: any[]) => {
             currentChart.forEach((item, i) => {
                 const prevIndex = prevChart.findIndex(p => p.title === item.title && p.artist === item.artist);
                 item.lastPosition = prevIndex !== -1 ? prevIndex + 1 : null;
             });
         };
`;

code = code.replace(
    /const generateITunesAlbumChart = \(\w+\) => \{[\s\S]*?return chart\.slice\(0, 50\);\n         \};/,
    match => match + '\n' + finalizeITunesChartCode
);

fs.writeFileSync('src/hooks/useGame.ts', code);

// Fix the NPC albums type
let typesCode = fs.readFileSync('src/types.ts', 'utf8');
if (!typesCode.includes('albums?:')) {
    typesCode = typesCode.replace(
        /songs\?: \{ title: string; \}\[\];/,
        `songs?: { title: string; }[];
  albums?: { title: string; }[];`
    );
    fs.writeFileSync('src/types.ts', typesCode);
}
