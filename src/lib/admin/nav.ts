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
    href: '/admin/partners',
    label: 'Partners',
    description: 'Businesses on Explore and Trip Help',
  },
  {
    href: '/admin/trip-help-products',
    label: 'Trip Help products',
    description: 'Prices, listings, and checkout',
  },
  {
    href: '/admin/shoutouts',
    label: 'Featured shoutouts',
    description: 'Paid placement slots',
  },
  {
    href: '/admin/orders',
    label: 'Trip Help orders',
    description: 'Upsells, tours, and partner payouts',
  },
  {
    href: '/admin/members',
    label: 'Members',
    description: 'Accounts, passes, and admin access',
  },
]

export const ADMIN_NAV_COMING_SOON: readonly string[] = []
