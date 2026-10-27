# Pitchfork & Metacritic — Critical Prestige, Editorial Reviews & Aggregator Simulation

Hadirkan ekosistem jurnalisme musik dan agregator ulasan kritikus dunia nyata ke dalam game melalui dua aplikasi mandiri (**Pitchfork** dan **Metacritic**) dengan simulasi penilaian berlapis, bias kritikus, kohesi album, dinamika *User Score* (termasuk *review bombing* dari rival/haters vs. pembelaan fanbase), koleksi lencana prestise (*Best New Music*, *Best New Track*, *Metacritic Must-Play*), serta integrasi berita viral di X.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah keputusan desain yang telah dikonfirmasi dari jawaban kamu dan akan menjadi dasar implementasi:

- **Confirmed Decision 1 — Dua Aplikasi Mandiri di Tab Apps**: **Pitchfork** dan **Metacritic** masing-masing memiliki aplikasi khusus di dalam kategori baru *"Music Press & Critics"* pada tab **Apps**, lengkap dengan identitas visual autentik masing-masing platform.
- **Confirmed Decision 2 — Murni Prestise, Koleksi Badge & Berita Viral di X**: Skor Pitchfork (`0.0–10.0`) dan Metascore (`0–100`) berfokus penuh pada prestise artistik, koleksi lencana (*Best New Music*, *Best New Track*, *Sunday Review*, *Metacritic Must-Play*, *Universal Acclaim*), dan memicu perdebatan/berita di **X** (seperti `@chartdata`, `@PopBase`, `@pitchfork`, `@metacritic`, dan akun stan) tanpa mengubah rumus angka streaming atau chart yang sudah stabil.
- **Confirmed Decision 3 — Mesin Simulasi Kritikus & User Score Kompleks**: Penilaian dihitung secara mendalam dari kombinasi kualitas lagu/album, penguasaan *Skill* Studio (Songwriting, Recording, Production), kohesi kualitas antar-track di dalam album/EP, profil karakter kritikus (tiap jurnalis/publikasi punya selera dan bias tersendiri), serta dinamika *User Score* yang merefleksikan tarik-menarik antara fans loyal dengan *review bombing* saat terjadi *beef* atau lonjakan eksposur.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Pitchfork App**: Publikasi kritik musik editorial bergaya *broadsheet* modern yang menilai setiap **Album/EP** dan **Single** (baik milik Player maupun rilis NPC dunia nyata) dalam skala **`0.0` hingga `10.0`** (1 desimal). Dilengkapi lingkaran skor ikonik (*The Score Circle* — merah/hitam untuk *Best New Music* $\ge 8.3$ dan *Best New Track* $\ge 8.2$), nama kritikus beserta spesialisasi mereka, kutipan *pull-quote* tajam, ulasan esai multi-paragraf yang membedah lirik, vokal, produksi, dan *tracklist*, serta rubrik khusus **Sunday Review** yang mengulas kembali katalog lama secara retrospektif.
  2. **Metacritic App**: Agregator konsensus kritikus dan publik yang mengumpulkan **8 hingga 12 ulasan publikasi musik ternama** (*Pitchfork, Rolling Stone, NME, The Guardian, AllMusic, Variety, Consequence, Paste, Slant Magazine, Stereogum, Clash, DIY*) dengan **bobot (*weighting*) berbeda** sesuai prestise media untuk menghasilkan **Metascore (`0–100`)**. Dilengkapi indikator warna autentik (**Hijau `61–100`**, **Kuning `40–60`**, **Merah `0–39`**), lencana **Metacritic Must-Play** (khusus rilis dengan Metascore $\ge 81$ dan minimal 7 ulasan kritikus), bar distribusi *Positive / Mixed / Negative*, serta **User Score (`0.0–10.0`)** terpisah yang menampilkan ulasan fans vs. *review bombing* haters/rival.
- **Target Audience / Persona**: Player yang ingin merasakan ketegangan saat menunggu skor ulasan rilis terbaru mereka, mengoleksi katalog *Universal Acclaim* & *Best New Music*, membaca bedah kritik mendalam atas karya mereka, dan melihat reaksi panas di X ketika album mereka mendapat skor kontroversial.
- **Key Value**: Memberikan dimensi "prestise artistik" (*critical darling* vs. *commercial juggernaut* vs. *polarizing cult classic*) yang hidup berdampingan secara harmonis dengan tangga lagu komersial tanpa mengganggu keseimbangan streaming.

---

## 2. User Experience & Visual Design

