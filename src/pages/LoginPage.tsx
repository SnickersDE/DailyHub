import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { themes, activeThemeId } = useApp();
  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!username.trim()) throw new Error('Benutzername ist erforderlich');
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });
        if (error) throw error;
        alert('Registrierung erfolgreich! Bitte logge dich ein.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/friends');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className={clsx("text-2xl font-bold mb-6 text-center", activeTheme.colors.text)}>
          {isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Benutzername</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dein Name"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "w-full py-2.5 rounded-lg text-white font-medium shadow-md hover:opacity-90 transition-all flex justify-center items-center gap-2",
              activeTheme.colors.primary
            )}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Registrieren' : 'Einloggen')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? 'Bereits ein Konto?' : 'Noch kein Konto?'}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-1 text-blue-600 hover:underline font-medium"
          >
            {isSignUp ? 'Einloggen' : 'Registrieren'}
          </button>
        </div>
      </div>
    </div>
  );
};
