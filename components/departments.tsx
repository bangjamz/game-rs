"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import { AlertCircle, ArrowUp, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import HelpButton from "@/components/help-button"

interface DepartmentsProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
}

export default function Departments({ gameState, setGameState }: DepartmentsProps) {
  const { toast } = useToast()
  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active")

  const upgradeCosts = {
    emergency: [null, 1_500_000_000, 3_000_000_000, 6_000_000_000],
    generalClinic: [null, 1_000_000_000, 2_000_000_000, 4_000_000_000],
    inpatient: [null, 2_000_000_000, 4_000_000_000, 8_000_000_000],
    cardiology: [null, 2_500_000_000, 5_000_000_000, 10_000_000_000],
    pediatrics: [null, 1_500_000_000, 3_000_000_000, 6_000_000_000],
    surgery: [null, 3_000_000_000, 6_000_000_000, 12_000_000_000],
    laboratory: [null, 1_000_000_000, 2_000_000_000, 4_000_000_000],
  }

  const departmentNames = {
    emergency: "IGD",
    generalClinic: "Poli Umum",
    inpatient: "Rawat Inap",
    cardiology: "Kardiologi",
    pediatrics: "Pediatri",
    surgery: "Bedah",
    laboratory: "Laboratorium",
  }

  // Department characteristics
  const departmentCharacteristics = {
    emergency: {
      patientGrowthRate: 1.5, // Moderate patient growth
      revenuePerPatient: 3_000_000, // High revenue per patient
      growthStability: 0.8, // Moderate stability
    },
    generalClinic: {
      patientGrowthRate: 2.0, // High patient growth
      revenuePerPatient: 800_000, // Low revenue per patient
      growthStability: 0.9, // High stability
    },
    inpatient: {
      patientGrowthRate: 1.2, // Low patient growth
      revenuePerPatient: 7_000_000, // Very high revenue per patient
      growthStability: 0.7, // Low stability
    },
    cardiology: {
      patientGrowthRate: 1.0, // Very low patient growth
      revenuePerPatient: 12_000_000, // Extremely high revenue per patient
      growthStability: 0.6, // Very low stability
      specialtyBonus: 1.5, // High specialty bonus
    },
    pediatrics: {
      patientGrowthRate: 1.8, // High patient growth
      revenuePerPatient: 5_000_000, // Moderate revenue per patient
      growthStability: 0.85, // Moderate-high stability
      specialtyBonus: 1.2, // Moderate specialty bonus
    },
    surgery: {
      patientGrowthRate: 0.8, // Very low patient growth
      revenuePerPatient: 15_000_000, // Extremely high revenue per patient
      growthStability: 0.5, // Very low stability
      specialtyBonus: 1.8, // Very high specialty bonus
    },
    laboratory: {
      patientGrowthRate: 2.2, // Very high patient growth
      revenuePerPatient: 4_000_000, // Moderate revenue per patient
      growthStability: 0.95, // Very high stability
      specialtyBonus: 1.1, // Low specialty bonus
    },
  }

  const upgradeBenefits = {
    emergency: [
      null,
      { capacity: 20, requiredStaff: 10 },
      { capacity: 40, requiredStaff: 20 },
      { capacity: 80, requiredStaff: 35 },
    ],
    generalClinic: [
      null,
      { capacity: 15, requiredStaff: 8 },
      { capacity: 30, requiredStaff: 15 },
      { capacity: 60, requiredStaff: 25 },
    ],
    inpatient: [
      null,
      { capacity: 10, requiredStaff: 5 },
      { capacity: 25, requiredStaff: 12 },
      { capacity: 50, requiredStaff: 25 },
    ],
    cardiology: [
      null,
      { capacity: 15, requiredStaff: 15 },
      { capacity: 30, requiredStaff: 25 },
      { capacity: 50, requiredStaff: 40 },
    ],
    pediatrics: [
      null,
      { capacity: 20, requiredStaff: 12 },
      { capacity: 35, requiredStaff: 20 },
      { capacity: 60, requiredStaff: 30 },
    ],
    surgery: [
      null,
      { capacity: 10, requiredStaff: 20 },
      { capacity: 20, requiredStaff: 35 },
      { capacity: 35, requiredStaff: 50 },
    ],
    laboratory: [
      null,
      { capacity: 30, requiredStaff: 8 },
      { capacity: 50, requiredStaff: 15 },
      { capacity: 80, requiredStaff: 25 },
    ],
  }

  const handleUpgrade = (department: string) => {
    const isDeptInMainDepts = department in gameState.departments
    const isDeptInUnlockedDepts = gameState.unlockedDepartments && department in gameState.unlockedDepartments

    if (!isDeptInMainDepts && !isDeptInUnlockedDepts) {
      toast({
        title: "Departemen tidak ditemukan",
        description: "Departemen ini tidak tersedia untuk diupgrade",
        variant: "destructive",
      })
      return
    }

    const currentLevel = isDeptInMainDepts
      ? gameState.departments[department].level
      : gameState.unlockedDepartments[department].level

    if (currentLevel >= 3) {
      toast({
        title: "Tidak dapat upgrade",
        description: "Departemen ini sudah mencapai level maksimum",
        variant: "destructive",
      })
      return
    }

    const upgradeCost = upgradeCosts[department][currentLevel + 1]

    if (gameState.cash < upgradeCost) {
      toast({
        title: "Dana tidak mencukupi",
        description: `Anda membutuhkan ${formatCurrency(upgradeCost)} untuk upgrade departemen ini`,
        variant: "destructive",
      })
      return
    }

    // Update game state
    const newLevel = currentLevel + 1
    const newCapacity = upgradeBenefits[department][newLevel].capacity
    const newRequiredStaff = upgradeBenefits[department][newLevel].requiredStaff

    if (isDeptInMainDepts) {
      setGameState({
        ...gameState,
        cash: gameState.cash - upgradeCost,
        departments: {
          ...gameState.departments,
          [department]: {
            ...gameState.departments[department],
            level: newLevel,
            capacity: newCapacity,
            requiredStaff: newRequiredStaff,
          },
        },
      })
    } else {
      setGameState({
        ...gameState,
        cash: gameState.cash - upgradeCost,
        unlockedDepartments: {
          ...gameState.unlockedDepartments,
          [department]: {
            ...gameState.unlockedDepartments[department],
            level: newLevel,
            capacity: newCapacity,
            requiredStaff: newRequiredStaff,
          },
        },
      })
    }

    // Increase patient satisfaction due to facility improvement
    const newSatisfaction = Math.min(100, gameState.patientSatisfaction + 5)
    setGameState((prev) => ({
      ...prev!,
      patientSatisfaction: newSatisfaction,
    }))

    toast({
      title: "Upgrade berhasil",
      description: `${departmentNames[department]} telah diupgrade ke level ${newLevel}`,
      variant: "default",
    })
  }

  const handleUnlockDepartment = (department: string) => {
    if (!gameState.lockedDepartments || !(department in gameState.lockedDepartments)) {
      toast({
        title: "Departemen tidak ditemukan",
        description: "Departemen ini tidak tersedia untuk dibuka",
        variant: "destructive",
      })
      return
    }

    const deptInfo = gameState.lockedDepartments[department]

    if (gameState.cash < deptInfo.unlockCost) {
      toast({
        title: "Dana tidak mencukupi",
        description: `Anda membutuhkan ${formatCurrency(deptInfo.unlockCost)} untuk membuka departemen ini`,
        variant: "destructive",
      })
      return
    }

    // Move department from locked to unlocked
    const { [department]: deptToUnlock, ...remainingLockedDepts } = gameState.lockedDepartments

    // Update department multipliers
    const updatedDepartmentMultipliers = {
      ...gameState.departmentMultipliers,
      [department]: {
        patientGrowth: departmentCharacteristics[department].patientGrowthRate,
        revenue: departmentCharacteristics[department].revenuePerPatient,
        stability: departmentCharacteristics[department].growthStability,
        specialty: departmentCharacteristics[department].specialtyBonus || 1.0,
      },
    }

    setGameState({
      ...gameState,
      cash: gameState.cash - deptToUnlock.unlockCost,
      unlockedDepartments: {
        ...gameState.unlockedDepartments,
        [department]: {
          ...deptToUnlock,
          level: 1,
          capacity: upgradeBenefits[department][1].capacity,
          requiredStaff: upgradeBenefits[department][1].requiredStaff,
        },
      },
      lockedDepartments: remainingLockedDepts,
      departmentMultipliers: updatedDepartmentMultipliers,
    })

    // Increase patient satisfaction due to new department
    const newSatisfaction = Math.min(100, gameState.patientSatisfaction + 10)
    setGameState((prev) => ({
      ...prev!,
      patientSatisfaction: newSatisfaction,
    }))

    toast({
      title: "Departemen baru dibuka!",
      description: `${deptInfo.name} telah berhasil dibuka dan siap beroperasi`,
      variant: "default",
    })
  }

  const getStaffingStatus = (department: string, isUnlocked = false) => {
    const dept = isUnlocked ? gameState.unlockedDepartments[department] : gameState.departments[department]
    const ratio = dept.staff / dept.requiredStaff

    if (ratio >= 1) return { status: "Optimal", color: "text-green-600" }
    if (ratio >= 0.8) return { status: "Cukup", color: "text-yellow-600" }
    return { status: "Kurang", color: "text-red-600" }
  }

  const getDepartmentDescription = (deptKey: string) => {
    const characteristics = departmentCharacteristics[deptKey]

    let patientGrowthDesc = "Rendah"
    if (characteristics.patientGrowthRate >= 2.0) patientGrowthDesc = "Sangat Tinggi"
    else if (characteristics.patientGrowthRate >= 1.5) patientGrowthDesc = "Tinggi"
    else if (characteristics.patientGrowthRate >= 1.2) patientGrowthDesc = "Sedang"

    let revenueDesc = "Rendah"
    if (characteristics.revenuePerPatient >= 10_000_000) revenueDesc = "Sangat Tinggi"
    else if (characteristics.revenuePerPatient >= 5_000_000) revenueDesc = "Tinggi"
    else if (characteristics.revenuePerPatient >= 3_000_000) revenueDesc = "Sedang"

    let stabilityDesc = "Rendah"
    if (characteristics.growthStability >= 0.9) stabilityDesc = "Sangat Tinggi"
    else if (characteristics.growthStability >= 0.8) stabilityDesc = "Tinggi"
    else if (characteristics.growthStability >= 0.7) stabilityDesc = "Sedang"

    return `Pertumbuhan Pasien: ${patientGrowthDesc}, Pendapatan per Pasien: ${revenueDesc}, Stabilitas: ${stabilityDesc}`
  }

  return (
    <div className="p-1">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
        <div className="mb-3 flex items-center justify-between">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="active">Departemen Aktif</TabsTrigger>
            <TabsTrigger value="locked">
              Buka Baru
              {gameState.lockedDepartments && Object.keys(gameState.lockedDepartments).length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-xs text-amber-700">
                  {Object.keys(gameState.lockedDepartments).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <HelpButton context="departments" />
        </div>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Regular departments */}
            {Object.keys(gameState.departments).map((dept) => {
              const department = gameState.departments[dept]
              const staffStatus = getStaffingStatus(dept)
              const isExpanded = expandedDept === dept

              return (
                <Card key={dept} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{departmentNames[dept]}</CardTitle>
                        <CardDescription>Level {department.level}/3 · {department.capacity} pasien</CardDescription>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        department.staff >= department.requiredStaff ? "bg-green-100 text-green-700" :
                        department.staff >= department.requiredStaff * 0.8 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{staffStatus.status}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Kapasitas Pasien:</span>
                        <span>{department.capacity}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Staf:</span>
                          <span className={staffStatus.color}>
                            {department.staff} / {department.requiredStaff} ({staffStatus.status})
                          </span>
                        </div>
                        <Progress
                          value={(department.staff / department.requiredStaff) * 100}
                          className={
                            department.staff >= department.requiredStaff
                              ? "bg-green-100"
                              : department.staff >= department.requiredStaff * 0.8
                                ? "bg-yellow-100"
                                : "bg-red-100"
                          }
                        />
                      </div>

                      <div className="rounded-lg bg-blue-50 p-3 text-sm">
                        <p className="text-blue-800">{getDepartmentDescription(dept)}</p>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 rounded-lg bg-gray-50 p-4">
                          <h3 className="font-medium">Detail Departemen</h3>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Informasi Saat Ini</h4>
                              <ul className="space-y-1 text-sm">
                                <li className="flex justify-between">
                                  <span>Kapasitas:</span>
                                  <span>{department.capacity} pasien</span>
                                </li>
                                <li className="flex justify-between">
                                  <span>Staf yang Dibutuhkan:</span>
                                  <span>{department.requiredStaff} orang</span>
                                </li>
                                <li className="flex justify-between">
                                  <span>Staf Saat Ini:</span>
                                  <span className={staffStatus.color}>{department.staff} orang</span>
                                </li>
                                <li className="flex justify-between">
                                  <span>Pendapatan per Pasien:</span>
                                  <span>{formatCurrency(departmentCharacteristics[dept].revenuePerPatient)}</span>
                                </li>
                              </ul>
                            </div>

                            {department.level < 3 && (
                              <div>
                                <h4 className="mb-2 text-sm font-medium">
                                  Manfaat Upgrade ke Level {department.level + 1}
                                </h4>
                                <ul className="space-y-1 text-sm">
                                  <li className="flex justify-between">
                                    <span>Kapasitas Baru:</span>
                                    <span>{upgradeBenefits[dept][department.level + 1].capacity} pasien</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Staf yang Dibutuhkan:</span>
                                    <span>{upgradeBenefits[dept][department.level + 1].requiredStaff} orang</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Biaya Upgrade:</span>
                                    <span>{formatCurrency(upgradeCosts[dept][department.level + 1])}</span>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>

                          {department.staff < department.requiredStaff && (
                            <div className="mt-4 flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-sm">
                              <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
                              <div>
                                <p className="font-medium text-yellow-800">Peringatan Kekurangan Staf</p>
                                <p className="text-yellow-700">
                                  Departemen ini kekurangan staf. Efisiensi dan pendapatan akan berkurang. Tambahkan
                                  staf di tab Staf.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => setExpandedDept(isExpanded ? null : dept)}
                      className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      {isExpanded ? "Sembunyikan detail" : "Lihat detail & upgrade"}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {department.level < 3 && !isExpanded && (
                      <Button
                        size="sm"
                        onClick={() => handleUpgrade(dept)}
                        disabled={gameState.cash < upgradeCosts[dept][department.level + 1]}
                        className="w-full bg-emerald-600 text-xs hover:bg-emerald-700"
                      >
                        <ArrowUp className="mr-1 h-3.5 w-3.5" />
                        Upgrade ke Lv{department.level + 1} · {formatCurrency(upgradeCosts[dept][department.level + 1])}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}

            {/* Unlocked departments */}
            {gameState.unlockedDepartments &&
              Object.keys(gameState.unlockedDepartments).map((dept) => {
                const department = gameState.unlockedDepartments[dept]
                const staffStatus = getStaffingStatus(dept, true)
                const isExpanded = expandedDept === `unlocked-${dept}`

                return (
                  <Card key={`unlocked-${dept}`} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{department.name}</CardTitle>
                          <CardDescription>Spesialis · Lv{department.level}/3 · {department.capacity} pasien</CardDescription>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          department.staff >= department.requiredStaff ? "bg-green-100 text-green-700" :
                          department.staff >= department.requiredStaff * 0.8 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>{staffStatus.status}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Kapasitas Pasien:</span>
                          <span>{department.capacity}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Staf:</span>
                            <span className={staffStatus.color}>
                              {department.staff} / {department.requiredStaff} ({staffStatus.status})
                            </span>
                          </div>
                          <Progress
                            value={(department.staff / department.requiredStaff) * 100}
                            className={
                              department.staff >= department.requiredStaff
                                ? "bg-green-100"
                                : department.staff >= department.requiredStaff * 0.8
                                  ? "bg-yellow-100"
                                  : "bg-red-100"
                            }
                          />
                        </div>

                        <div className="rounded-lg bg-blue-50 p-3 text-sm">
                          <p className="text-blue-800">{getDepartmentDescription(dept)}</p>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-4 rounded-lg bg-gray-50 p-4">
                            <h3 className="font-medium">Detail Departemen</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="mb-2 text-sm font-medium">Informasi Saat Ini</h4>
                                <ul className="space-y-1 text-sm">
                                  <li className="flex justify-between">
                                    <span>Kapasitas:</span>
                                    <span>{department.capacity} pasien</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Staf yang Dibutuhkan:</span>
                                    <span>{department.requiredStaff} orang</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Staf Saat Ini:</span>
                                    <span className={staffStatus.color}>{department.staff} orang</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Pendapatan per Pasien:</span>
                                    <span>{formatCurrency(departmentCharacteristics[dept].revenuePerPatient)}</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Bonus Spesialisasi:</span>
                                    <span>+{(((departmentCharacteristics[dept].specialtyBonus || 1.0) - 1) * 100).toFixed(0)}%</span>
                                  </li>
                                </ul>
                              </div>

                              {department.level < 3 && (
                                <div>
                                  <h4 className="mb-2 text-sm font-medium">
                                    Manfaat Upgrade ke Level {department.level + 1}
                                  </h4>
                                  <ul className="space-y-1 text-sm">
                                    <li className="flex justify-between">
                                      <span>Kapasitas Baru:</span>
                                      <span>{upgradeBenefits[dept][department.level + 1].capacity} pasien</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Staf yang Dibutuhkan:</span>
                                      <span>{upgradeBenefits[dept][department.level + 1].requiredStaff} orang</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Biaya Upgrade:</span>
                                      <span>{formatCurrency(upgradeCosts[dept][department.level + 1])}</span>
                                    </li>
                                  </ul>
                                </div>
                              )}
                            </div>

                            {department.staff < department.requiredStaff && (
                              <div className="mt-4 flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-sm">
                                <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
                                <div>
                                  <p className="font-medium text-yellow-800">Peringatan Kekurangan Staf</p>
                                  <p className="text-yellow-700">
                                    Departemen ini kekurangan staf. Efisiensi dan pendapatan akan berkurang. Tambahkan
                                    staf di tab Staf.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => setExpandedDept(isExpanded ? null : `unlocked-${dept}`)}
                        className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        {isExpanded ? "Sembunyikan detail" : "Lihat detail & upgrade"}
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      {department.level < 3 && !isExpanded && (
                        <Button
                          size="sm"
                          onClick={() => handleUpgrade(dept)}
                          disabled={gameState.cash < upgradeCosts[dept][department.level + 1]}
                          className="w-full bg-emerald-600 text-xs hover:bg-emerald-700"
                        >
                          <ArrowUp className="mr-1 h-3.5 w-3.5" />
                          Upgrade ke Lv{department.level + 1} · {formatCurrency(upgradeCosts[dept][department.level + 1])}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="locked" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {gameState.lockedDepartments &&
              Object.keys(gameState.lockedDepartments).map((dept) => {
                const department = gameState.lockedDepartments[dept]

                return (
                  <Card key={`locked-${dept}`} className="border-dashed border-gray-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-gray-400" />
                        {department.name}
                      </CardTitle>
                      <CardDescription>{department.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Biaya Pembukaan:</span>
                          <span className="font-bold">{formatCurrency(department.unlockCost)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Staf yang Dibutuhkan:</span>
                          <span>{department.requiredStaff} orang</span>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                          <p>{getDepartmentDescription(dept)}</p>
                          <p className="mt-2">
                            Departemen spesialis ini akan meningkatkan pendapatan rumah sakit dan kepuasan pasien.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => handleUnlockDepartment(dept)}
                        disabled={gameState.cash < department.unlockCost}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Unlock className="mr-1 h-4 w-4" />
                        Buka Departemen
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
