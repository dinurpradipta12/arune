import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Lock,
  Minus,
  PlusCircle,
  Shapes,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';
import {
  CURATED_EDITORIAL_IMAGES,
  LAYOUT_PRESETS,
  THEME_PALETTES,
} from '../../constants/themesAndPresets';
import {
  type LeftSidebarTab,
  useStudioStore,
} from '../../store/useStudioStore';
import type { LayoutPresetId, ThemePalette } from '../../types/studio';
import { studioLogo } from '../../assets/branding';
import { FontCombinationsPanel } from './FontCombinationsPanel';

/**
 * Renders a rich visual miniature thumbnail of each of the 6 editorial layouts
 * using real photography and theme colors so users can visually pick a layout at a glance.
 */
export const LayoutVisualThumbnail: React.FC<{
  layoutId: LayoutPresetId;
  theme: ThemePalette;
}> = ({ layoutId, theme }) => {
  if (layoutId === 'cover-overlay') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative bg-zinc-900 shadow-inner">
        <img
          src={CURATED_EDITORIAL_IMAGES.coverForest}
          alt="Cover Overlay"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-radial from-black/25 via-black/45 to-black/80 flex flex-col items-center justify-center p-2 text-center">
          <div className="w-10 h-[1.5px] bg-white/50 mb-1.5" />
          <span className="text-[6px] tracking-[0.22em] uppercase text-white/80 font-sans">
            STAYCATION
          </span>
          <span
            className="text-[13px] leading-tight text-white mt-0.5"
            style={{ fontFamily: `'${theme.headingFont}', Georgia, serif` }}
          >
            A Nest
            <br />
            <em className="italic font-normal">Above</em>
          </span>
          <div className="w-5 h-[1px] bg-amber-300/80 my-1.5" />
          <span className="text-[5px] tracking-[0.18em] uppercase text-white/75">
            MUNI FOREST
          </span>
        </div>
      </div>
    );
  }

  if (layoutId === 'editorial-dropcap') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-2 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        {/* Top running header bar */}
        <div
          className="w-full pb-1 border-b flex justify-between items-center"
          style={{ borderColor: theme.divider }}
        >
          <div
            className="w-12 h-1 rounded-xs opacity-50"
            style={{ backgroundColor: theme.textSecondary }}
          />
          <span
            className="text-[5px] font-mono opacity-60"
            style={{ color: theme.textSecondary }}
          >
            02
          </span>
        </div>

        {/* 2-Column Spread: Left Photo + Right Drop-Cap */}
        <div className="flex-1 grid grid-cols-12 gap-1.5 pt-1.5 items-stretch">
          <div className="col-span-5 flex flex-col gap-1">
            <div className="flex-1 rounded-[2px] overflow-hidden bg-black/10">
              <img
                src={CURATED_EDITORIAL_IMAGES.wovenTunnel}
                alt="Editorial Drop-Cap"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="w-4/5 h-1 rounded-xs opacity-45"
              style={{ backgroundColor: theme.textSecondary }}
            />
          </div>

          <div className="col-span-7 flex flex-col justify-between py-0.5">
            <div>
              <div
                className="w-8 h-1 rounded-xs mb-1"
                style={{ backgroundColor: theme.accent }}
              />
              <div
                className="text-[9px] leading-none font-serif mb-1"
                style={{
                  color: theme.textPrimary,
                  fontFamily: `'${theme.headingFont}', Georgia, serif`,
                }}
              >
                A pause <em className="italic">above</em>
              </div>
              <div
                className="w-full h-1 rounded-xs opacity-40 mb-0.5"
                style={{ backgroundColor: theme.textSecondary }}
              />
              <div
                className="w-4/5 h-1 rounded-xs opacity-40"
                style={{ backgroundColor: theme.textSecondary }}
              />
            </div>

            {/* Drop-cap visual block */}
            <div className="flex items-start gap-1 pt-1 border-t border-black/10">
              <span
                className="text-[14px] leading-[0.8] font-serif font-semibold"
                style={{ color: theme.accent }}
              >
                W
              </span>
              <div className="flex-1 space-y-1 pt-0.5">
                <div
                  className="w-full h-1 rounded-xs opacity-65"
                  style={{ backgroundColor: theme.textPrimary }}
                />
                <div
                  className="w-full h-1 rounded-xs opacity-65"
                  style={{ backgroundColor: theme.textPrimary }}
                />
                <div
                  className="w-3/4 h-1 rounded-xs opacity-65"
                  style={{ backgroundColor: theme.textPrimary }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'top-photo-bottom-split') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-2 flex flex-col justify-between gap-1.5 shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        {/* Top Wide Photo */}
        <div className="w-full h-[54%] rounded-[2px] overflow-hidden relative">
          <img
            src={CURATED_EDITORIAL_IMAGES.bambooStaircase}
            alt="Top Photo Split"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Bottom Asymmetric Split */}
        <div className="flex-1 grid grid-cols-12 gap-1.5 pt-0.5 items-start">
          <div className="col-span-5 pr-1">
            <div
              className="w-7 h-1 rounded-xs mb-1"
              style={{ backgroundColor: theme.accent }}
            />
            <div
              className="text-[9.5px] leading-tight font-serif"
              style={{
                color: theme.textPrimary,
                fontFamily: `'${theme.headingFont}', Georgia, serif`,
              }}
            >
              The way <em className="italic">in</em>
            </div>
          </div>

          <div
            className="col-span-7 pl-1.5 border-l space-y-1 pt-0.5"
            style={{ borderColor: theme.divider }}
          >
            <div
              className="w-full h-1 rounded-xs opacity-65"
              style={{ backgroundColor: theme.textPrimary }}
            />
            <div
              className="w-full h-1 rounded-xs opacity-65"
              style={{ backgroundColor: theme.textPrimary }}
            />
            <div
              className="w-5/6 h-1 rounded-xs opacity-65"
              style={{ backgroundColor: theme.textPrimary }}
            />
            <div
              className="w-2/3 h-1 rounded-xs opacity-45"
              style={{ backgroundColor: theme.textSecondary }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'split-vertical-collage') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-2 grid grid-cols-12 gap-1.5 shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        {/* Left Prose Column */}
        <div className="col-span-5 flex flex-col justify-between py-1">
          <div className="space-y-1">
            <div
              className="w-7 h-1 rounded-xs"
              style={{ backgroundColor: theme.accent }}
            />
            <div
              className="text-[9px] leading-tight font-serif"
              style={{
                color: theme.textPrimary,
                fontFamily: `'${theme.headingFont}', Georgia, serif`,
              }}
            >
              Inside <em className="italic">the nest</em>
            </div>
            <div
              className="w-5 h-[1.5px] my-1"
              style={{ backgroundColor: theme.accent }}
            />
            <div
              className="w-full h-1 rounded-xs opacity-60"
              style={{ backgroundColor: theme.textPrimary }}
            />
            <div
              className="w-full h-1 rounded-xs opacity-60"
              style={{ backgroundColor: theme.textPrimary }}
            />
            <div
              className="w-4/5 h-1 rounded-xs opacity-60"
              style={{ backgroundColor: theme.textPrimary }}
            />
          </div>

          <div
            className="w-3/4 h-1 rounded-xs opacity-40"
            style={{ backgroundColor: theme.textSecondary }}
          />
        </div>

        {/* Right 2 Stacked Vertical Photos */}
        <div className="col-span-7 flex flex-col gap-1.5 h-full">
          <div className="flex-1 rounded-[2px] overflow-hidden">
            <img
              src={CURATED_EDITORIAL_IMAGES.roomInterior1}
              alt="Collage 1"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 rounded-[2px] overflow-hidden">
            <img
              src={CURATED_EDITORIAL_IMAGES.roomInterior2}
              alt="Collage 2"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'full-bleed-bottom-story') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative bg-zinc-900 shadow-inner">
        <img
          src={CURATED_EDITORIAL_IMAGES.sunlitBalcony}
          alt="Full Bleed Story"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/30 to-black/85 flex flex-col justify-between p-2">
          <div className="w-full border-b border-white/25 pb-1 flex justify-between">
            <div className="w-10 h-1 bg-white/50 rounded-xs" />
            <span className="text-[5px] text-white/70 font-mono">05</span>
          </div>

          <div className="space-y-1">
            <span className="text-[5px] uppercase tracking-[0.2em] text-amber-300 block">
              CHAPTER THREE
            </span>
            <div
              className="text-[10.5px] leading-tight text-white font-serif"
              style={{ fontFamily: `'${theme.headingFont}', Georgia, serif` }}
            >
              Where the <em className="italic">light</em> lands
            </div>
            <div className="w-full h-1 bg-white/70 rounded-xs" />
            <div className="w-4/5 h-1 bg-white/55 rounded-xs" />
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'editorial-bento-grid') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-2 flex flex-col gap-1.5 shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        {/* Top Split Intro */}
        <div className="grid grid-cols-12 gap-1 items-end pb-0.5">
          <div className="col-span-6">
            <div
              className="w-6 h-1 rounded-xs mb-0.5"
              style={{ backgroundColor: theme.accent }}
            />
            <div
              className="text-[8.5px] leading-none font-serif"
              style={{
                color: theme.textPrimary,
                fontFamily: `'${theme.headingFont}', Georgia, serif`,
              }}
            >
              Small <em className="italic">discoveries</em>
            </div>
          </div>
          <div className="col-span-6 space-y-0.5">
            <div
              className="w-full h-1 rounded-xs opacity-55"
              style={{ backgroundColor: theme.textPrimary }}
            />
            <div
              className="w-4/5 h-1 rounded-xs opacity-55"
              style={{ backgroundColor: theme.textPrimary }}
            />
          </div>
        </div>

        {/* 4-Photo Asymmetric Bento Grid (1 Tall Left + 3 Stacked Right) */}
        <div className="flex-1 grid grid-cols-12 gap-1 min-h-0">
          <div className="col-span-7 rounded-[2px] overflow-hidden h-full">
            <img
              src={CURATED_EDITORIAL_IMAGES.bentoStones}
              alt="Bento Left"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="col-span-5 grid grid-rows-3 gap-1 h-full">
            <div className="rounded-[2px] overflow-hidden">
              <img
                src={CURATED_EDITORIAL_IMAGES.bentoPond}
                alt="Bento Top Right"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-[2px] overflow-hidden">
              <img
                src={CURATED_EDITORIAL_IMAGES.bentoPath}
                alt="Bento Mid Right"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-[2px] overflow-hidden">
              <img
                src={CURATED_EDITORIAL_IMAGES.bentoGarden}
                alt="Bento Bottom Right"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== MEDIA LAYOUTS =====================
  if (layoutId === 'media-breaking-cover') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div className="space-y-1">
          <div
            className="w-12 h-2 rounded-[2px] text-[4.5px] font-bold text-white uppercase flex items-center justify-center tracking-wider"
            style={{ backgroundColor: theme.accent }}
          >
            BREAKING
          </div>
          <div
            className="text-[9px] font-bold leading-tight line-clamp-2"
            style={{ color: theme.textPrimary }}
          >
            IHSG Menguat & AI Masuk Redaksi
          </div>
        </div>

        <div className="w-full h-[45%] rounded-[2px] overflow-hidden relative my-0.5">
          <img
            src={CURATED_EDITORIAL_IMAGES.mediaNewsHero}
            alt="Media Cover"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-0.5">
          <div
            className="w-full h-1 rounded-xs opacity-60"
            style={{ backgroundColor: theme.textSecondary }}
          />
          <div
            className="w-3/4 h-1 rounded-xs opacity-40"
            style={{ backgroundColor: theme.textSecondary }}
          />
        </div>
      </div>
    );
  }

  if (layoutId === 'media-stat-card') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div className="w-full pb-0.5 border-b flex justify-between" style={{ borderColor: theme.divider }}>
          <div className="w-10 h-1 rounded-xs opacity-50" style={{ backgroundColor: theme.textSecondary }} />
          <span className="text-[5px] font-bold" style={{ color: theme.accent }}>01</span>
        </div>

        <div
          className="w-full h-[44%] rounded-[3px] border p-1 flex flex-col justify-center items-center text-center my-1"
          style={{ backgroundColor: theme.surface, borderColor: theme.divider }}
        >
          <span className="text-[14px] font-extrabold leading-none" style={{ color: theme.accent }}>
            +78%
          </span>
          <span className="text-[5px] font-bold uppercase tracking-wider mt-0.5" style={{ color: theme.textPrimary }}>
            ADOPSI RISET
          </span>
        </div>

        <div className="space-y-1">
          <div className="w-full h-1 rounded-xs opacity-70" style={{ backgroundColor: theme.textPrimary }} />
          <div className="w-5/6 h-1 rounded-xs opacity-50" style={{ backgroundColor: theme.textSecondary }} />
        </div>
      </div>
    );
  }

  if (layoutId === 'media-quote-split') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div className="w-full pb-0.5 border-b" style={{ borderColor: theme.divider }}>
          <div className="w-12 h-1 rounded-xs opacity-50" style={{ backgroundColor: theme.textSecondary }} />
        </div>

        <div className="flex gap-1.5 my-1">
          <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
          <div className="text-[7.5px] italic font-serif leading-tight line-clamp-3" style={{ color: theme.textPrimary }}>
            "Teknologi mempercepat verifikasi data, tapi nurani di tangan manusia."
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1 border-t border-black/10">
          <img
            src={CURATED_EDITORIAL_IMAGES.mediaSpeaker}
            alt="Speaker"
            crossOrigin="anonymous"
            className="w-5 h-5 rounded-full object-cover"
          />
          <div className="space-y-0.5">
            <div className="w-10 h-1 rounded-xs" style={{ backgroundColor: theme.textPrimary }} />
            <div className="w-7 h-1 rounded-xs opacity-50" style={{ backgroundColor: theme.textSecondary }} />
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'media-timeline-list') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div className="w-12 h-1 rounded-xs opacity-50 mb-1" style={{ backgroundColor: theme.textSecondary }} />
        <div className="text-[8.5px] font-bold leading-none mb-1" style={{ color: theme.textPrimary }}>
          3 Sorotan Poin
        </div>

        <div className="space-y-1.5 flex-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-start gap-1">
              <span
                className="w-3 h-3 rounded-[2px] text-[5px] font-bold text-white flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme.accent }}
              >
                0{n}
              </span>
              <div className="flex-1 space-y-0.5">
                <div className="w-3/4 h-1 rounded-xs" style={{ backgroundColor: theme.textPrimary }} />
                <div className="w-full h-1 rounded-xs opacity-50" style={{ backgroundColor: theme.textSecondary }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layoutId === 'media-outro-cta') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between items-center text-center shadow-inner"
        style={{ backgroundColor: theme.darkBackground }}
      >
        <div
          className="px-1.5 py-0.5 rounded-[2px] text-[4.5px] font-bold text-white uppercase tracking-wider"
          style={{ backgroundColor: theme.accent }}
        >
          NEWSROOM
        </div>

        <div className="text-[9px] font-bold text-white leading-tight">
          Simpan & Bagikan Edisi Ini
        </div>

        <div className="w-full space-y-1">
          <div className="w-full h-3 rounded-[3px] text-[5px] text-white flex items-center justify-center bg-white/15">
            ↗ Bagikan
          </div>
          <div
            className="w-full h-3 rounded-[3px] text-[5px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: theme.accent }}
          >
            ★ Simpan
          </div>
        </div>

        <span className="text-[4.5px] text-white/60">@dailybrief.id</span>
      </div>
    );
  }

  // ===================== MINIMALIST LAYOUTS =====================
  if (layoutId === 'minimal-bold-cover') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-2 flex flex-col justify-between bg-white text-zinc-900 shadow-inner">
        <span className="text-[5.5px] font-mono text-zinc-400">[ 01 / 04 ]</span>

        <div className="my-auto">
          <div className="text-[14px] font-black tracking-tight leading-none text-zinc-950">
            Less,
            <br />
            better.
          </div>
        </div>

        <div className="space-y-1 pt-1 border-t border-zinc-200">
          <div className="w-3/4 h-1 bg-zinc-800 rounded-xs" />
          <span className="text-[4.5px] font-mono text-zinc-400 uppercase">SWISS TYPO</span>
        </div>
      </div>
    );
  }

  if (layoutId === 'minimal-quote-focus') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-2 flex flex-col justify-between items-center text-center bg-white text-zinc-900 shadow-inner">
        <div className="w-10 h-1 bg-zinc-300 rounded-xs self-start" />

        <div className="my-auto px-1">
          <span className="text-[8.5px] font-semibold leading-tight text-zinc-900 block">
            "Ruang kosong bekerja."
          </span>
          <div className="w-4 h-[1px] bg-zinc-900 mx-auto my-1" />
          <span className="text-[5px] uppercase font-mono tracking-wider text-zinc-500">
            DIETER RAMS
          </span>
        </div>

        <div className="w-full h-1 bg-zinc-200 rounded-xs" />
      </div>
    );
  }

  if (layoutId === 'minimal-photo-frame') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between bg-white text-zinc-900 shadow-inner">
        <div className="w-full h-[58%] overflow-hidden relative bg-zinc-100 border border-zinc-200">
          <img
            src={CURATED_EDITORIAL_IMAGES.minimalistArch}
            alt="Minimal Arch"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-0.5 pt-1">
          <span className="text-[5px] font-mono text-zinc-400">FIG 02</span>
          <div className="text-[8.5px] font-bold text-zinc-900">Geometri Bersih</div>
          <div className="w-4/5 h-1 bg-zinc-300 rounded-xs" />
        </div>
      </div>
    );
  }

  if (layoutId === 'minimal-numbered-list') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between bg-white text-zinc-900 shadow-inner">
        <div className="text-[8.5px] font-bold text-zinc-950 mb-1">3 Prinsip</div>

        <div className="space-y-1.5 flex-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border-t border-zinc-200 pt-1 flex items-start gap-1">
              <span className="text-[6.5px] font-bold font-mono text-zinc-900">0{n}</span>
              <div className="space-y-0.5 flex-1">
                <div className="w-2/3 h-1 bg-zinc-800 rounded-xs" />
                <div className="w-full h-0.5 bg-zinc-300 rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===================== PLAYFUL LAYOUTS =====================
  if (layoutId === 'playful-hero-cover') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div>
          <span
            className="px-1.5 py-0.5 rounded-full text-[4.5px] font-bold text-white uppercase"
            style={{ backgroundColor: theme.accent }}
          >
            ✨ REKOMENDASI
          </span>
          <div
            className="text-[9.5px] font-extrabold leading-tight mt-1"
            style={{ color: theme.textPrimary }}
          >
            Weekend Fun!
          </div>
        </div>

        <div className="w-full h-[46%] rounded-lg overflow-hidden relative my-0.5 shadow-xs">
          <img
            src={CURATED_EDITORIAL_IMAGES.playfulPicnic}
            alt="Playful Hero"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        </div>

        <div
          className="w-full py-0.5 rounded-md text-[5.5px] font-bold text-center"
          style={{ backgroundColor: theme.surface, color: theme.textPrimary }}
        >
          4 IDE SERU AKHIR PEKAN →
        </div>
      </div>
    );
  }

  if (layoutId === 'playful-card-step') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div
          className="w-full h-full rounded-xl border p-1.5 flex flex-col justify-between"
          style={{ backgroundColor: theme.surface, borderColor: theme.divider }}
        >
          <div className="flex items-center gap-1">
            <span
              className="w-3.5 h-3.5 rounded-full text-[6px] font-bold text-white flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.accent }}
            >
              1
            </span>
            <span className="text-[7.5px] font-bold truncate" style={{ color: theme.textPrimary }}>
              Piknik Taman 🌿
            </span>
          </div>

          <div className="w-full h-[45%] rounded-lg overflow-hidden my-0.5">
            <img
              src={CURATED_EDITORIAL_IMAGES.playfulBakery}
              alt="Playful Bakery"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-0.5">
            <div className="w-full h-1 rounded-xs opacity-75" style={{ backgroundColor: theme.textPrimary }} />
            <div className="w-4/5 h-1 rounded-xs opacity-50" style={{ backgroundColor: theme.textSecondary }} />
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'playful-dual-cards') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div className="text-[7.5px] font-bold" style={{ color: theme.textPrimary }}>
          Dua Pilihan Seru
        </div>

        <div className="grid grid-cols-2 gap-1 flex-1 my-1">
          <div
            className="rounded-lg border p-1 flex flex-col justify-between"
            style={{ backgroundColor: theme.surface, borderColor: theme.divider }}
          >
            <div className="w-full h-[55%] rounded-md overflow-hidden">
              <img
                src={CURATED_EDITORIAL_IMAGES.playfulCraft}
                alt="Craft"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[5.5px] font-bold" style={{ color: theme.textPrimary }}>
              A. Pottery
            </span>
          </div>

          <div
            className="rounded-lg border p-1 flex flex-col justify-between"
            style={{ backgroundColor: theme.surface, borderColor: theme.divider }}
          >
            <div className="w-full h-[55%] rounded-md overflow-hidden">
              <img
                src={CURATED_EDITORIAL_IMAGES.playfulStreet}
                alt="Street"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[5.5px] font-bold" style={{ color: theme.textPrimary }}>
              B. Bakery
            </span>
          </div>
        </div>

        <div className="w-full h-1 rounded-xs opacity-40" style={{ backgroundColor: theme.textSecondary }} />
      </div>
    );
  }

  if (layoutId === 'playful-bento-fun') {
    return (
      <div
        className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        <div className="text-[7.5px] font-bold" style={{ color: theme.textPrimary }}>
          Activity Bento
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-1 flex-1 my-1">
          {['🎲 Games', '📸 Foto', '🍿 Movie', '🍹 Soda'].map((title) => (
            <div
              key={title}
              className="rounded-lg border p-1 flex flex-col justify-center"
              style={{ backgroundColor: theme.surface, borderColor: theme.divider }}
            >
              <span className="text-[6px] font-bold" style={{ color: theme.textPrimary }}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layoutId === 'typo-untold-story') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative bg-zinc-900 shadow-inner">
        <img
          src={CURATED_EDITORIAL_IMAGES.typoUntoldKids}
          alt="Untold Story"
          crossOrigin="anonymous"
          className="w-full h-full object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-black/35 p-2 flex flex-col justify-between">
          <div className="text-[7px] font-bold text-white">03.</div>
          <div className="space-y-0.5">
            <div className="text-[4.5px] tracking-[0.22em] text-white/85 uppercase">
              THEUNTOLD STORIES
            </div>
            <div className="text-[11px] font-extrabold text-white leading-none">
              happiness
              <br />
              is simple.
            </div>
            <div className="text-[5px] text-white/85 font-semibold pt-0.5">
              Menikmati Sore hari
            </div>
          </div>
          <div className="text-[4.5px] text-white font-bold text-right">
            instastories by zaa
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'typo-playful-arch') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative bg-zinc-900 shadow-inner">
        <img
          src={CURATED_EDITORIAL_IMAGES.typoGoldenPaddy}
          alt="Playful Arch"
          crossOrigin="anonymous"
          className="w-full h-full object-cover brightness-95"
        />
        <div className="absolute inset-0 bg-black/25 p-2 flex flex-col justify-between items-center text-center">
          <div className="mt-2 space-y-0.5">
            <div className="text-[5px] font-bold text-white -rotate-3">Jarang</div>
            <div
              className="text-[11px] font-extrabold text-white leading-none"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              TerlihaT
            </div>
            <div className="text-[5px] font-bold text-white">Tapi Sering</div>
            <div
              className="text-[11px] font-extrabold text-white leading-none"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              TerlibaT
            </div>
          </div>
          <div className="text-[4px] text-white/90 font-medium">
            www.instagram.com/firman_nhakim
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'typo-brush-satire') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative bg-zinc-900 shadow-inner">
        <img
          src={CURATED_EDITORIAL_IMAGES.typoDarkPaddy}
          alt="Brush Satire"
          crossOrigin="anonymous"
          className="w-full h-full object-cover brightness-85"
        />
        <div className="absolute inset-0 bg-black/45 p-2 flex flex-col justify-between items-center text-center">
          <div
            className="mt-1.5 space-y-0.5 text-white"
            style={{ fontFamily: "'Caveat Brush', cursive" }}
          >
            <div className="text-[4.5px] tracking-wider">RAKYAT NYA SIBUK MENCARI SESUAP</div>
            <div className="text-[15px] leading-none">NASI</div>
            <div className="text-[5px] tracking-wider">EH PEJABATNYA SIBUK</div>
            <div className="text-[10px] leading-none">KORUPSI</div>
          </div>
          <div className="flex items-center gap-1.5 text-[4.5px] text-white font-bold">
            <span className="opacity-80">Reels</span>
            <span className="px-1 py-0.2 border border-white rounded-[2px]">Feed</span>
            <span className="opacity-80">Story</span>
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'typo-cinematic-indie') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative bg-zinc-950 shadow-inner">
        <img
          src={CURATED_EDITORIAL_IMAGES.typoNightWindow}
          alt="Cinematic Indie"
          crossOrigin="anonymous"
          className="w-full h-full object-cover brightness-85"
        />
        <div className="absolute inset-0 bg-black/40 p-2 flex flex-col justify-between">
          <div
            className="flex justify-between text-[5px]"
            style={{ color: '#E85D35', fontFamily: "'Space Mono', monospace" }}
          >
            <span>Pause.</span>
            <span>Breathe.</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-light text-stone-100 leading-none">
              Thoughts
              <br />
              shape
              <br />
              reality
            </div>
            <div
              className="text-[4.5px] text-stone-300 pt-0.5"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Choose them with love
            </div>
          </div>
          <div
            className="text-[4.5px] text-center"
            style={{ color: '#E85D35', fontFamily: "'Space Mono', monospace" }}
          >
            Whats inside matters more.
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'typo-split-journal') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative bg-zinc-950 flex flex-col shadow-inner">
        <div className="relative h-[52%] w-full overflow-hidden">
          <img
            src={CURATED_EDITORIAL_IMAGES.typoStreetCat}
            alt="Top Split"
            crossOrigin="anonymous"
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-black/35 p-1.5 flex flex-col justify-between">
            <div className="text-[4.5px] text-white font-semibold leading-tight">
              // day 22
              <br />
              Ramadhan
            </div>
            <div className="pl-2">
              <div className="text-[4px] text-white/80">//restingtime</div>
              <div className="text-[7.5px] font-extrabold text-white leading-none">
                reminder
                <br />
                today with
                <br />
                resting
              </div>
            </div>
            <div className="text-[4px] text-white/85 text-right">
              Padahal Allah lebih deket...
            </div>
          </div>
        </div>
        <div className="relative h-[48%] w-full overflow-hidden">
          <img
            src={CURATED_EDITORIAL_IMAGES.typoDarkFoliage}
            alt="Bottom Split"
            crossOrigin="anonymous"
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-black/30 p-1.5 flex items-end justify-between text-[4.5px] text-white font-semibold">
            <span>
              Archive by <em className="italic">Kohh</em>
            </span>
            <span>#shooton samsung</span>
          </div>
        </div>
      </div>
    );
  }

  // 'playful-outro-cta' / default
  return (
    <div
      className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between items-center text-center shadow-inner"
      style={{ backgroundColor: theme.darkBackground }}
    >
      <span
        className="px-1.5 py-0.5 rounded-full text-[4.5px] font-bold text-white uppercase"
        style={{ backgroundColor: theme.accent }}
      >
        ✨ INTERAKSI
      </span>

      <div className="text-[8.5px] font-bold text-white leading-tight">
        Mana Yang Mau Dicoba?
      </div>

      <div className="w-full space-y-1">
        <div className="w-full h-2.5 rounded-full text-[4.5px] font-bold text-white flex items-center justify-center bg-white/20">
          ❤️ Suka
        </div>
        <div
          className="w-full h-2.5 rounded-full text-[4.5px] font-bold text-white flex items-center justify-center"
          style={{ backgroundColor: theme.accent }}
        >
          💬 Komen
        </div>
        <div className="w-full h-2.5 rounded-full text-[4.5px] font-bold text-white flex items-center justify-center bg-white/20">
          🔖 Simpan
        </div>
      </div>

      <span className="text-[4.5px] text-white/60">@funclub.weekly</span>
    </div>
  );
};

