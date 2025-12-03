import { useState, useRef } from "react";
import { Send, Paperclip, Sparkles, FileText, X, Wand2, Code, Palette, Zap, Layout, FileCode, Globe, Box, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ModelType, modelConfig } from "@/components/builder/SettingsDialog";
import { TemplateGallery } from "@/components/builder/TemplateGallery";
import { ImageUploadPanel } from "@/components/builder/ImageUploadPanel";
import { useToast } from "@/hooks/use-toast";

interface ChatHeroProps {
  onSubmit: (message: string, files?: File[], model?: ModelType) => void;
  isGenerating?: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

export const ChatHero = ({ 
  onSubmit, 
  isGenerating = false,
  selectedModel,
  onModelChange 
}: ChatHeroProps) => {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    if ((input.trim() || files.length > 0) && !isGenerating) {
      onSubmit(input, files, selectedModel);
      setInput("");
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files allowed",
        variant: "destructive",
      });
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const templates = [
    { icon: Globe, title: "Landing Page", desc: "Modern SaaS site", prompt: "Create a modern SaaS landing page with hero, features grid, pricing, and footer. Use glassmorphism and smooth animations.", gradient: "from-cyan-500 to-blue-500" },
    { icon: Layout, title: "Dashboard", desc: "Analytics UI", prompt: "Build an admin dashboard with sidebar, stats cards, charts, and data tables. Modern dark theme.", gradient: "from-emerald-500 to-teal-500" },
    { icon: Box, title: "Portfolio", desc: "Creative showcase", prompt: "Design a creative portfolio with project gallery, about section, and contact form. Minimalist style.", gradient: "from-violet-500 to-purple-500" },
    { icon: Database, title: "E-commerce", desc: "Product page", prompt: "Create an e-commerce product page with image gallery, cart, reviews, and related products.", gradient: "from-amber-500 to-orange-500" },
  ];

  const useTemplate = (template: typeof templates[0]) => {
    setInput(template.prompt);
    toast({ title: "Template loaded", description: `${template.title} ready to customize` });
  };

  const handleTemplateSelect = (prompt: string) => {
    setInput(prompt);
    toast({ title: "Template loaded", description: "Ready to customize" });
  };

  const handleInsertImage = (url: string) => {
    setInput(prev => prev + (prev ? '\n\n' : '') + `Use this image: ${url}`);
  };

  const currentModel = modelConfig[selectedModel] || modelConfig["deepseek-free"];

  return (
    <div className="relative min-h-screen hero-mesh noise overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] animate-float delay-300" />
      </div>
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Badge */}
          <div className="flex justify-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-white/80">AI Website Builder</span>
              <span className="text-xs text-primary">v2.0</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-5 animate-slide-up delay-100">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
              Build with{" "}
              <span className="gradient-text">Weblitho</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Create stunning websites in seconds using AI. 
              Just describe what you want.
            </p>
          </div>

          {/* Quick Templates + Buttons Row */}
          <div className="flex flex-col md:flex-row items-center gap-4 animate-slide-up delay-200">
            {/* Quick template cards */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              {templates.map((t, i) => (
                <Card
                  key={i}
                  onClick={() => useTemplate(t)}
                  className="group p-3 glass hover:bg-white/10 border-white/10 hover:border-white/20 cursor-pointer transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
                    <t.icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-medium text-white text-sm">{t.title}</h3>
                  <p className="text-xs text-white/50">{t.desc}</p>
                </Card>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-row md:flex-col gap-2">
              <TemplateGallery onSelectTemplate={handleTemplateSelect} />
              <ImageUploadPanel onInsertImage={handleInsertImage} />
            </div>
          </div>

          {/* Main Input */}
          <div className="animate-scale-in delay-300">
            <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl">
              {/* Model Bar */}
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <span className="text-sm text-white/50">Model:</span>
                  <Select value={selectedModel} onValueChange={(v) => onModelChange(v as ModelType)}>
                    <SelectTrigger className="h-8 w-[200px] bg-white/5 border-white/10 text-sm text-white">
                      <SelectValue>{currentModel.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(modelConfig) as [ModelType, typeof modelConfig[ModelType]][]).map(([id, cfg]) => (
                        <SelectItem key={id} value={id}>
                          <div className="flex items-center gap-2">
                            <span>{cfg.name}</span>
                            {cfg.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.badgeColor}`}>
                                {cfg.badge}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Validator Active
                </div>
              </div>

              {/* Files */}
              {files.length > 0 && (
                <div className="px-5 py-3 border-b border-white/10 flex flex-wrap gap-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <div className="p-5">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your website in detail... Be specific about design, colors, sections, and features."
                  className="min-h-[140px] resize-none bg-transparent border-none text-white text-base placeholder:text-white/30 focus-visible:ring-0"
                  disabled={isGenerating}
                />
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex items-center justify-between">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="text-white/50 hover:text-white hover:bg-white/10"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach
                  </Button>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isGenerating || (!input.trim() && files.length === 0)}
                  className="gradient-animated text-white font-semibold px-6 rounded-xl shadow-lg glow-cyan group"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Generate
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="text-center animate-fade-in delay-500">
            <p className="text-sm text-white/40">
              💡 Be specific about colors, layout, animations, and features for best results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
