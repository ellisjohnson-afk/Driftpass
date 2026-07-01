const STEPS = [
  {
    number: 1,
    title: 'JOIN',
    description: 'Sign up free in under a minute — no card required.',
  },
  {
    number: 2,
    title: 'EXPLORE',
    description:
      'Browse partner deals, book Trip Help utilities, and open your Airlie Beach welcome guide.',
  },
  {
    number: 3,
    title: 'SAVE',
    description:
      'Show your rotating pass PIN at partners, or pay for Trip Help add-ons, tours & local experiences.',
  },
] as const

export function HowItWorksSteps() {
  return (
    <section className="space-y-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
        How it works
      </h2>
      <ol className="space-y-5">
        {STEPS.map((step) => (
          <li key={step.number} className="flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-drift-gold-to/30 bg-drift-navy-light text-sm font-bold text-drift-gold-mid">
              {step.number}
            </div>
            <div className="pt-0.5">
              <p className="text-sm leading-relaxed text-drift-text-muted">
                <span className="font-bold text-white">{step.title}</span>
                {' — '}
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
