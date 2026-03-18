import {
  Droplets,
  Route,
  Trash2,
  Lightbulb,
  Waves,
  Heart,
  TreeDeciduous,
  Building2,
  Ban,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Droplets,
  Route,
  Trash2,
  Lightbulb,
  Waves,
  Heart,
  TreeDeciduous,
  Building2,
  Ban,
  MoreHorizontal,
}

interface CategoryIconProps {
  icon: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CategoryIcon({ icon, className, size = 'md' }: CategoryIconProps) {
  const Icon = iconMap[icon] || MoreHorizontal
  
  return (
    <Icon className={cn(
      size === 'sm' && 'h-4 w-4',
      size === 'md' && 'h-5 w-5',
      size === 'lg' && 'h-6 w-6',
      className
    )} />
  )
}
