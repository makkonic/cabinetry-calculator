"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { AddonConfig } from "@/lib/calculator"
import type { AddonPricing } from "@/lib/supabase"
import { calculateAddonPrice } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface AddonSectionProps {
  addon: AddonConfig
  onChange: (addon: AddonConfig) => void
  pricingData: AddonPricing[]
}

export function AddonSection({ addon, onChange, pricingData }: AddonSectionProps) {
  const [price, setPrice] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const pricing = pricingData.find((p) => p.name === addon.name)

  useEffect(() => {
    setPrice(calculateAddonPrice(addon, pricingData))
    setEnabled(
      (addon.linearFeet !== undefined && addon.linearFeet > 0) || (addon.quantity !== undefined && addon.quantity > 0),
    )
  }, [addon, pricingData])

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (pricing?.type === "LINEAR FOOT") {
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
      if (pricing?.type === "LINEAR FOOT") {
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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...addon,
        quantity: value,
      })
    }
  }

  if (!pricing) return null

  const isLinearFoot = pricing.type === "LINEAR FOOT"

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{addon.name}</CardTitle>
          <Switch id={`${addon.name}-toggle`} checked={enabled} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent>
          <div className="space-y-4">
            {isLinearFoot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${addon.name}-linear-feet`}>Linear Feet</Label>
                  <Input
                    id={`${addon.name}-linear-feet-input`}
                    type="number"
                    value={addon.linearFeet || 0}
                    onChange={handleLinearFeetInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
                <Slider
                  id={`${addon.name}-linear-feet`}
                  value={[addon.linearFeet || 0]}
                  min={0}
                  max={100}
                  step={0.01}
                  onValueChange={handleLinearFeetChange}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Label htmlFor={`${addon.name}-quantity`}>Quantity</Label>
                <Input
                  id={`${addon.name}-quantity`}
                  type="number"
                  value={addon.quantity || 0}
                  onChange={handleQuantityChange}
                  className="w-20 text-right"
                  min={0}
                />
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
