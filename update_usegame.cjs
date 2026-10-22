const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGame.ts', 'utf8');

// We need to add logic to load from cloud if authenticated, and save to cloud if authenticated.
// Also keep local fallback.

const newSaveLogic = `
  useEffect(() => {
    if (state.isStarted) {
        const timeout = setTimeout(() => {
            set('music_sim_save', state).catch(console.error);
            // Cloud Save
            import('firebase/auth').then(({ getAuth }) => {
              const auth = getAuth();
              if (auth.currentUser) {
                auth.currentUser.getIdToken().then(token => {
                  fetch('/api/save', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(state)
                  }).catch(console.error);
                });
              }
            });
        }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [state]);
`;

code = code.replace(
    /useEffect\(\(\) => \{\n\s*if \(state\.isStarted\) \{\n\s*const timeout = setTimeout\(\(\) => \{\n\s*set\('music_sim_save', state\)\.catch\(console\.error\);\n\s*\}, 1000\);\n\s*return \(\) => clearTimeout\(timeout\);\n\s*\}\n\s*\}, \[state\]\);/g,
    newSaveLogic
);

fs.writeFileSync('src/hooks/useGame.ts', code);
