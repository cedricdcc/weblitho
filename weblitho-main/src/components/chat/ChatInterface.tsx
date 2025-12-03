import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Paperclip, X, FileText, RefreshCw, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelType, modelConfig } from "@/components/builder/SettingsDialog";

interface ChatInterfaceProps {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  onSubmit: (message: string, files?: File[]) => void;
  isGenerating?: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

export const ChatInterface = ({ 
  messages, 
  onSubmit, 
  isGenerating = false,
  selectedModel,
  onModelChange 
}: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if ((input.trim() || files.length > 0) && !isGenerating) {
      onSubmit(input, files);
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

  const quickActions = [
    { icon: RefreshCw, label: "Improve design", prompt: "Enhance the design with better spacing, colors, and visual hierarchy" },
    { icon: Wand2, label: "Add animations", prompt: "Add smooth micro-interactions and animations throughout" },
    { icon: Zap, label: "More sections", prompt: "Add more content sections like testimonials or FAQ" },
  ];

  const currentModel = modelConfig[selectedModel];

  return (
    <div className="h-full flex flex-col bg-card/30">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl gradient-animated flex items-center justify-center shadow-lg glow-cyan">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Weblitho AI</h3>
              <p className="text-xs text-muted-foreground">{currentModel?.name || "AI Assistant"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Start a conversation to build something amazing
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-lg gradient-animated flex items-center justify-center shadow-lg">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass border-white/10 text-white rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/70 text-xs font-semibold border border-white/10">
                  U
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg gradient-animated flex items-center justify-center shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="glass border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-white/70">Generating...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length > 0 && !isGenerating && (
          <div className="pb-4 animate-fade-in">
            <p className="text-xs text-muted-foreground mb-2">Quick actions</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => onSubmit(action.prompt)}
                  className="h-8 px-3 text-xs glass border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <action.icon className="h-3 w-3 mr-1.5" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-border/50 bg-card/50 backdrop-blur-xl">
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80"
              >
                <FileText className="h-3 w-3 text-primary" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button onClick={() => removeFile(index)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] resize-none bg-white/5 border-white/10 focus:border-primary/50 text-sm text-white placeholder:text-white/30 rounded-xl"
            disabled={isGenerating}
          />
          
          <Button 
            onClick={handleSubmit} 
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl gradient-animated text-white shadow-lg glow-cyan"
            disabled={isGenerating || (!input.trim() && files.length === 0)}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
