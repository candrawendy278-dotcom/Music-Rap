const fs = require('fs');
let content = fs.readFileSync('src/StartScreen.tsx', 'utf8');

// The start button should trigger setState
// Actually, it already does setState(prev => ({ ...prev, isStarted: true, artist: newArtist }));

console.log("StartScreen looks fine");
