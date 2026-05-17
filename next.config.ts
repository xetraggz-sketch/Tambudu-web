import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isMobileBuild = process.env.BUILD_TARGET === "mobile";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development" || isMobileBuild,
});

const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : undefined,
  images: { unoptimized: isMobileBuild },
  trailingSlash: isMobileBuild,
};

export default withSerwist(nextConfig);
