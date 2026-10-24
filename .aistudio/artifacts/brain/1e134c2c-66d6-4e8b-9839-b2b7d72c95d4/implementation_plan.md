# Sistem Public Chemistry & Kurva Umur Lagu (Flop / Biasa / Normal / Hit / Mega Hit)

Menghadirkan dinamika resepsi publik yang organik setelah rilis lagu—di mana setiap rilis memiliki nasib umur chart yang berbeda (**Flop, Biasa/Underperform, Normal, Hit, Sleeper Hit, hingga Mega Hit**) berdasarkan kualitas lagu, kecocokan tren pasar, dan faktor kejutan organik, **tanpa mengubah angka debut Hari Pertama (Day 1)** dan **tanpa label bocoran di UI** sehingga pemain merasakannya langsung dari pergerakan stream dan posisi chart.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Rencana ini disusun langsung berdasarkan pilihan yang telah kamu konfirmasi:

- **Tanpa Spoiler / Label di UI (Confirmed)**: Sistem bekerja secara *invisible* di balik layar. Pemain tidak diberitahu lewat teks/badge apakah lagunya Flop atau Mega Hit, melainkan menyadarinya sendiri saat melihat grafik stream harian dan ketahanan lagu di chart dari minggu ke minggu.
- **3 Pilar Penentu Public Chemistry (Confirmed)**: Nasib lagu setelah debut ditentukan oleh kombinasi **(1) Kualitas & Sinergi Lagu**, **(2) Kecocokan dengan Tren Pasar Saat Rilis (Market Trend Alignment)**, dan **(3) Faktor Kejutan Organik (Organic Zeitgeist Roll)**.
- **Debut Hari Pertama Tetap Utuh (Confirmed)**: Angka rilis di **Hari ke-1 (`Day 0`) tidak diubah sama sekali** karena didorong oleh ukuran fanbase, Hype, dan promosi awal. Efek Public Chemistry baru bekerja membentuk **kurva retensi, lonjakan minggu ke-2/ke-3, atau penurunan tajam** mulai hari-hari berikutnya.
- **Modular & Terpisah (Confirmed)**: Seluruh logika Public Chemistry & Market Trend dibangun di modul terpisah yang mandiri agar aman dan bebas konflik dengan formula dasar yang sudah ada.

---

### 1. Overview & Core Concept

- **Apa yang Dilakukan Sistem Ini**:
  Di industri musik nyata, hari pertama rilis mencerminkan seberapa besar fanbase dan antisipasi terhadap artis tersebut (*front-loaded hype*). Namun, apakah lagu tersebut bertahan 20 minggu di Top 10 atau langsung terjun bebas di minggu ke-2 ditentukan oleh **Public Chemistry** (apakah masyarakat umum / *General Public* suka dan memutar ulang lagu tersebut).
- **6 Profil Kurva Umur Lagu (Tersembunyi di Balik Layar)**:
  1. **Front-Loaded Flop**: Debut Hari ke-1 tetap besar sesuai level artis, tetapi publik umum kurang cocok. Mulai Hari ke-3 hingga Minggu ke-2 stream turun drastis (`-65%` s/d `-82%` dari debut) dan cepat keluar dari chart.
  2. **Underperform (Biasa)**: Bertahan wajar di minggu pertama karena didorong fans, namun mulai melemah cukup cepat di Minggu ke-2 dan ke-3 (`-50%` s/d `-65%`) tanpa daya tahan jangka panjang.
  3. **Normal Release**: Siklus standar single/album yang sehat—turun perlahan secara alami dari minggu ke minggu sesuai usia rilis.
  4. **Solid Hit**: Disukai publik dan radio; penurunan mingguan sangat landai sehingga awet di chart selama 6–10 minggu.
  5. **Sleeper Hit (Viral Lambat)**: Debut Hari ke-1 terlihat normal, sempat turun sedikit di hari ke-3, tetapi mulai Hari ke-8 hingga Hari ke-24 justru **naik kembali (Second-Wind Surge)** karena algoritma/mulut ke mulut dan bertahan lama di chart.
  6. **Cultural Mega Hit**: Lagu yang benar-benar mengunci selera pasar; setelah debut besar, stream hariannya sangat stabil di puncak selama berminggu-minggu (bahkan bisa mencetak *re-peak* di minggu ke-2/ke-3) dan memiliki *catalog floor* jangka panjang yang tinggi.

---

### 2. User Experience & Simulasi Pergerakan Chart

- **Pengalaman Pemain dari Hari ke Hari**:
  - **Hari ke-1 (Debut Day)**: Pemain merilis single atau album. Angka stream dan penjualan debut keluar persis menggunakan perhitungan dasar game yang sudah ada.
  - **Hari ke-2 s/d Hari ke-6 (Fase Uji Publik)**: Semua lagu mengalami *post-debut cooldown* alami, namun lagu yang kurang klik dengan pasar mulai terlihat turun lebih cepat, sedangkan lagu dengan *Public Chemistry* tinggi menahan penurunannya dengan kuat.
  - **Minggu ke-2 s/d Minggu ke-6 (Fase Penentuan Nasib Era)**:
    - Jika lagu adalah **Flop / Biasa**, pemain akan melihat lagunya merosot tajam di Spotify Global Chart dan Billboard Hot 100 meskipun debut awalnya tinggi.
    - Jika lagu adalah **Sleeper Hit**, pemain akan merasakan kejutan menyenangkan ketika lagu yang awalnya biasa saja tiba-tiba merangkak naik setiap hari di minggu ke-2 dan ke-3.
    - Jika lagu adalah **Mega Hit**, lagu tersebut mendominasi papan atas chart lintas minggu dengan penurunan harian yang sangat tipis.
