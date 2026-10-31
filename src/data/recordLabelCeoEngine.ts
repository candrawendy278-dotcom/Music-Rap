import { GameState, Project, Song } from '../types';
import {
  ImprintScoutCandidate,
  ImprintSignedArtist,
  LabelAccountingStatementItem,
  getEnsuredRecordLabelState,
  IMPRINT_SCOUT_POOL,
} from './recordLabelSystemEngine';
import {
  HiredStaffMember,
  STAFF_CANDIDATE_POOL,
  StaffContractTermMonths,
  StaffPayrollCycle,
  StaffRoleId,
  getCandidateById,
  getCycleDaysCount,
} from './staffTeamEngine';
import {
  RIAA_CERTIFICATION_TIERS,
  RiaaCertifiedRecord,
  RiaaDiscLayout,
  RiaaFrameStyle,
  RiaaItemAuditEvaluation,
  RiaaMatboardStyle,
} from './riaaCertificationEngine';
import {
  MetacriticReleaseEntry,
  PitchforkReviewItem,
} from './pitchforkAndMetacriticEngine';
import { XPost } from './xSocialEngine';
import { syncActiveRosterArtistsToSharedWorld } from './rosterSharedWorldBridge';
import { getEnsuredSkillState } from './skillSystemEngine';

export interface RosterRecruitmentContractProposal {
  candidateId?: string;
  isCustomArtist?: boolean;
  customStageName?: string;
  customRealName?: string;
  customGenre?: string;
  customCountry?: string;
  customAvatarUrl?: string;
  offeredAdvance: number;
  imprintRoyaltyCutPct: number; // Label share (e.g. 55% Label / 45% Artist)
  ancillary360CutPct: number;   // 0% to 25%
  albumsCommitted: number;      // 1 to 4
  singlesCommitted: number;     // 2 to 10
  termMonths: 12 | 24 | 36 | 48;
}

export interface LabelYouTubeUploadItem {
  id: string;
  artistId: string;
  artistStageName: string;
  artistAvatarUrl: string;
  songId: number;
  songTitle: string;
  videoTitle: string;
  visualType: 'mv' | 'lyric_video' | 'visualizer';
  thumbnailUrl: string;
  releaseDate: string;
  views: number;
  dailyViews: number;
  likes: number;
  commentsCount: number;
  productionBudget: number;
}

export interface LabelOfficialYouTubeChannel {
  channelName: string;
  handle: string;
  avatarUrl: string;
  bannerUrl: string;
  description: string;
  subscribers: number;
  totalViews: number;
  dailyViews: number;
  totalAdRevenueEarned: number;
  uploads: LabelYouTubeUploadItem[];
}

export interface LabelOfficialXAccount {
  name: string;
  displayName: string;
  handle: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string;
  bannerUrl: string;
  followers: number;
  following: number;
  isVerified: boolean;
  posts: XPost[];
}

/**
 * Generates a high-contrast vector SVG avatar for a Roster Artist if no custom image is uploaded.
 */
