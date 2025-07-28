"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { NumberFlowSlider } from "@/components/ui/number-flow-slider"
import NumberFlow from '@number-flow/react'
import { Input } from "@/components/ui/input"

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
          <Label htmlFor={`${labelPrefix}-width-input`} className="mb-2 block">Width (ft)</Label>
          <Input
            id={`${labelPrefix}-width-input`}
            type="number"
            value={width}
            onChange={(e) => {
              const newWidth = Number.parseFloat(e.target.value);
              if (!isNaN(newWidth) && newWidth >= 0) {
                onWidthChange(newWidth);
              }
            }}
            className="w-full"
            min={0}
            step={0.01}
          />
        </div>
        <div>
          <Label htmlFor={`${labelPrefix}-length-input`} className="mb-2 block">Length (ft)</Label>
          <Input
            id={`${labelPrefix}-length-input`}
            type="number"
            value={length}
            onChange={(e) => {
              const newLength = Number.parseFloat(e.target.value);
              if (!isNaN(newLength) && newLength >= 0) {
                onLengthChange(newLength);
              }
            }}
            className="w-full"
            min={0}
            step={0.01}
          />
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