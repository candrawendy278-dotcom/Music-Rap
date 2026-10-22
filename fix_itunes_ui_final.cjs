const fs = require('fs');
let code = fs.readFileSync('src/components/Apps/ITunesApp.tsx', 'utf8');

code = code.replace(
    /return \([\s\S]*?\);\n\}/,
    `return (
    <div className="fixed inset-0 bg-[#0F0F0F] z-50 overflow-y-auto hide-scrollbar animate-in slide-in-from-bottom-full font-sans pb-20 max-w-md mx-auto">
       <div className="bg-gradient-to-b from-[#EA4CC0]/30 to-[#0F0F0F] pt-14 pb-8 px-5 sticky top-0 z-30 backdrop-blur-xl border-b border-[#EA4CC0]/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
             <h1 className="text-white font-black text-4xl tracking-tight">iTunes</h1>
             <button onClick={handleClose} className="text-white/70 hover:text-white transition cursor-pointer bg-white/10 w-8 h-8 rounded-full flex items-center justify-center">
                 <i className="ph ph-x text-lg"></i>
             </button>
          </div>
          
          <div className="flex bg-white/10 p-1 rounded-xl mb-4 shadow-inner">
             <button onClick={() => {setActiveTab('chart'); setChartType('singles');}} className={\`flex-1 py-1.5 rounded-lg text-sm font-bold transition \${activeTab === 'chart' && chartType === 'singles' ? 'bg-white text-[#EA4CC0] shadow-sm' : 'text-white/70 hover:text-white'}\`}>Singles</button>
             <button onClick={() => {setActiveTab('chart'); setChartType('albums');}} className={\`flex-1 py-1.5 rounded-lg text-sm font-bold transition \${activeTab === 'chart' && chartType === 'albums' ? 'bg-white text-[#EA4CC0] shadow-sm' : 'text-white/70 hover:text-white'}\`}>Albums</button>
             <button onClick={() => setActiveTab('discography')} className={\`flex-1 py-1.5 rounded-lg text-sm font-bold transition \${activeTab === 'discography' ? 'bg-white text-[#EA4CC0] shadow-sm' : 'text-white/70 hover:text-white'}\`}>My Library</button>
          </div>
       </div>

       {activeTab === 'chart' ? renderChart() : renderDiscography()}
    </div>
  );
}`
);

// I need to properly overwrite renderChart and renderDiscography, but first I should remove the old bottom nav and profile tab.

fs.writeFileSync('src/components/Apps/ITunesApp.tsx', code);
