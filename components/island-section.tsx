"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { IslandConfig, SurfaceConfig, AddonConfig, CabinetConfig } from "@/lib/calculator"
import type { CabinetPricing, SurfacePricing, AddonPricing, HandleType, AddonDependency } from "@/lib/supabase"
import { calculateCabinetPrice, calculateSurfacePrice, calculateAddonPrice } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle, CardControlRow } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SqftMeasurement } from "@/components/measurements/sqft-measurement"
import { LinearMeasurement } from "@/components/measurements/linear-measurement"
import { QuantityMeasurement } from "@/components/measurements/quantity-measurement"
import { NumberFlowSlider } from "@/components/ui/number-flow-slider"
import { Button } from "@/components/ui/button"
import { CabinetSection } from "./cabinet-section"

// Define valid material types instead of using string
type MaterialType = "laminate" | "fenix" | "porcelain" | "quartz" | "stainless" | "glass_matte" | "granite";

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
  const [counterTopWidth, setCounterTopWidth] = useState(1) // Width in feet
  const [counterTopLength, setCounterTopLength] = useState(1) // Length in feet
  const [waterfallWidth, setWaterfallWidth] = useState(1) // Width in feet
  const [waterfallLength, setWaterfallLength] = useState(1) // Length in feet
  const [counterTopInitialized, setCounterTopInitialized] = useState(false);
  const [waterfallInitialized, setWaterfallInitialized] = useState(false);
  const [useCounterTopDetailedDimensions, setUseCounterTopDetailedDimensions] = useState(false);
  const [useWaterfallDetailedDimensions, setUseWaterfallDetailedDimensions] = useState(false);

  // Materials for surface selection with proper typing
  const materials: MaterialType[] = ["laminate", "fenix", "porcelain", "quartz", "stainless", "glass_matte", "granite"];
  const materialLabels: Record<MaterialType, string> = {
    laminate: "Laminate",
    fenix: "Fenix",
    porcelain: "Porcelain",
    quartz: "Quartz",
    stainless: "Stainless Steel",
    glass_matte: "Glass Matte",
    granite: "Granite"
  }

  // Generate island cabinets from cabinetPricing data
  const [islandCabinets, setIslandCabinets] = useState<CabinetConfig[]>([]);

  // Initialize island cabinets on mount
  useEffect(() => {
    // Create cabinet configs for any cabinets with area="kitchen-island"
    const uniqueCabinets = new Set<string>();
    const cabinetConfigs: CabinetConfig[] = [];

    cabinetPricing.forEach(cabinet => {
      if (cabinet.area === "kitchen-island" && (cabinet.handle_type === island.handle_type || cabinet.handle_type.toLowerCase() === "none")) {
        const key = `${cabinet.name}-${cabinet.area}-${cabinet.room_name}-${cabinet.measurement_type}-${cabinet.handle_type}`;
        if (!uniqueCabinets.has(key)) {
          uniqueCabinets.add(key);
          
          const newCabinetConfig: CabinetConfig = {
            name: cabinet.name,
            area: cabinet.area,
            room_name: cabinet.room_name,
            measurement_type: cabinet.measurement_type,
            handle_type: cabinet.handle_type,
            priceLevel: island.priceLevel,
            linearFeet: 0, // Default value
            strEnabled: false
          };

          cabinetConfigs.push(newCabinetConfig);
        }
      }
    });

    setIslandCabinets(cabinetConfigs);
    
    // Update the island config with the new island cabinets
    onChange({
      ...island,
      islandCabinets: cabinetConfigs
    });
  }, [cabinetPricing, island.handle_type, island.priceLevel]);

  // Generate island surfaces from surfacePricing data
  const [islandSurfaces, setIslandSurfaces] = useState<SurfaceConfig[]>([]);

  // Initialize island surfaces on mount
  useEffect(() => {
    // Create surface configs for any surfaces with area="kitchen-island" that aren't already handled
    const uniqueSurfaces = new Set<string>();
    const surfaceConfigs: SurfaceConfig[] = [];

    surfacePricing.forEach(surface => {
      if (surface.area === "kitchen-island") {
        // Skip Counter Top and Waterfall as they are already handled by the island object
        if (surface.name === "Counter Top" || surface.name === "Waterfall") {
          return;
        }
        
        const key = `${surface.name}-${surface.area}-${surface.measurement_type}`;
        if (!uniqueSurfaces.has(key)) {
          uniqueSurfaces.add(key);
          
          // Ensure material is typed correctly
          const newSurfaceConfig: SurfaceConfig = {
            name: surface.name,
            area: surface.area,
            measurement_type: surface.measurement_type,
            material: "laminate", // Default material
            squareFeet: 1 // Default value
          };

          surfaceConfigs.push(newSurfaceConfig);
        }
      }
    });

    setIslandSurfaces(surfaceConfigs);
  }, [surfacePricing]);

  // Initialize countertop with proper values when component mounts
  useEffect(() => {
    console.log("Initializing counter top with surfacePricing:", surfacePricing);
    
    // Find a matching entry in surfacePricing for counter top in kitchen-island
    const counterTopPricing = surfacePricing.filter(p => 
      p.area === "kitchen-island" && 
      (p.name.toLowerCase().includes("counter") || p.name.toLowerCase().includes("countertop"))
    );
    
    console.log("Found potential counter top pricing entries:", counterTopPricing);
    
    // If we don't have a properly configured counter top or it has invalid values
    if (!island.counterTop.material || !island.counterTop.squareFeet || island.counterTop.squareFeet <= 0) {
      // Use the first matching counter top pricing entry if available
      const matchingPricing = counterTopPricing.length > 0 ? counterTopPricing[0] : null;
      
      console.log("Using counter top pricing data:", matchingPricing);
      
      // Create a proper counter top with defaults or matching values
      const updatedIsland = {
        ...island,
        counterTop: {
          ...island.counterTop,
          name: matchingPricing ? matchingPricing.name : "Counter Top",
          area: matchingPricing ? matchingPricing.area : "kitchen-island",
          measurement_type: matchingPricing ? matchingPricing.measurement_type : "Per SQFT",
          material: island.counterTop.material || "laminate", // Default to laminate if not set
          squareFeet: island.counterTop.squareFeet || 1 // Default to 1 sqft if not set
        }
      };
      
      console.log("Updated island config with proper counter top:", updatedIsland.counterTop);
      
      // Update island configuration
      onChange(updatedIsland);
      
      // Initialize dimension state variables
      setCounterTopWidth(Math.sqrt(updatedIsland.counterTop.squareFeet));
      setCounterTopLength(Math.sqrt(updatedIsland.counterTop.squareFeet));
      setCounterTopInitialized(true);
    }
  }, [surfacePricing]);

  // Calculate prices whenever relevant properties change
  useEffect(() => {
    if (!island.enabled) {
      setTotalPrice(0);
      return;
    }
    
    console.log("Calculating island prices with:", { 
      island,
      surfacePricing,
      cabinetPricing,
      islandCabinets
    });

    // Calculate all prices from all island cabinets
    let totalCabinetPrice = 0;
    
    // Use the islandCabinets state instead of creating a new cabinet object
    if (islandCabinets && islandCabinets.length > 0) {
      islandCabinets.forEach(cabinet => {
        if ((cabinet.measurement_type === "Linear FT" || cabinet.measurement_type === "Per SQFT") && 
            (!cabinet.linearFeet || cabinet.linearFeet <= 0)) {
          console.log(`Skipping island cabinet ${cabinet.name} - has zero or undefined measurements`);
          return;
        } else if (cabinet.measurement_type === "Per Piece" && (!cabinet.quantity || cabinet.quantity <= 0)) {
          console.log(`Skipping island cabinet ${cabinet.name} - has zero or undefined measurements`);
          return;
        }
        
        const cabPrice = calculateCabinetPrice(cabinet, cabinetPricing, cabinet.priceLevel);
        console.log(`Island Cabinet ${cabinet.name} calculated price: ${cabPrice}`);
        totalCabinetPrice += cabPrice;
      });
    }
    
    // Calculate counter top price - make sure it has square feet
    let ctopPrice = 0;
    if (island.counterTop && island.counterTop.squareFeet > 0) {
      ctopPrice = calculateSurfacePrice(island.counterTop, surfacePricing);
      console.log(`Island Counter Top price: ${ctopPrice} (${island.counterTop.squareFeet} sqft of ${island.counterTop.material})`);
    }
    
    // Calculate waterfall price
    let wfPrice = 0;
    if (island.waterfall && island.waterfall.squareFeet > 0) {
      wfPrice = calculateSurfacePrice(island.waterfall, surfacePricing);
      console.log(`Island Waterfall price: ${wfPrice} (${island.waterfall.squareFeet} sqft of ${island.waterfall.material})`);
    }
    
    // Calculate aluminum profiles price
    let alProfilesPrice = 0;
    if (island.aluminumProfiles?.enabled && island.aluminumProfiles?.linearFeet) {
      alProfilesPrice = calculateAddonPrice(island.aluminumProfiles, addonPricing, addonDependencies);
      console.log(`Island Aluminum Profiles price: ${alProfilesPrice}`);
    }
    
    // Calculate aluminum toe kicks price
    let alToeKicksPrice = 0;
    if (island.aluminumToeKicks?.enabled && island.aluminumToeKicks?.linearFeet) {
      alToeKicksPrice = calculateAddonPrice(island.aluminumToeKicks, addonPricing, addonDependencies);
      console.log(`Island Aluminum Toe Kicks price: ${alToeKicksPrice}`);
    }
    
    // Calculate integrated sink price
    let intSinkPrice = 0;
    if (island.integratedSink && island.integratedSink.quantity && island.integratedSink.quantity > 0) {
      intSinkPrice = calculateAddonPrice(island.integratedSink, addonPricing, addonDependencies);
      console.log(`Island Integrated Sink price: ${intSinkPrice}`);
    }
    
    // Update all prices in state
    setCabinetPrice(totalCabinetPrice);
    setCounterTopPrice(ctopPrice);
    setWaterfallPrice(wfPrice);
    setAluminumProfilesPrice(alProfilesPrice);
    setAluminumToeKicksPrice(alToeKicksPrice);
    setIntegratedSinkPrice(intSinkPrice);
    
    // Calculate total price for island
    const total = totalCabinetPrice + ctopPrice + wfPrice + alProfilesPrice + alToeKicksPrice + intSinkPrice;
    console.log(`Total island price: ${total}`);
    setTotalPrice(total);
    
  }, [
    island.enabled, 
    island.counterTop, 
    island.waterfall, 
    island.aluminumProfiles, 
    island.aluminumToeKicks, 
    island.integratedSink,
    islandCabinets,
    cabinetPricing,
    surfacePricing,
    addonPricing
  ]);

  const handleHandleTypeChange = (value: string) => {
    // Reinitialize island cabinets for the new handle type
    const uniqueCabinets = new Set<string>();
    const cabinetConfigs: CabinetConfig[] = [];

    cabinetPricing.forEach(cabinet => {
      if (cabinet.area === "kitchen-island" && (cabinet.handle_type === value || cabinet.handle_type.toLowerCase() === "none")) {
        const key = `${cabinet.name}-${cabinet.area}-${cabinet.room_name}-${cabinet.measurement_type}-${cabinet.handle_type}`;
        if (!uniqueCabinets.has(key)) {
          uniqueCabinets.add(key);
          
          const newCabinetConfig: CabinetConfig = {
            name: cabinet.name,
            area: cabinet.area,
            room_name: cabinet.room_name,
            measurement_type: cabinet.measurement_type,
            handle_type: cabinet.handle_type,
            priceLevel: island.priceLevel,
            linearFeet: 1, // Default value
            strEnabled: false
          };

          cabinetConfigs.push(newCabinetConfig);
        }
      }
    });

    setIslandCabinets(cabinetConfigs);
    
    // Update the island config with the new handle type and island cabinets
    onChange({
      ...island,
      handle_type: value,
      islandCabinets: cabinetConfigs
    });
  }

  const handlePriceLevelChange = (value: string) => {
    const newPriceLevel = Number.parseInt(value);
    
    // Update all island cabinets with the new price level
    const updatedIslandCabinets = islandCabinets.map(cabinet => ({
      ...cabinet,
      priceLevel: newPriceLevel
    }));
    
    setIslandCabinets(updatedIslandCabinets);
    
    // Update the island config with the new price level and updated island cabinets
    onChange({
      ...island,
      priceLevel: newPriceLevel,
      islandCabinets: updatedIslandCabinets
    });
  }

  const handleCounterTopMaterialChange = (value: MaterialType) => {
    // First, ensure we have the correct counter top config that matches pricing data
    const counterTopPricing = surfacePricing.filter(p => 
      p.area === "kitchen-island" && 
      (p.name.toLowerCase().includes("counter") || p.name.toLowerCase().includes("countertop"))
    );
    
    // Use the first matching counter top pricing entry if available
    const matchingPricing = counterTopPricing.length > 0 ? counterTopPricing[0] : null;
    
    // Update counter top material
    const updatedIsland = {
      ...island,
      counterTop: {
        ...island.counterTop,
        // If we found a matching pricing entry, use its exact name, area, and measurement_type
        ...(matchingPricing ? {
          name: matchingPricing.name,
          area: matchingPricing.area,
          measurement_type: matchingPricing.measurement_type
        } : {}),
        material: value,
      }
    };
    
    // If waterfall exists, update waterfall material to match counter top
    if (updatedIsland.waterfall) {
      updatedIsland.waterfall = {
        ...updatedIsland.waterfall,
        material: value,
      };
    }
    
    onChange(updatedIsland);
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

  // Handler for slider component
  const handleCounterTopSliderChange = (value: number[]) => {
    const newArea = value[0];
    const newDimension = Math.sqrt(newArea);
    setCounterTopWidth(newDimension);
    setCounterTopLength(newDimension);
    
    // Find matching pricing entry
    const counterTopPricing = surfacePricing.filter(p => 
      p.area === "kitchen-island" && 
      (p.name.toLowerCase().includes("counter") || p.name.toLowerCase().includes("countertop"))
    );
    const matchingPricing = counterTopPricing.length > 0 ? counterTopPricing[0] : null;
    
    onChange({ 
      ...island, 
      counterTop: { 
        ...island.counterTop, 
        ...(matchingPricing ? {
          name: matchingPricing.name,
          area: matchingPricing.area,
          measurement_type: matchingPricing.measurement_type
        } : {}),
        squareFeet: newArea 
      } 
    });
  }

  // Handler for direct square footage input
  const handleCounterTopAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...island,
        counterTop: {
          ...island.counterTop,
          squareFeet: value
        }
      });
    }
  }

  const handleWaterfallAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      onChange({
        ...island,
        waterfall: {
          ...island.waterfall!,
          squareFeet: value
        }
      });
    }
  }

  const handleWaterfallEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      waterfall: checked
        ? {
            name: "Waterfall",
            area: "kitchen-island",
            measurement_type: "Per SQFT",
            material: island.counterTop.material,
            squareFeet: 1,
          }
        : undefined,
    })
  }

  const handleAluminumProfilesEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      aluminumProfiles: {
        ...island.aluminumProfiles!,
        enabled: checked,
      },
    });
  };

  const handleAluminumToeKicksEnabledChange = (checked: boolean) => {
    onChange({
      ...island,
      aluminumToeKicks: {
        ...island.aluminumToeKicks!,
        enabled: checked,
      },
    });
  };

  const handleAluminumProfilesLinearFeetChange = (value: number) => {
    onChange({
      ...island,
      aluminumProfiles: {
        ...island.aluminumProfiles!,
        linearFeet: value,
      },
    });
  };

  const handleAluminumToeKicksLinearFeetChange = (value: number) => {
    onChange({
      ...island,
      aluminumToeKicks: {
        ...island.aluminumToeKicks!,
        linearFeet: value,
      },
    });
  };

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

  const handleCounterTopWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number.parseFloat(e.target.value);
    if (!isNaN(newWidth) && newWidth >= 0) {
      setCounterTopWidth(newWidth);
      // Calculate new area from width and length
      const newArea = newWidth * counterTopLength;
      onChange({
        ...island,
        counterTop: {
          ...island.counterTop,
          squareFeet: newArea
        }
      });
    }
  }

  const handleCounterTopLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Number.parseFloat(e.target.value);
    if (!isNaN(newLength) && newLength >= 0) {
      setCounterTopLength(newLength);
      // Calculate new area from width and length
      const newArea = counterTopWidth * newLength;
      onChange({
        ...island,
        counterTop: {
          ...island.counterTop,
          squareFeet: newArea
        }
      });
    }
  }

  const handleWaterfallWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number.parseFloat(e.target.value);
    if (!isNaN(newWidth) && newWidth >= 0) {
      setWaterfallWidth(newWidth);
      // Calculate new area from width and length
      const newArea = newWidth * waterfallLength;
      onChange({
        ...island,
        waterfall: {
          ...island.waterfall!,
          squareFeet: newArea
        }
      });
    }
  }

  const handleWaterfallLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Number.parseFloat(e.target.value);
    if (!isNaN(newLength) && newLength >= 0) {
      setWaterfallLength(newLength);
      // Calculate new area from width and length
      const newArea = waterfallWidth * newLength;
      onChange({
        ...island,
        waterfall: {
          ...island.waterfall!,
          squareFeet: newArea
        }
      });
    }
  }

  // Handler for island cabinet changes
  const handleIslandCabinetChange = (index: number, updatedCabinet: CabinetConfig) => {
    const newIslandCabinets = [...islandCabinets];
    newIslandCabinets[index] = updatedCabinet;
    setIslandCabinets(newIslandCabinets);
    
    // Update the island config with the new island cabinets
    onChange({
      ...island,
      islandCabinets: newIslandCabinets
    });
    
    // This will trigger the useEffect that calculates prices
  }

  // Handler for island surface changes
  const handleIslandSurfaceChange = (index: number, updatedSurface: SurfaceConfig) => {
    const newIslandSurfaces = [...islandSurfaces];
    newIslandSurfaces[index] = updatedSurface;
    setIslandSurfaces(newIslandSurfaces);
    
    // This will trigger price recalculation if needed
  }

  return (
    <div className="px-4 py-2 space-y-4">
      {/* Island Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Island Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <CardControlRow
            dropdownSection={
              <div className="space-y-2">
                <Label htmlFor="island-handle-type">Handle Type</Label>
                <Select value={island.handle_type} onValueChange={handleHandleTypeChange}>
                  <SelectTrigger id="island-handle-type">
                    <SelectValue placeholder="Select handle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {handleTypes &&
                      handleTypes
                        .filter(type => type.name.toLowerCase() !== "none")
                        .map((type) => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            }
            numberSection={
              <div className="space-y-2">
                <Label htmlFor="island-price-level">Price Level</Label>
                <Select value={island.priceLevel.toString()} onValueChange={handlePriceLevelChange}>
                  <SelectTrigger id="island-price-level">
                    <SelectValue placeholder="Select level" />
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
            }
          />
        </CardContent>
      </Card>

      {/* Island Cabinets */}
      {islandCabinets.length > 0 ? (
        islandCabinets.map((cabinet, idx) => (
          <CabinetSection
            key={`${cabinet.name}-${cabinet.area}-${cabinet.room_name}-${cabinet.measurement_type}-${cabinet.handle_type}`}
            cabinet={cabinet}
            onChange={(updated) => handleIslandCabinetChange(idx, updated)}
            pricingData={cabinetPricing}
          />
        ))
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="text-center text-gray-500">No island cabinets available for selected handle type</div>
          </CardContent>
        </Card>
      )}
      
      {/* Counter Top Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Counter Top</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <CardControlRow
              dropdownSection={
                <div className="space-y-2">
                  <Label htmlFor="counter-top-material">Material</Label>
                  <Select value={island.counterTop.material} onValueChange={handleCounterTopMaterialChange}>
                    <SelectTrigger id="counter-top-material">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(materialLabels).map(([material, label]) => (
                        <SelectItem key={material} value={material}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
              numberSection={
                <div className="space-y-2">
                  <Label htmlFor="counter-top-sqft-input">SQFT</Label>
                  <Input
                    id="counter-top-sqft-input"
                    type="number"
                    value={island.counterTop.squareFeet}
                    onChange={handleCounterTopAreaInputChange}
                    className="text-right"
                    min={0}
                    step={0.1}
                    disabled={useCounterTopDetailedDimensions}
                  />
                </div>
              }
            />

            <div className="flex items-center justify-between mt-4">
              <Label htmlFor="counter-top-detailed-toggle" className="text-sm">
                Enter width and length
              </Label>
              <Switch
                id="counter-top-detailed-toggle"
                checked={useCounterTopDetailedDimensions}
                onCheckedChange={setUseCounterTopDetailedDimensions}
              />
            </div>

            {useCounterTopDetailedDimensions && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="counter-top-width">Width (ft)</Label>
                  <Input
                    id="counter-top-width"
                    type="number"
                    value={counterTopWidth}
                    onChange={handleCounterTopWidthChange}
                    className="text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="counter-top-length">Length (ft)</Label>
                  <Input
                    id="counter-top-length"
                    type="number"
                    value={counterTopLength}
                    onChange={handleCounterTopLengthChange}
                    className="text-right"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 text-right">
              <div className="text-sm text-gray-500">Counter Top Price</div>
              <div className="text-xl font-bold">${counterTopPrice.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Waterfall Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Waterfall</CardTitle>
            <Switch 
              id="waterfall-enabled" 
              checked={!!island.waterfall} 
              onCheckedChange={handleWaterfallEnabledChange} 
            />
          </div>
        </CardHeader>
        {island.waterfall && (
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Material</Label>
                <div className="text-sm text-gray-500 mb-2">
                  Material is synced with Counter Top: {materialLabels[island.waterfall.material as MaterialType]}
                </div>
              </div>

              <CardControlRow
                numberSection={
                  <div className="space-y-2">
                    <Label htmlFor="waterfall-sqft-input">SQFT</Label>
                    <Input
                      id="waterfall-sqft-input"
                      type="number"
                      value={island.waterfall.squareFeet}
                      onChange={handleWaterfallAreaInputChange}
                      className="text-right"
                      min={0}
                      step={0.1}
                      disabled={useWaterfallDetailedDimensions}
                    />
                  </div>
                }
              />

              <div className="flex items-center justify-between mt-4">
                <Label htmlFor="waterfall-detailed-toggle" className="text-sm">
                  Enter width and length
                </Label>
                <Switch
                  id="waterfall-detailed-toggle"
                  checked={useWaterfallDetailedDimensions}
                  onCheckedChange={setUseWaterfallDetailedDimensions}
                />
              </div>

              {useWaterfallDetailedDimensions && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="waterfall-width">Width (ft)</Label>
                    <Input
                      id="waterfall-width"
                      type="number"
                      value={waterfallWidth}
                      onChange={handleWaterfallWidthChange}
                      className="text-right"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waterfall-length">Length (ft)</Label>
                    <Input
                      id="waterfall-length"
                      type="number"
                      value={waterfallLength}
                      onChange={handleWaterfallLengthChange}
                      className="text-right"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 text-right">
                <div className="text-sm text-gray-500">Waterfall Price</div>
                <div className="text-xl font-bold">${waterfallPrice.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Aluminum Components Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Aluminum Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Aluminum Profiles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="aluminum-profiles-enabled"
                    checked={island.aluminumProfiles?.enabled || false}
                    onCheckedChange={handleAluminumProfilesEnabledChange}
                  />
                  <Label htmlFor="aluminum-profiles-enabled" className="font-medium">
                    Aluminum Profiles
                  </Label>
                </div>
                {island.aluminumProfiles?.enabled && (
                  <div className="text-sm text-right font-medium text-primary">
                    ${aluminumProfilesPrice.toFixed(2)}
                  </div>
                )}
              </div>
              
              {island.aluminumProfiles?.enabled && (
                <CardControlRow
                  numberSection={
                    <div className="space-y-2">
                      <Label htmlFor="aluminum-profiles-measurement-input">Value</Label>
                      <Input
                        id="aluminum-profiles-measurement-input"
                        type="number"
                        value={island.aluminumProfiles.linearFeet || 0}
                        onChange={(e) => {
                          const value = Number.parseFloat(e.target.value);
                          if (!isNaN(value) && value >= 0) {
                            handleAluminumProfilesLinearFeetChange(value);
                          }
                        }}
                        className="text-right"
                        min={0}
                        step={0.1}
                      />
                    </div>
                  }
                />
              )}
            </div>

            {/* Aluminum Toe Kicks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="aluminum-toe-kicks-enabled"
                    checked={island.aluminumToeKicks?.enabled || false}
                    onCheckedChange={handleAluminumToeKicksEnabledChange}
                  />
                  <Label htmlFor="aluminum-toe-kicks-enabled" className="font-medium">
                    Aluminum Toe Kicks
                  </Label>
                </div>
                {island.aluminumToeKicks?.enabled && (
                  <div className="text-sm text-right font-medium text-primary">
                    ${aluminumToeKicksPrice.toFixed(2)}
                  </div>
                )}
              </div>
              
              {island.aluminumToeKicks?.enabled && (
                <CardControlRow
                  numberSection={
                    <div className="space-y-2">
                      <Label htmlFor="aluminum-toe-kicks-measurement-input">Value</Label>
                      <Input
                        id="aluminum-toe-kicks-measurement-input"
                        type="number"
                        value={island.aluminumToeKicks.linearFeet || 0}
                        onChange={(e) => {
                          const value = Number.parseFloat(e.target.value);
                          if (!isNaN(value) && value >= 0) {
                            handleAluminumToeKicksLinearFeetChange(value);
                          }
                        }}
                        className="text-right"
                        min={0}
                        step={0.1}
                      />
                    </div>
                  }
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrated Sink Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Integrated Sink</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch 
                id="integrated-sink-enabled"
                checked={island.integratedSink?.enabled || false}
                onCheckedChange={handleIntegratedSinkEnabledChange}
              />
              <Label htmlFor="integrated-sink-enabled" className="font-medium">
                Include Integrated Sink
              </Label>
            </div>
            {island.integratedSink?.enabled && (
              <div className="text-sm text-right font-medium text-primary">
                ${integratedSinkPrice.toFixed(2)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Price */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Total Island Price</div>
            <div className="text-2xl font-bold">${totalPrice.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
