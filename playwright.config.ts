import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: "http://localhost:5174",
    viewport: { width: 1280, height: 800 },
    headless: true,
  },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:5174",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
