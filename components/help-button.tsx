"use client"

import { useState } from "react"
import { HelpCircle, X } from "lucide-react"

const HELP_CONTENT: Record<string, { title: string; items: string[] }> = {
  dashboard: {
    title: "Panduan Dashboard",
    items: [
      "📊 TR (Total Revenue) = pendapatan dari semua pasien. Naikan TR dengan tambah pasien & upgrade departemen.",
      "💰 TC (Total Cost) = FC + VC. RS untung kalau TR > TC.",
      "📈 FC (Fixed Cost) = biaya tetap (sewa, gaji pokok) — tidak berubah meski pasien nol.",
      "📉 VC (Variable Cost) = biaya per pasien (obat, alkes) — naik seiring jumlah pasien.",
      "🎯 BEP (Break-Even Point) = jumlah pasien minimum agar RS tidak rugi.",
      "⭐ Kepuasan Pasien mempengaruhi pertumbuhan pasien bulan berikutnya — jaga selalu di atas 70%.",
      "💡 Strategi: jika FC tinggi & pasien sedikit, fokus naikan jumlah pasien atau kurangi staf berlebih.",
    ],
  },
  departments: {
    title: "Panduan Departemen",
    items: [
      "🏥 Setiap departemen punya revenue per pasien berbeda — Bedah tertinggi, Poli Umum terendah.",
      "⬆️ Upgrade level meningkatkan kapasitas & revenue, tapi butuh lebih banyak staf.",
      "🔓 Buka departemen spesialis untuk revenue & kepuasan lebih tinggi — perlu modal besar.",
      "👥 Staf di bawah kebutuhan = efisiensi turun, revenue berkurang, kepuasan turun.",
      "💡 Strategi: upgrade IGD & Rawat Inap lebih dahulu (revenue per pasien tinggi).",
      "⚠️ Departemen baru butuh staf tambahan — siapkan anggaran SDM sebelum unlock.",
    ],
  },
  staff: {
    title: "Panduan Manajemen Staf",
    items: [
      "👨‍⚕️ Dokter: dampak terbesar ke pasien & revenue, gaji paling tinggi.",
      "👩‍⚕️ Perawat: dampak besar ke kepuasan pasien, gaji sedang.",
      "🗂️ Administrasi & Pendukung: efisiensi operasional, gaji rendah.",
      "📋 Staf yang belum ditugaskan ke departemen tidak berkontribusi optimal.",
      "💰 Gaji staf termasuk FC — hati-hati, FC tinggi bisa bikin rugi saat pasien sedikit.",
      "💡 Strategi: jangan rekrut terlalu banyak di awal — sesuaikan dengan kapasitas departemen.",
    ],
  },
  finances: {
    title: "Panduan Keuangan",
    items: [
      "📊 ATC (Average Total Cost) = TC ÷ jumlah pasien — semakin kecil, semakin efisien.",
      "📉 AVC (Average Variable Cost) = VC ÷ jumlah pasien — mencerminkan efisiensi per layanan.",
      "📈 MC (Marginal Cost) = tambahan biaya untuk 1 pasien tambahan vs bulan lalu.",
      "🎯 Idealnya MC < harga rata-rata layanan — kalau MC lebih tinggi, pertumbuhan merugikan.",
      "🏦 Pinjaman tersedia maksimal 4x (1 awal + 3 tambahan) — gunakan bijak!",
      "⚠️ Hindari 3 bulan rugi berturut-turut dengan kas negatif — game over!",
    ],
  },
  event: {
    title: "Panduan Event Bulanan",
    items: [
      "🎲 Setiap bulan muncul skenario acak yang mempengaruhi operasional RS.",
      "💡 Setiap pilihan memberi dampak ke FC, VC, kas, atau kepuasan.",
      "📊 Perhatikan tag konsep (FC/VC/TC/TR) — ini inti pembelajaran ekonomi kesehatan.",
      "🔄 Efek FC bersifat permanen (setiap bulan), efek kas hanya sekali.",
      "💰 Pilihan yang hemat FC cocok saat pasien sedikit; pilihan VC rendah cocok saat pasien banyak.",
    ],
  },
}

interface HelpButtonProps {
  context: keyof typeof HELP_CONTENT
}

export default function HelpButton({ context }: HelpButtonProps) {
  const [open, setOpen] = useState(false)
  const content = HELP_CONTENT[context]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
        title="Bantuan"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Bantuan</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between rounded-t-xl bg-blue-600 px-4 py-3">
              <h3 className="font-bold text-white">{content.title}</h3>
              <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="divide-y px-4 py-2">
              {content.items.map((item, i) => (
                <li key={i} className="py-2 text-sm text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
            <div className="px-4 pb-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
