# Rencana Implementasi: The GRAMMY Awards & MTV Video Music Awards (VMAs)

Pembaruan ini menghadirkan dua ajang penghargaan musik paling bergengsi di dunia ke dalam game—**The GRAMMY Awards** dan **MTV Video Music Awards (VMAs)**—dengan aplikasi terpisah, identitas visual autentik yang mencerminkan masing-masing penghargaan, daftar kategori lengkap seperti di dunia nyata, formula pemilihan nominasi & pemenang yang adil antara Player dan NPC, **Artist Profile Trophy Room**, serta pengumuman otomatis secara mendetail di **X (Twitter)**.

---

## 1. Dua Aplikasi Terpisah & Identitas Visual Autentik

Di dalam tab **Apps & Services**, akan ditambahkan kategori baru **Awards & Honors** yang berisi dua aplikasi mandiri:

### A. Aplikasi The GRAMMY Awards (`GrammyAwardsApp.tsx`)
- **Identitas Visual**: *Recording Academy Prestige* — palet warna Obsidian Black (`#0A0A0C`), Brushed Champagne Gold (`#D4AF37`), dan Warm Ivory, dipadukan dengan tipografi editorial serif klasik untuk tajuk utama serta angka tabular untuk statistik.
- **Fitur Utama di Dalam Aplikasi**:
  1. **Season Tracker & Kalender Tahunan**: Menampilkan fase musim penghargaan saat ini:
     - *Eligibility & FYC Submission Window* (Sepanjang tahun hingga pengumuman nominasi)
     - *Official Nominations Announcement* (15 November setiap tahun)
     - *Final Academy Voting & FYC Campaign* (15 November – 4 Februari)
     - *Grammy Ceremony Night* (5 Februari setiap tahun)
  2. **Daftar Kategori Lengkap (20 Kategori Asli)**:
     - **General Field (The Big Four)**: *Record of the Year*, *Album of the Year*, *Song of the Year*, *Best New Artist*.
     - **Pop Field**: *Best Pop Solo Performance*, *Best Pop Duo/Group Performance*, *Best Pop Vocal Album*, *Best Dance Pop Recording*.
     - **Rap / Hip-Hop Field**: *Best Rap Performance*, *Best Melodic Rap Performance*, *Best Rap Song*, *Best Rap Album*.
     - **R&B Field**: *Best R&B Performance*, *Best R&B Song*, *Best R&B Album*.
     - **Rock, Alternative & Global Field**: *Best Rock/Alternative Performance*, *Best Latin/Global Music Performance*, *Best Dance/Electronic Recording*.
     - **Craft & Visual Field**: *Producer of the Year (Non-Classical)*, *Best Music Video*.
  3. **Submission & FYC ("For Your Consideration") Campaign**:
     - Lagu, album/EP, dan MV yang dirilis dalam periode kelayakan otomatis terdaftar.
     - Player dapat memilih lagu/album/MV unggulan untuk diajukan ke kategori utama dan menjalankan kampanye *For Your Consideration (FYC)* guna meningkatkan perhatian panelis Recording Academy.
  4. **Historical Archive (Hall of Past Winners)**: Arsip lengkap seluruh pemenang dan nominasi dari tahun ke tahun (baik Player maupun NPC).

### B. Aplikasi MTV Video Music Awards / VMAs (`MtvVmasApp.tsx`)
- **Identitas Visual**: *High-Voltage Moon Person Stage* — palet warna Deep Carbon (`#09090F`), Chrome Metallic Silver (`#E2E8F0`), Electric Magenta (`#FF1E8A`), dan Cyber Cyan (`#00F0FF`) dengan gaya panggung festival malam penghargaan MTV.
- **Fitur Utama di Dalam Aplikasi**:
  1. **Season Tracker & Kalender Tahunan**:
     - *Official VMA Nominations* (1 Agustus setiap tahun)
     - *Fan Voting Period* (1 Agustus – 11 September)
     - *MTV VMAs Live Ceremony Night* (12 September setiap tahun)
  2. **Daftar Kategori Lengkap (16 Kategori Asli)**:
     - **Major Categories**: *Video of the Year*, *Artist of the Year*, *Song of the Year*, *Best New Artist*, *Best Collaboration*, *Song of the Summer*.
     - **Genre Video Categories**: *Best Pop*, *Best Hip-Hop*, *Best R&B*, *Best K-Pop*, *Best Latin*, *Best Afrobeats*, *Best Rock / Alternative*.
     - **Professional & Technical Craft Categories**: *Best Direction*, *Best Cinematography*, *Best Visual Effects & Choreography*.
  3. **Submission & Fan Voting Mobilization**:
     - MV dan lagu otomatis masuk seleksi, ditambah opsi bagi Player untuk memilih video andalan dan menggerakkan *Fanbase Voting Rally* sebelum malam puncak.
  4. **VMA Moon Person Archive**: Riwayat pemenang dan nominasi VMA setiap tahun.

---

## 2. Formula Pemilihan Nominasi & Pemenang (Player & NPC Setara)

Sistem penilaian menggunakan data nyata dari performa lagu, album, MV, chart Billboard, serta atribut artis (baik Player maupun NPC dari `npcLivingArtistAttributesAndMarketEngine`):

