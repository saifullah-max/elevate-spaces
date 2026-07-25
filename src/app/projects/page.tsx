'use client'
import { useCallback, useEffect, useMemo, useState } from "react";
import { createProject, getMyProjects, updateProjectName } from "@/services/projects.service";
import { getTeams, getTeamsByUserId } from "@/services/teams.service";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { ProjectsResponse } from "@/types/projects.types";
import { Team } from "@/types/teams.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoginPrompt } from "@/components/teams/LoginPrompt";
import { Plus, Info, Sparkles, X } from "lucide-react";
import { getPaymentSummary, type PaymentSummary } from "@/services/payment.service";
import { userHasActivePersonalSubscription } from "@/helpers/subscription.helpers";
import { useRouter } from "next/navigation";
import { ProjectImagesViewer } from "@/components/projects/ProjectImagesViewer";
import { PhotographerSearchSelect, type PhotographerOption } from "@/components/projects/PhotographerSearchSelect";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import ProjectPhotographerManager from "@/components/projects/ProjectPhotographerManager";

type ProjectItem = ProjectsResponse["projects"][number];

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectsResponse | null>(null);
    const [showImagesViewer, setShowImagesViewer] = useState(false);
    const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
    const [showManagePhotographer, setShowManagePhotographer] = useState(false);
    const [manageProjectId, setManageProjectId] = useState<string | null>(null);
    const [showRenameProject, setShowRenameProject] = useState(false);
    const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
    const [renameProjectName, setRenameProjectName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);
    const [renameError, setRenameError] = useState<string | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamId, setTeamId] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [photographerId, setPhotographerId] = useState("");
    const [photographerEmail, setPhotographerEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [projectMode, setProjectMode] = useState<'personal' | 'team'>('team');
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const currentUserId = useMemo(() => getAuthFromStorage()?.user?.id || null, []);
    const router = useRouter();

    const userProjectsCount = useMemo(
        () => (projects?.projects || []).filter((p) => p.created_by_user_id === currentUserId).length,
        [projects, currentUserId]
    );
    const hasActiveSubscription = useMemo(
        () => userHasActivePersonalSubscription(paymentSummary),
        [paymentSummary]
    );
    const canCreateMoreProjects = hasActiveSubscription || userProjectsCount < 1;

    const tryOpenCreate = (mode: 'personal' | 'team') => {
        if (!canCreateMoreProjects) {
            setUpgradeOpen(true);
            return;
        }
        setProjectMode(mode);
        setShowModal(true);
        setError(null);
        setMessage(null);
    };

    const teamOptions = useMemo(() => teams, [teams]);
    const selectedTeam = useMemo(() => teams.find((team) => team.id === teamId) || null, [teams, teamId]);
    const teamProjects = useMemo(
        () => (projects?.projects || []).filter((project) => Boolean(project.team_id)),
        [projects]
    );
    const personalProjects = useMemo(
        () => (projects?.projects || []).filter((project) => !project.team_id),
        [projects]
    );
    const teamPhotographers = useMemo<PhotographerOption[]>(() => {
        if (!selectedTeam) return [];
        return (selectedTeam.members || [])
            .filter((member) => {
                const roleName = String(member.role?.name || "").toUpperCase();
                return roleName === "TEAM_PHOTOGRAPHER" || roleName === "PHOTOGRAPHER";
            })
            .map((member) => ({
                id: member.user?.id || member.user_id,
                label: member.user?.name || member.user?.email || "Unknown photographer",
                email: member.user?.email || "",
                secondaryLabel: member.role?.name || "PHOTOGRAPHER",
            }))
            .filter((option) => Boolean(option.id) && Boolean(option.email));
    }, [selectedTeam]);

    const selectedPhotographer = useMemo(
        () => teamPhotographers.find((photographer) => photographer.id === photographerId) || null,
        [teamPhotographers, photographerId]
    );

    const getCurrentUserRoleInTeam = (teamId: string | null) => {
        if (!teamId || !currentUserId) return null;
        const team = teams.find((item) => item.id === teamId);
        if (!team) return null;
        if (team.owner_id === currentUserId) return 'TEAM_OWNER';

        const membership = team.members?.find((member) => member.user_id === currentUserId);
        return String(membership?.role?.name || '').toUpperCase() || null;
    };

    const canManageProject = (project: ProjectItem) => {
        if (!currentUserId || !project?.team_id) return false;
        const teamOwnerId = project.team?.owner_id;
        const roleName = getCurrentUserRoleInTeam(project.team_id);
        return project.created_by_user_id === currentUserId || teamOwnerId === currentUserId || ["TEAM_ADMIN", "ADMIN", "TEAM_MEMBER", "MEMBER"].includes(roleName || "");
    };

    const canRenameProject = (project: ProjectItem) => {
        if (!currentUserId || !project) return false;
        return project.created_by_user_id === currentUserId;
    };

    const openRenameProject = (project: ProjectItem) => {
        setRenameProjectId(project.id);
        setRenameProjectName(project.name || "");
        setRenameError(null);
        setShowRenameProject(true);
    };

    const closeRenameProject = () => {
        setShowRenameProject(false);
        setRenameProjectId(null);
        setRenameProjectName("");
        setRenameError(null);
        setRenameLoading(false);
    };

    const handleRenameProject = async () => {
        const trimmedName = renameProjectName.trim();

        if (!renameProjectId) {
            return;
        }

        if (!trimmedName) {
            setRenameError("Project name is required");
            return;
        }

        setRenameLoading(true);
        setRenameError(null);

        try {
            await updateProjectName({
                projectId: renameProjectId,
                name: trimmedName,
            });

            await loadProjects();
            closeRenameProject();
        } catch (err: unknown) {
            setRenameError(err instanceof Error ? err.message : "Failed to rename project");
        } finally {
            setRenameLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedTeam || teamPhotographers.length === 0) {
            setPhotographerId("");
            return;
        }

        if (photographerId && !teamPhotographers.some((photographer) => photographer.id === photographerId)) {
            setPhotographerId("");
        }
    }, [photographerId, selectedTeam, teamPhotographers]);

    const loadProjects = useCallback(async () => {
        try {
            const res = await getMyProjects();
            setProjects(res);
        } catch (err) {
        }
    }, []);

    const loadTeams = useCallback(async () => {
        try {
            const auth = getAuthFromStorage();
            const userId = auth?.user?.id;
            const [ownedTeams, memberTeams] = await Promise.all([
                getTeams(),
                userId ? getTeamsByUserId(userId) : Promise.resolve({ success: true, message: "", teams: [] }),
            ]);
            const merged = [...ownedTeams.teams, ...memberTeams.teams];
            const unique = merged.filter((team, index, self) => self.findIndex((t) => t.id === team.id) === index);
            setTeams(unique);
            setTeamId((currentTeamId) => currentTeamId || unique[0]?.id || "");
        } catch (err) {
        }
    }, []);

    useEffect(() => {
        const auth = getAuthFromStorage();
        setIsAuthenticated(!!auth?.user);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            void Promise.all([loadProjects(), loadTeams()]);
            (async () => {
                try {
                    const s = await getPaymentSummary();
                    setPaymentSummary(s);
                } catch {}
            })();
        }
    }, [isAuthenticated, loadProjects, loadTeams]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (projectMode === 'team' && !teamId) {
            setError("Team is required");
            return;
        }

        if (!name.trim()) {
            setError("Project name is required");
            return;
        }

        // Client-side duplicate name check (scoped to team or to personal projects)
        const normalizedName = name.trim().replace(/\s+/g, " ");
        if (projectMode === 'team') {
            const existingInTeam = (projects?.projects || []).find(p => p.team_id === teamId && (p.name || '').trim().toLowerCase() === normalizedName.toLowerCase());
            if (existingInTeam) {
                setError("A project with this name already exists in this team. Please choose a different name.");
                return;
            }
        } else {
            const existingPersonal = (projects?.projects || []).find(p => !p.team_id && p.created_by_user_id === currentUserId && (p.name || '').trim().toLowerCase() === normalizedName.toLowerCase());
            if (existingPersonal) {
                setError("You already have a personal project with this name. Please choose a different name.");
                return;
            }
        }

        try {
            setLoading(true);
            const res = await createProject({
                teamId: projectMode === 'team' ? teamId : undefined,
                name,
                address: address.trim() || undefined,
                description: description.trim() || undefined,
                photographerEmail: projectMode === 'team'
                    ? (photographerEmail.trim() || selectedPhotographer?.email || undefined)
                    : (photographerEmail.trim() || undefined),
            });
            setMessage(res.message || "Project created successfully");
            setName("");
            setAddress("");
            setDescription("");
            setPhotographerId("");
            setPhotographerEmail("");
            setShowModal(false)
            await loadProjects();
        } catch (err: unknown) {
            // Service throws `{ message }` plain objects; cover both shapes.
            const errAny = err as any;
            const message =
                (errAny && typeof errAny === "object" && "message" in errAny && typeof errAny.message === "string"
                    ? errAny.message
                    : err instanceof Error
                        ? err.message
                        : "Failed to create project");
            setError(message);
        } finally {
            // Important: leave the modal open if an error was raised so the user
            // can read it and fix their inputs. Closing only happens on success
            // (the setShowModal(false) above in the success branch).
            setLoading(false);
        }
    };

    if (isAuthenticated === null) {
        return null;
    }

    if (!isAuthenticated) {
        return (
            <LoginPrompt
                title="Sign in to see your projects"
                subtitle="Sign in or create an account to view and manage saved projects."
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2] py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-wrap items-center justify-end gap-3 mb-8">
                    <div className="relative group mr-auto">
                        <button
                            type="button"
                            aria-label="Project rules"
                            className="text-cream-800/50 hover:text-brand-500 transition flex items-center gap-2"
                        >
                            <Info className="w-5 h-5" />
                            <span>How projects work</span>
                        </button>

                        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition absolute left-0 top-full mt-2 z-30 w-80 rounded-lg border border-cream-200 bg-white p-3 shadow-lg text-xs text-cream-800/80">
                            <p className="mb-2">
                                <span className="font-semibold">Team projects</span> are created inside a team and are visible to the team owner and any team admins — not just the person who created them.
                            </p>
                            <p>
                                <span className="font-semibold">Personal projects</span> are private — only you can see them. They require an active personal plan. If you're only a member of someone else's team, that team's subscription doesn't cover personal projects.
                            </p>
                        </div>
                    </div>
                    <Button
                        className="py-6"
                        variant="outline"
                        onClick={() => tryOpenCreate('personal')}
                    >
                        <Plus /> Add Personal Project
                    </Button>
                    <Button
                        className="py-6"
                        onClick={() => tryOpenCreate('team')}
                    >
                        <Plus /> Add Project to the Team
                    </Button>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-cream-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-cream-200">
                            <h2 className="text-xl font-semibold text-brand-900">Personal projects</h2>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-cream-50">
                                    <TableHead className="font-semibold text-left">Project</TableHead>
                                    <TableHead className="font-semibold text-left">Created By</TableHead>
                                    <TableHead className="font-semibold text-left">Address</TableHead>
                                    <TableHead className="font-semibold text-left">Created</TableHead>
                                    <TableHead className="font-semibold text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {personalProjects.length ? (
                                    personalProjects.map((project) => (
                                        <TableRow key={project.id} className="hover:bg-cream-50">
                                            <TableCell className="font-medium">{project.name}</TableCell>
                                            <TableCell>{project.created_by?.name || project.created_by?.email || "-"}</TableCell>
                                            <TableCell className="text-cream-800/70">{project.address || "-"}</TableCell>
                                            <TableCell className="text-cream-800/70">{new Date(project.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="p-1">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => { setSelectedProject({ id: project.id, name: project.name }); setShowImagesViewer(true); }}>
                                                            View Images
                                                        </DropdownMenuItem>
                                                        {canRenameProject(project) && (
                                                            <DropdownMenuItem onClick={() => openRenameProject(project)}>
                                                                Rename
                                                            </DropdownMenuItem>
                                                        )}
                                                        {project.created_by_user_id === currentUserId && (
                                                            <DropdownMenuItem onClick={() => { setManageProjectId(project.id); setShowManagePhotographer(true); }}>
                                                                Manage photographer
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-cream-800/50 py-10">
                                            No personal projects yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-cream-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-cream-200">
                            <h2 className="text-xl font-semibold text-brand-900">Projects linked to a team</h2>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-cream-50">
                                    <TableHead className="font-semibold text-left">Project</TableHead>
                                    <TableHead className="font-semibold text-left">Team</TableHead>
                                    <TableHead className="font-semibold text-left">Created By</TableHead>
                                    <TableHead className="font-semibold text-left">Address</TableHead>
                                    <TableHead className="font-semibold text-left">Created</TableHead>
                                    <TableHead className="font-semibold text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamProjects.length ? (
                                    teamProjects.map((project) => (
                                        <TableRow key={project.id} className="hover:bg-cream-50">
                                            <TableCell className="font-medium">{project.name}</TableCell>
                                            <TableCell>{project.team?.name || "-"}</TableCell>
                                            <TableCell>{project.created_by?.name || project.created_by?.email || "-"}</TableCell>
                                            <TableCell className="text-cream-800/70">{project.address || "-"}</TableCell>
                                            <TableCell className="text-cream-800/70">{new Date(project.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="p-1">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => { setSelectedProject({ id: project.id, name: project.name }); setShowImagesViewer(true); }}>
                                                            View Images
                                                        </DropdownMenuItem>
                                                        {canRenameProject(project) && (
                                                            <DropdownMenuItem onClick={() => openRenameProject(project)}>
                                                                Rename
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canManageProject(project) && (
                                                            <DropdownMenuItem onClick={() => { setManageProjectId(project.id); setShowManagePhotographer(true); }}>
                                                                Manage photographer
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-cream-800/50 py-10">
                                            No team projects yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>


                </div>
            </div>
            {/* Project Images Viewer Modal */}
            {selectedProject && (
                <ProjectImagesViewer
                    open={showImagesViewer}
                    onOpenChange={setShowImagesViewer}
                    projectId={selectedProject.id}
                    projectName={selectedProject.name}
                />
            )}

            {/* Project Photographer Manager Modal */}
            {manageProjectId && (
                <ProjectPhotographerManager
                    open={showManagePhotographer}
                    onOpenChange={(open) => { setShowManagePhotographer(open); if (!open) setManageProjectId(null); }}
                    projectId={manageProjectId}
                />
            )}

            <Dialog open={showRenameProject} onOpenChange={(open) => (open ? setShowRenameProject(true) : closeRenameProject())}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename project</DialogTitle>
                        <DialogDescription>
                            Only the creator of the project can rename it.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="rename-project-name">Project name</Label>
                            <Input
                                id="rename-project-name"
                                value={renameProjectName}
                                onChange={(event) => setRenameProjectName(event.target.value)}
                                placeholder="Enter a new project name"
                                className="mt-1"
                                autoFocus
                            />
                        </div>

                        {renameError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {renameError}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={closeRenameProject} disabled={renameLoading}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-brand-500 hover:bg-brand-600"
                                onClick={handleRenameProject}
                                disabled={renameLoading || !renameProjectName.trim()}
                            >
                                {renameLoading ? "Saving..." : "Rename"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

                    {/* Modal Card */}
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-cream-200 p-6 max-h-[90vh] overflow-y-auto">

                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-cream-800/40 hover:text-cream-800/80 transition"
                        >
                            ✕
                        </button>

                        <h1 className="text-2xl font-bold text-brand-900 mb-2">
                            {projectMode === 'personal' ? 'Add Personal Project' : 'Add Project to the Team'}
                        </h1>

                        {projectMode === 'team' ? (
                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>
                                    Team projects are visible to the <strong>team owner</strong> and any <strong>team admins</strong>, in addition to whoever you invite. They&apos;re not private.
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-900">
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>
                                    Personal projects are private — only you can see them. They require your own active personal plan (team subscriptions don&apos;t cover personal projects).
                                </p>
                            </div>
                        )}

                        <form
                            onSubmit={handleCreateProject}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {projectMode === 'team' && (
                                <div>
                                    <Label htmlFor="project-team">Team</Label>
                                    <select
                                        id="project-team"
                                        value={teamId}
                                        onChange={(e) => setTeamId(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-cream-200 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-white"
                                    >
                                        <option value="">Select a team…</option>
                                        {teamOptions.map((team) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="project-name">Project Name</Label>
                                <Input
                                    id="project-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="123 Main St Listing"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="project-address">Address (optional)</Label>
                                <Input
                                    id="project-address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="123 Main St, Miami, FL"
                                    className="mt-1"
                                />
                            </div>

                            {projectMode === 'team' && (
                                <>
                                    <div className="md:col-span-2">
                                        <PhotographerSearchSelect
                                            label="Photographer (optional)"
                                            options={teamPhotographers}
                                            value={photographerId}
                                            onValueChange={setPhotographerId}
                                            placeholder="Search team photographers"
                                            searchPlaceholder="Type a name or email"
                                            emptyText={selectedTeam ? "No photographers available in this team" : "Select a team first"}
                                            helperText={selectedTeam && teamPhotographers.length > 0
                                                ? "Only photographers who already belong to this team appear here."
                                                : undefined}
                                            disabled={!selectedTeam || teamPhotographers.length === 0}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="project-photographer-email">Or invite photographer by email</Label>
                                        <Input
                                            id="project-photographer-email"
                                            type="email"
                                            value={photographerEmail}
                                            onChange={(e) => setPhotographerEmail(e.target.value)}
                                            placeholder="photographer@email.com"
                                            className="mt-1"
                                        />
                                        <p className="mt-1 text-xs text-cream-800/50">
                                            If the email is not already on the team, a team invite and restricted project invite will be created.
                                        </p>
                                    </div>
                                </>
                            )}

                            {projectMode === 'personal' && (
                                <div className="md:col-span-2">
                                    <Label htmlFor="personal-project-photographer-email">Invite photographer by email (optional)</Label>
                                    <Input
                                        id="personal-project-photographer-email"
                                        type="email"
                                        value={photographerEmail}
                                        onChange={(e) => setPhotographerEmail(e.target.value)}
                                        placeholder="photographer@email.com"
                                        className="mt-1"
                                    />
                                    <p className="mt-1 text-xs text-cream-800/50">
                                        Anyone can be invited to a personal project. If the email belongs to an existing user they&apos;ll be added immediately; otherwise they&apos;ll receive an invitation to join the project.
                                    </p>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <Label htmlFor="project-description">
                                    Description (optional)
                                </Label>
                                <textarea
                                    id="project-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-cream-200 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                                    rows={3}
                                />
                            </div>

                            {message && (
                                <div className="md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-brand-500 hover:bg-brand-600 w-full"
                                >
                                    {loading ? "Creating..." : "Create Project"}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Click Outside Close */}
                    <div
                        className="absolute inset-0 -z-10"
                        onClick={() => setShowModal(false)}
                    />
                </div>
            )}

            {upgradeOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto bg-brand-900/50 backdrop-blur-sm"
                    onClick={() => setUpgradeOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-xl text-center"
                    >
                        <button
                            onClick={() => setUpgradeOpen(false)}
                            className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="w-14 h-14 rounded-full bg-brand-100 mx-auto flex items-center justify-center mb-4">
                            <Sparkles className="w-6 h-6 text-brand-500" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-brand-900 mb-2">
                            Upgrade to save more projects
                        </h3>
                        <p className="text-sm text-cream-800/60 mb-6">
                            You've used your free saved project. Subscribe to Pro, Team, or Enterprise to
                            save unlimited projects and unlock advanced features.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                className="bg-brand-500 hover:bg-brand-600 w-full"
                                onClick={() => router.push('/pricing')}
                            >
                                See plans
                            </Button>
                            <button
                                type="button"
                                onClick={() => setUpgradeOpen(false)}
                                className="text-xs text-cream-800/60 hover:text-brand-900"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
