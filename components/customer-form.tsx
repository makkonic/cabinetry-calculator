"use client"

import type React from "react"

import { useState } from "react"
import type { CalculatorConfig, PricingSummary } from "@/lib/calculator"
import { saveQuote } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface CustomerFormProps {
  config: CalculatorConfig
  pricingSummary: PricingSummary
  onClose: () => void
}

export function CustomerForm({ config, pricingSummary, onClose }: CustomerFormProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !customerEmail) {
      toast({
        title: "Missing information",
        description: "Please provide customer name and email",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const quote = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        configuration: config,
        pricing: pricingSummary,
      }

      const result = await saveQuote(quote)

      if (result) {
        toast({
          title: "Quote saved",
          description: "The quote has been saved successfully",
        })
        onClose()
      } else {
        throw new Error("Failed to save quote")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the quote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Quote"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
