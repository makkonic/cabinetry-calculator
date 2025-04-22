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
}

export type IslandConfig = {
  enabled: boolean
  handle_type: string
  room_name: string
  priceLevel: number
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
  
  console.log(`Calculating price for cabinet: ${cabinet.name}`);
  console.log(`  Area: ${cabinet.area}, Price Level: ${priceLevel}, Handle Type: ${cabinet.handle_type}`);
  console.log(`  Measurement: ${cabinet.measurement_type}, Linear Feet: ${cabinet.linearFeet}, Quantity: ${cabinet.quantity}`);
  
  const pricing = cabinetPricing.find(
    p => p.name === cabinet.name &&
         p.area === cabinet.area &&
         p.room_name === room_name &&
         p.measurement_type === cabinet.measurement_type &&
         (cabinet.handle_type ? p.handle_type === cabinet.handle_type : true)
  );
  
  if (!pricing) {
    console.log(`  No matching pricing data found for cabinet ${cabinet.name}`);
    return 0;
  }
  
  console.log(`  Found pricing data:`, pricing);
  const priceKey = `price_level_${priceLevel}` as keyof typeof pricing;
  const basePrice = pricing[priceKey] as number;
  console.log(`  Base price at level ${priceLevel}: ${basePrice}`);
  
  let finalPrice = 0;
  if (cabinet.measurement_type.includes('LINEAR')) {
    finalPrice = basePrice * (cabinet.linearFeet || 0);
    console.log(`  Calculation: ${basePrice} * ${cabinet.linearFeet} = ${finalPrice}`);
  } else {
    finalPrice = basePrice * (cabinet.quantity || 0);
    console.log(`  Calculation: ${basePrice} * ${cabinet.quantity} = ${finalPrice}`);
  }
  
  return finalPrice;
}

