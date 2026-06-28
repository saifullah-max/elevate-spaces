'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader, User, BadgeCheck, FileUp, ShieldCheck, Sparkles, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAuthFromStorage, saveAuthToStorage } from '@/lib/auth.storage';
import type { User as AuthUser } from '@/store/slices/authSlice';
import {
  deleteProfileImage,
  updateProfileImage,
  updateSecondaryEmail,
  deleteSecondaryEmail,
  resendSecondaryEmailVerification,
} from '@/services/auth.service';
import {
  getMyPhotographerProfile,
  submitPhotographerApplication,
  uploadPhotographerDocument,
  updateMyPhotographerProfile,
  setMyAvailability,
  type PhotographerDirectoryItem,
} from '@/services/photographer.service';
import { showError, showSuccess } from '@/components/toastUtils';
import { ProfileImageCropDialog } from '@/components/ProfileImageCropDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { PaymentsTab } from '@/components/PaymentsTab';
import { requestAccountDeletion, verifyAccountDeletion } from '@/services/accountDeletion.service';

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [photographerProfile, setPhotographerProfile] = useState<PhotographerDirectoryItem | null>(null);
  const [isPhotographerLoading, setIsPhotographerLoading] = useState(false);
  const [photographerApplication, setPhotographerApplication] = useState({
    bio: '',
    availability: '',
    photographerType: '',
    yearsExperience: '',
    serviceArea: '',
    portfolioUrl: '',
    instagramUrl: '',
    websiteUrl: '',
    gearDescription: '',
    businessName: '',
    shortPitch: '',
  });
  const [profileBioInput, setProfileBioInput] = useState('');
  const [profileAvailabilityInput, setProfileAvailabilityInput] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  type DeletionStep = 'idle' | 'confirm' | 'code' | 'done';
  const [deletionStep, setDeletionStep] = useState<DeletionStep>('idle');
  const [deletionCode, setDeletionCode] = useState('');
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [deletionDeadline, setDeletionDeadline] = useState<string | null>(null);

  // Secondary email state — loaded via fresh /auth/me call because the cached
  // auth payload in localStorage may pre-date this field.
  const [secondaryEmail, setSecondaryEmail] = useState<string | null>(null);
  const [pendingSecondaryEmail, setPendingSecondaryEmail] = useState<string | null>(null);
  const [secondaryEmailInput, setSecondaryEmailInput] = useState('');
  const [secondaryEmailEditing, setSecondaryEmailEditing] = useState(false);
  const [secondaryEmailSaving, setSecondaryEmailSaving] = useState(false);
  const [secondaryEmailError, setSecondaryEmailError] = useState<string | null>(null);
  const [secondaryEmailRemoveOpen, setSecondaryEmailRemoveOpen] = useState(false);
  const [secondaryEmailRemoving, setSecondaryEmailRemoving] = useState(false);
  const [secondaryEmailResending, setSecondaryEmailResending] = useState(false);

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth?.user) {
      router.replace('/sign-in');
      return;
    }

    setUser(auth.user);
    setIsLoading(false);

    // Pull fresh profile from /auth/me. The cached auth payload in localStorage
    // can lag the real user record — e.g. when the user signed in via their
    // secondary email and the stored snapshot is older. Always trust the
    // server's PRIMARY email + secondary_email here so settings can't display
    // a stale identity.
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_BACKEND_API;
        if (!apiBase) return;
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const apiUser = data?.user;
        if (!apiUser) return;

        if (apiUser.secondary_email !== undefined) {
          setSecondaryEmail(apiUser.secondary_email || null);
        }
        if (apiUser.secondary_email_pending !== undefined) {
          setPendingSecondaryEmail(apiUser.secondary_email_pending || null);
        }

        // Reconcile the local user state with the server's truth. The primary
        // `email` is what the profile header shows; cached snapshots are
        // overridden so logging in via secondary never displays it as primary.
        setUser((current) => {
          const merged = {
            ...(current || {}),
            id: apiUser.id ?? current?.id,
            email: apiUser.email ?? current?.email,
            secondary_email: apiUser.secondary_email ?? null,
            name: apiUser.name ?? current?.name,
            role: apiUser.role ?? current?.role,
            avatarUrl: apiUser.avatar_url ?? current?.avatarUrl ?? null,
            manualAvatarUrl: apiUser.manual_avatar_url ?? current?.manualAvatarUrl ?? null,
          } as AuthUser;

          // Keep localStorage in sync so other tabs / the navbar pick up the
          // corrected primary email on the next read.
          try {
            saveAuthToStorage(merged, auth.token);
          } catch {
            // Non-fatal — UI still has the right state in memory.
          }

          return merged;
        });
      } catch {
        // Non-blocking — user can still edit and save.
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const loadPhotographerProfile = async () => {
      try {
        setIsPhotographerLoading(true);
        const profile = await getMyPhotographerProfile();
        setPhotographerProfile(profile);
        if (profile) {
          setPhotographerApplication({
            bio: profile.bio || '',
            availability: profile.availability || '',
            photographerType: profile.photographer_type || '',
            yearsExperience: profile.years_experience || '',
            serviceArea: profile.service_area || '',
            portfolioUrl: profile.portfolio_url || '',
            instagramUrl: profile.instagram_url || '',
            websiteUrl: profile.website_url || '',
            gearDescription: profile.gear_description || '',
            businessName: profile.business_name || '',
            shortPitch: profile.short_pitch || '',
          });
        }
        setProfileBioInput(profile?.bio || '');
        setProfileAvailabilityInput(profile?.availability || '');
      } catch (error: any) {
        showError(error?.message || 'Failed to load photographer profile');
      } finally {
        setIsPhotographerLoading(false);
      }
    };

    loadPhotographerProfile();
  }, [user]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setSelectedFile(file);
    setIsCropOpen(true);
    event.target.value = '';
  };

  const handleConfirmCroppedImage = async (croppedFile: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      const result = await updateProfileImage(croppedFile);
      const currentAuth = getAuthFromStorage();
      if (currentAuth?.token) {
        saveAuthToStorage(result.user, currentAuth.token);
        window.dispatchEvent(new StorageEvent('storage', { key: 'elevate_spaces_auth' }));
      }
      setUser(result.user);
      setIsCropOpen(false);
      setSelectedFile(null);
      showSuccess(result.message || 'Profile image updated successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to update profile image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProfileImage = async () => {
    if (!user?.avatarUrl) return;

    try {
      setIsUploading(true);
      const result = await deleteProfileImage();
      const currentAuth = getAuthFromStorage();
      if (currentAuth?.token) {
        saveAuthToStorage(result.user, currentAuth.token);
        window.dispatchEvent(new StorageEvent('storage', { key: 'elevate_spaces_auth' }));
      }
      setUser(result.user);
      showSuccess(result.message || 'Profile image removed successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to remove profile image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitPhotographerApplication = async () => {
    if (!photographerApplication.bio.trim()) {
      showError('Please add a short professional bio before applying.');
      return;
    }

    try {
      setIsPhotographerLoading(true);
      await submitPhotographerApplication({
        bio: photographerApplication.bio.trim(),
        availability: photographerApplication.availability.trim() || undefined,
        photographerType: photographerApplication.photographerType.trim() || undefined,
        yearsExperience: photographerApplication.yearsExperience.trim() || undefined,
        serviceArea: photographerApplication.serviceArea.trim() || undefined,
        portfolioUrl: photographerApplication.portfolioUrl.trim() || undefined,
        instagramUrl: photographerApplication.instagramUrl.trim() || undefined,
        websiteUrl: photographerApplication.websiteUrl.trim() || undefined,
        gearDescription: photographerApplication.gearDescription.trim() || undefined,
        businessName: photographerApplication.businessName.trim() || undefined,
        shortPitch: photographerApplication.shortPitch.trim() || undefined,
        document: documentFile,
      });
      showSuccess('Your profile has been submitted for review.');
      const profile = await getMyPhotographerProfile();
      setPhotographerProfile(profile);
      setDocumentFile(null);
    } catch (error: any) {
      showError(error?.message || 'Failed to submit photographer application');
    } finally {
      setIsPhotographerLoading(false);
    }
  };

  const handleSavePhotographerProfile = async () => {
    if (!photographerProfile) {
      showError('Submit your application first to create a photographer profile.');
      return;
    }

    try {
      setIsPhotographerLoading(true);
      await updateMyPhotographerProfile({
        bio: profileBioInput.trim(),
        availability: profileAvailabilityInput.trim(),
      });
      await setMyAvailability(profileAvailabilityInput.trim());
      showSuccess('Photographer profile updated.');
      const profile = await getMyPhotographerProfile();
      setPhotographerProfile(profile);
    } catch (error: any) {
      showError(error?.message || 'Failed to update photographer profile');
    } finally {
      setIsPhotographerLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setDeletionBusy(true);
    try {
      await requestAccountDeletion();
      setDeletionStep('code');
      setDeletionCode('');
      showSuccess('Verification code sent to your email.');
    } catch (error: any) {
      showError(error?.message || 'Failed to start deletion');
    } finally {
      setDeletionBusy(false);
    }
  };

  const handleVerifyDeletion = async () => {
    if (!/^\d{6}$/.test(deletionCode.trim())) {
      showError('Enter the 6-digit code from your email.');
      return;
    }
    setDeletionBusy(true);
    try {
      const result = await verifyAccountDeletion(deletionCode.trim());
      setDeletionDeadline(result.deadlineHuman);
      setDeletionStep('done');
    } catch (error: any) {
      showError(error?.message || 'Failed to verify code');
    } finally {
      setDeletionBusy(false);
    }
  };

  const handleSignOutAfterDeletion = () => {
    try {
      localStorage.removeItem('elevate_spaces_auth');
    } catch {
      // ignore
    }
    router.replace('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-24">
        <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-slate-600">Manage your profile settings and subscription billing.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {/* <TabsTrigger value="photographer">Become a Photographer</TabsTrigger> */}
            <TabsTrigger value="payments">Subscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="h-20 w-20 rounded-full border-4 border-indigo-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-xl font-semibold text-white">
                      {getInitials(user.name) || <User className="h-8 w-8" />}
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-indigo-600">{user.role}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    onClick={handlePickFile}
                    disabled={isUploading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isUploading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                    Update profile image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteProfileImage}
                    disabled={isUploading || !user.avatarUrl}
                  >
                    Remove profile image
                  </Button>
                  <p className="text-xs text-slate-500">Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-rose-900">Delete my account</h2>
                    <p className="mt-1 text-sm text-rose-900/80">
                      You can request to delete your account. We&rsquo;ll email you a 6-digit verification code to confirm.
                      Once confirmed, your account is inactive for 7 days &mdash; you can contact an admin to restore it any
                      time before then. After 7 days, all your data is permanently removed.
                    </p>
                  </div>

                  {deletionStep === 'idle' ? (
                    <Button onClick={() => setDeletionStep('confirm')} className="bg-rose-600 hover:bg-rose-700">
                      Delete my account
                    </Button>
                  ) : null}

                  {deletionStep === 'confirm' ? (
                    <div className="space-y-3 rounded-xl border border-rose-200 bg-white p-4">
                      <p className="text-sm font-semibold text-rose-900">Are you sure?</p>
                      <p className="text-sm text-rose-900/80">
                        We&rsquo;ll send a code to <strong>{user?.email}</strong>. You&rsquo;ll need to enter it to complete the request.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleRequestDeletion} disabled={deletionBusy} className="bg-rose-600 hover:bg-rose-700">
                          {deletionBusy ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Yes, email me the code
                        </Button>
                        <Button variant="outline" onClick={() => setDeletionStep('idle')} disabled={deletionBusy}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {deletionStep === 'code' ? (
                    <div className="space-y-3 rounded-xl border border-rose-200 bg-white p-4">
                      <p className="text-sm font-semibold text-rose-900">Enter the 6-digit code we just emailed you</p>
                      <input
                        value={deletionCode}
                        onChange={(event) => setDeletionCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="w-40 rounded-lg border border-rose-300 bg-white px-3 py-2 text-center text-lg tracking-[0.4em]"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleVerifyDeletion} disabled={deletionBusy || deletionCode.length !== 6} className="bg-rose-600 hover:bg-rose-700">
                          {deletionBusy ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Confirm deletion
                        </Button>
                        <Button variant="outline" onClick={handleRequestDeletion} disabled={deletionBusy}>
                          Resend code
                        </Button>
                        <Button variant="outline" onClick={() => setDeletionStep('idle')} disabled={deletionBusy}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {deletionStep === 'done' && deletionDeadline ? (
                    <div className="space-y-3 rounded-xl border border-rose-200 bg-white p-4">
                      <p className="text-sm font-semibold text-rose-900">Your account is scheduled for deletion.</p>
                      <p className="text-sm text-rose-900/80">
                        You can regain access by contacting an admin any time before{' '}
                        <strong>{deletionDeadline}</strong>. We&rsquo;ve also emailed you this deadline so you don&rsquo;t miss it.
                        After that time, all data will be permanently removed.
                      </p>
                      <Button onClick={handleSignOutAfterDeletion} className="bg-rose-600 hover:bg-rose-700">
                        Sign out
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Secondary email — optional sign-in alternative */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Secondary email</h3>
                <p className="text-sm text-slate-600">
                  Add an optional secondary email you can also sign in with. It must not already be in use by another account. We&apos;ll send a confirmation link to that address — it only becomes active once you click the link. Your primary email is notified after confirmation.
                </p>
              </div>

              {secondaryEmailEditing ? (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={secondaryEmailInput}
                    onChange={(e) => { setSecondaryEmailInput(e.target.value); setSecondaryEmailError(null); }}
                    placeholder="alternate@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  {secondaryEmailError && (
                    <p className="text-xs text-red-600">{secondaryEmailError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      disabled={secondaryEmailSaving || !secondaryEmailInput.trim()}
                      onClick={async () => {
                        setSecondaryEmailSaving(true);
                        setSecondaryEmailError(null);
                        try {
                          const result = await updateSecondaryEmail(secondaryEmailInput.trim());
                          setSecondaryEmail(result.secondaryEmail);
                          setPendingSecondaryEmail(result.pendingSecondaryEmail);
                          setSecondaryEmailEditing(false);
                          setSecondaryEmailInput('');
                          showSuccess(result.message || 'Confirmation email sent. Check your inbox.');
                        } catch (err: any) {
                          const msg = err?.response?.data?.error || err?.message || 'Failed to save secondary email';
                          setSecondaryEmailError(msg);
                        } finally {
                          setSecondaryEmailSaving(false);
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {secondaryEmailSaving ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                      {secondaryEmail ? 'Save changes' : 'Add email'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSecondaryEmailEditing(false);
                        setSecondaryEmailInput('');
                        setSecondaryEmailError(null);
                      }}
                      disabled={secondaryEmailSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {secondaryEmail && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{secondaryEmail}</p>
                        <p className="text-xs text-emerald-700">Confirmed — you can sign in with this email.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSecondaryEmailInput(secondaryEmail || '');
                            setSecondaryEmailEditing(true);
                          }}
                        >
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSecondaryEmailRemoveOpen(true)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {pendingSecondaryEmail && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{pendingSecondaryEmail}</p>
                        <p className="text-xs text-amber-700">Pending confirmation — open the link we sent to this address.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={secondaryEmailResending}
                          onClick={async () => {
                            setSecondaryEmailResending(true);
                            try {
                              const result = await resendSecondaryEmailVerification();
                              showSuccess(result.message || 'Confirmation email resent.');
                            } catch (err: any) {
                              showError(err?.response?.data?.error || err?.message || 'Failed to resend confirmation');
                            } finally {
                              setSecondaryEmailResending(false);
                            }
                          }}
                        >
                          {secondaryEmailResending ? 'Resending…' : 'Resend link'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSecondaryEmailRemoveOpen(true)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {!secondaryEmail && !pendingSecondaryEmail && (
                    <Button
                      variant="outline"
                      onClick={() => setSecondaryEmailEditing(true)}
                    >
                      Add secondary email
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Remove-secondary-email confirmation modal — matches the
                DeleteTeamModal pattern used elsewhere in the app. */}
            <Dialog open={secondaryEmailRemoveOpen} onOpenChange={(open) => {
              if (!secondaryEmailRemoving) setSecondaryEmailRemoveOpen(open);
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Remove secondary email
                  </DialogTitle>
                  <DialogDescription>
                    {secondaryEmail ? (
                      <>Remove <b>{secondaryEmail}</b> from this account? You&apos;ll no longer be able to sign in with it.</>
                    ) : pendingSecondaryEmail ? (
                      <>Cancel the pending confirmation for <b>{pendingSecondaryEmail}</b>? The link we sent will stop working.</>
                    ) : (
                      "Remove the secondary email from this account?"
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSecondaryEmailRemoveOpen(false)}
                    disabled={secondaryEmailRemoving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={secondaryEmailRemoving}
                    onClick={async () => {
                      setSecondaryEmailRemoving(true);
                      try {
                        const result = await deleteSecondaryEmail();
                        setSecondaryEmail(null);
                        setPendingSecondaryEmail(null);
                        setSecondaryEmailRemoveOpen(false);
                        showSuccess(result.message || 'Secondary email removed');
                      } catch (err: any) {
                        showError(err?.response?.data?.error || err?.message || 'Failed to remove secondary email');
                      } finally {
                        setSecondaryEmailRemoving(false);
                      }
                    }}
                  >
                    {secondaryEmailRemoving ? 'Removing…' : 'Remove'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <PaymentsTab />
          </TabsContent>

          <TabsContent value="photographer" className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Become a Photographer</h2>
                  <p className="text-sm text-slate-600">
                    Already signed up as a normal user? You can apply here to join the photographer marketplace.
                  </p>
                </div>
              </div>

              {photographerProfile ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BadgeCheck className="h-4 w-4 text-indigo-600" />
                    Status: {String(photographerProfile.application_status || (photographerProfile.approved ? 'APPROVED' : 'SUBMITTED')).replace(/_/g, ' ').toLowerCase()}
                  </div>

                  <div className="grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Bio</span>
                      <textarea
                        value={photographerApplication.bio}
                        onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, bio: e.target.value }))}
                        className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                        placeholder="Tell clients about your experience, photography style, and coverage area"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input value={photographerApplication.businessName} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, businessName: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Business name" />
                      <input value={photographerApplication.photographerType} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, photographerType: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Photographer type" />
                      <input value={photographerApplication.yearsExperience} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, yearsExperience: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Years of experience" />
                      <input value={photographerApplication.serviceArea} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, serviceArea: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Service area" />
                      <input value={photographerApplication.portfolioUrl} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, portfolioUrl: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Portfolio URL" />
                      <input value={photographerApplication.instagramUrl} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, instagramUrl: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Instagram URL" />
                      <input value={photographerApplication.websiteUrl} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, websiteUrl: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Website URL" />
                      <input value={photographerApplication.availability} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, availability: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Availability" />
                    </div>

                    <textarea value={photographerApplication.shortPitch} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, shortPitch: e.target.value }))} className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Why should clients hire you?" />
                    <textarea value={photographerApplication.gearDescription} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, gearDescription: e.target.value }))} className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Gear / camera / equipment details" />
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <FileUp className="h-4 w-4 text-indigo-600" />
                      Verification document
                    </div>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={handleSubmitPhotographerApplication} disabled={isPhotographerLoading} className="bg-indigo-600 hover:bg-indigo-700">
                      {isPhotographerLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                      Apply as Photographer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div className="grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Professional Bio</span>
                      <textarea
                        value={photographerApplication.bio}
                        onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, bio: e.target.value }))}
                        className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                        placeholder="Tell clients about your experience, photography style, and coverage area"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input value={photographerApplication.businessName} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, businessName: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Business name" />
                      <input value={photographerApplication.photographerType} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, photographerType: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Photographer type" />
                      <input value={photographerApplication.yearsExperience} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, yearsExperience: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Years of experience" />
                      <input value={photographerApplication.serviceArea} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, serviceArea: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Service area" />
                      <input value={photographerApplication.portfolioUrl} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, portfolioUrl: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Portfolio URL" />
                      <input value={photographerApplication.instagramUrl} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, instagramUrl: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Instagram URL" />
                      <input value={photographerApplication.websiteUrl} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, websiteUrl: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Website URL" />
                      <input value={photographerApplication.availability} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, availability: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Availability" />
                    </div>

                    <textarea value={photographerApplication.shortPitch} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, shortPitch: e.target.value }))} className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Why should clients hire you?" />
                    <textarea value={photographerApplication.gearDescription} onChange={(e) => setPhotographerApplication((previous) => ({ ...previous, gearDescription: e.target.value }))} className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Gear / camera / equipment details" />
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <FileUp className="h-4 w-4 text-indigo-600" />
                      Verification document
                    </div>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-xs text-slate-500">Upload it once, together with your application.</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={handleSubmitPhotographerApplication} disabled={isPhotographerLoading} className="bg-indigo-600 hover:bg-indigo-700">
                      {isPhotographerLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                      Apply as Photographer
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                {photographerProfile
                  ? 'Your profile has been submitted. You can track the current status below and update the details if the admin asks for more information.'
                  : 'Once approved, your account can participate in the photographer marketplace without needing a new signup.'}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProfileImageCropDialog
        open={isCropOpen}
        onOpenChange={(open) => {
          setIsCropOpen(open);
          if (!open) {
            setSelectedFile(null);
          }
        }}
        sourceFile={selectedFile}
        uploading={isUploading}
        onConfirm={handleConfirmCroppedImage}
      />
    </div>
  );
}