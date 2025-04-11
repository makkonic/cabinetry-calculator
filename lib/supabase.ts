import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Base data types
export type Area = {
  id: number
  name: string
  description: string
}

export type MeasurementType = {
  id: number
  name: string
  description: string
}

export type HandleType = {
  id: number
  name: string
  description: string
}

// View types for pricing
export type CabinetPricing = {
  id: number
  name: string
  handle_type: string
  area: string
  measurement_type: string
  price_level_0: number
  price_level_1: number
  price_level_2: number
  price_level_3: number
  price_level_4: number
  price_level_5: number
  price_level_6: number
  price_level_7: number
  price_level_8: number
  price_level_9: number
  price_level_10: number
  str_addon: number
}

export type SurfacePricing = {
  id: number
  name: string
  area: string
  measurement_type: string
  laminate_20: number
  fenix_20: number
  porcelain_20: number
  quartz_20: number
  stainless_20: number
  glass_matte_20: number
  granite_20: number
}

export type AddonPricing = {
  id: number
  name: string
  type: string
  area: string
  measurement_type: string
  price: number
}

export type Quote = {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  created_at: string
  updated_at: string
  configuration: any
  pricing: any
  user_id?: string
}

// Fetch functions for reference data
export async function getAreas() {
  const { data, error } = await supabase.from("areas").select("*")

  if (error) {
    console.error("Error fetching areas:", error)
    return []
  }

  return data as Area[]
}

export async function getMeasurementTypes() {
  const { data, error } = await supabase.from("measurement_types").select("*")

  if (error) {
    console.error("Error fetching measurement types:", error)
    return []
  }

  return data as MeasurementType[]
}

export async function getHandleTypes() {
  const { data, error } = await supabase.from("handle_types").select("*")

  if (error) {
    console.error("Error fetching handle types:", error)
    return []
  }

  return data as HandleType[]
}

// Fetch functions for pricing data
export async function getCabinetPricing() {
  const { data, error } = await supabase.from("view_cabinet_pricing").select("*")

  if (error) {
    console.error("Error fetching cabinet pricing:", error)
    return []
  }

  return data as CabinetPricing[]
}

export async function getSurfacePricing() {
  const { data, error } = await supabase.from("view_surface_pricing").select("*")

  if (error) {
    console.error("Error fetching surface pricing:", error)
    return []
  }

  return data as SurfacePricing[]
}

export async function getAddonPricing() {
  const { data, error } = await supabase.from("view_addon_pricing").select("*")

  if (error) {
    console.error("Error fetching addon pricing:", error)
    return []
  }

  return data as AddonPricing[]
}

export async function saveQuote(quote: Omit<Quote, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("quotes").insert([quote]).select()

  if (error) {
    console.error("Error saving quote:", error)
    return null
  }

  return data?.[0] as Quote
}

export async function getQuotes() {
  const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching quotes:", error)
    return []
  }

  return data as Quote[]
}
