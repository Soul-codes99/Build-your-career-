import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { UserProfile, DailyTask, UserStats } from './types';
import {
  getUserProfile,
  getDailyTask,
  getAllTasks,
  getUserCheckInMap,
  signOutUser
} from './lib/services';
import { getTodayStr, calculateUserStats } from './lib/utils';

// UI Components
import { Navbar, NavTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { TaskPanel } from './components/TaskPanel';
import { CalendarView } from './components/CalendarView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { ProfileView } from './components/ProfileView';
import { AdminPanel } from './components/AdminPanel';
import { DateTaskModal } from './components/DateTaskModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('task');

  // Theme state (light / dark mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('byc_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('byc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Shared application state
  const [todayTask, setTodayTask] = useState<DailyTask | null>(null);
  const [allTasks, setAllTasks] = useState<DailyTask[]>([]);
  const [userHistory, setUserHistory] = useState<Record<string, 'done' | 'not_done'>>({});
  const [selectedModalDate, setSelectedModalDate] = useState<string | null>(null);

  const todayStr = getTodayStr();

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setCurrentUser(profile);
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch core tasks and user check-in data whenever user or task state updates
  const refreshAppData = async (uid?: string) => {
    const targetUid = uid || currentUser?.uid;
    try {
      const [tToday, tasksList] = await Promise.all([
        getDailyTask(todayStr),
        getAllTasks()
      ]);

      setTodayTask(tToday);
      setAllTasks(tasksList);

      if (targetUid) {
        const historyMap = await getUserCheckInMap(targetUid);
        setUserHistory(historyMap);
      }
    } catch (err) {
      console.error('Error refreshing app data:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshAppData(currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Compute stats dynamically
  const allTaskDates = allTasks.map((t) => t.date);
  const userStats: UserStats = calculateUserStats(userHistory, allTaskDates);
  const userTodayStatus = userHistory[todayStr] || null;

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCurrentTab('task');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-extrabold text-xs tracking-wider shadow animate-pulse">
            BYC
          </div>
          <p className="text-xs font-mono text-slate-400">
            Initializing Build Your Career...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-sans antialiased pb-24 md:pb-12 transition-colors">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {!currentUser ? (
          <AuthModal
            onAuthSuccess={(profile) => {
              setCurrentUser(profile);
              refreshAppData(profile.uid);
            }}
          />
        ) : (
          <>
            {currentTab === 'task' && (
              <TaskPanel
                currentUser={currentUser}
                todayTask={todayTask}
                userTodayStatus={userTodayStatus}
                userStats={userStats}
                onCheckInCompleted={(status) => {
                  setUserHistory((prev) => ({
                    ...prev,
                    [todayStr]: status
                  }));
                }}
                onOpenAdminPanel={() => setCurrentTab('admin')}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                tasks={allTasks}
                userHistory={userHistory}
                currentUser={currentUser}
                onSelectDate={(dateStr) => setSelectedModalDate(dateStr)}
              />
            )}

            {currentTab === 'progress' && (
              <ProgressDashboard
                stats={userStats}
                allTaskDates={allTaskDates}
                currentUser={currentUser}
                onSelectDate={(dateStr) => setSelectedModalDate(dateStr)}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                currentUser={currentUser}
                stats={userStats}
                allTaskDates={allTaskDates}
                onProfileUpdated={(updated) => setCurrentUser(updated)}
                onSelectDate={(dateStr) => setSelectedModalDate(dateStr)}
              />
            )}

            {currentTab === 'admin' && currentUser.isAdmin && (
              <AdminPanel
                currentUser={currentUser}
                todayTask={todayTask}
                allTaskDates={allTaskDates}
                onTaskUpdated={(task) => {
                  setTodayTask(task);
                  refreshAppData(currentUser.uid);
                }}
                onAdminTransferred={(newAdminUid) => {
                  setCurrentUser({
                    ...currentUser,
                    isAdmin: false
                  });
                  setCurrentTab('task');
                  refreshAppData(currentUser.uid);
                }}
                onSelectDate={(dateStr) => setSelectedModalDate(dateStr)}
              />
            )}
          </>
        )}
      </main>

      {/* Date Task Detail Modal */}
      {selectedModalDate && currentUser && (
        <DateTaskModal
          dateStr={selectedModalDate}
          currentUser={currentUser}
          onClose={() => setSelectedModalDate(null)}
          onCheckInUpdated={() => refreshAppData(currentUser.uid)}
        />
      )}
    </div>
  );
}
