"use client"

import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberFlowSlider } from "@/components/ui/number-flow-slider"

interface LinearMeasurementProps {
  value: number
  onChange: (newValue: number) => void
  label?: string
  maxValue?: number
  labelPrefix?: string
}

export function LinearMeasurement({ 
  value, 
  onChange, 
  label = "Linear FT",
  maxValue = 100,
  labelPrefix = ""
}: LinearMeasurementProps) {
  const handleSliderChange = (newValue: number[]) => {
    console.log(`${label} slider changed to: ${newValue[0]}`);
    onChange(newValue[0]);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= 0) {
      console.log(`${label} input changed to: ${newValue}`);
      onChange(newValue);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${labelPrefix}-measurement`}>{label}</Label>
        <Input
          id={`${labelPrefix}-measurement-input`}
          type="number"
          value={value}
          onChange={handleInputChange}
          className="w-20 text-right"
          min={0}
          step={0.01}
        />
      </div>
      <div className="py-6">
        <NumberFlowSlider
          id={`${labelPrefix}-measurement`}
          value={[value]}
          min={0}
          max={maxValue}
          step={0.01}
          onValueChange={handleSliderChange}
          className="w-full"
          unit="ft"
        />
      </div>
    </div>
  )
} 