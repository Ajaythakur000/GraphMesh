"use client";

import { useRef, useMemo } from "react";
import { pxToMeters } from "../lib/scale";


const BASE_CONFIG = {
  1: { name: "Concrete", thickness: 18, stroke: "#111827", opacity: 1, kind: "brick" },
  2: { name: "Wood", thickness: 14, stroke: "#2e1405", opacity: 1, kind: "plank" },
  3: { name: "Glass", thickness: 9, stroke: "#22d3ee", opacity: 0.92, kind: "glass" },
};

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function BrickTexture({ id, length, thickness }) {
  const rand = seededRandom(id.length * 37 + Math.floor(length));
  const brickH = 9;
  const brickW = 20;
  const rows = Math.ceil(thickness / brickH) + 1;
  const cols = Math.ceil(length / brickW) + 2;
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : -brickW / 2;
    for (let c = -1; c < cols; c++) {
      const shade = 0.8 + rand() * 0.4; // 0.8–1.2 brightness variance
      // reddish terracotta brick tones, e.g. #b5451f .. #d97a3f range
      const red = Math.floor(150 + shade * 45);
      const green = Math.floor(65 + shade * 35);
      const blue = Math.floor(35 + shade * 20);
      const color = `rgb(${red},${green},${blue})`;
      bricks.push(
        <rect
          key={`${r}-${c}`}
          x={offset + c * brickW + 0.8}
          y={-thickness / 2 + r * brickH + 0.8}
          width={brickW - 1.6}
          height={brickH - 1.6}
          rx="1"
          fill={color}
        />
      );
    }
  }
  return (
    <>
      <rect x={0} y={-thickness / 2} width={length} height={thickness} fill="#3a2420" />
      {bricks}
    </>
  );
}

function PlankTexture({ id, length, thickness }) {
  const rand = seededRandom(id.length * 53 + Math.floor(length));
  const plankW = 34;
  const cols = Math.ceil(length / plankW) + 1;
  const planks = [];
  for (let c = 0; c < cols; c++) {
    const shade = 0.8 + rand() * 0.3;
    const base = Math.floor(90 * shade);
    const color = `rgb(${base + 55},${base + 20},${base - 5})`;
    planks.push(
      <g key={c}>
        <rect
          x={c * plankW}
          y={-thickness / 2}
          width={plankW - 1.2}
          height={thickness}
          fill={color}
        />
        <path
          d={`M${c * plankW},${-thickness / 2 + thickness * 0.3} q${plankW / 2},${thickness * 0.15} ${plankW - 2},0`}
          stroke="#2e1405"
          strokeWidth="0.8"
          fill="none"
          opacity="0.4"
        />
      </g>
    );
  }
  return <>{planks}</>;
}

export default function WallLine({ wall, isSelected, onMoveWall, onMoveEndpoint, onDelete, onSelect }) {
  const drag = useRef({ mode: null, lastX: 0, lastY: 0 });

  const dx = wall.endX - wall.startX;
  const dy = wall.endY - wall.startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const config = BASE_CONFIG[wall.material] || BASE_CONFIG[1];
  const midX = (wall.startX + wall.endX) / 2;
  const midY = (wall.startY + wall.endY) / 2;

  const texture = useMemo(() => {
    if (config.kind === "brick") return <BrickTexture id={wall.id} length={length} thickness={config.thickness} />;
    if (config.kind === "plank") return <PlankTexture id={wall.id} length={length} thickness={config.thickness} />;
    return null;
  }, [wall.id, length, config]);

  const startDrag = (mode) => (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { mode, lastX: e.clientX, lastY: e.clientY };
    onSelect(wall.id);
  };

  const handlePointerMove = (e) => {
    const { mode, lastX, lastY } = drag.current;
    if (!mode) return;
    const dxMove = e.clientX - lastX;
    const dyMove = e.clientY - lastY;
    if (mode === "body") onMoveWall(wall.id, dxMove, dyMove);
    else if (mode === "start") onMoveEndpoint(wall.id, "start", wall.startX + dxMove, wall.startY + dyMove);
    else if (mode === "end") onMoveEndpoint(wall.id, "end", wall.endX + dxMove, wall.endY + dyMove);
    drag.current.lastX = e.clientX;
    drag.current.lastY = e.clientY;
  };

  const endDrag = () => {
    drag.current.mode = null;
  };

  return (
    <g onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
      <defs>
        <linearGradient id="pattern-glass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#71717a" stopOpacity="0.4" />
          <stop offset="48%" stopColor="#f4f4f5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3f3f46" stopOpacity="0.4" />
        </linearGradient>
        <clipPath id={`clip-${wall.id}`}>
          <rect
            x={0}
            y={-config.thickness / 2}
            width={length}
            height={config.thickness}
            rx={config.thickness / 5}
          />
        </clipPath>
      </defs>

      <g transform={`translate(${wall.startX} ${wall.startY}) rotate(${angle})`}>
        {config.kind === "glass" ? (
          <rect
            x={0}
            y={-config.thickness / 2}
            width={length}
            height={config.thickness}
            fill="url(#pattern-glass)"
            opacity={config.opacity}
            stroke={isSelected ? "#e4e4e7" : config.stroke}
            strokeWidth={isSelected ? 2 : 1}
            rx={config.thickness / 5}
            style={{ cursor: "grab", pointerEvents: "auto" }}
            onPointerDown={startDrag("body")}
          />
        ) : (
          <g clipPath={`url(#clip-${wall.id})`} style={{ cursor: "grab", pointerEvents: "auto" }} onPointerDown={startDrag("body")}>
            {texture}
            <rect
              x={0}
              y={-config.thickness / 2}
              width={length}
              height={config.thickness}
              fill="none"
              stroke={isSelected ? "#e4e4e7" : config.stroke}
              strokeWidth={isSelected ? 2 : 1}
            />
          </g>
        )}
      </g>

      <circle
        cx={wall.startX}
        cy={wall.startY}
        r="6"
        fill="#09090b"
        stroke="#52525b"
        strokeWidth="2"
        style={{ cursor: "nwse-resize", pointerEvents: "auto" }}
        onPointerDown={startDrag("start")}
      />
      <circle
        cx={wall.endX}
        cy={wall.endY}
        r="6"
        fill="#09090b"
        stroke="#52525b"
        strokeWidth="2"
        style={{ cursor: "nwse-resize", pointerEvents: "auto" }}
        onPointerDown={startDrag("end")}
      />

      {isSelected && (
        <g transform={`translate(${midX} ${midY})`} style={{ pointerEvents: "auto" }}>
          <rect x="-46" y="-32" width="92" height="20" rx="4" fill="#09090b" stroke="#52525b" strokeWidth="1" />
          <text x="0" y="-18" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#a1a1aa">
            {config.name} · {pxToMeters(length).toFixed(1)}m
          </text>
          <circle
            cx="0"
            cy="-4"
            r="8"
            fill="#ef4444"
            stroke="#fca5a5"
            strokeWidth="1"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(wall.id);
            }}
            style={{ cursor: "pointer" }}
          />
          <text x="0" y="-1" textAnchor="middle" fontSize="10" fill="white" style={{ pointerEvents: "none" }}>
            ×
          </text>
        </g>
      )}
    </g>
  );
}