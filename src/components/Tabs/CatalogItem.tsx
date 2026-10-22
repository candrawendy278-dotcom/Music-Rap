import React from 'react';

const CatalogItem = React.memo(({ item, onClick }: { item: any; onClick?: () => void }) => {
  const isProject = 'type' in item;
  
  if (isProject) {
    return (
      <div 
        onClick={onClick}
        className="p-3 bg-white rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm transition hover:shadow-md cursor-pointer hover:border-emerald-200 group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <img src={item.cover} className="w-12 h-12 rounded-xl object-cover bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <h4 className="font-bold text-apple-text text-sm truncate group-hover:text-emerald-700 transition">{item.title}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-apple-subtext font-medium uppercase">{item.type.replace('_', ' ')}</span>
              {item.status === 'released' ? 
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Released</span> : 
               item.status === 'scheduled' ?
                <span className="bg-cyan-100 text-cyan-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Scheduled</span> :
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Ready</span>
              }
            </div>
          </div>
        </div>

        {item.status === 'released' && (
          <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-black shrink-0 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition">
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
      className="p-3 bg-white rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm transition hover:shadow-md cursor-pointer hover:border-emerald-200 group"
    >
      <div className="flex items-center space-x-3 min-w-0">
        <img src={item.cover} className="w-12 h-12 rounded-xl object-cover bg-gray-200 shrink-0" />
        <div className="min-w-0">
          <h4 className="font-bold text-apple-text text-sm truncate group-hover:text-emerald-700 transition">{item.title}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-apple-subtext font-medium">Quality: {item.status === 'writing' || item.status === 'recording' ? '???' : (item.quality || 0).toFixed(0)}</span>
            {item.theme && (
              <span className="bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-purple-200/60 truncate max-w-[120px]">
                {item.theme}
              </span>
            )}
            {item.status === 'writing' ? <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Writing ({item.daysLeft}d)</span> :
             item.status === 'written' ? <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Written</span> :
             item.status === 'recording' ? <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Recording ({item.daysLeft}d)</span> :
             item.status === 'recorded' ? <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Recorded</span> :
             item.status === 'scheduled' ? <span className="bg-cyan-100 text-cyan-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Scheduled</span> :
             item.status === 'released' ? <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Released</span> :
             <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Packaged</span>
            }
          </div>
        </div>
      </div>

      {item.status === 'released' && (
        <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-black shrink-0 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition">
          <i className="ph ph-chart-polar text-sm"></i>
          <span className="hidden sm:inline">Snapshot</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.daysLeft === nextProps.item.daysLeft &&
    prevProps.item.dailyStreams === nextProps.item.dailyStreams &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.cover === nextProps.item.cover
  );
});

export default CatalogItem;
