import React, { useState, useEffect } from 'react';
import { UserProfile, UserStats } from '../types';
import { updateUserProfile } from '../lib/services';
import { HeatMap } from './HeatMap';
import { ShareableCard } from './ShareableCard';
import html2canvas from 'html2canvas';
import {
  User,
  AtSign,
  Briefcase,
  Download,
  Edit2,
  Check,
  Flame,
  Award,
  Calendar,
  Sparkles,
  AlertCircle,
  Palette
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: UserProfile;
  stats: UserStats;
  allTaskDates: string[];
  onProfileUpdated: (updatedProfile: UserProfile) => void;
  onSelectDate: (dateStr: string) => void;
}

const PRESET_SWATCHES = [
  '#000000', // Midnight Black
  '#0f172a', // Deep Navy Slate
  '#1e1b4b', // Royal Indigo
  '#064e3b', // Forest Emerald
  '#581c87', // Deep Violet
  '#7f1d1d', // Crimson Red
  '#831843', // Rose Burgundy
  '#ffffff'  // Pure Light White
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  stats,
  allTaskDates,
  onProfileUpdated,
  onSelectDate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [usernameInput, setUsernameInput] = useState(currentUser.username);
  const [whatTheyDoInput, setWhatTheyDoInput] = useState(currentUser.whatTheyDo);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Card background color state with persistence
  const [cardBgColor, setCardBgColor] = useState<string>(() => {
    return localStorage.getItem(`byc_card_bg_${currentUser.uid}`) || '#000000';
  });

  const handleColorChange = (newColor: string) => {
    setCardBgColor(newColor);
    localStorage.setItem(`byc_card_bg_${currentUser.uid}`, newColor);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    if (!nameInput.trim()) return;

    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      setUpdateError('Username cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        name: nameInput.trim(),
        username: cleanUsername,
        whatTheyDo: whatTheyDoInput.trim()
      });

      onProfileUpdated({
        ...currentUser,
        name: nameInput.trim(),
        username: cleanUsername,
        whatTheyDo: whatTheyDoInput.trim()
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setUpdateError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCard = async () => {
    const cardElement = document.getElementById('shareable-card');
    if (!cardElement) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(cardElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: cardBgColor,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `BYC_${currentUser.username}_StreakCard.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-2xl sm:text-3xl uppercase tracking-wider shrink-0 shadow-md">
              {currentUser.name.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentUser.name}
                </h1>
                {currentUser.isAdmin && (
                  <span className="px-2.5 py-0.5 bg-black dark:bg-white text-white dark:text-black font-mono text-[10px] font-bold tracking-wider rounded-full uppercase border border-neutral-700">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-neutral-400">@{currentUser.username}</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 font-medium">
                "{currentUser.whatTheyDo || 'Accountability Member'}"
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setUpdateError(null);
              setNameInput(currentUser.name);
              setUsernameInput(currentUser.username);
              setWhatTheyDoInput(currentUser.whatTheyDo);
              setIsEditing(!isEditing);
            }}
            className="self-start sm:self-center inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-200 dark:border-neutral-800 rounded-2xl text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors min-h-[44px]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="bg-slate-50 dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 space-y-4 animate-fade-in">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Edit Your Profile Details
            </div>

            {updateError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                  Username
                </label>
                <div className="relative flex items-center">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1">
                  What You Do
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={whatTheyDoInput}
                    onChange={(e) => setWhatTheyDoInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200/60 dark:border-neutral-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono">
              <Flame className="w-3.5 h-3.5 text-slate-900 dark:text-white fill-slate-900 dark:fill-white" />
              <span>Current Streak</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.currentStreak} <span className="text-xs font-normal text-slate-400 dark:text-neutral-500">days</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200/60 dark:border-neutral-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono">
              <Award className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
              <span>Longest Streak</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.longestStreak} <span className="text-xs font-normal text-slate-400 dark:text-neutral-500">days</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200/60 dark:border-neutral-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Member Since</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Your Personal Check-In Heat Map
        </h2>
        <HeatMap
          history={stats.history}
          allTaskDates={allTaskDates}
          onSelectDate={onSelectDate}
        />
      </div>

      {/* Download Shareable Card Section */}
      <div className="bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-neutral-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
              <span>Shareable Badge Card</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Download Streak Card
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Save a polished image card showcasing your name, role, and current streak to share with friends or on social media.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={downloading}
            className="py-3 px-6 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs rounded-2xl shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all flex items-center justify-center space-x-2 shrink-0 min-h-[44px]"
          >
            {downloading ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                <span>Generating Image...</span>
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Card Image</span>
              </>
            )}
          </button>
        </div>

        {/* Color Wheel & Customization Bar */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 font-mono">
              <Palette className="w-4 h-4 text-slate-900 dark:text-white" />
              <span>Customize Card Color</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 uppercase">
              {cardBgColor}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Color Wheel Input */}
            <label className="relative flex items-center justify-center cursor-pointer group" title="Open Color Wheel">
              <input
                type="color"
                value={cardBgColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="sr-only"
              />
              <div
                className="w-9 h-9 rounded-xl border-2 border-slate-300 dark:border-neutral-700 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95"
                style={{
                  background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)'
                }}
              >
                <div className="w-4 h-4 rounded-full bg-white dark:bg-black flex items-center justify-center shadow-xs">
                  <Palette className="w-2.5 h-2.5 text-slate-900 dark:text-white" />
                </div>
              </div>
            </label>

            <div className="w-px h-6 bg-slate-200 dark:bg-neutral-800 mx-1" />

            {/* Quick Preset Swatches */}
            {PRESET_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => handleColorChange(hex)}
                className={`w-8 h-8 rounded-xl transition-all border-2 flex items-center justify-center ${
                  cardBgColor.toLowerCase() === hex.toLowerCase()
                    ? 'ring-2 ring-slate-900 dark:ring-white scale-110 border-white dark:border-black'
                    : 'border-slate-200 dark:border-neutral-800 hover:scale-105'
                }`}
                style={{ backgroundColor: hex }}
                title={`Select color ${hex}`}
              >
                {cardBgColor.toLowerCase() === hex.toLowerCase() && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      hex === '#ffffff' ? 'text-black' : 'text-white'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview of Card */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-black rounded-2xl flex items-center justify-center border border-slate-200 dark:border-neutral-800">
          <ShareableCard profile={currentUser} stats={stats} bgColor={cardBgColor} />
        </div>
      </div>
    </div>
  );
};
