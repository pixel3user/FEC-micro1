import { resolveTxt } from "node:dns/promises";

export async function resolveDnsManifest(
  domain: string,
): Promise<string | null> {
  if (
    !/^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(
      domain,
    )
  ) {
    return null;
  }
  try {
    const records = await resolveTxt(`_agent.${domain}`);
    for (const record of records) {
      const value = record.join("");
      if (value.startsWith("agent-manifest=")) {
        const url = value.slice("agent-manifest=".length);
        if (url.startsWith("https://")) return url;
      }
    }
  } catch {
    return null;
  }
  return null;
}
