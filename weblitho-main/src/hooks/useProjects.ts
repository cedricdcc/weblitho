import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ProjectPage {
  id: string;
  name: string;
  path: string;
  preview?: string;
  icon?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  preview: string | null;
  files: ProjectFile[];
  pages: ProjectPage[];
  chat_history: Array<{ role: string; content: string }>;
  selected_model: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  preview: string | null;
  files: ProjectFile[];
  message: string | null;
  created_at: string;
}

// Helper to safely parse JSON fields
const parseJsonArray = <T>(json: Json | null, defaultValue: T[]): T[] => {
  if (!json) return defaultValue;
  if (Array.isArray(json)) return json as unknown as T[];
  return defaultValue;
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform JSONB fields
      const transformed: Project[] = (data || []).map(p => {
        // Parse pages from files or create default
        const files = parseJsonArray<ProjectFile>(p.files as Json, []);
        const existingPages = (p as any).pages;
        const pages: ProjectPage[] = existingPages 
          ? parseJsonArray<ProjectPage>(existingPages as Json, [])
          : [{ id: 'home', name: 'Home', path: '/', icon: 'home' }];
        
        return {
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          description: p.description,
          preview: p.preview,
          files,
          pages,
          chat_history: parseJsonArray<{ role: string; content: string }>(p.chat_history as Json, []),
          selected_model: p.selected_model || 'deepseek-free',
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      });
      
      setProjects(transformed);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createProject = useCallback(async (data: {
    name?: string;
    preview?: string;
    files?: ProjectFile[];
    chat_history?: Array<{ role: string; content: string }>;
    selected_model?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: data.name || 'Untitled Project',
          preview: data.preview || null,
          files: (data.files || []) as unknown as Json,
          chat_history: (data.chat_history || []) as unknown as Json,
          selected_model: data.selected_model || 'deepseek-free',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Also create initial version
      if (data.preview || (data.files && data.files.length > 0)) {
        await supabase.from('project_versions').insert({
          project_id: project.id,
          version_number: 1,
          preview: data.preview,
          files: (data.files || []) as unknown as Json,
          message: 'Initial version',
        });
      }

      await fetchProjects();
      
      const transformedProject: Project = {
        id: project.id,
        user_id: project.user_id,
        name: project.name,
        description: project.description,
        preview: project.preview,
        files: parseJsonArray<ProjectFile>(project.files as Json, []),
        pages: [{ id: 'home', name: 'Home', path: '/', icon: 'home' }],
        chat_history: parseJsonArray<{ role: string; content: string }>(project.chat_history as Json, []),
        selected_model: project.selected_model || 'deepseek-free',
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
      
      return transformedProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchProjects, toast]);

  const updateProject = useCallback(async (
    projectId: string,
    data: Partial<Pick<Project, 'name' | 'preview' | 'files' | 'chat_history' | 'selected_model'>>,
    createVersion = true,
    versionMessage?: string
  ) => {
    try {
      // Convert to Supabase-compatible types
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.preview !== undefined) updateData.preview = data.preview;
      if (data.files !== undefined) updateData.files = data.files as unknown as Json;
      if (data.chat_history !== undefined) updateData.chat_history = data.chat_history as unknown as Json;
      if (data.selected_model !== undefined) updateData.selected_model = data.selected_model;

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      // Create a new version if preview or files changed
      if (createVersion && (data.preview || data.files)) {
        const { data: versions } = await supabase
          .from('project_versions')
          .select('version_number')
          .eq('project_id', projectId)
          .order('version_number', { ascending: false })
          .limit(1);

        const nextVersion = (versions?.[0]?.version_number || 0) + 1;

        await supabase.from('project_versions').insert({
          project_id: projectId,
          version_number: nextVersion,
          preview: data.preview,
          files: (data.files || []) as unknown as Json,
          message: versionMessage || `Version ${nextVersion}`,
        });
      }

      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchProjects, toast]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchProjects, toast]);

  const getProjectVersions = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      
      const transformed: ProjectVersion[] = (data || []).map(v => ({
        id: v.id,
        project_id: v.project_id,
        version_number: v.version_number,
        preview: v.preview,
        files: parseJsonArray<ProjectFile>(v.files as Json, []),
        message: v.message,
        created_at: v.created_at,
      }));
      
      return transformed;
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  }, []);

  const restoreVersion = useCallback(async (projectId: string, version: ProjectVersion) => {
    return updateProject(projectId, {
      preview: version.preview,
      files: version.files,
    }, true, `Restored from version ${version.version_number}`);
  }, [updateProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectVersions,
    restoreVersion,
  };
};
