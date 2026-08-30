import type {
  CreateWorldRequest,
  CreateWorldResponse,
  DynamicActionRequest,
  DynamicActionResponse,
  ExperienceRequest,
  ExperienceResponse,
  ProviderWorld,
  PublishResponse,
} from "@agent-web/contracts";

const API_BASE = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8787"
).replace(/\/$/, "");

export const api = {
  createWorld(input: CreateWorldRequest) {
    return request<CreateWorldResponse>("/v1/worlds", {
      method: "POST",
      body: input,
    });
  },
  converse(worldId: string, ownerToken: string, message: string) {
    return request<ProviderWorld>(`/v1/worlds/${worldId}/converse`, {
      method: "POST",
      body: { message },
      ownerToken,
    });
  },
  publish(worldId: string, ownerToken: string) {
    return request<PublishResponse>(`/v1/worlds/${worldId}/publish`, {
      method: "POST",
      ownerToken,
    });
  },
  createExperience(input: ExperienceRequest) {
    return request<ExperienceResponse>("/v1/experiences", {
      method: "POST",
      body: input,
    });
  },
  invoke(worldId: string, input: DynamicActionRequest) {
    return request<DynamicActionResponse>(`/v1/worlds/${worldId}/invoke`, {
      method: "POST",
      body: input,
    });
  },
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  ownerToken?: string;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.ownerToken ? { "x-owner-token": options.ownerToken } : {}),
    },
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!response.ok)
    throw new Error(
      payload.error ?? `Request failed with HTTP ${response.status}.`,
    );
  return payload;
}