export function buildRosterArtistAvatarSvg(
  artistOrName: string | ImprintSignedArtist,
  primaryHex = '#F59E0B',
  bgHex = '#14121E'
): string {
  if (typeof artistOrName === 'object' && artistOrName !== null) {
    if (artistOrName.avatarUrl) return artistOrName.avatarUrl;
    const nm = artistOrName.stageName || artistOrName.name || 'Artist';
    return buildRosterArtistAvatarSvg(nm, primaryHex, bgHex);
  }
  const clean = String(artistOrName || 'Artist').trim();
  const parts = clean.split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
      : clean.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="#09080E" />
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="34" fill="url(#rg)" stroke="${primaryHex}" stroke-width="4" />
    <circle cx="80" cy="80" r="56" fill="none" stroke="${primaryHex}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.65" />
    <text x="80" y="92" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-weight="900" font-size="40" letter-spacing="2">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates a crisp SVG cover art for a Roster Artist's Single or Album when no custom image is uploaded.
 */
export function buildRosterReleaseCoverSvg(
  artistName: string,
  releaseTitle: string,
  releaseType: 'Single' | 'EP' | 'Album' = 'Single'
): string {
  const palette = [
    ['#1E1B4B', '#F59E0B'],
    ['#0F172A', '#38BDF8'],
    ['#27171C', '#F43F5E'],
    ['#062C22', '#10B981'],
    ['#231942', '#E0B1CB'],
  ];
  const hash = (artistName + releaseTitle)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const [bg, accent] = palette[hash % palette.length];
  const safeArtist = (artistName || 'Artist')
    .replace(/[<>&"']/g, '')
    .slice(0, 22)
    .toUpperCase();
  const safeTitle = (releaseTitle || 'Untitled')
    .replace(/[<>&"']/g, '')
    .slice(0, 24);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <defs>
      <linearGradient id="cov" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="#08070C" />
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#cov)" />
    <rect x="16" y="16" width="268" height="268" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5" />
    <circle cx="150" cy="135" r="54" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.7" />
    <circle cx="150" cy="135" r="14" fill="${accent}" opacity="0.85" />
    <text x="150" y="46" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-weight="800" font-size="11" letter-spacing="3">${safeArtist}</text>
    <text x="150" y="232" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-weight="900" font-size="20">${safeTitle}</text>
    <text x="150" y="256" text-anchor="middle" fill="${accent}" font-family="monospace" font-weight="700" font-size="10" letter-spacing="2">OFFICIAL ${releaseType.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Ensures every signed roster artist has all full CEO fields (realName, stageName, avatarUrl, fans, monthlyListeners, songs, projects, staffRoster, riaaCertifications).
 */
export function ensureRosterArtistFullFields(
  art: ImprintSignedArtist,
  currentDateStr = '2026-01-01'
): ImprintSignedArtist {
  const stageName = art.stageName || art.name || 'Roster Artist';
  const realName = art.realName || `${stageName} (Legal Name)`;
  const avatarUrl = art.avatarUrl || buildRosterArtistAvatarSvg(stageName);
  const pop = Number(art.popularity) || 32;
  const hype = Number(art.hype) || 40;
  const fans =
    typeof art.fans === 'number' && art.fans > 0
      ? art.fans
      : Math.round(pop * 4200 + (art.totalStreamsGenerated || 15000) * 0.04);
  const monthlyListeners =
    typeof art.monthlyListeners === 'number' && art.monthlyListeners > 0
      ? art.monthlyListeners
      : Math.max(fans * 2, Math.round((art.dailyStreams || 12000) * 28));

  let songs: Song[] = Array.isArray(art.songs) ? [...art.songs] : [];
  if (songs.length === 0) {
    const debutTitle = art.latestReleaseTitle || `${stageName} — Debut Single`;
    const baseStreams = Math.max(25000, art.totalStreamsGenerated || pop * 6500);
    const baseSales = Math.round(baseStreams * 0.012);
    songs = [
      {
        id: Math.floor(100000 + Math.random() * 899999),
        title: debutTitle.replace(`${stageName} — `, ''),
        genre: art.genre || 'Pop',
        subgenre: art.genre || 'Pop',
        collabId: 'none',
        quality: art.latestReleaseQuality || Math.min(94, Math.round((art.potential || 78) * 0.9)),
        status: 'released',
        releaseDate: art.signedDate || currentDateStr,
        streams: baseStreams,
        dailyStreams: art.dailyStreams || Math.round(pop * 1200),
        weeklyStreams: (art.dailyStreams || Math.round(pop * 1200)) * 7,
        pureSales: baseSales,
        dailyPureSales: Math.max(15, Math.round((art.dailyStreams || 5000) * 0.008)),
        weeklyPureSales: Math.max(100, Math.round((art.dailyStreams || 5000) * 0.055)),
        cover: buildRosterReleaseCoverSvg(stageName, debutTitle, 'Single'),
        hasMV: false,
        mvAdsDays: 0,
        hasLyricVideo: false,
        hasVisualizer: false,
        views: 0,
        dailyViews: 0,
        weeklyViews: 0,
        radioPlays: 0,
        dailyRadioPlays: 0,
        weeklyRadioPlays: 0,
        momentum: 1.0,
        basePotential: art.potential || 80,
      },
    ];
  }

  const projects: Project[] = Array.isArray(art.projects) ? [...art.projects] : [];
  const staffRoster: Partial<Record<StaffRoleId, HiredStaffMember>> =
    art.staffRoster && typeof art.staffRoster === 'object' ? { ...art.staffRoster } : {};
  const riaaCertifications: RiaaCertifiedRecord[] = Array.isArray(art.riaaCertifications)
    ? [...art.riaaCertifications]
    : [];

  const singlesReleasedCount = songs.filter((s) => s.status === 'released').length;
  const albumsReleasedCount = projects.filter((p) => p.status === 'released').length;

  return {
    ...art,
    name: stageName,
    stageName,
    realName,
    avatarUrl,
    fans,
    monthlyListeners,
    contractRef:
      art.contractRef ||
      `IMP-${stageName.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}`,
    termMonths: art.termMonths || 24,
    daysRemaining: typeof art.daysRemaining === 'number' ? art.daysRemaining : 720,
    ancillary360CutPct: typeof art.ancillary360CutPct === 'number' ? art.ancillary360CutPct : 15,
    singlesCommitted: art.singlesCommitted || Math.max(2, (art.albumsCommitted || 2) * 2),
    singlesReleased: singlesReleasedCount,
    albumsReleased: Math.max(art.albumsReleased || 0, albumsReleasedCount),
    songs,
    projects,
    staffRoster,
    riaaCertifications,
  };
}

/**
 * Ensures the Player's Official Record Label YouTube Channel is initialized and synced with all Roster visual uploads.
 */
export function getEnsuredLabelYouTubeChannel(
  state: GameState
): LabelOfficialYouTubeChannel {
  const labelState = getEnsuredRecordLabelState(state);
  const imprint = labelState.imprint;
  const dateStr = state?.date ? String(state.date).split('T')[0] : '2026-01-01';
  const cleanName = imprint.imprintName || `${state?.artist?.name || 'Sovereign'} Records`;
  const cleanHandle = `@${cleanName.replace(/[^a-zA-Z0-9]/g, '')}Official`;

  const existing: Partial<LabelOfficialYouTubeChannel> =
    (imprint as any).youtubeChannel || {};

  // Synthesize uploads from existing.uploads + any roster song visual flags
  const uploadsMap = new Map<string, LabelYouTubeUploadItem>();
  if (Array.isArray(existing.uploads)) {
    for (const u of existing.uploads) {
      if (u && u.id) uploadsMap.set(u.id, u);
    }
  }

  let rosterTotalViews = 0;
  let rosterDailyViews = 0;

  for (const rawArt of imprint.signedRoster || []) {
    const art = ensureRosterArtistFullFields(rawArt, dateStr);
    for (const s of art.songs || []) {
      if (s.status !== 'released') continue;
      if (s.hasMV) {
        const id = `yt_mv_${art.id}_${s.id}`;
        const views = s.views || 15000;
        const dailyViews = s.dailyViews || 1200;
        rosterTotalViews += views;
        rosterDailyViews += dailyViews;
        if (!uploadsMap.has(id)) {
          uploadsMap.set(id, {
            id,
            artistId: art.id,
            artistStageName: art.stageName || art.name,
            artistAvatarUrl: art.avatarUrl || buildRosterArtistAvatarSvg(art.name),
            songId: s.id,
            songTitle: s.title,
            videoTitle: `${art.stageName || art.name} - ${s.title} (Official Music Video)`,
            visualType: 'mv',
            thumbnailUrl: s.mvThumbnail || s.cover || buildRosterReleaseCoverSvg(art.name, s.title),
            releaseDate: s.releaseDate || dateStr,
            views,
            dailyViews,
            likes: s.mvLikes || Math.round(views * 0.068),
            commentsCount: Math.round(views * 0.008),
            productionBudget: 35000,
          });
        } else {
          const prev = uploadsMap.get(id)!;
          uploadsMap.set(id, {
            ...prev,
            views: Math.max(prev.views, views),
            dailyViews: Math.max(prev.dailyViews, dailyViews),
          });
        }
      }
      if (s.hasLyricVideo) {
        const id = `yt_lyric_${art.id}_${s.id}`;
        const views = s.lyricVideoViews || 8500;
        const dailyViews = s.dailyLyricVideoViews || 650;
        rosterTotalViews += views;
        rosterDailyViews += dailyViews;
        if (!uploadsMap.has(id)) {
          uploadsMap.set(id, {
            id,
            artistId: art.id,
            artistStageName: art.stageName || art.name,
            artistAvatarUrl: art.avatarUrl || buildRosterArtistAvatarSvg(art.name),
            songId: s.id,
            songTitle: s.title,
            videoTitle: `${art.stageName || art.name} - ${s.title} (Official Lyric Video)`,
            visualType: 'lyric_video',
            thumbnailUrl:
              s.lyricVideoThumbnail || s.cover || buildRosterReleaseCoverSvg(art.name, s.title),
            releaseDate: s.lyricVideoReleaseDate || s.releaseDate || dateStr,
            views,
            dailyViews,
            likes: s.lyricVideoLikes || Math.round(views * 0.055),
            commentsCount: Math.round(views * 0.006),
            productionBudget: 8000,
          });
        }
      }
      if (s.hasVisualizer) {
        const id = `yt_vis_${art.id}_${s.id}`;
        const views = s.visualizerViews || 6200;
        const dailyViews = s.dailyVisualizerViews || 480;
        rosterTotalViews += views;
        rosterDailyViews += dailyViews;
        if (!uploadsMap.has(id)) {
          uploadsMap.set(id, {
            id,
            artistId: art.id,
            artistStageName: art.stageName || art.name,
            artistAvatarUrl: art.avatarUrl || buildRosterArtistAvatarSvg(art.name),
            songId: s.id,
            songTitle: s.title,
            videoTitle: `${art.stageName || art.name} - ${s.title} (Official Visualizer)`,
            visualType: 'visualizer',
            thumbnailUrl:
              s.visualizerThumbnail || s.cover || buildRosterReleaseCoverSvg(art.name, s.title),
            releaseDate: s.visualizerReleaseDate || s.releaseDate || dateStr,
            views,
            dailyViews,
            likes: s.visualizerLikes || Math.round(views * 0.05),
            commentsCount: Math.round(views * 0.005),
            productionBudget: 4000,
          });
        }
      }
    }
  }

  const uploads = Array.from(uploadsMap.values()).sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  const computedTotalViews = Math.max(
    existing.totalViews || 0,
    uploads.reduce((acc, u) => acc + (u.views || 0), 0),
    rosterTotalViews
  );
  const computedDailyViews = Math.max(
    existing.dailyViews || 0,
    uploads.reduce((acc, u) => acc + (u.dailyViews || 0), 0),
    rosterDailyViews
  );
  const baseSubs =
    (imprint.prestige || 25) * 1850 +
    (imprint.signedRoster?.length || 0) * 18500 +
    Math.round(computedTotalViews * 0.014);

  const syncedLabelLogo = imprint.logoUrl || existing.avatarUrl || '';

  return {
    channelName: existing.channelName || `${cleanName} Official`,
    handle: existing.handle || cleanHandle,
    avatarUrl: syncedLabelLogo,
    bannerUrl: syncedLabelLogo,
    description:
      existing.description ||
      `Official global YouTube channel & visual premiere network for ${cleanName}. Watch official music videos, lyric videos, and visualizers from our signed roster.`,
    subscribers: Math.max(existing.subscribers || 0, baseSubs),
    totalViews: computedTotalViews,
    dailyViews: computedDailyViews,
    totalAdRevenueEarned:
      existing.totalAdRevenueEarned || Math.round(computedTotalViews * 0.0022),
    uploads,
  };
}

/**
 * Ensures the Player's Official Record Label X (Twitter) Account is initialized.
 */
export function getEnsuredLabelXAccount(
  stateOrImprint: GameState | any
): LabelOfficialXAccount {
  const isImprintDirect =
    stateOrImprint &&
    typeof stateOrImprint === 'object' &&
    'imprintName' in stateOrImprint;
  const imprint = isImprintDirect
    ? stateOrImprint
    : getEnsuredRecordLabelState(stateOrImprint).imprint;
  const artistName = isImprintDirect
    ? 'CEO'
    : stateOrImprint?.artist?.name || 'CEO';
  const cleanName = imprint.imprintName || `${artistName} Records`;
  const cleanHandle = `@${cleanName.replace(/[^a-zA-Z0-9]/g, '')}HQ`;

  const existing: Partial<LabelOfficialXAccount> = (imprint as any).xAccount || {};
  const rosterFollowersSum = (imprint.signedRoster || []).reduce(
    (acc: number, a: ImprintSignedArtist) =>
      acc + Math.round((a.fans || a.popularity * 3500) * 0.35),
    0
  );
  const computedFollowers = Math.max(
    existing.followers || 0,
    (imprint.prestige || 25) * 2400 + rosterFollowersSum
  );

  const resolvedDisplayName = existing.displayName || existing.name || cleanName;
  const syncedLabelLogo = imprint.logoUrl || existing.avatarUrl || '';
  const syncedPosts = Array.isArray(existing.posts)
    ? existing.posts.map((p) =>
        syncedLabelLogo ? { ...p, authorAvatar: syncedLabelLogo } : p
      )
    : [];

  return {
    name: resolvedDisplayName,
    displayName: resolvedDisplayName,
    handle: existing.handle || cleanHandle,
    bio:
      existing.bio ||
      `Official account of ${cleanName} • Global Record Label & Artist Imprint Founded by ${artistName} • HQ: ${
        imprint.headquarters || 'Los Angeles / London'
      }`,
    location: existing.location || imprint.headquarters || 'Los Angeles / London',
    website:
      existing.website ||
      `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    avatarUrl: syncedLabelLogo,
    bannerUrl:
      existing.bannerUrl ||
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    followers: computedFollowers,
    following: existing.following || Math.max(12, (imprint.signedRoster?.length || 0) + 18),
    isVerified: true,
    posts: syncedPosts,
  };
}

/**
 * Evaluates a Roster Artist Recruitment Contract before execution.
 */
export function evaluateRosterRecruitmentContract(
  candidate: ImprintScoutCandidate | null,
  proposal: RosterRecruitmentContractProposal,
  imprintPrestige = 32
): {
  approvalChancePct: number;
  isAcceptable: boolean;
  artistReaction: string;
} {
  const askingAdvance = candidate ? candidate.askingAdvance : 45000;
  const targetImprintCut = candidate ? candidate.recommendedImprintCutPct : 55;

  const advanceRatio = proposal.offeredAdvance / Math.max(1, askingAdvance);
  const advanceScore = Math.round((advanceRatio - 1) * 42);
  const cutDiff = proposal.imprintRoyaltyCutPct - targetImprintCut; // higher imprint cut = lower artist cut
  const cutScore = Math.round(-cutDiff * 1.8);
  const cut360Penalty = Math.round(-(proposal.ancillary360CutPct - 10) * 0.7);
  const prestigeBonus = Math.round(imprintPrestige * 0.22);

  if (proposal.imprintRoyaltyCutPct > 80) {
    return {
      approvalChancePct: 0,
      isAcceptable: false,
      artistReaction: `"Taking more than 80% of master royalties leaves me with less than 20%. My legal counsel cannot approve that split."`,
    };
  }

  const rawOdds = 76 + advanceScore + cutScore + cut360Penalty + prestigeBonus;
  const approvalChancePct = Math.max(15, Math.min(100, rawOdds));

  let artistReaction = `"This contract gives me the financial backing and creative platform I need. I'm ready to sign with your Imprint!"`;
  if (approvalChancePct >= 88) {
    artistReaction = `"An incredible offer! With a $${proposal.offeredAdvance.toLocaleString()} advance and ${100 - proposal.imprintRoyaltyCutPct}% artist royalty share, let's make history together!"`;
  } else if (approvalChancePct < 55) {
    artistReaction = `"The advance is a bit below my valuation or the label cut is steep, so my manager is hesitant—but we can still consider it."`;
  }

  return {
    approvalChancePct,
    isAcceptable: true,
    artistReaction,
  };
}

/**
 * Executes an official Physical Paper Contract to sign a Scouted or Custom Artist to the Player's Record Label Imprint.
 */
export function executeRosterArtistPaperContract(
  state: GameState,
  proposal: RosterRecruitmentContractProposal
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  if (!labelState.imprint.isFounded) {
    return {
      nextState: state,
      success: false,
      message: 'Incorporate your Record Label Imprint first before signing artists.',
    };
  }

  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < proposal.offeredAdvance) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient treasury funds to wire the $${proposal.offeredAdvance.toLocaleString()} signing advance.`,
    };
  }

  const candidate = proposal.candidateId
    ? IMPRINT_SCOUT_POOL.find((c) => c.id === proposal.candidateId) || null
    : null;

  const evalRes = evaluateRosterRecruitmentContract(
    candidate,
    proposal,
    labelState.imprint.prestige
  );
  if (!evalRes.isAcceptable) {
    return { nextState: state, success: false, message: evalRes.artistReaction };
  }

  if (Math.random() * 100 > evalRes.approvalChancePct) {
    return {
      nextState: state,
      success: false,
      message: `The artist's management declined the contract draft (${evalRes.approvalChancePct}% approval odds). Increase the advance or improve the artist royalty split.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const stageName =
    (proposal.isCustomArtist ? proposal.customStageName : candidate?.name)?.trim() ||
    'Nova Sterling';
  const realName =
    proposal.customRealName?.trim() ||
    `${stageName} (Legal Name)`;
  const genre = candidate
    ? candidate.genre
    : proposal.customGenre?.trim() || 'Pop';
  const country = candidate
    ? candidate.country
    : proposal.customCountry?.trim() || 'US';
  const pop = candidate ? candidate.popularity : 34;
  const pot = candidate ? candidate.potential : 86;

  const artistId = candidate
    ? candidate.id
    : `roster_custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  if (labelState.imprint.signedRoster.some((r) => r.id === artistId)) {
    return {
      nextState: state,
      success: false,
      message: `${stageName} is already signed to your Imprint roster.`,
    };
  }

  const cleanParts = stageName.split(/\s+/);
  const initials =
    cleanParts.length >= 2
      ? `${cleanParts[0][0] || ''}${cleanParts[1][0] || ''}`.toUpperCase()
      : stageName.slice(0, 2).toUpperCase();

  const avatarUrl =
    proposal.customAvatarUrl || buildRosterArtistAvatarSvg(stageName);

  const initialDailyStreams = Math.round(
    (pop * 1450 + pot * 380) *
      (labelState.imprint.distributionPartnerId === 'major_umg_jv' ? 1.25 : 1.0)
  );
  const initialFans = Math.round(pop * 4800 + pot * 650);
  const initialMonthlyListeners = Math.round(initialDailyStreams * 28);

  const debutTitle = `${stageName} — Debut Single`;
  const debutSong: Song = {
    id: Math.floor(100000 + Math.random() * 899999),
    title: 'Midnight Sovereign',
    genre,
    subgenre: genre,
    collabId: 'none',
    quality: Math.min(96, Math.round(pot * 0.92)),
    status: 'released',
    releaseDate: dateStr,
    streams: initialDailyStreams * 4,
    dailyStreams: initialDailyStreams,
    weeklyStreams: initialDailyStreams * 7,
    pureSales: Math.round(initialDailyStreams * 0.04),
    dailyPureSales: Math.round(initialDailyStreams * 0.008),
    weeklyPureSales: Math.round(initialDailyStreams * 0.05),
    cover: buildRosterReleaseCoverSvg(stageName, 'Midnight Sovereign', 'Single'),
    hasMV: false,
    mvAdsDays: 0,
    hasLyricVideo: false,
    hasVisualizer: false,
    views: 0,
    dailyViews: 0,
    weeklyViews: 0,
    radioPlays: 0,
    dailyRadioPlays: 0,
    weeklyRadioPlays: 0,
    momentum: 1.0,
    basePotential: pot,
  };

  const newSignedArtist: ImprintSignedArtist = {
    id: artistId,
    name: stageName,
    stageName,
    realName,
    avatarUrl,
    initials,
    genre,
    country,
    bio:
      candidate?.bio ||
      `Signed recording artist on ${labelState.imprint.imprintName}.`,
    popularity: pop,
    fans: initialFans,
    monthlyListeners: initialMonthlyListeners,
    hype: 52,
    potential: pot,
    signedDate: dateStr,
    contractRef: `IMP-${initials}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    termMonths: proposal.termMonths,
    daysRemaining: proposal.termMonths * 30,
    advancePaid: proposal.offeredAdvance,
    unrecoupedAdvance: proposal.offeredAdvance,
    imprintRoyaltyCutPct: proposal.imprintRoyaltyCutPct,
    ancillary360CutPct: proposal.ancillary360CutPct,
    albumsCommitted: proposal.albumsCommitted,
    albumsReleased: 0,
    singlesCommitted: proposal.singlesCommitted,
    singlesReleased: 1,
    daysUntilNextRelease: 24,
    totalStreamsGenerated: debutSong.streams || 0,
    dailyStreams: initialDailyStreams,
    totalGrossGenerated: 0,
    totalNetProfitForImprint: 0,
    latestReleaseTitle: debutTitle,
    latestReleaseQuality: debutSong.quality,
    songs: [debutSong],
    projects: [],
    staffRoster: {},
    riaaCertifications: [],
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_ceo_sign_${Date.now()}`,
    date: dateStr,
    title: `Executed Recording Contract with ${stageName}`,
    detail: `Wired $${proposal.offeredAdvance.toLocaleString()} advance • ${proposal.imprintRoyaltyCutPct}% Label / ${100 - proposal.imprintRoyaltyCutPct}% Artist Split • ${proposal.albumsCommitted} Albums & ${proposal.singlesCommitted} Singles Quota (${proposal.termMonths} Months).`,
    amount: proposal.offeredAdvance,
    direction: 'debit',
    category: 'imprint',
  };

  const nextRoster = [...labelState.imprint.signedRoster, newSignedArtist];

  const nextState: GameState = {
    ...state,
    money: currentMoney - proposal.offeredAdvance,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: nextRoster,
        prestige: Math.min(100, labelState.imprint.prestige + 6),
        valuation: labelState.imprint.valuation + proposal.offeredAdvance * 2.5,
      },
      statements: [stmt, ...labelState.statements].slice(0, 45),
    },
  };
  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: `Executed official contract with ${stageName}! They are now on ${labelState.imprint.imprintName}'s active roster.`,
  };
}

/**
 * Updates a Roster Artist's Stage Name, Real Name, Genre, Country, or Custom Uploaded Avatar Image.
 */
export function updateRosterArtistIdentity(
  state: GameState,
  artistId: string,
  updates: {
    stageName?: string;
    realName?: string;
    genre?: string;
    country?: string;
    avatarUrl?: string;
    bio?: string;
  }
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const target = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!target) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const ensured = ensureRosterArtistFullFields(target, dateStr);
  const nextStageName = updates.stageName?.trim() || ensured.stageName || ensured.name;
  const nextRealName = updates.realName?.trim() || ensured.realName || nextStageName;
  // Originality Lock: Country of Origin and Primary Genre cannot be altered after signing
  const lockedGenre = ensured.genre || 'Pop';
  const lockedCountry = ensured.country || 'US';
  const nextAvatar = updates.avatarUrl || ensured.avatarUrl;

  const cleanParts = nextStageName.split(/\s+/);
  const initials =
    cleanParts.length >= 2
      ? `${cleanParts[0][0] || ''}${cleanParts[1][0] || ''}`.toUpperCase()
      : nextStageName.slice(0, 2).toUpperCase();

  const updatedArtist: ImprintSignedArtist = {
    ...ensured,
    name: nextStageName,
    stageName: nextStageName,
    realName: nextRealName,
    initials,
    genre: lockedGenre,
    country: lockedCountry,
    avatarUrl: nextAvatar,
    bio: updates.bio !== undefined ? updates.bio : ensured.bio,
  };

  const nextRoster = labelState.imprint.signedRoster.map((a) =>
    a.id === artistId ? updatedArtist : a
  );

  const nextState: GameState = {
    ...state,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: nextRoster,
      },
    },
  };
  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: `Updated artist profile for ${nextStageName}!`,
  };
}

/**
 * Hires an Executive Staff Member (Manager, PR, Producer, Tour Agent, Radio Plugger, Creative Director)
 * either for a specific Roster Artist OR for the Label-Wide Executive Division ('label').
 */
export function hireStaffForRosterOrLabel(
  state: GameState,
  targetId: 'label' | string,
  candidateId: string,
  payrollCycle: StaffPayrollCycle = 'monthly',
  offeredSalaryPerCycle?: number,
  termMonths: StaffContractTermMonths = 12
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const candidate =
    getCandidateById(candidateId) ||
    STAFF_CANDIDATE_POOL.find((c) => c.id === candidateId);

  if (!candidate) {
    return { nextState: state, success: false, message: 'Staff candidate not found.' };
  }

  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < candidate.signingBonus) {
    return {
      nextState: state,
      success: false,
      message: `Insufficient funds for ${candidate.name}'s $${candidate.signingBonus.toLocaleString()} signing retainer.`,
    };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const cycleDays = getCycleDaysCount(payrollCycle);
  const salaryPerCycle =
    offeredSalaryPerCycle ||
    (payrollCycle === 'daily'
      ? candidate.baseDailyRate
      : payrollCycle === 'monthly'
      ? candidate.baseDailyRate * 29
      : candidate.baseDailyRate * 335);

  const dailyEquivalent = Math.round(salaryPerCycle / cycleDays);
  const contractTotalDays = termMonths * 30;

  const newMember: HiredStaffMember = {
    candidateId: candidate.id,
    roleId: candidate.roleId,
    name: candidate.name,
    initials: candidate.initials,
    tier: candidate.tier,
    tierLabel: candidate.tierLabel,
    agencyTitle: candidate.agencyTitle,
    specialtyTag: candidate.specialtyTag,
    hiredDate: dateStr,
    payrollCycle,
    agreedSalaryPerCycle: salaryPerCycle,
    dailyRetainer: dailyEquivalent,
    nextPaydayDaysLeft: cycleDays,
    contractTermMonths: termMonths,
    contractTotalDays,
    contractDaysRemaining: contractTotalDays,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    loyalty: 78,
    autonomousProgressDays: 0,
    autonomousCycleTargetDays: 7,
    currentTaskLabel: `Assigned to ${
      targetId === 'label'
        ? `${labelState.imprint.imprintName} Executive Division`
        : 'Roster Artist Team'
    }.`,
    activeDirectiveDaysLeft: 0,
    totalDeliverablesCompleted: 0,
  };

  if (targetId === 'label') {
    const existingLabelStaff = (labelState.imprint as any).labelStaffRoster || {};
    const updatedImprint = {
      ...labelState.imprint,
      labelStaffRoster: {
        ...existingLabelStaff,
        [candidate.roleId]: newMember,
      },
    };
    return {
      nextState: {
        ...state,
        money: currentMoney - candidate.signingBonus,
        recordLabelState: {
          ...labelState,
          imprint: updatedImprint,
        },
      },
      success: true,
      message: `Hired ${candidate.name} (${candidate.specialtyTag}) to ${labelState.imprint.imprintName}'s Label-Wide Executive Division!`,
    };
  }

  const targetArtist = labelState.imprint.signedRoster.find((a) => a.id === targetId);
  if (!targetArtist) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const ensured = ensureRosterArtistFullFields(targetArtist, dateStr);
  const updatedArtist: ImprintSignedArtist = {
    ...ensured,
    staffRoster: {
      ...(ensured.staffRoster || {}),
      [candidate.roleId]: newMember,
    },
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - candidate.signingBonus,
      recordLabelState: {
        ...labelState,
        imprint: {
          ...labelState.imprint,
          signedRoster: labelState.imprint.signedRoster.map((a) =>
            a.id === targetId ? updatedArtist : a
          ),
        },
      },
    },
    success: true,
    message: `Hired ${candidate.name} (${candidate.specialtyTag}) for ${ensured.stageName}'s team!`,
  };
}

