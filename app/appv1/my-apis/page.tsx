"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type MockApi = {
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

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  PATCH: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25",
  DELETE: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

const METHOD_ACTIVE: Record<HttpMethod, string> = {
  GET: "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600",
  POST: "bg-blue-500 text-white border-blue-600 hover:bg-blue-600",
  PUT: "bg-amber-500 text-white border-amber-600 hover:bg-amber-600",
  PATCH: "bg-violet-500 text-white border-violet-600 hover:bg-violet-600",
  DELETE: "bg-rose-500 text-white border-rose-600 hover:bg-rose-600",
};

const DEFAULT_JSON = JSON.stringify(
  {
    id: "7d0f62a2-64aa-47ac-bfea-5adf0b34df50",
    name: "Aarav Mehta",
    email: "aarav@example.com",
    status: "active",
    createdAt: "2026-07-21T10:30:00.000Z",
    profile: {
      city: "Mumbai",
      country: "India",
    },
  },
  null,
  2,
);

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return null;
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MyApisPage() {
  const [apis, setApis] = useState<MockApi[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("Users API");
  const [path, setPath] = useState("users");
  const [methods, setMethods] = useState<HttpMethod[]>(["GET"]);
  const [statusCode, setStatusCode] = useState(200);
  const [latencyMs, setLatencyMs] = useState(0);
  const [rawJson, setRawJson] = useState(DEFAULT_JSON);
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"form" | "list" | "response">("form");

  const selectedApi = useMemo(
    () => apis.find((api) => api.id === selectedId) ?? apis[0] ?? null,
    [apis, selectedId],
  );

  const loadApis = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/mock-apis", { cache: "no-store" });
      const result = (await response.json()) as {
        ok: boolean;
        apis?: MockApi[];
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to load APIs.");
      }

      setApis(result.apis ?? []);
      setSelectedId((current) => current ?? result.apis?.[0]?.id ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load APIs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApis();
  }, [loadApis]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !path.trim()) {
      toast.error("Name and endpoint path are required.");
      return;
    }

    try {
      JSON.parse(rawJson);
    } catch {
      toast.error("Response JSON is invalid.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/mock-apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, path, methods, statusCode, latencyMs, rawJson }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        api?: MockApi;
        message?: string;
      };

      if (!response.ok || !result.ok || !result.api) {
        throw new Error(result.message || "Unable to create mock API.");
      }

      setApis((current) => [
        result.api!,
        ...current.filter((api) => api.id !== result.api!.id),
      ]);
      setSelectedId(result.api.id);
      setOutput(JSON.stringify(result.api.preview, null, 2));
      setMobileTab("list");
      toast.success("Mock API published.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create mock API.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePreview(api: MockApi) {
    try {
      const response = await fetch(`/api/mock-apis/${api.id}/preview`, {
        method: "POST",
      });
      const result = (await response.json()) as {
        ok: boolean;
        preview?: unknown;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to generate preview.");
      }

      setOutput(JSON.stringify(result.preview, null, 2));
      setSelectedId(api.id);
      setMobileTab("response");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to generate preview.",
      );
    }
  }

  async function handleTest(api: MockApi) {
    setIsTesting(api.id);
    try {
      const method = api.methods[0] ?? "GET";
      const response = await fetch(api.url, { method });
      const payload = await response.json();

      setOutput(JSON.stringify(payload, null, 2));
      setSelectedId(api.id);
      setMobileTab("response");
      await loadApis();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsTesting(null);
    }
  }

  async function handleDelete(api: MockApi) {
    try {
      const response = await fetch(`/api/mock-apis/${api.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to delete mock API.");
      }

      setApis((current) => current.filter((item) => item.id !== api.id));
      setSelectedId((current) => (current === api.id ? null : current));
      if (selectedId === api.id) setOutput("");
      toast.success("Mock API deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete mock API.",
      );
    }
  }

  async function copyUrl(api: MockApi) {
    const fullUrl = `${window.location.origin}/api/mock/${api.slug}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(api.id);
    toast.success("Endpoint URL copied to clipboard.");
    window.setTimeout(() => setCopiedUrl(null), 1600);
  }

  function toggleMethod(method: HttpMethod) {
    setMethods((current) => {
      if (current.includes(method)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== method);
      }
      return [...current, method];
    });
  }

  const jsonValid = useMemo(() => {
    try {
      JSON.parse(rawJson);
      return true;
    } catch {
      return false;
    }
  }, [rawJson]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-3 border-b border-border/50 bg-card/30 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">My APIs</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {apis.length === 0
                ? "Create your first mock endpoint"
                : `${apis.length} published endpoint${apis.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile tab switcher */}
          <Tabs
            value={mobileTab}
            onValueChange={(val) => {
              if (val === "form" || val === "list" || val === "response") {
                setMobileTab(val);
              }
            }}
            className="w-full lg:hidden"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form">Create</TabsTrigger>
              <TabsTrigger value="list">
                Endpoints{apis.length > 0 ? ` (${apis.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm" onClick={loadApis} disabled={isLoading} className="hidden lg:flex">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left panel: Create form */}
        <form
          onSubmit={handleCreate}
          className={`flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-border/50 p-3 ${mobileTab === "form" ? "flex" : "hidden lg:flex"}`}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Users API"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Status Code</span>
              <Input
                type="number"
                min={100}
                max={599}
                value={statusCode}
                onChange={(event) => setStatusCode(Number(event.target.value))}
              />
            </label>
          </div>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Endpoint Path</span>
            <div className="flex items-center overflow-hidden rounded-md border border-input bg-background dark:bg-input/30">
              <span className="shrink-0 bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground border-r border-input">
                /api/mock/
              </span>
              <Input
                value={path}
                onChange={(event) => setPath(event.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0"
                placeholder="users"
              />
            </div>
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">HTTP Methods</span>
            <div className="grid grid-cols-5 gap-1.5">
              {METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => toggleMethod(method)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    methods.includes(method)
                      ? METHOD_ACTIVE[method]
                      : "border-border bg-card/50 text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Simulated Latency (ms)
            </span>
            <Input
              type="number"
              min={0}
              max={10000}
              value={latencyMs}
              onChange={(event) => setLatencyMs(Number(event.target.value))}
            />
          </label>

          <label className="flex min-h-[280px] flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Response JSON
              </span>
              <span className={`text-[10px] font-medium ${jsonValid ? "text-emerald-500" : "text-rose-500"}`}>
                {jsonValid ? "✓ Valid" : "✕ Invalid"}
              </span>
            </div>
            <Textarea
              value={rawJson}
              onChange={(event) => setRawJson(event.target.value)}
              className="min-h-[240px] flex-1 resize-none bg-card/30 font-mono text-xs leading-relaxed"
              placeholder="Paste your JSON response here..."
            />
          </label>

          <Button type="submit" size="lg" disabled={isSaving || !jsonValid} className="gap-2">
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isSaving ? "Publishing..." : "Publish Endpoint"}
          </Button>
        </form>

        {/* Right panel: endpoint list + response */}
        <main className={`grid min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_420px] ${mobileTab === "form" ? "hidden lg:grid" : "grid"}`}>
          {/* Endpoint list */}
          <section className={`min-h-0 overflow-y-auto p-4 ${mobileTab === "response" ? "hidden xl:block" : ""}`}>
            {apis.length === 0 ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-muted/10 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isLoading ? "Loading endpoints..." : "No mock endpoints yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
                    {isLoading
                      ? "Fetching your published APIs..."
                      : "Create your first endpoint by filling the form and clicking Publish."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {apis.map((api) => {
                  const isSelected = selectedApi?.id === api.id;
                  const relativeTime = formatRelativeTime(api.lastHitAt);

                  return (
                    <Card
                      key={api.id}
                      size="sm"
                      className={`rounded-md transition-all duration-200 cursor-pointer hover:shadow-md ${
                        isSelected
                          ? "ring-1 ring-primary/40 shadow-sm"
                          : "hover:ring-1 hover:ring-border"
                      }`}
                      onClick={() => {
                        setSelectedId(api.id);
                        if (api.preview) {
                          setOutput(JSON.stringify(api.preview, null, 2));
                        }
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm">{api.name}</span>
                          <Badge
                            variant={api.statusCode < 400 ? "default" : "destructive"}
                            className="shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {api.statusCode}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 truncate font-mono text-[11px]">
                          <span className="text-primary/60">/api/mock/</span>
                          <span className="text-foreground/80">{api.slug}</span>
                        </CardDescription>
                        <CardAction>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyUrl(api);
                            }}
                            title="Copy URL"
                          >
                            {copiedUrl === api.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </CardAction>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Method badges + metadata */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {api.methods.map((method) => (
                            <span
                              key={method}
                              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${METHOD_COLORS[method]}`}
                            >
                              {method}
                            </span>
                          ))}
                          <span className="mx-1 h-3 w-px bg-border" />
                          {api.latencyMs > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {api.latencyMs}ms
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                            <Activity className="h-2.5 w-2.5" />
                            {api.hitCount.toLocaleString()} hit{api.hitCount !== 1 ? "s" : ""}
                          </Badge>
                          {relativeTime && (
                            <span className="text-[10px] text-muted-foreground">
                              · {relativeTime}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(api);
                            }}
                          >
                            <Activity className="h-3 w-3" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTest(api);
                            }}
                            disabled={isTesting === api.id}
                          >
                            {isTesting === api.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            {isTesting === api.id ? "Testing..." : "Test"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1.5 text-xs ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(api);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1.5 text-xs text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/api/mock/${api.slug}`, "_blank");
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Response viewer */}
          <aside className={`flex min-h-0 flex-col border-t border-border/50 bg-card/10 xl:border-l xl:border-t-0 ${mobileTab === "list" ? "hidden xl:flex" : mobileTab === "response" ? "flex" : "hidden xl:flex"}`}>
            <div className="shrink-0 border-b border-border/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    Response
                    {selectedApi && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </h2>
                  <p className="mt-0.5 truncate text-xs font-mono text-muted-foreground">
                    {selectedApi
                      ? `/api/mock/${selectedApi.slug}`
                      : "Select an endpoint to view response"}
                  </p>
                </div>
                {selectedApi && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => handlePreview(selectedApi)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <Textarea
                readOnly
                value={
                  output ||
                  (selectedApi ? JSON.stringify(selectedApi.preview, null, 2) : "")
                }
                placeholder='{"message": "Select an endpoint or create one to preview mock data"}'
                className="absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed focus-visible:ring-0"
              />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
