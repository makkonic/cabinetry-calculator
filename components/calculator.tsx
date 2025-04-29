"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CabinetSection } from "./cabinet-section"
import { SurfaceSection } from "./surface-section"
import { AddonSection } from "./addon-section"
import { IslandSection } from "./island-section"
import { PriceSummary } from "./price-summary"
import { CustomerForm } from "./customer-form"
import { useSettings } from "@/contexts/settings-context"
import { SettingsPanel } from "./settings-panel"
import {
  getCabinetPricing,
  getSurfacePricing,
  getAddonPricing,
  getAddonDependencies,
  getAreas,
  getMeasurementTypes,
  getHandleTypes,
  getRooms,
  type CabinetPricing,
  type SurfacePricing,
  type AddonPricing,
  type AddonDependency,
  type Area,
  type MeasurementType,
  type HandleType,
  type Room,
} from "@/lib/supabase"
import {
  type CalculatorConfig,
  type CabinetConfig,
  type SurfaceConfig,
  type AddonConfig,
  type IslandConfig,
  calculateTotalPrice,
  findAddonDependencies,
} from "@/lib/calculator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Calculator() {
  // Reference data
  const [areas, setAreas] = useState<Area[]>([])
  const [measurementTypes, setMeasurementTypes] = useState<MeasurementType[]>([])
  const [handleTypes, setHandleTypes] = useState<HandleType[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  
  // Pricing data
  const [cabinetPricing, setCabinetPricing] = useState<CabinetPricing[]>([])
  const [surfacePricing, setSurfacePricing] = useState<SurfacePricing[]>([])
  const [addonPricing, setAddonPricing] = useState<AddonPricing[]>([])
  const [addonDependencies, setAddonDependencies] = useState<AddonDependency[]>([])
  const [loading, setLoading] = useState(true)

  const [handle_type, setHandleType] = useState<string>("Handles")
  const [globalPriceLevel, setGlobalPriceLevel] = useState<number>(0)
  const [cabinets, setCabinets] = useState<CabinetConfig[]>([])

  const [surfaces, setSurfaces] = useState<SurfaceConfig[]>([
    { name: "Countertop", area: "kitchen-surfaces", measurement_type: "Per SQFT", material: "laminate", squareFeet: 0 },
    { name: "Backsplash", area: "kitchen-surfaces", measurement_type: "Per SQFT", material: "laminate", squareFeet: 0 },
  ])

  const [addons, setAddons] = useState<AddonConfig[]>([
    { name: "Aluminum Profiles", area: "kitchen", measurement_type: "Linear FT", linearFeet: 0 },
    { name: "Aluminum Toe Kicks", area: "kitchen", measurement_type: "Linear FT", linearFeet: 0 },
    { name: "LED Lighting", area: "kitchen", measurement_type: "Linear FT", linearFeet: 0 },
    { name: "Transformer", area: "kitchen", measurement_type: "Per Piece", quantity: 0 },
    { name: "Integrated Sink", area: "kitchen", measurement_type: "Per Piece", quantity: 0 },
    { name: "Power Strip", area: "kitchen", measurement_type: "Per Piece", quantity: 0 },
  ])

  const [island, setIsland] = useState<IslandConfig>({
    enabled: true,
    handle_type: "Handles",
    room_name: "Kitchen",
    priceLevel: 0,
    counterTop: {
      name: "Counter Top",
      area: "kitchen-island",
      measurement_type: "Per SQFT",
      material: "laminate",
      squareFeet: 0,
    },
    waterfall: { 
      name: "Waterfall", 
      area: "kitchen-island", 
      measurement_type: "Per SQFT", 
      material: "laminate", 
      squareFeet: 0 
    },
    aluminumProfiles: {
      name: "Aluminum Profiles",
      area: "kitchen-island",
      measurement_type: "Linear FT",
      linearFeet: 0,
      enabled: false
    },
    aluminumToeKicks: {
      name: "Aluminum Toe Kicks",
      area: "kitchen-island", 
      measurement_type: "Linear FT",
      linearFeet: 0,
      enabled: false
    }
  })

  const [activeTab, setActiveTab] = useState("kitchen")
  const [activeKitchenTab, setActiveKitchenTab] = useState("cabinets")
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  const { contingencyRate, tariffRate } = useSettings();

  // Generate cabinet configs from cabinet pricing data
  const generateCabinetConfigs = (cabinetPricingData: CabinetPricing[], selectedHandleType: string) => {
    // Create a set of unique combinations of name, area, and measurement_type
    const uniqueCabinets = new Set<string>()
    const cabinetConfigs: CabinetConfig[] = []

    // Log the cabinet pricing data to debug
    console.log("Cabinet Pricing Data:", cabinetPricingData)
    console.log("Selected Handle Type:", selectedHandleType)

    // If no data, return empty array
    if (!cabinetPricingData || cabinetPricingData.length === 0) {
      console.log("No cabinet pricing data found")
      return []
    }

    cabinetPricingData.forEach(cabinet => {
      // Include cabinets that either:
      // 1. Match the selected handle type, OR
      // 2. Have handle_type of "none" (should show regardless of selection)
      if (cabinet.handle_type === selectedHandleType || cabinet.handle_type.toLowerCase() === "none") {
        const key = `${cabinet.name}-${cabinet.area}-${cabinet.room_name}-${cabinet.measurement_type}-${cabinet.handle_type}`
        if (!uniqueCabinets.has(key)) {
          uniqueCabinets.add(key)
          
          const newCabinetConfig: CabinetConfig = {
            name: cabinet.name,
            area: cabinet.area,
            room_name: cabinet.room_name,
            measurement_type: cabinet.measurement_type,
            handle_type: cabinet.handle_type, 
            priceLevel: globalPriceLevel,
            strEnabled: false
          }

          // Add the appropriate measurement field based on measurement type with initial value of 0
          if (cabinet.measurement_type === "Linear FT" || cabinet.measurement_type === "Per SQFT") {
            newCabinetConfig.linearFeet = 0  // Start with 0 linear feet
          } else {
            newCabinetConfig.quantity = 0  // Start with 0 pieces
          }

          cabinetConfigs.push(newCabinetConfig)
        }
      }
    })

    console.log("Generated Cabinet Configs:", cabinetConfigs)
    return cabinetConfigs
  }

  // Generate surface configs from surface pricing data
  const generateSurfaceConfigs = (surfacePricingData: SurfacePricing[]) => {
    // Create a set of unique combinations of name, area, and measurement_type
    const uniqueSurfaces = new Set<string>()
    const surfaceConfigs: SurfaceConfig[] = []

    // Log the surface pricing data to debug
    console.log("Surface Pricing Data:", surfacePricingData)

    // If no data, return empty array
    if (!surfacePricingData || surfacePricingData.length === 0) {
      console.log("No surface pricing data found")
      return []
    }

    // Filter for kitchen surfaces (looking for both plural and singular forms)
    const kitchenSurfaces = surfacePricingData.filter(surface => 
      surface.area === "kitchen-surfaces" || surface.area === "kitchen-surface" || surface.area === "kitchen"
    );
    console.log("Kitchen Surfaces:", kitchenSurfaces);

    // Process all surfaces
    surfacePricingData.forEach(surface => {
      const key = `${surface.name}-${surface.area}-${surface.measurement_type}`
      if (!uniqueSurfaces.has(key)) {
        uniqueSurfaces.add(key)
        
        // Standardize the area name to kitchen-surfaces for consistency
        const standardizedArea = surface.area === "kitchen-surface" ? "kitchen-surfaces" : surface.area;
        
        const newSurfaceConfig: SurfaceConfig = {
          name: surface.name,
          area: standardizedArea,
          measurement_type: surface.measurement_type,
          material: "laminate", // Default material
          squareFeet: 0 // Default value of 0
        }

        surfaceConfigs.push(newSurfaceConfig)
      }
    })

    // If no kitchen surfaces were found using any naming convention, 
    // add default surfaces
    if (!surfaceConfigs.some(s => 
        s.area === "kitchen-surfaces" || 
        s.area === "kitchen-surface" || 
        s.area === "kitchen")) {
      // Add default surfaces if none exist in the database with the correct area
      const defaultSurfaces = [
        { 
          name: "Countertop", 
          area: "kitchen-surfaces", 
          measurement_type: "Per SQFT", 
          material: "laminate" as const, 
          squareFeet: 0 
        },
        { 
          name: "Backsplash", 
          area: "kitchen-surfaces", 
          measurement_type: "Per SQFT", 
          material: "laminate" as const, 
          squareFeet: 0 
        }
      ];
      
      defaultSurfaces.forEach(surface => {
        const key = `${surface.name}-${surface.area}-${surface.measurement_type}`;
        if (!uniqueSurfaces.has(key)) {
          uniqueSurfaces.add(key);
          surfaceConfigs.push(surface);
        }
      });
    }

    console.log("Generated Surface Configs:", surfaceConfigs)
    return surfaceConfigs
  }

  // Process addons with dependencies
  const processAddonsWithDependencies = (addonsData: AddonPricing[], dependencies: AddonDependency[]) => {
    // Create addon configs from the pricing data
    console.log("All addon data from database:", addonsData);
    return addonsData.map(addon => {
      // Create the base addon config
      const addonConfig: AddonConfig = {
        id: addon.id,
        name: addon.name,
        area: addon.area,
        measurement_type: addon.measurement_type,
        ...(addon.measurement_type === "Linear FT" || addon.measurement_type === "Per SQFT" 
          ? { linearFeet: 0 } 
          : { quantity: 0 })
      };
      
      // Find and add any dependencies
      addonConfig.dependentAddons = findAddonDependencies(addon.id, addonsData, dependencies);
      
      return addonConfig;
    }).filter(Boolean) as AddonConfig[];
  };

  const loadPricingData = useCallback(async () => {
    try {
      setLoading(true)
      console.log("🔄 Loading pricing data...")
      
      const [
        areasData,
        measurementTypesData,
        handleTypesData,
        roomsData,
        cabinetPricingData,
        surfacePricingData,
        addonPricingData,
        addonDependenciesData,
      ] = await Promise.all([
        getAreas(),
        getMeasurementTypes(),
        getHandleTypes(),
        getRooms(),
        getCabinetPricing(),
        getSurfacePricing(),
        getAddonPricing(),
        getAddonDependencies(),
      ])

      console.log("✅ Data loading complete:")
      console.log("Areas:", areasData.length)
      console.log("Measurement Types:", measurementTypesData.length)
      console.log("Handle Types:", handleTypesData.length)
      console.log("Rooms:", roomsData.length)
      console.log("Cabinet Pricing:", cabinetPricingData.length)
      console.log("Surface Pricing:", surfacePricingData.length)
      console.log("Addon Pricing:", addonPricingData.length, addonPricingData)
      console.log("Addon Dependencies:", addonDependenciesData.length)

      // Process addons with their dependencies
      const processedAddons = processAddonsWithDependencies(
        addonPricingData,
        addonDependenciesData
      )
      
      console.log("Processed Addons:", processedAddons.length)

      // Generate cabinet configurations
      const cabinetsWithHandleTypes = generateCabinetConfigs(cabinetPricingData, handle_type)
      
      console.log("Generated Cabinet Configurations:", cabinetsWithHandleTypes.length)

      // Generate surface configurations
      const surfaceConfigs = generateSurfaceConfigs(surfacePricingData)
      
      console.log("Generated Surface Configurations:", surfaceConfigs.length)

      setAreas(areasData)
      setMeasurementTypes(measurementTypesData)
      setHandleTypes(handleTypesData)
      setRooms(roomsData)
      setCabinetPricing(cabinetPricingData)
      setSurfacePricing(surfacePricingData)
      setAddonPricing(addonPricingData)
      setAddonDependencies(addonDependenciesData)
      setAddons(processedAddons)
      setCabinets(cabinetsWithHandleTypes)
      setSurfaces(surfaceConfigs)

      setLoading(false)
    } catch (error) {
      console.error("Error loading pricing data:", error)
      setLoading(false)
    }
  }, [])

  // Load pricing data
  useEffect(() => {
    loadPricingData()
  }, [loadPricingData])

  // Migrate old area names to new format if needed
  useEffect(() => {
    if (!loading && surfaces.length > 0) {
      // Check if we have any surfaces with the old area name "kitchen"
      const hasSurfacesWithOldAreaName = surfaces.some(s => s.area === "kitchen");
      
      if (hasSurfacesWithOldAreaName) {
        console.log("Migrating surfaces with area 'kitchen' to 'kitchen-surfaces'");
        
        // Update surfaces with the old area name
        setSurfaces(prev => prev.map(surface => {
          if (surface.area === "kitchen") {
            return {
              ...surface,
              area: "kitchen-surfaces"
            };
          }
          return surface;
        }));
      }
    }
  }, [loading, surfaces]);

  // Ensure pricing data is loaded
  useEffect(() => {
    if (!loading && (cabinetPricing.length === 0 || surfacePricing.length === 0 || addonPricing.length === 0)) {
      console.log("Missing pricing data detected. Reloading pricing data...");
      loadPricingData();
    }
  }, [loading, cabinetPricing.length, surfacePricing.length, addonPricing.length, loadPricingData]);

  // Update cabinets when handle type changes
  useEffect(() => {
    if (cabinetPricing.length > 0) {
      const newCabinetConfigs = generateCabinetConfigs(cabinetPricing, handle_type)
      setCabinets(newCabinetConfigs)
    }
  }, [handle_type, cabinetPricing])

  // Calculate transformer quantity based on LED lighting - using a ref to track previous value
  const prevLedFeetRef = useRef<number>(0);
  
  useEffect(() => {
    const ledLighting = addons.find((addon) => addon.name === "LED Lighting");
    const ledLinearFeet = ledLighting?.linearFeet || 0;
    
    // Only update if LED footage has changed to avoid infinite loops
    if (ledLinearFeet !== prevLedFeetRef.current) {
      prevLedFeetRef.current = ledLinearFeet;
      
      setAddons((prev) => {
        // Find transformer in previous state
        const transformerIndex = prev.findIndex(addon => addon.name === "Transformer");
        
        if (transformerIndex >= 0) {
          const updated = [...prev];
          
          if (ledLinearFeet > 0) {
            // Calculate transformers needed (1 per 3 feet)
            const transformerQuantity = Math.ceil(ledLinearFeet / 3);
            
            // Update transformer with quantity and enabled status
            updated[transformerIndex] = { 
              ...updated[transformerIndex], 
              quantity: transformerQuantity,
              enabled: true // Ensure it's enabled when LED lighting is used
            };
          } else {
            // No LED footage, set transformer to 0 and disabled
            updated[transformerIndex] = {
              ...updated[transformerIndex],
              quantity: 0,
              enabled: false // Disable when no LED lighting
            };
          }
          
          return updated;
        }
        
        return prev;
      });
    }
  }, [addons]); // Keep addons dependency, but use ref to avoid infinite loops

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

  const pricingSummary = calculateTotalPrice(
    config, 
    cabinetPricing, 
    surfacePricing, 
    addonPricing, 
    addonDependencies,
    contingencyRate,
    tariffRate
  )

  const handleGlobalPriceLevelChange = (value: string) => {
    const newPriceLevel = parseInt(value);
    setGlobalPriceLevel(newPriceLevel);
    
    // Update all cabinet price levels to match the global price level
    // without causing re-renders that would trigger the useEffect
    setCabinets(prev => {
      return prev.map(cabinet => ({
        ...cabinet,
        priceLevel: newPriceLevel
      }));
    });
  }

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

  console.log("Processed addons for UI:", addons);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Kitchen Cabinet Calculator</h2>
              <SettingsPanel />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-1 mb-6">
                <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
              </TabsList>

              <TabsContent value="kitchen" className="space-y-6">
                <Tabs value={activeKitchenTab} onValueChange={setActiveKitchenTab}>
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="cabinets">Cabinets</TabsTrigger>
                    <TabsTrigger value="surfaces">Surfaces</TabsTrigger>
                    <TabsTrigger value="island">Island</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cabinets" className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-3">Cabinet Settings</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Handle Type</Label>
                          <Select value={handle_type} onValueChange={(value) => setHandleType(value)}>
                            <SelectTrigger id="cabinet-handle-type">
                              <SelectValue placeholder="Select handle type" />
                            </SelectTrigger>
                            <SelectContent>
                              {handleTypes
                                .filter(type => type.name.toLowerCase() !== "none") // Filter out "none" as a selectable option
                                .map((type) => (
                                  <SelectItem key={type.name} value={type.name}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-2 block">Default Price Level</Label>
                          <Select value={globalPriceLevel.toString()} onValueChange={handleGlobalPriceLevelChange}>
                            <SelectTrigger id="global-price-level">
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
                    </div>

                    {cabinets.length === 0 ? (
                      <div className="text-center p-4">
                        <p>No cabinet options available for the selected handle type.</p>
                      </div>
                    ) : (
                      cabinets
                        .filter(cabinet => cabinet.room_name === "Kitchen" && cabinet.area !== "kitchen-island")
                        .sort((a, b) => {
                          // First sort by handle type to push "none" to the end
                          const isANone = a.handle_type.toLowerCase() === "none";
                          const isBNone = b.handle_type.toLowerCase() === "none";
                          
                          if (isANone && !isBNone) return 1; // A is "none", B is not, so B comes first
                          if (!isANone && isBNone) return -1; // A is not "none", B is "none", so A comes first
                          
                          // Then match the order of cabinet pricing data (based on ID or matching in pricingData)
                          const pricingA = cabinetPricing.find(p => 
                            p.name === a.name && 
                            p.area === a.area && 
                            p.room_name === a.room_name && 
                            p.measurement_type === a.measurement_type && 
                            p.handle_type === a.handle_type
                          );
                          
                          const pricingB = cabinetPricing.find(p => 
                            p.name === b.name && 
                            p.area === b.area && 
                            p.room_name === b.room_name && 
                            p.measurement_type === b.measurement_type && 
                            p.handle_type === b.handle_type
                          );
                          
                          // If we have pricing data for both, sort by ID/index in the pricing array
                          if (pricingA && pricingB) {
                            // Lower index in cabinetPricing means it was added more recently
                            const indexA = cabinetPricing.indexOf(pricingA);
                            const indexB = cabinetPricing.indexOf(pricingB);
                            return indexA - indexB;
                          }
                          
                          // If only one has pricing data, prioritize the one with data
                          if (pricingA && !pricingB) return -1;
                          if (!pricingA && pricingB) return 1;
                          
                          // Fallback to sorting by name if neither has pricing data
                          return a.name.localeCompare(b.name);
                        })
                        .map((cabinet, index) => {
                          const originalIndex = cabinets.findIndex(c => 
                            c.name === cabinet.name && 
                            c.area === cabinet.area && 
                            c.room_name === cabinet.room_name &&
                            c.measurement_type === cabinet.measurement_type &&
                            c.handle_type === cabinet.handle_type
                          );
                          return (
                            <CabinetSection
                              key={`${cabinet.name}-${cabinet.area}-${cabinet.room_name}-${cabinet.measurement_type}-${cabinet.handle_type}`}
                              cabinet={cabinet}
                              onChange={(updated) => handleCabinetChange(originalIndex, updated)}
                              pricingData={cabinetPricing}
                            />
                          );
                        })
                    )}

                    <h2 className="text-lg font-semibold mb-3 pt-4">Kitchen Add-ons</h2>
                    {addons
                      .filter((addon) => addon.area.toLowerCase() === "kitchen")
                      .map((addon, index) => {
                        const addonIndex = addons.findIndex(a => a.name === addon.name && a.area === addon.area);
                        return (
                          <AddonSection
                            key={`${addon.name}-${addon.area}-${addon.measurement_type}`}
                            addon={addon}
                            onChange={(updated) => handleAddonChange(addonIndex, updated)}
                            pricingData={addonPricing}
                            dependencies={addonDependencies}
                          />
                        );
                      })}
                  </TabsContent>

                  <TabsContent value="surfaces" className="space-y-6">
                    {surfaces
                      .filter(surface => surface.area === "kitchen-surfaces" || surface.area === "kitchen")
                      .map((surface, index) => {
                        const originalIndex = surfaces.findIndex(s => 
                          s.name === surface.name && 
                          (s.area === surface.area) && 
                          s.measurement_type === surface.measurement_type
                        );
                        return (
                          <SurfaceSection
                            key={`${surface.name}-${surface.area}-${surface.measurement_type}`}
                            surface={surface}
                            onChange={(updated) => handleSurfaceChange(originalIndex, updated)}
                            pricingData={surfacePricing}
                          />
                        );
                      })}
                    
                    <h2 className="text-lg font-semibold mb-3 pt-4">Surface Add-ons</h2>
                    {addons
                      .filter((addon) => (addon.area.toLowerCase() === "kitchen-surfaces" || addon.area.toLowerCase() === "kitchen-surface"))
                      .map((addon, index) => {
                        const addonIndex = addons.findIndex(a => a.name === addon.name && a.area === addon.area);
                        return (
                          <AddonSection
                            key={`${addon.name}-${addon.area}-${addon.measurement_type}`}
                            addon={addon}
                            onChange={(updated) => handleAddonChange(addonIndex, updated)}
                            pricingData={addonPricing}
                            dependencies={addonDependencies}
                          />
                        );
                      })}
                  </TabsContent>

                  <TabsContent value="island" className="space-y-6">
                    <IslandSection
                      island={island}
                      onChange={handleIslandChange}
                      cabinetPricing={cabinetPricing}
                      surfacePricing={surfacePricing}
                      addonPricing={addonPricing}
                      handleTypes={handleTypes}
                      addonDependencies={addonDependencies}
                    />
                  </TabsContent>
                </Tabs>
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
