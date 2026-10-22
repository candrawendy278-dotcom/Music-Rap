export interface ActiveTraining {
  isTraining: boolean;
  targetLevel: number;
  daysRemaining: number;
  totalDays: number;
}

export interface SubSkill {
  id: string;
  name: string;
  category: 'songwriting' | 'recording' | 'production';
  level: number;
  maxLevel: number;
  xp: number;
  xpToNextLevel: number;
  description: string;
  icon: string;
  bonusEffect: string;
  training?: ActiveTraining;
}

export interface PlayerSkillState {
  songwriting: {
    lyrics: SubSkill;
    storytelling: SubSkill;
    depth: SubSkill;
    melodyHook: SubSkill;
    themeConcept: SubSkill;
    emotionalResonance: SubSkill;
    wordplayPunchlines: SubSkill;
    songStructure: SubSkill;
    [key: string]: SubSkill;
  };
  recording: {
    vocalDelivery: SubSkill;
    flowCadence: SubSkill;
    pitchControl: SubSkill;
    vocalLayering: SubSkill;
    adLibCraft: SubSkill;
    breathControl: SubSkill;
    melodicCadence: SubSkill;
    timingPrecision: SubSkill;
    [key: string]: SubSkill;
  };
  production: {
    audioEngineering: SubSkill;
    dynamicProcessing: SubSkill;
    spatialAcoustics: SubSkill;
    beatSelection: SubSkill;
    vocalTuning: SubSkill;
    masteringPolish: SubSkill;
    [key: string]: SubSkill;
  };
  totalPointsSpent?: number;
  masteryRankTitle?: string;
}

