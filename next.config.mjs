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
    ]
  },
}

export default nextConfig
