"use client";

import { useState, useEffect } from "react";
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
  const [isSaved, setIsSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Update local state when context values change
  useEffect(() => {
    setLocalContingencyRate(contingencyRate * 100);
    setLocalTariffRate(tariffRate * 100);
  }, [contingencyRate, tariffRate]);

  // Reset saved state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
    }
  }, [isOpen]);

  // Handle saving settings
  const handleSaveSettings = () => {
    console.log('Saving settings:', {
      contingencyRate: localContingencyRate / 100,
      tariffRate: localTariffRate / 100
    });
    setContingencyRate(localContingencyRate / 100);
    setTariffRate(localTariffRate / 100);
    setIsSaved(true);
    
    // Close the sheet after a short delay to show the saved feedback
    setTimeout(() => {
      setIsOpen(false);
      setIsSaved(false);
    }, 1000);
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
                  <Input
                    id="contingency-rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={localContingencyRate}
                    onChange={handleContingencyInputChange}
                    className="w-32"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tariff-rate">Tariff Rate (%)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="tariff-rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={localTariffRate}
                    onChange={handleTariffInputChange}
                    className="w-32"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSaveSettings} 
                className={`w-full ${isSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {isSaved ? "Settings Saved! ✓" : "Save Settings"}
              </Button>
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
} 