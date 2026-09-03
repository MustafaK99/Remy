import type {
  Principal,
  SemanticChange,
  SemanticValue,
} from "../public-types";

export function boundedText(value: string, max = 1_000) {
  return value.trim().slice(0, max) || "Untitled action";
}

function boundedValue(value: unknown): SemanticValue | undefined {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, 512);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

export function boundedRecord(
  value: Readonly<Record<string, SemanticValue>> | undefined,
  maxEntries = 32,
) {
  if (!value) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, maxEntries)
      .flatMap(([key, entry]) => {
        const bounded = boundedValue(entry);
        return bounded === undefined ? [] : [[key.slice(0, 96), bounded]];
      }),
  );
}

export function boundedDetails(
  value: Readonly<Record<string, string>> | undefined,
) {
  if (!value) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 32)
      .flatMap(([key, entry]) =>
        typeof entry === "string"
          ? [[key.slice(0, 96), entry.slice(0, 512)]]
          : [],
      ),
  );
}

export function boundedChanges(
  changes: ReadonlyArray<SemanticChange> | undefined,
): ReadonlyArray<SemanticChange> {
  return (changes ?? []).slice(0, 64).map((change) => ({
    label: boundedText(change.label, 160),
    path: change.path?.slice(0, 256),
    kind: change.kind,
    before: boundedValue(change.before),
    after: boundedValue(change.after),
  }));
}

export function boundedPrincipal(principal: Principal | undefined) {
  if (!principal) return undefined;
  return {
    id: String(principal.id).slice(0, 256) || "unknown",
    name: typeof principal.name === "string" ? principal.name.slice(0, 96) : undefined,
    provider: typeof principal.provider === "string" ? principal.provider.slice(0, 96) : undefined,
    assurance: ["self-reported", "authenticated", "verified"].includes(
      principal.assurance,
    )
      ? principal.assurance
      : "self-reported",
    attributes: boundedRecord(principal.attributes, 16),
  } satisfies Principal;
}