// Initial Skill Tree Generator with 22 Comprehensive Skills
export function createInitialSkillState(): PlayerSkillState {
  return {
    songwriting: {
      lyrics: {
        id: 'lyrics',
        name: 'Lyrics & Rhyme Craft',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Multi-syllable rhyme patterns, internal rhyming, and clever poetic diction.',
        icon: 'ph-article',
        bonusEffect: '+4% Base Song Quality & higher listener appeal.'
      },
      storytelling: {
        id: 'storytelling',
        name: 'Storytelling & Narrative',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Compelling plot progression from verse one to outro, building emotional narrative arc.',
        icon: 'ph-book-open-text',
        bonusEffect: '+5% Listener retention & extended streaming longevity.'
      },
      depth: {
        id: 'depth',
        name: 'Philosophical Depth & Meaning',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Philosophical layers, thought-provoking wisdom, and profound existential concepts.',
        icon: 'ph-brain',
        bonusEffect: '+6% Critical acclaim & editorial playlist curations.'
      },
      melodyHook: {
        id: 'melodyHook',
        name: 'Melodic Hook & Catchiness',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Unforgettable earworm choruses designed to stick instantly in listeners\' heads.',
        icon: 'ph-music-notes',
        bonusEffect: '+8% Social virality & early streaming momentum.'
      },
      themeConcept: {
        id: 'themeConcept',
        name: 'Theme Conceptualization',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Visionary song concepts tapping into cultural zeitgeist and fresh narrative themes.',
        icon: 'ph-lightbulb-filament',
        bonusEffect: '+5% Media buzz & debut hype amplification.'
      },
      emotionalResonance: {
        id: 'emotionalResonance',
        name: 'Emotional Vulnerability',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Raw, honest emotional expression connecting intimately with fans.',
        icon: 'ph-heart-straight',
        bonusEffect: '+6% Fan conversion rate & core listener loyalty.'
      },
      wordplayPunchlines: {
        id: 'wordplayPunchlines',
        name: 'Wordplay & Metaphors',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Double entendres, razor-sharp metaphors, and unforgettable punchlines.',
        icon: 'ph-lightning',
        bonusEffect: '+5% Hip-Hop & Rap culture recognition and quote shares.'
      },
      songStructure: {
        id: 'songStructure',
        name: 'Structure & Arrangement',
        category: 'songwriting',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Dynamic transitions between verses, pre-chorus tension, and climactic bridges.',
        icon: 'ph-rows',
        bonusEffect: '+4% Track replayability & reduced skip rates.'
      }
    },
    recording: {
      vocalDelivery: {
        id: 'vocalDelivery',
        name: 'Vocal Delivery & Mic Charisma',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Commanding vocal presence, projection, and magnetic artist persona behind the microphone.',
        icon: 'ph-microphone-stage',
        bonusEffect: '+5% Recording quality boost & listener charisma impact.'
      },
      flowCadence: {
        id: 'flowCadence',
        name: 'Flow Dynamics & Cadence',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Flawless rhythmic pocket control, syncopated bounce, and smooth tempo shifts.',
        icon: 'ph-waveform',
        bonusEffect: '+5% Radio airplay consistency & natural groove.'
      },
      pitchControl: {
        id: 'pitchControl',
        name: 'Pitch Accuracy & Vocal Tone',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Tonal stability, accurate key intonation, and expressive vocal dynamics.',
        icon: 'ph-sliders-horizontal',
        bonusEffect: '+4% Clean vocal takes & harmonic fidelity.'
      },
      vocalLayering: {
        id: 'vocalLayering',
        name: 'Harmonies & Vocal Stacks',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Multi-tracked backing vocals, octave doublings, and lush vocal pads.',
        icon: 'ph-sparkle',
        bonusEffect: '+5% Spatial stereo width & rich sonic presence.'
      },
      adLibCraft: {
        id: 'adLibCraft',
        name: 'Signature Ad-Libs & Energy',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Punctual ad-libs, trademark vocal tags, and energetic background hype vocals.',
        icon: 'ph-megaphone',
        bonusEffect: '+4% Catchiness in club & party environments.'
      },
      breathControl: {
        id: 'breathControl',
        name: 'Breath Control & Endurance',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Diaphragm management enabling rapid-fire delivery without audio drop-outs.',
        icon: 'ph-wind',
        bonusEffect: '+4% High-speed cadence clarity & smooth takes.'
      },
      melodicCadence: {
        id: 'melodicCadence',
        name: 'Melodic Rap & Vocal Tuning',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Seamless blending of rapping cadence with pitched, singing melodies.',
        icon: 'ph-music-note-simple',
        bonusEffect: '+6% Cross-genre crossover appeal (Pop/Hip-Hop/R&B).'
      },
      timingPrecision: {
        id: 'timingPrecision',
        name: 'Micro-Timing & Pocket Groove',
        category: 'recording',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Precision bar-landing, triplets, and loose laid-back swing timing.',
        icon: 'ph-timer',
        bonusEffect: '+4% Production synchronization & DJ playback preference.'
      }
    },
    production: {
      audioEngineering: {
        id: 'audioEngineering',
        name: 'Mixing & EQ Balance',
        category: 'production',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Pristine frequency distribution, surgical EQ carving, and vocal sit-in-the-mix polish.',
        icon: 'ph-equalizer',
        bonusEffect: '+6% Audio engineering purity & DSP streaming compliance.'
      },
      dynamicProcessing: {
        id: 'dynamicProcessing',
        name: 'Dynamic Compression & Glue',
        category: 'production',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Optical and VCA compression yielding punchy vocals and warm analog saturation.',
        icon: 'ph-chart-line',
        bonusEffect: '+5% Punchy transient impact & speaker power.'
      },
      spatialAcoustics: {
        id: 'spatialAcoustics',
        name: 'Spatial Audio & Reverb Ambience',
        category: 'production',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Stereo delays, acoustic room modeling, and immersive headphone soundstage.',
        icon: 'ph-headphones',
        bonusEffect: '+5% Spatial audio ratings & headphone listening score.'
      },
      beatSelection: {
        id: 'beatSelection',
        name: 'Instrumental Chemistry & Beat Fit',
        category: 'production',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Instinct for selecting production instrumentals tailored specifically to the voice.',
        icon: 'ph-disc',
        bonusEffect: '+6% Instrumental synergy & club play resonance.'
      },
      vocalTuning: {
        id: 'vocalTuning',
        name: 'Vocal Pitch Tuning & Formant',
        category: 'production',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Modern pitch modulation, formant manipulation, and stylistic pitch-correction.',
        icon: 'ph-faders',
        bonusEffect: '+5% Modern streaming standard compatibility.'
      },
      masteringPolish: {
        id: 'masteringPolish',
        name: 'Commercial Mastering & Loudness',
        category: 'production',
        level: 1,
        maxLevel: 10,
        xp: 0,
        xpToNextLevel: 100,
        description: 'Brickwall limiting, multi-band stereo imaging, and competitive LUFS loudness.',
        icon: 'ph-speaker-high',
        bonusEffect: '+6% Overall master loudness & commercial radio impact.'
      }
    },
    totalPointsSpent: 0,
    masteryRankTitle: 'Rookie Songwriter'
  };
}

