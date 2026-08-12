import React from 'react';
import { UserProfile } from '../types';
import { CheckSquare, Calendar as CalendarIcon, BarChart3, User, ShieldCheck, LogOut, Sun, Moon } from 'lucide-react';

export type NavTab = 'task' | 'calendar' | 'progress' | 'profile' | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile | null;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onSignOut,
  theme,
  onToggleTheme
}) => {
  return (
    <>
      {/* Top Desktop Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800 transition-colors shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo / Brand Name */}
          <div
            onClick={() => onSelectTab('task')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-extrabold text-xs tracking-wider shadow-sm transition-transform group-hover:scale-105">
              BYC
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Build Your Career
            </span>
          </div>

          {/* Desktop Nav Links */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-neutral-900 p-1 rounded-full border border-slate-200/80 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => onSelectTab('task')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center justify-center ${
                  currentTab === 'task'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Today's Task
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center justify-center ${
                  currentTab === 'calendar'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Calendar
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('progress')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center justify-center ${
                  currentTab === 'progress'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Progress
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('profile')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all flex items-center justify-center ${
                  currentTab === 'profile'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Profile
              </button>

              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectTab('admin')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight flex items-center justify-center space-x-1.5 transition-all ${
                    currentTab === 'admin'
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
          )}

          {/* Actions & Theme Toggle */}
          <div className="flex items-center space-x-2.5">
            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle Theme"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700/80 shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onSelectTab('profile')}
                  className="flex items-center space-x-2 text-left pl-2 pr-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs uppercase border border-neutral-700 shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">
                      @{currentUser.username} {currentUser.isAdmin && '• Admin'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      {currentUser && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-slate-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <button
            type="button"
            onClick={() => onSelectTab('task')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] rounded-2xl transition-all ${
              currentTab === 'task'
                ? 'text-black dark:text-white font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Today</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] rounded-2xl transition-all ${
              currentTab === 'calendar'
                ? 'text-black dark:text-white font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('progress')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] rounded-2xl transition-all ${
              currentTab === 'progress'
                ? 'text-black dark:text-white font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Progress</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] rounded-2xl transition-all ${
              currentTab === 'profile'
                ? 'text-black dark:text-white font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>

          {currentUser.isAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] rounded-2xl transition-all ${
                currentTab === 'admin'
                  ? 'text-black dark:text-white font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">Admin</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
};
