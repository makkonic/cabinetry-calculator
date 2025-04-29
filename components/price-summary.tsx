"use client"

import React, { useState, useMemo, useRef, useEffect, useContext, createContext } from 'react';
import { PricingSummary } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Printer, CreditCard, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import dynamic from 'next/dynamic';

// Constants for calculations
const BUFFER_RATE = 0.05; // 5% buffer
const TARIFF_RATE = 0.10; // 10% tariff

// Utility functions
const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

const getMultiplierForTab = (activeTab: string): number => {
  switch (activeTab) {
    case "dealer":
      return 1;
    case "trade":
      return 1.4;
    case "retail1":
      return 2;
    case "retail2":
      return 2.5;
    default:
      return 1;
  }
};

interface PriceSummaryProps {
  pricingSummary: PricingSummary
}

// Simplified interfaces for a flat room structure
interface PriceSummaryItem {
  name: string;
  price: number;
  room_name: string;
}

// Simplified structure without area subcategories
interface OrganizedItems {
  rooms: {
    [room: string]: {
      roomTotal: number;
      items: PriceSummaryItem[];
    };
  };
  total: number;
  subtotal: number;
  buffer: number;
  tariff: number;
}

// Define HTML2PDF options type
interface Html2PdfOptions {
  margin?: number;
  filename?: string;
  image?: { 
    type: string; 
    quality: number; 
  };
  html2canvas?: { 
    scale: number;
  };
  jsPDF?: { 
    unit: string; 
    format: string; 
    orientation: "portrait" | "landscape"; 
  };
}

