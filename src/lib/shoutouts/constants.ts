import type { ShoutoutPlacement } from '@/lib/shoutouts/types'

export const SHOUTOUT_PLACEMENTS: { id: ShoutoutPlacement; label: string; description: string }[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Featured strip above “Deals near you”',
  },
  {
    id: 'trip_help',
    label: 'Trip Help',
    description: 'Banner at the top of Trip Help',
  },
  {
    id: 'explore',
    label: 'Explore',
    description: 'Above the partner perks grid',
  },
  {
    id: 'town',
    label: 'Town guide',
    description: 'On the Airlie Beach welcome page',
  },
]
