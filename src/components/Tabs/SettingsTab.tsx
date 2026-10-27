import React, { useState, useMemo, useRef } from 'react';
import { useGameContext } from '../../GameContext';
import RedeemCodeWidget from '../Modals/RedeemCodeWidget';
import { getHiatusStatusSummary } from '../../data/hiatusSystemEngine';
import { PWAInstallButton } from '../PWA/PWAInstallButton';
import { compressImageFile } from '../../utils/imageOptimizer';
import {
  calculateObjectSizeKB,
  saveGameStateSafely,
  clearSaveDataCompletely,
  compactSaveState
} from '../../utils/saveStateOptimizer';
import { rehydrateFullGameStateOnLoad } from '../../utils/smartStorageEngine';
import ThemeToggleWidget from '../Common/ThemeToggleWidget';

export default function SettingsTab() {
  const { state, setState, setInfoModal } = useGameContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [optimizedNotice, setOptimizedNotice] = useState('');

  const hiatusSummary = useMemo(() => getHiatusStatusSummary(state), [state]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && state.artist) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setState(prev => {
          if (!prev.artist) return prev;
          const updated = {
            ...prev,
            artist: {
              ...prev.artist,
              image: compressed
            }
          };
          saveGameStateSafely(updated).catch(console.error);
          return updated;
        });
        setOptimizedNotice('Profile picture updated successfully!');
        setTimeout(() => setOptimizedNotice(''), 3000);
      }
    }
    if (e.target) e.target.value = '';
  };

  // Calculate current save state size in KB
  const currentSaveSizeKB = useMemo(() => {
    return calculateObjectSizeKB(state);
  }, [state.date, state.songs?.length, state.projects?.length, state.xPosts?.length]);

  const handleManualOptimize = async () => {
    try {
      const compacted = rehydrateFullGameStateOnLoad(compactSaveState(state, false));
      setState(compacted);
      await saveGameStateSafely(compacted);
      setOptimizedNotice('Storage cleaned & optimized! All covers & charts preserved with zero lag.');
      setTimeout(() => setOptimizedNotice(''), 3000);
    } catch (e) {
      console.error('Optimization error:', e);
    }
  };

  const toggleHiatus = () => {
    setState(prev => {
      const wasHiatus = Boolean(prev.isHiatus);
      const summary = getHiatusStatusSummary(prev);

      if (wasHiatus && summary.comebackHypeBonus > 0) {
        const nextHype = Math.min(100, Number(((prev.hype || 0) + summary.comebackHypeBonus).toFixed(1)));
        setTimeout(() => {
          setInfoModal({
            title: 'Comeback Era Announced!',
            desc: `After ${summary.hiatusDays} day(s) on hiatus, your return sparked a +${summary.comebackHypeBonus}% Comeback Hype surge (Hype is now ${nextHype}%)!`
          });
        }, 100);
        return {
          ...prev,
          isHiatus: false,
          hiatusDays: 0,
          hype: nextHype,
          hypeDelta: summary.comebackHypeBonus
        } as any;
      }

      return {
        ...prev,
        isHiatus: !wasHiatus,
        hiatusDays: 0
      } as any;
    });
  };

  const toggleRealTimeMode = () => {
     setState(prev => ({ ...prev, gameMode: prev.gameMode === 'realtime' ? 'normal' : 'realtime' }));
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-24">
      <div className="px-2 mb-2">
        <h2 className="text-3xl font-black text-apple-text tracking-tight">Settings</h2>
      </div>

      {/* Appearance & Dark Mode Toggle Card */}
      <ThemeToggleWidget variant="card" />

      {/* Artist Profile Card & Edit Profile Picture */}
      <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-apple-border/50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className="w-16 h-16 rounded-full bg-gray-200 bg-cover bg-center shadow-md border-2 border-white overflow-hidden shrink-0"
            style={{ backgroundImage: `url(${state.artist?.image})` }}
          />
          <div>
            <h3 className="font-black text-apple-text text-xl leading-tight">{state.artist?.name}</h3>
            <p className="text-xs text-apple-subtext font-medium mt-0.5">
              {state.artist?.country} • Started {state.artist?.startYear}
            </p>
          </div>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleAvatarChange} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-black dark:bg-white/10 dark:border dark:border-white/15 text-white rounded-2xl text-xs font-bold active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-neutral-800 dark:hover:bg-white/20"
          >
            <i className="ph-fill ph-camera text-sm"></i>
            <span>Edit Photo</span>
          </button>
        </div>
      </div>

      {/* Redeem Code & Cheat Console (Modular File) */}
      <RedeemCodeWidget />

      <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-apple-border/50 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-apple-text text-lg">Strategic Hiatus Mode</h3>
                {state.isHiatus && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                    Active · Day {hiatusSummary.hiatusDays}
                  </span>
                )}
              </div>
              <p className="text-xs text-apple-subtext mt-1">
                {hiatusSummary.description}
              </p>
            </div>
            <button 
              onClick={toggleHiatus}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${state.isHiatus ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${state.isHiatus ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-apple-bg rounded-xl p-2.5 border border-apple-border/40">
              <div className="text-[10px] text-apple-subtext font-medium">Daily Overhead</div>
              <div className="text-xs font-black text-apple-text mt-0.5">
                {state.isHiatus ? '$30/day (-80%)' : '$150/day'}
              </div>
            </div>
            <div className="bg-apple-bg rounded-xl p-2.5 border border-apple-border/40">
              <div className="text-[10px] text-apple-subtext font-medium">Skill Training</div>
              <div className="text-xs font-black text-apple-text mt-0.5">
                {state.isHiatus ? '2x Faster' : '1x Normal'}
              </div>
            </div>
            <div className="bg-apple-bg rounded-xl p-2.5 border border-apple-border/40">
              <div className="text-[10px] text-apple-subtext font-medium">Comeback Buzz</div>
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{hiatusSummary.comebackHypeBonus}% Hype
              </div>
            </div>
          </div>

          {state.isHiatus && hiatusSummary.comebackHypeBonus > 0 && (
            <button
              type="button"
              onClick={toggleHiatus}
              className="w-full py-2.5 px-4 bg-neutral-900 dark:bg-indigo-600 hover:bg-neutral-800 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              End Hiatus & Claim +{hiatusSummary.comebackHypeBonus}% Comeback Hype
            </button>
          )}
        </div>

        <div className="w-full h-px bg-apple-border"></div>

        <div className="flex items-center justify-between">
           <div>
               <h3 className="font-bold text-apple-text text-lg flex items-center">
                  <i className="ph-fill ph-clock text-blue-500 mr-1.5"></i> 
                  Real-Time Mode
               </h3>
               <p className="text-xs text-apple-subtext mt-1 max-w-[220px]">Streams and views accumulate passively over real-world time instead of instantly per day.</p>
           </div>
           <button 
              onClick={toggleRealTimeMode}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${state.gameMode === 'realtime' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
           >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${state.gameMode === 'realtime' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
           </button>
        </div>
      </div>

      {/* Storage & Performance Optimizer Widget */}
      <div className="bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50 mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              <i className="ph-fill ph-hard-drives text-base"></i>
            </div>
            <div>
              <h4 className="font-bold text-apple-text text-sm">Storage & Memory Size</h4>
              <p className="text-xs text-apple-subtext">
                Current Save: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{currentSaveSizeKB > 1024 ? `${(currentSaveSizeKB / 1024).toFixed(1)} MB` : `${currentSaveSizeKB} KB`}</span>
                <span className="ml-1 text-[11px] text-zinc-400 font-medium">(Local Auto-Save Active)</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleManualOptimize}
            className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition cursor-pointer shadow-sm flex items-center space-x-1"
          >
            <i className="ph-bold ph-broom text-xs"></i>
            <span>Optimize Now</span>
          </button>
        </div>

        {optimizedNotice && (
          <div className="text-xs bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-500/30 font-medium animate-in fade-in flex items-center space-x-1.5">
            <i className="ph-fill ph-check-circle text-emerald-600 dark:text-emerald-400 text-sm"></i>
            <span>{optimizedNotice}</span>
          </div>
        )}
      </div>

      <div className="bg-apple-card rounded-3xl p-5 shadow-ios border border-apple-border/50 flex items-center justify-between mt-6">
        <div>
          <h4 className="font-bold text-apple-text text-sm">Offline Play & PWA</h4>
          <p className="text-xs text-apple-subtext">Play anytime without internet or mobile data.</p>
        </div>
        <PWAInstallButton />
      </div>

      <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-apple-border/50 text-center mt-6">
        <p className="text-sm font-medium text-apple-subtext mb-6">Reset your current career and start a brand new journey.</p>
        <button 
          onClick={async () => {
            if (window.confirm("Are you sure you want to end this game and reset your career? All local data will be cleared.")) {
              await clearSaveDataCompletely();
              window.location.reload();
            }
          }} 
          className="w-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-transparent dark:border-rose-500/30 font-bold py-4 rounded-2xl active:scale-95 transition-transform cursor-pointer"
        >
          End Game & Reset Career
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-4 text-center space-y-2 opacity-80">
        <img src="/logo.png" alt="Music Rap" className="w-12 h-12 rounded-xl object-contain shadow-sm border border-apple-border/50" referrerPolicy="no-referrer" />
        <div>
          <p className="text-xs font-bold text-apple-text tracking-tight">Music Rap</p>
          <p className="text-[10px] text-apple-subtext">The Simulator • From Zero to Empire</p>
        </div>
      </div>
    </div>
  );
}
