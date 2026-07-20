import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { maskSensitiveData } from "@/lib/utils/maskJson";

interface MaskedPayloadPreviewProps {
  jsonInput: string;
}

export function MaskedPayloadPreview({ jsonInput }: MaskedPayloadPreviewProps) {
  const getMaskedJsonPreview = () => {
    if (!jsonInput.trim()) return "No JSON to mask.";
    try {
      const parsed = JSON.parse(jsonInput);
      return JSON.stringify(maskSensitiveData(parsed), null, 2);
    } catch {
      return "Invalid JSON. Fix errors to see masked output.";
    }
  };

  return (
    <Sheet>
      <SheetTrigger render={
        <Button variant="outline" size="sm" className="hidden sm:flex h-7 text-xs px-2 gap-1.5 border-border/50">
          <Eye className="w-3.5 h-3.5" />
          View Masked Payload
        </Button>
      } />
      <SheetContent side="right" className="w-full sm:max-w-200 flex flex-col">
        <SheetHeader>
          <SheetTitle>Masked JSON Payload</SheetTitle>
        </SheetHeader>
        <div className="flex-1 mt-4 relative border border-border/50 bg-muted/30 overflow-auto min-h-0 rounded-md">
          <pre className="p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-foreground">
            {getMaskedJsonPreview()}
          </pre>
        </div>
      </SheetContent>
    </Sheet>
  );
}
