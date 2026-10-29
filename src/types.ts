import type { PlayerSkillState } from './data/skillSystemEngine';
import type { XPost, XProfile } from './data/xSocialEngine';

export interface Artist {
  name: string;
  image: string;
  country: string;
  tier: number;
  startYear: number;
  birthdate: string;
}

export interface Song {
  id: number;
  title: string;
  genre: string;
  subgenre: string;
  cover: string;
  status: 'writing' | 'written' | 'recording' | 'recorded' | 'packaged' | 'scheduled' | 'released';
  daysLeft?: number;
  releaseDate?: string;
  quality: number;
  collabId: string;
  basePotential: number;
  momentum: number;
  streams: number;
  views: number;
  pureSales: number;
  radioPlays: number;
  hasMV: boolean;
  mvAdsDays: number;
  mvDistributor?: 'indie' | 'vevo';
  mvThumbnail?: string;
  customVideoUrl?: string;
  hasVisualizer?: boolean;
  visualizerStyle?: string;
  visualizerThumbnail?: string;
  visualizerViews?: number;
  dailyVisualizerViews?: number;
  visualizerLikes?: number;
  visualizerReleaseDate?: string;
  hasLyricVideo?: boolean;
  lyricVideoStyle?: string;
  lyricVideoThumbnail?: string;
  lyricVideoViews?: number;
  dailyLyricVideoViews?: number;
  lyricVideoLikes?: number;
  lyricVideoReleaseDate?: string;
  playlistPlacements?: string[];
  dailyStreams?: number;
  dailyViews?: number;
  dailyPureSales?: number;
  dailyRadioPlays?: number;
  mvLikes?: number;
  weeklyStreams: number;
  weeklyViews: number;
  weeklyPureSales: number;
  weeklyRadioPlays: number;
  trackType?: 'lead_single' | 'pre_release_single' | 'single' | 'promotional_single' | 'b_side';
  daysSinceRelease?: number;
  prevDailyStreams?: number;
  dailyChange?: number;
  dailyChangePercent?: number;
  theme?: string;
  meaning?: string;
  writingFocus?: string;
  recordingStyle?: string;
  vocalFocus?: string;
  collabFeePaid?: number;
  collabRoyaltyPercent?: number;
  collabRoyaltyPaidToday?: number;
  collabRoyaltyPaidTotal?: number;
  isExplicit?: boolean;
}

export interface Project {
  id: number;
  title: string;
  type: 'single_pack' | 'ep' | 'album';
  cover: string;
  songs: Song[];
  status: 'created' | 'scheduled' | 'released';
  releaseDate?: string;
  quality: number;
  basePotential: number;
  momentum: number;
  pureSales: number;
  dailyPureSales?: number;
  weeklyPureSales: number;
  dailyStreams?: number;
  prevDailyStreams?: number;
  dailyChange?: number;
  dailyChangePercent?: number;
  totalStreams?: number;
  preSaves?: number;
  dailyPreSaves?: number;
  distributor?: string;
  marketingStrategy?: string;
  recordLabel?: string;
  focusTrackId?: number;
}

export interface ChartItem {
  id?: string | number;
  title: string;
  artist: string;
  points: number;
  score?: number;
  streams?: number;
  views?: number;
  sales?: number;
  radio?: number;
  isPlayer: boolean;
  cover: string | null;
  lastPosition: number | null;
  lastWeek?: number | null;
  peakPosition?: number;
  peak?: number;
  weeksOnChart?: number;
  weeks?: number;
  isReEntry?: boolean;
  isNew?: boolean;
  movementStatus?: 'up' | 'down' | 'equal' | 're-entry' | 'new';
  daysSinceRelease?: number;
  hasMV?: boolean;
  isExplicit?: boolean;
  collabId?: string;
  featuredArtist?: string;
  featuredArtists?: string[];
  stats?: {
    streams: number;
    sales: number;
    radio: number;
  };
}

