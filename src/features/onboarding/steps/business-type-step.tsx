import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { BUSINESS_TYPE_OPTIONS } from '@/features/onboarding/business-type-options'
import type { BusinessType } from '@/types/database'

export function BusinessTypeStep({
  value,
  onSelect,
  onNext,
}: {
  value: BusinessType | null
  onSelect: (type: BusinessType) => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">What kind of business do you run?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This decides which modules and dashboard we set up for you.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BUSINESS_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                selected
                  ? 'border-primary bg-accent ring-1 ring-primary'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <Button disabled={!value} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  )
}
