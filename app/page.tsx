import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { InventoryTabs } from "@/components/inventory-tabs"

export const revalidate = 0

export default async function Home() {
  const supabase = await createClient()
  
  const [cordasResult, packFestivalResult] = await Promise.all([
    supabase.from("cordas").select("*").order("categoria", { ascending: true }),
    supabase.from("pack_festival").select("*").order("categoria", { ascending: true })
  ])
  
  if (cordasResult.error) {
    console.error("Error fetching cordas:", cordasResult.error)
  }
  
  if (packFestivalResult.error) {
    console.error("Error fetching pack_festival:", packFestivalResult.error)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <InventoryTabs 
          cordas={cordasResult.data || []} 
          packFestival={packFestivalResult.data || []} 
        />
      </div>
    </main>
  )
}
