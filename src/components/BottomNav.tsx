import { useGameContext } from '../GameContext';

export default function BottomNav() {
  const { state, setState, setInfoModal } = useGameContext();

  const switchTab = (tab: 'dashboard' | 'studio' | 'apps' | 'settings') => {
    if (tab === 'studio' && state.isHiatus) {
      setState(p => ({ ...p, activeTab: 'studio' }));
      setInfoModal({
        title: 'Studio Locked (Hiatus Mode)',
        desc: 'You cannot write, record, or release music while on an official career hiatus. End your hiatus in Settings or from the Studio lock screen to resume recording.'
      });
      return;
    }
    setState(p => ({ ...p, activeTab: tab }));
  };

  const navItems = [
    { id: 'dashboard', icon: 'ph-squares-four', label: 'Home' },
    { id: 'studio', icon: 'ph-headphones', label: 'Studio' },
    { id: 'apps', icon: 'ph-app-window', label: 'Apps' },
    { id: 'settings', icon: 'ph-gear', label: 'Settings' }
  ] as const;

  return (
    <nav className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 bg-apple-card border-t border-apple-border/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-safe pt-2 px-4 z-30 transition-colors">
      <div className="flex justify-around items-center pb-5 pt-1">
        {navItems.map(item => {
          const isActive = state.activeTab === item.id;
          const isLockedStudio = item.id === 'studio' && Boolean(state.isHiatus);
          return (
            <button 
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105' 
                  : 'bg-apple-bg text-apple-subtext hover:text-apple-text border border-apple-border/60'
              }`}
              style={{ minWidth: '72px' }}
            >
              {isLockedStudio && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow">
                  <i className="ph-fill ph-lock-key"></i>
                </span>
              )}
              <i className={`text-xl ${isActive ? 'ph-fill text-white' : 'ph text-apple-subtext'} ${item.icon}`}></i>
              <span className={`text-[11px] font-bold mt-0.5 tracking-tight ${isActive ? 'text-white' : 'text-apple-text'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
