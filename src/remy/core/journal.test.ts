import { describe, expect, it } from "vitest";
import { createBrowserJournalStore } from "./journal";
import type { PersistedJournal } from "./public-types";

const emptyJournal: PersistedJournal = {
  schemaVersion: 1,
  controls: { autonomy: "reversible", paused: false, grants: [] },
  receipts: [],
  events: [],
};

describe("browser journal store", () => {
  it("uses a namespaced versioned key", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const store = createBrowserJournalStore({ namespace: "acme", storage });
    expect(store.save(emptyJournal).ok).toBe(true);
    expect(values.has("acme:journal:v1")).toBe(true);
    expect(store.load()).toMatchObject({
      ok: true,
      value: { schemaVersion: 1 },
    });
    expect(store.clear().ok).toBe(true);
    expect(values.size).toBe(0);
  });

  it("returns actionable failures when browser storage is unavailable", () => {
    const unavailable = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {
        throw new Error("storage disabled");
      },
    };
    const store = createBrowserJournalStore({
      namespace: "unavailable",
      storage: unavailable,
    });
    expect(store.load()).toMatchObject({ ok: false, code: "JOURNAL_READ_FAILED" });
    expect(store.save(emptyJournal)).toMatchObject({
      ok: false,
      code: "JOURNAL_WRITE_FAILED",
    });
    expect(store.clear()).toMatchObject({ ok: false, code: "JOURNAL_CLEAR_FAILED" });
  });
});
