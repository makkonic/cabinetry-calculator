import type { CabinetPricing, SurfacePricing, AddonPricing } from "./supabase"

export type CabinetConfig = {
  name: string
  area: string
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
}

export type IslandConfig = {
  enabled: boolean
  handle_type: string
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

export function calculateCabinetPrice(config: CabinetConfig, pricingData: CabinetPricing[]): number {
  // Find matching cabinet pricing based on name, area, measurement_type, and handle_type
  const pricing = pricingData.find(
    (p) => 
      p.name === config.name && 
      p.area === config.area && 
      p.measurement_type === config.measurement_type && 
      p.handle_type === config.handle_type
  )
  
  if (!pricing) return 0

  const priceLevel = pricing[`price_level_${config.priceLevel}` as keyof CabinetPricing] as number
  const strAddon = config.strEnabled ? pricing.str_addon : 0

  if (config.measurement_type.includes("LINEAR") && config.linearFeet) {
    return (priceLevel + strAddon) * config.linearFeet
  } else if (config.measurement_type.includes("PIECE") && config.quantity) {
    return (priceLevel + strAddon) * config.quantity
  }

  return 0
}

export function calculateSurfacePrice(config: SurfaceConfig, pricingData: SurfacePricing[]): number {
  // Find matching surface pricing based on name, area, and measurement_type
  const pricing = pricingData.find(
    (p) => 
      p.name === config.name && 
      p.area === config.area && 
      p.measurement_type === config.measurement_type
  )

  if (!pricing) return 0
  
  // Get the price for the selected material
  const materialPrice = pricing[`${config.material}_20` as keyof SurfacePricing] as number

  return materialPrice * config.squareFeet
}

export function calculateAddonPrice(config: AddonConfig, pricingData: AddonPricing[]): number {
  // Find matching addon pricing based on name, area, and measurement_type
  const pricing = pricingData.find(
    (p) => 
      p.name === config.name && 
      p.area === config.area && 
      p.measurement_type === config.measurement_type
  )
  
  if (!pricing) return 0

  if (config.measurement_type.includes("LINEAR") && config.linearFeet) {
    return pricing.price * config.linearFeet
  } else if (config.measurement_type.includes("PIECE") && config.quantity) {
    return pricing.price * config.quantity
  }

  return 0
}

export function calculateTotalPrice(
  config: CalculatorConfig,
  cabinetPricing: CabinetPricing[],
  surfacePricing: SurfacePricing[],
  addonPricing: AddonPricing[],
): PricingSummary {
  const items: { name: string; price: number }[] = []

  // Calculate cabinet prices
  config.cabinets.forEach((cabinet) => {
    const price = calculateCabinetPrice(cabinet, cabinetPricing)
    if (price > 0) {
      items.push({
        name: `${cabinet.name} (${cabinet.area})`,
        price,
      })
    }
  })

  // Calculate surface prices
  config.surfaces.forEach((surface) => {
    const price = calculateSurfacePrice(surface, surfacePricing)
    if (price > 0) {
      items.push({
        name: `${surface.name} - ${surface.material} (${surface.area})`,
        price,
      })
    }
  })

  // Calculate addon prices
  config.addons.forEach((addon) => {
    const price = calculateAddonPrice(addon, addonPricing)
    if (price > 0) {
      items.push({
        name: `${addon.name} (${addon.area})`,
        price,
      })
    }
  })

  // Calculate island prices if enabled
  if (config.island?.enabled) {
    // Island cabinets
    const islandCabinet: CabinetConfig = {
      name: "Island Cabinet",
      area: "ISLAND",
      measurement_type: "LINEAR FOOT",
      handle_type: config.island.handle_type,
      linearFeet: config.island.counterTop.squareFeet / 2, // Approximate linear feet from square feet
      priceLevel: config.island.priceLevel,
      strEnabled: false,
    }

    const islandCabinetPrice = calculateCabinetPrice(islandCabinet, cabinetPricing)
    if (islandCabinetPrice > 0) {
      items.push({
        name: "Island Cabinet",
        price: islandCabinetPrice,
      })
    }

    // Island counter top
    const islandCounterTopPrice = calculateSurfacePrice(config.island.counterTop, surfacePricing)
    if (islandCounterTopPrice > 0) {
      items.push({
        name: `Island Counter Top - ${config.island.counterTop.material}`,
        price: islandCounterTopPrice,
      })
    }

    // Island waterfall if enabled
    if (config.island.waterfall) {
      const islandWaterfallPrice = calculateSurfacePrice(config.island.waterfall, surfacePricing)
      if (islandWaterfallPrice > 0) {
        items.push({
          name: `Island Waterfall - ${config.island.waterfall.material}`,
          price: islandWaterfallPrice,
        })
      }
    }

    // Island addons
    if (config.island.aluminumProfiles) {
      const aluminumProfilesPrice = calculateAddonPrice(config.island.aluminumProfiles, addonPricing)
      if (aluminumProfilesPrice > 0) {
        items.push({
          name: "Island Aluminum Profiles",
          price: aluminumProfilesPrice,
        })
      }
    }

    if (config.island.aluminumToeKicks) {
      const aluminumToeKicksPrice = calculateAddonPrice(config.island.aluminumToeKicks, addonPricing)
      if (aluminumToeKicksPrice > 0) {
        items.push({
          name: "Island Aluminum Toe Kicks",
          price: aluminumToeKicksPrice,
        })
      }
    }

    if (config.island.integratedSink) {
      const integratedSinkPrice = calculateAddonPrice(config.island.integratedSink, addonPricing)
      if (integratedSinkPrice > 0) {
        items.push({
          name: "Island Integrated Sink",
          price: integratedSinkPrice,
        })
      }
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
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
