import type { CabinetPricing, SurfacePricing, AddonPricing, AddonDependency } from "./supabase"

export type CabinetConfig = {
  name: string
  area: string
  room_name: string
  measurement_type: string
  handle_type: string
  linearFeet?: number
  quantity?: number
  priceLevel: number
  strEnabled: boolean
}

export type SurfaceConfig = {
  name: string
  area: string
  measurement_type: string
  material: "laminate" | "fenix" | "porcelain" | "quartz" | "stainless" | "glass_matte" | "granite"
  squareFeet: number
}

export type AddonConfig = {
  name: string
  area: string
  measurement_type: string
  linearFeet?: number
  quantity?: number
  id?: number
  dependentAddons?: AddonConfig[]
  enabled?: boolean
}

export type IslandConfig = {
  enabled: boolean
  handle_type: string
  room_name: string
  priceLevel: number
  islandCabinets?: CabinetConfig[]
  counterTop: SurfaceConfig
  waterfall?: SurfaceConfig
  aluminumProfiles?: AddonConfig
  aluminumToeKicks?: AddonConfig
  integratedSink?: AddonConfig
}

export type CalculatorConfig = {
  handle_type: string
  cabinets: CabinetConfig[]
  surfaces: SurfaceConfig[]
  addons: AddonConfig[]
  island?: IslandConfig
}

export type PricingSummary = {
  items: {
    name: string
    price: number
  }[]
  subtotal: number
  buffer: number
  tariff: number
  total: number
  tradePrice: number
  retailPrice1: number
  retailPrice2: number
}

export function calculateCabinetPrice(
  cabinet: CabinetConfig,
  cabinetPricing: CabinetPricing[],
  priceLevel: number = 0
): number {
  const room_name = cabinet.room_name || "Kitchen";
  
  const pricing = cabinetPricing.find(
    p => p.name === cabinet.name &&
         p.area === cabinet.area &&
         p.room_name === room_name &&
         p.measurement_type === cabinet.measurement_type &&
         (cabinet.handle_type ? p.handle_type === cabinet.handle_type : true)
  );
  
  if (!pricing) {
    return 0;
  }
  
  const priceKey = `price_level_${priceLevel}` as keyof typeof pricing;
  const basePrice = pricing[priceKey] as number;
  
  let finalPrice = 0;
  if (cabinet.measurement_type === "Linear FT" || cabinet.measurement_type === "Per SQFT") {
    finalPrice = basePrice * (cabinet.linearFeet || 0);
  } else {
    finalPrice = basePrice * (cabinet.quantity || 0);
  }
  
  // Add STR addon price if enabled
  if (cabinet.strEnabled && pricing.str_addon) {
    const strAddonPrice = pricing.str_addon * (cabinet.linearFeet || cabinet.quantity || 0);
    finalPrice += strAddonPrice;
  }
  
  return finalPrice;
}

export function calculateSurfacePrice(
  surface: SurfaceConfig,
  surfacePricing: SurfacePricing[],
  priceLevel: number = 0
): number {
  // Try to find exact match first
  let pricing = surfacePricing.find(
    p => p.name === surface.name &&
         p.area === surface.area &&
         p.measurement_type === surface.measurement_type
  );
  
  // If no pricing found and the area is kitchen-surfaces, try with kitchen or kitchen-surface
  if (!pricing && surface.area === "kitchen-surfaces") {
    // Try with kitchen first
    pricing = surfacePricing.find(
      p => p.name === surface.name &&
           p.area === "kitchen" &&
           p.measurement_type === surface.measurement_type
    );
    
    // If still not found, try with kitchen-surface
    if (!pricing) {
      pricing = surfacePricing.find(
        p => p.name === surface.name &&
             p.area === "kitchen-surface" &&
             p.measurement_type === surface.measurement_type
      );
    }
  }
  
  // If no pricing found and the area is kitchen, try with kitchen-surfaces or kitchen-surface
  if (!pricing && surface.area === "kitchen") {
    // Try with kitchen-surfaces first
    pricing = surfacePricing.find(
      p => p.name === surface.name &&
           p.area === "kitchen-surfaces" &&
           p.measurement_type === surface.measurement_type
    );
    
    // If still not found, try with kitchen-surface
    if (!pricing) {
      pricing = surfacePricing.find(
        p => p.name === surface.name &&
             p.area === "kitchen-surface" &&
             p.measurement_type === surface.measurement_type
      );
    }
  }
  
  // If no pricing found and the area is kitchen-surface, try with kitchen-surfaces or kitchen
  if (!pricing && surface.area === "kitchen-surface") {
    // Try with kitchen-surfaces first
    pricing = surfacePricing.find(
      p => p.name === surface.name &&
           p.area === "kitchen-surfaces" &&
           p.measurement_type === surface.measurement_type
    );
    
    // If still not found, try with kitchen
    if (!pricing) {
      pricing = surfacePricing.find(
        p => p.name === surface.name &&
             p.area === "kitchen" &&
             p.measurement_type === surface.measurement_type
      );
    }
  }
  
  if (!pricing) {
    console.warn(`No pricing found for surface: ${surface.name} in area: ${surface.area}`);
    return 0;
  }
  
  const materialPriceKey = `${surface.material}_20` as keyof typeof pricing;
  const basePrice = pricing[materialPriceKey] as number;
  const finalPrice = basePrice * (surface.squareFeet || 0);
  
  return finalPrice;
}

