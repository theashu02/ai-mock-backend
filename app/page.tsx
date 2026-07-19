"use client";

import { api } from "@/lib/eden";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFetchcy } from "@/hook/useFetchcy";
import { Loader2 } from "lucide-react";

export default function Home() {
  const healthFetcher = useFetchcy();
  const mockFetcher = useFetchcy();

  const checkHealth = () => {
    healthFetcher.execute(() => api.api.health.get());
  };

  const generateMock = () => {
    mockFetcher.execute(() =>
      api.api.generate.post({
        prompt: "Hello AI!",
      })
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">AI Mock Backend</CardTitle>
          <CardDescription className="text-center">Test your Elysia API endpoints</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">API Health Status</h2>
            <div className="p-3 bg-muted rounded-md border text-sm text-muted-foreground font-mono">
              {healthFetcher.isLoading
                ? "Checking..."
                : healthFetcher.error
                ? `Error: ${JSON.stringify(healthFetcher.error)}`
                : healthFetcher.data
                ? `OK: ${JSON.stringify(healthFetcher.data)}`
                : "Not checked"}
            </div>
            <Button
              onClick={checkHealth}
              className="w-full"
              disabled={healthFetcher.isLoading}
            >
              {healthFetcher.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Check Health
            </Button>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Test Generation</h2>
            <Button
              onClick={generateMock}
              variant="secondary"
              className="w-full"
              disabled={mockFetcher.isLoading}
            >
              {mockFetcher.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Mock Data
            </Button>
            {(mockFetcher.data || mockFetcher.error) && (
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/50">
                <pre className="text-xs text-foreground font-mono">
                  {JSON.stringify(
                    mockFetcher.error || mockFetcher.data,
                    null,
                    2
                  )}
                </pre>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
