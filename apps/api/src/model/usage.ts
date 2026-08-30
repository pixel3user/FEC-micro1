/**
 * Lightweight in-process usage/cost accounting. OpenRouter returns per-call
 * cost when `usage.include` is set; we aggregate it so the API can expose a
 * running total for the budget-conscious prototype and the evaluation harness.
 */

export type UsageEntry = {
  purpose: string;
  model: string;
  cost: number;
  usage: { prompt_tokens?: number; completion_tokens?: number };
};

type UsageTotals = {
  calls: number;
  costUsd: number;
  promptTokens: number;
  completionTokens: number;
  byPurpose: Record<string, { calls: number; costUsd: number }>;
};

const totals: UsageTotals = {
  calls: 0,
  costUsd: 0,
  promptTokens: 0,
  completionTokens: 0,
  byPurpose: {},
};

export function recordUsage(entry: UsageEntry): void {
  totals.calls += 1;
  totals.costUsd += entry.cost;
  totals.promptTokens += entry.usage.prompt_tokens ?? 0;
  totals.completionTokens += entry.usage.completion_tokens ?? 0;
  const bucket = totals.byPurpose[entry.purpose] ?? { calls: 0, costUsd: 0 };
  bucket.calls += 1;
  bucket.costUsd += entry.cost;
  totals.byPurpose[entry.purpose] = bucket;
  console.info(
    JSON.stringify({
      event: "model.usage",
      purpose: entry.purpose,
      model: entry.model,
      cost: entry.cost,
      cumulativeCostUsd: Number(totals.costUsd.toFixed(6)),
    }),
  );
}

export function getUsageTotals(): UsageTotals {
  return {
    ...totals,
    costUsd: Number(totals.costUsd.toFixed(6)),
    byPurpose: Object.fromEntries(
      Object.entries(totals.byPurpose).map(([key, value]) => [
        key,
        { calls: value.calls, costUsd: Number(value.costUsd.toFixed(6)) },
      ]),
    ),
  };
}
