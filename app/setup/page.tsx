"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Smile, Minus, Flame, Hospital, BookOpen, ChevronDown, ChevronUp } from "lucide-react"

const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Mudah",
    Icon: Smile,
    color: "border-green-400 bg-green-50",
    activeColor: "border-green-600 bg-green-100 ring-2 ring-green-400",
    badge: "bg-green-100 text-green-700",
    perks: [
      "Modal awal Rp 10 M + bunga pinjaman rendah (5%/th)",
      "Biaya operasional lebih ringan (×0.8)",
      "Event bulanan berdampak kecil",
      "Pasien tumbuh lebih cepat (+20%)",
    ],
    summary: "Cocok untuk belajar konsep dasar tanpa tekanan.",
  },
  {
    value: "medium",
    label: "Sedang",
    Icon: Minus,
    color: "border-yellow-400 bg-yellow-50",
    activeColor: "border-yellow-600 bg-yellow-100 ring-2 ring-yellow-400",
    badge: "bg-yellow-100 text-yellow-700",
    perks: [
      "Modal awal Rp 10 M, bunga 8%/th",
      "Biaya operasional standar",
      "Event bulanan berdampak normal",
      "Pertumbuhan pasien realistis",
    ],
    summary: "Seimbang antara tantangan dan peluang belajar.",
  },
  {
    value: "hard",
    label: "Sulit",
    Icon: Flame,
    color: "border-red-400 bg-red-50",
    activeColor: "border-red-600 bg-red-100 ring-2 ring-red-400",
    badge: "bg-red-100 text-red-700",
    perks: [
      "Modal awal Rp 10 M, bunga tinggi (12%/th)",
      "Biaya operasional lebih berat (×1.3)",
      "Event bulanan berdampak besar",
      "Pasien lebih fluktuatif & lambat tumbuh",
    ],
    summary: "Untuk yang ingin tantangan nyata manajemen RS.",
  },
]

