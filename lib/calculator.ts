import type { CabinetPricing, SurfacePricing, AddonPricing } from "./supabase"

export type CabinetConfig = {
  category: string
  linearFeet?: number
  quantity?: number
  priceLevel: number
  strEnabled: boolean
}

export type SurfaceConfig = {
  category: string
  material: string
  squareFeet: number
}

export type AddonConfig = {
  name: string
  linearFeet?: number
  quantity?: number
}

export type IslandConfig = {
  enabled: boolean
  handleType: "Handles" | "Profiles"
  priceLevel: number
  counterTop: SurfaceConfig
  waterfall?: SurfaceConfig
  aluminumProfiles?: AddonConfig
  aluminumToeKicks?: AddonConfig
  integratedSink?: AddonConfig
}

export type CalculatorConfig = {
  handleType: "Handles" | "Profiles"
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
  const pricing = pricingData.find((p) => p.category === config.category)
  if (!pricing) return 0

  const priceLevel = pricing[`price_level_${config.priceLevel}` as keyof CabinetPricing] as number
  const strAddon = config.strEnabled ? pricing.str_addon : 0

  if (pricing.type === "LINEAR FOOT" && config.linearFeet) {
    return (priceLevel + strAddon) * config.linearFeet
  } else if (pricing.type === "PER PIECE" && config.quantity) {
    return (priceLevel + strAddon) * config.quantity
  }

  return 0
}

export function calculateSurfacePrice(config: SurfaceConfig, pricingData: SurfacePricing[]): number {
  const pricing = pricingData.find((p) => p.category === config.category && p.material === config.material)

  if (!pricing) return 0

  return pricing.price * config.squareFeet
}

export function calculateAddonPrice(config: AddonConfig, pricingData: AddonPricing[]): number {
  const pricing = pricingData.find((p) => p.name === config.name)
  if (!pricing) return 0

  if (pricing.type === "LINEAR FOOT" && config.linearFeet) {
    return pricing.price * config.linearFeet
  } else if (pricing.type === "PER PIECE" && config.quantity) {
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
        name: cabinet.category,
        price,
      })
    }
  })

  // Calculate surface prices
  config.surfaces.forEach((surface) => {
    const price = calculateSurfacePrice(surface, surfacePricing)
    if (price > 0) {
      items.push({
        name: `${surface.category} - ${surface.material}`,
        price,
      })
    }
  })

  // Calculate addon prices
  config.addons.forEach((addon) => {
    const price = calculateAddonPrice(addon, addonPricing)
    if (price > 0) {
      items.push({
        name: addon.name,
        price,
      })
    }
  })

  // Calculate island prices if enabled
  if (config.island?.enabled) {
    // Island cabinets
    const islandCabinet: CabinetConfig = {
      category: `${config.island.handleType.toUpperCase()} - ISLAND`,
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
