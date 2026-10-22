// Dedicated animated cartoon assets system
// Provides 3D cartoon Pixar/animation-style avatars and illustrated animated cover arts.
// No real human photographs or realistic hardware photos.

import avatarBoy from '../assets/images/avatar_cartoon_boy_1789804995535.jpg';
import avatarPopGirl from '../assets/images/avatar_cartoon_pop_girl_1789805017691.jpg';
import avatarRapper from '../assets/images/avatar_cartoon_rapper_1789805036346.jpg';
import avatarAltGirl from '../assets/images/avatar_cartoon_alt_girl_1789805056221.jpg';
import avatarReggaeton from '../assets/images/avatar_cartoon_reggaeton_1789805149852.jpg';
import avatarRockstar from '../assets/images/avatar_cartoon_rockstar_1789805167591.jpg';

import coverCosmicBeats from '../assets/images/cover_cartoon_cosmic_beats_1789805182871.jpg';
import coverLofiRoom from '../assets/images/cover_cartoon_lofi_room_1789805072661.jpg';
import coverNeonStage from '../assets/images/cover_cartoon_neon_stage_1789805090861.jpg';

export interface AnimatedAvatarItem {
  id: string;
  name: string;
  style: string;
  url: string;
}

export const ANIMATED_AVATARS: Record<string, string> = {
  player_default: avatarBoy,
  boy_glasses: avatarBoy,
  pop_girl: avatarPopGirl,
  rapper_curly: avatarRapper,
  alt_girl_green: avatarAltGirl,
  reggaeton_star: avatarReggaeton,
  rockstar_wavy: avatarRockstar,
  
  // Specific NPC mappings
  npc1: avatarPopGirl, // Taylor Shift
  npc2: avatarRapper, // Drakeo
  npc3: avatarReggaeton, // Bad Bunnyito
  npc4: avatarAltGirl, // Billie Eyelash
  npc5: avatarRockstar, // The Kid Laro
  npc6: avatarPopGirl, // Rosalia X
};

export const PRESET_ANIMATED_AVATARS: AnimatedAvatarItem[] = [
  { id: 'boy_glasses', name: 'Artie (Cartoon Boy)', style: '3D Animated / Glasses', url: avatarBoy },
  { id: 'pop_girl', name: 'Stella (Pop Star)', style: '3D Animated / Ponytail', url: avatarPopGirl },
  { id: 'rapper_curly', name: 'Jaylen (Hip Hop)', style: '3D Animated / Streetwear', url: avatarRapper },
  { id: 'alt_girl_green', name: 'Vesper (Alt Pop)', style: '3D Animated / Neon Edge', url: avatarAltGirl },
  { id: 'reggaeton_star', name: 'Benito (Latin Star)', style: '3D Animated / Bucket Hat', url: avatarReggaeton },
  { id: 'rockstar_wavy', name: 'Milo (Rockstar)', style: '3D Animated / Denim Rock', url: avatarRockstar },
];

/**
 * 3D Animated and Illustrated Cartoon Album Cover Presets
 */
export const PRESET_ANIMATED_COVERS: string[] = [
  coverCosmicBeats,
  coverLofiRoom,
  coverNeonStage,
];

/**
 * Generates an SVG Data URL for a stylized 2D/3D cartoon-style illustrated album cover.
 * Features cute cartoon cassette tape, smiling vinyl, neon stars, pastel gradients, and playful stickers.
 */
