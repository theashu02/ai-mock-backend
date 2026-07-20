"use client";

import { Globe } from "lucide-react";
import { EndpointCard } from "./EndpointCard";
import { MockApi } from "./types";

interface EndpointListProps {
  apis: MockApi[];
  selectedApi: MockApi | null;
  copiedUrl: string | null;
  isTesting: string | null;
  isLoading: boolean;
  onSelectApi: (id: string, preview: unknown) => void;
  onCopyUrl: (api: MockApi) => void;
  onPreviewApi: (api: MockApi) => void;
  onTestApi: (api: MockApi) => void;
  onDeleteApi: (api: MockApi) => void;
  className?: string;
}

export function EndpointList({
  apis,
  selectedApi,
  copiedUrl,
  isTesting,
  isLoading,
  onSelectApi,
  onCopyUrl,
  onPreviewApi,
  onTestApi,
  onDeleteApi,
  className,
}: EndpointListProps) {
  if (apis.length === 0) {
    return (
      <section className={className}>
        <div className="flex h-full min-h-105 flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-muted/10 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isLoading ? "Loading endpoints..." : "No mock endpoints yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-70">
              {isLoading
                ? "Fetching your published APIs..."
                : "Create your first endpoint by filling the form and clicking Publish."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="grid gap-3">
        {apis.map((api) => (
          <EndpointCard
            key={api.id}
            api={api}
            isSelected={selectedApi?.id === api.id}
            copiedUrl={copiedUrl}
            isTesting={isTesting === api.id}
            onSelect={() => onSelectApi(api.id, api.preview)}
            onCopy={() => onCopyUrl(api)}
            onPreview={() => onPreviewApi(api)}
            onTest={() => onTestApi(api)}
            onDelete={() => onDeleteApi(api)}
          />
        ))}
      </div>
    </section>
  );
}
