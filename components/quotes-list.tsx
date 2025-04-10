"use client"

import { useState, useEffect } from "react"
import { getQuotes, type Quote } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, Printer } from "lucide-react"

export function QuotesList() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  useEffect(() => {
    async function loadQuotes() {
      setLoading(true)
      const data = await getQuotes()
      setQuotes(data)
      setLoading(false)
    }

    loadQuotes()
  }, [])

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF
    alert("PDF export functionality would be implemented here")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading quotes...</h2>
          <p className="text-gray-500">Please wait while we fetch your saved quotes.</p>
        </div>
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No quotes found</h2>
          <p className="text-gray-500">You haven't saved any quotes yet.</p>
          <Button className="mt-4" onClick={() => (window.location.href = "/")}>
            Create a Quote
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {selectedQuote ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setSelectedQuote(null)}>
              Back to List
            </Button>
            <div className="flex space-x-2">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold">Customer</h3>
                    <p>{selectedQuote.customer_name}</p>
                    <p>{selectedQuote.customer_email}</p>
                    <p>{selectedQuote.customer_phone}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Date</h3>
                    <p>{formatDate(selectedQuote.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Total</h3>
                    <p className="text-xl font-bold">${selectedQuote.pricing.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.pricing.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${selectedQuote.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Contingency (5%)</span>
                    <span>${selectedQuote.pricing.buffer.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tariff (10%)</span>
                    <span>${selectedQuote.pricing.tariff.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>Total</span>
                    <span>${selectedQuote.pricing.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Markup Prices</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Trade Price (40% Markup)</span>
                      <span>${selectedQuote.pricing.tradePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retail Price 1 (100% Markup)</span>
                      <span>${selectedQuote.pricing.retailPrice1.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retail Price 2 (150% Markup)</span>
                      <span>${selectedQuote.pricing.retailPrice2.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="font-medium">{quote.customer_name}</div>
                      <div className="text-sm text-gray-500">{quote.customer_email}</div>
                    </TableCell>
                    <TableCell>{formatDate(quote.created_at)}</TableCell>
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
