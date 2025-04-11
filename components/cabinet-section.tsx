"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { CabinetConfig } from "@/lib/calculator"
import type { CabinetPricing } from "@/lib/supabase"
import { calculateCabinetPrice } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CabinetSectionProps {
  cabinet: CabinetConfig
  onChange: (cabinet: CabinetConfig) => void
  pricingData: CabinetPricing[]
}

export function CabinetSection({ cabinet, onChange, pricingData }: CabinetSectionProps) {
  const [price, setPrice] = useState(0)
  const pricing = pricingData.find(
    (p) => 
      p.name === cabinet.name && 
      p.area === cabinet.area && 
      p.measurement_type === cabinet.measurement_type && 
      p.handle_type === cabinet.handle_type
  )

  useEffect(() => {
    setPrice(calculateCabinetPrice(cabinet, pricingData))
  }, [cabinet, pricingData])

  const handleLinearFeetChange = (value: number[]) => {
    onChange({
      ...cabinet,
      linearFeet: value[0],
    })
  }

  const handleLinearFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...cabinet,
        linearFeet: value,
      })
    }
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...cabinet,
        quantity: value,
      })
    }
  }

  const handlePriceLevelChange = (value: string) => {
    onChange({
      ...cabinet,
      priceLevel: Number.parseInt(value),
    })
  }

  const handleStrToggle = (checked: boolean) => {
    onChange({
      ...cabinet,
      strEnabled: checked,
    })
  }

  if (!pricing) return null

  const isLinearFoot = cabinet.measurement_type.includes("LINEAR")
  const displayName = `${cabinet.name} (${cabinet.area}) - ${cabinet.handle_type}`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{displayName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {isLinearFoot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${cabinet.name}-linear-feet`}>Linear Feet</Label>
                  <Input
                    id={`${cabinet.name}-linear-feet-input`}
                    type="number"
                    value={cabinet.linearFeet || 0}
                    onChange={handleLinearFeetInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
                <Slider
                  id={`${cabinet.name}-linear-feet`}
                  value={[cabinet.linearFeet || 0]}
                  min={0}
                  max={100}
                  step={0.01}
                  onValueChange={handleLinearFeetChange}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Label htmlFor={`${cabinet.name}-quantity`}>Quantity</Label>
                <Input
                  id={`${cabinet.name}-quantity`}
                  type="number"
                  value={cabinet.quantity || 0}
                  onChange={handleQuantityChange}
                  className="w-20 text-right"
                  min={0}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor={`${cabinet.name}-price-level`}>Price Level</Label>
              <Select value={cabinet.priceLevel.toString()} onValueChange={handlePriceLevelChange}>
                <SelectTrigger id={`${cabinet.name}-price-level`}>
                  <SelectValue placeholder="Select price level" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      Level {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pricing.str_addon > 0 && (
              <div className="flex items-center space-x-2">
                <Switch id={`${cabinet.name}-str`} checked={cabinet.strEnabled} onCheckedChange={handleStrToggle} />
                <Label htmlFor={`${cabinet.name}-str`}>STR Option (+${pricing.str_addon.toFixed(2)})</Label>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-right">
          <div className="text-sm text-gray-500">Price</div>
          <div className="text-xl font-bold">${price.toFixed(2)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
