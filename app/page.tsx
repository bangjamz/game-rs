import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-100 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-emerald-700">Rumah Sakit Simulator</h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          Simulasi interaktif pengelolaan rumah sakit untuk pembelajaran ekonomi dan pembiayaan kesehatan
        </p>

        <div className="mb-8 rounded-lg bg-emerald-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-emerald-800">Konsep Ekonomi yang Dipelajari:</h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <li className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-200 px-2 py-1 text-sm font-medium text-emerald-800">FC</span>
              <span>Fixed Cost (Biaya Tetap)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-200 px-2 py-1 text-sm font-medium text-emerald-800">VC</span>
              <span>Variable Cost (Biaya Variabel)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-200 px-2 py-1 text-sm font-medium text-emerald-800">TC</span>
              <span>Total Cost (Total Biaya)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-200 px-2 py-1 text-sm font-medium text-emerald-800">MC</span>
              <span>Marginal Cost (Biaya Marjinal)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-200 px-2 py-1 text-sm font-medium text-emerald-800">ATC</span>
              <span>Average Total Cost (Rata-rata Biaya Total)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-200 px-2 py-1 text-sm font-medium text-emerald-800">AVC</span>
              <span>Average Variable Cost (Rata-rata Biaya Variabel)</span>
            </li>
          </ul>
        </div>

        <div className="mb-8 rounded-lg bg-blue-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-blue-800">Fitur Utama:</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">✓</span>
              <span>Kelola rumah sakit selama 3 tahun (36 bulan)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">✓</span>
              <span>Upgrade departemen untuk meningkatkan pendapatan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">✓</span>
              <span>Rekrut dan kelola staf medis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">✓</span>
              <span>Pinjaman awal 10 milyar rupiah dengan maksimal 3 kali pinjaman tambahan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">✓</span>
              <span>Visualisasi grafik keuangan (TC, FC, VC, MC)</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-center">
          <Link href="/setup">
            <Button size="lg" className="bg-emerald-600 text-lg hover:bg-emerald-700">
              Mulai Permainan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
