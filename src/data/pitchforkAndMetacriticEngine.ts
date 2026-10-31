// Pitchfork & Metacritic Critical Review & Aggregator Simulation Engine
// Evaluates Player and NPC albums, EPs, and singles using multi-factor studio mastery,
// tracklist cohesion, critic persona bias, 12 weighted publications, and User Score review-bombing dynamics.

import { GameState, Song, Project } from '../types';
import { getEnsuredSkillState, calculateMasteryRank } from './skillSystemEngine';
import { getEnsuredRivalState } from './rivalBeefSystemEngine';
import { resolveAuthenticCover } from './musicCatalog';
import { XPost, getEnsuredXProfile } from './xSocialEngine';

export type MetacriticColorTier = 'green' | 'yellow' | 'red';

export type MetacriticSentimentLabel =
  | 'Universal Acclaim'
  | 'Generally Favorable Reviews'
  | 'Mixed or Average Reviews'
  | 'Generally Unfavorable Reviews'
  | 'Overwhelming Dislike';

export interface PitchforkTrackNote {
  trackNumber: number;
  title: string;
  trackScore: number; // 0.0 - 10.0
  isEssentialTrack: boolean;
  commentary: string;
}

export interface AccoladeCriterionItem {
  label: string;
  passed: boolean;
  currentValue: string;
  requiredValue: string;
}

export interface EditorialScoringAudit {
  rawAvgTrackQuality: number; // 0 - 100
  studioMasteryBonus: number; // +0.0 to +11.0
  weakestTrackTitle: string;
  weakestTrackScore: number; // 0.0 - 10.0
  fillerTracksCount: number;
  fillerPenaltyPoints: number; // 0.0 to -0.9 on P4K scale
  sequencingPenaltyPoints: number; // 0.0 to -0.7 on P4K scale
  criticPersonaDelta: number; // -0.35 to +0.20
  accoladeType: 'BNM' | 'BNT' | 'SUNDAY' | 'NONE';
  accoladeQualified: boolean;
  accoladeDisqualificationReason?: string;
  pitchforkChecklist: AccoladeCriterionItem[];
  mustPlayChecklist: AccoladeCriterionItem[];
}

export interface PitchforkReviewItem {
  id: string;
  releaseId: string;
  title: string;
  artist: string;
  cover: string;
  releaseType: 'album' | 'ep' | 'single' | 'sunday_review';
  isPlayer: boolean;
  genre: string;
  labelName: string;
  releaseDate: string;
  score: number; // 0.0 - 10.0
  isBestNewMusic: boolean;
  isBestNewTrack: boolean;
  isSundayReview: boolean;
  sundayReviewOriginalYear?: number;
  criticName: string;
  criticRole: string;
  criticSpecialty: string;
  criticBiasNote: string;
  pullQuote: string;
  essayParagraphs: string[];
  subScores: {
    songwriting: number;
    production: number;
    cohesion: number;
    originality: number;
  };
  trackNotes: PitchforkTrackNote[];
  scoringAudit: EditorialScoringAudit;
}

export interface MetacriticPublicationReview {
  publicationId: string;
  publicationName: string;
  weightMultiplier: number;
  weightLabel: 'High Prestige (1.5x)' | 'Major Outlet (1.3x)' | 'Core Press (1.15x)' | 'Standard (1.0x)';
  score100: number; // 0 - 100
  originalScoreDisplay: string;
  colorTier: MetacriticColorTier;
  criticName: string;
  quote: string;
  date: string;
}

export interface MetacriticUserReviewItem {
  id: string;
  username: string;
  userTag: 'Core Fan' | 'Music Buff' | 'Rival Stan' | 'Casual Listener' | 'Vinyl Collector';
  score10: number; // 0 - 10
  colorTier: MetacriticColorTier;
  comment: string;
  date: string;
  helpfulYes: number;
  helpfulTotal: number;
}

export interface MetacriticReleaseEntry {
  id: string;
  releaseId: string;
  title: string;
  artist: string;
  cover: string;
  releaseType: 'album' | 'ep' | 'single';
  isPlayer: boolean;
  genre: string;
  releaseDate: string;
  metascore: number; // 0 - 100
  sentimentLabel: MetacriticSentimentLabel;
  colorTier: MetacriticColorTier;
  isMustPlay: boolean;
  criticBreakdown: {
    positive: number;
    mixed: number;
    negative: number;
    total: number;
  };
  criticReviews: MetacriticPublicationReview[];
  userScore: number; // 0.0 - 10.0
  userSentimentLabel: MetacriticSentimentLabel;
  userColorTier: MetacriticColorTier;
  userRatingsCount: number;
  userBreakdown: {
    positive: number;
    mixed: number;
    negative: number;
    total: number;
  };
  reviewBombingStatus: 'none' | 'mild_debate' | 'rival_review_bombing' | 'stan_counter_rally';
  reviewBombingNotice?: string;
  userReviews: MetacriticUserReviewItem[];
  pitchforkRef: PitchforkReviewItem;
}

export interface CriticsHubSummary {
  allPitchforkReviews: PitchforkReviewItem[];
  allMetacriticEntries: MetacriticReleaseEntry[];
  playerPitchforkReviews: PitchforkReviewItem[];
  playerMetacriticEntries: MetacriticReleaseEntry[];
  playerStats: {
    reviewedReleasesCount: number;
    avgPitchforkScore: number;
    bestNewMusicCount: number;
    bestNewTrackCount: number;
    highestPitchforkScore: number;
    avgMetascore: number;
    avgUserScore: number;
    mustPlayCount: number;
    universalAcclaimCount: number;
  };
}

interface CriticPersona {
  name: string;
  role: string;
  specialty: string;
  biasDescription: string;
  strictnessOffset: number; // -0.4 to +0.3
  prefersCohesion: boolean;
  prefersExperimental: boolean;
}

const PITCHFORK_CRITICS: CriticPersona[] = [
  {
    name: 'Cat Zhang',
    role: 'Senior Editor',
    specialty: 'Pop, Avant-Pop & Internet Culture',
    biasDescription: 'Rewards sharp self-awareness and hook craftsmanship; skeptical of generic trend-chasing.',
    strictnessOffset: -0.15,
    prefersCohesion: true,
    prefersExperimental: false
  },
  {
    name: 'Alphonse Pierre',
    role: 'Staff Writer',
    specialty: 'Hip-Hop & Regional Rap',
    biasDescription: 'Values raw vocal charisma and idiosyncratic beats over polished radio sheen.',
    strictnessOffset: -0.35,
    prefersCohesion: false,
    prefersExperimental: true
  },
  {
    name: 'Craig Jenkins',
    role: 'Contributing Critic',
    specialty: 'R&B, Soul, Hip-Hop & Major Pop',
    biasDescription: 'Appreciates grand thematic ambition, lush arrangements, and emotional resonance.',
    strictnessOffset: 0.05,
    prefersCohesion: true,
    prefersExperimental: true
  },
  {
    name: 'Jenn Pelly',
    role: 'Contributing Editor',
    specialty: 'Indie Rock, Folk & Experimental',
    biasDescription: 'Prioritizes lyrical vulnerability, poetic depth, and uncompromising artistic vision.',
    strictnessOffset: -0.15,
    prefersCohesion: true,
    prefersExperimental: true
  },
  {
    name: 'Ian Cohen',
    role: 'Senior Contributor',
    specialty: 'Alternative, Indie & Post-Punk',
    biasDescription: 'Tough on bloated tracklists; rewards dynamic sequencing and memorable choruses.',
    strictnessOffset: -0.3,
    prefersCohesion: true,
    prefersExperimental: false
  },
  {
    name: 'Sheldon Pearce',
    role: 'Associate Reviews Editor',
    specialty: 'Rap, Electronic & Crossover',
    biasDescription: 'Analyzes cadence, technical delivery, and sonic architecture with clinical precision.',
    strictnessOffset: -0.1,
    prefersCohesion: true,
    prefersExperimental: true
  },
  {
    name: 'Laura Snapes',
    role: 'Contributing Critic',
    specialty: 'Global Pop & Singer-Songwriter',
    biasDescription: 'Focuses on vocal nuance, narrative arc, and how a record sits in contemporary culture.',
    strictnessOffset: -0.05,
    prefersCohesion: true,
    prefersExperimental: false
  },
  {
    name: 'Peyton Thomas',
    role: 'Contributing Writer',
    specialty: 'Dance-Pop, Synth & Club Music',
    biasDescription: 'Celebrates kinetic production, euphoric melodies, and fearless sonic maximalism.',
    strictnessOffset: 0.1,
    prefersCohesion: false,
    prefersExperimental: false
  }
];

