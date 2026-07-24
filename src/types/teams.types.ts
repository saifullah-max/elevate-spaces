export interface TransferCreditsToTeamData {
    team_id: string;
    credits: number;
}

export interface TransferCreditsToTeamResponse {
    success: boolean;
    message: string;
}
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
    inviteeName?: string;
    subject?: string;
    text?: string;
    teamId: string;
    roleName?: string;
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
    registrationAgreements?: {
        acceptTermsAndPrivacy: boolean;
        confirmAgeAndCapacity: boolean;
        confirmUploadRights: boolean;
        acknowledgeAiLimitations: boolean;
        acknowledgeCreditsPolicy: boolean;
        acceptArbitrationWaiver: boolean;
        acknowledgePhotographerDisclaimer: boolean;
        promotionalCommunicationsOptIn?: boolean;
    };
}

export interface acceptInviteResponse {
    success: boolean;
    message: string;
    accepted?: boolean;
    requiresSignup?: boolean;
    email?: string;
    teamId?: string;
    userId?: string;
    // Present only when the accept-invite flow created a brand-new account.
    // The frontend uses these to sign the user straight into the app rather
    // than bouncing them back through the sign-in page.
    token?: string;
    user?: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        avatarUrl?: string | null;
        manualAvatarUrl?: string | null;
        googleAvatarUrl?: string | null;
        created_at?: string;
    };
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
    code?: string;
    data?: {
        member?: unknown;
        teamId?: string;
        teamName?: string;
        personalCreditsBalance?: number;
        teamWalletBalance?: number;
    };
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
}

export interface TeamRole {
    id: string;
    name: string;
    description?: string | null;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    team_role_id: string;
    allocated: number;
    used: number;
    joined_at: string;
    updated_at: string;
    deleted_at: string;
    is_paid_extra_seat?: boolean;
    seat_auto_renew?: boolean;
    seat_last_paid_at?: string | null;
    seat_expires_at?: string | null;
    seat_payment_product_key?: string | null;
    user: User;
    role: TeamRole;
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
    role?: TeamRole;
}

export interface TeamPurchase {
    id: string;
    team_id: string;
    amount: number;
    price_usd: number;
    status: string;
    stripe_session_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_invoice_id?: string | null;
    created_at: string;
    completed_at?: string | null;
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
    members: TeamMember[];
    owner: User;
    purchases?: TeamPurchase[];
}

export interface Get_Teams_Response {
    success: boolean;
    message: string;
    teams: Team[];
}