/**
 * Releases a Staff Member from a Roster Artist or the Label-Wide Executive Division.
 */
export function releaseStaffFromRosterOrLabel(
  state: GameState,
  targetId: 'label' | string,
  roleId: StaffRoleId
): GameState {
  const labelState = getEnsuredRecordLabelState(state);
  if (targetId === 'label') {
    const nextStaff = { ...((labelState.imprint as any).labelStaffRoster || {}) };
    delete nextStaff[roleId];
    return {
      ...state,
      recordLabelState: {
        ...labelState,
        imprint: {
          ...labelState.imprint,
          labelStaffRoster: nextStaff,
        } as any,
      },
    };
  }

  return {
    ...state,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: labelState.imprint.signedRoster.map((a) => {
          if (a.id !== targetId) return a;
          const nextStaff = { ...(a.staffRoster || {}) };
          delete nextStaff[roleId];
          return { ...a, staffRoster: nextStaff };
        }),
      },
    },
  };
}

/**
 * Computes combined Staff Buffs for a Roster Artist (merging their personal staff + Label-Wide Executive Staff).
 */
export function getRosterArtistStaffBuffs(
  state: GameState,
  artist: ImprintSignedArtist
): {
  studioQualityBonus: number;
  radioSpinsBonus: number;
  fanGrowthMult: number;
  streamVelocityMult: number;
  hiredCount: number;
} {
  const labelState = getEnsuredRecordLabelState(state);
  const labelStaff: Partial<Record<StaffRoleId, HiredStaffMember>> =
    (labelState.imprint as any).labelStaffRoster || {};
  const artistStaff: Partial<Record<StaffRoleId, HiredStaffMember>> =
    artist.staffRoster || {};

  const getRoleTier = (role: StaffRoleId): number => {
    const aTier = artistStaff[role]?.tier || 0;
    const lTier = labelStaff[role]?.tier || 0;
    return Math.max(aTier, lTier);
  };

  const prodTier = getRoleTier('producer');
  const creativeTier = getRoleTier('creative_director');
  const radioTier = getRoleTier('radio_plugger');
  const prTier = getRoleTier('publicist');
  const managerTier = getRoleTier('manager');
  const tourTier = getRoleTier('tour_agent');

  const studioQualityBonus = prodTier * 3 + creativeTier * 1.5;
  const radioSpinsBonus = radioTier * 110;
  const fanGrowthMult = 1 + (prTier * 0.04 + creativeTier * 0.03 + tourTier * 0.03);
  const streamVelocityMult = 1 + (managerTier * 0.03 + radioTier * 0.04 + prTier * 0.03);

  const uniqueRoles = new Set([
    ...Object.keys(artistStaff),
    ...Object.keys(labelStaff),
  ]);

  return {
    studioQualityBonus,
    radioSpinsBonus,
    fanGrowthMult,
    streamVelocityMult,
    hiredCount: uniqueRoles.size,
  };
}

