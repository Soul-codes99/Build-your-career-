import { UserStats, WeeklyStats } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD string into a human-readable display string
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats date into short display (e.g., "Aug 12")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Parse YYYY-MM-DD to Date object in local time
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format Date object to YYYY-MM-DD string
 */
export function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates an array of date strings from startDate to endDate (inclusive)
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const current = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);

  while (current <= end) {
    dates.push(toDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Calculate user stats including current streak, longest streak, and completion rate
 * Task dates is a sorted array of YYYY-MM-DD strings where tasks existed
 */
export function calculateUserStats(
  history: Record<string, 'done' | 'not_done'>,
  allTaskDates: string[]
): UserStats {
  const today = getTodayStr();
  
  // Combine all dates with task history or checkins
  const sortedTaskDates = Array.from(new Set([...allTaskDates, ...Object.keys(history)])).sort();
  
  if (sortedTaskDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      completedTasks: 0,
      completionRate: 0,
      history
    };
  }

  // Filter dates up to today
  const pastAndTodayDates = sortedTaskDates.filter(d => d <= today);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let completedTasks = 0;
  let totalCheckIns = Object.keys(history).length;

  // Calculate completed tasks count
  Object.values(history).forEach(status => {
    if (status === 'done') completedTasks++;
  });

  // Longest streak calculation across all historical dates
  const allHistoryDates = pastAndTodayDates;
  for (const date of allHistoryDates) {
    if (history[date] === 'done') {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Current streak calculation:
  // Work backwards from today (or yesterday if today hasn't been checked in yet)
  let checkPointer = pastAndTodayDates.length - 1;
  
  if (checkPointer >= 0) {
    const latestDate = pastAndTodayDates[checkPointer];
    
    // If latest date is today and hasn't been checked in yet, don't break streak from yesterday
    if (latestDate === today && !history[today]) {
      checkPointer--; // start checking from yesterday
    }
    
    while (checkPointer >= 0) {
      const date = pastAndTodayDates[checkPointer];
      if (history[date] === 'done') {
        currentStreak++;
        checkPointer--;
      } else {
        // Break in streak
        break;
      }
    }
  }

  const completionRate = pastAndTodayDates.length > 0 
    ? Math.round((completedTasks / pastAndTodayDates.length) * 100) 
    : 0;

  return {
    currentStreak,
    longestStreak,
    totalCheckIns,
    completedTasks,
    completionRate,
    history
  };
}

/**
 * Calculates weekly breakdown for the progress dashboard (e.g. past 8 weeks)
 */
export function calculateWeeklyStats(
  history: Record<string, 'done' | 'not_done'>,
  allTaskDates: string[]
): WeeklyStats[] {
  const today = parseLocalDate(getTodayStr());
  const weeks: WeeklyStats[] = [];

  // Look at last 6 weeks (from current week going backwards)
  for (let i = 5; i >= 0; i--) {
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - (i * 7));
    
    const startOfWeek = new Date(endOfWeek);
    startOfWeek.setDate(endOfWeek.getDate() - 6);

    const startStr = toDateStr(startOfWeek);
    const endStr = toDateStr(endOfWeek);

    const daysInRange = getDateRange(startStr, endStr);
    
    let daysCompleted = 0;
    let totalDaysWithTasks = 0;

    daysInRange.forEach(d => {
      if (allTaskDates.includes(d) || history[d]) {
        totalDaysWithTasks++;
        if (history[d] === 'done') {
          daysCompleted++;
        }
      }
    });

    const label = `${formatShortDate(startStr)} - ${formatShortDate(endStr)}`;
    const rate = totalDaysWithTasks > 0 ? Math.round((daysCompleted / totalDaysWithTasks) * 100) : 0;

    weeks.push({
      weekLabel: label,
      daysCompleted,
      totalDays: totalDaysWithTasks || 7,
      rate
    });
  }

  return weeks;
}

/**
 * Formats Firebase Auth Error into user-friendly message
 */
export function mapAuthErrorMessage(error: any): string {
  console.error("Firebase Auth Error Raw:", error);
  let message = error?.message || String(error || '');
  let code = error?.code || '';

  try {
    if (typeof message === 'string' && message.startsWith('{') && message.endsWith('}')) {
      const parsed = JSON.parse(message);
      if (parsed.error) message = parsed.error;
    }
  } catch (e) {
    // fallback
  }

  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method in the Firebase console.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || message.includes('INVALID_LOGIN_CREDENTIALS')) {
    return 'Invalid login credentials. Please check your username/email and password.';
  }
  if (code === 'auth/wrong-password' || message.includes('INVALID_PASSWORD')) {
    return 'Incorrect password. Please double check and try again.';
  }
  if (code === 'auth/email-already-in-use' || message.includes('EMAIL_EXISTS')) {
    return 'An account with this email address already exists. Please log in or use a different email.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid Gmail address (e.g. user@gmail.com).';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many unsuccessful attempts. Please wait a few moments and try again.';
  }

  return message || 'An authentication error occurred. Please try again.';
}
