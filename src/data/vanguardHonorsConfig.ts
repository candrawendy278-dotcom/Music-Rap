// Official Categories, Eligibility Rules & Annual Calendar Configuration
// for Vanguard Music Honors (VMH) — Celebrating Critical Acclaim, Chart Dominance,
// Streaming Velocity, Cultural Hype & Live Touring Excellence.

export type VanguardSubjectType = 'song' | 'album' | 'artist' | 'tour' | 'collab';

export interface VanguardCategoryDef {
  id: string;
  field: 'Supreme Sovereign Honors' | 'Genre & Sonic Craft Honors';
  name: string;
  shortName: string;
  description: string;
  subjectType: VanguardSubjectType;
  isMajor: boolean; // Obsidian Vanguard Monolith Major Category
  genreFilter?: string[];
  weights: {
    criticalAcclaim: number;        // Pitchfork & Metacritic acclaim + studio/songwriting mastery
    chartImpact: number;            // Billboard Hot 100 / Global 200 / 200 Albums peak & longevity
    commercialVolume: number;       // Spotify/iTunes streams + pure sales
    touringAndVisualImpact: number; // World Tour boxscore gross/attendance + YouTube MV velocity
    fanAndCulturalHype: number;     // Popularity, cultural hype & fanbase loyalty
  };
}

export interface VanguardCampaignTierOption {
  id: string;
  name: string;
  subtitle: string;
  cost: number;
  scoreBonus: number;
  hypeGain: number;
}

export const VANGUARD_CALENDAR_CONFIG = {
  showName: 'Vanguard Music Honors',
  organization: 'International Music & Touring Vanguard Council',
  officialHandle: '@VanguardHonors',
  trophyName: 'Obsidian Vanguard Monolith',
  nominationsMonth: 5, // May 10
  nominationsDay: 10,
  ceremonyMonth: 6,    // June 20
  ceremonyDay: 20,
  nomineesPerCategory: 6,
} as const;

export const VANGUARD_CAMPAIGN_TIERS: VanguardCampaignTierOption[] = [
  {
    id: 'vanguard_critics_folio',
    name: 'Vanguard Critics & Editorial Listening Folio',
    subtitle: 'Deliver spatial-audio masters, tour boxscore dossiers, and liner notes to the 500 Vanguard Council critics',
    cost: 32000,
    scoreBonus: 2.3,
    hypeGain: 1.8
  },
  {
    id: 'vanguard_global_billboards',
    name: 'Global Music Capitals FYC Campaign (NY, London, Tokyo)',
    subtitle: 'Architectural monolith projections and trade spreads highlighting chart peaks, critical acclaim, and tour sellouts',
    cost: 110000,
    scoreBonus: 4.5,
    hypeGain: 3.8
  },
  {
    id: 'vanguard_symphonic_residencies',
    name: 'Private Vanguard Council Symphonic & Live Stage Showcase',
    subtitle: 'Exclusive one-night live production showcase demonstrating vocal mastery, live touring scale, and sonic craft',
    cost: 260000,
    scoreBonus: 6.5,
    hypeGain: 6.4
  }
];

