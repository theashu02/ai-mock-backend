"use client";

import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/eden";
import { toast } from "sonner";
import { JsonInput } from "./_components/json-input";
import { SchemaOutput } from "./_components/schema-output";
import { SchemaVisualizer } from "./_components/schema-visualizer";

export default function SchemaConverterPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [format, setFormat] = useState("TypeScript");
  const [generatedSchema, setGeneratedSchema] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "graph" | "output">("input");

  const handleGenerate = async () => {
    if (!jsonInput.trim()) {
      toast.error("Please enter some JSON first.");
      return;
    }

    try {
      JSON.parse(jsonInput);
    } catch (e) {
      toast.error("Invalid JSON format.");
      return;
    }

    setIsGenerating(true);
    setGeneratedSchema("");
    setActiveTab("output"); // Auto switch to output tab on mobile

    try {
      const { data, error } = await api.api.schema.convert.post({
        rawJson: jsonInput,
        format,
      });
      
      if (data && data.ok) {
        setGeneratedSchema(data.schema);
        toast.success("Schema generated successfully!");
      } else {
        toast.error((data as any)?.message || error?.value?.toString() || "Failed to generate schema.");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] overflow-hidden bg-background rounded-xl border border-border/50 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 px-6 py-4 bg-card/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Schema Converter</h1>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Privacy Preserving
            </div>
          </div>
          
          {/* Mobile Tabs */}
          <div className="flex lg:hidden bg-muted p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab("input")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === "input" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Input
            </button>
            <button 
              onClick={() => setActiveTab("graph")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === "graph" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Graph
            </button>
            <button 
              onClick={() => setActiveTab("output")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === "output" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Output
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Input Panel */}
        <div className={`w-full lg:w-1/3 lg:flex flex-col border-r border-border/50 overflow-hidden ${activeTab === "input" ? "flex" : "hidden"}`}>
          <JsonInput 
            jsonInput={jsonInput}
            setJsonInput={setJsonInput}
            format={format}
            setFormat={setFormat}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        </div>

        {/* Graph Panel */}
        <div className={`w-full lg:w-1/3 lg:flex flex-col border-r border-border/50 overflow-hidden bg-muted/10 ${activeTab === "graph" ? "flex" : "hidden"}`}>
          <div className="p-4 border-b border-border/50 flex-shrink-0">
            <h2 className="text-sm font-semibold">Structure Graph</h2>
            <p className="text-xs text-muted-foreground mt-1">Real-time JSON visualization</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <SchemaVisualizer jsonString={jsonInput} />
          </div>
        </div>

        {/* Output Panel */}
        <div className={`w-full lg:w-1/3 lg:flex flex-col overflow-hidden ${activeTab === "output" ? "flex" : "hidden"}`}>
          <SchemaOutput 
            generatedSchema={generatedSchema}
            format={format}
          />
        </div>
        
      </div>
    </div>
  );
}
