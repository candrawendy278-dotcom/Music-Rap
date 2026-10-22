import type { DetailedNPC } from './npcAssets';

// Additional Wikipedia Page Slugs for Expanded Real-World NPC Roster
export const EXPANDED_ARTIST_WIKIPEDIA_SLUGS: Record<string, string> = {
  'Shawn Mendes': 'Shawn_Mendes',
  'Camila Cabello': 'Camila_Cabello',
  'Selena Gomez': 'Selena_Gomez',
  'Katy Perry': 'Katy_Perry',
  'Miley Cyrus': 'Miley_Cyrus',
  'Adele': 'Adele',
  'Sam Smith': 'Sam_Smith',
  'RAYE': 'Raye_(singer)',
  'Fred again..': 'Fred_Again',
  'Dave': 'Dave_(rapper)',
  'Conan Gray': 'Conan_Gray',
  'Laufey': 'Laufey_(singer)',
  'Clairo': 'Clairo',
  'Beabadoobee': 'Beabadoobee',
  'Mitski': 'Mitski',
  'Lorde': 'Lorde',
  'Troye Sivan': 'Troye_Sivan',
  'OneRepublic': 'OneRepublic',
  'Glass Animals': 'Glass_Animals',
  'The Neighbourhood': 'The_Neighbourhood',
  'Lewis Capaldi': 'Lewis_Capaldi',
  'Nicki Minaj': 'Nicki_Minaj',
  'Cardi B': 'Cardi_B',
  'Megan Thee Stallion': 'Megan_Thee_Stallion',
  'Doechii': 'Doechii',
  'GloRilla': 'GloRilla',
  'Lil Uzi Vert': 'Lil_Uzi_Vert',
  'Gunna': 'Gunna_(rapper)',
  'Don Toliver': 'Don_Toliver',
  'Juice WRLD': 'Juice_Wrld',
  'XXXTENTACION': 'XXXTentacion',
  'Pop Smoke': 'Pop_Smoke',
  'Summer Walker': 'Summer_Walker',
  'Brent Faiyaz': 'Brent_Faiyaz',
  'Daniel Caesar': 'Daniel_Caesar',
  'Kali Uchis': 'Kali_Uchis',
  'Frank Ocean': 'Frank_Ocean',
  'Arctic Monkeys': 'Arctic_Monkeys',
  'Linkin Park': 'Linkin_Park',
  'Imagine Dragons': 'Imagine_Dragons',
  'Luke Combs': 'Luke_Combs',
  'Chris Stapleton': 'Chris_Stapleton',
  'Shaboozey': 'Shaboozey',
  'Daft Punk': 'Daft_Punk',
  'Calvin Harris': 'Calvin_Harris',
  'BTS': 'BTS',
  'TWICE': 'Twice',
  'SEVENTEEN': 'Seventeen_(South_Korean_band)',
  'aespa': 'Aespa',
  'LE SSERAFIM': 'Le_Sserafim',
  'ENHYPEN': 'Enhypen',
  'ILLIT': 'Illit',
  'BABYMONSTER': 'Babymonster',
  'IVE': 'Ive_(group)',
  'LISA': 'Lisa_(rapper)',
  'ROSÉ': 'Rosé_(singer)',
  'JENNIE': 'Jennie_(singer)',
  'JIMIN': 'Jimin',
  'IU': 'IU_(singer)',
  'YOASOBI': 'Yoasobi',
  'Fujii Kaze': 'Fujii_Kaze',
  'Creepy Nuts': 'Creepy_Nuts',
  'Mrs. GREEN APPLE': 'Mrs._Green_Apple',
  'Kenshi Yonezu': 'Kenshi_Yonezu',
  'Rauw Alejandro': 'Rauw_Alejandro',
  'Shakira': 'Shakira',
  'Myke Towers': 'Myke_Towers',
  'Anitta': 'Anitta_(singer)',
  'Bernadya': 'Bernadya',
  'Tulus': 'Tulus_(singer)',
  'Mahalini': 'Mahalini_Raharja',
  'Juicy Luicy': 'Juicy_Luicy',
  'Sal Priadi': 'Sal_Priadi',
  'Lyodra': 'Lyodra_Ginting',
  'Tiara Andini': 'Tiara_Andini',
  'Hindia': 'Baskara_Putra',
  'NIKI': 'Niki_(singer)',
  'Rich Brian': 'Rich_Brian',
  'Pamungkas': 'Pamungkas',
  'Sheila On 7': 'Sheila_on_7',
  'Rema': 'Rema',
  'Asake': 'Asake',
  'Ayra Starr': 'Ayra_Starr',
  'Wizkid': 'Wizkid'
};