export function PriceSummary({ pricingSummary }: PriceSummaryProps) {
  const [activeTab, setActiveTab] = useState<string>("retail2");
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [expandedAreas, setExpandedAreas] = useState<Record<string, Record<string, boolean>>>({});
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef<boolean>(true);

  // Use effect to handle component unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to organize items by room only
  function organizeItems(items: PriceSummaryItem[]): OrganizedItems {
    const organized: OrganizedItems = {
      rooms: {},
      total: 0,
      subtotal: 0,
      buffer: 0,
      tariff: 0
    };
    
    let subtotal = 0;
    
    // Group items by room only
    items.forEach(item => {
      if (!organized.rooms[item.room_name]) {
        organized.rooms[item.room_name] = {
          roomTotal: 0,
          items: []
        };
      }
      
      // Add item to room
      organized.rooms[item.room_name].items.push(item);
      
      // Update room total
      organized.rooms[item.room_name].roomTotal += item.price;
      
      // Update subtotal
      subtotal += item.price;
    });
    
    // Calculate final totals
    organized.subtotal = subtotal;
    organized.buffer = subtotal * BUFFER_RATE;
    organized.tariff = (subtotal + organized.buffer) * TARIFF_RATE;
    organized.total = subtotal + organized.buffer + organized.tariff;
    
    return organized;
  }

  // Process the summary data
  const summaryItems = useMemo(() => {
    if (!pricingSummary) return { 
      rooms: {}, 
      total: 0, 
      subtotal: 0, 
      buffer: 0, 
      tariff: 0 
    } as OrganizedItems;
    
    // Put all items in the Kitchen category
    const items: PriceSummaryItem[] = [];
    
    // Process all items and place them in Kitchen
    if (pricingSummary.items) {
      pricingSummary.items.forEach(item => {
        items.push({
          name: item.name,
          price: item.price,
          room_name: "Kitchen" // All items go to Kitchen
        });
      });
    }
    
    return organizeItems(items);
  }, [pricingSummary]);

  // Format room name for display
  const formatRoomDisplay = (room: string): string => {
    if (!room || room === 'Other') return 'Other Items';
    return room;
  };

  // Simplified OrganizedItemList component using Shadcn Collapsible
  const OrganizedItemList = ({ 
    organizedItems, 
    activeTab, 
    isPrinting 
  }: { 
    organizedItems: OrganizedItems, 
    activeTab: string,
    isPrinting: boolean
  }) => {
    const multiplier = getMultiplierForTab(activeTab);
    
    // Sort rooms by name
    const sortedRoomNames = Object.keys(organizedItems.rooms).sort();
    
    return (
      <div className="price-summary space-y-4">
        {sortedRoomNames.map(roomName => {
          const roomData = organizedItems.rooms[roomName];
          
          return (
            <Collapsible key={roomName} defaultOpen={true} className="border rounded-lg shadow-sm">
              <CollapsibleTrigger className="flex justify-between items-center w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg">
                <div className="flex items-center">
                  <span className="text-lg font-semibold">{roomName}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-primary mr-2">
                    <NumberFlow 
                      value={roomData.roomTotal * multiplier} 
                      format={{ 
                        style: 'currency', 
                        currency: 'USD',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }}
                      transformTiming={{ duration: 500, easing: 'ease-out' }}
                    />
                  </span>
                  {!isPrinting && <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform ui-open:rotate-180" />}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-3 pt-0">
                <table className="w-full">
                  <tbody>
                    {roomData.items.map((item, index) => (
                      <tr key={index} className="item-row border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 text-sm">{item.name}</td>
                        <td className="py-2 text-sm text-right">
                          <NumberFlow 
                            value={item.price * multiplier} 
                            format={{ 
                              style: 'currency', 
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }}
                            transformTiming={{ duration: 400, easing: 'ease-out' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        {/* Summary section with animated numbers */}
        <NumberFlowGroup>
          <div className="summary-section mt-6 pt-4 border-t">
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span>Subtotal:</span>
              <NumberFlow 
                value={organizedItems.subtotal * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 600, easing: 'ease-out' }}
              />
            </div>
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span>Contingency ({BUFFER_RATE * 100}%):</span>
              <NumberFlow 
                value={organizedItems.buffer * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 600, easing: 'ease-out' }}
              />
            </div>
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span>Tariff ({TARIFF_RATE * 100}%):</span>
              <NumberFlow 
                value={organizedItems.tariff * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 600, easing: 'ease-out' }}
              />
            </div>
            <div className="flex justify-between mt-4 text-base font-bold">
              <span>Total:</span>
              <NumberFlow 
                value={organizedItems.total * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 750, easing: 'ease-out' }}
                className="text-lg"
              />
            </div>
          </div>
        </NumberFlowGroup>
      </div>
    );
  };

  const handlePrint = async () => {
    if (typeof window === "undefined") return;
    setIsPrinting(true);
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      if (!printRef.current || !isMounted.current) {
        setIsPrinting(false);
        return;
      }
      
      const element = printRef.current;
      const opt = {
        margin: 10,
        filename: "kitchen-calculation.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as any },
      };
      
      await html2pdf().set(opt).from(element).save();
      
      if (isMounted.current) {
        setIsPrinting(false);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      if (isMounted.current) {
        setIsPrinting(false);
      }
    }
  };

  const handleExportPDF = async () => {
    if (typeof window === "undefined") return;
    setIsPrinting(true);
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      if (!printRef.current || !isMounted.current) {
        setIsPrinting(false);
        return;
      }
      
      const element = printRef.current;
      const opt = {
        margin: 10,
        filename: "kitchen-calculation.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as any },
      };
      
      await html2pdf().set(opt).from(element).save();
      
      if (isMounted.current) {
        setIsPrinting(false);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      if (isMounted.current) {
        setIsPrinting(false);
      }
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <CreditCard className="w-5 h-5 mr-2 text-primary" />
          Price Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={printRef} className={isPrinting ? "print-friendly" : ""}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="dealer">Dealer</TabsTrigger>
              <TabsTrigger value="trade">Trade</TabsTrigger>
              <TabsTrigger value="retail1">Retail 1</TabsTrigger>
              <TabsTrigger value="retail2">Retail 2</TabsTrigger>
            </TabsList>

            <TabsContent value="dealer" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="dealer" isPrinting={isPrinting} />
              </div>
            </TabsContent>

            <TabsContent value="trade" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="trade" isPrinting={isPrinting} />
              </div>
            </TabsContent>

            <TabsContent value="retail1" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="retail1" isPrinting={isPrinting} />
              </div>
            </TabsContent>

            <TabsContent value="retail2" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="retail2" isPrinting={isPrinting} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex space-x-2 mt-6">
          <Button onClick={handlePrint} variant="outline" className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
