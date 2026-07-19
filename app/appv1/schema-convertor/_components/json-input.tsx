import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";

interface JsonInputProps {
  jsonInput: string;
  setJsonInput: (value: string) => void;
  format: string;
  setFormat: (value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function JsonInput({
  jsonInput,
  setJsonInput,
  format,
  setFormat,
  isGenerating,
  onGenerate,
}: JsonInputProps) {
  return (
    <div className="flex flex-col w-full h-full p-4 gap-4 bg-background">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Input JSON</h2>
        <div className="flex items-center gap-3">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[140px] lg:w-[160px] h-9">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TypeScript">TypeScript</SelectItem>
              <SelectItem value="Zod">Zod</SelectItem>
              <SelectItem value="Mongoose">Mongoose</SelectItem>
              <SelectItem value="Prisma">Prisma</SelectItem>
              <SelectItem value="GraphQL">GraphQL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder="Paste your JSON response here..."
        className="flex-1 font-mono text-sm resize-none p-4 rounded-xl border-border/50 bg-card/30 focus-visible:ring-primary/20 min-h-0"
      />

      <div className="flex justify-end pt-2">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !jsonInput.trim()}
          className="gap-2 px-6"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Schema
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
