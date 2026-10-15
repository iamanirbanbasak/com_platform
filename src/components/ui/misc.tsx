import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'cobalt' | 'ok' | 'danger'
  className?: string
}) {
  const tones = {
    neutral: 'bg-surface text-slate border border-line',
    cobalt: 'bg-cobalt-soft text-cobalt',
    ok: 'bg-ok-soft text-ok',
    danger: 'bg-danger-soft text-danger',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10">
      <p className="font-display text-lg font-bold">{title}</p>
      {children ? <div className="mt-1 max-w-prose text-slate">{children}</div> : null}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-prose text-slate">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  )
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>
}
