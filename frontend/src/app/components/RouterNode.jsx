"use client";

import { useRef } from "react";

const CHANNEL_STYLES = {
  1: { ring: "#f87171", glow: "rgba(248,113,113,0.35)", label: "#fca5a5" },
  6: { ring: "#4ade80", glow: "rgba(74,222,128,0.35)", label: "#86efac" },
  11: { ring: "#60a5fa", glow: "rgba(96,165,250,0.35)", label: "#93c5fd" },
  0: { ring: "#6b7280", glow: "rgba(107,114,128,0.25)", label: "#9ca3af" },
};


export default function RouterNode({ router, onMove, onDelete }) {
  const drag = useRef({ dragging: false, moved: false, lastX: 0, lastY: 0 });
  const style = CHANNEL_STYLES[router.channel] || CHANNEL_STYLES[0];
  const size = router.baseRadius * 2;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dragging: true, moved: false, lastX: e.clientX, lastY: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!drag.current.dragging) return;
    const dx = e.clientX - drag.current.lastX;
    const dy = e.clientY - drag.current.lastY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.current.moved = true;
      onMove(router.id, router.x + dx, router.y + dy);
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    drag.current.dragging = false;
    drag.current.moved = false;
  };

  return (
    <div
      className="absolute group"
      style={{ left: router.x - router.baseRadius, top: router.y - router.baseRadius, width: size, height: size }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Signal heatmap */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500 animate-[pulse-glow_4s_ease-in-out_infinite]"
        style={{ background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)` }}
      />

      {/* Router icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 6px ${style.glow})` }}>
          <rect x="8" y="22" width="24" height="12" rx="2" fill="#111827" stroke={style.ring} strokeWidth="1.5" />
          <line x1="14" y1="22" x2="10" y2="6" stroke={style.ring} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="22" x2="30" y2="6" stroke={style.ring} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="5" r="1.5" fill={style.ring} />
          <circle cx="30" cy="5" r="1.5" fill={style.ring} />
          <circle cx="14" cy="28" r="1.5" fill={router.channel !== 0 ? "#ffffff" : "#4b5563"} />
          <circle cx="20" cy="28" r="1.5" fill={router.channel !== 0 ? style.ring : "#4b5563"} />
          <circle cx="26" cy="28" r="1.5" fill={router.channel !== 0 ? style.ring : "#4b5563"} />
        </svg>
      </div>

      {/* Delete button — appears on hover */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(router.id);
        }}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs items-center justify-center opacity-0 group-hover:opacity-100 flex transition-opacity"
      >
        ×
      </button>

      {/* Name / channel label */}
      <span
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded border"
        style={{ top: -22, background: "#0a0a0f", borderColor: style.ring, color: style.label }}
      >
        {router.name || `R${router.id}`}
        {router.channel !== 0 && <span className="ml-1 font-bold">· Ch{router.channel}</span>}
      </span>
    </div>
  );
}