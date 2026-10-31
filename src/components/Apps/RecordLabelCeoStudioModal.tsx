import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Disc,
  Edit3,
  FileText,
  Flame,
  ImagePlus,
  Mic2,
  Music,
  PenTool,
  Sparkles,
  Upload,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { GameState } from '../../types';
import {
  ImprintScoutCandidate,
  ImprintSignedArtist,
  getDefaultImprintLogoSvg,
  getEnsuredRecordLabelState,
} from '../../data/recordLabelSystemEngine';
import {
  STAFF_CANDIDATE_POOL,
  STAFF_ROLE_DEFINITIONS,
  STAFF_ROLE_ORDER,
  StaffContractTermMonths,
  StaffPayrollCycle,
  StaffRoleId,
} from '../../data/staffTeamEngine';
import {
  RosterRecruitmentContractProposal,
  buildRosterArtistAvatarSvg,
  buildRosterReleaseCoverSvg,
  createAndReleaseRosterAlbumOrEp,
  ensureRosterArtistFullFields,
  evaluateRosterRecruitmentContract,
  executeRosterArtistPaperContract,
  getRosterArtistStaffBuffs,
  hireStaffForRosterOrLabel,
  releaseRecordedRosterSong,
  releaseStaffFromRosterOrLabel,
  updateRosterArtistIdentity,
  writeAndRecordRosterSong,
} from '../../data/recordLabelCeoEngine';
import { produceRosterArtistVideoPlayerStyle } from '../../data/rosterSharedWorldBridge';
import { RosterStudioAdapter } from '../Tabs/RosterStudioAdapter';

