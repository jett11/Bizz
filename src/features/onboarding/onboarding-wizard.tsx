import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Workflow } from 'lucide-react'
import { cn } from 'cn'
import { Progress } from '@/components/ui/progress'
import { BusinessTypeStep } from '@/features/onboarding/steps/business-type-step'
import { BusinessDetailsStep } from '@/features/onboarding/steps/business-details-step'
import { ModulesStep } from '@/features/onboarding/steps/modules-step'
import { ReviewStep } from '@/features/onboarding/steps/review-step'
import { DEFAULT_ONBOARDING_DATA, type OnboardingData } from '@/features/onboarding/types'

const STEPS = ['Business type', 'Business details', 'Modules', 'Review']

export function OnboardingWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA)

  function patch(update: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...update }))
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Workflow className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Bizloom</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
            {STEPS.map((label, i) => (
              <span key={label} className={cn(i === step && 'text-foreground')}>
                {label}
              </span>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>

        {step === 0 && (
          <BusinessTypeStep
            value={data.businessType}
            onSelect={(businessType) => patch({ businessType })}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <BusinessDetailsStep
            data={data}
            onChange={patch}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && data.businessType && (
          <ModulesStep
            businessType={data.businessType}
            enabledModules={data.enabledModules}
            onChange={(enabledModules) => patch({ enabledModules })}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ReviewStep
            data={data}
            onBack={() => setStep(2)}
            onCreated={() => navigate('/app', { replace: true })}
          />
        )}
      </div>
    </div>
  )
}
