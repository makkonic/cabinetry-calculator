"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { SurfaceConfig } from "@/lib/calculator"
import type { SurfacePricing } from "@/lib/supabase"
import { calculateSurfacePrice } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardControlRow } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NumberFlowSlider } from "@/components/ui/number-flow-slider"
import NumberFlow from '@number-flow/react'
import { Switch } from "@/components/ui/switch"

interface SurfaceSectionProps {
  surface: SurfaceConfig
  onChange: (surface: SurfaceConfig) => void
  pricingData: SurfacePricing[]
}

export function SurfaceSection({ surface, onChange, pricingData }: SurfaceSectionProps) {
  const [price, setPrice] = useState(0)
  const [width, setWidth] = useState(0) // Initialize to 0 instead of 1
  const [length, setLength] = useState(0) // Initialize to 0 instead of 1
  const [initialized, setInitialized] = useState(false); // Flag for initialization
  const [useDetailedDimensions, setUseDetailedDimensions] = useState(false)
  
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

  // Find pricing for this surface
  const pricing = pricingData.find(
    (p) => 
      p.name === surface.name && 
      (p.area === surface.area || 
       p.area === surface.area.replace('kitchen-surfaces', 'kitchen') ||
       p.area === 'kitchen-surface')
  )

  useEffect(() => {
    // Calculate the current price
    const calculatedPrice = calculateSurfacePrice(surface, pricingData);
    
    // Update price state only if it changed (without adding price to dependencies)
    setPrice(calculatedPrice);

    // Initialize width and length based on surface area if not already initialized
    if (!initialized) {
      if (surface.squareFeet > 0) {
        // Use the square root as an approximation if we only have total area
        const approxDimension = Math.sqrt(surface.squareFeet);
        setWidth(approxDimension);
        setLength(approxDimension);
      } else {
        // If square footage is 0, ensure width and length are also 0
        setWidth(0);
        setLength(0);
      }
      setInitialized(true); // Set flag after initialization
    }
  }, [surface, pricingData, initialized])

  const handleSquareFeetChange = (value: number[]) => {
    const newSqFt = value[0];
    onChange({
      ...surface,
      squareFeet: newSqFt,
    })
    
    // Update width and length to maintain the ratio or set to 0 if area is 0
    if (newSqFt > 0) {
      const currentArea = width * length;
      // If current area is 0, set equal dimensions
      if (currentArea <= 0) {
        const newDimension = Math.sqrt(newSqFt);
        setWidth(newDimension);
        setLength(newDimension);
      } else {
        // Otherwise maintain ratio
        const ratio = Math.sqrt(newSqFt / currentArea);
        setWidth(width * ratio);
        setLength(length * ratio);
      }
    } else {
      // If new area is 0, set width and length to 0
      setWidth(0);
      setLength(0);
    }
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

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number.parseFloat(e.target.value)
    if (!isNaN(newWidth) && newWidth >= 0) {
      setWidth(newWidth);
      // Calculate new area from width and length
      const newArea = newWidth * length;
      onChange({
        ...surface,
        squareFeet: newArea,
      })
    }
  }

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Number.parseFloat(e.target.value)
    if (!isNaN(newLength) && newLength >= 0) {
      setLength(newLength);
      // Calculate new area from width and length
      const newArea = width * newLength;
      onChange({
        ...surface,
        squareFeet: newArea,
      })
    }
  }

  const handleMaterialChange = (value: string) => {
    onChange({
      ...surface,
      material: value as any,
    })
  }

  const displayName = `${surface.name} (${surface.area.replace('kitchen-surfaces', 'kitchen').replace('kitchen-surface', 'kitchen')})`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{displayName}</CardTitle>
        {!pricing && (
          <div className="text-sm text-red-500">
            No pricing data found for this surface configuration
          </div>
        )}
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

          <CardControlRow
            numberSection={
              <div className="space-y-2">
                <Label htmlFor={`${surface.name}-sqft-input`}>SQFT</Label>
                <Input
                  id={`${surface.name}-sqft-input`}
                  type="number"
                  value={surface.squareFeet}
                  onChange={handleSquareFeetInputChange}
                  min={0}
                  step={0.01}
                  className="text-right"
                  disabled={useDetailedDimensions}
                />
              </div>
            }
          />

          <div className="flex items-center justify-between mt-4">
            <Label htmlFor={`${surface.name}-detailed-toggle`} className="text-sm">
              Enter width and length
            </Label>
            <Switch
              id={`${surface.name}-detailed-toggle`}
              checked={useDetailedDimensions}
              onCheckedChange={setUseDetailedDimensions}
            />
          </div>

          {useDetailedDimensions && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor={`${surface.name}-width`}>Width (ft)</Label>
                <Input
                  id={`${surface.name}-width`}
                  type="number"
                  value={width}
                  onChange={handleWidthChange}
                  min={0}
                  step={0.01}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${surface.name}-length`}>Length (ft)</Label>
                <Input
                  id={`${surface.name}-length`}
                  type="number"
                  value={length}
                  onChange={handleLengthChange}
                  min={0}
                  step={0.01}
                  className="text-right"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-right">
          <div className="text-sm text-muted-foreground">Price</div>
          <NumberFlow 
            value={price}
            format={{ 
              style: 'currency', 
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }}
            transformTiming={{ duration: 500, easing: 'ease-out' }}
            className="text-xl font-bold"
          />
        </div>
      </CardContent>
    </Card>
  )
}