export interface WeeklyChartSnapshot {
  date: string;
  formattedDate: string;
  weekNumber: number;
  label: string;
  hot100: ChartItem[];
  global200?: ChartItem[];
  albums200: ChartItem[];
  regionalSingles?: Record<string, ChartItem[]>;
}

export interface PlayerBillboardHistoryItem {
  title: string;
  artist: string;
  chartType: 'hot100' | 'global200' | 'albums200';
  debutDate: string;
  peakPosition: number;
  peakDate: string;
  weeksOnChart: number;
  weeksAtPeak?: number;
  lastPosition?: number | null;
  cover?: string | null;
  isPlayer: boolean;
  points: number;
  stats?: {
    streams: number;
    sales: number;
    radio: number;
  };
}

export interface GameState {
  isStarted: boolean;
  artist: Artist | null;
  date: string;
  money: number;
  popularity: number;
  hype: number;
  fans?: number;
  popDelta?: number;
  hypeDelta?: number;
  fansDelta?: number;
  dailyIncome: number;
  dailyExpense: number;
  dailyStreamsTotal: number;
  songsIdCounter: number;
  projectIdCounter: number;
  songs: Song[];
  projects: Project[];
  npcs?: NPC[];
  spotify: { 
    listeners: number; 
    followers: number; 
    listenerDelta?: number;
    peakListeners?: number;
    charts?: Record<string, ChartItem[]>;
    playlists?: Record<string, ChartItem[]>;
  };
  youtube: { 
    subs: number;
    charts?: Record<string, ChartItem[]>;
  };
  billboard: { 
    hot100: ChartItem[]; 
    albums200: ChartItem[];
    global200?: ChartItem[];
    regionalSingles?: Record<string, ChartItem[]>;
    history?: WeeklyChartSnapshot[];
    playerHistory?: Record<string, PlayerBillboardHistoryItem[]>;
  };
  itunes: {
    charts?: Record<string, ChartItem[]>;
  };
  skills?: PlayerSkillState;
  xPosts?: XPost[];
  xProfile?: XProfile;
  activeTab: 'dashboard' | 'studio' | 'apps' | 'settings';
  activeApp: 'none' | 'spotify' | 'youtube' | 'billboard' | 'radio' | 'itunes' | 'statistic' | 'skills' | 'x' | 'jobs' | 'grammys' | 'vmas' | 'vanguard' | 'pitchfork' | 'metacritic' | 'merch' | 'riaa' | 'tour';
  gameMode?: 'normal' | 'realtime';
  lastRealTimeUpdate?: number;
  currentStreamRate?: number;
  isHiatus?: boolean;
  hiatusDays?: number;
  cheatUnlocked?: boolean;
  theme?: 'light' | 'dark';
  rivalState?: any;
  jobsState?: any;
  awardsState?: any;
  vanguardState?: any;
  merchStore?: any;
  riaaState?: any;
  tourState?: any;
  radioEcosystemState?: any;
}

export interface NPC {
  id: string;
  name: string;
  pop: number;
  hype: number;
  tier: number;
  country?: string;
  image?: string;
  avatar?: string;
  genre?: string;
  bio?: string;
  songs?: {
    title: string;
    streams: number;
    dailyStreams?: number;
    weeklyStreams?: number;
    radio: number;
    sales: number;
    dailySales?: number;
    weeklySales?: number;
    daysSinceRelease?: number;
    cover?: string;
  }[];
  albums?: {
    title: string;
    cover?: string;
    sales?: number;
    dailySales?: number;
    weeklySales?: number;
    streams?: number;
    dailyStreams?: number;
    weeklyStreams?: number;
    daysSinceRelease?: number;
    year?: number;
    tracks?: Array<{
      title: string;
      streams: number;
      dailyStreams?: number;
      weeklyStreams?: number;
      sales?: number;
      dailySales?: number;
      radio?: number;
      daysSinceRelease?: number;
      cover?: string;
      trackType: 'lead_single' | 'single' | 'b_side';
    }>;
  }[];
}
