import React, { useState } from 'react';
import { X, LogIn, UserPlus, Check, Sparkles, AlertCircle, Shield } from 'lucide-react';
import { AVATAR_PRESETS } from '../../constants/avatarPresets';
import { loginWithEmail, registerWithEmail, updateAuthUserProfile, type AuthUser } from '../../services/authService';
import { isSupabaseConfigured } from '../../services/supabaseTemplates';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  initialTab?: 'login' | 'register' | 'edit-profile';
  darkMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'login',
  darkMode = false,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'edit-profile'>(
    currentUser ? 'edit-profile' : initialTab
  );

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    currentUser?.avatarId || 'avatar-sage'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasSupabase = isSupabaseConfigured();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    const res = await loginWithEmail(email, password);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Berhasil masuk! Selamat datang kembali.');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    const res = await registerWithEmail(name, email, password, selectedAvatarId);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Akun tim berhasil dibuat!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    await updateAuthUserProfile({ name, avatarId: selectedAvatarId });
    setIsLoading(false);
    setSuccessMsg('Profil dan avatar berhasil diperbarui!');
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all animate-scale-up ${
          darkMode
            ? 'bg-[#0A1A2F] border-zinc-800 text-slate-100'
            : 'bg-white border-[#DFE6E4] text-[#2F3E46]'
        }`}
      >
        {/* Header Modal */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-[#F7FAF9] border-[#DFE6E4]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-[#5E887E]/15 text-[#5E887E]'
              }`}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {tab === 'edit-profile'
                  ? 'Pengaturan Profil Tim'
                  : tab === 'register'
                  ? 'Daftar Akun Tim'
                  : 'Masuk Akun Tim'}
              </h2>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-[#8E9F9B]'}`}>
                {tab === 'edit-profile'
                  ? 'Sesuaikan nama & avatar ilustrasi akun Anda'
                  : 'Akses multiplayer editing dan Brand Kit bersama'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              darkMode
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-[#8E9F9B] hover:text-[#2F3E46] hover:bg-[#EAEFEF]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Only if not logged in) */}
        {!currentUser && (
          <div
            className={`p-2 border-b flex items-center gap-1 ${
              darkMode ? 'bg-[#0D1E37] border-zinc-800' : 'bg-[#F1F5F4] border-[#DFE6E4]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'login'
                  ? darkMode
                    ? 'bg-zinc-800 text-blue-400 shadow-xs'
                    : 'bg-[#2F3E46] text-white shadow-xs'
                  : darkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-[#556B65] hover:text-[#2F3E46]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Login)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'register'
                  ? darkMode
                    ? 'bg-zinc-800 text-blue-400 shadow-xs'
                    : 'bg-[#2F3E46] text-white shadow-xs'
                  : darkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-[#556B65] hover:text-[#2F3E46]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar (Register)</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label
                  className={`text-[11px] font-semibold block mb-1 ${
                    darkMode ? 'text-slate-300' : 'text-[#556B65]'
                  }`}
                >
                  Email Akun Tim
                </label>
                <input
                  type="email"
                  placeholder="cth: dinur@agensi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5E887E]/30 ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] placeholder-[#8E9F9B]'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label
                  className={`text-[11px] font-semibold block mb-1 ${
                    darkMode ? 'text-slate-300' : 'text-[#556B65]'
                  }`}
                >
                  Kata Sandi
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5E887E]/30 ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] placeholder-[#8E9F9B]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-[#2F3E46] hover:bg-[#5E887E] text-white'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Akun Tim</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={tab === 'edit-profile' ? handleUpdateProfile : handleRegisterSubmit} className="space-y-4">
              {/* 1. Mockup Avatar Preset Selector */}
              <div className="space-y-2">
                <label
                  className={`text-[11px] font-semibold block ${
                    darkMode ? 'text-slate-300' : 'text-[#556B65]'
                  }`}
                >
                  Pilih Foto Ilustrasi Mockup Avatar
                </label>
                <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-[#8E9F9B]'}`}>
                  Menggunakan ilustrasi vektor ringan agar database tidak terbebani file foto besar.
                </p>

                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatarId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedAvatarId(preset.id)}
                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? darkMode
                              ? 'border-blue-400 ring-2 ring-blue-500/30 bg-blue-950/40'
                              : 'border-[#5E887E] ring-2 ring-[#5E887E]/30 bg-[#E3EDE9]'
                            : darkMode
                            ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                            : 'border-[#DFE6E4] bg-white hover:border-[#5E887E]/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden shadow-xs shrink-0">
                          <img src={preset.svgDataUri} alt={preset.name} className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-[9.5px] truncate max-w-full font-medium ${
                          isSelected
                            ? darkMode ? 'text-blue-300 font-bold' : 'text-[#2F3E46] font-bold'
                            : darkMode ? 'text-slate-400' : 'text-[#8E9F9B]'
                        }`}>
                          {preset.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className={`text-[11px] font-semibold block mb-1 ${
                    darkMode ? 'text-slate-300' : 'text-[#556B65]'
                  }`}
                >
                  Nama Lengkap / Panggilan
                </label>
                <input
                  type="text"
                  placeholder="cth: Dinur Pradipta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5E887E]/30 ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] placeholder-[#8E9F9B]'
                  }`}
                />
              </div>

              {tab === 'register' && (
                <>
                  <div>
                    <label
                      className={`text-[11px] font-semibold block mb-1 ${
                        darkMode ? 'text-slate-300' : 'text-[#556B65]'
                      }`}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="cth: dinur@agensi.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5E887E]/30 ${
                        darkMode
                          ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                          : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] placeholder-[#8E9F9B]'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`text-[11px] font-semibold block mb-1 ${
                        darkMode ? 'text-slate-300' : 'text-[#556B65]'
                      }`}
                    >
                      Kata Sandi (Minimal 6 karakter)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5E887E]/30 ${
                        darkMode
                          ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                          : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] placeholder-[#8E9F9B]'
                      }`}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-[#2F3E46] hover:bg-[#5E887E] text-white'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <span>Menyimpan...</span>
                ) : tab === 'edit-profile' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Perubahan Profil</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Daftar Akun Tim</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Connection status footer note */}
          <div
            className={`p-3 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
              hasSupabase
                ? darkMode
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                : darkMode
                ? 'bg-zinc-900/60 border-zinc-800 text-slate-400'
                : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#556B65]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>
                {hasSupabase
                  ? 'Supabase Cloud Terhubung (Multiplayer Ready)'
                  : 'Mode Lokal / Demo Aktif (Belum Sync Cloud)'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
