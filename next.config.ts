/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Local dev
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },

      // Your API
      {
        protocol: "https",
        hostname: "api.pwrplant.ca",
      },

      // ✅ Supabase Storage (IMPORTANT)
      {
        protocol: "https",
        hostname: "znpugwyzbyqtserluhqv.supabase.co",
      },
    ],
  },
  
  // PWA Configuration
  headers: async () => [
    {
      // Service Worker caching headers
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
    {
      // Manifest caching
      source: '/manifest.json',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600' },
      ],
    },
    {
      // Security headers
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
      ],
    },
  ],

  // React strict mode for development
  reactStrictMode: true,

  // Enable experimental features if needed
  experimental: {
    // Enable granular chunks
    optimizePackageImports: ['@radix-ui/react-*'],
  },
};

module.exports = nextConfig;
