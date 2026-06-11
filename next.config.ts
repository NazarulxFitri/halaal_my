import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
