import { defineConfig, devices } from "@playwright/test";

// Playwright-E2E gegen den LOKALEN Dev-Server. Bewusst getrennt von Vitest
// (das nur src/**/*.test.ts läuft) — die Specs liegen unter e2e/ als *.spec.ts.
//
// Zugangsdaten NIE hier oder in der Spec hinterlegen: sie kommen über Env-Variablen
// (E2E_EMAIL / E2E_PASSWORD / optional E2E_GATE_CODE).
//
// Der Dev-Server wird von Playwright selbst gestartet (webServer) und danach beendet;
// ein bereits laufender wird wiederverwendet.
export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "e2e/.playwright",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    viewport: { width: 1280, height: 900 }, // Desktop → Kartenvorschau in der zweiten Spalte sichtbar
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
  webServer: process.env.E2E_BASE_URL?.startsWith("http://localhost") || !process.env.E2E_BASE_URL
    ? {
        command: "npm run dev",
        url: process.env.E2E_BASE_URL || "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
});
