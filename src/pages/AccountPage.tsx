import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from './LoginPage';
import { supabase } from '../lib/supabase';
import { Camera, Edit2, Loader2, LogOut } from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { points, totalPointsEarned, achievements, tasks, addPoints } = useApp();
  
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.username) {
      setNewName(profile.username);
    }
  }, [profile]);

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  if (authLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>;

  // Show Login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const handleUpdateName = async () => {
    if (!user) return;
    if (!newName.trim() || newName === profile?.username) {
      setEditingName(false);
      return;
    }

    try {
      const trimmedName = newName.trim();
      const { data: existingProfile, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedName)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existingProfile && existingProfile.id !== user?.id) {
        alert('Dieser Name ist bereits vergeben.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: trimmedName })
        .eq('id', user.id);

      if (error) throw error;
      window.location.reload();
    } catch (error) {
      alert('Fehler beim Aktualisieren des Namens.');
      console.error(error);
    } finally {
      setEditingName(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Du musst ein Bild auswählen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      alert('Profilbild aktualisiert!');
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Dein Account</h2>
        <button 
          onClick={signOut}
          className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
          title="Abmelden"
        >
          <LogOut size={20} />
        </button>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden text-gray-900">
        {/* Profile Picture */}
        <div className="relative inline-block group">
          <div 
            className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl border-4 border-white shadow-md overflow-hidden cursor-pointer hover:scale-105 transition-transform"
            onClick={() => fileInputRef.current?.click()}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="uppercase">{profile?.username?.substring(0, 2) || '??'}</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" />
              </div>
            )}
          </div>
          <button 
            className="absolute bottom-2 right-0 bg-blue-500 rounded-full p-1.5 text-white shadow-sm hover:bg-blue-600 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
          />
        </div>
        
        {/* Username */}
        <div className="flex justify-center items-center gap-2 mb-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button onClick={handleUpdateName} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Ok</button>
              <button onClick={() => setEditingName(false)} className="text-xs bg-gray-300 px-2 py-1 rounded">X</button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold">{profile?.username || 'Gast'}</h3>
              <button onClick={() => setEditingName(true)} className="text-gray-900 hover:text-gray-900">
                <Edit2 size={14} />
              </button>
            </>
          )}
        </div>
        <p className="text-gray-900 text-sm">Level {Math.floor(totalPointsEarned / 50) + 1}</p>
        
        {/* Dev Tool */}
        <button 
          onClick={() => addPoints(10000)}
          className="mt-4 text-xs text-gray-900 hover:text-gray-900 transition-colors"
        >
          (Dev: +10.000 Coins)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-gray-900">
          <p className="text-sm text-gray-900">Gesamtpunkte</p>
          <p className="text-2xl font-bold">{totalPointsEarned}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-gray-900">
          <p className="text-sm text-gray-900">Aktuelle Punkte</p>
          <p className="text-2xl font-bold">{points}</p>
        </div>
        
        <Link to="/achievements" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors block text-gray-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-900">Erfolge</p>
              <p className="text-2xl font-bold">{unlockedAchievements} / {achievements.length}</p>
            </div>
            <span className="text-xl">🏆</span>
          </div>
        </Link>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-gray-900">
          <p className="text-sm text-gray-900">Erledigt</p>
          <p className="text-2xl font-bold">{completedTasks}</p>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-900 mt-8 bg-white/50 inline-block px-4 py-1 rounded-full backdrop-blur-sm mx-auto w-full">
        Version 1.1.0
      </div>
    </div>
  );
};
