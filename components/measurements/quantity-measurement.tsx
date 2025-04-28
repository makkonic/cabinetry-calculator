"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberFlowInput } from "@/components/ui/number-flow-input"

interface QuantityMeasurementProps {
  value: number
  onChange: (newValue: number) => void
  label?: string
  labelPrefix?: string
  min?: number
  max?: number
}

export function QuantityMeasurement({ 
  value, 
  onChange, 
  label = "Quantity",
  labelPrefix = "",
  min = 0,
  max = 100
}: QuantityMeasurementProps) {
  const handleChange = (newValue: number) => {
    console.log(`${label} changed to: ${newValue}`);
    onChange(newValue);
  }

  return (
    <div>
      <Label htmlFor={`${labelPrefix}-quantity-input`} className="mb-2 block">{label}</Label>
      <NumberFlowInput
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        className="w-full text-base"
      />
    </div>
  )
} 