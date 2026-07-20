"use client";

import React, { useMemo, useState } from "react";
import { api } from "@/lib/eden";
import { toast } from "sonner";
import { JsonInput } from "./_components/json-input";
import { SchemaOutput } from "./_components/schema-output";
import { SchemaVisualizer } from "./_components/schema-visualizer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaskedPayloadPreview } from "./_components/masked-payload-preview";

export default function SchemaConverterPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [format, setFormat] = useState("TypeScript");
  const [generatedSchema, setGeneratedSchema] = useState("");
  const [schemaMeta, setSchemaMeta] = useState<{
    inputBytes: number;
    lineCount: number;
    leafFields: number;
    maxDepth: number;
    totalArrayItems: number;
    sampledArrayItems: number;
    truncatedArrays: number;
    generatedBy: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "graph" | "output">(
    "input",
  );
  const inputStats = useMemo(() => {
    const trimmed = jsonInput.trim();
    return {
      bytes: new Blob([jsonInput]).size,
      lines: trimmed ? jsonInput.split(/\r\n|\r|\n/).length : 0,
    };
  }, [jsonInput]);

  const handleGenerate = async () => {
    if (!jsonInput.trim()) {
      toast.error("Please enter some JSON first.");
      return;
    }

    try {
      JSON.parse(jsonInput);
    } catch {
      toast.error("Invalid JSON format.");
      return;
    }

    setIsGenerating(true);
    setGeneratedSchema("");
    setSchemaMeta(null);
    setActiveTab("output"); // Auto switch to output tab on mobile

    try {
      const { data, error } = await api.api.schema.convert.post({
        rawJson: jsonInput,
        format,
      });

      if (data && !(data instanceof Response) && data.ok) {
        setGeneratedSchema(data.schema ?? "");
        setSchemaMeta(data.meta ?? null);
        toast.success("Schema generated successfully!");
      } else {
        toast.error(
          (data && !(data instanceof Response) && "message" in data
            ? String(data.message)
            : "") ||
            error?.value?.toString() ||
            "Failed to generate schema.",
        );
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 px-6 py-4 bg-card/30 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            Schema Converter
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium border border-primary/20 rounded-md">
            Privacy Preserving
          </div>
          <MaskedPayloadPreview jsonInput={jsonInput} />
        </div>

        {/* Mobile Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={(val) => {
            if (val === "input" || val === "graph" || val === "output") {
              setActiveTab(val);
            }
          }} 
          className="w-full md:w-auto lg:hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Pane */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Input Panel */}
        <div
          className={`w-full lg:w-1/3 lg:flex flex-col border-r border-border/50 overflow-hidden ${activeTab === "input" ? "flex" : "hidden"}`}
        >
          <JsonInput
            jsonInput={jsonInput}
            setJsonInput={setJsonInput}
            format={format}
            setFormat={setFormat}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            inputStats={inputStats}
          />
        </div>

        {/* Graph Panel */}
        <div
          className={`w-full lg:w-1/3 lg:flex flex-col border-r border-border/50 overflow-hidden bg-muted/10 ${activeTab === "graph" ? "flex" : "hidden"}`}
        >
          <div className="p-4 border-b border-border/50 shrink-0">
            <h2 className="text-sm font-semibold">Structure Graph</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time JSON visualization
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <SchemaVisualizer jsonString={jsonInput} />
          </div>
        </div>

        {/* Output Panel */}
        <div
          className={`w-full lg:w-1/3 lg:flex flex-col overflow-hidden ${activeTab === "output" ? "flex" : "hidden"}`}
        >
          <SchemaOutput
            generatedSchema={generatedSchema}
            format={format}
            meta={schemaMeta}
          />
        </div>
      </div>
    </div>
  );
}
