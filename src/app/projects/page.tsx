'use client'
import { useEffect, useMemo, useState } from "react";
import { createProject, getMyProjects } from "@/services/projects.service";
import { getTeams, getTeamsByUserId } from "@/services/teams.service";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { ProjectsResponse } from "@/types/projects.types";
import { Team } from "@/types/teams.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoginPrompt } from "@/components/teams/LoginPrompt";
import { Plus, Image as ImageIcon } from "lucide-react";
import { ProjectImagesViewer } from "@/components/ProjectImagesViewer";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectsResponse | null>(null);
    const [showImagesViewer, setShowImagesViewer] = useState(false);
    const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamId, setTeamId] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [photographerEmail, setPhotographerEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const teamOptions = useMemo(() => teams, [teams]);

    const loadProjects = async () => {
        try {
            const res = await getMyProjects();
            setProjects(res);
        } catch (err) {
            console.error("Failed to fetch projects", err);
        }
    };

    const loadTeams = async () => {
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
            if (!teamId && unique.length > 0) {
                setTeamId(unique[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch teams", err);
        }
    };

    useEffect(() => {
        const auth = getAuthFromStorage();
        setIsAuthenticated(!!auth?.user);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadProjects();
            loadTeams();
        }
    }, [isAuthenticated]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!teamId) {
            setError("Team is required");
            return;
        }

        if (!name.trim()) {
            setError("Project name is required");
            return;
        }

        try {
            setLoading(true);
            const res = await createProject({
                teamId,
                name,
                address: address.trim() || undefined,
                description: description.trim() || undefined,
                photographerEmail: photographerEmail.trim() || undefined,
            });
            setMessage(res.message || "Project created successfully");
            setName("");
            setAddress("");
            setDescription("");
            setPhotographerEmail("");
            await loadProjects();
        } catch (err: any) {
            setError(err.message || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated === null) {
        return null;
    }

    if (!isAuthenticated) {
        return <LoginPrompt />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-end mb-8">
                    <Button className="py-6" onClick={() => setShowModal(true)}><Plus /> Add Project</Button>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-xl font-semibold text-slate-900">My Projects</h2>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold text-left">Project</TableHead>
                                <TableHead className="font-semibold text-left">Team</TableHead>
                                <TableHead className="font-semibold text-left">Created By</TableHead>
                                <TableHead className="font-semibold text-left">Address</TableHead>
                                <TableHead className="font-semibold text-left">Created</TableHead>
                                <TableHead className="font-semibold text-left">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects?.projects?.length ? (
                                projects.projects.map((project) => (
                                    <TableRow key={project.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">{project.name}</TableCell>
                                        <TableCell>{project.team?.name || "-"}</TableCell>
                                        <TableCell>{project.created_by?.name || project.created_by?.email || "-"}</TableCell>
                                        <TableCell className="text-slate-600">{project.address || "-"}</TableCell>
                                        <TableCell className="text-slate-600">{new Date(project.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center gap-1"
                                                onClick={() => {
                                                    setSelectedProject({ id: project.id, name: project.name });
                                                    setShowImagesViewer(true);
                                                }}
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                                View Images
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-10">
                                        No projects yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

                    {/* Modal Card */}
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto">

                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
                        >
                            ✕
                        </button>

                        <h1 className="text-2xl font-bold text-slate-900 mb-6">
                            Projects
                        </h1>

                        <form
                            onSubmit={handleCreateProject}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            <div>
                                <Label htmlFor="project-team">Team</Label>
                                <select
                                    id="project-team"
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                                >
                                    {teamOptions.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

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

                            <div>
                                <Label htmlFor="project-photographer">
                                    Photographer Email (optional)
                                </Label>
                                <Input
                                    id="project-photographer"
                                    value={photographerEmail}
                                    onChange={(e) => setPhotographerEmail(e.target.value)}
                                    placeholder="photographer@example.com"
                                    className="mt-1"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="project-description">
                                    Description (optional)
                                </Label>
                                <textarea
                                    id="project-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
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
                                    className="bg-indigo-600 hover:bg-indigo-700 w-full"
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

        </div>
    );
}
