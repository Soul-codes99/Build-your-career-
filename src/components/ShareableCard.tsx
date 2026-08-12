import React from 'react';
import { UserProfile, UserStats } from '../types';
import { Award, Zap, CheckCircle2 } from 'lucide-react';

interface ShareableCardProps {
  profile: UserProfile;
  stats: UserStats;
  bgColor?: string;
}

function getLuminance(hex: string): number {
  const clean = (hex || '#000000').replace('#', '');
  if (clean.length !== 6) return 0;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export const ShareableCard: React.FC<ShareableCardProps> = ({
  profile,
  stats,
  bgColor = '#000000'
}) => {
  const luminance = getLuminance(bgColor);
  const isLightBg = luminance > 0.55;

  const textColor = isLightBg ? '#0f172a' : '#ffffff';
  const mutedTextColor = isLightBg ? '#475569' : 'rgba(255, 255, 255, 0.7)';
  const statBg = isLightBg ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)';
  const statBorder = isLightBg ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';
  const dividerBorder = isLightBg ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)';
  const badgeBg = isLightBg ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
  const badgeBorder = isLightBg ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)';
  const logoBg = isLightBg ? '#000000' : '#ffffff';
  const logoText = isLightBg ? '#ffffff' : '#000000';

  return (
    <div
      id="shareable-card"
      className="w-full max-w-sm mx-auto p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${dividerBorder}`,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif"
      }}
    >
      {/* Background subtle noise / glow accent */}
      <div
        className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: isLightBg ? '#000000' : '#ffffff' }}
      />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider shadow-sm transition-colors"
              style={{ backgroundColor: logoBg, color: logoText }}
            >
              BYC
            </div>
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: mutedTextColor }}
            >
              Build Your Career
            </span>
          </div>
          {profile.isAdmin && (
            <span
              className="px-2.5 py-1 text-[10px] font-mono tracking-wider rounded-full uppercase"
              style={{
                backgroundColor: badgeBg,
                border: `1px solid ${badgeBorder}`,
                color: textColor
              }}
            >
              Admin
            </span>
          )}
        </div>

        {/* Member Info */}
        <div className="mb-6">
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-1"
            style={{ color: textColor }}
          >
            {profile.name}
          </h2>
          <p className="text-xs font-mono" style={{ color: mutedTextColor }}>
            @{profile.username}
          </p>
          <p
            className="text-sm mt-2 line-clamp-2 leading-relaxed font-medium"
            style={{ color: textColor }}
          >
            "{profile.whatTheyDo || 'Accountability Member'}"
          </p>
        </div>
      </div>

      {/* Stats Highlights */}
      <div
        className="my-4 pt-4 grid grid-cols-2 gap-3"
        style={{ borderTop: `1px solid ${dividerBorder}` }}
      >
        <div
          className="p-3.5 rounded-2xl flex flex-col"
          style={{ backgroundColor: statBg, border: `1px solid ${statBorder}` }}
        >
          <div
            className="flex items-center space-x-1.5 text-xs font-medium mb-1"
            style={{ color: mutedTextColor }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: textColor }} />
            <span>Current Streak</span>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: textColor }}>
            {stats.currentStreak}{' '}
            <span className="text-xs font-normal" style={{ color: mutedTextColor }}>
              days
            </span>
          </span>
        </div>

        <div
          className="p-3.5 rounded-2xl flex flex-col"
          style={{ backgroundColor: statBg, border: `1px solid ${statBorder}` }}
        >
          <div
            className="flex items-center space-x-1.5 text-xs font-medium mb-1"
            style={{ color: mutedTextColor }}
          >
            <Award className="w-3.5 h-3.5" style={{ color: textColor }} />
            <span>Longest Streak</span>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold" style={{ color: textColor }}>
            {stats.longestStreak}{' '}
            <span className="text-xs font-normal" style={{ color: mutedTextColor }}>
              days
            </span>
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="pt-4 flex items-center justify-between text-[11px]"
        style={{ borderTop: `1px solid ${dividerBorder}`, color: mutedTextColor }}
      >
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: textColor }} />
          <span style={{ color: textColor }}>{stats.completedTasks} Tasks Completed</span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: mutedTextColor }}>
          Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
};
