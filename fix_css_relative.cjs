const fs = require('fs');

function removeRelative(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/hide-scrollbar relative"/g, 'hide-scrollbar"');
    fs.writeFileSync(filePath, content);
}

removeRelative('src/components/Apps/YouTubeApp.tsx');
removeRelative('src/components/Apps/SpotifyApp.tsx');
console.log("Fixed relative css bug");