interface RosterPaperContractModalProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  candidate: ImprintScoutCandidate | null; // null = Custom New Signing
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const RosterPaperContractModal: React.FC<RosterPaperContractModalProps> = ({
  gameState,
  setGameState,
  candidate,
  onClose,
  onNotify,
}) => {
  const labelState = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const imprint = labelState.imprint;

  const [isCustomMode] = useState<boolean>(!candidate);
  const [customStageName, setCustomStageName] = useState<string>(
    candidate?.name || 'Aria Vance'
  );
  const [customRealName, setCustomRealName] = useState<string>(
    candidate ? `${candidate.name} (Legal Name)` : 'Aria Elizabeth Vance'
  );
  const [customGenre, setCustomGenre] = useState<string>(candidate?.genre || 'Pop');
  const [customCountry, setCustomCountry] = useState<string>(candidate?.country || 'US');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>('');

  const [offeredAdvance, setOfferedAdvance] = useState<number>(
    candidate ? candidate.askingAdvance : 45000
  );
  const [imprintRoyaltyCutPct, setImprintRoyaltyCutPct] = useState<number>(
    candidate ? candidate.recommendedImprintCutPct : 55
  );
  const [ancillary360CutPct, setAncillary360CutPct] = useState<number>(15);
  const [albumsCommitted, setAlbumsCommitted] = useState<number>(
    candidate ? candidate.albumsCommitted : 2
  );
  const [singlesCommitted, setSinglesCommitted] = useState<number>(4);
  const [termMonths, setTermMonths] = useState<12 | 24 | 36 | 48>(24);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const proposal: RosterRecruitmentContractProposal = useMemo(
    () => ({
      candidateId: candidate?.id,
      isCustomArtist: isCustomMode,
      customStageName,
      customRealName,
      customGenre,
      customCountry,
      customAvatarUrl: customAvatarUrl || undefined,
      offeredAdvance,
      imprintRoyaltyCutPct,
      ancillary360CutPct,
      albumsCommitted,
      singlesCommitted,
      termMonths,
    }),
    [
      candidate,
      isCustomMode,
      customStageName,
      customRealName,
      customGenre,
      customCountry,
      customAvatarUrl,
      offeredAdvance,
      imprintRoyaltyCutPct,
      ancillary360CutPct,
      albumsCommitted,
      singlesCommitted,
      termMonths,
    ]
  );

  const evalRes = useMemo(
    () => evaluateRosterRecruitmentContract(candidate, proposal, imprint.prestige),
    [candidate, proposal, imprint.prestige]
  );

  const handleExecute = () => {
    const res = executeRosterArtistPaperContract(gameState, proposal);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
    onClose();
  };

  const displayArtistName = (isCustomMode ? customStageName : candidate?.name) || 'Artist';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl border-4 border-[#8B7355] bg-[#FBF8F1] p-4 text-[#181613] shadow-2xl">
        <div className="relative border-2 border-[#8B7355]/60 p-4">
          <button
            onClick={onClose}
            className="absolute right-2.5 top-2.5 rounded-full border border-[#8B7355]/40 bg-[#EFE9DA] p-1.5 text-[#181613]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Official Imprint Letterhead */}
          <div className="flex flex-col items-center border-b-2 border-[#181613] pb-3.5 text-center">
            <img
              src={imprint.logoUrl || getDefaultImprintLogoSvg(imprint.imprintName)}
              alt={imprint.imprintName}
              className="h-14 w-14 rounded-2xl border-2 border-[#8B7355] object-cover shadow-md"
            />
            <div className="mt-1.5 font-serif text-[10px] font-bold uppercase tracking-widest text-[#5C4D3C]">
              {imprint.imprintName} • HQ: {imprint.headquarters}
            </div>
            <h2 className="mt-0.5 font-serif text-sm font-black uppercase tracking-wide text-[#181613]">
              EXCLUSIVE ROSTER ARTIST RECORDING CONTRACT
            </h2>
            <div className="font-mono text-[9px] text-[#5C4D3C]">
              CEO DOCKET • DATE: {String(gameState.date || '').split('T')[0] || 'CURRENT'}
            </div>
          </div>

          {/* Artist Identity & Custom Avatar Upload Section */}
          <div className="mt-3.5 rounded-lg border border-[#8B7355]/50 bg-[#F3EDE0] p-3">
            <div className="font-serif text-[10px] font-black uppercase tracking-wider text-[#181613]">
              ARTICLE I — RECORDING ARTIST IDENTITY &amp; STAGE PERSONA
            </div>
            <div className="mt-2 flex items-center gap-3">
              <img
                src={customAvatarUrl || buildRosterArtistAvatarSvg(displayArtistName)}
                alt={displayArtistName}
                className="h-14 w-14 shrink-0 rounded-xl border border-[#8B7355] object-cover"
              />
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={customStageName}
                  onChange={(e) => setCustomStageName(e.target.value)}
                  placeholder="Stage Name"
                  className="w-full rounded border border-[#8B7355]/50 bg-[#FBF8F1] px-2.5 py-1 font-serif text-xs font-bold text-[#181613]"
                />
                <input
                  type="text"
                  value={customRealName}
                  onChange={(e) => setCustomRealName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full rounded border border-[#8B7355]/50 bg-[#FBF8F1] px-2.5 py-1 font-serif text-[11px] text-[#3B3228]"
                />
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {candidate ? (
                <>
                  <div className="rounded border border-[#8B7355]/50 bg-[#EFE9DA] px-2 py-1 font-serif text-[10px] font-bold text-[#3B3228]">
                    <span className="block text-[8px] uppercase text-[#5C4D3C]">
                      Original Genre (Locked)
                    </span>
                    {candidate.genre}
                  </div>
                  <div className="rounded border border-[#8B7355]/50 bg-[#EFE9DA] px-2 py-1 font-serif text-[10px] font-bold text-[#3B3228]">
                    <span className="block text-[8px] uppercase text-[#5C4D3C]">
                      Origin Country (Locked)
                    </span>
                    {candidate.country}
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    placeholder="Genre (Pop, R&B...)"
                    className="rounded border border-[#8B7355]/50 bg-[#FBF8F1] px-2 py-1 font-serif text-[11px] font-bold text-[#181613]"
                  />
                  <input
                    type="text"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder="Country (US, UK...)"
                    className="rounded border border-[#8B7355]/50 bg-[#FBF8F1] px-2 py-1 font-serif text-[11px] font-bold text-[#181613]"
                  />
                </>
              )}
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex h-full w-full items-center justify-center gap-1 rounded border border-[#8B7355] bg-[#E5DEC9] px-2 py-1 font-serif text-[10px] font-black text-[#181613]"
                >
                  <Upload className="h-3 w-3" />
                  Photo
                </button>
              </div>
            </div>
          </div>

          {/* ARTICLE II: ADVANCE & ROYALTY SPLIT */}
          <div className="mt-3.5 space-y-2.5 border-t border-[#8B7355]/40 pt-3">
            <div className="rounded-lg border border-[#8B7355]/50 bg-[#F3EDE0] p-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-[10px] font-black uppercase text-[#181613]">
                  ARTICLE II — SIGNING ADVANCE
                </span>
                <span className="font-mono text-sm font-black text-[#0F5132]">
                  ${offeredAdvance.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={15000}
                max={300000}
                step={5000}
                value={offeredAdvance}
                onChange={(e) => setOfferedAdvance(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#181613]"
              />
              <div className="flex justify-between font-mono text-[9px] text-[#5C4D3C]">
                <span>$15k</span>
                <span>Target: ${(candidate?.askingAdvance || 45000).toLocaleString()}</span>
                <span>$300k</span>
              </div>
            </div>

            <div className="rounded-lg border border-[#8B7355]/50 bg-[#F3EDE0] p-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-[10px] font-black uppercase text-[#181613]">
                  ARTICLE III — MASTER ROYALTY SPLIT
                </span>
                <span className="font-mono text-xs font-black text-[#181613]">
                  {imprintRoyaltyCutPct}% Label / {100 - imprintRoyaltyCutPct}% Artist
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={80}
                step={1}
                value={imprintRoyaltyCutPct}
                onChange={(e) => setImprintRoyaltyCutPct(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#181613]"
              />
              <div className="mt-2 flex items-center justify-between border-t border-[#8B7355]/30 pt-2">
                <span className="font-serif text-[10px] font-bold text-[#3B3228]">
                  360 Ancillary Cut (Tour/Merch):
                </span>
                <div className="flex gap-1">
                  {[0, 10, 15, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setAncillary360CutPct(pct)}
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                        ancillary360CutPct === pct
                          ? 'border-[#181613] bg-[#181613] text-[#FBF8F1]'
                          : 'border-[#8B7355]/50 bg-[#FBF8F1] text-[#181613]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ARTICLE IV: QUOTAS & CONTRACT TERM */}
          <div className="mt-3.5 rounded-lg border border-[#8B7355]/50 bg-[#F3EDE0] p-3">
            <div className="font-serif text-[10px] font-black uppercase text-[#181613]">
              ARTICLE IV — DELIVERY QUOTA &amp; CONTRACT TERM
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <div className="font-serif text-[10px] text-[#4A4238]">Album Quota</div>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setAlbumsCommitted(q);
                        setSinglesCommitted(q * 2);
                      }}
                      className={`flex-1 rounded border py-1 font-serif text-[10px] font-black ${
                        albumsCommitted === q
                          ? 'border-[#181613] bg-[#181613] text-[#FBF8F1]'
                          : 'border-[#8B7355]/50 bg-[#FBF8F1] text-[#181613]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-serif text-[10px] text-[#4A4238]">Contract Term</div>
                <div className="mt-1 flex gap-1">
                  {([12, 24, 36, 48] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTermMonths(m)}
                      className={`flex-1 rounded border py-1 font-serif text-[10px] font-black ${
                        termMonths === m
                          ? 'border-[#181613] bg-[#181613] text-[#FBF8F1]'
                          : 'border-[#8B7355]/50 bg-[#FBF8F1] text-[#181613]'
                      }`}
                    >
                      {m / 12}Y
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Acceptance Probability */}
          <div className="mt-3.5 rounded-lg border-2 border-[#8B7355]/60 bg-[#EFE8D8] p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-serif text-[10px] font-black uppercase text-[#181613]">
                ARTIST ACCEPTANCE ODDS
              </span>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-black ${
                  evalRes.approvalChancePct >= 75
                    ? 'bg-[#0F5132] text-white'
                    : evalRes.approvalChancePct >= 50
                    ? 'bg-[#997404] text-white'
                    : 'bg-[#842029] text-white'
                }`}
              >
                {evalRes.approvalChancePct}% Odds
              </span>
            </div>
            <p className="mt-1 font-serif text-[10px] italic text-[#2B2620]">
              {evalRes.artistReaction}
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-4 flex items-center justify-between border-t-2 border-[#181613] pt-3">
            <div>
              <div className="font-serif text-[8px] uppercase text-[#5C4D3C]">LABEL CEO</div>
              <div className="font-serif text-xs italic text-[#1B365D]">
                {gameState.artist?.name || 'CEO'}
              </div>
            </div>
            <div className="rounded-full border border-[#8B6508] bg-[#D4AF37]/30 px-2.5 py-0.5 font-serif text-[8px] font-black uppercase text-[#2B1D00]">
              OFFICIAL SEAL
            </div>
            <div className="text-right">
              <div className="font-serif text-[8px] uppercase text-[#5C4D3C]">ARTIST</div>
              <div className="font-serif text-xs italic text-[#181613]">
                {displayArtistName}
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex flex-col gap-1.5">
            <button
              type="button"
              disabled={!evalRes.isAcceptable}
              onClick={handleExecute}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#181613] py-2.5 font-serif text-xs font-black uppercase tracking-wider text-[#FBF8F1] shadow-lg disabled:opacity-40"
            >
              <PenTool className="h-3.5 w-3.5 text-amber-400" />
              Wire ${offeredAdvance.toLocaleString()} &amp; Execute Contract
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-[#8B7355] bg-[#EFE9DA] py-1.5 font-serif text-[11px] font-bold uppercase text-[#181613]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RosterArtistCeoManagerModalProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  artistId: string;
  initialSubTab?: 'identity' | 'studio' | 'staff' | 'contract';
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const RosterArtistCeoManagerModal: React.FC<RosterArtistCeoManagerModalProps> = ({
  gameState,
  setGameState,
  artistId,
  initialSubTab = 'studio',
  onClose,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'identity' | 'studio' | 'staff' | 'contract'>(
    initialSubTab
  );

  const labelState = useMemo(() => getEnsuredRecordLabelState(gameState), [gameState]);
  const dateStr = gameState.date ? String(gameState.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === artistId);

  const artist: ImprintSignedArtist | null = useMemo(
    () => (rawArtist ? ensureRosterArtistFullFields(rawArtist, dateStr) : null),
    [rawArtist, dateStr]
  );

  // Identity Editor State (Original Genre & Country of Origin are locked for authenticity)
  const [stageNameInput, setStageNameInput] = useState<string>(
    artist?.stageName || artist?.name || ''
  );
  const [realNameInput, setRealNameInput] = useState<string>(artist?.realName || '');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Songwriting & Studio State
  const [studioMode, setStudioMode] = useState<'single' | 'album'>('single');
  const [songTitleInput, setSongTitleInput] = useState<string>('');
  const [songCollabInput, setSongCollabInput] = useState<string>('');
  const [producerTier, setProducerTier] = useState<
    'in_house' | 'hitmaker' | 'executive_legend'
  >('hitmaker');
  const [releaseImmediately, setReleaseImmediately] = useState<boolean>(true);
  const [songCoverPreview, setSongCoverPreview] = useState<string>('');
  const songCoverInputRef = useRef<HTMLInputElement | null>(null);

  // Album / EP Creator State
  const [projectTitleInput, setProjectTitleInput] = useState<string>('');
  const [projectType, setProjectType] = useState<'album' | 'ep'>('album');
  const [projectCoverPreview, setProjectCoverPreview] = useState<string>('');
  const [selectedSongIds, setSelectedSongIds] = useState<number[]>([]);
  const projectCoverInputRef = useRef<HTMLInputElement | null>(null);

  // Player-Identical MV / Video Production Settings in Studio
  const [mvDistributor, setMvDistributor] = useState<'standard' | 'vevo'>('vevo');
  const [mvPromoteAds, setMvPromoteAds] = useState<boolean>(false);

  // Staff Filter State
  const [staffScope, setStaffScope] = useState<'artist' | 'label'>('artist');
  const [selectedStaffRole, setSelectedStaffRole] = useState<StaffRoleId>('manager');

  if (!artist) return null;

  const staffBuffs = getRosterArtistStaffBuffs(gameState, artist);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = updateRosterArtistIdentity(gameState, artist.id, {
          avatarUrl: reader.result,
        });
        if (res.success) {
          setGameState(res.nextState);
          onNotify('Updated artist profile photo!', 'success');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveIdentity = () => {
    const res = updateRosterArtistIdentity(gameState, artist.id, {
      stageName: stageNameInput,
      realName: realNameInput,
    });
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleCoverUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'song' | 'project'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'song') setSongCoverPreview(reader.result);
        else setProjectCoverPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWriteAndRecordSong = () => {
    if (!songTitleInput.trim()) {
      onNotify('Enter a song title first.', 'error');
      return;
    }
    const res = writeAndRecordRosterSong(gameState, artist.id, {
      title: songTitleInput,
      genre: artist.genre,
      coverUrl: songCoverPreview || undefined,
      producerTier,
      collaboratorName: songCollabInput,
      releaseImmediately,
    });
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    setSongTitleInput('');
    setSongCollabInput('');
    setSongCoverPreview('');
    onNotify(res.message, 'success');
  };

  const handleReleaseVaultSong = (songId: number) => {
    const res = releaseRecordedRosterSong(gameState, artist.id, songId);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleReleaseProject = () => {
    if (!projectTitleInput.trim()) {
      onNotify('Enter an Album or EP title first.', 'error');
      return;
    }
    const res = createAndReleaseRosterAlbumOrEp(gameState, artist.id, {
      title: projectTitleInput,
      type: projectType,
      coverUrl: projectCoverPreview || undefined,
      includedSongIds: selectedSongIds,
      autoGenerateRemainingTracks: true,
    });
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    setProjectTitleInput('');
    setProjectCoverPreview('');
    setSelectedSongIds([]);
    onNotify(res.message, 'success');
  };

  const handleQuickUploadVisual = (
    songId: number,
    visualType: 'mv' | 'lyric_video' | 'visualizer'
  ) => {
    const res = produceRosterArtistVideoPlayerStyle(gameState, artist.id, {
      songId,
      videoType: visualType,
      mvDistributor,
      mvPromoteAds,
      lyricStyle: 'kinetic',
      visualizerStyle: 'loop_3d',
    });
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleHireStaff = (
    candidateId: string,
    cycle: StaffPayrollCycle = 'monthly',
    term: StaffContractTermMonths = 12
  ) => {
    const targetKey = staffScope === 'label' ? 'label' : artist.id;
    const res = hireStaffForRosterOrLabel(gameState, targetKey, candidateId, cycle, undefined, term);
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setGameState(res.nextState);
    onNotify(res.message, 'success');
  };

  const handleReleaseStaff = (roleId: StaffRoleId) => {
    const targetKey = staffScope === 'label' ? 'label' : artist.id;
    setGameState((prev) => releaseStaffFromRosterOrLabel(prev, targetKey, roleId));
    onNotify('Released staff member from contract.', 'success');
  };

  const activeStaffMap =
    staffScope === 'label'
      ? (labelState.imprint as any).labelStaffRoster || {}
      : artist.staffRoster || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-amber-500/35 bg-[#12101B] text-white shadow-2xl">
        {/* Top Artist Header */}
        <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#1A162B] to-[#12101B] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={artist.avatarUrl || buildRosterArtistAvatarSvg(artist.name)}
                alt={artist.stageName}
                className="h-14 w-14 shrink-0 rounded-2xl border border-amber-400/50 object-cover shadow-lg"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                    {labelState.imprint.imprintName} Roster
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {artist.genre} • {artist.country}
                  </span>
                </div>
                <h3 className="mt-0.5 text-lg font-black text-white">
                  {artist.stageName || artist.name}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Real Name: {artist.realName || artist.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/5 p-2 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Career Metrics Strip (Popularity, Fans, Monthly Listeners, Hype) - Android Mobile Friendly 2x2 */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
            <div className="rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5">
              <div className="text-[9px] uppercase text-zinc-400">Popularity</div>
              <div className="font-mono text-xs font-black text-amber-300">
                {artist.popularity}/100
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5">
              <div className="text-[9px] uppercase text-zinc-400">Fans</div>
              <div className="font-mono text-xs font-black text-emerald-400">
                {(artist.fans || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5">
              <div className="text-[9px] uppercase text-zinc-400">Monthly Listeners</div>
              <div className="font-mono text-xs font-black text-sky-300">
                {(artist.monthlyListeners || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-2.5 py-1.5">
              <div className="text-[9px] uppercase text-zinc-400">Hype</div>
              <div className="font-mono text-xs font-black text-rose-300">
                {Math.round(artist.hype || 45)}/100
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs - Android Mobile Friendly 2x2 on small screens */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'studio' as const, label: 'Studio & Songs', icon: Disc },
              { id: 'identity' as const, label: 'Edit Profile', icon: Edit3 },
              { id: 'staff' as const, label: `Staff (${staffBuffs.hiredCount})`, icon: Users },
              { id: 'contract' as const, label: 'Paper Deal', icon: FileText },
            ].map((t) => {
              const Icon = t.icon;
              const active = subTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-black transition ${
                    active
                      ? 'border border-amber-400/50 bg-amber-500/20 text-amber-200'
                      : 'border border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* ===============================================================
              SUB-TAB 1: CEO STUDIO, SONGWRITING, ALBUMS & DISCOGRAPHY
              (100% Identical 4-Step Player Studio Workflow: Writing -> Production -> Project -> Release)
             =============================================================== */}
          {subTab === 'studio' && (
            <RosterStudioAdapter
              rosterArtist={artist}
              onOpenExecutiveModal={() => setSubTab('identity')}
              embeddedInCeoModal={true}
            />
          )}

          {/* ===============================================================
              SUB-TAB 2: EDIT ROSTER ARTIST IDENTITY, STAGE NAME & PHOTO
             =============================================================== */}
          {subTab === 'identity' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/35 p-4 text-center">
                <img
                  src={artist.avatarUrl || buildRosterArtistAvatarSvg(artist.name)}
                  alt={artist.stageName}
                  className="h-24 w-24 rounded-2xl border-2 border-amber-400/50 object-cover shadow-xl"
                />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-3 flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-500 hover:text-black"
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload Custom Artist Photo
                </button>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400">
                    Stage Name (Artist Moniker)
                  </label>
                  <input
                    type="text"
                    value={stageNameInput}
                    onChange={(e) => setStageNameInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400">
                    Real / Legal Name
                  </label>
                  <input
                    type="text"
                    value={realNameInput}
                    onChange={(e) => setRealNameInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                    <span className="block text-[9px] font-bold uppercase text-zinc-500">
                      Original Genre (Locked)
                    </span>
                    <span className="mt-0.5 block text-xs font-black text-amber-300">
                      {artist.genre}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                    <span className="block text-[9px] font-bold uppercase text-zinc-500">
                      Country of Origin (Locked)
                    </span>
                    <span className="mt-0.5 block text-xs font-black text-sky-300">
                      {artist.country}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Original Genre and Country of Origin are permanently locked to preserve artist
                  authenticity in the shared world.
                </p>

                <button
                  type="button"
                  onClick={handleSaveIdentity}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-black uppercase text-black transition hover:bg-amber-400"
                >
                  Save Stage Name &amp; Identity
                </button>
              </div>
            </div>
          )}

          {/* ===============================================================
              SUB-TAB 3: HIRE & MANAGE DEDICATED STAFF TEAM FOR ROSTER ARTIST
             =============================================================== */}
          {subTab === 'staff' && (
            <div className="space-y-3.5">
              {/* Toggle: Dedicated Artist Staff vs Label-Wide Executive Division */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStaffScope('artist')}
                  className={`rounded-xl border py-2 text-xs font-black ${
                    staffScope === 'artist'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  {artist.stageName}&apos;s Team
                </button>
                <button
                  type="button"
                  onClick={() => setStaffScope('label')}
                  className={`rounded-xl border py-2 text-xs font-black ${
                    staffScope === 'label'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  Label-Wide Division
                </button>
              </div>

              {/* 6 Role Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {STAFF_ROLE_ORDER.map((rId) => {
                  const def = STAFF_ROLE_DEFINITIONS[rId];
                  const hired = Boolean(activeStaffMap[rId]);
                  return (
                    <button
                      key={rId}
                      onClick={() => setSelectedStaffRole(rId)}
                      className={`shrink-0 rounded-xl border px-3 py-1.5 text-[10px] font-black ${
                        selectedStaffRole === rId
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                          : 'border-white/10 bg-black/30 text-zinc-400'
                      }`}
                    >
                      {def.shortTitle} {hired ? '✓' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Active Hired Member for Selected Role */}
              {activeStaffMap[selectedStaffRole] && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-300">
                        Active {STAFF_ROLE_DEFINITIONS[selectedStaffRole].title}
                      </span>
                      <div className="text-sm font-black text-white">
                        {activeStaffMap[selectedStaffRole].name} (
                        {activeStaffMap[selectedStaffRole].tierLabel})
                      </div>
                      <div className="text-[10px] text-zinc-300">
                        {activeStaffMap[selectedStaffRole].specialtyTag}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-amber-300">
                        Salary: $
                        {(
                          activeStaffMap[selectedStaffRole].agreedSalaryPerCycle ||
                          (activeStaffMap[selectedStaffRole].dailyRetainer || 450) * 30
                        ).toLocaleString()}{' '}
                        / {activeStaffMap[selectedStaffRole].payrollCycle || 'monthly'} • Next Payday in{' '}
                        {activeStaffMap[selectedStaffRole].nextPaydayDaysLeft ?? 30}d
                      </div>
                    </div>
                    <button
                      onClick={() => handleReleaseStaff(selectedStaffRole)}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold text-rose-200"
                    >
                      Release
                    </button>
                  </div>
                </div>
              )}

              {/* Candidate Pool for Selected Role */}
              <div className="space-y-2">
                {STAFF_CANDIDATE_POOL.filter((c) => c.roleId === selectedStaffRole).map(
                  (cand) => {
                    const isHired =
                      activeStaffMap[selectedStaffRole]?.candidateId === cand.id;
                    const monthlySalary = cand.baseDailyRate * 29;
                    return (
                      <div
                        key={cand.id}
                        className="rounded-2xl border border-white/10 bg-black/35 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-300">
                              {cand.tierLabel}
                            </span>
                            <div className="mt-0.5 text-xs font-black text-white">
                              {cand.name}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {cand.specialtyTag}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-xs font-black text-emerald-400">
                              ${cand.signingBonus.toLocaleString()} Retainer
                            </div>
                            <div className="text-[10px] font-bold text-rose-300">
                              +${monthlySalary.toLocaleString()}/mo Salary
                            </div>
                            <div className="text-[9px] text-zinc-400">
                              (${cand.baseDailyRate.toLocaleString()}/day)
                            </div>
                          </div>
                        </div>
                        <p className="mt-1.5 text-[10px] text-zinc-300">
                          {cand.bio}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <button
                            disabled={isHired}
                            onClick={() => handleHireStaff(cand.id, 'monthly', 12)}
                            className="rounded-xl bg-amber-500 py-1.5 text-[10px] font-black text-black hover:bg-amber-400 disabled:opacity-40 cursor-pointer"
                          >
                            {isHired
                              ? 'Currently Assigned'
                              : `Hire Monthly ($${monthlySalary.toLocaleString()}/mo)`}
                          </button>
                          <button
                            disabled={isHired}
                            onClick={() => handleHireStaff(cand.id, 'daily', 12)}
                            className="rounded-xl bg-white/10 py-1.5 text-[10px] font-black text-white hover:bg-white/20 disabled:opacity-40 cursor-pointer"
                          >
                            {isHired
                              ? 'Assigned'
                              : `Hire Daily ($${cand.baseDailyRate.toLocaleString()}/d)`}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* ===============================================================
              SUB-TAB 4: PHYSICAL PAPER CONTRACT VIEWER FOR ROSTER ARTIST
             =============================================================== */}
          {subTab === 'contract' && (
            <div className="rounded-xl border-4 border-[#8B7355] bg-[#FBF8F1] p-4 text-[#181613]">
              <div className="border-2 border-[#8B7355]/60 p-3.5 space-y-3 font-serif text-xs">
                <div className="border-b-2 border-[#181613] pb-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#5C4D3C]">
                    {labelState.imprint.imprintName} • OFFICIAL RECORDING CONTRACT
                  </div>
                  <div className="mt-0.5 text-sm font-black uppercase">
                    ARTIST AGREEMENT: {artist.stageName} ({artist.realName})
                  </div>
                  <div className="font-mono text-[9px] text-[#5C4D3C]">
                    REF: {artist.contractRef} • SIGNED: {artist.signedDate}
                  </div>
                </div>

                <p>
                  <strong>1. ADVANCE &amp; RECOUPMENT:</strong> Label wired{' '}
                  <strong>${artist.advancePaid.toLocaleString()}</strong> (Remaining Unrecouped:{' '}
                  <strong>${artist.unrecoupedAdvance.toLocaleString()}</strong>).
                </p>
                <p>
                  <strong>2. ROYALTY SPLIT:</strong>{' '}
                  <strong>{artist.imprintRoyaltyCutPct}% to {labelState.imprint.imprintName}</strong>{' '}
                  / <strong>{100 - artist.imprintRoyaltyCutPct}% to {artist.stageName}</strong>{' '}
                  (360 Cut: {artist.ancillary360CutPct || 15}%).
                </p>
                <p>
                  <strong>3. DELIVERY QUOTA:</strong>{' '}
                  <strong>
                    {artist.albumsReleased}/{artist.albumsCommitted} Albums
                  </strong>{' '}
                  &amp;{' '}
                  <strong>
                    {artist.singlesReleased || 0}/{artist.singlesCommitted || 4} Singles
                  </strong>{' '}
                  ({artist.daysRemaining || 720} days remaining in term).
                </p>
                <p>
                  <strong>4. FINANCIAL LEDGER:</strong> Generated{' '}
                  <strong>
                    ${(artist.totalNetProfitForImprint || 0).toLocaleString()}
                  </strong>{' '}
                  in net master profit for {labelState.imprint.imprintName}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default RosterArtistCeoManagerModal;
