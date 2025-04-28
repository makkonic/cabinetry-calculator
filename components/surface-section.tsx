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
import { SqftMeasurement } from "@/components/measurements/sqft-measurement"

interface SurfaceSectionProps {
  surface: SurfaceConfig
  onChange: (surface: SurfaceConfig) => void
  pricingData: SurfacePricing[]
}

export function SurfaceSection({ surface, onChange, pricingData }: SurfaceSectionProps) {
  const [price, setPrice] = useState(0)
  const [width, setWidth] = useState(1) // Default width in feet
  const [length, setLength] = useState(1) // Default length in feet
  const [initialized, setInitialized] = useState(false); // Flag for initialization
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

    // Initialize width and length based on surface area
    if (surface.squareFeet > 0 && !initialized) { // Only run if not initialized
      // Use the square root as an approximation if we only have total area
      const approxDimension = Math.sqrt(surface.squareFeet);
      setWidth(approxDimension);
      setLength(approxDimension);
      setInitialized(true); // Set flag after initialization
    }
  }, [surface, pricingData, initialized])

  const handleSquareFeetChange = (value: number[]) => {
    onChange({
      ...surface,
      squareFeet: value[0],
    })
    
    // Update width and length to maintain the ratio
    const newSqFt = value[0];
    if (newSqFt > 0) {
      const currentArea = width * length;
      const ratio = Math.sqrt(newSqFt / currentArea);
      setWidth(width * ratio);
      setLength(length * ratio);
    }
  }

  const handleSquareFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...surface,
        squareFeet: value,
      })
      
      // Update width and length to maintain the ratio
      if (value > 0) {
        const currentArea = width * length;
        const ratio = Math.sqrt(value / currentArea);
        setWidth(width * ratio);
        setLength(length * ratio);
      }
    }
  }

  // Handle width change
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number.parseFloat(e.target.value)
    if (!isNaN(newWidth) && newWidth >= 0) {
      setWidth(newWidth);
      // Calculate new square footage and update
      const newArea = newWidth * length;
      onChange({
        ...surface,
        squareFeet: newArea,
      });
    }
  }

  // Handle length change
  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Number.parseFloat(e.target.value)
    if (!isNaN(newLength) && newLength >= 0) {
      setLength(newLength);
      // Calculate new square footage and update
      const newArea = width * newLength;
      onChange({
        ...surface,
        squareFeet: newArea,
      });
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
            <SqftMeasurement
              width={width}
              length={length}
              onWidthChange={(newWidth) => {
                setWidth(newWidth);
                const newArea = newWidth * length;
                onChange({ ...surface, squareFeet: newArea });
              }}
              onLengthChange={(newLength) => {
                setLength(newLength);
                const newArea = width * newLength;
                onChange({ ...surface, squareFeet: newArea });
              }}
              labelPrefix={surface.name}
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
