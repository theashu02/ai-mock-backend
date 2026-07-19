import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Braces, Brackets, Type, Hash, ToggleLeft, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchemaVisualizerProps {
  jsonString: string;
}

type DataType = "object" | "array" | "string" | "number" | "boolean" | "null" | "unknown";

function getType(value: any): DataType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

function TypeIcon({ type, className }: { type: DataType; className?: string }) {
  const props = { className: cn("w-3.5 h-3.5", className) };
  switch (type) {
    case "object": return <Braces {...props} className={cn(props.className, "text-blue-400")} />;
    case "array": return <Brackets {...props} className={cn(props.className, "text-amber-400")} />;
    case "string": return <Type {...props} className={cn(props.className, "text-emerald-400")} />;
    case "number": return <Hash {...props} className={cn(props.className, "text-purple-400")} />;
    case "boolean": return <ToggleLeft {...props} className={cn(props.className, "text-rose-400")} />;
    default: return <CircleDashed {...props} className={cn(props.className, "text-zinc-400")} />;
  }
}

function TreeNode({ label, value, isLast }: { label: string; value: any; isLast?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const type = getType(value);
  const isComplex = type === "object" || type === "array";
  
  // To avoid massive DOM trees, if an array has many identical items, we could truncate, 
  // but for a pure visualizer we'll just render it or just the first item as a schema representation.
  // The user wants a "graph like structure how things are connected". 
  // For arrays, showing just the structure of the first item is usually best for schema analysis.
  
  const renderChildren = () => {
    if (type === "object") {
      const keys = Object.keys(value);
      return keys.map((key, index) => (
        <TreeNode key={key} label={key} value={value[key]} isLast={index === keys.length - 1} />
      ));
    }
    if (type === "array" && value.length > 0) {
      // Just show the schema of the first item to represent the array structure
      return <TreeNode label="[0]" value={value[0]} isLast={true} />;
    }
    return null;
  };

  return (
    <div className="flex flex-col text-sm font-mono">
      <div className="flex items-center gap-1.5 py-1 hover:bg-white/5 rounded px-1 -ml-1 transition-colors group">
        {isComplex ? (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-white/10 rounded text-muted-foreground flex-shrink-0"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="w-4.5 flex-shrink-0" /> // Spacer for alignment
        )}
        
        <TypeIcon type={type} />
        
        <span className="text-zinc-300 font-medium">{label}</span>
        <span className="text-muted-foreground text-xs ml-1">
          {type === "array" ? `Array[${value.length}]` : type}
        </span>
      </div>

      {isComplex && isExpanded && (
        <div className="flex">
          <div className="w-4.5 flex-shrink-0 flex justify-center">
            <div className="w-px h-full bg-border/50 group-hover:bg-border transition-colors" />
          </div>
          <div className="flex-1 pl-1 py-1">
            {renderChildren()}
            {type === "array" && value.length === 0 && (
              <span className="text-muted-foreground text-xs italic">empty</span>
            )}
            {type === "object" && Object.keys(value).length === 0 && (
              <span className="text-muted-foreground text-xs italic">empty</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SchemaVisualizer({ jsonString }: SchemaVisualizerProps) {
  const parsedData = useMemo(() => {
    if (!jsonString.trim()) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }, [jsonString]);

  if (!jsonString.trim()) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Paste JSON to see its structure
      </div>
    );
  }

  if (jsonString.trim() && !parsedData) {
    return (
      <div className="h-full flex items-center justify-center text-destructive text-sm">
        Invalid JSON format
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 custom-scrollbar">
      <TreeNode label="root" value={parsedData} />
    </div>
  );
}