interface PublicationSpec {
  id: string;
  name: string;
  weight: number;
  weightLabel: MetacriticPublicationReview['weightLabel'];
  scaleType: 'decimal10' | 'stars5' | 'letter' | 'percent100';
  biasOffset: number; // -8 to +7 on 100 scale
  criticPool: string[];
}

const METACRITIC_PUBLICATIONS: PublicationSpec[] = [
  {
    id: 'pitchfork',
    name: 'Pitchfork',
    weight: 1.5,
    weightLabel: 'High Prestige (1.5x)',
    scaleType: 'decimal10',
    biasOffset: -3,
    criticPool: ['Cat Zhang', 'Craig Jenkins', 'Jenn Pelly', 'Sheldon Pearce']
  },
  {
    id: 'rolling_stone',
    name: 'Rolling Stone',
    weight: 1.35,
    weightLabel: 'Major Outlet (1.3x)',
    scaleType: 'stars5',
    biasOffset: 4,
    criticPool: ['Rob Sheffield', 'Brittany Spanos', 'Jon Dolan', 'Maura Johnston']
  },
  {
    id: 'the_guardian',
    name: 'The Guardian',
    weight: 1.35,
    weightLabel: 'Major Outlet (1.3x)',
    scaleType: 'stars5',
    biasOffset: -1,
    criticPool: ['Alexis Petridis', 'Laura Snapes', 'Kitty Empire', 'Ben Beaumont-Thomas']
  },
  {
    id: 'nme',
    name: 'NME',
    weight: 1.2,
    weightLabel: 'Core Press (1.15x)',
    scaleType: 'stars5',
    biasOffset: 5,
    criticPool: ['Rhian Daly', 'Hannah Mylrea', 'Thomas Smith', 'Kyann-Sian Williams']
  },
  {
    id: 'allmusic',
    name: 'AllMusic',
    weight: 1.25,
    weightLabel: 'Major Outlet (1.3x)',
    scaleType: 'stars5',
    biasOffset: 3,
    criticPool: ['Heather Phares', 'Andy Kellman', 'Stephen Thomas Erlewine', 'Neil Z. Yeung']
  },
  {
    id: 'stereogum',
    name: 'Stereogum',
    weight: 1.3,
    weightLabel: 'Major Outlet (1.3x)',
    scaleType: 'decimal10',
    biasOffset: 1,
    criticPool: ['Tom Breihan', 'Chris DeVille', 'Danielle Chelosky', 'James Rettig']
  },
  {
    id: 'slant',
    name: 'Slant Magazine',
    weight: 1.25,
    weightLabel: 'Core Press (1.15x)',
    scaleType: 'stars5',
    biasOffset: -6,
    criticPool: ['Sal Cinquemani', 'Charles Lyons-Burt', 'Paul Attard', 'Nick Seip']
  },
  {
    id: 'variety',
    name: 'Variety',
    weight: 1.15,
    weightLabel: 'Core Press (1.15x)',
    scaleType: 'percent100',
    biasOffset: 4,
    criticPool: ['Chris Willman', 'Jem Aswad', 'Steven J. Horowitz', 'Thania Garcia']
  },
  {
    id: 'consequence',
    name: 'Consequence',
    weight: 1.1,
    weightLabel: 'Core Press (1.15x)',
    scaleType: 'letter',
    biasOffset: 2,
    criticPool: ['Wren Graves', 'Mary Siroky', 'Paolo Ragusa', 'Eddie Fu']
  },
  {
    id: 'paste',
    name: 'Paste Magazine',
    weight: 1.1,
    weightLabel: 'Core Press (1.15x)',
    scaleType: 'decimal10',
    biasOffset: -2,
    criticPool: ['Matt Mitchell', 'Clare Martin', 'Devon Chodzin', 'grace Robins-Somerville']
  },
  {
    id: 'clash',
    name: 'Clash Music',
    weight: 1.0,
    weightLabel: 'Standard (1.0x)',
    scaleType: 'decimal10',
    biasOffset: 2,
    criticPool: ['Robin Murray', 'Shahzaib Hussain', 'Lauren Hague']
  },
  {
    id: 'diy',
    name: 'DIY Magazine',
    weight: 1.0,
    weightLabel: 'Standard (1.0x)',
    scaleType: 'stars5',
    biasOffset: 3,
    criticPool: ['Lisa Wright', 'Sarah Jamieson', 'Elly Watson']
  }
];

interface NpcBenchmarkRelease {
  id: string;
  title: string;
  artist: string;
  releaseType: 'album' | 'ep' | 'single' | 'sunday_review';
  genre: string;
  labelName: string;
  releaseDate: string;
  baseQuality: number; // 0-100
  cohesionScore: number; // 0-100
  isSundayReview?: boolean;
  sundayYear?: number;
  tracks: { title: string; quality: number }[];
}

