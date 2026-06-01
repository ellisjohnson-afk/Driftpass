import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'DriftPass — The Travel Pass for Modern Wanderers',
    template: '%s | DriftPass',
  },
  description:
    'One credit pass. Every city. Gyms, cafés, laundry, co-working, water fills, and more — wherever you roam.',
  keywords: ['backpacker', 'travel pass', 'digital nomad', 'van life', 'Australia', 'Queensland'],
  authors: [{ name: 'DriftPass', url: 'https://driftpass.com.au' }],
  creator: 'DriftPass',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://driftpass.com.au',
    siteName: 'DriftPass',
    title: 'DriftPass — Drift Further. Spend Less.',
    description: 'The credit-based travel pass for backpackers, digital nomads, and van lifers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DriftPass',
    description: 'Drift Further. Spend Less.',
  },
  robots: {
    index: true,
    follow: true,
  },
  // Enable PWA-like behaviour for the pass page
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-drift-dark text-white antialiased">
        {children}
      </body>
    </html>
  )
}
