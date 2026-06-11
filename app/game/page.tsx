"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import Dashboard from "@/components/dashboard"
import Departments from "@/components/departments"
import Staff from "@/components/staff"
import Finances from "@/components/finances"
import GameOver from "@/components/game-over"
import MonthlyEvent, { type MonthlyEventEffect } from "@/components/monthly-event"
import MonthlySummaryModal from "@/components/monthly-summary-modal"
import HelpButton from "@/components/help-button"
import { LayoutDashboard, Building2, Users2, Wallet, Hospital, Loader2, FileText, SkipForward } from "lucide-react"
import type { GameState } from "@/lib/types"

const TAB_META = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "departments", label: "Departemen", Icon: Building2 },
  { key: "staff", label: "Staf", Icon: Users2 },
  { key: "finances", label: "Keuangan", Icon: Wallet },
]

export default function GamePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [gameOver, setGameOver] = useState(false)
  const [gameOverReason, setGameOverReason] = useState("")

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  // After event resolved, ask user if they want to see the report
  const [showReportChoice, setShowReportChoice] = useState(false)
  // Pending month result (to show in summary)
  const [pendingEffect, setPendingEffect] = useState<MonthlyEventEffect>({})

  // Cost modifiers from events
  const [extraFixedCost, setExtraFixedCost] = useState(0)
  const [extraVCPerPatient, setExtraVCPerPatient] = useState(0)

  useEffect(() => {
    const savedGame = localStorage.getItem("hospitalSimGame")
    if (!savedGame) {
      router.push("/setup")
      return
    }
    try {
      const parsedGame = JSON.parse(savedGame) as GameState
      if (!parsedGame.staffMultipliers) {
        parsedGame.staffMultipliers = { patientGrowth: 1.0, revenue: 1.0 }
      }
      if (!parsedGame.departmentMultipliers) {
        parsedGame.departmentMultipliers = {
          emergency: { patientGrowth: 1.5, revenue: 3_000_000, stability: 0.8, specialty: 1.0 },
          generalClinic: { patientGrowth: 2.0, revenue: 800_000, stability: 0.9, specialty: 1.0 },
          inpatient: { patientGrowth: 1.2, revenue: 7_000_000, stability: 0.7, specialty: 1.0 },
        }
      }
      setGameState(parsedGame)
    } catch {
      router.push("/setup")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (gameState) localStorage.setItem("hospitalSimGame", JSON.stringify(gameState))
  }, [gameState])

  useEffect(() => {
    if (!gameState) return
    if (gameState.cash < -1_000_000_000 && gameState.loansTaken >= 4) {
      setGameOver(true)
      setGameOverReason("Kas defisit melebihi Rp 1 M dan tidak dapat mengambil pinjaman lagi")
      return
    }
    const recentMonths = gameState.financialHistory.slice(-3)
    if (recentMonths.length >= 3 && recentMonths.every((m) => m.profit < 0) && gameState.cash < 0) {
      setGameOver(true)
      setGameOverReason("Rumah sakit defisit 3 bulan berturut-turut dan tidak dapat membayar biaya operasional")
      return
    }
    if (gameState.currentMonth > 36) {
      setGameOver(true)
      setGameOverReason("Simulasi 3 tahun telah selesai!")
      return
    }
  }, [gameState])

  const handleAdvanceClick = () => {
    setShowEventModal(true)
  }

  const handleEventChoice = (effect: MonthlyEventEffect, choiceLabel: string) => {
    setShowEventModal(false)
    if (effect.fixedCostDelta) setExtraFixedCost((prev) => prev + effect.fixedCostDelta!)
    if (effect.variableCostDelta) setExtraVCPerPatient((prev) => prev + effect.variableCostDelta!)
    if (effect.cashDelta && gameState) {
      setGameState((prev) => prev ? { ...prev, cash: prev.cash + effect.cashDelta! } : prev)
    }
    if (effect.satisfactionDelta && gameState) {
      setGameState((prev) =>
        prev ? { ...prev, patientSatisfaction: Math.min(100, Math.max(0, prev.patientSatisfaction + effect.satisfactionDelta!)) } : prev
      )
    }
    toast({ title: `Keputusan: ${choiceLabel}`, description: "Dampak tercermin di laporan bulan ini." })
    setPendingEffect(effect)
    advanceMonth(effect)
    setShowReportChoice(true)
  }

  const handleEventSkip = () => {
    setShowEventModal(false)
    setPendingEffect({})
    advanceMonth({})
    setShowReportChoice(true)
  }

  // Difficulty scaling
  const getDifficultyMultipliers = (diff: string) => ({
    patientGrowth: diff === "easy" ? 1.2 : diff === "hard" ? 0.85 : 1.0,
    costMultiplier: diff === "easy" ? 0.8 : diff === "hard" ? 1.3 : 1.0,
    eventImpact: diff === "easy" ? 0.6 : diff === "hard" ? 1.5 : 1.0,
    randomVariance: diff === "easy" ? 0.05 : diff === "hard" ? 0.25 : 0.15,
  })

  const advanceMonth = (eventEffect: MonthlyEventEffect = {}) => {
    if (!gameState) return

    const diff = getDifficultyMultipliers(gameState.difficulty)

    const calculatePatients = (department, deptKey, isUnlocked = false) => {
      const capacity = department.capacity
      const staffRatio = Math.min(1, department.staff / Math.max(1, department.requiredStaff))
      const deptMultiplier = gameState.departmentMultipliers?.[deptKey] || {
        patientGrowth: 1.0, revenue: isUnlocked ? 5_000_000 : 1_000_000, stability: 0.8, specialty: isUnlocked ? 1.2 : 1.0,
      }
      const staffMult = gameState.staffMultipliers?.patientGrowth || 1.0
      const satisfactionMult = Math.pow(1.02, gameState.patientSatisfaction / 10)
      const stabilityFactor = deptMultiplier.stability || 0.8
      const variance = diff.randomVariance
      const randomFactor = stabilityFactor + (Math.random() * 2 - 1) * variance
      const monthBonus = 1 + (gameState.currentMonth / 36) * 0.4
      return Math.max(0, Math.floor(
        capacity * staffRatio * randomFactor * satisfactionMult * staffMult *
        deptMultiplier.patientGrowth * monthBonus * diff.patientGrowth *
        (deptMultiplier.specialty || 1.0)
      ))
    }

    const emergencyP = calculatePatients(gameState.departments.emergency, "emergency")
    const clinicP = calculatePatients(gameState.departments.generalClinic, "generalClinic")
    const inpatientP = calculatePatients(gameState.departments.inpatient, "inpatient")

    const specializedPatients: Record<string, number> = {}
    let totalSpecializedP = 0
    if (gameState.unlockedDepartments) {
      Object.entries(gameState.unlockedDepartments).forEach(([key, dept]) => {
        const p = calculatePatients(dept, key, true)
        specializedPatients[key] = p
        totalSpecializedP += p
      })
    }
    const totalPatients = emergencyP + clinicP + inpatientP + totalSpecializedP

    const staffRevMult = gameState.staffMultipliers?.revenue || 1.0
    const satRevBonus = 1 + (gameState.patientSatisfaction - 70) / 100

    const revFor = (patients, key, fallback) =>
      patients * (gameState.departmentMultipliers?.[key]?.revenue || fallback) * staffRevMult * satRevBonus

    const totalRevenue =
      revFor(emergencyP, "emergency", 3_000_000) +
      revFor(clinicP, "generalClinic", 800_000) +
      revFor(inpatientP, "inpatient", 7_000_000) +
      Object.entries(specializedPatients).reduce((sum, [key, p]) => {
        const rev = gameState.departmentMultipliers?.[key]?.revenue ||
          (key === "cardiology" ? 12_000_000 : key === "surgery" ? 15_000_000 : key === "pediatrics" ? 5_000_000 : 4_000_000)
        return sum + p * rev * staffRevMult * satRevBonus * (gameState.departmentMultipliers?.[key]?.specialty || 1.0)
      }, 0)

    // Fixed costs — scaled by difficulty
    const rentCost = Math.round(150_000_000 * diff.costMultiplier)
    const equipMaint = Math.round(80_000_000 * diff.costMultiplier)
    const baseSalaries =
      gameState.staff.doctors * 8_000_000 +
      gameState.staff.nurses * 3_000_000 +
      gameState.staff.administration * 2_000_000 +
      gameState.staff.support * 1_500_000
    const eventFCDelta = Math.round((eventEffect.fixedCostDelta || 0) * diff.eventImpact)
    const fixedCosts = rentCost + equipMaint + baseSalaries + extraFixedCost + eventFCDelta

    // Variable costs — scaled by difficulty
    const suppliesPP = Math.round(200_000 * diff.costMultiplier)
    const medicinePP = Math.round(300_000 * diff.costMultiplier)
    const eventVCDelta = Math.round((eventEffect.variableCostDelta || 0) * diff.eventImpact)
    const totalVCPP = suppliesPP + medicinePP + extraVCPerPatient + eventVCDelta
    const totalCapacity = Object.values(gameState.departments).reduce((s, d) => s + d.capacity, 0) +
      Object.values(gameState.unlockedDepartments || {}).reduce((s, d) => s + d.capacity, 0)
    const overtimeCost = totalPatients > totalCapacity * 0.8 ? Math.round(50_000_000 * diff.costMultiplier) : 0
    const variableCosts = totalPatients * totalVCPP + overtimeCost

    const totalCosts = fixedCosts + variableCosts
    const profit = totalRevenue - totalCosts

    const loanPayments = gameState.loans.reduce((t, l) => l.remainingMonths > 0 ? t + l.monthlyPayment : t, 0)
    const newCash = gameState.cash + profit - loanPayments
    const updatedLoans = gameState.loans.map((l) => l.remainingMonths > 0 ? { ...l, remainingMonths: l.remainingMonths - 1 } : l)

    // Marginal cost
    const prevMonth = gameState.financialHistory[gameState.financialHistory.length - 1]
    const marginalCost = prevMonth && prevMonth.patients !== totalPatients
      ? Math.abs((totalCosts - prevMonth.totalCosts) / Math.max(1, Math.abs(totalPatients - prevMonth.patients)))
      : 0

    // Satisfaction — more nuanced with difficulty penalty
    const staffRatioScore = calculateStaffRatio(gameState)
    const facilityQScore = calculateFacilityQuality(gameState)
    const waitTimeScore = calculateWaitingTime(gameState, totalPatients)
    const baseSat = Math.round(
      staffRatioScore * gameState.satisfactionFactors.staffRatio +
      facilityQScore * gameState.satisfactionFactors.facilityQuality +
      waitTimeScore * gameState.satisfactionFactors.waitingTime
    )
    // Hard mode: satisfaction decays faster when not optimal
    const satPenalty = gameState.difficulty === "hard" && baseSat < 80 ? -3 : gameState.difficulty === "easy" && baseSat < 80 ? 1 : 0
    const newSatisfaction = Math.min(100, Math.max(0, baseSat + satPenalty))

    // Event cash delta (apply to profit calc already done above, but direct to cash)
    const eventCashDelta = Math.round((eventEffect.cashDelta || 0) * diff.eventImpact)

    setGameState({
      ...gameState,
      currentMonth: gameState.currentMonth + 1,
      cash: newCash + (eventEffect.cashDelta ? eventCashDelta - (eventEffect.cashDelta || 0) : 0),
      loans: updatedLoans,
      financialHistory: [
        ...gameState.financialHistory,
        {
          month: gameState.currentMonth,
          revenue: totalRevenue,
          fixedCosts,
          variableCosts,
          totalCosts,
          profit,
          patients: totalPatients,
          cash: newCash,
          marginalCost,
          averageTotalCost: totalPatients > 0 ? totalCosts / totalPatients : 0,
          averageVariableCost: totalPatients > 0 ? variableCosts / totalPatients : 0,
          patientSatisfaction: newSatisfaction,
        },
      ],
      patientSatisfaction: newSatisfaction,
      patientStats: {
        emergency: emergencyP,
        generalClinic: clinicP,
        inpatient: inpatientP,
        ...specializedPatients,
        total: totalPatients,
      },
    })
  }

  function calculateStaffRatio(gs: GameState) {
    let totalS = 0, totalR = 0
    Object.values(gs.departments).forEach((d) => { totalS += d.staff; totalR += d.requiredStaff })
    if (gs.unlockedDepartments) Object.values(gs.unlockedDepartments).forEach((d) => { totalS += d.staff; totalR += d.requiredStaff })
    return Math.min(100, Math.round((totalS / Math.max(1, totalR)) * 100))
  }

  function calculateFacilityQuality(gs: GameState) {
    let totalL = 0, maxL = 0
    Object.values(gs.departments).forEach((d) => { totalL += d.level; maxL += 3 })
    if (gs.unlockedDepartments) Object.values(gs.unlockedDepartments).forEach((d) => { totalL += d.level; maxL += 3 })
    const bonus = Object.keys(gs.unlockedDepartments || {}).length * 5
    return Math.min(100, Math.round((totalL / Math.max(1, maxL)) * 100) + bonus)
  }

  function calculateWaitingTime(gs: GameState, totalPatients: number) {
    let totalCap = 0
    Object.values(gs.departments).forEach((d) => { totalCap += d.capacity })
    if (gs.unlockedDepartments) Object.values(gs.unlockedDepartments).forEach((d) => { totalCap += d.capacity })
    return Math.max(0, Math.min(100, Math.round((1 - Math.min(1, totalPatients / Math.max(1, totalCap))) * 100)))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-lg font-medium text-emerald-700">Memuat data permainan...</p>
        </div>
      </div>
    )
  }

  if (gameOver) return <GameOver gameState={gameState!} reason={gameOverReason} />

  const diffBadge =
    gameState?.difficulty === "easy" ? "Mudah" :
    gameState?.difficulty === "hard" ? "Sulit" : "Sedang"

  return (
    <div className="min-h-screen bg-gray-50">
      {gameState && (
        <>
          {/* ── HEADER ── */}
          <div className="sticky top-0 z-40 border-b bg-white shadow-sm">
            <div className="mx-auto max-w-5xl px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                {/* Identitas */}
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold text-emerald-700 sm:text-base">
                    {gameState.hospitalName}
                  </h1>
                  <p className="text-xs text-gray-400">
                    {gameState.managerName} · <span className="font-semibold text-emerald-600">Bln {gameState.currentMonth}/36</span>
                    {" "}· {diffBadge}
                  </p>
                </div>

                {/* Kas + Help + Advance */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <HelpButton context={activeTab as any} />
                  <div className={`rounded-lg border px-2.5 py-1 text-right ${
                    gameState.cash < 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
                  }`}>
                    <p className="text-[10px] font-medium text-gray-400">Kas</p>
                    <p className={`text-xs font-bold sm:text-sm ${gameState.cash < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {formatCurrency(gameState.cash)}
                    </p>
                  </div>
                  <Button
                    onClick={handleAdvanceClick}
                    size="sm"
                    className="bg-emerald-600 text-xs hover:bg-emerald-700 sm:text-sm"
                  >
                    <span className="hidden sm:inline">Lanjut Bulan →</span>
                    <span className="sm:hidden">Lanjut →</span>
                  </Button>
                </div>
              </div>

              {/* Tab nav */}
              <div className="-mb-px mt-2 flex gap-0.5 overflow-x-auto">
                {TAB_META.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-t-md border-b-2 px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                      activeTab === key
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── KONTEN TAB ── */}
          <div className="mx-auto max-w-5xl px-3 py-4">
            {activeTab === "dashboard" && <Dashboard gameState={gameState} setGameState={setGameState} />}
            {activeTab === "departments" && <Departments gameState={gameState} setGameState={setGameState} />}
            {activeTab === "staff" && <Staff gameState={gameState} setGameState={setGameState} />}
            {activeTab === "finances" && <Finances gameState={gameState} setGameState={setGameState} />}
          </div>

          {/* ── MODAL EVENT ── */}
          {showEventModal && (
            <MonthlyEvent
              gameState={gameState}
              month={gameState.currentMonth}
              onChoice={handleEventChoice}
              onSkip={handleEventSkip}
            />
          )}

          {/* ── PILIHAN: LIHAT LAPORAN? ── */}
          {showReportChoice && !showSummaryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
                <h2 className="mb-1 text-lg font-bold text-gray-800">Bulan {gameState.currentMonth - 1} Selesai!</h2>
                <p className="mb-5 text-sm text-gray-500">Apakah Anda ingin melihat laporan keuangan bulanan?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowReportChoice(false) }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <SkipForward className="h-4 w-4" /> Lewati
                  </button>
                  <button
                    onClick={() => { setShowReportChoice(false); setShowSummaryModal(true) }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                  >
                    <FileText className="h-4 w-4" /> Lihat Laporan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL RINGKASAN ── */}
          {showSummaryModal && (
            <MonthlySummaryModal
              gameState={gameState}
              onContinue={() => setShowSummaryModal(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
