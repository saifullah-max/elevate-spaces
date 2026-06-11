'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader, Trash2 } from 'lucide-react';
import { getMyProjects } from '@/services/projects.service';
import { getTeams, getTeamsByUserId } from '@/services/teams.service';
import { addProjectPhotographer, removeProjectPhotographer } from '@/services/projects.service';
import { PhotographerSearchSelect, type PhotographerOption } from './PhotographerSearchSelect';
import { getAuthFromStorage } from '@/lib/auth.storage';
import { showError, showInfo } from '@/components/toastUtils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export default function ProjectPhotographerManager({ open, onOpenChange, projectId }: Props) {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<any | null>(null);
  const [team, setTeam] = useState<any | null>(null);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState<string>('');
  const [photographerEmail, setPhotographerEmail] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      loadData();
    }
  }, [open, projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const resp = await getMyProjects();
      const proj = (resp.projects || []).find((p: any) => p.id === projectId) || null;
      setProject(proj);

      if (proj?.team_id) {
        const auth = getAuthFromStorage();
        const userId = auth?.user?.id;
        const [ownedTeams, memberTeams] = await Promise.all([
          getTeams(),
          userId ? getTeamsByUserId(userId) : Promise.resolve({ success: true, message: "", teams: [] }),
        ]);
        const mergedTeams = [...(ownedTeams.teams || []), ...(memberTeams.teams || [])];
        const uniqueTeams = mergedTeams.filter((item: any, index: number, self: any[]) => self.findIndex((team) => team.id === item.id) === index);
        const found = uniqueTeams.find((t: any) => t.id === proj.team_id) || null;
        setTeam(found || proj.team || null);
      } else {
        setTeam(null);
      }

      const photographerMember = proj?.members?.find((m: any) => m.role === 'PHOTOGRAPHER' || m.role === 'TEAM_PHOTOGRAPHER');
      if (photographerMember) {
        setSelectedPhotographerId(photographerMember.user?.id || photographerMember.user_id || '');
      } else {
        setSelectedPhotographerId('');
      }
      setPhotographerEmail('');
    } catch (err: any) {
      showError(err?.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const teamPhotographers = useMemo<PhotographerOption[]>(() => {
    if (!team) return [];
    return (team.members || [])
      .filter((member: any) => {
        const roleName = String(member.role?.name || member.role || '').toUpperCase();
        return roleName === 'TEAM_PHOTOGRAPHER' || roleName === 'PHOTOGRAPHER';
      })
      .map((member: any) => ({
        id: member.user?.id || member.user_id,
        label: member.user?.name || member.user?.email || 'Unknown photographer',
        email: member.user?.email || '',
        secondaryLabel: member.role?.name || 'PHOTOGRAPHER',
      }))
      .filter((opt: PhotographerOption) => Boolean(opt.id) && Boolean(opt.email));
  }, [team]);

  const isPersonalProject = Boolean(project && !project.team_id);
  const resolvedTeamName = team?.name || project?.team?.name || '—';

  const currentPhotographer = useMemo(() => {
    return project?.members?.find((m: any) => (m.role === 'PHOTOGRAPHER' || m.role === 'TEAM_PHOTOGRAPHER')) || null;
  }, [project]);

  const currentUserId = getAuthFromStorage()?.user?.id || null;

  const currentUserRoleInTeam = useMemo(() => {
    if (!team || !currentUserId) return null;
    if (team.owner_id === currentUserId) return 'TEAM_OWNER';
    const membership = team.members?.find((member: any) => member.user_id === currentUserId);
    return String(membership?.role?.name || '').toUpperCase() || null;
  }, [team, currentUserId]);

  const canManage = useMemo(() => {
    if (!project) return false;
    if (isPersonalProject) {
      return project.created_by_user_id === currentUserId;
    }
    const isOwner = team?.owner_id && currentUserId && team.owner_id === currentUserId;
    const isCreator = project.created_by_user_id && currentUserId && project.created_by_user_id === currentUserId;
    const isAdminOrMember = ["TEAM_ADMIN", "ADMIN", "TEAM_MEMBER", "MEMBER"].includes(currentUserRoleInTeam || "");
    return Boolean(isOwner || isCreator || isAdminOrMember);
  }, [project, team, currentUserId, currentUserRoleInTeam, isPersonalProject]);

  const handleAddTeamPhotographer = async () => {
    if (!selectedPhotographerId) return;
    if (currentPhotographer) {
      showError('A photographer is already assigned. Remove them first.');
      return;
    }
    setActionLoading(true);
    try {
      await addProjectPhotographer({ projectId, photographerId: selectedPhotographerId });
      showInfo('Photographer added to project');
      await loadData();
    } catch (err: any) {
      showError(err?.message || 'Failed to add photographer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPersonalPhotographer = async () => {
    const email = photographerEmail.trim();
    if (!email) {
      showError('Please enter a photographer email');
      return;
    }
    if (currentPhotographer) {
      showError('A photographer is already assigned. Remove them first.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await addProjectPhotographer({ projectId, photographerEmail: email });
      showInfo(result.message || 'Photographer added');
      await loadData();
    } catch (err: any) {
      showError(err?.message || 'Failed to add photographer');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRemove = () => {
    if (!currentPhotographer) return;
    setShowConfirmRemove(true);
  };

  const handleRemove = async () => {
    if (!currentPhotographer) return;
    setActionLoading(true);
    try {
      await removeProjectPhotographer(projectId, currentPhotographer.user?.id || currentPhotographer.user_id);
      showInfo('Photographer removed');
      await loadData();
    } catch (err: any) {
      showError(err?.message || 'Failed to remove photographer');
    } finally {
      setActionLoading(false);
      setShowConfirmRemove(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Photographer</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {!project && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded">Project not found</div>
            )}

            {project && !canManage && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                {isPersonalProject
                  ? 'Only the project creator can manage photographers'
                  : 'Only the team owner or project creator can manage photographers'}
              </div>
            )}

            {project && canManage && (
              <>
                {!isPersonalProject && (
                  <div>
                    <p className="text-sm font-semibold">Team: {resolvedTeamName}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold">Current photographer</p>
                  {currentPhotographer ? (
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-semibold">{currentPhotographer.user?.name || currentPhotographer.user?.email}</div>
                        <div className="text-xs text-slate-500">{currentPhotographer.user?.email}</div>
                      </div>
                      <Button variant="outline" onClick={confirmRemove} disabled={actionLoading}>
                        {actionLoading ? 'Removing...' : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2 text-sm text-slate-600">No photographer assigned yet.</div>
                  )}
                </div>

                {isPersonalProject ? (
                  <div className="space-y-2">
                    <Label htmlFor="personal-photographer-email">Add photographer by email</Label>
                    <Input
                      id="personal-photographer-email"
                      type="email"
                      placeholder="photographer@email.com"
                      value={photographerEmail}
                      onChange={(e) => setPhotographerEmail(e.target.value)}
                      disabled={actionLoading || !!currentPhotographer}
                    />
                    <p className="text-xs text-slate-500">
                      If the person already has an account they'll be added immediately and notified by email. Otherwise an invitation email will be sent.
                    </p>
                  </div>
                ) : (
                  <div>
                    <PhotographerSearchSelect
                      options={teamPhotographers}
                      value={selectedPhotographerId}
                      onValueChange={setSelectedPhotographerId}
                      label="Photographer (optional)"
                      placeholder="Search team photographers"
                      searchPlaceholder="Search photographers by name or email"
                      disabled={actionLoading || !!currentPhotographer}
                      emptyText="No photographers available in this team"
                      helperText={teamPhotographers.length > 0 ? "Only photographers who already belong to this team appear here." : undefined}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {isPersonalProject ? (
                    <Button
                      onClick={handleAddPersonalPhotographer}
                      disabled={!photographerEmail.trim() || !!currentPhotographer || actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? 'Saving...' : 'Add Photographer'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddTeamPhotographer}
                      disabled={!selectedPhotographerId || !!currentPhotographer || actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? 'Adding...' : 'Add Photographer'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Close</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
      <Dialog open={showConfirmRemove} onOpenChange={setShowConfirmRemove}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove photographer?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the assigned photographer from this project? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowConfirmRemove(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleRemove} disabled={actionLoading} className="bg-red-600 hover:bg-red-700">
              {actionLoading ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
