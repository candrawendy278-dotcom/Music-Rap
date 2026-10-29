import { useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { evaluateAllPlayerRiaaItems } from '../../data/riaaCertificationEngine';

export default function AppsTab() {
  const { state, setState } = useGameContext();

  const eligibleRiaaCount = useMemo(() => {
    return evaluateAllPlayerRiaaItems(state).eligibleItems.length;
  }, [state]);

  const isCurrentlyOnTour = Boolean((state as any).tourState?.activeTour);

  const openApp = (app: any) => {
    setState(p => ({ ...p, activeApp: app }));
  };

  const categories = [
    {
      name: "Artist Craft & Income",
      apps: [
        { id: 'tour', name: 'World Tour', icon: 'ph-fill ph-globe-hemisphere-west', color: 'text-amber-400', bg: 'bg-[#17120E] dark:bg-amber-500/20', statusBadge: isCurrentlyOnTour ? 'ON TOUR' : undefined },
        { id: 'merch', name: 'Official Store', icon: 'ph-fill ph-shopping-bag-open', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
        { id: 'skills', name: 'Mastery Academy', icon: 'ph-fill ph-sparkle', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-600/10 dark:bg-indigo-500/20' },
        { id: 'jobs', name: 'Jobs & Hustles', icon: 'ph-fill ph-briefcase', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/10 dark:bg-emerald-500/20' },
      ]
    },
    {
      name: "Music & Streaming",
      apps: [
        { id: 'spotify', name: 'Spotify', icon: 'ph-fill ph-spotify-logo', color: 'text-[#1DB954]', bg: 'bg-[#1DB954]/10 dark:bg-[#1DB954]/20' },
        { id: 'itunes', name: 'iTunes', icon: 'ph-fill ph-music-notes', color: 'text-[#EA4CC0]', bg: 'bg-[#EA4CC0]/10 dark:bg-[#EA4CC0]/20' },
      ]
    },
    {
      name: "Charts & Analytics",
      apps: [
        { id: 'billboard', name: 'Billboard', icon: 'ph-fill ph-chart-bar', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { id: 'radio', name: 'Radio Airplay', icon: 'ph-fill ph-broadcast', color: 'text-sky-400', bg: 'bg-[#0A0D14] dark:bg-sky-500/20' },
        { id: 'statistic', name: 'Statistic', icon: 'ph-fill ph-trend-up', color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10 dark:bg-violet-500/20' },
      ]
    },
    {
      name: "Music Press & Critics",
      apps: [
        { id: 'pitchfork', name: 'Pitchfork', icon: 'ph-fill ph-newspaper-clipping', color: 'text-[#FF3530]', bg: 'bg-[#0A0A0A] dark:bg-[#FF3530]/15' },
        { id: 'metacritic', name: 'Metacritic', icon: 'ph-fill ph-seal-check', color: 'text-[#FFBD3F]', bg: 'bg-[#111318] dark:bg-[#FFBD3F]/15' },
      ]
    },
    {
      name: "Awards & Honors",
      apps: [
        { id: 'riaa', name: 'RIAA Program', icon: 'ph-fill ph-disc', color: 'text-amber-400', bg: 'bg-[#171308] dark:bg-amber-400/15', badgeCount: eligibleRiaaCount },
        { id: 'grammys', name: 'The GRAMMYs', icon: 'ph-fill ph-trophy', color: 'text-[#D4AF37]', bg: 'bg-[#12110E] dark:bg-[#D4AF37]/15' },
        { id: 'vmas', name: 'MTV VMAs', icon: 'ph-fill ph-planet', color: 'text-[#FF1E8A]', bg: 'bg-[#120D1D] dark:bg-[#FF1E8A]/15' },
      ]
    },
    {
      name: "Social & Video",
      apps: [
        { id: 'youtube', name: 'YouTube', icon: 'ph-fill ph-youtube-logo', color: 'text-red-500', bg: 'bg-red-500/10 dark:bg-red-500/20' },
        { id: 'x', name: 'X', icon: 'ph-fill ph-x-logo', color: 'text-black dark:text-white', bg: 'bg-black/10 dark:bg-white/15' },
      ]
    }
  ];

  return (
    <div className="animate-fade-in pb-10">
      <h2 className="text-2xl font-black text-apple-text tracking-tight mb-6">Apps & Services</h2>
      
      <div className="space-y-8">
        {categories.map((cat, i) => (
          <div key={i}>
            <h3 className="text-sm font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider mb-4 px-1">{cat.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              {cat.apps.map((app: any) => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id)}
                  className="relative bg-apple-card rounded-2xl p-4 flex flex-col items-center justify-center border border-apple-border/60 shadow-ios active:scale-95 transition-transform group cursor-pointer hover:shadow-md"
                >
                  {app.badgeCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-amber-400 text-zinc-950 text-[10px] font-mono font-black shadow-xs">
                      {app.badgeCount} ELIGIBLE
                    </span>
                  )}
                  {app.statusBadge && (
                    <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-emerald-400 text-zinc-950 text-[10px] font-mono font-black shadow-xs">
                      {app.statusBadge}
                    </span>
                  )}
                  <div className={`w-14 h-14 ${app.bg} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <i className={`${app.icon} ${app.color} text-3xl`}></i>
                  </div>
                  <span className="font-bold text-apple-text">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
