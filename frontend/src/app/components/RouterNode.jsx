"use client";

import { useRef } from "react";

const CHANNEL_STYLES = {
  // 2.4 GHz
  1: { ring: "#f59e0b", glow: "rgba(245,158,11,0.15)", label: "#fcd34d" }, // Amber
  6: { ring: "#10b981", glow: "rgba(16,185,129,0.15)", label: "#6ee7b7" }, // Emerald
  11: { ring: "#6366f1", glow: "rgba(99,102,241,0.15)", label: "#a5b4fc" }, // Indigo
  // 5 GHz
  36: { ring: "#0ea5e9", glow: "rgba(14,165,233,0.15)", label: "#7dd3fc" }, // Sky
  40: { ring: "#f43f5e", glow: "rgba(244,63,94,0.15)", label: "#fda4af" }, // Rose
  44: { ring: "#d946ef", glow: "rgba(217,70,239,0.15)", label: "#f0abfc" }, // Fuchsia
  48: { ring: "#84cc16", glow: "rgba(132,204,22,0.15)", label: "#bef264" }, // Lime
  // Fallbacks
  0: { ring: "#52525b", glow: "rgba(82,82,91,0.1)", label: "#a1a1aa" },
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
      <div
        className="absolute inset-0 rounded-full transition-all duration-300 pointer-events-none"
        style={{
          border: `1px solid ${style.ring}40`,
          background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`
        }}
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect x="8" y="22" width="24" height="12" rx="2" fill="#09090b" stroke={style.ring} strokeWidth="1.5" />
          <line x1="14" y1="22" x2="10" y2="6" stroke={style.ring} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="22" x2="30" y2="6" stroke={style.ring} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="5" r="1.5" fill={style.ring} />
          <circle cx="30" cy="5" r="1.5" fill={style.ring} />
          <circle cx="14" cy="28" r="1.5" fill={router.channel !== 0 ? "#fafafa" : "#52525b"} />
          <circle cx="20" cy="28" r="1.5" fill={router.channel !== 0 ? style.ring : "#52525b"} />
          <circle cx="26" cy="28" r="1.5" fill={router.channel !== 0 ? style.ring : "#52525b"} />
        </svg>
      </div>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(router.id);
        }}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-xs items-center justify-center opacity-0 group-hover:opacity-100 flex transition-opacity"
      >
        ×
      </button>

      <span
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded border shadow-sm"
        style={{ top: -22, background: "#09090b", borderColor: `${style.ring}60`, color: style.label }}
      >
        {router.name || `R${router.id}`}
        <span className="opacity-70 ml-1">{router.band === 2 ? "5G" : "2.4G"}</span>
        {router.channel !== 0 && <span className="ml-1 font-bold text-white">· Ch{router.channel}</span>}
      </span>
    </div>
  );
}