import { Suspense } from "react"
import { CalculatorWithEdit } from "@/components/calculator-with-suspense"
import { Header } from "@/components/header"

function CalculatorFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading calculator...</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <Suspense fallback={<CalculatorFallback />}>
          <CalculatorWithEdit />
        </Suspense>
      </div>
    </main>
  )
}
