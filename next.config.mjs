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
    ]
  },
}

export default nextConfig
