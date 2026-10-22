// Flat 2D vector game icon avatars matching the reference circular vector style
// Features vibrant circular backdrops, 45-degree diagonal flat long-shadows, and clean minimalist character shapes.

export interface FlatAvatarItem {
  id: string;
  name: string;
  role: string;
  url: string;
}

// Helper to encode SVG into Data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

// 1. Wizard with pointy star hat & beard (Purple Circle)
export const avatarWizard = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip1"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#47316A"/>
  <g clip-path="url(#circleClip1)">
    <!-- 45-degree flat long shadow -->
    <path d="M 100 60 L 200 160 L 200 200 L 90 200 Z" fill="#000000" opacity="0.18"/>
    <!-- Robe / Body -->
    <path d="M 60 200 L 60 150 Q 100 135 140 150 L 140 200 Z" fill="#6B78B4"/>
    <!-- Face -->
    <ellipse cx="100" cy="120" rx="36" ry="34" fill="#FCD0B4"/>
    <!-- Eyes -->
    <circle cx="88" cy="122" r="4.5" fill="#2D1C3B"/>
    <circle cx="112" cy="122" r="4.5" fill="#2D1C3B"/>
    <!-- White Beard -->
    <path d="M 72 125 Q 68 175 100 185 Q 132 175 128 125 Q 100 148 72 125 Z" fill="#E8EEF5"/>
    <!-- Pointy Wizard Hat with curve -->
    <path d="M 45 105 Q 100 90 155 105 Q 100 80 45 105 Z" fill="#7888C8"/>
    <path d="M 62 98 Q 78 50 115 32 Q 108 55 130 98 Z" fill="#5867AA"/>
    <!-- Star on hat -->
    <polygon points="105,48 107,53 112,54 108,58 109,63 105,60 101,63 102,58 98,54 103,53" fill="#FEE56C"/>
    <polygon points="88,68 89,72 93,73 90,76 91,80 88,78 85,80 86,76 83,73 87,72" fill="#FEE56C"/>
  </g>
</svg>
`);

// 2. Forest Ranger / Elf (Dark Green Circle)
export const avatarElf = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip2"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#38493F"/>
  <g clip-path="url(#circleClip2)">
    <path d="M 100 65 L 200 165 L 200 200 L 90 200 Z" fill="#000000" opacity="0.18"/>
    <!-- Quiver and arrows on back -->
    <rect x="52" y="130" width="16" height="45" rx="4" transform="rotate(-30 52 130)" fill="#78593F"/>
    <polygon points="46,118 42,126 50,126" fill="#F3F5F7"/>
    <polygon points="56,112 52,120 60,120" fill="#F3F5F7"/>
    <!-- Body / Tunic -->
    <path d="M 58 200 L 65 145 Q 100 135 135 145 L 142 200 Z" fill="#84A747"/>
    <line x1="100" y1="145" x2="135" y2="185" stroke="#5E432A" stroke-width="8" stroke-linecap="round"/>
    <!-- Face inside hood -->
    <ellipse cx="100" cy="120" rx="34" ry="32" fill="#F8CEB3"/>
    <!-- Eyes and blush -->
    <circle cx="90" cy="122" r="4.5" fill="#2C3531"/>
    <circle cx="110" cy="122" r="4.5" fill="#2C3531"/>
    <!-- Elf Pointy Ears -->
    <polygon points="68,118 52,106 69,128" fill="#F8CEB3"/>
    <polygon points="132,118 148,106 131,128" fill="#F8CEB3"/>
    <!-- Green Hood covering head -->
    <path d="M 68 128 Q 66 70 100 55 Q 134 70 132 128 Q 100 110 68 128 Z" fill="#91B64F"/>
    <!-- Hood opening rim -->
    <ellipse cx="100" cy="115" rx="27" ry="29" fill="none" stroke="#789D3C" stroke-width="5"/>
  </g>
</svg>
`);

