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

function captureErrors(page, errors) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
}

async function addWebMCPMock(context) {
  await context.addInitScript(() => {
    const tools = {};
    Object.defineProperty(window, "__remyTools", {
      value: tools,
      configurable: true,
    });
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool, options) {
          if (tools[tool.name]) throw new Error(`Duplicate tool: ${tool.name}`);
          tools[tool.name] = tool;
          options?.signal?.addEventListener(
            "abort",
            () => delete tools[tool.name],
            { once: true },
          );
        },
      },
    });
  });
}

async function runReturnActions(page, { refund = true } = {}) {
  return page.evaluate(async ({ includeRefund }) => {
    const results = [];
    results.push(await window.__remyTools.create_return.execute({
      orderId: "1842",
      itemIds: ["headphones", "case"],
    }));
    results.push(await window.__remyTools.add_return_reason.execute({
      orderId: "1842",
      reason: "Incompatible with my laptop",
    }));
    results.push(await window.__remyTools.change_collection_address.execute({
      orderId: "1842",
      address: "22 New Road",
    }));
    results.push(await window.__remyTools.book_collection.execute({
      orderId: "1842",
      date: "next Friday",
    }));
    if (includeRefund) {
      results.push(await window.__remyTools.issue_refund.execute({ orderId: "1842" }));
    }
    return results;
  }, { includeRefund: refund });
}

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32" && existsSync(chrome)
    ? { executablePath: chrome }
    : {}),
});
const next = join(root, "node_modules", "next", "dist", "bin", "next");
const server = process.env.REMY_BASE_URL
  ? undefined
  : spawn(process.execPath, [next, "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: root,
      stdio: "pipe",
      windowsHide: true,
    });

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
  await page.getByRole("heading", {
    name: "Let agents act. Keep every change under control.",
  }).waitFor();
  await page.getByText(
    "Remy adds approvals, human-readable receipts and rollback to the actions AI agents take in your app.",
  ).waitFor();
  await page.getByText(
    "Reversible work runs automatically. Consequential actions wait for you.",
  ).waitFor();
  await page.getByText(
    "WebMCP lets the agent act. Remy decides when it may, records what changed and gives the user a way back.",
  ).waitFor();
  await page.getByText("Three actions. One approval. Nothing hidden.").waitFor();
  await page.getByText("3 actions · 2 automatic · 1 approval", { exact: true }).waitFor();
  assert(
    await page.locator('img[src*="morrow"], img[src*="remy-demo"]').count() === 0,
    "Morrow imagery is present on the homepage.",
  );
  assert(await page.getByText(/Morrow/).count() === 0, "Morrow copy is present on the homepage.");
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    "Homepage overflows at 1440px.",
  );
  assert(
    (await page.getByRole("link", { name: "Try the live demo" }).first().getAttribute("href")) === "/demo",
    "Live-demo CTA is broken.",
  );
  assert(
    (await page.getByRole("link", { name: "View on GitHub" }).getAttribute("href"))?.includes("github.com/MustafaK99/Remy"),
    "GitHub CTA is broken.",
  );
  await page.screenshot({ path: join(output, "homepage-fold-1440.png") });

  const product = page.getByTestId("document-action-demo");
  const slider = product.getByRole("slider", { name: "Agent access" });
  await slider.waitFor();
  assert(await slider.getAttribute("aria-valuetext") === "Reversible actions", "Slider did not start on Reversible actions.");
  assert(await slider.evaluate((element) => getComputedStyle(element).cursor) === "pointer", "Slider cursor is not pointer.");
  await slider.focus();
  await slider.press("ArrowLeft");
  assert(await slider.getAttribute("aria-valuetext") === "Ask on changes", "Keyboard navigation did not select Ask on changes.");
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

  const copy = page.getByRole("button", { name: "Copy: npm ci && npm run dev" });
  await copy.click();
  assert(
    await page.evaluate(() => navigator.clipboard.readText()) === "npm ci && npm run dev",
    "Source quickstart command did not copy correctly.",
  );
  await page.screenshot({ path: join(output, "homepage-1440.png"), fullPage: true });
  assert(errors.length === 0, `Homepage errors:\n${errors.join("\n")}`);
  await context.close();

  for (const width of [768, 390]) {
    const responsive = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      hasTouch: width === 390,
    });
    const responsivePage = await responsive.newPage();
    const responsiveErrors = [];
    captureErrors(responsivePage, responsiveErrors);
    await responsivePage.goto(baseUrl, { waitUntil: "networkidle" });
    assert(
      await responsivePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      `Homepage overflows at ${width}px.`,
    );
    await responsivePage.screenshot({ path: join(output, `homepage-fold-${width}.png`) });
    if (width === 390) {
      const mobileProduct = responsivePage.getByTestId("document-action-demo");
      const mobileSlider = mobileProduct.getByRole("slider", { name: "Agent access" });
      await mobileProduct.getByRole("button", { name: "Ask", exact: true }).tap();
      assert(await mobileSlider.getAttribute("aria-valuetext") === "Ask on changes", "Touch did not update the slider.");
    }
    await responsivePage.screenshot({ path: join(output, `homepage-${width}.png`), fullPage: true });
    assert(responsiveErrors.length === 0, `${width}px homepage errors:\n${responsiveErrors.join("\n")}`);
    await responsive.close();
  }

  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
  const reducedProduct = reducedPage.getByTestId("document-action-demo");
  const reducedSlider = reducedProduct.getByRole("slider", { name: "Agent access" });
  await reducedProduct.getByRole("button", { name: "Trusted", exact: true }).click();
  assert(await reducedSlider.getAttribute("aria-valuetext") === "Trusted run", "Reduced-motion controls are unusable.");
  await reduced.close();

  for (const route of ["docs", "demo"]) {
    for (const width of [1440, 390]) {
      const visual = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 1000 },
      });
      if (route === "demo") await addWebMCPMock(visual);
      const visualPage = await visual.newPage();
      const visualErrors = [];
      captureErrors(visualPage, visualErrors);
      await visualPage.goto(`${baseUrl}/${route}`, { waitUntil: "networkidle" });
      assert(
        await visualPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
        `${route} overflows at ${width}px.`,
      );
      await visualPage.screenshot({ path: join(output, `${route}-fold-${width}.png`) });
      await visualPage.screenshot({ path: join(output, `${route}-${width}.png`), fullPage: true });
      assert(visualErrors.length === 0, `${route} ${width}px errors:\n${visualErrors.join("\n")}`);
      await visual.close();
    }
  }

  const judgeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await addWebMCPMock(judgeContext);
  const judge = await judgeContext.newPage();
  await judge.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  assert(await judge.getByTestId("judge-instructions").count() === 0, "Judge instructions leaked into the normal demo.");
  await judge.goto(`${baseUrl}/demo?judge=1`, { waitUntil: "networkidle" });
  await judge.getByTestId("judge-instructions").waitFor();
  await judgeContext.close();

  const safeContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await addWebMCPMock(safeContext);
  const safe = await safeContext.newPage();
  const safeErrors = [];
  captureErrors(safe, safeErrors);
  await safe.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await safe.getByRole("button", { name: "Reset demo" }).click();
  await safe.waitForFunction(() => Boolean(window.__remyTools?.create_return));
  const safeResults = await runReturnActions(safe);
  assert(safeResults.slice(0, 4).every((result) => result.ok && result.status === "committed"), "Reversible return actions did not execute automatically.");
  assert(safeResults[4].ok && safeResults[4].status === "awaiting_approval", "Refund did not wait for approval in Reversible actions mode.");
  await safe.getByRole("button", { name: /Open Remy/ }).click();
  await safe.getByText("Return created", { exact: true }).first().waitFor();
  await safe.getByText("Return reason added", { exact: true }).first().waitFor();
  await safe.getByText("Collection address changed", { exact: true }).first().waitFor();
  await safe.getByText("14 High Street → 22 New Road", { exact: true }).waitFor();
  await safe.getByText("Collection booked", { exact: true }).first().waitFor();
  await safe.getByTestId("approve-refund").waitFor();
  const addressRecovery = await safe.evaluate(async () => {
    const history = await window.__remyTools.get_action_history.execute({});
    const address = history.receipts.find((receipt) => receipt.action === "change_collection_address");
    if (!address) return { ok: false, message: "Address receipt not found." };
    return window.__remyTools.revert_action.execute({ receiptId: address.id });
  });
  assert(addressRecovery.ok === true, "Agent-driven address undo failed.");
  await safe.getByText("14 High Street", { exact: true }).waitFor();
  await safe.getByText("Previous value restored", { exact: true }).waitFor();
  await safe.getByText(/linked receipt/).waitFor();
  await safe.getByTestId("approve-refund").click();
  await safe.getByRole("heading", { name: "Return complete" }).waitFor();
  await safe.getByText("£84 sent to Visa ending 4242", { exact: true }).waitFor();
  await safe.waitForTimeout(250);
  await safe.screenshot({ path: join(output, "return-reversible-complete.png"), fullPage: true });
  await safe.getByRole("button", { name: "Hide Remy" }).click();
  await safe.getByRole("button", { name: "Reset demo" }).click();
  const resetStatus = await safe.evaluate(async () => ({
    status: await window.__remyTools.get_remy_status.execute({}),
    history: await window.__remyTools.get_action_history.execute({}),
  }));
  assert(resetStatus.status.controls.autonomy === "reversible", "Reset did not restore Reversible actions mode.");
  assert(resetStatus.status.principal === null, "Reset retained agent identity.");
  assert(resetStatus.history.receipts.length === 0, "Reset retained receipt history.");
  assert(safeErrors.length === 0, `Reversible-flow errors:\n${safeErrors.join("\n")}`);
  await safeContext.close();

  const compensationContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await addWebMCPMock(compensationContext);
  const compensation = await compensationContext.newPage();
  await compensation.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await compensation.waitForFunction(() => Boolean(window.__remyTools?.book_collection));
  await runReturnActions(compensation, { refund: false });
  const compensationResult = await compensation.evaluate(async () => {
    const history = await window.__remyTools.get_action_history.execute({});
    const booking = history.receipts.find((receipt) => receipt.action === "book_collection");
    return window.__remyTools.revert_action.execute({ receiptId: booking.id });
  });
  assert(compensationResult.ok === true, "Collection compensation failed.");
  await compensation.getByText("Cancelled", { exact: true }).waitFor();
  await compensation.getByRole("button", { name: /Open Remy/ }).click();
  const compensationReceipt = compensation.getByText("Collection cancellation recorded", { exact: true });
  await compensationReceipt.scrollIntoViewIfNeeded();
  await compensationReceipt.waitFor();
  await compensationContext.close();

  const rejectionContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await addWebMCPMock(rejectionContext);
  const rejection = await rejectionContext.newPage();
  await rejection.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await rejection.waitForFunction(() => Boolean(window.__remyTools?.issue_refund));
  await runReturnActions(rejection);
  await rejection.getByRole("button", { name: /Open Remy/ }).click();
  await rejection.getByTestId("reject-refund").click();
  await rejection.getByText("Rejected", { exact: true }).waitFor();
  await rejection.getByText("Not issued", { exact: true }).waitFor();
  await rejectionContext.close();

  const modesContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await addWebMCPMock(modesContext);
  const modes = await modesContext.newPage();
  await modes.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await modes.waitForFunction(() => Boolean(window.__remyTools?.create_return));
  for (const [label, expectedStatus] of [
    ["Preview", "staged"],
    ["Ask on changes", "awaiting_approval"],
    ["Reversible actions", "committed"],
  ]) {
    await modes.getByRole("button", { name: "Reset demo" }).click();
    await modes.getByRole("button", { name: /Open Remy/ }).click();
    await modes.getByRole("button", { name: label, exact: true }).click();
    await modes.getByRole("button", { name: "Hide Remy" }).click();
    const result = await modes.evaluate(async () => window.__remyTools.create_return.execute({
      orderId: "1842",
      itemIds: ["headphones", "case"],
    }));
    assert(result.status === expectedStatus, `${label} returned ${result.status}, expected ${expectedStatus}.`);
  }
  await modesContext.close();

  const trustedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await addWebMCPMock(trustedContext);
  const trusted = await trustedContext.newPage();
  const trustedErrors = [];
  captureErrors(trusted, trustedErrors);
  await trusted.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await trusted.waitForFunction(() => Boolean(window.__remyTools?.request_remy_controls));
  const controlRequest = await trusted.evaluate(async () => {
    await window.__remyTools.identify_assistant.execute({
      name: "ChatGPT",
      provider: "OpenAI",
      sessionId: "release-smoke",
    });
    const request = await window.__remyTools.request_remy_controls.execute({
      mode: "trusted",
    });
    const beforeApproval = await window.__remyTools.get_remy_status.execute({});
    return { request, beforeApproval };
  });
  assert(controlRequest.request.status === "awaiting_user", "Agent control escalation did not wait for the user.");
  assert(controlRequest.beforeApproval.controls.autonomy === "reversible", "Trusted mode was applied before user approval.");
  await trusted.getByRole("button", { name: /Open Remy\. AI wants more access/ }).click();
  await trusted.getByRole("heading", { name: "ChatGPT wants more access" }).waitFor();
  assert(await trusted.getByRole("slider", { name: "AI access" }).getAttribute("aria-valuetext") === "Reversible actions", "Visible controls changed before permission approval.");
  await trusted.getByRole("button", { name: "Allow this change" }).click();
  assert(await trusted.getByRole("slider", { name: "AI access" }).getAttribute("aria-valuetext") === "Trusted run", "Approved trusted mode was not applied.");
  await trusted.getByRole("button", { name: "Hide Remy" }).click();
  const trustedResults = await runReturnActions(trusted);
  assert(trustedResults.every((result) => result.ok && result.status === "committed"), "Trusted run did not execute the full return without another approval.");
  await trusted.getByRole("heading", { name: "Return complete" }).waitFor();
  assert(await trusted.getByTestId("approve-refund").count() === 0, "Trusted refund created another approval request.");
  const trustedHistory = await trusted.evaluate(async () => window.__remyTools.get_action_history.execute({}));
  assert(trustedHistory.receipts.some((receipt) => receipt.action === "issue_refund" && receipt.principal === "ChatGPT"), "Trusted refund receipt did not preserve the requesting assistant identity.");
  await trusted.getByRole("button", { name: /Open Remy/ }).click();
  assert(await trusted.getByText("Requested by ChatGPT", { exact: true }).count() >= 5, "Visible receipts do not attribute trusted actions to ChatGPT.");
  await trusted.waitForTimeout(250);
  await trusted.screenshot({ path: join(output, "return-trusted-complete.png"), fullPage: true });
  assert(trustedErrors.length === 0, `Trusted-run errors:\n${trustedErrors.join("\n")}`);
  await trustedContext.close();

  const unsupportedContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const unsupported = await unsupportedContext.newPage();
  const unsupportedErrors = [];
  captureErrors(unsupported, unsupportedErrors);
  await unsupported.goto(`${baseUrl}/demo`, { waitUntil: "networkidle" });
  await unsupported.getByTestId("webmcp-status").getByText("WebMCP unavailable", { exact: true }).waitFor();
  await unsupported.getByRole("heading", { name: "Order #1842" }).waitFor();
  await unsupported.getByRole("button", { name: /Open Remy/ }).click();
  await unsupported.getByText("WebMCP unavailable · return page still works", { exact: true }).waitFor();
  await unsupported.getByRole("button", { name: "Hide Remy" }).click();
  await unsupported.getByRole("button", { name: "Reset demo" }).click();
  assert(unsupportedErrors.length === 0, `Unsupported-browser errors:\n${unsupportedErrors.join("\n")}`);
  await unsupportedContext.close();

  console.log("Browser smoke passed: homepage, responsive routes, slider controls, all autonomy modes, approval, rejection, exact undo, compensation, append-only recovery, trusted execution, reset, and unsupported-browser fallback.");
  console.log(output);
} finally {
  await browser.close();
  if (server && !server.killed) server.kill();
}
