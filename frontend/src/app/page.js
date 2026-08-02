"use client";

import { useCallback, useRef, useState } from "react";

import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import RouterNode from "./components/RouterNode";
import WallLine from "./components/WallLine";
import EdgeRenderer from "./components/EdgeRenderer";

// ---------------------------------------------------------------------------
// Undo/Redo: a tiny history stack over { routers, walls }.
//
// `commit(updater, coalesceKey)` applies `updater` to the current state.
// If `coalesceKey` matches the key used on the *previous* commit, the two
// are merged into a single history entry instead of pushing a new one —
// this is what lets a full drag gesture (which fires onMove dozens of times)
// undo in ONE step instead of dozens of tiny steps. Pass `coalesceKey=null`
// (the default) for discrete actions (add/delete/clear) that should always
// be their own undo step.
// ---------------------------------------------------------------------------
function useHistoryState(initialRouters, initialWalls) {
  const [state, setState] = useState({ routers: initialRouters, walls: initialWalls });
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const lastCoalesceKey = useRef(null);

  const commit = useCallback((updater, coalesceKey = null) => {
    setState((prev) => {
      const shouldPushHistory = coalesceKey === null || coalesceKey !== lastCoalesceKey.current;
      if (shouldPushHistory) {
        setPast((p) => [...p, prev]);
        setFuture([]);
      }
      lastCoalesceKey.current = coalesceKey;
      return typeof updater === "function" ? updater(prev) : updater;
    });
  }, []);

  const undo = useCallback(() => {
    lastCoalesceKey.current = null;
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setState((current) => {
        setFuture((f) => [current, ...f]);
        return previous;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    lastCoalesceKey.current = null;
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setState((current) => {
        setPast((p) => [...p, current]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  return {
    state,
    commit,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    resetHistory: () => {
      setPast([]);
      setFuture([]);
      lastCoalesceKey.current = null;
    },
  };
}

export default function Home() {
  const { state, commit, undo, redo, canUndo, canRedo, resetHistory } = useHistoryState([], []);
  const { routers, walls } = state;

  // Edges are ephemeral output from the C++ engine (recomputed every Run) —
  // they don't need to participate in undo/redo, so this is a plain useState.
  const [edges, setEdges] = useState([]);

  const [mode, setMode] = useState("router"); // "router" | "wall" | "select"
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWall, setCurrentWall] = useState(null);

  const [currentRadius, setCurrentRadius] = useState(100);
  const [currentMaterial, setCurrentMaterial] = useState(1);

  const [isComputing, setIsComputing] = useState(false);
  const [selectedWallId, setSelectedWallId] = useState(null);

  // Small integer ids — the C++ engine reads these as `int`, so keep them small
  // (Date.now() would overflow a 32-bit int on the C++ side).
  const routerIdRef = useRef(0);
  const wallIdRef = useRef(0);

  const handleCanvasPointerDown = (e) => {
    if (isComputing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === "router") {
      const newRouter = {
        id: routerIdRef.current++,
        x,
        y,
        z: 0.0,
        baseRadius: currentRadius,
        channel: 0,
        name: "",
      };
      commit((s) => ({ ...s, routers: [...s.routers, newRouter] }));
    } else if (mode === "wall") {
      setIsDrawing(true);
      setCurrentWall({ startX: x, startY: y, endX: x, endY: y });
    } else if (mode === "select") {
      setSelectedWallId(null);
    }
  };

  const handleCanvasPointerMove = (e) => {
    if (!isDrawing || mode !== "wall") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentWall((w) => ({ ...w, endX: x, endY: y }));
  };

  const handleCanvasPointerUp = () => {
    if (isDrawing && mode === "wall" && currentWall) {
      const dist = Math.hypot(currentWall.endX - currentWall.startX, currentWall.endY - currentWall.startY);
      if (dist > 8) {
        const newWall = {
          id: wallIdRef.current++,
          startX: currentWall.startX,
          startY: currentWall.startY,
          endX: currentWall.endX,
          endY: currentWall.endY,
          material: currentMaterial,
        };
        commit((s) => ({ ...s, walls: [...s.walls, newWall] }));
      }
      setIsDrawing(false);
      setCurrentWall(null);
    }
  };

  const moveRouter = (id, x, y) => {
    commit(
      (s) => ({ ...s, routers: s.routers.map((r) => (r.id === id ? { ...r, x, y } : r)) }),
      `move-router-${id}`
    );
  };

  const deleteRouter = (id) => {
    commit((s) => ({ ...s, routers: s.routers.filter((r) => r.id !== id) }));
  };

  const renameRouter = (id, name) => {
    commit(
      (s) => ({ ...s, routers: s.routers.map((r) => (r.id === id ? { ...r, name } : r)) }),
      `rename-router-${id}`
    );
  };

  const moveWall = (id, dx, dy) => {
    commit(
      (s) => ({
        ...s,
        walls: s.walls.map((w) =>
          w.id === id
            ? { ...w, startX: w.startX + dx, startY: w.startY + dy, endX: w.endX + dx, endY: w.endY + dy }
            : w
        ),
      }),
      `move-wall-${id}`
    );
  };

  const moveWallEndpoint = (id, which, x, y) => {
    commit(
      (s) => ({ ...s, walls: s.walls.map((w) => (w.id === id ? { ...w, [`${which}X`]: x, [`${which}Y`]: y } : w)) }),
      `move-wall-endpoint-${id}-${which}`
    );
  };

  const deleteWall = (id) => {
    commit((s) => ({ ...s, walls: s.walls.filter((w) => w.id !== id) }));
    setSelectedWallId((prev) => (prev === id ? null : prev));
  };

  const runAlgorithm = async () => {
    if (routers.length === 0) return;
    setIsComputing(true);
    try {
      const response = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routers, walls }),
      });
      const data = await response.json();

      if (data.error) {
        console.error("Engine Error:", data.error);
        alert("C++ Engine crashed. Check terminal console.");
        return;
      }

      // Channel results are engine-computed, not user edits — apply directly
      // without pushing a new undo step (re-running shouldn't itself be
      // "undoable" separately from the edits that led to it).
      commit(
        (s) => ({
          ...s,
          routers: s.routers.map((r) => {
            const computed = data.routers.find((cr) => cr.id === r.id);
            return computed ? { ...r, channel: computed.channel } : r;
          }),
        }),
        "run-algorithm"
      );

      setEdges(data.edges || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsComputing(false);
    }
  };

  const clearAll = () => {
    commit({ routers: [], walls: [] });
    setEdges([]);
    setSelectedWallId(null);
    resetHistory();
    
    // 👇 YEH DO LINES ADD KAR DE 👇
    routerIdRef.current = 0;
    wallIdRef.current = 0;

  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar
        mode={mode}
        setMode={setMode}
        currentRadius={currentRadius}
        setCurrentRadius={setCurrentRadius}
        currentMaterial={currentMaterial}
        setCurrentMaterial={setCurrentMaterial}
        routers={routers}
        walls={walls}
        onRenameRouter={renameRouter}
        onClearAll={clearAll}
        isComputing={isComputing}
        onRun={runAlgorithm}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex-1 relative min-w-0 overflow-hidden p-6">
        <Canvas
          mode={mode}
          isEmpty={routers.length === 0 && walls.length === 0}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
        >
          <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <defs>
              <pattern id="pattern-concrete" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#4b5563" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#374151" strokeWidth="2" />
              </pattern>
              <pattern id="pattern-wood" width="16" height="10" patternUnits="userSpaceOnUse">
                <rect width="16" height="10" fill="#92400e" />
                <line x1="0" y1="3" x2="16" y2="3" stroke="#78350f" strokeWidth="1" />
                <line x1="0" y1="7" x2="16" y2="7" stroke="#78350f" strokeWidth="1" />
              </pattern>
              <linearGradient id="pattern-glass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.35" />
              </linearGradient>
            </defs>

            {walls.map((wall) => (
              <WallLine
                key={wall.id}
                wall={wall}
                isSelected={selectedWallId === wall.id}
                onMoveWall={moveWall}
                onMoveEndpoint={moveWallEndpoint}
                onDelete={deleteWall}
                onSelect={setSelectedWallId}
              />
            ))}

            {isDrawing && currentWall && (
              <line
                x1={currentWall.startX}
                y1={currentWall.startY}
                x2={currentWall.endX}
                y2={currentWall.endY}
                stroke="#22d3ee"
                strokeWidth="4"
                strokeDasharray="6,6"
                strokeLinecap="round"
              />
            )}

            {/* Auto-mesh: draws every interfering/blocked pair from the C++
                engine's last run, no manual selection needed. */}
            <EdgeRenderer edges={edges} routers={routers} />
          </svg>

          {routers.map((router) => (
            <RouterNode key={router.id} router={router} onMove={moveRouter} onDelete={deleteRouter} />
          ))}
        </Canvas>
      </div>
    </div>
  );
}