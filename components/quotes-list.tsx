"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getQuotes, deleteQuote, type Quote } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Eye, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

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

  const handleEditQuote = (quote: Quote) => {
    // Navigate to calculator with quote data pre-filled
    router.push(`/?edit=${quote.id}`)
  }

  const handleDeleteQuote = async (quoteId: number) => {
    try {
      const success = await deleteQuote(quoteId)
      if (success) {
        toast({
          title: "Quote deleted",
          description: "The quote has been deleted successfully",
        })
        // Refresh the quotes list
        const quotesData = await getQuotes()
        setQuotes(quotesData)
      } else {
        throw new Error("Failed to delete quote")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the quote. Please try again.",
        variant: "destructive",
      })
    }
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
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
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
                    <TableCell className="text-right font-medium">{formatCurrency(quote.pricing.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewQuote(quote)}>
                          <Eye className="w-4 h-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditQuote(quote)}>
                          <Edit className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete quote {generateQuoteId(quote)}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteQuote(quote.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
