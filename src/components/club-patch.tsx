import Image from 'next/image'

import { clubHue, cn, initials } from '@/lib/utils'

type ClubPatchProps = {
  name: string
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'size-9 text-xs rounded-lg',
  md: 'size-14 text-base rounded-xl',
  lg: 'size-20 text-2xl rounded-2xl',
  xl: 'size-28 text-4xl rounded-3xl',
}

/** The club's monogram badge, tinted with a colour derived from its name. */
export function ClubPatch({ name, logoUrl, size = 'md', className }: ClubPatchProps) {
  const hue = clubHue(name)
  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden font-display font-extrabold tracking-tight',
        sizes[size],
        className,
      )}
      style={{
        background: `oklch(0.62 0.16 ${hue})`,
        color: `oklch(0.98 0.02 ${hue})`,
        boxShadow: `inset 0 0 0 3px oklch(0.98 0.02 ${hue} / 0.35)`,
      }}
      aria-hidden={logoUrl ? undefined : true}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={`${name} logo`} fill sizes="112px" className="object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export function clubTint(name: string): string {
  return `oklch(0.62 0.16 ${clubHue(name)})`
}
