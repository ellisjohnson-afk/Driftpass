import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { lookupMemberByPin } from '@/lib/pass/lookup-member-by-pin'

const VerifyPinSchema = z.object({
  pin: z.string().min(6).max(7),
})

/** POST /api/partners/verify-pin — verify a member's rotating pass PIN (no credits). */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown
  const parsed = VerifyPinSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a 6-digit member PIN' }, { status: 400 })
  }

  const member = await lookupMemberByPin(parsed.data.pin)

  if (!member) {
    return NextResponse.json(
      { error: 'Invalid or expired PIN. Ask the member to refresh My Pass.' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    memberName: member.memberName,
    planName: member.planName,
    membershipStatus: 'active' as const,
  })
}
