import React, { useState } from 'react';
import { DailyTask, UserProfile } from '../types';
import { formatDateDisplay, getTodayStr } from '../lib/utils';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Circle } from 'lucide-react';

interface CalendarViewProps {
  tasks: DailyTask[];
  userHistory: Record<string, 'done' | 'not_done'>;
  currentUser: UserProfile;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  userHistory,
  currentUser,
  onSelectDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredTask, setHoveredTask] = useState<{
    dateStr: string;
    description: string;
    status: string;
    x: number;
    y: number;
  } | null>(null);

  const todayStr = getTodayStr();

  // Create task lookup map by date
  const taskMap: Record<string, DailyTask> = {};
  tasks.forEach((t) => {
    taskMap[t.date] = t;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun

  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    daysArray.push(new Date(year, month, day));
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Calendar Header Card */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Task Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Select or tap any date to view task details and check-in logs.
            </p>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-neutral-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[120px] text-center font-mono">
              {monthName}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center text-xs font-mono text-slate-400 font-semibold py-2 border-b border-slate-100 dark:border-slate-800/80">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {daysArray.map((dateObj, idx) => {
            if (!dateObj) {
              return <div key={idx} className="aspect-square bg-transparent rounded-2xl" />;
            }

            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const isToday = dateStr === todayStr;
            const hasTask = Boolean(taskMap[dateStr]);
            const taskObj = taskMap[dateStr];
            const checkInStatus = userHistory[dateStr];

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                onMouseEnter={(e) => {
                  if (hasTask && taskObj) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredTask({
                      dateStr,
                      description: taskObj.description,
                      status: checkInStatus || 'pending',
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8
                    });
                  }
                }}
                onMouseLeave={() => setHoveredTask(null)}
                className={`aspect-square rounded-2xl p-2 flex flex-col justify-between items-start transition-all relative group border text-left min-h-[54px] sm:min-h-[70px] ${
                  isToday
                    ? 'ring-2 ring-black dark:ring-white font-bold bg-slate-100 dark:bg-slate-800 border-neutral-300 dark:border-slate-700'
                    : hasTask
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-black dark:hover:border-white'
                    : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-60'
                }`}
              >
                {/* Date Number Badge */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-semibold font-mono ${
                      isToday ? 'text-slate-900 dark:text-slate-100 font-black' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dateObj.getDate()}
                  </span>
                  {isToday && (
                    <span className="text-[9px] bg-black dark:bg-white text-white dark:text-black font-mono px-1.5 py-0.5 rounded-full font-bold uppercase">
                      Today
                    </span>
                  )}
                </div>

                {/* Status Indicator Icon */}
                <div className="w-full flex items-center justify-end mt-1">
                  {checkInStatus === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                  )}
                  {checkInStatus === 'not_done' && (
                    <XCircle className="w-4 h-4 text-slate-400" />
                  )}
                  {!checkInStatus && hasTask && (
                    <Circle className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Done</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>Not Done</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Circle className="w-3.5 h-3.5 text-slate-400" />
              <span>Pending Task</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Hover for task preview • Tap date for full view
          </span>
        </div>
      </div>

      {/* Desktop Tooltip */}
      {hoveredTask && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-2xl border border-slate-800 max-w-xs font-sans space-y-1"
          style={{
            left: `${hoveredTask.x}px`,
            top: `${hoveredTask.y}px`
          }}
        >
          <div className="text-[10px] font-mono text-slate-400">
            {formatDateDisplay(hoveredTask.dateStr)}
          </div>
          <div className="font-semibold text-white line-clamp-2 leading-snug">
            "{hoveredTask.description}"
          </div>
          <div className="text-[10px] font-mono capitalize pt-1 border-t border-slate-800 text-slate-300">
            Status: {hoveredTask.status === 'done' ? '✓ Completed' : hoveredTask.status === 'not_done' ? '✕ Not Done' : '⚪ Pending'}
          </div>
        </div>
      )}
    </div>
  );
};
