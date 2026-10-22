import type { DetailedNPC, NpcAlbum, NpcSong } from './npcAssets';
import {
  REAL_WORLD_NPCS,
  resolveRealWorldCoverArt,
  normalizeRealArtistName
} from './realWorldArtistCatalog';
import { COMPLETE_REAL_WORLD_ALBUM_TRACKLISTS } from './completeAlbumTracklistRegistry';

export interface AuthenticAlbumTrackEntry {
  title: string;
  streams: number;
  trackType: 'lead_single' | 'single' | 'b_side';
}

// Curated authentic full studio album tracklists for real-world NPC albums
// Every track listed belongs 100% to that specific real-world studio album.
export const REAL_WORLD_ALBUM_TRACKLISTS: Record<string, string[]> = {
  // TAYLOR SWIFT
  'taylor swift::folklore': [
    'the 1',
    'cardigan',
    'the last great american dynasty',
    'exile (feat. Bon Iver)',
    'my tears ricochet',
    'mirrorball',
    'seven',
    'august',
    'this is me trying',
    'illicit affairs',
    'invisible string',
    'mad woman',
    'epiphany',
    'betty',
    'peace',
    'hoax'
  ],
  'taylor swift::the tortured poets department': [
    'Fortnight',
    'The Tortured Poets Department',
    'My Boy Only Breaks His Favorite Toys',
    'Down Bad',
    'So Long, London',
    'But Daddy I Love Him',
    'Fresh Out The Slammer',
    'Florida!!!',
    'Guilty as Sin?',
    "Who's Afraid of Little Old Me?",
    'I Can Fix Him (No Really I Can)',
    'loml',
    'I Can Do It With a Broken Heart',
    'The Smallest Man Who Ever Lived',
    'The Alchemy',
    'Clara Bow'
  ],
  'taylor swift::midnights': [
    'Lavender Haze',
    'Maroon',
    'Anti-Hero',
    'Snow On The Beach',
    "You're On Your Own, Kid",
    'Midnight Rain',
    'Question...?',
    'Vigilante Shit',
    'Bejeweled',
    'Labyrinth',
    'Karma',
    'Sweet Nothing',
    'Mastermind'
  ],
  "taylor swift::1989 (taylor's version)": [
    'Welcome To New York',
    'Blank Space',
    'Style',
    'Out Of The Woods',
    'All You Had To Do Was Stay',
    'Shake It Off',
    'I Wish You Would',
    'Bad Blood',
    'Wildest Dreams',
    'How You Get The Girl',
    'This Love',
    'I Know Places',
    'Clean',
    ' Wonderland',
    'You Are In Love',
    'New Romantics',
    '"Slut!"',
    'Say Don\'t Go',
    'Now That We Don\'t Talk',
    'Suburban Legends',
    'Is It Over Now?'
  ],
  'taylor swift::lover': [
    'I Forgot That You Existed',
    'Cruel Summer',
    'Lover',
    'The Man',
    'The Archer',
    'I Think He Knows',
    'Miss Americana & The Heartbreak Prince',
    'Paper Rings',
    'Cornelia Street',
    'Death By A Thousand Cuts',
    'London Boy',
    'Soon You\'ll Get Better',
    'False God',
    'You Need To Calm Down',
    'Afterglow',
    'ME!',
    'It\'s Nice To Have A Friend',
    'Daylight'
  ],
  'taylor swift::reputation': [
    '...Ready For It?',
    'End Game',
    'I Did Something Bad',
    "Don't Blame Me",
    'Delicate',
    'Look What You Made Me Do',
    'So It Goes...',
    'Gorgeous',
    'Getaway Car',
    'King Of My Heart',
    'Dancing With Our Hands Tied',
    'Dress',
    'This Is Why We Can\'t Have Nice Things',
    'Call It What You Want',
    'New Year\'s Day'
  ],
  'taylor swift::evermore': [
    'willow',
    'champagne problems',
    'gold rush',
    '\'tis the damn season',
    'tolerate it',
    'no body, no crime',
    'happiness',
    'dorothea',
    'coney island',
    'ivy',
    'cowboy like me',
    'long story short',
    'marjorie',
    'closure',
    'evermore'
  ],
  "taylor swift::red (taylor's version)": [
    'State Of Grace',
    'Red',
    'Treacherous',
    'I Knew You Were Trouble',
    'All Too Well',
    '22',
    'I Almost Do',
    'We Are Never Ever Getting Back Together',
    'Stay Stay Stay',
    'The Last Time',
    'Holy Ground',
    'Everything Has Changed',
    'Begin Again',
    'Nothing New',
    'Message In A Bottle',
    'I Bet You Think About Me',
    'All Too Well (10 Minute Version)'
  ],

  // THE WEEKND
  'the weeknd::after hours': [
    'Alone Again',
    'Too Late',
    'Hardest To Love',
    'Scared To Live',
    'Snowchild',
    'Escape From LA',
    'Heartless',
    'Faith',
    'Blinding Lights',
    'In Your Eyes',
    'Save Your Tears',
    'Repeat After Me (Interlude)',
    'After Hours',
    'Until I Bleed Out'
  ],
  'the weeknd::starboy': [
    'Starboy',
    'Party Monster',
    'False Alarm',
    'Reminder',
    'Rockin\'',
    'Secrets',
    'True Colors',
    'Stargirl Interlude',
    'Sidewalks',
    'Six Feet Under',
    'Love To Lay',
    'A Lonely Night',
    'Attention',
    'Ordinary Life',
    'Nothing Without You',
    'All I Know',
    'Die For You',
    'I Feel It Coming'
  ],
  'the weeknd::dawn fm': [
    'Dawn FM',
    'Gasoline',
    'How Do I Make You Love Me?',
    'Take My Breath',
    'Sacrifice',
    'A Tale By Quincy',
    'Out of Time',
    'Here We Go... Again',
    'Best Friends',
    'Is There Someone Else?',
    'Starry Eyes',
    'Every Angel is Terrifying',
    'Don\'t Break My Heart',
    'I Heard You\'re Married',
    'Less Than Zero',
    'Phantom Regret by Jim'
  ],
  'the weeknd::hurry up tomorrow': [
    'Wake Me Up',
    'Cry For Me',
    'I Can\'t Fucking Sing',
    'São Paulo',
    'Baptized In Fear',
    'Open Hearts',
    'Opening Night',
    'Reflections Laughing',
    'Enjoy The Show',
    'Given Up On Me',
    'Timeless',
    'Niagara Falls',
    'Take Me Back To LA',
    'Big Sleep',
    'Give Me Mercy',
    'Drive',
    'The Abyss',
    'Hurry Up Tomorrow'
  ],
  'the weeknd::beauty behind the madness': [
    'Real Life',
    'Losers',
    'Tell Your Friends',
    'Often',
    'The Hills',
    'Acquainted',
    'Can\'t Feel My Face',
    'Shameless',
    'Earned It',
    'In The Night',
    'As You Are',
    'Dark Times',
    'Prisoner',
    'Angel'
  ],

  // BILLIE EILISH
  'billie eilish::hit me hard and softly': [
    'SKINNY',
    'LUNCH',
    'CHIHIRO',
    'BIRDS OF A FEATHER',
    'WILDFLOWER',
    'THE GREATEST',
    'L\'AMOUR DE MA VIE',
    'THE DINER',
    'BITTERSUITE',
    'BLUE'
  ],
  'billie eilish::happier than ever': [
    'Getting Older',
    'I Didn\'t Change My Number',
    'Billie Bossa Nova',
    'my future',
    'Oxytocin',
    'GOLDWING',
    'Lost Cause',
    'Halley\'s Comet',
    'Not My Responsibility',
    'OverHeated',
    'Everybody Dies',
    'Your Power',
    'NDA',
    'Therefore I Am',
    'Happier Than Ever',
    'Male Fantasy'
  ],
  'billie eilish::when we all fall asleep, where do we go?': [
    '!!!!!!!',
    'bad guy',
    'xanny',
    'you should see me in a crown',
    'all the good girls go to hell',
    'wish you were gay',
    'when the party\'s over',
    '8',
    'my strange addiction',
    'bury a friend',
    'ilomilo',
    'listen before i go',
    'i love you',
    'goodbye'
  ],
  'billie eilish::dont smile at me': [
    'COPYCAT',
    'idontwannabeyouanymore',
    'my boy',
    'watch',
    'party favor',
    'bellyache',
    'ocean eyes',
    'hostage',
    '&burn'
  ],

  // SABRINA CARPENTER
  "sabrina carpenter::short n' sweet": [
    'Taste',
    'Please Please Please',
    'Good Graces',
    'Sharpest Tool',
    'Coincidence',
    'Bed Chem',
    'Espresso',
    'Dumb & Poetic',
    'Slim Pickins',
    'Juno',
    'Lie To Girls',
    'Don\'t Smile'
  ],
  "sabrina carpenter::emails i can't send": [
    'emails i can\'t send',
    'Vicious',
    'Read your Mind',
    'Tornado Warnings',
    'because i liked a boy',
    'Already Over',
    'how many things',
    'bet u wanna',
    'Nonsense',
    'Fast Times',
    'skinny dipping',
    'Bad for Business',
    'decode',
    'Feather'
  ],

  // KENDRICK LAMAR
  'kendrick lamar::gnx': [
    'wacced out murals',
    'squabble up',
    'luther',
    'man at the garden',
    'hey now',
    'reincarnated',
    'tv off',
    'dodger blue',
    'peekaboo',
    'heart pt. 6',
    'gnx',
    'gloria'
  ],
  'kendrick lamar::damn.': [
    'BLOOD.',
    'DNA.',
    'YAH.',
    'ELEMENT.',
    'FEEL.',
    'LOYALTY.',
    'PRIDE.',
    'HUMBLE.',
    'LUST.',
    'LOVE.',
    'XXX.',
    'FEAR.',
    'GOD.',
    'DUCKWORTH.'
  ],
  'kendrick lamar::good kid, m.a.a.d city': [
    'Sherane a.k.a Master Splinter\'s Daughter',
    'Bitch, Don\'t Kill My Vibe',
    'Backseat Freestyle',
    'The Art of Peer Pressure',
    'Money Trees',
    'Poetic Justice',
    'good kid',
    'm.A.A.d city',
    'Swimming Pools (Drank)',
    'Sing About Me, I\'m Dying of Thirst',
    'Real',
    'Compton'
  ],
  'kendrick lamar::mr. morale & the big steppers': [
    'United In Grief',
    'N95',
    'Worldwide Steppers',
    'Die Hard',
    'Father Time',
    'Rich Spirit',
    'We Cry Together',
    'Purple Hearts',
    'Count Me Out',
    'Crown',
    'Silent Hill',
    'Savior',
    'Mirror'
  ],

  // OLIVIA RODRIGO
  'olivia rodrigo::guts': [
    'all-american bitch',
    'bad idea right?',
    'vampire',
    'lacy',
    'ballad of a homeschooled girl',
    'making the bed',
    'logical',
    'get him back!',
    'love is embarrassing',
    'the grudge',
    'pretty isn\'t pretty',
    'teenage dream'
  ],
  'olivia rodrigo::sour': [
    'brutal',
    'traitor',
    'drivers license',
    '1 step forward, 3 steps back',
    'deja vu',
    'good 4 u',
    'enough for you',
    'happier',
    'jealousy, jealousy',
    'favorite crime',
    'hope ur ok'
  ],

  // ARIANA GRANDE
  'ariana grande::eternal sunshine': [
    'intro (end of the world)',
    'bye',
    'don\'t wanna break up again',
    'Saturn Returns Interlude',
    'eternal sunshine',
    'supernatural',
    'true story',
    'the boy is mine',
    'yes, and?',
    'we can\'t be friends (wait for your love)',
    'i wish i hated you',
    'imperfect for you',
    'ordinary things'
  ],
  'ariana grande::thank u, next': [
    'imagine',
    'needy',
    'NASA',
    'bloodline',
    'fake smile',
    'bad idea',
    'make up',
    'ghostin',
    'in my head',
    '7 rings',
    'thank u, next',
    'break up with your girlfriend, i\'m bored'
  ],
  'ariana grande::positions': [
    'shut up',
    '34+35',
    'motive',
    'just like magic',
    'off the table',
    'six thirty',
    'safety net',
    'my hair',
    'nasty',
    'west side',
    'love language',
    'positions',
    'obvious',
    'pov'
  ],

  // SZA
  'sza::sos': [
    'SOS',
    'Kill Bill',
    'Seek & Destroy',
    'Low',
    'Love Language',
    'Blind',
    'Used',
    'Snooze',
    'Notice Me',
    'Gone Girl',
    'Smoking on My Ex Pack',
    'Ghost in the Machine',
    'F2F',
    'Nobody Gets Me',
    'Shirt',
    'Good Days',
    'I Hate U'
  ],
  'sza::sos deluxe: lana': [
    'No More Hiding',
    'What Do I Do',
    '30 for 30',
    'Diamond Boy (DTM)',
    'BMF',
    'Scorsese Baby Daddy',
    'Love Me 4 Me',
    'Chill Baby',
    'My Turn',
    'Crybaby',
    'Kitchen',
    'Get Behind Me (Interlude)',
    'Drive',
    'Another Life',
    'Saturn'
  ],
  'sza::ctrl': [
    'Supermodel',
    'Love Galore',
    'Doves in the Wind',
    'Drew Barrymore',
    'Prom',
    'The Weekend',
    'Go Gina',
    'Garden (Say It Like Dat)',
    'Broken Clocks',
    'Anything',
    'Normal Girl',
    'Pretty Little Birds',
    '20 Something'
  ],

  // BRUNO MARS
  'bruno mars::24k magic': [
    '24K Magic',
    'Chunky',
    'Perm',
    'That\'s What I Like',
    'Versace on the Floor',
    'Straight Up & Down',
    'Calling All My Lovelies',
    'Finesse',
    'Too Good to Say Goodbye'
  ],
  'bruno mars::an evening with silk sonic': [
    'Silk Sonic Intro',
    'Leave The Door Open',
    'Fly As Me',
    'After Last Night',
    'Smokin Out The Window',
    'Put On A Smile',
    '777',
    'Skate',
    'Blast Off'
  ],
  'bruno mars::unorthodox jukebox': [
    'Young Girls',
    'Locked Out of Heaven',
    'Gorilla',
    'Treasure',
    'Moonshine',
    'When I Was Your Man',
    'Natalie',
    'Show Me',
    'Money Make Her Smile',
    'If I Knew'
  ],
  'bruno mars::doo-wops & hooligans': [
    'Grenade',
    'Just the Way You Are',
    'Our First Time',
    'Runaway Baby',
    'The Lazy Song',
    'Marry You',
    'Talking to the Moon',
    'Liquor Store Blues',
    'Count on Me',
    'The Other Side'
  ],

  // BAD BUNNY
  'bad bunny::un verano sin ti': [
    'Moscow Mule',
    'Después de la Playa',
    'Me Porto Bonito',
    'Tití Me Preguntó',
    'Un Ratito',
    'Yo No Soy Celoso',
    'Tarot',
    'Neverita',
    'La Corriente',
    'Efecto',
    'Party',
    'Aguacero',
    'Ojitos Lindos',
    'Dos Mil 16',
    'El Apagón',
    'Callaíta'
  ],
  'bad bunny::debí tirar más fotos': [
    'NUEVAYoL',
    'VOY A LLeVARTE PA PR',
    'BAILE INoLVIDABLE',
    'PERFuMITO NUEVO',
    'WELTiTA',
    'VeLDÁ',
    'EL CLúB',
    'KETU TeCRÉ',
    'BOKeTE',
    'KLOuFRENS',
    'TURiSTA',
    'CAFé CON RON',
    'PIToRRO DE COCO',
    'LO QUE LE PASÓ A HAWAii',
    'EoO',
    'DtMF',
    'LA MuDANZA'
  ],
  'bad bunny::nadie sabe lo que va a pasar mañana': [
    'NADIE SABE',
    'MONACO',
    'FINA',
    'HIBIKI',
    'MR. OCTOBER',
    'CYBERTRUCK',
    'VOU 787',
    'SEDA',
    'GRACIAS POR NADA',
    'TELEFONO NUEVO',
    'BABY NUEVA',
    'PERRO NEGRO',
    'UN PREVIEW'
  ],

  // DRAKE
  'drake::for all the dogs': [
    'Virginia Beach',
    'Amen',
    'Calling For You',
    'Fear Of Heights',
    'Daylight',
    'First Person Shooter',
    'IDGAF',
    '7969 Santa',
    'Slime You Out',
    'Bahamas Promises',
    'Tried Our Best',
    '8am in Charlotte',
    'Rich Baby Daddy',
    'Polar Opposites'
  ],
  'drake::scorpion': [
    'Survival',
    'Nonstop',
    'Elevate',
    'Emotionless',
    'God\'s Plan',
    'I\'m Upset',
    '8 Out Of 10',
    'Mob Ties',
    'Nice For What',
    'In My Feelings',
    'Don\'t Matter To Me',
    'After Dark'
  ],
  'drake::views': [
    'Keep the Family Close',
    '9',
    'U With Me?',
    'Feel No Ways',
    'Hype',
    'Weston Road Flows',
    'Redemption',
    'One Dance',
    'Grammys',
    'Controlla',
    'Too Good',
    'Hotline Bling'
  ],

  // CHAPPELL ROAN
  'chappell roan::the rise and fall of a midwest princess': [
    'Femininomenon',
    'Red Wine Supernova',
    'After Midnight',
    'Coffee',
    'Casual',
    'Super Graphic Ultra Modern Girl',
    'HOT TO GO!',
    'My Kink Is Karma',
    'Picture You',
    'Kaleidoscope',
    'Pink Pony Club',
    'Naked in Manhattan',
    'California',
    'Guilty Pleasure'
  ],

  // CHARLI XCX
  'charli xcx::brat': [
    '360',
    'Club classics',
    'Sympathy is a knife',
    'I might say something stupid',
    'Talk talk',
    'Von dutch',
    'Everything is romantic',
    'Rewind',
    'So I',
    'Girl, so confusing',
    'Apple',
    'B2b',
    'Mean girls',
    'I think about it all the time',
    '365'
  ],

  // DUA LIPA
  'dua lipa::future nostalgia': [
    'Future Nostalgia',
    'Don\'t Start Now',
    'Cool',
    'Physical',
    'Levitating',
    'Pretty Please',
    'Hallucinate',
    'Love Again',
    'Break My Heart',
    'Good in Bed',
    'Boys Will Be Boys'
  ],
  'dua lipa::radical optimism': [
    'End of an Era',
    'Houdini',
    'Training Season',
    'These Walls',
    'Whatcha Doing',
    'French Exit',
    'Illusion',
    'Falling Forever',
    'Anything for Love',
    'Maria',
    'Happy for You'
  ],

  // BERNADYA
  'bernadya::sialnya, hidup harus tetap berjalan': [
    'Sialnya, Hidup Harus Tetap Berjalan',
    'Kata Mereka Ini Berlebihan',
    'Lama-Lama',
    'Kita Buat Menyenangkan',
    'Kini Mereka Tahu',
    'Terlintas',
    'Ambang Pintu',
    'Untungnya, Hidup Harus Tetap Berjalan'
  ],
  'bernadya::terlintas': [
    'Terlintas',
    'Masa Sepi',
    'Sinyal-Sinyal',
    'Satu Bulan',
    'Apa Mungkin'
  ],

  // TULUS
  'tulus::manusia': [
    'Tujuh Belas',
    'Kelana',
    'Remedi',
    'Interaksi',
    'Ingkar',
    'Jatuh Suka',
    'Nala',
    'Hati-Hati di Jalan',
    'Diri',
    'Satu Kali'
  ],
  'tulus::monokrom': [
    'Manusia Kuat',
    'Pamit',
    'Ruang Sendiri',
    'Tukar Jiwa',
    'Tergila-gila',
    'Cahaya',
    'Langit Abu-abu',
    'Mahakarya',
    'Lekas',
    'Monokrom'
  ],

  // MAHALINI
  'mahalini::fábula': [
    'Ini Laguku',
    'Buru-Buru',
    'Bawa Dia Kembali',
    'Putar Waktu',
    'Bohongi Hati',
    'Melawan Restu',
    'Sial',
    'Sisa Rasa',
    'Kisah Sempurna',
    'Pecah Seribu'
  ],

  // JUICY LUICY
  'juicy luicy::nonfiksi': [
    'Lampu Kuning',
    'Sialan',
    'HAHAHA',
    'Asing',
    'Tanggung Jawab',
    'Bukan Orangnya',
    'Cuma Sama Kamu',
    'Segala-galanya',
    'Tampar',
    'Insya Allah'
  ],
  'juicy luicy::sentimental': [
    'Lantas',
    'Tanpa Tergesa',
    'Mawar Jingga',
    'Jemari',
    'H-5',
    'Kembali Kesepian',
    'Di Balik Layar',
    'Terlalu Tinggi',
    'Siapa Tahu',
    'Mungkin Sudah Saatnya'
  ],

  // HINDIA
  'hindia::menari dengan bayangan': [
    'Evakuasi',
    'Wejangan Mama',
    'Besok Mungkin Kita Sampai',
    'Jam Makan Siang',
    'Dehidrasi',
    'Untuk Apa / Untuk Apa?',
    'Voice Note Anggra',
    'Secukupnya',
    'Belum Tidur',
    'Apapun Yang Terjadi',
    'Membasuh',
    'Rumah Ke Rumah',
    'Mata Air',
    'Evaluasi'
  ],
  'hindia::lagipula hidup akan berakhir': [
    'Janji Palsu',
    'Matahari Tenggelam',
    'Satu Hari Lagi',
    'Cincin',
    'Nabi Palsu',
    'Masalah Masa Depan',
    'Berdansalah, Karir Ini Tak Ada Artinya',
    'Kita Ke Sana',
    'Bayangkan Jika Kita Tidak Menyerah'
  ],

  // JUNG KOOK
  'jung kook::golden': [
    '3D',
    'Closer to You',
    'Seven (feat. Latto)',
    'Standing Next to You',
    'Yes or No',
    'Please Don\'t Change',
    'Hate You',
    'Somebody',
    'Too Sad to Dance',
    'Shot Glass of Tears'
  ],

  // BLACKPINK
  'blackpink::born pink': [
    'Pink Venom',
    'Shut Down',
    'Typa Girl',
    'Yeah Yeah Yeah',
    'Hard to Love',
    'The Happiest Girl',
    'Tally',
    'Ready For Love'
  ],
  'blackpink::the album': [
    'How You Like That',
    'Ice Cream',
    'Pretty Savage',
    'Bet You Wanna',
    'Lovesick Girls',
    'Crazy Over You',
    'Love To Hate Me',
    'You Never Know'
  ],

  // NEWJEANS
  'newjeans::get up': [
    'New Jeans',
    'Super Shy',
    'ETA',
    'Cool With You',
    'Get Up',
    'ASAP'
  ],

  // ROSÉ
  'rosé::rosie': [
    'number one girl',
    '3am',
    'two years',
    'toxic till the end',
    'drinks or coffee',
    'APT.',
    'gameboy',
    'stay a little longer',
    'not the same',
    'call it the end',
    'too bad for us',
    'dance all night'
  ],

  // LISA
  'lisa::alter ego': [
    'Born Again',
    'Rockstar',
    'Elastigirl',
    'Thunder',
    'New Woman',
    'FXCK UP THE WORLD',
    'Rapunzel',
    'Moonlit Floor (Kiss Me)',
    'When I\'m With You',
    'BADGRRRL',
    'Lifestyle',
    'Chill',
    'Dream'
  ],

  // JENNIE
  'jennie::ruby': [
    'Intro : JANE',
    'like JENNIE',
    'start a war',
    'Handlebars',
    'with the IE (way up)',
    'ExtraL',
    'Mantra',
    'Love Hangover',
    'ZEN',
    'Damn Right',
    'F.T.S.',
    'Filter',
    'Seoul City',
    'Starlight',
    'twin'
  ],
  ...COMPLETE_REAL_WORLD_ALBUM_TRACKLISTS
};

