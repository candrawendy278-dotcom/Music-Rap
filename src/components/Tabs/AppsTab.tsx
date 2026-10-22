import { useGameContext } from '../../GameContext';

export default function AppsTab() {
  const { setState } = useGameContext();

  const openApp = (app: any) => {
    setState(p => ({ ...p, activeApp: app }));
  };

  const categories = [
    {
      name: "Artist Craft & Income",
      apps: [
        { id: 'skills', name: 'Mastery Academy', icon: 'ph-fill ph-sparkle', color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
        { id: 'jobs', name: 'Jobs & Hustles', icon: 'ph-fill ph-briefcase', color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
      ]
    },
    {
      name: "Music & Streaming",
      apps: [
        { id: 'spotify', name: 'Spotify', icon: 'ph-fill ph-spotify-logo', color: 'text-[#1DB954]', bg: 'bg-[#1DB954]/10' },
        { id: 'itunes', name: 'iTunes', icon: 'ph-fill ph-music-notes', color: 'text-[#EA4CC0]', bg: 'bg-[#EA4CC0]/10' },
      ]
    },
    {
      name: "Charts & Analytics",
      apps: [
        { id: 'billboard', name: 'Billboard', icon: 'ph-fill ph-chart-bar', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'statistic', name: 'Statistic', icon: 'ph-fill ph-trend-up', color: 'text-violet-500', bg: 'bg-violet-500/10' },
      ]
    },
    {
      name: "Social & Video",
      apps: [
        { id: 'youtube', name: 'YouTube', icon: 'ph-fill ph-youtube-logo', color: 'text-red-500', bg: 'bg-red-500/10' },
        { id: 'x', name: 'X', icon: 'ph-fill ph-x-logo', color: 'text-black', bg: 'bg-black/10' },
      ]
    }
  ];

  return (
    <div className="animate-fade-in pb-10">
      <h2 className="text-2xl font-black text-apple-text tracking-tight mb-6">Apps & Services</h2>
      
      <div className="space-y-8">
        {categories.map((cat, i) => (
          <div key={i}>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">{cat.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              {cat.apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id)}
                  className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm active:scale-95 transition-transform group cursor-pointer hover:shadow-md"
                >
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
