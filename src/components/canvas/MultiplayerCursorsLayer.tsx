import React, { useEffect, useState } from 'react';
import { multiplayerService, type MultiplayerState } from '../../services/multiplayerService';
import { getAvatarPresetById } from '../../constants/avatarPresets';
import type { AspectRatioKey, Slide } from '../../types/studio';
import { ASPECT_RATIOS } from '../../constants/themesAndPresets';

interface MultiplayerCursorsLayerProps {
  activeSlideIndex: number;
  slide: Slide | null;
  aspectRatio: AspectRatioKey;
  scale?: number;
}

export const MultiplayerCursorsLayer: React.FC<MultiplayerCursorsLayerProps> = ({
  activeSlideIndex,
  slide,
  aspectRatio,
}) => {
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerState>({
    isConnected: false,
    roomId: '',
    peers: [],
    activeUsersCount: 1,
  });

  useEffect(() => {
    const unsubscribe = multiplayerService.subscribeToState((state) => {
      setMultiplayerState(state);
    });
    return () => unsubscribe();
  }, []);

  const { stageWidth: W, stageHeight: H } = ASPECT_RATIOS[aspectRatio];

  // Active cursors on THIS slide
  const cursorsOnThisSlide = multiplayerState.peers.filter(
    (p) =>
      p.activeSlideIndex === activeSlideIndex &&
      p.cursorXPercent >= 0 &&
      p.cursorYPercent >= 0
  );

  // Active selections on THIS slide
  const selectionsOnThisSlide = multiplayerState.peers
    .filter((p) => p.activeSlideIndex === activeSlideIndex && p.selectedElementId)
    .map((p) => {
      const element = slide?.elements.find((el) => el.id === p.selectedElementId);
      return {
        peer: p,
        element,
      };
    })
    .filter((item) => Boolean(item.element));

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {/* 1. Remote Selections (Collaborator active bounding box) */}
      {selectionsOnThisSlide.map(({ peer, element }) => {
        if (!element) return null;
        const leftPercent = (element.x / W) * 100;
        const topPercent = (element.y / H) * 100;
        const widthPercent = (element.width / W) * 100;
        const heightPercent = (element.height / H) * 100;
        const avatarPreset = getAvatarPresetById(peer.avatarId);

        return (
          <div
            key={`sel-${peer.userId}-${element.id}`}
            className="absolute rounded transition-all duration-150 ease-out pointer-events-none"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
              border: `2px dashed ${peer.avatarColor || '#5E887E'}`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.4), inset 0 0 0 1px rgba(255,255,255,0.2)`,
            }}
          >
            {/* Tag above selection box */}
            <div
              className="absolute -top-6 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white shadow-md whitespace-nowrap select-none animate-in fade-in duration-150"
              style={{ backgroundColor: peer.avatarColor || '#5E887E' }}
            >
              <img
                src={avatarPreset.svgDataUri}
                alt={peer.name}
                className="w-3 h-3 rounded-full bg-white/20 object-cover"
              />
              <span>{peer.name}</span>
            </div>
          </div>
        );
      })}

      {/* 2. Remote Cursors */}
      {cursorsOnThisSlide.map((peer) => {
        const avatarPreset = getAvatarPresetById(peer.avatarId);
        const color = peer.avatarColor || '#5E887E';

        return (
          <div
            key={peer.userId}
            className="absolute pointer-events-none transition-[left,top] duration-[40ms] ease-linear z-40 select-none will-change-[left,top]"
            style={{
              left: `${peer.cursorXPercent}%`,
              top: `${peer.cursorYPercent}%`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Figma-style Smooth Arrow Cursor */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Collaborator Badge Pill with Illustration Avatar & Name */}
            <div
              className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)] whitespace-nowrap -mt-1 ml-3 border border-white/25 animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: color }}
            >
              <img
                src={avatarPreset.svgDataUri}
                alt={peer.name}
                className="w-3.5 h-3.5 rounded-full bg-white/20 object-cover ring-1 ring-white/40 shrink-0"
              />
              <span className="font-medium tracking-tight text-[10.5px]">
                {peer.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