export const LeftSidebar: React.FC = () => {
  const {
    leftSidebarOpen,
    activeLeftTab,
    setActiveLeftTab,
    activeThemeId,
    setActiveTheme,
    getActiveTheme,
    slides,
    activeSlideIndex,
    applyLayoutToSlide,
    applyLayoutToAllSlides,
    addElement,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    adjustElementZIndex,
    deleteElement,
    settings,
  } = useStudioStore();

  const [layoutFilter, setLayoutFilter] = useState<
    'All' | 'Editorial' | 'Media' | 'Minimalist' | 'Playful' | 'Typography'
  >('All');
  const [layoutScope, setLayoutScope] = useState<'current' | 'all'>('current');

  if (!leftSidebarOpen) return null;

  const activeSlide = slides[activeSlideIndex] || slides[0];
  const activeTheme = getActiveTheme();

  return (
    <aside className="w-72 border-r border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0 select-none z-20 h-full overflow-hidden">
      {/* Sidebar Brand Header with Favicon Logo */}
      <div className="h-11 px-3 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={studioLogo}
            alt="Arune Studio Logo"
            className="w-7 h-7 object-contain shrink-0 rounded"
          />
          <span className="text-xs font-bold text-zinc-200 truncate">
            {settings.studioName || 'Arune Carousel Studio'}
          </span>
        </div>
      </div>

      {/* 3-Tab Switcher Header: Add Elements, Layouts & Themes, Font Combinations */}
      <div className="grid grid-cols-3 p-1.5 gap-1 bg-zinc-900/50 border-b border-zinc-800/80 shrink-0">
        {(
          [
            { id: 'elements', label: 'Elements', icon: PlusCircle },
            { id: 'templates', label: 'Layouts', icon: LayoutGrid },
            { id: 'font-combinations', label: 'Font Pairs', icon: Type },
          ] as { id: LeftSidebarTab; label: string; icon: React.ElementType }[]
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeLeftTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLeftTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-zinc-800 text-blue-900 font-semibold shadow-xs border border-zinc-700/70'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ADD ELEMENTS & LAYER STACK (Default Active Tab) */}
      {activeLeftTab === 'elements' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scroller-dark">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
              Add Editorial Objects
            </h3>
            <p className="text-[11px] text-zinc-400">
              Insert freeform draggable elements onto Slide{' '}
              {String(activeSlideIndex + 1).padStart(2, '0')}.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => addElement('text')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
              >
                <Type className="w-4 h-4 text-blue-900" />
                <span className="text-xs font-medium">Add Text</span>
                <span className="text-[10px] text-zinc-500">Serif / Sans</span>
              </button>

              <button
                type="button"
                onClick={() => addElement('image')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-blue-900" />
                <span className="text-xs font-medium">Photo Frame</span>
                <span className="text-[10px] text-zinc-500">Pan & Zoom</span>
              </button>

              <button
                type="button"
                onClick={() => addElement('shape')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-500/50 text-zinc-200 transition-all cursor-pointer group"
              >
                <Shapes className="w-4 h-4 text-blue-900 group-hover:text-blue-400 transition-colors" />
                <span className="text-xs font-medium">Shape</span>
                <span className="text-[10px] text-zinc-500">Box / Circle</span>
              </button>

              <button
                type="button"
                onClick={() => addElement('divider')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
              >
                <Minus className="w-4 h-4 text-blue-900" />
                <span className="text-xs font-medium">Divider Line</span>
                <span className="text-[10px] text-zinc-500">Rule / Hairline</span>
              </button>

              <button
                type="button"
                onClick={() => addElement('badge')}
                className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-blue-900/40 text-zinc-200 transition-all cursor-pointer"
              >
                <BadgeCheck className="w-4 h-4 text-blue-900" />
                <span className="text-xs font-medium">Issue Badge</span>
                <span className="text-[10px] text-zinc-500">· Pill Stamp</span>
              </button>
            </div>
          </div>

          {/* Active Slide Layers List (Z-Index Ordered) */}
          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-900" />
                <span>Slide Layers ({activeSlide?.elements.length || 0})</span>
              </h3>
              <span className="text-[10px] text-zinc-500">Depan → Belakang</span>
            </div>

            <div className="space-y-1">
              {[...(activeSlide?.elements || [])]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => {
                  const isSel = selectedElementId === el.id;
                  return (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                        isSel
                          ? 'bg-blue-900/10 border-blue-900/40 text-blue-900 font-semibold'
                          : 'bg-zinc-900/75 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          title={`Layer Type: ${el.type.toUpperCase()} (z${el.zIndex})`}
                          className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSel
                              ? 'bg-blue-900/20 border-blue-900/40 text-blue-900'
                              : 'bg-zinc-800/90 border-zinc-700/70 text-blue-900'
                          }`}
                        >
                          {el.type === 'image' ? (
                            <ImageIcon className="w-3.5 h-3.5" />
                          ) : el.type === 'badge' ? (
                            <BadgeCheck className="w-3.5 h-3.5" />
                          ) : el.type === 'divider' ? (
                            <Minus className="w-3.5 h-3.5" />
                          ) : el.type === 'shape' ? (
                            <Shapes className="w-3.5 h-3.5" />
                          ) : (
                            <Type className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <span
                          className={`truncate ${
                            el.hidden ? 'line-through opacity-45' : ''
                          }`}
                        >
                          {el.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustElementZIndex(el.id, 'front');
                          }}
                          title="Bring to Front"
                          className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                        >
                          <ArrowUpToLine className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustElementZIndex(el.id, 'forward');
                          }}
                          title="Bring Forward (z+1)"
                          className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustElementZIndex(el.id, 'backward');
                          }}
                          title="Send Backward (z-1)"
                          className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustElementZIndex(el.id, 'back');
                          }}
                          title="Send to Back"
                          className="p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElement(el.id, { locked: !el.locked }, true);
                          }}
                          title={el.locked ? 'Unlock Layer' : 'Lock Layer'}
                          className={`p-0.5 rounded hover:bg-zinc-800 ${
                            el.locked ? 'text-blue-900' : 'text-zinc-400'
                          }`}
                        >
                          {el.locked ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            <Unlock className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElement(el.id, { hidden: !el.hidden }, true);
                          }}
                          title={el.hidden ? 'Show Layer' : 'Hide Layer'}
                          className={`p-0.5 rounded hover:bg-zinc-800 ${
                            el.hidden ? 'text-red-400' : 'text-zinc-400'
                          }`}
                        >
                          {el.hidden ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(el.id);
                          }}
                          title="Delete Element"
                          className="p-0.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL THUMBNAIL LAYOUTS & MAGAZINE THEMES */}
      {activeLeftTab === 'templates' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scroller-dark">
          {/* Section A: 2-Column Visual Thumbnail Grid for Slide Layouts */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
                {layoutScope === 'all'
                  ? `Format Semua Slide (${slides.length})`
                  : `Slide ${String(activeSlideIndex + 1).padStart(2, '0')} Layout`}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/10 text-blue-900 border border-blue-900/30 font-medium">
                {LAYOUT_PRESETS.length} Layouts
              </span>
            </div>

            {/* Scope Toggle: Single Slide vs All Slides */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setLayoutScope('current')}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer ${
                  layoutScope === 'current'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Slide Ini ({String(activeSlideIndex + 1).padStart(2, '0')})
              </button>
              <button
                type="button"
                onClick={() => setLayoutScope('all')}
                className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer ${
                  layoutScope === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Semua Slide ({slides.length})
              </button>
            </div>

            {/* Layout Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scroller-none text-[10px]">
              {(['All', 'Editorial', 'Media', 'Minimalist', 'Playful', 'Typography'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLayoutFilter(cat)}
                    className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                      layoutFilter === cat
                        ? 'bg-blue-900 text-white font-medium shadow-xs'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_PRESETS.filter(
                (p) => layoutFilter === 'All' || p.category === layoutFilter
              ).map((preset) => {
                const isCurrent = activeSlide?.layout === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (layoutScope === 'all') {
                        applyLayoutToAllSlides(preset.id);
                      } else {
                        applyLayoutToSlide(activeSlideIndex, preset.id);
                      }
                    }}
                    title={preset.description}
                    className={`group text-left p-1.5 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-900/10 border-blue-900 ring-1 ring-blue-900/40 shadow-md'
                        : 'bg-zinc-900/75 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Visual Thumbnail Preview */}
                    <div className="w-full relative rounded-xs overflow-hidden ring-1 ring-white/10 group-hover:scale-[1.01] transition-transform">
                      <LayoutVisualThumbnail
                        layoutId={preset.id}
                        theme={activeTheme}
                      />

                      {/* Active Check Badge on Corner */}
                      {isCurrent && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-900 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Compact Caption Under Thumbnail */}
                    <div className="px-0.5 flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-medium truncate ${
                          isCurrent ? 'text-blue-900 font-semibold' : 'text-zinc-200'
                        }`}
                      >
                        {preset.name}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        {preset.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Visual Magazine Color & Typography Cards */}
          <div className="space-y-2.5 pt-3 border-t border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
              Magazine Color & Font Themes
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {THEME_PALETTES.map((palette) => {
                const selected = activeThemeId === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setActiveTheme(palette.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2.5 cursor-pointer ${
                      selected
                        ? 'bg-zinc-900 border-blue-900 ring-1 ring-blue-900/30'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/90'
                    }`}
                  >
                    {/* Visual Mini Magazine Page Swatch */}
                    <div
                      className="w-12 h-14 rounded border border-black/15 shrink-0 p-1.5 flex flex-col justify-between relative overflow-hidden shadow-xs"
                      style={{ backgroundColor: palette.background }}
                    >
                      <div
                        className="w-5 h-[1.5px]"
                        style={{ backgroundColor: palette.accent }}
                      />
                      <div
                        className="text-sm leading-none font-serif"
                        style={{
                          color: palette.textPrimary,
                          fontFamily: `'${palette.headingFont}', Georgia, serif`,
                        }}
                      >
                        Aa
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: palette.darkBackground }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: palette.accent }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: palette.surface }}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {palette.name}
                        </span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10.5px] text-zinc-400 truncate mt-0.5">
                        {palette.subtitle}
                      </p>
                      <p className="text-[9.5px] text-blue-900 font-mono font-medium truncate mt-1">
                        {palette.headingFont}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CURATED FONT COMBINATIONS (Adobe 10 & Canva Pairings) */}
      {activeLeftTab === 'font-combinations' && <FontCombinationsPanel />}
    </aside>
  );
};
