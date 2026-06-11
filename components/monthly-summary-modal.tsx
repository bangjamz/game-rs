"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import { Printer, ChevronRight, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, BarChart3, Target, AlertCircle, Lightbulb } from "lucide-react"

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  "✅": <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />,
  "🔴": <XCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />,
  "📊": <BarChart3 className="h-3.5 w-3.5 shrink-0 text-blue-600" />,
  "🎯": <Target className="h-3.5 w-3.5 shrink-0 text-emerald-600" />,
  "⚠️": <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />,
  "💡": <Lightbulb className="h-3.5 w-3.5 shrink-0 text-purple-600" />,
}

interface MonthlySummaryModalProps {
  gameState: GameState
  onContinue: () => void
}

export default function MonthlySummaryModal({ gameState, onContinue }: MonthlySummaryModalProps) {
  const history = gameState.financialHistory
  const current = history[history.length - 1]
  const previous = history.length > 1 ? history[history.length - 2] : null

  if (!current || current.month === 0) return null

  const profit = current.profit
  const isProfit = profit >= 0

  // Break-even calculation
  const revenuePerPatient = current.patients > 0 ? current.revenue / current.patients : 0
  const vcPerPatient = current.patients > 0 ? current.variableCosts / current.patients : 500_000
  const breakEvenPatients =
    vcPerPatient < revenuePerPatient && revenuePerPatient > 0
      ? Math.ceil(current.fixedCosts / (revenuePerPatient - vcPerPatient))
      : null

  // ATC = TC / Pasien
  const atc = current.patients > 0 ? current.totalCosts / current.patients : 0
  // AVC = VC / Pasien
  const avc = current.patients > 0 ? current.variableCosts / current.patients : 0
  // MC (dibanding bulan sebelumnya)
  const mc = current.marginalCost || 0

  // Trend helper
  const trend = (curr: number, prev: number | undefined) => {
    if (!prev || prev === 0) return null
    const pct = ((curr - prev) / Math.abs(prev)) * 100
    return pct
  }

  const revTrend = trend(current.revenue, previous?.revenue)
  const tcTrend = trend(current.totalCosts, previous?.totalCosts)
  const vcTrend = trend(current.variableCosts, previous?.variableCosts)

  // Auto-generate insight badges
  const insights: { icon: string; text: string; color: string }[] = []

  if (isProfit) {
    insights.push({
      icon: "✅",
      text: `TR (${formatCurrency(current.revenue)}) > TC (${formatCurrency(current.totalCosts)}) → RS menghasilkan laba`,
      color: "bg-green-50 text-green-800 border-green-200",
    })
  } else {
    insights.push({
      icon: "🔴",
      text: `TR < TC → RS merugi. Perlu kurangi TC atau tingkatkan TR`,
      color: "bg-red-50 text-red-800 border-red-200",
    })
  }

  if (vcTrend !== null && Math.abs(vcTrend) > 10) {
    insights.push({
      icon: "📊",
      text: `VC ${vcTrend > 0 ? "naik" : "turun"} ${Math.abs(vcTrend).toFixed(0)}% seiring perubahan jumlah pasien — ini sifat alami Biaya Variabel`,
      color: "bg-blue-50 text-blue-800 border-blue-200",
    })
  }

  if (breakEvenPatients !== null) {
    const aboveBreakEven = current.patients >= breakEvenPatients
    insights.push({
      icon: aboveBreakEven ? "🎯" : "⚠️",
      text: `Break-even: ${breakEvenPatients} pasien/bln. Saat ini: ${current.patients} pasien (${aboveBreakEven ? "di atas" : "di bawah"} titik impas)`,
      color: aboveBreakEven
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-amber-50 text-amber-800 border-amber-200",
    })
  }

  if (atc > 0) {
    insights.push({
      icon: "💡",
      text: `ATC = ${formatCurrency(Math.round(atc))}/pasien | AVC = ${formatCurrency(Math.round(avc))}/pasien${mc > 0 ? ` | MC = ${formatCurrency(Math.round(mc))}` : ""}`,
      color: "bg-purple-50 text-purple-800 border-purple-200",
    })
  }

  // Bulan dalam format teks
  const monthNames = [
    "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ]
  const monthLabel = monthNames[((current.month - 1) % 12) + 1] || `Bln ${current.month}`
  const yearLabel = `Tahun ${Math.ceil(current.month / 12)}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div
        id="print-area"
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl my-4"
      >
        {/* ── HEADER LAPORAN (gaya kop surat RS) ── */}
        <div className="rounded-t-xl bg-gradient-to-r from-emerald-800 to-teal-700 p-5 print-header">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-emerald-200">
                    Laporan Keuangan Operasional
                  </p>
                  <h1 className="text-xl font-bold text-white">{gameState.hospitalName}</h1>
                </div>
              </div>
              <p className="text-xs text-emerald-200">
                Pengelola: {gameState.managerName} &nbsp;|&nbsp; Periode: {monthLabel} {yearLabel} (Bulan ke-{current.month})
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-300">Tingkat Kesulitan</p>
              <p className="font-semibold capitalize text-white">{gameState.difficulty}</p>
            </div>
          </div>
        </div>

        {/* ── BADAN LAPORAN ── */}
        <div className="px-5 py-4">
          {/* === PENDAPATAN === */}
          <div className="mb-1">
            <div className="flex items-center gap-2 rounded-t-md bg-emerald-700 px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wide text-white">Pendapatan</span>
            </div>
            <div className="rounded-b-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">TR — Total Revenue (Total Pendapatan)</p>
                  <p className="text-xs text-emerald-700">Dari {current.patients} pasien × rata-rata tarif layanan</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-800">{formatCurrency(current.revenue)}</p>
                  {revTrend !== null && (
                    <div className={`flex items-center justify-end gap-1 text-xs ${revTrend >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {revTrend > 0 ? <TrendingUp className="h-3 w-3" /> : revTrend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {Math.abs(revTrend).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* === BIAYA === */}
          <div className="mb-1 mt-3">
            <div className="flex items-center gap-2 rounded-t-md bg-gray-700 px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wide text-white">Biaya</span>
            </div>

            {/* FC */}
            <div className="border-x border-gray-200 bg-white px-3 py-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">FC — Fixed Cost (Biaya Tetap)</p>
                  <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                    <p className="flex justify-between gap-8">
                      <span>• Sewa gedung & utilitas</span>
                      <span>{formatCurrency(150_000_000)}</span>
                    </p>
                    <p className="flex justify-between gap-8">
                      <span>• Perawatan peralatan medis</span>
                      <span>{formatCurrency(80_000_000)}</span>
                    </p>
                    <p className="flex justify-between gap-8">
                      <span>• Gaji pokok staf ({gameState.staff.doctors} dr, {gameState.staff.nurses} prwt, {gameState.staff.administration} adm, {gameState.staff.support} spt)</span>
                      <span>
                        {formatCurrency(
                          gameState.staff.doctors * 8_000_000 +
                            gameState.staff.nurses * 3_000_000 +
                            gameState.staff.administration * 2_000_000 +
                            gameState.staff.support * 1_500_000,
                        )}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-base font-bold text-amber-700 whitespace-nowrap">{formatCurrency(current.fixedCosts)}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-x border-gray-200 px-3 py-0.5">
              <div className="border-t border-dashed border-gray-200" />
            </div>

            {/* VC */}
            <div className="border-x border-gray-200 bg-white px-3 py-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">VC — Variable Cost (Biaya Variabel)</p>
                  <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                    <p className="flex justify-between gap-8">
                      <span>• Obat & bahan medis ({formatCurrency(300_000)}/pasien)</span>
                      <span>{formatCurrency(current.patients * 300_000)}</span>
                    </p>
                    <p className="flex justify-between gap-8">
                      <span>• Perlengkapan medis ({formatCurrency(200_000)}/pasien)</span>
                      <span>{formatCurrency(current.patients * 200_000)}</span>
                    </p>
                    {current.variableCosts > current.patients * 500_000 && (
                      <p className="flex justify-between gap-8">
                        <span>• Biaya lembur (kapasitas &gt;80%)</span>
                        <span>{formatCurrency(current.variableCosts - current.patients * 500_000)}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-red-700 whitespace-nowrap">{formatCurrency(current.variableCosts)}</p>
                  {vcTrend !== null && (
                    <p className={`text-xs ${vcTrend >= 0 ? "text-red-500" : "text-green-600"}`}>
                      {vcTrend > 0 ? "+" : ""}{vcTrend.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* TC Total */}
            <div className="flex items-center justify-between rounded-b-md border border-gray-300 bg-gray-100 px-3 py-2">
              <div>
                <p className="text-sm font-bold text-gray-900">TC — Total Cost (TC = FC + VC)</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${Math.round((current.fixedCosts / current.totalCosts) * 80)}px` }} />
                  <div className="h-2 rounded-full bg-red-400" style={{ width: `${Math.round((current.variableCosts / current.totalCosts) * 80)}px` }} />
                  <span className="text-xs text-gray-500">
                    FC {Math.round((current.fixedCosts / current.totalCosts) * 100)}% | VC {Math.round((current.variableCosts / current.totalCosts) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(current.totalCosts)}</p>
            </div>
          </div>

          {/* === ANGSURAN PINJAMAN === */}
          {gameState.loans.some((l) => l.remainingMonths > 0) && (
            <div className="mt-1 flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-orange-800">Angsuran Pinjaman</p>
                <p className="text-xs text-orange-600">
                  {gameState.loans.filter((l) => l.remainingMonths > 0).length} pinjaman aktif
                </p>
              </div>
              <p className="font-bold text-orange-700">
                ({formatCurrency(gameState.loans.reduce((t, l) => l.remainingMonths > 0 ? t + l.monthlyPayment : t, 0))})
              </p>
            </div>
          )}

          {/* === GARIS PEMISAH PROFIT === */}
          <div className="my-3 border-t-2 border-gray-900" />

          {/* === PROFIT / RUGI === */}
          <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${isProfit ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div>
              <p className={`flex items-center gap-2 text-base font-bold ${isProfit ? "text-green-800" : "text-red-800"}`}>
                {isProfit ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {isProfit ? "LABA (TR − TC)" : "RUGI (TR − TC)"}
              </p>
              <p className={`text-xs ${isProfit ? "text-green-600" : "text-red-600"}`}>
                Kas tersedia: {formatCurrency(gameState.cash)}
              </p>
            </div>
            <p className={`text-2xl font-extrabold ${isProfit ? "text-green-700" : "text-red-700"}`}>
              {formatCurrency(profit)}
            </p>
          </div>

          {/* === METRIK KUNCI PER PASIEN === */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md bg-gray-50 p-2 text-center">
              <p className="text-xs font-medium text-gray-500">Total Pasien</p>
              <p className="text-lg font-bold text-gray-800">{current.patients}</p>
            </div>
            <div className="rounded-md bg-purple-50 p-2 text-center">
              <p className="text-xs font-medium text-purple-600">ATC/pasien</p>
              <p className="text-sm font-bold text-purple-800">{formatCurrency(atc)}</p>
            </div>
            <div className="rounded-md bg-teal-50 p-2 text-center">
              <p className="text-xs font-medium text-teal-600">AVC/pasien</p>
              <p className="text-sm font-bold text-teal-800">{formatCurrency(avc)}</p>
            </div>
            <div className="rounded-md bg-orange-50 p-2 text-center">
              <p className="text-xs font-medium text-orange-600">MC (Marginal)</p>
              <p className="text-sm font-bold text-orange-800">{formatCurrency(mc)}</p>
            </div>
          </div>

          {/* === INSIGHT OTOMATIS === */}
          {insights.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <Lightbulb className="h-3.5 w-3.5" /> Analisis Otomatis
              </p>
              {insights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${insight.color}`}>
                  <span className="mt-0.5">{INSIGHT_ICONS[insight.icon] ?? insight.icon}</span>
                  {insight.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER AKSI ── */}
        <div className="flex items-center justify-between border-t px-5 py-4 print-hide">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2 text-gray-600"
          >
            <Printer className="h-4 w-4" />
            Cetak Laporan
          </Button>
          <Button
            size="sm"
            onClick={onContinue}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            Lanjut Bulan {(gameState.currentMonth)} →
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
