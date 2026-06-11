"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { Printer, Info } from "lucide-react"

interface FinancesProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
}

// Penjelasan konsep untuk tooltip
const CONCEPT_INFO: Record<string, { title: string; explanation: string }> = {
  fc: {
    title: "FC — Fixed Cost (Biaya Tetap)",
    explanation:
      "Biaya yang TIDAK berubah meski jumlah pasien bertambah atau berkurang. Contoh: sewa gedung, gaji pokok, cicilan alat. FC adalah 'overhead' yang harus dibayar setiap bulan.",
  },
  vc: {
    title: "VC — Variable Cost (Biaya Variabel)",
    explanation:
      "Biaya yang berubah SEIRING jumlah pasien. Semakin banyak pasien, semakin besar VC. Contoh: obat, bahan habis pakai, lembur. Rumus: VC = VC/pasien × jumlah pasien.",
  },
  tc: {
    title: "TC — Total Cost (Total Biaya)",
    explanation:
      "Seluruh biaya yang dikeluarkan RS. Rumus: TC = FC + VC. Ini adalah jumlah yang harus ditutupi oleh pendapatan agar RS tidak merugi.",
  },
  tr: {
    title: "TR — Total Revenue (Total Pendapatan)",
    explanation:
      "Seluruh pendapatan dari layanan kesehatan. Rumus: TR = tarif rata-rata × jumlah pasien. RS untung jika TR > TC.",
  },
  atc: {
    title: "ATC — Average Total Cost (Rata-rata Biaya Total per Pasien)",
    explanation:
      "Berapa rata-rata biaya per pasien. Rumus: ATC = TC / Q (Q = jumlah pasien). Berguna untuk menetapkan tarif minimal agar tidak merugi.",
  },
  avc: {
    title: "AVC — Average Variable Cost (Rata-rata Biaya Variabel per Pasien)",
    explanation:
      "Rata-rata VC per pasien. Rumus: AVC = VC / Q. Dalam jangka pendek, selama TR > AVC, RS masih bisa bertahan (meski belum menutupi FC).",
  },
  mc: {
    title: "MC — Marginal Cost (Biaya Marjinal)",
    explanation:
      "Tambahan biaya akibat melayani 1 pasien tambahan. Rumus: MC = ΔTC / ΔQ. Penting untuk keputusan: 'Apakah worth menerima pasien tambahan?'",
  },
  breakeven: {
    title: "Break-Even Point (Titik Impas)",
    explanation:
      "Jumlah pasien minimum agar TR = TC (tidak untung, tidak rugi). Rumus: Q* = FC / (TR/pasien - VC/pasien). Di atas titik ini, setiap pasien tambahan menghasilkan laba.",
  },
}

