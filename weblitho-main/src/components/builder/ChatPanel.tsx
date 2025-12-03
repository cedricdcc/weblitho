import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface ChatPanelProps {
  prompts: Array<{ role: "user" | "assistant"; content: string }>;
  onSubmit: (prompt: string) => void;
  isGenerating?: boolean;
}

export const ChatPanel = ({ prompts, onSubmit, isGenerating = false }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [prompts]);

  const handleSubmit = () => {
    if (input.trim() && !isGenerating) {
      onSubmit(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    "Create a modern hero section with gradient",
    "Build a pricing table with 3 tiers",
    "Design a contact form with validation",
    "Generate a feature showcase grid",
  ];

  return (
    <div className="h-[360px] border-t border-border bg-card/50 backdrop-blur-xl flex flex-col">
      <div className="h-14 border-b border-border/50 flex items-center px-6 bg-gradient-accent">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
            <Sparkles className="relative h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">QubeAI Assistant</h3>
            <p className="text-xs text-muted-foreground">Describe your vision</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {prompts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md text-center space-y-6 animate-fade-in">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <Sparkles className="relative h-16 w-16 mx-auto text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Start Building with AI</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe your vision and watch QubeAI create beautiful pages instantly
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Start
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => onSubmit(prompt)}
                      className="text-xs h-auto py-2 px-3 hover:border-primary/50 hover:bg-gradient-accent transition-all"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-slide-up ${
                  prompt.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {prompt.role === "assistant" && (
                  <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-glow">
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-4 backdrop-blur ${
                    prompt.role === "user"
                      ? "bg-gradient-primary text-white shadow-glow"
                      : "bg-muted/50 border border-border"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{prompt.content}</p>
                </div>
                {prompt.role === "user" && (
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarFallback className="bg-secondary font-semibold text-xs">
                      U
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="min-h-[80px] resize-none bg-background/50 backdrop-blur border-border/50 focus:border-primary/50 transition-all"
            disabled={isGenerating}
          />
          <Button 
            onClick={handleSubmit} 
            size="icon" 
            className="shrink-0 h-20 w-20 rounded-2xl shadow-glow transition-bounce hover:scale-110"
            disabled={isGenerating || !input.trim()}
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
