export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  name: string;
  whatTheyDo: string;
  isAdmin: boolean;
  createdAt: string; // ISO date string
}

export interface DailyTask {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  description: string;
  createdBy: string; // uid of admin
  createdAt: string; // ISO date string
}

export interface CheckIn {
  id: string; // userId_date
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'done' | 'not_done';
  timestamp: string; // ISO date string
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  completedTasks: number;
  completionRate: number; // percentage 0 - 100
  history: Record<string, 'done' | 'not_done'>; // date -> status
}

export interface WeeklyStats {
  weekLabel: string; // e.g., "Aug 5 - Aug 11"
  daysCompleted: number;
  totalDays: number;
  rate: number;
}