// 3. Horned Viking / Warrior (Deep Brown Circle)
export const avatarWarrior = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip3"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#452718"/>
  <g clip-path="url(#circleClip3)">
    <path d="M 100 70 L 200 170 L 200 200 L 110 200 Z" fill="#000000" opacity="0.18"/>
    <!-- Armor Body -->
    <path d="M 50 200 L 60 150 Q 100 140 140 150 L 150 200 Z" fill="#A8B2BF"/>
    <!-- Beard / Fur -->
    <path d="M 65 125 Q 60 180 100 190 Q 140 180 135 125 Z" fill="#DDE3EB"/>
    <!-- Face -->
    <ellipse cx="100" cy="118" rx="34" ry="30" fill="#FAD1B6"/>
    <circle cx="89" cy="118" r="4.5" fill="#3D2B1F"/>
    <circle cx="111" cy="118" r="4.5" fill="#3D2B1F"/>
    <!-- Red warrior mouth / tongue accent -->
    <polygon points="96,140 104,140 100,154" fill="#C43838"/>
    <!-- Helmet with Horns -->
    <path d="M 66 112 Q 68 70 100 68 Q 132 70 134 112 Q 100 100 66 112 Z" fill="#CCD4DD"/>
    <rect x="64" y="105" width="72" height="12" rx="4" fill="#A4B0BE"/>
    <!-- Left Horn -->
    <path d="M 72 90 Q 45 80 50 48 Q 66 65 78 82 Z" fill="#FFFFFF"/>
    <!-- Right Horn -->
    <path d="M 128 90 Q 155 80 150 48 Q 134 65 122 82 Z" fill="#FFFFFF"/>
  </g>
</svg>
`);

// 4. Shadow Ninja (Warm Taupe Circle)
export const avatarNinja = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip4"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#887870"/>
  <g clip-path="url(#circleClip4)">
    <path d="M 100 70 L 200 170 L 200 200 L 95 200 Z" fill="#000000" opacity="0.2"/>
    <!-- Ninja Robe -->
    <path d="M 55 200 L 62 145 Q 100 135 138 145 L 145 200 Z" fill="#2E2C31"/>
    <!-- Sword strap -->
    <line x1="72" y1="140" x2="132" y2="185" stroke="#524F57" stroke-width="12"/>
    <!-- Mask / Hood -->
    <path d="M 60 135 Q 58 65 100 60 Q 142 65 140 135 Q 100 175 60 135 Z" fill="#232126"/>
    <!-- Mask eye slit cutout -->
    <path d="M 72 110 Q 100 95 128 110 Q 100 128 72 110 Z" fill="#FAD1B6"/>
    <!-- Ninja focused eyes -->
    <circle cx="88" cy="112" r="4.5" fill="#18151B"/>
    <circle cx="112" cy="112" r="4.5" fill="#18151B"/>
  </g>
</svg>
`);

// 5. Pop Star / Angel Healer (Pastel Rose Pink Circle)
export const avatarPopStar = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip5"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#EA7D9C"/>
  <g clip-path="url(#circleClip5)">
    <path d="M 100 75 L 200 175 L 200 200 L 105 200 Z" fill="#000000" opacity="0.18"/>
    <!-- Pop Star Dress / Collar -->
    <path d="M 60 200 L 70 148 Q 100 138 130 148 L 140 200 Z" fill="#FFFFFF"/>
    <!-- Neck -->
    <rect x="90" y="132" width="20" height="20" fill="#F8CEB3"/>
    <!-- Blonde Hair behind -->
    <circle cx="100" cy="115" r="45" fill="#FCE16E"/>
    <!-- Face -->
    <ellipse cx="100" cy="118" rx="32" ry="30" fill="#FAD1B6"/>
    <circle cx="89" cy="118" r="4.5" fill="#2E2136"/>
    <circle cx="111" cy="118" r="4.5" fill="#2E2136"/>
    <!-- Cute forehead star mark / bindi -->
    <polygon points="100,98 102,102 106,103 103,106 104,110 100,108 96,110 97,106 94,103 98,102" fill="#E84F70"/>
    <!-- Cute Pop Headpiece / Cap -->
    <path d="M 80 82 Q 100 68 120 82 L 118 96 L 82 96 Z" fill="#FFFFFF"/>
    <rect x="96" y="86" width="8" height="2" fill="#91D380"/>
    <rect x="99" y="83" width="2" height="8" fill="#91D380"/>
  </g>
</svg>
`);

// 6. Street Explorer / Traveler (Deep Navy Circle)
export const avatarExplorer = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip6"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#22486A"/>
  <g clip-path="url(#circleClip6)">
    <path d="M 100 70 L 200 170 L 200 200 L 95 200 Z" fill="#000000" opacity="0.2"/>
    <!-- Orange Jacket & White Collar -->
    <path d="M 52 200 L 62 145 Q 100 135 138 145 L 148 200 Z" fill="#ED6335"/>
    <polygon points="100,150 82,185 118,185" fill="#FFFFFF"/>
    <!-- Face -->
    <ellipse cx="100" cy="120" rx="33" ry="30" fill="#F8CEB3"/>
    <!-- Eyes and small nose -->
    <circle cx="89" cy="120" r="4.5" fill="#1C2833"/>
    <circle cx="111" cy="120" r="4.5" fill="#1C2833"/>
    <!-- Fur / Trapper Winter Hat -->
    <rect x="62" y="78" width="76" height="38" rx="14" fill="#EFE8D6"/>
    <rect x="88" y="86" width="12" height="10" rx="2" fill="#D84B29"/>
  </g>
</svg>
`);

