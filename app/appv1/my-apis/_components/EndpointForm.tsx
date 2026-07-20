"use client";

import React, { FormEvent, useMemo } from "react";
import { Plus, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HttpMethod } from "./types";

interface EndpointFormProps {
  name: string;
  setName: (val: string) => void;
  path: string;
  setPath: (val: string) => void;
  methods: HttpMethod[];
  setMethods: React.Dispatch<React.SetStateAction<HttpMethod[]>>;
  statusCode: number;
  setStatusCode: (val: number) => void;
  latencyMs: number;
  setLatencyMs: (val: number) => void;
  rawJson: string;
  setRawJson: (val: string) => void;
  isSaving: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  className?: string;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const METHOD_ACTIVE: Record<HttpMethod, string> = {
  GET: "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600",
  POST: "bg-blue-500 text-white border-blue-600 hover:bg-blue-600",
  PUT: "bg-amber-500 text-white border-amber-600 hover:bg-amber-600",
  PATCH: "bg-violet-500 text-white border-violet-600 hover:bg-violet-600",
  DELETE: "bg-rose-500 text-white border-rose-600 hover:bg-rose-600",
};

export function EndpointForm({
  name,
  setName,
  path,
  setPath,
  methods,
  setMethods,
  statusCode,
  setStatusCode,
  latencyMs,
  setLatencyMs,
  rawJson,
  setRawJson,
  isSaving,
  onSubmit,
  className,
}: EndpointFormProps) {
  const jsonValid = useMemo(() => {
    try {
      JSON.parse(rawJson);
      return true;
    } catch {
      return false;
    }
  }, [rawJson]);

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

  return (
    <form onSubmit={onSubmit} className={className}>
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

      <label className="flex min-h-70 flex-1 flex-col gap-1.5">
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
          className="min-h-60 flex-1 resize-none bg-card/30 font-mono text-xs leading-relaxed"
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
  );
}
