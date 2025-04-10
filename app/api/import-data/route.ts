import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/NOVACUCINA%20PRICE%20PER%20FOOT.xlsx%20-%20Sheet1-lk3oVoabVKaxt6ImSxobX5kY8T1y27.csv",
    )
    const text = await response.text()

    // Parse CSV
    const lines = text.split("\n")

    // Process cabinet pricing data
    const cabinetPricingData = []
    const surfacePricingData = []
    const addonPricingData = []

    // Define categories for each type
    const cabinetCategories = [
      "HANDLES - BASE",
      "HANDLES - BASE LE MANS",
      "HANDLES - COLUMNS",
      "HANDLES - COLUMNS LE MANS",
      "HANDLES - STACK",
      "HANDLES - WALL",
      "PROFILES - BASE",
      "PROFILES - BASE LE MANS",
      "PROFILES - COLUMNS",
      "PROFILES - COLUMNS LE MANS",
      "PROFILES - STACK",
      "PROFILES - WALL",
      "DW PANEL HANDLE",
      "DW PANEL PROFILE",
      "FRIDGE PANEL",
      "SHELVES",
    ]

    const surfaceCategories = ["COUNTER TOP", "BACKSPLASH", "WATERFALL"]
    const surfaceMaterials = ["laminate", "fenix", "porcelain", "quartz", "stainless", "glass matte", "granite"]

    const addonNames = [
      "ALUMINUM PROFILES",
      "ALUMINUM TOE KICKS",
      "LED LIGHTING",
      "TRANSFORMER",
      "INTEGRATED SINK",
      "POWER STRIP",
    ]

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(",")
      if (columns.length < 2) continue

      const category = columns[0]?.trim()
      if (!category) continue

      // Determine if this is a cabinet, surface, or addon
      if (cabinetCategories.some((c) => category.includes(c))) {
        // Cabinet pricing
        const type = category.includes("PER PIECE") ? "PER PIECE" : "LINEAR FOOT"

        // Extract price levels and STR addon
        const prices = columns.slice(1, 12).map((p) => Number.parseFloat(p.replace("$", "").trim()) || 0)
        const strAddon = Number.parseFloat(columns[12]?.replace("$", "").trim()) || 0

        cabinetPricingData.push({
          category,
          type,
          price_level_0: prices[0],
          price_level_1: prices[1],
          price_level_2: prices[2],
          price_level_3: prices[3],
          price_level_4: prices[4],
          price_level_5: prices[5],
          price_level_6: prices[6],
          price_level_7: prices[7],
          price_level_8: prices[8],
          price_level_9: prices[9],
          price_level_10: prices[10],
          str_addon: strAddon,
        })
      } else if (surfaceCategories.some((c) => category.includes(c))) {
        // Surface pricing
        for (const material of surfaceMaterials) {
          const price = Number.parseFloat(columns[1]?.replace("$", "").trim()) || 0
          surfacePricingData.push({
            material,
            category,
            price: material === "fenix" ? price * 1.5 : price,
          })
        }
      } else if (addonNames.some((a) => category.includes(a))) {
        // Addon pricing
        const type = category.includes("PER PIECE") ? "PER PIECE" : "LINEAR FOOT"
        const price = Number.parseFloat(columns[1]?.replace("$", "").trim()) || 0

        addonPricingData.push({
          name: category,
          type,
          price,
        })
      }
    }

    // Insert data into Supabase
    // First clear existing data
    await supabase.from("cabinet_pricing").delete().neq("id", 0)
    await supabase.from("surface_pricing").delete().neq("id", 0)
    await supabase.from("addon_pricing").delete().neq("id", 0)

    // Insert new data
    const { error: cabinetError } = await supabase.from("cabinet_pricing").insert(cabinetPricingData)
    const { error: surfaceError } = await supabase.from("surface_pricing").insert(surfacePricingData)
    const { error: addonError } = await supabase.from("addon_pricing").insert(addonPricingData)

    if (cabinetError || surfaceError || addonError) {
      return NextResponse.json(
        {
          success: false,
          errors: { cabinetError, surfaceError, addonError },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      counts: {
        cabinets: cabinetPricingData.length,
        surfaces: surfacePricingData.length,
        addons: addonPricingData.length,
      },
    })
  } catch (error) {
    console.error("Error importing data:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