/**
 * Writes, records, and optionally releases a new Song for a signed Roster Artist.
 */
export function writeAndRecordRosterSong(
  state: GameState,
  artistId: string,
  input: {
    title: string;
    genre?: string;
    coverUrl?: string;
    producerTier: 'in_house' | 'hitmaker' | 'executive_legend';
    collaboratorName?: string;
    releaseImmediately: boolean;
  }
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  if (
    artist.isFormerRoster ||
    artist.contractExpired ||
    (typeof artist.daysRemaining === 'number' && artist.daysRemaining <= 0)
  ) {
    return {
      nextState: state,
      success: false,
      message: `${artist.stageName || artist.name}'s contract has expired. Renew their contract to produce new music.`,
    };
  }

  const studioCost =
    input.producerTier === 'executive_legend'
      ? 25000
      : input.producerTier === 'hitmaker'
      ? 10000
      : 2500;

  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < studioCost) {
    return {
      nextState: state,
      success: false,
      message: `Studio production requires $${studioCost.toLocaleString()}.`,
    };
  }

  const cleanTitle = input.title.trim() || 'Untitled Session';
  const fullTitle = input.collaboratorName?.trim()
    ? `${cleanTitle} (feat. ${input.collaboratorName.trim()})`
    : cleanTitle;

  const buffs = getRosterArtistStaffBuffs(state, artist);
  const producerQualityAdd =
    input.producerTier === 'executive_legend'
      ? 12
      : input.producerTier === 'hitmaker'
      ? 6
      : 2;

  // Measure Studio Quality directly from the Player's own Songwriting, Recording & Production Skills!
  const pSkills = getEnsuredSkillState(state.skills);
  const avgSongwritingLv =
    ((pSkills.songwriting.lyrics?.level || 1) +
      (pSkills.songwriting.melodyHook?.level || 1) +
      (pSkills.songwriting.storytelling?.level || 1) +
      (pSkills.songwriting.emotionalResonance?.level || 1)) /
    4;
  const avgRecordingLv =
    ((pSkills.recording.vocalDelivery?.level || 1) +
      (pSkills.recording.flowCadence?.level || 1) +
      (pSkills.recording.micTechnique?.level || 1)) /
    3;
  const avgProdLv =
    ((pSkills.production.beatMaking?.level || 1) +
      (pSkills.production.audioEngineering?.level || 1) +
      (pSkills.production.masteringPolish?.level || 1)) /
    3;
  const playerSkillQualityBase =
    54 + avgSongwritingLv * 1.45 + avgRecordingLv * 1.25 + avgProdLv * 1.35;

  const baseQuality = Math.round(
    playerSkillQualityBase +
      producerQualityAdd +
      buffs.studioQualityBonus +
      (Math.random() * 6 - 2)
  );
  const quality = Math.max(52, Math.min(100, baseQuality));

  const distMult =
    labelState.imprint.distributionPartnerId === 'major_umg_jv'
      ? 1.3
      : labelState.imprint.distributionPartnerId === 'awal_orchard'
      ? 1.15
      : 1.0;

  const debutDailyStreams = input.releaseImmediately
    ? Math.round(
        ((artist.popularity || 35) * 1650 + quality * 480 + (artist.hype || 45) * 260) *
          distMult *
          buffs.streamVelocityMult
      )
    : 0;

  const debutSales = input.releaseImmediately
    ? Math.max(40, Math.round(debutDailyStreams * 0.015))
    : 0;

  const newSong: Song = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    title: fullTitle,
    genre: input.genre || artist.genre || 'Pop',
    subgenre: input.genre || artist.genre || 'Pop',
    collabId: input.collaboratorName?.trim() ? input.collaboratorName.trim() : 'none',
    quality,
    status: input.releaseImmediately ? 'released' : 'recorded',
    releaseDate: input.releaseImmediately ? dateStr : undefined,
    streams: debutDailyStreams,
    dailyStreams: debutDailyStreams,
    weeklyStreams: debutDailyStreams * 7,
    pureSales: debutSales,
    dailyPureSales: debutSales,
    weeklyPureSales: debutSales * 5,
    radioPlays: input.releaseImmediately ? buffs.radioSpinsBonus : 0,
    dailyRadioPlays: input.releaseImmediately ? Math.round(buffs.radioSpinsBonus * 0.25) : 0,
    weeklyRadioPlays: input.releaseImmediately ? buffs.radioSpinsBonus * 2 : 0,
    cover:
      input.coverUrl ||
      buildRosterReleaseCoverSvg(artist.stageName || artist.name, fullTitle, 'Single'),
    hasMV: false,
    mvAdsDays: 0,
    hasLyricVideo: false,
    hasVisualizer: false,
    views: 0,
    dailyViews: 0,
    weeklyViews: 0,
    momentum: 1.0,
    basePotential: Math.min(100, Math.round((artist.potential + quality) / 2)),
  };

  const nextSongs = [newSong, ...(artist.songs || [])];
  const nextSinglesReleased = nextSongs.filter((s) => s.status === 'released').length;
  const nextPop = input.releaseImmediately
    ? Math.min(100, Number(((artist.popularity || 35) + 1.5).toFixed(1)))
    : artist.popularity;
  const nextHype = input.releaseImmediately
    ? Math.min(100, Number(((artist.hype || 45) + 10).toFixed(1)))
    : artist.hype;
  const nextFans = input.releaseImmediately
    ? (artist.fans || 50000) + Math.round(debutDailyStreams * 0.08 * buffs.fanGrowthMult)
    : artist.fans || 50000;

  const updatedArtist: ImprintSignedArtist = {
    ...artist,
    popularity: nextPop,
    hype: nextHype,
    fans: nextFans,
    monthlyListeners: Math.max(
      artist.monthlyListeners || 0,
      Math.round((artist.dailyStreams + debutDailyStreams) * 28)
    ),
    dailyStreams: (artist.dailyStreams || 0) + debutDailyStreams,
    totalStreamsGenerated: (artist.totalStreamsGenerated || 0) + debutDailyStreams,
    singlesReleased: nextSinglesReleased,
    latestReleaseTitle: input.releaseImmediately
      ? `${artist.stageName} — ${fullTitle}`
      : artist.latestReleaseTitle,
    latestReleaseQuality: input.releaseImmediately ? quality : artist.latestReleaseQuality,
    songs: nextSongs,
  };

  const nextStatements = [...labelState.statements];
  if (input.releaseImmediately) {
    nextStatements.unshift({
      id: `stmt_roster_s_${Date.now()}`,
      date: dateStr,
      title: `${labelState.imprint.imprintName} Single Release: ${artist.stageName} - "${fullTitle}"`,
      detail: `Studio Quality ${quality}/100 • Debuted with ${debutDailyStreams.toLocaleString()} streams & ${debutSales.toLocaleString()} pure sales.`,
      amount: studioCost,
      direction: 'debit',
      category: 'imprint',
    });
  }

  const nextState: GameState = {
    ...state,
    money: currentMoney - studioCost,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: labelState.imprint.signedRoster.map((a) =>
          a.id === artistId ? updatedArtist : a
        ),
      },
      statements: nextStatements.slice(0, 45),
    },
  };
  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: input.releaseImmediately
      ? `Produced and released "${fullTitle}" by ${artist.stageName} (Quality ${quality}/100 • ${debutDailyStreams.toLocaleString()} debut streams)!`
      : `Recorded "${fullTitle}" for ${artist.stageName} (Quality ${quality}/100) — saved to their studio vault!`,
  };
}

