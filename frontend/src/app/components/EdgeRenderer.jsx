"use client";

// Renders every interfering / wall-blocked pair returned by the C++ engine's
// `edges` array. Replaces the old ConnectionInspector, which required the
// user to manually click two routers to see one relationship at a time.
// This component draws them ALL at once, automatically, right after
// "Run Algorithm" finishes.
export default function EdgeRenderer({ edges, routers }) {
  if (!edges || edges.length === 0) return null;

  const routerById = new Map(routers.map((r) => [r.id, r]));

  return (
    <>
      {edges.map((edge) => {
        const routerA = routerById.get(edge.routerA);
        const routerB = routerById.get(edge.routerB);
        // routers may have been deleted/moved out of sync with a stale edges
        // list — skip anything we can't resolve rather than crash.
        if (!routerA || !routerB) return null;

        const statusColor = edge.interferes ? "#f87171" : "#fbbf24"; // red = real conflict, amber = blocked-but-would-overlap

        const midX = (routerA.x + routerB.x) / 2;
        const midY = (routerA.y + routerB.y) / 2;

        return (
          <g key={`${edge.routerA}-${edge.routerB}`} style={{ pointerEvents: "none" }}>
            <line
              x1={routerA.x}
              y1={routerA.y}
              x2={routerB.x}
              y2={routerB.y}
              stroke={statusColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <g transform={`translate(${midX} ${midY})`}>
              <rect
                x="-58"
                y="-34"
                width="116"
                height="34"
                rx="6"
                fill="#0a0a0f"
                stroke={statusColor}
                strokeWidth="1.2"
              />
              <text x="0" y="-19" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#e5e7eb">
                {edge.distance.toFixed(2)}m
              </text>
              <text
                x="0"
                y="-7"
                textAnchor="middle"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
                fill={statusColor}
              >
                {edge.status}
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
}