import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  PlusSquare,
  Film,
  Wifi,
  Battery,
  Layers,
  Camera,
  Music,
  X,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { ASPECT_RATIOS } from '../../constants/themesAndPresets';
import { SlideStage } from '../canvas/SlideStage';
import { multiplayerService } from '../../services/multiplayerService';
import { getAvatarPresetById } from '../../constants/avatarPresets';
import { subscribeToAuthChanges } from '../../services/authService';
import type { AspectRatioKey } from '../../types/studio';

export type InstagramPreviewFormat = 'carousel' | 'story' | 'reels';

export const InstagramPreviewPanel: React.FC = () => {
  const {
    slides,
    aspectRatio,
    getActiveTheme,
    branding,
    projectTitle,
    scriptText,
    activeSlideIndex,
  } = useStudioStore();

  const [previewFormat, setPreviewFormat] = useState<InstagramPreviewFormat>('carousel');
  const [currentIndex, setCurrentIndex] = useState(activeSlideIndex || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(1428);
  const [phoneTheme, setPhoneTheme] = useState<'dark' | 'light'>('dark');
  const [seamlessMode, setSeamlessMode] = useState(false);

  // Sync with active slide index on mount
  useEffect(() => {
    if (activeSlideIndex >= 0 && activeSlideIndex < slides.length) {
      setCurrentIndex(activeSlideIndex);
    }
  }, [activeSlideIndex, slides.length]);

  // Touch and drag swipe state
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const theme = getActiveTheme();

  // Determine effective aspect ratio for current preview format
  const effectiveRatio: AspectRatioKey =
    previewFormat === 'carousel'
      ? (aspectRatio === '9:16' ? '4:5' : aspectRatio)
      : '9:16';

  const dim = ASPECT_RATIOS[effectiveRatio] || ASPECT_RATIOS['4:5'];

  // Phone viewport dimensions for right sidebar
  const phoneWidth = previewFormat === 'carousel' ? 280 : 256;
  const phoneMediaHeight =
    previewFormat === 'carousel'
      ? Math.round(phoneWidth * (dim.stageHeight / dim.stageWidth))
      : Math.round(phoneWidth * (16 / 9)); // 9:16 for Story & Reels

  const scale = phoneWidth / dim.stageWidth;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const handlePointerDown = (clientX: number) => {
    setDragStartX(clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging || dragStartX === null) return;
    const delta = clientX - dragStartX;
    if ((currentIndex === 0 && delta > 0) || (currentIndex === slides.length - 1 && delta < 0)) {
      setDragOffset(delta * 0.3);
    } else {
      setDragOffset(delta);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || dragStartX === null) return;
    const threshold = 35;
    if (dragOffset < -threshold && currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    setDragStartX(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const [myIdentity, setMyIdentity] = useState(() => multiplayerService.getMyIdentity());
  useEffect(() => {
    const unsub = subscribeToAuthChanges(() => {
      setMyIdentity(multiplayerService.getMyIdentity());
    });
    return () => unsub();
  }, []);

  const avatarUri = getAvatarPresetById(myIdentity.avatarId).svgDataUri;
  const username = branding.authorOrHandle
    ? branding.authorOrHandle.replace('@', '').toLowerCase().replace(/\s+/g, '.')
    : (branding.publicationName || myIdentity.name || 'mindora.studio').toLowerCase().replace(/\s+/g, '.');

  const caption = scriptText
    ? scriptText.slice(0, 100) + (scriptText.length > 100 ? '...' : '')
    : `${projectTitle || 'Carousel Post'} — Geser ke kanan untuk membaca kelanjutannya! 👉`;

  return (
    <div className="flex-1 flex flex-col p-3 overflow-y-auto scroller-dark select-none space-y-3">
      {/* 1. Format Switcher: Carousel | Story | Reels */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => {
            setPreviewFormat('carousel');
            setSeamlessMode(false);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            previewFormat === 'carousel'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Carousel</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPreviewFormat('story');
            setSeamlessMode(false);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            previewFormat === 'story'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <PlusSquare className="w-3.5 h-3.5" />
          <span>Story (9:16)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPreviewFormat('reels');
            setSeamlessMode(false);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            previewFormat === 'reels'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Reels (9:16)</span>
        </button>
      </div>

      {/* 2. Format Option Bar (Seamless & Bezel toggle) */}
      <div className="flex items-center justify-between gap-1.5 px-1 text-[11px] shrink-0">
        {previewFormat === 'carousel' ? (
          <button
            type="button"
            onClick={() => setSeamlessMode(!seamlessMode)}
            className={`flex items-center gap-1 py-1 px-2 rounded-lg font-medium cursor-pointer transition-colors border ${
              seamlessMode
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Cek apakah elemen nyambung di batas antar slide"
          >
            <Layers className="w-3 h-3" />
            <span>Cek Sambungan</span>
          </button>
        ) : (
          <span className="text-[10px] text-zinc-500 font-mono">
            Format: 9:16 (1080×1920)
          </span>
        )}

        <button
          type="button"
          onClick={() => setPhoneTheme(phoneTheme === 'dark' ? 'light' : 'dark')}
          className="px-2 py-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 text-[10.5px] cursor-pointer"
        >
          {phoneTheme === 'dark' ? 'Dark' : 'Light'}
        </button>
      </div>

      {/* 3. Smartphone Frame Mockup */}
      <div className="flex justify-center">
        <div
          className={`relative rounded-[36px] p-2.5 shadow-2xl transition-all border-3 flex flex-col ${
            phoneTheme === 'dark'
              ? 'bg-zinc-950 border-zinc-700/80 shadow-black/80'
              : 'bg-zinc-100 border-zinc-300 shadow-zinc-900/40'
          }`}
          style={{ width: `${phoneWidth + 20}px` }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-40 flex items-center justify-between px-1.5 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40" />
          </div>

          {/* Screen Inner */}
          <div
            className={`rounded-[28px] overflow-hidden flex flex-col relative transition-colors ${
              phoneTheme === 'dark' ? 'bg-black text-white' : 'bg-white text-zinc-900'
            }`}
            style={{ width: `${phoneWidth}px` }}
          >
            {/* iOS Status Bar */}
            <div className="h-7 pt-1 px-4 flex items-center justify-between text-[9px] font-semibold shrink-0 z-30">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" />
                <Battery className="w-3 h-3" />
              </div>
            </div>

            {/* ============================================================== */}
            {/* FORMAT 1: CAROUSEL FEED POST */}
            {/* ============================================================== */}
            {previewFormat === 'carousel' && (
              <>
                {/* Header */}
                <div className="h-9 px-3 flex items-center justify-between border-b border-zinc-800/40 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full ring-1 ring-gradient-to-tr from-amber-500 to-rose-500 p-0.5 overflow-hidden bg-zinc-800 shrink-0">
                      <img src={avatarUri} alt={username} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="leading-tight min-w-0 truncate">
                      <span className="font-semibold text-[10.5px] truncate block">{username}</span>
                      <span className="text-[8.5px] opacity-60">Audio asli</span>
                    </div>
                  </div>
                  <MoreHorizontal className="w-3.5 h-3.5 opacity-80 shrink-0" />
                </div>

                {/* Carousel Stage Viewport */}
                <div
                  ref={carouselRef}
                  className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
                  style={{ width: `${phoneWidth}px`, height: `${phoneMediaHeight}px` }}
                  onMouseDown={(e) => handlePointerDown(e.clientX)}
                  onMouseMove={(e) => handlePointerMove(e.clientX)}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
                  onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
                  onTouchEnd={handlePointerUp}
                >
                  {!seamlessMode ? (
                    <div
                      className="flex h-full will-change-transform"
                      style={{
                        transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                        transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    >
                      {slides.map((slide, idx) => (
                        <div
                          key={slide.id}
                          className="shrink-0 relative overflow-hidden"
                          style={{ width: `${phoneWidth}px`, height: `${phoneMediaHeight}px` }}
                        >
                          <SlideStage
                            slide={slide}
                            slideIndex={idx}
                            totalSlides={slides.length}
                            aspectRatio={effectiveRatio}
                            theme={theme}
                            branding={branding}
                            scale={scale}
                            interactive={false}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Seamless Checker Split View */
                    <div className="relative w-full h-full flex bg-zinc-900">
                      <div className="w-1/2 h-full overflow-hidden relative border-r border-dashed border-emerald-400">
                        <div
                          style={{
                            width: `${phoneWidth}px`,
                            height: `${phoneMediaHeight}px`,
                            transform: `translateX(-${phoneWidth / 2}px)`,
                          }}
                        >
                          <SlideStage
                            slide={slides[currentIndex]}
                            slideIndex={currentIndex}
                            totalSlides={slides.length}
                            aspectRatio={effectiveRatio}
                            theme={theme}
                            branding={branding}
                            scale={scale}
                            interactive={false}
                          />
                        </div>
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-[8px] text-emerald-300 font-mono">
                          #{currentIndex + 1}
                        </span>
                      </div>

                      <div className="w-1/2 h-full overflow-hidden relative">
                        <div
                          style={{ width: `${phoneWidth}px`, height: `${phoneMediaHeight}px` }}
                        >
                          <SlideStage
                            slide={slides[Math.min(slides.length - 1, currentIndex + 1)]}
                            slideIndex={Math.min(slides.length - 1, currentIndex + 1)}
                            totalSlides={slides.length}
                            aspectRatio={effectiveRatio}
                            theme={theme}
                            branding={branding}
                            scale={scale}
                            interactive={false}
                          />
                        </div>
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[8px] text-emerald-300 font-mono">
                          #{Math.min(slides.length, currentIndex + 2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Counter Pill */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium tracking-wider z-20 pointer-events-none">
                    {currentIndex + 1}/{slides.length}
                  </div>

                  {currentIndex > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                      className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white cursor-pointer z-20"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {currentIndex < slides.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white cursor-pointer z-20"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Action Bar */}
                <div className="px-3 pt-1.5 pb-1 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Heart
                      onClick={() => {
                        setIsLiked(!isLiked);
                        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
                      }}
                      className={`w-3.5 h-3.5 cursor-pointer ${
                        isLiked ? 'fill-rose-500 text-rose-500' : 'opacity-85'
                      }`}
                    />
                    <MessageCircle className="w-3.5 h-3.5 opacity-85 cursor-pointer" />
                    <Send className="w-3.5 h-3.5 opacity-85 cursor-pointer -rotate-12" />
                  </div>

                  {/* Dots */}
                  <div className="flex items-center gap-1">
                    {slides.map((_, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full transition-all ${
                          idx === currentIndex
                            ? 'w-1.5 h-1.5 bg-blue-500 scale-125'
                            : 'w-1 h-1 bg-zinc-400/50'
                        }`}
                      />
                    ))}
                  </div>

                  <Bookmark
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`w-3.5 h-3.5 cursor-pointer ${
                      isBookmarked ? 'fill-current opacity-100' : 'opacity-85'
                    }`}
                  />
                </div>

                {/* Caption */}
                <div className="px-3 py-1 text-[9.5px] space-y-0.5 shrink-0">
                  <p className="font-semibold">{likeCount.toLocaleString('id-ID')} suka</p>
                  <p className="leading-snug truncate">
                    <span className="font-semibold mr-1">{username}</span>
                    <span className="opacity-80">{caption}</span>
                  </p>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* FORMAT 2: INSTAGRAM STORY (9:16 VERTICAL FULLSCREEN) */}
            {/* ============================================================== */}
            {previewFormat === 'story' && (
              <div
                className="relative overflow-hidden cursor-pointer"
                style={{ width: `${phoneWidth}px`, height: `${phoneMediaHeight}px` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  if (clickX < rect.width / 2) {
                    handlePrev();
                  } else {
                    handleNext();
                  }
                }}
              >
                {/* 9:16 Slide Stage Behind Overlays */}
                <div className="absolute inset-0">
                  <SlideStage
                    slide={slides[currentIndex] || slides[0]}
                    slideIndex={currentIndex}
                    totalSlides={slides.length}
                    aspectRatio="9:16"
                    theme={theme}
                    branding={branding}
                    scale={scale}
                    interactive={false}
                  />
                </div>

                {/* Top Story Dash Progress Bars */}
                <div className="absolute top-2 inset-x-2.5 z-30 flex items-center gap-1">
                  {slides.map((_, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30 backdrop-blur-xs"
                    >
                      <div
                        className={`h-full bg-white transition-all duration-300 ${
                          idx <= currentIndex ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Top Story User Header */}
                <div className="absolute top-4 inset-x-2.5 z-30 flex items-center justify-between text-white drop-shadow-md">
                  <div className="flex items-center gap-2">
                    <img
                      src={avatarUri}
                      alt={username}
                      className="w-5 h-5 rounded-full ring-1 ring-white/60 object-cover"
                    />
                    <span className="font-semibold text-[10.5px]">{username}</span>
                    <span className="text-[9px] opacity-75">3j</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                    <X className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Bottom Story Interactive Reply Bar */}
                <div
                  className="absolute bottom-2 inset-x-2.5 z-30 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 px-3 py-1 rounded-full border border-white/40 bg-black/30 backdrop-blur-md text-[10px] text-white/80">
                    Kirim pesan...
                  </div>
                  <Heart
                    onClick={() => setIsLiked(!isLiked)}
                    className={`w-4 h-4 cursor-pointer drop-shadow ${
                      isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                    }`}
                  />
                  <Send className="w-4 h-4 text-white drop-shadow -rotate-12 cursor-pointer" />
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* FORMAT 3: INSTAGRAM REELS (9:16 VERTICAL FULLSCREEN) */}
            {/* ============================================================== */}
            {previewFormat === 'reels' && (
              <div
                className="relative overflow-hidden cursor-pointer"
                style={{ width: `${phoneWidth}px`, height: `${phoneMediaHeight}px` }}
                onClick={handleNext}
              >
                {/* 9:16 Slide Stage Behind Overlays */}
                <div className="absolute inset-0">
                  <SlideStage
                    slide={slides[currentIndex] || slides[0]}
                    slideIndex={currentIndex}
                    totalSlides={slides.length}
                    aspectRatio="9:16"
                    theme={theme}
                    branding={branding}
                    scale={scale}
                    interactive={false}
                  />
                </div>

                {/* Top Reels Bar */}
                <div className="absolute top-2 inset-x-3 z-30 flex items-center justify-between text-white drop-shadow-md">
                  <span className="font-bold text-xs tracking-wide">Reels</span>
                  <Camera className="w-3.5 h-3.5 opacity-90 cursor-pointer" />
                </div>

                {/* Right Vertical Action Column */}
                <div
                  className="absolute right-2 bottom-12 z-30 flex flex-col items-center gap-3 text-white drop-shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                    <Heart
                      onClick={() => setIsLiked(!isLiked)}
                      className={`w-5 h-5 ${
                        isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
                      }`}
                    />
                    <span className="text-[8.5px] font-semibold">14,2 rb</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                    <MessageCircle className="w-5 h-5 text-white" />
                    <span className="text-[8.5px] font-semibold">328</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                    <Send className="w-5 h-5 text-white -rotate-12" />
                    <span className="text-[8.5px] font-semibold">Bagi</span>
                  </div>

                  <MoreHorizontal className="w-4 h-4 text-white opacity-80 cursor-pointer" />

                  {/* Spinning Audio Disc */}
                  <div className="w-5 h-5 rounded-full border border-white/60 bg-black/60 flex items-center justify-center animate-spin duration-3000">
                    <Music className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Bottom Left Reels Info Overlay */}
                <div
                  className="absolute bottom-3 left-3 right-12 z-30 text-white drop-shadow space-y-1 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={avatarUri}
                      alt={username}
                      className="w-5 h-5 rounded-full ring-1 ring-white/60 object-cover"
                    />
                    <span className="font-bold text-[10.5px]">{username}</span>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-full border border-white/60 bg-white/20 backdrop-blur-xs text-[8.5px] font-semibold"
                    >
                      Ikuti
                    </button>
                  </div>

                  <p className="text-[9.5px] leading-tight line-clamp-2 opacity-95">
                    {caption} #carousel #mindora #design
                  </p>

                  <div className="flex items-center gap-1.5 text-[8.5px] opacity-80 font-mono">
                    <Music className="w-2.5 h-2.5 animate-pulse" />
                    <span className="truncate">Audio asli • {username}</span>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Home Bar */}
            <div className="h-2.5 flex items-center justify-center shrink-0 z-30">
              <div className="w-20 h-0.5 rounded-full bg-zinc-400/40" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Slide Navigation Pills at Bottom */}
      <div className="flex items-center gap-1 overflow-x-auto scroller-dark p-1.5 bg-zinc-900/60 rounded-xl border border-zinc-800 shrink-0">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-all shrink-0 ${
              idx === currentIndex
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Slide {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
