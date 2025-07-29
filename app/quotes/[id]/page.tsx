"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getQuotes, type Quote } from "@/lib/supabase"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download } from "lucide-react"
import type { Template } from '@pdfme/common';
import { BLANK_PDF } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';

// Quote ID prefix
const QUOTE_PREFIX = "KCQ"; // Kitchen Calculator Quote

// Generate a formatted quote ID
function generateQuoteId(quote: Quote) {
  const sequentialNumber = quote.id.toString().padStart(4, '0');
  return `${QUOTE_PREFIX}-${sequentialNumber}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function QuoteDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuote() {
      try {
        const quotes = await getQuotes()
        const foundQuote = quotes.find(q => q.id.toString() === params.id)
        setQuote(foundQuote || null)
      } catch (error) {
        console.error("Error fetching quote:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQuote()
    }
  }, [params.id])

  const handleExportPDF = async () => {
    if (!quote || typeof window === "undefined") return;

    try {
      // Generate quote ID
      const quoteId = generateQuoteId(quote);
      
      // Format customer info
      const customerInfo = 
        `${quote.customer_name}\n` +
        `${quote.customer_email}\n` +
        `${quote.customer_phone}`;
      
      const quoteDate = formatDate(quote.created_at);
      const quoteInfo = 
        `${quoteId}\n` +
        `${quoteDate}\n` +
        `$${quote.pricing.total.toFixed(2)}`;

      // Get items for pagination
      const items = quote.pricing.items || [];

      // Calculate pagination
      const itemsPerPage = 15;
      const itemsPerPageSubsequent = 25;
      const totalItems = items.length;
      
      const pageItems = [];
      if (totalItems <= itemsPerPage) {
        pageItems.push(items);
      } else {
        pageItems.push(items.slice(0, itemsPerPage));
        let remainingItems = items.slice(itemsPerPage);
        while (remainingItems.length > 0) {
          pageItems.push(remainingItems.slice(0, itemsPerPageSubsequent));
          remainingItems = remainingItems.slice(itemsPerPageSubsequent);
        }
      }

      // Create schemas for each page (simplified version)
      const schemas = pageItems.map((pageItemList, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pageItems.length - 1;
        
        let schema = [];
        let currentY = 10;

        if (isFirstPage) {
          schema.push(
            {
              name: 'title',
              type: 'text',
              position: { x: 20, y: currentY },
              width: 170,
              height: 8,
              fontSize: 20,
              fontWeight: 'bold',
              alignment: 'center',
              fontColor: '#1e293b',
            },
            {
              name: 'quoteIdHeader',
              type: 'text',
              position: { x: 20, y: currentY + 12 },
              width: 170,
              height: 6,
              fontSize: 12,
              alignment: 'center',
              fontWeight: 'bold',
              fontColor: '#059669',
            }
          );
          currentY += 35;

          schema.push(
            {
              name: 'customerTitle',
              type: 'text',
              position: { x: 20, y: currentY },
              width: 70,
              height: 6,
              fontSize: 11,
              fontWeight: 'bold',
              fontColor: '#374151',
            },
            {
              name: 'customerInfo',
              type: 'text',
              position: { x: 20, y: currentY + 8 },
              width: 70,
              height: 15,
              fontSize: 9,
              lineHeight: 1.4,
              fontColor: '#6b7280',
            },
            {
              name: 'quoteTitle',
              type: 'text',
              position: { x: 110, y: currentY },
              width: 80,
              height: 6,
              fontSize: 11,
              fontWeight: 'bold',
              alignment: 'right',
              fontColor: '#374151',
            },
            {
              name: 'quoteInfo',
              type: 'text',
              position: { x: 110, y: currentY + 8 },
              width: 80,
              height: 15,
              fontSize: 9,
              lineHeight: 1.4,
              alignment: 'right',
              fontColor: '#6b7280',
            }
          );
          currentY += 30;
        }

        schema.push({
          name: 'itemsHeader',
          type: 'text',
          position: { x: 20, y: currentY },
          width: 170,
          height: 8,
          fontSize: 14,
          fontWeight: 'bold',
          fontColor: '#1e293b',
        });
        currentY += 15;

        schema.push(
          {
            name: 'itemNameHeader',
            type: 'text',
            position: { x: 20, y: currentY },
            width: 90,
            height: 6,
            fontSize: 10,
            fontWeight: 'bold',
            fontColor: '#6b7280',
          },
          {
            name: 'measurementHeader',
            type: 'text',
            position: { x: 110, y: currentY },
            width: 40,
            height: 6,
            fontSize: 10,
            fontWeight: 'bold',
            fontColor: '#6b7280',
          },
          {
            name: 'priceHeader',
            type: 'text',
            position: { x: 150, y: currentY },
            width: 40,
            height: 6,
            fontSize: 10,
            fontWeight: 'bold',
            fontColor: '#6b7280',
          }
        );
        currentY += 12;

        pageItemList.forEach((item: any, index: number) => {
          schema.push(
            {
              name: `itemName_${pageIndex}_${index}`,
              type: 'text',
              position: { x: 20, y: currentY },
              width: 90,
              height: 6,
              fontSize: 9,
              fontColor: '#374151',
            },
            {
              name: `itemMeasurement_${pageIndex}_${index}`,
              type: 'text',
              position: { x: 110, y: currentY },
              width: 40,
              height: 6,
              fontSize: 9,
              fontColor: '#374151',
            },
            {
              name: `itemPrice_${pageIndex}_${index}`,
              type: 'text',
              position: { x: 150, y: currentY },
              width: 40,
              height: 6,
              fontSize: 9,
              fontColor: '#374151',
            }
          );
          currentY += 10;
        });

        if (isLastPage) {
          currentY += 10;

          schema.push({
            name: 'summaryHeader',
            type: 'text',
            position: { x: 20, y: currentY },
            width: 170,
            height: 6,
            fontSize: 12,
            fontWeight: 'bold',
            fontColor: '#1e293b',
          });
          currentY += 12;

          schema.push({
            name: 'summary',
            type: 'text',
            position: { x: 20, y: currentY },
            width: 170,
            height: 20,
            fontSize: 9,
            lineHeight: 1.3,
            fontColor: '#374151',
          });
          currentY += 25;

          schema.push({
            name: 'totalAmount',
            type: 'text',
            position: { x: 20, y: currentY },
            width: 170,
            height: 8,
            fontSize: 16,
            fontWeight: 'bold',
            alignment: 'right',
            fontColor: '#059669',
          });
          currentY += 15;

          schema.push(
            {
              name: 'markupHeader',
              type: 'text',
              position: { x: 20, y: currentY },
              width: 170,
              height: 6,
              fontSize: 10,
              fontWeight: 'bold',
              fontColor: '#6b7280',
            },
            {
              name: 'markupPrices',
              type: 'text',
              position: { x: 20, y: currentY + 8 },
              width: 170,
              height: 10,
              fontSize: 8,
              lineHeight: 1.3,
              fontColor: '#6b7280',
            }
          );
          currentY += 25;

          schema.push({
            name: 'footer',
            type: 'text',
            position: { x: 20, y: currentY },
            width: 170,
            height: 6,
            fontSize: 7,
            alignment: 'center',
            fontColor: '#9ca3af',
          });
        }

        return schema;
      });

      const template: Template = {
        basePdf: BLANK_PDF,
        schemas: schemas,
      };

      // Clean summary
      const summary = 
        `Subtotal                          $${quote.pricing.subtotal.toFixed(2)}\n` +
        `Contingency (5%)                  $${quote.pricing.buffer.toFixed(2)}\n` +
        `Tariff (10%)                      $${quote.pricing.tariff.toFixed(2)}`;

      const markupPrices = 
        `Trade (40%): $${quote.pricing.tradePrice.toFixed(2)}  ` +
        `Retail 1 (100%): $${quote.pricing.retailPrice1.toFixed(2)}  ` +
        `Retail 2 (150%): $${quote.pricing.retailPrice2.toFixed(2)}`;

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Generate inputs for each page
      const inputs = pageItems.map((pageItemList, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pageItems.length - 1;
        
        let pageInput: any = {};
        
        if (isFirstPage) {
          pageInput.title = 'Kitchen Calculation Quote';
          pageInput.quoteIdHeader = quoteId;
          pageInput.customerTitle = 'Customer Information';
          pageInput.customerInfo = customerInfo;
          pageInput.quoteTitle = 'Quote Details';
          pageInput.quoteInfo = quoteInfo;
        }
        
        pageInput.itemsHeader = pageIndex === 0 ? 'Items' : `Items (continued)`;
        pageInput.itemNameHeader = 'Item Name';
        pageInput.measurementHeader = 'Measurement';
        pageInput.priceHeader = 'Price';
        
        pageItemList.forEach((item: any, index: number) => {
          const name = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
          const measurement = item.measurement || '-';
          const price = `$${item.price.toFixed(2)}`;
          
          pageInput[`itemName_${pageIndex}_${index}`] = name;
          pageInput[`itemMeasurement_${pageIndex}_${index}`] = measurement;
          pageInput[`itemPrice_${pageIndex}_${index}`] = price;
        });
        
        if (isLastPage) {
          pageInput.summaryHeader = 'Summary';
          pageInput.summary = summary;
          pageInput.totalAmount = `TOTAL: $${quote.pricing.total.toFixed(2)}`;
          pageInput.markupHeader = 'Additional Pricing Levels';
          pageInput.markupPrices = markupPrices;
          pageInput.footer = `Generated on ${currentDate} | This is a computer-generated document. Prices are subject to change without notice.`;
        }
        
        return pageInput;
      });
      
      const plugins = { text };
      const pdf = await generate({ template, inputs, plugins });
      
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quoteId}-quote.pdf`;
      document.body.appendChild(link);
      link.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <div className="text-center">Loading quote details...</div>
        </div>
      </main>
    )
  }

  if (!quote) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Quote Not Found</h1>
            <Button onClick={() => router.push('/quotes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotes
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/quotes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotes
            </Button>
            <h1 className="text-2xl font-bold">Quote Details</h1>
          </div>
          <Button onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Quote Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quote {generateQuoteId(quote)}</span>
                <span className="text-xl font-bold text-emerald-600">
                  ${quote.pricing.total.toFixed(2)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <p>{quote.customer_name}</p>
                  <p>{quote.customer_email}</p>
                  <p>{quote.customer_phone}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Quote Information</h3>
                  <p className="font-mono">{generateQuoteId(quote)}</p>
                  <p>{formatDate(quote.created_at)}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Total Amount</h3>
                  <p className="text-xl font-bold">${quote.pricing.total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Measurement</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.pricing.items.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.measurement || '-'}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${quote.pricing.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contingency (5%)</span>
                  <span>${quote.pricing.buffer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tariff (10%)</span>
                  <span>${quote.pricing.tariff.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${quote.pricing.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Additional Pricing Levels</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Trade (40%)</span>
                    <span>${quote.pricing.tradePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retail 1 (100%)</span>
                    <span>${quote.pricing.retailPrice1.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retail 2 (150%)</span>
                    <span>${quote.pricing.retailPrice2.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 