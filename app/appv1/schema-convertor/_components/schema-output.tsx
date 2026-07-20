import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SchemaOutputProps {
  generatedSchema: string;
  format: string;
}

export function SchemaOutput({ generatedSchema, format }: SchemaOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!generatedSchema) return;
    navigator.clipboard.writeText(generatedSchema);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full h-full p-4 gap-4 bg-card/10">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Generated {format} Schema</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!generatedSchema}
          className="h-9 px-3 gap-2 border-border/50"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="flex-1 relative border border-border/50 bg-muted/30 overflow-hidden min-h-0">
        {generatedSchema ? (
          <textarea
            readOnly
            value={generatedSchema}
            className="w-full h-full p-4 font-mono text-sm text-foreground bg-transparent resize-none"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 p-6 text-center">
            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Click generate to see the AI-generated schema here</p>
          </div>
        )}
      </div>
    </div>
  );
}
