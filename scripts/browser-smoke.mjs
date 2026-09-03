import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "artifacts", "browser");
const port = Number(process.env.REMY_BROWSER_PORT ?? 3210);
const baseUrl = process.env.REMY_BASE_URL ?? `http://127.0.0.1:${port}`;
mkdirSync(output, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timed out waiting for ${baseUrl}.`);
}

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32" && existsSync(chrome) ? { executablePath: chrome } : {}),
});
const next = join(root, "node_modules", "next", "dist", "bin", "next");
const server = process.env.REMY_BASE_URL
  ? undefined
  : spawn(process.execPath, [next, "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: root,
      stdio: "pipe",
      windowsHide: true,
    });

function captureErrors(page, errors) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
}

try {
  await waitForServer();

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  captureErrors(page, errors);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Let agents act without asking every time." }).waitFor();
  const product = page.getByTestId("document-action-demo");
  await page.getByText("Your application keeps its state, authentication and business logic.").waitFor();
  await page.getByText("Morrow demo: 4 actions · 3 automatic · 1 approval").waitFor();
  assert(await page.locator('img[src*="morrow"], img[src*="remy-demo"]').count() === 0, "Morrow imagery is present on the homepage.");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "Homepage overflows at 1440px.");
  assert(await page.getByRole("link", { name: "Try the live demo" }).getAttribute("href") === "/demo", "Live-demo CTA is broken.");
  assert((await page.getByRole("link", { name: "Read the quickstart" }).first().getAttribute("href"))?.includes("/docs#quickstart"), "Quickstart CTA is broken.");
  await page.screenshot({ path: join(output, "homepage-fold-1440.png") });

  const copy = page.getByRole("button", { name: /Copy: npm install @remy-ai\/core @remy-ai\/webmcp/ }).first();
  await copy.click();
  assert(await page.evaluate(() => navigator.clipboard.readText()) === "npm install @remy-ai/core @remy-ai/webmcp", "Install command did not copy correctly.");

  const slider = product.getByRole("slider", { name: "Agent access" });
  assert(await slider.getAttribute("aria-valuetext") === "Reversible actions", "Slider does not start at Reversible actions.");
  assert(await slider.evaluate((element) => getComputedStyle(element).cursor) === "pointer", "Slider cursor is not pointer.");
  await slider.focus();
  await slider.press("Home");
  await page.getByText("Preview only", { exact: true }).first().waitFor();
  await slider.press("ArrowRight");
  assert(await slider.getAttribute("aria-valuetext") === "Ask on changes", "Keyboard arrow did not update the slider.");
  await product.getByRole("button", { name: "Reversible actions", exact: true }).click();
  await product.getByText("Ran automatically", { exact: true }).first().waitFor();

  await product.getByRole("button", { name: /^Rename document/ }).click();
  await product.getByRole("button", { name: "Undo change" }).click();
  await product.getByText("Recovery recorded", { exact: true }).waitFor();
  await product.getByText("Untitled document", { exact: true }).first().waitFor();

  await product.getByRole("button", { name: /^Publish document/ }).click();
  await product.getByRole("button", { name: "Approve publish" }).click();
  await product.getByText("Publish approved", { exact: true }).waitFor();
  await product.getByText("Public", { exact: true }).first().waitFor();

  await product.getByRole("button", { name: "Reset", exact: true }).click();
  await product.getByText("Waiting for you", { exact: true }).waitFor();
  assert(await product.getByText("Recovery recorded", { exact: true }).count() === 0, "Homepage reset retained recovery history.");
  await page.screenshot({ path: join(output, "homepage-1440.png"), fullPage: true });

  await page.getByRole("link", { name: "Read the quickstart" }).first().click();
  await page.waitForURL(/\/docs#quickstart$/);
  await page.getByRole("heading", { name: "Five-minute quickstart" }).waitFor();
  assert(errors.length === 0, `Homepage/docs errors:\n${errors.join("\n")}`);
  await context.close();

  for (const width of [768, 390]) {
    const responsive = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const responsivePage = await responsive.newPage();
    const responsiveErrors = [];
    captureErrors(responsivePage, responsiveErrors);
    await responsivePage.goto(baseUrl, { waitUntil: "networkidle" });
    assert(await responsivePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `Homepage overflows at ${width}px.`);
    await responsivePage.screenshot({ path: join(output, `homepage-fold-${width}.png`) });
    if (width === 390) {
      await responsivePage.getByRole("button", { name: "Ask", exact: true }).tap();
      assert(await responsivePage.getByRole("slider", { name: "Agent access" }).getAttribute("aria-valuetext") === "Ask on changes", "Touch label did not update the slider.");
    }
    await responsivePage.screenshot({ path: join(output, `homepage-${width}.png`), fullPage: true });
    assert(responsiveErrors.length === 0, `${width}px errors:\n${responsiveErrors.join("\n")}`);
    await responsive.close();
  }

  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  const reducedErrors = [];
  captureErrors(reducedPage, reducedErrors);
  await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
  await reducedPage.getByRole("button", { name: "Trusted", exact: true }).click();
  assert(await reducedPage.getByRole("slider", { name: "Agent access" }).getAttribute("aria-valuetext") === "Trusted run", "Reduced-motion slider is unusable.");
  assert(reducedErrors.length === 0, `Reduced-motion errors:\n${reducedErrors.join("\n")}`);
  await reduced.close();

  const demoContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await demoContext.addInitScript(() => {
    const tools = {};
    Object.defineProperty(window, "__remyTools", { value: tools, configurable: true });
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool, options) {
          if (tools[tool.name]) throw new Error(`Duplicate tool: ${tool.name}`);
          tools[tool.name] = tool;
          options?.signal?.addEventListener("abort", () => delete tools[tool.name], { once: true });
        },
      },
    });
  });
  const demo = await demoContext.newPage();
  const demoErrors = [];
  captureErrors(demo, demoErrors);
  await demo.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await demo.getByRole("button", { name: /Reset demo|Reset/, exact: false }).first().click();
  await demo.waitForFunction(() => Boolean(window.__remyTools?.add_to_cart));
  await demo.evaluate(async () => {
    await window.__remyTools.add_to_cart.execute({ productId: "morrow-one", colour: "Charcoal", quantity: 1 });
    await window.__remyTools.choose_delivery.execute({ method: "express" });
    await window.__remyTools.apply_discount.execute({ code: "HELLO10" });
  });
  await demo.getByRole("button", { name: /Open Remy/ }).click();
  await demo.getByText("Morrow One added to your bag", { exact: true }).waitFor();
  await demo.getByText("Express delivery selected", { exact: true }).waitFor();
  await demo.getByText("10% discount applied", { exact: true }).waitFor();
  await demo.getByRole("button", { name: "Use standard" }).click();
  await demo.getByText("Delivery restored to standard", { exact: true }).waitFor();
  await demo.evaluate(async () => { await window.__remyTools.place_order.execute({}); });
  await demo.getByTestId("approve-purchase").waitFor();
  assert((await demo.getByTestId("approve-purchase").textContent())?.includes("Approve £115 purchase"), "Purchase approval is not explicit or authoritative.");
  await demo.getByTestId("approve-purchase").click();
  await demo.getByRole("heading", { name: "Order confirmed" }).waitFor();
  await demo.getByTestId("approve-purchase").waitFor({ state: "hidden" });
  await demo.screenshot({ path: join(output, "morrow-complete.png"), fullPage: true });
  assert(demoErrors.length === 0, `Morrow demo errors:\n${demoErrors.join("\n")}`);
  await demoContext.close();

  const unsupportedContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const unsupported = await unsupportedContext.newPage();
  await unsupported.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await unsupported.getByRole("button", { name: /Open Remy/ }).click();
  await unsupported.getByText("WebMCP unavailable · shop still works", { exact: true }).waitFor();
  await unsupported.getByRole("button", { name: "Add to bag" }).click();
  await unsupported.getByLabel("Shopping bag, 1 items").waitFor();
  await unsupportedContext.close();

  console.log("Browser smoke passed: homepage, responsive layouts, controls, recovery, approval, Morrow WebMCP flow, and unsupported-browser fallback.");
  console.log(output);
} finally {
  await browser.close();
  if (server && !server.killed) server.kill();
}
