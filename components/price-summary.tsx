"use client"

import React, { useState, useMemo, useRef, useEffect, useContext, createContext } from 'react';
import { useRouter } from 'next/navigation';
import { PricingSummary, CalculatorConfig } from "@/lib/calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreditCard, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import dynamic from 'next/dynamic';
import { useSettings } from "@/contexts/settings-context";
import { saveQuote, updateQuote, type Quote } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

// Utility functions
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
  pricingSummary: PricingSummary;
  config: CalculatorConfig;
  editingQuote?: Quote | null;
}

// PriceSummaryItem extends the items in PricingSummary
interface PriceSummaryItem {
  name: string;
  price: number;
  room_name: string;
  area?: string; // Extracted from name: "Name (area)"
  displayName?: string; // Name without area prefix
  measurement?: string; // New field for measurement
  quantity?: number; // New field for quantity
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
function getCategoryFromArea(area: string, itemName?: string): string {
  if (!area) return "Other";
  
  // Check item name first for specific categorization
  if (itemName) {
    // LED Lighting and Transformers are always "Lighting" regardless of area
    if (itemName.includes("LED Lighting") || itemName.includes("Transformer")) {
      return "Lighting";
    }
    
    // Island add-ons should stay in Island category
    if (area.includes("kitchen-island") && 
        (itemName.includes("Aluminum") || itemName.includes("Integrated Sink"))) {
      return "Island";
    }
    
    // Kitchen add-ons (non-island)
    if (area === "kitchen" && 
        (itemName.includes("Aluminum") || itemName.includes("Integrated Sink") || 
         itemName.includes("Power Strip"))) {
      return "Add-ons";
    }
  }
  
  // Then check area
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

export function PriceSummary({ pricingSummary, config, editingQuote }: PriceSummaryProps) {
  const { contingencyRate, tariffRate } = useSettings();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dealer")
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingQuote) {
      setCustomerName(editingQuote.customer_name || "");
      setCustomerEmail(editingQuote.customer_email || "");
      setCustomerPhone(editingQuote.customer_phone || "");
    }
  }, [editingQuote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail) {
      toast({
        title: "Missing information",
        description: "Please provide customer name and email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const quote = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        configuration: config,
        pricing: pricingSummary,
      };

      const result = editingQuote ? await updateQuote(editingQuote.id, quote) : await saveQuote(quote);

      if (result) {
        toast({
          title: editingQuote ? "Quote updated successfully!" : "Quote saved successfully!",
          description: "Redirecting to quote details...",
        });
        setShowCustomerForm(false);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        
        // Small delay to show the success message before redirecting
        setTimeout(() => {
          router.push(`/quotes/${result.id}`);
        }, 1500);
      } else {
        throw new Error("Failed to save quote");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Organize items into categories
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
          displayName: getDisplayName({name: item.name, price: item.price, room_name: "Kitchen", area}),
          measurement: item.measurement,
          quantity: item.quantity
        });
      });
    }
    
    return organizeItems(items);
  }, [pricingSummary]);

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
      const category = getCategoryFromArea(area, item.name);
      
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
    organized.buffer = subtotal * contingencyRate;
    organized.tariff = (subtotal + organized.buffer) * tariffRate;
    organized.total = subtotal + organized.buffer + organized.tariff;
    
    return organized;
  }

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
                      <div className="flex flex-col">
                      <span className="text-sm">{item.displayName || item.name}</span>
                        {item.measurement && (
                          <span className="text-xs text-gray-500">{item.measurement}</span>
                        )}
                      </div>
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
            <span className="text-sm">Contingency ({contingencyRate * 100}%)</span>
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
            <span className="text-sm">Tariff ({tariffRate * 100}%)</span>
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

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <CreditCard className="w-5 h-5 mr-2 text-primary" />
          Price Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="price-summary space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="dealer">Dealer</TabsTrigger>
            <TabsTrigger value="trade">Trade</TabsTrigger>
            <TabsTrigger value="retail1">Retail 1</TabsTrigger>
            <TabsTrigger value="retail2">Retail 2</TabsTrigger>
          </TabsList>

          <TabsContent value="dealer" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="dealer" isPrinting={false} />
            </div>
          </TabsContent>

          <TabsContent value="trade" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="trade" isPrinting={false} />
            </div>
          </TabsContent>

          <TabsContent value="retail1" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="retail1" isPrinting={false} />
            </div>
          </TabsContent>

          <TabsContent value="retail2" className="space-y-4">
              <div className="tab-content">
                <OrganizedItemList organizedItems={summaryItems} activeTab="retail2" isPrinting={false} />
            </div>
          </TabsContent>
        </Tabs>
        </div>

        <div className="flex space-x-2 mt-6">
          <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-primary hover:bg-primary/90">
                <CreditCard className="w-4 h-4 mr-2" />
                {editingQuote ? "Update Quote" : "Save Quote"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingQuote ? "Update Quote" : "Customer Information"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Name</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCustomerForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (editingQuote ? "Updating..." : "Saving...") : (editingQuote ? "Update Quote" : "Save Quote")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Removed the old inline form */}
      </CardContent>
    </Card>
  )
}
