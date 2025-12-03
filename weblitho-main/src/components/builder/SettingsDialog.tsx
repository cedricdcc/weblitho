import { useState, useEffect } from "react";
import { Settings, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Model type mapping - internal API models
export type ModelType = 
  | "deepseek-free"                // DeepSeek Free
  | "google/gemini-2.0-flash"      // Weblitho 2.0
  | "google/gemini-2.0-pro"        // Weblitho 2.0 Premium
  | "google/gemini-2.5-pro"        // Weblitho 2.5 Ultra
  | "google/gemini-2.5-flash";     // Weblitho 2.5 Fast

// Model display configuration
const modelConfig: Record<ModelType, { name: string; description: string; badge?: string | null; badgeColor?: string }> = {
  "deepseek-free": {
    name: "Weblitho Free",
    description: "⚡ Free generation powered by DeepSeek",
    badge: "FREE",
    badgeColor: "bg-green-500/10 text-green-500"
  },
  "google/gemini-2.0-flash": {
    name: "Weblitho 2.0",
    description: "🚀 Balanced speed and quality",
    badge: null,
    badgeColor: ""
  },
  "google/gemini-2.0-pro": {
    name: "Weblitho 2.0 Premium",
    description: "💎 Higher quality for complex projects",
    badge: "PREMIUM",
    badgeColor: "bg-amber-500/10 text-amber-500"
  },
  "google/gemini-2.5-pro": {
    name: "Weblitho 2.5 Ultra",
    description: "🏆 Best quality for premium websites",
    badge: "ULTRA",
    badgeColor: "bg-purple-500/10 text-purple-500"
  },
  "google/gemini-2.5-flash": {
    name: "Weblitho 2.5 Fast",
    description: "⚡ Latest model with fast generation",
    badge: "NEW",
    badgeColor: "bg-blue-500/10 text-blue-500"
  }
};

interface SettingsDialogProps {
  onSettingsChange: (model: ModelType) => void;
}

export const SettingsDialog = ({ onSettingsChange }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState<ModelType>("deepseek-free");
  const { toast } = useToast();

  useEffect(() => {
    const savedModel = localStorage.getItem("ai_model") as ModelType;
    if (savedModel && modelConfig[savedModel]) {
      setModel(savedModel);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("ai_model", model);
    onSettingsChange(model);

    const config = modelConfig[model];
    
    toast({
      title: "Model Updated",
      description: `Now using ${config.name}`,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden md:inline">Model</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Weblitho AI Model
          </DialogTitle>
          <DialogDescription>
            Select the AI model for website generation. All models include automatic code validation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Validator Info */}
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-500">Weblitho Validator Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All generated code is automatically validated and fixed before delivery
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-gradient-accent p-4">
              <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Generation Model
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Choose the AI model that powers your website generation
              </p>
              <Select 
                value={model}
                onValueChange={(value) => setModel(value as ModelType)}
              >
                <SelectTrigger className="bg-background/50 backdrop-blur">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(modelConfig) as [ModelType, typeof modelConfig[ModelType]][]).map(([modelId, config]) => (
                    <SelectItem key={modelId} value={modelId}>
                      <div className="flex flex-col items-start gap-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{config.name}</span>
                          {config.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.badgeColor}`}>
                              {config.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {config.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="shadow-glow">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Export model config for use in other components
export { modelConfig };