// Deeply ensure that all categories and subskills exist safely on the state
export function getEnsuredSkillState(skills?: any): PlayerSkillState {
  const defaultState = createInitialSkillState();
  if (!skills) return defaultState;

  const result: PlayerSkillState = {
    songwriting: { ...defaultState.songwriting },
    recording: { ...defaultState.recording },
    production: { ...defaultState.production },
    totalPointsSpent: skills.totalPointsSpent || 0,
    masteryRankTitle: skills.masteryRankTitle || 'Rookie Songwriter'
  };

  // Merge songwriting subskills safely
  if (skills.songwriting && typeof skills.songwriting === 'object') {
    Object.keys(defaultState.songwriting).forEach(key => {
      if (skills.songwriting[key]) {
        result.songwriting[key] = {
          ...defaultState.songwriting[key],
          ...skills.songwriting[key]
        };
      }
    });
  }

  // Merge recording subskills safely
  if (skills.recording && typeof skills.recording === 'object') {
    Object.keys(defaultState.recording).forEach(key => {
      if (skills.recording[key]) {
        result.recording[key] = {
          ...defaultState.recording[key],
          ...skills.recording[key]
        };
      }
    });
  }

  // Merge production subskills safely
  if (skills.production && typeof skills.production === 'object') {
    Object.keys(defaultState.production).forEach(key => {
      if (skills.production[key]) {
        result.production[key] = {
          ...defaultState.production[key],
          ...skills.production[key]
        };
      }
    });
  }

  return result;
}

// Upgrade Cost Formula
export function calculateSkillUpgradeCost(currentLevel: number): number {
  const baseCost = 450;
  return Math.round(baseCost * Math.pow(1.68, Math.max(1, currentLevel) - 1));
}

// Training Duration Formula: Higher level skills take significantly more days to master so progress feels earned
export function calculateTrainingDays(targetLevel: number): number {
  if (targetLevel <= 2) return 3;
  if (targetLevel === 3) return 4;
  if (targetLevel === 4) return 5;
  if (targetLevel === 5) return 7;
  if (targetLevel === 6) return 9;
  if (targetLevel === 7) return 12;
  if (targetLevel === 8) return 15;
  if (targetLevel === 9) return 18;
  return 21;
}

// Process daily training countdown when days advance
export function processDailySkillTraining(skills: PlayerSkillState): {
  updatedSkills: PlayerSkillState;
  completedTrainings: { skillName: string; newLevel: number }[];
} {
  const safe = getEnsuredSkillState(skills);
  const completed: { skillName: string; newLevel: number }[] = [];
  const nextSkills: PlayerSkillState = {
    songwriting: { ...safe.songwriting },
    recording: { ...safe.recording },
    production: { ...safe.production },
    totalPointsSpent: safe.totalPointsSpent || 0,
    masteryRankTitle: safe.masteryRankTitle || 'Rookie Songwriter'
  };

  const categories: ('songwriting' | 'recording' | 'production')[] = ['songwriting', 'recording', 'production'];

  categories.forEach(cat => {
    Object.keys(nextSkills[cat]).forEach(key => {
      const sub = nextSkills[cat][key];
      if (sub && sub.training && sub.training.isTraining) {
        if (sub.training.daysRemaining > 1) {
          nextSkills[cat][key] = {
            ...sub,
            training: {
              ...sub.training,
              daysRemaining: sub.training.daysRemaining - 1
            }
          };
        } else {
          // Completed training!
          const newLevel = sub.training.targetLevel;
          nextSkills[cat][key] = {
            ...sub,
            level: newLevel,
            training: undefined
          };
          completed.push({
            skillName: sub.name,
            newLevel
          });
        }
      }
    });
  });

  const nextRank = calculateMasteryRank(nextSkills);
  nextSkills.masteryRankTitle = nextRank.title;

  return {
    updatedSkills: nextSkills,
    completedTrainings: completed
  };
}

