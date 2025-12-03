import { useState } from "react";
import { Search, Plus, ExternalLink, Sparkles, Layout, Box, Type, BarChart3, FormInput, Navigation, Footprints, CreditCard, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Component {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  tags: string[];
  isNew?: boolean;
}

const componentLibrary: Component[] = [
  // Hero Components
  {
    id: "hero-gradient",
    name: "Hero with Gradient",
    description: "A stunning hero section with animated gradient background",
    category: "hero",
    prompt: "Add a hero section with a large headline, gradient background from purple to blue, animated floating elements, and two CTA buttons",
    tags: ["hero", "gradient", "animated"],
    isNew: true,
  },
  {
    id: "hero-split",
    name: "Split Hero",
    description: "Hero with image on one side and content on the other",
    category: "hero",
    prompt: "Add a split hero section with headline and description on the left, and a product mockup or image placeholder on the right",
    tags: ["hero", "split", "image"],
  },
  {
    id: "hero-video",
    name: "Video Hero",
    description: "Hero section with background video placeholder",
    category: "hero",
    prompt: "Add a hero section with a dark overlay, centered content, and a video background placeholder",
    tags: ["hero", "video", "dark"],
  },
  // Navigation
  {
    id: "navbar-glass",
    name: "Glass Navbar",
    description: "Sticky navbar with glassmorphism effect",
    category: "navigation",
    prompt: "Add a sticky navigation bar with glass effect, logo on left, nav links centered, and a CTA button on right",
    tags: ["navbar", "glass", "sticky"],
    isNew: true,
  },
  {
    id: "navbar-sidebar",
    name: "Sidebar Navigation",
    description: "Collapsible sidebar navigation for dashboards",
    category: "navigation",
    prompt: "Add a collapsible sidebar navigation with icons, expandable menu items, and user profile at bottom",
    tags: ["sidebar", "dashboard", "collapsible"],
  },
  // Features
  {
    id: "features-grid",
    name: "Features Grid",
    description: "3-column grid of feature cards with icons",
    category: "features",
    prompt: "Add a features section with 6 feature cards in a 3-column grid, each with an icon, title, and description",
    tags: ["features", "grid", "cards"],
  },
  {
    id: "features-bento",
    name: "Bento Grid",
    description: "Modern bento-style feature layout",
    category: "features",
    prompt: "Add a bento grid layout with varying card sizes, featuring key product highlights with icons and descriptions",
    tags: ["bento", "grid", "modern"],
    isNew: true,
  },
  // Pricing
  {
    id: "pricing-cards",
    name: "Pricing Cards",
    description: "3-tier pricing comparison cards",
    category: "pricing",
    prompt: "Add a pricing section with 3 pricing tiers (Basic, Pro, Enterprise), each showing price, features list, and a CTA button",
    tags: ["pricing", "cards", "comparison"],
  },
  {
    id: "pricing-toggle",
    name: "Pricing with Toggle",
    description: "Pricing cards with monthly/yearly toggle",
    category: "pricing",
    prompt: "Add pricing cards with a monthly/yearly toggle switch showing discounted annual pricing",
    tags: ["pricing", "toggle", "discount"],
  },
  // Testimonials
  {
    id: "testimonials-carousel",
    name: "Testimonials Carousel",
    description: "Sliding testimonial cards with avatars",
    category: "testimonials",
    prompt: "Add a testimonials section with a carousel of customer reviews, showing avatar, name, role, and quote",
    tags: ["testimonials", "carousel", "reviews"],
  },
  {
    id: "testimonials-grid",
    name: "Testimonials Grid",
    description: "Grid layout of testimonial cards",
    category: "testimonials",
    prompt: "Add a testimonials grid with 4 customer reviews, each with avatar, star rating, name, and testimonial text",
    tags: ["testimonials", "grid", "ratings"],
  },
  // CTA
  {
    id: "cta-gradient",
    name: "Gradient CTA",
    description: "Call-to-action with gradient background",
    category: "cta",
    prompt: "Add a CTA section with gradient background, compelling headline, subtext, and a prominent action button",
    tags: ["cta", "gradient", "conversion"],
  },
  {
    id: "cta-newsletter",
    name: "Newsletter CTA",
    description: "Email signup form with CTA",
    category: "cta",
    prompt: "Add a newsletter signup section with email input field and subscribe button",
    tags: ["newsletter", "email", "signup"],
  },
  // Footer
  {
    id: "footer-links",
    name: "Multi-column Footer",
    description: "Footer with multiple link columns",
    category: "footer",
    prompt: "Add a footer with 4 columns of links (Product, Company, Resources, Legal), social icons, and copyright",
    tags: ["footer", "links", "columns"],
  },
  {
    id: "footer-minimal",
    name: "Minimal Footer",
    description: "Simple footer with essential links",
    category: "footer",
    prompt: "Add a minimal footer with logo, few essential links inline, and copyright",
    tags: ["footer", "minimal", "simple"],
  },
  // Forms
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Full contact form with validation",
    category: "forms",
    prompt: "Add a contact form with name, email, subject, and message fields with a submit button",
    tags: ["form", "contact", "input"],
  },
  {
    id: "login-form",
    name: "Login Form",
    description: "Authentication form with social logins",
    category: "forms",
    prompt: "Add a login form with email, password fields, forgot password link, and social login buttons",
    tags: ["form", "login", "auth"],
  },
  // Stats
  {
    id: "stats-counter",
    name: "Stats Counter",
    description: "Animated number statistics",
    category: "stats",
    prompt: "Add a stats section showing 4 key metrics with large numbers and labels",
    tags: ["stats", "numbers", "metrics"],
  },
  // FAQ
  {
    id: "faq-accordion",
    name: "FAQ Accordion",
    description: "Expandable FAQ section",
    category: "faq",
    prompt: "Add an FAQ section with 5 expandable accordion items",
    tags: ["faq", "accordion", "expandable"],
  },
];

