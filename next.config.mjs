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
        destination: '/how-we-work',
        statusCode: 301,
      },
      {
        source: '/capabilities',
        destination: '/advisory',
        statusCode: 301,
      },
      {
        source: '/pricing',
        destination: '/advisory',
        statusCode: 301,
      },
      {
        source: '/services',
        destination: '/advisory',
        statusCode: 301,
      },
      {
        source: '/operator',
        destination: '/for-small-business',
        statusCode: 301,
      },
      {
        source: '/methodology',
        destination: '/how-we-work',
        statusCode: 301,
      },
      {
        source: '/managed-ai',
        destination: '/for-small-business',
        statusCode: 301,
      },
      {
        source: '/houston',
        destination: '/for-small-business',
        statusCode: 301,
      },
      {
        source: '/integrations',
        destination: '/advisory',
        statusCode: 301,
      },
      {
        source: '/security',
        destination: '/sovereignty',
        statusCode: 301,
      },
      {
        source: '/playbooks',
        destination: '/for-small-business',
        statusCode: 301,
      },
      {
        source: '/trust',
        destination: '/sovereignty',
        statusCode: 301,
      },
    ]
  },
}

export default nextConfig
