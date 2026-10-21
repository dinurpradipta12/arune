import React, { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, Users, Palette, ChevronDown, CheckCircle2 } from 'lucide-react';
import { getCurrentAuthUser, logoutUser, subscribeToAuthChanges, type AuthUser } from '../../services/authService';
import { getAvatarPresetById } from '../../constants/avatarPresets';
import { AuthModal } from '../modals/AuthModal';
import { useStudioStore } from '../../store/useStudioStore';

interface UserAuthButtonProps {
  darkMode?: boolean;
}

export const UserAuthButton: React.FC<UserAuthButtonProps> = ({ darkMode = false }) => {
  const { setActiveView } = useStudioStore();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentAuthUser());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'register' | 'edit-profile'>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToAuthChanges((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleOpenAuth = (tab: 'login' | 'register' | 'edit-profile') => {
    setModalTab(tab);
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsMenuOpen(false);
  };

  if (!currentUser) {
    return (
      <>
        <button
          type="button"
          onClick={() => handleOpenAuth('login')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
            darkMode
              ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-slate-200 hover:text-white'
              : 'bg-white hover:bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] hover:text-[#5E887E]'
          }`}
          title="Masuk ke Akun Tim untuk kolaborasi multiplayer & Brand Kit"
        >
          <LogIn className={`w-3.5 h-3.5 ${darkMode ? 'text-blue-400' : 'text-[#5E887E]'}`} />
          <span>Masuk Tim</span>
        </button>

        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUser={null}
          initialTab={modalTab}
          darkMode={darkMode}
        />
      </>
    );
  }

  const avatarPreset = getAvatarPresetById(currentUser.avatarId);

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Avatar Button */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border transition-all cursor-pointer shadow-xs ${
          isMenuOpen
            ? darkMode
              ? 'border-blue-400 ring-2 ring-blue-500/20 bg-zinc-900'
              : 'border-[#5E887E] ring-2 ring-[#5E887E]/20 bg-[#F7FAF9]'
            : darkMode
            ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-slate-100'
            : 'bg-white hover:bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46]'
        }`}
        title={`Akun: ${currentUser.name} (${currentUser.email})`}
      >
        {/* Mockup Avatar Illustration */}
        <div className="relative w-6 h-6 rounded-full overflow-hidden shadow-xs shrink-0">
          <img
            src={avatarPreset.svgDataUri}
            alt={currentUser.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white" />
        </div>

        <span className="text-xs font-bold truncate max-w-[100px] hidden sm:inline">
          {currentUser.name}
        </span>

        <ChevronDown
          className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''} ${
            darkMode ? 'text-slate-400' : 'text-[#8E9F9B]'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl p-2 z-50 animate-scale-up space-y-1 ${
            darkMode
              ? 'bg-[#0A1A2F] border-zinc-800 text-slate-100'
              : 'bg-white border-[#DFE6E4] text-[#2F3E46]'
          }`}
        >
          {/* User Info Header */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-3 ${
              darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-[#F7FAF9] border-[#DFE6E4]'
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-xs shrink-0">
              <img
                src={avatarPreset.svgDataUri}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate flex items-center gap-1">
                <span>{currentUser.name}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              </div>
              <div className={`text-[10.5px] truncate ${darkMode ? 'text-slate-400' : 'text-[#8E9F9B]'}`}>
                {currentUser.email}
              </div>
              <div className="pt-0.5">
                <span className={`inline-block px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${
                  darkMode
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : 'bg-[#E3EDE9] text-[#2F3E46] border-[#5E887E]/30'
                }`}>
                  Online • Tim Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Quick Menu Actions */}
          <button
            type="button"
            onClick={() => {
              setActiveView('team');
              setIsMenuOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
              darkMode
                ? 'hover:bg-zinc-800 text-slate-200'
                : 'hover:bg-[#F1F5F4] text-[#2F3E46]'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${darkMode ? 'text-blue-400' : 'text-[#5E887E]'}`} />
            <span>Folder & Brand Kit Tim</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAuth('edit-profile')}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
              darkMode
                ? 'hover:bg-zinc-800 text-slate-200'
                : 'hover:bg-[#F1F5F4] text-[#2F3E46]'
            }`}
          >
            <Palette className={`w-3.5 h-3.5 ${darkMode ? 'text-blue-400' : 'text-[#5E887E]'}`} />
            <span>Ganti Foto Ilustrasi / Profil</span>
          </button>

          <div className={`pt-1 border-t ${darkMode ? 'border-zinc-800' : 'border-[#DFE6E4]'}`}>
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left text-rose-600 hover:bg-rose-50 ${
                darkMode ? 'hover:bg-rose-950/30 text-rose-400' : ''
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        initialTab={modalTab}
        darkMode={darkMode}
      />
    </div>
  );
};