const categories = [
  { id: "all", name: "All", icon: Layout },
  { id: "hero", name: "Hero", icon: Sparkles },
  { id: "navigation", name: "Nav", icon: Navigation },
  { id: "features", name: "Features", icon: Box },
  { id: "pricing", name: "Pricing", icon: CreditCard },
  { id: "testimonials", name: "Reviews", icon: MessageSquare },
  { id: "cta", name: "CTA", icon: Type },
  { id: "footer", name: "Footer", icon: Footprints },
  { id: "forms", name: "Forms", icon: FormInput },
  { id: "stats", name: "Stats", icon: BarChart3 },
];

interface ComponentLibraryProps {
  onAddComponent: (prompt: string) => void;
}

export const ComponentLibrary = ({ onAddComponent }: ComponentLibraryProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isOpen, setIsOpen] = useState(false);

  const filteredComponents = componentLibrary.filter((component) => {
    const matchesSearch = 
      component.name.toLowerCase().includes(search.toLowerCase()) ||
      component.description.toLowerCase().includes(search.toLowerCase()) ||
      component.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || component.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddComponent = (component: Component) => {
    onAddComponent(component.prompt);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 h-8">
          <Plus className="h-4 w-4 mr-2" />
          Components
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[400px] sm:w-[480px] bg-[#0d0d0d] border-white/10 p-0">
        <SheetHeader className="p-4 border-b border-white/10">
          <SheetTitle className="text-white flex items-center gap-2">
            <Box className="h-5 w-5 text-orange-500" />
            Component Library
          </SheetTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search components..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </SheetHeader>

        <Tabs defaultValue="all" className="flex flex-col h-[calc(100vh-140px)]">
          <div className="px-4 py-2 border-b border-white/10">
            <ScrollArea className="w-full">
              <TabsList className="bg-transparent h-auto p-0 gap-1 flex-wrap justify-start">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-white/60 text-xs px-3 py-1.5 rounded-full"
                  >
                    <cat.icon className="h-3 w-3 mr-1.5" />
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          <ScrollArea className="flex-1 px-4 py-3">
            <div className="grid gap-3">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => handleAddComponent(component)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors">
                          {component.name}
                        </h4>
                        {component.isNew && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] px-1.5 py-0">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-1">{component.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {component.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredComponents.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No components found</p>
                </div>
              )}
            </div>

            {/* 21st.dev Link */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Browse More</h4>
                  <p className="text-xs text-white/50 mt-0.5">Explore 21st.dev community components</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                  onClick={() => window.open("https://21st.dev/community/components", "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
