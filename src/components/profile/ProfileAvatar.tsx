import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { getInitials } from '@/lib/profile/stats'

export interface ProfileAvatarProps {
  name: string
  avatarUrl?: string | null
  className?: string
}

export function ProfileAvatar({ name, avatarUrl, className }: ProfileAvatarProps) {
  const initials = getInitials(name)

  return (
    <div
      className={cn(
        'relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-drift-gold-to/40 bg-drift-navy-light shadow-drift-card',
        className
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="96px" />
      ) : (
        <span className="text-2xl font-bold text-drift-gold-mid">{initials}</span>
      )}
    </div>
  )
}
