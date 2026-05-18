/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: '/stays/mondello',
        destination: '/stays/mondello/',
        permanent: true,
      },
      {
        source: '/stays/villa-fronte-mare',
        destination: '/stays/villa-fronte-mare/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
