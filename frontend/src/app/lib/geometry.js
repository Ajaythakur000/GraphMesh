// Mirrors the C++ engine's cross-product orientation logic (physics.h).
// NOTE: as of the auto-mesh refactor, this is NOT used to determine
// interference/blocking anymore — the C++ engine's `edges` array (returned
// from /api/compute) is the sole source of truth for that. This file is kept
// around only in case a live drag-preview needs quick client-side geometry
// checks in the future.

function orientation(p, q, r) {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0;
  return val > 0 ? 1 : 2;
}

function onSegment(p, q, r) {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

export function segmentsIntersect(p1, p2, p3, p4) {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}

// Returns the first wall that blocks line-of-sight between two routers, or null.
export function findBlockingWall(routerA, routerB, walls) {
  for (const wall of walls) {
    const hit = segmentsIntersect(
      { x: routerA.x, y: routerA.y },
      { x: routerB.x, y: routerB.y },
      { x: wall.startX, y: wall.startY },
      { x: wall.endX, y: wall.endY }
    );
    if (hit) return wall;
  }
  return null;
}