// Calculate Mastery Rank based on total subskill levels across all 3 disciplines
export function calculateMasteryRank(skills: PlayerSkillState): {
  title: string;
  score: number;
  maxScore: number;
  colorClass: string;
  nextRankTitle: string;
  nextRankScore: number;
  categoryAverages: {
    songwriting: number;
    recording: number;
    production: number;
  };
  averages: {
    songwriting: number;
    recording: number;
    production: number;
  };
} {
  const safe = getEnsuredSkillState(skills);

  const swValues = Object.values(safe.songwriting);
  const rcValues = Object.values(safe.recording);
  const prValues = Object.values(safe.production);

  const swLevels = swValues.reduce((sum, s) => sum + (s?.level || 1), 0);
  const rcLevels = rcValues.reduce((sum, s) => sum + (s?.level || 1), 0);
  const prLevels = prValues.reduce((sum, s) => sum + (s?.level || 1), 0);

  const totalLevels = swLevels + rcLevels + prLevels;
  const maxScore = (swValues.length + rcValues.length + prValues.length) * 10;

  const categoryAverages = {
    songwriting: Number((swLevels / Math.max(1, swValues.length)).toFixed(1)),
    recording: Number((rcLevels / Math.max(1, rcValues.length)).toFixed(1)),
    production: Number((prLevels / Math.max(1, prValues.length)).toFixed(1)),
  };

  if (totalLevels >= 180) {
    return { title: 'Legendary Maestro', score: totalLevels, maxScore, colorClass: 'text-amber-500', nextRankTitle: 'Max Rank Achieved', nextRankScore: maxScore, categoryAverages, averages: categoryAverages };
  }
  if (totalLevels >= 145) {
    return { title: 'Platinum Hitmaker', score: totalLevels, maxScore, colorClass: 'text-purple-600', nextRankTitle: 'Legendary Maestro', nextRankScore: 180, categoryAverages, averages: categoryAverages };
  }
  if (totalLevels >= 110) {
    return { title: 'Master Studio Icon', score: totalLevels, maxScore, colorClass: 'text-blue-600', nextRankTitle: 'Platinum Hitmaker', nextRankScore: 145, categoryAverages, averages: categoryAverages };
  }
  if (totalLevels >= 80) {
    return { title: 'Seasoned Pro Craftsman', score: totalLevels, maxScore, colorClass: 'text-emerald-600', nextRankTitle: 'Master Studio Icon', nextRankScore: 110, categoryAverages, averages: categoryAverages };
  }
  if (totalLevels >= 50) {
    return { title: 'Skilled Songsmith', score: totalLevels, maxScore, colorClass: 'text-teal-600', nextRankTitle: 'Seasoned Pro Craftsman', nextRankScore: 80, categoryAverages, averages: categoryAverages };
  }
  if (totalLevels >= 32) {
    return { title: 'Rising Talent', score: totalLevels, maxScore, colorClass: 'text-indigo-600', nextRankTitle: 'Skilled Songsmith', nextRankScore: 50, categoryAverages, averages: categoryAverages };
  }
  return { title: 'Rookie Songwriter', score: totalLevels, maxScore, colorClass: 'text-gray-600', nextRankTitle: 'Rising Talent', nextRankScore: 32, categoryAverages, averages: categoryAverages };
}

