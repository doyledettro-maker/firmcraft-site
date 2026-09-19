/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/onboard',
        destination: '/get-started',
        permanent: true,
      },
      {
        source: '/how-it-works',
        destination: '/methodology',
        permanent: true,
      },
      {
        source: '/capabilities',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/pricing',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/operator',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/managed-ai',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/houston',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/integrations',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/trust',
        destination: '/security',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
