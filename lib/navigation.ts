import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Brain,
  Clock,
  Columns3,
  FolderKanban,
  FolderRoot,
  Home,
  Inbox,
  MessageSquare,
  Sparkles,
  Settings,
} from 'lucide-react'

export interface NavItemDefinition {
  href: string
  label: string
  icon: LucideIcon
  badge?: 'agents' | 'unread' | 'errors'
}

export const PRIMARY_NAV_ITEMS: NavItemDefinition[] = [
  { href: '/', label: 'Briefing', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderRoot },
  { href: '/work', label: 'Board', icon: FolderKanban },
  { href: '/review', label: 'Review Queue', icon: Sparkles },
  { href: '/chat', label: 'Conversations', icon: MessageSquare },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
]

export const MORE_NAV_ITEMS: NavItemDefinition[] = [
  { href: '/schedules', label: 'Schedules', icon: Clock, badge: 'errors' },
  { href: '/artifacts', label: 'Artifacts', icon: Columns3 },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export const DESKTOP_NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS]
