import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-cobalt text-cobalt-ink hover:opacity-90',
        secondary: 'border border-line bg-surface text-ink hover:border-slate',
        ghost: 'text-slate hover:bg-surface hover:text-ink',
        danger: 'border border-line bg-surface text-danger hover:bg-danger-soft',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonVariants = VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<'button'> & ButtonVariants) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & ButtonVariants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