export default function Finances({ gameState, setGameState }: FinancesProps) {
  const { toast } = useToast()
  const [loanAmount, setLoanAmount] = useState("1000000000")
  const [activeTab, setActiveTab] = useState("report")
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null)
  const [breakEvenSlider, setBreakEvenSlider] = useState<number | null>(null)

  const handleTakeLoan = () => {
    const amount = Number(loanAmount)

    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Jumlah tidak valid", description: "Masukkan jumlah pinjaman yang valid", variant: "destructive" })
      return
    }
    if (gameState.loansTaken >= 4) {
      toast({ title: "Batas pinjaman tercapai", description: "Anda sudah mencapai batas maksimum pinjaman (4 kali)", variant: "destructive" })
      return
    }

    const interestRate = gameState.difficulty === "easy" ? 0.05 : gameState.difficulty === "medium" ? 0.08 : 0.12
    const termMonths = 24
    const monthlyRate = interestRate / 12
    const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths))

    setGameState({
      ...gameState,
      cash: gameState.cash + amount,
      loansTaken: gameState.loansTaken + 1,
      loans: [...gameState.loans, { amount, interestRate, termMonths, monthlyPayment, remainingMonths: termMonths }],
    })

    toast({ title: "Pinjaman berhasil", description: `Anda telah menerima pinjaman sebesar ${formatCurrency(amount)}` })
  }

  const current = gameState.financialHistory[gameState.financialHistory.length - 1]
  const totalOutstandingLoans = gameState.loans.reduce((t, l) => l.remainingMonths > 0 ? t + l.monthlyPayment * l.remainingMonths : t, 0)
  const monthlyLoanPayments = gameState.loans.reduce((t, l) => l.remainingMonths > 0 ? t + l.monthlyPayment : t, 0)

  // Derived per-patient metrics
  const atc = current.patients > 0 ? current.totalCosts / current.patients : 0
  const avc = current.patients > 0 ? current.variableCosts / current.patients : 0
  const revenuePerPatient = current.patients > 0 ? current.revenue / current.patients : 0
  const vcPerPatient = current.patients > 0 ? current.variableCosts / current.patients : 500_000
  const contributionMargin = revenuePerPatient - vcPerPatient

  // Break-even calculation
  const breakEvenQ =
    contributionMargin > 0
      ? Math.ceil(current.fixedCosts / contributionMargin)
      : null

  // FC/VC ratio for visual bar
  const fcRatio = current.totalCosts > 0 ? (current.fixedCosts / current.totalCosts) * 100 : 50
  const vcRatio = 100 - fcRatio

  // Break-even chart data
  const maxPatients = Math.max(current.patients * 2, breakEvenQ ? breakEvenQ * 1.5 : 1000)
  const sliderMax = Math.ceil(maxPatients)
  const sliderVal = breakEvenSlider ?? current.patients

  const breakEvenChartData = Array.from({ length: 21 }, (_, i) => {
    const q = Math.round((i / 20) * sliderMax)
    return {
      q,
      TC: current.fixedCosts + q * vcPerPatient,
      TR: q * revenuePerPatient,
      FC: current.fixedCosts,
    }
  })

  // Historical chart data
  const revenueData = gameState.financialHistory.filter(m => m.month > 0).map(m => ({
    month: m.month, TR: m.revenue, TC: m.totalCosts, profit: m.profit,
  }))
  const costData = gameState.financialHistory.filter(m => m.month > 0).map(m => ({
    month: m.month, FC: m.fixedCosts, VC: m.variableCosts, TC: m.totalCosts,
  }))
  const perPatientData = gameState.financialHistory.filter(m => m.month > 0 && m.patients > 0).map(m => ({
    month: m.month, ATC: m.averageTotalCost || 0, AVC: m.averageVariableCost || 0, MC: m.marginalCost || 0,
  }))

  // Concept info tooltip component
  const ConceptBadge = ({ id }: { id: string }) => (
    <button
      onMouseEnter={() => setHoveredConcept(id)}
      onMouseLeave={() => setHoveredConcept(null)}
      className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
    >
      <Info className="h-3 w-3 mr-0.5" />
      {id.toUpperCase()}
    </button>
  )

  const tabs = [
    { id: "report", label: "📋 Laporan" },
    { id: "breakeven", label: "📍 Break-Even" },
    { id: "charts", label: "📈 Grafik" },
    { id: "loans", label: "💰 Pinjaman" },
  ]

  return (
    <div className="space-y-4">
      {/* Concept tooltip overlay */}
      {hoveredConcept && CONCEPT_INFO[hoveredConcept] && (
        <div className="fixed bottom-6 left-1/2 z-50 w-80 -translate-x-1/2 rounded-xl bg-blue-900 p-4 text-white shadow-2xl">
          <p className="mb-1 text-sm font-bold text-blue-200">{CONCEPT_INFO[hoveredConcept].title}</p>
          <p className="text-xs leading-relaxed text-blue-100">{CONCEPT_INFO[hoveredConcept].explanation}</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex overflow-x-auto border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB 1: LAPORAN KEUANGAN (format RS)
          ═══════════════════════════════════════════ */}
      {activeTab === "report" && (
        <div id="print-area">
          {/* Kop Laporan */}
          <div className="mb-4 rounded-xl border-2 border-emerald-200 bg-emerald-700 p-4 text-white">
            <p className="text-xs uppercase tracking-widest text-emerald-200">
              Laporan Keuangan Operasional Bulanan
            </p>
            <h2 className="text-xl font-bold">{gameState.hospitalName}</h2>
            <p className="text-sm text-emerald-200">
              Periode: Bulan {current.month} &nbsp;|&nbsp; Pengelola: {gameState.managerName}
            </p>
          </div>

          {/* Tombol cetak */}
          <div className="mb-4 flex justify-end print-hide">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-2 text-gray-600"
            >
              <Printer className="h-4 w-4" />
              Cetak Laporan (PDF)
            </Button>
          </div>

          {/* ── PENDAPATAN ── */}
          <div className="mb-2 overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between bg-emerald-700 px-4 py-2">
              <span className="text-sm font-bold uppercase tracking-wide text-white">Pendapatan</span>
              <div className="flex items-center gap-1">
                <ConceptBadge id="tr" />
              </div>
            </div>
            <div className="bg-emerald-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-emerald-900">TR — Total Revenue</p>
                  <p className="text-xs text-emerald-700">{current.patients} pasien × rata-rata tarif layanan</p>
                </div>
                <p className="text-xl font-bold text-emerald-800">{formatCurrency(current.revenue)}</p>
              </div>
            </div>
          </div>

          {/* ── BIAYA ── */}
          <div className="mb-2 overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between bg-gray-700 px-4 py-2">
              <span className="text-sm font-bold uppercase tracking-wide text-white">Biaya</span>
              <ConceptBadge id="tc" />
            </div>

            {/* FC */}
            <div className="border-b bg-white px-4 py-3">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-sm bg-amber-400" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      FC — Fixed Cost
                      <ConceptBadge id="fc" />
                    </p>
                    <p className="text-xs text-gray-500">Tidak berubah meski pasien bertambah/berkurang</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(current.fixedCosts)}</p>
              </div>
              <div className="ml-5 space-y-1 rounded-md bg-amber-50 p-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>• Sewa gedung & utilitas</span>
                  <span className="font-medium">{formatCurrency(150_000_000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Perawatan peralatan medis</span>
                  <span className="font-medium">{formatCurrency(80_000_000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Gaji pokok staf ({gameState.staff.doctors + gameState.staff.nurses + gameState.staff.administration + gameState.staff.support} orang)</span>
                  <span className="font-medium">
                    {formatCurrency(
                      gameState.staff.doctors * 8_000_000 +
                      gameState.staff.nurses * 3_000_000 +
                      gameState.staff.administration * 2_000_000 +
                      gameState.staff.support * 1_500_000
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* VC */}
            <div className="border-b bg-white px-4 py-3">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-sm bg-red-400" />
                  <div>
                    <p className="font-semibold text-gray-800">
                      VC — Variable Cost
                      <ConceptBadge id="vc" />
                    </p>
                    <p className="text-xs text-gray-500">Naik seiring jumlah pasien bertambah</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-red-700">{formatCurrency(current.variableCosts)}</p>
              </div>
              <div className="ml-5 space-y-1 rounded-md bg-red-50 p-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>• Obat & bahan medis (Rp 300rb/pasien × {current.patients})</span>
                  <span className="font-medium">{formatCurrency(current.patients * 300_000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Perlengkapan medis (Rp 200rb/pasien × {current.patients})</span>
                  <span className="font-medium">{formatCurrency(current.patients * 200_000)}</span>
                </div>
                {current.variableCosts > current.patients * 500_000 && (
                  <div className="flex justify-between text-orange-700">
                    <span>• Biaya lembur (kapasitas &gt;80%)</span>
                    <span className="font-medium">{formatCurrency(current.variableCosts - current.patients * 500_000)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* TC Visual Bar + Total */}
            <div className="bg-gray-50 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-bold text-gray-900">TC = FC + VC</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(current.totalCosts)}</p>
              </div>
              {/* Visual proportion bar */}
              <div className="flex h-4 w-full overflow-hidden rounded-full">
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${fcRatio}%` }}
                  title={`FC: ${fcRatio.toFixed(0)}%`}
                />
                <div
                  className="bg-red-400 transition-all duration-500"
                  style={{ width: `${vcRatio}%` }}
                  title={`VC: ${vcRatio.toFixed(0)}%`}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-amber-400" />
                  FC {fcRatio.toFixed(0)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-red-400" />
                  VC {vcRatio.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* ── ANGSURAN PINJAMAN ── */}
          {monthlyLoanPayments > 0 && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <div>
                <p className="font-semibold text-orange-800">Angsuran Pinjaman Bulan Ini</p>
                <p className="text-xs text-orange-600">{gameState.loans.filter(l => l.remainingMonths > 0).length} pinjaman aktif</p>
              </div>
              <p className="text-lg font-bold text-orange-700">({formatCurrency(monthlyLoanPayments)})</p>
            </div>
          )}

          {/* ── PROFIT / RUGI ── */}
          <div className={`mb-4 flex items-center justify-between rounded-lg border-2 px-4 py-3 ${current.profit >= 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <div>
              <p className={`text-lg font-bold ${current.profit >= 0 ? "text-green-800" : "text-red-800"}`}>
                {current.profit >= 0 ? "✅ LABA BERSIH (TR − TC)" : "❌ RUGI BERSIH (TR − TC)"}
              </p>
              <p className={`text-sm ${current.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                Kas tersedia saat ini: {formatCurrency(gameState.cash)}
              </p>
            </div>
            <p className={`text-3xl font-extrabold ${current.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
              {formatCurrency(current.profit)}
            </p>
          </div>

          {/* ── METRIK PER PASIEN ── */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Pasien", value: `${current.patients}`, concept: null, color: "bg-gray-50" },
              { label: "ATC / Pasien", value: formatCurrency(atc), concept: "atc", color: "bg-purple-50" },
              { label: "AVC / Pasien", value: formatCurrency(avc), concept: "avc", color: "bg-teal-50" },
              { label: "MC (Marjinal)", value: formatCurrency(current.marginalCost || 0), concept: "mc", color: "bg-orange-50" },
            ].map((m, i) => (
              <div key={i} className={`rounded-lg p-3 text-center ${m.color}`}>
                <p className="text-xs font-medium text-gray-500">
                  {m.label}
                  {m.concept && <button onMouseEnter={() => setHoveredConcept(m.concept!)} onMouseLeave={() => setHoveredConcept(null)} className="ml-1 text-blue-400">ℹ</button>}
                </p>
                <p className="mt-1 text-sm font-bold text-gray-800">{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── RINGKASAN PINJAMAN ── */}
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 font-semibold text-gray-700">Status Pinjaman</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Pinjaman Tertunggak:</span>
                <span className="font-semibold text-red-600">{formatCurrency(totalOutstandingLoans)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Angsuran per Bulan:</span>
                <span className="font-semibold">{formatCurrency(monthlyLoanPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pinjaman Diambil:</span>
                <span className="font-semibold">{gameState.loansTaken} / 4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 2: BREAK-EVEN VISUALIZER
          ═══════════════════════════════════════════ */}
      {activeTab === "breakeven" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                📍 Analisis Break-Even Point (Titik Impas)
                <button onMouseEnter={() => setHoveredConcept("breakeven")} onMouseLeave={() => setHoveredConcept(null)} className="text-blue-400 text-sm">ℹ</button>
              </CardTitle>
              <CardDescription>
                Break-Even = jumlah pasien minimum agar TR = TC (tidak untung, tidak rugi)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center text-sm">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-600">TR/Pasien</p>
                  <p className="font-bold text-emerald-800">{formatCurrency(revenuePerPatient)}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs text-red-600">VC/Pasien</p>
                  <p className="font-bold text-red-800">{formatCurrency(vcPerPatient)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-600">Contribution Margin/Pasien</p>
                  <p className="font-bold text-blue-800">{formatCurrency(contributionMargin)}</p>
                  <p className="text-xs text-blue-500">(TR - VC per pasien)</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="text-xs text-purple-600">Break-Even (Q*)</p>
                  <p className="font-bold text-purple-800">
                    {breakEvenQ !== null ? `${breakEvenQ} pasien` : "N/A"}
                  </p>
                  <p className="text-xs text-purple-500">= FC ÷ CM</p>
                </div>
              </div>

              {/* Slider */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Simulasi jumlah pasien: <strong>{sliderVal}</strong>
                  {breakEvenQ && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${sliderVal >= breakEvenQ ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {sliderVal >= breakEvenQ ? `✅ ${sliderVal - breakEvenQ} di atas BEP` : `❌ ${breakEvenQ - sliderVal} di bawah BEP`}
                    </span>
                  )}
                </label>
                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  value={sliderVal}
                  onChange={(e) => setBreakEvenSlider(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>0</span>
                  <span>{sliderMax}</span>
                </div>
              </div>

              {/* Prediksi berdasarkan slider */}
              {breakEvenSlider !== null && (
                <div className={`mb-4 rounded-lg p-3 text-sm ${(current.fixedCosts + sliderVal * vcPerPatient) < sliderVal * revenuePerPatient ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <p className="font-semibold">Simulasi dengan {sliderVal} pasien:</p>
                  <p>TR = {formatCurrency(sliderVal * revenuePerPatient)}</p>
                  <p>TC = FC ({formatCurrency(current.fixedCosts)}) + VC ({formatCurrency(sliderVal * vcPerPatient)}) = {formatCurrency(current.fixedCosts + sliderVal * vcPerPatient)}</p>
                  <p className="font-bold">Profit/Rugi = {formatCurrency(sliderVal * revenuePerPatient - (current.fixedCosts + sliderVal * vcPerPatient))}</p>
                </div>
              )}

              {/* Grafik break-even */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={breakEvenChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="q" label={{ value: "Jumlah Pasien (Q)", position: "insideBottomRight", offset: -5 }} />
                    <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} labelFormatter={(l) => `${l} pasien`} />
                    <Legend />
                    {breakEvenQ && <ReferenceLine x={breakEvenQ} stroke="#8b5cf6" strokeDasharray="4 4" label={{ value: `BEP: ${breakEvenQ}`, fill: "#8b5cf6", fontSize: 11 }} />}
                    <Line type="monotone" dataKey="TC" name="TC (Total Cost)" stroke="#ef4444" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="TR" name="TR (Total Revenue)" stroke="#10b981" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="FC" name="FC (Fixed Cost)" stroke="#f59e0b" dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400">
                Titik persilangan TR dan TC = Break-Even Point. Area hijau (TR &gt; TC) = zona laba.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 3: GRAFIK HISTORIS
          ═══════════════════════════════════════════ */}
      {activeTab === "charts" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TR, TC, dan Profit per Bulan</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" label={{ value: "Bulan", position: "insideBottomRight", offset: -5 }} />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="TR" name="TR (Pendapatan)" stroke="#10b981" activeDot={{ r: 6 }} strokeWidth={2} />
                  <Line type="monotone" dataKey="TC" name="TC (Total Biaya)" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" name="Profit/Rugi" stroke="#3b82f6" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">FC, VC, dan TC per Bulan</CardTitle>
              <CardDescription>FC relatif stabil; VC naik seiring pasien bertambah</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" label={{ value: "Bulan", position: "insideBottomRight", offset: -5 }} />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="FC" name="FC (Biaya Tetap)" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="VC" name="VC (Biaya Variabel)" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="TC" name="TC (Total Biaya)" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ATC, AVC, dan MC per Bulan</CardTitle>
              <CardDescription>Biaya per pasien — berguna untuk penetapan tarif</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perPatientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" label={{ value: "Bulan", position: "insideBottomRight", offset: -5 }} />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="ATC" name="ATC (Rata-rata TC/pasien)" stroke="#ec4899" strokeWidth={2} />
                  <Line type="monotone" dataKey="AVC" name="AVC (Rata-rata VC/pasien)" stroke="#14b8a6" strokeWidth={2} />
                  <Line type="monotone" dataKey="MC" name="MC (Biaya Marjinal)" stroke="#f97316" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 4: PINJAMAN
          ═══════════════════════════════════════════ */}
      {activeTab === "loans" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ambil Pinjaman Baru</CardTitle>
              <CardDescription>Pinjaman ke-{gameState.loansTaken + 1} dari maksimal 4</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Jumlah Pinjaman (Rupiah)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  min="1000000000"
                  max="10000000000"
                  step="1000000000"
                />
                <p className="text-xs text-gray-500">Min: Rp 1 Milyar — Max: Rp 10 Milyar</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-sm">
                <p className="mb-2 font-semibold text-blue-800">Informasi Pinjaman</p>
                <div className="space-y-1 text-blue-700">
                  <p>• Jangka waktu: 24 bulan (2 tahun)</p>
                  <p>• Suku bunga: {gameState.difficulty === "easy" ? "5%" : gameState.difficulty === "medium" ? "8%" : "12%"}/tahun</p>
                  <p>
                    • Angsuran bulanan (menambah FC):{" "}
                    <strong>
                      {formatCurrency(
                        (() => {
                          const r = (gameState.difficulty === "easy" ? 0.05 : gameState.difficulty === "medium" ? 0.08 : 0.12) / 12
                          const n = Number(loanAmount)
                          return (n * r) / (1 - Math.pow(1 + r, -24))
                        })()
                      )}
                    </strong>
                  </p>
                  <p className="mt-2 text-xs text-blue-600">
                    ⚠ Angsuran pinjaman termasuk dalam komponen <strong>FC</strong> karena jumlahnya tetap setiap bulan
                    terlepas dari jumlah pasien.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleTakeLoan}
                disabled={gameState.loansTaken >= 4}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {gameState.loansTaken >= 4 ? "Batas Pinjaman Tercapai" : "Ambil Pinjaman"}
              </Button>
            </CardFooter>
          </Card>

          {/* Daftar pinjaman aktif */}
          {gameState.loans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daftar Pinjaman</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gameState.loans.map((loan, i) => (
                    <div key={i} className={`rounded-lg border p-3 ${loan.remainingMonths > 0 ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold text-sm">Pinjaman #{i + 1}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${loan.remainingMonths > 0 ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                          {loan.remainingMonths > 0 ? `Aktif (${loan.remainingMonths} bln)` : "Lunas"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-gray-500">Jumlah Awal:</span>
                        <span className="font-medium">{formatCurrency(loan.amount)}</span>
                        <span className="text-gray-500">Suku Bunga:</span>
                        <span className="font-medium">{(loan.interestRate * 100).toFixed(1)}%/tahun</span>
                        <span className="text-gray-500">Angsuran/Bulan:</span>
                        <span className="font-medium">{formatCurrency(loan.monthlyPayment)}</span>
                        <span className="text-gray-500">Sisa Total:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(loan.monthlyPayment * loan.remainingMonths)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

