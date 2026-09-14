"use client";

import { useCallback, useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import "jspdf-autotable";

import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import RouterNode from "./components/RouterNode";
import WallLine from "./components/WallLine";
import EdgeRenderer from "./components/EdgeRenderer";
import HeatmapLayer from "./components/HeatmapLayer";


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

  const [edges, setEdges] = useState([]);

  const [mode, setMode] = useState("router"); // "router" | "wall" | "select"
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWall, setCurrentWall] = useState(null);

  const [currentRadius, setCurrentRadius] = useState(100);
  const [currentMaterial, setCurrentMaterial] = useState(1);
  const [currentBand, setCurrentBand] = useState(1); // 1 = 2.4GHz, 2 = 5GHz

  const [isComputing, setIsComputing] = useState(false);
  const [selectedWallId, setSelectedWallId] = useState(null);

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
        band: currentBand,
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
    
    routerIdRef.current = 0;
    wallIdRef.current = 0;
  };

  const downloadPDFReport = async () => {
    const scrollContainer = document.getElementById("scroll-container");
    const canvasElement = document.getElementById("network-canvas");

    if (!scrollContainer || !canvasElement) return;

    try {
      const width = scrollContainer.clientWidth;
      const height = scrollContainer.clientHeight;
      const scrollX = scrollContainer.scrollLeft;
      const scrollY = scrollContainer.scrollTop;

      // 1. Capture High-Res Image of Canvas
      const dataUrl = await toPng(canvasElement, {
        backgroundColor: "#09090b",
        width: width,
        height: height,
        pixelRatio: 2, 
        style: {
          transform: `translate(-${scrollX}px, -${scrollY}px)`,
        },
      });

      // 2. Initialize PDF
      const doc = new jsPDF("p", "mm", "a4");
      
      // 3. Add Title & Metadata
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("GraphMesh", 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text("RF Network Planning Report", 14, 28);

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

      // 4. Draw Canvas Image
      // A4 width is 210mm. Margin 14mm -> max width 182mm
      const imgWidth = 182;
      const imgHeight = (height / width) * imgWidth;
      doc.addImage(dataUrl, "PNG", 14, 44, imgWidth, imgHeight);

      // 5. Add Hardware Table on New Page
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Network Hardware Summary", 14, 20);

      const tableData = routers.map((r) => [
        `R${r.id} ${r.name ? `(${r.name})` : ""}`,
        r.band === 2 ? "5 GHz" : "2.4 GHz",
        r.channel === 0 ? "Pending" : `Ch ${r.channel}`,
        `${(r.baseRadius / 50).toFixed(1)}m`,
      ]);

      doc.autoTable({
        startY: 28,
        head: [["Router Name", "Frequency Band", "Assigned Channel", "Transmit Range"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [14, 165, 233] }, // Sky blue matching theme
        styles: { font: "helvetica" },
      });

      const wallData = walls.map((w) => [
        `Wall ${w.id}`,
        w.material === 1 ? "Concrete" : w.material === 2 ? "Wood" : "Glass",
        `${(Math.hypot(w.endX - w.startX, w.endY - w.startY) / 50).toFixed(1)}m`,
      ]);

      if (wallData.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Physical Infrastructure (Walls)", 14, doc.lastAutoTable.finalY + 15);
        
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Wall ID", "Material Type", "Length (Meters)"]],
          body: wallData,
          theme: "striped",
          headStyles: { fillColor: [100, 116, 139] }, // Slate
          styles: { font: "helvetica" },
        });
      }

      // 6. Save PDF
      doc.save("GraphMesh-RF-Report.pdf");

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Oops! PDF generation failed. Check console.");
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden">
      <Sidebar
        mode={mode}
        setMode={setMode}
        currentRadius={currentRadius}
        setCurrentRadius={setCurrentRadius}
        currentMaterial={currentMaterial}
        setCurrentMaterial={setCurrentMaterial}
        currentBand={currentBand}
        setCurrentBand={setCurrentBand}
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
        onDownload={downloadPDFReport}
      />

      <div className="flex-1 relative min-w-0 overflow-hidden p-6">
        <Canvas
          mode={mode}
          isEmpty={routers.length === 0 && walls.length === 0}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
        >
          <HeatmapLayer routers={routers} walls={walls} />
          
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
                stroke="#a1a1aa"
                strokeWidth="4"
                strokeDasharray="6,6"
                strokeLinecap="round"
              />
            )}

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