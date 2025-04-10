import { Header } from "@/components/header"
import { QuotesList } from "@/components/quotes-list"

export default function QuotesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Saved Quotes</h1>
        <QuotesList />
      </div>
    </main>
  )
}
