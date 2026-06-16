import {
  CompassEmptyIcon,
  HistoryEmptyIcon,
  MapEmptyIcon,
  PassEmptyIcon,
  RefreshIcon,
} from './EmptyStateIcons'
import { EmptyState, type EmptyStateProps } from './EmptyState'

type PresetProps = Pick<EmptyStateProps, 'primaryAction' | 'secondaryAction' | 'className'>

/** No partners in the database yet — Explore / Perks. */
export function NoPerksNearbyEmptyState(props: PresetProps = {}) {
  return (
    <EmptyState
      icon={<MapEmptyIcon />}
      title="No perks nearby"
      description="We couldn't find any perks in your current location. Try searching in a different area or check back soon as we add new partners daily."
      primaryAction={
        props.primaryAction ?? {
          label: 'Show my pass',
          href: '/pass',
        }
      }
      secondaryAction={
        props.secondaryAction ?? {
          label: 'Dismiss',
          href: '/home',
        }
      }
      className={props.className}
    />
  )
}

/** Search or category filter returned zero results — Explore / Perks. */
export function NoPerkMatchesEmptyState({
  onClearFilters,
  onDismiss,
  className,
}: {
  onClearFilters: () => void
  onDismiss?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={<MapEmptyIcon />}
      title="No matches found"
      description="We couldn't find any perks matching your search. Try a different category or clear your filters — new partners are added regularly."
      primaryAction={{
        label: 'Clear filters',
        onClick: onClearFilters,
        icon: <RefreshIcon />,
      }}
      secondaryAction={{
        label: 'Dismiss',
        onClick: onDismiss ?? onClearFilters,
      }}
      className={className}
    />
  )
}

/** Home screen deals grid is empty. */
export function NoDealsNearbyEmptyState(props: PresetProps = {}) {
  return (
    <EmptyState
      icon={<MapEmptyIcon />}
      title="No deals near you yet"
      description="We're adding partners across Australia. Check back soon or browse trip help for traveller essentials in the meantime."
      primaryAction={
        props.primaryAction ?? {
          label: 'Browse trip help',
          href: '/trip-help',
        }
      }
      secondaryAction={
        props.secondaryAction ?? {
          label: 'See all perks',
          href: '/perks',
        }
      }
      className={props.className}
    />
  )
}

/** Trip Help utility has no partner available yet. */
export function NoProviderEmptyState(props: PresetProps = {}) {
  return (
    <EmptyState
      icon={<CompassEmptyIcon />}
      title="No provider available"
      description="We don't have a partner for this service in your area yet. Check back soon or explore other trip help options."
      primaryAction={
        props.primaryAction ?? {
          label: 'Back to trip help',
          href: '/trip-help',
        }
      }
      secondaryAction={
        props.secondaryAction ?? {
          label: 'Dismiss',
          href: '/home',
        }
      }
      className={props.className}
    />
  )
}

/** Member has no active pass (edge cases — e.g. expired mid-session). */
export function NoPassEmptyState(props: PresetProps = {}) {
  return (
    <EmptyState
      icon={<PassEmptyIcon />}
      title="No active pass"
      description="Your DriftPass membership isn't active right now. Subscribe to unlock member deals and show your pass at partners."
      primaryAction={
        props.primaryAction ?? {
          label: 'View membership',
          href: '/pricing',
        }
      }
      className={props.className}
    />
  )
}

/** Redemption / savings history is empty — Profile. */
export function NoHistoryEmptyState(props: PresetProps = {}) {
  return (
    <EmptyState
      icon={<HistoryEmptyIcon />}
      title="No activity yet"
      description="When you redeem deals at partners, your savings and activity will show up here."
      primaryAction={
        props.primaryAction ?? {
          label: 'Browse deals',
          href: '/perks',
        }
      }
      secondaryAction={
        props.secondaryAction ?? {
          label: 'Dismiss',
          href: '/home',
        }
      }
      className={props.className}
    />
  )
}
