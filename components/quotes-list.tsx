"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getQuotes, type Quote } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye } from "lucide-react"

// Quote ID prefix
const QUOTE_PREFIX = "KCQ"; // Kitchen Calculator Quote

// Generate a formatted quote ID
function generateQuoteId(quote: Quote) {
  // Use the database ID as the sequential number
  // Pad with leading zeros for consistent formatting (e.g., KCQ-0001)
  const sequentialNumber = quote.id.toString().padStart(4, '0');
  return `${QUOTE_PREFIX}-${sequentialNumber}`;
}

export function QuotesList() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchQuotes() {
      const quotesData = await getQuotes()
      setQuotes(quotesData)
      setLoading(false)
    }
    fetchQuotes()
  }, [])

  const handleViewQuote = (quote: Quote) => {
    router.push(`/quotes/${quote.id}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div>
      {loading ? (
        <div className="text-center py-8">Loading quotes...</div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No quotes found.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px] whitespace-nowrap">Quote ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-xs">{generateQuoteId(quote)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{quote.customer_name}</div>
                      <div className="text-sm text-gray-500">{quote.customer_email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(quote.created_at)}</TableCell>
                    <TableCell className="text-right font-medium">${quote.pricing.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewQuote(quote)}>
                        <Eye className="w-4 h-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
