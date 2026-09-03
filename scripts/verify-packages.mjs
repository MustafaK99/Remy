import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const node = process.execPath;
const outputDirectory = join(root, "artifacts", "packages");
const packages = ["core", "webmcp", "react"];

if (existsSync(outputDirectory)) rmSync(outputDirectory, { recursive: true });
mkdirSync(outputDirectory, { recursive: true });

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: process.platform === "win32" && command === npm,
  });
}

run(npm, ["run", "build:packages"]);

const tarballs = packages.map((name) => {
  const packed = run(
    npm,
    ["pack", "--ignore-scripts", "--silent", "--json", "--pack-destination", outputDirectory],
    { cwd: join(root, "packages", name), capture: true },
  );
  const result = JSON.parse(packed);
  if (!Array.isArray(result) || typeof result[0]?.filename !== "string") {
    throw new Error(`npm pack did not return a tarball for ${name}.`);
  }
  return join(outputDirectory, result[0].filename);
});

const fixture = mkdtempSync(join(tmpdir(), "remy-package-smoke-"));
writeFileSync(join(fixture, "package.json"), JSON.stringify({
  name: "remy-package-smoke",
  private: true,
  type: "module",
}, null, 2));

run(npm, [
  "install",
  "--ignore-scripts",
  "--no-audit",
  "--no-fund",
  ...tarballs,
  "react@19.2.8",
  "zod@4.5.4",
], { cwd: fixture });

writeFileSync(join(fixture, "smoke.ts"), `
import { createRemy, succeed, type ActionInput, type ActionOutput } from "@remy-ai/core";
import { registerWebMCP } from "@remy-ai/webmcp";
import { useRemySnapshot } from "@remy-ai/react";
import { z } from "zod";

let title = "Draft";
const remy = createRemy({ context: () => ({
  getTitle: () => title,
  setTitle: (next: string) => { title = next; },
}) });
const rename = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Rename a document.",
  kind: "write",
  risk: "low",
  input: z.strictObject({ title: z.string().min(1) }),
  preview: ({ input, context }) => ({
    summary: \`Rename document to \${input.title}.\`,
    changes: [{ label: "Title", before: context.getTitle(), after: input.title }],
    recovery: { title: context.getTitle() },
  }),
  execute: ({ input, context }) => {
    context.setTitle(input.title);
    return succeed({ title: input.title });
  },
  recovery: {
    kind: "exact",
    execute: ({ receipt, context }) => {
      context.setTitle(receipt.recovery.title);
      return succeed({ title: receipt.recovery.title });
    },
  },
});
remy.register(rename);
type Input = ActionInput<typeof rename>;
type Output = ActionOutput<typeof rename>;
const input: Input = { title: "Launch plan" };
const output: Output = { title: "Launch plan" };
void input;
void output;
void registerWebMCP;
void useRemySnapshot;
`);

writeFileSync(join(fixture, "tsconfig.json"), JSON.stringify({
  compilerOptions: {
    strict: true,
    noEmit: true,
    target: "ES2022",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    lib: ["ES2022", "DOM"],
    skipLibCheck: false,
  },
  include: ["smoke.ts"],
}, null, 2));

run(node, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", join(fixture, "tsconfig.json")]);

writeFileSync(join(fixture, "smoke.mjs"), `
import { createRemy, succeed } from "@remy-ai/core";
import { registerWebMCP } from "@remy-ai/webmcp";
import { useRemySnapshot } from "@remy-ai/react";
import { z } from "zod";

let title = "Draft";
const remy = createRemy({ context: () => ({
  getTitle: () => title,
  setTitle: (next) => { title = next; },
}) });
const rename = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Rename a document.",
  kind: "write",
  risk: "low",
  input: z.strictObject({ title: z.string().min(1) }),
  preview: ({ input, context }) => ({
    summary: \`Rename document to \${input.title}.\`,
    resources: ["document:title"],
    changes: [{ label: "Title", before: context.getTitle(), after: input.title }],
    recovery: { title: context.getTitle() },
  }),
  execute: ({ input, context }) => {
    context.setTitle(input.title);
    return succeed({ title: input.title });
  },
  recovery: {
    kind: "exact",
    execute: ({ receipt, context }) => {
      context.setTitle(receipt.recovery.title);
      return succeed({ title: receipt.recovery.title });
    },
  },
  exposeOutput: (output) => output,
});
remy.register(rename);

const tools = new Map();
const modelContext = {
  registerTool(tool, options) {
    if (tools.has(tool.name)) throw new Error(\`Duplicate tool: \${tool.name}\`);
    tools.set(tool.name, tool);
    options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
  },
};

const registration = await registerWebMCP(remy, { modelContext });
if (registration.status !== "ready") throw new Error("WebMCP registration was not ready.");
const result = await tools.get("rename_document").execute({ title: "Launch plan" });
if (!result.ok || title !== "Launch plan") throw new Error("Packed action execution failed.");
if (typeof useRemySnapshot !== "function") throw new Error("React export is missing.");
registration.unregister();
if (tools.size !== 0) throw new Error("Packed WebMCP cleanup failed.");
`);

run(node, [join(fixture, "smoke.mjs")], { cwd: fixture });

const manifests = packages.map((name) => {
  const manifestPath = join(fixture, "node_modules", "@remy-ai", name, "package.json");
  return JSON.parse(readFileSync(manifestPath, "utf8"));
});
writeFileSync(join(outputDirectory, "verification.json"), JSON.stringify({
  verifiedAt: new Date().toISOString(),
  fixture,
  tarballs: tarballs.map((path) => path.slice(root.length + 1).replaceAll("\\\\", "/")),
  packages: manifests.map(({ name, version }) => ({ name, version })),
  checks: ["ESM imports", "declarations", "typed action", "WebMCP invocation", "registration cleanup", "React export"],
}, null, 2));

console.log(`Verified ${tarballs.length} packed packages in ${fixture}.`);
console.log(tarballs.join("\n"));
