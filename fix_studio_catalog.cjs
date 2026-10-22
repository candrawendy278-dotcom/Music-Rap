const fs = require('fs');
let code = fs.readFileSync('src/components/Tabs/Studio.tsx', 'utf8');

// Replace the mapping logic
code = code.replace(
    /          \{\[\.\.\.state\.projects\]\.reverse\(\)\.map\(p => \([\s\S]*?\)\)\}      \n\n          \{\[\.\.\.state\.songs\]\.reverse\(\)\.filter\(s => s\.status !== 'packaged'\)\.map\(s => \([\s\S]*?\)\)\}/,
    `          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...state.projects, ...state.songs.filter(s => s.status !== 'packaged')]
              .sort((a, b) => b.id - a.id) // Sort by most recent ID roughly
              .slice(0, 30) // Only show the latest 30 to prevent lag
              .map((item: any) => {
                const isProject = 'type' in item;
                return (
                  <div key={isProject ? \`p-\${item.id}\` : \`s-\${item.id}\`} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <img src={item.cover} className="w-24 h-24 rounded-xl object-cover bg-gray-200 mb-3 shadow-sm" />
                    <h4 className="font-bold text-apple-text text-sm w-full truncate">{item.title}</h4>
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {isProject ? (
                        <>
                          <span className="text-[10px] text-apple-subtext font-bold uppercase">{item.type.replace('_', ' ')}</span>
                          {item.status === 'released' ? 
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Released</span> : 
                           item.status === 'scheduled' ?
                            <span className="bg-cyan-100 text-cyan-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Scheduled</span> :
                            <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Ready</span>
                          }
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-apple-subtext font-bold uppercase">{item.genre}</span>
                          {renderBadge(item)}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          {state.projects.length + state.songs.filter(s => s.status !== 'packaged').length > 30 && (
             <p className="text-xs text-center text-gray-400 mt-4">Showing latest 30 items. (Performance limited)</p>
          )}`
);

fs.writeFileSync('src/components/Tabs/Studio.tsx', code);
