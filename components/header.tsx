import Image from "next/image"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <Image
            src="/trovantina.jpg"
            alt="Trovantina Logo"
            width={60}
            height={60}
            className="rounded-full sm:w-20 sm:h-20"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
              Trovantina
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Inventário de Cordas
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
