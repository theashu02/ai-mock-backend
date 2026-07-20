"use client";

import {
  Activity,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Play,
  Trash2,
} from "lucide-react";
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
import { HttpMethod, MockApi } from "./types";

interface EndpointCardProps {
  api: MockApi;
  isSelected: boolean;
  copiedUrl: string | null;
  isTesting: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onPreview: () => void;
  onTest: () => void;
  onDelete: () => void;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  PATCH: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25",
  DELETE: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

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

export function EndpointCard({
  api,
  isSelected,
  copiedUrl,
  isTesting,
  onSelect,
  onCopy,
  onPreview,
  onTest,
  onDelete,
}: EndpointCardProps) {
  const relativeTime = formatRelativeTime(api.lastHitAt);

  return (
    <Card
      size="sm"
      className={`rounded-md transition-all duration-200 cursor-pointer hover:shadow-md ${
        isSelected
          ? "ring-1 ring-primary/40 shadow-sm"
          : "hover:ring-1 hover:ring-border"
      }`}
      onClick={onSelect}
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
              onCopy();
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
              onPreview();
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
              onTest();
            }}
            disabled={isTesting}
          >
            <Play className="h-3 w-3" />
            {isTesting ? "Testing..." : "Test"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
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
              window.open(api.url, "_blank");
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
