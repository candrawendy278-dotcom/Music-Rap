import { useGameContext } from '../../GameContext';

export default function HiatusStudioLockView() {
  const { state, setState, setInfoModal } = useGameContext();

  const handleEndHiatusNow = () => {
    setState(p => ({ ...p, isHiatus: false }));
    setInfoModal({
      title: 'Hiatus Ended',
      desc: 'Welcome back to the spotlight! Your recording studio, songwriting sessions, and global distribution channels are now unlocked.'
    });
  };

  const handleGoToSettings = () => {
    setState(p => ({ ...p, activeTab: 'settings' }));
  };

  return (
    <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-amber-500/30 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-3xl mb-4 shadow-sm">
          <i className="ph-fill ph-pause-circle" />
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-2">
          Official Artist Hiatus Active
        </span>

        <h3 className="text-xl font-black text-apple-text tracking-tight">
          Recording Studio Locked During Hiatus
        </h3>

        <p className="text-xs text-apple-subtext mt-2 max-w-xs leading-relaxed">
          While <strong className="text-apple-text">{state.artist?.name || 'your artist'}</strong> is on an official career hiatus, songwriting, studio recording, project packaging, and new releases are paused so you can rest without fanbase decay.
        </p>

        <div className="w-full grid grid-cols-2 gap-2.5 mt-5 p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-apple-border/40 text-left">
          <div className="flex items-start gap-2">
            <i className="ph-fill ph-lock-key text-amber-500 text-base mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-apple-text">Studio Sessions</div>
              <div className="text-[10px] text-apple-subtext">Writing & Recording Paused</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <i className="ph-fill ph-prohibit text-rose-500 text-base mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-apple-text">New Releases</div>
              <div className="text-[10px] text-apple-subtext">Distribution Suspended</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-5">
          <button
            onClick={handleEndHiatusNow}
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ph-bold ph-play-circle text-base" />
            <span>End Hiatus & Unlock Studio</span>
          </button>

          <button
            onClick={handleGoToSettings}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800 hover:bg-neutral-300/70 text-apple-text font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <i className="ph-bold ph-gear text-sm" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
