import { useState } from "react";
import { Plus, FileText, Trash2, Package, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Page } from "@/pages/Index";

interface ProjectSidebarProps {
  pages: Page[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
  onAddPage: (name: string, path: string) => void;
  onDeletePage: (pageId: string) => void;
  onOpenLibrary: () => void;
}

export const ProjectSidebar = ({
  pages,
  currentPageId,
  onPageSelect,
  onAddPage,
  onDeletePage,
  onOpenLibrary,
}: ProjectSidebarProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPagePath, setNewPagePath] = useState("");

  const handleAddPage = () => {
    if (newPageName && newPagePath) {
      onAddPage(newPageName, newPagePath);
      setNewPageName("");
      setNewPagePath("");
      setIsAddDialogOpen(false);
    }
  };

  return (
    <aside className="w-[280px] border-r border-border bg-card/30 backdrop-blur-xl flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Folder className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Project</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2 hover:border-primary/50 hover:bg-gradient-accent transition-all">
              <Plus className="h-4 w-4" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Add a new page to your project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Name</label>
                <Input
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="About Us"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Path</label>
                <Input
                  value={newPagePath}
                  onChange={(e) => setNewPagePath(e.target.value)}
                  placeholder="/about"
                  className="bg-background/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPage} className="shadow-glow">
                Create Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 border-b border-border/50">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 hover:border-primary/50 hover:bg-gradient-accent transition-all"
          onClick={onOpenLibrary}
        >
          <Package className="h-4 w-4" />
          Components
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-3 w-3" />
            Pages
          </h3>
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                currentPageId === page.id
                  ? "bg-gradient-accent border border-primary/20 shadow-sm"
                  : "hover:bg-muted/50 border border-transparent"
              }`}
              onClick={() => onPageSelect(page.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`h-2 w-2 rounded-full ${
                  currentPageId === page.id ? "bg-primary" : "bg-muted-foreground"
                }`} />
                <span className={`text-sm font-medium ${
                  currentPageId === page.id ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {page.name}
                </span>
              </div>
              {pages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(page.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};