/**
 * Releases an existing 'recorded' song in a Roster Artist's vault as an official Single.
 */
export function releaseRecordedRosterSong(
  state: GameState,
  artistId: string,
  songId: number
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const targetSong = (artist.songs || []).find((s) => s.id === songId);
  if (!targetSong || targetSong.status === 'released') {
    return {
      nextState: state,
      success: false,
      message: 'Track is already released or not found.',
    };
  }

  const buffs = getRosterArtistStaffBuffs(state, artist);
  const debutDailyStreams = Math.round(
    ((artist.popularity || 35) * 1650 + (targetSong.quality || 75) * 480) *
      buffs.streamVelocityMult
  );
  const debutSales = Math.max(40, Math.round(debutDailyStreams * 0.015));

  const nextSongs = (artist.songs || []).map((s) => {
    if (s.id !== songId) return s;
    return {
      ...s,
      status: 'released' as const,
      releaseDate: dateStr,
      streams: debutDailyStreams,
      dailyStreams: debutDailyStreams,
      weeklyStreams: debutDailyStreams * 7,
      pureSales: debutSales,
      dailyPureSales: debutSales,
      weeklyPureSales: debutSales * 5,
    };
  });

  const updatedArtist: ImprintSignedArtist = {
    ...artist,
    popularity: Math.min(100, Number(((artist.popularity || 35) + 1.4).toFixed(1))),
    hype: Math.min(100, Number(((artist.hype || 45) + 10).toFixed(1))),
    fans: (artist.fans || 50000) + Math.round(debutDailyStreams * 0.08),
    dailyStreams: (artist.dailyStreams || 0) + debutDailyStreams,
    totalStreamsGenerated: (artist.totalStreamsGenerated || 0) + debutDailyStreams,
    singlesReleased: nextSongs.filter((s) => s.status === 'released').length,
    latestReleaseTitle: `${artist.stageName} — ${targetSong.title}`,
    latestReleaseQuality: targetSong.quality,
    songs: nextSongs,
  };

  const nextState: GameState = {
    ...state,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: labelState.imprint.signedRoster.map((a) =>
          a.id === artistId ? updatedArtist : a
        ),
      },
    },
  };
  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: `Released "${targetSong.title}" by ${artist.stageName} to global streaming platforms!`,
  };
}

/**
 * Packages and releases a multi-track Album or EP for a signed Roster Artist.
 */
export function createAndReleaseRosterAlbumOrEp(
  state: GameState,
  artistId: string,
  input: {
    title: string;
    type: 'album' | 'ep';
    coverUrl?: string;
    includedSongIds: number[];
    autoGenerateRemainingTracks: boolean;
  }
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const packagingCost = input.type === 'album' ? 35000 : 18000;
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < packagingCost) {
    return {
      nextState: state,
      success: false,
      message: `Launching this ${input.type.toUpperCase()} requires $${packagingCost.toLocaleString()} in mastering & distribution budget.`,
    };
  }

  const cleanTitle = input.title.trim() || `${artist.stageName} Era`;
  const cover =
    input.coverUrl ||
    buildRosterReleaseCoverSvg(
      artist.stageName || artist.name,
      cleanTitle,
      input.type === 'album' ? 'Album' : 'EP'
    );

  const buffs = getRosterArtistStaffBuffs(state, artist);
  const minTracks = input.type === 'album' ? 8 : 4;

  let existingArtistSongs = [...(artist.songs || [])];
  const selectedSongs: Song[] = [];

  existingArtistSongs = existingArtistSongs.map((s) => {
    if (input.includedSongIds.includes(s.id)) {
      const releasedCopy: Song = {
        ...s,
        status: 'released',
        releaseDate: s.releaseDate || dateStr,
        cover: s.cover || cover,
      };
      selectedSongs.push(releasedCopy);
      return releasedCopy;
    }
    return s;
  });

  // Auto-generate b-side album tracks if needed to complete tracklist
  const neededExtra = input.autoGenerateRemainingTracks
    ? Math.max(0, minTracks - selectedSongs.length)
    : 0;

  const extraSongs: Song[] = [];
  for (let i = 0; i < neededExtra; i++) {
    const q = Math.max(
      60,
      Math.min(
        98,
        Math.round((artist.potential || 78) * 0.84 + buffs.studioQualityBonus + (Math.random() * 6 - 3))
      )
    );
    const trackStreams = Math.round(((artist.popularity || 38) * 950 + q * 290) * buffs.streamVelocityMult);
    const bSide: Song = {
      id: Date.now() + 500 + i + Math.floor(Math.random() * 10000),
      title: `${cleanTitle} (Track ${selectedSongs.length + i + 1})`,
      genre: artist.genre || 'Pop',
      subgenre: artist.genre || 'Pop',
      collabId: 'none',
      quality: q,
      status: 'released',
      releaseDate: dateStr,
      streams: trackStreams,
      dailyStreams: trackStreams,
      weeklyStreams: trackStreams * 7,
      pureSales: Math.round(trackStreams * 0.01),
      dailyPureSales: Math.round(trackStreams * 0.01),
      weeklyPureSales: Math.round(trackStreams * 0.05),
      cover,
      hasMV: false,
      mvAdsDays: 0,
      hasLyricVideo: false,
      hasVisualizer: false,
      views: 0,
      dailyViews: 0,
      weeklyViews: 0,
      radioPlays: 0,
      dailyRadioPlays: 0,
      weeklyRadioPlays: 0,
      momentum: 1.0,
      basePotential: artist.potential || 80,
    };
    extraSongs.push(bSide);
  }

  const projectTracklist = [...selectedSongs, ...extraSongs];
  if (projectTracklist.length === 0) {
    return {
      nextState: state,
      success: false,
      message: 'Select at least one song or enable auto-completing album tracks.',
    };
  }

  const avgQuality = Math.round(
    projectTracklist.reduce((acc, s) => acc + (s.quality || 75), 0) / projectTracklist.length
  );
  const debutProjectSales = Math.round(
    ((artist.popularity || 38) * 320 + avgQuality * 140) *
      (input.type === 'album' ? 1.45 : 1.0) *
      buffs.streamVelocityMult
  );
  const addedDailyStreams = projectTracklist.reduce(
    (acc, s) => acc + (s.dailyStreams || 5000),
    0
  );

  const newProject: Project = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    title: cleanTitle,
    type: input.type,
    status: 'released',
    releaseDate: dateStr,
    quality: avgQuality,
    songs: projectTracklist,
    pureSales: debutProjectSales,
    dailyPureSales: debutProjectSales,
    weeklyPureSales: debutProjectSales * 4,
    cover,
    momentum: 1.0,
    basePotential: artist.potential || 82,
  };

  const nextProjects = [newProject, ...(artist.projects || [])];
  const nextAllSongs = [...extraSongs, ...existingArtistSongs];

  const updatedArtist: ImprintSignedArtist = {
    ...artist,
    popularity: Math.min(100, Number(((artist.popularity || 38) + 3.2).toFixed(1))),
    hype: Math.min(100, Number(((artist.hype || 50) + 18).toFixed(1))),
    fans: (artist.fans || 50000) + Math.round(addedDailyStreams * 0.12 * buffs.fanGrowthMult),
    monthlyListeners: Math.max(
      artist.monthlyListeners || 0,
      Math.round((artist.dailyStreams + addedDailyStreams * 0.5) * 28)
    ),
    dailyStreams: Math.round((artist.dailyStreams || 0) + addedDailyStreams * 0.55),
    totalStreamsGenerated: (artist.totalStreamsGenerated || 0) + addedDailyStreams,
    albumsReleased: nextProjects.filter((p) => p.status === 'released').length,
    singlesReleased: nextAllSongs.filter((s) => s.status === 'released').length,
    latestReleaseTitle: `${artist.stageName} — ${cleanTitle} (${input.type.toUpperCase()})`,
    latestReleaseQuality: avgQuality,
    songs: nextAllSongs,
    projects: nextProjects,
  };

  const stmt: LabelAccountingStatementItem = {
    id: `stmt_roster_alb_${Date.now()}`,
    date: dateStr,
    title: `${labelState.imprint.imprintName} ${input.type.toUpperCase()} Release: ${artist.stageName} - "${cleanTitle}"`,
    detail: `${projectTracklist.length} Tracks • Quality ${avgQuality}/100 • ${debutProjectSales.toLocaleString()} first-day album units.`,
    amount: packagingCost,
    direction: 'debit',
    category: 'imprint',
  };

  const nextState: GameState = {
    ...state,
    money: currentMoney - packagingCost,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: labelState.imprint.signedRoster.map((a) =>
          a.id === artistId ? updatedArtist : a
        ),
        prestige: Math.min(100, labelState.imprint.prestige + 3),
      },
      statements: [stmt, ...labelState.statements].slice(0, 45),
    },
  };
  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: `Released ${input.type.toUpperCase()} "${cleanTitle}" by ${artist.stageName} (${projectTracklist.length} tracks • Quality ${avgQuality}/100)!`,
  };
}

/**
 * Produces and uploads an Official Music Video (MV), Lyric Video, or Visualizer
 * for a Roster Artist's song onto the Player's Official Record Label YouTube Channel.
 */
