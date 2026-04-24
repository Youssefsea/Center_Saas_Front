const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false, // ← يتجاهل الـ Suspense error
  },
};

export default nextConfig;