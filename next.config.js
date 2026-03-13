/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output as standalone for VPS deployment
  output: 'standalone',
  // Disable server-side image optimization if not needed
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
