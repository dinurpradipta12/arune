import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn, UserPlus, Check, Sparkles, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { AVATAR_PRESETS, getAvatarPresetById } from '../../constants/avatarPresets';
import { loginWithEmail, registerWithEmail, updateAuthUserProfile, type AuthUser } from '../../services/authService';

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
    currentUser?.avatarId || 'ava-1'
  );

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Refresh form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(currentUser ? (initialTab === 'edit-profile' ? 'edit-profile' : initialTab) : initialTab);
      setName(currentUser?.name || '');
      setEmail(currentUser?.email || '');
      setSelectedAvatarId(currentUser?.avatarId || 'ava-1');
      setPassword('');
      setShowPassword(false);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser, initialTab]);

  if (!isOpen) return null;

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

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-md my-auto rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all animate-scale-up ${
          darkMode
            ? 'bg-[#0A1A2F] border-zinc-800 text-slate-100'
            : 'bg-white border-[#DFE6E4] text-[#2F3E46]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          className={`p-5 border-b flex items-center justify-between shrink-0 ${
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
                setShowPassword(false);
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
                setShowPassword(false);
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-3 pr-10 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5E887E]/30 ${
                      darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] placeholder-[#8E9F9B]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors cursor-pointer ${
                      darkMode
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        : 'text-[#8E9F9B] hover:text-[#2F3E46] hover:bg-[#EAEFEF]'
                    }`}
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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

                <div className="grid grid-cols-5 gap-2 pt-1">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected =
                      selectedAvatarId === preset.id ||
                      (selectedAvatarId && getAvatarPresetById(selectedAvatarId).id === preset.id);
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
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-3 pr-10 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5E887E]/30 ${
                          darkMode
                            ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                            : 'bg-[#F7FAF9] border-[#DFE6E4] text-[#2F3E46] placeholder-[#8E9F9B]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors cursor-pointer ${
                          darkMode
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            : 'text-[#8E9F9B] hover:text-[#2F3E46] hover:bg-[#EAEFEF]'
                        }`}
                        title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
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
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
