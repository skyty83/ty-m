import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 자체 서버/Docker 배포용: .next/standalone 에 최소 실행 파일 생성
  output: 'standalone',
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
