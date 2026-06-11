# 📋 PRD — Rumah Sakit Simulator
### *Product Requirements Document — Versi 1.0*

> **Dibuat:** 11 Juni 2026
> **Dibuat oleh:** Antigravity AI
> **Repository:** [github.com/bangjamz/game-rs](https://github.com/bangjamz/game-rs)
> **Status Proyek:** ✅ Selesai dikembangkan · ✅ Di-push ke GitHub · 🔄 Proses deployment

---

## Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Konsep & Tujuan Edukatif](#2-konsep--tujuan-edukatif)
3. [Stack Teknologi](#3-stack-teknologi)
4. [Arsitektur Aplikasi](#4-arsitektur-aplikasi)
5. [Fitur Lengkap](#5-fitur-lengkap)
6. [Mekanik & Logika Game](#6-mekanik--logika-game)
7. [Status Deployment](#7-status-deployment)
8. [Rencana Hosting](#8-rencana-hosting)
9. [Informasi Akun & Repositori](#9-informasi-akun--repositori)
10. [Estimasi Ukuran & Performa](#10-estimasi-ukuran--performa)
11. [Roadmap Fitur](#11-roadmap-fitur)
12. [Checklist Deployment](#12-checklist-deployment)

---

## 1. Ringkasan Proyek

| Atribut | Detail |
|---|---|
| **Nama Produk** | Rumah Sakit Simulator |
| **Nama Repo** | `game-rs` |
| **Tipe** | Web App — Game Edukasi Interaktif |
| **Bahasa Antarmuka** | Indonesia 🇮🇩 |
| **Tujuan** | Simulasi pengelolaan rumah sakit untuk **pembelajaran ekonomi dan pembiayaan kesehatan** |
| **Target Pengguna** | Mahasiswa, pelajar, dan dosen ekonomi / kesehatan masyarakat |
| **Durasi Permainan** | 36 bulan (3 tahun simulasi) per sesi |
| **Platform** | Web (desktop & mobile responsive) |
| **Akses** | Publik, tanpa login |

### Deskripsi Singkat

Rumah Sakit Simulator adalah web app edukatif berbasis browser yang memungkinkan pemain berperan sebagai direktur rumah sakit. Dalam simulasi 3 tahun, pemain harus mengelola keuangan, staf, dan departemen sambil menghadapi berbagai kejadian acak bulanan. Tujuan utamanya adalah membuat konsep ekonomi mikro (biaya tetap, biaya variabel, biaya marjinal, dll.) menjadi mudah dipahami melalui pengalaman langsung.

---

## 2. Konsep & Tujuan Edukatif

Game ini dirancang untuk mengajarkan konsep **ekonomi mikro** secara interaktif:

| Kode | Konsep | Contoh dalam Game |
|---|---|---|
| **FC** | Fixed Cost — Biaya Tetap | Sewa gedung Rp 150 juta/bulan, gaji pokok staf |
| **VC** | Variable Cost — Biaya Variabel | Obat & alkes Rp 500 ribu per pasien |
| **TC** | Total Cost — Total Biaya | FC + VC setiap bulan |
| **MC** | Marginal Cost — Biaya Marjinal | Biaya tambah untuk 1 pasien tambahan |
| **ATC** | Average Total Cost | TC ÷ jumlah total pasien |
| **AVC** | Average Variable Cost | VC ÷ jumlah total pasien |

Semua nilai dihitung secara real-time dan divisualisasikan dalam grafik historis agar pemain bisa melihat tren dan belajar dari keputusan yang diambil.

---

## 3. Stack Teknologi

```
Framework    : Next.js 15.5.18 (App Router)
Language     : TypeScript 5.x
React        : v19
Styling      : Tailwind CSS v3.4 + tailwindcss-animate
UI Library   : shadcn/ui (Radix UI primitives)
Charts       : Recharts (latest)
Forms        : React Hook Form + Zod
State Mgmt   : React useState + localStorage (client-side only)
Package Mgr  : pnpm
Analytics    : @vercel/analytics
Font         : Geist + Geist Mono (Google Fonts via Next.js)
Build Output : Static Export (output: 'export')
```

### Dependensi Produksi Kunci

| Package | Versi | Kegunaan |
|---|---|---|
| `next` | 15.5.18 | Framework utama |
| `react` | ^19 | UI library |
| `tailwindcss` | ^3.4.17 | Utility CSS |
| `@radix-ui/*` | various | 20+ komponen headless |
| `recharts` | latest | Grafik keuangan |
| `lucide-react` | ^0.454.0 | Ikon |
| `sonner` | ^1.7.4 | Toast notification |
| `next-themes` | ^0.4.6 | Dark/light mode |
| `zod` | 3.25.76 | Validasi schema |
| `@vercel/analytics` | 1.3.1 | Analytics produksi |

---

## 4. Arsitektur Aplikasi

### Struktur Folder

```
game-rs/
├── app/
│   ├── layout.tsx              ← Root layout (font, analytics, metadata)
│   ├── globals.css             ← Global styles
│   ├── page.tsx                ← Halaman Landing
│   ├── setup/
│   │   └── page.tsx            ← Onboarding: nama RS, nama pengelola, difficulty
│   └── game/
│       └── page.tsx            ← Halaman utama game (596 baris, semua logika)
│
├── components/
│   ├── dashboard.tsx           ← Tab Dashboard — ringkasan KPI & statistik
│   ├── departments.tsx         ← Tab Departemen — upgrade & unlock departemen
│   ├── finances.tsx            ← Tab Keuangan — grafik & laporan keuangan
│   ├── staff.tsx               ← Tab Staf — rekrut & kelola SDM
│   ├── game-over.tsx           ← Layar Game Over / Selesai simulasi
│   ├── monthly-event.tsx       ← Modal event bulanan (pilihan keputusan)
│   ├── monthly-summary-modal.tsx ← Ringkasan hasil per bulan
│   ├── theme-provider.tsx      ← Wrapper next-themes
│   └── ui/                     ← 57 komponen shadcn/ui
│
├── lib/
│   ├── types.ts                ← Interface TypeScript (GameState, dll.)
│   └── utils.ts                ← Helper (formatCurrency, cn)
│
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.ts
│
├── public/                     ← Favicon, icon, placeholder assets
├── PRD.md                      ← Dokumen ini
├── README.md                   ← Dokumentasi repo
├── next.config.mjs             ← Konfigurasi Next.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Alur Halaman (User Flow)

```
[/]  Landing Page
  → Klik "Mulai Permainan"
[/setup]  Setup Form
  → Isi nama pengelola, nama RS, pilih difficulty
  → Klik "Mulai Permainan" → simpan ke localStorage
[/game]  Halaman Game Utama
  ├── Tab: Dashboard
  ├── Tab: Departemen
  ├── Tab: Staf
  ├── Tab: Keuangan
  ├── Modal: Event Bulanan (tiap klik "Lanjut Bulan")
  ├── Modal: Ringkasan Bulan
  └── Layar: Game Over / Selesai
```

### Alur State Management

```
localStorage["hospitalSimGame"]
        ↓  (load saat /game pertama dibuka)
    GameState (JSON object)
        ↓  (di-pass sebagai props)
    game/page.tsx  ← semua logika perhitungan ada di sini
        ↓
    Dashboard  |  Departments  |  Staff  |  Finances
        ↑
    setGameState  ← update state → auto-save ke localStorage
```

> **Catatan:** Tidak ada backend atau database eksternal. Semua state tersimpan di `localStorage` browser. Jika user bersihkan cache browser, data game hilang.

---

## 5. Fitur Lengkap

### 5.1 Halaman Landing (`/`)

- Judul dan tagline produk
- Penjelasan konsep ekonomi yang dipelajari (FC, VC, TC, MC, ATC, AVC)
- Daftar fitur utama game
- Tombol "Mulai Permainan" → navigasi ke `/setup`

### 5.2 Setup & Onboarding (`/setup`)

- Input **nama pengelola** dan **nama rumah sakit**
- Pilih **tingkat kesulitan**:

  | Tingkat | Bunga Pinjaman | Efek |
  |---|---|---|
  | Mudah | 5% / tahun | Random factor +10% |
  | Sedang | 8% / tahun | Normal |
  | Sulit | 12% / tahun | Random factor -10% |

- Modal awal: **Rp 10 Miliar** (100% dari pinjaman bank)
- Data awal disimpan ke `localStorage`, lalu navigasi ke `/game`

### 5.3 Dashboard (Tab 1)

- **Header Sticky:** nama RS, nama pengelola, bulan/tahun berjalan, saldo kas
- Tombol **"Lanjut Bulan →"** untuk advance simulasi
- KPI Cards: Total Pasien, Revenue, Total Cost, Profit/Rugi, Kepuasan Pasien
- Breakdown pasien per departemen
- Ringkasan laporan bulan terakhir

### 5.4 Manajemen Departemen (Tab 2)

**Departemen Awal (tersedia dari awal):**

| Departemen | Kapasitas | Staf Awal | Revenue/Pasien | Stabilitas |
|---|---|---|---|---|
| IGD (Emergency) | 20 | 10 | Rp 3.000.000 | 80% |
| Poli Umum | 15 | 8 | Rp 800.000 | 90% |
| Rawat Inap | 10 | 5 | Rp 7.000.000 | 70% |

**Departemen Spesialis (perlu di-unlock dengan biaya):**

| Departemen | Biaya Unlock | Staf Dibutuhkan | Revenue/Pasien |
|---|---|---|---|
| Kardiologi | Rp 5.000.000.000 | 15 | Rp 12.000.000 |
| Pediatri | Rp 3.000.000.000 | 12 | Rp 5.000.000 |
| Bedah | Rp 7.000.000.000 | 20 | Rp 15.000.000 |
| Laboratorium | Rp 2.500.000.000 | 8 | Rp 4.000.000 |

- Upgrade level departemen: Level 1 → 2 → 3
- Tiap level upgrade meningkatkan kapasitas dan potensi revenue

### 5.5 Manajemen Staf (Tab 3)

Rekrut dan pecat 4 jenis staf:

| Jenis Staf | Gaji/Bulan |
|---|---|
| Dokter | Rp 8.000.000 |
| Perawat | Rp 3.000.000 |
| Administrasi | Rp 2.000.000 |
| Support | Rp 1.500.000 |

- Rasio staf terhadap kebutuhan mempengaruhi efisiensi operasional
- **Staff Multiplier:** bonus pertumbuhan pasien dan revenue berdasarkan kecukupan staf

### 5.6 Keuangan (Tab 4)

- Grafik historis multi-line: Revenue, FC, VC, TC, Profit (via Recharts)
- Tabel laporan bulanan lengkap
- **Sistem Pinjaman:**
  - Maksimal 4 pinjaman total (1 pinjaman awal + 3 tambahan)
  - Cicilan dihitung dengan rumus anuitas dan dikurangi otomatis dari kas tiap bulan
  - Jika kas < -Rp 1 Miliar dan sudah 4x pinjaman → **Game Over**

### 5.7 Modal Event Bulanan

Setiap klik "Lanjut Bulan", muncul modal dengan:
- Deskripsi kejadian acak (krisis, peluang, bencana, dll.)
- **2–3 pilihan respons** dengan konsekuensi berbeda
- Efek pilihan mempengaruhi: Fixed Cost, Variable Cost, Kas, atau Kepuasan Pasien
- Efek bersifat **akumulatif** (bisa menumpuk dari bulan ke bulan)

### 5.8 Modal Ringkasan Bulan

Setelah perhitungan bulan selesai, tampil ringkasan:
- Jumlah pasien bulan ini per departemen
- Revenue, FC, VC, TC, Profit bulan ini
- Perubahan kas
- Perubahan kepuasan pasien

### 5.9 Sistem Kepuasan Pasien

Dihitung setiap akhir bulan dari 3 faktor berbobot:

| Faktor | Bobot | Penjelasan |
|---|---|---|
| Rasio Staf | 50% | Staf aktual ÷ staf yang dibutuhkan semua departemen |
| Kualitas Fasilitas | 30% | Level rata-rata semua departemen + bonus dept spesialis |
| Waktu Tunggu | 20% | Invers dari occupancy rate (pasien ÷ kapasitas) |

Kepuasan (0–100) mempengaruhi:
- Pertumbuhan pasien: `satisfactionMultiplier = 1.03^(satisfaction/10)`
- Revenue: `satisfactionRevenueBonus = 1 + (satisfaction - 70) / 100`

### 5.10 Kondisi Game Over / Selesai

| Kondisi | Pesan |
|---|---|
| Kas < -Rp 1 Miliar AND pinjaman ≥ 4x | "Kas defisit melebihi 1 miliar dan tidak dapat mengambil pinjaman lagi" |
| Defisit 3 bulan berturut-turut AND kas < 0 | "Rumah sakit mengalami defisit 3 bulan berturut-turut" |
| Bulan ke-37 (setelah 36 bulan) | "Simulasi 3 tahun telah selesai!" |

Layar Game Over menampilkan: nama RS, nama pengelola, total bulan bertahan, skor akhir, dan ringkasan keuangan.

---

## 6. Mekanik & Logika Game

### Formula Perhitungan Pasien per Bulan

```
Pasien = capacity
       × staffEfficiency          (staf aktual / staf dibutuhkan, maks 1.0)
       × randomFactor             (berdasarkan stabilitas dept + kesulitan)
       × satisfactionMultiplier   (1.03^(kepuasan/10))
       × staffMultiplier          (bonus dari kecukupan staf)
       × patientGrowthMultiplier  (karakteristik dept)
       × monthProgressionBonus    (1 + bulanKe/36 × 0.5)
       × specialtyBonus           (dept spesialis)
```

### Formula Fixed Cost per Bulan

```
FC = Rp 150.000.000   (sewa gedung)
   + Rp  80.000.000   (perawatan alat)
   + (dokter × 8jt + perawat × 3jt + admin × 2jt + support × 1,5jt)
   + extraFixedCost   (akumulasi dari event)
```

### Formula Variable Cost per Bulan

```
VC per pasien = Rp 200.000 (supplies) + Rp 300.000 (obat)
              + extraVCPerPatient (dari event)
VC total      = totalPasien × vcPerPasien
              + overtimeCost (Rp 50jt jika occupancy > 80%)
```

### Formula Marginal Cost

```
MC = (TC bulan ini − TC bulan lalu) ÷ (pasien bulan ini − pasien bulan lalu)
```

---

## 7. Status Deployment

| Aspek | Status | Detail |
|---|---|---|
| Git repository | ✅ | Ter-init dan ter-commit |
| GitHub remote | ✅ | `github.com/bangjamz/game-rs` |
| Jumlah commit | ✅ | 1 commit (initial) — 93 files |
| Static build (`out/`) | ✅ | Berhasil — ukuran **1.8 MB** |
| Deployed ke shared hosting | 🔄 | Menunggu upload manual `out/` |
| Domain live | ❌ | Belum ditentukan |
| CI/CD | ❌ | Belum dibuat |
| Environment variables | ✅ | Tidak diperlukan (pure client-side) |
| Backend/Database | ✅ | Tidak diperlukan (localStorage) |

---

## 8. Rencana Hosting

### Saat Ini — Shared Hosting (Static Upload)

Build menghasilkan folder `out/` berisi file HTML/CSS/JS statis.

**Cara upload ke shared hosting:**
1. Buka cPanel / File Manager / FTP client
2. Navigasi ke `public_html/` (atau `www/`)
3. Buat folder baru: `game-rs`
4. Upload **seluruh isi** folder `out/` ke dalam `game-rs/`
5. Akses di: `https://domain-kamu.com/game-rs/`

**Konfigurasi saat ini di `next.config.mjs`:**
```js
const nextConfig = {
  output: 'export',        // ← static export
  basePath: '/game-rs',    // ← sesuai folder di shared hosting
  trailingSlash: true,
  images: { unoptimized: true },
}
```

> **Penting:** Folder `game-rs/` di shared hosting harus persis sama dengan `basePath` di config.

---

### Jangka Menengah — GitHub Pages

Aktifkan GitHub Pages dari repo `bangjamz/game-rs`:
1. GitHub → Settings → Pages
2. Source: pilih branch `main`, folder `/` (root)
3. Atau setup GitHub Actions untuk auto-deploy dari folder `out/`

**URL GitHub Pages:** `https://bangjamz.github.io/game-rs/`

**Catatan:** `basePath: '/game-rs'` sudah sesuai untuk GitHub Pages dengan nama repo `game-rs`.

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

      - uses: actions/deploy-pages@v4
```

---

### Jangka Panjang — VPS dengan Node.js

Saat pindah ke VPS:

1. **Ubah `next.config.mjs`** — hapus `output: 'export'`
2. **Jalankan:** `pnpm build && pnpm start`
3. **Gunakan PM2** untuk process management:
   ```bash
   pm2 start npm --name "game-rs" -- start
   pm2 save
   ```
4. **Nginx** sebagai reverse proxy ke port 3000
5. Membuka kemungkinan tambahan: server-side rendering, API routes, database

---

## 9. Informasi Akun & Repositori

| Field | Nilai |
|---|---|
| **Username GitHub** | `bangjamz` |
| **Profil GitHub** | [github.com/bangjamz](https://github.com/bangjamz) |
| **Nama Repo** | `game-rs` |
| **URL Repo** | [github.com/bangjamz/game-rs](https://github.com/bangjamz/game-rs) |
| **Branch Utama** | `main` |
| **Visibilitas** | Public |
| **Clone URL (HTTPS)** | `https://github.com/bangjamz/game-rs.git` |
| **Clone URL (SSH)** | `git@github.com:bangjamz/game-rs.git` |

---

## 10. Estimasi Ukuran & Performa

| Metrik | Nilai |
|---|---|
| Ukuran proyek total (incl. node_modules) | ~727 MB |
| Ukuran source code (tanpa node_modules) | ~380 KB |
| Ukuran build hasil (`out/`) | **1.8 MB** |
| Jumlah halaman | 3 (landing, setup, game) |
| Jumlah komponen custom | 8 komponen |
| Jumlah komponen UI (shadcn) | 57 komponen |
| Jumlah dependensi produksi | 28 packages |
| First Load JS — `/` (landing) | 107 kB |
| First Load JS — `/setup` | 120 kB |
| First Load JS — `/game` | **276 kB** |
| Backend diperlukan | ❌ Tidak |
| Database diperlukan | ❌ Tidak |

---

## 11. Roadmap Fitur

### 🔴 Prioritas Tinggi

| Fitur | Deskripsi | Estimasi |
|---|---|---|
| **Leaderboard** | Simpan & tampilkan 10 skor terbaik (nama RS + profit akhir). Butuh backend minimal (Firebase Firestore / Supabase) | Medium |
| **Cloud Save** | Sync game state ke server agar tidak hilang saat cache dibersihkan | High |
| **Export Laporan PDF** | Download laporan keuangan 36 bulan sebagai file PDF | Medium |

### 🟡 Prioritas Menengah

| Fitur | Deskripsi |
|---|---|
| **Tutorial Interaktif** | Panduan step-by-step untuk pemain baru (tooltip + highlight) |
| **Auth / Login** | Firebase Auth untuk profil persisten + multi-device |
| **Lebih Banyak Event** | Tambah variasi event bulanan agar replay value tinggi |
| **Statistik Akhir** | Grafik summary 36 bulan di layar Game Over |

### 🟢 Prioritas Rendah

| Fitur | Deskripsi |
|---|---|
| **PWA (Progressive Web App)** | Bisa di-install di HP sebagai aplikasi |
| **Dark Mode** | `next-themes` sudah terpasang, tinggal buat UI toggle |
| **Multi-bahasa (i18n)** | Tambahkan versi Bahasa Inggris |
| **Multiplayer / Kompetisi** | Mode real-time antar pemain |
| **Panduan Dosen** | Modul pengajaran: cara integrasikan game ke kurikulum |

---

## 12. Checklist Deployment

### Shared Hosting (Sekarang)

- [x] Source code selesai dikembangkan
- [x] Fix metadata: title, description, `lang="id"`
- [x] Buat README.md
- [x] `pnpm build` berhasil — folder `out/` (1.8 MB) tersedia
- [x] `git init` + `git commit` (93 files)
- [x] Push ke `github.com/bangjamz/game-rs`
- [ ] Upload folder `out/` ke shared hosting di path `/game-rs/`
- [ ] Verifikasi akses `https://domain.com/game-rs/`
- [ ] Test semua fitur di production (setup → game → game over)

### GitHub Pages (Jangka Menengah)

- [x] Repo publik di GitHub tersedia
- [ ] Aktifkan GitHub Pages di Settings repo
- [ ] Buat `.github/workflows/deploy.yml`
- [ ] Test auto-deploy saat push ke `main`
- [ ] Verifikasi URL: `bangjamz.github.io/game-rs/`

### VPS Node.js (Jangka Panjang)

- [ ] Sewa VPS dengan Node.js support
- [ ] Setup Nginx + PM2
- [ ] Hapus `output: 'export'` dari `next.config.mjs`
- [ ] Setup CI/CD (GitHub Actions → SSH deploy)
- [ ] Pertimbangkan tambah backend (API routes, database)

---

*Dokumen ini adalah living document — harap diupdate setiap ada perubahan signifikan pada proyek.*

*Terakhir diperbarui: 11 Juni 2026*
