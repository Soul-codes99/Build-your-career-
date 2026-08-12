import React, { useState } from 'react';
import { signUpUser, logInUser } from '../lib/services';
import { mapAuthErrorMessage } from '../lib/utils';
import { UserProfile } from '../types';
import { Eye, EyeOff, Lock, Mail, User, Briefcase, AtSign, ArrowRight, AlertCircle, Info } from 'lucide-react';

interface AuthModalProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

  // Signup extra states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [whatTheyDo, setWhatTheyDo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Basic validations
        if (!username.trim()) throw new Error('Username is required.');
        if (!email.trim() || !email.includes('@')) throw new Error('A valid Gmail address is required.');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (!name.trim()) throw new Error('Full name is required.');

        const profile = await signUpUser({
          username: username.trim(),
          email: email.trim(),
          password,
          name: name.trim(),
          whatTheyDo: whatTheyDo.trim() || 'Accountability Member'
        });
        onAuthSuccess(profile);
      } else {
        if (!loginInput.trim()) throw new Error('Please enter your username or Gmail address.');
        if (!password) throw new Error('Please enter your password.');

        const profile = await logInUser(loginInput.trim(), password);
        onAuthSuccess(profile);
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      const friendlyMsg = mapAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black items-center justify-center font-extrabold text-sm tracking-wider mb-2 shadow-sm">
            BYC
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isSignUp ? 'Join Build Your Career' : 'Welcome Back'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-normal">
            {isSignUp
              ? 'Create your account and start your daily streak.'
              : 'Sign in to check in and maintain your daily accountability.'}
          </p>
        </div>

        {/* Console Config Banner Notice */}
        <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-slate-600 dark:text-neutral-300">
          <Info className="w-4 h-4 text-slate-900 dark:text-white shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Ensure <strong className="text-slate-900 dark:text-white">Email/Password</strong> sign-in is enabled in your Firebase Console under Auth &gt; Sign-in method.
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 rounded-2xl flex items-start space-x-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp ? (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Unique Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Unique Username
                </label>
                <div className="relative flex items-center">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="janedoe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 pl-1">
                  Unique handle (e.g. @janedoe) used for lookup by admin.
                </p>
              </div>

              {/* Gmail Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Gmail / Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* What You Do */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  What You Do (Short Bio)
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={whatTheyDo}
                    onChange={(e) => setWhatTheyDo(e.target.value)}
                    placeholder="Software Engineer, Designer, Product Manager"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Login Identifier Field */
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Username or Gmail
              </label>
              <div className="relative flex items-center">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="janedoe or jane@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Password Field with Eye Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center justify-center"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-sm rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-neutral-800 text-center">
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="font-bold text-black dark:text-white hover:underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
