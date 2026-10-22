const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/ITunesApp.tsx', 'utf8');

const newRenderChart = `const renderChart = () => (
      <div className="px-5 py-2">
         <div className="mb-6 flex items-center space-x-3 bg-white/5 p-2 rounded-xl">
             <div className="w-10 h-10 rounded-lg bg-[#EA4CC0]/20 flex items-center justify-center border border-[#EA4CC0]/40 shrink-0">
                <i className="ph-fill ph-globe text-[#EA4CC0] text-xl"></i>
             </div>
             <select 
                value={chartRegion}
                onChange={e => setChartRegion(e.target.value)}
                className="bg-transparent text-white font-bold text-lg outline-none w-full cursor-pointer appearance-none"
             >
                <option value="global" className="bg-[#1A1A1A]">Global Top 50</option>
                <optgroup label="Countries" className="bg-[#1A1A1A]">
                   {Object.keys(COUNTRY_NAMES).map(c => (
                      <option key={c} value={c} className="bg-[#1A1A1A]">{COUNTRY_NAMES[c]} Top 50</option>
                   ))}
                </optgroup>
             </select>
             <i className="ph-fill ph-caret-down text-white/50 pr-2 pointer-events-none"></i>
         </div>

         <div className="space-y-3">
             {chartData.length > 0 ? chartData.map((item, i) => {
                 let trend = null;
                 if (item.lastPosition) {
                    if (item.lastPosition < i + 1) trend = <i className="ph-fill ph-caret-down text-red-500 text-[10px]"></i>;
                    else if (item.lastPosition > i + 1) trend = <i className="ph-fill ph-caret-up text-green-500 text-[10px]"></i>;
                    else trend = <span className="text-gray-500 text-[10px] font-bold">-</span>;
                 } else {
                    trend = <span className="text-blue-400 text-[9px] font-black uppercase tracking-wider">New</span>;
                 }
                 return (
                 <div key={i} className={\`flex items-center p-3 rounded-2xl border transition group shadow-sm \${item.isPlayer ? 'bg-[#EA4CC0]/15 border-[#EA4CC0]/50' : 'bg-[#1A1A1A] border-white/5 hover:border-white/10'}\`}>
                     <div className="w-8 flex flex-col items-center justify-center shrink-0">
                         <span className={\`font-black text-lg \${i < 3 ? 'text-white' : 'text-white/40'}\`}>{i + 1}</span>
                         <div className="mt-0.5">{trend}</div>
                     </div>
                     <img src={item.cover || \`https://placehold.co/150x150/111111/444444?text=\${encodeURIComponent(item.title.charAt(0))}\`} className="w-14 h-14 rounded-xl object-cover shadow-md mx-3" />
                     <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                         <h4 className="font-bold text-white text-base leading-tight truncate mb-0.5">{item.title}</h4>
                         <div className="flex items-center">
                            {item.isPlayer && <span className="bg-[#EA4CC0] text-white text-[8px] px-1.5 py-0.5 rounded-sm uppercase font-black tracking-widest mr-2 shadow-sm">You</span>}
                            <p className="text-white/50 text-xs truncate font-medium">{item.artist}</p>
                         </div>
                     </div>
                     <div className="text-right shrink-0">
                        <p className="text-white font-black text-sm">{formatNum(item.points)}</p>
                        <p className="text-white/30 text-[9px] uppercase font-bold tracking-widest mt-0.5">Sales</p>
                     </div>
                 </div>
                 )
             }) : (
                 <p className="text-white/40 text-center py-10 text-sm font-medium">No chart data available yet.</p>
             )}
         </div>
      </div>
  );`;

code = code.replace(/const renderChart = \(\) => \([\s\S]*?\);\n\n  const renderProfile/g, newRenderChart + '\n\n  const renderProfile');

const newRenderDiscography = `const renderDiscography = () => (
      <div className="px-5 py-2">
         <div className="mb-6">
            <h2 className="text-white font-black text-2xl">My Library</h2>
            <p className="text-white/50 text-xs font-medium">Total Sales: <span className="text-[#EA4CC0] font-bold">{formatNum(totalSales)}</span></p>
         </div>
         <div className="space-y-3">
             {allReleasesByDate.map((s) => (
                 <div key={\`\${s.itemType}_\${s.id}\`} className="flex p-3 rounded-2xl border border-white/5 bg-[#1A1A1A] items-center">
                     <img src={s.cover} className="w-16 h-16 rounded-xl object-cover shadow-md shrink-0 mr-4" />
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <h4 className="font-bold text-white text-base leading-tight mb-1 truncate">{s.title}</h4>
                         <div className="flex items-center text-xs">
                             <span className="text-[#EA4CC0] font-bold mr-2">{formatNumFull(s.pureSales)}</span>
                             <span className="text-white/40">Sales</span>
                         </div>
                     </div>
                     <div className="shrink-0 text-right">
                        <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Released</p>
                        <p className="text-white/70 text-xs font-medium mt-0.5">{s.releaseDate || state.date.split('T')[0]}</p>
                     </div>
                 </div>
             ))}
             {allReleasesByDate.length === 0 && <p className="text-white/40 text-center py-10 text-sm font-medium">No releases found.</p>}
         </div>
      </div>
  );`;

code = code.replace(/const renderDiscography = \(\) => \([\s\S]*?\);\n\n  return \(/g, newRenderDiscography + '\n\n  return (');

fs.writeFileSync('src/components/Apps/ITunesApp.tsx', code);
