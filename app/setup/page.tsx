"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function SetupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [managerName, setManagerName] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  const [difficulty, setDifficulty] = useState("medium")

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

    // Department characteristics
    const departmentCharacteristics = {
      emergency: {
        patientGrowth: 1.5, // Moderate patient growth
        revenue: 3_000_000, // High revenue per patient
        stability: 0.8, // Moderate stability
        specialty: 1.0, // No specialty bonus
      },
      generalClinic: {
        patientGrowth: 2.0, // High patient growth
        revenue: 800_000, // Low revenue per patient
        stability: 0.9, // High stability
        specialty: 1.0, // No specialty bonus
      },
      inpatient: {
        patientGrowth: 1.2, // Low patient growth
        revenue: 7_000_000, // Very high revenue per patient
        stability: 0.7, // Low stability
        specialty: 1.0, // No specialty bonus
      },
    }

    // Save game setup to localStorage
    const gameSetup = {
      managerName,
      hospitalName,
      difficulty,
      startDate: new Date().toISOString(),
      cash: 10_000_000_000, // 10 billion rupiah
      loans: [
        {
          amount: 10_000_000_000,
          interestRate: difficulty === "easy" ? 0.05 : difficulty === "medium" ? 0.08 : 0.12,
          termMonths: 36,
          monthlyPayment: calculateLoanPayment(
            10_000_000_000,
            difficulty === "easy" ? 0.05 : difficulty === "medium" ? 0.08 : 0.12,
            36,
          ),
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
          level: 0,
          capacity: 0,
          staff: 0,
          requiredStaff: 15,
          description: "Departemen spesialis jantung dan pembuluh darah",
        },
        pediatrics: {
          name: "Pediatri",
          unlockCost: 3_000_000_000,
          level: 0,
          capacity: 0,
          staff: 0,
          requiredStaff: 12,
          description: "Departemen spesialis anak",
        },
        surgery: {
          name: "Bedah",
          unlockCost: 7_000_000_000,
          level: 0,
          capacity: 0,
          staff: 0,
          requiredStaff: 20,
          description: "Departemen bedah dan operasi",
        },
        laboratory: {
          name: "Laboratorium",
          unlockCost: 2_500_000_000,
          level: 0,
          capacity: 0,
          staff: 0,
          requiredStaff: 8,
          description: "Laboratorium untuk pemeriksaan medis",
        },
      },
      staff: {
        doctors: 10,
        nurses: 15,
        administration: 5,
        support: 5,
      },
      staffMultipliers: {
        patientGrowth: 1.2, // Initial staff multiplier for patient growth
        revenue: 1.15, // Initial staff multiplier for revenue
      },
      departmentMultipliers: departmentCharacteristics,
      patientSatisfaction: 70, // Initial satisfaction level (0-100)
      satisfactionFactors: {
        staffRatio: 0.5, // Weight of staff ratio in satisfaction
        facilityQuality: 0.3, // Weight of facility quality in satisfaction
        waitingTime: 0.2, // Weight of waiting time in satisfaction
      },
      financialHistory: [
        {
          month: 0,
          revenue: 0,
          fixedCosts: 500_000_000,
          variableCosts: 0,
          totalCosts: 500_000_000,
          profit: -500_000_000,
          patients: 0,
          cash: 10_000_000_000,
          patientSatisfaction: 70,
        },
      ],
    }

    localStorage.setItem("hospitalSimGame", JSON.stringify(gameSetup))
    router.push("/game")
  }

  // Calculate monthly loan payment
  function calculateLoanPayment(principal: number, annualRate: number, months: number) {
    const monthlyRate = annualRate / 12
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-emerald-700">Setup Rumah Sakit</CardTitle>
          <CardDescription>Masukkan informasi awal untuk memulai simulasi</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="managerName">Nama Pengelola</Label>
              <Input
                id="managerName"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospitalName">Nama Rumah Sakit</Label>
              <Input
                id="hospitalName"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Masukkan nama rumah sakit"
              />
            </div>

            <div className="space-y-2">
              <Label>Tingkat Kesulitan</Label>
              <RadioGroup value={difficulty} onValueChange={setDifficulty} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label htmlFor="easy" className="cursor-pointer">
                    Mudah
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="cursor-pointer">
                    Sedang
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label htmlFor="hard" className="cursor-pointer">
                    Sulit
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm">
              <p className="font-medium text-blue-800">Informasi Awal:</p>
              <ul className="mt-2 space-y-1 text-blue-700">
                <li>• Modal awal: 10 milyar Rupiah (pinjaman)</li>
                <li>• Departemen awal: IGD, Poli Umum, Rawat Inap (1 kamar)</li>
                <li>• Durasi permainan: 3 tahun (36 bulan)</li>
                <li>• Maksimal pinjaman tambahan: 3 kali</li>
              </ul>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Mulai Permainan
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
