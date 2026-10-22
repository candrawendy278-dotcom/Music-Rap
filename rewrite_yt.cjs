const fs = require('fs');

let code = fs.readFileSync('src/components/Apps/YouTubeApp.tsx', 'utf8');
code = code.replace(/\\\\/g, ''); // Fixes escaped characters since it was double escaped or something? Wait, backslash was literally written as \` 

fs.writeFileSync('src/components/Apps/YouTubeApp.tsx', code);
