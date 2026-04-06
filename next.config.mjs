/** @type {import('next').NextConfig} */
const rawBackendApiOrigin = process.env.BACKEND_API_ORIGIN;

if (!rawBackendApiOrigin) {
  throw new Error(
    "Missing BACKEND_API_ORIGIN. Set it in your environment to proxy /api requests.",
  );
}

let backendOrigin;
try {
  backendOrigin = new URL(rawBackendApiOrigin).origin;
} catch {
  throw new Error(
    "Invalid BACKEND_API_ORIGIN. Use a full URL such as https://r-backend-eight.vercel.app",
  );
}

const currentVercelHost = process.env.VERCEL_URL;
if (currentVercelHost) {
  const currentHost = currentVercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const backendHost = new URL(backendOrigin).host;

  if (backendHost === currentHost) {
    throw new Error(
      "BACKEND_API_ORIGIN points to this frontend host, which causes redirect loops. Set it to your backend deployment URL.",
    );
  }
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
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