const ALBUM_TRACKLIST_STORAGE_KEY = 'mr_authentic_album_tracklists_v3';
const dynamicAlbumTracklistCache: Record<string, string[]> = {};
const inflightAlbumTracklistPromises = new Map<string, Promise<string[] | null>>();
const tracklistListeners = new Set<() => void>();

// Lazy O(1) normalized alphanumeric index by artist for resilient album title matching
let normalizedAlbumTracklistByArtist: Record<string, Array<{ normAlbum: string; tracks: string[] }>> | null = null;

function normTrackKeyPart(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getNormalizedTracklistIndex() {
  if (normalizedAlbumTracklistByArtist) return normalizedAlbumTracklistByArtist;
  const map: Record<string, Array<{ normAlbum: string; tracks: string[] }>> = {};
  for (const [rawKey, tracks] of Object.entries(REAL_WORLD_ALBUM_TRACKLISTS)) {
    const [aPart, tPart] = rawKey.split('::');
    if (aPart && tPart) {
      const kArtist = normTrackKeyPart(aPart);
      const kAlbum = normTrackKeyPart(tPart);
      if (!map[kArtist]) map[kArtist] = [];
      map[kArtist].push({ normAlbum: kAlbum, tracks });
    }
  }
  normalizedAlbumTracklistByArtist = map;
  return map;
}

function lookupStaticOrDynamicTracklist(artist: string, albumTitle: string): string[] | undefined {
  const exactKey = getAlbumKey(artist, albumTitle);
  if (REAL_WORLD_ALBUM_TRACKLISTS[exactKey]) return REAL_WORLD_ALBUM_TRACKLISTS[exactKey];
  if (dynamicAlbumTracklistCache[exactKey] && dynamicAlbumTracklistCache[exactKey].length >= 3) {
    return dynamicAlbumTracklistCache[exactKey];
  }
  const normArtist = normTrackKeyPart(normalizeRealArtistName(artist || ''));
  const normAlbum = normTrackKeyPart(albumTitle || '');
  if (!normArtist || !normAlbum) return undefined;

  const artistEntries = getNormalizedTracklistIndex()[normArtist];
  if (!artistEntries) return undefined;

  const exactNorm = artistEntries.find(e => e.normAlbum === normAlbum);
  if (exactNorm) return exactNorm.tracks;

  const partialMatch = artistEntries.find(
    e => e.normAlbum && (e.normAlbum.includes(normAlbum) || normAlbum.includes(e.normAlbum))
  );
  return partialMatch ? partialMatch.tracks : undefined;
}

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(ALBUM_TRACKLIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (Array.isArray(v) && v.length >= 3) {
          dynamicAlbumTracklistCache[k] = v as string[];
        }
      }
    }
  }
} catch {
  // Ignore localStorage read errors
}

