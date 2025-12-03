import { useState, useEffect } from "react";
import { Sparkles, Code2, Palette, Layout, Zap, Check } from "lucide-react";

interface GenerationLoaderProps {
  status: string;
  isGenerating: boolean;
}

const steps = [
  { id: 1, label: "Analyzing request", icon: Sparkles, description: "Understanding your requirements..." },
  { id: 2, label: "Planning structure", icon: Layout, description: "Designing component architecture..." },
  { id: 3, label: "Writing components", icon: Code2, description: "Generating React components..." },
  { id: 4, label: "Styling design", icon: Palette, description: "Applying Tailwind styles..." },
  { id: 5, label: "Finalizing", icon: Zap, description: "Optimizing and polishing..." },
];

export const GenerationLoader = ({ status, isGenerating }: GenerationLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    if (status.includes("Analyzing")) {
      setCurrentStep(1);
    } else if (status.includes("Planning") || status.includes("structure")) {
      setCurrentStep(2);
      setCompletedSteps([1]);
    } else if (status.includes("Writing") || status.includes("component") || status.includes("Streaming")) {
      setCurrentStep(3);
      setCompletedSteps([1, 2]);
    } else if (status.includes("Styling") || status.includes("design")) {
      setCurrentStep(4);
      setCompletedSteps([1, 2, 3]);
    } else if (status.includes("Finalizing") || status.includes("complete")) {
      setCurrentStep(5);
      setCompletedSteps([1, 2, 3, 4]);
    }
  }, [status, isGenerating]);

  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 5) {
          setCompletedSteps(completed => 
            prev > 0 && !completed.includes(prev) ? [...completed, prev] : completed
          );
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 hero-mesh noise">
      {/* Main Animation */}
      <div className="relative mb-12">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse-glow">
          <div className="w-16 h-16 rounded-2xl gradient-animated flex items-center justify-center shadow-2xl glow-cyan">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground mb-2">Building Your Website</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Weblitho is crafting your React components with modern design patterns
      </p>

      {/* Steps */}
      <div className="w-full max-w-md space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : isCurrent
                  ? "glass border-primary/30 scale-[1.02]"
                  : "bg-white/5 border-border/50 opacity-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? "bg-emerald-500/20"
                    : isCurrent
                    ? "gradient-animated"
                    : "bg-white/10"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Icon className={`h-5 w-5 ${isCurrent ? "text-white animate-pulse" : "text-muted-foreground"}`} />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isCompleted ? "text-emerald-400" : isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className={`text-sm ${isCompleted ? "text-emerald-400/60" : isCurrent ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                  {step.description}
                </p>
              </div>
              {isCurrent && (
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mt-8">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full gradient-animated transition-all duration-500 ease-out"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-center text-muted-foreground text-sm mt-2">
          {Math.round((completedSteps.length / steps.length) * 100)}% complete
        </p>
      </div>
    </div>
  );
};