export function getSkillTierLabel(level: number): { label: string; badgeClass: string; badgeBg: string } {
  if (level >= 10) {
    const cls = 'bg-amber-500/15 text-amber-700 border-amber-300';
    return { label: 'Grandmaster', badgeClass: cls, badgeBg: cls };
  }
  if (level >= 8) {
    const cls = 'bg-purple-500/15 text-purple-700 border-purple-300';
    return { label: 'Virtuoso', badgeClass: cls, badgeBg: cls };
  }
  if (level >= 5) {
    const cls = 'bg-emerald-500/15 text-emerald-700 border-emerald-300';
    return { label: 'Pro Adept', badgeClass: cls, badgeBg: cls };
  }
  if (level >= 3) {
    const cls = 'bg-sky-500/15 text-sky-700 border-sky-300';
    return { label: 'Apprentice', badgeClass: cls, badgeBg: cls };
  }
  const cls = 'bg-neutral-100 text-neutral-600 border-neutral-200';
  return { label: 'Novice', badgeClass: cls, badgeBg: cls };
}

// Available Writing Themes in English
export interface WritingThemeOption {
  id: string;
  name: string;
  description: string;
  bestFitSubSkill: keyof PlayerSkillState['songwriting'];
  icon: string;
  bonusMultiplier: number;
}

export const WRITING_THEMES: WritingThemeOption[] = [
  {
    id: 'heartbreak_romance',
    name: 'Heartbreak & Romance',
    description: 'Emotional ballads, devastating romance, and universal heartbreak anthems.',
    bestFitSubSkill: 'storytelling',
    icon: 'ph-heart-break',
    bonusMultiplier: 1.08
  },
  {
    id: 'street_hustle',
    name: 'Street Hustle & Ambition',
    description: 'Grinding from the bottom, tireless work ethic, and triumphant underdog triumphs.',
    bestFitSubSkill: 'lyrics',
    icon: 'ph-fire',
    bonusMultiplier: 1.10
  },
  {
    id: 'deep_introspection',
    name: 'Deep Introspection & Truth',
    description: 'Intimate self-reflection, conquering inner demons, and honest existential peace.',
    bestFitSubSkill: 'depth',
    icon: 'ph-sparkle',
    bonusMultiplier: 1.12
  },
  {
    id: 'party_nightlife',
    name: 'Party, Club & High Energy',
    description: 'High-octane club anthems, midnight euphoria, and unstoppable celebration vibes.',
    bestFitSubSkill: 'melodyHook',
    icon: 'ph-confetti',
    bonusMultiplier: 1.09
  },
  {
    id: 'social_reality',
    name: 'Social Commentary & Reality',
    description: 'Sharp cultural critique, generational perspective, and undeniable street truth.',
    bestFitSubSkill: 'themeConcept',
    icon: 'ph-megaphone-simple',
    bonusMultiplier: 1.11
  },
  {
    id: 'luxury_confidence',
    name: 'Luxury & Unapologetic Confidence',
    description: 'Magnetic charismatic flexing, celebrating earned success, and lavish lifestyle.',
    bestFitSubSkill: 'wordplayPunchlines',
    icon: 'ph-crown',
    bonusMultiplier: 1.08
  }
];

// Available Meaning & Depth Options in English
export interface MeaningFocusOption {
  id: string;
  name: string;
  description: string;
  subSkillBonus: keyof PlayerSkillState['songwriting'];
  qualityWeight: number;
}

