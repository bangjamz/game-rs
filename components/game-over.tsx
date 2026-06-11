"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { GameState } from "@/lib/types"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Link from "next/link"

interface GameOverProps {
  gameState: GameState
  reason: string
}

export default function GameOver({ gameState, reason }: GameOverProps) {
  // Prepare summary data
  const lastMonth = gameState.financialHistory[gameState.financialHistory.length - 1]
  const currentYear = Math.ceil(gameState.currentMonth / 12)

  // Calculate yearly summaries - only for years that were actually played
  const yearSummaries = Array.from({ length: currentYear }, (_, i) => i + 1)
    .map((year) => {
      const yearMonths = gameState.financialHistory.filter(
        (month) => month.month > 0 && month.month <= year * 12 && month.month > (year - 1) * 12,
      )

      if (yearMonths.length === 0) return null

      const totalRevenue = yearMonths.reduce((sum, month) => sum + month.revenue, 0)
      const totalFixedCosts = yearMonths.reduce((sum, month) => sum + month.fixedCosts, 0)
      const totalVariableCosts = yearMonths.reduce((sum, month) => sum + month.variableCosts, 0)
      const totalCosts = yearMonths.reduce((sum, month) => sum + month.totalCosts, 0)
      const totalProfit = yearMonths.reduce((sum, month) => sum + month.profit, 0)
      const totalPatients = yearMonths.reduce((sum, month) => sum + month.patients, 0)

      return {
        year,
        totalRevenue,
        totalFixedCosts,
        totalVariableCosts,
        totalCosts,
        totalProfit,
        totalPatients,
        averageRevenue: totalRevenue / yearMonths.length,
        averageProfit: totalProfit / yearMonths.length,
        averagePatients: totalPatients / yearMonths.length,
      }
    })
    .filter(Boolean)

  // Prepare chart data - only for months that were actually played
  const chartData = gameState.financialHistory
    .filter((month) => month.month > 0 && month.month < gameState.currentMonth)
    .map((month) => ({
      month: month.month,
      revenue: month.revenue,
      fixedCosts: month.fixedCosts,
      variableCosts: month.variableCosts,
      totalCosts: month.totalCosts,
      profit: month.profit,
    }))

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-2 border-emerald-200">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="text-center text-2xl text-emerald-700">
              {gameState.currentMonth > 36 ? "Simulasi Selesai!" : "Game Over"}
            </CardTitle>
            <CardDescription className="text-center text-lg">{reason}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6 space-y-4">
              <div className="rounded-lg bg-gray-100 p-4">
                <h2 className="mb-2 text-xl font-bold">Ringkasan Rumah Sakit</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Nama Rumah Sakit:</span>
                      <span className="font-medium">{gameState.hospitalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pengelola:</span>
                      <span className="font-medium">{gameState.managerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tingkat Kesulitan:</span>
                      <span className="font-medium capitalize">{gameState.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Bulan:</span>
                      <span className="font-medium">{gameState.currentMonth - 1}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Kas Akhir:</span>
                      <span className={`font-bold ${lastMonth.cash < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(lastMonth.cash)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Pasien:</span>
                      <span className="font-medium">
                        {gameState.financialHistory.reduce((sum, month) => sum + month.patients, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Profit:</span>
                      <span
                        className={`font-bold ${
                          gameState.financialHistory.reduce((sum, month) => sum + month.profit, 0) < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(gameState.financialHistory.reduce((sum, month) => sum + month.profit, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kepuasan Pasien Akhir:</span>
                      <span className="font-medium">{gameState.patientSatisfaction}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {yearSummaries.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Ringkasan Tahunan</h2>

                  {yearSummaries.map((summary) => (
                    <Card key={summary.year}>
                      <CardHeader className="pb-2">
                        <CardTitle>Tahun {summary.year}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Total Pendapatan:</span>
                              <span className="font-medium">{formatCurrency(summary.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Fixed Cost:</span>
                              <span className="font-medium">{formatCurrency(summary.totalFixedCosts)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Variable Cost:</span>
                              <span className="font-medium">{formatCurrency(summary.totalVariableCosts)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Cost:</span>
                              <span className="font-medium">{formatCurrency(summary.totalCosts)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Total Profit:</span>
                              <span
                                className={`font-bold ${summary.totalProfit < 0 ? "text-red-600" : "text-green-600"}`}
                              >
                                {formatCurrency(summary.totalProfit)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Pasien:</span>
                              <span className="font-medium">{summary.totalPatients}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rata-rata Pendapatan Bulanan:</span>
                              <span className="font-medium">{formatCurrency(summary.averageRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rata-rata Profit Bulanan:</span>
                              <span
                                className={`font-medium ${summary.averageProfit < 0 ? "text-red-600" : "text-green-600"}`}
                              >
                                {formatCurrency(summary.averageProfit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Grafik Keuangan</h2>

                <Card>
                  <CardHeader>
                    <CardTitle>Pendapatan, Biaya, dan Profit</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: "Bulan", position: "insideBottomRight", offset: -5 }} />
                        <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#10b981" />
                        <Line type="monotone" dataKey="totalCosts" name="Total Cost" stroke="#ef4444" />
                        <Line type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fixed Cost vs Variable Cost</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: "Bulan", position: "insideBottomRight", offset: -5 }} />
                        <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="fixedCosts" name="Fixed Cost" stroke="#f59e0b" />
                        <Line type="monotone" dataKey="variableCosts" name="Variable Cost" stroke="#8b5cf6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Link href="/">
              <Button variant="outline">Kembali ke Beranda</Button>
            </Link>
            <Link href="/setup">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Mulai Permainan Baru</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
