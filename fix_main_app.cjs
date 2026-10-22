const fs = require('fs');
let code = fs.readFileSync('src/MainApp.tsx', 'utf8');

code = code.replace(
    /        <div style=\{\{ display: state\.activeTab === 'dashboard' \? 'block' : 'none' \}\}\><Dashboard \/><\/div>\n        <div style=\{\{ display: state\.activeTab === 'studio' \? 'block' : 'none' \}\}\><Studio \/><\/div>\n        <div style=\{\{ display: state\.activeTab === 'apps' \? 'block' : 'none' \}\}\><AppsTab \/><\/div>\n        <div style=\{\{ display: state\.activeTab === 'settings' \? 'block' : 'none' \}\}\><SettingsTab \/><\/div>/g,
    `        {state.activeTab === 'dashboard' && <Dashboard />}
        {state.activeTab === 'studio' && <Studio />}
        {state.activeTab === 'apps' && <AppsTab />}
        {state.activeTab === 'settings' && <SettingsTab />}`
);

fs.writeFileSync('src/MainApp.tsx', code);
