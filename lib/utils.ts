import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract display name from a component name, removing any area information in parentheses
 * Example: "Laminate Countertop (kitchen-surface)" => "Laminate Countertop"
 */
export function getDisplayName(name: string): string {
  const parts = name.split('(');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  return name;
}
