import React, { useState, useRef, useEffect } from 'react';
import {
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
  const dim = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['4:5'];

  // Phone viewport dimensions for right sidebar (280px wide)
  const phoneWidth = 280;
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
    if ((currentIndex === 0 && delta > 0) || (currentIndex === slides.length - 1 && delta < 0)) {
      setDragOffset(delta * 0.3);
    } else {
      setDragOffset(delta);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || dragStartX === null) return;
    const threshold = 40;
    if (dragOffset < -threshold && currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    setDragStartX(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const myIdentity = multiplayerService.getMyIdentity();
  const avatarUri = getAvatarPresetById(myIdentity.avatarId).svgDataUri;
  const username = branding.authorOrHandle
    ? branding.authorOrHandle.replace('@', '').toLowerCase().replace(/\s+/g, '.')
    : (branding.publicationName || myIdentity.name || 'mindora.studio').toLowerCase().replace(/\s+/g, '.');

  const caption = scriptText
    ? scriptText.slice(0, 120) + (scriptText.length > 120 ? '...' : '')
    : `${projectTitle || 'Carousel Post'} — Geser ke kanan untuk membaca selengkapnya! 👉`;

  return (
    <div className="flex-1 flex flex-col p-3 overflow-y-auto scroller-dark select-none space-y-3">
      {/* Mini Controls Bar */}
      <div className="flex items-center justify-between gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[11px]">
        <button
          type="button"
          onClick={() => setSeamlessMode(!seamlessMode)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg font-medium cursor-pointer transition-colors ${
            seamlessMode
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Uji apakah gambar/teks nyambung antar slide"
        >
          <Layers className="w-3 h-3" />
          <span>Cek Sambungan</span>
        </button>

        <button
          type="button"
          onClick={() => setPhoneTheme(phoneTheme === 'dark' ? 'light' : 'dark')}
          className="px-2 py-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
          title="Ubah tema bezel smartphone"
        >
          {phoneTheme === 'dark' ? 'Dark' : 'Light'}
        </button>
      </div>

      {/* Smartphone Frame Centered */}
      <div className="flex justify-center">
        <div
          className={`relative rounded-[38px] p-2.5 shadow-2xl transition-all border-3 flex flex-col ${
            phoneTheme === 'dark'
              ? 'bg-zinc-950 border-zinc-700/80 shadow-black/80'
              : 'bg-zinc-100 border-zinc-300 shadow-zinc-900/40'
          }`}
          style={{ width: `${phoneWidth + 20}px` }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-between px-2">
            <div className="w-2 h-2 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40 ring-1 ring-blue-500/30" />
          </div>

          {/* Screen */}
          <div
            className={`w-[280px] rounded-[30px] overflow-hidden flex flex-col transition-colors ${
              phoneTheme === 'dark' ? 'bg-black text-white' : 'bg-white text-zinc-900'
            }`}
          >
            {/* iOS Status Bar */}
            <div className="h-8 pt-1 px-5 flex items-center justify-between text-[10px] font-semibold shrink-0">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Instagram App Header */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800/40 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full ring-1 ring-gradient-to-tr from-amber-500 to-rose-500 p-0.5 overflow-hidden bg-zinc-800">
                  <img
                    src={avatarUri}
                    alt={username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1 font-semibold text-[11px]">
                    <span className="truncate max-w-[120px]">{username}</span>
                    <Sparkles className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                  </div>
                  <span className="text-[9px] opacity-60">Audio asli</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <Volume2 className="w-3.5 h-3.5 cursor-pointer" />
                <MoreHorizontal className="w-3.5 h-3.5 cursor-pointer" />
              </div>
            </div>

            {/* Carousel Viewport */}
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
                /* Seamless Continuity Checker */
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
                        aspectRatio={aspectRatio}
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
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[8px] text-emerald-300 font-mono">
                      #{Math.min(slides.length, currentIndex + 2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Slide Counter Badge Pill Top Right */}
              <div className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium tracking-wider z-20 pointer-events-none">
                {currentIndex + 1}/{slides.length}
              </div>

              {/* Arrows */}
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white cursor-pointer z-20"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {currentIndex < slides.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white cursor-pointer z-20"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action Bar */}
            <div className="px-3 pt-2 pb-1 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLiked(!isLiked);
                    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
                  }}
                  className="cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked ? 'fill-rose-500 text-rose-500' : 'opacity-85'
                    }`}
                  />
                </button>
                <MessageCircle className="w-4 h-4 opacity-85 cursor-pointer" />
                <Send className="w-4 h-4 opacity-85 cursor-pointer -rotate-12" />
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

              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="cursor-pointer"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isBookmarked ? 'fill-current opacity-100' : 'opacity-85'
                  }`}
                />
              </button>
            </div>

            {/* Caption */}
            <div className="px-3 py-1 text-[10px] space-y-0.5 shrink-0">
              <p className="font-semibold">
                {likeCount.toLocaleString('id-ID')} suka
              </p>
              <p className="leading-snug truncate">
                <span className="font-semibold mr-1">{username}</span>
                <span className="opacity-80">{caption}</span>
              </p>
            </div>

            {/* Bottom Nav Bar */}
            <div className="mt-auto h-8 px-5 border-t border-zinc-800/40 flex items-center justify-between shrink-0 opacity-80">
              <Home className="w-4 h-4" />
              <Search className="w-4 h-4" />
              <PlusSquare className="w-4 h-4" />
              <Film className="w-4 h-4" />
              <div className="w-4 h-4 rounded-full bg-blue-600 overflow-hidden">
                <img src={avatarUri} alt={username} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* iOS Home Bar */}
            <div className="h-3 flex items-center justify-center shrink-0">
              <div className="w-24 h-1 rounded-full bg-zinc-400/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Slide Thumbnails Jump Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scroller-dark p-1.5 bg-zinc-900/60 rounded-xl border border-zinc-800">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all shrink-0 ${
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
