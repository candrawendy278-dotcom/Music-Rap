// Official Categories, Eligibility Rules & Annual Calendar Configuration
// for The GRAMMY Awards (Recording Academy) and MTV Video Music Awards (VMAs)

export type AwardShowType = 'grammys' | 'vmas';
export type AwardSubjectType = 'song' | 'album' | 'video' | 'artist' | 'collab';

export interface AwardCategoryDef {
  id: string;
  show: AwardShowType;
  field: string;
  name: string;
  shortName: string;
  description: string;
  subjectType: AwardSubjectType;
  isMajor: boolean; // Big Four (Grammys) or Major Moon Person (VMAs)
  genreFilter?: string[]; // If empty/undefined, open to all genres
  weights: {
    qualityAndCraft: number;   // Studio quality + songwriting/recording/production mastery
    chartImpact: number;       // Billboard Hot 100 / Global 200 / Billboard 200 peaks & weeks
    commercialVolume: number;  // Audio streams + pure sales
    visualVelocity: number;    // YouTube MV views + likes velocity
    fanAndCulturalHype: number;// Dedicated fans + stan loyalty + artist popularity/hype
  };
}

export interface CampaignTierOption {
  id: string;
  show: AwardShowType;
  name: string;
  subtitle: string;
  cost: number;
  scoreBonus: number; // Added to the final 0-100 category score (up to +6.5 pts)
  hypeGain: number;
}

export const AWARD_CALENDAR_CONFIG = {
  grammys: {
    showName: 'The GRAMMY Awards',
    organization: 'The Recording Academy',
    trophyName: 'Golden Gramophone',
    nominationsMonth: 11, // November 15
    nominationsDay: 15,
    ceremonyMonth: 2,     // February 5
    ceremonyDay: 5,
    nomineesPerCategory: 6,
  },
  vmas: {
    showName: 'MTV Video Music Awards',
    organization: 'MTV / Paramount',
    trophyName: 'Moon Person Statue',
    nominationsMonth: 8,  // August 1
    nominationsDay: 1,
    ceremonyMonth: 9,     // September 12
    ceremonyDay: 12,
    nomineesPerCategory: 6,
  }
} as const;

export const CAMPAIGN_TIER_OPTIONS: CampaignTierOption[] = [
  // GRAMMYs FYC ("For Your Consideration") Campaigns
  {
    id: 'grammy_fyc_digital',
    show: 'grammys',
    name: 'Digital Academy Mailer & Press Kit',
    subtitle: 'Send lossless masters & liner notes to 12,000 Recording Academy voting members',
    cost: 25000,
    scoreBonus: 2.2,
    hypeGain: 1.5
  },
  {
    id: 'grammy_fyc_billboard',
    show: 'grammys',
    name: 'LA & NY "For Your Consideration" Billboards + Trade Ads',
    subtitle: 'Full-page Variety & Billboard spreads plus Sunset Strip FYC billboards',
    cost: 95000,
    scoreBonus: 4.4,
    hypeGain: 3.5
  },
  {
    id: 'grammy_fyc_showcase',
    show: 'grammys',
    name: 'Private Grammy Museum Acoustic Showcase & Panel Screening',
    subtitle: 'Intimate live session & Q&A with Recording Academy chapter governors',
    cost: 240000,
    scoreBonus: 6.5,
    hypeGain: 6.0
  },

  // MTV VMAs Fan Voting & Promo Campaigns
  {
    id: 'vma_vote_social',
    show: 'vmas',
    name: 'Global Stan Voting Mobilization & Power Hour',
    subtitle: 'Coordinate daily double-vote power hours across X, TikTok & Discord fan hubs',
    cost: 18000,
    scoreBonus: 2.4,
    hypeGain: 2.0
  },
  {
    id: 'vma_vote_mtv_spot',
    show: 'vmas',
    name: 'MTV Broadcast & Times Square Video Takeover',
    subtitle: 'High-rotation MV teasers & interactive QR fan voting banners in Times Square',
    cost: 75000,
    scoreBonus: 4.5,
    hypeGain: 4.2
  },
  {
    id: 'vma_vote_world_premiere',
    show: 'vmas',
    name: 'VMA Pre-Show Red Carpet & Global Fan Rally',
    subtitle: 'All-out global fan voting blitz + exclusive behind-the-scenes director cut',
    cost: 180000,
    scoreBonus: 6.5,
    hypeGain: 6.8
  }
];

