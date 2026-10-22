import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  FileText,
  Check,
} from 'lucide-react';
import {
  FONT_COMBINATIONS,
  type FontCombinationPreset,
} from '../../constants/fontCombinations';
import { useStudioStore } from '../../store/useStudioStore';

/**
 * Visual Miniature Thumbnail Preview of the Font Combination
 * Accurately reproduces the typography layout from Adobe Fonts 10 & Canva
 * with crisp black lettering (#000000).
 */
export const FontPairingThumbnail: React.FC<{
  preset: FontCombinationPreset;
}> = ({ preset }) => {
  return (
    <div className="w-full aspect-[4/3] rounded-md bg-[#FAF9F5] border border-black/10 relative overflow-hidden flex items-center justify-center p-3 select-none transition-transform group-hover:scale-[1.01]">
      {/* Paper texture subtle background */}
      <div className="absolute inset-0 bg-radial from-white/90 via-[#FAF9F5] to-[#F2EFE9] opacity-90 pointer-events-none" />

      {/* Typography group positioned relative to center */}
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        {preset.items.map((item, idx) => {
          // Scale font size proportionally for thumbnail
          const scale = 0.48;
          const scaledFontSize = Math.max(8, Math.round(item.fontSize * scale));
          const scaledOffsetY = Math.round(item.offsetY * scale);
          const scaledOffsetX = Math.round((item.offsetX || 0) * scale);

          const isHollowStroke = item.stroke?.enabled;

          return (
            <div
              key={idx}
              className="absolute leading-none whitespace-pre select-none pointer-events-none"
              style={{
                fontFamily: item.fontFamily,
                fontSize: `${scaledFontSize}px`,
                fontWeight: item.fontWeight,
                fontStyle: item.italic ? 'italic' : 'normal',
                textTransform: item.uppercase ? 'uppercase' : 'none',
                letterSpacing: `${item.letterSpacing}em`,
                lineHeight: item.lineHeight,
                textAlign: item.textAlign,
                color: isHollowStroke ? 'transparent' : item.color || '#000000',
                WebkitTextStroke: isHollowStroke
                  ? `${Math.max(1, Math.round((item.stroke?.width || 2) * scale))}px ${
                      item.stroke?.color || '#000000'
                    }`
                  : undefined,
                top: `calc(50% + ${scaledOffsetY}px)`,
                left: `calc(50% + ${scaledOffsetX}px)`,
                transform: 'translate(-50%, -50%)',
                zIndex: item.zIndex,
              }}
            >
              {item.content}
            </div>
          );
        })}
      </div>

      {/* Category badge */}
      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold bg-black/5 text-zinc-700 backdrop-blur-[2px] border border-black/5">
        {preset.badge}
      </div>
    </div>
  );
};

export const FontCombinationsPanel: React.FC = () => {
  const { applyFontCombination, activeSlideIndex } = useStudioStore();
  const [filterCategory, setFilterCategory] = useState<'all' | 'adobe-10' | 'canva'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const filteredPresets = useMemo(() => {
    return FONT_COMBINATIONS.filter((preset) => {
      const matchesCategory =
        filterCategory === 'all' || preset.category === filterCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        preset.name.toLowerCase().includes(q) ||
        preset.pairingLabel.toLowerCase().includes(q) ||
        preset.subtitle.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        preset.items.some((i) => i.content.toLowerCase().includes(q))
      );
    });
  }, [filterCategory, searchQuery]);

  const handleApply = (preset: FontCombinationPreset, mode: 'insert' | 'blank' | 'new-slide') => {
    applyFontCombination(preset, mode);
    setAppliedId(`${preset.id}-${mode}`);
    setTimeout(() => setAppliedId(null), 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 scroller-dark">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-900" />
          <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
            Font Combinations
          </h3>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/10 text-blue-900 border border-blue-900/30 font-medium">
          {FONT_COMBINATIONS.length} Pairings
        </span>
      </div>

      {/* Category Filter Switcher */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer ${
            filterCategory === 'all'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Semua ({FONT_COMBINATIONS.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('adobe-10')}
          className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer ${
            filterCategory === 'adobe-10'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Adobe 10選 (10)
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('canva')}
          className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer ${
            filterCategory === 'canva'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Canva (4)
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari font (e.g. Futura, Bebas, Playfair, Bodoni)..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900/30 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Preset Cards List */}
      <div className="space-y-3">
        {filteredPresets.map((preset) => {
          return (
            <div
              key={preset.id}
              className="group p-2 rounded-xl bg-zinc-900/75 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-xs flex flex-col gap-2"
            >
              {/* Visual Thumbnail Preview */}
              <FontPairingThumbnail preset={preset} />

              {/* Title & Pairing Details */}
              <div className="px-0.5 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-zinc-100 truncate">
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-blue-900 bg-blue-900/10 px-1.5 py-0.2 rounded border border-blue-900/20 shrink-0">
                    {preset.pairingLabel}
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400 line-clamp-1">
                  {preset.subtitle}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-800/80">
                {/* 1. Blank Canvas button (Exact request: buat blank canvas teks nya saja yang digunakan tanpa gambar) */}
                <button
                  type="button"
                  onClick={() => handleApply(preset, 'blank')}
                  title="Ganti isi slide saat ini menjadi Blank Canvas dengan teks font ini saja"
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {appliedId === `${preset.id}-blank` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Blank Canvas</span>
                    </>
                  )}
                </button>

                {/* 2. Insert to Current Slide */}
                <button
                  type="button"
                  onClick={() => handleApply(preset, 'insert')}
                  title={`Tambahkan teks kombinasi ini ke Slide ${String(activeSlideIndex + 1).padStart(2, '0')}`}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-medium transition-colors shadow-xs cursor-pointer"
                >
                  {appliedId === `${preset.id}-insert` ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Ditambahkan</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sisipkan Teks</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3. New Slide Option (Subtle footer) */}
              <button
                type="button"
                onClick={() => handleApply(preset, 'new-slide')}
                className="w-full py-1 text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 transition-colors hover:bg-zinc-800/40 rounded cursor-pointer"
              >
                <span>+ Buat Slide Baru dengan font ini</span>
              </button>
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="p-6 text-center text-zinc-500 space-y-1">
            <p className="text-xs">Tidak ada kombinasi font yang cocok.</p>
            <p className="text-[10px]">Coba cari dengan kata kunci lain.</p>
          </div>
        )}
      </div>
    </div>
  );
};
