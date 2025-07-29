"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, HelpCircle, X } from "lucide-react"

interface PriceLevelData {
  [key: number]: string[]
}

const PRICE_LEVEL_DATA: PriceLevelData = {
  0: [
    "SM01 bianco neve", "SM02 beige cina", "SM04 grigio agata", "NM01 rosso amaranto",
    "NM02 lava", "NM03 verde petrolio", "NM04 grigio piombo", "S176 chiaro", "S180 biondo",
    "S181 scuro", "S795 asia", "S796 america", "S797 europa", "S798 australia"
  ],
  1: [
    "S157 crudo", "S077 jazz", "S028 eucalipto vintage", "S029 eucalipto scuro", "SF01 bianco alpi",
    "SF02 beige ardenne", "SF03 nocciola", "CA01 bianco luna", "CA02 grigio nuvola", "CA03 grigio ossido",
    "CA05 grigio titanio", "S190 sbiancato", "S191 miele", "S192 brandy", "S193 wengè", "S795 asia",
    "S796 america", "S797 europa", "S798 australia", "BE01 pure", "BE02 gris", "BE03 dark",
    "ME03 iron", "AL01 magnesio", "AL02 zinco", "AL04 manganese", "AL05 basalto", "ST01 calacatta",
    "ST02 sand", "ST03 grey", "CE01 ivory", "CE02 light grey", "CE03 nude", "CE04 azure",
    "CE05 chester green", "CE06 ochre", "SC28 impero", "SC22 white kandia", "SC31 nero ardesia",
    "SC24 olympo", "SC29 sahara noir", "MT02 mida", "MT03 riace", "M9016 bianco traffico-1S",
    "M200 bianco ghiaccio-1S", "M201 bianco soft-1S", "M9001 crema-1S", "M202 yuta-1S",
    "M203 grigio corda-1S", "M204 beige avena-1S", "M206 ecrù-1S", "M232 taupe-1S",
    "M225 giallo arena-1S", "M211 mandarino-1S", "M212 rosso-1S", "M213 bordeaux-1S",
    "M222 rosso mattone-1S", "M224 verde pastello-1S", "M223 verde salvia-1S", "M226 blu pastello-1S",
    "M227 blu dark-1S", "M228 grigio seta-1S", "M229 grigio minerale-1S", "M230 grigio polvere-1S",
    "M231 grigio basalto-1S", "M233 fango-1S", "M234 tundra-1S", "M235 caffè-1S", "M220 ardesia-1S",
    "M221 grigio stone-1S", "M9005 nero profondo-1S"
  ],
  2: [
    "S035 coffee", "S036 black pepper", "CN01 eucalipto cannetè", "771 bianco", "774 cashmere",
    "TE01 bianco puro", "TE02 beige sabbia", "TE04 grigio ardesia", "TE05 nero segnale",
    "TE06 verde pallido", "TE07 grigio luce", "TE08 verde felce", "TE09 blu indaco", "TE23 gold",
    "TE24 glam bronze"
  ],
  3: [
    "200 bianco ghiaccio", "5700 bianco", "5707 hill", "5708 noce vintage", "5721 noisette",
    "5722 cappuccino", "5723 grigio ferro", "5724 paprika", "5704 forest", "5561 bianco",
    "5568 bianco pietra", "5594 tosca", "5604 damvei", "5605 blimè", "5597 chiba", "5598 akita",
    "5599 jamir", "5606 nero hoba", "5576 ruggine new", "5595 faucon", "5577 argento new",
    "5567 vulcano pietra", "5591 kaliba", "5602 nero marquinia", "5603 moiet", "5573 calais"
  ],
  4: [
    "FE06 bianco kos", "FE09 beige arizona", "FE15 grigio aragona", "FE10 cacao orinoco",
    "FE07 grigio efeso", "FE03 grigio londra", "FE08 grigio bromo", "FE04 nero ingo",
    "FE12 blu fes", "FE14 verde comodoro", "FE16 verde kitami"
  ],
  5: [
    "SI55 champagne", "SI53 ottone antico", "SI60 rame antico", "SI57 piombo",
    "FE20 acciaio hamilton (1 side)", "FE21 argento dukat (1 side)", "FE23 oro cortez (1 side)"
  ],
  6: [
    "F01 bianco", "F02 lino", "F03 visone", "F06 nero grafite", "F07 grigio", "F09 bronzo impero",
    "F10 grigio antracite", "401 rovere naturale", "403 muschio", "404 grigio siliceo",
    "405 karbon", "406 brown", "421 rovere naturale", "423 muschio", "424 grgio siliceo",
    "425 karbon", "426 brown", "283 bronzo", "284 ferro naturale", "M9016 bianco traffico-2S",
    "M200 bianco ghiaccio-2S", "M201 bianco soft-2S", "M9001 crema-2S", "M202 yuta-2S",
    "M203 grigio corda-2S", "M204 beige avena-2S", "M206 ecrù-2S", "M232 taupe-2S",
    "M225 giallo arena-2S", "M211 mandarino-2S", "M212 rosso-2S", "M213 bordeaux-2S",
    "M222 rosso mattone-2S", "M224 verde pastello-2S", "M223 verde salvia-2S", "M226 blu pastello-2S",
    "M227 blu dark-2S", "M228 grigio seta-2S", "M229 grigio minerale-2S", "M230 grigio polvere-2S",
    "M231 grigio basalto-2S", "M233 fango-2S", "M234 tundra-2S", "M235 caffè-2S", "M220 ardesia-2S",
    "M221 grigio stone-2S", "M9005 nero profondo-2S", "501 rovere naturale", "506 grigio pietra",
    "508 fumo", "509 torba", "553 gesso", "558 bianco burro", "557 creta", "559 perla", "560 argilla"
  ],
  7: [
    "485 grigio bruciato", "471 rovere naturale", "475 cognac", "411 bruges", "412 silver",
    "413 smoke", "FE06 bianco kos - 2S", "200 bianco ghiaccio - 2S", "201 bianco soft - 2S",
    "9001 crema - 2S", "202 yuta - 2S", "203 grigio corda - 2S", "204 beige avena - 2S",
    "206 ecrù - 2S", "232 taupe - 2S", "225 giallo arena - 2S", "211 mandarino - 2S",
    "212 rosso - 2S", "213 bordeaux - 2S", "222 rosso mattone - 2S", "224 verde pastello - 2S",
    "223 verde salvia - 2S", "226 blu pastello - 2S", "227 blu dark - 2S", "228 grigio seta - 2S",
    "229 grigio minerale - 2S", "230 grigio polvere - 2S", "231 grigio basalto - 2S", "233 fango - 2S",
    "234 tundra - 2S", "235 caffè - 2S", "220 ardesia - 2S", "221 grigio stone - 2S", "9005 nero profondo - 2S"
  ],
  8: [
    "456 noce canaletto", "401 rovere naturale", "403 muschio", "404 grgio siliceo", "405 karbon",
    "406 brown", "421 rovere naturale", "423 muschio", "424 grgio siliceo", "425 karbon", "426 brown",
    "283 bronzo", "284 ferro naturale", "291 ottone NEW", "292 rame NEW", "293 platino NEW",
    "294 corten NEW", "295 acciaio NEW", "461 noce doga", "SP461 noce doga", "F01 bianco", "F02 lino",
    "F03 visone", "F06 nero grafite", "F07 grigio", "F09 bronzo impero", "F10 grigio antracite",
    "466 noce doga 2.0", "SP466 noce doga 2.0"
  ],
  9: [
    "451 rovere termocotto", "452 eucalipto termocotto", "475 cognac", "456 noce canaletto",
    "457 noce crudo", "491 grigio tundra", "492 tabacco", "493 terra di siena", "494 nero pece",
    "482 abete nero", "291 ottone NEW", "292 rame NEW", "283 bronzo", "284 ferro naturale",
    "M9016 bianco traffico-2S", "M200 bianco ghiaccio-2S", "M201 bianco soft-2S", "M9001 crema-2S",
    "M202 yuta-2S", "M203 grigio corda-2S", "M204 beige avena-2S", "M206 ecrù-2S", "M232 taupe-2S",
    "M225 giallo arena-2S", "M211 mandarino-2S", "M212 rosso-2S", "M213 bordeaux-2S", "M222 rosso mattone-2S",
    "M224 verde pastello-2S", "M223 verde salvia-2S", "M226 blu pastello-2S", "M227 blu dark-2S",
    "M228 grigio seta-2S", "M229 grigio minerale-2S", "M230 grigio polvere-2S", "M231 grigio basalto-2S",
    "M233 fango-2S", "M234 tundra-2S", "M235 caffè-2S", "M220 ardesia-2S", "M221 grigio stone-2S",
    "M9005 nero profondo-2S", "501 rovere naturale", "506 grigio pietra", "508 fumo", "509 torba"
  ],
  10: [
    "G03 calce avorio", "G04 calce nero", "G31 calce bianco", "G32 pietra di Savoia grigia",
    "G33 pietra di Savoia antracite", "G65 bianco assoluto", "G66 (soft touch) calacatta oro venato",
    "G67 (soft touch) bianco statuario venato", "G68 (soft touch) emperador extra", "G69 stone grey",
    "G70 noir desir", "G71 nero assoluto", "462 rovere termocotto", "SP462 rovere termocotto",
    "463 rovere nero", "SP463 rovere nero", "464 rovere naturale doga", "SP464 rovere naturale doga",
    "467 rovere term. doga", "SP467 rovere term. doga 2.0", "468 rovere nero doga 2.0",
    "SP468 rovere nero doga 2.0", "469 rovere naturale doga 2.0", "SP469 rovere naturale doga 2.0"
  ]
}

