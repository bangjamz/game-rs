"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import Dashboard from "@/components/dashboard"
import Departments from "@/components/departments"
import Staff from "@/components/staff"
import Finances from "@/components/finances"
import GameOver from "@/components/game-over"
import MonthlyEvent, { type MonthlyEventEffect } from "@/components/monthly-event"
import MonthlySummaryModal from "@/components/monthly-summary-modal"
import type { GameState } from "@/lib/types"

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
  // Cost modifiers from events (accumulate over game)
  const [extraFixedCost, setExtraFixedCost] = useState(0)
  const [extraVCPerPatient, setExtraVCPerPatient] = useState(0)

  useEffect(() => {
    // Load game state from localStorage
    const savedGame = localStorage.getItem("hospitalSimGame")
    if (!savedGame) {
      router.push("/setup")
      return
    }

    try {
      const parsedGame = JSON.parse(savedGame) as GameState

      // Initialize staff and department multipliers if they don't exist
      if (!parsedGame.staffMultipliers) {
        parsedGame.staffMultipliers = {
          patientGrowth: 1.0,
          revenue: 1.0,
        }
      }

      if (!parsedGame.departmentMultipliers) {
        parsedGame.departmentMultipliers = {
          emergency: {
            patientGrowth: 1.5,
            revenue: 3_000_000,
            stability: 0.8,
            specialty: 1.0,
          },
          generalClinic: {
            patientGrowth: 2.0,
            revenue: 800_000,
            stability: 0.9,
            specialty: 1.0,
          },
          inpatient: {
            patientGrowth: 1.2,
            revenue: 7_000_000,
            stability: 0.7,
            specialty: 1.0,
          },
        }
      }

      setGameState(parsedGame)
    } catch (error) {
      console.error("Error parsing game state:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data permainan",
        variant: "destructive",
      })
      router.push("/setup")
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem("hospitalSimGame", JSON.stringify(gameState))
    }
  }, [gameState])

  // Check for game over conditions
  useEffect(() => {
    if (!gameState) return

    // Game over if cash deficit > 1 billion and no more loans available
    if (gameState.cash < -1_000_000_000 && gameState.loansTaken >= 4) {
      setGameOver(true)
      setGameOverReason("Kas defisit melebihi 1 milyar dan tidak dapat mengambil pinjaman lagi")
      return
    }

    // Game over if 3 consecutive months of deficit and can't pay operational costs
    const recentMonths = gameState.financialHistory.slice(-3)
    if (recentMonths.length >= 3 && recentMonths.every((month) => month.profit < 0) && gameState.cash < 0) {
      setGameOver(true)
      setGameOverReason(
        "Rumah sakit mengalami defisit 3 bulan berturut-turut dan tidak dapat membayar biaya operasional",
      )
      return
    }

    // Check if game is completed (36 months)
    if (gameState.currentMonth > 36) {
      setGameOver(true)
      setGameOverReason("Simulasi 3 tahun telah selesai!")
      return
    }
  }, [gameState])

  // Called when player clicks "Lanjut ke Bulan Berikutnya" — show event first
  const handleAdvanceClick = () => {
    setShowEventModal(true)
  }

  // Called when player makes a choice in the event modal
  const handleEventChoice = (effect: MonthlyEventEffect, choiceLabel: string) => {
    setShowEventModal(false)
    // Apply event effects to accumulators
    if (effect.fixedCostDelta) setExtraFixedCost((prev) => prev + effect.fixedCostDelta!)
    if (effect.variableCostDelta) setExtraVCPerPatient((prev) => prev + effect.variableCostDelta!)
    if (effect.cashDelta && gameState) {
      setGameState((prev) => prev ? { ...prev, cash: prev.cash + effect.cashDelta! } : prev)
    }
    if (effect.satisfactionDelta && gameState) {
      setGameState((prev) =>
        prev
          ? { ...prev, patientSatisfaction: Math.min(100, Math.max(0, prev.patientSatisfaction + effect.satisfactionDelta!)) }
          : prev
      )
    }
    // Show a small toast about the decision
    toast({
      title: `Keputusan diterapkan: ${choiceLabel}`,
      description: "Dampak akan tercermin di laporan bulan ini.",
      variant: "default",
    })
    // Now run the month calculation
    advanceMonth(effect)
  }

  // Called when player skips the event
  const handleEventSkip = () => {
    setShowEventModal(false)
    advanceMonth({})
  }

  const advanceMonth = (eventEffect: MonthlyEventEffect = {}) => {
    if (!gameState) return

    // Calculate new patients based on capacity, staff, and department characteristics
    const calculatePatients = (department, deptKey, isUnlocked = false) => {
      const capacity = department.capacity
      const staffRatio = department.staff / department.requiredStaff
      const staffEfficiency = Math.min(1, staffRatio)

      // Get department characteristics
      const deptMultiplier = gameState.departmentMultipliers[deptKey] || {
        patientGrowth: 1.0,
        revenue: isUnlocked ? 5_000_000 : 1_000_000,
        stability: 0.8,
        specialty: isUnlocked ? 1.2 : 1.0,
      }

      // Staff multiplier effect
      const staffMultiplier = gameState.staffMultipliers?.patientGrowth || 1.0

      // Patient satisfaction factor (higher satisfaction = more patients)
      // Exponential growth based on satisfaction
      const satisfactionMultiplier = Math.pow(1.03, gameState.patientSatisfaction / 10)

      // Random factor based on difficulty and department stability
      const stabilityFactor = deptMultiplier.stability || 0.8
      const randomVariance = 1 - stabilityFactor

      const randomFactor = (() => {
        const baseRandom = stabilityFactor + Math.random() * randomVariance * 2

        switch (gameState.difficulty) {
          case "easy":
            return baseRandom * 1.1 // 10% bonus in easy mode
          case "medium":
            return baseRandom
          case "hard":
            return baseRandom * 0.9 // 10% penalty in hard mode
          default:
            return baseRandom
        }
      })()

      // Month progression bonus - more patients as game progresses
      const monthProgressionBonus = 1 + (gameState.currentMonth / 36) * 0.5

      // Specialty bonus for specialized departments
      const specialtyBonus = deptMultiplier.specialty || 1.0

      return Math.floor(
        capacity *
          staffEfficiency *
          randomFactor *
          satisfactionMultiplier *
          staffMultiplier *
          deptMultiplier.patientGrowth *
          monthProgressionBonus *
          specialtyBonus,
      )
    }

    const emergencyPatients = calculatePatients(gameState.departments.emergency, "emergency")
    const clinicPatients = calculatePatients(gameState.departments.generalClinic, "generalClinic")
    const inpatientPatients = calculatePatients(gameState.departments.inpatient, "inpatient")

    // Calculate patients for unlocked specialized departments
    const specializedPatients = {}
    let totalSpecializedPatients = 0

    if (gameState.unlockedDepartments) {
      Object.entries(gameState.unlockedDepartments).forEach(([key, dept]) => {
        const patients = calculatePatients(dept, key, true)
        specializedPatients[key] = patients
        totalSpecializedPatients += patients
      })
    }

    const totalPatients = emergencyPatients + clinicPatients + inpatientPatients + totalSpecializedPatients

    // Calculate revenue with staff and satisfaction bonus
    const staffRevenueMultiplier = gameState.staffMultipliers?.revenue || 1.0
    const satisfactionRevenueBonus = 1 + (gameState.patientSatisfaction - 70) / 100

    // Calculate revenue for each department based on their characteristics
    const emergencyRevenue =
      emergencyPatients *
      (gameState.departmentMultipliers?.emergency?.revenue || 3_000_000) *
      staffRevenueMultiplier *
      satisfactionRevenueBonus

    const clinicRevenue =
      clinicPatients *
      (gameState.departmentMultipliers?.generalClinic?.revenue || 800_000) *
      staffRevenueMultiplier *
      satisfactionRevenueBonus

    const inpatientRevenue =
      inpatientPatients *
      (gameState.departmentMultipliers?.inpatient?.revenue || 7_000_000) *
      staffRevenueMultiplier *
      satisfactionRevenueBonus

    // Add revenue from specialized departments
    let specializedRevenue = 0
    if (gameState.unlockedDepartments) {
      Object.entries(gameState.unlockedDepartments).forEach(([key, dept]) => {
        const deptMultiplier = gameState.departmentMultipliers?.[key] || {
          revenue:
            key === "cardiology"
              ? 12_000_000
              : key === "pediatrics"
                ? 5_000_000
                : key === "surgery"
                  ? 15_000_000
                  : key === "laboratory"
                    ? 4_000_000
                    : 5_000_000,
        }

        specializedRevenue +=
          (specializedPatients[key] || 0) *
          deptMultiplier.revenue *
          staffRevenueMultiplier *
          satisfactionRevenueBonus *
          (deptMultiplier.specialty || 1.0)
      })
    }

    const totalRevenue = emergencyRevenue + clinicRevenue + inpatientRevenue + specializedRevenue

    // Calculate fixed costs (including event-driven extra)
    const rentCost = 150_000_000
    const equipmentMaintenance = 80_000_000
    const baseSalaries =
      gameState.staff.doctors * 8_000_000 +
      gameState.staff.nurses * 3_000_000 +
      gameState.staff.administration * 2_000_000 +
      gameState.staff.support * 1_500_000
    // Apply accumulated event-driven FC modifier + this month's event
    const eventFixedDelta = eventEffect.fixedCostDelta || 0
    const fixedCosts = rentCost + equipmentMaintenance + baseSalaries + extraFixedCost + eventFixedDelta

    // Calculate variable costs (including event-driven extra VC per patient)
    const suppliesPerPatient = 200_000
    const medicinePerPatient = 300_000
    const eventVCDelta = eventEffect.variableCostDelta || 0
    const totalVCPerPatient = suppliesPerPatient + medicinePerPatient + extraVCPerPatient + eventVCDelta
    const overtimeIfNeeded =
      totalPatients >
      (gameState.departments.emergency.capacity +
        gameState.departments.generalClinic.capacity +
        gameState.departments.inpatient.capacity +
        Object.values(gameState.unlockedDepartments || {}).reduce((sum, dept) => sum + dept.capacity, 0)) *
        0.8
        ? 50_000_000
        : 0
    const variableCosts = totalPatients * totalVCPerPatient + overtimeIfNeeded

    // Calculate total costs
    const totalCosts = fixedCosts + variableCosts

    // Calculate profit
    const profit = totalRevenue - totalCosts

    // Calculate loan payments
    const loanPayments = gameState.loans.reduce((total, loan) => {
      if (loan.remainingMonths > 0) {
        return total + loan.monthlyPayment
      }
      return total
    }, 0)

    // Update cash
    const newCash = gameState.cash + profit - loanPayments

    // Update loans
    const updatedLoans = gameState.loans.map((loan) => {
      if (loan.remainingMonths > 0) {
        return {
          ...loan,
          remainingMonths: loan.remainingMonths - 1,
        }
      }
      return loan
    })

    // Calculate marginal cost (cost of treating one more patient)
    const previousMonth = gameState.financialHistory[gameState.financialHistory.length - 1]
    const previousPatients = previousMonth.patients
    const previousTotalCosts = previousMonth.totalCosts
    const marginalCost =
      previousPatients === totalPatients
        ? 0
        : (totalCosts - previousTotalCosts) / Math.max(1, totalPatients - previousPatients)

    // Calculate patient satisfaction
    // Based on staff ratio, facility quality, and waiting time
    const staffRatio = calculateStaffRatio(gameState)
    const facilityQuality = calculateFacilityQuality(gameState)
    const waitingTime = calculateWaitingTime(gameState, totalPatients)

    // Calculate new satisfaction based on factors and their weights
    const newSatisfaction = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          staffRatio * gameState.satisfactionFactors.staffRatio +
            facilityQuality * gameState.satisfactionFactors.facilityQuality +
            waitingTime * gameState.satisfactionFactors.waitingTime,
        ),
      ),
    )

    // Update financial history
    const newFinancialHistory = [
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
    ]

    // Update game state
    setGameState({
      ...gameState,
      currentMonth: gameState.currentMonth + 1,
      cash: newCash,
      loans: updatedLoans,
      financialHistory: newFinancialHistory,
      patientSatisfaction: newSatisfaction,
      patientStats: {
        emergency: emergencyPatients,
        generalClinic: clinicPatients,
        inpatient: inpatientPatients,
        ...specializedPatients,
        total: totalPatients,
      },
    })

    // Show summary modal instead of toast
    setShowSummaryModal(true)
  }

  // Helper functions for satisfaction calculations
  function calculateStaffRatio(gameState) {
    let totalStaff = 0
    let totalRequiredStaff = 0

    // Count from main departments
    Object.values(gameState.departments).forEach((dept) => {
      totalStaff += dept.staff
      totalRequiredStaff += dept.requiredStaff
    })

    // Count from unlocked departments
    if (gameState.unlockedDepartments) {
      Object.values(gameState.unlockedDepartments).forEach((dept) => {
        totalStaff += dept.staff
        totalRequiredStaff += dept.requiredStaff
      })
    }

    return Math.min(100, Math.round((totalStaff / Math.max(1, totalRequiredStaff)) * 100))
  }

  function calculateFacilityQuality(gameState) {
    // Base quality from department levels
    let totalLevels = 0
    let maxPossibleLevels = 0

    // Count from main departments
    Object.values(gameState.departments).forEach((dept) => {
      totalLevels += dept.level
      maxPossibleLevels += 3 // Max level is 3
    })

    // Count from unlocked departments
    if (gameState.unlockedDepartments) {
      Object.values(gameState.unlockedDepartments).forEach((dept) => {
        totalLevels += dept.level
        maxPossibleLevels += 3
      })
    }

    // Bonus for having specialized departments
    const specializedDeptBonus = Object.keys(gameState.unlockedDepartments || {}).length * 5

    return Math.min(100, Math.round((totalLevels / Math.max(1, maxPossibleLevels)) * 100) + specializedDeptBonus)
  }

  function calculateWaitingTime(gameState, totalPatients) {
    let totalCapacity = 0

    // Count capacity from main departments
    Object.values(gameState.departments).forEach((dept) => {
      totalCapacity += dept.capacity
    })

    // Count capacity from unlocked departments
    if (gameState.unlockedDepartments) {
      Object.values(gameState.unlockedDepartments).forEach((dept) => {
        totalCapacity += dept.capacity
      })
    }

    // Higher score is better (less waiting time)
    const occupancyRatio = totalPatients / Math.max(1, totalCapacity)

    // If occupancy is low, waiting time is short (high score)
    // If occupancy is high, waiting time is long (low score)
    return Math.max(0, Math.min(100, Math.round((1 - Math.min(1, occupancyRatio)) * 100)))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Memuat data permainan...</p>
      </div>
    )
  }

  if (gameOver) {
    return <GameOver gameState={gameState!} reason={gameOverReason} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {gameState && (
        <>
          {/* ── HEADER (sticky, responsif) ── */}
          <div className="sticky top-0 z-40 border-b bg-white shadow-sm">
            <div className="mx-auto max-w-5xl px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                {/* Identitas RS */}
                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold text-emerald-700 sm:text-lg">
                    🏥 {gameState.hospitalName}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {gameState.managerName} &nbsp;·&nbsp;
                    <span className="font-semibold text-emerald-600">Bulan {gameState.currentMonth}/36</span>
                    &nbsp;·&nbsp;
                    Th {Math.ceil(gameState.currentMonth / 12)}
                  </p>
                </div>

                {/* Kas + Tombol Advance */}
                <div className="flex shrink-0 items-center gap-2">
                  <div className={`rounded-lg border px-3 py-1.5 text-right ${
                    gameState.cash < 0
                      ? "border-red-200 bg-red-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}>
                    <p className="text-xs font-medium text-gray-500">Kas</p>
                    <p className={`text-sm font-bold ${
                      gameState.cash < 0 ? "text-red-600" : "text-emerald-700"
                    }`}>
                      {formatCurrency(gameState.cash)}
                    </p>
                  </div>
                  <Button
                    onClick={handleAdvanceClick}
                    size="sm"
                    className="bg-emerald-600 text-xs hover:bg-emerald-700 sm:text-sm"
                  >
                    <span className="hidden sm:inline">Lanjut Bulan →</span>
                    <span className="sm:hidden">→ Bln</span>
                  </Button>
                </div>
              </div>

              {/* Tab navigasi — scroll horizontal di mobile */}
              <div className="-mb-px mt-3 flex gap-1 overflow-x-auto">
                {["dashboard", "departments", "staff", "finances"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 rounded-t-md border-b-2 px-3 py-1.5 text-xs font-medium capitalize transition-colors sm:text-sm ${
                      activeTab === tab
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "dashboard" ? "Dashboard" :
                     tab === "departments" ? "Departemen" :
                     tab === "staff" ? "Staf" : "Keuangan"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── KONTEN TAB ── */}
          <div className="mx-auto max-w-5xl px-4 py-4">
            {activeTab === "dashboard" && <Dashboard gameState={gameState} setGameState={setGameState} />}
            {activeTab === "departments" && <Departments gameState={gameState} setGameState={setGameState} />}
            {activeTab === "staff" && <Staff gameState={gameState} setGameState={setGameState} />}
            {activeTab === "finances" && <Finances gameState={gameState} setGameState={setGameState} />}
          </div>

          {/* ── MODAL EVENT BULANAN ── */}
          {showEventModal && (
            <MonthlyEvent
              gameState={gameState}
              month={gameState.currentMonth}
              onChoice={handleEventChoice}
              onSkip={handleEventSkip}
            />
          )}

          {/* ── MODAL RINGKASAN BULAN ── */}
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
