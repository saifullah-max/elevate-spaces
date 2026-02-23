'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { getMyProjects } from "@/services/projects.service";
import { ProjectImagesViewer } from "./ProjectImagesViewer";
import { showError, showInfo } from "./toastUtils";

interface Project {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  team_id?: string;
  created_at: string;
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [showImagesViewer, setShowImagesViewer] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyProjects();
      setProjects(result.projects || []);
      if (!result.projects || result.projects.length === 0) {
        showInfo("No projects yet. Create your first project!");
      }
    } catch (err: any) {
      const message = err.message || "Failed to fetch projects";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewImages = (project: Project) => {
    setSelectedProject({ id: project.id, name: project.name });
    setShowImagesViewer(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={fetchProjects} className="bg-red-600 hover:bg-red-700">
          Retry
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
        <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Projects Yet</h3>
        <p className="text-slate-600 mb-6">Create a project to organize and view your staged images</p>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">My Projects ({projects.length})</h2>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{project.name}</h3>
                {project.address && (
                  <p className="text-sm text-slate-600 line-clamp-1">{project.address}</p>
                )}
              </div>

              {project.description && (
                <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
              )}

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleViewImages(project)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="sm"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  View Images
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Images Viewer Modal */}
      {selectedProject && (
        <ProjectImagesViewer
          open={showImagesViewer}
          onOpenChange={setShowImagesViewer}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </div>
  );
}