// 7. Urban Bandana Rebel (Crimson Red Circle)
export const avatarRebel = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip7"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#B2282C"/>
  <g clip-path="url(#circleClip7)">
    <path d="M 100 70 L 200 170 L 200 200 L 95 200 Z" fill="#000000" opacity="0.2"/>
    <!-- Streetwear Hoodie / Tee -->
    <path d="M 55 200 L 62 145 Q 100 135 138 145 L 145 200 Z" fill="#6B4029"/>
    <!-- Red Neckband -->
    <ellipse cx="100" cy="148" rx="28" ry="14" fill="#D63A3F"/>
    <!-- Face -->
    <ellipse cx="100" cy="120" rx="34" ry="30" fill="#FAD1B6"/>
    <circle cx="88" cy="122" r="4.5" fill="#201C1A"/>
    <circle cx="112" cy="122" r="4.5" fill="#201C1A"/>
    <!-- Black Hair & Headband -->
    <path d="M 64 112 Q 62 70 100 65 Q 138 70 136 112 Z" fill="#2B2726"/>
    <rect x="62" y="98" width="76" height="15" rx="4" fill="#3D3735"/>
  </g>
</svg>
`);

// 8. Wise Sage / Beatmaker (Warm Gold Circle)
export const avatarSage = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip8"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#F3A93B"/>
  <g clip-path="url(#circleClip8)">
    <path d="M 100 75 L 200 175 L 200 200 L 105 200 Z" fill="#000000" opacity="0.18"/>
    <!-- Robe -->
    <path d="M 55 200 L 65 150 Q 100 140 135 150 L 145 200 Z" fill="#DC7A38"/>
    <path d="M 75 160 L 135 200 L 145 200 L 95 150 Z" fill="#FFFFFF"/>
    <!-- Red Bead Necklace -->
    <circle cx="78" cy="155" r="4" fill="#B72727"/>
    <circle cx="88" cy="162" r="4" fill="#B72727"/>
    <circle cx="100" cy="165" r="4.5" fill="#B72727"/>
    <circle cx="112" cy="162" r="4" fill="#B72727"/>
    <circle cx="122" cy="155" r="4" fill="#B72727"/>
    <!-- Clean Round Face -->
    <circle cx="100" cy="120" r="32" fill="#F8CEB3"/>
    <circle cx="89" cy="120" r="4.5" fill="#33241C"/>
    <circle cx="111" cy="120" r="4.5" fill="#33241C"/>
    <!-- Forehead Red Dot -->
    <circle cx="100" cy="104" r="3.5" fill="#B72727"/>
  </g>
</svg>
`);

// 9. Pirate Captain / Hip-Hop Pirate (Cyan Blue Circle)
export const avatarPirate = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip9"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#1B8BB5"/>
  <g clip-path="url(#circleClip9)">
    <path d="M 100 70 L 200 170 L 200 200 L 95 200 Z" fill="#000000" opacity="0.22"/>
    <!-- Coat & Shirt -->
    <path d="M 52 200 L 60 145 Q 100 135 140 145 L 148 200 Z" fill="#205067"/>
    <rect x="92" y="145" width="16" height="55" fill="#F2A03D"/>
    <!-- Face -->
    <ellipse cx="100" cy="122" rx="33" ry="30" fill="#FAD1B6"/>
    <!-- Right eye normal -->
    <circle cx="112" cy="122" r="4.5" fill="#16181A"/>
    <!-- Left eye patch with strap -->
    <line x1="68" y1="110" x2="132" y2="132" stroke="#16181A" stroke-width="3"/>
    <ellipse cx="88" cy="122" rx="7" ry="8" fill="#16181A"/>
    <!-- Pirate Bicorne Hat with Skull -->
    <path d="M 45 105 Q 100 85 155 105 Q 170 80 150 65 Q 100 80 50 65 Q 30 80 45 105 Z" fill="#1E1E22"/>
    <!-- White Skull & Crossbones on hat -->
    <circle cx="100" cy="74" r="7" fill="#FFFFFF"/>
    <circle cx="97" cy="74" r="1.5" fill="#1E1E22"/>
    <circle cx="103" cy="74" r="1.5" fill="#1E1E22"/>
    <line x1="92" y1="84" x2="108" y2="84" stroke="#FFFFFF" stroke-width="2"/>
    <line x1="94" y1="78" x2="106" y2="88" stroke="#FFFFFF" stroke-width="1.5"/>
    <line x1="106" y1="78" x2="94" y2="88" stroke="#FFFFFF" stroke-width="1.5"/>
  </g>
