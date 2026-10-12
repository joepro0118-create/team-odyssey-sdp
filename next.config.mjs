/** @type {import('next').NextConfig} */
const config = {
  // Serverless instances cannot share the local memory store. Vercel therefore
  // defaults to an explicitly simulated, per-tab preview until Supabase lands.
  env: {
    NEXT_PUBLIC_DEMO_MODE:
      process.env.NEXT_PUBLIC_DEMO_MODE ||
      (process.env.VERCEL ? "browser" : "server"),
  },
};

export default config;
