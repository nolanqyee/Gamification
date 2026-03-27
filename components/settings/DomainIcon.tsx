'use client'

import dynamic from 'next/dynamic'
import { icons } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

interface Props extends Omit<LucideProps, 'name'> {
  name: string | null | undefined
  fallback?: string
}

export function DomainIcon({ name, fallback = 'star', ...props }: Props) {
  if (!name) name = fallback
  // Convert kebab-case to PascalCase
  const pascalName = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

  const IconComponent = (icons as Record<string, React.FC<LucideProps>>)[pascalName]
  if (!IconComponent) {
    const Fallback = (icons as Record<string, React.FC<LucideProps>>)['Star']
    return Fallback ? <Fallback {...props} /> : null
  }
  return <IconComponent {...props} />
}