interface PriceLevelCheatSheetProps {
  className?: string
}

export function PriceLevelCheatSheet({ className }: PriceLevelCheatSheetProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const filteredData = selectedLevel !== null 
    ? PRICE_LEVEL_DATA[selectedLevel]?.filter((product: string) => 
        product.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : Object.entries(PRICE_LEVEL_DATA).flatMap(([level, products]) =>
        products.filter((product: string) => 
          product.toLowerCase().includes(searchTerm.toLowerCase())
        ).map((product: string) => `Level ${level}: ${product}`)
      )

  return (
    <div className={className}>
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Price Level Cheat Sheet
            <Badge variant="secondary" className="text-xs">
              {Object.keys(PRICE_LEVEL_DATA).length} Levels
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={selectedLevel?.toString() || "all"} onValueChange={(value) => {
              if (value === "all") {
                setSelectedLevel(null)
              } else {
                setSelectedLevel(parseInt(value))
              }
            }}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                {Object.keys(PRICE_LEVEL_DATA).slice(0, 5).map(level => (
                  <TabsTrigger key={level} value={level} className="text-xs">
                    {level}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsList className="grid w-full grid-cols-6 mt-1">
                {Object.keys(PRICE_LEVEL_DATA).slice(5).map(level => (
                  <TabsTrigger key={level} value={level} className="text-xs">
                    {level}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          <div className="max-h-64 overflow-y-auto px-4 pb-4">
            {filteredData.length > 0 ? (
              <div className="space-y-1">
                {filteredData.map((product, index) => (
                  <div key={index} className="text-sm py-1 px-2 rounded hover:bg-gray-50">
                    {product}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No products found matching "{searchTerm}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PriceLevelTooltipProps {
  children: React.ReactNode
  className?: string
}

export function PriceLevelTooltip({ children, className }: PriceLevelTooltipProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {children}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Open price level cheat sheet</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <PriceLevelCheatSheet />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
} 