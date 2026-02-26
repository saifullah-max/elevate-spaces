'use client'
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, FolderOpen, Loader } from "lucide-react";

interface Project {
  id: string;
  name: string;
  address?: string;
  description?: string;
  created_at: string;
}

interface ProjectSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
  onSelectProject: (projectId: string | null, projectName?: string) => void;
}

export function ProjectSelectorModal({
  open,
  onOpenChange,
  teamId,
  onSelectProject,
}: ProjectSelectorModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(false);
  
  // Create new project form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch projects when modal opens
  useEffect(() => {
    if (open && mode === 'select') {
      fetchProjects();
    }
  }, [open, mode]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Get token from localStorage
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      let token: string | null = null;
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          token = auth.token || null;
        } catch {}
      }

      // Fetch all user projects (personal + team projects)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/projects`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const allProjects = data.projects || [];
        
        // Filter projects based on teamId
        // If teamId is null, show only personal projects
        // If teamId is set, show only that team's projects
        const filteredProjects = teamId
          ? allProjects.filter((p: any) => p.team_id === teamId)
          : allProjects.filter((p: any) => p.team_id === null);
        
        setProjects(filteredProjects);
      } else {
        console.error('Failed to fetch projects');
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setCreateError('Project name is required');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      // Get token from localStorage
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      let token: string | null = null;
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          token = auth.token || null;
        } catch {}
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/projects`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            teamId,
            name: newProjectName,
            address: newProjectAddress || null,
            description: newProjectDescription || null,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newProject = data.data?.project;
        if (newProject) {
          // Save as default if checkbox is checked
          if (setAsDefault) {
            const defaultKey = teamId ? `default_project_team_${teamId}` : 'default_project_personal';
            localStorage.setItem(defaultKey, JSON.stringify({
              projectId: newProject.id,
              projectName: newProject.name
            }));
          }
          
          onSelectProject(newProject.id, newProject.name);
          onOpenChange(false);
          // Reset form
          setNewProjectName('');
          setNewProjectAddress('');
          setNewProjectDescription('');
        }
      } else {
        const errorData = await response.json();
        setCreateError(errorData.error?.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSelectExisting = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      
      // Save as default if checkbox is checked
      if (setAsDefault) {
        const defaultKey = teamId ? `default_project_team_${teamId}` : 'default_project_personal';
        localStorage.setItem(defaultKey, JSON.stringify({
          projectId: selectedProjectId,
          projectName: project?.name || 'Unknown'
        }));
      }
      
      onSelectProject(selectedProjectId, project?.name);
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onSelectProject(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle className="text-2xl">Link to Project</DialogTitle>
          <DialogDescription>
            {teamId 
              ? "Organize your images by linking them to a team project"
              : "Organize your images by linking them to a personal project"
            }
          </DialogDescription>
          <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-900">
              💡 <strong>Recommendation:</strong> Select a default project to avoid selecting project on each image generation
            </p>
          </div>
        </DialogHeader>

        {/* Mode Selection */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={mode === 'select' ? 'default' : 'outline'}
            onClick={() => setMode('select')}
            className="flex-1"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Existing Project
          </Button>
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => setMode('create')}
            className="flex-1"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Select Existing Project */}
        {mode === 'select' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No projects found. Create a new one!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-75 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedProjectId === project.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    <h4 className="font-semibold text-slate-900">{project.name}</h4>
                    {project.address && (
                      <p className="text-sm text-slate-600 mt-1">{project.address}</p>
                    )}
                    {project.description && (
                      <p className="text-xs text-slate-500 mt-1">{project.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="set-as-default"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                />
                <label htmlFor="set-as-default" className="text-sm text-slate-700 cursor-pointer flex-1">
                  Set as default project (skip this modal next time)
                </label>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Skip for Now
                </Button>
                <Button
                  onClick={handleSelectExisting}
                  disabled={!selectedProjectId}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  Link to Project
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create New Project */}
        {mode === 'create' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="project-name"
                type="text"
                placeholder="e.g., 123 Main Street"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="project-address">
                Address <span className="text-slate-400 text-sm">(optional)</span>
              </Label>
              <Input
                id="project-address"
                type="text"
                placeholder="e.g., 123 Main St, City, State"
                value={newProjectAddress}
                onChange={(e) => setNewProjectAddress(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="project-description">
                Description <span className="text-slate-400 text-sm">(optional)</span>
              </Label>
              <textarea
                id="project-description"
                placeholder="Brief description of the project"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                rows={3}
              />
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{createError}</p>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="set-as-default-create"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                />
                <label htmlFor="set-as-default-create" className="text-sm text-slate-700 cursor-pointer flex-1">
                  Set as default project (skip this modal next time)
                </label>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Skip for Now
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={createLoading || !newProjectName.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {createLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create & Link'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
