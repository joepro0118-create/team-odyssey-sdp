/** @type {import('next').NextConfig} */
const config = {
  agentRules: false,
  experimental: {
    agentUpgrade: "security",
  },
  async redirects() {
    return [
      {
        source: "/staff",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/staff/login",
        destination: "/dashboard/login",
        permanent: false,
      },
    ];
  },
};

export default config;

