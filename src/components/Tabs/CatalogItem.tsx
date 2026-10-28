import React from 'react';
import { useGameContext } from '../../GameContext';
import { getItemRiaaCertBadge } from '../../data/riaaCertificationEngine';
import { RiaaCertBadge } from '../Apps/RiaaPlaqueVisual';

const CatalogItem = React.memo(({ item, onClick }: { item: any; onClick?: () => void }) => {
  const { state, setState } = useGameContext();
  const isProject = 'type' in item;
  const riaaBadge =
    item.status === 'released'
      ? getItemRiaaCertBadge(state, isProject ? 'project' : 'song', item.id)
      : null;

  const handleOpenRiaa = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState(p => ({ ...p, activeApp: 'riaa' }));
  };
  
  if (isProject) {
    return (
      <div 
        onClick={onClick}
        className="p-3 bg-white dark:bg-white/[0.04] rounded-2xl flex justify-between items-center border border-gray-100 dark:border-white/10 shadow-sm transition hover:shadow-md cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-500/40 group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <img src={item.cover} className="w-12 h-12 rounded-xl object-cover bg-gray-200 dark:bg-zinc-800 shrink-0" />
          <div className="min-w-0">
            <h4 className="font-bold text-apple-text text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{item.title}</h4>
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              <span className="text-xs text-apple-subtext font-medium uppercase">{item.type.replace('_', ' ')}</span>
              {item.status === 'released' ? 
                <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Released</span> : 
               item.status === 'scheduled' ?
                <span className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Scheduled</span> :
                <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Ready</span>
              }
              {riaaBadge && (
                <RiaaCertBadge
                  shortBadge={riaaBadge.shortBadge}
                  metalClass={riaaBadge.metalClass}
                  isCertified={riaaBadge.isCertified}
                  isEligibleForUpgrade={riaaBadge.isEligibleForUpgrade}
                  onClick={handleOpenRiaa}
                />
              )}
            </div>
          </div>
        </div>

        {item.status === 'released' && (
          <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-1 rounded-lg text-xs font-black shrink-0 border border-emerald-100 dark:border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition">
            <i className="ph ph-chart-polar text-sm"></i>
            <span className="hidden sm:inline">Snapshot</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="p-3 bg-white dark:bg-white/[0.04] rounded-2xl flex justify-between items-center border border-gray-100 dark:border-white/10 shadow-sm transition hover:shadow-md cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-500/40 group"
    >
      <div className="flex items-center space-x-3 min-w-0">
        <img src={item.cover} className="w-12 h-12 rounded-xl object-cover bg-gray-200 dark:bg-zinc-800 shrink-0" />
        <div className="min-w-0">
          <h4 className="font-bold text-apple-text text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{item.title}</h4>
          <div className="flex items-center flex-wrap gap-1.5 mt-1">
            <span className="text-xs text-apple-subtext font-medium">Quality: {item.status === 'writing' || item.status === 'recording' ? '???' : (item.quality || 0).toFixed(0)}</span>
            {item.theme && (
              <span className="bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-purple-200/60 dark:border-purple-500/30 truncate max-w-[120px]">
                {item.theme}
              </span>
            )}
            {item.status === 'writing' ? <span className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Writing ({item.daysLeft}d)</span> :
             item.status === 'written' ? <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Written</span> :
             item.status === 'recording' ? <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Recording ({item.daysLeft}d)</span> :
             item.status === 'recorded' ? <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Recorded</span> :
             item.status === 'scheduled' ? <span className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Scheduled</span> :
             item.status === 'released' ? <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Released</span> :
             <span className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-zinc-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Packaged</span>
            }
            {riaaBadge && (
              <RiaaCertBadge
                shortBadge={riaaBadge.shortBadge}
                metalClass={riaaBadge.metalClass}
                isCertified={riaaBadge.isCertified}
                isEligibleForUpgrade={riaaBadge.isEligibleForUpgrade}
                onClick={handleOpenRiaa}
              />
            )}
          </div>
        </div>
      </div>

      {item.status === 'released' && (
        <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-1 rounded-lg text-xs font-black shrink-0 border border-emerald-100 dark:border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition">
          <i className="ph ph-chart-polar text-sm"></i>
          <span className="hidden sm:inline">Snapshot</span>
        </div>
      )}
    </div>
  );
});

export default CatalogItem;
