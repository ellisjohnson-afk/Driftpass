import { AppShell } from '@/components/layout/AppShell'
import { DesignPreviewContent } from './DesignPreviewContent'

/**
 * Phase A component gallery — verify Figma primitives before page rewrites.
 * Route: /design-preview (authenticated)
 */
export default function DesignPreviewPage() {
  return (
    <AppShell showBottomNav={false}>
      <DesignPreviewContent />
    </AppShell>
  )
}
