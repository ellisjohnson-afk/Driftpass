import { redirect } from 'next/navigation'

/** Layer 2 — no in-app map; send travellers to the town welcome page. */
export default function MapPage() {
  redirect('/town/airlie-beach')
}
