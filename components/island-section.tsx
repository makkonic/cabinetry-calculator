"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { IslandConfig, SurfaceConfig, AddonConfig } from "@/lib/calculator"
import type { CabinetPricing, SurfacePricing, AddonPricing, HandleType, AddonDependency } from "@/lib/supabase"
import { calculateCabinetPrice, calculateSurfacePrice, calculateAddonPrice } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface IslandSectionProps {
  island: IslandConfig
  onChange: (island: IslandConfig) => void
  cabinetPricing: CabinetPricing[]
  surfacePricing: SurfacePricing[]
  addonPricing: AddonPricing[]
  handleTypes?: HandleType[]
  addonDependencies?: AddonDependency[]
}

export function IslandSection({
  island,
  onChange,
  cabinetPricing,
  surfacePricing,
  addonPricing,
  handleTypes,
  addonDependencies = [],
}: IslandSectionProps) {
  const [cabinetPrice, setCabinetPrice] = useState(0)
  const [counterTopPrice, setCounterTopPrice] = useState(0)
  const [waterfallPrice, setWaterfallPrice] = useState(0)
  const [aluminumProfilesPrice, setAluminumProfilesPrice] = useState(0)
  const [aluminumToeKicksPrice, setAluminumToeKicksPrice] = useState(0)
  const [integratedSinkPrice, setIntegratedSinkPrice] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  // Log when the component receives pricing data
  useEffect(() => {
    console.log("IslandSection received pricing data:", {
      cabinetPricing: cabinetPricing.length,
      surfacePricing: surfacePricing.length,
      addonPricing: addonPricing.length,
      addonDependencies: addonDependencies.length,
    });
  }, [cabinetPricing, surfacePricing, addonPricing, addonDependencies]);

  // Materials for surface selection
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

  // Calculate prices whenever island config changes
  useEffect(() => {
    if (!island.enabled) {
      // Reset all price states at once when disabled
      setCabinetPrice(0);
      setCounterTopPrice(0);
      setWaterfallPrice(0);
      setAluminumProfilesPrice(0);
      setAluminumToeKicksPrice(0);
      setIntegratedSinkPrice(0);
      setTotalPrice(0);
      return;
    }

    // Calculate all prices
    const islandCabinet = {
      name: "Island Cabinet",
      area: "kitchen-island",
      room_name: island.room_name,
      measurement_type: "LINEAR FOOT",
      handle_type: island.handle_type,
      linearFeet: island.counterTop.squareFeet / 2, // Approximate linear feet from square feet
      priceLevel: island.priceLevel,
      strEnabled: false,
    };
    const cabPrice = calculateCabinetPrice(islandCabinet, cabinetPricing, islandCabinet.priceLevel);
    
    const ctopPrice = calculateSurfacePrice(island.counterTop, surfacePricing);
    
    let wfPrice = 0;
    if (island.waterfall && island.waterfall.squareFeet > 0) {
      wfPrice = calculateSurfacePrice(island.waterfall, surfacePricing);
    }
    
    let alProfilesPrice = 0;
    if (island.aluminumProfiles && island.aluminumProfiles.linearFeet) {
      alProfilesPrice = calculateAddonPrice(island.aluminumProfiles, addonPricing, addonDependencies);
    }
    
    let alToeKicksPrice = 0;
    if (island.aluminumToeKicks && island.aluminumToeKicks.linearFeet) {
      alToeKicksPrice = calculateAddonPrice(island.aluminumToeKicks, addonPricing, addonDependencies);
    }
    
    let intSinkPrice = 0;
    if (island.integratedSink && island.integratedSink.quantity > 0) {
      intSinkPrice = calculateAddonPrice(island.integratedSink, addonPricing, addonDependencies);
    }
    
    // Calculate total price
    const total = cabPrice + ctopPrice + wfPrice + alProfilesPrice + alToeKicksPrice + intSinkPrice;
    
    // Batch update all state values
    setCabinetPrice(cabPrice);
    setCounterTopPrice(ctopPrice);
    setWaterfallPrice(wfPrice);
    setAluminumProfilesPrice(alProfilesPrice);
    setAluminumToeKicksPrice(alToeKicksPrice);
    setIntegratedSinkPrice(intSinkPrice);
    setTotalPrice(total);
  }, [island, cabinetPricing, surfacePricing, addonPricing, addonDependencies]);

  const handleEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      enabled: checked,
    })
  }

  const handleHandleTypeChange = (value: string) => {
    onChange({
      ...island,
      handle_type: value,
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
        material: value as any,
      },
      waterfall: island.waterfall
        ? {
            ...island.waterfall,
            material: value as any,
          }
        : undefined,
    })
  }

  const handleCounterTopAreaChange = (value: number[]) => {
    onChange({
      ...island,
      counterTop: {
        ...island.counterTop,
        squareFeet: value[0],
      },
    })
  }

  const handleCounterTopAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleWaterfallAreaChange = (value: number[]) => {
    onChange({
      ...island,
      waterfall: {
        ...island.waterfall!,
        squareFeet: value[0],
      },
    })
  }

  const handleWaterfallAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...island,
        waterfall: {
          ...island.waterfall!,
          squareFeet: value,
        },
      })
    }
  }

  const handleWaterfallEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      waterfall: checked
        ? {
            name: "WATERFALL",
            area: "kitchen-island",
            measurement_type: "SQUARE FOOT",
            material: island.counterTop.material,
            squareFeet: 1,
          }
        : undefined,
    })
  }

  const handleAluminumProfilesChange = (value: number[]) => {
    onChange({
      ...island,
      aluminumProfiles: {
        ...island.aluminumProfiles!,
        linearFeet: value[0],
      },
    })
  }

  const handleAluminumProfilesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...island,
        aluminumProfiles: {
          ...island.aluminumProfiles!,
          linearFeet: value,
        },
      })
    }
  }

  const handleAluminumProfilesEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      aluminumProfiles: checked
        ? {
            name: "Aluminum Profiles",
            area: "kitchen-island",
            measurement_type: "Linear FT",
            linearFeet: 1,
          }
        : undefined,
    })
  }

  const handleAluminumToeKicksChange = (value: number[]) => {
    onChange({
      ...island,
      aluminumToeKicks: {
        ...island.aluminumToeKicks!,
        linearFeet: value[0],
      },
    })
  }

  const handleAluminumToeKicksInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...island,
        aluminumToeKicks: {
          ...island.aluminumToeKicks!,
          linearFeet: value,
        },
      })
    }
  }

  const handleAluminumToeKicksEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      aluminumToeKicks: checked
        ? {
            name: "Aluminum Toe Kicks",
            area: "kitchen-island",
            measurement_type: "Linear FT",
            linearFeet: 1,
          }
        : undefined,
    })
  }

  const handleIntegratedSinkEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      integratedSink: checked
        ? {
            name: "Integrated Sink",
            area: "kitchen-island",
            measurement_type: "Per Piece",
            quantity: 1,
          }
        : undefined,
    })
  }

  const handleIntegratedSinkChange = (value: string) => {
    const quantity = Number.parseInt(value)
    onChange({
      ...island,
      integratedSink: {
        ...island.integratedSink!,
        quantity,
      },
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Island</CardTitle>
          <Switch id="island-enabled" checked={island.enabled} onCheckedChange={handleEnabledChange} />
        </div>
      </CardHeader>
      {island.enabled && (
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Handle Type</Label>
                <Select value={island.handle_type} onValueChange={handleHandleTypeChange}>
                  <SelectTrigger id="island-handle-type">
                    <SelectValue placeholder="Select handle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {handleTypes
                      ?.filter(type => type.name.toLowerCase() !== "none")
                      .map((handleType) => (
                        <SelectItem key={handleType.name} value={handleType.name}>
                          {handleType.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Price Level</Label>
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

            <div className="space-y-2">
              <h3 className="text-md font-semibold">Counter Top</h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Material</Label>
                  <Select value={island.counterTop.material} onValueChange={handleCounterTopMaterialChange}>
                    <SelectTrigger id="island-countertop-material">
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
                    <Label htmlFor="island-countertop-area">Square Feet</Label>
                    <Input
                      id="island-countertop-area-input"
                      type="number"
                      value={island.counterTop.squareFeet}
                      onChange={handleCounterTopAreaInputChange}
                      className="w-20 text-right"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <Slider
                    id="island-countertop-area"
                    value={[island.counterTop.squareFeet]}
                    min={0}
                    max={100}
                    step={0.01}
                    onValueChange={handleCounterTopAreaChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">Waterfall</h3>
                <Switch
                  id="island-waterfall-enabled"
                  checked={!!island.waterfall}
                  onCheckedChange={handleWaterfallEnabledChange}
                />
              </div>
              {island.waterfall && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="island-waterfall-area">Square Feet</Label>
                    <Input
                      id="island-waterfall-area-input"
                      type="number"
                      value={island.waterfall.squareFeet}
                      onChange={handleWaterfallAreaInputChange}
                      className="w-20 text-right"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <Slider
                    id="island-waterfall-area"
                    value={[island.waterfall.squareFeet]}
                    min={0}
                    max={100}
                    step={0.01}
                    onValueChange={handleWaterfallAreaChange}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">Aluminum Profiles</h3>
                <Switch
                  id="island-aluminum-profiles-enabled"
                  checked={!!island.aluminumProfiles}
                  onCheckedChange={handleAluminumProfilesEnabledChange}
                />
              </div>
              {island.aluminumProfiles && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="island-aluminum-profiles">Linear Feet</Label>
                    <Input
                      id="island-aluminum-profiles-input"
                      type="number"
                      value={island.aluminumProfiles.linearFeet || 0}
                      onChange={handleAluminumProfilesInputChange}
                      className="w-20 text-right"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <Slider
                    id="island-aluminum-profiles"
                    value={[island.aluminumProfiles.linearFeet || 0]}
                    min={0}
                    max={100}
                    step={0.01}
                    onValueChange={handleAluminumProfilesChange}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">Aluminum Toe Kicks</h3>
                <Switch
                  id="island-aluminum-toe-kicks-enabled"
                  checked={!!island.aluminumToeKicks}
                  onCheckedChange={handleAluminumToeKicksEnabledChange}
                />
              </div>
              {island.aluminumToeKicks && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="island-aluminum-toe-kicks">Linear Feet</Label>
                    <Input
                      id="island-aluminum-toe-kicks-input"
                      type="number"
                      value={island.aluminumToeKicks.linearFeet || 0}
                      onChange={handleAluminumToeKicksInputChange}
                      className="w-20 text-right"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <Slider
                    id="island-aluminum-toe-kicks"
                    value={[island.aluminumToeKicks.linearFeet || 0]}
                    min={0}
                    max={100}
                    step={0.01}
                    onValueChange={handleAluminumToeKicksChange}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">Integrated Sink</h3>
                <Switch
                  id="island-integrated-sink-enabled"
                  checked={!!island.integratedSink}
                  onCheckedChange={handleIntegratedSinkEnabledChange}
                />
              </div>
              {island.integratedSink && (
                <div>
                  <Select
                    value={island.integratedSink.quantity?.toString() || "0"}
                    onValueChange={handleIntegratedSinkChange}
                  >
                    <SelectTrigger id="island-integrated-sink">
                      <SelectValue placeholder="Select quantity" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? "None" : i === 1 ? "1 Sink" : `${i} Sinks`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-md font-semibold">Island Pricing</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cabinet:</div>
                <div className="text-right">${cabinetPrice.toFixed(2)}</div>
                <div>Counter Top:</div>
                <div className="text-right">${counterTopPrice.toFixed(2)}</div>
                {waterfallPrice > 0 && (
                  <>
                    <div>Waterfall:</div>
                    <div className="text-right">${waterfallPrice.toFixed(2)}</div>
                  </>
                )}
                {aluminumProfilesPrice > 0 && (
                  <>
                    <div>Aluminum Profiles:</div>
                    <div className="text-right">${aluminumProfilesPrice.toFixed(2)}</div>
                  </>
                )}
                {aluminumToeKicksPrice > 0 && (
                  <>
                    <div>Aluminum Toe Kicks:</div>
                    <div className="text-right">${aluminumToeKicksPrice.toFixed(2)}</div>
                  </>
                )}
                {integratedSinkPrice > 0 && (
                  <>
                    <div>Integrated Sink:</div>
                    <div className="text-right">${integratedSinkPrice.toFixed(2)}</div>
                  </>
                )}
                <div className="font-semibold">Total:</div>
                <div className="text-right font-bold">${totalPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
