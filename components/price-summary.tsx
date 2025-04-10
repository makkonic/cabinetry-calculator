"use client"

import { useState } from "react"
import type { PricingSummary } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Printer } from "lucide-react"

interface PriceSummaryProps {
  pricingSummary: PricingSummary
}

export function PriceSummary({ pricingSummary }: PriceSummaryProps) {
  const [activeTab, setActiveTab] = useState("dealer")

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF
    alert("PDF export functionality would be implemented here")
  }

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Price Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="dealer">Dealer</TabsTrigger>
            <TabsTrigger value="trade">Trade</TabsTrigger>
            <TabsTrigger value="retail1">Retail 1</TabsTrigger>
            <TabsTrigger value="retail2">Retail 2</TabsTrigger>
          </TabsList>

          <TabsContent value="dealer" className="space-y-4">
            <div className="space-y-2">
              {pricingSummary.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${pricingSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Contingency (5%)</span>
                <span>${pricingSummary.buffer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tariff (10%)</span>
                <span>${pricingSummary.tariff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total</span>
                <span>${pricingSummary.total.toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trade" className="space-y-4">
            <div className="space-y-2">
              {pricingSummary.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>${(item.price * 1.4).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(pricingSummary.subtotal * 1.4).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Contingency (5%)</span>
                <span>${(pricingSummary.buffer * 1.4).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tariff (10%)</span>
                <span>${(pricingSummary.tariff * 1.4).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total (40% Markup)</span>
                <span>${pricingSummary.tradePrice.toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="retail1" className="space-y-4">
            <div className="space-y-2">
              {pricingSummary.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>${(item.price * 2).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(pricingSummary.subtotal * 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Contingency (5%)</span>
                <span>${(pricingSummary.buffer * 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tariff (10%)</span>
                <span>${(pricingSummary.tariff * 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total (100% Markup)</span>
                <span>${pricingSummary.retailPrice1.toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="retail2" className="space-y-4">
            <div className="space-y-2">
              {pricingSummary.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>${(item.price * 2.5).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(pricingSummary.subtotal * 2.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Contingency (5%)</span>
                <span>${(pricingSummary.buffer * 2.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tariff (10%)</span>
                <span>${(pricingSummary.tariff * 2.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-2">
                <span>Total (150% Markup)</span>
                <span>${pricingSummary.retailPrice2.toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex space-x-2 mt-6">
          <Button onClick={handlePrint} variant="outline" className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
