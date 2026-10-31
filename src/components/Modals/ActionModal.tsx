import React, { useState, useRef } from 'react';
import { useGameContext } from '../../GameContext';
import { NPCS } from '../../constants';
import { NpcCollabCard } from './NpcCollabCard';
import { resolveAuthenticCover } from '../../data/musicCatalog';
import { evaluateDistinctTrackProfile } from '../../data/bSideDistinctVelocityEngine';
import { compressImageFile } from '../../utils/imageOptimizer';

export default function ActionModal({ type, onClose }: { type: string, onClose: () => void }) {
  const { state, setState, nextDay, setInfoModal } = useGameContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form States
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [subgenre, setSubgenre] = useState('');
  const [writer, setWriter] = useState('self');
  const [collab, setCollab] = useState('none');
  const [days, setDays] = useState('2');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [songId, setSongId] = useState('');
  const [studio, setStudio] = useState('home');
  const [recordDays, setRecordDays] = useState('2');

  const [projType, setProjType] = useState('single_pack');
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);

  const [releaseTarget, setReleaseTarget] = useState('');
  const [distributor, setDistributor] = useState('indie');
  const [strategy, setStrategy] = useState('indie');
  const [releaseDate, setReleaseDate] = useState(state.date.split('T')[0]);

  const [useAds, setUseAds] = useState('no');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setImagePreview(compressed);
      }
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    let newMoney = state.money;
    let newHype = state.hype;

    if (type === 'write') {
      if (!title.trim()) return alert("Please enter a song title.");
      const cost = writer === 'pro' ? 2500 : 0;
      if (newMoney < cost) return setInfoModal({ title: 'Insufficient Funds', desc: 'You do not have enough money to hire pro songwriters.' });
      newMoney -= cost;

      let qualityBonus = writer === 'pro' ? 18 : 0;
      if (collab !== 'none') qualityBonus += 5;

      let baseQuality = 10 + (parseInt(days) * 7) + qualityBonus + (Math.random() * 10);
      
      const cover = imagePreview || resolveAuthenticCover(state.artist?.name || 'Artist', title || 'Single');
      
      const newSong = {
        id: state.songsIdCounter, title, genre, subgenre, cover, status: 'writing' as const, daysLeft: parseInt(days),
        quality: Math.min(100, baseQuality), collabId: collab,
        basePotential: 0, momentum: 1.0, streams: 0, views: 0, pureSales: 0, radioPlays: 0,
        hasMV: false, mvAdsDays: 0,
        weeklyStreams: 0, weeklyViews: 0, weeklyPureSales: 0, weeklyRadioPlays: 0
      };

      setState(p => ({ ...p, money: newMoney, songs: [...p.songs, newSong], songsIdCounter: p.songsIdCounter + 1 }));
      setInfoModal({ title: 'Writing Started', desc: `"${title}" is in the works! Advance time for ${days} days to complete it.` });
    }
    else if (type === 'record') {
      if (!songId) return;
      const cost = studio === 'pro' ? (1500 * parseInt(recordDays)) : 0;
      if(newMoney < cost) return setInfoModal({ title: 'Insufficient Funds', desc: 'You need more funds for a professional studio.' });
      newMoney -= cost;

      let qualityBoost = studio === 'pro' ? (15 + (parseInt(recordDays) * 12)) : (5 + (parseInt(recordDays) * 5));

      setState(p => ({
        ...p, money: newMoney, 
        songs: p.songs.map(s => s.id === parseInt(songId) ? { ...s, status: 'recording', daysLeft: parseInt(recordDays), quality: Math.min(100, s.quality + qualityBoost + (Math.random() * 8)) } : s)
      }));
      setInfoModal({ title: 'Recording Started', desc: `Advance time for ${recordDays} days to finish recording the track.` });
    }
    else if (type === 'project') {
      if (!title.trim()) return alert("Please enter a project title.");
      if (selectedSongs.length === 0) return alert("Select at least 1 song.");
      if (projType === 'single_pack' && (selectedSongs.length < 1 || selectedSongs.length > 3)) return alert("Single Pack requires 1-3 songs.");
      if (projType === 'ep' && (selectedSongs.length < 3 || selectedSongs.length > 8)) return alert("EP requires 3-8 songs.");
      if (projType === 'album' && selectedSongs.length < 8) return alert("Album requires 8+ songs.");

      const projSongs = state.songs.filter(s => selectedSongs.includes(s.id));
      const avgQuality = projSongs.reduce((acc, s) => acc + s.quality, 0) / projSongs.length;
      const cover = imagePreview || resolveAuthenticCover(state.artist?.name || 'Artist', title || 'Album');

      const newProj = {
        id: state.projectIdCounter, title, type: projType as any, cover,
        songs: projSongs.map(s => ({...s, status: s.status === 'released' ? 'released' : 'packaged' as const})), status: 'created' as const, quality: avgQuality,
        basePotential: 0, momentum: 1.0, pureSales: 0, weeklyPureSales: 0
      };

      setState(p => ({
        ...p,
        projects: [...p.projects, newProj],
        projectIdCounter: p.projectIdCounter + 1,
        songs: p.songs.map(s => selectedSongs.includes(s.id) ? { ...s, status: s.status === 'released' ? 'released' : 'packaged' } : s)
      }));
      setInfoModal({ title: 'Project Created!', desc: `"${title}" (${projType.toUpperCase()}) is successfully packaged and ready for distribution.` });
    }
    else if (type === 'release') {
      if (!releaseTarget) return;
      let cost = strategy === 'ad_campaign' ? 8000 : (strategy === 'major_push' ? 30000 : 0);
      if (distributor === 'boutique') cost += 1000; else if (distributor === 'major') cost += 5000; else if (distributor === 'global') cost += 20000;
      if (newMoney < cost) return setInfoModal({ title: 'Insufficient Funds', desc: 'You do not have enough funds for this release strategy.' });
      newMoney -= cost;

      let hypeBoost = strategy === 'indie' ? 8 : (strategy === 'ad_campaign' ? 35 : 70);
      if (distributor === 'boutique') hypeBoost *= 1.1; else if (distributor === 'major') hypeBoost *= 1.3; else if (distributor === 'global') hypeBoost *= 1.7;
      newHype = Math.min(100, newHype + hypeBoost);

      let tierMultiplier = state.artist?.tier === 1 ? 1.4 : (state.artist?.tier === 2 ? 1.7 : 1.0);
      const isToday = releaseDate <= state.date.split('T')[0];
      const targetStatus = isToday ? 'released' : 'scheduled';

      setState(p => {
        let nextP = { ...p, money: newMoney, hype: newHype };
        if (releaseTarget.startsWith('song_')) {
          const id = parseInt(releaseTarget.split('_')[1]);
          nextP.songs = nextP.songs.map(s => {
            if (s.id === id) {
              let collabBonus = s.collabId && s.collabId !== 'none' ? 6 : 0;
              return { 
                ...s, 
                status: targetStatus, 
                releaseDate, 
                trackType: 'single' as const,
                basePotential: ((s.quality * 0.5) + (state.popularity * 0.3) + (state.hype * 0.2) + collabBonus) * tierMultiplier 
              };
            }
            return s;
          });
          if (isToday) setInfoModal({ title: 'Single Released Worldwide!', desc: `Single is now streaming across all digital platforms!` });
          else setInfoModal({ title: 'Release Scheduled!', desc: `Single will drop on ${releaseDate}.` });
        } else if (releaseTarget.startsWith('proj_')) {
          const id = parseInt(releaseTarget.split('_')[1]);
          let projBasePot = 0;
          nextP.projects = nextP.projects.map(pr => {
            if (pr.id === id) {
               projBasePot = ((pr.quality * 0.5) + (state.popularity * 0.4) + (state.hype * 0.1)) * tierMultiplier;
               return { ...pr, status: targetStatus, releaseDate, basePotential: projBasePot };
            }
            return pr;
          });
          
          const project = state.projects.find(p => p.id === id);
          if (project) {
              const projSongIds = project.songs.map(s => s.id);
              nextP.songs = nextP.songs.map(s => {
                  if (projSongIds.includes(s.id)) {
                      if (s.status !== 'released') {
                          return { 
                            ...s, 
                            status: targetStatus, 
                            releaseDate, 
                            trackType: project.type === 'single_pack' ? ('single' as const) : ('b_side' as const),
                            basePotential: projBasePot * (project.type === 'single_pack' 
                              ? 0.95 
                              : (0.56 + ((s.quality / 100) * 0.22) + (s.collabId && s.collabId !== 'none' ? 0.03 : 0.0))), 
                            cover: project.cover 
                          };
                      } else {
                          // Already released as lead single before album
                          return {
                            ...s,
                            trackType: 'lead_single' as const
                          };
                      }
                  }
                  return s;
              });
              
              nextP.projects = nextP.projects.map(pr => {
                  if (pr.id === id) {
                      return {
                          ...pr,
                          songs: pr.songs.map(ps => ({
                              ...ps, 
                              status: targetStatus === 'released' || ps.status === 'released' ? 'released' : 'scheduled',
                              basePotential: ps.status !== 'released' ? projBasePot * 0.75 : ps.basePotential,
                              cover: pr.cover
                          }))
                      };
                  }
                  return pr;
              });
          }

          if (isToday) setInfoModal({ title: 'Project Released!', desc: `Project is out now globally!` });
          else setInfoModal({ title: 'Project Scheduled!', desc: `Project will drop on ${releaseDate}.` });
        }
        return nextP;
      });
    }
    else if (type === 'create_mv') {
      if (!songId) return;
      let cost = distributor === 'vevo' ? 8000 : 3000;
      
      const isVevo = distributor === 'vevo';
      if (!isVevo && useAds === 'yes') cost += 15000;

      if (newMoney < cost) return setInfoModal({ title: 'Insufficient Funds', desc: 'Not enough funds for music video production.' });
      newMoney -= cost;
      newHype = Math.min(100, newHype + (isVevo ? 35 : 25));

      const songObj = state.songs.find(s => s.id === parseInt(songId));
      if (!songObj) return;

      const mvThumbnailImg = imagePreview || songObj.cover;

      setState(p => ({
        ...p, money: newMoney, hype: newHype,
        songs: p.songs.map(s => s.id === parseInt(songId) ? { ...s, hasMV: true, mvAdsDays: (!isVevo && useAds === 'yes') ? 10 : 0, mvDistributor: distributor as any, mvThumbnail: mvThumbnailImg, customVideoUrl: videoPreviewUrl || undefined } : s)
      }));
      setInfoModal({ title: 'Music Video Produced!', desc: `Official MV is ready! ${songObj.status === 'scheduled' ? 'It will premiere alongside the song release.' : 'It is now live on YouTube!'}` });
    }

    onClose();
  };

  const renderFormContent = () => {
    if (type === 'write') return (
      <>
        <div className="flex flex-col items-center justify-center mb-2">
          <div 
            className="w-24 h-24 rounded-2xl shadow-sm border border-gray-200 bg-apple-border flex items-center justify-center cursor-pointer relative overflow-hidden group" 
            onClick={() => fileInputRef.current?.click()} 
            style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            {!imagePreview && (
              <div className="flex flex-col items-center text-gray-400 group-hover:text-apple-blue">
                <i className="ph-bold ph-upload-simple text-2xl"></i>
                <span className="text-[10px] font-bold mt-1">Upload</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          </div>
          <p className="text-[10px] font-bold text-apple-subtext uppercase tracking-wider mt-1.5">Cover Art (Optional)</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Song Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-apple-bg text-apple-text rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-apple-blue font-medium" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Genre</label>
            <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-3 py-3.5 focus:ring-2 focus:ring-apple-blue text-sm font-medium appearance-none">
              <option value="Pop">Pop</option><option value="Hip-Hop">Hip-Hop / Rap</option><option value="R&B">R&B</option>
              <option value="Rock">Rock</option><option value="Electronic">Electronic / EDM</option><option value="Latin">Latin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Sub-Genre</label>
            <input type="text" value={subgenre} onChange={e => setSubgenre(e.target.value)} className="w-full bg-apple-bg text-apple-text rounded-2xl px-3 py-3.5 text-sm font-medium" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Songwriters</label>
            <select value={writer} onChange={e => setWriter(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-3 py-3.5 focus:ring-2 focus:ring-apple-blue text-sm font-medium appearance-none">
              <option value="self">Self (Free)</option><option value="pro">Pro Songwriter ($2,500)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Writing Days (Max 4)</label>
            <select value={days} onChange={e => setDays(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-apple-blue font-medium appearance-none">
              <option value="1">1 Day (Quick)</option><option value="2">2 Days (Standard)</option><option value="3">3 Days (Detailed)</option><option value="4">4 Days (Masterpiece)</option>
            </select>
          </div>
        </div>

        {/* Rich NPC collaboration card selector */}
        <NpcCollabCard selectedNpcId={collab} onSelectNpc={setCollab} />
        <button onClick={handleSubmit} className="w-full bg-apple-text text-white font-bold py-4 rounded-2xl mt-2 active:scale-95 transition cursor-pointer">Start Writing</button>
      </>
    );

    if (type === 'record') {
      const writtenSongs = state.songs.filter(s => s.status === 'written');
      return (
        <>
          {writtenSongs.length === 0 ? <p className="text-center text-apple-subtext text-sm">No written songs available.</p> : (
            <>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Select Song</label>
                <select value={songId} onChange={e => setSongId(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="">-- Select --</option>
                  {writtenSongs.map(s => <option key={s.id} value={s.id.toString()}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Studio Type</label>
                <select value={studio} onChange={e => setStudio(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="home">Bedroom Studio (Free)</option><option value="pro">Pro Recording Studio ($1,500/day)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Recording Duration (Max 3)</label>
                <select value={recordDays} onChange={e => setRecordDays(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="1">1 Day</option><option value="2">2 Days</option><option value="3">3 Days</option>
                </select>
              </div>
              <button onClick={handleSubmit} className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl mt-2 active:scale-95 transition cursor-pointer">Record Track</button>
            </>
          )}
        </>
      );
    }

    if (type === 'project') {
      const eligibleSongs = state.songs.filter(s => s.status === 'recorded' || s.status === 'released');
      return (
        <>
          {eligibleSongs.length === 0 ? <p className="text-center text-apple-subtext text-sm">No recorded or released songs available.</p> : (
            <>
              <div className="flex flex-col items-center justify-center mb-2">
                <div 
                  className="w-24 h-24 rounded-2xl shadow-sm border border-gray-200 bg-apple-border flex items-center justify-center cursor-pointer relative overflow-hidden group" 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  {!imagePreview && (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-apple-blue">
                      <i className="ph-bold ph-upload-simple text-2xl"></i>
                      <span className="text-[10px] font-bold mt-1">Upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                </div>
                <p className="text-[10px] font-bold text-apple-subtext uppercase tracking-wider mt-1.5">Project Cover Art (Optional)</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Project Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Project Type</label>
                <select value={projType} onChange={e => setProjType(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="single_pack">Single Pack (1-3 Songs)</option>
                  <option value="ep">EP (3-8 Songs)</option>
                  <option value="album">Studio Album (8+ Songs)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Select Tracks</label>
                <div className="max-h-36 overflow-y-auto p-2 bg-apple-bg rounded-2xl">
                  {eligibleSongs.map(s => (
                    <label key={s.id} className="flex items-center space-x-3 p-2 bg-white rounded-xl border border-gray-100 mb-2 cursor-pointer">
                      <input type="checkbox" checked={selectedSongs.includes(s.id)} onChange={e => setSelectedSongs(e.target.checked ? [...selectedSongs, s.id] : selectedSongs.filter(id => id !== s.id))} className="w-5 h-5 rounded text-apple-blue focus:ring-apple-blue" />
                      <span className="font-medium text-sm text-apple-text">{s.title} {s.status === 'released' && <span className="text-xs text-apple-subtext ml-1">(Released)</span>}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleSubmit} className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl mt-2 active:scale-95 transition cursor-pointer">Create Project</button>
            </>
          )}
        </>
      );
    }

    if (type === 'release') {
      const relOptions = [
        ...state.songs.filter(s => s.status === 'recorded').map(s => ({ value: `song_${s.id}`, label: `Single: ${s.title}` })),
        ...state.projects.filter(p => p.status === 'created').map(p => ({ value: `proj_${p.id}`, label: `Project: ${p.title} (${p.type})` }))
      ];
      return (
        <>
          {relOptions.length === 0 ? <p className="text-center text-apple-subtext text-sm">Nothing to release.</p> : (
            <>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Select Release</label>
                <select value={releaseTarget} onChange={e => setReleaseTarget(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="">-- Select --</option>
                  {relOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Digital Distributor</label>
                <select value={distributor} onChange={e => setDistributor(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="indie">Independent Distributor (Free)</option>
                  <option value="boutique">Boutique Label ($1,000)</option>
                  <option value="major">Major Record Label ($5,000 + Rev Split)</option>
                  <option value="global">Global Conglomerate ($20,000 + Heavy Split)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Release Date</label>
                <input type="date" value={releaseDate} min={state.date.split('T')[0]} onChange={e => setReleaseDate(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Marketing Campaign</label>
                <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="indie">Organic Drop (Free)</option>
                  <option value="ad_campaign">Social Media Ads ($8,000)</option>
                  <option value="major_push">Global Press & Radio Push ($30,000)</option>
                </select>
              </div>
              <button onClick={handleSubmit} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl mt-4 active:scale-95 transition cursor-pointer">Confirm Release Strategy</button>
            </>
          )}
        </>
      );
    }

    if (type === 'create_mv') {
      const eligibleSongs = state.songs.filter(s => (s.status === 'released' || s.status === 'scheduled') && !s.hasMV);
      return (
        <>
          {eligibleSongs.length === 0 ? <p className="text-center text-apple-subtext text-sm">No eligible songs.</p> : (
            <>
              <div className="flex flex-row justify-center space-x-6 mb-2">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-2xl shadow-sm border border-gray-200 bg-apple-border flex items-center justify-center cursor-pointer relative overflow-hidden" onClick={() => fileInputRef.current?.click()} style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none', backgroundSize: 'cover' }}>
                    {!imagePreview && <i className="ph-fill ph-image text-2xl text-gray-400"></i>}
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                  </div>
                  <p className="text-[10px] font-bold text-apple-subtext uppercase tracking-wider mt-2">Custom Thumbnail</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-2xl shadow-sm border border-gray-200 bg-apple-border flex items-center justify-center cursor-pointer relative overflow-hidden" onClick={() => { document.getElementById('video-upload')?.click() }}>
                    {videoPreviewUrl ? <i className="ph-fill ph-check-circle text-2xl text-green-500"></i> : <i className="ph-fill ph-video text-2xl text-gray-400"></i>}
                    <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                  </div>
                  <p className="text-[10px] font-bold text-apple-subtext uppercase tracking-wider mt-2">Custom Video MV</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Select Single</label>
                <select value={songId} onChange={e => setSongId(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="">-- Select --</option>
                  {eligibleSongs.map(s => <option key={s.id} value={s.id.toString()}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">Distributor</label>
                <select value={distributor} onChange={e => setDistributor(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                  <option value="indie">Standard (Independent)</option>
                  <option value="vevo">VEVO Network ($8,000) - High impact, organic only</option>
                </select>
              </div>
              {distributor !== 'vevo' && (
                  <div>
                    <label className="block text-xs font-bold text-apple-subtext mb-1 uppercase">YouTube Ads Promotion</label>
                    <select value={useAds} onChange={e => setUseAds(e.target.value)} className="w-full bg-apple-bg rounded-2xl px-4 py-3.5 font-medium appearance-none">
                      <option value="no">Organic Premiere ($3,000)</option>
                      <option value="yes">Paid YouTube Ad Campaign ($18,000)</option>
                    </select>
                  </div>
              )}
              <button onClick={handleSubmit} className="w-full bg-youtube-red text-white font-bold py-4 rounded-2xl mt-4 active:scale-95 transition cursor-pointer">Shoot & Premiere MV</button>
            </>
          )}
        </>
      );
    }
    
    return null;
  };

  const titles: Record<string, string> = {
    write: 'Write Song', record: 'Record Studio', project: 'Create Project', release: 'Release Strategy', create_mv: 'Produce Music Video'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-end md:justify-center animate-in fade-in pb-0 md:pb-6">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-apple-bg w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5 md:hidden"></div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl font-black text-apple-text tracking-tight">{titles[type]}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center active:scale-95 cursor-pointer"><i className="ph ph-x font-bold"></i></button>
        </div>
        <div className="overflow-y-auto pb-safe flex-1 hide-scrollbar space-y-4">
          {renderFormContent()}
        </div>
      </div>
    </div>
  );
}
