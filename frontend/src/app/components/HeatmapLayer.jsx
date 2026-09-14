"use client";

import { useEffect, useRef } from "react";

const CHANNEL_COLORS = {
  // 2.4 GHz
  1: { r: 245, g: 158, b: 11 },   // Amber
  6: { r: 16, g: 185, b: 129 },   // Emerald
  11: { r: 99, g: 102, b: 241 },  // Indigo
  // 5 GHz
  36: { r: 14, g: 165, b: 233 },  // Sky
  40: { r: 244, g: 63, b: 94 },   // Rose
  44: { r: 217, g: 70, b: 239 },  // Fuchsia
  48: { r: 132, g: 204, b: 22 },  // Lime
  0: { r: 82, g: 82, b: 91 },     // Zinc
};

// Returns opacity to erase for destination-out based on material
function getAttenuationErase(material, band) {
  if (material === 1) return 1.0; 
  if (band === 2) { 
    if (material === 2) return 0.8; 
    if (material === 3) return 0.4; 
  } else { 
    if (material === 2) return 0.5; 
    if (material === 3) return 0.15; 
  }
  return 0.0;
}

export default function HeatmapLayer({ routers, walls }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");

    routers.forEach((router) => {
      offCtx.clearRect(0, 0, width, height);

      const radius = router.baseRadius;
      const color = CHANNEL_COLORS[router.channel] || CHANNEL_COLORS[0];
      
      const grad = offCtx.createRadialGradient(router.x, router.y, 0, router.x, router.y, radius);
      grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.45)`);
      grad.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);
      grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(router.x, router.y, radius, 0, Math.PI * 2);
      offCtx.fill();

      walls.forEach((wall) => {
        const eraseAlpha = getAttenuationErase(wall.material, router.band);
        if (eraseAlpha <= 0) return;

        const dx1 = wall.startX - router.x;
        const dy1 = wall.startY - router.y;
        const dx2 = wall.endX - router.x;
        const dy2 = wall.endY - router.y;

        const dist1 = Math.hypot(dx1, dy1);
        const dist2 = Math.hypot(dx2, dy2);
        
        if (dist1 < 1 || dist2 < 1) return;

        const extendDist = radius * 2;
        const px1 = wall.startX + (dx1 / dist1) * extendDist;
        const py1 = wall.startY + (dy1 / dist1) * extendDist;
        const px2 = wall.endX + (dx2 / dist2) * extendDist;
        const py2 = wall.endY + (dy2 / dist2) * extendDist;

        offCtx.globalCompositeOperation = "destination-out";
        offCtx.fillStyle = `rgba(0,0,0,${eraseAlpha})`;
        offCtx.beginPath();
        offCtx.moveTo(wall.startX, wall.startY);
        offCtx.lineTo(wall.endX, wall.endY);
        offCtx.lineTo(px2, py2);
        offCtx.lineTo(px1, py1);
        offCtx.closePath();
        offCtx.fill();
        offCtx.globalCompositeOperation = "source-over";
      });

      ctx.globalCompositeOperation = "screen"; 
      ctx.drawImage(offCanvas, 0, 0);
    });

  }, [routers, walls]);

  return (
    <canvas
      ref={canvasRef}
      width={4000}
      height={4000}
      className="absolute top-0 left-0 pointer-events-none opacity-90 transition-opacity duration-300"
      style={{ zIndex: 0 }}
    />
  );
}
