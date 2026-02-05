
export const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
        const authRaw = localStorage.getItem("elevate_spaces_auth");
        if (authRaw) {
            try {
                const auth = JSON.parse(authRaw);
                return auth.token || null;
            } catch {
                return null;
            }
        }
    }
    return null;
};

export const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};