function persistTracklistCache() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        ALBUM_TRACKLIST_STORAGE_KEY,
        JSON.stringify(dynamicAlbumTracklistCache)
      );
    }
  } catch {
    // Ignore
  }
}

export function subscribeToAlbumTracklistUpdates(listener: () => void): () => void {
  tracklistListeners.add(listener);
  return () => {
    tracklistListeners.delete(listener);
  };
}

function notifyTracklistListeners() {
  tracklistListeners.forEach(fn => {
    try {
      fn();
    } catch {}
  });
}

function getAlbumKey(artist: string, albumTitle: string): string {
  return `${normalizeRealArtistName(artist || '').toLowerCase().trim()}::${(albumTitle || '').toLowerCase().trim()}`;
}

/**
 * Fetches authentic full album tracklist from `/api/album-tracks` (Deezer Album Tracklist + iTunes Lookup API)
 * for any real-world album not already in the static dictionary.
 */
export async function fetchAuthenticAlbumTracklistFromServer(
  artist: string,
  albumTitle: string
): Promise<string[] | null> {
  const existingStatic = lookupStaticOrDynamicTracklist(artist, albumTitle);
  if (existingStatic && existingStatic.length >= 3) {
    return existingStatic;
  }
  const key = getAlbumKey(artist, albumTitle);
  const existing = inflightAlbumTracklistPromises.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<string[] | null> => {
    try {
      const res = await fetch(
        `/api/album-tracks?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(albumTitle)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tracks) && data.tracks.length >= 3) {
          dynamicAlbumTracklistCache[key] = data.tracks;
          persistTracklistCache();
          notifyTracklistListeners();
          return data.tracks;
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      inflightAlbumTracklistPromises.delete(key);
    }
    return null;
  })();

  inflightAlbumTracklistPromises.set(key, promise);
  return promise;
}

/**
 * Resolves the full tracklist for an NPC's album, with realistic stream counts and lead_single / single / b_side badges.
 */
export function getAuthenticAlbumFullTracklist(
  artistName: string,
  albumTitle: string,
  artistPop: number = 90,
  fallbackSongs: NpcSong[] = []
): AuthenticAlbumTrackEntry[] {
  const curatedTitles = lookupStaticOrDynamicTracklist(artistName, albumTitle);

  // Trigger background fetch if not in static or dynamic cache yet
  if (!curatedTitles && typeof window !== 'undefined') {
    fetchAuthenticAlbumTracklistFromServer(artistName, albumTitle).catch(() => {});
  }

  const baseStreamScale = Math.max(45000000, Math.floor(Math.pow(artistPop / 100, 3) * 1450000000));

  if (curatedTitles && curatedTitles.length > 0) {
    return curatedTitles.map((trackTitle, idx) => {
      // Check if this track has an explicit stream count in fallbackSongs
      const matchedHit = fallbackSongs.find(
        s => s.title.toLowerCase().trim() === trackTitle.toLowerCase().trim()
      );
      const isLeadSingle = idx === 0 || idx === 1;
      const isPromotionalSingle = idx === 2 || idx === 3 || Boolean(matchedHit);
      const trackType: 'lead_single' | 'single' | 'b_side' =
        idx === 0
          ? 'lead_single'
          : isLeadSingle || isPromotionalSingle
          ? 'single'
          : 'b_side';

      const hash = Math.abs(
        trackTitle.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0)
      );
      const mult =
        trackType === 'lead_single'
          ? 1.15
          : trackType === 'single'
          ? 0.78
          : Math.max(0.16, 0.44 * Math.pow(0.91, idx) + (hash % 15) / 100);

      const streams = matchedHit?.streams
        ? matchedHit.streams
        : Math.floor(baseStreamScale * mult);

      return {
        title: trackTitle,
        streams,
        trackType
      };
    });
  }

  // Fallback while Deezer/iTunes tracklist loads: use artist's known songs + authentic album tracks
  const tracks: AuthenticAlbumTrackEntry[] = fallbackSongs.map((s, idx) => ({
    title: s.title,
    streams: s.streams || Math.floor(baseStreamScale * (idx === 0 ? 1.0 : 0.65)),
    trackType: idx === 0 ? 'lead_single' : idx < 3 ? 'single' : 'b_side'
  }));

  return tracks.length > 0
    ? tracks
    : [
        {
          title: albumTitle,
          streams: baseStreamScale,
          trackType: 'lead_single'
        }
      ];
}

// -----------------------------------------------------------------------------------------
// ANNUAL NPC ALBUM & SINGLE RELEASE CYCLE ENGINE
// Every game year, each NPC releases a new real-world album from their master catalog
// along with its full authentic tracklist and new singles, deleting and overwriting
// the previous year's album and singles just like a real-world annual era cycle.
// -----------------------------------------------------------------------------------------

interface NpcMasterCatalogSnapshot {
  id: string;
  name: string;
  pop: number;
  masterAlbums: NpcAlbum[];
  masterSongs: NpcSong[];
}

const masterNpcCatalogMap = new Map<string, NpcMasterCatalogSnapshot>();
let lastSyncedGameYear: number | null = null;

function ensureMasterSnapshotCaptured() {
  if (masterNpcCatalogMap.size > 0) return;

  REAL_WORLD_NPCS.forEach(npc => {
    // Reorder Taylor Swift's master albums so 'folklore' is first in 2026 as requested by the user example,
    // followed by her other real-world eras in subsequent years!
    let orderedAlbums = [...(npc.albums || [])];
    if (npc.name === 'Taylor Swift') {
      const folkloreIdx = orderedAlbums.findIndex(
        a => a.title.toLowerCase() === 'folklore'
      );
      if (folkloreIdx > 0) {
        const [folkloreAlb] = orderedAlbums.splice(folkloreIdx, 1);
        orderedAlbums.unshift(folkloreAlb);
      }
    }

    masterNpcCatalogMap.set(npc.id, {
      id: npc.id,
      name: npc.name,
      pop: npc.pop,
      masterAlbums: orderedAlbums.map(a => ({ ...a })),
      masterSongs: (npc.songs || []).map(s => ({ ...s }))
    });
  });
}

/**
 * Synchronizes all NPCs' active Album and active Singles to the current game year (`gameYear`).
 * Deletes the previous year's album & singles and overwrites them with the new year's album
 * (complete with its full authentic tracklist) and new singles from that album!
 */
export function syncNpcAnnualReleaseCycle(
  currentDateInput?: string | Date,
  force = false
): { yearChanged: boolean; activeYear: number } {
  ensureMasterSnapshotCaptured();

  const parsedDate = currentDateInput
    ? typeof currentDateInput === 'string'
      ? new Date(currentDateInput)
      : currentDateInput
    : new Date('2026-01-01T00:00:00');

  const gameYear = Number.isNaN(parsedDate.getFullYear())
    ? 2026
    : parsedDate.getFullYear();

  if (!force && lastSyncedGameYear === gameYear) {
    return { yearChanged: false, activeYear: gameYear };
  }

  const prevYear = lastSyncedGameYear;
  lastSyncedGameYear = gameYear;
  const yearOffset = Math.max(0, gameYear - 2026);

  REAL_WORLD_NPCS.forEach((npc, npcIdx) => {
    const master = masterNpcCatalogMap.get(npc.id);
    if (!master || master.masterAlbums.length === 0) return;

    // Pick the active album for this game year (rotates to a new album every year)
    const eraIdx = yearOffset % master.masterAlbums.length;
    const chosenAlbumMeta = master.masterAlbums[eraIdx];
    const albumTitle = chosenAlbumMeta.title;
    const albumCover =
      chosenAlbumMeta.cover || resolveRealWorldCoverArt(npc.name, albumTitle, true);

    // Build full authentic tracklist for this album (every track belongs to this album)
    const fullTracks = getAuthenticAlbumFullTracklist(
      npc.name,
      albumTitle,
      npc.pop,
      master.masterSongs
    );

    // Extract the singles from this album to overwrite the NPC's active singles for this year
    const singleCandidates = fullTracks.filter(
      t => t.trackType === 'lead_single' || t.trackType === 'single'
    );
    const activeAlbumSongsPool =
      singleCandidates.length >= 3
        ? singleCandidates.slice(0, 6)
        : fullTracks.slice(0, Math.min(6, fullTracks.length));

    const newActiveSongs: NpcSong[] = activeAlbumSongsPool.map((trk, sIdx) => {
      const baseStreams = trk.streams || 150000000;
      const dailyStreams = Math.max(
        65000,
        Math.floor((baseStreams / 340) * (sIdx === 0 ? 1.25 : 0.85))
      );
      return {
        title: trk.title,
        streams: baseStreams,
        dailyStreams,
        radio: Math.floor((npc.pop * 2600) * (sIdx === 0 ? 1.15 : 0.85)),
        sales: Math.floor((baseStreams / 1200) * (sIdx === 0 ? 1.2 : 0.9)),
        cover: resolveRealWorldCoverArt(npc.name, trk.title, false) || albumCover
      };
    });

    const totalAlbumSales = Math.max(
      180000,
      Math.floor(
        fullTracks.reduce((sum, t) => sum + t.streams, 0) / 1500
      )
    );

    // Delete previous album & singles and overwrite with the current year's active album & singles
    npc.albums = [
      {
        title: albumTitle,
        cover: albumCover,
        sales: totalAlbumSales,
        year: gameYear,
        tracks: fullTracks
      }
    ];
    npc.songs = newActiveSongs;

    // Slight annual hype refresh when dropping a new album era
    if (prevYear !== null && prevYear !== gameYear) {
      npc.hype = Math.min(99, Math.max(78, npc.hype + ((npcIdx % 5) - 1)));
    }
  });

  return {
    yearChanged: prevYear !== null && prevYear !== gameYear,
    activeYear: gameYear
  };
}
