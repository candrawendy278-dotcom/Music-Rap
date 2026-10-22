const fs = require('fs');
let code = fs.readFileSync('src/components/MainMenu.tsx', 'utf8');

const imports = `import { useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import { useGameContext } from '../GameContext';
import { initialState } from '../hooks/useGame';
import StartScreen from '../StartScreen';
import { useAuth } from '../hooks/useAuth';
`;

code = code.replace(
    /import \{ useState, useEffect \} from 'react';\nimport \{ get, set, del \} from 'idb-keyval';\nimport \{ useGameContext \} from '\.\.\/GameContext';\nimport \{ initialState \} from '\.\.\/hooks\/useGame';\nimport StartScreen from '\.\.\/StartScreen';/,
    imports
);

// inside MainMenu
// const { user, signIn, signOut } = useAuth();
// useEffect to check save... also check cloud load.

const authHook = `
    const { setState } = useGameContext();
    const { user, signIn, signOut } = useAuth();
    const [hasSave, setHasSave] = useState(false);
    const [creating, setCreating] = useState(false);
`;

code = code.replace(
    /const \{ setState \} = useGameContext\(\);\n    const \[hasSave, setHasSave\] = useState\(false\);\n    const \[creating, setCreating\] = useState\(false\);/,
    authHook
);

const handleContinueFunc = `
    const handleContinue = async () => {
        try {
            let saved = null;
            if (user) {
                const token = await user.getIdToken();
                const res = await fetch('/api/load', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.state) saved = data.state;
                }
            }
            if (!saved) {
                saved = await get('music_sim_save');
            }
            if (!saved) {
                const localSave = localStorage.getItem('music_sim_save');
                if (localSave) saved = JSON.parse(localSave);
            }
            if (saved) {
                const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                
                // Deep merge function to ensure all nested properties exist
                const mergeDeep = (target: any, source: any) => {
                    if (typeof target !== 'object' || target === null) return source;
                    if (typeof source !== 'object' || source === null) return target;
                    
                    const output = { ...target };
                    Object.keys(source).forEach(key => {
                        if (source[key] !== undefined && source[key] !== null) {
                            if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                                output[key] = mergeDeep(target[key] || {}, source[key]);
                            } else {
                                output[key] = source[key];
                            }
                        }
                    });
                    return output;
                };
                const mergedState = mergeDeep(initialState, parsed);
                
                // Migrate arrays for older saves
                if (mergedState.songs) {
                    mergedState.songs = mergedState.songs.map((s: any) => ({
                        ...s,
                        quality: s.quality || 1,
                        momentum: s.momentum || 1,
                        views: s.views || 0,
                        pureSales: s.pureSales || 0,
                        radioPlays: s.radioPlays || 0,
                        streams: s.streams || 0,
                        basePotential: s.basePotential || 10,
                        weeklyStreams: s.weeklyStreams || 0,
                        weeklyViews: s.weeklyViews || 0,
                        weeklyRadioPlays: s.weeklyRadioPlays || 0,
                        weeklyPureSales: s.weeklyPureSales || 0
                    }));
                }
                
                if (mergedState.projects) {
                    mergedState.projects = mergedState.projects.map((p: any) => ({
                        ...p,
                        quality: p.quality || 1,
                        momentum: p.momentum || 1,
                        basePotential: p.basePotential || 10,
                        pureSales: p.pureSales || 0,
                        weeklyPureSales: p.weeklyPureSales || 0
                    }));
                }
                setState(mergedState);
            }
        } catch (e) {
            console.error("Error loading save:", e);
        }
    };
`;

code = code.replace(
    /const handleContinue = async \(\) => \{[\s\S]*?setState\(mergedState\);\n            \}\n        \} catch \(e\) \{\n            console\.error\("Error loading save:", e\);\n        \}\n    \};/,
    handleContinueFunc
);

const buttons = `
                    <button onClick={handleNewGame} className="w-full py-4 bg-apple-text text-apple-bg rounded-2xl font-bold text-lg active:scale-95 transition-transform shadow-md hover:opacity-90 cursor-pointer">
                        New Game
                    </button>
                    {hasSave && (
                        <button onClick={handleContinue} className="w-full py-4 bg-apple-card text-apple-text rounded-2xl font-bold text-lg active:scale-95 transition-transform border border-apple-border shadow-sm hover:bg-black/5 cursor-pointer">
                            Continue
                        </button>
                    )}
                    <div className="pt-8 w-full border-t border-apple-border flex flex-col gap-2">
                        {user ? (
                            <button onClick={() => signOut()} className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm active:scale-95 transition-transform border border-red-100 shadow-sm hover:bg-red-100 cursor-pointer">
                                Sign Out ({user.email})
                            </button>
                        ) : (
                            <button onClick={() => signIn().then(() => handleContinue())} className="w-full py-3 bg-white text-apple-text rounded-2xl font-bold text-sm active:scale-95 transition-transform border border-apple-border shadow-sm hover:bg-black/5 cursor-pointer flex items-center justify-center gap-2">
                                <i className="ph-fill ph-google-logo text-lg"></i> Sign in with Google to Backup
                            </button>
                        )}
                    </div>
`;

code = code.replace(
    /<button onClick=\{handleNewGame\} className="w-full py-4 bg-apple-text text-apple-bg rounded-2xl font-bold text-lg active:scale-95 transition-transform shadow-md hover:opacity-90 cursor-pointer">\n                        New Game\n                    <\/button>\n                    \{hasSave && \(\n                        <button onClick=\{handleContinue\} className="w-full py-4 bg-apple-card text-apple-text rounded-2xl font-bold text-lg active:scale-95 transition-transform border border-apple-border shadow-sm hover:bg-black\/5 cursor-pointer">\n                            Continue\n                        <\/button>\n                    \)\}/,
    buttons
);

// We need to also check cloud save on component mount.
const checkSaveFunc = `
    useEffect(() => {
        const checkSave = async () => {
            try {
                let saved = null;
                if (user) {
                    const token = await user.getIdToken();
                    const res = await fetch('/api/load', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.state) saved = data.state;
                    }
                }
                if (!saved) {
                    saved = await get('music_sim_save');
                }
                
                // Migrate from localStorage if it exists and idb doesn't
                if (!saved) {
                    const localSave = localStorage.getItem('music_sim_save');
                    if (localSave) {
                        saved = JSON.parse(localSave);
                        await set('music_sim_save', saved);
                    }
                }
                
                if (saved) {
                    const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                    if (parsed.artist) setHasSave(true);
                }
            } catch (e) {
                console.error("Error checking save:", e);
            }
        };
        checkSave();
    }, [user]);
`;

code = code.replace(
    /useEffect\(\(\) => \{\n        const checkSave = async \(\) => \{[\s\S]*?checkSave\(\);\n    \}, \[\]\);/,
    checkSaveFunc
);

fs.writeFileSync('src/components/MainMenu.tsx', code);