export function uploadRosterVisualToLabelYouTube(
  state: GameState,
  artistId: string,
  songId: number,
  visualType: 'mv' | 'lyric_video' | 'visualizer',
  customThumbnailUrl?: string
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const song = (artist.songs || []).find((s) => s.id === songId);
  if (!song || song.status !== 'released') {
    return {
      nextState: state,
      success: false,
      message: 'Select a released song from the roster artist to upload a video.',
    };
  }

  const cost =
    visualType === 'mv' ? 35000 : visualType === 'lyric_video' ? 8000 : 4000;
  const currentMoney = Math.round(Number(state.money) || 0);
  if (currentMoney < cost) {
    return {
      nextState: state,
      success: false,
      message: `Producing this visual requires $${cost.toLocaleString()}.`,
    };
  }

  const baseDailyViews = Math.round(
    ((artist.popularity || 35) * 1400 + (song.quality || 75) * 380) *
      (visualType === 'mv' ? 1.55 : visualType === 'lyric_video' ? 0.75 : 0.55)
  );
  const thumb =
    customThumbnailUrl ||
    song.cover ||
    buildRosterReleaseCoverSvg(artist.stageName || artist.name, song.title);

  const nextSongs = (artist.songs || []).map((s) => {
    if (s.id !== songId) return s;
    if (visualType === 'mv') {
      return {
        ...s,
        hasMV: true,
        mvThumbnail: thumb,
        views: (s.views || 0) + baseDailyViews,
        dailyViews: baseDailyViews,
        mvLikes: Math.round(baseDailyViews * 0.075),
        dailyStreams: Math.round((s.dailyStreams || 5000) * 1.22),
      };
    }
    if (visualType === 'lyric_video') {
      return {
        ...s,
        hasLyricVideo: true,
        lyricVideoReleaseDate: dateStr,
        lyricVideoThumbnail: thumb,
        lyricVideoViews: (s.lyricVideoViews || 0) + baseDailyViews,
        dailyLyricVideoViews: baseDailyViews,
        lyricVideoLikes: Math.round(baseDailyViews * 0.06),
        dailyStreams: Math.round((s.dailyStreams || 5000) * 1.1),
      };
    }
    return {
      ...s,
      hasVisualizer: true,
      visualizerReleaseDate: dateStr,
      visualizerThumbnail: thumb,
      visualizerViews: (s.visualizerViews || 0) + baseDailyViews,
      dailyVisualizerViews: baseDailyViews,
      visualizerLikes: Math.round(baseDailyViews * 0.055),
      dailyStreams: Math.round((s.dailyStreams || 5000) * 1.07),
    };
  });

  const updatedArtist: ImprintSignedArtist = {
    ...artist,
    hype: Math.min(100, Number(((artist.hype || 50) + (visualType === 'mv' ? 12 : 5)).toFixed(1))),
    fans: (artist.fans || 50000) + Math.round(baseDailyViews * 0.06),
    songs: nextSongs,
  };

  const nextRoster = labelState.imprint.signedRoster.map((a) =>
    a.id === artistId ? updatedArtist : a
  );

  const labelYt = getEnsuredLabelYouTubeChannel({
    ...state,
    recordLabelState: {
      ...labelState,
      imprint: { ...labelState.imprint, signedRoster: nextRoster },
    },
  });

  const formatLabel =
    visualType === 'mv'
      ? 'Official Music Video'
      : visualType === 'lyric_video'
      ? 'Official Lyric Video'
      : 'Official Visualizer';

  const nextState: GameState = {
    ...state,
    money: currentMoney - cost,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        signedRoster: nextRoster,
        youtubeChannel: {
          ...labelYt,
          subscribers: labelYt.subscribers + Math.round(baseDailyViews * 0.045),
          totalViews: labelYt.totalViews + baseDailyViews,
        },
      } as any,
    },
  };
  syncActiveRosterArtistsToSharedWorld(nextState);

  return {
    nextState,
    success: true,
    message: `Uploaded "${artist.stageName} - ${song.title} (${formatLabel})" to ${labelYt.channelName} on YouTube!`,
  };
}

/**
 * Publishes an official post from the Player's Record Label X (Twitter) Account (@LabelHandle).
 */
