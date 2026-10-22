const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

const regex = /const timeout = setTimeout\(\(\) => \{\n\s*set\('music_sim_save', state\)\.catch\(console\.error\);\n[\s\S]*?\}, 1000\);/;
code = code.replace(regex, `const timeout = setTimeout(() => {
            set('music_sim_save', state).catch(console.error);
        }, 1000);`);

fs.writeFileSync('src/hooks/useGame.ts', code);
