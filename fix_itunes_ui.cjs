const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/ITunesApp.tsx', 'utf8');

// The UI has some basic stuff. Let's make it look like a nice premium app.
// I'll replace the render methods.

code = code.replace(
    /return \([\s\S]*?\);\n\}/,
    `return (
    <div className="fixed inset-0 bg-[#0F0F0F] z-50 overflow-y-auto hide-scrollbar animate-in slide-in-from-bottom-full font-sans pb-20">
       <div className="bg-gradient-to-b from-[#EA4CC0]/30 to-[#0F0F0F] pt-14 pb-8 px-5 sticky top-0 z-30 backdrop-blur-xl border-b border-[#EA4CC0]/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
             <h1 className="text-white font-black text-4xl tracking-tight">iTunes</h1>
             <button onClick={handleClose} className="text-white/70 hover:text-white transition cursor-pointer bg-white/10 w-8 h-8 rounded-full flex items-center justify-center">
                 <i className="ph ph-x text-lg"></i>
             </button>
          </div>
          
          <div className="flex bg-white/10 p-1 rounded-xl mb-4 shadow-inner">
             <button onClick={() => {setTab('charts'); setChartType('singles');}} className={\`flex-1 py-1.5 rounded-lg text-sm font-bold transition \${tab === 'charts' && chartType === 'singles' ? 'bg-white text-[#EA4CC0] shadow-sm' : 'text-white/70 hover:text-white'}\`}>Singles</button>
             <button onClick={() => {setTab('charts'); setChartType('albums');}} className={\`flex-1 py-1.5 rounded-lg text-sm font-bold transition \${tab === 'charts' && chartType === 'albums' ? 'bg-white text-[#EA4CC0] shadow-sm' : 'text-white/70 hover:text-white'}\`}>Albums</button>
             <button onClick={() => setTab('disco')} className={\`flex-1 py-1.5 rounded-lg text-sm font-bold transition \${tab === 'disco' ? 'bg-white text-[#EA4CC0] shadow-sm' : 'text-white/70 hover:text-white'}\`}>My Library</button>
          </div>
       </div>

       {tab === 'charts' ? renderCharts() : renderDiscography()}
    </div>
  );
}`
);

code = code.replace(
    /const renderCharts = \(\) => \([\s\S]*?\);\n\n  const renderDiscography = \(\) => \(/,
    `const renderCharts = () => (
      <div className="px-5 py-6">
         <div className="mb-8 flex items-center space-x-3">
             <div className="w-10 h-10 rounded-full bg-[#EA4CC0]/20 flex items-center justify-center border border-[#EA4CC0]/40">
                <i className="ph-fill ph-globe text-[#EA4CC0] text-xl"></i>
             </div>
             <select 
                value={chartRegion}
                onChange={e => setChartRegion(e.target.value)}
                className="bg-transparent text-white font-bold text-xl outline-none border-b-2 border-[#EA4CC0]/30 pb-1 cursor-pointer"
             >
                <option value="global" className="bg-[#1A1A1A]">Global Top 50</option>
                <optgroup label="Countries" className="bg-[#1A1A1A]">
                   {Object.keys(COUNTRY_NAMES).map(c => (
                      <option key={c} value={c} className="bg-[#1A1A1A]">{COUNTRY_NAMES[c]} Top 50</option>
                   ))}
                </optgroup>
             </select>
         </div>

         <div className="space-y-4">
             {chartData.length > 0 ? chartData.map((item, i) => (
                 <div key={i} className={\`flex items-center p-3 rounded-2xl border transition group shadow-sm \${item.isPlayer ? 'bg-[#EA4CC0]/15 border-[#EA4CC0]/50' : 'bg-[#1A1A1A] border-white/5 hover:border-white/10'}\`}>
                     <div className="w-8 flex flex-col items-center justify-center shrink-0">
                         <span className={\`font-black text-lg \${i < 3 ? 'text-white' : 'text-white/40'}\`}>{i + 1}</span>
                         {item.lastPosition ? (
                             item.lastPosition < i + 1 ? <i className="ph-fill ph-caret-down text-red-500 text-[10px] mt-0.5"></i> :
                             item.lastPosition > i + 1 ? <i className="ph-fill ph-caret-up text-[#EA4CC0] text-[10px] mt-0.5"></i> :
                             <span className="text-gray-500 text-[10px] font-bold mt-0.5">-</span>
                         ) : <span className="text-blue-400 text-[9px] font-black uppercase mt-1 tracking-wider">New</span>}
                     </div>
                     <img src={item.cover || \`https://placehold.co/150x150/111111/444444?text=\${encodeURIComponent(item.title.charAt(0))}\`} className="w-14 h-14 rounded-xl object-cover shadow-md mx-4" />
                     <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                         <h4 className="font-bold text-white text-base leading-tight truncate mb-1">{item.title}</h4>
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
             )) : (
                 <p className="text-white/40 text-center py-10 text-sm font-medium">No chart data available yet.</p>
             )}
         </div>
      </div>
  );

  const renderDiscography = () => (`
);

fs.writeFileSync('src/components/Apps/ITunesApp.tsx', code);
