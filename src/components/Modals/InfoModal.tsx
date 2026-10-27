import { useGameContext } from '../../GameContext';

export default function InfoModal() {
  const { infoModal, setInfoModal } = useGameContext();

  if (!infoModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="bg-apple-card border border-apple-border/60 w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
        <div className="w-16 h-16 bg-apple-bg rounded-2xl flex items-center justify-center text-apple-text text-3xl mb-5 shadow-sm mx-auto border border-apple-border/50">
          <i className="ph-fill ph-bell-ringing"></i>
        </div>
        <h3 className="text-xl font-black text-center text-apple-text mb-2 tracking-tight">{infoModal.title}</h3>
        <p className="text-center text-apple-subtext text-sm mb-8 font-medium leading-relaxed">{infoModal.desc}</p>
        <button 
          onClick={() => setInfoModal(null)} 
          className="w-full bg-neutral-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform shadow-md cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
