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
    
    // Calculate main addon price
    const calculatedPrice = calculateAddonPrice(addon, pricingData, dependencies);
    
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
            ...(depAddon.measurement_type.includes("LINEAR")
              ? { linearFeet: calculatedValue }
              : { quantity: calculatedValue })
          };
          
          return {
            name: depAddon.name,
            value: calculatedValue,
            price: calculateAddonPrice(updatedDepAddon, pricingData),
            unit: depAddon.measurement_type.includes("LINEAR") ? "linear ft" : "pieces"
          };
        }
        return null;
      }).filter(Boolean) as DependentPriceInfo[];
    }
    
    // Update all states at once
    setEnabled(isAddonEnabled);
    setPrice(calculatedPrice);
    setDependentPrices(newDependentPrices);
  }, [addon, pricingData, dependencies])

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (addon.measurement_type.includes("LINEAR")) {
        onChange({
          ...addon,
          linearFeet: 1,
        })
      } else {
        onChange({
          ...addon,
          quantity: 1,
        })
      }
    } else {
      if (addon.measurement_type.includes("LINEAR")) {
        onChange({
          ...addon,
          linearFeet: 0,
        })
      } else {
        onChange({
          ...addon,
          quantity: 0,
        })
      }
    }
    setEnabled(checked)
  }

  const handleLinearFeetChange = (value: number[]) => {
    onChange({
      ...addon,
      linearFeet: value[0],
    })
  }

  const handleLinearFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...addon,
        linearFeet: value,
      })
    }
  }

  const handleQuantityChange = (value: number[]) => {
    onChange({
      ...addon,
      quantity: value[0],
    })
  }

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...addon,
        quantity: value,
      })
    }
  }

  if (!pricing) return null

  const isLinearFoot = addon.measurement_type.includes("LINEAR")
  const displayName = `${addon.name} (${addon.area})`
  const hasDependencies = addon.dependentAddons && addon.dependentAddons.length > 0;
  
  // Format the measurement type for display
  const measurementTypeDisplay = addon.measurement_type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')

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
            <div className="space-y-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${addon.name}-measurement`}>
                    {isLinearFoot ? "Linear Feet" : measurementTypeDisplay}
                  </Label>
                  <Input
                    id={`${addon.name}-measurement-input`}
                    type="number"
                    value={isLinearFoot ? (addon.linearFeet || 0) : (addon.quantity || 0)}
                    onChange={isLinearFoot ? handleLinearFeetInputChange : handleQuantityInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={isLinearFoot ? 0.01 : 1}
                  />
                </div>
                <Slider
                  id={`${addon.name}-measurement`}
                  value={[isLinearFoot ? (addon.linearFeet || 0) : (addon.quantity || 0)]}
                  min={0}
                  max={isLinearFoot ? 100 : 20}
                  step={isLinearFoot ? 0.01 : 1}
                  onValueChange={isLinearFoot ? handleLinearFeetChange : handleQuantityChange}
                />
              </div>
            </div>

            {dependentPrices.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-md font-semibold">Automatically includes:</h3>
                <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  {dependentPrices.map((dep, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{dep.name}</span>
                      <span>{dep.value} {dep.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-right">
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-xl font-bold">${price.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
