// Route Map — Phase 4 feature
// Stub page with correct structure for Mapbox integration

const PHASE = parseInt(process.env.NEXT_PUBLIC_PHASE ?? '2')

export default function MapPage() {
  if (PHASE < 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-2xl font-bold mb-2">Route Map</h1>
        <p className="text-[#9CA3AF] max-w-xs">
          Every DriftPass partner plotted from Brisbane to Cairns. Launching in Phase 4.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-xs">
          {['Airlie Beach', 'Cairns', 'Townsville', 'Magnetic Is.'].map((city) => (
            <div
              key={city}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center"
            >
              <div className="text-sm font-medium">{city}</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Coming soon</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Phase 4: Mapbox integration goes here
  // import Map from '@/components/map/RouteMap'
  // return <Map />
  return null
}