export function calculateSurfacePrice(
  surface: SurfaceConfig,
  surfacePricing: SurfacePricing[],
  priceLevel: number = 0
): number {
  console.log(`Calculating price for surface: ${surface.name}`);
  console.log(`  Area: ${surface.area}, Material: ${surface.material}, Measurement Type: ${surface.measurement_type}`);
  console.log(`  Square Feet: ${surface.squareFeet}`);
  
  const pricing = surfacePricing.find(
    p => p.name === surface.name &&
         p.area === surface.area &&
         p.measurement_type === surface.measurement_type
  );
  
  if (!pricing) {
    console.log(`  No matching pricing data found for surface ${surface.name}`);
    return 0;
  }
  
  console.log(`  Found pricing data:`, pricing);
  const materialPriceKey = `${surface.material}_20` as keyof typeof pricing;
  const basePrice = pricing[materialPriceKey] as number;
  console.log(`  Base price for material ${surface.material}: ${basePrice}`);
  
  const finalPrice = basePrice * (surface.squareFeet || 0);
  console.log(`  Calculation: ${basePrice} * ${surface.squareFeet} = ${finalPrice}`);
  
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
      ...(dependentAddon.measurement_type.includes("LINEAR") 
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
  console.log(`Calculating price for addon: ${addon.name}`);
  console.log(`  Area: ${addon.area}, Measurement Type: ${addon.measurement_type}`);
  console.log(`  Linear Feet: ${addon.linearFeet}, Quantity: ${addon.quantity}`);
  
  const pricing = addonPricing.find(
    p => p.name === addon.name &&
         p.area === addon.area &&
         p.measurement_type === addon.measurement_type
  );
  
  if (!pricing) {
    console.log(`  No matching pricing data found for addon ${addon.name}`);
    return 0;
  }
  
  console.log(`  Found pricing data:`, pricing);
  const basePrice = pricing.price;
  console.log(`  Base price: ${basePrice}`);
  
  let finalPrice = 0;
  
  if (addon.measurement_type === 'LINEAR FOOT') {
    finalPrice = basePrice * (addon.linearFeet || 0);
    console.log(`  Linear foot calculation: ${basePrice} * ${addon.linearFeet} = ${finalPrice}`);
  } else if (addon.measurement_type === 'SQUARE FOOT') {
    if ('squareFeet' in addon) {
      const squareFeet = (addon as any).squareFeet || 0;
      finalPrice = basePrice * squareFeet;
      console.log(`  Square foot calculation: ${basePrice} * ${squareFeet} = ${finalPrice}`);
    } else {
      console.log(`  Warning: Addon has SQUARE FOOT measurement type but no squareFeet property`);
      finalPrice = 0;
    }
  } else {
    finalPrice = basePrice * (addon.quantity || 0);
    console.log(`  Quantity calculation: ${basePrice} * ${addon.quantity} = ${finalPrice}`);
  }
  
  return finalPrice;
}

export function calculateTotalPrice(
  config: CalculatorConfig,
  cabinetPricing: CabinetPricing[],
  surfacePricing: SurfacePricing[],
  addonPricing: AddonPricing[],
  addonDependencies: AddonDependency[] = [],
): PricingSummary {
  console.log("Starting calculateTotalPrice with config:", config);
  // Prepare the pricing info for all items
  const items: { name: string; price: number }[] = []
  
  let subtotal = 0;
  
  // Calculate cabinet prices
  let cabinetsTotal = 0;
  console.log(`Processing ${config.cabinets.length} cabinets`);
  for (const cabinet of config.cabinets) {
    // Skip cabinets with zero or undefined linearFeet/quantity
    if ((cabinet.measurement_type.includes('LINEAR') && (!cabinet.linearFeet || cabinet.linearFeet <= 0)) ||
        (!cabinet.measurement_type.includes('LINEAR') && (!cabinet.quantity || cabinet.quantity <= 0))) {
      console.log(`Skipping cabinet ${cabinet.name} - has zero or undefined measurements`);
      continue;
    }
    
    const price = calculateCabinetPrice(cabinet, cabinetPricing, cabinet.priceLevel)
    console.log(`Cabinet ${cabinet.name} calculated price: ${price}`);
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
  console.log(`Processing ${config.surfaces.length} surfaces`);
  for (const surface of config.surfaces) {
    // Skip surfaces with zero or undefined squareFeet
    if (!surface.squareFeet || surface.squareFeet <= 0) {
      console.log(`Skipping surface ${surface.name} - has zero or undefined squareFeet`);
      continue;
    }
    
    const price = calculateSurfacePrice(surface, surfacePricing)
    console.log(`Surface ${surface.name} calculated price: ${price}`);
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
  console.log(`Processing ${config.addons.length} addons`);
  for (const addon of config.addons) {
    const price = calculateAddonPrice(addon, addonPricing, addonDependencies)
    console.log(`Addon ${addon.name} calculated price: ${price}`);
    if (price > 0) {
      addonsTotal += price;
      items.push({
        name: `${addon.name} (${addon.area})`,
        price,
      })
      
      // If the addon has dependencies, also add them individually for display
      if (addon.dependentAddons && addon.dependentAddons.length > 0) {
        addon.dependentAddons.forEach(depAddon => {
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
              ...(depAddon.measurement_type.includes("LINEAR")
                ? { linearFeet: calculatedValue }
                : { quantity: calculatedValue })
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
    const islandCabinet: CabinetConfig = {
      name: "Island Cabinet",
      area: "ISLAND",
      room_name: config.island.room_name,
      measurement_type: "LINEAR FOOT",
      handle_type: config.island.handle_type,
      linearFeet: config.island.counterTop.squareFeet / 2, // Approximate linear feet from square feet
      priceLevel: config.island.priceLevel,
      strEnabled: false,
    }

    const islandCabinetPrice = calculateCabinetPrice(islandCabinet, cabinetPricing, islandCabinet.priceLevel)
    console.log(`Island Cabinet calculated price: ${islandCabinetPrice}`);
    if (islandCabinetPrice > 0) {
      items.push({
        name: "Island Cabinet",
        price: islandCabinetPrice,
      })
    }

    // Island counter top
    const islandCounterTopPrice = calculateSurfacePrice(config.island.counterTop, surfacePricing)
    console.log(`Island Counter Top calculated price: ${islandCounterTopPrice}`);
    if (islandCounterTopPrice > 0) {
      items.push({
        name: `Island Counter Top - ${config.island.counterTop.material}`,
        price: islandCounterTopPrice,
      })
    }

    // Island waterfall if enabled
    if (config.island.waterfall) {
      const islandWaterfallPrice = calculateSurfacePrice(config.island.waterfall, surfacePricing)
      console.log(`Island Waterfall calculated price: ${islandWaterfallPrice}`);
      if (islandWaterfallPrice > 0) {
        items.push({
          name: `Island Waterfall - ${config.island.waterfall.material}`,
          price: islandWaterfallPrice,
        })
      }
    }

    // Island addons
    if (config.island.aluminumProfiles) {
      const aluminumProfilesPrice = calculateAddonPrice(config.island.aluminumProfiles, addonPricing, addonDependencies)
      console.log(`Island Aluminum Profiles calculated price: ${aluminumProfilesPrice}`);
      if (aluminumProfilesPrice > 0) {
        items.push({
          name: "Island Aluminum Profiles",
          price: aluminumProfilesPrice,
        })
      }
    }

    if (config.island.aluminumToeKicks) {
      const aluminumToeKicksPrice = calculateAddonPrice(config.island.aluminumToeKicks, addonPricing, addonDependencies)
      console.log(`Island Aluminum Toe Kicks calculated price: ${aluminumToeKicksPrice}`);
      if (aluminumToeKicksPrice > 0) {
        items.push({
          name: "Island Aluminum Toe Kicks",
          price: aluminumToeKicksPrice,
        })
      }
    }

    if (config.island.integratedSink) {
      const integratedSinkPrice = calculateAddonPrice(config.island.integratedSink, addonPricing, addonDependencies)
      console.log(`Island Integrated Sink calculated price: ${integratedSinkPrice}`);
      if (integratedSinkPrice > 0) {
        items.push({
          name: "Island Integrated Sink",
          price: integratedSinkPrice,
        })
      }
    }
  }

  // Calculate totals
  subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const buffer = subtotal * 0.05 // 5% buffer
  const bufferedSubtotal = subtotal + buffer
  const tariff = bufferedSubtotal * 0.1 // 10% tariff
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