- **Tanpa Elemen UI Tambahan**:
  Tidak ada *popup*, *toast*, atau indikator teks yang membocorkan status internal lagu. Semua tercermin secara organik pada angka stream harian, pergerakan *rank* (`+`, `-`, `PEAK`), dan grafik di aplikasi chart yang sudah ada.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mengapa Hari ke-1 (Debut) Dipertahankan 100%?**
  - *Chosen Approach*: Mengunci multiplier Public Chemistry pada nilai netral (`1.0x`) saat `daysSinceRelease === 0`, dan baru mengaktifkan kurva divergensi secara bertahap mulai `daysSinceRelease >= 1`.
  - *Why*: Menjaga kepuasan saat rilis awal (di mana promosi, Hype, dan ukuran fanbase tetap dihargai penuh di hari pertama) sekaligus membuat kelanjutan era terasa mendebarkan karena debut besar belum tentu menjamin bertahan lama.
- **Decision 2: Bagaimana "Kecocokan Tren Pasar" (Market Trend Alignment) Bekerja Tanpa Terlihat Kaku?**
  - *Chosen Approach*: Pasar musik memiliki gelombang tren dinamis yang berputar secara organik berdasarkan kalender permainan (kombinasi bulan/musim dan siklus pasar untuk Genre, Tema, dan nuansa vokal/produksi).
  - *Why*: Membuat pemilihan genre, subgenre, tema, dan gaya rekaman terasa hidup—lagu yang kebetulan pas dengan gelombang selera pasar saat itu punya peluang lebih besar menjadi *Hit* atau *Mega Hit*, sementara kombinasi yang berlawanan arus atau kurang sinergis berisiko menjadi *Front-Loaded Flop* kecuali diselamatkan oleh kualitas tinggi atau faktor kejutan organik.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Simulation Flow Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DAILY RELEASE SIMULATION TICK                       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             EXISTING CORE STREAMING & DEBUT ENGINE                      │
│  • Menghitung Base Listener Pool, Fanbase, Hype, & Debut Surge          │
│  • Hari ke-1 (daysSinceRelease === 0) menggunakan nilai asli 100%       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ (Jika daysSinceRelease >= 1)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          PUBLIC CHEMISTRY & MARKET TREND LONGEVITY ENGINE               │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ 1. Song Quality &   │  │ 2. Dynamic Market   │  │ 3. Organic      │  │
│  │    Studio Synergy   │  │    Trend Alignment  │  │    Surprise Roll│  │
│  │  (Bobot ~40%)       │  │  (Bobot ~30%)       │  │  (Bobot ~30%)   │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────┬────────┘  │
│             └────────────────────────┼──────────────────────┘           │
│                                      ▼                                  │
│                  [ Penentuan Profil Kurva Umur Lagu ]                   │
│     • Front-Loaded Flop     • Normal Release     • Sleeper Hit          │
│     • Underperform (Biasa)  • Solid Hit          • Cultural Mega Hit    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 POST-DEBUT TRAJECTORY & RETENTION CURVE                 │
│  • Mengatur kecepatan decay harian (Half-Life) di Minggu 1 s/d Bulan 3+ │
│  • Mengatur gelombang "Second-Wind" (kenaikan bertahap untuk Sleeper)   │
│  • Menyesuaikan batas tahanan lantai (Recurrent Floor) agar lagu Flop   │
│    bisa benar-benar turun tajam, sedangkan Mega Hit bertahan kuat       │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & Perhitungan Deterministik**:
  - Setiap lagu menggunakan *seed* deterministik berbasis identitas unik lagu + tanggal rilis sehingga profil Public Chemistry-nya konsisten setiap hari tanpa perlu mengubah struktur save data lama.
  - **Bobot Komposit Public Chemistry**:
    - **Kualitas & Sinergi Studio (~40%)**: Kualitas rekaman, penguasaan *hook/storytelling*, dan keselarasan antara genre, tema, serta gaya vokal.
    - **Kecocokan Tren Pasar (~30%)**: Evaluasi kecocokan genre, tema, dan nuansa lagu terhadap tren pasar yang sedang berlangsung pada tanggal rilis lagu tersebut.
    - **Faktor Kejutan Organik (~30%)**: *Gaussian-like zeitgeist roll* yang memungkinkan deviasi realistis—sehingga artis besar dengan lagu bagus tetap punya risiko rilisnya *Biasa/Flop*, dan rilisan standar punya peluang meledak jadi *Sleeper Hit* atau *Mega Hit*.
  - **Penyesuaian Stabilizer Pasca-Debut**:
    - Melonggarkan *floor* penahan buatan pada lagu yang mendapat kurva **Flop / Underperform** setelah hari ke-4 agar penurunannya benar-benar terasa nyata di chart, sembari memperkuat *hold* dan gelombang *second-wind* pada lagu **Hit / Sleeper Hit / Mega Hit**.
