import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // SB_ANON_KEY is exposed to the browser bundle under the name the client reads
  env: {
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.SB_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/host/dashboard',
        permanent: true,
      },
      {
        source: '/host',
        destination: '/host/dashboard',
        permanent: true,
      },
    ]
  },
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

export default withMDX(nextConfig)
