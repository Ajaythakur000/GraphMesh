// Single source of truth for the pixel <-> meter scale used across the app.
// 50px on the canvas = 1 real-world meter.
export const PIXELS_PER_METER = 50;

export function pxToMeters(px) {
  return px / PIXELS_PER_METER;
}

export function formatMeters(px) {
  return `${pxToMeters(px).toFixed(2)}m`;
}

export function distanceBetween(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}