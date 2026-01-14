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
};

module.exports = nextConfig;