export const MEANING_FOCUS_OPTIONS: MeaningFocusOption[] = [
  {
    id: 'raw_authenticity',
    name: 'Raw Authenticity & Honesty',
    description: 'Stripped-back vulnerability, unfiltered lyrics, and genuine heartfelt connection.',
    subSkillBonus: 'emotionalResonance',
    qualityWeight: 1.12
  },
  {
    id: 'metaphorical_poetry',
    name: 'Metaphorical & Poetic Lore',
    description: 'Intricate symbolism, coded double meanings, and rich multi-layered lyrics.',
    subSkillBonus: 'depth',
    qualityWeight: 1.14
  },
  {
    id: 'catchy_earworm',
    name: 'Catchy & Instant Relatability',
    description: 'Instant hook delivery designed to embed itself in listener memory immediately.',
    subSkillBonus: 'melodyHook',
    qualityWeight: 1.10
  },
  {
    id: 'cinematic_narrative',
    name: 'Cinematic Narrative Arc',
    description: 'Vivid episodic storytelling with suspense, characters, and climactic emotional payoff.',
    subSkillBonus: 'storytelling',
    qualityWeight: 1.13
  }
];

// Available Recording Vocal Styles in English
export interface VocalStyleOption {
  id: string;
  name: string;
  description: string;
  bestFitSubSkill: keyof PlayerSkillState['recording'];
  vocalBoost: number;
}

export const RECORDING_VOCAL_STYLES: VocalStyleOption[] = [
  {
    id: 'melodic_harmonies',
    name: 'Melodic Rap & Vocal Stacks',
    description: 'Seamless sung-rap cadences blended with rich harmonic layers and silky tones.',
    bestFitSubSkill: 'vocalLayering',
    vocalBoost: 1.12
  },
  {
    id: 'aggressive_power',
    name: 'Aggressive Energy & Raw Punch',
    description: 'High-intensity mic projection, commanding vocal presence, and razor-sharp delivery.',
    bestFitSubSkill: 'vocalDelivery',
    vocalBoost: 1.10
  },
  {
    id: 'complex_flow',
    name: 'Technical Multi-Syllabic Flow',
    description: 'Complex rhythmic pocketing, chopper-speed cadences, and rapid bar transitions.',
    bestFitSubSkill: 'flowCadence',
    vocalBoost: 1.15
  },
  {
    id: 'smooth_laidback',
    name: 'Smooth, Chill & Silky Cadence',
    description: 'Effortless, laidback vocal cadence perfectly suited for late-night vibes.',
    bestFitSubSkill: 'pitchControl',
    vocalBoost: 1.08
  }
];

// Available Audio Mix & Master Approaches in English
export interface AudioEngineeringOption {
  id: string;
  name: string;
  description: string;
  bestFitSubSkill: keyof PlayerSkillState['production'];
  clarityMultiplier: number;
}

export const AUDIO_ENGINEERING_OPTIONS: AudioEngineeringOption[] = [
  {
    id: 'clean_commercial',
    name: 'Clean Commercial Polish',
    description: 'Surgical frequency separation, forward vocal sitting, and spotless radio polish.',
    bestFitSubSkill: 'audioEngineering',
    clarityMultiplier: 1.12
  },
  {
    id: 'spatial_immersive',
    name: 'Spatial 3D & Wide Atmosphere',
    description: 'Expansive binaural stereo reverb, stereo delays, and deep headphone immersion.',
    bestFitSubSkill: 'spatialAcoustics',
    clarityMultiplier: 1.14
  },
  {
    id: 'analog_warmth',
    name: 'Warm Analog Tape & Tube Glow',
    description: 'Warm tape compression harmonics, punchy transients, and retro sonic saturation.',
    bestFitSubSkill: 'dynamicProcessing',
    clarityMultiplier: 1.10
  }
];

