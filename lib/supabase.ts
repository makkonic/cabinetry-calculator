import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type CabinetPricing = {
  id: number
  category: string
  type: "LINEAR FOOT" | "PER PIECE"
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
  material: string
  category: string
  price: number
}

export type AddonPricing = {
  id: number
  name: string
  type: "LINEAR FOOT" | "PER PIECE"
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

export async function getCabinetPricing() {
  const { data, error } = await supabase.from("cabinet_pricing").select("*")

  if (error) {
    console.error("Error fetching cabinet pricing:", error)
    return []
  }

  return data as CabinetPricing[]
}

export async function getSurfacePricing() {
  const { data, error } = await supabase.from("surface_pricing").select("*")

  if (error) {
    console.error("Error fetching surface pricing:", error)
    return []
  }

  return data as SurfacePricing[]
}

export async function getAddonPricing() {
  const { data, error } = await supabase.from("addon_pricing").select("*")

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
