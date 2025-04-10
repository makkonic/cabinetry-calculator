"use client"

import type React from "react"
import type { IslandConfig } from "@/lib/calculator"
import type { CabinetPricing, SurfacePricing, AddonPricing } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IslandSectionProps {
  island: IslandConfig
  onChange: (island: IslandConfig) => void
  cabinetPricing: CabinetPricing[]
  surfacePricing: SurfacePricing[]
  addonPricing: AddonPricing[]
}

export function IslandSection({ island, onChange, cabinetPricing, surfacePricing, addonPricing }: IslandSectionProps) {
  const materials = ["laminate", "fenix", "porcelain", "quartz", "stainless", "glass matte", "granite"]

  const handleToggle = (checked: boolean) => {
    onChange({
      ...island,
      enabled: checked,
    })
  }

  const handleHandleTypeChange = (value: string) => {
    onChange({
      ...island,
      handleType: value as "Handles" | "Profiles",
    })
  }

  const handlePriceLevelChange = (value: string) => {
    onChange({
      ...island,
      priceLevel: Number.parseInt(value),
    })
  }

  const handleCounterTopMaterialChange = (value: string) => {
    onChange({
      ...island,
      counterTop: {
        ...island.counterTop,
        material: value,
      },
      // Update waterfall material to match counter top
      waterfall: island.waterfall
        ? {
            ...island.waterfall,
            material: value,
          }
        : undefined,
    })
  }

  const handleCounterTopSquareFeetChange = (value: number[]) => {
    onChange({
      ...island,
      counterTop: {
        ...island.counterTop,
        squareFeet: value[0],
      },
    })
  }

  const handleCounterTopSquareFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...island,
        counterTop: {
          ...island.counterTop,
          squareFeet: value,
        },
      })
    }
  }

  const handleWaterfallToggle = (checked: boolean) => {
    if (checked) {
      onChange({
        ...island,
        waterfall: {
          category: "WATERFALL",
          material: island.counterTop.material,
          squareFeet: 0,
        },
      })
    } else {
      onChange({
        ...island,
        waterfall: undefined,
      })
    }
  }

  const handleWaterfallSquareFeetChange = (value: number[]) => {
    if (island.waterfall) {
      onChange({
        ...island,
        waterfall: {
          ...island.waterfall,
          squareFeet: value[0],
        },
      })
    }
  }

  const handleWaterfallSquareFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0 && island.waterfall) {
      onChange({
        ...island,
        waterfall: {
          ...island.waterfall,
          squareFeet: value,
        },
      })
    }
  }

  const handleAluminumProfilesToggle = (checked: boolean) => {
    if (checked) {
      onChange({
        ...island,
        aluminumProfiles: {
          name: "ALUMINUM PROFILES",
          linearFeet: 1,
        },
      })
    } else {
      onChange({
        ...island,
        aluminumProfiles: undefined,
      })
    }
  }

  const handleAluminumProfilesLinearFeetChange = (value: number[]) => {
    if (island.aluminumProfiles) {
      onChange({
        ...island,
        aluminumProfiles: {
          ...island.aluminumProfiles,
          linearFeet: value[0],
        },
      })
    }
  }

  const handleAluminumProfilesLinearFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0 && island.aluminumProfiles) {
      onChange({
        ...island,
        aluminumProfiles: {
          ...island.aluminumProfiles,
          linearFeet: value,
        },
      })
    }
  }

  const handleAluminumToeKicksToggle = (checked: boolean) => {
    if (checked) {
      onChange({
        ...island,
        aluminumToeKicks: {
          name: "ALUMINUM TOE KICKS",
          linearFeet: 1,
        },
      })
    } else {
      onChange({
        ...island,
        aluminumToeKicks: undefined,
      })
    }
  }

  const handleAluminumToeKicksLinearFeetChange = (value: number[]) => {
    if (island.aluminumToeKicks) {
      onChange({
        ...island,
        aluminumToeKicks: {
          ...island.aluminumToeKicks,
          linearFeet: value[0],
        },
      })
    }
  }

  const handleAluminumToeKicksLinearFeetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0 && island.aluminumToeKicks) {
      onChange({
        ...island,
        aluminumToeKicks: {
          ...island.aluminumToeKicks,
          linearFeet: value,
        },
      })
    }
  }

  const handleIntegratedSinkToggle = (checked: boolean) => {
    if (checked) {
      onChange({
        ...island,
        integratedSink: {
          name: "INTEGRATED SINK",
          quantity: 1,
        },
      })
    } else {
      onChange({
        ...island,
        integratedSink: undefined,
      })
    }
  }

  const handleIntegratedSinkQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= 0 && island.integratedSink) {
      onChange({
        ...island,
        integratedSink: {
          ...island.integratedSink,
          quantity: value,
        },
      })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Island Configuration</CardTitle>
          <Switch id="island-toggle" checked={island.enabled} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>
      {island.enabled && (
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Handle Type</Label>
              <RadioGroup value={island.handleType} onValueChange={handleHandleTypeChange} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Handles" id="island-handles" />
                  <Label htmlFor="island-handles">Handles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Profiles" id="island-profiles" />
                  <Label htmlFor="island-profiles">Profiles</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="island-price-level" className="mb-2 block">
                Price Level
              </Label>
              <Select value={island.priceLevel.toString()} onValueChange={handlePriceLevelChange}>
                <SelectTrigger id="island-price-level">
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
          </div>

          <div className="space-y-4">
            <Label className="mb-2 block">Counter Top Material</Label>
            <RadioGroup
              value={island.counterTop.material}
              onValueChange={handleCounterTopMaterialChange}
              className="grid grid-cols-2 md:grid-cols-4 gap-2"
            >
              {materials.map((material) => (
                <div key={material} className="flex items-center space-x-2">
                  <RadioGroupItem value={material} id={`island-counter-top-${material}`} />
                  <Label htmlFor={`island-counter-top-${material}`} className="capitalize">
                    {material}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="island-counter-top-square-feet">Counter Top Square Feet</Label>
              <Input
                id="island-counter-top-square-feet-input"
                type="number"
                value={island.counterTop.squareFeet}
                onChange={handleCounterTopSquareFeetInputChange}
                className="w-20 text-right"
                min={0}
                step={0.01}
              />
            </div>
            <Slider
              id="island-counter-top-square-feet"
              value={[island.counterTop.squareFeet]}
              min={0}
              max={100}
              step={0.01}
              onValueChange={handleCounterTopSquareFeetChange}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="island-waterfall-toggle">Waterfall</Label>
              <Switch
                id="island-waterfall-toggle"
                checked={!!island.waterfall}
                onCheckedChange={handleWaterfallToggle}
              />
            </div>

            {island.waterfall && (
              <div className="pl-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="island-waterfall-square-feet">Waterfall Square Feet</Label>
                  <Input
                    id="island-waterfall-square-feet-input"
                    type="number"
                    value={island.waterfall.squareFeet}
                    onChange={handleWaterfallSquareFeetInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
                <Slider
                  id="island-waterfall-square-feet"
                  value={[island.waterfall.squareFeet]}
                  min={0}
                  max={100}
                  step={0.01}
                  onValueChange={handleWaterfallSquareFeetChange}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="island-aluminum-profiles-toggle">Aluminum Profiles</Label>
              <Switch
                id="island-aluminum-profiles-toggle"
                checked={!!island.aluminumProfiles}
                onCheckedChange={handleAluminumProfilesToggle}
              />
            </div>

            {island.aluminumProfiles && (
              <div className="pl-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="island-aluminum-profiles-linear-feet">Linear Feet</Label>
                  <Input
                    id="island-aluminum-profiles-linear-feet-input"
                    type="number"
                    value={island.aluminumProfiles.linearFeet}
                    onChange={handleAluminumProfilesLinearFeetInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
                <Slider
                  id="island-aluminum-profiles-linear-feet"
                  value={[island.aluminumProfiles.linearFeet || 0]}
                  min={0}
                  max={100}
                  step={0.01}
                  onValueChange={handleAluminumProfilesLinearFeetChange}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="island-aluminum-toe-kicks-toggle">Aluminum Toe Kicks</Label>
              <Switch
                id="island-aluminum-toe-kicks-toggle"
                checked={!!island.aluminumToeKicks}
                onCheckedChange={handleAluminumToeKicksToggle}
              />
            </div>

            {island.aluminumToeKicks && (
              <div className="pl-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="island-aluminum-toe-kicks-linear-feet">Linear Feet</Label>
                  <Input
                    id="island-aluminum-toe-kicks-linear-feet-input"
                    type="number"
                    value={island.aluminumToeKicks.linearFeet}
                    onChange={handleAluminumToeKicksLinearFeetInputChange}
                    className="w-20 text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
                <Slider
                  id="island-aluminum-toe-kicks-linear-feet"
                  value={[island.aluminumToeKicks.linearFeet || 0]}
                  min={0}
                  max={100}
                  step={0.01}
                  onValueChange={handleAluminumToeKicksLinearFeetChange}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="island-integrated-sink-toggle">Integrated Sink</Label>
              <Switch
                id="island-integrated-sink-toggle"
                checked={!!island.integratedSink}
                onCheckedChange={handleIntegratedSinkToggle}
              />
            </div>

            {island.integratedSink && (
              <div className="pl-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="island-integrated-sink-quantity">Quantity</Label>
                  <Input
                    id="island-integrated-sink-quantity"
                    type="number"
                    value={island.integratedSink.quantity}
                    onChange={handleIntegratedSinkQuantityChange}
                    className="w-20 text-right"
                    min={0}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