const NPC_BENCHMARK_RELEASES: NpcBenchmarkRelease[] = [
  {
    id: 'npc-crit-1',
    title: 'SOS',
    artist: 'SZA',
    releaseType: 'album',
    genre: 'R&B / Alternative Pop',
    labelName: 'Top Dawg / RCA',
    releaseDate: '2025-12-09',
    baseQuality: 91,
    cohesionScore: 88,
    tracks: [
      { title: 'SOS', quality: 89 },
      { title: 'Kill Bill', quality: 95 },
      { title: 'Seek & Destroy', quality: 86 },
      { title: 'Low', quality: 88 },
      { title: 'Snooze', quality: 96 },
      { title: 'Ghost in the Machine', quality: 92 },
      { title: 'Nobody Gets Me', quality: 90 },
      { title: 'Good Days', quality: 97 }
    ]
  },
  {
    id: 'npc-crit-2',
    title: 'GNX',
    artist: 'Kendrick Lamar',
    releaseType: 'album',
    genre: 'West Coast Hip-Hop',
    labelName: 'pgLang / Interscope',
    releaseDate: '2025-11-22',
    baseQuality: 92,
    cohesionScore: 93,
    tracks: [
      { title: 'wacced out murals', quality: 91 },
      { title: 'squabble up', quality: 93 },
      { title: 'luther', quality: 96 },
      { title: 'tv off', quality: 95 },
      { title: 'heart pt. 6', quality: 94 },
      { title: 'reincarnated', quality: 92 }
    ]
  },
  {
    id: 'npc-crit-3',
    title: 'HIT ME HARD AND SOFT',
    artist: 'Billie Eilish',
    releaseType: 'album',
    genre: 'Alt-Pop / Chamber Pop',
    labelName: 'Darkroom / Interscope',
    releaseDate: '2025-05-17',
    baseQuality: 86,
    cohesionScore: 94,
    tracks: [
      { title: 'SKINNY', quality: 85 },
      { title: 'LUNCH', quality: 91 },
      { title: 'CHIHIRO', quality: 95 },
      { title: 'BIRDS OF A FEATHER', quality: 97 },
      { title: 'WILDFLOWER', quality: 92 },
      { title: 'L’AMOUR DE MA VIE', quality: 89 }
    ]
  },
  {
    id: 'npc-crit-4',
    title: 'Short n’ Sweet',
    artist: 'Sabrina Carpenter',
    releaseType: 'album',
    genre: 'Pop / Country-Pop',
    labelName: 'Island Records',
    releaseDate: '2025-08-23',
    baseQuality: 83,
    cohesionScore: 86,
    tracks: [
      { title: 'Taste', quality: 89 },
      { title: 'Please Please Please', quality: 93 },
      { title: 'Good Graces', quality: 82 },
      { title: 'Espresso', quality: 95 },
      { title: 'Bed Chem', quality: 88 },
      { title: 'Juno', quality: 87 }
    ]
  },
  {
    id: 'npc-crit-5',
    title: 'Eternal Sunshine',
    artist: 'Ariana Grande',
    releaseType: 'album',
    genre: 'Pop / R&B',
    labelName: 'Republic Records',
    releaseDate: '2025-03-08',
    baseQuality: 82,
    cohesionScore: 87,
    tracks: [
      { title: 'bye', quality: 84 },
      { title: 'eternal sunshine', quality: 86 },
      { title: 'supernatural', quality: 88 },
      { title: 'we can’t be friends (wait for your love)', quality: 94 },
      { title: 'the boy is mine', quality: 87 },
      { title: 'imperfect for you', quality: 85 }
    ]
  },
  {
    id: 'npc-crit-6',
    title: 'Midnights',
    artist: 'Taylor Swift',
    releaseType: 'sunday_review',
    genre: 'Synth-Pop / Dream Pop',
    labelName: 'Republic Records',
    releaseDate: '2025-10-21',
    baseQuality: 85,
    cohesionScore: 88,
    isSundayReview: true,
    sundayYear: 2022,
    tracks: [
      { title: 'Lavender Haze', quality: 88 },
      { title: 'Maroon', quality: 89 },
      { title: 'Anti-Hero', quality: 95 },
      { title: 'You’re On Your Own, Kid', quality: 94 },
      { title: 'Midnight Rain', quality: 90 },
      { title: 'Karma', quality: 89 }
    ]
  },
  {
    id: 'npc-crit-7',
    title: 'After Hours',
    artist: 'The Weeknd',
    releaseType: 'sunday_review',
    genre: 'Synthwave / Dark R&B',
    labelName: 'XO / Republic',
    releaseDate: '2025-03-20',
    baseQuality: 90,
    cohesionScore: 95,
    isSundayReview: true,
    sundayYear: 2020,
    tracks: [
      { title: 'Alone Again', quality: 90 },
      { title: 'Hardest To Love', quality: 88 },
      { title: 'Save Your Tears', quality: 95 },
      { title: 'Blinding Lights', quality: 98 },
      { title: 'In Your Eyes', quality: 93 },
      { title: 'After Hours', quality: 96 }
    ]
  },
  {
    id: 'npc-crit-8',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    releaseType: 'single',
    genre: 'Pop-Punk / Indie Pop',
    labelName: 'THEBLACKLABEL / Atlantic',
    releaseDate: '2025-10-18',
    baseQuality: 87,
    cohesionScore: 90,
    tracks: [{ title: 'APT.', quality: 88 }]
  }
];