### A. Pitchfork Application — Editorial Broadsheet Aesthetic
- **Key User Flows**:
  1. **Front Page (Reviews Feed & Filter Bar)**: Menampilkan *Lead Review Hero* (rilis terbaru dengan sampul besar dan *Score Circle*), diikuti tab navigasi satu baris: `Album Reviews`, `Track Reviews`, `Best New Music`, `Sunday Reviews`, dan `Artist Index (My Catalog)`.
  2. **Full Editorial Review Reader**: Saat Player menekan salah satu kartu rilis, halaman ulasan terbuka dengan:
     - Sampul album/single resolusi tinggi berdampingan dengan **Score Circle** (`0.0–10.0`, dikelilingi cincin merah menyala `#E50914` dan cap `BEST NEW MUSIC` / `BEST NEW TRACK` jika memenuhi syarat).
     - Baris metadata bersih tanpa *pill*: `Artist · Genre · Release Date · Reviewed by [Nama Kritikus]`.
     - *Pull-Quote* tebal bergaya serif yang merangkum tesis utama kritikus terhadap rilis tersebut.
     - Esai kritik 3 paragraf yang dihasilkan secara dinamis berdasarkan statistik riil rilis (membahas lagu pembuka, *standout tracks*, kelemahan *filler tracks* jika kohesi album timpang, serta kualitas vokal/produksi).
     - **Track-by-Track Critical Breakdown** (khusus Album/EP): Menampilkan daftar lagu di dalam album beserta catatan singkat dan tanda *Essential Track* pada lagu dengan kualitas tertinggi.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: *Contemporary Editorial Broadsheet* — kertas putih bersih (`#FAF9F6` / `#FFFFFF`), tinta hitam pekat (`#0A0A0A`), garis pemisah tipis `1px` (`#E5E5E5`), dan aksen merah khas Pitchfork (`#FF3530`) khusus untuk lencana *Best New Music / Best New Track*.
  - *Typography & Hierarchy*: Judul utama menggunakan *editorial serif* kontras tinggi (`Playfair Display` / `Georgia`), teks ulasan menggunakan ukuran nyaman dibaca (`15px`, `leading-relaxed`), dan angka skor menggunakan *bold grotesque sans* dengan `tabular-nums`.

### B. Metacritic Application — High-Contrast Aggregator & Sentiment Matrix
- **Key User Flows**:
  1. **Browse & Leaderboard View**: Tab navigasi satu baris untuk `New Releases`, `Best Albums (All-Time)`, `Player Discography`, dan `Must-Play Showcase`.
  2. **Album / Release Detail Page**:
     - **Dual Score Header**: Di sisi kiri terdapat kotak **Metascore (`0–100`)** dengan warna autentik (Hijau `#00CE7A` untuk `61–100`, Kuning `#FFBD3F` untuk `40–60`, Merah `#FF6874` untuk `0–39`) dan label sentimen (*Universal Acclaim*, *Generally Favorable*, *Mixed or Average*, *Generally Unfavorable*, atau *Overwhelming Dislike*) beserta lencana emas/hijau **MUST-PLAY** jika skor $\ge 81$. Di sisi kanan terdapat lingkaran **User Score (`0.0–10.0`)** beserta jumlah total rating publik.
     - **Score Distribution Bar**: Grafik batang horizontal yang merinci persentase dan jumlah ulasan *Positive*, *Mixed*, dan *Negative* baik untuk Kritikus maupun Publik.
     - **Critic Reviews List (Weighted Publications)**: Daftar 8–12 publikasi (seperti *Pitchfork, Rolling Stone, The Guardian, NME, AllMusic, Variety, Stereogum, Slant*) lengkap dengan kotak skor konversi (`0–100`), bobot pengaruh media (*High / Medium / Standard Weight*), kutipan ulasan 1–2 kalimat dari masing-masing media, dan tanggal publikasi.
     - **User Reviews & Review Bombing Radar**: Menampilkan daftar ulasan komunitas (`10/10` dari *Core Stans*, `7/10` dari pendengar umum, hingga `0/10` atau `1/10` dari akun fanbase rival jika sedang terjadi *Active Rivalry / Chart Clash*), lengkap dengan indikator status apakah rilis tersebut sedang mengalami *Organic Praise*, *Polarized Debate*, atau *Rival Fanbase Review Bombing*.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: *Dark Slate Aggregator Interface* (`#111318` kanvas utama, `#1A1D24` permukaan kartu, teks putih `#F3F4F6`) agar kotak warna hijau/kuning/merah khas Metacritic tampil tajam dan kontras.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Perhitungan Skor Kritikus Multi-Faktor yang Deterministik per Rilis**
  - *Chosen Approach*: Skor setiap rilis dihitung satu kali secara deterministik dari kombinasi:
    1. **Base Quality & Studio Mastery (50%)**: Kualitas lagu/rata-rata track di album + level skill *Songwriting*, *Recording*, dan *Production* Player saat merilis.
    2. **Album Tracklist Cohesion & Pacing (20%)**: Untuk Album/EP, dihitung standar deviasi kualitas antar-lagu dan kepadatan *tracklist*. Album yang konsisten tanpa banyak *filler* mendapat bonus kohesi, sedangkan album *bloated* dengan banyak track berkualitas rendah mendapat penalti dari kritikus.
    3. **Critic Persona & Publication Bias (20%)**: Setiap publikasi di Metacritic dan setiap jurnalis di Pitchfork memiliki profil bias (misal: *Slant* dan *Pitchfork* lebih kritis terhadap rilis pop komersial murni kecuali liriknya kuat; *Rolling Stone* dan *AllMusic* lebih menghargai produksi matang dan katalog artist; *NME* menyukai *hype* tinggi dan energi segar).
    4. **Artistic Evolution & Overexposure Modifier (10%)**: Rilis yang terus-menerus di-spam dalam waktu terlalu singkat terkena sedikit kejenuhan kritikus (*release fatigue*), sedangkan rilis setelah jeda matang mendapat apresiasi kesegaran konsep.
  - *Why*: Membuat setiap skor terasa adil, punya alasan jelas yang tercermin langsung di teks ulasan kritikus, dan tidak pernah berubah-ubah secara acak saat game dimuat ulang.

