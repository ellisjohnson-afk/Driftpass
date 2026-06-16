/**
 * Layer 2 stub — sponsor logos on pricing (see ARCHITECTURE.md).
 * Replace placeholders when sponsor assets are ready.
 */
export function SponsorLogosSection() {
  return (
    <section className="pt-2 text-center" aria-label="Membership sponsors">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-text-muted">
        Supported by
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        {['Sponsor A', 'Sponsor B', 'Sponsor C'].map((label) => (
          <div
            key={label}
            className="flex h-10 w-20 items-center justify-center rounded-lg border border-drift-border/40 bg-drift-navy-light/60 text-[9px] font-medium uppercase tracking-wide text-drift-text-subtle"
            aria-hidden
          >
            {label}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-drift-text-subtle">
        Local partner sponsors — coming to Airlie Beach launch
      </p>
    </section>
  )
}
