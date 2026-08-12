import React, { useState, useEffect } from 'react';
import { UserProfile, DailyTask } from '../types';
import { formatDateDisplay, getTodayStr } from '../lib/utils';
import { getDailyTask, recordCheckIn, getUserCheckInMap } from '../lib/services';
import { X, Calendar as CalendarIcon, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface DateTaskModalProps {
  dateStr: string;
  currentUser: UserProfile;
  onClose: () => void;
  onCheckInUpdated?: () => void;
}

export const DateTaskModal: React.FC<DateTaskModalProps> = ({
  dateStr,
  currentUser,
  onClose,
  onCheckInUpdated
}) => {
  const [task, setTask] = useState<DailyTask | null>(null);
  const [userStatus, setUserStatus] = useState<'done' | 'not_done' | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayStr();
  const isToday = dateStr === todayStr;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [taskData, historyMap] = await Promise.all([
          getDailyTask(dateStr),
          getUserCheckInMap(currentUser.uid)
        ]);

        if (isMounted) {
          setTask(taskData);
          setUserStatus(historyMap[dateStr] || null);
        }
      } catch (err) {
        console.error('Error loading task for date:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [dateStr, currentUser.uid]);

  const handleCheckIn = async (status: 'done' | 'not_done') => {
    if (!isToday || !task) return;
    setSubmitting(true);
    try {
      await recordCheckIn(currentUser.uid, todayStr, status);
      setUserStatus(status);
      if (onCheckInUpdated) onCheckInUpdated();
    } catch (err) {
      console.error('Error checking in:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 relative">
        {/* Back / Close button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Calendar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Header */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 mb-1">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            <span>{isToday ? "Today's Task" : 'Historical Task'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatDateDisplay(dateStr)}
          </h2>
        </div>

        {/* Body Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono flex items-center justify-center space-x-2">
            <span className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading task details...</span>
          </div>
        ) : task ? (
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-relaxed">
                {task.description}
              </p>
            </div>

            {/* Check-In Status */}
            <div className="p-4 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl space-y-2">
              <div className="text-xs font-mono uppercase text-slate-500 font-semibold">
                Your Check-in Status
              </div>
              <div className="flex items-center space-x-2">
                {userStatus === 'done' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Completed (Marked Done)
                    </span>
                  </>
                ) : userStatus === 'not_done' ? (
                  <>
                    <XCircle className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Marked Not Done
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-500">
                    No check-in recorded for this date.
                  </span>
                )}
              </div>
            </div>

            {/* Action if today */}
            {isToday ? (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-slate-500 font-mono uppercase">
                  Check-in from here:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCheckIn('done')}
                    className="py-3 px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Done</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCheckIn('not_done')}
                    className="py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Not Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Check-ins can only be recorded or modified on the current day.
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500 space-y-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              No task was posted for this date.
            </p>
            <p className="text-xs text-slate-400">
              Tasks exist only on dates where the group admin created one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