// Helper function to find dependencies for an addon
export function findAddonDependencies(
  addonId: number,
  allAddons: AddonPricing[],
  dependencies: AddonDependency[]
): AddonConfig[] {
  // Find all dependencies where this addon is the parent
  const addonDependencies = dependencies.filter(dep => dep.parent_addon_id === addonId);
  
  if (addonDependencies.length === 0) {
    return [];
  }
  
  // Create AddonConfig objects for each dependent addon
  return addonDependencies.map(dep => {
    const dependentAddon = allAddons.find(a => a.id === dep.dependent_addon_id);
    if (!dependentAddon) return null;
    
    // Calculate quantity based on ratio and rule
    let calculatedQuantity = 0;
    
    // Create dependent addon config
    return {
      id: dependentAddon.id,
      name: dependentAddon.name,
      area: dependentAddon.area,
      measurement_type: dependentAddon.measurement_type,
      // Set quantity or linearFeet based on measurement type
      ...(dependentAddon.measurement_type === "Linear FT" || dependentAddon.measurement_type === "Per SQFT" 
        ? { linearFeet: 0 } // Will be calculated when needed
        : { quantity: 0 })  // Will be calculated when needed
    };
  }).filter(Boolean) as AddonConfig[];
}

// Function to calculate the quantity or linearFeet of a dependent addon
export function calculateDependentAddonValue(
  parentAddon: AddonConfig,
  dependency: AddonDependency
): number {
  if (!dependency) return 0;
  
  // Get the base value from the parent addon (either linearFeet or quantity)
  const parentValue = parentAddon.linearFeet !== undefined ? parentAddon.linearFeet : parentAddon.quantity || 0;
  
  // Apply the ratio from the dependency
  let calculatedValue = parentValue * dependency.quantity_ratio;
  
  // Apply any additional calculation rules
  switch (dependency.calculation_rule) {
    case 'round_up':
      calculatedValue = Math.ceil(calculatedValue);
      break;
    case 'round_down':
      calculatedValue = Math.floor(calculatedValue);
      break;
    case 'round':
      calculatedValue = Math.round(calculatedValue);
      break;
    // Add more rules as needed
    default:
      // Default is to use the exact calculated value
      break;
  }
  
  return calculatedValue;
}

export function calculateAddonPrice(
  addon: AddonConfig,
  addonPricing: AddonPricing[],
  addonDependencies: AddonDependency[] = [],
  priceLevel: number = 0
): number {
  // If the addon is specifically marked as not enabled, return 0
  if (addon.enabled === false) {
    return 0;
  }
  
  // Check if the addon has valid measurements
  if ((addon.measurement_type === "Linear FT" || addon.measurement_type === "Per SQFT") && 
      (!addon.linearFeet || addon.linearFeet <= 0)) {
    return 0;
  } else if (addon.measurement_type === "Per Piece" && (!addon.quantity || addon.quantity <= 0)) {
    return 0;
  }
  
  const pricing = addonPricing.find(
    p => p.name === addon.name &&
         p.area === addon.area &&
         p.measurement_type === addon.measurement_type
  );

  if (!pricing) {
    return 0;
  }

  // Calculate the base price
  let basePrice = 0;
  // Use price property as it's defined in AddonPricing type
  
  // Use price field directly instead of price_level_0
  basePrice = pricing.price as number;
  
  // Final price based on measurement type
  let mainPrice = 0;
  if (addon.measurement_type === "Linear FT" || addon.measurement_type === "Per SQFT") {
    mainPrice = basePrice * (addon.linearFeet || 0);
  } else {
    mainPrice = basePrice * (addon.quantity || 0);
  }

  // Calculate dependent addon prices if any
  let dependentPrice = 0;
  if (addon.dependentAddons && addon.dependentAddons.length > 0) {
    for (const depAddon of addon.dependentAddons) {
      // Make sure we have valid measurements for the dependent addons
      if (depAddon.enabled === false) {
        continue;
      }
      
      const depPrice = calculateAddonPrice(depAddon, addonPricing);
      dependentPrice += depPrice;
    }
  }

  const totalPrice = mainPrice + dependentPrice;
  
  return totalPrice;
}

