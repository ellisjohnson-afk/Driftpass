/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Production client bundle must never bake in driftpass.vercel.app (OAuth PKCE is host-bound).
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.VERCEL_ENV === 'production'
        ? 'https://www.driftpass.com.au'
        : process.env.NEXT_PUBLIC_APP_URL,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), geolocation=(self)',
          },
        ],
      },
    ]
  },

  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverComponentsExternalPackages: ['qrcode'],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.concatenateModules = false
    }
    return config
  },
}

module.exports = nextConfig
