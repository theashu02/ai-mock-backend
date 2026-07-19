"use client";

import { useState } from "react";
import { Loader2, Zap, Code2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchemaResult {
  ok: boolean;
  schema?: unknown;
}

interface GenerateResult {
  ok: boolean;
  recordId?: string;
  instanceId?: string;
  record?: unknown;
  message?: string;
}

// ─── Glassmorphism helpers ────────────────────────────────────────────────────

const glass =
  "bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(234,194,255,0.07)]";

const glowBorder =
  "border border-lavender/20 shadow-[0_0_20px_rgba(234,194,255,0.12),inset_0_0_20px_rgba(234,194,255,0.03)]";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [schemaName, setSchemaName] = useState("");
  const [schemaJson, setSchemaJson] = useState("");
  const [compileLoading, setCompileLoading] = useState(false);
  const [compileResult, setCompileResult] = useState<SchemaResult | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const endpointUrl = schemaName
    ? `POST ${BASE_URL}/api/generate/${schemaName}`
    : `POST ${BASE_URL}/api/generate/{name}`;

  // ── Compile & Map ──────────────────────────────────────────────────────────
  const handleCompile = async () => {
    if (!schemaName.trim() || !schemaJson.trim()) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(schemaJson);
    } catch {
      setCompileError("Invalid JSON — please fix your schema.");
      return;
    }

    setCompileLoading(true);
    setCompileError(null);
    setCompileResult(null);

    try {
      const res = await fetch(`${BASE_URL}/api/schema/${schemaName.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data: SchemaResult = await res.json();
      if (!data.ok) throw new Error("Schema compilation failed");
      setCompileResult(data);
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCompileLoading(false);
    }
  };

  // ── Hit Endpoint ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!schemaName.trim()) return;

    setGenerateLoading(true);
    setGenerateError(null);
    setGenerateResult(null);
    setLatencyMs(null);

    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/generate/${schemaName.trim()}`, {
        method: "POST",
      });
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      const data: GenerateResult = await res.json();
      if (!data.ok) throw new Error(data.message ?? "Generation failed");
      setGenerateResult(data);
    } catch (err) {
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setGenerateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-deep-purple text-electric-blue p-6 md:p-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-lavender tracking-tight">
          AI Mock Engine
        </h1>
        <p className="mt-1 text-electric-blue/60 text-sm">
          Compile a schema once — generate instant mock data forever.
        </p>
      </header>

      {/* ── Two-column grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ─── LEFT PANEL: Create API ────────────────────────────────────────── */}
        <section className={`${glass} p-6 space-y-5`}>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="h-5 w-5 text-lavender" />
            <h2 className="font-display text-xl font-semibold text-lavender">
              Create API
            </h2>
          </div>

          {/* Schema name input */}
          <div className="space-y-1.5">
            <label className="text-xs text-electric-blue/50 uppercase tracking-widest">
              Schema Name
            </label>
            <input
              id="schema-name"
              type="text"
              placeholder="e.g. bank_customer"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              className={`w-full ${glowBorder} bg-white/5 rounded-xl px-4 py-2.5 text-sm text-electric-blue placeholder:text-white/20 outline-none focus:border-lavender/50 transition-colors`}
            />
          </div>

          {/* JSON schema textarea */}
          <div className="space-y-1.5">
            <label className="text-xs text-electric-blue/50 uppercase tracking-widest">
              Unstructured JSON Schema
            </label>
            <textarea
              id="schema-json"
              rows={10}
              placeholder={`{\n  "cardNumber": "",\n  "holderName": "",\n  "email": "",\n  "customerId": ""\n}`}
              value={schemaJson}
              onChange={(e) => setSchemaJson(e.target.value)}
              className={`w-full font-mono text-xs ${glowBorder} bg-white/5 rounded-xl px-4 py-3 text-electric-blue placeholder:text-white/20 outline-none focus:border-lavender/50 resize-none transition-colors`}
            />
          </div>

          {/* Compile button */}
          <Button
            id="compile-btn"
            onClick={handleCompile}
            disabled={compileLoading || !schemaName || !schemaJson}
            className="w-full bg-lavender/20 hover:bg-lavender/30 text-lavender border border-lavender/30 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(234,194,255,0.2)]"
          >
            {compileLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                LangGraph is mapping…
              </>
            ) : (
              "Compile & Map"
            )}
          </Button>

          {/* Result / error feedback */}
          {compileError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {compileError}
            </p>
          )}
          {compileResult?.ok && (
            <p className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
              ✓ Schema compiled and cached. Ready to generate.
            </p>
          )}
        </section>

        {/* ─── RIGHT PANEL: Simulate Hit ─────────────────────────────────────── */}
        <section className={`${glass} p-6 space-y-5`}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-electric-blue" />
            <h2 className="font-display text-xl font-semibold text-electric-blue">
              Simulate Hit
            </h2>
          </div>

          {/* Endpoint URL display */}
          <div className={`${glowBorder} bg-white/5 rounded-xl px-4 py-3`}>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Endpoint</p>
            <code className="text-xs text-lavender break-all font-mono">{endpointUrl}</code>
          </div>

          {/* Hit button */}
          <Button
            id="generate-btn"
            onClick={handleGenerate}
            disabled={generateLoading || !schemaName || !compileResult?.ok}
            className="w-full bg-electric-blue/20 hover:bg-electric-blue/30 text-electric-blue border border-electric-blue/30 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(224,242,254,0.15)]"
          >
            {generateLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Hit Endpoint"
            )}
          </Button>

          {/* Latency badge */}
          {latencyMs !== null && (
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Response in{" "}
                <span className="text-emerald-400 font-semibold">{latencyMs}ms</span>
              </span>
            </div>
          )}

          {/* Error */}
          {generateError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {generateError}
            </p>
          )}

          {/* Generated JSON output */}
          {generateResult?.record && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/30 uppercase tracking-widest">Output</p>
                {generateResult.recordId && (
                  <span className="text-[10px] text-lavender/50 font-mono">
                    id:{generateResult.recordId.slice(-8)}
                  </span>
                )}
              </div>
              <div
                className={`${glowBorder} bg-deep-purple/60 rounded-xl overflow-hidden max-h-96 overflow-y-auto`}
              >
                <pre className="text-xs text-electric-blue/80 font-mono p-4 leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(generateResult.record, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Placeholder when not yet compiled */}
          {!compileResult?.ok && !generateResult && !generateError && (
            <div
              className={`${glowBorder} bg-deep-purple/40 rounded-xl max-h-48 flex items-center justify-center`}
            >
              <p className="text-xs text-white/20 py-16 text-center px-4">
                Compile a schema on the left first, then hit the endpoint to see
                instant mock data here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
