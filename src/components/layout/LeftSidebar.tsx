import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  BadgeCheck,
  Check,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Lock,
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

  if (layoutId === 'feed-plm-community') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner bg-[#FAF9F5] text-zinc-900 border border-black/10">
        <div className="flex justify-between items-center text-[5px] font-serif font-bold text-zinc-800">
          <span>&lt; plm.</span>
          <span className="font-sans text-[4px] opacity-75">≡ 🔍 +</span>
        </div>
        <div className="relative my-auto flex flex-col items-center leading-tight">
          <div className="absolute -top-3 left-1 bg-[#B7E4A8] border border-black text-[3px] px-1 py-0.2 rounded font-serif">
            Courses &amp; Tools
          </div>
          <span className="text-[7.5px] font-black font-serif tracking-tight">the</span>
          <div className="relative w-full flex justify-center items-center">
            <div className="absolute inset-x-0 h-3 bg-[#FBCFE8] rounded-xs -z-0" />
            <span className="relative z-10 text-[7px] font-black font-serif tracking-tight">community</span>
          </div>
          <span className="text-[7px] font-black font-serif tracking-tight">for social</span>
          <span className="text-[8px] font-black font-serif tracking-tight">media</span>
          <span className="text-[7.5px] font-black font-serif tracking-tight">marketers.</span>
          <div className="absolute right-0 top-3 bg-white border border-black text-[3px] px-1 py-0.2 rounded-full font-bold shadow-xs">
            ● Community ↖
          </div>
        </div>
        <div className="flex justify-center">
          <div className="bg-[#BAE6FD] border border-black px-1.5 py-0.5 rounded text-[5px] font-serif font-bold">
            plm. ↖
          </div>
        </div>
      </div>
    );
  }

  if (layoutId === 'feed-action-clarity') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between items-center text-center shadow-inner bg-[#F3F4F6] text-zinc-900 border border-black/10">
        <div className="flex items-center gap-1 text-[4px] font-bold text-zinc-800 pt-0.5">
          <span className="w-2 h-2 rounded-full bg-black text-white flex items-center justify-center text-[3px]">E.</span>
          <span>ELLA CONTENT CLUB</span>
          <span className="bg-blue-500 text-white px-1 py-0.2 rounded-[2px] text-[3px]">Follow</span>
        </div>
        <div className="my-auto flex flex-col items-center">
          <div className="text-[5px] mb-0.5 opacity-60">💬</div>
          <div className="text-[6.5px] font-black underline tracking-tight">Action creates</div>
          <div className="relative px-2 py-0.5 bg-[#FCE7F3] border border-[#F472B6] rounded-xs my-0.5">
            <span className="text-[12px] font-black tracking-tight leading-none">clarity.</span>
            <span className="absolute -top-1 -right-2 text-[6px]">✨</span>
          </div>
          <div className="text-[5px] font-normal text-zinc-600 mt-0.5">Not overthinking.</div>
        </div>
        <div className="w-6 h-[1px] bg-zinc-300 mb-0.5" />
      </div>
    );
  }

  if (layoutId === 'feed-backspace-content') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner bg-[#F5F4F0] text-[#1F1917] border border-black/10">
        <div className="flex justify-between items-center text-[4px] font-bold">
          <span>backspace | STUDIO</span>
          <span className="text-[3.5px] font-normal opacity-70">studiobackspace.com</span>
        </div>
        <div className="my-auto flex flex-col items-start pl-1">
          <div className="text-[7.5px] font-extrabold tracking-tight leading-none text-[#33221E]">your brand</div>
          <div className="text-[8.5px] font-extrabold tracking-tight leading-none text-[#33221E]">deserves</div>
          <div className="relative w-full max-w-[85%] bg-[#D8DEFD] border border-[#3B49DF] rounded-xs px-1 py-0.5 my-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2B3BE5] absolute -top-1 -left-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#2B3BE5] absolute -bottom-1 -right-1" />
            <span className="text-[8px] font-serif italic font-bold text-[#2E2259] leading-none block">better content</span>
          </div>
          <div className="text-[4.5px] font-normal text-[#292524] mt-0.5">And <em>this</em> is where that begins.</div>
          <div className="bg-[#18181B] text-white px-1.5 py-0.5 rounded-[3px] text-[3.5px] font-semibold mt-1.5 flex items-center gap-1">
            <span>let's chat</span>
            <span className="text-[2.5px]">▶</span>
          </div>
        </div>
        <div />
      </div>
    );
  }

  if (layoutId === 'feed-designer-gatekeep') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between items-center text-center shadow-inner bg-[#FAF8F5] text-zinc-900 border border-black/10">
        <div className="text-[3.5px] font-bold tracking-widest uppercase opacity-75">TIPS + TRICKS FOR DESIGNERS</div>
        <div className="my-auto flex flex-col items-center">
          <span className="text-[8px]">👩‍💻</span>
          <div className="text-[9px] font-serif font-black leading-none tracking-tight">Designers</div>
          <div className="relative w-full my-0.5 flex justify-center items-center">
            <div className="absolute inset-0 border border-[#1D4ED8] rounded-full scale-105" />
            <span className="absolute -left-1 text-[5px]">📁</span>
            <span className="text-[10px] font-serif font-black leading-none tracking-tight">don't</span>
          </div>
          <div className="text-[10px] font-serif font-black leading-none tracking-tight relative">
            gatekeep.
            <span className="absolute -right-2 top-0 text-[5px]">👀</span>
          </div>
          <div className="text-[6px] font-serif italic font-bold text-[#1E40AF] mt-0.5 -rotate-3">Designer Edition</div>
        </div>
        <div className="text-[3px] font-semibold tracking-wider text-zinc-500">————→ @MINELOVESDESIGN</div>
      </div>
    );
  }

  if (layoutId === 'feed-burnout-designer') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner bg-white text-zinc-900 border border-black/10">
        <div className="text-center text-[6px] font-black text-[#0F3B59]">Atin✦</div>
        <div className="my-auto flex flex-col items-start pl-1 space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="border border-black px-1 text-[5.5px] font-black">One</span>
            <span className="text-[6px]">✏️</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8.5px] font-black tracking-tight leading-none">Sentence</span>
            <span className="border border-black px-0.5 text-[5px] font-black">for</span>
          </div>
          <div className="flex items-center gap-1 w-full">
            <span className="text-[8.5px] font-black tracking-tight leading-none">the</span>
            <span className="bg-[#FACC15] text-black px-1.5 py-0.2 rounded-full text-[7.5px] font-black">Burn-out</span>
          </div>
          <div className="flex items-center justify-between w-full pr-1">
            <span className="text-[8.5px] font-black tracking-tight leading-none">Designer</span>
            <span className="bg-[#FEF08A] border border-black text-[3px] px-0.5 py-0.2 rounded">📌 66</span>
          </div>
          <div className="border border-black px-1 py-0.2 text-[3.5px] font-bold -rotate-2 mt-1">
            Rest is part of the process ↖
          </div>
        </div>
        <div className="border-t border-black pt-0.5 flex justify-between text-[3px] font-bold text-zinc-700">
          <span>Creative minds</span>
          <span>Design inspire</span>
        </div>
      </div>
    );
  }

  if (layoutId === 'cover-scrapbook-boost') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner bg-[#9DA3A4] text-white border border-black/10">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=70)' }} />
        <div className="relative z-10 flex justify-between items-center text-[4px] font-bold text-white/90">
          <span className="text-[5px]">✧ ⋆</span>
          <span>@dinurpradiptaa</span>
        </div>
        <div className="relative z-10 my-auto flex flex-col items-start pl-0.5">
          <div className="text-[12px] font-black leading-none text-[#FACC15] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '0.5px white' }}>
            BOOST
          </div>
          <div className="text-[7.5px] font-extrabold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            YOUR INCOME,
          </div>
          <div className="bg-[#FACC15] text-black text-[3.5px] font-bold px-1.5 py-0.2 rounded-full shadow-xs mt-1">
            GET IN TOUCH
          </div>
        </div>
        <div className="relative z-10 flex justify-between items-end">
          <div className="w-8 h-6 bg-white/90 rounded-[2px] shadow -rotate-6 border border-black/10" />
          <div className="w-9 h-7 bg-white/90 rounded-[2px] shadow rotate-6 border border-black/10" />
        </div>
      </div>
    );
  }

  if (layoutId === 'cover-cozy-didyouknow') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between items-center text-center shadow-inner bg-[#8C9294] text-white border border-black/10">
        <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=70)' }} />
        <div className="relative z-10 text-[3.5px] tracking-widest text-white/80 font-bold uppercase">EDITORIAL ARCHIVE</div>
        <div className="relative z-10 my-auto flex flex-col items-center">
          <div className="text-[10px] font-black leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]" style={{ WebkitTextStroke: '0.4px black' }}>
            DID YOU<br />KNOW?
          </div>
          <div className="bg-[#FACC15] text-black text-[3.5px] font-bold p-1 rounded-xs shadow-xs mt-1 max-w-[85%] border border-black/20">
            Content that connects always solves one problem.
          </div>
        </div>
        <div className="relative z-10 text-[3.5px] font-semibold text-white/90">@dinurpradiptaa</div>
      </div>
    );
  }

  if (layoutId === 'cover-tips-content-king') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner bg-[#7A8082] text-white border border-black/10">
        <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=400&q=70)' }} />
        <div className="relative z-10 flex justify-between text-[4px] font-bold text-white/90">
          <span>🕶️ TOP TIPS</span>
          <span>@dinurpradiptaa</span>
        </div>
        <div className="relative z-10 my-auto flex flex-col items-center text-center">
          <div className="text-[10.5px] font-black leading-none text-[#FACC15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ WebkitTextStroke: '0.5px black' }}>
            CONTENT<br />IS KING
          </div>
          <div className="bg-[#FACC15] text-black text-[3.5px] font-black px-1.5 py-0.5 rounded-xs mt-1 border border-black shadow-xs">
            CRAFTING DIGITAL CAMPAIGNS
          </div>
        </div>
        <div className="relative z-10 flex justify-start">
          <div className="w-6 h-6 rounded-full bg-white/80 border border-white shadow" />
        </div>
      </div>
    );
  }

  if (layoutId === 'cover-pastel-consistency') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between items-center text-center shadow-inner bg-[#F0F9FF] text-zinc-900 border border-black/10">
        <div className="w-full flex justify-between items-center text-[3.5px] font-bold text-blue-600">
          <span>HOW TO BE</span>
          <span>⊞</span>
        </div>
        <div className="my-auto flex flex-col items-center w-full px-1">
          <div className="w-full bg-white border border-sky-200 rounded p-1 shadow-xs flex flex-col items-center">
            <div className="text-[6.5px] font-black text-sky-600 leading-tight">
              CONSISTENT ON<br />SOCIAL MEDIA
            </div>
            <div className="bg-sky-100 text-sky-800 text-[3px] font-bold px-1 rounded-xs mt-0.5">
              *without losing your sanity*
            </div>
          </div>
        </div>
        <div className="w-full flex justify-between items-center text-[3.5px] pt-1">
          <span className="font-semibold text-sky-600">@dinurpradiptaa</span>
          <span className="bg-pink-100 text-pink-600 font-bold px-1 py-0.2 rounded-full">5 TIPS ➔</span>
        </div>
      </div>
    );
  }

  if (layoutId === 'cover-berry-batching-date') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between shadow-inner bg-[#FFFDF9] text-[#6B1D2F] border border-black/10">
        <div className="absolute inset-0 bg-cover bg-center opacity-65" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=70)' }} />
        <div className="relative z-10 flex justify-between text-[4px] font-bold">
          <span>📌</span>
          <span className="bg-pink-600 text-white text-[3px] px-1 py-0.2 rounded-full">Come along</span>
        </div>
        <div className="relative z-10 my-auto flex flex-col items-center text-center">
          <div className="text-[8.5px] font-serif font-black leading-none text-[#6B1D2F] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]" style={{ WebkitTextStroke: '0.6px white' }}>
            Weekly<br />content<br />batching<br />date
          </div>
          <div className="mt-1 border border-pink-700 bg-pink-50 text-pink-700 text-[3px] font-bold px-1.5 py-0.5 rounded-full -rotate-6 shadow-xs">
            ★ ARUNE · @dinurpradiptaa
          </div>
        </div>
        <div className="relative z-10 flex justify-between text-[3.5px] font-bold">
          <span className="font-serif italic">New</span>
          <span>@dinurpradiptaa</span>
        </div>
      </div>
    );
  }

  if (layoutId === 'cover-magenta-playbook') {
    return (
      <div className="w-full aspect-4/5 rounded-sm overflow-hidden relative p-1.5 flex flex-col justify-between items-center text-center shadow-inner bg-[#7A1437] text-white border border-black/10">
        <div className="w-full flex justify-between items-center">
          <div className="w-7 h-8 bg-white/90 rounded-[2px] shadow -rotate-6 border border-white" />
          <div className="border border-pink-400 bg-pink-900/60 text-pink-300 text-[3px] px-1 py-0.5 rounded-full font-bold">
            @dinurpradiptaa
          </div>
          <div className="w-7 h-8 bg-white/90 rounded-[2px] shadow rotate-6 border border-white" />
        </div>
        <div className="my-auto flex flex-col items-center px-1">
          <div className="text-[7.5px] font-serif font-black leading-tight drop-shadow-md">
            Things I do<br />every week to<br />make content<br />much easier
          </div>
          <div className="bg-pink-500 text-white text-[3px] font-bold px-1.5 py-0.2 rounded-full mt-1">
            + it's a rinse + repeat
          </div>
        </div>
        <div className="text-[3px] font-bold tracking-widest text-pink-200">
          CURATED BY @dinurpradiptaa
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
    selectedElementId,
    setSelectedElementId,
    updateElement,
    adjustElementZIndex,
    deleteElement,
    duplicateElement,
    workspaceDarkMode,
    settings,
  } = useStudioStore();

  const [layoutFilter, setLayoutFilter] = useState<
    'All' | 'Carousel Covers' | 'Single Feeds' | 'Editorial' | 'Media' | 'Minimalist' | 'Playful' | 'Typography'
  >('All');
  const [layoutScope, setLayoutScope] = useState<'current' | 'all'>('current');

  // Layers Tab: Kind Filter and inline rename state
  const [layerFilter, setLayerFilter] = useState<'all' | 'text' | 'image' | 'shape' | 'other'>('all');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string>('');

  if (!leftSidebarOpen) return null;

  const activeSlide = slides[activeSlideIndex] || slides[0];
  const activeTheme = getActiveTheme();

  const allElements = activeSlide?.elements || [];
  const selectedElement = allElements.find((el) => el.id === selectedElementId);
  const sortedAllElements = [...allElements].sort((a, b) => b.zIndex - a.zIndex);
  const isTopmost = sortedAllElements.length > 0 && sortedAllElements[0]?.id === selectedElementId;
  const isBottommost = sortedAllElements.length > 0 && sortedAllElements[sortedAllElements.length - 1]?.id === selectedElementId;

  const filteredElements = sortedAllElements.filter((el) => {
    if (layerFilter === 'all') return true;
    if (layerFilter === 'text') return el.type === 'text';
    if (layerFilter === 'image') return el.type === 'image';
    if (layerFilter === 'shape') return el.type === 'shape';
    if (layerFilter === 'other') return el.type === 'badge' || el.type === 'divider';
    return true;
  });

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

      {/* 3-Tab Switcher Header: Slide Layers, Layouts & Themes, Font Combinations */}
      <div className="grid grid-cols-3 p-1.5 gap-1 bg-zinc-900/50 border-b border-zinc-800/80 shrink-0">
        {(
          [
            { id: 'elements', label: 'Layers', icon: Layers },
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

      {/* TAB 1: SLIDE LAYERS STACK (Photoshop Pro Style) */}
      {activeLeftTab === 'elements' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
          {/* 1. Header & Filter Bar (Kind: All, Text, Image, Shape) */}
          <div
            className={`px-3 py-2 border-b flex items-center justify-between shrink-0 ${
              workspaceDarkMode
                ? 'border-zinc-800/80 bg-zinc-900/60'
                : 'border-slate-200 bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  workspaceDarkMode ? 'text-zinc-200' : 'text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Layers</span>
              </span>
              <span
                className={`text-[10px] font-mono ${
                  workspaceDarkMode ? 'text-zinc-500' : 'text-slate-400'
                }`}
              >
                ({filteredElements.length}/{allElements.length})
              </span>
            </div>

            {/* Quick Type Filter Chips (Photoshop "Kind" Filter) */}
            <div
              className={`flex items-center p-0.5 rounded-lg border ${
                workspaceDarkMode
                  ? 'bg-zinc-950 border-zinc-800'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <button
                type="button"
                onClick={() => setLayerFilter('all')}
                title="Tampilkan Semua Layer"
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition-all cursor-pointer ${
                  layerFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : workspaceDarkMode
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLayerFilter('text')}
                title="Filter Teks (Type)"
                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-serif font-bold transition-all cursor-pointer ${
                  layerFilter === 'text'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : workspaceDarkMode
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                T
              </button>
              <button
                type="button"
                onClick={() => setLayerFilter('image')}
                title="Filter Gambar / Foto"
                className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                  layerFilter === 'image'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : workspaceDarkMode
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setLayerFilter('shape')}
                title="Filter Bentuk (Shapes)"
                className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                  layerFilter === 'shape'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : workspaceDarkMode
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Shapes className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 2. Scrollable Layer List Rows */}
          <div className="flex-1 overflow-y-auto scroller-dark">
            {filteredElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                <div
                  className={`p-2.5 rounded-xl border mb-2 ${
                    workspaceDarkMode
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <p
                  className={`text-xs font-medium ${
                    workspaceDarkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  {layerFilter !== 'all'
                    ? 'Tidak ada layer dengan jenis ini'
                    : 'Belum Ada Objek di Slide Ini'}
                </p>
                <p className="text-[10.5px] text-zinc-500 mt-1 max-w-[180px]">
                  {layerFilter !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => setLayerFilter('all')}
                      className="text-blue-500 hover:underline cursor-pointer"
                    >
                      Reset Filter ke Semua
                    </button>
                  ) : (
                    'Tambahkan teks, gambar, atau bentuk menggunakan toolbar kanvas di sebelah kiri.'
                  )}
                </p>
              </div>
            ) : (
              filteredElements.map((el) => {
                const isSel = selectedElementId === el.id;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`group flex items-center h-9 border-b transition-colors cursor-pointer ${
                      isSel
                        ? workspaceDarkMode
                          ? 'bg-[#2F405A] border-blue-400/40 text-white font-medium'
                          : 'bg-blue-50 border-blue-200 text-blue-950 font-medium'
                        : workspaceDarkMode
                        ? 'bg-zinc-900/20 hover:bg-zinc-850/60 border-zinc-850 text-zinc-300'
                        : 'bg-white hover:bg-slate-100/80 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    {/* A. Eye Visibility Gutter (Leftmost column) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateElement(el.id, { hidden: !el.hidden }, true);
                      }}
                      title={el.hidden ? 'Tampilkan Layer (Show)' : 'Sembunyikan Layer (Hide)'}
                      className={`w-7 h-full flex items-center justify-center shrink-0 border-r transition-colors cursor-pointer ${
                        isSel
                          ? workspaceDarkMode
                            ? 'border-blue-400/30'
                            : 'border-blue-200'
                          : workspaceDarkMode
                          ? 'border-zinc-800/80 hover:bg-zinc-800/60'
                          : 'border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      {el.hidden ? (
                        <EyeOff className="w-3.5 h-3.5 text-zinc-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Eye
                          className={`w-3.5 h-3.5 transition-colors ${
                            isSel
                              ? 'text-white'
                              : workspaceDarkMode
                              ? 'text-zinc-400 group-hover:text-zinc-200'
                              : 'text-slate-600 group-hover:text-slate-900'
                          }`}
                        />
                      )}
                    </button>

                    {/* B. Square Thumbnail Preview (22×22px) */}
                    <div className="px-1.5 flex items-center justify-center shrink-0">
                      <div
                        className={`w-6 h-6 rounded-sm border shrink-0 flex items-center justify-center overflow-hidden transition-colors ${
                          isSel
                            ? 'border-blue-400/80 bg-zinc-900 shadow-2xs'
                            : workspaceDarkMode
                            ? 'border-zinc-700/80 bg-zinc-900'
                            : 'border-slate-300 bg-slate-100'
                        }`}
                        style={
                          el.type === 'image'
                            ? {
                                background: workspaceDarkMode
                                  ? 'repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%) 50% / 6px 6px'
                                  : 'repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%) 50% / 6px 6px',
                              }
                            : undefined
                        }
                      >
                        {el.type === 'image' ? (
                          el.src ? (
                            <img
                              src={el.src}
                              alt={el.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                          )
                        ) : el.type === 'text' ? (
                          <span className="font-serif font-black text-xs text-zinc-100 select-none leading-none">
                            T
                          </span>
                        ) : el.type === 'shape' ? (
                          <div
                            className="w-3.5 h-3.5 flex items-center justify-center shadow-2xs"
                            style={{
                              backgroundColor: el.fillColor || activeTheme.accent,
                              borderRadius:
                                el.shapeKind === 'circle' || el.shapeKind === 'pill'
                                  ? '9999px'
                                  : el.shapeKind === 'rounded-rect'
                                  ? '3px'
                                  : '1px',
                            }}
                          />
                        ) : el.type === 'divider' ? (
                          <div
                            className="w-4 h-[2px] rounded-full"
                            style={{ backgroundColor: el.color || activeTheme.divider }}
                          />
                        ) : (
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                    </div>

                    {/* C. Layer Name / Inline Rename Input */}
                    <div className="flex-1 min-w-0 pr-1 flex items-center">
                      {editingLayerId === el.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingLayerName}
                          onChange={(e) => setEditingLayerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingLayerName.trim()) {
                                updateElement(el.id, { name: editingLayerName.trim() }, true);
                              }
                              setEditingLayerId(null);
                            } else if (e.key === 'Escape') {
                              setEditingLayerId(null);
                            }
                          }}
                          onBlur={() => {
                            if (editingLayerName.trim()) {
                              updateElement(el.id, { name: editingLayerName.trim() }, true);
                            }
                            setEditingLayerId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-full text-xs px-1.5 py-0.5 rounded border font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            workspaceDarkMode
                              ? 'bg-zinc-950 border-zinc-700 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingLayerId(el.id);
                            setEditingLayerName(el.name);
                          }}
                          title={`${el.name} (Double-click untuk ganti nama)`}
                          className={`text-xs truncate select-none ${
                            el.hidden ? 'opacity-40 line-through' : ''
                          } ${
                            isSel
                              ? workspaceDarkMode
                                ? 'text-white'
                                : 'text-blue-950'
                              : workspaceDarkMode
                              ? 'text-zinc-300'
                              : 'text-slate-700'
                          }`}
                        >
                          {el.name}
                        </span>
                      )}
                    </div>

                    {/* D. Right Status Badges: fx & Lock */}
                    <div className="flex items-center gap-1 pr-2.5 shrink-0">
                      {/* fx badge if layer has styling */}
                      {Boolean(el.borderWidth || el.opacity < 1 || ('borderRadius' in el && (el as { borderRadius?: number }).borderRadius)) && (
                        <span
                          title="Layer Effects (fx)"
                          className={`text-[9.5px] font-mono italic px-1 rounded select-none ${
                            isSel
                              ? 'text-blue-200 bg-blue-900/40'
                              : workspaceDarkMode
                              ? 'text-zinc-400 bg-zinc-800/80'
                              : 'text-slate-500 bg-slate-200'
                          }`}
                        >
                          fx
                        </span>
                      )}

                      {/* Lock Icon */}
                      {el.locked && (
                        <span
                          title="Layer terkunci (Locked)"
                          className="p-0.5 text-amber-400 select-none"
                        >
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. Photoshop Style Footer Bar (Z-Index, Lock, Duplicate, Delete) */}
          <div
            className={`px-2.5 py-1.5 border-t flex items-center justify-between shrink-0 select-none ${
              workspaceDarkMode
                ? 'border-zinc-800/80 bg-zinc-950/95'
                : 'border-slate-200 bg-slate-50/95'
            }`}
          >
            {/* Left: Reorder Z-Index */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={!selectedElementId || isTopmost}
                onClick={() => selectedElementId && adjustElementZIndex(selectedElementId, 'front')}
                title={isTopmost ? 'Sudah di paling depan' : 'Geser ke Paling Depan (Top)'}
                className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                  workspaceDarkMode
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowUpToLine className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!selectedElementId || isTopmost}
                onClick={() => selectedElementId && adjustElementZIndex(selectedElementId, 'forward')}
                title={isTopmost ? 'Sudah di paling depan' : 'Maju Satu Lapisan (+1)'}
                className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                  workspaceDarkMode
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!selectedElementId || isBottommost}
                onClick={() => selectedElementId && adjustElementZIndex(selectedElementId, 'backward')}
                title={isBottommost ? 'Sudah di paling belakang' : 'Mundur Satu Lapisan (-1)'}
                className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                  workspaceDarkMode
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!selectedElementId || isBottommost}
                onClick={() => selectedElementId && adjustElementZIndex(selectedElementId, 'back')}
                title={isBottommost ? 'Sudah di paling belakang' : 'Geser ke Paling Belakang (Bottom)'}
                className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                  workspaceDarkMode
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              className={`w-px h-4 mx-1 ${
                workspaceDarkMode ? 'bg-zinc-800' : 'bg-slate-300'
              }`}
            />

            {/* Right: Lock, Duplicate, Delete */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={!selectedElement}
                onClick={() => {
                  if (selectedElement) {
                    updateElement(selectedElement.id, { locked: !selectedElement.locked }, true);
                  }
                }}
                title={selectedElement?.locked ? 'Buka Kunci Layer' : 'Kunci Layer (Lock)'}
                className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                  selectedElement?.locked
                    ? 'text-amber-400'
                    : workspaceDarkMode
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                {selectedElement?.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                disabled={!selectedElementId}
                onClick={() => selectedElementId && duplicateElement(selectedElementId)}
                title="Duplikat Layer (Ctrl+D)"
                className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                  workspaceDarkMode
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!selectedElementId}
                onClick={() => selectedElementId && deleteElement(selectedElementId)}
                title="Hapus Layer (Delete)"
                className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 disabled:opacity-20 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
              {(['All', 'Carousel Covers', 'Single Feeds', 'Editorial', 'Media', 'Minimalist', 'Playful', 'Typography'] as const).map(
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
