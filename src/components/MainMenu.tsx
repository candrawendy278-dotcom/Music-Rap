import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { useGameContext } from '../GameContext';
import { initialState } from '../hooks/useGame';
import StartScreen from '../StartScreen';
import { PWAInstallButton } from './PWA/PWAInstallButton';
import { cleanAndDecompressLoadedState, saveGameStateSafely } from '../utils/saveStateOptimizer';
import { loadArtworkVaultFromIdb } from '../utils/smartStorageEngine';

export default function MainMenu() {
    const { setState } = useGameContext();
    const [hasSave, setHasSave] = useState(false);
    const [creating, setCreating] = useState(false);
    const [isLoadingSave, setIsLoadingSave] = useState(false);

    useEffect(() => {
        const checkSave = async () => {
            try {
                await loadArtworkVaultFromIdb();
                let saved = await get('music_sim_save');
                
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
                    if (parsed.artist) {
                        setHasSave(true);
                        return;
                    }
                }
                setHasSave(false);
            } catch (e) {
                console.error("Error checking save:", e);
                setHasSave(false);
            }
        };
        checkSave();
    }, []);

    const handleContinue = async () => {
        if (isLoadingSave) return;
        setIsLoadingSave(true);
        try {
            await loadArtworkVaultFromIdb();
            let saved = await get('music_sim_save');
            if (!saved) {
                const localSave = localStorage.getItem('music_sim_save');
                if (localSave) saved = JSON.parse(localSave);
            }
            if (saved) {
                const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                
                // Deep clean, sanitize and rehydrate covers + charts
                const cleanedState = cleanAndDecompressLoadedState(parsed, initialState);
                cleanedState.isStarted = true;
                
                // Migrate arrays for older saves
                if (cleanedState.songs) {
                    cleanedState.songs = cleanedState.songs.map((s: any) => ({
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
                
                if (cleanedState.projects) {
                    cleanedState.projects = cleanedState.projects.map((p: any) => ({
                        ...p,
                        quality: p.quality || 1,
                        momentum: p.momentum || 1,
                        basePotential: p.basePotential || 10,
                        pureSales: p.pureSales || 0,
                        weeklyPureSales: p.weeklyPureSales || 0
                    }));
                }
                
                // Instantly overwrite IndexedDB so storage space is permanently freed
                await saveGameStateSafely(cleanedState);

                setState(cleanedState);
            }
        } catch (e) {
            console.error("Error loading save:", e);
        } finally {
            setIsLoadingSave(false);
        }
    };

    const handleNewGame = () => {
        setCreating(true);
    };

    if (creating) {
        return <StartScreen />;
    }

    return (
        <div className="w-full max-w-md mx-auto min-h-screen bg-apple-bg flex flex-col items-center justify-center space-y-6 relative overflow-hidden px-6 animate-in fade-in">
             <div className="flex flex-col items-center justify-center space-y-3 w-full">
                <img
                  src="/logo.png"
                  alt="Music Rap Logo"
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-3xl shadow-xl border border-white/60 mb-1"
                  referrerPolicy="no-referrer"
                />
                <h1 className="text-4xl sm:text-5xl font-black text-apple-text tracking-tighter text-center mb-0.5 bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
                  Music Rap
                </h1>
                <p className="text-apple-subtext font-medium text-center mb-6 text-sm sm:text-base">
                  The Simulator • From Zero to Empire
                </p>
                
                <div className="w-full space-y-4 mt-4">
                    <button onClick={handleNewGame} className="w-full py-4 bg-apple-text text-apple-bg rounded-2xl font-bold text-lg active:scale-95 transition-transform shadow-md hover:opacity-90 cursor-pointer">
                        New Game
                    </button>
                    {hasSave && (
                        <button 
                            onClick={handleContinue} 
                            disabled={isLoadingSave}
                            className={`w-full py-4 bg-apple-card text-apple-text rounded-2xl font-bold text-lg active:scale-95 transition-all border border-apple-border shadow-sm flex items-center justify-center gap-2 ${isLoadingSave ? 'opacity-70 cursor-wait' : 'hover:bg-black/5 cursor-pointer'}`}
                        >
                            {isLoadingSave ? (
                                <>
                                    <i className="ph ph-circle-notch animate-spin text-xl"></i>
                                    <span>Optimizing & Restoring Save...</span>
                                </>
                            ) : (
                                <span>Continue</span>
                            )}
                        </button>
                    )}

                    <div className="flex justify-center pt-1">
                      <PWAInstallButton />
                    </div>
                </div>
             </div>
        </div>
    );
}
