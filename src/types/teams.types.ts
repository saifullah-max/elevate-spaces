export interface createTeamData {
    name: string;
    description: string;
}

export interface createTeamResponse {
    message: string;
    data: {
        team: {
            id: string;
            name: string;
            description?: string | null;
        };
    };
}

export interface inviteTeamData {
    email: string;
    subject?: string;
    text?: string;
    teamId: string;
}

export interface inviteTeamResponse {
    message: string;
    data: {
        invite: {
            id: string;
            email: string;
            team_id: string;
            status: string;
            token: string;
        };
    };
}

export interface acceptInviteData {
    token: string;
    name?: string;
    password?: string;
}

export interface acceptInviteResponse {
    success: boolean;
    message: string;
    accepted?: boolean;
    requiresSignup?: boolean;
    email?: string;
    teamId?: string;
    userId?: string;
}

export interface removeTeamMemberData {
    id: string;
    team_id: string;
    owner_id?: string;
}

export interface removeTeamMemberResponse {
    success: boolean;
    message: string;
}

export interface allocateCreditsData {
    id: string;
    team_id: string;
    credits: number;
}

export interface allocateCreditsResponse {
    success: boolean;
    message: string;
    data?: {
        member: unknown;
    };
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
}

export interface TeamInvite {
    id: string;
    team_id: string;
    email: string;
    team_role_id: string;
    invited_by_user_id: string;
    credit_limit: number;
    token: string;
    status: string;
    invited_at: string;
    expires_at: string;
    accepted_at: string | null;
    accepted_by_user_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Team {
    id: string;
    name: string;
    owner_id: string;
    description: string;
    wallet: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    teamInvites: TeamInvite[];
    owner: User;
}

export interface Get_Teams_Response {
    success: boolean;
    message: string;
    teams: Team[];
}
