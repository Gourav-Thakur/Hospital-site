/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production hardening: don't advertise the framework, don't ship client source maps.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