// Calculate Songwriting Quality Output Based on Player Skills & Choices
export function calculateSongwritingQuality({
  skills,
  themeId,
  meaningId,
  writerType,
  writingDays,
  collabBonus = 0,
  applySessionVariance = false,
  deterministic
}: {
  skills: PlayerSkillState;
  themeId: string;
  meaningId: string;
  writerType: 'self' | 'pro';
  writingDays: number;
  collabBonus?: number;
  applySessionVariance?: boolean;
  deterministic?: boolean;
}): {
  finalQuality: number;
  minProjected: number;
  maxProjected: number;
  expectedRange: [number, number];
  breakdown: {
    base: number;
    baseQuality: number;
    skillBonus: number;
    themeSynergyBonus: number;
    meaningBonus: number;
    proBonus: number;
    writerBonus: number;
    daysBonus: number;
    collabBonus: number;
  };
} {
  const safe = getEnsuredSkillState(skills);
  const sw = safe.songwriting;
  
  const selectedTheme = WRITING_THEMES.find(t => t.id === themeId) || WRITING_THEMES[0];
  const selectedMeaning = MEANING_FOCUS_OPTIONS.find(m => m.id === meaningId) || MEANING_FOCUS_OPTIONS[0];

  const baseQuality = 20;
  const daysBonus = Math.round(writingDays * 1.4 * 10) / 10;
  const proBonus = writerType === 'pro' ? 9 : 0;

  const totalSkillRaw = 
    ((sw.lyrics?.level || 1) * 0.54) +
    ((sw.storytelling?.level || 1) * 0.52) +
    ((sw.depth?.level || 1) * 0.50) +
    ((sw.melodyHook?.level || 1) * 0.58) +
    ((sw.themeConcept?.level || 1) * 0.48) +
    ((sw.emotionalResonance?.level || 1) * 0.52) +
    ((sw.wordplayPunchlines?.level || 1) * 0.44) +
    ((sw.songStructure?.level || 1) * 0.48);

  const themeKey = selectedTheme.bestFitSubSkill;
  const themeSkillLevel = sw[themeKey]?.level || 1;
  const themeSynergyBonus = themeSkillLevel * 0.52 * selectedTheme.bonusMultiplier;

  const meaningKey = selectedMeaning.subSkillBonus;
  const meaningSkillLevel = sw[meaningKey]?.level || 1;
  const meaningBonus = meaningSkillLevel * 0.55 * (selectedMeaning.qualityWeight - 1.0) * 10;

  const expectedCore = baseQuality + daysBonus + proBonus + totalSkillRaw + themeSynergyBonus + meaningBonus + collabBonus;

  const avgSkillLevel = totalSkillRaw / 4.06;
  const maxPossibleForCurrentSkills = Math.min(100, Math.round(42 + (avgSkillLevel * 6.2) + (writerType === 'pro' ? 8 : 0) + (collabBonus > 0 ? 6 : 0)));

  const shouldRoll = deterministic !== undefined ? !deterministic : applySessionVariance;
  const inspirationRoll = shouldRoll ? ((Math.random() * 12) - 5) : 0;
  const calculatedQuality = expectedCore + inspirationRoll;

  const finalQuality = Math.min(maxPossibleForCurrentSkills, Math.max(18, Math.round(calculatedQuality * 10) / 10));
  const minProjected = Math.min(maxPossibleForCurrentSkills, Math.max(18, Math.round((expectedCore - 5) * 10) / 10));
  const maxProjected = Math.min(maxPossibleForCurrentSkills, Math.max(18, Math.round((expectedCore + 7) * 10) / 10));

  return {
    finalQuality,
    minProjected,
    maxProjected,
    expectedRange: [Math.round(minProjected), Math.round(maxProjected)],
    breakdown: {
      base: baseQuality,
      baseQuality,
      skillBonus: Math.round(totalSkillRaw * 10) / 10,
      themeSynergyBonus: Math.round(themeSynergyBonus * 10) / 10,
      meaningBonus: Math.round(meaningBonus * 10) / 10,
      proBonus,
      writerBonus: proBonus,
      daysBonus,
      collabBonus
    }
  };
}

