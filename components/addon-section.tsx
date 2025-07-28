"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { AddonConfig } from "@/lib/calculator"
import type { AddonPricing, AddonDependency } from "@/lib/supabase"
import { calculateAddonPrice, calculateDependentAddonValue } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { QuantityMeasurement } from "@/components/measurements/quantity-measurement"
import { NumberFlowSlider } from "@/components/ui/number-flow-slider"
import NumberFlow from '@number-flow/react';

interface AddonSectionProps {
  addon: AddonConfig
  onChange: (addon: AddonConfig) => void
  pricingData: AddonPricing[]
  dependencies?: AddonDependency[]
}

// Define the type for dependent addon price info
interface DependentPriceInfo {
  name: string;
  value: number;
  price: number;
  unit: string;
}

export function AddonSection({ 
  addon, 
  onChange, 
  pricingData,
  dependencies = []
}: AddonSectionProps) {
  const [price, setPrice] = useState(0)
  const [dependentPrices, setDependentPrices] = useState<DependentPriceInfo[]>([])
  const [enabled, setEnabled] = useState(false)
  const [width, setWidth] = useState(1) // Default width for SQFT calculation
  const [length, setLength] = useState(1) // Default length for SQFT calculation
  const [useDetailedDimensions, setUseDetailedDimensions] = useState(false)
  
  const pricing = pricingData.find(
    (p) => 
      p.name === addon.name && 
      p.area === addon.area && 
      p.measurement_type === addon.measurement_type
  )

  useEffect(() => {
    // Check if the addon is actually enabled
    const isAddonEnabled = (addon.linearFeet !== undefined && addon.linearFeet > 0) || 
                         (addon.quantity !== undefined && addon.quantity > 0);
    
    console.log(`[DEBUG] Calculating price for addon: ${addon.name} (${addon.area})`, {
      addon,
      pricing: pricing,
      matchFound: !!pricing,
      isEnabled: isAddonEnabled,
      linearFeet: addon.linearFeet,
      quantity: addon.quantity
    });
    
    // Calculate main addon price
    const calculatedPrice = calculateAddonPrice(addon, pricingData, dependencies);
    
    console.log(`[DEBUG] Calculated price for ${addon.name}: ${calculatedPrice}`);
    
    // Calculate dependent addon prices for display
    let newDependentPrices: DependentPriceInfo[] = [];
    
    if (addon.dependentAddons && addon.dependentAddons.length > 0) {
      newDependentPrices = addon.dependentAddons.map(depAddon => {
        const dependency = dependencies.find(
          d => d.parent_addon_id === addon.id && 
              d.dependent_addon_id === depAddon.id
        );
        
        if (dependency) {
          // Calculate the dependent value based on the parent
          const calculatedValue = calculateDependentAddonValue(addon, dependency);
          
          // Create updated dependent addon with calculated value
          const updatedDepAddon = {
            ...depAddon,
            ...(depAddon.measurement_type === "Linear FT" || depAddon.measurement_type === "Per SQFT"
              ? { linearFeet: calculatedValue }
              : { quantity: calculatedValue })
          };
          
          return {
            name: depAddon.name,
            value: calculatedValue,
            price: calculateAddonPrice(updatedDepAddon, pricingData),
            unit: depAddon.measurement_type === "Linear FT" ? "linear ft" : 
                 depAddon.measurement_type === "Per SQFT" ? "sq ft" : "pieces"
          };
        }
        return null;
      }).filter(Boolean) as DependentPriceInfo[];
    }
    
    // Initialize width and length if it's a Per SQFT measurement
    if (addon.measurement_type === "Per SQFT" && addon.linearFeet) {
      // Use the square root as an approximation if we only have total area
      const approxDimension = Math.sqrt(addon.linearFeet);
      setWidth(approxDimension);
      setLength(approxDimension);
    }
    
    // Update all states at once
    setEnabled(isAddonEnabled);
    setPrice(calculatedPrice);
    setDependentPrices(newDependentPrices);
  }, [addon, pricingData, dependencies])

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (addon.measurement_type === "Linear FT") {
        onChange({
          ...addon,
          linearFeet: 1,
          enabled: true
        })
      } else if (addon.measurement_type === "Per SQFT") {
        onChange({
          ...addon,
          linearFeet: 1, // 1 square foot = 1x1
          enabled: true
        })
        setWidth(1);
        setLength(1);
      } else {
        onChange({
          ...addon,
          quantity: 1,
          enabled: true
        })
      }
    } else {
      if (addon.measurement_type === "Linear FT" || addon.measurement_type === "Per SQFT") {
        onChange({
          ...addon,
          linearFeet: 0,
          enabled: false
        })
      } else {
        onChange({
          ...addon,
          quantity: 0,
          enabled: false
        })
      }
    }
    setEnabled(checked)
  }

  const handleLinearFeetChange = (value: number[]) => {
    // Recalculate dependent addons
    const updatedDependentAddons = recalculateDependentAddons({
      ...addon,
      linearFeet: value[0],
    });
    
    onChange({
      ...addon,
      linearFeet: value[0],
      dependentAddons: updatedDependentAddons
    })
  }

  const handleLinearFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({ ...addon, linearFeet: value });
    }
  }

  const handleQuantityChange = (value: number) => {
    // Recalculate dependent addons
    const updatedDependentAddons = recalculateDependentAddons({
      ...addon,
      quantity: value,
    });
    
    onChange({
      ...addon,
      quantity: value,
      dependentAddons: updatedDependentAddons
    })
  }

  // Handle width change for SQFT measurement
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number.parseFloat(e.target.value);
    if (!isNaN(newWidth) && newWidth >= 0) {
      setWidth(newWidth);
      // Calculate new area from width and length
      const newArea = newWidth * length;
      onChange({ ...addon, linearFeet: newArea });
    }
  }

  // Handle length change for SQFT measurement
  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Number.parseFloat(e.target.value);
    if (!isNaN(newLength) && newLength >= 0) {
      setLength(newLength);
      // Calculate new area from width and length
      const newArea = width * newLength;
      onChange({ ...addon, linearFeet: newArea });
    }
  }

  // Helper function to recalculate dependent addon values
  const recalculateDependentAddons = (parentAddon: AddonConfig): AddonConfig[] => {
    if (!parentAddon.dependentAddons || parentAddon.dependentAddons.length === 0) {
      return parentAddon.dependentAddons || [];
    }
    
    return parentAddon.dependentAddons.map(depAddon => {
      const dependency = dependencies.find(
        d => d.parent_addon_id === parentAddon.id && 
            d.dependent_addon_id === depAddon.id
      );
      
      if (dependency) {
        // Calculate the dependent value based on the parent
        const calculatedValue = calculateDependentAddonValue(parentAddon, dependency);
        
        // Return updated dependent addon with calculated value
        return {
          ...depAddon,
          ...(depAddon.measurement_type === "Linear FT" || depAddon.measurement_type === "Per SQFT"
            ? { linearFeet: calculatedValue }
            : { quantity: calculatedValue }),
          enabled: true
        };
      }
      
      return depAddon;
    });
  };

  if (!pricing) return null

  const isLinearFoot = addon.measurement_type === "Linear FT"
  const isSqftMeasurement = addon.measurement_type === "Per SQFT"
  const isQuantityMeasurement = !isLinearFoot && !isSqftMeasurement
  const displayName = `${addon.name} (${addon.area})`
  const hasDependencies = addon.dependentAddons && addon.dependentAddons.length > 0;
  
  // Format the measurement type for display
  const measurementTypeDisplay = addon.measurement_type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
  
  // Calculate the number of transformers needed for LED Lighting
  const isLEDLighting = addon.name === "LED Lighting";
  const transformerQuantity = isLEDLighting ? Math.ceil((addon.linearFeet || 0) / 3) : 0;
  
  // Calculate transformer price if this is LED lighting
  const transformerPricing = isLEDLighting 
    ? pricingData.find(p => p.name === "Transformer" && p.area === addon.area) 
    : null;
  
  const transformerPrice = transformerPricing 
    ? (transformerPricing.price || 0) * transformerQuantity  // Use the price field directly
    : 0;

  // Special card for LED Lighting to group it with Transformer
  if (isLEDLighting) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Lighting Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* LED Lighting */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`${addon.name}-toggle`}
                    checked={enabled}
                    onCheckedChange={handleToggle}
                  />
                  <Label htmlFor={`${addon.name}-toggle`} className="font-medium">
                    LED Lighting
                  </Label>
                </div>
                {enabled && (
                  <div className="text-sm text-right font-medium text-primary">
                    ${price.toFixed(2)}
                  </div>
                )}
              </div>
              
              {enabled && (
                <div className="space-y-4 ml-7">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${addon.name}-measurement`}>
                      Linear Feet
                    </Label>
                    <Input
                      id={`${addon.name}-measurement-input`}
                      type="number"
                      value={addon.linearFeet || 0}
                      onChange={handleLinearFeetInputChange}
                      className="w-20 text-right"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Transformer Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {enabled && transformerQuantity > 0 ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-green-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-gray-300"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.414-8.414a.75.75 0 01.707-.707h2.414a.75.75 0 010 1.5h-2.414a.75.75 0 01-.707-.793z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <Label className="font-medium text-gray-700">
                    Transformers
                  </Label>
                </div>
                {enabled && transformerQuantity > 0 && (
                  <div className="text-sm text-right font-medium text-primary">
                    ${transformerPrice.toFixed(2)}
                  </div>
                )}
              </div>
              
              {enabled && transformerQuantity > 0 && (
                <div className="ml-7 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm">
                    <span className="font-semibold">{transformerQuantity}</span> transformer{transformerQuantity > 1 ? 's' : ''} 
                    automatically added (1 per 3 feet of LED)
                    {transformerQuantity > 1 && transformerPricing?.price && (
                      <div className="mt-1 text-gray-500 text-xs">
                        ${transformerPricing.price.toFixed(2)} each
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Total Price */}
            <div className="mt-4 text-right">
              <div className="text-sm text-gray-500">Total Lighting Price</div>
              <div className="text-xl font-bold">
                ${(price + transformerPrice).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default card for other addons
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            {hasDependencies && (
              <CardDescription className="text-xs mt-1">
                Includes {addon.dependentAddons?.length} dependent {addon.dependentAddons?.length === 1 ? 'addon' : 'addons'}
              </CardDescription>
            )}
          </div>
          <Switch id={`${addon.name}-toggle`} checked={enabled} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent>
          <div className="space-y-6">
            {isLinearFoot && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${addon.name}-measurement`}>
                    Linear Feet
                  </Label>
                  <Input
                    id={`${addon.name}-measurement-input`}
                    type="number"
                    value={addon.linearFeet || 0}
                    onChange={handleLinearFeetInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
            )}

            {isSqftMeasurement && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${addon.name}-sqft`}>
                    Square Feet
                  </Label>
                  <Input
                    id={`${addon.name}-sqft-input`}
                    type="number"
                    value={addon.linearFeet || 0}
                    onChange={handleLinearFeetInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={0.01}
                    disabled={useDetailedDimensions}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${addon.name}-detailed-toggle`} className="text-sm">
                    Enter width and length
                  </Label>
                  <Switch
                    id={`${addon.name}-detailed-toggle`}
                    checked={useDetailedDimensions}
                    onCheckedChange={setUseDetailedDimensions}
                  />
                </div>

                {useDetailedDimensions && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${addon.name}-width`}>Width (ft)</Label>
                      <Input
                        id={`${addon.name}-width`}
                        type="number"
                        value={width}
                        onChange={handleWidthChange}
                        className="text-right"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${addon.name}-length`}>Length (ft)</Label>
                      <Input
                        id={`${addon.name}-length`}
                        type="number"
                        value={length}
                        onChange={handleLengthChange}
                        className="text-right"
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isQuantityMeasurement && (
              <QuantityMeasurement 
                value={addon.quantity || 0} 
                onChange={handleQuantityChange}
                label={measurementTypeDisplay}
              />
            )}

            {hasDependencies && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Included Dependencies:</h4>
                <div className="space-y-1">
                  {dependentPrices.map((dep, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span className="text-muted-foreground">{dep.name}: {dep.value} {dep.unit}</span>
                      <span className="text-primary">${dep.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-right">
              <div className="text-sm text-gray-500">Price</div>
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
      )}
    </Card>
  )
}
