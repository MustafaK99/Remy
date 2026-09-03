#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const command = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const dryRun = args.has("--dry-run");
const skipInstall = args.has("--skip-install") || dryRun;
const force = args.has("--force");
const projectRoot = resolve(process.cwd());

if (!command || ["help", "--help", "-h"].includes(command)) {
  printHelp();
  process.exit(0);
}

if (command !== "init") {
  fail(`Unknown command \"${command}\". Run remy help for usage.`);
}

const packagePath = join(projectRoot, "package.json");
if (!existsSync(packagePath)) {
  fail("Remy could not find a package.json in this directory.");
}

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
if (!dependencies.next) {
  fail("This alpha initializer currently supports Next.js projects only.");
}

const usesSrc = existsSync(join(projectRoot, "src"));
const sourceRoot = usesSrc ? join(projectRoot, "src") : projectRoot;
const appRoot = join(sourceRoot, "app");
if (!existsSync(appRoot)) {
  fail("Remy expected a Next.js App Router directory at app/ or src/app/.");
}

const files = [
  {
    path: join(sourceRoot, "remy", "actions.ts"),
    content: actionsTemplate(),
  },
  {
    path: join(sourceRoot, "remy", "provider.tsx"),
    content: providerTemplate(),
  },
];

console.log("\n  remy  /  trustworthy agent actions\n");
console.log(`  ✓ Detected Next.js App Router${usesSrc ? " with src/" : ""}`);

for (const file of files) {
  const displayPath = relative(projectRoot, file.path).replaceAll("\\", "/");
  if (existsSync(file.path) && !force) {
    console.log(`  – Kept existing ${displayPath}`);
    continue;
  }
  if (!dryRun) {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.content, "utf8");
  }
  console.log(`  ${dryRun ? "· Would create" : "✓ Created"} ${displayPath}`);
}

if (!skipInstall) {
  const packageManager = detectPackageManager(projectRoot);
  console.log(`  · Installing Remy with ${packageManager.label}…`);
  execFileSync(packageManager.executable, packageManager.arguments, {
    cwd: projectRoot,
    stdio: "inherit",
  });
  console.log("  ✓ Installed @remy-ai/core, @remy-ai/react, @remy-ai/webmcp, and zod");
} else {
  console.log(`  ${dryRun ? "· Would install" : "– Skipped"} Remy SDK packages`);
}

console.log(`
  Next
  1. Define your business actions in ${relative(projectRoot, files[0].path).replaceAll("\\", "/")}
  2. Wrap your layout with RemyAppProvider
  3. Render Remy state wherever it makes sense in your existing UI (optional)

  Done. Your actions, policy, history, and WebMCP tools now share one path.
`);

function detectPackageManager(root) {
  if (existsSync(join(root, "pnpm-lock.yaml"))) {
    return {
      label: "pnpm",
      executable: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      arguments: ["add", "@remy-ai/core", "@remy-ai/react", "@remy-ai/webmcp", "zod"],
    };
  }
  if (existsSync(join(root, "yarn.lock"))) {
    return {
      label: "Yarn",
      executable: process.platform === "win32" ? "yarn.cmd" : "yarn",
      arguments: ["add", "@remy-ai/core", "@remy-ai/react", "@remy-ai/webmcp", "zod"],
    };
  }
  if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) {
    return {
      label: "Bun",
      executable: process.platform === "win32" ? "bun.exe" : "bun",
      arguments: ["add", "@remy-ai/core", "@remy-ai/react", "@remy-ai/webmcp", "zod"],
    };
  }
  return {
    label: "npm",
    executable: process.platform === "win32" ? "npm.cmd" : "npm",
    arguments: ["install", "@remy-ai/core", "@remy-ai/react", "@remy-ai/webmcp", "zod"],
  };
}

function printHelp() {
  console.log(`
  remy init [options]

  Options
    --dry-run       Show detected files and planned changes
    --skip-install  Scaffold files without installing packages
    --force         Replace existing generated files
  `);
}

function fail(message) {
  console.error(`\n  Remy could not initialize: ${message}\n`);
  process.exit(1);
}

function actionsTemplate() {
  return `import { z } from "zod";
import { createRemy } from "@remy-ai/core";

export const remy = createRemy();

export const exampleAction = remy.defineAction({
  name: "update_item",
  title: "Update item",
  description: "Updates an item and records the visible change.",
  inputSchema: z.object({ id: z.string(), value: z.string() }),
  risk: "medium",
  reversibility: "exact",
  preview: async (input, context) => ({
    resource: \`item:\${input.id}\`,
    before: await context.items.get(input.id),
    after: input.value,
  }),
  execute: async (input, context) => context.items.update(input),
  undo: async (receipt, context) =>
    context.items.update({ id: receipt.input.id, value: receipt.before }),
});
`;
}

function providerTemplate() {
  return `"use client";

import type { ReactNode } from "react";
import { RemyProvider } from "@remy-ai/react";
import { WebMCPBridge } from "@remy-ai/webmcp";
import { remy } from "./actions";

export function RemyAppProvider({ children }: { children: ReactNode }) {
  return (
    <RemyProvider engine={remy}>
      <WebMCPBridge />
      {children}
    </RemyProvider>
  );
}
`;
}
