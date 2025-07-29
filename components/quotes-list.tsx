"use client"

import { useState, useEffect } from "react"
import { getQuotes, type Quote } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, Printer } from "lucide-react"
import type { Template } from '@pdfme/common';
import { BLANK_PDF } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';

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
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)

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

  const handleExportPDF = async () => {
    if (!selectedQuote || typeof window === "undefined") return;
    
    setIsPrinting(true);
    
    try {
      // Generate the formatted quote ID
      const quoteId = generateQuoteId(selectedQuote);
      
      const customerInfo = 
        `${selectedQuote.customer_name}\n` +
        `${selectedQuote.customer_email}\n` +
        `${selectedQuote.customer_phone}`;

      const quoteDate = formatDate(selectedQuote.created_at);
      const quoteInfo = 
        `${quoteId}\n` +
        `${quoteDate}\n` +
        `$${selectedQuote.pricing.total.toFixed(2)}`;

      // Get items for pagination
      const items = selectedQuote.pricing.items || [];

      // Clean summary without excessive separators
      const summary = 
        `Subtotal                          $${selectedQuote.pricing.subtotal.toFixed(2)}\n` +
        `Contingency (5%)                  $${selectedQuote.pricing.buffer.toFixed(2)}\n` +
        `Tariff (10%)                      $${selectedQuote.pricing.tariff.toFixed(2)}`;

      // Simplified markup pricing
      const markupPrices = 
        `Trade (40%): $${selectedQuote.pricing.tradePrice.toFixed(2)}  ` +
        `Retail 1 (100%): $${selectedQuote.pricing.retailPrice1.toFixed(2)}  ` +
        `Retail 2 (150%): $${selectedQuote.pricing.retailPrice2.toFixed(2)}`;

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Calculate pagination - items per page based on available space
      const itemsPerPage = 15; // Conservative estimate for page 1
      const itemsPerPageSubsequent = 25; // More items on subsequent pages
      const totalItems = items.length;
      const needsMultiplePages = totalItems > itemsPerPage;
      
      // Split items across pages if needed
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

      // Create schemas for each page
      const schemas = pageItems.map((pageItemList, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pageItems.length - 1;
        
        let schema = [];
        let currentY = 10;

        if (isFirstPage) {
          // Header section (only on first page)
          schema.push(
            // Main title
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
            // Quote ID badge
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

          // Customer and Quote Info (only on first page)
          schema.push(
            // Customer Information Card
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
            // Quote Details Card
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

        // Items Section Header
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

        // Table Headers with proper grid alignment
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

        // Items content with proper grid alignment
        pageItemList.forEach((item: any, index: number) => {
          const name = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
          const measurement = item.measurement || '-';
          const price = `$${item.price.toFixed(2)}`;
          
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

        // Summary and total (only on last page)
        if (isLastPage) {
          currentY += 10; // Add some spacing

          // Summary Section
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

          // Total highlight
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

          // Markup Pricing Section
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

          // Footer
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

      // Generate inputs for each page
      const inputs = pageItems.map((pageItemList, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pageItems.length - 1;
        
        let pageInput: any = {};
        
        // Add header info only to first page
        if (isFirstPage) {
          pageInput.title = 'Kitchen Calculation Quote';
          pageInput.quoteIdHeader = quoteId;
          pageInput.customerTitle = 'Customer Information';
          pageInput.customerInfo = customerInfo;
          pageInput.quoteTitle = 'Quote Details';
          pageInput.quoteInfo = quoteInfo;
        }
        
        // Add items section to all pages
        pageInput.itemsHeader = pageIndex === 0 ? 'Items' : `Items (continued)`;
        pageInput.itemNameHeader = 'Item Name';
        pageInput.measurementHeader = 'Measurement';
        pageInput.priceHeader = 'Price';
        
        // Add individual item data
        pageItemList.forEach((item: any, index: number) => {
          const name = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
          const measurement = item.measurement || '-';
          const price = `$${item.price.toFixed(2)}`;
          
          pageInput[`itemName_${pageIndex}_${index}`] = name;
          pageInput[`itemMeasurement_${pageIndex}_${index}`] = measurement;
          pageInput[`itemPrice_${pageIndex}_${index}`] = price;
        });
        
        // Add summary and footer only to last page
        if (isLastPage) {
          pageInput.summaryHeader = 'Summary';
          pageInput.summary = summary;
          pageInput.totalAmount = `TOTAL: $${selectedQuote.pricing.total.toFixed(2)}`;
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
      
      // Use the formatted quote ID in the filename
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quoteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };

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
              <Button onClick={handlePrint} variant="outline" disabled={isPrinting}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleExportPDF} variant="outline" disabled={isPrinting}>
                <Download className="w-4 h-4 mr-2" />
                {isPrinting ? "Generating..." : "Export PDF"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Quote Details</span>
                <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {generateQuoteId(selectedQuote)}
                </span>
              </CardTitle>
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
                    <h3 className="font-semibold">Quote ID</h3>
                    <p className="font-mono">{generateQuoteId(selectedQuote)}</p>
                    <h3 className="font-semibold mt-2">Date</h3>
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
                        <TableHead>Measurement</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.pricing.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.measurement || '-'}</TableCell>
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
