"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { NumberFlowSlider } from "@/components/ui/number-flow-slider"
import NumberFlow from '@number-flow/react'

interface SqftMeasurementProps {
  width: number
  length: number
  onWidthChange: (newWidth: number) => void
  onLengthChange: (newLength: number) => void
  maxValue?: number
  labelPrefix?: string
}

export function SqftMeasurement({ 
  width, 
  length, 
  onWidthChange, 
  onLengthChange, 
  maxValue = 20,
  labelPrefix = ""
}: SqftMeasurementProps) {
  const handleWidthSliderChange = (value: number[]) => {
    const newWidth = value[0];
    console.log(`Width slider changed to: ${newWidth}`);
    onWidthChange(newWidth);
  }

  const handleLengthSliderChange = (value: number[]) => {
    const newLength = value[0];
    console.log(`Length slider changed to: ${newLength}`);
    onLengthChange(newLength);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${labelPrefix}-width-slider`} className="mb-2 block">Width (ft)</Label>
          <div className="py-6">
            <NumberFlowSlider
              id={`${labelPrefix}-width-slider`}
              value={[width]}
              onValueChange={handleWidthSliderChange}
              min={0}
              max={maxValue}
              step={0.01}
              className="w-full"
              unit="ft"
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`${labelPrefix}-length-slider`} className="mb-2 block">Length (ft)</Label>
          <div className="py-6">
            <NumberFlowSlider
              id={`${labelPrefix}-length-slider`}
              value={[length]}
              onValueChange={handleLengthSliderChange}
              min={0}
              max={maxValue}
              step={0.01}
              className="w-full"
              unit="ft"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label>Total Area (sq ft)</Label>
        <NumberFlow 
          value={width * length} 
          format={{ 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }}
          transformTiming={{ duration: 500, easing: 'ease-out' }}
          className="font-medium"
          suffix=" sq ft"
        />
      </div>
    </div>
  )
} 