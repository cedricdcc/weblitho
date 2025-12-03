import { useState } from "react";
import { Monitor, Smartphone, Tablet, Code2, Eye, Copy, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GenerationLoader } from "./GenerationLoader";
import { Badge } from "@/components/ui/badge";

interface ValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  security: string[];
}

interface PreviewPanelProps {
  code: string;
  type?: "web";
  metadata?: any;
  isGenerating?: boolean;
  generationStatus?: string;
  validation?: ValidationResult | null;
}

type ViewportSize = "mobile" | "tablet" | "desktop";

const viewportDimensions = {
  mobile: { width: "375px", height: "667px" },
  tablet: { width: "768px", height: "1024px" },
  desktop: { width: "100%", height: "100%" },
};

export const PreviewPanel = ({ code, isGenerating = false, generationStatus = "", validation }: PreviewPanelProps) => {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const { toast } = useToast();

  // Clean code - extract HTML content, strip any reasoning/thinking tokens
  const cleanCode = (() => {
    if (!code) return "";
    const htmlStart = code.indexOf("<!DOCTYPE html>");
    const htmlAltStart = code.indexOf("<html");
    const startIndex = htmlStart !== -1 ? htmlStart : htmlAltStart;
    if (startIndex === -1) return code;
    return code.slice(startIndex);
  })();

  const isCodeComplete = cleanCode && cleanCode.includes("</html>");

  if (isGenerating && !isCodeComplete) {
    return <GenerationLoader status={generationStatus} isGenerating={isGenerating} />;
  }

  if (!isGenerating && !cleanCode) {
    return (
      <div className="h-full flex items-center justify-center bg-card/30">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <Eye className="h-8 w-8 text-primary/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">Preview Area</p>
            <p className="text-xs text-muted-foreground">Your creation will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded" });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", label: "Excellent" };
    if (score >= 80) return { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", label: "Great" };
    if (score >= 70) return { color: "bg-amber-500/10 text-amber-400 border-amber-500/30", label: "Good" };
    return { color: "bg-red-500/10 text-red-400 border-red-500/30", label: "Needs Work" };
  };

  return (
    <div className="h-full flex flex-col bg-card/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-cyan-500 to-blue-500">
            <Eye className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
            <p className="text-xs text-muted-foreground">React + Tailwind CSS</p>
          </div>
          
          {/* Validation Badge */}
          {validation && (
            <Badge className={`ml-2 ${getScoreBadge(validation.score).color} border`}>
              {validation.score >= 80 ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {validation.score}/100
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Copy</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Download</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/30 shrink-0">
          <TabsList className="bg-white/5 h-9 p-1">
            <TabsTrigger value="preview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-white/10 text-xs px-3">
              <Code2 className="h-3.5 w-3.5 mr-1.5" />
              Code
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {(["mobile", "tablet", "desktop"] as ViewportSize[]).map((size) => {
              const icons = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };
              const Icon = icons[size];
              return (
                <Button
                  key={size}
                  variant={viewport === size ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewport(size)}
                  className={`h-7 w-7 p-0 ${viewport === size ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              );
            })}
          </div>
        </div>

        <TabsContent value="preview" className="flex-1 m-0 overflow-auto p-4 bg-[#0a0a0a]">
          <div className="flex items-start justify-center min-h-full">
            <div
              className="bg-white rounded-xl shadow-2xl transition-all duration-500 overflow-hidden border border-white/10"
              style={{
                width: viewportDimensions[viewport].width,
                height: viewport === "desktop" ? "calc(100vh - 220px)" : viewportDimensions[viewport].height,
                maxWidth: "100%",
              }}
            >
              <iframe
                srcDoc={cleanCode}
                title="Preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 overflow-auto p-4">
          <pre className="glass rounded-xl p-4 overflow-x-auto text-xs text-foreground/80 h-full scrollbar-thin">
            <code>{cleanCode}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};
