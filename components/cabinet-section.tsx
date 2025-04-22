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
  
  // Initialize cabinet with proper values and calculate price 
  useEffect(() => {
    // First check if we need to initialize cabinet with default values
    const needsInitialization = 
      (cabinet.measurement_type.includes("PIECE") && (!cabinet.quantity || cabinet.quantity === 0)) ||
      (cabinet.measurement_type.includes("LINEAR") && (!cabinet.linearFeet || cabinet.linearFeet === 0));
    
    // Initialize with default values if needed
    if (needsInitialization) {
      if (cabinet.measurement_type.includes("PIECE")) {
        console.log("Setting initial quantity to 1 for per-piece measurement");
        onChange({
          ...cabinet,
          quantity: 1
        });
      } else if (cabinet.measurement_type.includes("LINEAR")) {
        console.log("Setting initial linearFeet to 1 for linear measurement");
        onChange({
          ...cabinet,
          linearFeet: 1
        });
      }
      return; // Exit early - will be called again with updated values
    }
    
    // Calculate and update price
    const calculatedPrice = calculateCabinetPrice(cabinet, pricingData, cabinet.priceLevel);
    console.log(`Calculated cabinet price for ${cabinet.name}: ${calculatedPrice}`);
    setPrice(calculatedPrice);
  }, [cabinet, pricingData, onChange]);

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

  const handleQuantityChange = (value: number[]) => {
    onChange({
      ...cabinet,
      quantity: value[0],
    })
  }

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Render even if pricing is not found
  const isLinearFoot = cabinet.measurement_type.includes("LINEAR")
  const displayName = `${cabinet.name} (${cabinet.area}) - ${cabinet.handle_type}`
  // Format the measurement type for display
  const measurementTypeDisplay = cabinet.measurement_type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{displayName}</CardTitle>
        {!pricing && (
          <div className="text-sm text-red-500">
            No pricing data found for this cabinet configuration
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label htmlFor={`${cabinet.name}-price-level`} className="mb-2 block">Price Level</Label>
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

          <div className="space-y-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${cabinet.name}-measurement`}>
                  {isLinearFoot ? "Linear Feet" : measurementTypeDisplay}
                </Label>
                <Input
                  id={`${cabinet.name}-measurement-input`}
                  type="number"
                  value={isLinearFoot ? (cabinet.linearFeet || 0) : (cabinet.quantity || 0)}
                  onChange={isLinearFoot ? handleLinearFeetInputChange : handleQuantityInputChange}
                  className="w-20 text-right"
                  min={0}
                  step={isLinearFoot ? 0.01 : 1}
                />
              </div>
              <Slider
                id={`${cabinet.name}-measurement`}
                value={[isLinearFoot ? (cabinet.linearFeet || 0) : (cabinet.quantity || 0)]}
                min={0}
                max={isLinearFoot ? 100 : 20}
                step={isLinearFoot ? 0.01 : 1}
                onValueChange={isLinearFoot ? handleLinearFeetChange : handleQuantityChange}
              />
            </div>
          </div>

          {pricing && pricing.str_addon > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">STR Option (+${pricing.str_addon.toFixed(2)})</h3>
                <Switch id={`${cabinet.name}-str`} checked={cabinet.strEnabled} onCheckedChange={handleStrToggle} />
              </div>
            </div>
          )}

          <div className="mt-4 text-right">
            <div className="text-sm text-gray-500">Price</div>
            <div className="text-xl font-bold">${price.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
