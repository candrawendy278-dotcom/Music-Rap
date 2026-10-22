// Dedicated Typography Cover Generator
// Creates clean, polished typographic album & single covers using the song/album title
// set against elegant, refined background palettes with subtle vinyl / studio accents.

export interface TypographyCoverOptions {
  title: string;
  artist: string;
  isAlbum?: boolean;
}

interface ColorPalette {
  bgStart: string;
  bgEnd: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  subtextColor: string;
  frameColor: string;
}

const PALETTES: ColorPalette[] = [
  // 1. Deep Midnight & Electric Neon
  {
    bgStart: '#0F172A',
    bgEnd: '#020617',
    accent: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#38BDF8',
    textColor: '#F8FAFC',
    subtextColor: '#94A3B8',
    frameColor: 'rgba(56, 189, 248, 0.25)'
  },
  // 2. Sunset Flame & Dark Ruby
  {
    bgStart: '#450A0A',
    bgEnd: '#1C0404',
    accent: '#F97316',
    badgeBg: 'rgba(249, 115, 22, 0.2)',
    badgeText: '#FB923C',
    textColor: '#FFF7ED',
    subtextColor: '#FDBA74',
    frameColor: 'rgba(249, 115, 22, 0.3)'
  },
  // 3. Deep Royal Violet & Magenta
  {
    bgStart: '#2E1065',
    bgEnd: '#0F0524',
    accent: '#D946EF',
    badgeBg: 'rgba(217, 70, 239, 0.18)',
    badgeText: '#E879F9',
    textColor: '#FAF5FF',
    subtextColor: '#C084FC',
    frameColor: 'rgba(217, 70, 239, 0.25)'
  },
  // 4. Emerald Forest & Obsidian
  {
    bgStart: '#064E3B',
    bgEnd: '#022C22',
    accent: '#34D399',
    badgeBg: 'rgba(52, 211, 153, 0.18)',
    badgeText: '#6EE7B7',
    textColor: '#ECFDF5',
    subtextColor: '#A7F3D0',
    frameColor: 'rgba(52, 211, 153, 0.25)'
  },
  // 5. Warm Ochre Amber & Dark Espresso
  {
    bgStart: '#3B2412',
    bgEnd: '#170E07',
    accent: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#FBBF24',
    textColor: '#FFFBEB',
    subtextColor: '#FCD34D',
    frameColor: 'rgba(245, 158, 11, 0.3)'
  },
  // 6. Deep Ocean Indigo & Cobalt
  {
    bgStart: '#1E1B4B',
    bgEnd: '#090822',
    accent: '#6366F1',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeText: '#818CF8',
    textColor: '#EEF2FF',
    subtextColor: '#A5B4FC',
    frameColor: 'rgba(99, 102, 241, 0.28)'
  },
  // 7. Minimal Charcoal & Silver
  {
    bgStart: '#1F2937',
    bgEnd: '#111827',
    accent: '#E5E7EB',
    badgeBg: 'rgba(255, 255, 255, 0.12)',
    badgeText: '#E5E7EB',
    textColor: '#FFFFFF',
    subtextColor: '#9CA3AF',
    frameColor: 'rgba(255, 255, 255, 0.2)'
  },
  // 8. Crimson Velvet & Gold
  {
    bgStart: '#500724',
    bgEnd: '#250210',
    accent: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.2)',
    badgeText: '#FDA4AF',
    textColor: '#FFF1F2',
    subtextColor: '#FECDD3',
    frameColor: 'rgba(244, 63, 94, 0.3)'
  }
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Splits text cleanly into up to 3 lines for visual balance.
 */
function wrapTitle(title: string, maxCharsPerLine = 15): string[] {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    if (title.length > maxCharsPerLine * 1.5) {
      return [title.substring(0, maxCharsPerLine), title.substring(maxCharsPerLine)];
    }
    return [title];
  }

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 2) break; // Limit to max 3 lines
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

/**
 * Generates a polished typography album/song cover as an SVG data URL.
 */
