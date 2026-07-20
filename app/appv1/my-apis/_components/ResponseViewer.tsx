"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MockApi } from "./types";

interface ResponseViewerProps {
  selectedApi: MockApi | null;
  output: string;
  onPreview: () => void;
  className?: string;
}

export function ResponseViewer({
  selectedApi,
  output,
  onPreview,
  className,
}: ResponseViewerProps) {
  return (
    <aside className={className}>
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
              onClick={onPreview}
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
  );
}
