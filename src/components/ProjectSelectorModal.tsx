'use client'
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderPlus, FolderOpen, Loader } from "lucide-react";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { getTeams, getTeamsByUserId } from "@/services/teams.service";
import { addProjectPhotographer, createProject } from "@/services/projects.service";
import { PhotographerSearchSelect, type PhotographerOption } from "@/components/projects/PhotographerSearchSelect";

interface Project {
  id: string;
  name: string;
  team_id?: string | null;
  teamId?: string | null;
  team?: {
    id?: string | null;
    name?: string | null;
  } | null;
  address?: string;
  description?: string;
  created_at: string;
}

interface ProjectSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
  onSelectProject: (projectId: string | null, projectName?: string) => void;
  isEligible?: boolean;
  ineligibilityReason?: string;
}

export function ProjectSelectorModal({
  open,
  onOpenChange,
  teamId,
  onSelectProject,
  isEligible = true,
  ineligibilityReason,
}: ProjectSelectorModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState("");
  const [photographerEmail, setPhotographerEmail] = useState("");

  // Create new project form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [selectLoading, setSelectLoading] = useState(false);

  const currentTeam = useMemo(
    () => teams.find((team) => team.id === teamId) || null,
    [teams, teamId]
  );

  const teamPhotographers = useMemo<PhotographerOption[]>(() => {
    if (!currentTeam) return [];

    return (currentTeam.members || [])
      .filter((member: any) => {
        const roleName = String(member.role?.name || "").toUpperCase();
        return roleName === "TEAM_PHOTOGRAPHER" || roleName === "PHOTOGRAPHER";
      })
      .map((member: any) => ({
        id: member.user?.id || member.user_id,
        label: member.user?.name || member.user?.email || "Unknown photographer",
        email: member.user?.email || "",
        secondaryLabel: member.role?.name || "PHOTOGRAPHER",
      }))
      .filter((option: PhotographerOption) => Boolean(option.id) && Boolean(option.email));
  }, [currentTeam]);

  const selectedPhotographer = useMemo(
    () => teamPhotographers.find((photographer) => photographer.id === selectedPhotographerId) || null,
    [teamPhotographers, selectedPhotographerId]
  );

  const visibleProjects = useMemo(() => {
    return projects.filter((project) => {
      const projectTeamId = project.team_id || project.teamId || project.team?.id || null;
      if (teamId) {
        return projectTeamId === teamId;
      }
      return !projectTeamId;
    });
  }, [projects, teamId]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    if (!visibleProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [selectedProjectId, visibleProjects]);

  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId) || null;

  const getCurrentUserIdFromStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      if (!authRaw) return null;
      const auth = JSON.parse(authRaw);
      return auth?.user?.id || null;
    } catch {
      return null;
    }
  };

  const getDefaultProjectStorageKey = (scopeTeamId: string | null) => {
    const baseKey = scopeTeamId ? `default_project_team_${scopeTeamId}` : 'default_project_personal';
    const userId = getCurrentUserIdFromStorage();
    return userId ? `${baseKey}_user_${userId}` : baseKey;
  };

  const normalizeProjectName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

  // Fetch projects when modal opens
  useEffect(() => {
    if (open && mode === 'select') {
      fetchProjects();
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;

    const loadTeams = async () => {
      setTeamsLoading(true);
      try {
        const auth = getAuthFromStorage();
        const userId = auth?.user?.id;
        const [ownedTeams, memberTeams] = await Promise.all([
          getTeams(),
          userId ? getTeamsByUserId(userId) : Promise.resolve({ success: true, message: "", teams: [] }),
        ]);
        const merged = [...ownedTeams.teams, ...memberTeams.teams];
        const unique = merged.filter((team, index, self) => self.findIndex((item) => item.id === team.id) === index);
        setTeams(unique as any[]);
      } catch (error) {
        console.error("Failed to fetch teams for project selector", error);
        setTeams([]);
      } finally {
        setTeamsLoading(false);
      }
    };

    void loadTeams();
  }, [open]);

  useEffect(() => {
    if (!selectedPhotographerId) return;
    if (!teamPhotographers.some((photographer) => photographer.id === selectedPhotographerId)) {
      setSelectedPhotographerId("");
    }
  }, [selectedPhotographerId, teamPhotographers]);

  useEffect(() => {
    if (selectedPhotographerId && selectedPhotographer) {
      setPhotographerEmail(selectedPhotographer.email);
    }
  }, [selectedPhotographer, selectedPhotographerId]);

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
        } catch { }
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
        const allProjects: Project[] = data.projects || data.data?.projects || [];

        setProjects(allProjects);
        setSelectedProjectId((previous) =>
          previous && allProjects.some((project) => project.id === previous) ? previous : null
        );
      } else {
        console.error('Failed to fetch projects');
        setProjects([]);
        setSelectedProjectId(null);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      setSelectedProjectId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      setCreateError('Project name is required');
      return;
    }

    const isDuplicateName = projects.some((project) => {
      const projectTeamId = project.team_id || project.teamId || project.team?.id || null;
      if ((teamId || null) !== (projectTeamId || null)) return false;
      return normalizeProjectName(project.name || '') === normalizeProjectName(trimmedName);
    });

    if (isDuplicateName) {
      setCreateError('A project with this name already exists in this team. Please choose a different name.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const selectedPhotographer = teamPhotographers.find((photographer) => photographer.id === selectedPhotographerId) || null;

      const response = await createProject({
        teamId: teamId || "",
        name: trimmedName,
        address: newProjectAddress || undefined,
        description: newProjectDescription || undefined,
        photographerEmail: photographerEmail.trim() || selectedPhotographer?.email || undefined,
      });

      const newProject = response.project;
      if (newProject) {
        if (setAsDefault) {
          const defaultKey = getDefaultProjectStorageKey(teamId);
          localStorage.setItem(defaultKey, JSON.stringify({
            projectId: newProject.id,
            projectName: newProject.name
          }));
        }

        // Refresh the project list, then switch to Select tab so the user can continue.
        const normalized: any = {
          ...newProject,
          address: (newProject as any).address || undefined,
          description: (newProject as any).description || undefined,
        };

        setProjects((prev: any) => [normalized, ...(prev || [])]);
        await fetchProjects();
        onSelectProject(newProject.id, newProject.name);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setCreateError((error as any)?.message || 'Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSelectExisting = async () => {
    if (selectedProjectId) {
      const project = visibleProjects.find((candidate) => candidate.id === selectedProjectId);

      setSelectLoading(true);
      setSelectError(null);

      try {
        const resolvedPhotographerEmail = photographerEmail.trim() || selectedPhotographer?.email || undefined;
        if (selectedPhotographerId || resolvedPhotographerEmail) {
          await addProjectPhotographer({
            projectId: selectedProjectId,
            photographerId: selectedPhotographerId || undefined,
            photographerEmail: resolvedPhotographerEmail,
          });
        }

        // Save as default if checkbox is checked
        if (setAsDefault) {
          const defaultKey = getDefaultProjectStorageKey(teamId);
          localStorage.setItem(defaultKey, JSON.stringify({
            projectId: selectedProjectId,
            projectName: project?.name || 'Unknown'
          }));
        }

        onSelectProject(selectedProjectId, project?.name);
        onOpenChange(false);
        setSelectedPhotographerId("");
      } catch (error: any) {
        setSelectError(error?.message || 'Failed to add photographer to project');
      } finally {
        setSelectLoading(false);
      }

    }
  };

  const handleSkip = () => {
    onSelectProject(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Link to Project</DialogTitle>
          <DialogDescription>
            {teamId
              ? "Organize your images by linking them to a team project"
              : "Organize your images by linking them to a personal project"
            }
          </DialogDescription>
          {currentTeam && (
            <div className="mt-2 text-sm text-slate-600">
              Selected team: <span className="font-semibold text-slate-900">{currentTeam.name}</span>
            </div>
          )}
          {isEligible ? (
            <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-900">
                💡 <strong>Recommendation:</strong> If you do not have a project yet, you will be prompted to create one after you click Generate.
              </p>
              <p className="mt-2 text-xs text-indigo-700">
                Purchase a plan first and you can use your 10 demo credits without watermarks. Each demo credit can generate up to 3 images.
              </p>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900 font-semibold">
                ⚠️ Plan Required
              </p>
              <p className="mt-2 text-sm text-amber-800">
                {ineligibilityReason || "You need an active Pro or Pro+ plan to link projects."}
              </p>
            </div>
          )}
          {createSuccess && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{createSuccess}</p>
            </div>
          )}
        </DialogHeader>

        {isEligible ? (
          <>
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
                <p>No projects found yet. Click Generate to be prompted to create one, or switch to New Project now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="existing-project">Select Project ({visibleProjects.length})</Label>
                <Select
                  value={selectedProjectId || undefined}
                  onValueChange={(value) => setSelectedProjectId(value || null)}
                >
                  <SelectTrigger id="existing-project" className="w-full mt-1">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}{project.team?.name ? ` — ${project.team.name}` : ' — Personal'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProjectId && (
                  <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedProject?.name}
                    </p>
                    {selectedProject?.team?.name && (
                      <p className="text-xs text-indigo-600 mt-1">
                        Team: {selectedProject.team.name}
                      </p>
                    )}
                    {selectedProject?.address && (
                      <p className="text-xs text-slate-600 mt-1">
                        {selectedProject.address}
                      </p>
                    )}
                    {selectedProject?.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedProject.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentTeam && (
              <div className="space-y-2">
                <PhotographerSearchSelect
                  label="Add photographer to this project (optional)"
                  options={teamPhotographers}
                  value={selectedPhotographerId}
                  onValueChange={setSelectedPhotographerId}
                  placeholder={teamsLoading ? "Loading photographers..." : "Search team photographers"}
                  searchPlaceholder="Type a name or email"
                  emptyText={teamPhotographers.length === 0 ? "No photographers available in this team" : "No results found"}
                  helperText="Only photographers who already belong to this team can be added."
                  disabled={teamsLoading || teamPhotographers.length === 0}
                />
                <div>
                  <Label htmlFor="invite-photographer-email">Or invite photographer by email</Label>
                  <Input
                    id="invite-photographer-email"
                    type="email"
                    value={photographerEmail}
                    onChange={(event) => setPhotographerEmail(event.target.value)}
                    placeholder="photographer@email.com"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    If the email is not already in the team, an invitation will be sent and the project will stay restricted until they accept it.
                  </p>
                </div>
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
                  disabled={!selectedProjectId || selectLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {selectLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    'Link to Project'
                  )}
                </Button>
              </div>
              {selectError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {selectError}
                </div>
              )}
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

            {currentTeam && (
              <div className="md:col-span-2">
                <PhotographerSearchSelect
                  label="Photographer (optional)"
                  options={teamPhotographers}
                  value={selectedPhotographerId}
                  onValueChange={setSelectedPhotographerId}
                  placeholder={teamsLoading ? "Loading photographers..." : "Search team photographers"}
                  searchPlaceholder="Type a name or email"
                  emptyText={teamPhotographers.length === 0 ? "No photographers available in this team" : "No results found"}
                  helperText="Only photographers who already belong to this team can be added."
                  disabled={teamsLoading || teamPhotographers.length === 0}
                />
              </div>
            )}

            {/* <div className="md:col-span-2">
              <Label htmlFor="create-project-photographer-email">Or invite photographer by email</Label>
              <Input
                id="create-project-photographer-email"
                type="email"
                value={photographerEmail}
                onChange={(event) => setPhotographerEmail(event.target.value)}
                placeholder="photographer@email.com"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-slate-500">
                If the email is not already on the team, a team invite and restricted project invite will be created.
              </p>
            </div> */}

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
                      Creating & Linking...
                    </>
                  ) : (
                    'Create & Link'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
          </>
        ) : (
          // Ineligible state - show only close button
          <div className="space-y-4 py-8">
            <div className="text-center">
              <p className="text-slate-600 mb-6">
                To link and organize your staged images with projects, please upgrade your plan to Pro or Pro+.
              </p>
              <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