// 48 Additional Real-World NPC Artists (bringing total NPC roster to 94 verified artists)
export const EXPANDED_REAL_WORLD_NPCS: DetailedNPC[] = [
  {
    id: 'npc47',
    name: 'Miley Cyrus',
    pop: 92,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Pop / Pop-Rock',
    bio: 'Grammy Record of the Year winner whose global anthem Flowers broke all-time Spotify streaming velocity records.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Flowers', streams: 2380000000, radio: 335000, sales: 1920000, cover: '' },
      { title: 'Angels Like You', streams: 1180000000, radio: 195000, sales: 940000, cover: '' },
      { title: 'Party in the U.S.A.', streams: 1790000000, radio: 245000, sales: 1650000, cover: '' },
      { title: 'Wrecking Ball', streams: 1320000000, radio: 220000, sales: 1480000, cover: '' }
    ],
    albums: [
      { title: 'Endless Summer Vacation', cover: '' },
      { title: 'Plastic Hearts', cover: '' },
      { title: 'Bangerz', cover: '' }
    ]
  },
  {
    id: 'npc48',
    name: 'Adele',
    pop: 94,
    hype: 90,
    tier: 1,
    country: 'GB',
    genre: 'Soul / Pop Ballad',
    bio: '16-time Grammy and Academy Award winner behind two of the best-selling Diamond albums of the 21st century, 21 and 25.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Easy On Me', streams: 1920000000, radio: 310000, sales: 1750000, cover: '' },
      { title: 'Someone Like You', streams: 2240000000, radio: 290000, sales: 2100000, cover: '' },
      { title: 'Rolling in the Deep', streams: 2050000000, radio: 305000, sales: 2250000, cover: '' },
      { title: 'Set Fire to the Rain', streams: 1840000000, radio: 265000, sales: 1820000, cover: '' }
    ],
    albums: [
      { title: '30', cover: '' },
      { title: '25', cover: '' },
      { title: '21', cover: '' },
      { title: '19', cover: '' }
    ]
  },
  {
    id: 'npc49',
    name: 'Nicki Minaj',
    pop: 92,
    hype: 91,
    tier: 1,
    country: 'US',
    genre: 'Hip-Hop / Pop-Rap',
    bio: 'Queen of Rap and global cultural icon whose Pink Friday series shattered Billboard 200 records for female rap.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Super Freaky Girl', streams: 1090000000, radio: 220000, sales: 1120000, cover: '' },
      { title: 'Starships', streams: 1580000000, radio: 260000, sales: 1740000, cover: '' },
      { title: 'Super Bass', streams: 1390000000, radio: 245000, sales: 1680000, cover: '' },
      { title: 'FTCU', streams: 640000000, radio: 175000, sales: 690000, cover: '' }
    ],
    albums: [
      { title: 'Pink Friday 2', cover: '' },
      { title: 'Queen', cover: '' },
      { title: 'The Pinkprint', cover: '' },
      { title: 'Pink Friday', cover: '' }
    ]
  },
  {
    id: 'npc50',
    name: 'BTS',
    pop: 96,
    hype: 97,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Pop / Hip-Hop',
    bio: 'Global pop titans with six Billboard Hot 100 #1 singles and historic stadium sellouts across every continent.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Dynamite', streams: 1980000000, radio: 275000, sales: 2150000, cover: '' },
      { title: 'Butter', streams: 1380000000, radio: 245000, sales: 1890000, cover: '' },
      { title: 'My Universe', streams: 1340000000, radio: 230000, sales: 1420000, cover: '' },
      { title: 'Boy With Luv', streams: 1210000000, radio: 195000, sales: 1350000, cover: '' }
    ],
    albums: [
      { title: 'Proof', cover: '' },
      { title: 'Map of the Soul: 7', cover: '' },
      { title: 'BE', cover: '' },
      { title: 'Love Yourself: Tear', cover: '' }
    ]
  },
  {
    id: 'npc51',
    name: 'LISA',
    pop: 92,
    hype: 95,
    tier: 1,
    country: 'TH',
    genre: 'Pop / Hip-Hop / Dance',
    bio: 'Global superstar and solo record-breaker captivating worldwide charts with Rockstar, New Woman, and Alter Ego.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Rockstar', streams: 860000000, radio: 185000, sales: 920000, cover: '' },
      { title: 'New Woman', streams: 740000000, radio: 175000, sales: 810000, cover: '' },
      { title: 'MONEY', streams: 1290000000, radio: 190000, sales: 1180000, cover: '' },
      { title: 'Moonlit Floor (Kiss Me)', streams: 620000000, radio: 180000, sales: 640000, cover: '' }
    ],
    albums: [
      { title: 'Alter Ego', cover: '' },
      { title: 'LALISA', cover: '' }
    ]
  },
  {
    id: 'npc52',
    name: 'ROSÉ',
    pop: 93,
    hype: 96,
    tier: 1,
    country: 'KR',
    genre: 'Pop / Indie Pop-Rock',
    bio: 'Global pop vocalist whose smash collaboration APT. and debut studio album rosie dominated the Billboard Global 200.',
    image: '',
    avatar: '',
    songs: [
      { title: 'APT.', streams: 1680000000, radio: 290000, sales: 1580000, cover: '' },
      { title: 'toxic till the end', streams: 690000000, radio: 185000, sales: 720000, cover: '' },
      { title: 'number one girl', streams: 580000000, radio: 165000, sales: 610000, cover: '' },
      { title: 'On The Ground', streams: 820000000, radio: 175000, sales: 890000, cover: '' }
    ],
    albums: [
      { title: 'rosie', cover: '' },
      { title: 'R', cover: '' }
    ]
  },
  {
    id: 'npc53',
    name: 'JENNIE',
    pop: 92,
    hype: 95,
    tier: 1,
    country: 'KR',
    genre: 'Pop / Contemporary R&B / Hip-Hop',
    bio: 'South Korean fashion and pop icon dominating global streaming platforms with Mantra, One Of The Girls, and Ruby.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Mantra', streams: 790000000, radio: 185000, sales: 840000, cover: '' },
      { title: 'SOLO', streams: 1080000000, radio: 175000, sales: 980000, cover: '' },
      { title: 'You & Me', streams: 740000000, radio: 165000, sales: 760000, cover: '' },
      { title: 'Love Hangover', streams: 610000000, radio: 170000, sales: 650000, cover: '' }
    ],
    albums: [
      { title: 'Ruby', cover: '' }
    ]
  },
  {
    id: 'npc54',
    name: 'aespa',
    pop: 90,
    hype: 93,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Hyperpop / Dance',
    bio: 'Futuristic K-Pop powerhouse sweeping Asian and global charts with Supernova, Armageddon, and Whiplash.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Supernova', streams: 840000000, radio: 180000, sales: 920000, cover: '' },
      { title: 'Whiplash', streams: 720000000, radio: 170000, sales: 810000, cover: '' },
      { title: 'Armageddon', streams: 680000000, radio: 165000, sales: 780000, cover: '' },
      { title: 'Drama', streams: 760000000, radio: 168000, sales: 830000, cover: '' }
    ],
    albums: [
      { title: 'Armageddon', cover: '' },
      { title: 'Whiplash', cover: '' },
      { title: 'Drama', cover: '' },
      { title: 'MY WORLD', cover: '' }
    ]
  },
  {
    id: 'npc55',
    name: 'TWICE',
    pop: 90,
    hype: 91,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Dance-Pop',
    bio: 'Stadium-filling K-Pop supergroup with multiple Billboard 200 top-3 albums and infectious pop anthems.',
    image: '',
    avatar: '',
    songs: [
      { title: 'The Feels', streams: 890000000, radio: 180000, sales: 910000, cover: '' },
      { title: 'Strategy', streams: 640000000, radio: 170000, sales: 740000, cover: '' },
      { title: 'FANCY', streams: 820000000, radio: 165000, sales: 860000, cover: '' },
      { title: 'What is Love?', streams: 870000000, radio: 168000, sales: 890000, cover: '' }
    ],
    albums: [
      { title: 'STRATEGY', cover: '' },
      { title: 'With YOU-th', cover: '' },
      { title: 'Formula of Love: O+T=<3', cover: '' }
    ]
  },
  {
    id: 'npc56',
    name: 'LE SSERAFIM',
    pop: 89,
    hype: 92,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Dance / House-Pop',
    bio: 'Global K-Pop hitmakers blending Vogue house, Jersey club, and Afro-latino grooves on Perfect Night and CRAZY.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Perfect Night', streams: 860000000, radio: 185000, sales: 840000, cover: '' },
      { title: 'CRAZY', streams: 740000000, radio: 175000, sales: 790000, cover: '' },
      { title: 'ANTIFRAGILE', streams: 820000000, radio: 170000, sales: 830000, cover: '' },
      { title: 'Smart', streams: 690000000, radio: 165000, sales: 710000, cover: '' }
    ],
    albums: [
      { title: 'CRAZY', cover: '' },
      { title: 'EASY', cover: '' },
      { title: 'UNFORGIVEN', cover: '' }
    ]
  },
  {
    id: 'npc57',
    name: 'SEVENTEEN',
    pop: 90,
    hype: 93,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Synth-Pop / Hip-Hop',
    bio: 'IFPI Global Album of the Year winners selling over 10 million physical albums annually worldwide.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Super', streams: 780000000, radio: 170000, sales: 1120000, cover: '' },
      { title: 'LOVE, MONEY, FAME', streams: 620000000, radio: 165000, sales: 940000, cover: '' },
      { title: 'MAESTRO', streams: 660000000, radio: 160000, sales: 980000, cover: '' },
      { title: 'HOT', streams: 740000000, radio: 165000, sales: 990000, cover: '' }
    ],
    albums: [
      { title: 'SPILL THE FEELS', cover: '' },
      { title: '17 IS RIGHT HERE', cover: '' },
      { title: 'FML', cover: '' }
    ]
  },
  {
    id: 'npc58',
    name: 'YOASOBI',
    pop: 89,
    hype: 92,
    tier: 1,
    country: 'JP',
    genre: 'J-Pop / Synth-Pop / Anisong',
    bio: 'Japanese super-duo whose phenomenon Idol became the first J-Pop track to hit #1 on the Billboard Global Excl. US chart.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Idol', streams: 1380000000, radio: 215000, sales: 1450000, cover: '' },
      { title: 'Yoru ni Kakeru', streams: 1240000000, radio: 195000, sales: 1320000, cover: '' },
      { title: 'Kaibutsu', streams: 860000000, radio: 175000, sales: 920000, cover: '' },
      { title: 'Yuusha', streams: 720000000, radio: 165000, sales: 810000, cover: '' }
    ],
    albums: [
      { title: 'THE BOOK 3', cover: '' },
      { title: 'THE BOOK 2', cover: '' },
      { title: 'THE BOOK', cover: '' }
    ]
  },
  {
    id: 'npc59',
    name: 'Fujii Kaze',
    pop: 88,
    hype: 90,
    tier: 1,
    country: 'JP',
    genre: 'J-Pop / R&B / Jazz-Soul',
    bio: 'Virtuoso Japanese singer-songwriter and pianist behind the global viral smash Shinunoga E-Wa and Michi Teyu Ku.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Shinunoga E-Wa', streams: 1180000000, radio: 190000, sales: 1050000, cover: '' },
      { title: 'Matsuri', streams: 680000000, radio: 165000, sales: 720000, cover: '' },
      { title: 'Kirari', streams: 790000000, radio: 175000, sales: 840000, cover: '' },
      { title: 'Michi Teyu Ku (Overflowing)', streams: 640000000, radio: 168000, sales: 690000, cover: '' }
    ],
    albums: [
      { title: 'LOVE ALL SERVE ALL', cover: '' },
      { title: 'HELP EVER HURT NEVER', cover: '' }
    ]
  },
  {
    id: 'npc60',
    name: 'Bernadya',
    pop: 89,
    hype: 94,
    tier: 2,
    country: 'ID',
    genre: 'Pop Indonesia / Folk-Pop',
    bio: 'Indonesian streaming record-breaker whose debut album Sialnya, Hidup Harus Tetap Berjalan dominated Spotify Top 50 Indonesia.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Untungnya, Hidup Harus Tetap Berjalan', streams: 690000000, radio: 185000, sales: 620000, cover: '' },
      { title: 'Satu Bulan', streams: 740000000, radio: 190000, sales: 660000, cover: '' },
      { title: 'Kata Mereka Ini Berlebihan', streams: 610000000, radio: 175000, sales: 540000, cover: '' },
      { title: 'Lama-Lama', streams: 560000000, radio: 168000, sales: 510000, cover: '' },
      { title: 'Apa Mungkin', streams: 680000000, radio: 180000, sales: 590000, cover: '' }
    ],
    albums: [
      { title: 'Sialnya, Hidup Harus Tetap Berjalan', cover: '' },
      { title: 'Terlintas', cover: '' }
    ]
  },
  {
    id: 'npc61',
    name: 'Tulus',
    pop: 89,
    hype: 91,
    tier: 2,
    country: 'ID',
    genre: 'Pop Indonesia / Soul-Jazz',
    bio: 'Multi-AMI Award-winning Indonesian icon behind Hati-Hati di Jalan and the landmark album Manusia.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Hati-Hati di Jalan', streams: 920000000, radio: 210000, sales: 820000, cover: '' },
      { title: 'Monokrom', streams: 740000000, radio: 185000, sales: 690000, cover: '' },
      { title: 'Interaksi', streams: 620000000, radio: 175000, sales: 580000, cover: '' },
      { title: 'Diri', streams: 580000000, radio: 168000, sales: 540000, cover: '' }
    ],
    albums: [
      { title: 'Manusia', cover: '' },
      { title: 'Monokrom', cover: '' },
      { title: 'Gajah', cover: '' }
    ]
  },
  {
    id: 'npc62',
    name: 'Mahalini',
    pop: 88,
    hype: 91,
    tier: 2,
    country: 'ID',
    genre: 'Pop Ballad / Pop Indonesia',
    bio: 'Indonesian vocal powerhouse whose emotional ballads Sial, Sisa Rasa, and Melawan Restu topped Southeast Asian charts.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Sial', streams: 790000000, radio: 195000, sales: 710000, cover: '' },
      { title: 'Sisa Rasa', streams: 720000000, radio: 185000, sales: 650000, cover: '' },
      { title: 'Melawan Restu', streams: 640000000, radio: 175000, sales: 590000, cover: '' },
      { title: 'Mati-Matian', streams: 580000000, radio: 168000, sales: 530000, cover: '' }
    ],
    albums: [
      { title: 'Fábula', cover: '' }
    ]
  },
  {
    id: 'npc63',
    name: 'Juicy Luicy',
    pop: 88,
    hype: 92,
    tier: 2,
    country: 'ID',
    genre: 'Pop Indonesia / Alternative Pop',
    bio: 'Bandung pop-soul band dominating Indonesian streaming charts with Lantas, Lampu Kuning, and Sialan.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Lantas', streams: 760000000, radio: 190000, sales: 680000, cover: '' },
      { title: 'Lampu Kuning', streams: 680000000, radio: 185000, sales: 620000, cover: '' },
      { title: 'Sialan', streams: 690000000, radio: 188000, sales: 640000, cover: '' },
      { title: 'Tampar', streams: 610000000, radio: 172000, sales: 560000, cover: '' }
    ],
    albums: [
      { title: 'Nonfiksi', cover: '' },
      { title: 'Sentimental', cover: '' }
    ]
  },
  {
    id: 'npc64',
    name: 'Hindia',
    pop: 87,
    hype: 90,
    tier: 2,
    country: 'ID',
    genre: 'Indie Rock / Alternative Pop',
    bio: 'Acclaimed Indonesian alt-pop storyteller Baskara Putra behind Evaluasi, Rumah Ke Rumah, and Cincin.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Rumah Ke Rumah', streams: 680000000, radio: 175000, sales: 610000, cover: '' },
      { title: 'Evaluasi', streams: 640000000, radio: 170000, sales: 580000, cover: '' },
      { title: 'Cincin', streams: 610000000, radio: 168000, sales: 550000, cover: '' },
      { title: 'Secukupnya', streams: 590000000, radio: 165000, sales: 530000, cover: '' }
    ],
    albums: [
      { title: 'Lagipula Hidup Akan Berakhir', cover: '' },
      { title: 'Menari Dengan Bayangan', cover: '' }
    ]
  },
  {
    id: 'npc65',
    name: 'Sal Priadi',
    pop: 87,
    hype: 91,
    tier: 2,
    country: 'ID',
    genre: 'Indie Pop / Chamber Pop',
    bio: 'Poetic Indonesian singer-songwriter whose viral smash Gala Bunga Matahari and Dari Planet Lain captivated millions.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Gala Bunga Matahari', streams: 690000000, radio: 188000, sales: 630000, cover: '' },
      { title: 'Dari Planet Lain', streams: 610000000, radio: 175000, sales: 560000, cover: '' },
      { title: 'Kita usahakan rumah itu', streams: 570000000, radio: 168000, sales: 520000, cover: '' },
      { title: 'Amin Paling Serius', streams: 540000000, radio: 160000, sales: 490000, cover: '' }
    ],
    albums: [
      { title: 'MARKERS AND SUCH PENS FLASHDISKS', cover: '' },
      { title: 'Berhati', cover: '' }
    ]
  },
  {
    id: 'npc66',
    name: 'NIKI',
    pop: 89,
    hype: 91,
    tier: 1,
    country: 'ID',
    genre: 'R&B / Indie Pop / Folk-Pop',
    bio: 'Jakarta-born global R&B and indie-pop star selling out arenas across North America, Asia, and Europe.',
    image: '',
    avatar: '',
    songs: [
      { title: 'High School in Jakarta', streams: 740000000, radio: 180000, sales: 680000, cover: '' },
      { title: 'Every Summertime', streams: 890000000, radio: 195000, sales: 810000, cover: '' },
      { title: 'lowkey', streams: 940000000, radio: 190000, sales: 850000, cover: '' },
      { title: 'You\'ll Be in My Heart', streams: 680000000, radio: 175000, sales: 640000, cover: '' }
    ],
    albums: [
      { title: 'Buzz', cover: '' },
      { title: 'Nicole', cover: '' },
      { title: 'MOONCHILD', cover: '' }
    ]
  },
  {
    id: 'npc67',
    name: 'Tiara Andini',
    pop: 87,
    hype: 89,
    tier: 2,
    country: 'ID',
    genre: 'Pop Indonesia / Ballad',
    bio: 'Indonesian pop star with multiple #1 hits including Usai, Janji Setia, and Kupu-Kupu.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Kupu-Kupu', streams: 610000000, radio: 178000, sales: 550000, cover: '' },
      { title: 'Usai', streams: 640000000, radio: 180000, sales: 580000, cover: '' },
      { title: 'Janji Setia', streams: 590000000, radio: 170000, sales: 530000, cover: '' },
      { title: 'Merasa Indah', streams: 620000000, radio: 175000, sales: 560000, cover: '' }
    ],
    albums: [
      { title: 'Tiara Andini', cover: '' }
    ]
  },
  {
    id: 'npc68',
    name: 'Lyodra',
    pop: 87,
    hype: 89,
    tier: 2,
    country: 'ID',
    genre: 'Pop Ballad / Orchestral Pop',
    bio: 'Powerhouse Indonesian vocalist celebrated for Pesan Terakhir, Sang Dewi, and Tak Dianggap.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Pesan Terakhir', streams: 690000000, radio: 185000, sales: 620000, cover: '' },
      { title: 'Sang Dewi', streams: 650000000, radio: 180000, sales: 590000, cover: '' },
      { title: 'Tak Dianggap', streams: 590000000, radio: 172000, sales: 540000, cover: '' },
      { title: 'Menyesal', streams: 560000000, radio: 168000, sales: 510000, cover: '' }
    ],
    albums: [
      { title: 'Melangkah', cover: '' },
      { title: 'Lyodra', cover: '' }
    ]
  },
  {
    id: 'npc69',
    name: 'Shakira',
    pop: 93,
    hype: 92,
    tier: 1,
    country: 'CO',
    genre: 'Latin Pop / Reggaeton',
    bio: 'Four-time Grammy and 15-time Latin Grammy winner whose Las Mujeres Ya No Lloran tour broke stadium attendance records.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Soltera', streams: 860000000, radio: 225000, sales: 890000, cover: '' },
      { title: 'Hips Don\'t Lie', streams: 1940000000, radio: 280000, sales: 1850000, cover: '' },
      { title: 'TQG', streams: 1480000000, radio: 235000, sales: 1240000, cover: '' },
      { title: 'Bzrp Music Sessions, Vol. 53', streams: 1260000000, radio: 215000, sales: 1120000, cover: '' }
    ],
    albums: [
      { title: 'Las Mujeres Ya No Lloran', cover: '' },
      { title: 'El Dorado', cover: '' },
      { title: 'Oral Fixation, Vol. 2', cover: '' }
    ]
  },
  {
    id: 'npc70',
    name: 'Rauw Alejandro',
    pop: 91,
    hype: 93,
    tier: 1,
    country: 'PR',
    genre: 'Reggaeton / Latin R&B',
    bio: 'Puerto Rican singer, dancer, and Urbano visionary dominating global Latin charts with Cosa Nuestra, Saturno, and Vice Versa.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Todo De Ti', streams: 1580000000, radio: 235000, sales: 1320000, cover: '' },
      { title: 'Khé?', streams: 740000000, radio: 185000, sales: 720000, cover: '' },
      { title: 'Santa', streams: 890000000, radio: 195000, sales: 840000, cover: '' },
      { title: 'Desesperados', streams: 1120000000, radio: 205000, sales: 960000, cover: '' }
    ],
    albums: [
      { title: 'Cosa Nuestra', cover: '' },
      { title: 'Saturno', cover: '' },
      { title: 'Vice Versa', cover: '' }
    ]
  },
  {
    id: 'npc71',
    name: 'Kali Uchis',
    pop: 90,
    hype: 91,
    tier: 1,
    country: 'US',
    genre: 'R&B / Neo-Soul / Latin Pop',
    bio: 'Grammy-winning Colombian-American bilingual auteur behind telepatía, Moonlight, and ORQUÍDEAS.',
    image: '',
    avatar: '',
    songs: [
      { title: 'telepatía', streams: 1620000000, radio: 235000, sales: 1380000, cover: '' },
      { title: 'Moonlight', streams: 980000000, radio: 195000, sales: 890000, cover: '' },
      { title: 'Igual Que Un Ángel', streams: 780000000, radio: 180000, sales: 740000, cover: '' },
      { title: 'After The Storm', streams: 1090000000, radio: 185000, sales: 920000, cover: '' }
    ],
    albums: [
      { title: 'ORQUÍDEAS', cover: '' },
      { title: 'Red Moon in Venus', cover: '' },
      { title: 'Sin Miedo (del Amor y Otros Demonios)', cover: '' }
    ]
  },
  {
    id: 'npc72',
    name: 'Arctic Monkeys',
    pop: 93,
    hype: 90,
    tier: 1,
    country: 'GB',
    genre: 'Indie Rock / Garage Rock',
    bio: 'Sheffield rock legends whose iconic album AM is the most-streamed rock album in history.',
    image: '',
    avatar: '',
    songs: [
      { title: 'I Wanna Be Yours', streams: 2790000000, radio: 245000, sales: 1950000, cover: '' },
      { title: '505', streams: 2150000000, radio: 220000, sales: 1680000, cover: '' },
      { title: 'Do I Wanna Know?', streams: 2480000000, radio: 265000, sales: 1890000, cover: '' },
      { title: 'Why\'d You Only Call Me When You\'re High?', streams: 1820000000, radio: 215000, sales: 1450000, cover: '' }
    ],
    albums: [
      { title: 'AM', cover: '' },
      { title: 'Favourite Worst Nightmare', cover: '' },
      { title: 'The Car', cover: '' }
    ]
  },
  {
    id: 'npc73',
    name: 'Linkin Park',
    pop: 93,
    hype: 94,
    tier: 1,
    country: 'US',
    genre: 'Alternative Rock / Nu Metal',
    bio: 'Diamond-certified rock icons uniting generations with Hybrid Theory, Meteora, and their chart-topping comeback From Zero.',
    image: '',
    avatar: '',
    songs: [
      { title: 'In the End', streams: 2420000000, radio: 285000, sales: 2150000, cover: '' },
      { title: 'Numb', streams: 2190000000, radio: 275000, sales: 1980000, cover: '' },
      { title: 'The Emptiness Machine', streams: 860000000, radio: 225000, sales: 940000, cover: '' },
      { title: 'Heavy Is the Crown', streams: 690000000, radio: 195000, sales: 780000, cover: '' }
    ],
    albums: [
      { title: 'From Zero', cover: '' },
      { title: 'Meteora', cover: '' },
      { title: 'Hybrid Theory', cover: '' }
    ]
  },
  {
    id: 'npc74',
    name: 'Imagine Dragons',
    pop: 92,
    hype: 89,
    tier: 1,
    country: 'US',
    genre: 'Pop Rock / Arena Rock',
    bio: 'Las Vegas arena rock hitmakers holding four RIAA Diamond-certified singles including Believer, Thunder, and Radioactive.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Believer', streams: 3290000000, radio: 310000, sales: 2350000, cover: '' },
      { title: 'Thunder', streams: 2610000000, radio: 285000, sales: 1980000, cover: '' },
      { title: 'Demons', streams: 2480000000, radio: 270000, sales: 1920000, cover: '' },
      { title: 'Bones', streams: 1580000000, radio: 225000, sales: 1240000, cover: '' }
    ],
    albums: [
      { title: 'LOOM', cover: '' },
      { title: 'Evolve', cover: '' },
      { title: 'Night Visions', cover: '' }
    ]
  },
  {
    id: 'npc75',
    name: 'Frank Ocean',
    pop: 91,
    hype: 93,
    tier: 1,
    country: 'US',
    genre: 'Alternative R&B / Art Pop',
    bio: 'Generational R&B visionary whose timeless albums Blonde and channel ORANGE remain permanent fixtures on global charts.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Pink + White', streams: 1690000000, radio: 195000, sales: 1320000, cover: '' },
      { title: 'Thinkin Bout You', streams: 1480000000, radio: 210000, sales: 1280000, cover: '' },
      { title: 'Ivy', streams: 1290000000, radio: 175000, sales: 1050000, cover: '' },
      { title: 'Nights', streams: 1180000000, radio: 170000, sales: 980000, cover: '' }
    ],
    albums: [
      { title: 'Blonde', cover: '' },
      { title: 'channel ORANGE', cover: '' }
    ]
  },
  {
    id: 'npc76',
    name: 'Doechii',
    pop: 89,
    hype: 95,
    tier: 1,
    country: 'US',
    genre: 'Hip-Hop / Alternative Rap / R&B',
    bio: 'Grammy Best Rap Album winner electrifying the industry with Alligator Bites Never Heal, DENIAL IS A RIVER, and Anxiety.',
    image: '',
    avatar: '',
    songs: [
      { title: 'DENIAL IS A RIVER', streams: 790000000, radio: 210000, sales: 780000, cover: '' },
      { title: 'What It Is (Block Boy)', streams: 860000000, radio: 225000, sales: 820000, cover: '' },
      { title: 'NISSAN ALTIMA', streams: 590000000, radio: 175000, sales: 610000, cover: '' },
      { title: 'Anxiety', streams: 740000000, radio: 195000, sales: 710000, cover: '' }
    ],
    albums: [
      { title: 'Alligator Bites Never Heal', cover: '' }
    ]
  },
  {
    id: 'npc77',
    name: 'GloRilla',
    pop: 88,
    hype: 92,
    tier: 1,
    country: 'US',
    genre: 'Southern Hip-Hop / Crunk Rap',
    bio: 'Memphis rap powerhouse delivering back-to-back Billboard Hot 100 smashes TGIF, Yeah Glo!, and WHATCHU KNO ABOUT ME.',
    image: '',
    avatar: '',
    songs: [
      { title: 'TGIF', streams: 690000000, radio: 195000, sales: 720000, cover: '' },
      { title: 'Yeah Glo!', streams: 740000000, radio: 205000, sales: 760000, cover: '' },
      { title: 'WHATCHU KNO ABOUT ME', streams: 680000000, radio: 190000, sales: 690000, cover: '' }
    ],
    albums: [
      { title: 'GLORIOUS', cover: '' }
    ]
  },
  {
    id: 'npc78',
    name: 'Megan Thee Stallion',
    pop: 90,
    hype: 91,
    tier: 1,
    country: 'US',
    genre: 'Hip-Hop / Houston Rap',
    bio: 'Three-time Grammy winner with multiple Billboard Hot 100 #1 hits including HISS, Savage, and global viral hit Mamushi.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Mamushi', streams: 790000000, radio: 185000, sales: 780000, cover: '' },
      { title: 'HISS', streams: 680000000, radio: 180000, sales: 740000, cover: '' },
      { title: 'Savage', streams: 1180000000, radio: 235000, sales: 1150000, cover: '' }
    ],
    albums: [
      { title: 'MEGAN', cover: '' },
      { title: 'Good News', cover: '' }
    ]
  },
  {
    id: 'npc79',
    name: 'Gunna',
    pop: 89,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Melodic Trap / Hip-Hop',
    bio: 'Atlanta melodic rap star behind global smash fukumean and consecutive top-charting albums A Gift & a Curse and One of Wun.',
    image: '',
    avatar: '',
    songs: [
      { title: 'fukumean', streams: 1190000000, radio: 225000, sales: 1050000, cover: '' },
      { title: 'one of wun', streams: 680000000, radio: 180000, sales: 640000, cover: '' },
      { title: 'pushin P', streams: 790000000, radio: 185000, sales: 720000, cover: '' }
    ],
    albums: [
      { title: 'One of Wun', cover: '' },
      { title: 'A Gift & a Curse', cover: '' },
      { title: 'DS4EVER', cover: '' }
    ]
  },
  {
    id: 'npc80',
    name: 'Don Toliver',
    pop: 89,
    hype: 91,
    tier: 1,
    country: 'US',
    genre: 'Psychedelic Trap / R&B',
    bio: 'Cactus Jack vocalist and hitmaker acclaimed for HARDSTONE PSYCHO, Bandit, No Idea, and Private Landing.',
    image: '',
    avatar: '',
    songs: [
      { title: 'No Idea', streams: 1180000000, radio: 195000, sales: 980000, cover: '' },
      { title: 'Bandit', streams: 690000000, radio: 180000, sales: 660000, cover: '' },
      { title: 'NEW DROP', streams: 640000000, radio: 175000, sales: 610000, cover: '' },
      { title: 'After Party', streams: 960000000, radio: 185000, sales: 840000, cover: '' }
    ],
    albums: [
      { title: 'HARDSTONE PSYCHO', cover: '' },
      { title: 'Love Sick', cover: '' },
      { title: 'Heaven or Hell', cover: '' }
    ]
  },
  {
    id: 'npc81',
    name: 'Rema',
    pop: 90,
    hype: 92,
    tier: 1,
    country: 'NG',
    genre: 'Afrobeats / Afrorave',
    bio: 'Nigerian Afrorave pioneer whose global anthem Calm Down became the highest-charting African song in Billboard history.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Calm Down', streams: 2450000000, radio: 340000, sales: 1980000, cover: '' },
      { title: 'Ozeba', streams: 590000000, radio: 170000, sales: 560000, cover: '' },
      { title: 'BABY (IS IT A CRIME)', streams: 620000000, radio: 180000, sales: 610000, cover: '' },
      { title: 'Charm', streams: 680000000, radio: 175000, sales: 640000, cover: '' }
    ],
    albums: [
      { title: 'HEIS', cover: '' },
      { title: 'Rave & Roses', cover: '' }
    ]
  },
  {
    id: 'npc82',
    name: 'Laufey',
    pop: 88,
    hype: 91,
    tier: 1,
    country: 'IS',
    genre: 'Jazz Pop / Traditional Pop',
    bio: 'Grammy-winning Icelandic-Chinese jazz-pop virtuoso bringing bossa nova and orchestral romance to Gen-Z audiences.',
    image: '',
    avatar: '',
    songs: [
      { title: 'From The Start', streams: 1090000000, radio: 195000, sales: 920000, cover: '' },
      { title: 'Falling Behind', streams: 740000000, radio: 175000, sales: 680000, cover: '' },
      { title: 'Valentine', streams: 690000000, radio: 170000, sales: 640000, cover: '' },
      { title: 'Promise', streams: 620000000, radio: 165000, sales: 590000, cover: '' }
    ],
    albums: [
      { title: 'Bewitched', cover: '' },
      { title: 'Everything I Know About Love', cover: '' }
    ]
  },
  {
    id: 'npc83',
    name: 'Clairo',
    pop: 88,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Indie Pop / Soft Rock / Bedroom Pop',
    bio: 'Indie-pop darling whose warm analog album Charm and viral classics Juna and Sofia captivated listeners worldwide.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Sofia', streams: 1280000000, radio: 185000, sales: 980000, cover: '' },
      { title: 'Juna', streams: 680000000, radio: 175000, sales: 640000, cover: '' },
      { title: 'Sexy to Someone', streams: 610000000, radio: 168000, sales: 580000, cover: '' },
      { title: 'Pretty Girl', streams: 890000000, radio: 170000, sales: 760000, cover: '' }
    ],
    albums: [
      { title: 'Charm', cover: '' },
      { title: 'Immunity', cover: '' }
    ]
  },
  {
    id: 'npc84',
    name: 'Beabadoobee',
    pop: 88,
    hype: 91,
    tier: 1,
    country: 'GB',
    genre: 'Indie Rock / Alternative Pop',
    bio: 'Filipino-British indie-rock star whose UK #1 album This Is How Tomorrow Moves and Glue Song became global streaming hits.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Glue Song', streams: 860000000, radio: 180000, sales: 740000, cover: '' },
      { title: 'Real Man', streams: 590000000, radio: 170000, sales: 560000, cover: '' },
      { title: 'the perfect pair', streams: 780000000, radio: 175000, sales: 690000, cover: '' },
      { title: 'Take A Bite', streams: 560000000, radio: 165000, sales: 530000, cover: '' }
    ],
    albums: [
      { title: 'This Is How Tomorrow Moves', cover: '' },
      { title: 'Beatopia', cover: '' }
    ]
  },
  {
    id: 'npc85',
    name: 'Shaboozey',
    pop: 89,
    hype: 93,
    tier: 1,
    country: 'US',
    genre: 'Country Pop / Hip-Hop',
    bio: 'Virginia genre-blending trailblazer whose A Bar Song (Tipsy) tied the all-time record for most weeks at #1 on the Hot 100.',
    image: '',
    avatar: '',
    songs: [
      { title: 'A Bar Song (Tipsy)', streams: 1680000000, radio: 345000, sales: 1850000, cover: '' },
      { title: 'Good News', streams: 590000000, radio: 185000, sales: 610000, cover: '' },
      { title: 'Last Of My Kind', streams: 520000000, radio: 165000, sales: 510000, cover: '' }
    ],
    albums: [
      { title: "Where I've Been, Isn't Where I'm Going", cover: '' }
    ]
  },
  {
    id: 'npc86',
    name: 'Luke Combs',
    pop: 91,
    hype: 90,
    tier: 1,
    country: 'US',
    genre: 'Country',
    bio: 'Multi-CMA Entertainer of the Year and country stadium titan behind Fast Car, Beautiful Crazy, and Ain\'t No Love in Oklahoma.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Fast Car', streams: 1480000000, radio: 310000, sales: 1560000, cover: '' },
      { title: 'Beautiful Crazy', streams: 1320000000, radio: 265000, sales: 1420000, cover: '' },
      { title: 'Where the Wild Things Are', streams: 790000000, radio: 225000, sales: 840000, cover: '' },
      { title: 'When It Rains It Pours', streams: 1180000000, radio: 250000, sales: 1290000, cover: '' }
    ],
    albums: [
      { title: 'Fathers & Sons', cover: '' },
      { title: "Gettin' Old", cover: '' },
      { title: "This One's for You", cover: '' }
    ]
  },
  {
    id: 'npc87',
    name: 'RAYE',
    pop: 89,
    hype: 92,
    tier: 1,
    country: 'GB',
    genre: 'R&B / Jazz-Soul / Dance-Pop',
    bio: 'History-making six-time BRIT Award winner in a single night with Escapism., Prada, and My 21st Century Blues.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Escapism.', streams: 1290000000, radio: 235000, sales: 1150000, cover: '' },
      { title: 'Prada', streams: 980000000, radio: 215000, sales: 890000, cover: '' },
      { title: 'Worth It.', streams: 590000000, radio: 175000, sales: 560000, cover: '' }
    ],
    albums: [
      { title: 'My 21st Century Blues', cover: '' }
    ]
  },
  {
    id: 'npc88',
    name: 'Shawn Mendes',
    pop: 90,
    hype: 88,
    tier: 1,
    country: 'CA',
    genre: 'Pop / Folk-Pop',
    bio: 'Canadian multi-platinum singer-songwriter with four #1 Billboard 200 debuts and multi-billion stream classics.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Señorita', streams: 2890000000, radio: 295000, sales: 2100000, cover: '' },
      { title: 'Treat You Better', streams: 2240000000, radio: 265000, sales: 1780000, cover: '' },
      { title: 'There\'s Nothing Holdin\' Me Back', streams: 2180000000, radio: 270000, sales: 1740000, cover: '' },
      { title: 'Why Why Why', streams: 590000000, radio: 175000, sales: 560000, cover: '' }
    ],
    albums: [
      { title: 'Shawn', cover: '' },
      { title: 'Wonder', cover: '' },
      { title: 'Illuminate', cover: '' }
    ]
  },
  {
    id: 'npc89',
    name: 'Katy Perry',
    pop: 91,
    hype: 88,
    tier: 1,
    country: 'US',
    genre: 'Pop / Dance-Pop',
    bio: 'Pop superstar with nine Billboard Hot 100 #1 hits and the historic Teenage Dream era.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Dark Horse', streams: 1980000000, radio: 280000, sales: 1950000, cover: '' },
      { title: 'Roar', streams: 1850000000, radio: 275000, sales: 1890000, cover: '' },
      { title: 'Last Friday Night (T.G.I.F.)', streams: 1580000000, radio: 255000, sales: 1640000, cover: '' },
      { title: 'Teenage Dream', streams: 1490000000, radio: 260000, sales: 1620000, cover: '' }
    ],
    albums: [
      { title: 'Teenage Dream', cover: '' },
      { title: 'PRISM', cover: '' },
      { title: '143', cover: '' }
    ]
  },
  {
    id: 'npc90',
    name: 'Selena Gomez',
    pop: 91,
    hype: 89,
    tier: 1,
    country: 'US',
    genre: 'Pop / Dance-Pop / R&B',
    bio: 'Global pop star and actress behind #1 smash Lose You to Love Me, Calm Down (Remix), and Rare.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Lose You to Love Me', streams: 1580000000, radio: 265000, sales: 1450000, cover: '' },
      { title: 'Wolves', streams: 1490000000, radio: 235000, sales: 1320000, cover: '' },
      { title: 'Good for You', streams: 1120000000, radio: 215000, sales: 1080000, cover: '' },
      { title: 'Single Soon', streams: 690000000, radio: 185000, sales: 660000, cover: '' }
    ],
    albums: [
      { title: 'Rare', cover: '' },
      { title: 'Revival', cover: '' }
    ]
  },
  {
    id: 'npc91',
    name: 'Daniel Caesar',
    pop: 89,
    hype: 90,
    tier: 1,
    country: 'CA',
    genre: 'R&B / Neo-Soul',
    bio: 'Grammy-winning Canadian R&B singer-songwriter behind timeless soul classics Best Part, Get You, and Always.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Best Part', streams: 1920000000, radio: 225000, sales: 1540000, cover: '' },
      { title: 'Get You', streams: 1480000000, radio: 195000, sales: 1240000, cover: '' },
      { title: 'Always', streams: 890000000, radio: 180000, sales: 790000, cover: '' },
      { title: 'Japanese Denim', streams: 940000000, radio: 175000, sales: 820000, cover: '' }
    ],
    albums: [
      { title: 'NEVER ENOUGH', cover: '' },
      { title: 'Freudian', cover: '' }
    ]
  },
  {
    id: 'npc92',
    name: 'IU',
    pop: 90,
    hype: 92,
    tier: 1,
    country: 'KR',
    genre: 'K-Pop / Ballad / Indie Pop',
    bio: 'South Korea\'s most beloved solo singer-songwriter with record-breaking stadium tours and 20+ #1 Circle Digital hits.',
    image: '',
    avatar: '',
    songs: [
      { title: 'Love wins all', streams: 740000000, radio: 185000, sales: 890000, cover: '' },
      { title: 'LILAC', streams: 690000000, radio: 175000, sales: 820000, cover: '' },
      { title: 'eight', streams: 780000000, radio: 180000, sales: 860000, cover: '' },
      { title: 'Celebrity', streams: 720000000, radio: 172000, sales: 810000, cover: '' }
    ],
    albums: [
      { title: 'The Winning', cover: '' },
      { title: 'LILAC', cover: '' },
      { title: 'Palette', cover: '' }
    ]
  }
];
