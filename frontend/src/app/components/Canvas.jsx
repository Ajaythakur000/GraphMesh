"use client";

import { useRef, useEffect } from "react";

export default function Canvas({
  children,
  mode,
  isEmpty,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 2000 - scrollRef.current.clientHeight / 2;
      scrollRef.current.scrollLeft = 2000 - scrollRef.current.clientWidth / 2;
    }
  }, []);

  return (
    <div
      id="scroll-container"
      ref={scrollRef}
      className="absolute inset-0 overflow-auto bg-[#05050a] border border-cyan-900/40 rounded-lg m-6"
    >
      {isEmpty && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <p className="text-cyan-900 font-mono text-xs tracking-[0.2em] ml-80">
            [ SELECT A MODE → CLICK OR DRAG ON GRID ]
          </p>
        </div>
      )}

      <div
        id="network-canvas"
        className={`relative w-[4000px] h-[4000px] ${
          mode === "wall" ? "cursor-crosshair" : "cursor-default"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}