export function generateTypographyCover(title: string, artist: string, isAlbum = false): string {
  const cleanTitle = (title || 'Untitled Track').replace(/\s*\(Music Video\)/i, '').trim();
  const cleanArtist = (artist || 'Artist').trim();

  // Deterministic seed from title and artist
  const seedString = `${cleanArtist.toLowerCase()}_${cleanTitle.toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);
  const palette = PALETTES[seed % PALETTES.length];

  const lines = wrapTitle(cleanTitle, 16);
  const safeArtist = escapeXml(cleanArtist.toUpperCase());
  const tagText = isAlbum ? 'ALBUM MASTER' : (seed % 2 === 0 ? 'ORIGINAL TRACK' : 'OFFICIAL RELEASE');

  // Font size calculation based on line count and length
  const maxLineLen = Math.max(...lines.map(l => l.length));
  let fontSize = 32;
  if (lines.length === 3 || maxLineLen > 14) fontSize = 26;
  if (maxLineLen > 20) fontSize = 22;

  // Title vertical centering
  const lineHeight = fontSize * 1.22;
  const totalTitleHeight = lines.length * lineHeight;
  const startY = 200 - (totalTitleHeight / 2) + (fontSize * 0.7);

  const titleSvgLines = lines.map((line, idx) => {
    return `<text x="200" y="${startY + idx * lineHeight}" fill="${palette.textColor}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="-0.5" text-anchor="middle">${escapeXml(line)}</text>`;
  }).join('\n');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="grad_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgStart}" />
      <stop offset="100%" stop-color="${palette.bgEnd}" />
    </linearGradient>
    <radialGradient id="radial_${seed}" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Polished Background -->
  <rect width="400" height="400" fill="url(#grad_${seed})" />
  <rect width="400" height="400" fill="url(#radial_${seed})" />

  <!-- Subtle Vinyl Grooves for studio depth -->
  <circle cx="200" cy="200" r="165" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1.5" />
  <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1.5" />
  <circle cx="200" cy="200" r="95" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1.5" />

  <!-- Polished Minimal Frame -->
  <rect x="22" y="22" width="356" height="356" rx="16" fill="none" stroke="${palette.frameColor}" stroke-width="1.5" />

  <!-- Top Release Tag / Badge -->
  <g transform="translate(200, 56)">
    <rect x="-65" y="-12" width="130" height="24" rx="12" fill="${palette.badgeBg}" stroke="${palette.frameColor}" stroke-width="1"/>
    <text x="0" y="4" fill="${palette.badgeText}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="9" letter-spacing="1.5" text-anchor="middle">
      ${tagText}
    </text>
  </g>

  <!-- Polished Geometric Accent Line -->
  <line x1="160" y1="92" x2="240" y2="92" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round" opacity="0.8" />

  <!-- Prominent Song / Album Title -->
  <g filter="drop-shadow(0px 4px 12px rgba(0,0,0,0.5))">
    ${titleSvgLines}
  </g>

  <!-- Artist Subtitle -->
  <text x="200" y="${startY + totalTitleHeight + 20}" fill="${palette.subtextColor}" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="13" letter-spacing="2" text-anchor="middle">
    ${safeArtist}
  </text>

  <!-- Bottom Polished Sound Indicator & Spec -->
  <g transform="translate(42, 345)">
    <!-- Stereo Bars -->
    <rect x="0" y="4" width="3" height="8" rx="1" fill="${palette.accent}" opacity="0.6"/>
    <rect x="6" y="1" width="3" height="11" rx="1" fill="${palette.accent}" opacity="0.8"/>
    <rect x="12" y="5" width="3" height="7" rx="1" fill="${palette.accent}" opacity="0.5"/>
    <rect x="18" y="2" width="3" height="10" rx="1" fill="${palette.accent}" opacity="0.7"/>
    <text x="30" y="10" fill="${palette.subtextColor}" font-family="monospace" font-size="9" letter-spacing="1" opacity="0.7">
      STEREO // 24-BIT
    </text>
  </g>

  <text x="358" y="355" fill="${palette.subtextColor}" font-family="monospace" font-size="8.5" letter-spacing="0.5" text-anchor="end" opacity="0.6">
    NPC-MUSIC
  </text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Universal cover resolver for songs and albums using typography + polished background.
 */
export function resolveTypographyCover(artist: string, title?: string, isAlbum = false): string {
  return generateTypographyCover(title || 'Single Track', artist || 'Artist', isAlbum);
}

/**
 * Curated presets for manual cover art selection in the CoverArtPicker.
 */
export const PRESET_TYPOGRAPHY_COVERS = [
  generateTypographyCover('Starlight Symphony', 'Artist', false),
  generateTypographyCover('Cyber Boulevard', 'Artist', false),
  generateTypographyCover('Sugar Rush', 'Artist', false),
  generateTypographyCover('Lo-Fi Chill Hop', 'Artist', false),
  generateTypographyCover('Summer Groove', 'Artist', false),
  generateTypographyCover('Midnight Drive', 'Artist', false),
  generateTypographyCover('Golden Hour', 'Artist', false),
  generateTypographyCover('Electric Pulse', 'Artist', false),
  generateTypographyCover('Echoes in the Dark', 'Artist', true),
  generateTypographyCover('Nocturnal Horizon', 'Artist', true),
];
