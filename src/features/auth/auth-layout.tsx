import type { ReactNode } from 'react'
import { Workflow } from 'lucide-react'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:flex-none lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Workflow className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Bizloom</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden flex-1 bg-sidebar lg:block">
        <div className="absolute inset-0 flex flex-col justify-center gap-6 p-16">
          <p className="text-3xl font-semibold leading-tight text-sidebar-foreground">
            One platform.
            <br />
            Any business.
            <br />
            Complete control.
          </p>
          <p className="max-w-md text-sm text-sidebar-foreground/70">
            Manage customers, employees, finance and growth for every business you run, from a
            single dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