- **Decision 2: Pemisahan Tegas antara Konsensus Kritikus (Metascore) vs. Sentimen Publik (User Score)**
  - *Chosen Approach*: Metascore murni dihitung dari rata-rata tertimbang (*weighted average*) 8–12 publikasi jurnalisme musik, sedangkan **User Score (`0.0–10.0`)** dihitung dari kepuasan fanbase, kimia pasar, dan intensitas *Rival Beef*. Jika Player sedang terlibat konflik panas dengan rival, fanbase rival dapat melakukan *review bombing* yang menurunkan *User Score* dan memicu drama di X, meskipun *Metascore* kritikus tetap tinggi.
  - *Why*: Meniru fenomena nyata di Metacritic di mana album pop/hip-hop besar sering menjadi ajang perang rating antar-fanbase di kolom *User Score*.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GameState & Daily Simulation                        │
│        (Released Songs, Released Projects, Studio Skills, Rival State)      │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│   Critics & Aggregator Engine         │ │   X (Twitter) Press & Stan Feed   │
│  • Pitchfork Evaluation (0.0 - 10.0)  │ │  • @pitchfork Score & BNM Tweets  │
│  • BNM / BNT / Sunday Review Logic    │─┼─►• @metacritic Metascore Updates  │
│  • 12-Publication Weighted Metascore  │ │  • @PopBase / @chartdata Accolades│
│  • Tracklist Cohesion & Critic Bias   │ │  • Stan Debates & Review Bombing  │
│  • User Score & Review Bombing Sim    │ └───────────────────────────────────┘
└─────────┬─────────────────────────────┴─────────┐
          │                                       │
          ▼                                       ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│            Pitchfork App              │ │           Metacritic App          │
│  • Lead Review Hero & Score Circle    │ │  • Metascore (0-100) & Must-Play  │
│  • Album / Track / BNM / Sunday Tabs  │ │  • User Score (0.0-10.0) Matrix   │
│  • Full 3-Paragraph Editorial Essay   │ │  • Positive/Mixed/Negative Bars   │
│  • Track-by-Track Critical Notes      │ │  • 12 Weighted Publication Cards  │
│  • Player Catalog Critical Archive    │ │  • Community & Rival User Reviews │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

### Data Model & State Strategy
- **Zero-Bloat Deterministic Engine + On-Demand Evaluation**:
  - Semua rilis Player (`state.projects` dan `state.songs`) serta rilis utama NPC dievaluasi secara otomatis oleh mesin kritik menggunakan *deterministic seed* berbasis ID rilis dan metrik aktual saat rilis, sehingga otomatis kompatibel 100% dengan *save file* lama maupun rilis baru tanpa membebani ukuran penyimpanan.
  - Menyediakan metrik prestise lengkap:
    - **Pitchfork**: Skor `0.0–10.0`, status `Best New Music` (Album $\ge 8.3$), `Best New Track` (Single $\ge 8.2$), `Sunday Review` (ulasan retrospektif katalog klasik), nama jurnalis, *pull-quote*, esai 3 paragraf, dan bedah *tracklist*.
    - **Metacritic**: Metascore `0–100` (rata-rata tertimbang dari 8–12 media), label sentimen (*Universal Acclaim* hingga *Overwhelming Dislike*), badge `Metacritic Must-Play`, rincian *Positive / Mixed / Negative*, daftar skor & kutipan tiap publikasi, serta *User Score* `0.0–10.0` beserta ulasan fans/haters.
- **Interactive Component & State Mapping**:
  - **AppsTab & MainApp**: Menambahkan grup `"Music Press & Critics"` di tab Apps dengan tombol peluncur **Pitchfork** dan **Metacritic**.
  - **PitchforkApp**: Mendukung filter tab (`Albums`, `Tracks`, `Best New Music`, `Sunday Reviews`, `My Catalog`), pencarian/filter rilis Player vs. Semua Artis, serta modal/halaman baca artikel ulasan penuh.
  - **MetacriticApp**: Mendukung filter tab (`New Releases`, `All-Time Acclaim`, `My Discography`, `Must-Play`), pengurutan berdasarkan *Metascore* atau *User Score*, serta tampilan detail lengkap rincian publikasi kritikus dan ulasan pengguna.
  - **X Press Integration**: Saat Player merilis lagu atau album baru, akun `@pitchfork`, `@metacritic`, `@chartdata`, dan fanbase otomatis memposting hasil skor ulasan dan lencana *Best New Music* / *Universal Acclaim* di linimasa X.
