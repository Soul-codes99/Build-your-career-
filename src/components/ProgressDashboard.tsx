import React from 'react';
import { UserStats, UserProfile } from '../types';
import { calculateWeeklyStats } from '../lib/utils';
import { HeatMap } from './HeatMap';
import { Flame, Award, CheckCircle, Percent, TrendingUp, CalendarDays } from 'lucide-react';

interface ProgressDashboardProps {
  stats: UserStats;
  allTaskDates: string[];
  currentUser: UserProfile;
  onSelectDate: (dateStr: string) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  stats,
  allTaskDates,
  currentUser,
  onSelectDate
}) => {
  const weeklyStats = calculateWeeklyStats(stats.history, allTaskDates);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Progress & Streaks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Detailed metrics, weekly consistency, and long-term accountability record for {currentUser.name}.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-neutral-400 text-xs font-mono uppercase font-semibold">
            <Flame className="w-4 h-4 text-slate-900 dark:text-white fill-slate-900 dark:fill-white" />
            <span>Current Streak</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.currentStreak} <span className="text-xs font-medium text-slate-400 dark:text-neutral-500">days</span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-neutral-400 text-xs font-mono uppercase font-semibold">
            <Award className="w-4 h-4 text-slate-900 dark:text-white" />
            <span>Longest Streak</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.longestStreak} <span className="text-xs font-medium text-slate-400 dark:text-neutral-500">days</span>
          </div>
        </div>

        {/* Total Tasks Done */}
        <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-neutral-400 text-xs font-mono uppercase font-semibold">
            <CheckCircle className="w-4 h-4 text-slate-900 dark:text-white" />
            <span>Completed</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.completedTasks} <span className="text-xs font-medium text-slate-400 dark:text-neutral-500">tasks</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-neutral-400 text-xs font-mono uppercase font-semibold">
            <Percent className="w-4 h-4 text-slate-900 dark:text-white" />
            <span>Success Rate</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.completionRate}%
          </div>
        </div>
      </div>

      {/* Weekly Streak Visualization Section */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="w-5 h-5 text-slate-900 dark:text-white" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Weekly Consistency Breakdown
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-neutral-500">
            Past 6 Weeks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyStats.map((week, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span>{week.weekLabel}</span>
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 font-mono">
                  {week.rate}% Rate
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-black dark:bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${week.rate}%` }}
                />
              </div>

              <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 flex justify-between">
                <span>{week.daysCompleted} / {week.totalDays} days completed</span>
                <span>{week.daysCompleted === week.totalDays ? '🔥 Perfect Week' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Contribution Heatmap Card */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Activity Heat Map
          </h2>
          <span className="text-xs font-mono text-slate-400 dark:text-neutral-500">
            Last 120 Days
          </span>
        </div>

        <HeatMap
          history={stats.history}
          allTaskDates={allTaskDates}
          onSelectDate={onSelectDate}
        />
      </div>
    </div>
  );
};