// Calculate Recording Quality Boost Based on Player Skills & Choices
export function calculateRecordingQualityBoost({
  skills,
  currentSongQuality,
  vocalStyleId,
  audioEngineeringId,
  studioType,
  recordingDays,
  applySessionVariance = false,
  deterministic
}: {
  skills: PlayerSkillState;
  currentSongQuality: number;
  vocalStyleId: string;
  audioEngineeringId: string;
  studioType: 'home' | 'pro';
  recordingDays: number;
  applySessionVariance?: boolean;
  deterministic?: boolean;
}): {
  qualityBoost: number;
  finalQuality: number;
  minFinalQuality: number;
  maxFinalQuality: number;
  expectedRange: [number, number];
  breakdown: {
    studioBase: number;
    skillsBoost: number;
    vocalSynergy: number;
    audioSynergy: number;
    durationBoost: number;
  };
} {
  const safe = getEnsuredSkillState(skills);
  const rc = safe.recording;
  const pr = safe.production;

  const selectedVocal = RECORDING_VOCAL_STYLES.find(v => v.id === vocalStyleId) || RECORDING_VOCAL_STYLES[0];
  const selectedAudio = AUDIO_ENGINEERING_OPTIONS.find(a => a.id === audioEngineeringId) || AUDIO_ENGINEERING_OPTIONS[0];

  const studioBase = studioType === 'pro' ? 5.5 : 2.0;
  const durationBoost = Math.round(recordingDays * (studioType === 'pro' ? 1.1 : 0.5) * 10) / 10;

  const rcScore = 
    ((rc.vocalDelivery?.level || 1) * 0.34) +
    ((rc.flowCadence?.level || 1) * 0.30) +
    ((rc.pitchControl?.level || 1) * 0.30) +
    ((rc.vocalLayering?.level || 1) * 0.26) +
    ((rc.adLibCraft?.level || 1) * 0.22) +
    ((rc.breathControl?.level || 1) * 0.22) +
    ((rc.melodicCadence?.level || 1) * 0.30) +
    ((rc.timingPrecision?.level || 1) * 0.24);

  const prScore = 
    ((pr.audioEngineering?.level || 1) * 0.28) +
    ((pr.dynamicProcessing?.level || 1) * 0.24) +
    ((pr.spatialAcoustics?.level || 1) * 0.22) +
    ((pr.beatSelection?.level || 1) * 0.24) +
    ((pr.vocalTuning?.level || 1) * 0.22) +
    ((pr.masteringPolish?.level || 1) * 0.26);

  const skillsBoost = (rcScore + prScore) * 0.48;

  const vocalKey = selectedVocal.bestFitSubSkill;
  const vocalSkillLevel = rc[vocalKey]?.level || 1;
  const vocalSynergy = vocalSkillLevel * 0.34 * selectedVocal.vocalBoost;

  const audioKey = selectedAudio.bestFitSubSkill;
  const audioSkillLevel = pr[audioKey]?.level || 1;
  const audioSynergy = audioSkillLevel * 0.38 * selectedAudio.clarityMultiplier;

  const expectedBoost = studioBase + durationBoost + skillsBoost + vocalSynergy + audioSynergy;
  const shouldRoll = deterministic !== undefined ? !deterministic : applySessionVariance;
  const sessionRoll = shouldRoll ? ((Math.random() * 6) - 2) : 0;

  const totalBoost = expectedBoost + sessionRoll;
  const roundedBoost = Math.max(2, Math.round(totalBoost * 10) / 10);

  const maxRecordingMasterCap = Math.min(100, Math.round(currentSongQuality + 26));
  const finalQuality = Math.min(maxRecordingMasterCap, Math.round((currentSongQuality + roundedBoost) * 10) / 10);
  const minFinalQuality = Math.min(maxRecordingMasterCap, Math.round((currentSongQuality + Math.max(2, expectedBoost - 2)) * 10) / 10);
  const maxFinalQuality = Math.min(maxRecordingMasterCap, Math.round((currentSongQuality + expectedBoost + 4) * 10) / 10);

  return {
    qualityBoost: roundedBoost,
    finalQuality,
    minFinalQuality,
    maxFinalQuality,
    expectedRange: [Math.round(minFinalQuality), Math.round(maxFinalQuality)],
    breakdown: {
      studioBase,
      skillsBoost: Math.round(skillsBoost * 10) / 10,
      vocalSynergy: Math.round(vocalSynergy * 10) / 10,
      audioSynergy: Math.round(audioSynergy * 10) / 10,
      durationBoost
    }
  };
}

