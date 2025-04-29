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
// Import pdfme libraries
import type { Template } from '@pdfme/common';
import { BLANK_PDF } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';

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

// PriceSummaryItem extends the items in PricingSummary
interface PriceSummaryItem {
  name: string;
  price: number;
  room_name: string;
  area?: string; // Extracted from name: "Name (area)"
  displayName?: string; // Name without area prefix
}

// Organized structure now uses categories instead of rooms
interface OrganizedItems {
  categories: {
    [category: string]: {
      categoryTotal: number;
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

// Function to map area to category display name
function getCategoryFromArea(area: string): string {
  if (!area) return "Other";
  if (area.includes("kitchen-surface")) return "Surfaces";
  if (area.includes("kitchen-island")) return "Island";
  if (area === "kitchen" || area.includes("cabinet")) return "Cabinets";
  return "Other";
}

// Function to extract area from item name
function getAreaFromName(name: string): string {
  const parts = name.split('(');
  if (parts.length > 1) {
    const areaPart = parts[1].replace(')', '').trim();
    return areaPart;
  }
  return "";
}

// Function to get display name without area
function getDisplayName(item: PriceSummaryItem): string {
  // If this item already has a displayName, use it
  if (item.displayName) return item.displayName;
  
  // Otherwise try to extract it from the name
  const parts = item.name.split('(');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  
  return item.name;
}

export function PriceSummary({ pricingSummary }: PriceSummaryProps) {
  const [activeTab, setActiveTab] = useState<string>("retail2");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef<boolean>(true);

  // Use effect to handle component unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to organize items by category
  function organizeItems(items: PriceSummaryItem[]): OrganizedItems {
    const organized: OrganizedItems = {
      categories: {},
      total: 0,
      subtotal: 0,
      buffer: 0,
      tariff: 0
    };
    
    let subtotal = 0;
    
    // Group items by category based on area
    items.forEach(item => {
      const area = item.area || getAreaFromName(item.name);
      const category = getCategoryFromArea(area);
      
      if (!organized.categories[category]) {
        organized.categories[category] = {
          categoryTotal: 0,
          items: []
        };
      }
      
      // Set displayName if not already set
      if (!item.displayName) {
        item.displayName = getDisplayName(item);
      }
      
      // Add item to category
      organized.categories[category].items.push(item);
      
      // Update category total
      organized.categories[category].categoryTotal += item.price;
      
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
      categories: {}, 
      total: 0, 
      subtotal: 0, 
      buffer: 0, 
      tariff: 0 
    } as OrganizedItems;
    
    // Convert items to our format with area info
    const items: PriceSummaryItem[] = [];
    
    // Process all items and extract area information
    if (pricingSummary.items) {
      pricingSummary.items.forEach(item => {
        // Extract area from name since it's not directly on the item
        const area = getAreaFromName(item.name);
        
        items.push({
          name: item.name,
          price: item.price,
          room_name: "Kitchen", // All items go to Kitchen room
          area: area,
          displayName: getDisplayName({name: item.name, price: item.price, room_name: "Kitchen", area})
        });
      });
    }
    
    return organizeItems(items);
  }, [pricingSummary]);

  // Format category name for display
  const formatCategoryDisplay = (category: string): string => {
    if (!category || category === 'Other') return 'Other Items';
    return category;
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
    
    // Define a specific order for categories
    const categoryOrder = ["Cabinets", "Surfaces", "Island", "Other"];
    
    // Sort categories by the defined order
    const sortedCategoryNames = Object.keys(organizedItems.categories).sort((a, b) => {
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });
    
    return (
      <div className="price-summary space-y-4">
        {sortedCategoryNames.map(categoryName => {
          const categoryData = organizedItems.categories[categoryName];
          
          return (
            <Collapsible 
              key={categoryName} 
              defaultOpen={true} 
              open={isPrinting ? true : expandedCategories[categoryName] !== false} 
              onOpenChange={(isOpen) => {
                setExpandedCategories(prev => ({...prev, [categoryName]: isOpen}));
              }}
              className="border rounded-lg shadow-sm"
            >
              <CollapsibleTrigger className="flex justify-between items-center w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg">
                <div className="flex items-center">
                  <span className="text-lg font-semibold">{formatCategoryDisplay(categoryName)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-primary mr-2">
                    <NumberFlow 
                      value={categoryData.categoryTotal * multiplier} 
                      format={{ 
                        style: 'currency', 
                        currency: 'USD',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }}
                      transformTiming={{ duration: 500, easing: 'ease-out' }}
                    />
                  </span>
                  <ChevronDown className="h-5 w-5" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 border-t">
                <div className="space-y-3">
                  {categoryData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm">{item.displayName || item.name}</span>
                      <span className="text-sm font-medium">
                        <NumberFlow 
                          value={item.price * multiplier} 
                          format={{ 
                            style: 'currency', 
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }}
                          transformTiming={{ duration: 500, easing: 'ease-out' }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Subtotal</span>
            <span className="text-sm font-medium">
              <NumberFlow 
                value={organizedItems.subtotal * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 500, easing: 'ease-out' }}
              />
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Contingency ({BUFFER_RATE * 100}%)</span>
            <span className="text-sm">
              <NumberFlow 
                value={organizedItems.buffer * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 500, easing: 'ease-out' }}
              />
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm">Tariff ({TARIFF_RATE * 100}%)</span>
            <span className="text-sm">
              <NumberFlow 
                value={organizedItems.tariff * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 500, easing: 'ease-out' }}
              />
            </span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span>Total</span>
            <span>
              <NumberFlow 
                value={organizedItems.total * multiplier} 
                format={{ 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }}
                transformTiming={{ duration: 500, easing: 'ease-out' }}
              />
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Handle print using browser's print functionality
  const handlePrint = async () => {
    if (typeof window === "undefined") return;
    setIsPrinting(true);
    
    // Make sure all sections are expanded for printing
    const allCategories = Object.keys(summaryItems.categories);
    const expandAll = allCategories.reduce((acc, category) => ({
      ...acc,
      [category]: true
    }), {});
    setExpandedCategories(expandAll);
    
    // Wait a bit for state to update
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // Handle export to PDF using PDF.me
  const handleExportPDF = async () => {
    if (typeof window === "undefined") return;
    setIsPrinting(true);
    
    try {
      // Make sure all sections are expanded for PDF export
      const allCategories = Object.keys(summaryItems.categories);
      const expandAll = allCategories.reduce((acc, category) => ({
        ...acc,
        [category]: true
      }), {});
      setExpandedCategories(expandAll);
      
      // Create a PDF.me template
      const template: Template = {
        basePdf: BLANK_PDF,
        schemas: [
          [
            // Title
            {
              name: 'title',
              type: 'text',
              position: { x: 10, y: 10 },
              width: 190,
              height: 10,
              fontSize: 16,
              fontWeight: 'bold',
              alignment: 'center',
            },
            // Subtitle - current price level
            {
              name: 'subtitle',
              type: 'text',
              position: { x: 10, y: 25 },
              width: 190,
              height: 8,
              fontSize: 12,
              alignment: 'center',
            },
            // Date
            {
              name: 'date',
              type: 'text',
              position: { x: 10, y: 35 },
              width: 190,
              height: 8,
              fontSize: 10,
              alignment: 'center',
            },
            // Content area
            {
              name: 'content',
              type: 'text',
              position: { x: 10, y: 50 },
              width: 190,
              height: 200,
              fontSize: 10,
              lineHeight: 1.5,
            },
            // Total
            {
              name: 'total',
              type: 'text',
              position: { x: 10, y: 260 },
              width: 190,
              height: 10,
              fontSize: 12,
              fontWeight: 'bold',
              alignment: 'right',
            },
            // Footer
            {
              name: 'footer',
              type: 'text',
              position: { x: 10, y: 280 },
              width: 190,
              height: 8,
              fontSize: 8,
              alignment: 'center',
            },
          ],
        ],
      };
      
      // Format content for PDF
      const multiplier = getMultiplierForTab(activeTab);
      let contentText = '';
      
      // Format categories and items
      Object.keys(summaryItems.categories).forEach(categoryName => {
        const categoryData = summaryItems.categories[categoryName];
        
        contentText += `${formatCategoryDisplay(categoryName)}\n`;
        contentText += '----------------------------------------\n';
        
        categoryData.items.forEach(item => {
          const itemPrice = (item.price * multiplier).toLocaleString('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          contentText += `${getDisplayName(item)}: ${itemPrice}\n`;
        });
        
        const categoryTotal = (categoryData.categoryTotal * multiplier).toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        contentText += `Category Total: ${categoryTotal}\n\n`;
      });
      
      // Add summary totals
      contentText += '\nSummary\n';
      contentText += '----------------------------------------\n';
      contentText += `Subtotal: ${(summaryItems.subtotal * multiplier).toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}\n`;
      
      contentText += `Contingency (${BUFFER_RATE * 100}%): ${(summaryItems.buffer * multiplier).toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}\n`;
      
      contentText += `Tariff (${TARIFF_RATE * 100}%): ${(summaryItems.tariff * multiplier).toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}\n`;
      
      // Generate a formatted date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Format the price level for display
      let priceLevel = '';
      switch (activeTab) {
        case 'dealer':
          priceLevel = 'Dealer Pricing';
          break;
        case 'trade':
          priceLevel = 'Trade Pricing';
          break;
        case 'retail1':
          priceLevel = 'Retail 1 Pricing';
          break;
        case 'retail2':
          priceLevel = 'Retail 2 Pricing';
          break;
      }
      
      // Setup input data for the PDF
      const inputs = [
        {
          title: 'Kitchen Calculation Summary',
          subtitle: priceLevel,
          date: `Generated on ${currentDate}`,
          content: contentText,
          total: `Total: ${(summaryItems.total * multiplier).toLocaleString('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          footer: 'This is a computer-generated document. Prices are subject to change without notice.'
        },
      ];
      
      // Define plugins
      const plugins = { text };
      
      // Generate PDF
      const pdf = await generate({ template, inputs, plugins });
      
      // Create Blob and download - fix the ArrayBuffer type
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create hidden link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kitchen-calculation.pdf';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
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
