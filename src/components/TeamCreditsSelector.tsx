"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Coins, Loader2, Shield, Users } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3003";
const TEAMS_CACHE_KEY = 'elevate_teams_cache';
const TEAMS_CACHE_EXPIRY_KEY = 'elevate_teams_cache_expiry';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

interface Team {
  id: string;
  name: string;
  role: string;
  allocated: number;
  used: number;
  remaining: number;
}

interface TeamCreditsSelectorProps {
  onTeamSelect: (teamId: string | null, remaining: number) => void;
  selectedTeamId: string | null;
  disabled?: boolean;
  onRefreshReady?: (refreshFn: () => Promise<void>) => void;
}

export function TeamCreditsSelector({ 
  onTeamSelect, 
  selectedTeamId,
  disabled = false,
  onRefreshReady 
}: TeamCreditsSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchTeams = useCallback(async (skipCache = false) => {
    try {
      // Check cache first (unless skipCache is true)
      if (!skipCache && typeof window !== 'undefined') {
        const cachedData = localStorage.getItem(TEAMS_CACHE_KEY);
        const cacheExpiry = localStorage.getItem(TEAMS_CACHE_EXPIRY_KEY);
        
        if (cachedData && cacheExpiry) {
          const expiryTime = parseInt(cacheExpiry, 10);
          if (Date.now() < expiryTime) {
            try {
              const parsedTeams = JSON.parse(cachedData);
              setTeams(parsedTeams);
              setLoading(false);
              setError(null);
              
              // Update remaining credits for currently selected team if any
              if (selectedTeamId) {
                const updatedTeam = parsedTeams.find((t: Team) => t.id === selectedTeamId);
                if (updatedTeam) {
                  onTeamSelect(updatedTeam.id, updatedTeam.remaining);
                }
              }
              return; // Use cache, don't fetch
            } catch (e) {
              console.error('Failed to parse cached teams:', e);
            }
          }
        }
      }

      setIsFetching(true);
      setLoading(true);
      setError(null);

      // Get token from localStorage
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      if (!authRaw) {
        setError("Please log in to use team credits");
        setLoading(false);
        setIsFetching(false);
        return;
      }

      const auth = JSON.parse(authRaw);
      const token = auth.token;

      const response = await axios.get(`${API_BASE_URL}/teams/my-credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add request timeout
        timeout: 10000,
      });

      if (response.data.success) {
        const teamsData = response.data.data.teams;
        setTeams(teamsData);
        
        // Cache the result
        if (typeof window !== 'undefined') {
          localStorage.setItem(TEAMS_CACHE_KEY, JSON.stringify(teamsData));
          localStorage.setItem(TEAMS_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION_MS).toString());
        }
        
        // Update remaining credits for currently selected team if any
        if (selectedTeamId) {
          const updatedTeam = teamsData.find((t: Team) => t.id === selectedTeamId);
          if (updatedTeam) {
            onTeamSelect(updatedTeam.id, updatedTeam.remaining);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch teams:", err);
      setError(err.response?.data?.message || "Failed to load teams");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [selectedTeamId, onTeamSelect]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Expose refresh function to parent (only once)
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(() => fetchTeams(true)); // Skip cache on manual refresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value;
    if (!teamId) {
      onTeamSelect(null, 0);
      return;
    }

    const team = teams.find((t) => t.id === teamId);
    if (team) {
      onTeamSelect(team.id, team.remaining);
    }
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-600">Loading teams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">No Team Credits Available</p>
            <p className="text-xs text-blue-700 mt-1">
              You can still use your personal credits for image generation. Create or join a team to use shared team credits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Select Team (Optional)
        </label>
        <select
          value={selectedTeamId || ""}
          onChange={handleTeamChange}
          disabled={disabled}
          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <option value="">-- Select a team --</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id} disabled={team.remaining <= 0}>
              {team.name} - {team.remaining} credits remaining {team.role === 'TEAM_OWNER' ? '(Owner)' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedTeam && (
        <div className={`p-3 rounded-lg border ${
          selectedTeam.remaining > 0 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className={`w-4 h-4 ${
                selectedTeam.remaining > 0 ? 'text-emerald-600' : 'text-red-600'
              }`} />
              <span className="text-sm font-medium text-slate-900">
                {selectedTeam.name}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                selectedTeam.remaining > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {selectedTeam.remaining}
              </div>
              <div className="text-[10px] text-slate-500">
                {selectedTeam.role === 'TEAM_OWNER' ? 'Team Wallet' : `of ${selectedTeam.allocated} credits`}
              </div>
            </div>
          </div>

          {selectedTeam.remaining <= 0 && (
            <p className="text-xs text-red-600 mt-2">
              {selectedTeam.role === 'TEAM_OWNER' 
                ? '⚠️ Team has no credits. Please purchase more credits.' 
                : '⚠️ You have no remaining credits. Contact your team owner.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
