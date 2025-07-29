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

/**
 * Format a number as currency with commas and dollar sign
 * Example: 1234.56 => "$1,234.56"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
