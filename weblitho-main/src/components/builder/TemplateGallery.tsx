import { useState } from 'react';
import { Sparkles, Layout, ShoppingBag, Briefcase, PenTool, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  prompt: string;
  gradient: string;
}

const templates: Template[] = [
  {
    id: 'saas-landing',
    name: 'SaaS Landing Page',
    description: 'Modern landing page for software products with hero, features, pricing, and CTA sections',
    category: 'Business',
    icon: <Rocket className="h-5 w-5" />,
    gradient: 'from-violet-500 to-purple-600',
    prompt: 'Create a modern SaaS landing page with: 1) A stunning hero section with gradient background, headline, subheadline, and two CTA buttons 2) Trusted by logos section 3) Features grid with 6 key features and icons 4) How it works section with 3 steps 5) Pricing section with 3 tiers (Free, Pro, Enterprise) 6) Testimonials carousel 7) FAQ section 8) Final CTA section 9) Professional footer. Use a modern tech color scheme with purple/blue gradients. Make it fully responsive and premium looking.',
  },
  {
    id: 'portfolio',
    name: 'Creative Portfolio',
    description: 'Stunning portfolio for designers, developers, and creatives',
    category: 'Personal',
    icon: <PenTool className="h-5 w-5" />,
    gradient: 'from-pink-500 to-rose-600',
    prompt: 'Create a creative portfolio website with: 1) Striking hero with animated text, name, title, and photo placeholder 2) About me section with bio and skills 3) Projects showcase grid with hover effects (6 project cards) 4) Services section with what I offer 5) Experience timeline 6) Testimonials from clients 7) Contact section with form 8) Social links footer. Use a bold, creative color scheme with pink/orange accents. Add subtle animations and make it visually stunning.',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Beautiful online store with product showcase and shopping features',
    category: 'E-Commerce',
    icon: <ShoppingBag className="h-5 w-5" />,
    gradient: 'from-emerald-500 to-teal-600',
    prompt: 'Create a modern e-commerce store homepage with: 1) Navigation with logo, search bar, cart icon 2) Hero banner with featured product/sale 3) Category cards (4 categories) 4) Featured products grid (8 products with image, name, price, rating) 5) Special offer banner 6) New arrivals section 7) Brand logos 8) Newsletter signup 9) Footer with links, payment icons, social media. Use an elegant color scheme. Make products look appealing with hover effects.',
  },
  {
    id: 'agency',
    name: 'Digital Agency',
    description: 'Professional agency website with services and case studies',
    category: 'Business',
    icon: <Briefcase className="h-5 w-5" />,
    gradient: 'from-blue-500 to-cyan-600',
    prompt: 'Create a digital agency website with: 1) Bold hero with agency tagline, description, and contact CTA 2) Services section (Web Design, Development, Marketing, Branding) 3) Stats/numbers section (projects completed, clients, awards) 4) Case studies grid with featured work 5) Team section with 4 team members 6) Client logos 7) Process/approach section 8) Contact section with form 9) Professional footer. Use a clean, corporate blue color scheme. Make it trustworthy and professional.',
  },
  {
    id: 'blog',
    name: 'Modern Blog',
    description: 'Clean blog layout with featured posts and categories',
    category: 'Content',
    icon: <Layout className="h-5 w-5" />,
    gradient: 'from-amber-500 to-orange-600',
    prompt: 'Create a modern blog homepage with: 1) Header with logo, navigation, and search 2) Featured post hero with large image 3) Recent posts grid (6 posts with image, title, excerpt, date, category tag) 4) Categories sidebar 5) Newsletter subscription box 6) Popular posts sidebar 7) Author spotlight section 8) Footer with links. Use a warm, readable color scheme. Focus on typography and readability. Add hover effects on post cards.',
  },
  {
    id: 'startup',
    name: 'Startup Launch',
    description: 'Coming soon / launch page for new products or startups',
    category: 'Business',
    icon: <Sparkles className="h-5 w-5" />,
    gradient: 'from-indigo-500 to-violet-600',
    prompt: 'Create a startup launch/coming soon page with: 1) Dramatic hero with product name, tagline, and animated background 2) Email signup form for early access 3) Key features preview (4 features) 4) Countdown timer component 5) Social proof (waitlist count, press mentions) 6) Founders section 7) FAQ section 8) Social media links. Use a bold, energetic color scheme with indigo/violet. Make it feel exclusive and exciting. Add animations.',
  },
];

interface TemplateGalleryProps {
  onSelectTemplate: (prompt: string) => void;
}

export const TemplateGallery = ({ onSelectTemplate }: TemplateGalleryProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  const filteredTemplates = selectedCategory 
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const handleSelect = (template: Template) => {
    onSelectTemplate(template.prompt);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-white/5 border-border/50 hover:bg-white/10 hover:border-primary/50"
        >
          <Layout className="h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Template Gallery
          </DialogTitle>
        </DialogHeader>
        
        {/* Category Filter */}
        <div className="px-6 py-3 border-b border-border/50 flex items-center gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-8"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="h-8"
            >
              {category}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={cn(
                  "group relative p-5 rounded-xl border border-border/50 text-left transition-all",
                  "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
                  "bg-card/50 hover:bg-card/80"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br text-white shrink-0",
                    template.gradient
                  )}>
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {template.category}
                    </span>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute inset-0 rounded-xl border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
