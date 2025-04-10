import { Calculator } from "@/components/calculator"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <Calculator />
      </div>
    </main>
  )
}
