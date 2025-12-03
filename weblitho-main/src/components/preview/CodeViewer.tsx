import { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface CodeViewerProps {
  fileName: string;
  content: string;
  language?: string;
}

export const CodeViewer = ({ fileName, content, language = "typescript" }: CodeViewerProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColor = () => {
    switch (language) {
      case "typescript":
      case "tsx":
        return "text-cyan-400";
      case "javascript":
      case "jsx":
        return "text-amber-400";
      case "css":
        return "text-pink-400";
      case "html":
        return "text-orange-400";
      case "json":
        return "text-emerald-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <FileCode className={`h-4 w-4 ${getLanguageColor()}`} />
          <span className="text-sm font-medium text-foreground">{fileName}</span>
          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-white/5">
            {language}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Code Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <pre className="text-sm font-mono leading-relaxed">
            <code className="text-foreground/90">{content}</code>
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
};
