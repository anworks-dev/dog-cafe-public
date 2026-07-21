/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
  async redirects() {
    const destination = "/okayama/kurashiki/cafe-003";
    return [
      // Legacy Japanese shop path → current canonical URL (308 when permanent: true)
      {
        source: "/岡山/shop03",
        destination,
        permanent: true,
      },
      {
        source: "/%E5%B2%A1%E5%B1%B1/shop03",
        destination,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
