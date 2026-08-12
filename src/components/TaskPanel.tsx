import React, { useState } from 'react';
import { UserProfile, DailyTask, UserStats } from '../types';
import { formatDateDisplay, getTodayStr } from '../lib/utils';
import { recordCheckIn } from '../lib/services';
import { CheckCircle2, XCircle, Flame, Calendar, Sparkles, ShieldAlert, Clock } from 'lucide-react';

interface TaskPanelProps {
  currentUser: UserProfile;
  todayTask: DailyTask | null;
  userTodayStatus: 'done' | 'not_done' | null;
  userStats: UserStats;
  onCheckInCompleted: (status: 'done' | 'not_done') => void;
  onOpenAdminPanel?: () => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  currentUser,
  todayTask,
  userTodayStatus,
  userStats,
  onCheckInCompleted,
  onOpenAdminPanel
}) => {
  const [submitting, setSubmitting] = useState(false);
  const todayStr = getTodayStr();

  const handleCheckIn = async (status: 'done' | 'not_done') => {
    if (!todayTask) return;
    setSubmitting(true);
    try {
      await recordCheckIn(currentUser.uid, todayStr, status);
      onCheckInCompleted(status);
    } catch (err) {
      console.error('Error recording check-in:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Greeting Banner */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-900 dark:text-white mb-1 font-semibold">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDateDisplay(todayStr)}</span>
              </div>
              <span>•</span>
              {/* Today Status Badge in Banner */}
              {userTodayStatus === 'done' && (
                <span className="px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold tracking-wider uppercase flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Done For Today</span>
                </span>
              )}
              {userTodayStatus === 'not_done' && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-[11px] font-bold tracking-wider uppercase flex items-center space-x-1">
                  <XCircle className="w-3 h-3" />
                  <span>Not Done</span>
                </span>
              )}
              {!userTodayStatus && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 text-[11px] font-semibold tracking-wider uppercase">
                  Check-in Pending
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
              "{currentUser.whatTheyDo || 'Accountability Member'}"
            </p>
          </div>

          {/* Current Streak Badge */}
          <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-4 flex items-center space-x-3 shrink-0 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 text-white dark:text-black fill-white dark:fill-black" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-500 dark:text-neutral-400 font-semibold">
                Current Streak
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {userStats.currentStreak} <span className="text-xs font-medium text-slate-400 dark:text-neutral-500">days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Task Card */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white animate-pulse" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-neutral-400 font-bold">
              Today's Task
            </h2>
          </div>
          {currentUser.isAdmin && onOpenAdminPanel && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="text-xs font-bold text-slate-900 dark:text-white hover:underline"
            >
              Edit Task (Admin)
            </button>
          )}
        </div>

        {todayTask ? (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50/80 dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                {todayTask.description}
              </p>
            </div>

            {/* Congratulatory Success Banner if Done */}
            {userTodayStatus === 'done' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-5 rounded-2xl flex items-start space-x-3 text-emerald-900 dark:text-emerald-200 animate-fade-in">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm sm:text-base">
                    Nice work, {currentUser.name}!
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                    {userStats.currentStreak > 1
                      ? `That is ${userStats.currentStreak} days in a row.`
                      : "You've completed today's task and started your streak!"}
                  </div>
                </div>
              </div>
            )}

            {/* Marked Not Done Banner */}
            {userTodayStatus === 'not_done' && (
              <div className="bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="text-xs sm:text-sm">
                  You marked today's task as not done. Tomorrow is a brand new day!
                </div>
              </div>
            )}

            {/* Check-In Action Buttons */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  {userTodayStatus ? 'Your status for today:' : 'Mark your status for today:'}
                </div>

                {userTodayStatus === 'done' && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>DONE</span>
                  </span>
                )}

                {userTodayStatus === 'not_done' && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>NOT DONE</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCheckIn('done')}
                  className={`py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all min-h-[48px] ${
                    userTodayStatus === 'done'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Done</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCheckIn('not_done')}
                  className={`py-3.5 px-5 rounded-2xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all border min-h-[48px] ${
                    userTodayStatus === 'not_done'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-600'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Mark as Not Done</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state when today's task is not set yet */
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                No task posted yet for today
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                The group admin has not posted today's task yet. Check back soon or remind your admin!
              </p>
            </div>

            {currentUser.isAdmin && onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs rounded-xl shadow hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Post Today's Task as Admin</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
