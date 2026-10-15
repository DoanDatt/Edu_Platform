import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // <Image> của Next chỉ tải ảnh từ những địa chỉ được khai báo ở đây
  images: {
    remotePatterns: [
      // Ảnh mẫu của seed:demo. picsum.photos chuyển hướng sang fastly.picsum.photos
      new URL('https://picsum.photos/**'),
      new URL('https://**.picsum.photos/**'),
      // Ảnh upload lên backend (dev). Deploy thật thì thêm tên miền của API vào đây
      new URL('http://localhost:4000/uploads/**')
    ]
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
