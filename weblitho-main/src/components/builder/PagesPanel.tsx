import { useState } from 'react';
import { Plus, File, Home, Info, Mail, ShoppingCart, Users, Settings, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ProjectPage } from '@/hooks/useProjects';

interface PagesPanelProps {
  pages: ProjectPage[];
  activePage: string;
  onPageSelect: (pageId: string) => void;
  onAddPage: (page: Omit<ProjectPage, 'id'>) => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, name: string) => void;
}

const PAGE_ICONS: Record<string, React.ElementType> = {
  home: Home,
  about: Info,
  contact: Mail,
  shop: ShoppingCart,
  team: Users,
  settings: Settings,
  default: File,
};

const PAGE_TEMPLATES = [
  { name: 'About', path: '/about', icon: 'about' },
  { name: 'Contact', path: '/contact', icon: 'contact' },
  { name: 'Pricing', path: '/pricing', icon: 'default' },
  { name: 'Blog', path: '/blog', icon: 'default' },
  { name: 'Team', path: '/team', icon: 'team' },
  { name: 'FAQ', path: '/faq', icon: 'default' },
];

export const PagesPanel = ({
  pages,
  activePage,
  onPageSelect,
  onAddPage,
  onDeletePage,
  onRenamePage,
}: PagesPanelProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPagePath, setNewPagePath] = useState('');
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddPage = () => {
    if (newPageName && newPagePath) {
      onAddPage({
        name: newPageName,
        path: newPagePath.startsWith('/') ? newPagePath : `/${newPagePath}`,
        icon: 'default',
      });
      setNewPageName('');
      setNewPagePath('');
      setIsAddDialogOpen(false);
    }
  };

  const handleQuickAdd = (template: typeof PAGE_TEMPLATES[0]) => {
    onAddPage({
      name: template.name,
      path: template.path,
      icon: template.icon,
    });
    setIsAddDialogOpen(false);
  };

  const handleRename = (pageId: string) => {
    if (editName.trim()) {
      onRenamePage(pageId, editName.trim());
      setEditingPage(null);
      setEditName('');
    }
  };

  const getIcon = (iconName?: string) => {
    const IconComponent = PAGE_ICONS[iconName || 'default'] || PAGE_ICONS.default;
    return IconComponent;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {pages.map((page) => {
            const Icon = getIcon(page.icon);
            const isActive = page.id === activePage;
            const isEditing = editingPage === page.id;

            return (
              <div
                key={page.id}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => !isEditing && onPageSelect(page.id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                
                {isEditing ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(page.id);
                      if (e.key === 'Escape') setEditingPage(null);
                    }}
                    className="h-6 text-xs py-0 px-1"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-sm truncate">{page.name}</span>
                )}

                <span className="text-xs text-muted-foreground/50 truncate max-w-[60px]">
                  {page.path}
                </span>

                {page.path !== '/' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPage(page.id);
                          setEditName(page.name);
                        }}
                      >
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Add Page Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Add Templates */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {PAGE_TEMPLATES.filter(
                  (t) => !pages.some((p) => p.path === t.path)
                ).map((template) => (
                  <Button
                    key={template.path}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-2">Or create custom:</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Page Name</label>
                  <Input
                    placeholder="e.g., Services"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">URL Path</label>
                  <Input
                    placeholder="e.g., /services"
                    value={newPagePath}
                    onChange={(e) => setNewPagePath(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPage} disabled={!newPageName || !newPagePath}>
              Add Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
