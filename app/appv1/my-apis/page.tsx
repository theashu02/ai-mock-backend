"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { HttpMethod, MockApi } from "./_components/types";
import { EndpointForm } from "./_components/EndpointForm";
import { EndpointList } from "./_components/EndpointList";
import { ResponseViewer } from "./_components/ResponseViewer";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-3 border-b border-border/50 bg-card/30 px-6 py-3 md:flex-row md:items-center md:justify-between">
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
        <EndpointForm
          name={name}
          setName={setName}
          path={path}
          setPath={setPath}
          methods={methods}
          setMethods={setMethods}
          statusCode={statusCode}
          setStatusCode={setStatusCode}
          latencyMs={latencyMs}
          setLatencyMs={setLatencyMs}
          rawJson={rawJson}
          setRawJson={setRawJson}
          isSaving={isSaving}
          onSubmit={handleCreate}
          className={`flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-border/50 p-3 ${
            mobileTab === "form" ? "flex" : "hidden lg:flex"
          }`}
        />

        {/* Right panel: endpoint list + response */}
        <main className={`grid min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_420px] ${mobileTab === "form" ? "hidden lg:grid" : "grid"}`}>
          <EndpointList
            apis={apis}
            selectedApi={selectedApi}
            copiedUrl={copiedUrl}
            isTesting={isTesting}
            isLoading={isLoading}
            onSelectApi={(id, preview) => {
              setSelectedId(id);
              if (preview) {
                setOutput(JSON.stringify(preview, null, 2));
              }
            }}
            onCopyUrl={copyUrl}
            onPreviewApi={handlePreview}
            onTestApi={handleTest}
            onDeleteApi={handleDelete}
            className={`min-h-0 overflow-y-auto p-4 ${
              mobileTab === "response" ? "hidden xl:block" : ""
            }`}
          />

          <ResponseViewer
            selectedApi={selectedApi}
            output={output}
            onPreview={() => selectedApi && handlePreview(selectedApi)}
            className={`flex min-h-0 flex-col border-t border-border/50 bg-card/10 xl:border-l xl:border-t-0 ${
              mobileTab === "list" ? "hidden xl:flex" : mobileTab === "response" ? "flex" : "hidden xl:flex"
            }`}
          />
        </main>
      </div>
    </div>
  );
}
