import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")
      ? [path]
      : [];
  });
}

function assertNoMatches(directory: string, forbidden: RegExp) {
  for (const path of sourceFiles(directory)) {
    const source = readFileSync(path, "utf8");
    expect(source, `${relative(root, path)} crossed a package boundary`).not.toMatch(
      forbidden,
    );
  }
}

describe("Remy dependency boundaries", () => {
  it("keeps core independent of frameworks, protocols, and demo code", () => {
    assertNoMatches(
      join(root, "src", "remy", "core"),
      /(?:from|import\()\s*["'](?:react|next|@\/demo|@\/remy\/adapters)/,
    );
  });

  it("keeps the headless WebMCP adapter independent of React and the demo", () => {
    const source = readFileSync(
      join(root, "src", "remy", "adapters", "webmcp.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/(?:react|@\/demo|DemoState)/);
    expect(source).not.toMatch(/@\/remy\/core\//);
  });

  it("keeps React primitives independent of Next, adapters, and the demo", () => {
    assertNoMatches(
      join(root, "src", "remy", "react"),
      /(?:from|import\()\s*["'](?:next|@\/demo|@\/remy\/adapters)/,
    );
  });

  it("keeps commerce concepts out of core", () => {
    assertNoMatches(
      join(root, "src", "remy", "core"),
      /\b(?:morrow|cart|checkout|purchase|commerce)\b/i,
    );
  });
});
