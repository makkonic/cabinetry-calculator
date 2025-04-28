"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/settings-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SettingsPanel() {
  const { contingencyRate, tariffRate, setContingencyRate, setTariffRate } = useSettings();
  
  // Local state for form values
  const [localContingencyRate, setLocalContingencyRate] = useState(contingencyRate * 100);
  const [localTariffRate, setLocalTariffRate] = useState(tariffRate * 100);

  // Handle saving settings
  const handleSaveSettings = () => {
    setContingencyRate(localContingencyRate / 100);
    setTariffRate(localTariffRate / 100);
  };

  // Handle slider changes
  const handleContingencyChange = (value: number[]) => {
    setLocalContingencyRate(value[0]);
  };

  const handleTariffChange = (value: number[]) => {
    setLocalTariffRate(value[0]);
  };

  // Handle input changes
  const handleContingencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setLocalContingencyRate(isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100));
  };

  const handleTariffInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setLocalTariffRate(isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="ml-2">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Calculator Settings</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          <Card className="p-4">
            <h3 className="font-medium mb-4">Price Adjustments</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contingency-rate">Contingency Rate (%)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="contingency-slider"
                    min={0}
                    max={30}
                    step={0.5}
                    value={[localContingencyRate]}
                    onValueChange={handleContingencyChange}
                    className="flex-1"
                  />
                  <Input
                    id="contingency-rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={localContingencyRate}
                    onChange={handleContingencyInputChange}
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tariff-rate">Tariff Rate (%)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="tariff-slider"
                    min={0}
                    max={30}
                    step={0.5}
                    value={[localTariffRate]}
                    onValueChange={handleTariffChange}
                    className="flex-1"
                  />
                  <Input
                    id="tariff-rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={localTariffRate}
                    onChange={handleTariffInputChange}
                    className="w-20"
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
} 