import { useState } from 'react';
import { FolderOpen, Clock, Plus, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Project } from '@/hooks/useProjects';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectsGridProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (project: Project) => void;
  onNewProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
}

export const ProjectsGrid = ({ 
  projects, 
  loading, 
  onOpenProject, 
  onNewProject, 
  onDeleteProject,
  onRenameProject 
}: ProjectsGridProps) => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [newName, setNewName] = useState('');

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden bg-card/50 border-border/50">
              <Skeleton className="h-24 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  // Show max 8 recent projects
  const recentProjects = projects.slice(0, 8);

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (onDeleteProject) {
      onDeleteProject(projectId);
    }
  };

  const openRenameDialog = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToRename(project);
    setNewName(project.name);
    setRenameDialogOpen(true);
  };

  const handleRename = () => {
    const trimmedName = newName.trim();
    if (projectToRename && onRenameProject && trimmedName && trimmedName.length <= 100) {
      onRenameProject(projectToRename.id, trimmedName);
      setRenameDialogOpen(false);
      setProjectToRename(null);
      setNewName('');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground/90">Recent Projects</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onNewProject}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recentProjects.map((project) => (
          <Card
            key={project.id}
            className="overflow-hidden group hover:border-primary/50 bg-card/50 border-border/50 transition-all cursor-pointer hover:bg-card/80 relative"
            onClick={() => onOpenProject(project)}
          >
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Rename Button */}
              {onRenameProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm"
                  onClick={(e) => openRenameDialog(e, project)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              
              {/* Delete Button */}
              {onDeleteProject && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-destructive/80 hover:bg-destructive text-white rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-strong border-border/50" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this project and all its versions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-border/50 hover:bg-white/10">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={(e) => handleDelete(e, project.id)} 
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Preview thumbnail */}
            <div className="h-24 bg-muted/20 relative overflow-hidden">
              {project.preview ? (
                <iframe
                  srcDoc={project.preview}
                  className="w-full h-full scale-[0.25] origin-top-left pointer-events-none"
                  style={{ width: '400%', height: '400%' }}
                  title={project.name}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <CardContent className="p-3">
              <h3 className="font-medium text-sm truncate">{project.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="glass-strong border-border/50 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 100))}
              placeholder="Project name"
              className="bg-white/5 border-white/10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              {newName.length}/100 characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="bg-white/5 border-border/50 hover:bg-white/10">
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={!newName.trim() || newName.trim().length > 100}
              className="gradient-animated text-white"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
