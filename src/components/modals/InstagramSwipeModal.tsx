import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Volume2,
  Home,
  Search,
  PlusSquare,
  Film,
  Wifi,
  Battery,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { ASPECT_RATIOS } from '../../constants/themesAndPresets';
import { SlideStage } from '../canvas/SlideStage';
import { multiplayerService } from '../../services/multiplayerService';
import { getAvatarPresetById } from '../../constants/avatarPresets';

export const InstagramSwipeModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    slides,
    aspectRatio,
    getActiveTheme,
    branding,
    projectTitle,
    scriptText,
  } = useStudioStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(1428);
  const [phoneTheme, setPhoneTheme] = useState<'dark' | 'light'>('dark');
  const [seamlessMode, setSeamlessMode] = useState(false);

  // Touch and drag swipe state
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  if (activeModal !== 'preview') return null;

  const theme = getActiveTheme();
  const dim = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['4:5'];

  // Phone viewport dimensions
  const phoneWidth = 360;
  // Calculate scaled height based on aspect ratio
  const phoneMediaHeight = Math.round(phoneWidth * (dim.stageHeight / dim.stageWidth));
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
    // Dampen drag at boundaries
    if ((currentIndex === 0 && delta > 0) || (currentIndex === slides.length - 1 && delta < 0)) {
      setDragOffset(delta * 0.3);
    } else {
      setDragOffset(delta);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || dragStartX === null) return;
    const threshold = 60; // minimum drag distance in px to change slide
    if (dragOffset < -threshold && currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    setDragStartX(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const myIdentity = multiplayerService.getMyIdentity();
  const avatarUri = getAvatarPresetById(myIdentity.avatarId).svgDataUri;
  const username = branding.authorOrHandle
    ? branding.authorOrHandle.replace('@', '').toLowerCase().replace(/\s+/g, '.')
    : (branding.publicationName || myIdentity.name || 'mindora.studio').toLowerCase().replace(/\s+/g, '.');

  const caption = scriptText
    ? scriptText.slice(0, 160) + (scriptText.length > 160 ? '...' : '')
    : `${projectTitle || 'Carousel Post Kreatif'} — Dibuat dengan Mindora Studio. Geser ke kanan untuk membaca kelanjutannya! 👉`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center max-h-[96vh] w-full max-w-4xl">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between px-4 py-2.5 mb-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-white backdrop-blur-lg shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span>Instagram Feed & Swipe Simulator</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-normal">
                  {dim.shortLabel}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Simulasi swipe carousel di smartphone nyata untuk mengecek keterbacaan & transisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seamless Continuity Test Mode */}
            <button
              type="button"
              onClick={() => setSeamlessMode(!seamlessMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                seamlessMode
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
              }`}
              title="Cek apakah elemen nyambung di perbatasan antar slide"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cek Sambungan Slide</span>
            </button>

            {/* Frame Theme Switcher */}
            <button
              type="button"
              onClick={() => setPhoneTheme(phoneTheme === 'dark' ? 'light' : 'dark')}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Ganti Warna Casing Smartphone"
            >
              {phoneTheme === 'dark' ? 'Titanium Dark' : 'Silver Light'}
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Smartphone Shell Frame */}
        <div
          className={`relative rounded-[50px] p-3.5 shadow-2xl transition-all border-4 flex flex-col ${
            phoneTheme === 'dark'
              ? 'bg-zinc-950 border-zinc-700/80 shadow-black/90'
              : 'bg-zinc-100 border-zinc-300 shadow-zinc-900/60'
          }`}
          style={{ width: `${phoneWidth + 32}px` }}
        >
          {/* Dynamic Island Pill */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
            <div className="w-2 h-2 rounded-full bg-blue-900/40 ring-1 ring-blue-500/30" />
          </div>

          {/* Smartphone Screen Inner */}
          <div
            className={`w-[360px] rounded-[38px] overflow-hidden flex flex-col transition-colors ${
              phoneTheme === 'dark' ? 'bg-black text-white' : 'bg-white text-zinc-900'
            }`}
          >
            {/* iOS Status Bar */}
            <div className="h-10 pt-2 px-6 flex items-center justify-between text-[11px] font-semibold shrink-0">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {/* Instagram App Header */}
            <div className="h-12 px-3.5 flex items-center justify-between border-b border-zinc-800/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full ring-2 ring-gradient-to-tr from-amber-500 to-rose-500 p-0.5 overflow-hidden bg-zinc-800">
                  <img
                    src={avatarUri}
                    alt={username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1 font-semibold text-xs">
                    <span>{username}</span>
                    <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                  </div>
                  <span className="text-[10px] opacity-60">Audio asli • Tren</span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <Volume2 className="w-4 h-4 cursor-pointer" />
                <MoreHorizontal className="w-4 h-4 cursor-pointer" />
              </div>
            </div>

            {/* Instagram Carousel Viewport */}
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
              {/* Normal Slide Track or Seamless Mode */}
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
                      style={{
                        width: `${phoneWidth}px`,
                        height: `${phoneMediaHeight}px`,
                      }}
                    >
                      <SlideStage
                        slide={slide}
                        slideIndex={idx}
                        totalSlides={slides.length}
                        aspectRatio={aspectRatio}
                        theme={theme}
                        branding={branding}
                        scale={scale}
                        interactive={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Seamless Continuity Checker (Split view showing seam between current and next slide) */
                <div className="relative w-full h-full flex bg-zinc-900">
                  <div
                    className="w-1/2 h-full overflow-hidden relative border-r-2 border-dashed border-emerald-400/80"
                  >
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
                        aspectRatio={aspectRatio}
                        theme={theme}
                        branding={branding}
                        scale={scale}
                        interactive={false}
                      />
                    </div>
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-emerald-300 font-mono">
                      Slide {currentIndex + 1}
                    </span>
                  </div>

                  <div className="w-1/2 h-full overflow-hidden relative">
                    <div
                      style={{
                        width: `${phoneWidth}px`,
                        height: `${phoneMediaHeight}px`,
                      }}
                    >
                      <SlideStage
                        slide={slides[Math.min(slides.length - 1, currentIndex + 1)]}
                        slideIndex={Math.min(slides.length - 1, currentIndex + 1)}
                        totalSlides={slides.length}
                        aspectRatio={aspectRatio}
                        theme={theme}
                        branding={branding}
                        scale={scale}
                        interactive={false}
                      />
                    </div>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-emerald-300 font-mono">
                      Slide {Math.min(slides.length, currentIndex + 2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Slide Counter Badge Pill Top Right */}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium tracking-wider z-20 pointer-events-none">
                {currentIndex + 1}/{slides.length}
              </div>

              {/* Navigation Arrows (Hover on Desktop) */}
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity cursor-pointer z-20"
                  title="Slide Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {currentIndex < slides.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity cursor-pointer z-20"
                  title="Slide Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instagram Action Bar */}
            <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLiked(!isLiked);
                    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
                  }}
                  className="cursor-pointer transition-transform active:scale-125"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isLiked ? 'fill-rose-500 text-rose-500' : 'opacity-85'
                    }`}
                  />
                </button>
                <MessageCircle className="w-5 h-5 opacity-85 cursor-pointer" />
                <Send className="w-5 h-5 opacity-85 cursor-pointer -rotate-12" />
              </div>

              {/* Carousel Indicator Dots in Center */}
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

              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="cursor-pointer"
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isBookmarked ? 'fill-current opacity-100' : 'opacity-85'
                  }`}
                />
              </button>
            </div>

            {/* Engagement & Caption */}
            <div className="px-3.5 py-1 text-xs space-y-1 shrink-0">
              <p className="font-semibold text-[11px]">
                {likeCount.toLocaleString('id-ID')} suka
              </p>
              <p className="text-[11px] leading-relaxed">
                <span className="font-semibold mr-1.5">{username}</span>
                <span className="opacity-90">{caption}</span>
              </p>
              <p className="text-[10px] opacity-50 cursor-pointer">
                Lihat semua 84 komentar
              </p>
              <p className="text-[9px] opacity-40 uppercase tracking-wider">
                2 jam yang lalu
              </p>
            </div>

            {/* Instagram Bottom App Tab Bar */}
            <div className="mt-auto h-11 px-6 border-t border-zinc-800/40 flex items-center justify-between shrink-0 opacity-80">
              <Home className="w-5 h-5" />
              <Search className="w-5 h-5" />
              <PlusSquare className="w-5 h-5" />
              <Film className="w-5 h-5" />
              <div className="w-5 h-5 rounded-full bg-blue-600 ring-1 ring-zinc-700 overflow-hidden">
                <img
                  src={avatarUri}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* iOS Bottom Swipe Home Bar */}
            <div className="h-4 flex items-center justify-center shrink-0">
              <div className="w-32 h-1 rounded-full bg-zinc-400/40" />
            </div>
          </div>
        </div>

        {/* Bottom Filmstrip Thumbnail Selector */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full p-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 ${
                idx === currentIndex
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Slide {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
