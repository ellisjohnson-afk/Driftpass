export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-10 h-10 border-2 border-[#00FF7F] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#6B7280] text-sm">Loading your dashboard…</p>
    </div>
  )
}