export const VANGUARD_CATEGORIES: VanguardCategoryDef[] = [
  // 1. SUPREME SOVEREIGN HONORS (6 MAJOR MONOLITH CATEGORIES)
  {
    id: 'vmh_sovereign_record',
    field: 'Supreme Sovereign Honors',
    name: 'Vanguard Record of the Year',
    shortName: 'Record of the Year',
    description: 'The Council’s premier single honor recognizing balanced excellence across streaming volume, Billboard chart peaks, critical acclaim, and cultural resonance.',
    subjectType: 'song',
    isMajor: true,
    weights: {
      criticalAcclaim: 0.26,
      chartImpact: 0.26,
      commercialVolume: 0.24,
      touringAndVisualImpact: 0.10,
      fanAndCulturalHype: 0.14
    }
  },
  {
    id: 'vmh_sovereign_album',
    field: 'Supreme Sovereign Honors',
    name: 'Vanguard Album of the Year',
    shortName: 'Album of the Year',
    description: 'Awarded to the most critically acclaimed, commercially dominant, and era-defining full-length album or EP of the eligibility cycle.',
    subjectType: 'album',
    isMajor: true,
    weights: {
      criticalAcclaim: 0.32,
      chartImpact: 0.24,
      commercialVolume: 0.22,
      touringAndVisualImpact: 0.08,
      fanAndCulturalHype: 0.14
    }
  },
  {
    id: 'vmh_artist_of_the_year',
    field: 'Supreme Sovereign Honors',
    name: 'Vanguard Artist of the Year',
    shortName: 'Artist of the Year',
    description: 'Honors the supreme recording and touring artist who commanded global charts, streaming platforms, music critics, and stadium stages.',
    subjectType: 'artist',
    isMajor: true,
    weights: {
      criticalAcclaim: 0.22,
      chartImpact: 0.22,
      commercialVolume: 0.22,
      touringAndVisualImpact: 0.18,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vmh_world_tour_excellence',
    field: 'Supreme Sovereign Honors',
    name: 'World Tour & Live Act of the Year',
    shortName: 'Live Tour of the Year',
    description: 'Celebrates monumental live touring achievement, boxscore gross, stadium/arena sellout velocity, and global stage spectacle.',
    subjectType: 'tour',
    isMajor: true,
    weights: {
      criticalAcclaim: 0.16,
      chartImpact: 0.14,
      commercialVolume: 0.16,
      touringAndVisualImpact: 0.36,
      fanAndCulturalHype: 0.18
    }
  },
  {
    id: 'vmh_critics_visionary',
    field: 'Supreme Sovereign Honors',
    name: 'Critics’ Choice Visionary Award',
    shortName: 'Critics’ Visionary',
    description: 'Bestowed upon the release with the highest critical consensus across Pitchfork and Metacritic alongside uncompromising artistic craft.',
    subjectType: 'song',
    isMajor: true,
    weights: {
      criticalAcclaim: 0.48,
      chartImpact: 0.16,
      commercialVolume: 0.14,
      touringAndVisualImpact: 0.10,
      fanAndCulturalHype: 0.12
    }
  },
  {
    id: 'vmh_streaming_phenomenon',
    field: 'Supreme Sovereign Honors',
    name: 'Global Streaming & Chart Phenomenon',
    shortName: 'Chart Phenomenon',
    description: 'Recognizes undeniable global chart dominance, multi-week peak longevity, and high-velocity streaming consumption.',
    subjectType: 'song',
    isMajor: true,
    weights: {
      criticalAcclaim: 0.16,
      chartImpact: 0.34,
      commercialVolume: 0.32,
      touringAndVisualImpact: 0.06,
      fanAndCulturalHype: 0.12
    }
  },

  // 2. GENRE & SONIC CRAFT HONORS (6 CATEGORIES)
  {
    id: 'vmh_hiphop_lyricism',
    field: 'Genre & Sonic Craft Honors',
    name: 'Best Hip-Hop & Lyricism Honor',
    shortName: 'Hip-Hop & Lyricism',
    description: 'Honors sharp cadence, lyrical storytelling, production weight, and chart impact in Hip-Hop, Rap, Trap, and Drill.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['hip-hop', 'rap', 'trap', 'drill'],
    weights: {
      criticalAcclaim: 0.30,
      chartImpact: 0.25,
      commercialVolume: 0.23,
      touringAndVisualImpact: 0.08,
      fanAndCulturalHype: 0.14
    }
  },
  {
    id: 'vmh_pop_melodic',
    field: 'Genre & Sonic Craft Honors',
    name: 'Best Pop & Melodic Excellence',
    shortName: 'Pop Excellence',
    description: 'Celebrates immaculate hookcraft, vocal polish, global chart reach, and replay value in contemporary Pop music.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['pop', 'dance pop', 'synth', 'k-pop', 'indie pop'],
    weights: {
      criticalAcclaim: 0.26,
      chartImpact: 0.28,
      commercialVolume: 0.24,
      touringAndVisualImpact: 0.08,
      fanAndCulturalHype: 0.14
    }
  },
  {
    id: 'vmh_rnb_soul_vanguard',
    field: 'Genre & Sonic Craft Honors',
    name: 'Best R&B & Soul Vanguard',
    shortName: 'R&B & Soul Vanguard',
    description: 'Recognizes vocal mastery, harmonic depth, and critical acclaim across R&B, Soul, and Neo-Soul.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['r&b', 'soul', 'neo-soul'],
    weights: {
      criticalAcclaim: 0.34,
      chartImpact: 0.22,
      commercialVolume: 0.22,
      touringAndVisualImpact: 0.08,
      fanAndCulturalHype: 0.14
    }
  },
  {
    id: 'vmh_global_crossover',
    field: 'Genre & Sonic Craft Honors',
    name: 'Best Global & Alternative Crossover',
    shortName: 'Global & Alt Crossover',
    description: 'Honors boundary-pushing releases across Rock, Alternative, Latin, Afrobeats, K-Pop, and Electronic music.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['rock', 'alternative', 'indie', 'latin', 'reggaeton', 'afrobeats', 'k-pop', 'electronic', 'dance'],
    weights: {
      criticalAcclaim: 0.28,
      chartImpact: 0.24,
      commercialVolume: 0.24,
      touringAndVisualImpact: 0.10,
      fanAndCulturalHype: 0.14
    }
  },
  {
    id: 'vmh_collab_event',
    field: 'Genre & Sonic Craft Honors',
    name: 'Best Collaborative Event',
    shortName: 'Best Collaboration',
    description: 'Awarded to the year’s most impactful joint release combining artistic chemistry, chart peaks, and cultural hype.',
    subjectType: 'collab',
    isMajor: false,
    weights: {
      criticalAcclaim: 0.24,
      chartImpact: 0.26,
      commercialVolume: 0.24,
      touringAndVisualImpact: 0.10,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vmh_sonic_visual_production',
    field: 'Genre & Sonic Craft Honors',
    name: 'Visual & Sonic Production Honor',
    shortName: 'Sonic & Visual Craft',
    description: 'Celebrates studio engineering perfection, music video direction, and audiovisual storytelling.',
    subjectType: 'song',
    isMajor: false,
    weights: {
      criticalAcclaim: 0.34,
      chartImpact: 0.16,
      commercialVolume: 0.16,
      touringAndVisualImpact: 0.22,
      fanAndCulturalHype: 0.12
    }
  }
];

export function doesGenreMatchVanguardCategory(itemGenre: string | undefined, category: VanguardCategoryDef): boolean {
  if (!category.genreFilter || category.genreFilter.length === 0) return true;
  const normalized = (itemGenre || 'pop').toLowerCase();
  return category.genreFilter.some(
    f => normalized.includes(f.toLowerCase()) || f.toLowerCase().includes(normalized)
  );
}
