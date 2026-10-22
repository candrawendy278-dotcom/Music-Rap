import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '../../GameContext';
import { Song } from '../../types';
import { formatNum, formatNumFull } from '../../constants';

export default function YouTubePremiere({ video, onClose }: { video: Song, onClose: () => void }) {
  const { state, setState } = useGameContext();
  const [liveViewers, setLiveViewers] = useState(0);
  const [chatMessages, setChatMessages] = useState<{id: number, author: string, text: string, color: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // File upload for custom video
  const handleVideoUpload = (e: any) => {
    if (e.target.files && e.target.files[0]) {
       const url = URL.createObjectURL(e.target.files[0]);
       setState(prev => ({
           ...prev,
           songs: prev.songs.map(s => s.id === video.id ? { ...s, customVideoUrl: url } : s)
       }));
    }
  };

  // Setup live chat and viewers ticker
  useEffect(() => {
     let chatInterval: NodeJS.Timeout;
     let viewersInterval: NodeJS.Timeout;

     const fakeNames = ["Sarah", "Mike", "MusicLover", "BTSArmy", "PopFan", "Alex", "VibeCheck", "Anon", "Guest29", "Katy"];
     const fakeMessages = [
         "OMG finally!!", "The visuals are insane 🔥", "I was here!", "SOTY", "Can't stop watching",
         "The chorus is so catchy", "Who else is watching this at 3AM?", "Masterpiece.", "So proud!",
         "STREAM STREAM STREAM"
     ];
     const colors = ["#FF5252", "#FF4081", "#E040FB", "#7C4DFF", "#536DFE", "#448AFF", "#40C4FF", "#18FFFF", "#64FFDA"];

     chatInterval = setInterval(() => {
        if (Math.random() > 0.3) {
            setChatMessages(prev => {
                const newMsg = {
                    id: Date.now(),
                    author: fakeNames[Math.floor(Math.random() * fakeNames.length)],
                    text: fakeMessages[Math.floor(Math.random() * fakeMessages.length)],
                    color: colors[Math.floor(Math.random() * colors.length)]
                };
                return [...prev, newMsg].slice(-25); // Keep last 25 messages
            });
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
     }, 800);

     viewersInterval = setInterval(() => {
        // Calculate a fake live viewer count based on the momentum and hype
        const baseViewers = 1000 + (state.hype * 50) + (state.popularity * 100);
        const randomFluctuation = baseViewers * (0.9 + Math.random() * 0.2);
        setLiveViewers(Math.floor(randomFluctuation));
     }, 2000);

     return () => {
         clearInterval(chatInterval);
         clearInterval(viewersInterval);
     };
  }, [state.hype, state.popularity]);

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#0F0F0F] z-50 overflow-y-auto pb-10 animate-in fade-in hide-scrollbar flex flex-col">
       <div className="sticky top-0 z-20 bg-black">
          <div className="relative w-full aspect-video flex items-center justify-center group overflow-hidden bg-black">
             {video.customVideoUrl ? (
                 <video src={video.customVideoUrl} controls autoPlay className="absolute inset-0 w-full h-full object-cover z-10" />
             ) : (
                 <>
                    <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-md" style={{ backgroundImage: `url(${video.mvThumbnail || video.cover})` }}></div>
                    <img src={video.mvThumbnail || video.cover} className="relative h-full object-contain z-10 w-full" />
                 </>
             )}

             {/* Dark overlay for controls when no video is uploaded */}
             {!video.customVideoUrl && (
                 <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3 z-20">
                     <div className="flex justify-between items-start w-full">
                         <button onClick={onClose} className="text-white drop-shadow-md p-1 hover:bg-white/10 rounded-full transition cursor-pointer">
                             <i className="ph ph-caret-down text-2xl"></i>
                         </button>
                         <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Premiere</span>
                     </div>
                     <div className="flex flex-col items-center justify-center h-full">
                        <label className="bg-white/20 hover:bg-white/30 transition text-white px-4 py-2 rounded-full cursor-pointer flex items-center space-x-2 text-sm font-medium backdrop-blur-md">
                            <i className="ph ph-upload-simple text-lg"></i>
                            <span>Upload Custom Video</span>
                            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                        </label>
                     </div>
                 </div>
             )}

             {/* If video uploaded, just have back button overlay */}
             {video.customVideoUrl && (
                 <button onClick={onClose} className="absolute top-3 left-3 z-30 bg-black/50 text-white drop-shadow-md p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer">
                     <i className="ph ph-caret-down text-2xl"></i>
                 </button>
             )}
          </div>
       </div>

       {/* Info Section */}
       <div className="p-3 pt-4 border-b border-white/10">
          <h1 className="text-white font-bold text-lg leading-snug mb-1">
             {video.title} (Official Premiere)
          </h1>
          <div className="flex space-x-2 mb-2 text-[#AAAAAA] text-sm items-center flex-wrap">
             <span className="flex items-center text-red-500 font-bold"><i className="ph-fill ph-users mr-1"></i> {formatNumFull(liveViewers)} waiting</span>
             <span>•</span>
             <span>{formatNumFull(video.views)} total views</span>
             <span>•</span>
             <span className="flex items-center text-white font-medium"><i className="ph-fill ph-thumbs-up mr-1 text-red-500"></i> {formatNumFull(Math.min(video.mvLikes || Math.round(video.views * 0.018), Math.min(52000000, Math.max(1, Math.round(video.views * 0.018)))))} likes</span>
          </div>
       </div>

       {/* Live Chat Section */}
       <div className="flex-1 flex flex-col bg-[#0F0F0F] relative overflow-hidden">
           <div className="px-4 py-2 bg-[#1A1A1A] border-b border-white/10 sticky top-0 z-10">
               <span className="text-white font-medium text-sm">Top chat</span>
               <i className="ph ph-caret-down text-[#AAAAAA] text-sm ml-1"></i>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 hide-scrollbar" style={{ minHeight: '300px' }}>
               {chatMessages.map(msg => (
                   <div key={msg.id} className="flex items-start text-sm">
                       <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-3 shrink-0" style={{ backgroundColor: msg.color }}>
                           {msg.author.charAt(0)}
                       </div>
                       <div>
                           <span className="font-medium mr-2" style={{ color: msg.color }}>{msg.author}</span>
                           <span className="text-white">{msg.text}</span>
                       </div>
                   </div>
               ))}
               <div ref={chatEndRef} />
           </div>

           {/* Fake Chat Input */}
           <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#0F0F0F] border-t border-white/10 flex items-center space-x-2">
               <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">Y</div>
               <div className="flex-1 bg-[#272727] rounded-full px-4 py-2 text-sm text-[#AAAAAA]">Say something...</div>
               <i className="ph ph-paper-plane-right text-[#AAAAAA] text-xl ml-2"></i>
           </div>
       </div>
    </div>
  );
}
