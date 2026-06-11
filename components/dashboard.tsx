"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import { AlertCircle, HeartPulse, TrendingDown, TrendingUp, Users, CheckCircle2, XCircle, BarChart3, Hash, Target, Lightbulb } from "lucide-react"
import HelpButton from "@/components/help-button"
import { Progress } from "@/components/ui/progress"

interface DashboardProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
}

export default function Dashboard({ gameState, setGameState }: DashboardProps) {
  const currentMonthData = gameState.financialHistory[gameState.financialHistory.length - 1]
  const previousMonthData =
    gameState.financialHistory.length > 1 ? gameState.financialHistory[gameState.financialHistory.length - 2] : null

  // Calculate trends
  const revenueTrend = previousMonthData
    ? ((currentMonthData.revenue - previousMonthData.revenue) / Math.max(1, previousMonthData.revenue)) * 100
    : 0

  const profitTrend =
    previousMonthData && previousMonthData.profit !== 0
      ? ((currentMonthData.profit - previousMonthData.profit) / Math.abs(previousMonthData.profit)) * 100
      : 0

  const patientsTrend =
    previousMonthData && previousMonthData.patients !== 0
      ? ((currentMonthData.patients - previousMonthData.patients) / previousMonthData.patients) * 100
      : 0

  // Check for understaffing
  const isUnderstaffed = Object.keys(gameState.departments).some(
    (dept) => gameState.departments[dept].staff < gameState.departments[dept].requiredStaff,
  )

  // Check for financial warnings
  const hasFinancialWarning = gameState.financialHistory.slice(-3).every((month) => month.profit < 0)

  return (
    <div className="space-y-4 p-1">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pendapatan Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{formatCurrency(currentMonthData.revenue)}</div>
              {previousMonthData && (
                <div className={`flex items-center ${revenueTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {revenueTrend >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span className="text-xs">{Math.abs(revenueTrend).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Profit Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${currentMonthData.profit < 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(currentMonthData.profit)}
              </div>
              {previousMonthData && (
                <div className={`flex items-center ${profitTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {profitTrend >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span className="text-xs">{Math.abs(profitTrend).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{currentMonthData.patients}</div>
              {previousMonthData && (
                <div className={`flex items-center ${patientsTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {patientsTrend >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span className="text-xs">{Math.abs(patientsTrend).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Kepuasan Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center">
                  <HeartPulse className="mr-1 h-4 w-4 text-pink-500" />
                  <span className="text-2xl font-bold">{gameState.patientSatisfaction}%</span>
                </div>
                {previousMonthData && previousMonthData.patientSatisfaction && (
                  <div
                    className={`flex items-center ${gameState.patientSatisfaction >= previousMonthData.patientSatisfaction ? "text-green-600" : "text-red-600"}`}
                  >
                    {gameState.patientSatisfaction >= previousMonthData.patientSatisfaction ? (
                      <TrendingUp className="mr-1 h-4 w-4" />
                    ) : (
                      <TrendingDown className="mr-1 h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {Math.abs(gameState.patientSatisfaction - (previousMonthData.patientSatisfaction || 0))}%
                    </span>
                  </div>
                )}
              </div>
              <Progress
                value={gameState.patientSatisfaction}
                className={
                  gameState.patientSatisfaction >= 80
                    ? "bg-green-100"
                    : gameState.patientSatisfaction >= 50
                      ? "bg-yellow-100"
                      : "bg-red-100"
                }
              />
              <div className="text-xs text-gray-500">
                {gameState.patientSatisfaction >= 80
                  ? "⭐ Sangat Baik — pasien tumbuh cepat"
                  : gameState.patientSatisfaction >= 60
                    ? "👍 Baik — pertumbuhan stabil"
                    : gameState.patientSatisfaction >= 40
                      ? "⚠️ Cukup — pertumbuhan melambat"
                      : "🔴 Rendah — pasien menurun!"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <div className="space-y-3">
        {isUnderstaffed && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Kekurangan Staf</AlertTitle>
            <AlertDescription>
              Beberapa departemen kekurangan staf. Ini dapat mengurangi efisiensi, pendapatan, dan kepuasan pasien.
            </AlertDescription>
          </Alert>
        )}

        {hasFinancialWarning && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Peringatan Keuangan</AlertTitle>
            <AlertDescription>
              Rumah sakit mengalami kerugian selama 3 bulan berturut-turut. Pertimbangkan untuk mengurangi biaya atau
              meningkatkan layanan.
            </AlertDescription>
          </Alert>
        )}

        {gameState.patientSatisfaction < 50 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Kepuasan Pasien Rendah</AlertTitle>
            <AlertDescription>
              Kepuasan pasien sangat rendah. Ini akan mengurangi jumlah pasien yang datang. Tingkatkan fasilitas dan
              tambahkan staf.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* AUTO ECONOMIC INSIGHT PANEL */}
      {currentMonthData.month > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-amber-500" /> Analisis Ekonomi Bulan {currentMonthData.month}
            </CardTitle>
            <CardDescription>Insight otomatis berdasarkan data keuangan bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* TR vs TC */}
              <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                currentMonthData.profit >= 0
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}>
                {currentMonthData.profit >= 0
                  ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                }
                <span>
                  <strong>TR vs TC:</strong>{" "}
                  TR ({formatCurrency(currentMonthData.revenue)}){" "}
                  {currentMonthData.profit >= 0 ? ">" : "<"}{" "}
                  TC ({formatCurrency(currentMonthData.totalCosts)}) —{" "}
                  {currentMonthData.profit >= 0 ? `Laba ${formatCurrency(currentMonthData.profit)}` : `Rugi ${formatCurrency(Math.abs(currentMonthData.profit))}`}
                </span>
              </div>

              {/* TC = FC + VC */}
              {currentMonthData.totalCosts > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>Struktur Biaya (TC = FC + VC):</strong>{" "}
                    FC {formatCurrency(currentMonthData.fixedCosts)} ({Math.round((currentMonthData.fixedCosts / currentMonthData.totalCosts) * 100)}%){" "}
                    + VC {formatCurrency(currentMonthData.variableCosts)} ({Math.round((currentMonthData.variableCosts / currentMonthData.totalCosts) * 100)}%)
                  </span>
                </div>
              )}

              {/* ATC/AVC per patient */}
              {currentMonthData.patients > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-800">
                  <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>Per Pasien:</strong>{" "}
                    ATC = {formatCurrency(currentMonthData.totalCosts / currentMonthData.patients)}/pasien,{" "}
                    AVC = {formatCurrency(currentMonthData.variableCosts / currentMonthData.patients)}/pasien
                    {currentMonthData.marginalCost ? `, MC = ${formatCurrency(currentMonthData.marginalCost)}` : ""}
                  </span>
                </div>
              )}

              {/* Break-even status */}
              {currentMonthData.patients > 0 && (() => {
                const rpm = currentMonthData.revenue / currentMonthData.patients
                const vpm = currentMonthData.variableCosts / currentMonthData.patients
                const cm = rpm - vpm
                if (cm <= 0) return null
                const bep = Math.ceil(currentMonthData.fixedCosts / cm)
                const above = currentMonthData.patients >= bep
                return (
                  <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    above ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-orange-200 bg-orange-50 text-orange-800"
                  }`}>
                    {above ? <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span>
                      <strong>Break-Even Point (BEP):</strong>{" "}
                      {bep} pasien/bln. Saat ini {currentMonthData.patients} pasien{" "}
                      ({above
                        ? `${currentMonthData.patients - bep} pasien di atas BEP — zona LABA`
                        : `${bep - currentMonthData.patients} pasien di bawah BEP — belum impas`
                      })
                    </span>
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Pasien</CardTitle>
          <CardDescription>Jumlah pasien di setiap departemen bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <Users className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                <h3 className="font-medium text-blue-800">IGD</h3>
                <p className="text-2xl font-bold text-blue-900">{gameState.patientStats?.emergency || 0}</p>
                <p className="text-sm text-blue-600">Kapasitas: {gameState.departments.emergency.capacity}</p>
              </div>

              <div className="rounded-lg bg-green-50 p-4 text-center">
                <Users className="mx-auto mb-2 h-6 w-6 text-green-600" />
                <h3 className="font-medium text-green-800">Poli Umum</h3>
                <p className="text-2xl font-bold text-green-900">{gameState.patientStats?.generalClinic || 0}</p>
                <p className="text-sm text-green-600">Kapasitas: {gameState.departments.generalClinic.capacity}</p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <Users className="mx-auto mb-2 h-6 w-6 text-purple-600" />
                <h3 className="font-medium text-purple-800">Rawat Inap</h3>
                <p className="text-2xl font-bold text-purple-900">{gameState.patientStats?.inpatient || 0}</p>
                <p className="text-sm text-purple-600">Kapasitas: {gameState.departments.inpatient.capacity}</p>
              </div>

              {/* Render unlocked departments */}
              {gameState.unlockedDepartments &&
                Object.keys(gameState.unlockedDepartments).map((dept) => {
                  const department = gameState.unlockedDepartments[dept]
                  const colorMap = {
                    cardiology: { bg: "bg-red-50", text: "text-red-600", dark: "text-red-800", darker: "text-red-900" },
                    pediatrics: {
                      bg: "bg-yellow-50",
                      text: "text-yellow-600",
                      dark: "text-yellow-800",
                      darker: "text-yellow-900",
                    },
                    surgery: {
                      bg: "bg-indigo-50",
                      text: "text-indigo-600",
                      dark: "text-indigo-800",
                      darker: "text-indigo-900",
                    },
                    laboratory: {
                      bg: "bg-cyan-50",
                      text: "text-cyan-600",
                      dark: "text-cyan-800",
                      darker: "text-cyan-900",
                    },
                  }
                  const colors = colorMap[dept] || {
                    bg: "bg-gray-50",
                    text: "text-gray-600",
                    dark: "text-gray-800",
                    darker: "text-gray-900",
                  }

                  return (
                    <div key={dept} className={`rounded-lg ${colors.bg} p-4 text-center`}>
                      <Users className={`mx-auto mb-2 h-6 w-6 ${colors.text}`} />
                      <h3 className={`font-medium ${colors.dark}`}>{department.name}</h3>
                      <p className={`text-2xl font-bold ${colors.darker}`}>{gameState.patientStats?.[dept] || 0}</p>
                      <p className={`text-sm ${colors.text}`}>Kapasitas: {department.capacity}</p>
                    </div>
                  )
                })}
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Pasien:</span>
                <span className="text-xl font-bold">{gameState.patientStats?.total || 0}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">Tingkat Okupansi:</span>
                <span className="font-medium">
                  {Math.round(
                    ((gameState.patientStats?.total || 0) /
                      (gameState.departments.emergency.capacity +
                        gameState.departments.generalClinic.capacity +
                        gameState.departments.inpatient.capacity +
                        Object.values(gameState.unlockedDepartments || {}).reduce(
                          (sum, dept) => sum + dept.capacity,
                          0,
                        ))) *
                      100,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Satisfaction Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Faktor Kepuasan Pasien</span>
            <HelpButton context="dashboard" />
          </CardTitle>
          <CardDescription>Kepuasan mempengaruhi pertumbuhan pasien bulan berikutnya (exponential multiplier)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rasio Staf:</span>
                <span className="font-medium">{calculateStaffRatio(gameState)}%</span>
              </div>
              <Progress value={calculateStaffRatio(gameState)} className="bg-blue-100" />
              <p className="text-xs text-gray-500">Bobot 50% — tambah staf ke departemen untuk naikan skor ini</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kualitas Fasilitas:</span>
                <span className="font-medium">{calculateFacilityQuality(gameState)}%</span>
              </div>
              <Progress value={calculateFacilityQuality(gameState)} className="bg-green-100" />
              <p className="text-xs text-gray-500">Bobot 30% — upgrade level & buka departemen spesialis</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Waktu Tunggu:</span>
                <span className="font-medium">{calculateWaitingTime(gameState)}%</span>
              </div>
              <Progress value={calculateWaitingTime(gameState)} className="bg-yellow-100" />
              <p className="text-xs text-gray-500">Bobot 20% — jaga ocupansi &lt; 80% kapasitas total</p>
            </div>

            <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <strong>Dampak kepuasan:</strong> kepuasan 80% → pasien tumbuh {(Math.pow(1.02, 80/10) * 100 - 100).toFixed(1)}% lebih cepat.
              Kepuasan 50% → hanya {(Math.pow(1.02, 50/10) * 100 - 100).toFixed(1)}% bonus. Jaga selalu di atas 70%.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions for satisfaction calculations
function calculateStaffRatio(gameState: GameState): number {
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

function calculateFacilityQuality(gameState: GameState): number {
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

function calculateWaitingTime(gameState: GameState): number {
  let totalCapacity = 0
  const totalPatients = gameState.patientStats?.total || 0

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
