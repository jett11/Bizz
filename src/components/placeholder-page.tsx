import { Construction } from 'lucide-react'

export function PlaceholderPage({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Construction className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold capitalize tracking-tight">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {note ?? 'This module is enabled for your business and is coming in a later build phase.'}
      </p>
    </div>
  )
}
