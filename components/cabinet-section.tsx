"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { CabinetConfig } from "@/lib/calculator"
import type { CabinetPricing } from "@/lib/supabase"
import { calculateCabinetPrice } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardControlRow } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SqftMeasurement } from "@/components/measurements/sqft-measurement"
import { LinearMeasurement } from "@/components/measurements/linear-measurement"
import { QuantityMeasurement } from "@/components/measurements/quantity-measurement"
import { NumberFlowSlider } from "@/components/ui/number-flow-slider"
import NumberFlow from '@number-flow/react';
import { getDisplayName } from "@/lib/utils"
import { PriceLevelTooltip } from "@/components/ui/price-level-tooltip"
import { useSettings } from "@/contexts/settings-context"

interface CabinetSectionProps {
  cabinet: CabinetConfig
  onChange: (cabinet: CabinetConfig) => void
  pricingData: CabinetPricing[]
}

export function CabinetSection({ cabinet, onChange, pricingData }: CabinetSectionProps) {
  const [price, setPrice] = useState(0)
  const [width, setWidth] = useState(0) // Default to 0 for SQFT calculation
  const [length, setLength] = useState(0) // Default to 0 for SQFT calculation
  const [initialized, setInitialized] = useState(false)
  const [useDetailedDimensions, setUseDetailedDimensions] = useState(false)
  const { exchangeRate } = useSettings()
  
  const pricing = pricingData.find(
    (p) => 
      p.name === cabinet.name && 
      p.area === cabinet.area && 
      p.measurement_type === cabinet.measurement_type && 
      p.handle_type === cabinet.handle_type
  )

  console.log("Current cabinet state:", cabinet);
  console.log("Found pricing data:", pricing);
  
  // Calculate price and initialize dimensions for SQFT measurements
  useEffect(() => {
    // Calculate and update price - let the calculator function handle zero values
    console.log("Calculating price with:", {
      cabinet,
      pricingData,
      priceLevel: cabinet.priceLevel,
      strEnabled: cabinet.strEnabled
    });
    
    const calculatedPrice = calculateCabinetPrice(cabinet, pricingData, cabinet.priceLevel, exchangeRate);
    console.log(`Calculated cabinet price for ${cabinet.name}: ${calculatedPrice}`);
    setPrice(calculatedPrice);

    // Initialize width and length if it's a Per SQFT measurement and not yet initialized
    if (cabinet.measurement_type === "Per SQFT" && !initialized) {
      if (cabinet.linearFeet && cabinet.linearFeet > 0) {
        const approxDimension = Math.sqrt(cabinet.linearFeet);
        setWidth(approxDimension);
        setLength(approxDimension);
      } else {
        // If square footage is 0, ensure width and length are also 0
        setWidth(0);
        setLength(0);
      }
      setInitialized(true);
    }
  }, [
    cabinet, 
    cabinet.linearFeet, 
    cabinet.quantity, 
    cabinet.priceLevel,
    cabinet.strEnabled, // Explicitly depend on strEnabled to trigger recalculation
    pricingData,
    initialized
  ]);

  const handleLinearFeetChange = (value: number[]) => {
    console.log(`Linear feet changed to: ${value[0]}`);
    onChange({
      ...cabinet,
      linearFeet: value[0],
    })
  }

  const handleLinearFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      console.log(`Linear feet input changed to: ${value}`);
      onChange({
        ...cabinet,
        linearFeet: value,
      })
    }
  }

  const handleQuantityChange = (value: number) => {
    console.log(`Quantity changed to: ${value}`);
    onChange({
      ...cabinet,
      quantity: value,
    })
  }

  const handlePriceLevelChange = (value: string) => {
    console.log(`Price level changed to: ${value}`);
    onChange({
      ...cabinet,
      priceLevel: Number.parseInt(value),
    })
  }

  const handleStrToggle = (checked: boolean) => {
    console.log(`STR toggle changed to: ${checked}`);
    onChange({
      ...cabinet,
      strEnabled: checked,
    })
  }

  // Handle width change for SQFT measurement
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number.parseFloat(e.target.value);
    if (!isNaN(newWidth) && newWidth >= 0) {
      setWidth(newWidth);
      // Calculate new area from width and length
      const newArea = newWidth * length;
      onChange({ ...cabinet, linearFeet: newArea });
    }
  }

  // Handle length change for SQFT measurement
  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Number.parseFloat(e.target.value);
    if (!isNaN(newLength) && newLength >= 0) {
      setLength(newLength);
      // Calculate new area from width and length
      const newArea = width * newLength;
      onChange({ ...cabinet, linearFeet: newArea });
    }
  }

  const handleSquareFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      onChange({ ...cabinet, linearFeet: value });
    }
  }

  // Render even if pricing is not found
  const isLinearMeasurement = cabinet.measurement_type === "Linear FT"
  const isSqftMeasurement = cabinet.measurement_type === "Per SQFT"
  const displayName = getDisplayName(cabinet.name)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{displayName}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {cabinet.handle_type}
        </CardDescription>
        {!pricing && (
          <div className="text-sm text-red-500">
            No pricing data found for this cabinet configuration
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLinearMeasurement && (
            <>
              <CardControlRow
                dropdownSection={
                  <div className="space-y-2">
                    <Label htmlFor={`${cabinet.name}-price-level`}>Price Level</Label>
                    <PriceLevelTooltip>
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
                    </PriceLevelTooltip>
                  </div>
                }
                numberSection={
                  <div className="space-y-2">
                    <Label htmlFor={`${cabinet.name}-measurement-input`}>Linear Ft</Label>
                    <Input
                      id={`${cabinet.name}-measurement-input`}
                      type="number"
                      value={cabinet.linearFeet || 0}
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          onChange({ ...cabinet, linearFeet: value });
                        }
                      }}
                      className="text-right"
                      min={0}
                      step={0.1}
                    />
                  </div>
                }
              />
            </>
          )}

          {isSqftMeasurement && (
            <>
              <CardControlRow
                dropdownSection={
                  <div className="space-y-2">
                    <Label htmlFor={`${cabinet.name}-price-level`}>Price Level</Label>
                    <PriceLevelTooltip>
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
                    </PriceLevelTooltip>
                  </div>
                }
                numberSection={
                  <div className="space-y-2">
                    <Label htmlFor={`${cabinet.name}-sqft-input`}>Square Feet</Label>
                    <Input
                      id={`${cabinet.name}-sqft-input`}
                      type="number"
                      value={cabinet.linearFeet || 0}
                      onChange={handleSquareFeetInputChange}
                      className="text-right"
                      min={0}
                      step={0.1}
                      disabled={useDetailedDimensions}
                    />
                  </div>
                }
              />

              <div className="flex items-center justify-between mt-4">
                <Label htmlFor={`${cabinet.name}-detailed-toggle`} className="text-sm">
                  Enter width and length
                </Label>
                <Switch
                  id={`${cabinet.name}-detailed-toggle`}
                  checked={useDetailedDimensions}
                  onCheckedChange={setUseDetailedDimensions}
                />
              </div>

              {useDetailedDimensions && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${cabinet.name}-width`}>Width (ft)</Label>
                    <Input
                      id={`${cabinet.name}-width`}
                      type="number"
                      value={width}
                      onChange={handleWidthChange}
                      className="text-right"
                      min={0}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${cabinet.name}-length`}>Length (ft)</Label>
                    <Input
                      id={`${cabinet.name}-length`}
                      type="number"
                      value={length}
                      onChange={handleLengthChange}
                      className="text-right"
                      min={0}
                      step={0.1}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {!isLinearMeasurement && !isSqftMeasurement && (
            <CardControlRow
              dropdownSection={
                <div className="space-y-2">
                  <Label htmlFor={`${cabinet.name}-price-level`}>Price Level</Label>
                  <PriceLevelTooltip>
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
                  </PriceLevelTooltip>
                </div>
              }
              numberSection={
                <div className="space-y-2">
                  <Label htmlFor={`${cabinet.name}-quantity-input`}>Qty</Label>
                  <Input
                    id={`${cabinet.name}-quantity-input`}
                    type="number"
                    value={cabinet.quantity || 0}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        onChange({ ...cabinet, quantity: value });
                      }
                    }}
                    className="text-right"
                    min={0}
                    step={1}
                  />
                </div>
              }
            />
          )}

          {pricing && pricing.str_addon > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-2">Structure Upgrade</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    +${pricing.str_addon.toFixed(2)} per {cabinet.measurement_type === "Per Piece" ? "piece" : "ft"}
                    {cabinet.strEnabled && (
                      <span className="ml-1">
                        (Total: <NumberFlow 
                          value={pricing.str_addon * (cabinet.linearFeet || cabinet.quantity || 0)}
                          format={{ 
                            style: 'currency', 
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }}
                          transformTiming={{ duration: 400, easing: 'ease-out' }}
                          className="font-medium text-primary"
                        />)
                      </span>
                    )}
                  </p>
                </div>
                <Switch
                  checked={cabinet.strEnabled || false}
                  onCheckedChange={handleStrToggle}
                  className={cabinet.strEnabled ? "bg-primary" : ""}
                />
              </div>
            </div>
          )}

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
        </div>
      </CardContent>
    </Card>
  )
}
