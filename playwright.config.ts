import { defineConfig, devices } from "@playwright/test";

const hasLiveTestConfiguration = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.E2E_RESIDENT_A_EMAIL &&
    process.env.E2E_RESIDENT_A_PASSWORD &&
    process.env.E2E_RESIDENT_B_EMAIL &&
    process.env.E2E_RESIDENT_B_PASSWORD,
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: hasLiveTestConfiguration
    ? {
        command: "npm run start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
