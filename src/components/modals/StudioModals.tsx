import React, { useEffect, useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import {
  Check,
  Cloud,
  Copy,
  Database,
  Download,
  FileJson,
  FileText,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Keyboard,
  KeyRound,
  Laptop,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Palette,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Type,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  ASPECT_RATIOS,
  DEFAULT_SCRIPT,
  LAYOUT_PRESETS,
  THEME_PALETTES,
} from '../../constants/themesAndPresets';
import {
  isSystemFontInstalled,
  parseUploadedFontFile,
  scanComputerFonts,
} from '../../services/fontManager';
import {
  clearLocalUserProjectsCache,
  deleteMasterTemplateFromCloud,
  deleteTemplateById,
  fetchCloudStudioData,
  getCachedGlobalStudioConfig,
  getSupabaseConfig,
  isSupabaseConfigured,
  listTemplates,
  publishMasterTemplateToCloud,
  saveSupabaseConfig,
  syncGlobalConfigToSupabase,
  verifyAdministratorCredentials,
} from '../../services/supabaseTemplates';
import {
  DEFAULT_STUDIO_HOTKEYS,
  type StudioHotkeys,
  useStudioStore,
} from '../../store/useStudioStore';
import type { AspectRatioKey, CloudTemplateRecord } from '../../types/studio';
import {
  type ExportFileFormat,
  exportCustomSlides,
} from '../../utils/exportEngine';
import {
  contentScriptToStudioScript,
  parseContentScriptRtf,
  type ParsedContentScript,
} from '../../utils/rtfScriptImporter';
import { studioLogo } from '../../assets/branding';

type SettingsTabId =
  | 'interface'
  | 'defaults'
  | 'hotkeys'
  | 'general'
  | 'developer';

const HOTKEY_LABELS: {
  key: keyof StudioHotkeys;
  label: string;
  desc: string;
}[] = [
  {
    key: 'undo',
    label: 'Undo (Batalkan Perubahan)',
    desc: 'Membatalkan langkah edit terakhir di kanvas',
  },
  {
    key: 'redo',
    label: 'Redo (Ulangi Perubahan)',
    desc: 'Mengulangi langkah edit yang baru dibatalkan',
  },
  {
    key: 'saveProject',
    label: 'Simpan Project ke Cache Lokal',
    desc: 'Menyimpan snapshot project aktif di perangkat ini',
  },
  {
    key: 'duplicateElement',
    label: 'Duplikat Objek Terpilih',
    desc: 'Menduplikasi layer teks/gambar yang sedang dipilih',
  },
  {
    key: 'deleteElement',
    label: 'Hapus Objek Terpilih',
    desc: 'Menghapus layer yang sedang dipilih di kanvas',
  },
  {
    key: 'newTab',
    label: 'Buka Dokumen / Tab Baru',
    desc: 'Membuka tab dokumen kosong baru di editor',
  },
  {
    key: 'exportModal',
    label: 'Buka Menu Export (ZIP/PDF/PNG)',
    desc: 'Membuka jendela pengaturan export multi-slide',
  },
  {
    key: 'openSettings',
    label: 'Buka Jendela Pengaturan (Settings)',
    desc: 'Membuka modal pengaturan aplikasi secara cepat',
  },
  {
    key: 'prevSlide',
    label: 'Pindah ke Slide Sebelumnya',
    desc: 'Navigasi cepat ke slide di sebelah kiri',
  },
  {
    key: 'nextSlide',
    label: 'Pindah ke Slide Berikutnya',
    desc: 'Navigasi cepat ke slide di sebelah kanan',
  },
];

export const StudioModals: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    setActiveView,
    projectTitle,
    setProjectTitle,
    aspectRatio,
    activeThemeId,
    branding,
    updateBranding,
    scriptText,
    setScriptText,
    generateSlidesFromScript,
    slides,
    activeSlideIndex,
    loadProjectSnapshot,
    customFonts,
    addCustomFont,
    addBatchLocalFonts,
    removeCustomFont,
    selectedElementId,
    getSelectedElement,
    updateElement,
    isExporting,
    exportProgress,
    setExportState,
    workspaceDarkMode,
    setWorkspaceDarkMode,
    canvasZoom,
    setCanvasZoom,
    settings,
    updateSettings,
    updateHotkey,
    resetSettingsToDefault,
    isAdminAuthenticated,
    setAdminAuthenticated,
    cloudMasterTemplates,
    setCloudMasterTemplates,
  } = useStudioStore();

  const [copiedJson, setCopiedJson] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);

  // Script Auto-Generator Modal State
  const [autoSyncScript, setAutoSyncScript] = useState(true);
  const [preservePhotos, setPreservePhotos] = useState(true);
  const rtfFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportingRtf, setIsImportingRtf] = useState(false);
  const [rtfImportError, setRtfImportError] = useState<string | null>(null);
  const [rtfImportInfo, setRtfImportInfo] = useState<{
    fileName: string;
    parsed: ParsedContentScript;
  } | null>(null);
  const [postCaption, setPostCaption] = useState<string>(() => {
    try {
      return localStorage.getItem('arune_post_caption_v1') || '';
    } catch {
      return '';
    }
  });
  const [postHashtags, setPostHashtags] = useState<string>(() => {
    try {
      return localStorage.getItem('arune_post_hashtags_v1') || '';
    } catch {
      return '';
    }
  });
  const [copiedPostField, setCopiedPostField] = useState<
    'caption' | 'hashtags' | 'all' | null
  >(null);

  useEffect(() => {
    try {
      localStorage.setItem('arune_post_caption_v1', postCaption);
      localStorage.setItem('arune_post_hashtags_v1', postHashtags);
    } catch {
      // ignore storage errors
    }
  }, [postCaption, postHashtags]);

  const copyPostField = async (field: 'caption' | 'hashtags' | 'all') => {
    const text =
      field === 'caption'
        ? postCaption
        : field === 'hashtags'
        ? postHashtags
        : [postCaption, postHashtags].filter(Boolean).join('\n.\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPostField(field);
      setTimeout(() => setCopiedPostField(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleRtfScriptUpload = async (file: File) => {
    setIsImportingRtf(true);
    setRtfImportError(null);
    try {
      const raw = await file.text();
      const isRtf = /\.rtf$/i.test(file.name) || raw.trimStart().startsWith('{\\rtf');

      if (!isRtf) {
        // Plain-text / markdown script: load directly.
        setScriptText(raw);
        generateSlidesFromScript(raw, preservePhotos);
        setRtfImportInfo(null);
        return;
      }

      const parsed = parseContentScriptRtf(raw);
      if (parsed.slides.length === 0) {
        setRtfImportError(
          'Tabel script tidak ditemukan. Pastikan RTF memiliki tabel dengan kolom "Frame", "Tipe CPW", dan "Script".'
        );
        return;
      }

      const layoutSequence = slides.map((s) => s.layout);
      const studioScript = contentScriptToStudioScript(parsed, layoutSequence);
      setScriptText(studioScript);
      generateSlidesFromScript(studioScript, preservePhotos);
      setPostCaption(parsed.caption);
      setPostHashtags(parsed.hashtags);
      setRtfImportInfo({ fileName: file.name, parsed });
    } catch (err) {
      setRtfImportError(
        `Gagal membaca file: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsImportingRtf(false);
      if (rtfFileInputRef.current) rtfFileInputRef.current.value = '';
    }
  };

  // Export Studio Modal State
  const [exportScope, setExportScope] = useState<'all' | 'custom'>('all');
  const [selectedExportIndices, setSelectedExportIndices] = useState<number[]>(
    []
  );
  const [exportFormat, setExportFormat] = useState<ExportFileFormat>(
    settings.defaultExportFormat || 'png'
  );
  const [exportTransparentBg, setExportTransparentBg] = useState(false);
  const [exportTargetWidthPx, setExportTargetWidthPx] = useState(
    settings.defaultExportWidthPx || 1080
  );
  const [exportPackageAsZip, setExportPackageAsZip] = useState(true);

  // Settings & Developer Cloud State
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('interface');
  const [recordingHotkey, setRecordingHotkey] = useState<
    keyof StudioHotkeys | null
  >(null);
  const [localProjects, setLocalProjects] = useState<CloudTemplateRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateDesc, setTemplateDesc] = useState(
    '6-Slide Editorial Staycation Story'
  );
  const [templateCategory, setTemplateCategory] = useState<
    'Editorial' | 'Minimal' | 'Magazine' | 'Architecture' | 'Photography'
  >('Editorial');
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Hidden Admin Login Modal State
  const [showAdminLoginOverlay, setShowAdminLoginOverlay] = useState(false);
  const [adminLoginUser, setAdminLoginUser] = useState('');
  const [adminLoginPass, setAdminLoginPass] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // Admin Credential Editor State ( inside Developer Tab )
  const [adminEditUser, setAdminEditUser] = useState('arunika');
  const [adminEditPass, setAdminEditPass] = useState('Ar4925');

  // Local & Custom Font Manager State
  const [detectedComputerFonts, setDetectedComputerFonts] = useState<string[]>(
    []
  );
  const [isScanningFonts, setIsScanningFonts] = useState(false);
  const [fontScanMessage, setFontScanMessage] = useState<string | null>(null);
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [manualFontName, setManualFontName] = useState('');
  const [fontStatusToast, setFontStatusToast] = useState<string | null>(null);

  const handleCloseSettingsModal = () => {
    // Otomatis kunci & hilangkan menu developer saat modal ditutup atau klik Selesai
    setAdminAuthenticated(false);
    setSettingsTab('interface');
    setShowAdminLoginOverlay(false);
    setActiveModal(null);
  };

  useEffect(() => {
    if (activeModal === 'settings') {
      // Pastikan menu developer selalu terkunci untuk semua user saat pertama kali dibuka
      setAdminAuthenticated(false);
      setSettingsTab('interface');
      setShowAdminLoginOverlay(false);
      const cfg = getSupabaseConfig();
      setSupaUrl(cfg.url);
      setSupaKey(cfg.anonKey);
      const globalCfg = getCachedGlobalStudioConfig();
      setAdminEditUser(globalCfg.adminUsername || 'arunika');
      setAdminEditPass(globalCfg.adminPassword || 'Ar4925');
      setSyncStatus(null);
      refreshLocalAndCloudData();
    } else if (activeModal === 'fonts') {
      handleScanLocalComputerFonts();
    } else if (activeModal === 'export') {
      setSelectedExportIndices(slides.map((_, i) => i));
      setExportScope('all');
      setExportFormat(settings.defaultExportFormat || 'png');
      setExportTargetWidthPx(settings.defaultExportWidthPx || 1080);
    }
  }, [activeModal, slides.length]);

  // Interactive Key-Combo Recorder for Shortcut/Hotkeys Tab
  useEffect(() => {
    if (!recordingHotkey || activeModal !== 'settings') return;

    const handleRecordKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingHotkey(null);
        return;
      }

      // Ignore standalone modifier key presses
      if (['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
        return;
      }

      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push('Mod');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');

      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      parts.push(keyName);
      const combo = parts.join('+');
      updateHotkey(recordingHotkey, combo);
      setRecordingHotkey(null);
    };

    window.addEventListener('keydown', handleRecordKeyDown, true);
    return () =>
      window.removeEventListener('keydown', handleRecordKeyDown, true);
  }, [recordingHotkey, activeModal, updateHotkey]);

  const refreshLocalAndCloudData = async () => {
    setIsLoadingTemplates(true);
    try {
      const localRes = await listTemplates();
      setLocalProjects(localRes.templates);

      const cloudRes = await fetchCloudStudioData();
      setCloudMasterTemplates(cloudRes.masterTemplates);
      if (cloudRes.config) {
        setAdminEditUser(cloudRes.config.adminUsername || 'arunika');
        setAdminEditPass(cloudRes.config.adminPassword || 'Ar4925');
        if (cloudRes.config.studioName) {
          updateSettings({
            studioName: cloudRes.config.studioName,
            studioSubtitle:
              cloudRes.config.studioSubtitle || settings.studioSubtitle,
          });
        }
      }
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleScanLocalComputerFonts = async () => {
    setIsScanningFonts(true);
    setFontScanMessage(null);
    try {
      const res = await scanComputerFonts();
      setDetectedComputerFonts(res.families);
      if (res.warning) {
        setFontScanMessage(res.warning);
      } else {
        setFontScanMessage(
          `Berhasil membaca ${res.families.length} keluarga font dari komputer Anda (${
            res.method === 'queryLocalFonts'
              ? 'Local Font Access API'
              : 'System Font Detector'
          }).`
        );
      }
    } finally {
      setIsScanningFonts(false);
    }
  };

  const handleFontFilesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let lastLoadedFamily = '';
    for (const file of files) {
      try {
        const record = await parseUploadedFontFile(file);
        addCustomFont(record);
        lastLoadedFamily = record.family;
      } catch (err) {
        setFontStatusToast(
          err instanceof Error ? err.message : 'Gagal memuat file font'
        );
      }
    }

    if (lastLoadedFamily) {
      const sel = getSelectedElement();
      if (sel && (sel.type === 'text' || sel.type === 'badge')) {
        updateElement(sel.id, { fontFamily: lastLoadedFamily }, true);
      }
      setFontStatusToast(
        `Font custom "${lastLoadedFamily}" berhasil ditambahkan dan siap digunakan!`
      );
      setTimeout(() => setFontStatusToast(null), 3500);
    }
    e.target.value = '';
  };

  const handleAddManualFontName = () => {
    const clean = manualFontName.trim();
    if (!clean) return;
    const installed = isSystemFontInstalled(clean);
    addCustomFont({
      family: clean,
      category: 'Local Computer',
      source: 'local-system',
    });
    const sel = getSelectedElement();
    if (sel && (sel.type === 'text' || sel.type === 'badge')) {
      updateElement(sel.id, { fontFamily: clean }, true);
    }
    setManualFontName('');
    setFontStatusToast(
      installed
        ? `Font lokal "${clean}" terdeteksi di komputer Anda dan berhasil diaktifkan!`
        : `Font "${clean}" telah ditambahkan ke daftar Font Studio.`
    );
    setTimeout(() => setFontStatusToast(null), 3500);
  };

  if (!activeModal) return null;

  const currentProjectPayload = {
    projectTitle,
    aspectRatio,
    activeThemeId,
    branding,
    scriptText,
    slides,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  const formattedJson = JSON.stringify(currentProjectPayload, null, 2);

  const handleDownloadJsonFile = () => {
    const blob = new Blob([formattedJson], {
      type: 'application/json;charset=utf-8',
    });
    const slug =
      projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
      'editorial-template';
    saveAs(blob, `${slug}.carousel.json`);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleImportJsonString = (raw: string) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error('JSON file does not contain a valid "slides" array.');
      }
      loadProjectSnapshot({
        projectTitle: parsed.projectTitle || 'Imported Editorial Carousel',
        aspectRatio: parsed.aspectRatio || '4:5',
        activeThemeId: parsed.activeThemeId || 'kinfolk-linen',
        branding: parsed.branding || branding,
        scriptText: parsed.scriptText || scriptText,
        slides: parsed.slides,
      });
      setActiveModal(null);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Invalid JSON template format'
      );
    }
  };

  const handleUploadJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleImportJsonString(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePublishMasterTemplateToCloud = async () => {
    setIsLoadingTemplates(true);
    setSyncStatus(null);
    try {
      const id =
        projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
        `master-template-${Date.now()}`;
      const result = await publishMasterTemplateToCloud({
        id,
        name: projectTitle,
        description: `[${templateCategory}] ${templateDesc}`,
        aspectRatio,
        themeId: activeThemeId,
        branding,
        scriptText,
        slides,
      });
      setSyncStatus(result.message);
      await refreshLocalAndCloudData();
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleSyncGlobalConfigToCloud = async () => {
    setIsLoadingTemplates(true);
    setSyncStatus(null);
    try {
      const res = await syncGlobalConfigToSupabase({
        studioName: settings.studioName,
        studioSubtitle: settings.studioSubtitle,
        adminUsername: adminEditUser.trim() || 'arunika',
        adminPassword: adminEditPass.trim() || 'Ar4925',
        defaultAspectRatio: settings.defaultAspectRatio,
        defaultThemeId: settings.defaultThemeId,
      });
      setSyncStatus(res.message);
      await refreshLocalAndCloudData();
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsVerifyingAdmin(true);
    try {
      const result = await verifyAdministratorCredentials(
        adminLoginUser,
        adminLoginPass
      );
      if (result.ok) {
        setAdminAuthenticated(true);
        setShowAdminLoginOverlay(false);
        setAdminLoginUser('');
        setAdminLoginPass('');
        setSettingsTab('developer');
        setSyncStatus(
          `Login Administrator berhasil (${
            result.source === 'supabase'
              ? 'Tersinkronisasi dengan Database Cloud'
              : 'Kredensial Admin Terverifikasi'
          }). Menu Developer telah dibuka.`
        );
      } else {
        setAdminLoginError('Username atau password administrator tidak sesuai.');
      }
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  const filteredComputerFonts = detectedComputerFonts.filter((fam) =>
    fam.toLowerCase().includes(fontSearchQuery.toLowerCase())
  );

  const customFontSet = new Set(
    customFonts.map((f) => f.family.toLowerCase())
  );

  return (
    <div
      onClick={() => {
        if (activeModal === 'settings') {
          handleCloseSettingsModal();
        } else {
          setActiveModal(null);
        }
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          activeModal === 'fonts' ||
          activeModal === 'script' ||
          activeModal === 'settings'
            ? 'max-w-3xl'
            : 'max-w-lg'
        } rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-100`}
      >
        {/* MODAL 0: OPTIONAL SCRIPT AUTO-GENERATOR MODAL */}
        {activeModal === 'script' && (
          <>
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-blue-900" />
                <div>
                  <h3 className="text-sm font-semibold">
                    Script Auto-Generator
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Ubah naskah markdown terstruktur menjadi multi-slide carousel secara otomatis.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={rtfFileInputRef}
                  type="file"
                  accept=".rtf,.txt,.md,application/rtf,text/rtf,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleRtfScriptUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => rtfFileInputRef.current?.click()}
                  disabled={isImportingRtf}
                  title="Upload Content Script (.rtf) — tabel Frame / Tipe CPW / Script, Caption & Hashtag dibaca otomatis"
                  className="px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  {isImportingRtf ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  <span>{isImportingRtf ? 'Membaca...' : 'Upload Script RTF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScriptText(DEFAULT_SCRIPT);
                    generateSlidesFromScript(DEFAULT_SCRIPT, false);
                    setRtfImportInfo(null);
                  }}
                  title="Reset ke cerita default Muni Forest Bandung"
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3.5 max-h-[78vh] overflow-y-auto scroller-dark">
              {/* Formatting Syntax Quick-Pills */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5 text-[10.5px] font-mono text-zinc-300">
                  {[
                    '--- [layout: editorial-dropcap]',
                    '#header:',
                    '#kicker:',
                    '#title:',
                    '#lead:',
                    '#body: [W]',
                    '#caption:',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/60 text-blue-900"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[10.5px] text-blue-900 font-medium">
                  *italic* · [W] Drop-Cap
                </span>
              </div>

              {rtfImportError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                  {rtfImportError}
                </div>
              )}

              {rtfImportInfo && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {rtfImportInfo.parsed.slides.length} slide ·{' '}
                        {rtfImportInfo.parsed.totalRows} baris tabel terbaca
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 truncate max-w-[50%]">
                      {rtfImportInfo.fileName}
                    </span>
                  </div>
                  {rtfImportInfo.parsed.title && (
                    <p className="text-[11px] text-zinc-300">
                      <span className="text-zinc-500">Judul:</span>{' '}
                      {rtfImportInfo.parsed.title}
                      {rtfImportInfo.parsed.pillar
                        ? ` · ${rtfImportInfo.parsed.pillar}`
                        : ''}
                      {rtfImportInfo.parsed.uploadDate
                        ? ` · ${rtfImportInfo.parsed.uploadDate}`
                        : ''}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto scroller-dark">
                    {rtfImportInfo.parsed.slides.map((s, i) => (
                      <div
                        key={s.key}
                        className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1.5"
                      >
                        <div className="text-[10px] font-semibold text-zinc-200">
                          {String(i + 1).padStart(2, '0')} · {s.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {s.rows.map((r) => r.type || 'Script').join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Script Editor Textarea */}
              <div>
                <label htmlFor="modal-script-editor" className="sr-only">
                  Carousel Script Editor
                </label>
                <textarea
                  id="modal-script-editor"
                  rows={13}
                  value={scriptText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setScriptText(val);
                    if (autoSyncScript) {
                      generateSlidesFromScript(val, preservePhotos);
                    }
                  }}
                  spellCheck={false}
                  placeholder="Paste atau tulis script carousel Anda di sini..."
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-blue-900 rounded-lg p-3 text-xs leading-relaxed font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none resize-y scroller-dark select-text"
                />
              </div>

              {/* Options & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-4 text-xs text-zinc-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncScript}
                      onChange={(e) => setAutoSyncScript(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-blue-900 focus:ring-0"
                    />
                    <span>Live sync saat mengetik</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preservePhotos}
                      onChange={(e) => setPreservePhotos(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-blue-900 focus:ring-0"
                    />
                    <span>Pertahankan foto di slide</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = `${scriptText.trim()}\n\n--- [layout: editorial-dropcap]\n#header: EDITORIAL FEATURE\n#kicker: NEW CHAPTER\n#title: Quiet *architecture*\n#lead: *Light falls gently across textured stone and warm timber.*\n#body: [T]ime moves differently when you leave the main road behind and listen to the wind in the canopy.\n#caption: *Morning light in the courtyard.*`;
                      setScriptText(next);
                      generateSlidesFromScript(next, preservePhotos);
                    }}
                    className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-900" />
                    <span>+ Tambah Slide Block</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      generateSlidesFromScript(scriptText, preservePhotos);
                      setActiveModal(null);
                    }}
                    className="py-2 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate ke Semua Slide ({slides.length})</span>
                  </button>
                </div>
              </div>

              {/* Instagram Caption & Hashtag (from RTF Caption / Hastag Development) */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-200">
                    Caption &amp; Hashtag Postingan
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyPostField('all')}
                    disabled={!postCaption && !postHashtags}
                    className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[10.5px] text-zinc-200 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    {copiedPostField === 'all' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy Caption + Hashtag</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <label htmlFor="post-caption">Caption</label>
                    <button
                      type="button"
                      onClick={() => void copyPostField('caption')}
                      disabled={!postCaption}
                      className="flex items-center gap-1 hover:text-zinc-100 cursor-pointer disabled:opacity-40"
                    >
                      {copiedPostField === 'caption' ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <textarea
                    id="post-caption"
                    rows={5}
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Caption akan terisi otomatis dari bagian 'Caption Development' di RTF..."
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-blue-900 rounded-md p-2 text-[11px] leading-relaxed text-zinc-100 placeholder-zinc-500 focus:outline-none resize-y scroller-dark select-text"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <label htmlFor="post-hashtags">Hashtag</label>
                    <button
                      type="button"
                      onClick={() => void copyPostField('hashtags')}
                      disabled={!postHashtags}
                      className="flex items-center gap-1 hover:text-zinc-100 cursor-pointer disabled:opacity-40"
                    >
                      {copiedPostField === 'hashtags' ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <input
                    id="post-hashtags"
                    type="text"
                    value={postHashtags}
                    onChange={(e) => setPostHashtags(e.target.value)}
                    placeholder="#hashtag dari bagian 'Hastag Development'"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-blue-900 rounded-md px-2 py-1.5 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none select-text"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODAL 1: GLOBAL BRANDING QUICK-MODAL */}
        {activeModal === 'branding' && (
          <>
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-semibold">
                  Global Editorial Branding & Folio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">
                    Publication / Magazine Masthead
                  </label>
                  <input
                    type="text"
                    value={branding.publicationName}
                    onChange={(e) =>
                      updateBranding({ publicationName: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Issue / Volume Label
                  </label>
                  <input
                    type="text"
                    value={branding.issueLabel}
                    onChange={(e) =>
                      updateBranding({ issueLabel: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Author / Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={branding.authorOrHandle}
                    onChange={(e) =>
                      updateBranding({ authorOrHandle: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">
                    Dateline / Location Note (Bottom Folio Bar)
                  </label>
                  <input
                    type="text"
                    value={branding.footerNote}
                    onChange={(e) =>
                      updateBranding({ footerNote: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-md p-3 space-y-2">
                <label className="flex items-center justify-between text-xs text-zinc-200 cursor-pointer">
                  <span>Display Slide Folio Counter (01 / 06)</span>
                  <input
                    type="checkbox"
                    checked={branding.showSlideNumbers}
                    onChange={(e) =>
                      updateBranding({ showSlideNumbers: e.target.checked })
                    }
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-900"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-zinc-200 cursor-pointer">
                  <span>Display Editorial Footer Handle & Dateline</span>
                  <input
                    type="checkbox"
                    checked={branding.showFooterBar}
                    onChange={(e) =>
                      updateBranding({ showFooterBar: e.target.checked })
                    }
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-900"
                  />
                </label>
              </div>
            </div>

            <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </>
        )}

        {/* MODAL 2: IMPORT / EXPORT JSON TEMPLATE */}
        {activeModal === 'json' && (
          <>
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-semibold">
                  Import / Export JSON Carousel Template
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Export Current Carousel State
                </h4>
                <p className="text-xs text-zinc-400">
                  Saves all {slides.length} slides, custom coordinates, typography, and script into a portable JSON template.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadJsonFile}
                    className="flex-1 py-2 px-3 rounded bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .JSON File</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Import JSON Template
                  </h4>
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleUploadJsonFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="text-xs text-blue-900 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload .JSON File</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Or paste exported JSON template payload here..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-blue-900 select-text"
                />

                {importError && (
                  <p className="text-xs text-red-400">{importError}</p>
                )}

                <button
                  type="button"
                  disabled={!importJsonText.trim()}
                  onClick={() => handleImportJsonString(importJsonText)}
                  className="w-full py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium text-zinc-100 cursor-pointer"
                >
                  Load Pasted JSON Template
                </button>
              </div>
            </div>
          </>
        )}

        {/* MODAL 3: PENGATURAN STUDIO (INTERFACE, DEFAULT FITUR, HOTKEYS, UMUM & DEVELOPER ADMIN) */}
        {activeModal === 'settings' && (
          <div className="relative flex flex-col">
            {/* Top Header */}
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={studioLogo}
                  alt="Arune Studio Logo"
                  className="w-9 h-9 object-contain shrink-0 rounded"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Pengaturan {settings.studioName}
                    </h3>
                    {isAdminAuthenticated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/10 text-blue-900 border border-blue-900/30 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Admin Mode Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Atur tampilan antarmuka, default fitur, shortcut keyboard, dan penyimpanan project lokal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseSettingsModal}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Navigation Tabs */}
            <div className="px-5 pt-2.5 bg-zinc-900/50 border-b border-zinc-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(
                [
                  {
                    id: 'interface',
                    label: 'Interface & Tampilan',
                    icon: Monitor,
                  },
                  {
                    id: 'defaults',
                    label: 'Default Fitur',
                    icon: Sliders,
                  },
                  {
                    id: 'hotkeys',
                    label: 'Shortcut / Hotkeys',
                    icon: Keyboard,
                  },
                  {
                    id: 'general',
                    label: 'Project Lokal & Umum',
                    icon: HardDrive,
                  },
                  ...(isAdminAuthenticated
                    ? [
                        {
                          id: 'developer' as SettingsTabId,
                          label: 'Developer & Cloud Sync',
                          icon: Cloud,
                        },
                      ]
                    : []),
                ] as {
                  id: SettingsTabId;
                  label: string;
                  icon: React.ElementType;
                }[]
              ).map((tab) => {
                const Icon = tab.icon;
                const active = settingsTab === tab.id;
                const isDev = tab.id === 'developer';
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsTab(tab.id)}
                    className={`px-3 py-2 rounded-t-lg text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
                      active
                        ? isDev
                          ? 'border-blue-900 text-blue-900 bg-blue-900/10 font-semibold'
                          : 'border-blue-900 text-zinc-100 bg-zinc-900/90 font-semibold'
                        : isDev
                        ? 'border-transparent text-zinc-400 hover:text-blue-900 hover:bg-blue-900/5'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Settings Body */}
            <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto scroller-dark">
              {syncStatus && (
                <div className="px-3.5 py-2.5 rounded-lg bg-blue-900/10 border border-blue-900/30 text-blue-900 font-semibold text-xs flex items-center justify-between gap-2">
                  <span>{syncStatus}</span>
                  <button
                    type="button"
                    onClick={() => setSyncStatus(null)}
                    className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 1: INTERFACE & TAMPILAN */}
              {/* ============================================================ */}
              {settingsTab === 'interface' && (
                <div className="space-y-4">
                  {/* Tema Aplikasi */}
                  <div className="p-4 rounded-xl bg-zinc-900/75 border border-zinc-800 space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">
                        Tema Warna Studio (Light / Dark Mode)
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Pilih tampilan tema keseluruhan untuk Home Hub maupun Workspace Editor.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setWorkspaceDarkMode(false)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                          !workspaceDarkMode
                            ? 'bg-blue-900/10 border-blue-900/40 text-zinc-100'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-900/20 text-blue-900 flex items-center justify-center shrink-0">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">
                            Light Mode (Default)
                          </div>
                          <div className="text-[10.5px] text-zinc-400">
                            Bersih, terang & nyaman untuk desain editorial
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkspaceDarkMode(true)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                          workspaceDarkMode
                            ? 'bg-blue-900/10 border-blue-900/40 text-zinc-100'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center shrink-0">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">Dark Mode</div>
                          <div className="text-[10.5px] text-zinc-400">
                            Kontras gelap bergaya studio pro
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Penggaris, Grid & Snap */}
                  <div className="p-4 rounded-xl bg-zinc-900/75 border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-100">
                      Alat Bantu Visual Kanvas & Penggaris (Rulers)
                    </h4>

                    <label className="flex items-center justify-between gap-4 py-1.5 border-b border-zinc-800/70 cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">
                          Tampilkan Penggaris Atas & Kiri (Canvas Rulers)
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Menampilkan penggaris piksel presisi di bagian atas dan samping kiri kanvas
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showCanvasRulers}
                        onChange={(e) =>
                          updateSettings({ showCanvasRulers: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-900 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 py-1.5 border-b border-zinc-800/70 cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">
                          Tampilkan Titik Grid di Area Belakang Kanvas
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Menampilkan pola titik halus di area meja kerja belakang slide
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showCanvasDotGrid}
                        onChange={(e) =>
                          updateSettings({
                            showCanvasDotGrid: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-900 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 py-1.5 cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">
                          Snap Posisi Objek ke Grid Presisi
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Membantu perataan posisi objek saat digeser di kanvas
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.snapToGrid}
                        onChange={(e) =>
                          updateSettings({ snapToGrid: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-900 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Zoom Default */}
                  <div className="p-4 rounded-xl bg-zinc-900/75 border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-100">
                          Skala Zoom Kanvas Editor
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Tingkat perbesaran kanvas di ruang kerja editor
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-blue-900">
                        {Math.round(canvasZoom * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0.6, 0.72, 0.85, 1.0, 1.15].map((zVal) => (
                        <button
                          key={zVal}
                          type="button"
                          onClick={() => {
                            setCanvasZoom(zVal);
                          }}
                          className={`py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                            Math.abs(canvasZoom - zVal) < 0.02
                              ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {Math.round(zVal * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: DEFAULT FITUR & DOKUMEN */}
              {/* ============================================================ */}
              {settingsTab === 'defaults' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/75 border border-zinc-800 space-y-3.5">
                    <h4 className="text-xs font-semibold text-zinc-100">
                      Standar Dokumen & Project Baru
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          Rasio Kanvas Default
                        </label>
                        <select
                          value={settings.defaultAspectRatio}
                          onChange={(e) =>
                            updateSettings({
                              defaultAspectRatio: e.target
                                .value as AspectRatioKey,
                            })
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-900"
                        >
                          <option value="4:5">4:5 Portrait (1080×1350)</option>
                          <option value="9:16">9:16 Story (1080×1920)</option>
                          <option value="1:1">1:1 Square (1080×1080)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          Palet Warna Default
                        </label>
                        <select
                          value={settings.defaultThemeId}
                          onChange={(e) =>
                            updateSettings({ defaultThemeId: e.target.value })
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-900"
                        >
                          {THEME_PALETTES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          Jumlah Slide Awal Default
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={settings.defaultSlideCount}
                          onChange={(e) =>
                            updateSettings({
                              defaultSlideCount: Math.max(
                                1,
                                Math.min(12, Number(e.target.value) || 6)
                              ),
                            })
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>

                    <label className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-800/70 cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">
                          Buka Project di Tab Baru Secara Default
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Saat memilih dokumen dari halaman Home, otomatis tambahkan sebagai tab baru jika sudah ada dokumen terbuka
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.defaultOpenInNewTab}
                        onChange={(e) =>
                          updateSettings({
                            defaultOpenInNewTab: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-900 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-800/70 cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-zinc-200">
                          Auto-Save Project ke Penyimpanan Lokal Perangkat
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Menjaga perubahan project tetap aman di cache browser perangkat Anda sendiri
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoSaveLocalCache}
                        onChange={(e) =>
                          updateSettings({
                            autoSaveLocalCache: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-900 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Pengaturan Default Export */}
                  <div className="p-4 rounded-xl bg-zinc-900/75 border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-100">
                      Standar Fitur Export (PNG / JPG / PDF & Resolusi)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          Format File Export Default
                        </label>
                        <select
                          value={settings.defaultExportFormat}
                          onChange={(e) =>
                            updateSettings({
                              defaultExportFormat: e.target.value as
                                | 'png'
                                | 'jpg'
                                | 'pdf',
                            })
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-900"
                        >
                          <option value="png">PNG (Lossless / Transparan)</option>
                          <option value="jpg">JPG / JPEG (Ukuran Ringkas)</option>
                          <option value="pdf">PDF (Multi-Halaman Carousel)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          Resolusi Lebar Default (Maks 2000px)
                        </label>
                        <select
                          value={settings.defaultExportWidthPx}
                          onChange={(e) =>
                            updateSettings({
                              defaultExportWidthPx: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-900"
                        >
                          <option value={720}>720 px (SD)</option>
                          <option value={1080}>1080 px (HD Standar)</option>
                          <option value={1440}>1440 px (QHD)</option>
                          <option value={2000}>2000 px (Ultra Max)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: SHORTCUT / HOTKEYS YANG BISA DI-SETTING */}
              {/* ============================================================ */}
              {settingsTab === 'hotkeys' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">
                        Kustomisasi Shortcut & Hotkeys Studio
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Klik tombol shortcut di sebelah kanan lalu tekan kombinasi tombol di keyboard Anda (`Mod` = `Cmd ⌘` di Mac / `Ctrl` di Windows).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettings({
                          hotkeys: { ...DEFAULT_STUDIO_HOTKEYS },
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Default</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {HOTKEY_LABELS.map((item) => {
                      const isRec = recordingHotkey === item.key;
                      const currentCombo = settings.hotkeys[item.key];
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700"
                        >
                          <div>
                            <div className="text-xs font-medium text-zinc-100">
                              {item.label}
                            </div>
                            <div className="text-[10.5px] text-zinc-400">
                              {item.desc}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setRecordingHotkey(isRec ? null : item.key)
                            }
                            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer shrink-0 min-w-[132px] text-center ${
                              isRec
                                ? 'bg-blue-900 text-white border-blue-800 animate-pulse'
                                : 'bg-zinc-950 border-zinc-700 text-blue-900 hover:border-blue-900/60'
                            }`}
                          >
                            {isRec ? 'Tekan Tombol...' : currentCombo}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: PROJECT LOKAL & PENGATURAN UMUM */}
              {/* ============================================================ */}
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-blue-900" />
                          <span>
                            Cache Project Pribadi di Perangkat Ini ({localProjects.length} Project)
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          Seluruh project yang Anda simpan melalui tombol Save disimpan khusus di cache lokal perangkat ini agar tidak tergabung atau terlihat oleh pengguna lain.
                        </p>
                      </div>
                      {localProjects.length > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            clearLocalUserProjectsCache();
                            await refreshLocalAndCloudData();
                            setSyncStatus(
                              'Seluruh cache project lokal di perangkat ini telah dibersihkan.'
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Bersihkan Cache Lokal</span>
                        </button>
                      )}
                    </div>

                    {localProjects.length === 0 ? (
                      <div className="py-5 text-center border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">
                        Belum ada project pribadi yang disimpan di cache perangkat ini.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto scroller-dark pr-1">
                        {localProjects.map((tpl) => (
                          <div
                            key={tpl.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/90"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-100 truncate">
                                  {tpl.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                                  {tpl.aspectRatio} · {tpl.slides.length} slide
                                </span>
                              </div>
                              <p className="text-[10.5px] text-zinc-400 truncate mt-0.5">
                                {tpl.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  loadProjectSnapshot({
                                    id: tpl.id,
                                    projectTitle: tpl.name,
                                    aspectRatio: tpl.aspectRatio,
                                    activeThemeId: tpl.themeId,
                                    branding: tpl.branding,
                                    scriptText: tpl.scriptText,
                                    slides: tpl.slides,
                                  });
                                  setActiveModal(null);
                                }}
                                className="px-2.5 py-1 rounded bg-blue-900/10 hover:bg-blue-900/20 border border-blue-900/30 text-blue-900 font-semibold text-xs font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <FolderOpen className="w-3 h-3" />
                                <span>Buka</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteTemplateById(tpl.id);
                                  refreshLocalAndCloudData();
                                }}
                                className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 cursor-pointer"
                                title="Hapus dari cache lokal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reset Seluruh Pengaturan */}
                  <div className="p-4 rounded-xl bg-zinc-900/75 border border-zinc-800 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">
                        Kembalikan Pengaturan ke Standar Pabrik
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Mereset preferensi interface, default fitur, dan shortcut tanpa menghapus project Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetSettingsToDefault();
                        setSyncStatus(
                          'Seluruh pengaturan umum & shortcut berhasil dikembalikan ke standar awal.'
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Pengaturan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 5: DEVELOPER & CLOUD SYNC (KHUSUS ADMIN AKTIF) */}
              {/* ============================================================ */}
              {settingsTab === 'developer' && isAdminAuthenticated && (
                <div className="space-y-4">
                  {/* Banner Status Admin */}
                  <div className="p-3.5 rounded-xl bg-blue-900/10 border border-blue-900/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-blue-900">
                          Panel Developer & Cloud Sync Administrator Aktif
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Hanya Master Template, Kredensial Admin, dan Identitas Studio yang disimpan ke Supabase. Project user tetap terisolasi di cache lokal masing-masing.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminAuthenticated(false);
                        setSettingsTab('interface');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Logout Admin</span>
                    </button>
                  </div>

                  {/* 1. Koneksi Database Supabase */}
                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-blue-900" />
                        <h4 className="text-xs font-semibold text-zinc-100">
                          1. Konfigurasi Database Supabase (Sinkronisasi Lintas Perangkat)
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isSupabaseConfigured()
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {isSupabaseConfigured()
                          ? 'Supabase Terhubung'
                          : 'Mode Lokal (Belum Diisi)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Supabase Project URL (`VITE_SUPABASE_URL`)
                        </label>
                        <input
                          type="url"
                          value={supaUrl}
                          onChange={(e) => setSupaUrl(e.target.value)}
                          placeholder="https://xxxx.supabase.co"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Supabase Anon Public Key (`VITE_SUPABASE_ANON_KEY`)
                        </label>
                        <input
                          type="password"
                          value={supaKey}
                          onChange={(e) => setSupaKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 select-text"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          const sql = `create table if not exists public.editorial_templates (
  id text primary key,
  name text not null,
  description text default '',
  aspect_ratio text default '4:5',
  theme_id text default 'kinfolk-linen',
  branding jsonb not null default '{}'::jsonb,
  script_text text default '',
  slides jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);
alter table public.editorial_templates enable row level security;
create policy "Public read and admin write editorial_templates" on public.editorial_templates for all using (true) with check (true);`;
                          await navigator.clipboard.writeText(sql);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2500);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>SQL Tabel Disalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-blue-900" />
                            <span>Salin SQL Setup Tabel Supabase</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          saveSupabaseConfig({ url: supaUrl, anonKey: supaKey });
                          await refreshLocalAndCloudData();
                          setSyncStatus(
                            'Kredensial koneksi Supabase disimpan & disinkronkan.'
                          );
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Koneksi & Tarik Data Cloud</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Identitas Studio & Kredensial Admin (Sinkron Semua Perangkat) */}
                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                      <span>
                        2. Identitas Aplikasi & Kredensial Admin (Sinkron Lintas Perangkat)
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Nama Aplikasi Studio
                        </label>
                        <input
                          type="text"
                          value={settings.studioName}
                          onChange={(e) =>
                            updateSettings({ studioName: e.target.value })
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Subtitle Studio
                        </label>
                        <input
                          type="text"
                          value={settings.studioSubtitle}
                          onChange={(e) =>
                            updateSettings({ studioSubtitle: e.target.value })
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Username Administrator
                        </label>
                        <input
                          type="text"
                          value={adminEditUser}
                          onChange={(e) => setAdminEditUser(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Password Administrator
                        </label>
                        <input
                          type="text"
                          value={adminEditPass}
                          onChange={(e) => setAdminEditPass(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono select-text"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncGlobalConfigToCloud}
                      disabled={isLoadingTemplates}
                      className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-blue-900 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>
                        Sinkronkan Nama Aplikasi & Kredensial Admin ke Database
                      </span>
                    </button>
                  </div>

                  {/* 3. Publish / Update Master Template ke Database Cloud */}
                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-blue-900" />
                          <span>
                            3. Publish / Update Desain Aktif Sebagai Master Template
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Template yang di-publish di sini akan otomatis tampil di galeri Template semua perangkat.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={refreshLocalAndCloudData}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        title="Refresh Master Templates"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isLoadingTemplates ? 'animate-spin' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* DEDICATED THEME BUILDER PAGE LAUNCHER (DEVELOPER ONLY) */}
                    <div className="p-3.5 rounded-xl bg-linear-to-r from-blue-950/60 via-indigo-950/40 to-zinc-900 border border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-900/30 text-blue-400 flex items-center justify-center shrink-0">
                            <Palette className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-blue-200">
                            Theme & Master Template Builder
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-900/30 text-blue-300 font-semibold uppercase tracking-wider">
                            Studio Page Khusus
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          Susun sendiri palet warna, tipografi, serta urutan layout slide dari awal secara visual dan simpan langsung ke cloud database sebagai Master Template baru.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseSettingsModal();
                          setActiveView('theme-builder');
                        }}
                        className="shrink-0 px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Buka Theme Builder</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Nama Master Template
                        </label>
                        <input
                          type="text"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Kategori Galeri
                        </label>
                        <select
                          value={templateCategory}
                          onChange={(e) =>
                            setTemplateCategory(
                              e.target.value as typeof templateCategory
                            )
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                        >
                          <option value="Editorial">Editorial</option>
                          <option value="Minimal">Minimal</option>
                          <option value="Magazine">Magazine</option>
                          <option value="Architecture">Architecture</option>
                          <option value="Photography">Photography</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10.5px] text-zinc-400 block mb-1">
                          Catatan / Deskripsi
                        </label>
                        <input
                          type="text"
                          value={templateDesc}
                          onChange={(e) => setTemplateDesc(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 select-text"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePublishMasterTemplateToCloud}
                      disabled={isLoadingTemplates}
                      className="w-full py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>
                        Publish / Update Master Template ke Database Cloud
                      </span>
                    </button>

                    {/* Daftar Master Template di Cloud */}
                    <div className="pt-2 space-y-1.5">
                      <div className="text-[11px] font-semibold text-zinc-300">
                        Master Template Tersimpan ({cloudMasterTemplates.length})
                      </div>
                      {cloudMasterTemplates.length === 0 ? (
                        <div className="py-4 text-center border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">
                          Belum ada Master Template tambahan di database cloud.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto scroller-dark pr-1">
                          {cloudMasterTemplates.map((tpl) => (
                            <div
                              key={tpl.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/90"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-zinc-100 truncate">
                                    {tpl.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/10 text-blue-900 font-mono">
                                    {tpl.aspectRatio} · {tpl.slides.length} slide
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-zinc-400 truncate mt-0.5">
                                  {tpl.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    loadProjectSnapshot({
                                      id: tpl.id,
                                      projectTitle: tpl.name,
                                      aspectRatio: tpl.aspectRatio,
                                      activeThemeId: tpl.themeId,
                                      branding: tpl.branding,
                                      scriptText: tpl.scriptText,
                                      slides: tpl.slides,
                                    });
                                    setActiveModal(null);
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-900/10 hover:bg-blue-900/20 border border-blue-900/30 text-blue-900 font-semibold text-xs font-medium flex items-center gap-1 cursor-pointer"
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteMasterTemplateFromCloud(tpl.id);
                                    refreshLocalAndCloudData();
                                  }}
                                  className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 cursor-pointer"
                                  title="Hapus Master Template dari Cloud"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer with Subtle Small Dot Button for Administrator Login */}
            <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* TITIK KECIL RAHASIA UNTUK MEMBUKA LOGIN ADMINISTRATOR */}
                <button
                  type="button"
                  onClick={() => {
                    if (isAdminAuthenticated) {
                      setSettingsTab('developer');
                    } else {
                      setAdminLoginError(null);
                      setShowAdminLoginOverlay(true);
                    }
                  }}
                  aria-label="Administrator Access Dot"
                  title="•"
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    isAdminAuthenticated
                      ? 'bg-blue-900 shadow-[0_0_6px_rgba(30,58,138,0.8)]'
                      : 'bg-zinc-600/35 hover:bg-zinc-400/70'
                  }`}
                />
                <img
                  src={studioLogo}
                  alt="Arune Studio Logo"
                  className="w-4 h-4 object-contain rounded-xs"
                />
                <span className="text-[10.5px] text-zinc-500">
                  {settings.studioName} · v1.2
                </span>
              </div>

              <button
                type="button"
                onClick={handleCloseSettingsModal}
                className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>

            {/* MODAL OVERLAY LOGIN ADMINISTRATOR (MUNCUL SAAT TITIK KECIL DIKLIK) */}
            {showAdminLoginOverlay && (
              <div
                onClick={() => setShowAdminLoginOverlay(false)}
                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <form
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={handleAdminLoginSubmit}
                  className="w-full max-w-sm rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-900/10 border border-blue-900/30 flex items-center justify-center text-blue-900">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-100">
                          Administrator Login
                        </h4>
                        <p className="text-[10.5px] text-zinc-400">
                          Akses khusus Developer & Database Sync
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdminLoginOverlay(false)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Username Administrator
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={adminLoginUser}
                        onChange={(e) => setAdminLoginUser(e.target.value)}
                        placeholder="Masukkan username..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-900 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none select-text"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={adminLoginPass}
                        onChange={(e) => setAdminLoginPass(e.target.value)}
                        placeholder="Masukkan password..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-900 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none select-text"
                      />
                    </div>

                    {adminLoginError && (
                      <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                        {adminLoginError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdminLoginOverlay(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isVerifyingAdmin ||
                        !adminLoginUser.trim() ||
                        !adminLoginPass.trim()
                      }
                      className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isVerifyingAdmin ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <span>Masuk sebagai Admin</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* MODAL 4: LOCAL COMPUTER FONTS & CUSTOM FONT UPLOADER */}
        {activeModal === 'fonts' && (
          <>
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-semibold">
                  Local Computer Fonts & Custom Font Manager
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/10 text-blue-900 border border-blue-900/30">
                  {customFonts.length} Custom / Local Fonts Active
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto scroller-dark">
              {fontStatusToast && (
                <div className="px-3 py-2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{fontStatusToast}</span>
                </div>
              )}

              {/* Row 1: Upload Custom Font File (.ttf, .otf, .woff, .woff2) & Manual Local Font Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Upload Custom Font File */}
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3.5 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
                      <Upload className="w-3.5 h-3.5 text-blue-900" />
                      <span>Upload File Font Custom</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Unggah file `.ttf`, `.otf`, `.woff`, atau `.woff2` dari komputer Anda. Mendukung penuh Export HD (.ZIP).
                    </p>
                  </div>

                  <input
                    ref={fontFileInputRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/*"
                    multiple
                    onChange={handleFontFilesUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fontFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Font (.TTF / .OTF / .WOFF2)</span>
                  </button>
                </div>

                {/* Add Local Font by Name */}
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3.5 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
                      <HardDrive className="w-3.5 h-3.5 text-blue-900" />
                      <span>Ketik Nama Font di Komputer</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Masukkan nama font apa saja yang terinstal di macOS/Windows Anda (misal: `Didot`, `Optima`, `Avenir Next`).
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={manualFontName}
                      onChange={(e) => setManualFontName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddManualFontName();
                      }}
                      placeholder="Contoh: Didot, Baskerville, Futura..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-blue-900 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none select-text"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualFontName}
                      disabled={!manualFontName.trim()}
                      className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium text-blue-900 cursor-pointer shrink-0"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Scan Installed Local Computer Fonts via Local Font Access API */}
              <div className="rounded-lg bg-zinc-900/70 border border-zinc-800 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-blue-900" />
                      <span>Baca Daftar Font dari Komputer (Local Font Scanner)</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Deteksi otomatis seluruh font yang terinstal di sistem operasi komputer Anda.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleScanLocalComputerFonts}
                    disabled={isScanningFonts}
                    className="px-3.5 py-1.5 rounded bg-blue-900/10 hover:bg-blue-900/20 border border-blue-900/30 text-blue-900 font-semibold text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isScanningFonts ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      {detectedComputerFonts.length > 0
                        ? 'Scan Ulang Font Komputer'
                        : 'Baca Font dari Komputer Sekarang'}
                    </span>
                  </button>
                </div>

                {fontScanMessage && (
                  <p className="text-[11px] text-zinc-300 bg-zinc-950/80 border border-zinc-800 rounded px-2.5 py-1.5">
                    {fontScanMessage}
                  </p>
                )}

                {detectedComputerFonts.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fontSearchQuery}
                          onChange={(e) => setFontSearchQuery(e.target.value)}
                          placeholder={`Cari dari ${detectedComputerFonts.length} font komputer...`}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-900 select-text"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addBatchLocalFonts(filteredComputerFonts.slice(0, 35));
                          setFontStatusToast(
                            `Berhasil menambahkan ${Math.min(
                              35,
                              filteredComputerFonts.length
                            )} font lokal ke daftar Studio!`
                          );
                          setTimeout(() => setFontStatusToast(null), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 cursor-pointer shrink-0"
                      >
                        + Import Semua ({Math.min(35, filteredComputerFonts.length)})
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto scroller-dark grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                      {filteredComputerFonts.slice(0, 80).map((fam) => {
                        const alreadyAdded = customFontSet.has(
                          fam.toLowerCase()
                        );
                        return (
                          <div
                            key={fam}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700"
                          >
                            <div className="min-w-0">
                              <div
                                className="text-xs text-zinc-100 truncate"
                                style={{ fontFamily: `'${fam}', serif` }}
                              >
                                {fam}
                              </div>
                              <div
                                className="text-[10px] text-zinc-400 truncate"
                                style={{ fontFamily: `'${fam}', sans-serif` }}
                              >
                                Aa Bb Cc — Editorial Nest
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                addCustomFont({
                                  family: fam,
                                  category: 'Local Computer',
                                  source: 'local-system',
                                });
                                const sel = getSelectedElement();
                                if (
                                  sel &&
                                  (sel.type === 'text' || sel.type === 'badge')
                                ) {
                                  updateElement(
                                    sel.id,
                                    { fontFamily: fam },
                                    true
                                  );
                                }
                              }}
                              className={`px-2 py-1 rounded text-[10.5px] font-medium shrink-0 cursor-pointer ${
                                alreadyAdded
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-zinc-800 hover:bg-blue-900 text-zinc-200 hover:text-white'
                              }`}
                            >
                              {alreadyAdded ? 'Aktif' : '+ Pakai'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Active Custom & Local Fonts in Studio */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Font Lokal & Custom yang Tersimpan di Studio ({customFonts.length})
                </h4>

                {customFonts.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800 rounded">
                    Belum ada font lokal/custom yang ditambahkan. Gunakan tombol di atas untuk membaca font dari komputer atau upload file `.ttf`/`.otf`.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customFonts.map((f) => (
                      <div
                        key={f.family}
                        className="flex items-center justify-between gap-2 p-2.5 rounded bg-zinc-900/80 border border-zinc-800"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-xs font-medium text-zinc-100 truncate"
                              style={{ fontFamily: `'${f.family}', serif` }}
                            >
                              {f.family}
                            </span>
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-zinc-800 text-blue-900 shrink-0">
                              {f.source === 'uploaded-file'
                                ? 'Uploaded File'
                                : 'Local OS'}
                            </span>
                          </div>
                          <p
                            className="text-[11px] text-zinc-400 truncate mt-0.5"
                            style={{ fontFamily: `'${f.family}', serif` }}
                          >
                            A Nest Above Bandung · 12345
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {selectedElementId && (
                            <button
                              type="button"
                              onClick={() => {
                                const sel = getSelectedElement();
                                if (
                                  sel &&
                                  (sel.type === 'text' || sel.type === 'badge')
                                ) {
                                  updateElement(
                                    sel.id,
                                    { fontFamily: f.family },
                                    true
                                  );
                                  setFontStatusToast(
                                    `Font "${f.family}" diterapkan ke teks terpilih!`
                                  );
                                  setTimeout(
                                    () => setFontStatusToast(null),
                                    2500
                                  );
                                }
                              }}
                              className="px-2 py-1 rounded bg-blue-900/10 hover:bg-blue-900/20 border border-blue-900/30 text-blue-900 font-semibold text-[10.5px] font-medium cursor-pointer"
                            >
                              Terapkan
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeCustomFont(f.family)}
                            className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 cursor-pointer"
                            title="Hapus dari daftar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* MODAL 6: EXPORT STUDIO (SLIDE SELECTION, FORMAT, TRANSPARENCY & RESOLUTION UP TO 2000PX) */}
        {/* ================================================================ */}
        {activeModal === 'export' && (
          <>
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-900" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Export Carousel & Slide Studio
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Pilih slide yang ingin di-export, atur format file (PNG, JPG, PDF), transparansi, dan resolusi hingga 2000px.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-100 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] scroller-dark">
              {/* 1. PILIH SLIDE (SEMUA SLIDE / SLIDE TERTENTU) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-900" />
                    <span>
                      1. Pilih Slide ({selectedExportIndices.length} dari{' '}
                      {slides.length} slide dipilih)
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setExportScope('all');
                        setSelectedExportIndices(slides.map((_, i) => i));
                      }}
                      className={`px-2 py-1 rounded-md border text-[10.5px] font-medium cursor-pointer transition-colors ${
                        exportScope === 'all' &&
                        selectedExportIndices.length === slides.length
                          ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      Semua Slide ({slides.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExportScope('custom');
                        setSelectedExportIndices([activeSlideIndex]);
                      }}
                      className={`px-2 py-1 rounded-md border text-[10.5px] font-medium cursor-pointer transition-colors ${
                        exportScope === 'custom' &&
                        selectedExportIndices.length === 1 &&
                        selectedExportIndices[0] === activeSlideIndex
                          ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      Hanya Slide Aktif (#{activeSlideIndex + 1})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExportScope('custom');
                        setSelectedExportIndices([]);
                      }}
                      className="px-2 py-1 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-[10.5px] text-zinc-400 cursor-pointer"
                    >
                      Reset Pilihan
                    </button>
                  </div>
                </div>

                {/* Slide Checkboxes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slides.map((slide, idx) => {
                    const isChecked = selectedExportIndices.includes(idx);
                    const layoutMeta = LAYOUT_PRESETS.find(
                      (l) => l.id === slide.layout
                    );
                    const titleEl = slide.elements.find(
                      (e) =>
                        (e.type === 'text' || e.type === 'badge') &&
                        (e.role === 'title' || e.role === 'kicker')
                    );
                    const snippet =
                      titleEl && 'content' in titleEl
                        ? titleEl.content.replace(/\*/g, '')
                        : layoutMeta?.name || slide.layout;

                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => {
                          setExportScope('custom');
                          setSelectedExportIndices((prev) =>
                            prev.includes(idx)
                              ? prev.filter((i) => i !== idx)
                              : [...prev, idx].sort((a, b) => a - b)
                          );
                        }}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-blue-900/10 border-blue-900/40 text-zinc-100'
                            : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-blue-900 border-blue-900 text-white'
                              : 'bg-zinc-950 border-zinc-600 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-zinc-100">
                              Slide {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span
                              className="w-3 h-3 rounded-full border border-zinc-700 shrink-0"
                              style={{ backgroundColor: slide.backgroundColor }}
                            />
                          </div>
                          <p className="text-[10px] text-blue-900 truncate">
                            {layoutMeta?.name || slide.layout}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {snippet}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. PILIH FORMAT EXPORT (PNG, JPG, PDF) */}
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-200 block">
                  2. Pilih Format File
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'png',
                        title: 'PNG',
                        desc: 'Kualitas Lossless & Bisa Transparan',
                        icon: ImageIcon,
                      },
                      {
                        id: 'jpg',
                        title: 'JPG / JPEG',
                        desc: 'Ukuran File Ringan & Siap Upload',
                        icon: ImageIcon,
                      },
                      {
                        id: 'pdf',
                        title: 'PDF Document',
                        desc: 'Dokumen Multi-Halaman Carousel',
                        icon: FileText,
                      },
                    ] as {
                      id: ExportFileFormat;
                      title: string;
                      desc: string;
                      icon: React.ElementType;
                    }[]
                  ).map((fmt) => {
                    const Icon = fmt.icon;
                    const active = exportFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setExportFormat(fmt.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          active
                            ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold shadow-xs'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{fmt.title}</span>
                          <Icon className="w-4 h-4 text-blue-900" />
                        </div>
                        <span className="text-[10px] text-zinc-400 leading-snug">
                          {fmt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Opsi Transparan Khusus Format PNG */}
                {exportFormat === 'png' && (
                  <div className="mt-2 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-zinc-100">
                        Background PNG Transparan (Alpha Channel)
                      </div>
                      <p className="text-[10.5px] text-zinc-400">
                        Jika diaktifkan, warna background kertas slide akan dihilangkan menjadi transparan.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExportTransparentBg(false)}
                        className={`px-2.5 py-1 rounded-md text-[10.5px] font-medium cursor-pointer ${
                          !exportTransparentBg
                            ? 'bg-blue-900 text-white font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Normal (Solid)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportTransparentBg(true)}
                        className={`px-2.5 py-1 rounded-md text-[10.5px] font-medium cursor-pointer ${
                          exportTransparentBg
                            ? 'bg-blue-900 text-white font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Transparan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. PENGATURAN RESOLUSI GAMBAR (MAKSIMAL 2000PX) */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-800">
                {(() => {
                  const ratioCfg = ASPECT_RATIOS[aspectRatio];
                  const clampedW = Math.max(
                    540,
                    Math.min(2000, exportTargetWidthPx)
                  );
                  const outH = Math.round(
                    clampedW * (ratioCfg.stageHeight / ratioCfg.stageWidth)
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-semibold text-zinc-200 block">
                            3. Resolusi Gambar (Maksimal 2000px)
                          </label>
                          <p className="text-[10.5px] text-zinc-400">
                            Ukuran Output Final ({ratioCfg.shortLabel}):{' '}
                            <span className="text-blue-900 font-mono font-semibold">
                              {clampedW} × {outH} px
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
                          <input
                            type="number"
                            min={540}
                            max={2000}
                            step={10}
                            value={exportTargetWidthPx}
                            onChange={(e) =>
                              setExportTargetWidthPx(
                                Math.max(
                                  540,
                                  Math.min(2000, Number(e.target.value) || 1080)
                                )
                              )
                            }
                            aria-label="Target Resolution Width in Pixels"
                            className="w-16 bg-transparent text-xs font-mono text-zinc-100 text-right focus:outline-none"
                          />
                          <span className="text-[10px] font-mono text-zinc-400">
                            px
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={540}
                        max={2000}
                        step={10}
                        value={exportTargetWidthPx}
                        onChange={(e) =>
                          setExportTargetWidthPx(Number(e.target.value))
                        }
                        className="w-full accent-blue-900 cursor-pointer"
                      />

                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: '720px (SD)', val: 720 },
                          { label: '1080px (HD Standar)', val: 1080 },
                          { label: '1440px (QHD)', val: 1440 },
                          { label: '2000px (Ultra Max)', val: 2000 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setExportTargetWidthPx(preset.val)}
                            className={`py-1.5 px-2 rounded-lg border text-[10.5px] font-mono cursor-pointer transition-colors ${
                              exportTargetWidthPx === preset.val
                                ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 4. KEMASAN DOWNLOAD (.ZIP ATAU FILE LANGSUNG) */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportPackageAsZip}
                    onChange={(e) => setExportPackageAsZip(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-900"
                  />
                  <span>
                    Kemas hasil export ke dalam file arsip <strong>.ZIP</strong>
                  </span>
                </label>
                <span className="text-[10.5px] text-zinc-400 font-mono">
                  {exportFormat.toUpperCase()}{' '}
                  {exportFormat === 'png' && exportTransparentBg
                    ? '(Transparan)'
                    : ''}
                </span>
              </div>
            </div>

            <div className="px-5 py-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between gap-2">
              <div className="text-[11px] text-zinc-400 truncate">
                {isExporting
                  ? exportProgress || 'Sedang memproses export...'
                  : `${selectedExportIndices.length} slide siap di-export (${exportFormat.toUpperCase()}, ${exportTargetWidthPx}px)`}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isExporting || selectedExportIndices.length === 0}
                  onClick={async () => {
                    if (isExporting || selectedExportIndices.length === 0)
                      return;
                    setExportState(true, 'Menyiapkan render canvas...');
                    try {
                      await exportCustomSlides({
                        slides,
                        selectedSlideIndices: selectedExportIndices,
                        projectTitle,
                        aspectRatio,
                        format: exportFormat,
                        transparentBackground:
                          exportFormat === 'png' && exportTransparentBg,
                        targetWidthPx: exportTargetWidthPx,
                        packageAsZip: exportPackageAsZip,
                        onProgress: (msg) => setExportState(true, msg),
                      });
                      setActiveModal(null);
                    } catch (err) {
                      alert(
                        `Gagal melakukan export: ${
                          err instanceof Error ? err.message : 'Unknown error'
                        }`
                      );
                    } finally {
                      setExportState(false, null);
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        Download {exportFormat.toUpperCase()}{' '}
                        {exportPackageAsZip || selectedExportIndices.length > 1
                          ? exportFormat === 'pdf' && !exportPackageAsZip
                            ? '(.PDF)'
                            : '(.ZIP)'
                          : ''}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