export function createOfficialLabelXPost(
  state: GameState,
  content: string,
  imageUrl?: string | null,
  attachedRosterArtistId?: string
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  if (!labelState.imprint.isFounded) {
    return {
      nextState: state,
      success: false,
      message: 'Incorporate your Record Label Imprint first to use the Official Label X Account.',
    };
  }

  const cleanText = content.trim();
  if (!cleanText) {
    return { nextState: state, success: false, message: 'Write a post message first.' };
  }

  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const labelX = getEnsuredLabelXAccount(state);

  const engagementBase = Math.max(250, Math.round(labelX.followers * 0.045));
  const likes = Math.round(engagementBase * (0.85 + Math.random() * 0.4));
  const reposts = Math.round(likes * 0.21);
  const replies = Math.round(likes * 0.075);
  const views = Math.round(likes * 14.5);

  const newPost: XPost = {
    id: `lbl_x_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    authorName: labelX.displayName,
    authorHandle: labelX.handle,
    authorAvatar:
      labelState.imprint.logoUrl ||
      labelX.avatarUrl ||
      buildRosterArtistAvatarSvg(labelX.displayName),
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    timeAgo: 'Just now',
    dateCreated: dateStr,
    content: cleanText,
    image: imageUrl || undefined,
    likes,
    reposts,
    replies,
    views,
    isPlayerPost: true,
  };

  // Boost tagged roster artist hype & streams if one is promoted
  let nextRoster = [...labelState.imprint.signedRoster];
  if (attachedRosterArtistId) {
    nextRoster = nextRoster.map((a) => {
      if (a.id !== attachedRosterArtistId) return a;
      return {
        ...a,
        hype: Math.min(100, Number(((a.hype || 45) + 4.5).toFixed(1))),
        fans: (a.fans || 50000) + Math.round(likes * 0.18),
        dailyStreams: Math.round((a.dailyStreams || 8000) * 1.06),
      };
    });
  }

  const updatedLabelX: LabelOfficialXAccount = {
    ...labelX,
    followers: labelX.followers + Math.round(likes * 0.08),
    posts: [newPost, ...(labelX.posts || [])].slice(0, 60),
  };

  return {
    nextState: {
      ...state,
      xPosts: [newPost, ...(state.xPosts || [])].slice(0, 120),
      recordLabelState: {
        ...labelState,
        imprint: {
          ...labelState.imprint,
          signedRoster: nextRoster,
          xAccount: updatedLabelX,
        } as any,
      },
    },
    success: true,
    message: `Posted from ${labelX.handle} (+${Math.round(likes * 0.08).toLocaleString()} new label followers)!`,
  };
}

/**
 * Updates the Official Record Label X Account profile details.
 */
export function updateOfficialLabelXProfile(
  state: GameState,
  updates: Partial<
    Pick<
      LabelOfficialXAccount,
      'name' | 'displayName' | 'handle' | 'bio' | 'avatarUrl' | 'bannerUrl'
    >
  >
): GameState {
  const labelState = getEnsuredRecordLabelState(state);
  const currentX = getEnsuredLabelXAccount(state);
  const cleanHandle = updates.handle
    ? updates.handle.startsWith('@')
      ? updates.handle
      : `@${updates.handle}`
    : currentX.handle;
  const resolvedName = updates.displayName || updates.name || currentX.displayName;

  const syncedLogo = updates.avatarUrl || labelState.imprint.logoUrl;
  const updatedX: LabelOfficialXAccount = {
    ...currentX,
    ...updates,
    avatarUrl: syncedLogo || currentX.avatarUrl,
    name: resolvedName,
    displayName: resolvedName,
    handle: cleanHandle,
  };

  return {
    ...state,
    recordLabelState: {
      ...labelState,
      imprint: {
        ...labelState.imprint,
        logoUrl: syncedLogo,
        xAccount: updatedX,
      } as any,
    },
  };
}

/**
 * Evaluates all released Singles & Albums of a Roster Artist for RIAA Certification eligibility.
 */
export function evaluateRosterArtistRiaaItems(
  rawArtist: ImprintSignedArtist,
  currentDateStr = '2026-01-01'
): {
  allItems: RiaaItemAuditEvaluation[];
  eligibleItems: RiaaItemAuditEvaluation[];
  certifiedItems: RiaaCertifiedRecord[];
  summary: {
    totalCertifiedUnits: number;
    diamondCount: number;
    multiPlatinumCount: number;
    platinumCount: number;
    goldCount: number;
    totalPlaques: number;
    legacyScore: number;
  };
  evaluations: RiaaItemAuditEvaluation[];
  eligibleCount: number;
  certifiedPlaques: RiaaCertifiedRecord[];
  totalCertifiedUnits: number;
} {
  const artist = ensureRosterArtistFullFields(rawArtist, currentDateStr);
  const existingPlaques = artist.riaaCertifications || [];
  const evaluations: RiaaItemAuditEvaluation[] = [];

  const buildItemEval = (params: {
    key: string;
    itemType: 'song' | 'project';
    itemId: number;
    title: string;
    releaseSubtype: string;
    cover: string;
    releaseDate: string;
    pureSalesUnits: number;
    streamingEquivalentUnits: number;
    totalRawStreamsAndViews: number;
    totalEligibleRiaaUnits: number;
  }): RiaaItemAuditEvaluation => {
    const currentCert = existingPlaques.find((c) => c.key === params.key) || null;
    const currentLevelIndex = currentCert?.highestCertifiedLevelIndex || 0;
    const currentCertifiedTier = currentCert
      ? RIAA_CERTIFICATION_TIERS.find((t) => t.id === currentCert.highestTierId) || null
      : null;

    let highestEligibleTier = null;
    for (const tier of RIAA_CERTIFICATION_TIERS) {
      if (params.totalEligibleRiaaUnits >= tier.unitsRequired) {
        highestEligibleTier = tier;
      }
    }

    const newlyUnclaimedTiers = RIAA_CERTIFICATION_TIERS.filter(
      (t) =>
        t.levelIndex > currentLevelIndex &&
        params.totalEligibleRiaaUnits >= t.unitsRequired
    );
    const isEligibleForNewAudit = newlyUnclaimedTiers.length > 0;
    const nextUpcomingTier =
      RIAA_CERTIFICATION_TIERS.find(
        (t) =>
          t.levelIndex >
          (highestEligibleTier ? highestEligibleTier.levelIndex : currentLevelIndex)
      ) || RIAA_CERTIFICATION_TIERS[RIAA_CERTIFICATION_TIERS.length - 1];

    const prevThreshold = highestEligibleTier ? highestEligibleTier.unitsRequired : 0;
    const span = Math.max(1, nextUpcomingTier.unitsRequired - prevThreshold);
    const progressToNextPercent = Math.min(
      100,
      Math.max(
        0,
        Math.round(((params.totalEligibleRiaaUnits - prevThreshold) / span) * 100)
      )
    );
    const unitsNeededForNext = Math.max(
      0,
      nextUpcomingTier.unitsRequired - params.totalEligibleRiaaUnits
    );
    const totalAuditCost = newlyUnclaimedTiers.reduce((sum, t) => sum + t.auditFee, 0);

    return {
      key: params.key,
      itemType: params.itemType,
      itemId: params.itemId,
      title: params.title,
      releaseSubtype: params.releaseSubtype,
      cover: params.cover,
      releaseDate: params.releaseDate,
      recordLabel: 'Official Imprint',
      pureSalesUnits: params.pureSalesUnits,
      streamingEquivalentUnits: params.streamingEquivalentUnits,
      trackEquivalentUnits: 0,
      totalRawStreamsAndViews: params.totalRawStreamsAndViews,
      totalEligibleRiaaUnits: params.totalEligibleRiaaUnits,
      currentCertifiedRecord: currentCert,
      currentCertifiedTier,
      highestEligibleTier,
      nextUpcomingTier,
      newlyUnclaimedTiers,
      isEligibleForNewAudit,
      progressToNextPercent,
      unitsNeededForNext,
      totalAuditCost,
      labelSubsidyAmount: 0,
      netArtistAuditFee: totalAuditCost || highestEligibleTier?.auditFee || 3500,
      totalPopReward: newlyUnclaimedTiers.reduce((s, t) => s + t.popBoost, 0),
      totalHypeReward: newlyUnclaimedTiers.reduce((s, t) => s + t.hypeBoost, 0),
      totalFanReward: newlyUnclaimedTiers.reduce((s, t) => s + t.fanBoost, 0),
      totalLegacyReward: newlyUnclaimedTiers.reduce((s, t) => s + t.legacyPoints, 0),
    };
  };

  // 1. Evaluate Released Singles
  for (const s of artist.songs || []) {
    if (s.status !== 'released') continue;
    const key = `roster_${artist.id}_song_${s.id}`;
    const pureSalesUnits = Math.max(0, Math.round(Number(s.pureSales) || 0));
    const audioStreams = Math.max(0, Math.round(Number(s.streams) || 0));
    const videoStreams = Math.max(
      0,
      Math.round((s.views || 0) + (s.lyricVideoViews || 0) + (s.visualizerViews || 0))
    );
    const totalRawStreamsAndViews = audioStreams + videoStreams;
    const streamingEquivalentUnits = Math.floor(totalRawStreamsAndViews / 150);
    const totalEligibleRiaaUnits = pureSalesUnits + streamingEquivalentUnits;

    evaluations.push(
      buildItemEval({
        key,
        itemType: 'song',
        itemId: s.id,
        title: s.title,
        releaseSubtype: 'Single',
        cover: s.cover || buildRosterReleaseCoverSvg(artist.name, s.title, 'Single'),
        releaseDate: s.releaseDate || artist.signedDate || currentDateStr,
        pureSalesUnits,
        streamingEquivalentUnits,
        totalRawStreamsAndViews,
        totalEligibleRiaaUnits,
      })
    );
  }

  // 2. Evaluate Released Albums / EPs
  for (const p of artist.projects || []) {
    if (p.status !== 'released') continue;
    const key = `roster_${artist.id}_project_${p.id}`;
    const pureSalesUnits = Math.max(0, Math.round(Number(p.pureSales) || 0));
    const totalRawStreamsAndViews = (p.songs || []).reduce(
      (acc, ts) => acc + (Number(ts.streams) || 0),
      0
    );
    const streamingEquivalentUnits = Math.floor(totalRawStreamsAndViews / 1500);
    const totalEligibleRiaaUnits = pureSalesUnits + streamingEquivalentUnits;

    evaluations.push(
      buildItemEval({
        key,
        itemType: 'project',
        itemId: p.id,
        title: p.title,
        releaseSubtype: p.type === 'ep' ? 'EP' : 'Album',
        cover: p.cover || buildRosterReleaseCoverSvg(artist.name, p.title, 'Album'),
        releaseDate: p.releaseDate || artist.signedDate || currentDateStr,
        pureSalesUnits,
        streamingEquivalentUnits,
        totalRawStreamsAndViews,
        totalEligibleRiaaUnits,
      })
    );
  }

  const eligibleItems = evaluations.filter((e) => e.isEligibleForNewAudit);
  let diamondCount = 0;
  let multiPlatinumCount = 0;
  let platinumCount = 0;
  let goldCount = 0;
  let totalCertifiedUnits = 0;

  for (const cert of existingPlaques) {
    totalCertifiedUnits += cert.certifiedUnitsAtAudit || 0;
    const tier = RIAA_CERTIFICATION_TIERS.find((t) => t.id === cert.highestTierId);
    if (!tier) continue;
    if (tier.diamondCount >= 1) diamondCount += tier.diamondCount;
    if (tier.platinumMultiplier >= 2) multiPlatinumCount += 1;
    else if (tier.platinumMultiplier >= 1) platinumCount += 1;
    else if (tier.metalClass === 'gold') goldCount += 1;
  }

  return {
    allItems: evaluations,
    eligibleItems,
    certifiedItems: existingPlaques,
    summary: {
      totalCertifiedUnits,
      diamondCount,
      multiPlatinumCount,
      platinumCount,
      goldCount,
      totalPlaques: existingPlaques.length,
      legacyScore: existingPlaques.length * 35,
    },
    evaluations,
    eligibleCount: eligibleItems.length,
    certifiedPlaques: existingPlaques,
    totalCertifiedUnits,
  };
}

/**
 * Certifies an eligible Single or Album for a Roster Artist and adds the Official RIAA Plaque to their collection.
 */
export function claimRosterArtistRiaaPlaque(
  state: GameState,
  artistId: string,
  itemKey: string,
  frameOrConfig:
    | RiaaFrameStyle
    | {
        frameStyle: RiaaFrameStyle;
        matboardStyle: RiaaMatboardStyle;
        discLayout: RiaaDiscLayout;
        recipientLine?: string;
        dedicationNote?: string;
      } = 'obsidian_gallery',
  matboardStyle: RiaaMatboardStyle = 'royal_obsidian',
  discLayout: RiaaDiscLayout = 'classic_crest',
  customDedication?: string
): { nextState: GameState; success: boolean; message: string } {
  const labelState = getEnsuredRecordLabelState(state);
  const dateStr = state.date ? String(state.date).split('T')[0] : '2026-01-01';
  const rawArtist = labelState.imprint.signedRoster.find((a) => a.id === artistId);
  if (!rawArtist) {
    return { nextState: state, success: false, message: 'Roster artist not found.' };
  }

  const evalData = evaluateRosterArtistRiaaItems(rawArtist, dateStr);
  const item = evalData.allItems.find((e) => e.key === itemKey);
  if (!item || !item.highestEligibleTier || !item.isEligibleForNewAudit) {
    return {
      nextState: state,
      success: false,
      message: 'This release is not yet eligible for a new RIAA certification tier.',
    };
  }

  const currentMoney = Math.round(Number(state.money) || 0);
  const fee = item.netArtistAuditFee || 3500;
  if (currentMoney < fee) {
    return {
      nextState: state,
      success: false,
      message: `RIAA audit requires $${fee.toLocaleString()}.`,
    };
  }

  const tier = item.highestEligibleTier;
  const serialNumber = `RIAA-${labelState.imprint.imprintName
    .slice(0, 3)
    .toUpperCase()}-${tier.shortBadge}-${Math.floor(10000 + Math.random() * 89999)}`;

  const isConfigObj = typeof frameOrConfig === 'object' && frameOrConfig !== null;
  const resolvedConfig = {
    frameStyle: isConfigObj ? frameOrConfig.frameStyle : (frameOrConfig as RiaaFrameStyle),
    matboardStyle: isConfigObj ? frameOrConfig.matboardStyle : matboardStyle,
    discLayout: isConfigObj ? frameOrConfig.discLayout : discLayout,
    recipientLine:
      (isConfigObj && frameOrConfig.recipientLine) ||
      `PRESENTED TO ${(rawArtist.stageName || rawArtist.name).toUpperCase()} & ${labelState.imprint.imprintName.toUpperCase()}`,
    dedicationNote:
      (isConfigObj && frameOrConfig.dedicationNote) ||
      customDedication ||
      `Presented to ${rawArtist.stageName || rawArtist.name} & ${labelState.imprint.imprintName} by the Recording Industry Association of America.`,
  };

  const newPlaque: RiaaCertifiedRecord = {
    key: item.key,
    itemType: item.itemType,
    itemId: item.itemId,
    title: item.title,
    releaseSubtype: item.releaseSubtype,
    cover: item.cover,
    highestCertifiedLevelIndex: tier.levelIndex,
    highestTierId: tier.id,
    highestTierLabel: tier.label,
    shortBadge: tier.shortBadge,
    metalClass: tier.metalClass,
    certifiedUnitsAtAudit: item.totalEligibleRiaaUnits,
    dateCertified: dateStr,
    serialNumber,
    recordLabel: labelState.imprint.imprintName,
    plaqueConfig: resolvedConfig,
    historyMilestones: [
      ...(item.currentCertifiedRecord?.historyMilestones || []),
      {
        tierId: tier.id,
        tierLabel: tier.label,
        certifiedDate: dateStr,
        unitsAtAudit: item.totalEligibleRiaaUnits,
      },
    ],
  };

  const artist = ensureRosterArtistFullFields(rawArtist, dateStr);
  const filteredPlaques = (artist.riaaCertifications || []).filter(
    (c) => c.key !== itemKey
  );
  const updatedArtist: ImprintSignedArtist = {
    ...artist,
    popularity: Math.min(100, Number(((artist.popularity || 40) + 1.5).toFixed(1))),
    hype: Math.min(100, Number(((artist.hype || 50) + 8).toFixed(1))),
    riaaCertifications: [newPlaque, ...filteredPlaques],
  };

  return {
    nextState: {
      ...state,
      money: currentMoney - fee,
      recordLabelState: {
        ...labelState,
        imprint: {
          ...labelState.imprint,
          signedRoster: labelState.imprint.signedRoster.map((a) =>
            a.id === artistId ? updatedArtist : a
          ),
          prestige: Math.min(100, labelState.imprint.prestige + 2),
        },
      },
    },
    success: true,
    message: `Official RIAA ${tier.label} Plaque awarded to ${artist.stageName} for "${item.title}"!`,
  };
}

/**
 * Generates Pitchfork & Metacritic critical reviews for a Roster Artist's released Singles and Albums/EPs.
 */
export function getRosterArtistCriticsReviews(
  arg1: GameState | ImprintSignedArtist,
  arg2?: ImprintSignedArtist | string
): {
  pitchforkReviews: PitchforkReviewItem[];
  metacriticEntries: MetacriticReleaseEntry[];
} {
  let rawArtist: ImprintSignedArtist;
  let imprintName = 'Official Imprint';

  if (arg2 && typeof arg2 === 'object' && 'id' in arg2) {
    rawArtist = arg2;
    const st = arg1 as GameState;
    imprintName =
      getEnsuredRecordLabelState(st).imprint.imprintName || 'Official Imprint';
  } else {
    rawArtist = arg1 as ImprintSignedArtist;
    if (typeof arg2 === 'string' && arg2.trim()) {
      imprintName = arg2;
    }
  }

  const artist = ensureRosterArtistFullFields(rawArtist, '2026-01-01');
  const stageName = artist.stageName || artist.name;
  const pitchforkReviews: PitchforkReviewItem[] = [];
  const metacriticEntries: MetacriticReleaseEntry[] = [];

  const allItems: Array<{
    id: number;
    title: string;
    type: 'single' | 'ep' | 'album';
    quality: number;
    releaseDate: string;
    cover: string;
    trackCount: number;
  }> = [
    ...(artist.projects || [])
      .filter((p) => p.status === 'released')
      .map((p) => ({
        id: p.id,
        title: p.title,
        type: (p.type === 'ep' ? 'ep' : 'album') as 'ep' | 'album',
        quality: p.quality || 76,
        releaseDate: p.releaseDate || artist.signedDate || '2026-01-01',
        cover: p.cover || buildRosterReleaseCoverSvg(stageName, p.title, 'Album'),
        trackCount: p.songs?.length || 8,
      })),
    ...(artist.songs || [])
      .filter((s) => s.status === 'released')
      .map((s) => ({
        id: s.id,
        title: s.title,
        type: 'single' as const,
        quality: s.quality || 74,
        releaseDate: s.releaseDate || artist.signedDate || '2026-01-01',
        cover: s.cover || buildRosterReleaseCoverSvg(stageName, s.title, 'Single'),
        trackCount: 1,
      })),
  ];

  for (const item of allItems) {
    const rawScore = Math.min(
      10.0,
      Math.max(4.8, Number(((item.quality / 10) * 0.96 + 0.3).toFixed(1)))
    );
    const isBnm = (item.type === 'album' || item.type === 'ep') && rawScore >= 8.3;
    const isBnt = item.type === 'single' && rawScore >= 8.3;

    const sw100 = Math.min(99, Math.max(50, Math.round(rawScore * 10 + 1)));
    const prod100 = Math.min(99, Math.max(52, Math.round(rawScore * 10 + 2)));
    const coh100 = Math.min(99, Math.max(50, Math.round(rawScore * 10)));
    const orig100 = Math.min(99, Math.max(48, Math.round(rawScore * 10 - 1)));

    const sharedAudit = {
      rawAvgTrackQuality: item.quality,
      studioMasteryBonus: 2.5,
      weakestTrackTitle: item.title,
      weakestTrackScore: rawScore,
      fillerTracksCount: 0,
      fillerPenaltyPoints: 0,
      sequencingPenaltyPoints: 0,
      criticPersonaDelta: 0.1,
      accoladeType: (isBnm ? 'BNM' : isBnt ? 'BNT' : 'NONE') as
        | 'BNM'
        | 'BNT'
        | 'SUNDAY'
        | 'NONE',
      accoladeQualified: isBnm || isBnt,
      pitchforkChecklist: [
        {
          label: 'Pitchfork Composite Score',
          passed: rawScore >= 8.3,
          currentValue: `${rawScore.toFixed(1)} / 10`,
          requiredValue: '≥ 8.3 / 10',
        },
        {
          label: 'Songwriting & Production Craft',
          passed: sw100 >= 80 && prod100 >= 80,
          currentValue: `SW ${sw100} · PROD ${prod100}`,
          requiredValue: 'Both ≥ 80 / 100',
        },
      ],
      mustPlayChecklist: [
        {
          label: 'Weighted Metascore Threshold',
          passed: Math.round(rawScore * 10) >= 81,
          currentValue: `${Math.round(rawScore * 10)} / 100`,
          requiredValue: '≥ 81 / 100',
        },
      ],
    };

    const pfItem: PitchforkReviewItem = {
      id: `pf_roster_${artist.id}_${item.type}_${item.id}`,
      releaseId: `${artist.id}_${item.id}`,
      title: item.title,
      artist: stageName,
      isPlayer: true,
      cover: item.cover,
      genre: artist.genre || 'Pop',
      releaseType: item.type,
      releaseDate: item.releaseDate,
      score: rawScore,
      isBestNewMusic: isBnm,
      isBestNewTrack: isBnt,
      isSundayReview: false,
      criticName: 'Jenn Pelly',
      criticRole: 'Senior Contributor',
      criticSpecialty: `${artist.genre || 'Pop'} & Vanguard A&R Criticism`,
      criticBiasNote: `Admires ${imprintName}'s cohesive production palette.`,
      labelName: imprintName,
      pullQuote: `Released via ${imprintName}, "${item.title}" proves ${stageName} is one of modern music's most magnetic voices.`,
      essayParagraphs: [
        `Backed by the executive vision of ${imprintName}, ${stageName} steps into the spotlight on "${item.title}" with unmistakable conviction and sonic craft.`,
        `Across the arrangement, the balance of razor-sharp hooks and atmospheric production highlights why ${stageName} continues to build a devoted global fanbase.`,
      ],
      subScores: {
        songwriting: sw100,
        production: prod100,
        cohesion: coh100,
        originality: orig100,
      },
      trackNotes: [
        {
          trackNumber: 1,
          title: item.title,
          trackScore: rawScore,
          isEssentialTrack: rawScore >= 8.2,
          commentary: `Anchor moment for ${stageName} on ${imprintName}.`,
        },
      ],
      scoringAudit: sharedAudit,
    };

    pitchforkReviews.push(pfItem);

    const metascore = Math.min(99, Math.max(52, Math.round(rawScore * 10)));
    const colorTier = metascore >= 61 ? 'green' : metascore >= 40 ? 'yellow' : 'red';
    const isMustPlay = metascore >= 81;
    const userScore = Number(Math.min(9.8, Math.max(6.0, rawScore + 0.2)).toFixed(1));
    const userCount = Math.max(45, Math.round((artist.fans || 50000) * 0.008));

    metacriticEntries.push({
      id: `mc_roster_${artist.id}_${item.type}_${item.id}`,
      releaseId: `${artist.id}_${item.id}`,
      title: item.title,
      artist: stageName,
      isPlayer: true,
      cover: item.cover,
      genre: artist.genre || 'Pop',
      releaseType: item.type,
      releaseDate: item.releaseDate,
      metascore,
      colorTier,
      isMustPlay,
      sentimentLabel:
        metascore >= 81
          ? 'Universal Acclaim'
          : metascore >= 61
          ? 'Generally Favorable Reviews'
          : 'Mixed or Average Reviews',
      criticBreakdown: {
        positive: metascore >= 61 ? 3 : 2,
        mixed: metascore >= 61 ? 0 : 1,
        negative: 0,
        total: 3,
      },
      userScore,
      userColorTier: 'green',
      userSentimentLabel: 'Generally Favorable Reviews',
      userRatingsCount: userCount,
      userBreakdown: {
        positive: Math.round(userCount * 0.85),
        mixed: Math.round(userCount * 0.12),
        negative: Math.max(0, userCount - Math.round(userCount * 0.97)),
        total: userCount,
      },
      reviewBombingStatus: 'none',
      pitchforkRef: pfItem,
      criticReviews: [
        {
          publicationId: 'pitchfork',
          publicationName: 'Pitchfork',
          weightMultiplier: 1.5,
          weightLabel: 'High Prestige (1.5x)',
          criticName: 'Jenn Pelly',
          score100: metascore,
          originalScoreDisplay: `${rawScore.toFixed(1)} / 10`,
          colorTier,
          quote: `A standout release on ${imprintName}'s roster.`,
          date: item.releaseDate,
        },
        {
          publicationId: 'rolling_stone',
          publicationName: 'Rolling Stone',
          weightMultiplier: 1.3,
          weightLabel: 'Major Outlet (1.3x)',
          criticName: 'Rob Sheffield',
          score100: Math.min(100, metascore + 2),
          originalScoreDisplay: '4 / 5 Stars',
          colorTier,
          quote: `${stageName} brings undeniable star power and replay value to "${item.title}".`,
          date: item.releaseDate,
        },
        {
          publicationId: 'nme',
          publicationName: 'NME',
          weightMultiplier: 1.0,
          weightLabel: 'Standard (1.0x)',
          criticName: 'Rhian Daly',
          score100: Math.max(60, metascore - 2),
          originalScoreDisplay: '4 / 5 Stars',
          colorTier,
          quote: `Another sharp chapter in ${imprintName}'s growing catalog.`,
          date: item.releaseDate,
        },
      ],
      userReviews: [
        {
          id: `usr_${artist.id}_${item.id}_1`,
          username: `${stageName.replace(/\s+/g, '')}Stan`,
          userTag: 'Core Fan',
          score10: 10,
          colorTier: 'green',
          comment: `Best signing on ${imprintName}! "${item.title}" is on repeat all day.`,
          date: item.releaseDate,
          helpfulYes: 42,
          helpfulTotal: 45,
        },
      ],
    });
  }

  return { pitchforkReviews, metacriticEntries };
}
