import { useState, useEffect } from 'react';
import { History, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProjectVersion } from '@/hooks/useProjects';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryProps {
  projectId: string | null;
  onGetVersions: (projectId: string) => Promise<ProjectVersion[]>;
  onRestore: (projectId: string, version: ProjectVersion) => Promise<boolean>;
}

export const VersionHistory = ({ projectId, onGetVersions, onRestore }: VersionHistoryProps) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (open && projectId) {
      loadVersions();
    }
  }, [open, projectId]);

  const loadVersions = async () => {
    if (!projectId) return;
    setLoading(true);
    const data = await onGetVersions(projectId);
    setVersions(data);
    setLoading(false);
  };

  const handleRestore = async (version: ProjectVersion) => {
    if (!projectId) return;
    setRestoringId(version.id);
    const success = await onRestore(projectId, version);
    setRestoringId(null);
    if (success) {
      setOpen(false);
    }
  };

  if (!projectId) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border/50 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No version history yet</p>
              <p className="text-sm mt-1">Versions are created when you generate or modify code</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Version {version.version_number}</span>
                        {index === 0 && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {version.message || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {index !== 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleRestore(version)}
                        disabled={restoringId === version.id}
                      >
                        <RotateCcw className="h-3 w-3" />
                        {restoringId === version.id ? 'Restoring...' : 'Restore'}
                      </Button>
                    )}
                  </div>

                  {/* Mini preview */}
                  {version.preview && (
                    <div className="mt-3 h-24 rounded border border-border/30 overflow-hidden bg-muted/20">
                      <iframe
                        srcDoc={version.preview}
                        className="w-full h-full scale-50 origin-top-left pointer-events-none"
                        style={{ width: '200%', height: '200%' }}
                        title={`Version ${version.version_number}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
