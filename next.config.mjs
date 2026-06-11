/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/game-rs',   // ← Ganti ini sesuai nama folder di hosting
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