export function calculateTotalPrice(
  config: CalculatorConfig,
  cabinetPricing: CabinetPricing[],
  surfacePricing: SurfacePricing[],
  addonPricing: AddonPricing[],
  addonDependencies: AddonDependency[] = [],
  contingencyRate: number = 0.05, // Default 5%
  tariffRate: number = 0.10, // Default 10%
): PricingSummary {
  // Prepare the pricing info for all items
  const items: { name: string; price: number }[] = []
  
  let subtotal = 0;
  
  // Calculate cabinet prices
  let cabinetsTotal = 0;
  for (const cabinet of config.cabinets) {
    // Skip cabinets with zero or undefined linearFeet/quantity
    if ((cabinet.measurement_type === "Linear FT" || cabinet.measurement_type === "Per SQFT") && 
        (!cabinet.linearFeet || cabinet.linearFeet <= 0)) {
      continue;
    } else if (cabinet.measurement_type === "Per Piece" && (!cabinet.quantity || cabinet.quantity <= 0)) {
      continue;
    }
    
    const price = calculateCabinetPrice(cabinet, cabinetPricing, cabinet.priceLevel)
    if (price > 0) {
      cabinetsTotal += price;
      items.push({
        name: `${cabinet.name} (${cabinet.area})`,
        price,
      })
    }
  }
  
  // Calculate surface prices
  let surfacesTotal = 0;
  for (const surface of config.surfaces) {
    // Skip surfaces with zero or undefined squareFeet
    if (!surface.squareFeet || surface.squareFeet <= 0) {
      continue;
    }
    
    const price = calculateSurfacePrice(surface, surfacePricing)
    if (price > 0) {
      surfacesTotal += price;
      items.push({
        name: `${surface.name} - ${surface.material} (${surface.area})`,
        price,
      })
    }
  }

  // Calculate addon prices
  let addonsTotal = 0;
  for (const addon of config.addons) {
    // Skip addons that are explicitly marked as not enabled
    if (addon.enabled === false) {
      continue;
    }
    
    // Skip addons with zero or undefined linearFeet/quantity
    if ((addon.measurement_type === "Linear FT" || addon.measurement_type === "Per SQFT") && 
        (!addon.linearFeet || addon.linearFeet <= 0)) {
      continue;
    } else if (addon.measurement_type === "Per Piece" && (!addon.quantity || addon.quantity <= 0)) {
      continue;
    }
    
    const price = calculateAddonPrice(addon, addonPricing, addonDependencies)
    if (price > 0) {
      addonsTotal += price;
      items.push({
        name: `${addon.name} (${addon.area})`,
        price,
      })
      
      // If the addon has dependencies, also add them individually for display
      if (addon.dependentAddons && addon.dependentAddons.length > 0) {
        addon.dependentAddons.forEach(depAddon => {
          // Skip dependent addons that are marked as not enabled
          if (depAddon.enabled === false) {
            return;
          }
          
          const dependency = addonDependencies.find(
            d => d.parent_addon_id === addon.id && 
                d.dependent_addon_id === depAddon.id
          );
          
          if (dependency) {
            // Calculate the dependent addon's value (quantity or linearFeet)
            const calculatedValue = calculateDependentAddonValue(addon, dependency);
            
            // Create a copy with the calculated value
            const updatedDepAddon = {
              ...depAddon,
              ...(depAddon.measurement_type === "Linear FT" || depAddon.measurement_type === "Per SQFT"
                ? { linearFeet: calculatedValue }
                : { quantity: calculatedValue }),
              enabled: true
            };
            
            // Calculate and add the dependent addon's price
            const depPrice = calculateAddonPrice(updatedDepAddon, addonPricing);
            if (depPrice > 0) {
              items.push({
                name: `- ${depAddon.name} (${depAddon.area}) [Dependent]`,
                price: 0, // Set to 0 since it's already included in the parent addon price
              });
            }
          }
        });
      }
    }
  }

  // Calculate island prices if enabled
  if (config.island?.enabled) {
    // Island cabinets
    if (config.island.islandCabinets && config.island.islandCabinets.length > 0) {
      // Use actual island cabinets if available
      for (const islandCabinet of config.island.islandCabinets) {
        // Skip cabinets with zero or undefined linearFeet/quantity
        if ((islandCabinet.measurement_type === "Linear FT" || islandCabinet.measurement_type === "Per SQFT") && 
            (!islandCabinet.linearFeet || islandCabinet.linearFeet <= 0)) {
          continue;
        } else if (islandCabinet.measurement_type === "Per Piece" && (!islandCabinet.quantity || islandCabinet.quantity <= 0)) {
          continue;
        }
        
        const price = calculateCabinetPrice(islandCabinet, cabinetPricing, islandCabinet.priceLevel);
        if (price > 0) {
          items.push({
            name: `${islandCabinet.name} (kitchen-island)`,
            price,
          });
        }
      }
    } else {
      // Fallback to creating a mock island cabinet
      const islandCabinet: CabinetConfig = {
        name: "Island Cabinet",
        area: "kitchen-island",
        room_name: config.island.room_name,
        measurement_type: "Linear FT",
        handle_type: config.island.handle_type,
        linearFeet: config.island.counterTop.squareFeet / 2, // Approximate linear feet from square feet
        priceLevel: config.island.priceLevel,
        strEnabled: false,
      }

      const islandCabinetPrice = calculateCabinetPrice(islandCabinet, cabinetPricing, islandCabinet.priceLevel)
      if (islandCabinetPrice > 0) {
        items.push({
          name: "Island Cabinet (kitchen-island)",
          price: islandCabinetPrice,
        })
      }
    }

    // Island counter top - ensure it has sqft > 0
    if (config.island.counterTop && config.island.counterTop.squareFeet > 0) {
      const islandCounterTopPrice = calculateSurfacePrice(config.island.counterTop, surfacePricing)
      if (islandCounterTopPrice > 0) {
        items.push({
          name: `Counter Top - ${config.island.counterTop.material} (kitchen-island)`,
          price: islandCounterTopPrice,
        })
      }
    }

    // Island waterfall if enabled and has sqft > 0
    if (config.island.waterfall && config.island.waterfall.squareFeet > 0) {
      const islandWaterfallPrice = calculateSurfacePrice(config.island.waterfall, surfacePricing)
      if (islandWaterfallPrice > 0) {
        items.push({
          name: `Waterfall - ${config.island.waterfall.material} (kitchen-island)`,
          price: islandWaterfallPrice,
        })
      }
    }

    // Island addons
    if (config.island.aluminumProfiles?.enabled && config.island.aluminumProfiles?.linearFeet) {
      const aluminumProfilesPrice = calculateAddonPrice(config.island.aluminumProfiles, addonPricing, addonDependencies)
      if (aluminumProfilesPrice > 0) {
        items.push({
          name: "Aluminum Profiles (kitchen-island)",
          price: aluminumProfilesPrice,
        })
      }
    }

    if (config.island.aluminumToeKicks?.enabled && config.island.aluminumToeKicks?.linearFeet) {
      const aluminumToeKicksPrice = calculateAddonPrice(config.island.aluminumToeKicks, addonPricing, addonDependencies)
      if (aluminumToeKicksPrice > 0) {
        items.push({
          name: "Aluminum Toe Kicks (kitchen-island)",
          price: aluminumToeKicksPrice,
        })
      }
    }

    if (config.island.integratedSink?.quantity && config.island.integratedSink?.quantity > 0) {
      const integratedSinkPrice = calculateAddonPrice(config.island.integratedSink, addonPricing, addonDependencies)
      if (integratedSinkPrice > 0) {
        items.push({
          name: "Integrated Sink (kitchen-island)",
          price: integratedSinkPrice,
        })
      }
    }
  }

  // Calculate totals
  subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const buffer = subtotal * contingencyRate
  const bufferedSubtotal = subtotal + buffer
  const tariff = bufferedSubtotal * tariffRate
  const total = bufferedSubtotal + tariff

  // Calculate markup prices
  const tradePrice = total * 1.4 // 40% markup
  const retailPrice1 = total * 2 // 100% markup
  const retailPrice2 = total * 2.5 // 150% markup

  return {
    items,
    subtotal,
    buffer,
    tariff,
    total,
    tradePrice,
    retailPrice1,
    retailPrice2,
  }
}