function deterministicHash(seedStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function getMetacriticColorTier(score100: number): MetacriticColorTier {
  if (score100 >= 61) return 'green';
  if (score100 >= 40) return 'yellow';
  return 'red';
}

function getUserScoreColorTier(score10: number): MetacriticColorTier {
  if (score10 >= 6.1) return 'green';
  if (score10 >= 4.0) return 'yellow';
  return 'red';
}

function getMetacriticSentimentLabel(score100: number): MetacriticSentimentLabel {
  if (score100 >= 81) return 'Universal Acclaim';
  if (score100 >= 61) return 'Generally Favorable Reviews';
  if (score100 >= 40) return 'Mixed or Average Reviews';
  if (score100 >= 20) return 'Generally Unfavorable Reviews';
  return 'Overwhelming Dislike';
}

function formatOriginalScaleScore(
  score100: number,
  scaleType: PublicationSpec['scaleType']
): string {
  if (scaleType === 'decimal10') {
    return `${(score100 / 10).toFixed(1)} / 10`;
  }
  if (scaleType === 'stars5') {
    const stars = Math.max(1, Math.min(5, Math.round((score100 / 20) * 2) / 2));
    return `${stars.toFixed(1).replace('.0', '')} / 5 ★`;
  }
  if (scaleType === 'letter') {
    if (score100 >= 93) return 'A+';
    if (score100 >= 88) return 'A';
    if (score100 >= 83) return 'A-';
    if (score100 >= 78) return 'B+';
    if (score100 >= 72) return 'B';
    if (score100 >= 66) return 'B-';
    if (score100 >= 60) return 'C+';
    if (score100 >= 52) return 'C';
    if (score100 >= 44) return 'C-';
    return 'D';
  }
  return `${score100} / 100`;
}

function buildEditorialEssayAndQuote(params: {
  title: string;
  artist: string;
  releaseType: 'album' | 'ep' | 'single' | 'sunday_review';
  score: number;
  isBNM: boolean;
  isBNT: boolean;
  cohesion: number;
  songwriting: number;
  production: number;
  standoutTrack: string;
  weakestTrack: string;
  trackCount: number;
  criticName: string;
}): { pullQuote: string; paragraphs: string[] } {
  const {
    title,
    artist,
    releaseType,
    score,
    isBNM,
    isBNT,
    cohesion,
    songwriting,
    production,
    standoutTrack,
    weakestTrack,
    trackCount
  } = params;

  const isSingle = releaseType === 'single';
  const typeWord =
    releaseType === 'sunday_review'
      ? 'landmark record'
      : releaseType === 'album'
      ? 'LP'
      : releaseType === 'ep'
      ? 'EP'
      : 'single';

  let pullQuote = '';
  if (score >= 8.8) {
    pullQuote = `On "${title}", ${artist} achieves a rare convergence of architectural precision and raw emotional candor—a career-defining statement that bends contemporary music toward its own gravity.`;
  } else if (score >= 8.2 || isBNM || isBNT) {
    pullQuote = `Focused, restless, and luminously produced, "${title}" captures ${artist} operating at peak creative conviction, turning bold studio instincts into something immediate and unforgettable.`;
  } else if (score >= 7.2) {
    pullQuote = `"${title}" is a confident, richly textured ${typeWord} that showcases ${artist}’s sharpening craft, even when a few safe detours keep it just shy of transcendence.`;
  } else if (score >= 6.0) {
    pullQuote = `There are flashes of undeniable magnetism across "${title}", though ${artist} occasionally struggles to reconcile sleek commercial instincts with a cohesive artistic identity.`;
  } else {
    pullQuote = `Despite moments of competent studio polish, "${title}" feels weighed down by uninspired formulas and a hesitant creative direction that rarely sparks to life.`;
  }

  const p1 = isSingle
    ? `From its opening bars, "${title}" announces itself as a deliberate test of ${artist}’s evolving sonic palette. With a production grade of ${production}/100 and songwriting sharpness rated at ${songwriting}/100, the track balances tactile low-end weight against vocal phrasing that refuses to settle into predictable patterns. Rather than relying on empty maximalism, the arrangement leaves just enough negative space for every melodic hook to land with urgency.`
    : `Across ${trackCount} tracks, "${title}" frames ${artist} at a pivotal creative crossroads. Opening with unmistakable intent, the ${typeWord} pairs detailed sonic architecture (${production}/100 production fidelity) with songwriting (${songwriting}/100) that probes beneath surface-level tropes. Whether constructing intimate nocturnal confessionals or widescreen anthems, ${artist} treats the recording studio not merely as a backdrop, but as an expressive instrument in its own right.`;

  const p2 = isSingle
    ? `What elevates "${title}"—or occasionally holds it in tension—is the interplay between technical control and spontaneity. In its strongest passages, ${artist} commands the microphone with effortless authority, turning a tight three-minute structure into an immersive miniature world.`
    : cohesion >= 82
    ? `What distinguishes "${title}" most sharply is its sequencing and internal cohesion (${cohesion}/100). Rather than reading like a playlist of disconnected singles, the tracklist flows with cinematic momentum. "${standoutTrack}" serves as the record’s undeniable centerpiece—a moment where lyrical vulnerability and muscular arrangement lock into total harmony.`
    : `Where "${title}" encounters turbulence is in its pacing and structural cohesion (${cohesion}/100). While highs like "${standoutTrack}" prove just how electrifying ${artist} can be when firing on all cylinders, stretches around "${weakestTrack}" dilute the record’s momentum, suggesting a stronger editorial scalpel in the mixing room could have elevated the whole project.`;

  const p3 =
    score >= 8.2
      ? `Ultimately, "${title}" earns its ${score.toFixed(1)} verdict by refusing to play defense. It is the rare release that rewards both immediate headphone replay and close critical dissection, cementing ${artist} as a vital voice shaping the current musical landscape.`
      : score >= 6.8
      ? `Even with its minor growing pains, "${title}" remains a rewarding listen that leaves ${artist} on firmer artistic ground than before. When the hooks and atmosphere align, it hints at an even bolder masterpiece waiting around the corner.`
      : `In the end, "${title}" reads more like a transitional sketch than a finished thesis. ${artist} clearly possesses the vocal and technical tools to command attention, but the next chapter will require bolder risks and tighter curation.`;

  return {
    pullQuote,
    paragraphs: [p1, p2, p3]
  };
}

function evaluateReleaseEntry(params: {
  id: string;
  title: string;
  artist: string;
  cover: string;
  releaseType: 'album' | 'ep' | 'single' | 'sunday_review';
  isPlayer: boolean;
  genre: string;
  labelName: string;
  releaseDate: string;
  tracks: { title: string; quality: number }[];
  studioSkillBonus: number; // 0 - 15
  hasActiveRivalBeef: boolean;
  rivalName: string;
  beefHeat: number;
  playerPopularity: number;
  playerFans: number;
  sundayYear?: number;
}): MetacriticReleaseEntry {
  const {
    id,
    title,
    artist,
    cover,
    releaseType,
    isPlayer,
    genre,
    labelName,
    releaseDate,
    tracks,
    studioSkillBonus,
    hasActiveRivalBeef,
    rivalName,
    beefHeat,
    playerPopularity,
    sundayYear
  } = params;

  const seed = deterministicHash(`${id}-${title}-${artist}`);
  const criticPersona = PITCHFORK_CRITICS[seed % PITCHFORK_CRITICS.length];

  // 1. Compute average track quality & strict tracklist cohesion
  const safeTracks =
    tracks.length > 0 ? tracks : [{ title, quality: 62 }];
  const qualities = safeTracks.map(t => Math.max(25, Math.min(99, t.quality || 62)));
  const avgQuality =
    qualities.reduce((acc, q) => acc + q, 0) / qualities.length;

  // Variance & bloat calculation for albums/EPs
  const variance =
    qualities.reduce((acc, q) => acc + Math.pow(q - avgQuality, 2), 0) /
    qualities.length;
  const stdDev = Math.sqrt(variance);

  // Track-by-track evaluation FIRST so filler tracks & weakest link directly impact the album verdict
  let bestTrackTitle = safeTracks[0].title;
  let bestTrackQ = -1;
  let weakestTrackTitle = safeTracks[safeTracks.length - 1].title;
  let weakestTrackQ = 999;
  let weakestTrackScore = 10.0;
  let fillerTracksCount = 0;

  const trackNotes: PitchforkTrackNote[] = safeTracks.map((tr, idx) => {
    const tSeed = deterministicHash(`${id}-tr-${idx}-${tr.title}`);
    // Strict track scoring curve: quality 65 -> ~6.1, quality 75 -> ~7.1, quality 85 -> ~8.2, quality 92 -> ~9.0
    const baseTrack10 =
      tr.quality >= 82
        ? 7.9 + (tr.quality - 82) * 0.115
        : tr.quality >= 68
        ? 6.3 + (tr.quality - 68) * 0.114
        : 3.6 + (Math.max(25, tr.quality) - 25) * 0.062;

    const skillNudge = (studioSkillBonus / 11) * 0.25;
    const jitter = (((tSeed % 7) - 3) * 0.08);
    const trScore =
      Math.round(
        Math.max(3.2, Math.min(9.9, baseTrack10 + skillNudge + jitter)) * 10
      ) / 10;

    if (tr.quality > bestTrackQ) {
      bestTrackQ = tr.quality;
      bestTrackTitle = tr.title;
    }
    if (tr.quality < weakestTrackQ) {
      weakestTrackQ = tr.quality;
      weakestTrackTitle = tr.title;
    }
    if (trScore < weakestTrackScore) {
      weakestTrackScore = trScore;
    }
    if (trScore < 6.8) {
      fillerTracksCount++;
    }

    const isEssential = trScore >= 8.4 || (idx === 0 && trScore >= 8.2);
    const notesPool = isEssential
      ? [
          'Standout centerpiece; razor-sharp hook and luminous mixing.',
          'Career-high vocal delivery over an intoxicating, detail-rich arrangement.',
          'Immediate essential listen—bridges intimate lyricism with widescreen momentum.'
        ]
      : trScore >= 7.3
      ? [
          'Solid mid-record cut that sustains the project’s sonic atmosphere.',
          'Polished studio execution with a memorable bridge.',
          'Crisp percussion and warm harmonic layering keep the pacing taut.'
        ]
      : trScore >= 6.5
      ? [
          'Serviceable arrangement, though overshadowed by stronger surrounding cuts.',
          'Slight pacing detour; leans on familiar structural tropes.'
        ]
      : [
          'Unfocused filler cut; thin percussion and uninspired hook drag down the sequencing.',
          'Feels like an unfinished demo left on the tracklist to pad streaming runtime.'
        ];

    return {
      trackNumber: idx + 1,
      title: tr.title,
      trackScore: trScore,
      isEssentialTrack: isEssential,
      commentary: notesPool[tSeed % notesPool.length]
    };
  });

  // Strict Sequencing & Bloat / Under-Length Penalties
  let sequencingPenaltyPoints = 0;
  let trackCountCohesionPenalty = 0;
  if (releaseType === 'album') {
    if (safeTracks.length < 7) {
      // Under-length "album" penalty (trying to pass a short EP/single off as an album)
      sequencingPenaltyPoints = Math.round((7 - safeTracks.length) * 0.16 * 100) / 100;
      trackCountCohesionPenalty = (7 - safeTracks.length) * 5.5;
    } else if (safeTracks.length > 15 && avgQuality < 86) {
      // Streaming-era bloat penalty
      sequencingPenaltyPoints = Math.min(0.75, Math.round((safeTracks.length - 15) * 0.12 * 100) / 100);
      trackCountCohesionPenalty = (safeTracks.length - 15) * 2.8;
    }
  } else if (releaseType === 'ep') {
    if (safeTracks.length < 4) {
      sequencingPenaltyPoints = Math.round((4 - safeTracks.length) * 0.18 * 100) / 100;
      trackCountCohesionPenalty = (4 - safeTracks.length) * 6.0;
    } else if (safeTracks.length > 7) {
      sequencingPenaltyPoints = 0.25;
      trackCountCohesionPenalty = 6;
    }
  }

  // Filler track penalty: critics punish albums that pad strong singles with mediocre filler
  const fillerPenaltyPoints =
    releaseType === 'single'
      ? 0
      : Math.min(0.9, Math.round(fillerTracksCount * 0.22 * 100) / 100);

  const tightSequencingBonus =
    releaseType === 'album' &&
    safeTracks.length >= 8 &&
    safeTracks.length <= 13 &&
    fillerTracksCount === 0
      ? 3.0
      : 0;

  const cohesionRaw = Math.round(
    Math.max(
      35,
      Math.min(
        98,
        avgQuality * 0.94 -
          stdDev * 2.1 -
          trackCountCohesionPenalty -
          fillerTracksCount * 4.5 +
          tightSequencingBonus +
          ((seed % 5) - 2)
      )
    )
  );

  // Strict Sub-Scores (0 - 100 scale): no free baseline inflation
  const songwritingSub = Math.round(
    Math.max(
      38,
      Math.min(
        98,
        avgQuality * 0.88 + studioSkillBonus * 0.72 - fillerTracksCount * 1.8 + ((seed % 7) - 3)
      )
    )
  );
  const productionSub = Math.round(
    Math.max(
      40,
      Math.min(
        98,
        avgQuality * 0.89 + studioSkillBonus * 0.78 - fillerTracksCount * 1.2 + (((seed >> 3) % 7) - 3)
      )
    )
  );
  const originalitySub = Math.round(
    Math.max(
      36,
      Math.min(
        98,
        avgQuality * 0.85 + studioSkillBonus * 0.65 + (criticPersona.prefersExperimental ? 2 : -1) + (((seed >> 6) % 9) - 4)
      )
    )
  );

  // 2. Pitchfork 0.0 - 10.0 Strict Non-Linear Score Calculation
  const composite100 =
    songwritingSub * 0.35 +
    productionSub * 0.30 +
    cohesionRaw * 0.20 +
    originalitySub * 0.15;

  // Non-linear Pitchfork curve:
  // - Composite 60 -> ~5.6
  // - Composite 70 -> ~6.7
  // - Composite 78 -> ~7.5
  // - Composite 84 -> ~8.3
  // - Composite 90 -> ~9.0
  let baseP4k: number;
  if (composite100 >= 84) {
    baseP4k = 8.25 + (composite100 - 84) * 0.115;
  } else if (composite100 >= 72) {
    baseP4k = 6.85 + (composite100 - 72) * 0.116;
  } else if (composite100 >= 58) {
    baseP4k = 5.3 + (composite100 - 58) * 0.11;
  } else {
    baseP4k = 3.2 + Math.max(0, composite100 - 35) * 0.09;
  }

  let criticPersonaDelta = criticPersona.strictnessOffset;
  if (criticPersona.prefersCohesion && cohesionRaw >= 86 && fillerTracksCount === 0) {
    criticPersonaDelta += 0.15;
  } else if (criticPersona.prefersCohesion && cohesionRaw < 70) {
    criticPersonaDelta -= 0.25;
  }
  criticPersonaDelta = Math.round(criticPersonaDelta * 100) / 100;

  let rawP4k =
    baseP4k +
    criticPersonaDelta -
    fillerPenaltyPoints -
    sequencingPenaltyPoints;

  if (releaseType === 'sunday_review') {
    rawP4k = Math.max(8.5, rawP4k + 0.35);
  }

  const p4kScore = Math.round(Math.max(2.8, Math.min(9.8, rawP4k)) * 10) / 10;
  const isSundayReview = releaseType === 'sunday_review';

  // 3. ULTRA-STRICT ACCOLADE GATES (Best New Music & Best New Track)
  const isAlbumOrEp = releaseType === 'album' || releaseType === 'ep';
  const minTracksRequired = releaseType === 'album' ? 7 : releaseType === 'ep' ? 4 : 1;
  const maxTracksAllowedForTightBNM = releaseType === 'album' ? 16 : releaseType === 'ep' ? 7 : 1;

  const pitchforkChecklist: AccoladeCriterionItem[] = isAlbumOrEp
    ? [
        {
          label: 'Pitchfork Composite Score',
          passed: p4kScore >= 8.4,
          currentValue: `${p4kScore.toFixed(1)} / 10`,
          requiredValue: '≥ 8.4 / 10'
        },
        {
          label: 'Format Tracklist Discipline',
          passed:
            safeTracks.length >= minTracksRequired &&
            safeTracks.length <= maxTracksAllowedForTightBNM,
          currentValue: `${safeTracks.length} Tracks`,
          requiredValue:
            releaseType === 'album' ? '7–16 Tracks (Full LP)' : '4–7 Tracks (EP)'
        },
        {
          label: 'Zero-Filler Floor (Weakest Cut)',
          passed: weakestTrackScore >= 7.2 && fillerTracksCount === 0,
          currentValue: `${weakestTrackScore.toFixed(1)} / 10 (${fillerTracksCount} filler)`,
          requiredValue: 'Weakest ≥ 7.2 (0 Filler)'
        },
        {
          label: 'Album Sequencing & Cohesion',
          passed: cohesionRaw >= 82,
          currentValue: `${cohesionRaw} / 100`,
          requiredValue: '≥ 82 / 100'
        },
        {
          label: 'Songwriting & Production Craft',
          passed: songwritingSub >= 80 && productionSub >= 80,
          currentValue: `SW ${songwritingSub} · PROD ${productionSub}`,
          requiredValue: 'Both ≥ 80 / 100'
        }
      ]
    : [
        {
          label: 'Pitchfork Track Score',
          passed: p4kScore >= 8.5,
          currentValue: `${p4kScore.toFixed(1)} / 10`,
          requiredValue: '≥ 8.5 / 10'
        },
        {
          label: 'Songwriting Craftsmanship',
          passed: songwritingSub >= 83,
          currentValue: `${songwritingSub} / 100`,
          requiredValue: '≥ 83 / 100'
        },
        {
          label: 'Production & Sonic Detail',
          passed: productionSub >= 83,
          currentValue: `${productionSub} / 100`,
          requiredValue: '≥ 83 / 100'
        },
        {
          label: 'Originality & Edge',
          passed: originalitySub >= 78,
          currentValue: `${originalitySub} / 100`,
          requiredValue: '≥ 78 / 100'
        }
      ];

  const allP4kGatesPassed = pitchforkChecklist.every(c => c.passed);

  const isBestNewMusic =
    !isSundayReview && isAlbumOrEp && allP4kGatesPassed;

  const isBestNewTrack =
    !isSundayReview && releaseType === 'single' && allP4kGatesPassed;

  const failedP4kGate = pitchforkChecklist.find(c => !c.passed);

  // 4. Metacritic 12-Publication Weighted Aggregation (Strict Consensus)
  const pubCount = releaseType === 'single' ? 8 : 12;
  const selectedPubs = METACRITIC_PUBLICATIONS.slice(0, pubCount);

  let weightedSum = 0;
  let totalWeight = 0;
  let posCount = 0;
  let mixCount = 0;
  let negCount = 0;

  // Penalize overall press baseline if album has filler or sequencing issues
  const pressPenalty100 = Math.round((fillerPenaltyPoints + sequencingPenaltyPoints) * 8.5);

  const criticReviews: MetacriticPublicationReview[] = selectedPubs.map((pub, idx) => {
    const pubSeed = deterministicHash(`${id}-${pub.id}-${idx}`);
    let score100: number;

    if (pub.id === 'pitchfork') {
      score100 = Math.round(p4kScore * 10);
    } else {
      const varianceSwing = ((pubSeed % 13) - 6); // -6 to +6
      // Press publications align with the stricter composite minus any bloat/filler penalty
      const strictPubBase = composite100 - pressPenalty100 - 1.5;
      const rawPubScore = Math.round(strictPubBase + pub.biasOffset * 0.75 + varianceSwing);
      score100 = Math.max(28, Math.min(98, rawPubScore));
    }

    weightedSum += score100 * pub.weight;
    totalWeight += pub.weight;

    const cTier = getMetacriticColorTier(score100);
    if (cTier === 'green') posCount++;
    else if (cTier === 'yellow') mixCount++;
    else negCount++;

    const assignedCritic = pub.criticPool[pubSeed % pub.criticPool.length];
    const quotePool =
      score100 >= 85
        ? [
            `A masterclass in modern ${genre.toLowerCase()}—${artist} sounds completely untouchable on "${title}".`,
            `Richly detailed, emotionally fearless, and sequenced without a single wasted second.`,
            `With "${title}", ${artist} delivers one of the year’s most vital and replayable statements.`
          ]
        : score100 >= 70
        ? [
            `"${title}" highlights ${artist}’s growing command of studio craft and melodic hooks.`,
            `A strong, engaging effort anchored by standout cuts like "${bestTrackTitle}".`,
            `Smartly produced and consistently enjoyable, even when it plays within familiar boundaries.`
          ]
        : score100 >= 55
        ? [
            `Flashes of brilliance share space with uneven filler across an ambitious but scattered release.`,
            `${artist} brings undeniable charisma, though the production choices occasionally crowd the songwriting.`
          ]
        : [
            `Struggles to find a cohesive spark despite glossy studio resources.`,
            `A curiously safe step sideways that leaves ${artist}’s strongest instincts underutilized.`
          ];

    return {
      publicationId: pub.id,
      publicationName: pub.name,
      weightMultiplier: pub.weight,
      weightLabel: pub.weightLabel,
      score100,
      originalScoreDisplay: formatOriginalScaleScore(score100, pub.scaleType),
      colorTier: cTier,
      criticName: assignedCritic,
      quote: quotePool[pubSeed % quotePool.length],
      date: releaseDate
    };
  });

  const metascore = Math.round(weightedSum / Math.max(1, totalWeight));
  const colorTier = getMetacriticColorTier(metascore);
  const sentimentLabel = getMetacriticSentimentLabel(metascore);

  const positiveSharePct = Math.round((posCount / Math.max(1, criticReviews.length)) * 100);

  // Strict 5-Gate Metacritic Must-Play Qualification
  const mustPlayChecklist: AccoladeCriterionItem[] = [
    {
      label: 'Weighted Metascore Threshold',
      passed: metascore >= 83,
      currentValue: `${metascore} / 100`,
      requiredValue: '≥ 83 / 100 (Acclaim)'
    },
    {
      label: 'Full-Length Press Consensus',
      passed: isAlbumOrEp && criticReviews.length >= 10,
      currentValue: `${criticReviews.length} Outlets (${releaseType.toUpperCase()})`,
      requiredValue: 'Album/EP (≥ 10 Outlets)'
    },
    {
      label: 'Zero Negative Critic Reviews',
      passed: negCount === 0,
      currentValue: `${negCount} Negative`,
      requiredValue: '0 Negative Reviews'
    },
    {
      label: 'Positive Critic Consensus Share',
      passed: positiveSharePct >= 80,
      currentValue: `${positiveSharePct}% Positive (${posCount}/${criticReviews.length})`,
      requiredValue: '≥ 80% Positive'
    },
    {
      label: 'High-Prestige Anchor (Pitchfork)',
      passed: p4kScore >= 8.0,
      currentValue: `${p4kScore.toFixed(1)} / 10`,
      requiredValue: '≥ 8.0 / 10'
    }
  ];

  const isMustPlay = mustPlayChecklist.every(c => c.passed);

  const scoringAudit: EditorialScoringAudit = {
    rawAvgTrackQuality: Math.round(avgQuality * 10) / 10,
    studioMasteryBonus: Math.round(studioSkillBonus * 10) / 10,
    weakestTrackTitle,
    weakestTrackScore,
    fillerTracksCount,
    fillerPenaltyPoints,
    sequencingPenaltyPoints,
    criticPersonaDelta,
    accoladeType: isBestNewMusic
      ? 'BNM'
      : isBestNewTrack
      ? 'BNT'
      : isSundayReview
      ? 'SUNDAY'
      : 'NONE',
    accoladeQualified: isBestNewMusic || isBestNewTrack || isSundayReview,
    accoladeDisqualificationReason:
      isBestNewMusic || isBestNewTrack || isSundayReview
        ? undefined
        : failedP4kGate
        ? `Missed ${isAlbumOrEp ? 'Best New Music' : 'Best New Track'}: ${failedP4kGate.label} (${failedP4kGate.currentValue} vs required ${failedP4kGate.requiredValue}).`
        : undefined,
    pitchforkChecklist,
    mustPlayChecklist
  };

  const { pullQuote, paragraphs } = buildEditorialEssayAndQuote({
    title,
    artist,
    releaseType,
    score: p4kScore,
    isBNM: isBestNewMusic,
    isBNT: isBestNewTrack,
    cohesion: cohesionRaw,
    songwriting: songwritingSub,
    production: productionSub,
    standoutTrack: bestTrackTitle,
    weakestTrack: weakestTrackTitle,
    trackCount: safeTracks.length,
    criticName: criticPersona.name
  });

  const pitchforkReview: PitchforkReviewItem = {
    id: `p4k-${id}`,
    releaseId: id,
    title,
    artist,
    cover,
    releaseType,
    isPlayer,
    genre,
    labelName,
    releaseDate,
    score: p4kScore,
    isBestNewMusic,
    isBestNewTrack,
    isSundayReview,
    sundayReviewOriginalYear: sundayYear,
    criticName: criticPersona.name,
    criticRole: criticPersona.role,
    criticSpecialty: criticPersona.specialty,
    criticBiasNote: criticPersona.biasDescription,
    pullQuote,
    essayParagraphs: paragraphs,
    subScores: {
      songwriting: songwritingSub,
      production: productionSub,
      cohesion: cohesionRaw,
      originality: originalitySub
    },
    trackNotes,
    scoringAudit
  };

  // 4. User Score (0.0 - 10.0) & Rival Review Bombing / Stan Rally Simulation
  let baseUser10 = Math.min(9.6, Math.max(4.2, (metascore / 10) * 0.92 + 0.7));
  let reviewBombingStatus: MetacriticReleaseEntry['reviewBombingStatus'] = 'none';
  let reviewBombingNotice: string | undefined;

  if (isPlayer && hasActiveRivalBeef && beefHeat >= 45) {
    // Active feud triggers rival fanbase review-bombing vs player stan counter-rally
    const bombDelta = Math.min(1.6, (beefHeat - 40) * 0.025);
    baseUser10 = Math.max(3.8, baseUser10 - bombDelta);
    reviewBombingStatus = 'rival_review_bombing';
    reviewBombingNotice = `⚠️ High Community Volatility: Unusual 0/10 & 1/10 rating activity detected from @${rivalName.replace(/\s+/g, '')} stan accounts during active chart feud, met by 10/10 counter-votes from your fanbase.`;
  } else if (isPlayer && metascore >= 84) {
    baseUser10 = Math.min(9.7, baseUser10 + 0.35);
    reviewBombingStatus = 'stan_counter_rally';
    reviewBombingNotice = `🔥 Fanbase Acclaim Rally: Core fans and vinyl collectors are rallying behind "${title}" with overwhelming 9/10 and 10/10 ratings.`;
  } else if (Math.abs(metascore - baseUser10 * 10) >= 14) {
    reviewBombingStatus = 'mild_debate';
  }

  const userScore = Math.round(baseUser10 * 10) / 10;
  const userColorTier = getUserScoreColorTier(userScore);
  const userSentimentLabel = getMetacriticSentimentLabel(Math.round(userScore * 10));

  const baseVoterPool = isPlayer
    ? Math.max(140, Math.round((playerPopularity || 15) * 45 + (seed % 320)))
    : 1250 + (seed % 4200);

  const posShare =
    reviewBombingStatus === 'rival_review_bombing'
      ? 0.62
      : userScore >= 8.0
      ? 0.84
      : userScore >= 6.5
      ? 0.71
      : 0.45;
  const negShare =
    reviewBombingStatus === 'rival_review_bombing'
      ? 0.26
      : userScore >= 8.0
      ? 0.06
      : userScore >= 6.5
      ? 0.12
      : 0.32;
  const mixShare = Math.max(0.05, 1 - posShare - negShare);

  const uPos = Math.round(baseVoterPool * posShare);
  const uNeg = Math.round(baseVoterPool * negShare);
  const uMix = Math.max(1, baseVoterPool - uPos - uNeg);

  const userReviews: MetacriticUserReviewItem[] = [
    {
      id: `${id}-ur-1`,
      username: `${artist.replace(/\s+/g, '').toLowerCase()}_archive`,
      userTag: 'Core Fan',
      score10: 10,
      colorTier: 'green',
      comment: `"${bestTrackTitle}" alone makes "${title}" AOTY material. The vocal layering and transitions across the project are insane.`,
      date: releaseDate,
      helpfulYes: 84 + (seed % 60),
      helpfulTotal: 96 + (seed % 65)
    },
    {
      id: `${id}-ur-2`,
      username: 'AnalogWaxPress',
      userTag: 'Vinyl Collector',
      score10: Math.max(6, Math.min(10, Math.round(userScore))),
      colorTier: getUserScoreColorTier(Math.round(userScore)),
      comment: `Dynamic range and mixing on "${title}" really shine on good headphones. ${
        cohesionRaw >= 82
          ? 'Front-to-back sequencing feels super intentional.'
          : 'A couple of mid-album tracks could be trimmed, but the highs are undeniable.'
      }`,
      date: releaseDate,
      helpfulYes: 49 + (seed % 30),
      helpfulTotal: 58 + (seed % 35)
    },
    ...(reviewBombingStatus === 'rival_review_bombing'
      ? [
          {
            id: `${id}-ur-rival`,
            username: `${rivalName.replace(/\s+/g, '').toLowerCase()}supremacy`,
            userTag: 'Rival Stan' as const,
            score10: 1,
            colorTier: 'red' as const,
            comment: `Overhyped by paid critics. ${rivalName} cleared this effortlessly with way better replay value.`,
            date: releaseDate,
            helpfulYes: 19,
            helpfulTotal: 112
          }
        ]
      : []),
    {
      id: `${id}-ur-3`,
      username: 'SoundcheckDaily',
      userTag: 'Music Buff',
      score10: Math.max(5, Math.min(9, Math.round(metascore / 10))),
      colorTier: getMetacriticColorTier(metascore),
      comment: `Critics got the Metascore (${metascore}) right on this one. "${bestTrackTitle}" is an instant classic in ${artist}'s catalog.`,
      date: releaseDate,
      helpfulYes: 31 + (seed % 25),
      helpfulTotal: 39 + (seed % 30)
    }
  ];

  return {
    id: `mc-${id}`,
    releaseId: id,
    title,
    artist,
    cover,
    releaseType: releaseType === 'sunday_review' ? 'album' : releaseType,
    isPlayer,
    genre,
    releaseDate,
    metascore,
    sentimentLabel,
    colorTier,
    isMustPlay,
    criticBreakdown: {
      positive: posCount,
      mixed: mixCount,
      negative: negCount,
      total: criticReviews.length
    },
    criticReviews,
    userScore,
    userSentimentLabel,
    userColorTier,
    userRatingsCount: baseVoterPool,
    userBreakdown: {
      positive: uPos,
      mixed: uMix,
      negative: uNeg,
      total: baseVoterPool
    },
    reviewBombingStatus,
    reviewBombingNotice,
    userReviews,
    pitchforkRef: pitchforkReview
  };
}

/**
 * Computes the complete Pitchfork & Metacritic universe (Player projects, Player singles, and NPC benchmark releases)
 */
export function getCriticsAndAggregatorData(state: GameState): CriticsHubSummary {
  const artistName = state.artist?.name || 'Artist';
  const artistGenre = (state.artist as any)?.genre || 'Pop / Contemporary';
  const currentDate = state.date ? state.date.split('T')[0] : '2026-01-01';

  const skills = getEnsuredSkillState(state.skills);
  const mastery = calculateMasteryRank(skills);
  const avgSkillLevel =
    (mastery.averages.songwriting +
      mastery.averages.recording +
      mastery.averages.production) /
    3;
  // Studio skill bonus scales strictly from 0 to +11 quality points based on real trained studio mastery
  const studioSkillBonus = Math.min(11, Math.max(0, (avgSkillLevel - 1) * 1.65));

  const rivalState = getEnsuredRivalState(state);

  const entries: MetacriticReleaseEntry[] = [];

  // 1. Evaluate Player Released Projects (Albums / EPs)
  const releasedProjects = (state.projects || []).filter(
    (p: Project) => p.status === 'released'
  );
  releasedProjects.forEach((proj: Project, idx: number) => {
    const projSongs = (proj.songs || []).map(ps => {
      const liveSong = (state.songs || []).find(
        s => s.id === ps.id || s.title === ps.title
      );
      return {
        title: ps.title,
        quality: Math.max(30, Math.min(99, liveSong?.quality ?? ps.quality ?? 62))
      };
    });

    const cover =
      proj.cover ||
      state.artist?.image ||
      resolveAuthenticCover(artistName, proj.title);

    // Classic older player albums with genuinely elite acclaim (>= 88 quality & >= 7 tracks) can earn a Sunday Review retrospective if >= 4 projects out
    const isRetroSunday =
      releasedProjects.length >= 4 &&
      idx === 0 &&
      projSongs.length >= 7 &&
      (projSongs[0]?.quality || 62) >= 88;

    const entry = evaluateReleaseEntry({
      id: `player-proj-${proj.id}`,
      title: proj.title,
      artist: artistName,
      cover,
      releaseType: isRetroSunday
        ? 'sunday_review'
        : proj.type === 'ep'
        ? 'ep'
        : 'album',
      isPlayer: true,
      genre: artistGenre,
      labelName: `${artistName} Recordings`,
      releaseDate: currentDate,
      tracks:
        projSongs.length > 0
          ? projSongs
          : [{ title: proj.title, quality: 62 }],
      studioSkillBonus,
      hasActiveRivalBeef: rivalState.hasActiveRival,
      rivalName: rivalState.rivalName || 'Industry Rival',
      beefHeat: rivalState.beefHeat || 0,
      playerPopularity: state.popularity || 15,
      playerFans: state.fans || 500,
      sundayYear: isRetroSunday ? 2025 : undefined
    });

    entries.push(entry);
  });

  // 2. Evaluate Player Released Singles / Standout Songs
  const releasedSongs = (state.songs || []).filter(
    (s: Song) => s.status === 'released'
  );
  releasedSongs
    .slice()
    .reverse()
    .forEach((song: Song) => {
      const cover =
        song.cover ||
        song.mvThumbnail ||
        state.artist?.image ||
        resolveAuthenticCover(artistName, song.title);

      const entry = evaluateReleaseEntry({
        id: `player-song-${song.id}`,
        title: song.title,
        artist: artistName,
        cover,
        releaseType: 'single',
        isPlayer: true,
        genre: song.genre || artistGenre,
        labelName: `${artistName} Recordings`,
        releaseDate: currentDate,
        tracks: [
          {
            title: song.title,
            quality: Math.max(30, Math.min(99, song.quality ?? 62))
          }
        ],
        studioSkillBonus,
        hasActiveRivalBeef: rivalState.hasActiveRival,
        rivalName: rivalState.rivalName || 'Industry Rival',
        beefHeat: rivalState.beefHeat || 0,
        playerPopularity: state.popularity || 15,
        playerFans: state.fans || 500
      });

      entries.push(entry);
    });

  // 3. Evaluate NPC Benchmark Releases
  NPC_BENCHMARK_RELEASES.forEach(npc => {
    const cover = resolveAuthenticCover(npc.artist, npc.title);
    const entry = evaluateReleaseEntry({
      id: npc.id,
      title: npc.title,
      artist: npc.artist,
      cover,
      releaseType: npc.releaseType,
      isPlayer: false,
      genre: npc.genre,
      labelName: npc.labelName,
      releaseDate: npc.releaseDate,
      tracks: npc.tracks,
      studioSkillBonus: 8,
      hasActiveRivalBeef: false,
      rivalName: '',
      beefHeat: 0,
      playerPopularity: 85,
      playerFans: 1000000,
      sundayYear: npc.sundayYear
    });
    entries.push(entry);
  });

  // Player Career Critical Summary
  const playerEntries = entries.filter(e => e.isPlayer);
  const reviewedCount = playerEntries.length;

  const avgPitchforkScore =
    reviewedCount > 0
      ? Math.round(
          (playerEntries.reduce((acc, e) => acc + e.pitchforkRef.score, 0) /
            reviewedCount) *
            10
        ) / 10
      : 0;

  const highestPitchforkScore =
    reviewedCount > 0
      ? Math.max(...playerEntries.map(e => e.pitchforkRef.score))
      : 0;

  const bestNewMusicCount = playerEntries.filter(
    e => e.pitchforkRef.isBestNewMusic
  ).length;
  const bestNewTrackCount = playerEntries.filter(
    e => e.pitchforkRef.isBestNewTrack
  ).length;

  const avgMetascore =
    reviewedCount > 0
      ? Math.round(
          playerEntries.reduce((acc, e) => acc + e.metascore, 0) / reviewedCount
        )
      : 0;

  const avgUserScore =
    reviewedCount > 0
      ? Math.round(
          (playerEntries.reduce((acc, e) => acc + e.userScore, 0) /
            reviewedCount) *
            10
        ) / 10
      : 0;

  const mustPlayCount = playerEntries.filter(e => e.isMustPlay).length;
  const universalAcclaimCount = playerEntries.filter(
    e => e.metascore >= 81
  ).length;

  return {
    allPitchforkReviews: entries.map(e => e.pitchforkRef),
    allMetacriticEntries: entries,
    playerPitchforkReviews: playerEntries.map(e => e.pitchforkRef),
    playerMetacriticEntries: playerEntries,
    playerStats: {
      reviewedReleasesCount: reviewedCount,
      avgPitchforkScore,
      bestNewMusicCount,
      bestNewTrackCount,
      highestPitchforkScore,
      avgMetascore,
      avgUserScore,
      mustPlayCount,
      universalAcclaimCount
    }
  };
}

/**
 * Generates authentic @pitchfork, @metacritic, and Stan reaction tweets for X (Twitter)
 */
export function generatePitchforkAndMetacriticXPosts(state: GameState): XPost[] {
  const summary = getCriticsAndAggregatorData(state);
  const playerEntries = summary.allMetacriticEntries.filter(e => e.isPlayer);
  if (playerEntries.length === 0) return [];

  const latest = playerEntries[0];
  const p4k = latest.pitchforkRef;
  const profile = getEnsuredXProfile(state);
  const followers = profile.followers || 1200;
  const dateStr = state.date ? state.date.split('T')[0] : '2026-01-01';
  const timestamp = Date.now();

  const posts: XPost[] = [];

  // 1. @pitchfork Official Review Tweet
  const bnmTag = p4k.isBestNewMusic
    ? ' [BEST NEW MUSIC]'
    : p4k.isBestNewTrack
    ? ' [BEST NEW TRACK]'
    : '';

  posts.push({
    id: `crit-x-p4k-${latest.id}-${timestamp}`,
    authorName: 'Pitchfork',
    authorHandle: '@pitchfork',
    authorAvatar:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&q=80',
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    timeAgo: '1h',
    dateCreated: dateStr,
    content: `${latest.artist}: "${latest.title}" (${p4k.score.toFixed(1)})${bnmTag}\n\n"${p4k.pullQuote}"\n\nReviewed by ${p4k.criticName}.`,
    image: latest.cover,
    mediaBadge: p4k.isBestNewMusic
      ? `BEST NEW MUSIC • ${p4k.score.toFixed(1)}`
      : p4k.isBestNewTrack
      ? `BEST NEW TRACK • ${p4k.score.toFixed(1)}`
      : `PITCHFORK REVIEW • ${p4k.score.toFixed(1)}`,
    mediaTitle: `${latest.artist} — "${latest.title}" (${p4k.score.toFixed(1)}/10)`,
    mediaSubtitle: `Reviewed by ${p4k.criticName} • ${latest.genre}`,
    likes: Math.max(1650, Math.round(followers * 0.085 + 520)),
    reposts: Math.max(380, Math.round(followers * 0.02 + 115)),
    replies: 142,
    views: Math.max(44000, Math.round(followers * 0.62 + 18000)),
    isPlayerPost: false,
    daysOld: 0
  });

  // 2. @metacritic Official Metascore & User Score Tweet
  const mustPlayText = latest.isMustPlay ? ' 🏆 [METACRITIC MUST-PLAY]' : '';
  posts.push({
    id: `crit-x-mc-${latest.id}-${timestamp}`,
    authorName: 'Metacritic',
    authorHandle: '@metacritic',
    authorAvatar:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&q=80',
    isVerified: true,
    verifiedType: 'gold',
    category: 'media',
    timeAgo: '2h',
    dateCreated: dateStr,
    content: `Metascore Update: "${latest.title}" by ${latest.artist} currently holds a ${latest.metascore}/100 (${latest.sentimentLabel}) based on ${latest.criticReviews.length} critic reviews${mustPlayText}.\n\n• Critic Score: ${latest.metascore}/100\n• User Score: ${latest.userScore.toFixed(1)}/10 (${latest.userRatingsCount} ratings)`,
    image: latest.cover,
    mediaBadge: `METASCORE ${latest.metascore} • USER ${latest.userScore.toFixed(1)}`,
    mediaTitle: `${latest.title} — ${latest.sentimentLabel}`,
    mediaSubtitle: `${latest.criticBreakdown.positive} Positive • ${latest.criticBreakdown.mixed} Mixed • ${latest.criticBreakdown.negative} Negative`,
    likes: Math.max(1490, Math.round(followers * 0.078 + 460)),
    reposts: Math.max(340, Math.round(followers * 0.018 + 105)),
    replies: 98,
    views: Math.max(39000, Math.round(followers * 0.54 + 15000)),
    isPlayerPost: false,
    daysOld: 0
  });

  return posts;
}
