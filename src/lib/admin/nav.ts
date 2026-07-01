export interface AdminNavItem {
  href: string
  label: string
  description?: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Overview',
    description: 'Stats, subscriptions, and activity',
  },
  {
    href: '/admin/shoutouts',
    label: 'Featured shoutouts',
    description: 'Paid placement slots',
  },
]

export const ADMIN_NAV_COMING_SOON = [
  'Partners',
  'Members',
  'Trip Help orders',
] as const