export function generateCartoonSvgCover(artist: string, title: string): string {
  const seed = Math.abs(((artist || 'Artist') + (title || 'Song')).split('').reduce((acc, c) => (acc * 37 + c.charCodeAt(0)) | 0, 0));
  
  // Vibrant cartoon palettes
  const palettes = [
    { bg1: '#FF5E7E', bg2: '#FFAE64', accent: '#FFD700', text: '#FFFFFF', pill: '#845EC2', badge: 'POP BEATS' },
    { bg1: '#845EC2', bg2: '#D65DB1', accent: '#FF9671', text: '#FFFFFF', pill: '#FFC75F', badge: 'LO-FI GLOW' },
    { bg1: '#00C9A7', bg2: '#0081CF', accent: '#C4FCEF', text: '#FFFFFF', pill: '#FF8066', badge: 'NEON WAVE' },
    { bg1: '#4D8076', bg2: '#845EC2', accent: '#FEFEDF', text: '#FFFFFF', pill: '#FF6F91', badge: 'CHILL VIBES' },
    { bg1: '#FF9671', bg2: '#FFC75F', accent: '#FFFFFF', text: '#2C3E50', pill: '#0089BA', badge: 'SUMMER JAM' },
    { bg1: '#2C73D2', bg2: '#0081CF', accent: '#0089BA', text: '#FFFFFF', pill: '#FF9671', badge: 'CYBER CARTOON' },
    { bg1: '#D65DB1', bg2: '#FF6F91', accent: '#FFC75F', text: '#FFFFFF', pill: '#00C9A7', badge: 'ANIME SOUND' },
    { bg1: '#4B4453', bg2: '#B0A8B9', accent: '#FF8066', text: '#FFFFFF', pill: '#845EC2', badge: 'NIGHT BEAT' }
  ];

  const palette = palettes[seed % palettes.length];
  const safeArtist = (artist || 'Artist').replace(/[<>&"]/g, '');
  const safeTitle = (title || 'Track').replace(/[<>&"]/g, '');

  const iconVariants = [
    // Cute smiling vinyl
    `
      <circle cx="200" cy="180" r="95" fill="#1C1B29" stroke="${palette.accent}" stroke-width="4"/>
      <circle cx="200" cy="180" r="70" fill="#242335" stroke="#3A3854" stroke-width="2"/>
      <circle cx="200" cy="180" r="45" fill="${palette.pill}"/>
      <circle cx="200" cy="180" r="14" fill="#1C1B29"/>
      <!-- Cute cartoon face on vinyl center -->
      <circle cx="193" cy="176" r="3" fill="#FFFFFF"/>
      <circle cx="207" cy="176" r="3" fill="#FFFFFF"/>
      <path d="M 194 184 Q 200 189 206 184" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Highlight reflections -->
      <path d="M 140 140 A 85 85 0 0 1 240 105" stroke="rgba(255,255,255,0.4)" stroke-width="6" fill="none" stroke-linecap="round"/>
    `,
    // Cute cartoon cassette
    `
      <rect x="105" y="115" width="190" height="130" rx="18" fill="#1E1E2E" stroke="${palette.accent}" stroke-width="5"/>
      <rect x="125" y="135" width="150" height="75" rx="8" fill="#F8F9FA"/>
      <circle cx="165" cy="172" r="16" fill="#1E1E2E"/>
      <circle cx="235" cy="172" r="16" fill="#1E1E2E"/>
      <circle cx="165" cy="172" r="6" fill="#F8F9FA"/>
      <circle cx="235" cy="172" r="6" fill="#F8F9FA"/>
      <rect x="182" y="166" width="36" height="12" rx="3" fill="#D65DB1"/>
      <!-- Tape window line -->
      <line x1="165" y1="172" x2="235" y2="172" stroke="#1E1E2E" stroke-width="4"/>
    `,
    // Cute cartoon headphones
    `
      <path d="M 130 180 A 70 70 0 0 1 270 180" fill="none" stroke="${palette.pill}" stroke-width="14" stroke-linecap="round"/>
      <rect x="110" y="165" width="30" height="55" rx="14" fill="${palette.accent}" stroke="#1E1E2E" stroke-width="3"/>
      <rect x="260" y="165" width="30" height="55" rx="14" fill="${palette.accent}" stroke="#1E1E2E" stroke-width="3"/>
      <!-- Cute animated musical note -->
      <circle cx="200" cy="180" r="14" fill="#FFFFFF"/>
      <circle cx="225" cy="170" r="14" fill="#FFFFFF"/>
      <rect x="210" y="130" width="8" height="50" fill="#FFFFFF"/>
      <rect x="235" y="120" width="8" height="50" fill="#FFFFFF"/>
      <rect x="210" y="120" width="33" height="12" fill="#FFFFFF"/>
    `
  ];

  const chosenIcon = iconVariants[seed % iconVariants.length];

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
      <filter id="shadow_${seed}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-opacity="0.25" flood-color="#000"/>
      </filter>
    </defs>

    <!-- Cartoon Background Gradient -->
    <rect width="400" height="400" fill="url(#bgGrad_${seed})" />

    <!-- Cute cartoon bubbles / sparkles -->
    <circle cx="50" cy="60" r="18" fill="rgba(255,255,255,0.2)"/>
    <circle cx="340" cy="90" r="28" fill="rgba(255,255,255,0.15)"/>
    <circle cx="360" cy="270" r="12" fill="rgba(255,255,255,0.25)"/>
    <polygon points="70,120 74,130 84,134 74,138 70,148 66,138 56,134 66,130" fill="${palette.accent}" opacity="0.8"/>
    <polygon points="320,50 323,58 331,61 323,64 320,72 317,64 309,61 317,58" fill="${palette.accent}" opacity="0.9"/>
    <polygon points="90,260 93,267 100,270 93,273 90,280 87,273 80,270 87,267" fill="#FFFFFF" opacity="0.7"/>

    <!-- Top Badge / Sticker -->
    <g transform="translate(24, 28)">
      <rect x="0" y="0" width="108" height="28" rx="14" fill="${palette.pill}" filter="url(#shadow_${seed})"/>
      <text x="54" y="18" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" letter-spacing="1.5" text-anchor="middle">
        ${palette.badge}
      </text>
    </g>

    <!-- Central Cute Cartoon Art with Shadow -->
    <g filter="url(#shadow_${seed})">
      ${chosenIcon}
    </g>

    <!-- Bottom Typography Box -->
    <rect x="20" y="295" width="360" height="85" rx="18" fill="rgba(20, 18, 30, 0.75)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" filter="url(#shadow_${seed})"/>
    
    <text x="40" y="334" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="19" letter-spacing="-0.5">
      ${safeTitle.length > 24 ? safeTitle.substring(0, 22) + '...' : safeTitle}
    </text>
    
    <text x="40" y="358" fill="${palette.accent}" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" letter-spacing="0.5">
      ${safeArtist.toUpperCase()}
    </text>

    <!-- Star rating or cartoon logo bottom right -->
    <g transform="translate(325, 326)">
      <circle cx="15" cy="15" r="14" fill="${palette.pill}"/>
      <text x="15" y="20" fill="#FFFFFF" font-size="13" text-anchor="middle" font-weight="bold">★</text>
    </g>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves an animated / cartoon cover art.
 * Returns either one of our curated 3D animated covers or a dynamically generated cartoon cover art.
 */
export function resolveAnimatedCover(artist: string, title?: string): string {
  const t = title || 'Single';
  const seed = Math.abs(((artist || '') + t).split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0));
  
  // Use the 3D rendered covers for initial picks
  if (seed % 4 === 0) return coverCosmicBeats;
  if (seed % 4 === 1) return coverLofiRoom;
  if (seed % 4 === 2) return coverNeonStage;

  // Otherwise return colorful stylized cartoon SVG cover
  return generateCartoonSvgCover(artist, t);
}

/**
 * Returns an animated cartoon avatar for any NPC or player name.
 */
export function getAnimatedAvatar(idOrName: string): string {
  if (ANIMATED_AVATARS[idOrName]) {
    return ANIMATED_AVATARS[idOrName];
  }

  const lower = idOrName.toLowerCase();
  if (lower.includes('taylor') || lower.includes('pop') || lower.includes('rosalia')) return avatarPopGirl;
  if (lower.includes('drake') || lower.includes('kendrick') || lower.includes('rap')) return avatarRapper;
  if (lower.includes('bunny') || lower.includes('latin') || lower.includes('reggaeton')) return avatarReggaeton;
  if (lower.includes('billie') || lower.includes('alt') || lower.includes('dark')) return avatarAltGirl;
  if (lower.includes('laro') || lower.includes('rock') || lower.includes('punk')) return avatarRockstar;

  // Deterministic fallback from presets
  const hash = Math.abs(idOrName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  return PRESET_ANIMATED_AVATARS[hash % PRESET_ANIMATED_AVATARS.length].url;
}
