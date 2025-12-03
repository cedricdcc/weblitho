import { useState } from "react";
import { Monitor, Smartphone, Tablet, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasPreviewProps {
  content: string;
}

type ViewportSize = "desktop" | "tablet" | "mobile";

const viewportSizes: Record<ViewportSize, { width: string; icon: any; label: string }> = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "375px", icon: Smartphone, label: "Mobile" },
};

export const CanvasPreview = ({ content }: CanvasPreviewProps) => {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");

  return (
    <main className="flex-1 flex flex-col bg-editor-bg overflow-hidden">
      <div className="h-14 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-center gap-2 px-4">
        <div className="flex items-center gap-1 bg-background/50 backdrop-blur rounded-lg p-1 border border-border/50">
          {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
            const { icon: Icon, label } = viewportSizes[size];
            return (
              <Button
                key={size}
                variant={viewport === size ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport(size)}
                className={`gap-2 transition-all ${
                  viewport === size ? "shadow-glow" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline text-xs">{label}</span>
              </Button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 ml-2"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden md:inline text-xs">Fullscreen</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
        <div
          className="bg-canvas-bg rounded-2xl shadow-2xl border border-border/50 transition-all duration-500 overflow-hidden"
          style={{
            width: viewportSizes[viewport].width,
            minHeight: "600px",
          }}
        >
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script src="https://cdn.tailwindcss.com"></script>
                  <style>
                    body { 
                      margin: 0; 
                      padding: 0;
                      font-family: system-ui, -apple-system, sans-serif;
                    }
                    * {
                      box-sizing: border-box;
                    }
                  </style>
                </head>
                <body>
                  ${content}
                </body>
              </html>
            `}
            className="w-full h-full border-0"
            style={{ minHeight: "600px" }}
            title="Preview"
          />
        </div>
      </div>
    </main>
  );
};
