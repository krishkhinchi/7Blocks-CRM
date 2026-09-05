import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Users,
  Key,
  Mail,
  Tag,
  Shield,
  Plus,
  Camera,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { useToast } from '../../stores/toast';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin, updateUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4f46e5');

  // Self-profile state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Role Management state
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: any; newRole: string } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Admin Edit Member Modal state
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<'ADMIN' | 'MANAGER' | 'SALES_REP'>('SALES_REP');
  const [editMemberActive, setEditMemberActive] = useState(true);
  const [isSavingMember, setIsSavingMember] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [uRes, tRes, eRes] = await Promise.all([
        api.get(isAdmin ? '/users?includeInactive=true' : '/users'),
        api.get('/tags'),
        api.get('/emails/status')
      ]);
      setUsers(uRes.data.data);
      setTags(tRes.data.data);
      setEmailStatus(eRes.data.data);
    } catch {
      // ignore
    }
  };

  // Self Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      error('Name cannot be empty');
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      error('Please provide a valid email address');
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await api.patch('/users/profile', {
        name: profileName.trim(),
        email: profileEmail.trim()
      });
      const updated = res.data.data;
      updateUser({ name: updated.name, email: updated.email });
      success('Profile updated successfully');
      fetchSettings();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Profile Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      error('Please select a valid image (PNG, JPEG, or WebP)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      error('Image file must be under 2MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/users/avatar', formData);
      const newAvatar = res.data.data.avatar;
      updateUser({ avatar: newAvatar });
      success('Profile photo updated successfully');
      fetchSettings();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Profile Photo
  const handleRemovePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      await api.patch('/users/profile', { avatar: null });
      updateUser({ avatar: null });
      success('Profile photo removed');
      fetchSettings();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to remove photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Open Edit Member Modal
  const handleOpenEditMember = (member: any) => {
    setEditingMember(member);
    setEditMemberName(member.name);
    setEditMemberEmail(member.email);
    setEditMemberRole(member.role);
    setEditMemberActive(member.isActive ?? true);
  };

  // Save Edit Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      setIsSavingMember(true);
      const res = await api.patch(`/users/${editingMember.id}`, {
        name: editMemberName.trim(),
        email: editMemberEmail.trim(),
        role: editMemberRole,
        isActive: editMemberActive
      });

      success(`Member ${res.data.data.name} updated successfully`);
      setEditingMember(null);
      fetchSettings();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update member');
    } finally {
      setIsSavingMember(false);
    }
  };

  // Confirm Role Change
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;

    try {
      setIsUpdatingRole(true);
      await api.patch(`/users/${roleChangeTarget.user.id}/role`, {
        role: roleChangeTarget.newRole
      });
      success(`Role updated to ${roleChangeTarget.newRole.replace('_', ' ')} for ${roleChangeTarget.user.name}`);
      setRoleChangeTarget(null);
      fetchSettings();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to change role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Quick Toggle Member Active/Inactive Status
  const handleToggleMemberStatus = async (targetUser: any) => {
    const newStatus = !targetUser.isActive;
    try {
      await api.patch(`/users/${targetUser.id}`, { isActive: newStatus });
      success(`Account ${newStatus ? 'activated' : 'deactivated'} for ${targetUser.name}`);
      fetchSettings();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update account status');
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await api.post('/tags', { name: newTagName, color: newTagColor });
      success('Tag created successfully');
      setNewTagName('');
      fetchSettings();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to create tag');
    }
  };

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Manager';
      case 'SALES_REP':
      default:
        return 'Member (Sales Rep)';
    }
  };

  const hasProfileChanges =
    profileName.trim() !== (user?.name || '') ||
    profileEmail.trim() !== (user?.email || '');

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" />
          <span>System & Organization Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage team members, roles, permissions, profile details, tags, and email architecture.
        </p>
      </div>

      {/* Profile Overview & Self-Editing */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-400" />
            <span>Your Account Profile</span>
          </h3>
          <Badge variant={user?.role === 'ADMIN' ? 'danger' : user?.role === 'MANAGER' ? 'warning' : 'info'}>
            {user?.role?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Avatar Upload / Preview Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="relative group">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-500/50 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-200">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : '7B'}
              </div>
            )}
            {isUploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <p className="text-xs font-semibold text-slate-200">Profile Picture</p>
            <p className="text-[11px] text-slate-400">
              Supports PNG, JPEG, or WebP (max 2MB).
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                className="sr-only"
                id="avatar-upload-input"
              />
              <label
                htmlFor="avatar-upload-input"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-brand-400" />
                <span>{user?.avatar ? 'Change Photo' : 'Upload Photo'}</span>
              </label>

              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 block text-[11px] font-medium">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block text-[11px] font-medium">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block text-[11px] font-medium">Assigned Role</label>
              <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2 text-slate-400 flex items-center justify-between">
                <span>{formatRoleLabel(user?.role || 'SALES_REP')}</span>
                <span title="Role is managed by an Administrator" className="text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!hasProfileChanges || isSavingProfile}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shadow-sm"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Team Members List & Role Management */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>
                {isAdmin ? 'Team Members & Role Management' : 'Team Directory'} ({users.length})
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAdmin
                ? 'Assign roles (Admin, Manager, Member), edit member info, or toggle active status.'
                : 'Directory of active team members across the organization.'}
            </p>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-semibold text-brand-400 bg-brand-950/60 border border-brand-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Admin Access</span>
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {users.map(u => (
            <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-300">
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-200">{u.name}</p>
                    {u.id === user?.id && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">You</span>
                    )}
                    {u.isActive === false && (
                      <span className="text-[10px] bg-rose-950/80 text-rose-400 border border-rose-800/60 px-1.5 py-0.2 rounded font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{u.email}</p>
                </div>
              </div>

              {/* Admin controls or read-only view */}
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    {/* Role Selector */}
                    <select
                      value={u.role}
                      onChange={e => setRoleChangeTarget({ user: u, newRole: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SALES_REP">Member (Sales Rep)</option>
                    </select>

                    {/* Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleMemberStatus(u)}
                      title={u.isActive ? 'Deactivate account' : 'Activate account'}
                      className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        u.isActive
                          ? 'text-slate-400 hover:text-amber-400 border-slate-800 hover:border-amber-700/60 bg-slate-950'
                          : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/30 hover:bg-emerald-900/40'
                      }`}
                    >
                      {u.isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </button>

                    {/* Edit Member Details */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditMember(u)}
                      title="Edit member details"
                      className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Badge variant={u.role === 'ADMIN' ? 'danger' : u.role === 'MANAGER' ? 'warning' : 'info'}>
                    {formatRoleLabel(u.role)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {roleChangeTarget && (
        <Modal
          isOpen={!!roleChangeTarget}
          onClose={() => setRoleChangeTarget(null)}
          title="Confirm Role Change"
          subtitle={`Modify organizational permissions for ${roleChangeTarget.user.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-200">Are you sure you want to change this role?</p>
                <p className="text-amber-400/90 leading-relaxed">
                  Changing <span className="font-bold text-slate-100">{roleChangeTarget.user.name}</span> from{' '}
                  <span className="font-semibold text-slate-200">{formatRoleLabel(roleChangeTarget.user.role)}</span> to{' '}
                  <span className="font-semibold text-brand-300">{formatRoleLabel(roleChangeTarget.newRole)}</span> will immediately update their access permissions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isUpdatingRole ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Role Change</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Edit Member Modal */}
      {editingMember && (
        <Modal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          title={`Edit Member: ${editingMember.name}`}
          subtitle="Update member details, role assignment, and active status"
          maxWidth="md"
        >
          <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 block text-[11px] font-medium">Name</label>
              <input
                type="text"
                value={editMemberName}
                onChange={e => setEditMemberName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block text-[11px] font-medium">Email</label>
              <input
                type="email"
                value={editMemberEmail}
                onChange={e => setEditMemberEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block text-[11px] font-medium">Role</label>
              <select
                value={editMemberRole}
                onChange={e => setEditMemberRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="SALES_REP">Member (Sales Rep)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editMemberActiveCheck"
                checked={editMemberActive}
                onChange={e => setEditMemberActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="editMemberActiveCheck" className="text-slate-300 font-medium cursor-pointer">
                Account Active (uncheck to deactivate access)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingMember}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingMember ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Tag Management */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" />
          <span>Configurable Lead & Deal Tags</span>
        </h3>

        {/* Existing Tags Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map(t => (
            <span
              key={t.id}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border"
              style={{
                backgroundColor: `${t.color}15`,
                borderColor: `${t.color}30`,
                color: t.color
              }}
            >
              {t.name}
            </span>
          ))}
        </div>

        {/* Add Tag Form */}
        <form onSubmit={handleCreateTag} className="flex items-center gap-3 pt-2 text-xs">
          <input
            type="text"
            placeholder="New tag label (e.g. Mumbai, High Value, Demo Sent)..."
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-brand-500 focus:outline-none"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={e => setNewTagColor(e.target.value)}
            className="w-10 h-8 rounded-lg bg-slate-950 border border-slate-800 p-0.5 cursor-pointer"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tag</span>
          </button>
        </form>
      </div>

      {/* Email Integration Status */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
        <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
          <Mail className="w-4 h-4 text-cyan-400" />
          <span>Email Architecture & Webhooks</span>
        </h3>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">SMTP / SendGrid Connection</span>
            <Badge variant={emailStatus?.isConfigured ? 'success' : 'warning'}>
              {emailStatus?.isConfigured ? 'Active' : 'Unconfigured'}
            </Badge>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` or `SENDGRID_API_KEY` in your `.env` file to enable outbound email delivery.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-500">
            Incoming Webhook URL: <code className="text-cyan-400">POST /api/emails/webhook</code>
          </div>
        </div>
      </div>
    </div>
  );
};
