"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import { MinusCircle, PlusCircle, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import HelpButton from "@/components/help-button"

interface StaffProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
}

export default function Staff({ gameState, setGameState }: StaffProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [staffToAssign, setStaffToAssign] = useState<number>(1)

  // Reduced salary and hiring costs
  const staffTypes = [
    {
      id: "doctors",
      name: "Dokter",
      description: "Tenaga medis utama",
      salary: 8_000_000,
      hiringCost: 20_000_000,
      icon: Users,
      patientMultiplier: 2.5, // Significant impact on patient growth
      revenueMultiplier: 2.0, // Significant impact on revenue
    },
    {
      id: "nurses",
      name: "Perawat",
      description: "Tenaga medis pendukung",
      salary: 3_000_000,
      hiringCost: 8_000_000,
      icon: Users,
      patientMultiplier: 1.5, // High impact on patient growth
      revenueMultiplier: 1.3, // Moderate impact on revenue
    },
    {
      id: "administration",
      name: "Administrasi",
      description: "Staf administrasi dan manajemen",
      salary: 2_000_000,
      hiringCost: 5_000_000,
      icon: Users,
      patientMultiplier: 1.1, // Small impact on patient growth
      revenueMultiplier: 1.2, // Small impact on revenue (efficiency)
    },
    {
      id: "support",
      name: "Pendukung",
      description: "Staf kebersihan, keamanan, dll",
      salary: 1_500_000,
      hiringCost: 3_000_000,
      icon: Users,
      patientMultiplier: 1.05, // Minimal impact on patient growth
      revenueMultiplier: 1.1, // Minimal impact on revenue
    },
  ]

  const handleHire = (staffType: string) => {
    const staffInfo = staffTypes.find((s) => s.id === staffType)

    if (!staffInfo) return

    if (gameState.cash < staffInfo.hiringCost) {
      toast({
        title: "Dana tidak mencukupi",
        description: `Anda membutuhkan ${formatCurrency(staffInfo.hiringCost)} untuk merekrut ${staffInfo.name}`,
        variant: "destructive",
      })
      return
    }

    // Update game state
    setGameState({
      ...gameState,
      cash: gameState.cash - staffInfo.hiringCost,
      staff: {
        ...gameState.staff,
        [staffType]: gameState.staff[staffType] + 1,
      },
      staffMultipliers: {
        ...gameState.staffMultipliers,
        patientGrowth: calculateStaffMultiplier("patientMultiplier", {
          ...gameState.staff,
          [staffType]: gameState.staff[staffType] + 1,
        }),
        revenue: calculateStaffMultiplier("revenueMultiplier", {
          ...gameState.staff,
          [staffType]: gameState.staff[staffType] + 1,
        }),
      },
    })

    toast({
      title: `${staffInfo.name} direkrut`,
      description: `${staffInfo.name} telah direkrut dan siap ditugaskan ke departemen`,
      variant: "default",
    })
  }

  const handleFire = (staffType: string) => {
    const staffInfo = staffTypes.find((s) => s.id === staffType)

    if (!staffInfo) return

    if (gameState.staff[staffType] <= 0) {
      toast({
        title: "Tidak dapat memberhentikan",
        description: `Tidak ada ${staffInfo.name} yang dapat diberhentikan`,
        variant: "destructive",
      })
      return
    }

    // Check if there are unassigned staff
    const assignedStaff = calculateTotalAssignedStaff()
    const totalStaff = Object.values(gameState.staff).reduce((sum, count) => sum + count, 0)
    const unassignedStaff = totalStaff - assignedStaff

    if (unassignedStaff < 1) {
      // Need to remove from a department
      toast({
        title: "Tidak dapat memberhentikan",
        description: `Semua ${staffInfo.name} sedang ditugaskan. Lepaskan penugasan terlebih dahulu.`,
        variant: "destructive",
      })
      return
    }

    // Update game state
    setGameState({
      ...gameState,
      staff: {
        ...gameState.staff,
        [staffType]: gameState.staff[staffType] - 1,
      },
      staffMultipliers: {
        ...gameState.staffMultipliers,
        patientGrowth: calculateStaffMultiplier("patientMultiplier", {
          ...gameState.staff,
          [staffType]: gameState.staff[staffType] - 1,
        }),
        revenue: calculateStaffMultiplier("revenueMultiplier", {
          ...gameState.staff,
          [staffType]: gameState.staff[staffType] - 1,
        }),
      },
    })

    toast({
      title: `${staffInfo.name} diberhentikan`,
      description: `${staffInfo.name} telah diberhentikan dari rumah sakit`,
      variant: "default",
    })
  }

  // Calculate multiplier based on staff composition
  const calculateStaffMultiplier = (
    multiplierType: "patientMultiplier" | "revenueMultiplier",
    staffState = gameState.staff,
  ) => {
    let baseMultiplier = 1.0

    // Calculate weighted average of staff multipliers
    let totalStaff = 0
    let weightedSum = 0

    staffTypes.forEach((staffType) => {
      const count = staffState[staffType.id] || 0
      totalStaff += count
      weightedSum += count * staffType[multiplierType]
    })

    if (totalStaff > 0) {
      baseMultiplier = weightedSum / totalStaff
    }

    return baseMultiplier
  }

  const calculateTotalAssignedStaff = () => {
    let total = 0

    // Count staff in main departments
    Object.values(gameState.departments).forEach((dept) => {
      total += dept.staff
    })

    // Count staff in unlocked departments
    if (gameState.unlockedDepartments) {
      Object.values(gameState.unlockedDepartments).forEach((dept) => {
        total += dept.staff
      })
    }

    return total
  }

  // Calculate total required staff across all departments
  const totalRequiredStaff =
    Object.values(gameState.departments).reduce((total, dept) => total + dept.requiredStaff, 0) +
    Object.values(gameState.unlockedDepartments || {}).reduce((total, dept) => total + dept.requiredStaff, 0)

  // Calculate total current staff across all departments
  const totalAssignedStaff = calculateTotalAssignedStaff()

  // Calculate total staff in the hospital
  const totalStaff = Object.values(gameState.staff).reduce((total, count) => total + count, 0)

  // Calculate unassigned staff
  const unassignedStaff = totalStaff - totalAssignedStaff

  // Get all departments (main + unlocked)
  const getAllDepartments = () => {
    const departments = [
      ...Object.entries(gameState.departments).map(([key, dept]) => ({
        id: key,
        name: key === "emergency" ? "IGD" : key === "generalClinic" ? "Poli Umum" : "Rawat Inap",
        staff: dept.staff,
        requiredStaff: dept.requiredStaff,
        isMain: true,
      })),
    ]

    if (gameState.unlockedDepartments) {
      departments.push(
        ...Object.entries(gameState.unlockedDepartments).map(([key, dept]) => ({
          id: key,
          name: dept.name,
          staff: dept.staff,
          requiredStaff: dept.requiredStaff,
          isMain: false,
        })),
      )
    }

    return departments
  }

  const handleAssignStaff = () => {
    if (!selectedDepartment || staffToAssign <= 0 || unassignedStaff < staffToAssign) {
      toast({
        title: "Tidak dapat menugaskan staf",
        description: "Pilih departemen dan jumlah staf yang valid",
        variant: "destructive",
      })
      return
    }

    // Check if department exists in main departments
    if (selectedDepartment in gameState.departments) {
      setGameState({
        ...gameState,
        departments: {
          ...gameState.departments,
          [selectedDepartment]: {
            ...gameState.departments[selectedDepartment],
            staff: gameState.departments[selectedDepartment].staff + staffToAssign,
          },
        },
      })
    }
    // Check if department exists in unlocked departments
    else if (gameState.unlockedDepartments && selectedDepartment in gameState.unlockedDepartments) {
      setGameState({
        ...gameState,
        unlockedDepartments: {
          ...gameState.unlockedDepartments,
          [selectedDepartment]: {
            ...gameState.unlockedDepartments[selectedDepartment],
            staff: gameState.unlockedDepartments[selectedDepartment].staff + staffToAssign,
          },
        },
      })
    }

    toast({
      title: "Staf ditugaskan",
      description: `${staffToAssign} staf telah ditugaskan ke departemen yang dipilih`,
      variant: "default",
    })
  }

  const handleUnassignStaff = () => {
    if (!selectedDepartment || staffToAssign <= 0) {
      toast({
        title: "Tidak dapat melepas penugasan",
        description: "Pilih departemen dan jumlah staf yang valid",
        variant: "destructive",
      })
      return
    }

    // Check if department exists in main departments
    if (selectedDepartment in gameState.departments) {
      const currentStaff = gameState.departments[selectedDepartment].staff
      if (currentStaff < staffToAssign) {
        toast({
          title: "Tidak dapat melepas penugasan",
          description: "Jumlah staf yang akan dilepas melebihi staf yang ada",
          variant: "destructive",
        })
        return
      }

      setGameState({
        ...gameState,
        departments: {
          ...gameState.departments,
          [selectedDepartment]: {
            ...gameState.departments[selectedDepartment],
            staff: currentStaff - staffToAssign,
          },
        },
      })
    }
    // Check if department exists in unlocked departments
    else if (gameState.unlockedDepartments && selectedDepartment in gameState.unlockedDepartments) {
      const currentStaff = gameState.unlockedDepartments[selectedDepartment].staff
      if (currentStaff < staffToAssign) {
        toast({
          title: "Tidak dapat melepas penugasan",
          description: "Jumlah staf yang akan dilepas melebihi staf yang ada",
          variant: "destructive",
        })
        return
      }

      setGameState({
        ...gameState,
        unlockedDepartments: {
          ...gameState.unlockedDepartments,
          [selectedDepartment]: {
            ...gameState.unlockedDepartments[selectedDepartment],
            staff: currentStaff - staffToAssign,
          },
        },
      })
    }

    toast({
      title: "Penugasan dilepas",
      description: `${staffToAssign} staf telah dilepas dari departemen yang dipilih`,
      variant: "default",
    })
  }

  return (
    <div className="space-y-4 p-1">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-3">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="overview">Rekrut & Kelola</TabsTrigger>
            <TabsTrigger value="assign">Tugaskan ke Departemen</TabsTrigger>
          </TabsList>
          <HelpButton context="staff" />
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Staf</CardTitle>
              <CardDescription>Informasi tentang staf rumah sakit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <h3 className="font-medium text-blue-800">Total Staf</h3>
                  <p className="text-2xl font-bold text-blue-900">{totalStaff}</p>
                </div>

                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <h3 className="font-medium text-green-800">Staf yang Dibutuhkan</h3>
                  <p className="text-2xl font-bold text-green-900">{totalRequiredStaff}</p>
                </div>

                <div
                  className={`rounded-lg p-4 text-center ${
                    totalAssignedStaff < totalRequiredStaff ? "bg-red-50" : "bg-emerald-50"
                  }`}
                >
                  <h3
                    className={`font-medium ${
                      totalAssignedStaff < totalRequiredStaff ? "text-red-800" : "text-emerald-800"
                    }`}
                  >
                    Status Staf
                  </h3>
                  <p
                    className={`text-2xl font-bold ${
                      totalAssignedStaff < totalRequiredStaff ? "text-red-900" : "text-emerald-900"
                    }`}
                  >
                    {totalAssignedStaff < totalRequiredStaff
                      ? `Kurang ${totalRequiredStaff - totalAssignedStaff}`
                      : "Optimal"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-medium">Distribusi Staf</h3>
                <div className="space-y-2">
                  {getAllDepartments().map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <span>{dept.name}</span>
                      <span
                        className={
                          dept.staff < dept.requiredStaff ? "text-red-600 font-medium" : "text-green-600 font-medium"
                        }
                      >
                        {dept.staff} / {dept.requiredStaff}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-2">
                    <span>Belum Ditugaskan</span>
                    <span className="font-medium">{unassignedStaff}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 font-medium text-blue-800">Pengaruh Staf</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Pertumbuhan Pasien:</span>
                    <span className="font-medium text-blue-900">
                      +{(((gameState.staffMultipliers?.patientGrowth || 1) - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Pendapatan per Pasien:</span>
                    <span className="font-medium text-blue-900">
                      +{(((gameState.staffMultipliers?.revenue || 1) - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {staffTypes.map((staffType) => (
              <Card key={staffType.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <staffType.icon className="h-5 w-5" />
                    {staffType.name}
                  </CardTitle>
                  <CardDescription>{staffType.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Jumlah:</span>
                      <span className="font-medium">{gameState.staff[staffType.id]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Gaji Bulanan:</span>
                      <span className="font-medium">{formatCurrency(staffType.salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Biaya Rekrut:</span>
                      <span className="font-medium">{formatCurrency(staffType.hiringCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pengaruh Pasien:</span>
                      <span className="font-medium">+{((staffType.patientMultiplier - 1) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pengaruh Pendapatan:</span>
                      <span className="font-medium">+{((staffType.revenueMultiplier - 1) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleHire(staffType.id)}
                    disabled={gameState.cash < staffType.hiringCost}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Rekrut
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFire(staffType.id)}
                    disabled={gameState.staff[staffType.id] <= 0 || unassignedStaff < 1}
                    className="w-full"
                  >
                    <MinusCircle className="mr-1 h-4 w-4" />
                    Berhentikan
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Penugasan Staf</CardTitle>
              <CardDescription>Tugaskan staf ke departemen yang membutuhkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">Total Staf Belum Ditugaskan:</span>
                    <span className="text-xl font-bold text-blue-900">{unassignedStaff}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Pilih Departemen</Label>
                    <Select value={selectedDepartment || ""} onValueChange={(value) => setSelectedDepartment(value)}>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllDepartments().map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.staff}/{dept.requiredStaff})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staffCount">Jumlah Staf</Label>
                    <Select
                      value={staffToAssign.toString()}
                      onValueChange={(value) => setStaffToAssign(Number.parseInt(value))}
                    >
                      <SelectTrigger id="staffCount">
                        <SelectValue placeholder="Pilih jumlah" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} orang
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleUnassignStaff}
                disabled={!selectedDepartment || staffToAssign <= 0}
              >
                Lepas Penugasan
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAssignStaff}
                disabled={!selectedDepartment || staffToAssign <= 0 || unassignedStaff < staffToAssign}
              >
                Tugaskan Staf
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Departemen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAllDepartments().map((dept) => (
                  <div key={dept.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{dept.name}</h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          dept.staff >= dept.requiredStaff
                            ? "bg-green-100 text-green-800"
                            : dept.staff >= dept.requiredStaff * 0.8
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {dept.staff >= dept.requiredStaff
                          ? "Optimal"
                          : dept.staff >= dept.requiredStaff * 0.8
                            ? "Cukup"
                            : "Kurang"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Staf saat ini:</span>
                        <span>{dept.staff} orang</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Staf yang dibutuhkan:</span>
                        <span>{dept.requiredStaff} orang</span>
                      </div>
                      {dept.staff < dept.requiredStaff && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Kekurangan:</span>
                          <span>{dept.requiredStaff - dept.staff} orang</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
