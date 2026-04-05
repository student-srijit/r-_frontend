/** @type {import('next').NextConfig} */
const backendApiOrigin = process.env.BACKEND_API_ORIGIN;

if (!backendApiOrigin) {
  throw new Error(
    "Missing BACKEND_API_ORIGIN. Set it in your environment to proxy /api requests.",
  );
}

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
