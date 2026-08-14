import React, { useState, useEffect } from 'react';
import { UserProfile, DailyTask, UserStats } from '../types';
import {
  setDailyTask,
  getDailyTask,
  searchUsersByUsername,
  grantAdminStatus,
  revokeAdminStatus,
  getUserCheckInMap
} from '../lib/services';
import { getTodayStr, formatDateDisplay, calculateUserStats } from '../lib/utils';
import { HeatMap } from './HeatMap';
import {
  ShieldCheck,
  Search,
  Check,
  UserCheck,
  UserX,
  Calendar,
  ShieldAlert,
  Flame,
  Users
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: UserProfile;
  todayTask: DailyTask | null;
  allTaskDates: string[];
  onTaskUpdated: (task: DailyTask) => void;
  onAdminUpdated?: () => void;
  onSelectDate: (dateStr: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  todayTask,
  allTaskDates,
  onTaskUpdated,
  onAdminUpdated,
  onSelectDate
}) => {
  const todayStr = getTodayStr();

  // Task form state
  const [taskDate, setTaskDate] = useState(todayStr);
  const [taskDescription, setTaskDescription] = useState(todayTask?.description || '');
  const [savingTask, setSavingTask] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState(false);

  // Member Lookup state
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserStats, setSelectedUserStats] = useState<UserStats | null>(null);
  const [loadingMemberData, setLoadingMemberData] = useState(false);

  // Admin action modal state (for grant or revoke)
  const [adminActionUser, setAdminActionUser] = useState<{
    user: UserProfile;
    action: 'grant' | 'revoke';
  } | null>(null);
  const [processingAdminAction, setProcessingAdminAction] = useState(false);
  const [adminFeedbackMsg, setAdminFeedbackMsg] = useState<string | null>(null);

  // Load task for taskDate when taskDate changes
  useEffect(() => {
    let active = true;
    async function loadTaskForDate() {
      try {
        const existingTask = await getDailyTask(taskDate);
        if (active) {
          setTaskDescription(existingTask?.description || '');
        }
      } catch (err) {
        console.error('Error fetching task for date:', err);
      }
    }
    loadTaskForDate();
    return () => {
      active = false;
    };
  }, [taskDate]);

  // Real-time or debounced user search
  const loadUsers = async () => {
    try {
      const results = await searchUsersByUsername(searchQuery);
      setFoundUsers(results);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  useEffect(() => {
    let active = true;
    async function doSearch() {
      try {
        const results = await searchUsersByUsername(searchQuery);
        if (active) {
          setFoundUsers(results);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      }
    }
    doSearch();
    return () => {
      active = false;
    };
  }, [searchQuery]);

  // Load stats when a member is selected
  const handleSelectMember = async (user: UserProfile) => {
    setSelectedUser(user);
    setLoadingMemberData(true);
    try {
      const history = await getUserCheckInMap(user.uid);
      const computedStats = calculateUserStats(history, allTaskDates);
      setSelectedUserStats(computedStats);
    } catch (err) {
      console.error('Error loading member stats:', err);
    } finally {
      setLoadingMemberData(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;
    setSavingTask(true);
    setTaskSuccessMsg(false);

    try {
      const updated = await setDailyTask(taskDate, taskDescription, currentUser.uid);
      onTaskUpdated(updated);
      setTaskSuccessMsg(true);
      setTimeout(() => setTaskSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Error saving daily task:', err);
    } finally {
      setSavingTask(false);
    }
  };

  const handleConfirmAdminAction = async () => {
    if (!adminActionUser) return;
    setProcessingAdminAction(true);
    const { user, action } = adminActionUser;

    try {
      if (action === 'grant') {
        await grantAdminStatus(user.uid);
        setAdminFeedbackMsg(`Admin privileges successfully granted to @${user.username}! You remain an admin.`);
      } else {
        await revokeAdminStatus(user.uid);
        setAdminFeedbackMsg(`Admin privileges revoked from @${user.username}.`);
      }

      // Update local user list state
      setFoundUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, isAdmin: action === 'grant' } : u))
      );

      // Update selected user if currently viewed
      if (selectedUser && selectedUser.uid === user.uid) {
        setSelectedUser((prev) => (prev ? { ...prev, isAdmin: action === 'grant' } : null));
      }

      if (onAdminUpdated) {
        onAdminUpdated();
      }

      setAdminActionUser(null);
      setTimeout(() => setAdminFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Error modifying admin status:', err);
    } finally {
      setProcessingAdminAction(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-black text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-neutral-800 flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Admin Status Active • Multi-Admin Enabled</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Group Admin Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Post daily tasks, inspect member streak histories, and grant admin permissions to other members.
          </p>
        </div>
      </div>

      {/* Feedback message banner if any action happened */}
      {adminFeedbackMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{adminFeedbackMsg}</span>
        </div>
      )}

      {/* 1. Create or Edit Daily Task Section */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-900 dark:text-white" />
            <span>Set / Edit Daily Task</span>
          </h2>
          <span className="text-xs font-mono text-slate-400 dark:text-neutral-500">
            {formatDateDisplay(taskDate)}
          </span>
        </div>

        <form onSubmit={handleSaveTask} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">
                Target Date
              </label>
              <input
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">
                Task Description
              </label>
              <input
                type="text"
                required
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="e.g. Write 500 words or commit a GitHub feature PR"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {taskSuccessMsg && (
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center space-x-1">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Task updated successfully for {taskDate}!</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={savingTask}
              className="py-2.5 px-6 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-2 min-h-[44px]"
            >
              {savingTask ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Daily Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Member Lookup & Multi-Admin Permissions */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-slate-900 dark:text-white" />
              <span>Members & Admin Permissions</span>
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 font-mono">
              Multiple admins supported
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Search members to inspect their check-in heat maps or grant/revoke admin permissions. Granting admin to another member keeps your own admin access intact.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or name (e.g. @janedoe)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>

        {/* Search Results / Member Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
          {foundUsers.map((member) => {
            const isSelf = member.uid === currentUser.uid;
            return (
              <div
                key={member.uid}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  selectedUser?.uid === member.uid
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow'
                    : 'bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 hover:border-slate-400'
                }`}
              >
                <div
                  onClick={() => handleSelectMember(member)}
                  className="cursor-pointer flex-1 flex items-center space-x-3 pr-2"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold leading-none">{member.name}</span>
                      {isSelf && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] opacity-70 font-mono leading-none mt-0.5 flex items-center space-x-1">
                      <span>@{member.username}</span>
                      {member.isAdmin && (
                        <span className="font-bold text-amber-500 dark:text-amber-400">
                          • Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectMember(member)}
                    className="px-2.5 py-1 bg-white/20 dark:bg-black/20 rounded-lg text-[10px] font-bold tracking-wider uppercase"
                  >
                    Inspect
                  </button>

                  {!isSelf && (
                    <>
                      {member.isAdmin ? (
                        <button
                          type="button"
                          onClick={() => setAdminActionUser({ user: member, action: 'revoke' })}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center space-x-1"
                          title="Revoke Admin Permission"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAdminActionUser({ user: member, action: 'grant' })}
                          className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold tracking-wider uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center space-x-1"
                          title="Grant Admin Permission (keeps you admin as well)"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>+ Admin</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {foundUsers.length === 0 && (
            <div className="col-span-2 text-center py-6 text-xs text-slate-400 dark:text-neutral-500">
              No members found matching "{searchQuery}".
            </div>
          )}
        </div>

        {/* Detailed Inspected Member Profile View */}
        {selectedUser && (
          <div className="pt-6 border-t border-slate-200 dark:border-neutral-800 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs font-mono text-slate-400 dark:text-neutral-500 uppercase">
                  Inspecting Profile
                </span>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {selectedUser.name}
                  </h3>
                  <span className="text-xs font-mono font-normal text-slate-500 dark:text-neutral-400">
                    (@{selectedUser.username})
                  </span>
                  {selectedUser.isAdmin && (
                    <span className="px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold tracking-wider uppercase flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Admin</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  "{selectedUser.whatTheyDo || 'Accountability Member'}"
                </p>
              </div>

              {/* Admin Action Button in Inspector */}
              {selectedUser.uid !== currentUser.uid && (
                <div>
                  {selectedUser.isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setAdminActionUser({ user: selectedUser, action: 'revoke' })}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Revoke Admin Permission</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdminActionUser({ user: selectedUser, action: 'grant' })}
                      className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Grant Admin Permission</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {loadingMemberData ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-neutral-500 font-mono">
                Loading check-in history...
              </div>
            ) : selectedUserStats ? (
              <div className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono uppercase">
                      Current Streak
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedUserStats.currentStreak} days
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono uppercase">
                      Longest Streak
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedUserStats.longestStreak} days
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono uppercase">
                      Total Completed
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedUserStats.completedTasks} tasks
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 font-mono">
                    Member Heat Map
                  </div>
                  <HeatMap
                    history={selectedUserStats.history}
                    allTaskDates={allTaskDates}
                    onSelectDate={onSelectDate}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Grant / Revoke Admin Confirmation Modal */}
      {adminActionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
              {adminActionUser.action === 'grant' ? (
                <ShieldCheck className="w-6 h-6 text-white dark:text-black" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-white dark:text-black" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {adminActionUser.action === 'grant'
                  ? 'Grant Admin Permissions?'
                  : 'Revoke Admin Permissions?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                {adminActionUser.action === 'grant' ? (
                  <>
                    You are granting group Admin permissions to{' '}
                    <strong className="text-slate-900 dark:text-white">
                      @{adminActionUser.user.username}
                    </strong>{' '}
                    ({adminActionUser.user.name}).
                  </>
                ) : (
                  <>
                    You are removing group Admin permissions from{' '}
                    <strong className="text-slate-900 dark:text-white">
                      @{adminActionUser.user.username}
                    </strong>{' '}
                    ({adminActionUser.user.name}).
                  </>
                )}
              </p>

              {adminActionUser.action === 'grant' ? (
                <div className="text-xs text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-900 p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>You will remain an Admin as well.</span>
                  </div>
                  <div className="text-slate-500 dark:text-neutral-400 text-[11px]">
                    @{adminActionUser.user.username} will now be able to set daily tasks and manage group members alongside you.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-neutral-400 italic bg-slate-100 dark:bg-neutral-900 p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
                  They will become a regular member and will no longer have access to the Admin Control Panel.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setAdminActionUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={processingAdminAction}
                onClick={handleConfirmAdminAction}
                className={`px-5 py-2.5 font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 ${
                  adminActionUser.action === 'grant'
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {processingAdminAction ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>
                      {adminActionUser.action === 'grant' ? 'Confirm & Grant Admin' : 'Confirm & Revoke'}
                    </span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