export default function SetupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [managerName, setManagerName] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  const [difficulty, setDifficulty] = useState("medium")
  const [showTutorial, setShowTutorial] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!managerName.trim() || !hospitalName.trim()) {
      toast({
        title: "Input diperlukan",
        description: "Nama pengelola dan nama rumah sakit harus diisi",
        variant: "destructive",
      })
      return
    }

    const costMultiplier = difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.3 : 1.0

    const departmentCharacteristics = {
      emergency: { patientGrowth: 1.5, revenue: 3_000_000, stability: 0.8, specialty: 1.0 },
      generalClinic: { patientGrowth: 2.0, revenue: 800_000, stability: 0.9, specialty: 1.0 },
      inpatient: { patientGrowth: 1.2, revenue: 7_000_000, stability: 0.7, specialty: 1.0 },
    }

    const annualRate = difficulty === "easy" ? 0.05 : difficulty === "medium" ? 0.08 : 0.12

    const gameSetup = {
      managerName,
      hospitalName,
      difficulty,
      costMultiplier,
      startDate: new Date().toISOString(),
      cash: 10_000_000_000,
      loans: [
        {
          amount: 10_000_000_000,
          interestRate: annualRate,
          termMonths: 36,
          monthlyPayment: calculateLoanPayment(10_000_000_000, annualRate, 36),
          remainingMonths: 36,
        },
      ],
      loansTaken: 1,
      currentMonth: 1,
      departments: {
        emergency: { level: 1, capacity: 20, staff: 10, requiredStaff: 10 },
        generalClinic: { level: 1, capacity: 15, staff: 8, requiredStaff: 8 },
        inpatient: { level: 1, capacity: 10, staff: 5, requiredStaff: 5 },
      },
      unlockedDepartments: {},
      lockedDepartments: {
        cardiology: {
          name: "Kardiologi",
          unlockCost: 5_000_000_000,
          level: 0, capacity: 0, staff: 0, requiredStaff: 15,
          description: "Departemen spesialis jantung dan pembuluh darah",
        },
        pediatrics: {
          name: "Pediatri",
          unlockCost: 3_000_000_000,
          level: 0, capacity: 0, staff: 0, requiredStaff: 12,
          description: "Departemen spesialis anak",
        },
        surgery: {
          name: "Bedah",
          unlockCost: 7_000_000_000,
          level: 0, capacity: 0, staff: 0, requiredStaff: 20,
          description: "Departemen bedah dan operasi",
        },
        laboratory: {
          name: "Laboratorium",
          unlockCost: 2_500_000_000,
          level: 0, capacity: 0, staff: 0, requiredStaff: 8,
          description: "Laboratorium untuk pemeriksaan medis",
        },
      },
      staff: { doctors: 10, nurses: 15, administration: 5, support: 5 },
      staffMultipliers: { patientGrowth: 1.2, revenue: 1.15 },
      departmentMultipliers: departmentCharacteristics,
      patientSatisfaction: 70,
      satisfactionFactors: { staffRatio: 0.5, facilityQuality: 0.3, waitingTime: 0.2 },
      financialHistory: [
        {
          month: 0,
          revenue: 0,
          fixedCosts: Math.round(500_000_000 * costMultiplier),
          variableCosts: 0,
          totalCosts: Math.round(500_000_000 * costMultiplier),
          profit: -Math.round(500_000_000 * costMultiplier),
          patients: 0,
          cash: 10_000_000_000,
          patientSatisfaction: 70,
        },
      ],
    }

    localStorage.setItem("hospitalSimGame", JSON.stringify(gameSetup))
    router.push("/game")
  }

  function calculateLoanPayment(principal: number, annualRate: number, months: number) {
    const monthlyRate = annualRate / 12
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100 p-4">
      <div className="mx-auto max-w-2xl pt-6 pb-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <Hospital className="mx-auto mb-2 h-12 w-12 text-emerald-600" />
          <h1 className="text-3xl font-bold text-emerald-800">Rumah Sakit Simulator</h1>
          <p className="mt-1 text-emerald-600">Simulasi manajemen pembiayaan rumah sakit</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-emerald-700">Setup Permainan</CardTitle>
            <CardDescription>Isi informasi awal untuk memulai simulasi 3 tahun (36 bulan)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input nama */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="managerName">Nama Pengelola</Label>
                <Input
                  id="managerName"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Nama Anda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Nama Rumah Sakit</Label>
                <Input
                  id="hospitalName"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="RS ..."
                />
              </div>
            </div>

            {/* Difficulty selector */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tingkat Kesulitan</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      difficulty === opt.value ? opt.activeColor : opt.color + " hover:opacity-80"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <opt.Icon className="h-4 w-4 text-gray-600" />
                      <span className="font-bold text-gray-800">{opt.label}</span>
                      {difficulty === opt.value && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${opt.badge}`}>
                          Dipilih
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-xs text-gray-500">{opt.summary}</p>
                    <ul className="space-y-0.5">
                      {opt.perks.map((perk, i) => (
                        <li key={i} className="text-xs text-gray-600">• {perk}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            {/* Info awal */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="mb-2 font-semibold text-emerald-800">Kondisi Awal:</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <p className="text-emerald-700">• Modal: Rp 10 M (pinjaman 36 bln)</p>
                <p className="text-emerald-700">• 3 departemen aktif: IGD, Poli Umum, Rawat Inap</p>
                <p className="text-emerald-700">• 35 staf awal (10 dr, 15 prwt, 5 adm, 5 spt)</p>
                <p className="text-emerald-700">• 4 departemen spesialis bisa dibuka</p>
              </div>
            </div>

            {/* Tutorial toggle */}
            <button
              type="button"
              onClick={() => setShowTutorial(!showTutorial)}
              className="flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-100"
            >
              <span className="flex items-center gap-2 font-medium">
                <BookOpen className="h-4 w-4" /> Cara Bermain & Tujuan Pembelajaran
              </span>
              {showTutorial ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showTutorial && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm space-y-3">
                <div>
                  <p className="font-semibold text-blue-800 mb-1">Tujuan Pembelajaran</p>
                  <p className="text-blue-700">
                    Game ini mengajarkan konsep <strong>Pembiayaan Rumah Sakit</strong> melalui simulasi nyata:
                    bagaimana keputusan SDM, fasilitas, dan layanan mempengaruhi efisiensi & efektivitas RS.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-blue-800 mb-1">Konsep Ekonomi Kesehatan</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {[
                      ["FC", "Fixed Cost — biaya tetap (sewa, gaji pokok)"],
                      ["VC", "Variable Cost — biaya per pasien (obat, alkes)"],
                      ["TC", "Total Cost = FC + VC"],
                      ["TR", "Total Revenue — pendapatan semua pasien"],
                      ["MC", "Marginal Cost — biaya 1 pasien tambahan"],
                      ["ATC", "Average Total Cost = TC ÷ pasien"],
                    ].map(([code, desc]) => (
                      <p key={code} className="text-blue-700">
                        <span className="font-bold">{code}</span>: {desc}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-blue-800 mb-1">Cara Bermain</p>
                  <ol className="space-y-1 text-blue-700 list-decimal list-inside">
                    <li>Setiap bulan, kelola staf & departemen untuk menambah pasien</li>
                    <li>Klik "Lanjut Bulan" → pilih respons event bulanan</li>
                    <li>Analisis laporan: apakah TR &gt; TC? Apa BEP-nya?</li>
                    <li>Ambil pinjaman tambahan jika perlu (maks 3x tambahan)</li>
                    <li>Buka departemen spesialis untuk meningkatkan revenue</li>
                    <li>Capai 36 bulan dengan kas positif untuk menang!</li>
                  </ol>
                </div>
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                  <p className="text-amber-800 font-medium">Game Over jika:</p>
                  <ul className="text-amber-700 text-xs mt-1 space-y-0.5">
                    <li>• Kas defisit &gt; Rp 1 M dan tidak bisa pinjam lagi</li>
                    <li>• 3 bulan berturut-turut rugi dengan kas negatif</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSubmit} className="w-full bg-emerald-600 text-base hover:bg-emerald-700 py-6">
              <Hospital className="mr-2 h-5 w-5" /> Mulai Simulasi
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
