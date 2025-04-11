"use client"

import { useState, useEffect } from "react"
import { CabinetSection } from "./cabinet-section"
import { SurfaceSection } from "./surface-section"
import { AddonSection } from "./addon-section"
import { IslandSection } from "./island-section"
import { PriceSummary } from "./price-summary"
import { CustomerForm } from "./customer-form"
import {
  getCabinetPricing,
  getSurfacePricing,
  getAddonPricing,
  getAreas,
  getMeasurementTypes,
  getHandleTypes,
  type CabinetPricing,
  type SurfacePricing,
  type AddonPricing,
  type Area,
  type MeasurementType,
  type HandleType,
} from "@/lib/supabase"
import {
  type CalculatorConfig,
  type CabinetConfig,
  type SurfaceConfig,
  type AddonConfig,
  type IslandConfig,
  calculateTotalPrice,
} from "@/lib/calculator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function Calculator() {
  // Reference data
  const [areas, setAreas] = useState<Area[]>([])
  const [measurementTypes, setMeasurementTypes] = useState<MeasurementType[]>([])
  const [handleTypes, setHandleTypes] = useState<HandleType[]>([])
  
  // Pricing data
  const [cabinetPricing, setCabinetPricing] = useState<CabinetPricing[]>([])
  const [surfacePricing, setSurfacePricing] = useState<SurfacePricing[]>([])
  const [addonPricing, setAddonPricing] = useState<AddonPricing[]>([])
  const [loading, setLoading] = useState(true)

  const [handle_type, setHandleType] = useState<string>("Handles")
  const [cabinets, setCabinets] = useState<CabinetConfig[]>([
    { name: "BASE", area: "KITCHEN", measurement_type: "LINEAR FOOT", handle_type: "Handles", linearFeet: 0, priceLevel: 0, strEnabled: false },
    { name: "BASE LE MANS", area: "KITCHEN", measurement_type: "PER PIECE", handle_type: "Handles", quantity: 0, priceLevel: 0, strEnabled: false },
    { name: "COLUMNS", area: "KITCHEN", measurement_type: "LINEAR FOOT", handle_type: "Handles", linearFeet: 0, priceLevel: 0, strEnabled: false },
    { name: "COLUMNS LE MANS", area: "KITCHEN", measurement_type: "PER PIECE", handle_type: "Handles", quantity: 0, priceLevel: 0, strEnabled: false },
    { name: "STACK", area: "KITCHEN", measurement_type: "LINEAR FOOT", handle_type: "Handles", linearFeet: 0, priceLevel: 0, strEnabled: false },
    { name: "WALL", area: "KITCHEN", measurement_type: "LINEAR FOOT", handle_type: "Handles", linearFeet: 0, priceLevel: 0, strEnabled: false },
    { name: "DW PANEL", area: "KITCHEN", measurement_type: "PER PIECE", handle_type: "Handles", quantity: 0, priceLevel: 0, strEnabled: false },
    { name: "FRIDGE PANEL", area: "KITCHEN", measurement_type: "LINEAR FOOT", handle_type: "Handles", linearFeet: 0, priceLevel: 0, strEnabled: false },
    { name: "SHELVES", area: "KITCHEN", measurement_type: "LINEAR FOOT", handle_type: "Handles", linearFeet: 0, priceLevel: 0, strEnabled: false },
  ])

  const [surfaces, setSurfaces] = useState<SurfaceConfig[]>([
    { name: "COUNTER TOP", area: "KITCHEN", measurement_type: "SQUARE FOOT", material: "laminate", squareFeet: 0 },
    { name: "BACKSPLASH", area: "KITCHEN", measurement_type: "SQUARE FOOT", material: "laminate", squareFeet: 0 },
  ])

  const [addons, setAddons] = useState<AddonConfig[]>([
    { name: "ALUMINUM PROFILES", area: "KITCHEN", measurement_type: "LINEAR FOOT", linearFeet: 0 },
    { name: "ALUMINUM TOE KICKS", area: "KITCHEN", measurement_type: "LINEAR FOOT", linearFeet: 0 },
    { name: "LED LIGHTING", area: "KITCHEN", measurement_type: "LINEAR FOOT", linearFeet: 0 },
    { name: "TRANSFORMER", area: "KITCHEN", measurement_type: "PER PIECE", quantity: 0 },
    { name: "INTEGRATED SINK", area: "KITCHEN", measurement_type: "PER PIECE", quantity: 0 },
    { name: "POWER STRIP", area: "KITCHEN", measurement_type: "PER PIECE", quantity: 0 },
  ])

  const [island, setIsland] = useState<IslandConfig>({
    enabled: false,
    handle_type: "Handles",
    priceLevel: 0,
    counterTop: { name: "COUNTER TOP", area: "ISLAND", measurement_type: "SQUARE FOOT", material: "laminate", squareFeet: 0 },
    waterfall: { name: "WATERFALL", area: "ISLAND", measurement_type: "SQUARE FOOT", material: "laminate", squareFeet: 0 },
    aluminumProfiles: { name: "ALUMINUM PROFILES", area: "ISLAND", measurement_type: "LINEAR FOOT", linearFeet: 0 },
    aluminumToeKicks: { name: "ALUMINUM TOE KICKS", area: "ISLAND", measurement_type: "LINEAR FOOT", linearFeet: 0 },
    integratedSink: { name: "INTEGRATED SINK", area: "ISLAND", measurement_type: "PER PIECE", quantity: 0 },
  })

  const [activeTab, setActiveTab] = useState("cabinets")
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  // Load pricing data
  useEffect(() => {
    async function loadPricingData() {
      setLoading(true)
      const [areasData, measurementTypesData, handleTypesData, cabinets, surfaces, addons] = await Promise.all([
        getAreas(),
        getMeasurementTypes(),
        getHandleTypes(),
        getCabinetPricing(),
        getSurfacePricing(),
        getAddonPricing(),
      ])

      setAreas(areasData)
      setMeasurementTypes(measurementTypesData)
      setHandleTypes(handleTypesData)
      setCabinetPricing(cabinets)
      setSurfacePricing(surfaces)
      setAddonPricing(addons)
      setLoading(false)
    }

    loadPricingData()
  }, [])

  // Update cabinet handle_type when handle type changes
  useEffect(() => {
    setCabinets((prev) =>
      prev.map((cabinet) => ({
        ...cabinet,
        handle_type
      }))
    )
  }, [handle_type])

  // Calculate transformer quantity based on LED lighting
  useEffect(() => {
    const ledLighting = addons.find((addon) => addon.name === "LED LIGHTING")
    if (ledLighting && ledLighting.linearFeet) {
      const transformerQuantity = Math.ceil(ledLighting.linearFeet / 3)
      setAddons((prev) =>
        prev.map((addon) => (addon.name === "TRANSFORMER" ? { ...addon, quantity: transformerQuantity } : addon)),
      )
    }
  }, [addons])

  // Update island waterfall material when counter top material changes
  useEffect(() => {
    if (island.enabled && island.waterfall) {
      setIsland((prev) => ({
        ...prev,
        waterfall: {
          ...prev.waterfall!,
          material: prev.counterTop.material,
        },
      }))
    }
  }, [island.counterTop.material, island.enabled])

  const config: CalculatorConfig = {
    handle_type,
    cabinets,
    surfaces,
    addons,
    island,
  }

  const pricingSummary = calculateTotalPrice(config, cabinetPricing, surfacePricing, addonPricing)

  const handleCabinetChange = (index: number, cabinet: CabinetConfig) => {
    setCabinets((prev) => {
      const updated = [...prev]
      updated[index] = cabinet
      return updated
    })
  }

  const handleSurfaceChange = (index: number, surface: SurfaceConfig) => {
    setSurfaces((prev) => {
      const updated = [...prev]
      updated[index] = surface
      return updated
    })
  }

  const handleAddonChange = (index: number, addon: AddonConfig) => {
    setAddons((prev) => {
      const updated = [...prev]
      updated[index] = addon
      return updated
    })
  }

  const handleIslandChange = (updatedIsland: IslandConfig) => {
    setIsland(updatedIsland)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading pricing data...</h2>
          <p className="text-gray-500">Please wait while we fetch the latest pricing information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Handle Type</h2>
              <RadioGroup
                value={handle_type}
                onValueChange={(value) => setHandleType(value as string)}
                className="flex space-x-4"
              >
                {handleTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.name} id={type.name} />
                    <Label htmlFor={type.name}>{type.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="cabinets">Cabinets</TabsTrigger>
                <TabsTrigger value="surfaces">Surfaces</TabsTrigger>
                <TabsTrigger value="addons">Add-ons</TabsTrigger>
                <TabsTrigger value="island">Island</TabsTrigger>
              </TabsList>

              <TabsContent value="cabinets" className="space-y-6">
                {cabinets.map((cabinet, index) => (
                  <CabinetSection
                    key={cabinet.name}
                    cabinet={cabinet}
                    onChange={(updated) => handleCabinetChange(index, updated)}
                    pricingData={cabinetPricing}
                  />
                ))}
              </TabsContent>

              <TabsContent value="surfaces" className="space-y-6">
                {surfaces.map((surface, index) => (
                  <SurfaceSection
                    key={surface.name}
                    surface={surface}
                    onChange={(updated) => handleSurfaceChange(index, updated)}
                    pricingData={surfacePricing}
                  />
                ))}
              </TabsContent>

              <TabsContent value="addons" className="space-y-6">
                {addons
                  .filter((addon) => addon.name !== "TRANSFORMER")
                  .map((addon, index) => (
                    <AddonSection
                      key={addon.name}
                      addon={addon}
                      onChange={(updated) => handleAddonChange(index, updated)}
                      pricingData={addonPricing}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="island" className="space-y-6">
                <IslandSection
                  island={island}
                  onChange={handleIslandChange}
                  cabinetPricing={cabinetPricing}
                  surfacePricing={surfacePricing}
                  addonPricing={addonPricing}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowCustomerForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                Save Quote
              </Button>
            </div>
          </CardContent>
        </Card>

        {showCustomerForm && (
          <CustomerForm config={config} pricingSummary={pricingSummary} onClose={() => setShowCustomerForm(false)} />
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <PriceSummary pricingSummary={pricingSummary} />
        </div>
      </div>
    </div>
  )
}
