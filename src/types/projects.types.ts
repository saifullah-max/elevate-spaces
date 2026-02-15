import { User } from "./teams.types";

export interface ProjectTeam {
    id: string;
    name: string;
    owner_id: string;
    description: string | null;
    wallet: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    role: "PHOTOGRAPHER" | "AGENT";
    assigned_at: string;
    user: User;
}

export interface Project {
    id: string;
    team_id: string;
    name: string;
    address?: string | null;
    description?: string | null;
    created_by_user_id: string;
    created_at: string;
    updated_at: string;
    team: ProjectTeam;
    created_by: User;
    members: ProjectMember[];
}

export interface CreateProjectData {
    teamId: string;
    name: string;
    address?: string;
    description?: string;
    photographerEmail?: string;
}

export interface ProjectResponse {
    success: boolean;
    message: string;
    project?: Project;
}

export interface ProjectsResponse {
    success: boolean;
    message: string;
    projects: Project[];
}
