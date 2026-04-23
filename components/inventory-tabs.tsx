"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryTable } from "@/components/inventory-table"

interface Corda {
  id: string
  categoria: string
  tipo: string
  quantidade: number
}

interface InventoryTabsProps {
  cordas: Corda[]
  packFestival: Corda[]
}

export function InventoryTabs({ cordas, packFestival }: InventoryTabsProps) {
  return (
    <Tabs defaultValue="cacifo" className="w-full">
      <TabsList className="grid w-full max-w-xs sm:max-w-md mx-auto grid-cols-2 mb-4 sm:mb-8">
        <TabsTrigger value="cacifo" className="text-xs sm:text-sm font-medium py-2 sm:py-2.5">
          Cacifo
        </TabsTrigger>
        <TabsTrigger value="pack-festival" className="text-xs sm:text-sm font-medium py-2 sm:py-2.5">
          Pack Festival
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="cacifo">
        <InventoryTable initialCordas={cordas} tableName="cordas" />
      </TabsContent>
      
      <TabsContent value="pack-festival">
        <InventoryTable initialCordas={packFestival} tableName="pack_festival" />
      </TabsContent>
    </Tabs>
  )
}
