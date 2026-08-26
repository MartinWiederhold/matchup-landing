import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";

function envVal(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  for (const f of [".env.e2e", ".env.local"]) {
    try {
      const m = readFileSync(f, "utf8").match(new RegExp("^" + name + "=(.*)$", "m"));
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch { /* fehlt */ }
  }
  return "";
}

const EMAIL = envVal("E2E_EMAIL");
const PASSWORD = envVal("E2E_PASSWORD");
const GATE_CODE = envVal("E2E_GATE_CODE") || envVal("SITE_GATE_TOKEN") || "50805080";
const SUPA_URL = envVal("NEXT_PUBLIC_SUPABASE_URL");
const SUPA_KEY = envVal("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const WIDTHS = [390, 768, 1024, 1440, 1920] as const;
const PATHS = ["/tour2", "/tour2/finder", "/tour2/season", "/tour2/travel"] as const;
const SHOTS = "e2e/artifacts/t2-audit";

async function login(page: Page) {
  await page.request.post("/api/unlock", { data: { code: GATE_CODE } });
  const auth = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPA_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const session = await auth.json() as { access_token?: string };
  expect(session.access_token).toBeTruthy();
  const ref = new URL(SUPA_URL).hostname.split(".")[0];
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ ref, session }) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, { ref, session });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: /E-?mail/i })).toHaveCount(0, { timeout: 45_000 });
}

type Hit = {
  path: string;
  width: number;
  scrollX: number;
  railVisible: boolean;
  tabsVisible: boolean;
  map: { holderW: number; holderH: number; canvasW: number; canvasH: number } | null;
  overlaps: { a: string; b: string; area: number }[];
};

test("tour2 Beleg: Überlappung, Karte, Leiste, Quer-Scroll", async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD || !SUPA_URL || !SUPA_KEY, "E2E-Env fehlt");
  test.setTimeout(240_000);
  mkdirSync(SHOTS, { recursive: true });

  await login(page);
  const hits: Hit[] = [];

  for (const path of PATHS) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1400);
    if (path === "/tour2/finder") {
      const mapBtn = page.getByRole("button", { name: /Karte|Map/i }).first();
      if (await mapBtn.count()) await mapBtn.click().catch(() => undefined);
      await page.waitForTimeout(800);
    }
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${SHOTS}/${path.replace(/\//g, "_")}-${width}.png`, fullPage: false });
      const hit = await page.evaluate(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const root = document.querySelector(".t2-root") as HTMLElement | null;
        const scrollX = Math.max(
          0,
          (root?.scrollWidth ?? document.documentElement.scrollWidth) - vw,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        const rail = document.querySelector(".t2-rail-desk") as HTMLElement | null;
        const tabs = document.querySelector(".t2-tabs") as HTMLElement | null;
        const railVisible = !!rail && getComputedStyle(rail).display !== "none" && rail.getBoundingClientRect().width > 40;
        const tabsVisible = !!tabs && getComputedStyle(tabs).display !== "none" && tabs.getBoundingClientRect().height > 20;
        const holder = [...document.querySelectorAll(".maplibregl-map")].find((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return r.width > 40 && r.height > 40;
        }) as HTMLElement | undefined;
        const canvas = holder?.querySelector("canvas") as HTMLCanvasElement | null;
        let map: Hit["map"] = null;
        if (holder && canvas) {
          const hr = holder.getBoundingClientRect();
          const cr = canvas.getBoundingClientRect();
          map = {
            holderW: Math.round(hr.width),
            holderH: Math.round(hr.height),
            canvasW: Math.round(cr.width),
            canvasH: Math.round(cr.height),
          };
        }
        const skip = (el: HTMLElement) =>
          !!el.closest(".t2-tabs") || !!el.closest(".t2-mhead") || el.classList.contains("nextjs-toast");
        const nodes = [...document.querySelectorAll("h1, .t2-dash-card, .t2-kicker, button, a.t2-cta, .t2-rail-desk, .t2-telem > div")] as HTMLElement[];
        const overlaps: { a: string; b: string; area: number }[] = [];
        const label = (el: HTMLElement) => {
          const t = (el.innerText || el.getAttribute("aria-label") || el.className || "").slice(0, 40).replace(/\s+/g, " ");
          return `${el.tagName.toLowerCase()}:${t}`;
        };
        const vis = nodes.filter((el) => {
          if (skip(el)) return false;
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          return st.display !== "none" && st.visibility !== "hidden" && r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < vh && r.left < vw;
        });
        for (let i = 0; i < vis.length; i++) {
          for (let j = i + 1; j < vis.length; j++) {
            const A = vis[i];
            const B = vis[j];
            if (A.contains(B) || B.contains(A)) continue;
            const a = A.getBoundingClientRect();
            const b = B.getBoundingClientRect();
            const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            const area = x * y;
            if (area < 120) continue;
            overlaps.push({ a: label(A), b: label(B), area: Math.round(area) });
          }
        }
        overlaps.sort((x, y) => y.area - x.area);
        return { scrollX, railVisible, tabsVisible, map, overlaps: overlaps.slice(0, 6) };
      });
      hits.push({ path, width, ...hit });
    }
  }

  writeFileSync(`${SHOTS}/report.json`, JSON.stringify(hits, null, 2));
  console.log(JSON.stringify(hits, null, 2));
  for (const h of hits) {
    expect.soft(h.scrollX, `${h.path} ${h.width}px quer`).toBe(0);
    expect.soft(h.overlaps, `${h.path} ${h.width}px Überlappung`).toEqual([]);
    if (h.width < 768) {
      expect.soft(h.tabsVisible, `${h.path} ${h.width}px Tableiste`).toBe(true);
      expect.soft(h.railVisible, `${h.path} ${h.width}px keine blaue Leiste`).toBe(false);
    } else {
      expect.soft(h.railVisible, `${h.path} ${h.width}px blaue Leiste`).toBe(true);
      expect.soft(h.tabsVisible, `${h.path} ${h.width}px keine Tableiste`).toBe(false);
    }
    if (h.map) {
      expect.soft(h.map.holderH, `${h.path} ${h.width}px Kartenhöhe`).toBeLessThan(900);
      expect.soft(h.map.holderH, `${h.path} ${h.width}px Karten-min`).toBeGreaterThan(80);
      expect.soft(Math.abs(h.map.canvasH - h.map.holderH), `${h.path} ${h.width}px Canvas`).toBeLessThan(24);
    }
  }
});