- **Formula The GRAMMY Awards (Academy-Weighted)**:
  $$\text{Grammy Score} = (0.40 \times \text{Quality & Craft Mastery}) + (0.25 \times \text{Billboard Chart Peak & Longevity}) + (0.20 \times \text{Streams & Pure Sales Impact}) + (0.10 \times \text{Cultural Stature & Popularity}) + (0.05 \times \text{FYC Campaign Bonus})$$
  - *General Field* dan *Craft Categories* menitikberatkan pada kualitas produksi/penulisan lagu serta dampak kultural, sehingga lagu berkualitas tinggi memiliki peluang menang yang realistis melawan lagu komersial.
- **Formula MTV VMAs (Fan & Viral Visual-Weighted)**:
  $$\text{VMA Score} = (0.35 \times \text{YouTube MV Views & Likes Velocity}) + (0.25 \times \text{Dedicated Fans & Stan Voting Power}) + (0.20 \times \text{Viral Hype & Stream Momentum}) + (0.15 \times \text{Billboard Hot 100 / Global 200 Impact}) + (0.05 \times \text{Fan Voting Campaign})$$
  - Kategorinya sangat menghargai performa Music Video di YouTube, kekuatan fanbase/stan, dan kehebohan viral.

---

## 3. Interactive Live Ceremony Night (`AwardCeremonyLiveModal.tsx`)

Saat tanggal malam puncak tiba (**5 Februari** untuk GRAMMYs, **12 September** untuk MTV VMAs):
- Muncul layar interaktif **Live Ceremony Night** dengan desain khusus sesuai acara (Emas/Obsidian untuk Grammy, Perak Moon Person/Neon untuk VMA).
- Player dapat membuka amplop kategori demi kategori (*"And the GRAMMY goes to..."* / *"And the Moon Person goes to..."*) atau melihat rekapitulasi langsung, lengkap dengan papan skor pemenang terbanyak malam itu (*Night's Biggest Winners*).

---

## 4. Artist Profile Trophy Room (`ArtistTrophyRoomModal.tsx`)

Sesuai permintaanmu, **Artist Profile berfungsi sebagai Trophy Room**:
- Pada **Dashboard / Artist Profile** (serta profil artis), terdapat kartu & tampilan **Artist Profile & Trophy Room** yang menampilkan:
  - Total **GRAMMY Wins** & **GRAMMY Nominations**
  - Total **MTV VMA Moon Persons** & **VMA Nominations**
  - Daftar lengkap piala yang pernah dimenangkan beserta tahun, kategori, dan judul lagu/album/MV (baik untuk Player maupun rekap piala milik NPC papan atas).

---

## 5. Pengumuman Lengkap di X / Twitter (`awardsXAnnouncementEngine.ts`)

Setiap kali pengumuman nominasi (**15 Nov** & **1 Agu**) dan malam penghargaan (**5 Feb** & **12 Sep**) berlangsung, feed **X (Twitter)** otomatis mempublikasikan laporan lengkap baik saat Player menang maupun saat NPC menang:
1. **Breaking Nominations Thread**:
   - Pengumuman daftar nominasi kategori utama (*Record of the Year*, *Album of the Year*, *Video of the Year*, dll.).
   - Rekapitulasi artis dengan jumlah nominasi terbanyak (*"Most Nominated Artists at the GRAMMYs: @Artist leads with 8 nods..."*).
2. **Live Winner Announcements (Player & NPC)**:
   - Cuitan resmi dari `@RecordingAcad`, `@vmas`, `@chartdata`, dan `@PopBase` yang mengumumkan siapa pemenang di tiap kategori besar beserta karya yang menang.
3. **Final Trophy Haul Recap**:
   - Pengumuman akhir malam penghargaan tentang siapa yang membawa pulang piala terbanyak (*"MOST WINS TONIGHT: @Artist sweeps the ceremony taking home 5 trophies!"*) serta reaksi fanbase di X.

---

## 6. Struktur File Modular (1 Fitur = 1 File Terpisah)

Sesuai aturan modularitas agar bebas dari error, seluruh fitur baru dibangun dalam file terpisah:
- `src/data/awardsCategoriesConfig.ts` — Definisi lengkap 20 kategori GRAMMY & 16 kategori MTV VMA beserta syarat kelayakannya.
- `src/data/awardsFormulaAndSimulationEngine.ts` — Mesin kalkulasi skor nominasi, pemilihan pemenang (Player vs NPC), FYC/Voting campaign, dan penyimpanan riwayat piala.
- `src/data/awardsXAnnouncementEngine.ts` — Generator otomatis cuitan X/Twitter untuk pengumuman nominasi, pemenang tiap kategori, dan rekap jumlah piala yang dibawa pulang.
- `src/components/Apps/GrammyAwardsApp.tsx` — Aplikasi mandiri The GRAMMY Awards.
- `src/components/Apps/MtvVmasApp.tsx` — Aplikasi mandiri MTV Video Music Awards (VMAs).
- `src/components/Modals/AwardCeremonyLiveModal.tsx` — Layar interaktif malam puncak penghargaan (amplop pemenang & papan skor piala).
- `src/components/Modals/ArtistTrophyRoomModal.tsx` — Tampilan Artist Profile & Trophy Room lengkap.
- Integrasi ringan pada `src/types.ts`, `src/hooks/useGame.ts`, `src/components/Tabs/AppsTab.tsx`, `src/components/Tabs/Dashboard.tsx`, dan `src/MainApp.tsx`.
