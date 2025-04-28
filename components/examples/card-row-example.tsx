"use client"

import React, { useState } from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardRow,
  CardControlRow
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { NumberFlowSlider } from '@/components/ui/number-flow-slider'

export function CardRowExample() {
  const [sliderValue, setSliderValue] = useState<number>(20)
  const [priceLevel, setPriceLevel] = useState<string>("3")
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Card Row Examples</h1>
      
      {/* Example 1: Standard CardRow */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Card Row Example</CardTitle>
        </CardHeader>
        <CardContent>
          <CardRow>
            <div className="w-1/2">
              <Label htmlFor="slider-basic">Slider</Label>
              <Slider 
                id="slider-basic"
                value={[sliderValue]}
                min={0}
                max={100}
                step={1}
                onValueChange={(val) => setSliderValue(val[0])}
              />
            </div>
            <div className="w-1/4">
              <Label htmlFor="dropdown-basic">Price Level</Label>
              <Select value={priceLevel} onValueChange={setPriceLevel}>
                <SelectTrigger id="dropdown-basic">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      Level {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/4">
              <Label htmlFor="number-basic">Value</Label>
              <Input
                id="number-basic"
                type="number"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="text-right"
                min={0}
                max={100}
              />
            </div>
          </CardRow>
        </CardContent>
      </Card>
      
      {/* Example 2: Using CardControlRow */}
      <Card>
        <CardHeader>
          <CardTitle>Specialized Control Row</CardTitle>
        </CardHeader>
        <CardContent>
          <CardControlRow
            sliderSection={
              <div className="space-y-2">
                <Label htmlFor="slider-control">Linear Feet</Label>
                <NumberFlowSlider
                  id="slider-control"
                  value={[sliderValue]}
                  min={0}
                  max={100}
                  step={0.5}
                  onValueChange={(val) => setSliderValue(val[0])}
                  unit="ft"
                />
              </div>
            }
            dropdownSection={
              <div className="space-y-2">
                <Label htmlFor="dropdown-control">Price Level</Label>
                <Select value={priceLevel} onValueChange={setPriceLevel}>
                  <SelectTrigger id="dropdown-control">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Level {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
            numberSection={
              <div className="space-y-2">
                <Label htmlFor="number-control">Value</Label>
                <Input
                  id="number-control"
                  type="number"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="text-right"
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
            }
          />
          
          {/* Multiple control rows can be used */}
          <CardControlRow
            className="mt-6"
            sliderSection={
              <div className="space-y-2">
                <Label htmlFor="slider-second">Width (in)</Label>
                <NumberFlowSlider
                  id="slider-second"
                  value={[sliderValue / 2]}
                  min={0}
                  max={50}
                  step={0.25}
                  onValueChange={(val) => setSliderValue(val[0] * 2)}
                  unit="in"
                />
              </div>
            }
            dropdownSection={
              <div className="space-y-2">
                <Label htmlFor="dropdown-second">Material</Label>
                <Select defaultValue="oak">
                  <SelectTrigger id="dropdown-second">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oak">Oak</SelectItem>
                    <SelectItem value="maple">Maple</SelectItem>
                    <SelectItem value="cherry">Cherry</SelectItem>
                    <SelectItem value="walnut">Walnut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            numberSection={
              <div className="space-y-2">
                <Label htmlFor="number-second">Qty</Label>
                <Input
                  id="number-second"
                  type="number"
                  defaultValue={1}
                  className="text-right"
                  min={1}
                  max={100}
                />
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
} 