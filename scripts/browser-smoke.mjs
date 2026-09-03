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
    viewport: { width: 1440, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  captureErrors(page, errors);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Let AI agents act without giving up control" }).waitFor();
  await page.getByText("OPEN SOURCE · WEBMCP FIRST", { exact: true }).waitFor();
  await page.getByText("Remy adds permissions, approvals, receipts and undo to the actions agents take inside your app.", { exact: true }).waitFor();
  const preview = page.getByTestId("landing-morrow-preview");
  await preview.getByText("Morrow One", { exact: true }).waitFor();
  await preview.getByText("WAITING FOR YOU", { exact: true }).waitFor();
  assert(await page.locator('img[src*="morrow-headphones"]').count() === 1, "The real Morrow product visual is missing from the hero.");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "Homepage overflows at 1440px.");
  assert(await page.locator("main").evaluate((element) => getComputedStyle(element).backgroundColor) === "rgb(10, 10, 10)", "Homepage is not using the required dark background.");
  const frame = await page.locator(".remy-landing-frame").boundingBox();
  assert(frame && Math.round(frame.width) === 1200 && Math.round(frame.x) === 120, "Desktop frame does not match the 1200px centred grid.");
  assert(await page.getByRole("link", { name: "Try the live demo" }).first().getAttribute("href") === "/demo", "Live-demo CTA is broken.");
  assert((await page.getByRole("link", { name: "View on GitHub" }).getAttribute("href"))?.includes("github.com/MustafaK99/Remy"), "GitHub CTA is broken.");
  await page.screenshot({ path: join(output, "homepage-fold-1440.png") });

  const copy = page.getByRole("button", { name: /Copy: git clone https:\/\/github.com\/MustafaK99\/Remy.git/ }).first();
  await copy.click();
  assert(await page.evaluate(() => navigator.clipboard.readText()) === "git clone https://github.com/MustafaK99/Remy.git && cd Remy && npm ci", "Source install command did not copy correctly.");

  const product = page.locator("#product");
  const slider = product.getByRole("slider", { name: "Agent access" });
  assert(await slider.getAttribute("aria-valuetext") === "Reversible actions", "Slider does not start at Reversible actions.");
  assert(await slider.evaluate((element) => getComputedStyle(element).cursor) === "pointer", "Slider cursor is not pointer.");
  await slider.focus();
  await slider.press("Home");
  assert(await slider.getAttribute("aria-valuetext") === "Preview", "Home did not select Preview.");
  await slider.press("ArrowRight");
  assert(await slider.getAttribute("aria-valuetext") === "Ask on changes", "Keyboard arrow did not update the slider.");
  await product.getByRole("button", { name: "Reversible actions", exact: true }).click();
  assert(await slider.getAttribute("aria-valuetext") === "Reversible actions", "Clickable slider label failed.");

  await preview.getByTestId("landing-undo-delivery").click();
  await preview.getByText("LINKED RECOVERY RECEIPT", { exact: true }).waitFor();
  await preview.getByRole("button", { name: "Reset", exact: true }).click();
  await preview.getByTestId("landing-approve-purchase").waitFor();
  await preview.getByTestId("landing-approve-purchase").click();
  await preview.getByText("Order placed", { exact: true }).waitFor();
  await page.screenshot({ path: join(output, "homepage-1440.png"), fullPage: true });

  await page.getByRole("link", { name: "Docs", exact: true }).first().click();
  await page.waitForURL(/\/docs$/);
  await page.getByRole("heading", { name: "Five-minute quickstart" }).waitFor();
  await page.screenshot({ path: join(output, "docs-1440.png"), fullPage: true });
  assert(errors.length === 0, `Homepage/docs errors:\n${errors.join("\n")}`);
  await context.close();

  for (const width of [768, 390]) {
    const responsive = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, hasTouch: width === 390 });
    const responsivePage = await responsive.newPage();
    const responsiveErrors = [];
    captureErrors(responsivePage, responsiveErrors);
    await responsivePage.goto(baseUrl, { waitUntil: "networkidle" });
    assert(await responsivePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `Homepage overflows at ${width}px.`);
    await responsivePage.screenshot({ path: join(output, `homepage-fold-${width}.png`) });
    if (width === 390) {
      const mobileProduct = responsivePage.locator("#product");
      await mobileProduct.getByRole("button", { name: "Ask", exact: true }).tap();
      assert(await mobileProduct.getByRole("slider", { name: "Agent access" }).getAttribute("aria-valuetext") === "Ask on changes", "Touch label did not update the slider.");
    }
    await responsivePage.screenshot({ path: join(output, `homepage-${width}.png`), fullPage: true });
    assert(responsiveErrors.length === 0, `${width}px errors:\n${responsiveErrors.join("\n")}`);
    await responsive.close();
  }

  for (const route of ["docs", "demo"]) {
    for (const width of [1440, 390]) {
      const visual = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } });
      const visualPage = await visual.newPage();
      const visualErrors = [];
      captureErrors(visualPage, visualErrors);
      await visualPage.goto(`${baseUrl}/${route}`, { waitUntil: "networkidle" });
      assert(await visualPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${route} overflows at ${width}px.`);
      await visualPage.screenshot({ path: join(output, `${route}-fold-${width}.png`) });
      await visualPage.screenshot({ path: join(output, `${route}-${width}.png`), fullPage: true });
      assert(visualErrors.length === 0, `${route} ${width}px errors:\n${visualErrors.join("\n")}`);
      await visual.close();
    }
  }

  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  const reducedErrors = [];
  captureErrors(reducedPage, reducedErrors);
  await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
  const reducedProduct = reducedPage.locator("#product");
  await reducedProduct.getByRole("button", { name: "Trusted", exact: true }).click();
  assert(await reducedProduct.getByRole("slider", { name: "Agent access" }).getAttribute("aria-valuetext") === "Trusted run", "Reduced-motion slider is unusable.");
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
  await demo.waitForFunction(() => Boolean(window.__remyTools?.prepare_demo_order));
  await demo.evaluate(async () => {
    await window.__remyTools.identify_assistant.execute({
      name: "ChatGPT",
      provider: "OpenAI",
      sessionId: "release-smoke-controlled",
    });
    await window.__remyTools.prepare_demo_order.execute({
      productId: "morrow-one",
      colour: "Charcoal",
      quantity: 1,
      delivery: "express",
      discountCode: "HELLO10",
    });
  });
  await demo.getByRole("button", { name: /Open Remy/ }).click();
  await demo.getByText("Morrow One added to your bag", { exact: true }).waitFor();
  await demo.getByText("Express delivery selected", { exact: true }).waitFor();
  await demo.getByText("10% discount applied", { exact: true }).waitFor();
  const recovery = await demo.evaluate(async () => {
    const history = await window.__remyTools.get_action_history.execute({});
    const delivery = history.receipts.find((receipt) => receipt.action === "choose_delivery");
    if (!delivery) return { ok: false, message: "Delivery receipt not found." };
    return window.__remyTools.revert_action.execute({ receiptId: delivery.id });
  });
  assert(recovery.ok === true, "Agent-driven delivery recovery failed.");
  await demo.getByText("Delivery restored to standard", { exact: true }).waitFor();
  const controlledPurchase = demo.evaluate(() => window.__remyTools.place_order.execute({}));
  await demo.getByTestId("approve-purchase").waitFor();
  assert((await demo.getByTestId("approve-purchase").textContent())?.includes("Hold to approve £115 purchase"), "Purchase approval is not explicit or authoritative.");
  await demo.getByTestId("approve-purchase").click();
  assert(await demo.getByTestId("approve-purchase").isVisible(), "A routine click bypassed the user-only purchase confirmation.");
  await demo.getByTestId("approve-purchase").focus();
  await demo.keyboard.down("Space");
  await demo.waitForTimeout(1_350);
  await demo.keyboard.up("Space");
  await demo.getByRole("heading", { name: "Order confirmed" }).waitFor();
  const controlledResult = await controlledPurchase;
  assert(controlledResult.ok === true && controlledResult.status === "committed", "The pending WebMCP purchase did not resume after approval.");
  await demo.getByTestId("approve-purchase").waitFor({ state: "hidden" });
  await demo.screenshot({ path: join(output, "morrow-complete.png"), fullPage: true });
  assert(demoErrors.length === 0, `Morrow demo errors:\n${demoErrors.join("\n")}`);
  await demoContext.close();

  const trustedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await trustedContext.addInitScript(() => {
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
  const trusted = await trustedContext.newPage();
  const trustedErrors = [];
  captureErrors(trusted, trustedErrors);
  await trusted.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await trusted.getByRole("button", { name: /Reset demo|Reset/, exact: false }).first().click();
  await trusted.waitForFunction(() => Boolean(window.__remyTools?.request_remy_controls));
  const controlRequest = await trusted.evaluate(async () => {
    await window.__remyTools.identify_assistant.execute({
      name: "ChatGPT",
      provider: "OpenAI",
      sessionId: "release-smoke",
    });
    const request = await window.__remyTools.request_remy_controls.execute({
      mode: "trusted",
      grants: ["commerce.purchase"],
    });
    const beforeApproval = await window.__remyTools.get_remy_status.execute({});
    return { request, beforeApproval };
  });
  assert(controlRequest.request.status === "awaiting_user", "Agent control escalation did not wait for the user.");
  assert(controlRequest.beforeApproval.controls.autonomy === "reversible", "Trusted mode was applied before user approval.");
  assert(controlRequest.beforeApproval.controls.grants.length === 0, "Purchase authority was granted before user approval.");
  await trusted.getByRole("button", { name: /Open Remy\. AI wants more access/ }).click();
  await trusted.getByRole("heading", { name: "ChatGPT wants more access" }).waitFor();
  assert(await trusted.getByRole("slider", { name: "AI access" }).getAttribute("aria-valuetext") === "Reversible actions", "Visible controls changed before permission approval.");
  await trusted.getByRole("button", { name: "Allow this change" }).click();
  await trusted.getByRole("heading", { name: "ChatGPT wants more access" }).waitFor({ state: "hidden" });
  assert(await trusted.getByRole("slider", { name: "AI access" }).getAttribute("aria-valuetext") === "Trusted run", "Approved trusted mode was not applied.");
  assert(await trusted.getByRole("switch", { name: "Allow AI to buy without asking" }).getAttribute("aria-checked") === "true", "Approved purchase grant was not applied.");
  await trusted.evaluate(async () => {
    await window.__remyTools.prepare_demo_order.execute({
      productId: "morrow-one",
      colour: "Charcoal",
      quantity: 1,
      delivery: "express",
      discountCode: "HELLO10",
    });
    await window.__remyTools.place_order.execute({});
  });
  await trusted.getByRole("heading", { name: "Order confirmed" }).waitFor();
  assert(await trusted.getByTestId("approve-purchase").count() === 0, "Trusted purchase created a second approval request.");
  const trustedHistory = await trusted.evaluate(async () => window.__remyTools.get_action_history.execute({}));
  assert(trustedHistory.receipts.some((receipt) => receipt.action === "place_order" && receipt.principal === "ChatGPT"), "Trusted purchase receipt did not preserve the requesting assistant identity.");
  assert(await trusted.getByText("Changed by ChatGPT", { exact: true }).count() >= 4, "Visible receipts do not attribute trusted actions to ChatGPT.");
  await trusted.waitForTimeout(800);
  await trusted.screenshot({ path: join(output, "morrow-trusted-complete.png"), fullPage: true });
  assert(trustedErrors.length === 0, `Trusted-run errors:\n${trustedErrors.join("\n")}`);
  await trustedContext.close();

  const unsupportedContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const unsupported = await unsupportedContext.newPage();
  await unsupported.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await unsupported.getByRole("button", { name: /Open Remy/ }).click();
  await unsupported.getByText("WebMCP unavailable · shop still works", { exact: true }).waitFor();
  await unsupported.getByRole("button", { name: "Add to bag" }).click();
  await unsupported.getByLabel("Shopping bag, 1 items").waitFor();
  await unsupportedContext.close();

  console.log("Browser smoke passed: homepage, responsive layouts, controls, recovery, ordinary approval, agent-requested trusted purchase, and unsupported-browser fallback.");
  console.log(output);
} finally {
  await browser.close();
  if (server && !server.killed) server.kill();
}
