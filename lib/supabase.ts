import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Base data types
export type Room = {
  name: string  // PK
  description: string
}

export type Area = {
  name: string  // PK
  description: string
}

export type MeasurementType = {
  name: string  // PK
  description: string
}

export type HandleType = {
  name: string  // PK
  description: string
}

// View types for pricing
export type CabinetPricing = {
  id: number
  name: string
  handle_type: string  // FK to handle_types.name
  area: string  // FK to areas.name
  room_name: string  // FK to room.name
  measurement_type: string  // FK to measurement_types.name
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
  sort: number | null  // New sort column
  created_at: string
  updated_at: string
}

export type SurfacePricing = {
  id: number
  name: string
  area: string  // FK to areas.name
  measurement_type: string  // FK to measurement_types.name
  laminate_20: number
  fenix_20: number
  porcelain_20: number
  quartz_20: number
  stainless_20: number
  glass_matte_20: number
  granite_20: number
  created_at: string
  updated_at: string
}

export type AddonPricing = {
  id: number
  name: string
  type: string
  area: string  // FK to areas.name
  measurement_type: string  // FK to measurement_types.name
  price: number
  created_at: string
  updated_at: string
}

export type AddonDependency = {
  id: number
  parent_addon_id: number  // FK to addon_pricing.id
  dependent_addon_id: number  // FK to addon_pricing.id
  quantity_ratio: number
  calculation_rule: string
  created_at: string
  updated_at: string
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
export async function getRooms() {
  const { data, error } = await supabase.from("room").select("*")

  if (error) {
    console.error("Error fetching rooms:", error)
    return []
  }

  return data as Room[]
}

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
  console.log("Fetching cabinet pricing data");
  
  const { data, error } = await supabase
    .from("cabinet_pricing")
    .select("*")
    .order('sort', { ascending: true, nullsFirst: false }) // Sort by the sort column, nulls last
    .order('created_at', { ascending: false }); // Secondary sort by created_at if sort is equal or null

  if (error) {
    console.error("Error fetching cabinet pricing:", error);
    return [];
  }

  console.log("Received cabinet pricing data:", data?.length, "items");
  return data as CabinetPricing[];
}

export async function getSurfacePricing() {
  console.log("Fetching surface pricing data");
  
  const { data, error } = await supabase
    .from("surface_pricing")
    .select("*")
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching surface pricing:", error);
    return [];
  }

  console.log("Received surface pricing data:", data?.length, "items");
  // Log specific areas to help with debugging
  const areas = [...new Set(data?.map(item => item.area))];
  console.log("Surface areas found:", areas);
  
  return data as SurfacePricing[];
}

export async function getAddonPricing() {
  console.log("Fetching addon pricing data");
  
  const { data, error } = await supabase
    .from("addon_pricing")
    .select("*")
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching addon pricing:", error);
    return [];
  }

  console.log("Raw addon pricing data from Supabase:", data);
  console.log("Received addon pricing data:", data?.length, "items");
  return data as AddonPricing[];
}

export async function getAddonDependencies() {
  console.log("Fetching addon dependencies data");
  
  const { data, error } = await supabase
    .from("addon_dependencies")
    .select("*")
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching addon dependencies:", error);
    return [];
  }

  console.log("Received addon dependencies data:", data?.length, "items");
  return data as AddonDependency[];
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

export async function updateQuote(id: number, quote: Partial<Omit<Quote, "id" | "created_at" | "updated_at">>) {
  const { data, error } = await supabase
    .from("quotes")
    .update(quote)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating quote:", error)
    return null
  }

  return data?.[0] as Quote
}

export async function deleteQuote(id: number) {
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting quote:", error)
    return false
  }

  return true
}