</svg>
`);

// 10. Hip Hop DJ / Street Producer (Vibrant Teal Circle)
export const avatarDJ = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip10"><circle cx="100" cy="100" r="98"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#00A896"/>
  <g clip-path="url(#circleClip10)">
    <path d="M 100 70 L 200 170 L 200 200 L 95 200 Z" fill="#000000" opacity="0.18"/>
    <!-- Streetwear Jacket -->
    <path d="M 55 200 L 62 148 Q 100 138 138 148 L 145 200 Z" fill="#1E272C"/>
    <!-- Gold Chain -->
    <path d="M 85 152 Q 100 175 115 152" fill="none" stroke="#F4C430" stroke-width="4"/>
    <!-- Face -->
    <ellipse cx="100" cy="120" rx="33" ry="30" fill="#E8B594"/>
    <circle cx="89" cy="120" r="4.5" fill="#2C241E"/>
    <circle cx="111" cy="120" r="4.5" fill="#2C241E"/>
    <!-- Backwards Baseball Cap -->
    <path d="M 68 110 Q 68 72 100 70 Q 132 72 132 110 Z" fill="#F45B69"/>
    <rect x="74" y="105" width="52" height="8" rx="3" fill="#D63A48"/>
    <!-- Big Studio DJ Headphones -->
    <path d="M 64 125 A 40 40 0 0 1 136 125" fill="none" stroke="#FFFFFF" stroke-width="6"/>
    <rect x="58" y="112" width="12" height="26" rx="6" fill="#F4C430"/>
    <rect x="130" y="112" width="12" height="26" rx="6" fill="#F4C430"/>
  </g>
</svg>
`);

// Preset List for the avatar picker
export const PRESET_FLAT_AVATARS: FlatAvatarItem[] = [
  { id: 'wizard', name: 'Sorcerer', role: 'Classic Wizard', url: avatarWizard },
  { id: 'elf', name: 'Forest Elf', role: 'Ranger Archer', url: avatarElf },
  { id: 'warrior', name: 'Viking', role: 'Horned Warrior', url: avatarWarrior },
  { id: 'ninja', name: 'Shadow Ninja', role: 'Stealth Shinobi', url: avatarNinja },
  { id: 'pop_star', name: 'Pop Princess', role: 'Chart Queen', url: avatarPopStar },
  { id: 'explorer', name: 'Street Explorer', role: 'City Adventurer', url: avatarExplorer },
  { id: 'rebel', name: 'Urban Rebel', role: 'Bandana Street', url: avatarRebel },
  { id: 'sage', name: 'Wise Sage', role: 'Zen Beatmaker', url: avatarSage },
  { id: 'pirate', name: 'Captain Skull', role: 'Pirate King', url: avatarPirate },
  { id: 'dj', name: 'Neon DJ', role: 'Hit Producer', url: avatarDJ },
];

export const FLAT_AVATARS: Record<string, string> = {
  player_default: avatarRebel,
  wizard: avatarWizard,
  elf: avatarElf,
  warrior: avatarWarrior,
  ninja: avatarNinja,
  pop_star: avatarPopStar,
  explorer: avatarExplorer,
  rebel: avatarRebel,
  sage: avatarSage,
  pirate: avatarPirate,
  dj: avatarDJ,

  // NPC mappings
  npc1: avatarPopStar, // Taylor Shift
  npc2: avatarDJ, // Drakeo
  npc3: avatarPirate, // Bad Bunnyito
  npc4: avatarNinja, // Billie Eyelash
  npc5: avatarRebel, // The Kid Laro
  npc6: avatarElf, // Rosalia X
};

/**
 * Returns a clean flat 2D game icon avatar for any NPC or name.
 */
export function getFlatGameAvatar(idOrName: string): string {
  if (FLAT_AVATARS[idOrName]) {
    return FLAT_AVATARS[idOrName];
  }

  const lower = idOrName.toLowerCase();
  if (lower.includes('taylor') || lower.includes('pop') || lower.includes('rosalia')) return avatarPopStar;
  if (lower.includes('drake') || lower.includes('kendrick') || lower.includes('rap') || lower.includes('dj')) return avatarDJ;
  if (lower.includes('bunny') || lower.includes('latin') || lower.includes('pirate')) return avatarPirate;
  if (lower.includes('billie') || lower.includes('ninja') || lower.includes('dark')) return avatarNinja;
  if (lower.includes('laro') || lower.includes('rock') || lower.includes('rebel')) return avatarRebel;
  if (lower.includes('wizard') || lower.includes('magic')) return avatarWizard;
  if (lower.includes('sage') || lower.includes('monk')) return avatarSage;

  const hash = Math.abs(idOrName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  return PRESET_FLAT_AVATARS[hash % PRESET_FLAT_AVATARS.length].url;
}
