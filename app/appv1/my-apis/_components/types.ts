export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type MockApi = {
  id: string;
  name: string;
  slug: string;
  url: string;
  methods: HttpMethod[];
  statusCode: number;
  latencyMs: number;
  enabled: boolean;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  preview: unknown;
};
