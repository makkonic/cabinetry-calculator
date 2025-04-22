"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { SurfaceConfig } from "@/lib/calculator"
import type { SurfacePricing } from "@/lib/supabase"
import { calculateSurfacePrice } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SurfaceSectionProps {
  surface: SurfaceConfig
  onChange: (surface: SurfaceConfig) => void
  pricingData: SurfacePricing[]
}

export function SurfaceSection({ surface, onChange, pricingData }: SurfaceSectionProps) {
  const [price, setPrice] = useState(0)
  const materials = ["laminate", "fenix", "porcelain", "quartz", "stainless", "glass_matte", "granite"]
  const materialLabels: Record<string, string> = {
    laminate: "Laminate",
    fenix: "Fenix",
    porcelain: "Porcelain",
    quartz: "Quartz",
    stainless: "Stainless Steel",
    glass_matte: "Glass Matte",
    granite: "Granite"
  }

  useEffect(() => {
    // Calculate the current price
    const calculatedPrice = calculateSurfacePrice(surface, pricingData);
    
    // Update price state only if it changed (without adding price to dependencies)
    setPrice(calculatedPrice);
  }, [surface, pricingData])

  const handleSquareFeetChange = (value: number[]) => {
    onChange({
      ...surface,
      squareFeet: value[0],
    })
  }

  const handleSquareFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...surface,
        squareFeet: value,
      })
    }
  }

  const handleMaterialChange = (value: string) => {
    onChange({
      ...surface,
      material: value as any,
    })
  }

  const displayName = `${surface.name} (${surface.area})`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{displayName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Material</Label>
            <Select value={surface.material} onValueChange={handleMaterialChange}>
              <SelectTrigger id={`${surface.name}-material`}>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material} value={material}>
                    {materialLabels[material]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${surface.name}-square-feet`}>Square Feet</Label>
              <Input
                id={`${surface.name}-square-feet-input`}
                type="number"
                value={surface.squareFeet}
                onChange={handleSquareFeetInputChange}
                className="w-20 text-right"
                min={0}
                step={0.01}
              />
            </div>
            <Slider
              id={`${surface.name}-square-feet`}
              value={[surface.squareFeet]}
              min={0}
              max={100}
              step={0.01}
              onValueChange={handleSquareFeetChange}
            />
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
