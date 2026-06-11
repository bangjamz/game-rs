"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import Link from "next/link"
import { Trophy, HeartCrack, BookOpen, CalendarDays, TrendingUp, BarChart2, Microscope, Star, Lightbulb, Home, RefreshCw, Printer } from "lucide-react"

interface GameOverProps {
  gameState: GameState
  reason: string
}

function StarRating({ score }: { score: number }) {
  const stars = Math.round(score / 20)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-2xl transition-transform ${i <= stars ? "text-yellow-400" : "text-gray-200"}`}>
          ★
        </span>
      ))}
    </div>
  )
}

function ScoreBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-3 text-center ${color}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  )
}

export default function GameOver({ gameState, reason }: GameOverProps) {
  const isWin = gameState.currentMonth > 36
  const history = gameState.financialHistory.filter((m) => m.month > 0)
  const lastRecord = history[history.length - 1]

  const totalRevenue = history.reduce((s, m) => s + m.revenue, 0)
  const totalCosts = history.reduce((s, m) => s + m.totalCosts, 0)
  const totalProfit = history.reduce((s, m) => s + m.profit, 0)
  const totalPatients = history.reduce((s, m) => s + m.patients, 0)
  const profitMonths = history.filter((m) => m.profit > 0).length
  const profitRate = history.length > 0 ? (profitMonths / history.length) * 100 : 0
  const avgSatisfaction = history.length > 0
    ? history.reduce((s, m) => s + (m.patientSatisfaction || 0), 0) / history.length
    : gameState.patientSatisfaction
  const avgAtc = totalPatients > 0 ? totalCosts / totalPatients : 0
  const unlockedCount = Object.keys(gameState.unlockedDepartments || {}).length

  // Score calculation (0–100)
  const cashScore = Math.max(0, Math.min(40, (lastRecord?.cash || 0) / 500_000_000 * 10))
  const profitScore = Math.min(30, profitRate * 0.3)
  const satisfactionScore = Math.min(20, (avgSatisfaction / 100) * 20)
  const deptScore = Math.min(10, unlockedCount * 2.5)
  const totalScore = Math.round(cashScore + profitScore + satisfactionScore + deptScore)

  // Generate narrative
  const generateNarrative = () => {
    const lines: string[] = []
    if (isWin) {
      lines.push(`Selamat! ${gameState.managerName} berhasil mengelola ${gameState.hospitalName} selama 36 bulan penuh.`)
    } else {
      lines.push(`Simulasi berakhir di bulan ${gameState.currentMonth - 1}. ${reason}.`)
    }

    if (totalProfit > 0) {
      lines.push(`Secara keseluruhan, RS mencatatkan laba kumulatif ${formatCurrency(totalProfit)} dari ${totalPatients.toLocaleString("id-ID")} pasien.`)
    } else {
      lines.push(`RS mengalami kerugian kumulatif ${formatCurrency(Math.abs(totalProfit))} — biaya melebihi pendapatan.`)
    }

    if (profitRate >= 70) {
      lines.push(`Manajemen biaya sangat baik: ${profitRate.toFixed(0)}% bulan mencapai laba. Strategi FC vs VC efektif.`)
    } else if (profitRate >= 40) {
      lines.push(`Kinerja fluktuatif: hanya ${profitRate.toFixed(0)}% bulan menghasilkan laba. Perlu keseimbangan FC lebih baik.`)
    } else {
      lines.push(`Kinerja lemah: hanya ${profitRate.toFixed(0)}% bulan menguntungkan. FC terlalu berat dibanding jumlah pasien.`)
    }

    if (avgSatisfaction >= 80) {
      lines.push(`Kepuasan pasien rata-rata ${avgSatisfaction.toFixed(0)}% — pasien puas, mendorong pertumbuhan organik.`)
    } else if (avgSatisfaction >= 60) {
      lines.push(`Kepuasan pasien rata-rata ${avgSatisfaction.toFixed(0)}% — masih ada ruang perbaikan layanan.`)
    } else {
      lines.push(`Kepuasan pasien rendah (${avgSatisfaction.toFixed(0)}%) — kekurangan staf atau kapasitas terlalu penuh.`)
    }

    if (avgAtc > 0) {
      lines.push(`ATC (rata-rata biaya per pasien) = ${formatCurrency(avgAtc)}. Idealnya ATC < harga layanan rata-rata.`)
    }

    if (unlockedCount >= 3) {
      lines.push(`Ekspansi agresif: ${unlockedCount} departemen spesialis dibuka — diversifikasi revenue berhasil.`)
    } else if (unlockedCount >= 1) {
      lines.push(`${unlockedCount} departemen spesialis dibuka — masih ada potensi ekspansi layanan.`)
    } else {
      lines.push(`Tidak ada departemen spesialis yang dibuka — RS berjalan dengan layanan dasar saja.`)
    }

    return lines
  }

  const narrative = generateNarrative()

  // Chart data
  const chartData = history.map((m) => ({
    month: m.month,
    TR: Math.round(m.revenue / 1_000_000),
    FC: Math.round(m.fixedCosts / 1_000_000),
    VC: Math.round(m.variableCosts / 1_000_000),
    TC: Math.round(m.totalCosts / 1_000_000),
    Profit: Math.round(m.profit / 1_000_000),
    MC: m.marginalCost ? Math.round(m.marginalCost / 1_000_000) : 0,
    ATC: m.averageTotalCost ? Math.round(m.averageTotalCost / 1_000) : 0,
    Kepuasan: m.patientSatisfaction || 0,
  }))

  const yearSummaries = [1, 2, 3].map((year) => {
    const months = history.filter((m) => m.month > (year - 1) * 12 && m.month <= year * 12)
    if (!months.length) return null
    return {
      year,
      revenue: months.reduce((s, m) => s + m.revenue, 0),
      fixedCosts: months.reduce((s, m) => s + m.fixedCosts, 0),
      variableCosts: months.reduce((s, m) => s + m.variableCosts, 0),
      totalCosts: months.reduce((s, m) => s + m.totalCosts, 0),
      profit: months.reduce((s, m) => s + m.profit, 0),
      patients: months.reduce((s, m) => s + m.patients, 0),
    }
  }).filter(Boolean)

  const tooltipFormatter = (val: number, name: string) => {
    if (name === "Kepuasan") return [`${val}%`, name]
    if (name === "ATC") return [`Rp ${val} rb/pasien`, name]
    return [`Rp ${val} jt`, name]
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6 pb-12">

        {/* ── HERO ── */}
        <div className={`rounded-2xl p-6 text-center text-white ${isWin ? "bg-gradient-to-br from-emerald-600 to-teal-500" : "bg-gradient-to-br from-red-600 to-orange-500"}`}>
          {isWin
            ? <Trophy className="mx-auto mb-2 h-12 w-12 text-yellow-300" />
            : <HeartCrack className="mx-auto mb-2 h-12 w-12 text-red-200" />
          }
          <h1 className="text-2xl font-extrabold">{isWin ? "Simulasi Selesai!" : "Simulasi Berakhir"}</h1>
          <p className="mt-1 text-sm opacity-90">{gameState.hospitalName} · {gameState.managerName}</p>
          <p className="mt-2 text-sm opacity-80">{reason}</p>

          <div className="mt-4 flex justify-center">
            <StarRating score={totalScore} />
          </div>
          <p className="mt-1 text-sm opacity-80">Skor Akhir: {totalScore}/100</p>
        </div>

        {/* ── SKOR RINGKASAN ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreBadge label="Kas Akhir" value={formatCurrency(lastRecord?.cash || 0)} color={lastRecord?.cash >= 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"} />
          <ScoreBadge label="Total Pasien" value={totalPatients.toLocaleString("id-ID")} color="bg-blue-50 text-blue-800" />
          <ScoreBadge label="Bulan Laba" value={`${profitRate.toFixed(0)}%`} color={profitRate >= 60 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"} />
          <ScoreBadge label="Kepuasan Rata2" value={`${avgSatisfaction.toFixed(0)}%`} color={avgSatisfaction >= 70 ? "bg-purple-50 text-purple-800" : "bg-orange-50 text-orange-800"} />
        </div>

        {/* ── NARASI OTOMATIS ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" /> Analisis Perjalanan Simulasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {narrative.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-emerald-500">▸</span>
                  {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ── RINGKASAN TAHUNAN ── */}
        {yearSummaries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" /> Ringkasan per Tahun</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500">
                      <th className="pb-2 pr-4">Tahun</th>
                      <th className="pb-2 pr-4 text-right">TR</th>
                      <th className="pb-2 pr-4 text-right">FC</th>
                      <th className="pb-2 pr-4 text-right">VC</th>
                      <th className="pb-2 pr-4 text-right">TC</th>
                      <th className="pb-2 pr-4 text-right">Profit</th>
                      <th className="pb-2 text-right">Pasien</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearSummaries.map((s) => (
                      <tr key={s.year} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">Tahun {s.year}</td>
                        <td className="py-2 pr-4 text-right text-emerald-700">{formatCurrency(s.revenue)}</td>
                        <td className="py-2 pr-4 text-right text-amber-700">{formatCurrency(s.fixedCosts)}</td>
                        <td className="py-2 pr-4 text-right text-red-600">{formatCurrency(s.variableCosts)}</td>
                        <td className="py-2 pr-4 text-right font-medium">{formatCurrency(s.totalCosts)}</td>
                        <td className={`py-2 pr-4 text-right font-bold ${s.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {formatCurrency(s.profit)}
                        </td>
                        <td className="py-2 text-right">{s.patients.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── GRAFIK: TR vs TC vs Profit ── */}
        {chartData.length > 1 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> TR, TC, dan Profit per Bulan (juta Rp)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: "Bulan", position: "insideBottomRight", offset: -5 }} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="TR" name="TR" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="TC" name="TC" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Profit" name="Profit" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── GRAFIK: FC vs VC ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><BarChart2 className="h-4 w-4" /> Struktur Biaya: FC vs VC per Bulan (juta Rp)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Line type="monotone" dataKey="FC" name="FC (Biaya Tetap)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="VC" name="VC (Biaya Variabel)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── GRAFIK: MC & ATC ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Microscope className="h-4 w-4" /> MC (Marginal Cost) & ATC per Bulan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-gray-500">
                  <strong>MC</strong> = biaya tambahan per pasien vs bulan sebelumnya (juta Rp). <strong>ATC</strong> = rata-rata biaya per pasien (ribu Rp).
                  Grafik sehat: MC stabil & ATC cenderung turun seiring pertumbuhan pasien.
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={tooltipFormatter} />
                      <Legend />
                      <Line type="monotone" dataKey="MC" name="MC (jt Rp/pasien)" stroke="#f97316" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ATC" name="ATC (rb Rp/pasien)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ── GRAFIK: Kepuasan ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4" /> Tingkat Kepuasan Pasien per Bulan (%)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={tooltipFormatter} />
                    <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Target 70%", fontSize: 11, fill: "#10b981" }} />
                    <Line type="monotone" dataKey="Kepuasan" name="Kepuasan" stroke="#ec4899" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── PELAJARAN KUNCI ── */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-800"><Lightbulb className="h-4 w-4" /> Pelajaran Ekonomi Kesehatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { term: "FC (Fixed Cost)", lesson: `Total FC simulasi: ${formatCurrency(history.reduce((s,m)=>s+m.fixedCosts,0))}. FC tidak turun meski pasien berkurang — pastikan pasien cukup untuk menanggungnya.` },
                { term: "VC (Variable Cost)", lesson: `Total VC: ${formatCurrency(history.reduce((s,m)=>s+m.variableCosts,0))}. VC naik seiring pasien — efisien kalau revenue per pasien jauh di atas VC per pasien.` },
                { term: "ATC (Avg Total Cost)", lesson: `Rata-rata ATC: ${formatCurrency(avgAtc)}/pasien. Semakin banyak pasien, ATC cenderung turun karena FC terdistribusi lebih luas.` },
                { term: "MC (Marginal Cost)", lesson: "MC ideal < harga layanan. Jika MC terus naik, setiap pasien tambahan justru merugikan — tanda kapasitas penuh." },
              ].map(({ term, lesson }) => (
                <div key={term} className="rounded-lg bg-white p-3">
                  <p className="mb-1 text-xs font-bold text-blue-700">{term}</p>
                  <p className="text-xs text-gray-600">{lesson}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── FOOTER ── */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Cetak / Simpan PDF
          </Button>
          <Link href="/">
            <Button variant="outline"><Home className="mr-2 h-4 w-4" /> Beranda</Button>
          </Link>
          <Link href="/setup">
            <Button className="bg-emerald-600 hover:bg-emerald-700"><RefreshCw className="mr-2 h-4 w-4" /> Main Lagi</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