/**
 * 20 Authentic GRAMMY Award Categories across General, Pop, Rap, R&B, Rock/Global/Dance, and Craft
 */
export const GRAMMY_CATEGORIES: AwardCategoryDef[] = [
  // 1. GENERAL FIELD (THE BIG FOUR)
  {
    id: 'grammy_roty',
    show: 'grammys',
    field: 'General Field',
    name: 'Record of the Year',
    shortName: 'Record of the Year',
    description: 'Awarded to the artist and production team for overall sonic excellence, cultural ubiquity, and chart-defining impact of a single track.',
    subjectType: 'song',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.42,
      chartImpact: 0.28,
      commercialVolume: 0.18,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_aoty',
    show: 'grammys',
    field: 'General Field',
    name: 'Album of the Year',
    shortName: 'Album of the Year',
    description: 'The Recording Academy’s highest honor for a cohesive full-length body of work demonstrating artistic mastery and era-defining cultural footprint.',
    subjectType: 'album',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.45,
      chartImpact: 0.25,
      commercialVolume: 0.20,
      visualVelocity: 0.02,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_soty',
    show: 'grammys',
    field: 'General Field',
    name: 'Song of the Year',
    shortName: 'Song of the Year',
    description: 'A songwriters’ award honoring lyrical depth, melodic composition, and structural brilliance of a song.',
    subjectType: 'song',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.52,
      chartImpact: 0.22,
      commercialVolume: 0.14,
      visualVelocity: 0.02,
      fanAndCulturalHype: 0.10
    }
  },
  {
    id: 'grammy_bna',
    show: 'grammys',
    field: 'General Field',
    name: 'Best New Artist',
    shortName: 'Best New Artist',
    description: 'Recognizes a breakthrough artist who achieved their first major public prominence and shifted the musical landscape during the eligibility year.',
    subjectType: 'artist',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.35,
      chartImpact: 0.25,
      commercialVolume: 0.20,
      visualVelocity: 0.08,
      fanAndCulturalHype: 0.12
    }
  },

  // 2. POP & DANCE POP FIELD
  {
    id: 'grammy_pop_solo',
    show: 'grammys',
    field: 'Pop & Dance Field',
    name: 'Best Pop Solo Performance',
    shortName: 'Pop Solo Performance',
    description: 'Honors outstanding vocal and artistic execution on a solo Pop recording.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['pop', 'synth', 'teen', 'indie pop', 'dance pop', 'k-pop'],
    weights: {
      qualityAndCraft: 0.40,
      chartImpact: 0.30,
      commercialVolume: 0.18,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_pop_duo',
    show: 'grammys',
    field: 'Pop & Dance Field',
    name: 'Best Pop Duo/Group Performance',
    shortName: 'Pop Duo/Group Performance',
    description: 'Honors collaborative chemistry and vocal synergy on a Pop collaboration or group release.',
    subjectType: 'collab',
    isMajor: false,
    genreFilter: ['pop', 'k-pop', 'dance', 'r&b', 'latin'],
    weights: {
      qualityAndCraft: 0.38,
      chartImpact: 0.30,
      commercialVolume: 0.20,
      visualVelocity: 0.05,
      fanAndCulturalHype: 0.07
    }
  },
  {
    id: 'grammy_pop_album',
    show: 'grammys',
    field: 'Pop & Dance Field',
    name: 'Best Pop Vocal Album',
    shortName: 'Pop Vocal Album',
    description: 'Awarded for excellence in vocal performance, production polish, and cohesion on a Pop album or EP.',
    subjectType: 'album',
    isMajor: false,
    genreFilter: ['pop', 'k-pop', 'dance'],
    weights: {
      qualityAndCraft: 0.42,
      chartImpact: 0.26,
      commercialVolume: 0.22,
      visualVelocity: 0.02,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_dance_pop',
    show: 'grammys',
    field: 'Pop & Dance Field',
    name: 'Best Dance Pop Recording',
    shortName: 'Dance Pop Recording',
    description: 'Celebrates vocal-driven, uptempo dance-pop production and club-ready sonic engineering.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['pop', 'dance', 'electronic', 'house', 'k-pop'],
    weights: {
      qualityAndCraft: 0.40,
      chartImpact: 0.25,
      commercialVolume: 0.20,
      visualVelocity: 0.07,
      fanAndCulturalHype: 0.08
    }
  },

  // 3. RAP / HIP-HOP FIELD
  {
    id: 'grammy_rap_perf',
    show: 'grammys',
    field: 'Rap / Hip-Hop Field',
    name: 'Best Rap Performance',
    shortName: 'Rap Performance',
    description: 'Honors cadence, flow, delivery, and commanding presence on a Hip-Hop or Rap track.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['hip-hop', 'rap', 'trap', 'drill'],
    weights: {
      qualityAndCraft: 0.42,
      chartImpact: 0.26,
      commercialVolume: 0.20,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_melodic_rap',
    show: 'grammys',
    field: 'Rap / Hip-Hop Field',
    name: 'Best Melodic Rap Performance',
    shortName: 'Melodic Rap Performance',
    description: 'Recognizes tracks blending rap cadences with sung melodies and contemporary R&B/Pop textures.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['hip-hop', 'rap', 'r&b', 'trap'],
    weights: {
      qualityAndCraft: 0.40,
      chartImpact: 0.28,
      commercialVolume: 0.20,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_rap_song',
    show: 'grammys',
    field: 'Rap / Hip-Hop Field',
    name: 'Best Rap Song',
    shortName: 'Best Rap Song',
    description: 'A songwriters’ award honoring lyrical wordplay, storytelling, and cultural resonance in Hip-Hop.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['hip-hop', 'rap', 'trap', 'drill'],
    weights: {
      qualityAndCraft: 0.50,
      chartImpact: 0.22,
      commercialVolume: 0.16,
      visualVelocity: 0.03,
      fanAndCulturalHype: 0.09
    }
  },
  {
    id: 'grammy_rap_album',
    show: 'grammys',
    field: 'Rap / Hip-Hop Field',
    name: 'Best Rap Album',
    shortName: 'Best Rap Album',
    description: 'Honors the year’s most acclaimed and culturally dominant Hip-Hop full-length project.',
    subjectType: 'album',
    isMajor: false,
    genreFilter: ['hip-hop', 'rap', 'trap', 'drill'],
    weights: {
      qualityAndCraft: 0.44,
      chartImpact: 0.26,
      commercialVolume: 0.20,
      visualVelocity: 0.02,
      fanAndCulturalHype: 0.08
    }
  },

  // 4. R&B FIELD
  {
    id: 'grammy_rnb_perf',
    show: 'grammys',
    field: 'R&B Field',
    name: 'Best R&B Performance',
    shortName: 'R&B Performance',
    description: 'Celebrates vocal control, emotional depth, and soulful execution on an R&B recording.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['r&b', 'soul', 'neo-soul', 'contemporary r&b'],
    weights: {
      qualityAndCraft: 0.46,
      chartImpact: 0.24,
      commercialVolume: 0.18,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_rnb_song',
    show: 'grammys',
    field: 'R&B Field',
    name: 'Best R&B Song',
    shortName: 'Best R&B Song',
    description: 'Honors songwriting, harmonic arrangement, and melody in R&B music.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['r&b', 'soul', 'neo-soul'],
    weights: {
      qualityAndCraft: 0.50,
      chartImpact: 0.22,
      commercialVolume: 0.16,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_rnb_album',
    show: 'grammys',
    field: 'R&B Field',
    name: 'Best Progressive R&B Album',
    shortName: 'Best R&B Album',
    description: 'Awarded to the most sonically rich and cohesive R&B album or project of the year.',
    subjectType: 'album',
    isMajor: false,
    genreFilter: ['r&b', 'soul'],
    weights: {
      qualityAndCraft: 0.46,
      chartImpact: 0.24,
      commercialVolume: 0.20,
      visualVelocity: 0.02,
      fanAndCulturalHype: 0.08
    }
  },

  // 5. ROCK, ALTERNATIVE, LATIN & GLOBAL FIELD
  {
    id: 'grammy_rock_alt',
    show: 'grammys',
    field: 'Rock, Alternative & Global',
    name: 'Best Rock / Alternative Performance',
    shortName: 'Rock / Alternative Performance',
    description: 'Honors raw instrumentation, boundary-pushing arrangement, and intensity in Rock or Alternative music.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['rock', 'alternative', 'indie', 'punk', 'metal'],
    weights: {
      qualityAndCraft: 0.48,
      chartImpact: 0.22,
      commercialVolume: 0.18,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },
  {
    id: 'grammy_latin_global',
    show: 'grammys',
    field: 'Rock, Alternative & Global',
    name: 'Best Música Urbana / Global Performance',
    shortName: 'Latin & Global Music',
    description: 'Celebrates global rhythmic excellence across Latin Urbana, Reggaeton, Afrobeats, and International Pop.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['latin', 'reggaeton', 'afrobeats', 'k-pop', 'j-pop', 'global', 'pop'],
    weights: {
      qualityAndCraft: 0.38,
      chartImpact: 0.28,
      commercialVolume: 0.22,
      visualVelocity: 0.05,
      fanAndCulturalHype: 0.07
    }
  },
  {
    id: 'grammy_dance_electronic',
    show: 'grammys',
    field: 'Rock, Alternative & Global',
    name: 'Best Dance/Electronic Recording',
    shortName: 'Dance/Electronic Recording',
    description: 'Honors innovative sound design, synthesis, and electronic music production.',
    subjectType: 'song',
    isMajor: false,
    genreFilter: ['electronic', 'dance', 'house', 'edm', 'pop'],
    weights: {
      qualityAndCraft: 0.45,
      chartImpact: 0.23,
      commercialVolume: 0.20,
      visualVelocity: 0.04,
      fanAndCulturalHype: 0.08
    }
  },

  // 6. PRODUCTION & VISUAL MEDIA FIELD
  {
    id: 'grammy_producer',
    show: 'grammys',
    field: 'Production & Visual Field',
    name: 'Producer of the Year, Non-Classical',
    shortName: 'Producer of the Year',
    description: 'Honors consistent studio engineering brilliance, sonic innovation, and hitmaking craft across the year.',
    subjectType: 'artist',
    isMajor: false,
    weights: {
      qualityAndCraft: 0.55,
      chartImpact: 0.22,
      commercialVolume: 0.15,
      visualVelocity: 0.02,
      fanAndCulturalHype: 0.06
    }
  },
  {
    id: 'grammy_music_video',
    show: 'grammys',
    field: 'Production & Visual Field',
    name: 'Best Music Video',
    shortName: 'Best Music Video',
    description: 'Awarded to the artist and visual director for cinematic storytelling and visual artistry in an official Music Video.',
    subjectType: 'video',
    isMajor: false,
    weights: {
      qualityAndCraft: 0.38,
      chartImpact: 0.14,
      commercialVolume: 0.10,
      visualVelocity: 0.30,
      fanAndCulturalHype: 0.08
    }
  }
];

/**
 * 16 Authentic MTV Video Music Awards (VMAs) Categories
 */
export const VMA_CATEGORIES: AwardCategoryDef[] = [
  // 1. MAJOR MOON PERSON CATEGORIES
  {
    id: 'vma_voty',
    show: 'vmas',
    field: 'Major Categories',
    name: 'Video of the Year',
    shortName: 'Video of the Year',
    description: 'MTV’s crown jewel Moon Person statue honoring the most iconic, high-velocity, culturally dominant Music Video of the year.',
    subjectType: 'video',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.20,
      chartImpact: 0.15,
      commercialVolume: 0.10,
      visualVelocity: 0.38,
      fanAndCulturalHype: 0.17
    }
  },
  {
    id: 'vma_aoty',
    show: 'vmas',
    field: 'Major Categories',
    name: 'Artist of the Year',
    shortName: 'Artist of the Year',
    description: 'Honors the superstar who dominated streaming, YouTube views, charts, and global stan culture over the past 12 months.',
    subjectType: 'artist',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.15,
      chartImpact: 0.22,
      commercialVolume: 0.22,
      visualVelocity: 0.21,
      fanAndCulturalHype: 0.20
    }
  },
  {
    id: 'vma_soty',
    show: 'vmas',
    field: 'Major Categories',
    name: 'Song of the Year',
    shortName: 'Song of the Year',
    description: 'Celebrates the most streamed, replayed, and inescapable hit single across global charts and social feeds.',
    subjectType: 'song',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.16,
      chartImpact: 0.28,
      commercialVolume: 0.26,
      visualVelocity: 0.14,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vma_bna',
    show: 'vmas',
    field: 'Major Categories',
    name: 'Best New Artist',
    shortName: 'Best New Artist',
    description: 'Fan-voted Moon Person recognizing the hottest rising star with explosive fanbase growth and viral momentum.',
    subjectType: 'artist',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.18,
      chartImpact: 0.20,
      commercialVolume: 0.18,
      visualVelocity: 0.22,
      fanAndCulturalHype: 0.22
    }
  },
  {
    id: 'vma_collab',
    show: 'vmas',
    field: 'Major Categories',
    name: 'Best Collaboration',
    shortName: 'Best Collaboration',
    description: 'Honors the most explosive joint release and music video event between two powerhouse artists.',
    subjectType: 'collab',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.16,
      chartImpact: 0.22,
      commercialVolume: 0.18,
      visualVelocity: 0.26,
      fanAndCulturalHype: 0.18
    }
  },
  {
    id: 'vma_summer',
    show: 'vmas',
    field: 'Major Categories',
    name: 'Song of the Summer',
    shortName: 'Song of the Summer',
    description: 'High-energy anthem driven by massive social engagement, playlist dominance, and fan-voted hype.',
    subjectType: 'song',
    isMajor: true,
    weights: {
      qualityAndCraft: 0.12,
      chartImpact: 0.26,
      commercialVolume: 0.24,
      visualVelocity: 0.16,
      fanAndCulturalHype: 0.22
    }
  },

  // 2. GENRE VIDEO CATEGORIES
  {
    id: 'vma_pop',
    show: 'vmas',
    field: 'Genre Video Categories',
    name: 'Best Pop',
    shortName: 'Best Pop Video',
    description: 'Awarded to the most visually captivating and heavily streamed Pop music video.',
    subjectType: 'video',
    isMajor: false,
    genreFilter: ['pop', 'dance pop', 'synth', 'indie pop'],
    weights: {
      qualityAndCraft: 0.18,
      chartImpact: 0.18,
      commercialVolume: 0.14,
      visualVelocity: 0.34,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vma_hiphop',
    show: 'vmas',
    field: 'Genre Video Categories',
    name: 'Best Hip-Hop',
    shortName: 'Best Hip-Hop Video',
    description: 'Celebrates visual swagger, cultural impact, and replay velocity in a Hip-Hop music video.',
    subjectType: 'video',
    isMajor: false,
    genreFilter: ['hip-hop', 'rap', 'trap', 'drill'],
    weights: {
      qualityAndCraft: 0.18,
      chartImpact: 0.18,
      commercialVolume: 0.14,
      visualVelocity: 0.34,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vma_rnb',
    show: 'vmas',
    field: 'Genre Video Categories',
    name: 'Best R&B',
    shortName: 'Best R&B Video',
    description: 'Honors sleek aesthetic mood, choreography, and vocal performance in an R&B visual.',
    subjectType: 'video',
    isMajor: false,
    genreFilter: ['r&b', 'soul', 'neo-soul'],
    weights: {
      qualityAndCraft: 0.20,
      chartImpact: 0.16,
      commercialVolume: 0.14,
      visualVelocity: 0.34,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vma_kpop',
    show: 'vmas',
    field: 'Genre Video Categories',
    name: 'Best K-Pop / Asian Pop',
    shortName: 'Best K-Pop',
    description: 'Honors high-concept visual production, synchronized performance, and massive global fanbase mobilization.',
    subjectType: 'video',
    isMajor: false,
    genreFilter: ['k-pop', 'j-pop', 'pop', 'dance'],
    weights: {
      qualityAndCraft: 0.16,
      chartImpact: 0.14,
      commercialVolume: 0.14,
      visualVelocity: 0.34,
      fanAndCulturalHype: 0.22
    }
  },
  {
    id: 'vma_latin',
    show: 'vmas',
    field: 'Genre Video Categories',
    name: 'Best Latin',
    shortName: 'Best Latin Video',
    description: 'Celebrates global YouTube juggernauts across Reggaeton, Latin Pop, and Música Urbana.',
    subjectType: 'video',
    isMajor: false,
    genreFilter: ['latin', 'reggaeton', 'urbana', 'pop'],
    weights: {
      qualityAndCraft: 0.16,
      chartImpact: 0.16,
      commercialVolume: 0.16,
      visualVelocity: 0.36,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vma_afrobeats',
    show: 'vmas',
    field: 'Genre Video Categories',
    name: 'Best Afrobeats',
    shortName: 'Best Afrobeats Video',
    description: 'Recognizes vibrant visual storytelling and infectious global rhythm in Afrobeats.',
    subjectType: 'video',
    isMajor: false,
    genreFilter: ['afrobeats', 'r&b', 'dance', 'pop'],
    weights: {
      qualityAndCraft: 0.18,
      chartImpact: 0.16,
      commercialVolume: 0.16,
      visualVelocity: 0.34,
      fanAndCulturalHype: 0.16
    }
  },
  {
    id: 'vma_rock_alt',
    show: 'vmas',
    field: 'Genre Video Categories',
    name: 'Best Rock / Alternative',
    shortName: 'Best Alternative Video',
    description: 'Honors striking visual concepts and performance energy in Rock and Alternative videos.',
    subjectType: 'video',
    isMajor: false,
    genreFilter: ['rock', 'alternative', 'indie', 'punk'],
    weights: {
      qualityAndCraft: 0.22,
      chartImpact: 0.16,
      commercialVolume: 0.14,
      visualVelocity: 0.32,
      fanAndCulturalHype: 0.16
    }
  },

  // 3. PROFESSIONAL & TECHNICAL CRAFT CATEGORIES
  {
    id: 'vma_direction',
    show: 'vmas',
    field: 'Technical & Craft',
    name: 'Best Direction',
    shortName: 'Best Direction',
    description: 'Honors visionary video direction, pacing, and narrative execution.',
    subjectType: 'video',
    isMajor: false,
    weights: {
      qualityAndCraft: 0.34,
      chartImpact: 0.12,
      commercialVolume: 0.10,
      visualVelocity: 0.32,
      fanAndCulturalHype: 0.12
    }
  },
  {
    id: 'vma_cinematography',
    show: 'vmas',
    field: 'Technical & Craft',
    name: 'Best Cinematography',
    shortName: 'Best Cinematography',
    description: 'Awarded for lighting, camera movement, color grading, and visual framing in a Music Video.',
    subjectType: 'video',
    isMajor: false,
    weights: {
      qualityAndCraft: 0.36,
      chartImpact: 0.10,
      commercialVolume: 0.10,
      visualVelocity: 0.32,
      fanAndCulturalHype: 0.12
    }
  },
  {
    id: 'vma_vfx_choreo',
    show: 'vmas',
    field: 'Technical & Craft',
    name: 'Best Visual Effects & Choreography',
    shortName: 'Best VFX & Choreography',
    description: 'Celebrates jaw-dropping visual effects, stage movement, and high-replay spectacle.',
    subjectType: 'video',
    isMajor: false,
    weights: {
      qualityAndCraft: 0.30,
      chartImpact: 0.12,
      commercialVolume: 0.10,
      visualVelocity: 0.34,
      fanAndCulturalHype: 0.14
    }
  }
];

export function getCategoriesForShow(show: AwardShowType): AwardCategoryDef[] {
  return show === 'grammys' ? GRAMMY_CATEGORIES : VMA_CATEGORIES;
}

export function doesGenreMatchCategory(itemGenre: string | undefined, category: AwardCategoryDef): boolean {
  if (!category.genreFilter || category.genreFilter.length === 0) return true;
  const normalized = (itemGenre || 'pop').toLowerCase();
  return category.genreFilter.some(f => normalized.includes(f.toLowerCase()) || f.toLowerCase().includes(normalized));
}
