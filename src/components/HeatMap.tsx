import React, { useState } from 'react';
import { formatDateDisplay, formatShortDate } from '../lib/utils';

interface HeatMapProps {
  history: Record<string, 'done' | 'not_done'>;
  allTaskDates: string[];
  onSelectDate?: (dateStr: string) => void;
  daysToDisplay?: number; // default 120 days (~17 weeks)
}

export const HeatMap: React.FC<HeatMapProps> = ({
  history,
  allTaskDates,
  onSelectDate,
  daysToDisplay = 119 // 17 weeks * 7 days
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    status: 'done' | 'not_done' | 'no_task' | 'pending';
    x: number;
    y: number;
  } | null>(null);

  // Generate date array working backwards from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = daysToDisplay - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }

  // Group into columns of 7 days (Sunday - Saturday or Monday - Sunday)
  const columns: Date[][] = [];
  let currentCol: Date[] = [];

  dates.forEach((d) => {
    currentCol.push(d);
    if (currentCol.length === 7) {
      columns.push(currentCol);
      currentCol = [];
    }
  });
  if (currentCol.length > 0) {
    columns.push(currentCol);
  }

  const taskDateSet = new Set(allTaskDates);

  const getCellStatus = (dateStr: string, isTodayOrPast: boolean) => {
    const userStatus = history[dateStr];
    if (userStatus === 'done') return 'done';
    if (userStatus === 'not_done') return 'not_done';
    if (taskDateSet.has(dateStr)) return 'pending';
    return 'no_task';
  };

  const getCellColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm';
      case 'not_done':
        return 'bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600';
      case 'pending':
        return 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/60';
    }
  };

  const dayLabels = ['Mon', 'Wed', 'Fri'];

  return (
    <div className="w-full relative">
      {/* Scroll container for mobile responsiveness */}
      <div className="overflow-x-auto pb-3 pt-1 scrollbar-none">
        <div className="min-w-[640px] flex flex-col space-y-2 select-none">
          {/* Header Month Labels */}
          <div className="flex space-x-1 pl-8 text-[11px] font-mono text-neutral-400">
            {columns.map((col, colIdx) => {
              const firstDay = col[0];
              // Show month label if first column or 1st week of a new month
              if (colIdx === 0 || firstDay.getDate() <= 7) {
                return (
                  <div key={colIdx} className="w-[14px] text-center font-medium">
                    {formatShortDate(firstDay.toISOString().split('T')[0]).split(' ')[0]}
                  </div>
                );
              }
              return <div key={colIdx} className="w-[14px]" />;
            })}
          </div>

          {/* Grid View */}
          <div className="flex space-x-1 items-start">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between h-[112px] text-[10px] font-mono text-neutral-400 pr-2">
              <span>M</span>
              <span>W</span>
              <span>F</span>
            </div>

            {/* Weeks */}
            <div className="flex space-x-1">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col space-y-1">
                  {col.map((dateObj, rowIdx) => {
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;

                    const isPastOrToday = dateObj <= today;
                    const status = getCellStatus(dateStr, isPastOrToday);
                    const colorClass = getCellColor(status);

                    return (
                      <button
                        key={rowIdx}
                        type="button"
                        onClick={() => onSelectDate && onSelectDate(dateStr)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            dateStr,
                            status,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-3.5 h-3.5 rounded-sm border transition-all transform hover:scale-125 hover:z-20 focus:outline-none ${colorClass}`}
                        aria-label={`Date ${dateStr}, status: ${status}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Check-in intensity</span>
        <div className="flex items-center space-x-2">
          <span>Less</span>
          <div className="flex space-x-1 items-center">
            <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" title="No task" />
            <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" title="Task posted / Pending" />
            <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-600" title="Not done" />
            <span className="w-3 h-3 rounded-sm bg-black dark:bg-white border border-black dark:border-white" title="Done" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Desktop Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white text-xs py-1.5 px-3 rounded-xl shadow-xl border border-slate-800 font-sans tracking-tight flex flex-col items-center whitespace-nowrap"
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y}px`
          }}
        >
          <span className="font-semibold text-white">
            {formatDateDisplay(hoveredCell.dateStr)}
          </span>
          <span className="text-[11px] text-slate-300 capitalize">
            {hoveredCell.status === 'done' && '✓ Task Completed'}
            {hoveredCell.status === 'not_done' && '✕ Marked Not Done'}
            {hoveredCell.status === 'pending' && '⚪ Pending Check-in'}
            {hoveredCell.status === 'no_task' && 'No Task Posted'}
          </span>
        </div>
      )}
    </div>
  );
};
