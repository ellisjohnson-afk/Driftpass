import Link from 'next/link'

export function AdminAccessDenied({
  userId,
  email,
}: {
  userId: string
  email: string
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">Admin</p>
          <h1 className="mt-2 text-2xl font-bold">Access not enabled yet</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            You are signed in, but this account is not marked as admin in Supabase.
          </p>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-sm">
          <p className="text-[#9CA3AF]">Signed in as</p>
          <p className="mt-1 font-medium">{email}</p>
          <p className="mt-3 break-all text-xs text-[#6B7280]">User ID: {userId}</p>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-sm text-[#9CA3AF]">
          <p className="font-medium text-white">Run in Supabase SQL</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-[#0A0A0A] p-3 text-xs text-[#00FF7F]">{`update public.profiles
set is_admin = true
where id = '${userId}';`}</pre>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/account"
            className="rounded-xl border border-[#2A2A2A] px-4 py-3 text-center text-sm font-medium text-white hover:border-[#3A3A3A]"
          >
            Back to profile
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full rounded-xl border border-[#2A2A2A] px-4 py-3 text-sm text-[#9CA3AF] hover:text-white"
            >
              Sign out and try another account
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
