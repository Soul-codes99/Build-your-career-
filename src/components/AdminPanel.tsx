import React, { useState, useEffect } from 'react';
import { UserProfile, DailyTask, UserStats } from '../types';
import {
  setDailyTask,
  getDailyTask,
  searchUsersByUsername,
  transferAdminStatus,
  getUserCheckInMap
} from '../lib/services';
import { getTodayStr, formatDateDisplay, calculateUserStats } from '../lib/utils';
import { HeatMap } from './HeatMap';
import { ShieldCheck, Search, Check, AlertTriangle, UserCheck, Calendar, Flame, Award, ArrowRight } from 'lucide-react';

interface AdminPanelProps {
  currentUser: UserProfile;
  todayTask: DailyTask | null;
  allTaskDates: string[];
  onTaskUpdated: (task: DailyTask) => void;
  onAdminTransferred: (newAdminUid: string) => void;
  onSelectDate: (dateStr: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  todayTask,
  allTaskDates,
  onTaskUpdated,
  onAdminTransferred,
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

  // Transfer Admin modal state
  const [userToMakeAdmin, setUserToMakeAdmin] = useState<UserProfile | null>(null);
  const [transferring, setTransferring] = useState(false);

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
  useEffect(() => {
    let active = true;
    async function doSearch() {
      try {
        const results = await searchUsersByUsername(searchQuery);
        if (active) {
          // Filter out current admin from user list if desired, or keep all
          setFoundUsers(results.filter((u) => u.uid !== currentUser.uid));
        }
      } catch (err) {
        console.error('Error searching users:', err);
      }
    }
    doSearch();
    return () => {
      active = false;
    };
  }, [searchQuery, currentUser.uid]);

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

  const handleConfirmTransferAdmin = async () => {
    if (!userToMakeAdmin) return;
    setTransferring(true);
    try {
      await transferAdminStatus(currentUser.uid, userToMakeAdmin.uid);
      onAdminTransferred(userToMakeAdmin.uid);
      setUserToMakeAdmin(null);
    } catch (err) {
      console.error('Error transferring admin status:', err);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-black text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-neutral-800 flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Admin Status Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Group Admin Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Post daily tasks, inspect member streak histories, or transfer admin authority.
          </p>
        </div>
      </div>

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

      {/* 2. Member Lookup & Profile Inspector */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Search className="w-5 h-5 text-slate-900 dark:text-white" />
            <span>Member Profile Inspector</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Search any member by typing their username to see join date, streaks, heat map, and check-in history.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
          {foundUsers.map((member) => (
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
                  <div className="text-xs font-bold leading-none">{member.name}</div>
                  <div className="text-[10px] opacity-70 font-mono leading-none mt-0.5">
                    @{member.username}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSelectMember(member)}
                  className="px-3 py-1 bg-white/20 dark:bg-black/20 rounded-lg text-[10px] font-bold tracking-wider uppercase"
                >
                  Inspect
                </button>

                <button
                  type="button"
                  onClick={() => setUserToMakeAdmin(member)}
                  className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold tracking-wider uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200"
                  title="Make this user Admin"
                >
                  Make Admin
                </button>
              </div>
            </div>
          ))}

          {foundUsers.length === 0 && (
            <div className="col-span-2 text-center py-6 text-xs text-slate-400 dark:text-neutral-500">
              No members found matching "{searchQuery}".
            </div>
          )}
        </div>

        {/* Detailed Inspected Member Profile View */}
        {selectedUser && (
          <div className="pt-6 border-t border-slate-200 dark:border-neutral-800 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 dark:text-neutral-500 uppercase">
                  Inspecting Profile
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedUser.name} <span className="text-xs font-mono font-normal text-slate-500 dark:text-neutral-400">(@{selectedUser.username})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">"{selectedUser.whatTheyDo}"</p>
              </div>

              <button
                type="button"
                onClick={() => setUserToMakeAdmin(selectedUser)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Transfer Admin Control</span>
              </button>
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
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono uppercase">Current Streak</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{selectedUserStats.currentStreak} days</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono uppercase">Longest Streak</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{selectedUserStats.longestStreak} days</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono uppercase">Total Completed</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{selectedUserStats.completedTasks} tasks</div>
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

      {/* Transfer Admin Confirmation Modal */}
      {userToMakeAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6 text-white dark:text-black" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Transfer Admin Control?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                You are about to make <strong className="text-slate-900 dark:text-white">@{userToMakeAdmin.username}</strong> ({userToMakeAdmin.name}) the group Admin.
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 italic bg-slate-100 dark:bg-neutral-900 p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
                The moment this happens, you will immediately become a regular member and @{userToMakeAdmin.username} will gain the admin capabilities.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToMakeAdmin(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={transferring}
                onClick={handleConfirmTransferAdmin}
                className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
              >
                {transferring ? (
                  <span>Transferring...</span>
                ) : (
                  <>
                    <span>Confirm & Transfer</span>
                    <ArrowRight className="w-4 h-4" />
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
