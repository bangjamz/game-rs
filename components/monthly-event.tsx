"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import { AlertTriangle, TrendingUp, Zap, Package, Users, Building2 } from "lucide-react"

// ── Tipe Event ──────────────────────────────────────────────────────────────
export interface MonthlyEventEffect {
  fixedCostDelta?: number    // perubahan FC per bulan (permanen)
  variableCostDelta?: number // perubahan VC per pasien (permanen)
  cashDelta?: number         // dampak kas langsung (satu kali)
  satisfactionDelta?: number // dampak kepuasan pasien
}

export interface EventChoice {
  label: string
  description: string
  effect: MonthlyEventEffect
  conceptTag: "FC" | "VC" | "TC" | "TR" | "Mixed"
}

export interface GameEvent {
  id: string
  icon: React.ReactNode
  category: string
  title: string
  narrative: string
  choices: [EventChoice, EventChoice]
}

// ── Pool Event (12 skenario) ─────────────────────────────────────────────────
const EVENT_POOL: GameEvent[] = [
  {
    id: "vendor-contract",
    icon: <Package className="h-5 w-5 text-blue-600" />,
    category: "Pengadaan",
    title: "Kontrak Vendor Alat Medis",
    narrative:
      "Vendor menawarkan dua skema pengadaan alat medis habis pakai. Pilih skema pembiayaan yang sesuai strategi RS Anda.",
    choices: [
      {
        label: "Kontrak Tahunan (Bulanan Tetap)",
        description: "Bayar biaya tetap Rp 15 jt/bulan, harga per unit lebih murah.",
        effect: { fixedCostDelta: 15_000_000, variableCostDelta: -50_000 },
        conceptTag: "FC",
      },
      {
        label: "Beli Per Kebutuhan",
        description: "Tidak ada komitmen bulanan, namun harga per pasien lebih tinggi.",
        effect: { variableCostDelta: 150_000 },
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "doctor-specialist",
    icon: <Users className="h-5 w-5 text-purple-600" />,
    category: "SDM",
    title: "Permintaan Dokter Spesialis",
    narrative:
      "Dokter spesialis jantung senior meminta kenaikan gaji. Alternatifnya, RS bisa menggunakan sistem dokter tamu per kunjungan.",
    choices: [
      {
        label: "Kenaikan Gaji Tetap +20%",
        description: "FC naik Rp 8 jt/bulan, tapi dokter loyal & produktivitas stabil.",
        effect: { fixedCostDelta: 8_000_000, satisfactionDelta: 3 },
        conceptTag: "FC",
      },
      {
        label: "Sistem Dokter Tamu (Fee per Pasien)",
        description: "VC naik Rp 200 rb/pasien, tidak ada komitmen gaji tetap.",
        effect: { variableCostDelta: 200_000, satisfactionDelta: -2 },
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "solar-panel",
    icon: <Zap className="h-5 w-5 text-yellow-600" />,
    category: "Efisiensi Energi",
    title: "Investasi Panel Surya",
    narrative:
      "Perusahaan energi menawarkan pemasangan panel surya. Investasi besar di awal, tapi menghemat biaya energi jangka panjang.",
    choices: [
      {
        label: "Pasang Panel Surya (Investasi)",
        description: "Bayar Rp 500 jt sekarang, hemat VC energi Rp 300 rb/pasien ke depan.",
        effect: { cashDelta: -500_000_000, variableCostDelta: -300_000 },
        conceptTag: "VC",
      },
      {
        label: "Tetap Pakai PLN",
        description: "Tidak ada pengeluaran awal, VC energi tetap seperti biasa.",
        effect: {},
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "overtime-policy",
    icon: <Users className="h-5 w-5 text-red-600" />,
    category: "Kebijakan SDM",
    title: "Kebijakan Lembur",
    narrative:
      "Pasien meningkat pesat. RS perlu memutuskan: rekrut staf baru (FC naik) atau aktifkan lembur (VC naik).",
    choices: [
      {
        label: "Rekrut 5 Perawat Baru",
        description: "FC naik Rp 15 jt/bulan (gaji pokok), kapasitas layanan meningkat.",
        effect: { fixedCostDelta: 15_000_000, satisfactionDelta: 5 },
        conceptTag: "FC",
      },
      {
        label: "Aktifkan Sistem Lembur",
        description: "VC naik Rp 100 rb/pasien (upah lembur), staf mudah kelelahan.",
        effect: { variableCostDelta: 100_000, satisfactionDelta: -3 },
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "laundry-outsource",
    icon: <Building2 className="h-5 w-5 text-teal-600" />,
    category: "Outsourcing",
    title: "Outsourcing Laundry RS",
    narrative:
      "RS memiliki unit laundry sendiri dengan biaya operasional tinggi. Vendor menawarkan jasa laundry eksternal.",
    choices: [
      {
        label: "Pertahankan Laundry Internal",
        description: "FC tetap Rp 20 jt/bulan (gaji, mesin), tapi kontrol kualitas penuh.",
        effect: { fixedCostDelta: 0 },
        conceptTag: "FC",
      },
      {
        label: "Outsourcing ke Vendor",
        description: "FC turun Rp 20 jt (tutup unit), VC naik Rp 80 rb/pasien (bayar per kg linen).",
        effect: { fixedCostDelta: -20_000_000, variableCostDelta: 80_000 },
        conceptTag: "Mixed",
      },
    ],
  },
  {
    id: "equipment-upgrade",
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
    category: "Fasilitas",
    title: "Upgrade Alat Radiologi",
    narrative:
      "Alat rontgen lama sering rusak. RS bisa beli alat baru (FC naik) atau terus tambal-sulam (VC perbaikan naik).",
    choices: [
      {
        label: "Beli Alat Rontgen Baru",
        description: "FC naik Rp 25 jt/bulan (cicilan), tapi hemat biaya perbaikan & TR naik.",
        effect: { fixedCostDelta: 25_000_000, satisfactionDelta: 5 },
        conceptTag: "FC",
      },
      {
        label: "Servis Alat Lama",
        description: "Bayar Rp 50 jt sekarang untuk servis, VC perbaikan Rp 50 rb/pasien.",
        effect: { cashDelta: -50_000_000, variableCostDelta: 50_000 },
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "cafeteria-decision",
    icon: <Package className="h-5 w-5 text-orange-600" />,
    category: "Fasilitas Penunjang",
    title: "Kantin Rumah Sakit",
    narrative:
      "Kantin RS sepi dan merugi. Pilih antara menutupnya atau menyewakan ke tenant.",
    choices: [
      {
        label: "Sewa ke Tenant (Pendapatan Tambahan)",
        description: "Terima sewa Rp 10 jt/bulan, kurangi FC operasional kantin Rp 12 jt/bulan.",
        effect: { fixedCostDelta: -22_000_000, satisfactionDelta: 2 },
        conceptTag: "FC",
      },
      {
        label: "Kelola Sendiri dengan Subsidi",
        description: "FC naik Rp 5 jt/bulan untuk subsidi makan pasien, kepuasan naik.",
        effect: { fixedCostDelta: 5_000_000, satisfactionDelta: 4 },
        conceptTag: "FC",
      },
    ],
  },
  {
    id: "medicine-stock",
    icon: <Package className="h-5 w-5 text-blue-500" />,
    category: "Farmasi",
    title: "Manajemen Stok Obat",
    narrative:
      "Apoteker menyarankan dua strategi pengadaan obat yang berbeda untuk mengoptimalkan biaya variabel.",
    choices: [
      {
        label: "Beli Stok Besar (Bulk) — Diskon 15%",
        description: "Bayar Rp 200 jt di muka, VC obat turun Rp 45 rb/pasien selama 3 bulan.",
        effect: { cashDelta: -200_000_000, variableCostDelta: -45_000 },
        conceptTag: "VC",
      },
      {
        label: "Beli Sesuai Kebutuhan (JIT)",
        description: "Tidak ada pengeluaran awal, VC obat tetap normal.",
        effect: {},
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "ict-system",
    icon: <Zap className="h-5 w-5 text-indigo-600" />,
    category: "Teknologi",
    title: "Sistem Informasi RS (SIMRS)",
    narrative:
      "Vendor menawarkan sistem digital untuk pencatatan pasien. Investasi awal besar, tapi menghemat biaya administrasi.",
    choices: [
      {
        label: "Implementasi SIMRS",
        description: "Bayar Rp 150 jt implementasi + FC Rp 5 jt/bulan lisensi. Efisiensi naik.",
        effect: { cashDelta: -150_000_000, fixedCostDelta: 5_000_000, satisfactionDelta: 4 },
        conceptTag: "FC",
      },
      {
        label: "Tetap Manual",
        description: "Hemat investasi, tapi VC administrasi Rp 30 rb/pasien lebih tinggi.",
        effect: { variableCostDelta: 30_000 },
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "generator-backup",
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
    category: "Infrastruktur",
    title: "Genset Cadangan",
    narrative:
      "Pemadaman listrik berulang menyebabkan gangguan operasional. RS perlu solusi catu daya cadangan.",
    choices: [
      {
        label: "Beli Genset Permanen",
        description: "Investasi Rp 300 jt, FC naik Rp 8 jt/bulan (BBM & maintenance). Stabil.",
        effect: { cashDelta: -300_000_000, fixedCostDelta: 8_000_000, satisfactionDelta: 3 },
        conceptTag: "FC",
      },
      {
        label: "Sewa Genset Per Kejadian",
        description: "VC naik Rp 70 rb/pasien saat pemadaman (estimasi 2x/bulan).",
        effect: { variableCostDelta: 70_000 },
        conceptTag: "VC",
      },
    ],
  },
  {
    id: "accreditation",
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    category: "Akreditasi",
    title: "Persiapan Akreditasi KARS",
    narrative:
      "RS dijadwalkan akreditasi KARS dalam 2 bulan. Persiapan butuh biaya, tapi meningkatkan reputasi.",
    choices: [
      {
        label: "Persiapan Intensif (Penuh)",
        description: "FC naik Rp 30 jt/bulan untuk 2 bulan, kepuasan & TR meningkat signifikan.",
        effect: { fixedCostDelta: 30_000_000, satisfactionDelta: 10 },
        conceptTag: "FC",
      },
      {
        label: "Persiapan Minimal",
        description: "Bayar Rp 20 jt saja, kepuasan naik sedikit, risiko akreditasi rendah.",
        effect: { cashDelta: -20_000_000, satisfactionDelta: 3 },
        conceptTag: "Mixed",
      },
    ],
  },
  {
    id: "ambulance",
    icon: <Building2 className="h-5 w-5 text-red-500" />,
    category: "Layanan Transportasi",
    title: "Armada Ambulans",
    narrative:
      "RS hanya punya 1 ambulans yang sering antri. Pilih antara beli ambulans baru atau kerja sama dengan jasa luar.",
    choices: [
      {
        label: "Beli Ambulans Baru",
        description: "FC naik Rp 12 jt/bulan (cicilan & BBM tetap), kepuasan naik.",
        effect: { fixedCostDelta: 12_000_000, satisfactionDelta: 4 },
        conceptTag: "FC",
      },
      {
        label: "Kerja Sama Jasa Ambulans Swasta",
        description: "VC naik Rp 90 rb/pasien IGD (bayar per-perjalanan), tidak ada aset.",
        effect: { variableCostDelta: 90_000, satisfactionDelta: 1 },
        conceptTag: "VC",
      },
    ],
  },
]

// ── Komponen Utama ────────────────────────────────────────────────────────────
interface MonthlyEventProps {
  gameState: GameState
  month: number
  onChoice: (effect: MonthlyEventEffect, choiceLabel: string) => void
  onSkip: () => void
}

const CONCEPT_EXPLANATIONS: Record<string, string> = {
  FC: "FC (Fixed Cost / Biaya Tetap): Biaya yang tidak berubah meski jumlah pasien bertambah atau berkurang. Contoh: sewa gedung, gaji pokok staf, cicilan alat.",
  VC: "VC (Variable Cost / Biaya Variabel): Biaya yang berubah seiring jumlah pasien. Semakin banyak pasien, semakin besar VC. Contoh: obat, bahan habis pakai, lembur.",
  TC: "TC (Total Cost / Total Biaya): Jumlah seluruh biaya. TC = FC + VC.",
  TR: "TR (Total Revenue / Total Pendapatan): Seluruh pendapatan dari layanan pasien.",
  Mixed: "Keputusan ini mempengaruhi kombinasi FC dan VC. Perlu analisis trade-off lebih lanjut.",
}

export default function MonthlyEvent({ gameState, month, onChoice, onSkip }: MonthlyEventProps) {
  const [selectedChoice, setSelectedChoice] = useState<0 | 1 | null>(null)
  const [showConcept, setShowConcept] = useState<string | null>(null)

  // Pilih event berdasarkan bulan (deterministik, bergantian dari pool)
  const event = EVENT_POOL[(month - 1) % EVENT_POOL.length]

  const handleConfirm = () => {
    if (selectedChoice === null) return
    onChoice(event.choices[selectedChoice].effect, event.choices[selectedChoice].label)
  }

  const renderEffectPreview = (effect: MonthlyEventEffect) => {
    const items: { label: string; value: string; color: string }[] = []
    if (effect.fixedCostDelta && effect.fixedCostDelta !== 0) {
      items.push({
        label: "FC",
        value: `${effect.fixedCostDelta > 0 ? "+" : ""}${formatCurrency(effect.fixedCostDelta)}/bln`,
        color: effect.fixedCostDelta > 0 ? "text-red-600" : "text-green-600",
      })
    }
    if (effect.variableCostDelta && effect.variableCostDelta !== 0) {
      items.push({
        label: "VC",
        value: `${effect.variableCostDelta > 0 ? "+" : ""}${formatCurrency(effect.variableCostDelta)}/pasien`,
        color: effect.variableCostDelta > 0 ? "text-red-600" : "text-green-600",
      })
    }
    if (effect.cashDelta && effect.cashDelta !== 0) {
      items.push({
        label: "Kas",
        value: `${effect.cashDelta > 0 ? "+" : ""}${formatCurrency(effect.cashDelta)} (sekali)`,
        color: effect.cashDelta > 0 ? "text-green-600" : "text-orange-600",
      })
    }
    if (effect.satisfactionDelta && effect.satisfactionDelta !== 0) {
      items.push({
        label: "Kepuasan",
        value: `${effect.satisfactionDelta > 0 ? "+" : ""}${effect.satisfactionDelta}%`,
        color: effect.satisfactionDelta > 0 ? "text-blue-600" : "text-red-600",
      })
    }
    if (items.length === 0) {
      items.push({ label: "TC", value: "Tidak berubah", color: "text-gray-500" })
    }
    return items
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="rounded-t-xl bg-gradient-to-r from-emerald-700 to-teal-600 p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
              Bulan {month}
            </span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
              {event.category}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">⚡ Keputusan Strategis</h2>
          <h3 className="text-base font-semibold text-emerald-100">{event.title}</h3>
        </div>

        {/* Narasi */}
        <div className="border-b px-5 py-4">
          <p className="text-sm text-gray-700">{event.narrative}</p>
        </div>

        {/* Pilihan */}
        <div className="space-y-3 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pilih Opsi:</p>
          {event.choices.map((choice, idx) => {
            const effects = renderEffectPreview(choice.effect)
            const isSelected = selectedChoice === idx
            return (
              <button
                key={idx}
                onClick={() => setSelectedChoice(idx as 0 | 1)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-800 text-sm">{choice.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowConcept(showConcept === choice.conceptTag ? null : choice.conceptTag)
                    }}
                    className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200"
                  >
                    {choice.conceptTag} ?
                  </button>
                </div>
                <p className="mb-3 text-xs text-gray-500">{choice.description}</p>
                {/* Preview dampak */}
                <div className="flex flex-wrap gap-2">
                  {effects.map((e, i) => (
                    <span
                      key={i}
                      className={`rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold ${e.color}`}
                    >
                      {e.label}: {e.value}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Penjelasan Konsep */}
        {showConcept && (
          <div className="mx-5 mb-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
            <span className="font-semibold">📚 Konsep Ekonomi: </span>
            {CONCEPT_EXPLANATIONS[showConcept]}
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex gap-3 border-t px-5 py-4">
          <Button variant="outline" size="sm" onClick={onSkip} className="flex-1">
            Lewati
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selectedChoice === null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Terapkan & Lanjutkan →
          </Button>
        </div>
      </div>
    </div>
  )
}
