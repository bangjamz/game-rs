# 🏥 Rumah Sakit Simulator

> Game simulasi interaktif pengelolaan rumah sakit untuk pembelajaran **ekonomi dan pembiayaan kesehatan**

## Tentang Proyek

Rumah Sakit Simulator adalah web app edukatif yang memungkinkan pemain mengelola sebuah rumah sakit selama **3 tahun (36 bulan)** simulasi. Pemain akan mempelajari konsep-konsep ekonomi mikro secara langsung melalui pengambilan keputusan nyata.

## Konsep Ekonomi yang Dipelajari

| Kode | Konsep |
|------|--------|
| **FC** | Fixed Cost — Biaya Tetap |
| **VC** | Variable Cost — Biaya Variabel |
| **TC** | Total Cost — Total Biaya |
| **MC** | Marginal Cost — Biaya Marjinal |
| **ATC** | Average Total Cost — Rata-rata Biaya Total |
| **AVC** | Average Variable Cost — Rata-rata Biaya Variabel |

## Fitur Utama

- 🏥 Kelola rumah sakit selama 3 tahun (36 bulan)
- 🏗️ Upgrade departemen (IGD, Poli Umum, Rawat Inap)
- 🔓 Buka departemen spesialis (Kardiologi, Pediatri, Bedah, Laboratorium)
- 👩‍⚕️ Rekrut & kelola staf medis
- 📊 Visualisasi grafik keuangan (TC, FC, VC, MC)
- 🎲 Event acak bulanan yang mempengaruhi operasional
- 💰 Sistem pinjaman dengan bunga (maks. 4 pinjaman)
- ⭐ Sistem kepuasan pasien

## Tingkat Kesulitan

| Tingkat | Bunga Pinjaman |
|---------|---------------|
| Mudah | 5% / tahun |
| Sedang | 8% / tahun |
| Sulit | 12% / tahun |

## Stack Teknologi

- **Framework**: Next.js 15 (App Router, Static Export)
- **Language**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Package Manager**: pnpm

## Cara Menjalankan Lokal

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build static
pnpm build
```

## Deployment

Proyek ini dikonfigurasi sebagai **static export** (`output: 'export'`) dengan base path `/game-rs`.
Hasil build ada di folder `out/` — bisa di-upload langsung ke shared hosting.

## Lisensi

MIT
